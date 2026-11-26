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

  const authHeader = request.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Authentication required to use AI enrichment." }, 401);
  }

  // Admin/marketing roles only — enrichment consumes paid AI quota.
  if (serviceRoleKey) {
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: roles } = await admin
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", userData.user.id);
    const allowed = new Set(["OWNER", "STORE_MANAGER", "MARKETING_SPECIALIST", "AI_AGENT"]);
    const isAllowed = (roles ?? []).some((row) => {
      const role = row.roles as unknown as { name?: string } | null;
      return Boolean(role?.name && allowed.has(role.name));
    });
    if (!isAllowed) {
      return json({ error: "Admin role required." }, 403);
    }
  }

  // Provider: Lovable AI gateway only (managed LOVABLE_API_KEY).
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  const gatewayUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
  const model = "google/gemini-2.5-flash";

  if (!lovableKey) {
    return json({ error: "Lovable AI Gateway key is missing." }, 503);
  }

  const body = await request.json().catch(() => ({}));
  const mode = String(body.mode ?? "PRODUCT_DRAFT").toUpperCase();

  let systemPrompt = "You are an e-commerce copy engine for Tumāninah Veritas Store, a luxury Egyptian-heritage storefront (handcrafted gifts, heritage decor, premium accessories, dropship/affiliate products). Output only valid JSON.";
  let userPrompt = "";
  let requireKeys: string[] = [];

  if (mode === "SOCIAL_ADS") {
    const rawName = String(body.rawName ?? "").trim();
    const category = String(body.category ?? "Heritage Décor").trim();
    const price = body.price != null ? Number(body.price) : null;
    const description = String(body.description ?? "").trim();
    const adFormat = String(body.adFormat ?? "video");
    if (!rawName) return json({ error: "rawName is required for SOCIAL_ADS." }, 400);

    userPrompt = `Product: ${rawName}. Category: ${category}. Price: ${price ?? "TBD"} USD. Description: ${description || "n/a"}. Target ad format: ${adFormat}.
Return JSON: { "ads": { "tiktok": {"hook","script","callToAction","hashtags":[]}, "instagram": {"headline","caption","hashtags":[]}, "google": {"headlines":[],"descriptions":[]} } }.
Rules: evidence-safe claims only, bilingual flavor welcome, include 4-6 hashtags per platform, Google headlines max 30 chars each, descriptions max 90 chars each.`;
    requireKeys = ["ads"];
  } else if (mode === "EXTRACT_FROM_URL") {
    const url = String(body.url ?? "").trim();
    const notes = String(body.notes ?? "").trim();
    if (!url) return json({ error: "url is required for EXTRACT_FROM_URL." }, 400);

    userPrompt = `Supplier product URL: ${url}.${notes ? ` Additional notes: ${notes}.` : ""}
Infer the product details a merchant would need. Return JSON with keys: title_ar, title_en, description_ar, description_en, category, suggested_price (number or null), suggested_supplier_cost (number or null), tags (array), image_url (best-guess public image URL or null), supplier_source ("CJ_DROPSHIPPING"|"AFFILIATE_NETWORK"|"NEEDS_SOURCING"), affiliate_network (string or null), affiliate_url (string or null), sourcing_notes.
Do not fabricate metrics; if unsure of price/cost use null.`;
    requireKeys = ["title_en"];
  } else {
    // PRODUCT_DRAFT (default)
    const rawName = String(body.rawName ?? "").trim();
    const category = String(body.category ?? "").trim();
    if (!rawName) return json({ error: "rawName is required." }, 400);

    userPrompt = `Product name: ${rawName}.${category ? ` Category: ${category}.` : ""}
Return JSON with keys: titleAr, titleEn, descriptionAr, descriptionEn, suggestedTags (array of 5-8 strings), suggestedPrice (number or null), seoKeywords (array of 5 strings).`;
    requireKeys = ["titleEn"];
  }

  try {
    const aiResponse = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      return json({ error: "AI provider request failed.", status: aiResponse.status, details: errText.slice(0, 300) }, 502);
    }

    const aiJson = await aiResponse.json();
    const content = (aiJson.choices?.[0]?.message?.content ?? "{}").replace(/```json|```/g, "").trim();
    let draft: Record<string, unknown>;
    try {
      draft = JSON.parse(content);
    } catch {
      return json({ error: "AI returned unparseable JSON." }, 502);
    }

    const missing = requireKeys.filter((k) => draft[k] == null);
    if (missing.length) {
      return json({ error: "AI response missing required keys.", missing }, 502);
    }

    return json(draft);
  } catch (err) {
    return json({ error: "AI gateway network error.", details: String(err) }, 500);
  }
});
