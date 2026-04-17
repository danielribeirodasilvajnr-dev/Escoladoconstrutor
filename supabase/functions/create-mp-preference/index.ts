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
    const { courseId } = await req.json();

    if (!courseId) {
      throw new Error("Id do curso é obrigatório");
    }

    // Extrair o token do cabeçalho
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Cabeçalho de autorização ausente. Faça login novamente.");
    }
    const token = authHeader.replace('Bearer ', '');

    // Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get User from token properly
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) throw new Error("Usuário não autenticado ou token expirado");

    // Use Service Role to bypass RLS and fetch course details safely
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      throw new Error("Curso não encontrado");
    }

    const mpToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!mpToken) {
      throw new Error("Token do Mercado Pago não configurado no servidor.");
    }

    // Allow testing locally if they use localhost, otherwise use production domain
    let origin = req.headers.get('origin');
    if (!origin || origin === 'null' || origin === 'undefined') {
      origin = 'https://construtor360.com.br';
    }

    // Create Preference in Mercado Pago
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: [
          {
            id: course.id,
            title: course.title ? course.title.substring(0, 250) : "Curso",
            description: (course.description || "Acesso Premium").substring(0, 250),
            picture_url: course.cover_url || "",
            category_id: "learnings",
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(course.price)
          }
        ],
        payer: {
          email: user.email,
        },
        external_reference: `${user.id}:::${course.id}`, // Custom identifier for Webhook parsing
        back_urls: {
          success: `${origin}?payment_success=true`,
          failure: `${origin}?payment_error=true`,
          pending: `${origin}?payment_pending=true`
        },
        auto_return: "approved",
        notification_url: "https://bzwlachtgvmfqnjndbna.supabase.co/functions/v1/mp-webhook"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("MP API Error:", errText);
      throw new Error(`Erro Mercado Pago: ${errText}`);
    }

    const preference = await response.json();

    // init_point is the live standard checkout URL
    return new Response(
      JSON.stringify({ url: preference.init_point }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error("API falhou:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
