-- ============================================
-- 360Coin System - Migração Completa v1.0
-- ============================================

-- ENUMS
DO $$ BEGIN CREATE TYPE coin_tx_type AS ENUM ('credit', 'debit'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE coin_tx_source AS ENUM ('referral_commission','admin_adjustment','product_redemption','refund_reversal','bonus','campaign','welcome_bonus'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE referral_status AS ENUM ('pending', 'approved', 'cancelled', 'refunded'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE store_product_type AS ENUM ('physical', 'digital'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE store_order_status AS ENUM ('pending', 'approved', 'rejected', 'delivered', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CARTEIRAS (uma por usuário)
CREATE TABLE IF NOT EXISTS public.coin_wallets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned NUMERIC(15,2) NOT NULL DEFAULT 0,
  lifetime_spent NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- LEDGER DE TRANSAÇÕES (imutável - fonte de verdade para auditoria)
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  type coin_tx_type NOT NULL,
  source coin_tx_source NOT NULL,
  reference_id UUID,
  description TEXT NOT NULL,
  balance_after NUMERIC(15,2) NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CÓDIGOS DE INDICAÇÃO (um por usuário, auto-gerado)
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  link_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earned NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(code),
  UNIQUE(link_token)
);

-- INDICAÇÕES / EVENTOS DE REFERRAL
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  referral_code_id UUID REFERENCES public.referral_codes(id) ON DELETE SET NULL,
  course_id UUID,
  status referral_status DEFAULT 'pending',
  gross_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  gateway_fee NUMERIC(15,2) NOT NULL DEFAULT 0,
  other_fees NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(15,2) GENERATED ALWAYS AS (gross_amount - tax_amount - gateway_fee - other_fees) STORED,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 30.00,
  commission_amount NUMERIC(15,2),
  coins_granted NUMERIC(15,2),
  transaction_id UUID REFERENCES public.coin_transactions(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT no_self_referral CHECK (referrer_id != referred_id),
  UNIQUE(referrer_id, referred_id)
);

-- PRODUTOS DA LOJA
CREATE TABLE IF NOT EXISTS public.store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  coin_price NUMERIC(15,2) NOT NULL CHECK (coin_price > 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  type store_product_type DEFAULT 'digital',
  is_active BOOLEAN DEFAULT TRUE,
  total_redeemed INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PEDIDOS DE RESGATE
CREATE TABLE IF NOT EXISTS public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status store_order_status DEFAULT 'pending',
  total_coins NUMERIC(15,2) NOT NULL,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  transaction_id UUID REFERENCES public.coin_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ITENS DO PEDIDO
CREATE TABLE IF NOT EXISTS public.store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.store_products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  coin_price_snapshot NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- LOG DE AJUSTES MANUAIS DE SALDO
CREATE TABLE IF NOT EXISTS public.coin_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(15,2) NOT NULL,
  reason TEXT NOT NULL,
  transaction_id UUID REFERENCES public.coin_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FUNÇÃO ATÔMICA: CREDITAR MOEDAS
-- ============================================
CREATE OR REPLACE FUNCTION public.credit_coins(
  p_user_id UUID,
  p_amount NUMERIC,
  p_source coin_tx_source,
  p_reference_id UUID,
  p_description TEXT,
  p_created_by UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance_after NUMERIC;
  v_tx_id UUID;
BEGIN
  INSERT INTO public.coin_wallets (user_id, balance, lifetime_earned)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET
    balance = coin_wallets.balance + p_amount,
    lifetime_earned = coin_wallets.lifetime_earned + p_amount,
    updated_at = now()
  RETURNING balance INTO v_balance_after;

  INSERT INTO public.coin_transactions
    (user_id, amount, type, source, reference_id, description, balance_after, created_by)
  VALUES
    (p_user_id, p_amount, 'credit', p_source, p_reference_id, p_description, v_balance_after, p_created_by)
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;

-- ============================================
-- FUNÇÃO ATÔMICA: DEBITAR MOEDAS (com lock anti-concorrência)
-- ============================================
CREATE OR REPLACE FUNCTION public.debit_coins(
  p_user_id UUID,
  p_amount NUMERIC,
  p_source coin_tx_source,
  p_reference_id UUID,
  p_description TEXT,
  p_created_by UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_balance NUMERIC;
  v_balance_after NUMERIC;
  v_tx_id UUID;
BEGIN
  SELECT balance INTO v_current_balance
  FROM public.coin_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente. Saldo: %, Necessário: %',
      COALESCE(v_current_balance, 0), p_amount;
  END IF;

  v_balance_after := v_current_balance - p_amount;

  UPDATE public.coin_wallets
  SET
    balance = v_balance_after,
    lifetime_spent = lifetime_spent + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.coin_transactions
    (user_id, amount, type, source, reference_id, description, balance_after, created_by)
  VALUES
    (p_user_id, p_amount, 'debit', p_source, p_reference_id, p_description, v_balance_after, p_created_by)
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;

-- ============================================
-- TRIGGER: AUTO-GERAR CÓDIGO DE INDICAÇÃO
-- ============================================
CREATE OR REPLACE FUNCTION generate_referral_code_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  IF NEW.link_token IS NULL OR NEW.link_token = '' THEN
    NEW.link_token := replace(gen_random_uuid()::text, '-', '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.referral_codes;
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON public.referral_codes
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code_fn();

-- ============================================
-- TRIGGER: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_updated_wallets ON public.coin_wallets;
CREATE TRIGGER trg_updated_wallets BEFORE UPDATE ON public.coin_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_updated_products ON public.store_products;
CREATE TRIGGER trg_updated_products BEFORE UPDATE ON public.store_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_updated_orders ON public.store_orders;
CREATE TRIGGER trg_updated_orders BEFORE UPDATE ON public.store_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ÍNDICES DE PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_coin_tx_user ON public.coin_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_tx_reference ON public.coin_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_user ON public.store_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON public.store_orders(status);
CREATE INDEX IF NOT EXISTS idx_store_products_active ON public.store_products(is_active, category);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.coin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_adjustments ENABLE ROW LEVEL SECURITY;

-- Carteiras
CREATE POLICY "Usuário vê sua carteira" ON public.coin_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin vê todas carteiras" ON public.coin_wallets FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master','administrador')));

-- Transações
CREATE POLICY "Usuário vê suas transações" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin vê todas transações" ON public.coin_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master','administrador')));

-- Códigos de indicação
CREATE POLICY "Usuário vê e cria seu código" ON public.referral_codes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Código de outros - leitura pública" ON public.referral_codes FOR SELECT TO authenticated USING (true);

-- Indicações
CREATE POLICY "Usuário vê suas indicações" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Admin gerencia indicações" ON public.referrals FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master','administrador')));

-- Produtos
CREATE POLICY "Qualquer autenticado vê produtos ativos" ON public.store_products FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admin gerencia produtos" ON public.store_products FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master','administrador')));

-- Pedidos
CREATE POLICY "Usuário vê seus pedidos" ON public.store_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin gerencia pedidos" ON public.store_orders FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master','administrador')));

-- Itens de pedido
CREATE POLICY "Usuário vê seus itens" ON public.store_order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.store_orders WHERE id = order_id AND user_id = auth.uid()));
CREATE POLICY "Admin vê todos itens" ON public.store_order_items FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master','administrador')));

-- Ajustes admin
CREATE POLICY "adjustments_admin" ON public.coin_adjustments FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master','administrador')));

-- Realtime já habilitado globalmente (FOR ALL TABLES) neste projeto.
