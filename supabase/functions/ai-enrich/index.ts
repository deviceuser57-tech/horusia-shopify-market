import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const gatewayUrl = Deno.env.get("AI_GATEWAY_URL");
  const gatewayKey = Deno.env.get("AI_GATEWAY_API_KEY");
  if (!gatewayUrl || !gatewayKey) {
    return new Response(JSON.stringify({ error: "AI gateway is not configured." }), {
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
      "Authorization": `Bearer ${gatewayKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: "Create evidence-safe bilingual e-commerce drafts. Never invent specifications, ratings, reviews, prices, availability or sales evidence.",
        },
        {
          role: "user",
          content: `Product: ${rawName}. Category: ${category}. Return only valid JSON with titleAr, titleEn, descriptionAr, descriptionEn, suggestedTags, adCopy {hook, caption, callToAction}, evidenceStatus.`,
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
  const content = aiJson.choices?.[0]?.message?.content ?? "{}";
  const draft = JSON.parse(content);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    await supabase.from("agent_action_proposals").insert({
      agent_name: "CONTENT_AI",
      action_type: "publish_product",
      target_type: "product",
      target_id: body.productId ?? null,
      proposed_value: draft,
      evidence: [{ type: "ai_hypothesis", source: "configured_ai_gateway" }],
      confidence: "draft",
      status: "PENDING_APPROVAL",
    });
  }

  return new Response(JSON.stringify(draft), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
