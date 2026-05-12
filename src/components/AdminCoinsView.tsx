import { useState, useEffect } from 'react';
import { Coins, Users, TrendingUp, AlertCircle, Loader2, Search, Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface AffiliateRow { user_id: string; full_name: string; email: string; total_conversions: number; total_earned: number; }
interface AdjForm { userId: string; amount: string; reason: string; type: 'credit' | 'debit'; }

export function AdminCoinsView({ userData }: { userData: any }) {
  const [tab, setTab] = useState<'overview' | 'affiliates' | 'adjust'>('overview');
  const [stats, setStats] = useState({ totalCirculating: 0, totalEarned: 0, totalSpent: 0, totalUsers: 0 });
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [form, setForm] = useState<AdjForm>({ userId: '', amount: '', reason: '', type: 'credit' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [tab]);

  async function fetchData() {
    setLoading(true);
    if (tab === 'overview') await fetchStats();
    if (tab === 'affiliates') await fetchAffiliates();
    if (tab === 'adjust') await fetchAdjustments();
    setLoading(false);
  }

  async function fetchStats() {
    const { data: wallets } = await supabase.from('coin_wallets').select('balance, lifetime_earned, lifetime_spent');
    if (!wallets) return;
    setStats({
      totalCirculating: wallets.reduce((s, w) => s + (w.balance || 0), 0),
      totalEarned: wallets.reduce((s, w) => s + (w.lifetime_earned || 0), 0),
      totalSpent: wallets.reduce((s, w) => s + (w.lifetime_spent || 0), 0),
      totalUsers: wallets.length,
    });
  }

  async function fetchAffiliates() {
    const { data } = await supabase
      .from('referral_codes')
      .select(`user_id, total_conversions, total_earned, user:user_id(full_name,email)`)
      .order('total_earned', { ascending: false })
      .limit(50);
    setAffiliates(data?.map((d: any) => ({ user_id: d.user_id, full_name: d.user?.full_name, email: d.user?.email, total_conversions: d.total_conversions, total_earned: d.total_earned })) || []);
  }

  async function fetchAdjustments() {
    const { data } = await supabase
      .from('coin_adjustments')
      .select(`*, admin:admin_id(full_name), target:user_id(full_name,email)`)
      .order('created_at', { ascending: false })
      .limit(30);
    setAdjustments(data || []);
  }

  async function searchUsers(q: string) {
    if (q.length < 2) { setUserResults([]); return; }
    const { data } = await supabase.from('profiles').select('id,full_name,email').or(`full_name.ilike.%${q}%,email.ilike.%${q}%`).limit(8);
    setUserResults(data || []);
  }

  async function handleAdjust() {
    if (!form.userId || !form.amount || !form.reason) { toast.error('Preencha todos os campos.'); return; }
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) { toast.error('Valor inválido.'); return; }
    setSaving(true);
    try {
      const fn = form.type === 'credit' ? 'credit_coins' : 'debit_coins';
      const { data: txId, error: txErr } = await supabase.rpc(fn, {
        p_user_id: form.userId,
        p_amount: amt,
        p_source: 'admin_adjustment',
        p_reference_id: null,
        p_description: `[Admin] ${form.reason}`,
        p_created_by: userData.id,
      });
      if (txErr) throw txErr;

      await supabase.from('coin_adjustments').insert({
        admin_id: userData.id,
        user_id: form.userId,
        amount: form.type === 'credit' ? amt : -amt,
        reason: form.reason,
        transaction_id: txId,
      });

      toast.success(`${form.type === 'credit' ? '+' : '-'}${amt} 360Coins ajustados com sucesso!`);
      setForm({ userId: '', amount: '', reason: '', type: 'credit' });
      setSelectedUser(null);
      setUserSearch('');
      fetchAdjustments();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-4 md:p-10 max-w-[1200px] mx-auto space-y-8 pb-20">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Coins className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Gestão de 360Coins</h1>
          <p className="text-[#64748b] text-sm">Moeda virtual, afiliados e ajustes de saldo</p>
        </div>
      </header>

      <div className="flex gap-2 bg-[#1a1c22] p-1 rounded-2xl border border-white/5">
        {(['overview', 'affiliates', 'adjust'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === t ? 'bg-[#22ff88] text-black' : 'text-[#64748b] hover:text-white'}`}>
            {t === 'overview' ? '📊 Visão Geral' : t === 'affiliates' ? '🏆 Afiliados' : '⚡ Ajustes'}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#22ff88]" /></div> : (
        <>
          {tab === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { label: 'Em Circulação', value: stats.totalCirculating.toFixed(0), icon: '🪙', color: 'text-amber-400' },
                { label: 'Total Distribuído', value: stats.totalEarned.toFixed(0), icon: '📈', color: 'text-[#22ff88]' },
                { label: 'Total Resgatado', value: stats.totalSpent.toFixed(0), icon: '🛍️', color: 'text-purple-400' },
                { label: 'Carteiras Ativas', value: stats.totalUsers, icon: '👥', color: 'text-blue-400' },
              ].map(stat => (
                <div key={stat.label} className="bg-[#1a1c22] border border-white/5 rounded-[1.5rem] p-6">
                  <p className="text-2xl mb-3">{stat.icon}</p>
                  <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#64748b] mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'affiliates' && (
            <div className="bg-[#1a1c22] border border-white/5 rounded-[2rem] overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-[#22ff88]" />
                <h2 className="font-bold text-white">Ranking de Afiliados</h2>
              </div>
              {affiliates.length === 0 ? (
                <div className="py-16 text-center text-[#64748b]"><Users className="w-10 h-10 mx-auto mb-3 opacity-20" /><p className="font-bold text-sm">Nenhum afiliado ainda</p></div>
              ) : (
                <div className="divide-y divide-white/5">
                  {affiliates.map((a, i) => (
                    <div key={a.user_id} className="flex items-center gap-5 p-5 hover:bg-white/[0.02] transition-all">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-zinc-500/20 text-zinc-300' : i === 2 ? 'bg-orange-700/20 text-orange-500' : 'bg-white/5 text-[#64748b]'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-sm">{a.full_name}</p>
                        <p className="text-xs text-[#64748b]">{a.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-amber-400">{(a.total_earned || 0).toFixed(0)} 🪙</p>
                        <p className="text-xs text-[#64748b]">{a.total_conversions} indicações</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'adjust' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form */}
              <div className="bg-[#1a1c22] border border-white/5 rounded-[2rem] p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <h2 className="font-bold text-white">Ajuste Manual de Saldo</h2>
                </div>
                <p className="text-xs text-[#64748b] bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">⚠️ Todo ajuste é auditável e registrado permanentemente no log.</p>

                {/* User search */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-[#64748b]">Aluno</label>
                  {selectedUser ? (
                    <div className="flex items-center justify-between bg-[#22ff88]/5 border border-[#22ff88]/20 rounded-xl px-4 py-3">
                      <div><p className="font-bold text-white text-sm">{selectedUser.full_name}</p><p className="text-xs text-[#64748b]">{selectedUser.email}</p></div>
                      <button onClick={() => { setSelectedUser(null); setForm(f => ({ ...f, userId: '' })); setUserSearch(''); }} className="text-[#64748b] hover:text-white text-xs">Trocar</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                      <input value={userSearch} onChange={e => { setUserSearch(e.target.value); searchUsers(e.target.value); }}
                        placeholder="Buscar por nome ou e-mail..."
                        className="w-full bg-[#0f1115] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all" />
                      {userResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1c22] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10">
                          {userResults.map(u => (
                            <button key={u.id} onClick={() => { setSelectedUser(u); setForm(f => ({ ...f, userId: u.id })); setUserResults([]); }}
                              className="w-full text-left px-4 py-3 hover:bg-white/5 transition-all">
                              <p className="text-sm font-bold text-white">{u.full_name}</p>
                              <p className="text-xs text-[#64748b]">{u.email}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Type toggle */}
                <div className="flex gap-2">
                  <button onClick={() => setForm(f => ({ ...f, type: 'credit' }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${form.type === 'credit' ? 'bg-[#22ff88] text-black' : 'bg-white/5 text-[#64748b] hover:text-white'}`}>
                    <Plus className="w-4 h-4" /> Creditar
                  </button>
                  <button onClick={() => setForm(f => ({ ...f, type: 'debit' }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${form.type === 'debit' ? 'bg-red-500 text-white' : 'bg-white/5 text-[#64748b] hover:text-white'}`}>
                    <Minus className="w-4 h-4" /> Debitar
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-[#64748b]">Valor (360Coins)</label>
                  <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="Ex: 100.00"
                    className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-[#64748b]">Motivo (obrigatório)</label>
                  <textarea rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Descreva o motivo do ajuste para o log de auditoria..."
                    className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all resize-none" />
                </div>

                <button onClick={handleAdjust} disabled={saving || !form.userId || !form.amount || !form.reason}
                  className={`w-full py-4 font-black text-sm rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${form.type === 'credit' ? 'bg-[#22ff88] text-black' : 'bg-red-500 text-white'}`}>
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : `${form.type === 'credit' ? '➕ Creditar' : '➖ Debitar'} Coins`}
                </button>
              </div>

              {/* Adjustment log */}
              <div className="bg-[#1a1c22] border border-white/5 rounded-[2rem] overflow-hidden">
                <div className="p-6 border-b border-white/5">
                  <h2 className="font-bold text-white">Log de Ajustes Recentes</h2>
                </div>
                {adjustments.length === 0 ? (
                  <div className="py-12 text-center text-[#64748b]"><p className="text-sm font-bold">Nenhum ajuste ainda</p></div>
                ) : (
                  <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                    {adjustments.map((a: any) => (
                      <div key={a.id} className="p-5">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-white">{a.target?.full_name}</p>
                          <span className={`text-sm font-black ${a.amount > 0 ? 'text-[#22ff88]' : 'text-red-400'}`}>{a.amount > 0 ? '+' : ''}{a.amount.toFixed(2)} 🪙</span>
                        </div>
                        <p className="text-xs text-[#94a3b8]">{a.reason}</p>
                        <p className="text-[10px] text-[#64748b] mt-1">por {a.admin?.full_name} • {new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
