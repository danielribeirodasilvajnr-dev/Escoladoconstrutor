import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // MP sends the payment ID via query param `data.id` or `id` depending on the notification type
    let paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.data?.id) paymentId = body.data.id;
        else if (body.id) paymentId = body.id;
      } catch (e) {
        // Ignorar se o corpo nÃ£o for JSON
      }
    }

    // Se nao encontrar ID, finaliza com 200 OK para o Mercado Pago parar de tentar
    if (!paymentId) {
      return new Response('Ignorado - ID ausente', { status: 200, headers: corsHeaders });
    }

    const mpToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!mpToken) {
      throw new Error("Mercado Pago token não configurado");
    }

    // Check payment status from MP API securely
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${mpToken}`
      }
    });

    if (!response.ok) {
      throw new Error("Falha ao consultar detalhes do pagamento no MP");
    }

    const payment = await response.json();

    // Se a venda foi aprovada (cartao aprovado, ou PIX recebido)
    if (payment.status === 'approved') {
      const extRef = payment.external_reference;
      
      // Decodificar nossa tag "UserId:::CourseId"
      if (extRef && extRef.includes(':::')) {
        const [userId, courseId] = extRef.split(':::');

        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Check if enrollment already exists
        const { data: existing } = await supabaseAdmin
          .from('enrollments')
          .select('id')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .single();

        // If not enrolled, create enrollment
        if (!existing) {
          await supabaseAdmin
            .from('enrollments')
            .insert({
              user_id: userId,
              course_id: courseId,
              payment_status: 'paid'
            });
        }
      }
    }

    // Sempre responda 200 OK para o MP não ficar dando timeout
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook Falhou:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
