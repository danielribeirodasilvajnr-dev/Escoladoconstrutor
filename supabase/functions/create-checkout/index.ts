import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) throw new Error("Não autorizado");

    const { courseId } = await req.json();

    // Fetch course details
    const { data: course, error: courseError } = await supabaseClient
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseError || !course) throw new Error("Curso não encontrado");

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "pix"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: course.title,
              description: course.description,
            },
            unit_amount: Math.round(Number(course.price) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/dashboard?success=true`,
      cancel_url: `${req.headers.get("origin")}/dashboard?canceled=true`,
      client_reference_id: `${user.id}:${courseId}`,
      payment_intent_data: {
        description: `Matrícula: ${course.title}`,
        metadata: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
