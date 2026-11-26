import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const authHeader = request.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Authentication required to use AI enrichment." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const gatewayKey = Deno.env.get("LOVABLE_API_KEY") ?? Deno.env.get("AI_GATEWAY_API_KEY");
  const gatewayUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
  const model = "google/gemini-2.5-flash";

  if (!gatewayKey) {
    return new Response(JSON.stringify({ error: "AI provider is not configured." }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const rawName = String(body.rawName ?? "").trim();
  const category = String(body.category ?? "").trim();

  if (!rawName || !category) {
    return new Response(JSON.stringify({ error: "rawName and category are required." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiResponse = await fetch(gatewayUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gatewayKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "Create evidence-safe bilingual e-commerce drafts. Output only valid JSON.",
        },
        {
          role: "user",
          content: `Product: ${rawName}. Category: ${category}. Return JSON with: titleAr, titleEn, descriptionAr, descriptionEn, suggestedTags, adCopy {hook, caption, callToAction}.`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!aiResponse.ok) {
    return new Response(JSON.stringify({ error: "AI provider request failed.", status: aiResponse.status }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiJson = await aiResponse.json();
  const content = (aiJson.choices?.[0]?.message?.content ?? "{}").replace(/```json|```/g, "").trim();
  const draft = JSON.parse(content);

  return new Response(JSON.stringify(draft), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
