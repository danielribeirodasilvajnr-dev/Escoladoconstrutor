import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://construtor360.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Não autorizado.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Identificar usuário via JWT
    const { data: { user }, error: authErr } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser()

    if (authErr || !user) return new Response(JSON.stringify({ error: 'Sessão inválida.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
    })

    const { product_id, quantity = 1 } = await req.json()

    if (!product_id) return new Response(JSON.stringify({ error: 'product_id é obrigatório.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
    })

    // 1. Buscar produto e validar
    const { data: product, error: productErr } = await supabase
      .from('store_products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .single()

    if (productErr || !product) return new Response(JSON.stringify({ error: 'Produto não encontrado ou indisponível.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404
    })

    // 2. Verificar estoque
    if (product.stock < quantity) return new Response(JSON.stringify({ error: `Estoque insuficiente. Disponível: ${product.stock}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409
    })

    const total_coins = product.coin_price * quantity

    // 3. Verificar saldo do usuário
    const { data: wallet } = await supabase
      .from('coin_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (!wallet || wallet.balance < total_coins) {
      return new Response(JSON.stringify({
        error: `Saldo insuficiente. Você tem ${wallet?.balance ?? 0} 360Coins, necessário: ${total_coins}`
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 })
    }

    // 4. Criar pedido
    const { data: order, error: orderErr } = await supabase
      .from('store_orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_coins
      })
      .select()
      .single()

    if (orderErr) throw orderErr

    // 5. Criar item do pedido
    await supabase.from('store_order_items').insert({
      order_id: order.id,
      product_id,
      quantity,
      coin_price_snapshot: product.coin_price
    })

    // 6. Debitar coins atomicamente via RPC
    const { data: txId, error: debitErr } = await supabase.rpc('debit_coins', {
      p_user_id: user.id,
      p_amount: total_coins,
      p_source: 'product_redemption',
      p_reference_id: order.id,
      p_description: `Resgate: ${product.name} (x${quantity}) por ${total_coins} 360Coins`,
      p_created_by: user.id
    })

    if (debitErr) {
      // ROLLBACK: deletar pedido se o débito falhar
      await supabase.from('store_orders').delete().eq('id', order.id)
      throw debitErr
    }

    // 7. Atualizar pedido com transaction_id
    await supabase.from('store_orders').update({ transaction_id: txId }).eq('id', order.id)

    // 8. Decrementar estoque e incrementar total_redeemed
    await supabase.from('store_products').update({
      stock: product.stock - quantity,
      total_redeemed: product.total_redeemed + quantity
    }).eq('id', product_id)

    return new Response(JSON.stringify({
      success: true,
      order_id: order.id,
      total_coins_spent: total_coins,
      product_name: product.name
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error) {
    console.error('[redeem-product] Erro:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    })
  }
})
