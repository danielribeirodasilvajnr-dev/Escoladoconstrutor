-- Migração da Etapa 1: Estrutura do Suporte com IA

-- 1. Habilitar a extensão para busca vetorial
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. ENUMS para padronização de dados
DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'pending_student', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_sentiment AS ENUM ('calm', 'confused', 'irritated', 'frustrated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA PRINCIPAL DE CHAMADOS
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    status ticket_status DEFAULT 'open',
    priority ticket_priority DEFAULT 'medium',
    sentiment ticket_sentiment DEFAULT 'calm',
    ai_confidence_score NUMERIC(3,2),
    tags TEXT[] DEFAULT '{}',
    assigned_to UUID REFERENCES public.profiles(id),
    is_bot_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA DE MENSAGENS
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    is_ai_response BOOLEAN DEFAULT FALSE,
    ai_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. BASE DE CONHECIMENTO
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    embedding VECTOR(1536),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. LOGS DE AUDITORIA DA IA
CREATE TABLE IF NOT EXISTS public.ai_support_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(id),
    raw_input TEXT,
    ai_output JSONB,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TRIGGER PARA ATUALIZAR O updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
