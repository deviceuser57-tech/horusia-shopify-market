import { supabase } from "@/integrations/supabase/client";

export function getOrCreateSessionId(): string {
  const storageKey = "tumaninah-affiliate-session";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const next = crypto.randomUUID();
  window.localStorage.setItem(storageKey, next);
  return next;
}

export async function handleAffiliateOutbound(
  productId: string,
  destinationUrl: string,
  campaignId?: string,
) {
  const clickIdentifier = getOrCreateSessionId();
  const { error } = await supabase.from("affiliate_click_events").insert({
    internal_product_id: productId,
    click_identifier: clickIdentifier,
    source: "affiliate-engine",
    campaign: campaignId ?? null,
  });

  if (error) {
    throw error;
  }

  const destination = new URL(destinationUrl);
  destination.searchParams.set("tumaninah_click", clickIdentifier);
  window.open(destination.toString(), "_blank", "noopener,noreferrer");
}
