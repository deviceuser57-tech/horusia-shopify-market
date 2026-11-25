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

  // Require an authenticated user; AI enrichment is an admin operation.
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

  // Server-verified admin role check (OWNER / STORE_MANAGER / MARKETING_SPECIALIST).
  if (serviceRoleKey) {
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: roles } = await admin
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", userData.user.id);
    const allowed = new Set(["OWNER", "STORE_MANAGER", "MARKETING_SPECIALIST"]);
    const isAdmin = (roles ?? []).some((row) => {
      const role = row.roles as unknown as { name?: string } | null;
      return Boolean(role?.name && allowed.has(role.name));
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin role required to use AI enrichment." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Provider resolution: prefer Grok (xAI), then the Lovable AI gateway,
  // then a generic AI gateway.
  const xaiKey = Deno.env.get("XAI_API_KEY") ?? Deno.env.get("GROK_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  let gatewayUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
  let gatewayKey = lovableKey ?? Deno.env.get("AI_GATEWAY_API_KEY");
  let model = "google/gemini-2.5-flash";
  const gatewayUrlOverride = xaiKey ? undefined : Deno.env.get("AI_GATEWAY_URL");

  if (xaiKey) {
    gatewayUrl = "https://api.x.ai/v1/chat/completions";
    gatewayKey = xaiKey;
    model = "grok-2-latest";
  } else if (gatewayUrlOverride) {
    gatewayUrl = gatewayUrlOverride;
  }
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
      "Authorization": `Bearer ${gatewayKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
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
  const content = (aiJson.choices?.[0]?.message?.content ?? "{}")
    .replace(/```json|```/g, "")
    .trim();
  let draft: Record<string, unknown>;
  try {
    draft = JSON.parse(content);
  } catch {
    return new Response(JSON.stringify({ error: "AI returned an unparseable draft." }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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
