import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, ToggleLeft, ToggleRight, Loader2, X, Save, ShoppingBag, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface Product { id: string; name: string; description: string; image_url: string | null; category: string; coin_price: number; stock: number; type: string; is_active: boolean; total_redeemed: number; }
interface Order { id: string; user_id: string; status: string; total_coins: number; created_at: string; admin_notes: string | null; user: { full_name: string; email: string }; items: { quantity: number; coin_price_snapshot: number; product: { name: string } }[]; }

const EMPTY: Partial<Product> = { name: '', description: '', image_url: '', category: 'Geral', coin_price: 0, stock: 0, type: 'digital', is_active: true };
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Aguardando', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved:  { label: 'Aprovado',   color: 'bg-[#22ff88]/10 text-[#22ff88] border-[#22ff88]/20' },
  rejected:  { label: 'Rejeitado',  color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  delivered: { label: 'Entregue',   color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

export function AdminStoreView({ userData }: { userData: any }) {
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Product> | null>(null);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, [tab]);

  async function fetchAll() {
    setLoading(true);
    if (tab === 'products') {
      const { data } = await supabase.from('store_products').select('*').order('created_at', { ascending: false });
      setProducts(data || []);
    } else {
      const { data } = await supabase.from('store_orders')
        .select(`*, user:user_id(full_name,email), items:store_order_items(quantity,coin_price_snapshot,product:product_id(name))`)
        .order('created_at', { ascending: false });
      setOrders((data as any) || []);
    }
    setLoading(false);
  }

  async function saveProduct() {
    if (!form?.name || !form.coin_price) { toast.error('Nome e preço são obrigatórios.'); return; }
    setSaving(true);
    try {
      if (form.id) {
        const { error } = await supabase.from('store_products').update({ ...form, updated_at: new Date().toISOString() }).eq('id', form.id);
        if (error) throw error;
        toast.success('Produto atualizado!');
      } else {
        const { error } = await supabase.from('store_products').insert({ ...form, created_by: userData.id });
        if (error) throw error;
        toast.success('Produto criado!');
      }
      setForm(null);
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function toggleActive(p: Product) {
    await supabase.from('store_products').update({ is_active: !p.is_active }).eq('id', p.id);
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
  }

  async function updateOrderStatus(orderId: string, status: string, notes?: string) {
    setProcessing(orderId);
    try {
      await supabase.from('store_orders').update({ status, admin_notes: notes || null, reviewed_by: userData.id, reviewed_at: new Date().toISOString() }).eq('id', orderId);
      toast.success(`Pedido ${status === 'approved' ? 'aprovado' : status === 'delivered' ? 'marcado como entregue' : 'rejeitado'}!`);
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setProcessing(null); }
  }

  return (
    <div className="p-4 md:p-10 max-w-[1400px] mx-auto space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Loja 360</h1>
            <p className="text-[#64748b] text-sm">Gerenciamento de produtos e pedidos</p>
          </div>
        </div>
        {tab === 'products' && (
          <button onClick={() => setForm({ ...EMPTY })}
            className="flex items-center gap-2 px-5 py-3 bg-[#22ff88] text-black text-xs font-black uppercase rounded-xl hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        )}
      </header>

      <div className="flex gap-2 bg-[#1a1c22] p-1 rounded-2xl border border-white/5">
        {(['products', 'orders'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${tab === t ? 'bg-[#22ff88] text-black' : 'text-[#64748b] hover:text-white'}`}>
            {t === 'products' ? '📦 Produtos' : '🛒 Pedidos'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#22ff88]" /></div>
      ) : tab === 'products' ? (
        <div className="bg-[#1a1c22] border border-white/5 rounded-[2rem] overflow-hidden">
          {products.length === 0 ? (
            <div className="py-20 text-center text-[#64748b]">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold">Nenhum produto cadastrado</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {products.map(p => (
                <div key={p.id} className="flex items-center gap-5 p-5 hover:bg-white/[0.02] transition-all">
                  <div className="w-14 h-14 bg-[#0f1115] rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-[#64748b]/40" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{p.name}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-amber-400 font-bold">{p.coin_price} 🪙</span>
                      <span className="text-xs text-[#64748b]">Estoque: {p.stock}</span>
                      <span className="text-xs text-[#64748b]">Vendidos: {p.total_redeemed}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${p.type === 'digital' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>{p.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => toggleActive(p)} className="text-[#64748b] hover:text-white transition-colors">
                      {p.is_active ? <ToggleRight className="w-6 h-6 text-[#22ff88]" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                    <button onClick={() => setForm({ ...p })} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                      <Edit2 className="w-4 h-4 text-[#64748b]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#1a1c22] border border-white/5 rounded-[2rem] overflow-hidden">
          {orders.length === 0 ? (
            <div className="py-20 text-center text-[#64748b]">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold">Nenhum pedido ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {orders.map(o => {
                const s = STATUS_CFG[o.status] || STATUS_CFG.pending;
                return (
                  <div key={o.id} className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-white">{(o as any).user?.full_name}</p>
                        <p className="text-xs text-[#64748b]">{(o as any).user?.email}</p>
                        <p className="text-xs text-[#64748b] mt-1">{new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-amber-400">{o.total_coins} 🪙</p>
                        <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md border mt-1 ${s.color}`}>{s.label}</span>
                      </div>
                    </div>
                    {(o as any).items?.map((item: any, i: number) => (
                      <p key={i} className="text-sm text-[#94a3b8] bg-white/[0.03] px-4 py-2 rounded-xl">
                        {item.product?.name} × {item.quantity} — {item.coin_price_snapshot} 🪙
                      </p>
                    ))}
                    {o.status === 'pending' && (
                      <div className="flex gap-3">
                        <button onClick={() => updateOrderStatus(o.id, 'approved')} disabled={processing === o.id}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#22ff88]/10 text-[#22ff88] text-xs font-black rounded-xl hover:bg-[#22ff88] hover:text-black transition-all border border-[#22ff88]/20 disabled:opacity-50">
                          {processing === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Aprovar</>}
                        </button>
                        <button onClick={() => updateOrderStatus(o.id, 'rejected')} disabled={processing === o.id}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 text-red-400 text-xs font-black rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20 disabled:opacity-50">
                          <XCircle className="w-4 h-4" /> Rejeitar
                        </button>
                        <button onClick={() => updateOrderStatus(o.id, 'delivered')} disabled={processing === o.id}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 text-blue-400 text-xs font-black rounded-xl hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20 disabled:opacity-50">
                          <Package className="w-4 h-4" /> Entregue
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Product Form Modal */}
      <AnimatePresence>
        {form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setForm(null)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#1a1c22] border border-white/10 rounded-[2rem] p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">{form.id ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={() => setForm(null)} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X className="w-5 h-5 text-[#64748b]" /></button>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Nome', key: 'name', type: 'text', placeholder: 'Ex: Mentoria Exclusiva' },
                  { label: 'Descrição', key: 'description', type: 'textarea', placeholder: 'Descreva o produto...' },
                  { label: 'URL da Imagem', key: 'image_url', type: 'text', placeholder: 'https://...' },
                  { label: 'Categoria', key: 'category', type: 'text', placeholder: 'Ex: Mentoria, Físico, Digital' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#64748b]">{label}</label>
                    {type === 'textarea'
                      ? <textarea rows={3} value={(form as any)[key] || ''} onChange={e => setForm(p => ({ ...p!, [key]: e.target.value }))} placeholder={placeholder}
                          className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all resize-none" />
                      : <input type="text" value={(form as any)[key] || ''} onChange={e => setForm(p => ({ ...p!, [key]: e.target.value }))} placeholder={placeholder}
                          className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all" />
                    }
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#64748b]">Preço (🪙)</label>
                    <input type="number" min="1" value={form.coin_price || ''} onChange={e => setForm(p => ({ ...p!, coin_price: +e.target.value }))}
                      className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#64748b]">Estoque</label>
                    <input type="number" min="0" value={form.stock || ''} onChange={e => setForm(p => ({ ...p!, stock: +e.target.value }))}
                      className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-[#64748b]">Tipo</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p!, type: e.target.value }))}
                    className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all">
                    <option value="digital">💻 Digital</option>
                    <option value="physical">📦 Físico</option>
                  </select>
                </div>
                <button onClick={saveProduct} disabled={saving}
                  className="w-full py-4 bg-[#22ff88] text-black font-black text-sm rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> {form.id ? 'Salvar Alterações' : 'Criar Produto'}</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
