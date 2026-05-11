import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { ticket_id, description } = await req.json()

    // 1. Instanciar Supabase Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Chamar a IA (OpenAI)
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em triagem de suporte para a plataforma de educação Construtor360.
            Analise a descrição do problema e retorne APENAS um JSON puro no seguinte formato:
            {
              "category": "string (ex: Financeiro, Login, Bug, Acesso ao Curso, Pagamento)",
              "priority": "low | medium | high | critical",
              "sentiment": "calm | confused | irritated | frustrated",
              "tags": ["string"],
              "confidence": 0.00 to 1.00
            }
            Regra Crítica: Se o usuário mencionar Procon, Processo ou Reembolso, a prioridade deve ser CRITICAL e o sentimento FRUSTRATED.`
          },
          { role: 'user', content: description }
        ],
        temperature: 0.2
      }),
    })

    const aiData = await aiResponse.json()
    
    if (!aiData.choices || aiData.choices.length === 0) {
      throw new Error('Falha na resposta da IA')
    }

    const triage = JSON.parse(aiData.choices[0].message.content)

    // 3. Atualizar o Ticket no Banco de Dados
    const { error: updateError } = await supabase
      .from('support_tickets')
      .update({
        category: triage.category,
        priority: triage.priority,
        sentiment: triage.sentiment,
        tags: triage.tags,
        ai_confidence_score: triage.confidence,
        status: 'open'
      })
      .eq('id', ticket_id)

    if (updateError) throw updateError

    // 4. Registrar Auditoria
    await supabase.from('ai_support_audit').insert({
      ticket_id,
      raw_input: description,
      ai_output: triage
    })

    return new Response(JSON.stringify({ success: true, triage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
