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

  // 1. التحقق من تسجيل الدخول
  const authHeader = request.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Authentication required." }, 401);
  }

  // 2. التحقق من صلاحيات الإدارة
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
      return json({ error: "Admin role required." }, 403);
    }
  }

  // 3. الاعتماد الكامل والمباشر على Lovable AI Gateway
  const gatewayKey = Deno.env.get("LOVABLE_API_KEY") ?? Deno.env.get("AI_GATEWAY_API_KEY");
  const gatewayUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
  const model = "google/gemini-2.5-flash";

  if (!gatewayKey) {
    return json({ error: "AI provider is not configured." }, 503);
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
    // القيم الافتراضية
  }

  const prompt = `You are a smart e-commerce trend analyst for Tumāninah Veritas Store, a luxury Egyptian-heritage storefront.
Suggest ${count} winning trending products for category: ${category} with businessModel: ${businessModel}.
Output valid JSON object with key "products" containing:
- title_ar, title_en, description, category, suggested_price (number), supplier_cost (number),
- business_model, trend_score (0-100), suggested_channel (TikTok/Instagram/Google Ads),
- image_url, tags, affiliate_url, supplier_source ("CJ_DROPSHIPPING" | "AFFILIATE_NETWORK" | "NEEDS_SOURCING"),
- affiliate_network, sourcing_notes.`;

  const aiResponse = await fetch(gatewayUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gatewayKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are an e-commerce trend engine. Never invent fake metrics. Output only JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    return json({ error: "AI provider request failed.", status: aiResponse.status, details: errText.slice(0, 500) }, 502);
  }

  const aiJson = await aiResponse.json();
  const content = aiJson.choices?.[0]?.message?.content ?? "{}";
  const cleanJson = content.replace(/```json|```/g, "").trim();

  let products: unknown[] = [];
  try {
    const parsed = JSON.parse(cleanJson);
    products = Array.isArray(parsed) ? parsed : (parsed.products || parsed.items || []);
  } catch {
    return json({ error: "AI returned an unparseable trend list." }, 502);
  }

  return json({ success: true, products });
});
