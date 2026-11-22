import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function verifyPaymobHmac(obj: Record<string, unknown>, receivedHmac: string): Promise<boolean> {
  const sourceData = (obj.source_data ?? {}) as Record<string, unknown>;
  const order = (obj.order ?? {}) as Record<string, unknown>;
  const concatenated = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    order.id,
    obj.owner,
    obj.pending,
    sourceData.pan,
    sourceData.sub_type,
    sourceData.type,
    obj.success,
  ].join("");

  const secret = Deno.env.get("PAYMOB_HMAC_SECRET") ?? "";
  if (!secret) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(concatenated));
  const computed = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computed.toLowerCase() === (receivedHmac || "").toLowerCase();
}

async function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  const parts = signatureHeader.split(",");
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of parts) {
    const [k, v] = part.trim().split("=");
    if (k === "t") timestamp = v;
    if (k === "v1") signatures.push(v);
  }
  if (!timestamp || signatures.length === 0) return false;

  // Reject stale events (>5 min) to prevent replay attacks.
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

  const payloadToSign = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadToSign));
  const computedHex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return signatures.some((s) => s.toLowerCase() === computedHex.toLowerCase());
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const stripeSigHeader = request.headers.get("stripe-signature");
  const rawBodyText = await request.text();

  // ---- Stripe webhook ----
  if (stripeSigHeader) {
    const isValid = await verifyStripeSignature(
      rawBodyText,
      stripeSigHeader,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "",
    );
    if (!isValid) return json({ error: "Invalid Stripe signature." }, 403);

    let stripeEvent: Record<string, unknown>;
    try {
      stripeEvent = JSON.parse(rawBodyText);
    } catch {
      return json({ error: "Invalid Stripe JSON." }, 400);
    }

    const eventId = String(stripeEvent.id ?? "");
    const eventType = String(stripeEvent.type ?? "");
    const dataObj = ((stripeEvent.data as Record<string, unknown>)?.object ?? {}) as Record<string, unknown>;

    const { error: eventErr } = await supabase.from("payment_webhook_events").insert({
      provider: "STRIPE",
      external_event_id: eventId || null,
      payload: stripeEvent,
      signature_valid: true,
      processed: false,
    });
    if (eventErr) return json({ received: true, duplicate: true });

    if (eventType === "checkout.session.completed" || eventType === "payment_intent.succeeded") {
      const metadata = (dataObj.metadata ?? {}) as Record<string, unknown>;
      const orderRef = String(dataObj.client_reference_id ?? metadata.order_id ?? "");
      const amount = Number(dataObj.amount_total ?? dataObj.amount ?? 0) / 100;
      const currency = String(dataObj.currency ?? "usd").toUpperCase();

      if (UUID_RE.test(orderRef)) {
        await supabase.from("payment_transactions").insert({
          order_id: orderRef,
          provider: "STRIPE",
          external_transaction_id: eventId || null,
          status: "SUCCEEDED",
          amount,
          currency,
          idempotency_key: `stripe-${eventId}`,
        });
        await supabase
          .from("orders")
          .update({ payment_status: "PAID" })
          .eq("id", orderRef)
          .neq("payment_status", "PAID");
      }
    }

    await supabase
      .from("payment_webhook_events")
      .update({ processed: true })
      .eq("provider", "STRIPE")
      .eq("external_event_id", eventId);

    return json({ received: true });
  }

  // ---- Paymob webhook ----
  const url = new URL(request.url);
  const hmac = url.searchParams.get("hmac") ?? "";

  let payload: { obj?: Record<string, unknown> };
  try {
    payload = JSON.parse(rawBodyText);
  } catch {
    return json({ error: "Invalid payload." }, 400);
  }

  const txn = payload.obj;
  if (!txn) return json({ error: "Missing transaction object." }, 400);

  const isValid = await verifyPaymobHmac(txn, hmac);
  if (!isValid) return json({ error: "Invalid HMAC signature." }, 403);

  const txnId = String(txn.id ?? "");
  const orderRef = String((txn.order as Record<string, unknown> | undefined)?.merchant_order_id ?? "");
  const isSuccess = txn.success === true;

  const { error: eventError } = await supabase.from("payment_webhook_events").insert({
    provider: "PAYMOB",
    external_event_id: txnId || null,
    payload,
    signature_valid: true,
    processed: false,
  });
  if (eventError) return json({ received: true, duplicate: true });

  if (txnId && UUID_RE.test(orderRef)) {
    await supabase.from("payment_transactions").insert({
      order_id: orderRef,
      provider: "PAYMOB",
      external_transaction_id: txnId,
      status: isSuccess ? "SUCCEEDED" : "FAILED",
      amount: Number(txn.amount_cents ?? 0) / 100,
      currency: String(txn.currency ?? "USD"),
      idempotency_key: `paymob-${txnId}`,
    });
  }

  if (UUID_RE.test(orderRef)) {
    await supabase
      .from("orders")
      .update({ payment_status: isSuccess ? "PAID" : "FAILED" })
      .eq("id", orderRef)
      .neq("payment_status", "PAID");
  }

  await supabase
    .from("payment_webhook_events")
    .update({ processed: true })
    .eq("provider", "PAYMOB")
    .eq("external_event_id", txnId);

  return json({ received: true });
});
