import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://construtor360.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const {
      referral_code,
      referred_user_id,
      course_id,
      gross_amount,
      tax_amount = 0,
      gateway_fee = 0,
      other_fees = 0
    } = await req.json()

    if (!referral_code || !referred_user_id || !gross_amount) {
      return new Response(JSON.stringify({ error: 'Parâmetros obrigatórios: referral_code, referred_user_id, gross_amount' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Buscar o código de indicação e validar
    const { data: codeData, error: codeErr } = await supabase
      .from('referral_codes')
      .select('id, user_id, is_active')
      .eq('code', referral_code.toUpperCase())
      .single()

    if (codeErr || !codeData) {
      return new Response(JSON.stringify({ error: 'Código de indicação inválido.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404
      })
    }

    if (!codeData.is_active) {
      return new Response(JSON.stringify({ error: 'Código de indicação inativo.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
      })
    }

    // 2. Prevenir auto-indicação
    if (codeData.user_id === referred_user_id) {
      return new Response(JSON.stringify({ error: 'Auto-indicação não permitida.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
      })
    }

    // 3. Verificar duplicidade (mesmo indicador + indicado)
    const { data: existing } = await supabase
      .from('referrals')
      .select('id, status')
      .eq('referrer_id', codeData.user_id)
      .eq('referred_id', referred_user_id)
      .single()

    if (existing) {
      return new Response(JSON.stringify({ error: 'Este usuário já foi indicado por você.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409
      })
    }

    // 4. Calcular comissão
    const net_amount = gross_amount - tax_amount - gateway_fee - other_fees
    if (net_amount <= 0) {
      return new Response(JSON.stringify({ error: 'Valor líquido inválido após descontos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
      })
    }
    const commission_amount = net_amount * 0.30 // 30%
    const coins_granted = commission_amount // 1 coin = R$ 1 (pode ser ajustado)

    // 5. Criar registro de indicação
    const { data: referral, error: referralErr } = await supabase
      .from('referrals')
      .insert({
        referrer_id: codeData.user_id,
        referred_id: referred_user_id,
        referral_code_id: codeData.id,
        course_id: course_id || null,
        status: 'approved',
        gross_amount,
        tax_amount,
        gateway_fee,
        other_fees,
        commission_rate: 30.00,
        commission_amount,
        coins_granted,
        approved_at: new Date().toISOString()
      })
      .select()
      .single()

    if (referralErr) throw referralErr

    // 6. Creditar 360Coins via função atômica (NUNCA no frontend)
    const { data: txResult, error: txErr } = await supabase.rpc('credit_coins', {
      p_user_id: codeData.user_id,
      p_amount: coins_granted,
      p_source: 'referral_commission',
      p_reference_id: referral.id,
      p_description: `Comissão de indicação: ${coins_granted.toFixed(2)} 360Coins (30% de R$ ${net_amount.toFixed(2)})`,
      p_created_by: null
    })

    if (txErr) {
      // Rollback: cancelar a indicação se o crédito falhar
      await supabase.from('referrals').update({ status: 'cancelled' }).eq('id', referral.id)
      throw txErr
    }

    // 7. Atualizar transaction_id na indicação
    await supabase.from('referrals')
      .update({ transaction_id: txResult })
      .eq('id', referral.id)

    // 8. Atualizar estatísticas do código
    await supabase.from('referral_codes')
      .update({
        total_conversions: supabase.rpc('total_conversions + 1'),
        total_earned: supabase.rpc(`total_earned + ${coins_granted}`)
      })
      .eq('id', codeData.id)

    // Forma segura de incrementar:
    await supabase.rpc('increment_referral_stats', {
      p_code_id: codeData.id,
      p_coins: coins_granted
    }).catch(() => {}) // não-crítico, fallback silencioso

    return new Response(JSON.stringify({
      success: true,
      referral_id: referral.id,
      coins_granted,
      net_amount,
      commission_amount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    })

  } catch (error) {
    console.error('[process-referral] Erro:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    })
  }
})
