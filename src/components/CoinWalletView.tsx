import { useState, useEffect } from 'react';
import { Coins, Copy, TrendingUp, Gift, ArrowUpRight, ArrowDownLeft, Check, Users, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface Wallet { balance: number; lifetime_earned: number; lifetime_spent: number; }
interface Transaction { id: string; amount: number; type: 'credit' | 'debit'; source: string; description: string; created_at: string; }
interface ReferralCode { code: string; link_token: string; total_clicks: number; total_conversions: number; total_earned: number; }
interface Referral { id: string; referred_id: string; status: string; coins_granted: number; created_at: string; referred: { full_name: string; email: string; }; }

const SOURCE_LABELS: Record<string, string> = {
  referral_commission: 'Comissão de Indicação',
  admin_adjustment: 'Ajuste Administrativo',
  product_redemption: 'Resgate de Produto',
  refund_reversal: 'Estorno',
  bonus: 'Bônus',
  campaign: 'Campanha',
  welcome_bonus: 'Bônus de Boas-vindas',
};

export function CoinWalletView({ userData }: { userData: any }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [tab, setTab] = useState<'wallet' | 'referrals'>('wallet');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchWallet(), fetchTransactions(), fetchReferralCode(), fetchReferrals()]);
    setLoading(false);
  }

  async function fetchWallet() {
    const { data } = await supabase.from('coin_wallets').select('*').eq('user_id', userData.id).single();
    setWallet(data || { balance: 0, lifetime_earned: 0, lifetime_spent: 0 });
  }

  async function fetchTransactions() {
    const { data } = await supabase.from('coin_transactions').select('*').eq('user_id', userData.id).order('created_at', { ascending: false }).limit(30);
    setTransactions(data || []);
  }

  async function fetchReferralCode() {
    const { data } = await supabase.from('referral_codes').select('*').eq('user_id', userData.id).single();
    if (data) { setReferralCode(data); return; }
    // Auto-criar código se não existe
    const { data: created } = await supabase.from('referral_codes').insert({ user_id: userData.id, code: '', link_token: '' }).select().single();
    setReferralCode(created);
  }

  async function fetchReferrals() {
    const { data } = await supabase.from('referrals').select(`*, referred:referred_id(full_name, email)`).eq('referrer_id', userData.id).order('created_at', { ascending: false });
    setReferrals((data as any) || []);
  }

  function copyToClipboard(text: string, type: 'code' | 'link') {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copiado!');
    setTimeout(() => setCopied(null), 2000);
  }

  const referralLink = referralCode ? `${window.location.origin}?ref=${referralCode.link_token}` : '';

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-[#22ff88] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-10 max-w-[1200px] mx-auto space-y-8 pb-20">
      {/* Header */}
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Coins className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Minha Carteira</h1>
        </div>
        <p className="text-[#64748b] text-sm font-medium ml-[52px]">360Coins — Moeda interna da plataforma</p>
      </header>

      {/* Balance Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-[#1a1c22] to-[#12141a] border border-amber-500/20 rounded-[2rem] p-8 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-400 mb-3">Saldo Disponível</p>
        <div className="flex items-end gap-4 mb-6">
          <span className="text-6xl md:text-7xl font-black text-white">{(wallet?.balance ?? 0).toFixed(2)}</span>
          <span className="text-2xl font-bold text-amber-400 mb-2">360Coins</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-bold mb-1">Total Ganho</p>
            <p className="text-xl font-black text-[#22ff88]">{(wallet?.lifetime_earned ?? 0).toFixed(2)}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-bold mb-1">Total Gasto</p>
            <p className="text-xl font-black text-red-400">{(wallet?.lifetime_spent ?? 0).toFixed(2)}</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#1a1c22] p-1 rounded-2xl border border-white/5">
        {(['wallet', 'referrals'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${tab === t ? 'bg-[#22ff88] text-black' : 'text-[#64748b] hover:text-white'}`}>
            {t === 'wallet' ? '💳 Histórico' : '👥 Indicações'}
          </button>
        ))}
      </div>

      {tab === 'wallet' && (
        <div className="bg-[#1a1c22] border border-white/5 rounded-[2rem] overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Movimentações</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="py-20 text-center text-[#64748b]">
              <Coins className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold">Nenhuma movimentação ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-[#22ff88]/10' : 'bg-red-500/10'}`}>
                      {tx.type === 'credit'
                        ? <ArrowUpRight className="w-5 h-5 text-[#22ff88]" />
                        : <ArrowDownLeft className="w-5 h-5 text-red-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{SOURCE_LABELS[tx.source] || tx.source}</p>
                      <p className="text-xs text-[#64748b]">{tx.description}</p>
                      <p className="text-[10px] text-[#64748b]/60 mt-0.5">{new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-black ${tx.type === 'credit' ? 'text-[#22ff88]' : 'text-red-400'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'referrals' && (
        <div className="space-y-6">
          {/* Referral Card */}
          {referralCode && (
            <div className="bg-gradient-to-br from-[#1a1c22] to-[#12141a] border border-[#22ff88]/20 rounded-[2rem] p-8 space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#22ff88] mb-4">Seu Link de Indicação</p>
                <div className="flex items-center gap-3 bg-[#0f1115] border border-white/5 rounded-2xl px-5 py-4">
                  <ExternalLink className="w-4 h-4 text-[#64748b] shrink-0" />
                  <span className="text-sm text-white/70 truncate flex-1">{referralLink}</span>
                  <button onClick={() => copyToClipboard(referralLink, 'link')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#22ff88] text-black text-xs font-black rounded-xl hover:opacity-90 transition-all shrink-0">
                    {copied === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === 'link' ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#64748b] mb-3">Ou use o código</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-[#0f1115] border border-white/5 rounded-2xl px-6 py-4 text-center">
                    <span className="text-3xl font-black text-white tracking-[0.3em]">{referralCode.code}</span>
                  </div>
                  <button onClick={() => copyToClipboard(referralCode.code, 'code')}
                    className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
                    {copied === 'code' ? <Check className="w-5 h-5 text-[#22ff88]" /> : <Copy className="w-5 h-5 text-[#64748b]" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Cliques', value: referralCode.total_clicks },
                  { label: 'Conversões', value: referralCode.total_conversions },
                  { label: 'Ganho Total', value: `${referralCode.total_earned.toFixed(0)} 🪙` },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                    <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-widest mb-1">{stat.label}</p>
                    <p className="text-xl font-black text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referrals list */}
          <div className="bg-[#1a1c22] border border-white/5 rounded-[2rem] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <Users className="w-5 h-5 text-[#22ff88]" />
              <h2 className="text-lg font-bold text-white">Meus Indicados ({referrals.length})</h2>
            </div>
            {referrals.length === 0 ? (
              <div className="py-16 text-center text-[#64748b]">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-bold text-sm">Nenhuma indicação ainda</p>
                <p className="text-xs mt-1">Compartilhe seu link e ganhe 30% em 360Coins!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {referrals.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-bold text-white text-sm">{(r as any).referred?.full_name || 'Usuário'}</p>
                      <p className="text-xs text-[#64748b]">{(r as any).referred?.email}</p>
                      <p className="text-[10px] text-[#64748b]/60 mt-0.5">{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#22ff88] text-sm">+{r.coins_granted?.toFixed(2) || '0'} 🪙</p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        r.status === 'approved' ? 'bg-[#22ff88]/10 text-[#22ff88]' :
                        r.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'}`}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
