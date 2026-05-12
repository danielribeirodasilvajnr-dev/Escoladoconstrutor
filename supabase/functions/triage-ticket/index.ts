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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
            content: `Você é o Assistente IA da Construtor360. Analise e responda.
            RETORNE APENAS JSON PURO. NÃO USE MARCAÇÕES DE CÓDIGO.
            {
              "category": "Login | Financeiro | Certificado | Técnico | Outros",
              "priority": "low | medium | high | critical",
              "sentiment": "calm | confused | irritated | frustrated",
              "automated_response": "Sua resposta aqui",
              "confidence": 1.0
            }`
          },
          { role: 'user', content: description }
        ],
        temperature: 0.1
      }),
    })

    const aiData = await aiResponse.json()
    let content = aiData.choices[0].message.content
    
    // Limpar possíveis marcações de markdown da IA
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const triage = JSON.parse(content)

    // Atualizar ticket
    await supabase
      .from('support_tickets')
      .update({
        category: triage.category,
        priority: triage.priority,
        sentiment: triage.sentiment,
        ai_confidence_score: triage.confidence,
        status: triage.automated_response ? 'pending_student' : 'open'
      })
      .eq('id', ticket_id)

    // Inserir mensagem (Forçamos a inserção se houver resposta)
    if (triage.automated_response) {
      const { error: msgError } = await supabase.from('support_messages').insert({
        ticket_id,
        content: triage.automated_response,
        is_ai_response: true
      })
      if (msgError) console.error('Erro ao inserir mensagem da IA:', msgError)
    }

    // Auditoria
    await supabase.from('ai_support_audit').insert({
      ticket_id,
      raw_input: description,
      ai_output: triage
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro na Edge Function:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
