import { useState, useEffect } from 'react';
import { ShoppingBag, Coins, Search, Package, CheckCircle2, Clock, Loader2, X, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface Product { id: string; name: string; description: string; image_url: string | null; category: string; coin_price: number; stock: number; type: string; total_redeemed: number; }
interface Order { id: string; status: string; total_coins: number; created_at: string; items: { product: { name: string }; quantity: number; coin_price_snapshot: number; }[]; }

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Aguardando', color: 'bg-amber-500/10 text-amber-400' },
  approved:  { label: 'Aprovado',   color: 'bg-[#22ff88]/10 text-[#22ff88]' },
  rejected:  { label: 'Rejeitado',  color: 'bg-red-500/10 text-red-400' },
  delivered: { label: 'Entregue',   color: 'bg-blue-500/10 text-blue-400' },
  cancelled: { label: 'Cancelado',  color: 'bg-white/5 text-[#64748b]' },
};

export function StoreView({ userData }: { userData: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [balance, setBalance] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [tab, setTab] = useState<'store' | 'orders'>('store');
  const [selected, setSelected] = useState<Product | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchOrders(), fetchBalance()]);
    setLoading(false);
  }

  async function fetchBalance() {
    const { data } = await supabase.from('coin_wallets').select('balance').eq('user_id', userData.id).single();
    setBalance(data?.balance ?? 0);
  }

  async function fetchProducts() {
    const { data } = await supabase.from('store_products').select('*').eq('is_active', true).order('created_at', { ascending: false });
    setProducts(data || []);
  }

  async function fetchOrders() {
    const { data } = await supabase
      .from('store_orders')
      .select(`*, items:store_order_items(quantity, coin_price_snapshot, product:product_id(name))`)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });
    setOrders((data as any) || []);
  }

  async function handleRedeem() {
    if (!selected) return;
    if (balance < selected.coin_price) { toast.error('Saldo insuficiente!'); return; }
    setRedeeming(true);
    try {
      const { error } = await supabase.functions.invoke('redeem-product', { body: { product_id: selected.id, quantity: 1 } });
      if (error) throw error;
      toast.success(`Produto resgatado com sucesso!`);
      setSelected(null);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao resgatar produto.');
    } finally {
      setRedeeming(false);
    }
  }

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];
  const filtered = products.filter(p =>
    (category === 'Todos' || p.category === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-2 border-[#22ff88] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-10 max-w-[1400px] mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Loja 360</h1>
          </div>
          <p className="text-[#64748b] text-sm ml-[52px]">Troque suas 360Coins por produtos e benefícios exclusivos</p>
        </div>
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-6 py-3">
          <Coins className="w-5 h-5 text-amber-400" />
          <span className="text-xl font-black text-white">{balance.toFixed(2)}</span>
          <span className="text-xs text-amber-400 font-bold">360Coins</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#1a1c22] p-1 rounded-2xl border border-white/5">
        {(['store', 'orders'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${tab === t ? 'bg-[#22ff88] text-black' : 'text-[#64748b] hover:text-white'}`}>
            {t === 'store' ? '🛍️ Catálogo' : '📦 Meus Pedidos'}
          </button>
        ))}
      </div>

      {tab === 'store' && (
        <>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produtos..."
                className="w-full bg-[#1a1c22] border border-white/5 rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${category === c ? 'bg-[#22ff88] text-black' : 'bg-[#1a1c22] text-[#64748b] hover:text-white border border-white/5'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-[#64748b]">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(p => (
                <motion.div key={p.id} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}
                  className="bg-[#1a1c22] border border-white/5 rounded-[1.5rem] overflow-hidden cursor-pointer hover:border-[#22ff88]/20 transition-all"
                  onClick={() => setSelected(p)}>
                  <div className="aspect-square bg-[#0f1115] flex items-center justify-center relative overflow-hidden">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      : <Package className="w-16 h-16 text-[#64748b]/30" />}
                    <div className="absolute top-3 left-3">
                      <span className="bg-black/60 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded-lg text-[#64748b]">{p.type === 'digital' ? '💻 Digital' : '📦 Físico'}</span>
                    </div>
                    {p.stock === 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-white font-black text-xs uppercase tracking-widest">Esgotado</span></div>}
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">{p.category}</p>
                      <h3 className="font-bold text-white text-sm leading-snug">{p.name}</h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span className="text-lg font-black text-amber-400">{p.coin_price.toFixed(0)}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${balance >= p.coin_price ? 'bg-[#22ff88]/10 text-[#22ff88]' : 'bg-red-500/10 text-red-400'}`}>
                        {balance >= p.coin_price ? 'Disponível' : 'Saldo insuf.'}
                      </span>
                    </div>
                    <button disabled={p.stock === 0 || balance < p.coin_price}
                      className="w-full py-2.5 bg-[#22ff88] text-black text-xs font-black rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      Resgatar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'orders' && (
        <div className="bg-[#1a1c22] border border-white/5 rounded-[2rem] overflow-hidden">
          {orders.length === 0 ? (
            <div className="py-20 text-center text-[#64748b]">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold">Nenhum pedido ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {orders.map(o => {
                const s = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
                return (
                  <div key={o.id} className="p-6 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">{o.items?.[0]?.product?.name || 'Produto'}</p>
                      <p className="text-xs text-[#64748b]">{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                      <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${s.color}`}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-right">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span className="text-lg font-black text-white">{o.total_coins.toFixed(0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#1a1c22] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl z-10">
              <div className="aspect-video bg-[#0f1115] relative">
                {selected.image_url ? <img src={selected.image_url} alt={selected.name} className="w-full h-full object-cover" />
                  : <Package className="w-20 h-20 text-[#64748b]/20 absolute inset-0 m-auto" />}
                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-all">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="p-8 space-y-5">
                <div>
                  <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">{selected.category}</p>
                  <h2 className="text-2xl font-bold text-white mt-1">{selected.name}</h2>
                  {selected.description && <p className="text-sm text-[#94a3b8] mt-2 leading-relaxed">{selected.description}</p>}
                </div>
                <div className="flex items-center justify-between bg-[#0f1115] rounded-2xl p-4">
                  <div>
                    <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest mb-1">Custo</p>
                    <div className="flex items-center gap-2"><Coins className="w-5 h-5 text-amber-400" /><span className="text-2xl font-black text-amber-400">{selected.coin_price.toFixed(0)}</span></div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest mb-1">Seu saldo</p>
                    <p className={`text-xl font-black ${balance >= selected.coin_price ? 'text-[#22ff88]' : 'text-red-400'}`}>{balance.toFixed(0)}</p>
                  </div>
                </div>
                {balance < selected.coin_price && <p className="text-xs text-red-400 text-center">Você precisa de mais {(selected.coin_price - balance).toFixed(0)} 360Coins.</p>}
                <button onClick={handleRedeem} disabled={redeeming || selected.stock === 0 || balance < selected.coin_price}
                  className="w-full py-4 bg-[#22ff88] text-black font-black text-sm rounded-2xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {redeeming ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Confirmar Resgate</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
