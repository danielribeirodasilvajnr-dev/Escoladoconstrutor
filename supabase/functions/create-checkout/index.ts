import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripe = new Stripe(stripeKey ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("--- CREATE CHECKOUT DIAGNOSTICS ---");
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Initial Checks
    if (!stripeKey) {
      throw new Error("Configuração ausente: STRIPE_SECRET_KEY não foi encontrada nos segredos do Supabase. Por favor, adicione-a no site do Supabase.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado: Cabeçalho ausente");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // 2. Auth Check
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Não autorizado: Sua sessão expirou. Por favor, faça login novamente.");
    }

    // 3. Payload Parsing
    const body = await req.json().catch(() => ({}));
    const { courseId } = body;
    
    if (!courseId) {
      throw new Error("ID do curso não informado.");
    }

    console.log(`User ID: ${user.id}, email: ${user.email}`);

    // 4. Data Extraction
    const { data: course, error: courseError } = await supabaseClient
      .from("courses")
      .select("id, title, description, price")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      throw new Error(`Curso não encontrado (ID: ${courseId}). Erro DB: ${courseError?.message}`);
    }

    const amount = Math.round(Number(course.price) * 100);
    console.log(`Course Found: ${course.title}, Price: BRL ${course.price}`);

    if (amount < 50) {
      throw new Error(`O preço (R$ ${course.price}) é menor que o mínimo exigido pelo Stripe (R$ 0,50).`);
    }

    // 5. Stripe Session Creation
    console.log("Initializing Stripe session (Card only for compatibility)...");
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"], // Removed 'pix' temporarily
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: course.title,
                description: course.description || `Inscrição para o curso: ${course.title}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: user.email,
        success_url: `${req.headers.get("origin")}/dashboard?success=true`,
        cancel_url: `${req.headers.get("origin")}/dashboard?canceled=true`,
        client_reference_id: `${user.id}:${courseId}`,
      });

      console.log(`SUCCESS: Created session ${session.id}`);
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (stripeError: any) {
      console.error("Stripe API Error:", stripeError);
      throw new Error(`Erro do Stripe: ${stripeError.raw?.message || stripeError.message}`);
    }

  } catch (error: any) {
    console.error(`CATCH ERROR: ${error.message}`);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
