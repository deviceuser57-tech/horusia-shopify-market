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

interface CheckoutItem {
  productId: string;
  quantity: number;
}

interface CustomerData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(supabaseUrl, serviceRoleKey);

  let body: {
    items?: CheckoutItem[];
    orderId?: string;
    paymentGateway?: string;
    customer?: CustomerData;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const paymentGateway = String(body.paymentGateway ?? "PAYMOB").toUpperCase();
  if (!["PAYMOB", "STRIPE"].includes(paymentGateway)) {
    return json({ error: "Unsupported payment gateway." }, 400);
  }
  const origin = request.headers.get("origin") ?? "";

  let targetOrderId = "";
  let payableAmount = 0;
  let currency = "USD";
  let internalOrderNumber = "";

  if (Array.isArray(body.items) && body.items.length > 0) {
    // ---- Guest checkout: build order from store_products ----
    const seen = new Map<string, number>();
    for (const item of body.items) {
      const pid = String(item.productId ?? "");
      const qty = Math.floor(Number(item.quantity));
      if (!UUID_RE.test(pid) || !Number.isFinite(qty) || qty <= 0 || qty > 99) {
        return json({ error: "Invalid item in checkout request." }, 400);
      }
      seen.set(pid, (seen.get(pid) ?? 0) + qty);
    }

    const productIds = [...seen.keys()];
    const { data: dbProducts, error: prodErr } = await admin
      .from("store_products")
      .select("id, title, price, currency, affiliate_url, business_model, status")
      .in("id", productIds);

    if (prodErr || !dbProducts || dbProducts.length !== productIds.length) {
      return json({ error: "One or more products are unavailable." }, 404);
    }
    if (dbProducts.some((p) => p.status !== "ACTIVE")) {
      return json({ error: "One or more products are not active." }, 422);
    }
    // Affiliate products checkout on the merchant site, not through local payment.
    if (dbProducts.some((p) => p.business_model === "AFFILIATE" || p.affiliate_url)) {
      return json({ error: "Affiliate products must be purchased from the merchant link." }, 422);
    }

    const currencies = new Set(dbProducts.map((p) => String(p.currency ?? "USD").toUpperCase()));
    if (currencies.size > 1) {
      return json({ error: "Cart contains mixed currencies." }, 422);
    }
    currency = [...currencies][0] ?? "USD";

    payableAmount = dbProducts.reduce((sum, p) => {
      const qty = seen.get(p.id) ?? 0;
      return sum + Number(p.price ?? 0) * qty;
    }, 0);
    if (!Number.isFinite(payableAmount) || payableAmount <= 0) {
      return json({ error: "Calculated order amount is invalid." }, 422);
    }

    internalOrderNumber = `TVS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const { data: newOrder, error: orderErr } = await admin
      .from("orders")
      .insert({
        internal_order_number: internalOrderNumber,
        payment_status: "PENDING",
        fulfillment_status: "PENDING_SUPPLIER",
        business_model: "DROPSHIPPING",
        total_amount: payableAmount,
        currency,
      })
      .select("id")
      .single();

    if (orderErr || !newOrder) {
      return json({ error: "Failed to create order record.", detail: orderErr?.message }, 500);
    }
    targetOrderId = newOrder.id;

    const orderItemsRows = dbProducts.map((p) => ({
      order_id: targetOrderId,
      internal_product_id: p.id,
      quantity: seen.get(p.id) ?? 0,
      unit_price: Number(p.price ?? 0),
    }));
    const { error: itemsErr } = await admin.from("order_items").insert(orderItemsRows);
    if (itemsErr) {
      await admin.from("orders").delete().eq("id", targetOrderId);
      return json({ error: "Failed to record order items." }, 500);
    }
  } else if (body.orderId && UUID_RE.test(String(body.orderId))) {
    // ---- Pay for an existing order ----
    targetOrderId = String(body.orderId);
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, internal_order_number, payment_status, total_amount, currency")
      .eq("id", targetOrderId)
      .maybeSingle();

    if (orderError || !order) return json({ error: "Order not found." }, 404);
    if (order.payment_status === "PAID") return json({ error: "Order is already paid." }, 409);
    if (order.total_amount == null || Number(order.total_amount) <= 0) {
      return json({ error: "Order has no payable total." }, 422);
    }
    payableAmount = Number(order.total_amount);
    currency = String(order.currency ?? "USD").toUpperCase();
    internalOrderNumber = order.internal_order_number ?? "";
  } else {
    return json({ error: "Either items array or a valid orderId is required." }, 400);
  }

  // ---- Payment gateway ----
  try {
    if (paymentGateway === "PAYMOB") {
      const apiKey = Deno.env.get("PAYMOB_API_KEY") ?? "";
      const integrationId = Deno.env.get("PAYMOB_INTEGRATION_ID") ?? "";
      const iframeId = Deno.env.get("PAYMOB_IFRAME_ID") ?? "";
      if (!apiKey || !integrationId || !iframeId) {
        return json({ error: "Paymob credentials not configured in secrets." }, 503);
      }

      const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const { token } = await authRes.json();
      if (!token) return json({ error: "Paymob auth failed." }, 502);

      const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: token,
          delivery_needed: "false",
          amount_cents: Math.round(payableAmount * 100),
          currency,
          merchant_order_id: targetOrderId,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData?.id) return json({ error: "Paymob order creation failed." }, 502);

      const keyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: token,
          amount_cents: Math.round(payableAmount * 100),
          expiration: 3600,
          order_id: orderData.id,
          billing_data: {
            first_name: body.customer?.firstName || "Customer",
            last_name: body.customer?.lastName || "Veritas",
            email: body.customer?.email || "customer@example.com",
            phone_number: body.customer?.phone || "+201000000000",
            apartment: "NA",
            floor: "NA",
            street: body.customer?.address || "Main Street",
            building: "NA",
            shipping_method: "NA",
            postal_code: "NA",
            city: body.customer?.city || "Cairo",
            country: body.customer?.country || "EGY",
            state: "Cairo",
          },
          currency,
          integration_id: Number(integrationId),
        }),
      });
      const { token: paymentToken } = await keyRes.json();
      if (!paymentToken) return json({ error: "Paymob payment key generation failed." }, 502);

      const checkoutUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;
      return json({ success: true, orderId: targetOrderId, internalOrderNumber, checkoutUrl, provider: "PAYMOB" });
    }

    // STRIPE
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!stripeSecretKey) return json({ error: "Stripe is not configured in secrets." }, 503);

    const params = new URLSearchParams({
      "payment_method_types[0]": "card",
      mode: "payment",
      success_url: `${origin}/order-success?order_id=${targetOrderId}`,
      cancel_url: `${origin}/shop`,
      customer_email: body.customer?.email || "",
      "line_items[0][price_data][currency]": currency.toLowerCase(),
      "line_items[0][price_data][product_data][name]": `Order ${internalOrderNumber || targetOrderId}`,
      "line_items[0][price_data][unit_amount]": String(Math.round(payableAmount * 100)),
      "line_items[0][quantity]": "1",
      "client_reference_id": targetOrderId,
      "payment_intent_data[metadata][order_id]": targetOrderId,
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
    if (!session.url) {
      return json({ error: "Stripe checkout session failed.", detail: session.error?.message }, 502);
    }
    return json({ success: true, orderId: targetOrderId, internalOrderNumber, checkoutUrl: session.url, provider: "STRIPE" });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Checkout flow failed." }, 500);
  }
});
