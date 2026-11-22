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
    return json({ error: "Authentication required." }, 401);
  }

  let orderId = "";
  let paymentGateway = "PAYMOB";
  let billingData: Record<string, unknown> | null = null;
  try {
    const body = await request.json();
    orderId = String(body.orderId ?? "");
    paymentGateway = String(body.paymentGateway ?? "PAYMOB").toUpperCase();
    billingData = body.billingData ?? null;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
  if (!orderId) return json({ error: "orderId is required." }, 400);

  // Load the order server-side; never trust client-supplied amounts.
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, internal_order_number, payment_status, total_amount, currency")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) return json({ error: "Order not found." }, 404);
  if (order.payment_status === "PAID") return json({ error: "Order is already paid." }, 409);
  if (order.total_amount == null || Number(order.total_amount) <= 0) {
    return json({ error: "Order has no payable total." }, 422);
  }

  const amount = Number(order.total_amount);
  const currency = String(order.currency ?? "USD").toUpperCase();
  const origin = request.headers.get("origin") ?? "";

  try {
    if (paymentGateway === "PAYMOB") {
      const apiKey = Deno.env.get("PAYMOB_API_KEY") ?? "";
      const integrationId = Deno.env.get("PAYMOB_INTEGRATION_ID") ?? "";
      const iframeId = Deno.env.get("PAYMOB_IFRAME_ID") ?? "";
      if (!apiKey || !integrationId || !iframeId) {
        return json({ error: "Paymob is not configured." }, 503);
      }

      const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const { token } = await authRes.json();
      if (!token) return json({ error: "Paymob authentication failed." }, 502);

      const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: token,
          delivery_needed: "false",
          amount_cents: Math.round(amount * 100),
          currency,
          merchant_order_id: order.id,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData?.id) return json({ error: "Paymob order creation failed." }, 502);

      const keyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: token,
          amount_cents: Math.round(amount * 100),
          expiration: 3600,
          order_id: orderData.id,
          billing_data: billingData ?? {
            first_name: "Customer",
            last_name: "Veritas",
            email: userData.user.email ?? "customer@example.com",
            phone_number: "+201000000000",
            apartment: "NA",
            floor: "NA",
            street: "NA",
            building: "NA",
            shipping_method: "NA",
            postal_code: "NA",
            city: "Cairo",
            country: "EGY",
            state: "Cairo",
          },
          currency,
          integration_id: Number(integrationId),
        }),
      });
      const { token: paymentToken } = await keyRes.json();
      if (!paymentToken) return json({ error: "Paymob payment key generation failed." }, 502);

      const checkoutUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;
      return json({ success: true, checkoutUrl, provider: "PAYMOB" });
    }

    if (paymentGateway === "STRIPE") {
      const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
      if (!stripeSecretKey) return json({ error: "Stripe is not configured." }, 503);

      const params = new URLSearchParams({
        "payment_method_types[0]": "card",
        mode: "payment",
        success_url: `${origin}/order-success?order_id=${order.id}`,
        cancel_url: `${origin}/shop`,
        "line_items[0][price_data][currency]": currency.toLowerCase(),
        "line_items[0][price_data][product_data][name]": `Order ${order.internal_order_number ?? order.id}`,
        "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)),
        "line_items[0][quantity]": "1",
      });

      const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      const session = await stripeRes.json();
      if (!session.url) return json({ error: "Stripe checkout session failed.", detail: session.error?.message }, 502);
      return json({ success: true, checkoutUrl: session.url, provider: "STRIPE" });
    }

    return json({ error: "Unsupported payment gateway." }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Checkout creation failed." }, 500);
  }
});
