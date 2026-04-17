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

    // Initialize Supabase Client (authenticated as the user making the request)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get User from token
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) throw new Error("Usuário não autenticado");

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
    const origin = req.headers.get('origin') || 'https://construtor360.com.br';

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
            title: course.title || "Curso Construtor360",
            description: course.description || "Acesso Premium",
            picture_url: course.cover_url || "",
            quantity: 1,
            unit_price: Number(course.price)
          }
        ],
        payer: {
          email: user.email,
        },
        external_reference: `${user.id}:::${course.id}`, // Custom identifier for Webhook parsing
        back_urls: {
          success: `${origin}/dashboard`,
          failure: `${origin}/dashboard`,
          pending: `${origin}/dashboard`
        },
        auto_return: "approved",
      })
    });

    const preference = await response.json();

    if (!response.ok) {
      console.error("MP API Error:", preference);
      throw new Error("Erro de comunicação com o Mercado Pago.");
    }

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
