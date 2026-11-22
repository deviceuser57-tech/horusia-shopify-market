import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function getCjAccessToken(email: string, apiKey: string): Promise<string> {
  const res = await fetch(`${CJ_API_URL}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, apiKey }),
  });
  const data = await res.json();
  if (data.code !== 200 || !data.data?.accessToken) {
    throw new Error(data.message || "Failed to obtain CJ Dropshipping access token.");
  }
  return data.data.accessToken as string;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const authHeader = request.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Authentication required." }, 401);
  }

  // Server-verified admin role check before spending supplier API quota.
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
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

  const cjEmail = Deno.env.get("CJ_ACCOUNT_EMAIL") ?? "";
  const cjApiKey = Deno.env.get("CJ_API_KEY") ?? "";
  if (!cjEmail || !cjApiKey) {
    return json({ error: "CJ Dropshipping credentials are not configured." }, 503);
  }

  let action = "";
  let keyword = "";
  let sku = "";
  let orderPayload: unknown = null;
  try {
    const body = await request.json();
    action = String(body.action ?? "");
    keyword = String(body.keyword ?? "");
    sku = String(body.sku ?? "");
    orderPayload = body.orderPayload ?? null;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  try {
    const token = await getCjAccessToken(cjEmail, cjApiKey);

    if (action === "SEARCH_PRODUCTS") {
      const res = await fetch(
        `${CJ_API_URL}/product/list?pageNum=1&pageSize=20&keyWord=${encodeURIComponent(keyword || "decor")}`,
        { headers: { "CJ-Access-Token": token } },
      );
      return json(await res.json());
    }

    if (action === "CHECK_STOCK") {
      if (!sku) return json({ error: "sku is required." }, 400);
      const res = await fetch(`${CJ_API_URL}/product/stock?sku=${encodeURIComponent(sku)}`, {
        headers: { "CJ-Access-Token": token },
      });
      return json(await res.json());
    }

    if (action === "CREATE_ORDER") {
      if (!orderPayload) return json({ error: "orderPayload is required." }, 400);
      const res = await fetch(`${CJ_API_URL}/shopping/order/createOrder`, {
        method: "POST",
        headers: { "CJ-Access-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      return json(await res.json());
    }

    return json({ error: "Invalid action." }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "CJ connector request failed." }, 502);
  }
});
