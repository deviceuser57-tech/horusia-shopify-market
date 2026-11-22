import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // Require an authenticated user; trend generation is an admin operation.
  const authHeader = request.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Authentication required." }, 401);
  }

  const gatewayUrl = Deno.env.get("AI_GATEWAY_URL");
  const gatewayKey = Deno.env.get("AI_GATEWAY_API_KEY");
  if (!gatewayUrl || !gatewayKey) {
    return json({ error: "AI gateway is not configured." }, 503);
  }

  let category = "all";
  let businessModel = "DROPSHIPPING";
  let count = 4;
  try {
    const body = await request.json();
    category = String(body.category ?? "all").trim() || "all";
    businessModel = body.businessModel === "AFFILIATE" ? "AFFILIATE" : "DROPSHIPPING";
    count = Math.min(Math.max(Number(body.count) || 4, 1), 8);
  } catch {
    // defaults are fine
  }

  const prompt = `You are a smart e-commerce trend analyst for Tumāninah Veritas Store, a luxury Egyptian-heritage storefront (heritage decor, handcrafted gifts, premium accessories, fast-moving dropship/affiliate products).
Suggest ${count} winning trending products that fit this store identity in the category scope: ${category}.
Return ONLY a valid JSON array, no markdown, no extra text. Each element must have:
- title_ar: Arabic product name
- title_en: English product name
- description: convincing bilingual marketing description
- category: product category
- suggested_price: suggested retail price USD (number)
- supplier_cost: estimated supplier cost USD (number, must be lower than suggested_price)
- business_model: "${businessModel}"
- trend_score: trend strength 0-100 (number)
- suggested_channel: best marketing channel (TikTok, Instagram, Google Ads)
- image_url: a plausible public image URL for the product
- tags: array of marketing tags
- affiliate_url: null unless the product clearly maps to a known affiliate program`;

  const aiResponse = await fetch(gatewayUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gatewayKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are an evidence-safe e-commerce trend engine. Never invent verified sales figures, ratings, or supplier SKUs. Output only the requested JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!aiResponse.ok) {
    return json({ error: "AI provider request failed.", status: aiResponse.status }, 502);
  }

  const aiJson = await aiResponse.json();
  const content = aiJson.choices?.[0]?.message?.content ?? "[]";
  const cleanJson = content.replace(/```json|```/g, "").trim();

  let products: unknown[] = [];
  try {
    const parsed = JSON.parse(cleanJson);
    products = Array.isArray(parsed) ? parsed : Array.isArray(parsed.products) ? parsed.products : [];
  } catch {
    return json({ error: "AI returned an unparseable trend list." }, 502);
  }

  const sanitized = products
    .map((item) => {
      const p = item as Record<string, unknown>;
      const suggestedPrice = Number(p.suggested_price);
      const supplierCost = Number(p.supplier_cost);
      if (!p.title_ar || !p.title_en || !Number.isFinite(suggestedPrice) || !Number.isFinite(supplierCost)) {
        return null;
      }
      return {
        title_ar: String(p.title_ar),
        title_en: String(p.title_en),
        description: String(p.description ?? ""),
        category: String(p.category ?? category),
        suggested_price: suggestedPrice,
        supplier_cost: supplierCost,
        business_model: businessModel,
        trend_score: Math.min(Math.max(Number(p.trend_score) || 0, 0), 100),
        suggested_channel: String(p.suggested_channel ?? "TikTok"),
        image_url: String(p.image_url ?? ""),
        tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
        affiliate_url: typeof p.affiliate_url === "string" && p.affiliate_url ? p.affiliate_url : null,
      };
    })
    .filter(Boolean);

  // Record the generation as an auditable AI proposal (governance trail).
  if (serviceRoleKey && sanitized.length > 0) {
    const admin = createClient(supabaseUrl, serviceRoleKey);
    await admin.from("agent_action_proposals").insert({
      agent_name: "TREND_AI",
      action_type: "suggest_products",
      target_type: "trend_feed",
      proposed_value: { category, businessModel, count: sanitized.length },
      evidence: sanitized.slice(0, 3).map((p) => ({ title: (p as { title_en: string }).title_en })),
      confidence: "draft",
      status: "PENDING_APPROVAL",
    });
  }

  return json({ success: true, products: sanitized });
});
