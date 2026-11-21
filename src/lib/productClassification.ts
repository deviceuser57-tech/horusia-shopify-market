import type { ShopifyProduct } from "@/lib/shopify";
import { supabase } from "@/integrations/supabase/client";

export type BusinessModel = "DROPSHIPPING" | "AFFILIATE";

export interface ProductClassification {
  businessModel: BusinessModel;
  affiliateUrl: string | null;
  sourceLabel: string;
}

const normalizeTag = (value: string) => value.trim().toLowerCase();

export function classifyShopifyProduct(product: ShopifyProduct): ProductClassification {
  const tags = (product.node.tags ?? []).map(normalizeTag);

  if (tags.includes("business-model:affiliate")) {
    const affiliateTag = tags.find((tag) => tag.startsWith("affiliate-url:"));
    const rawUrl = affiliateTag?.slice("affiliate-url:".length) ?? "";

    try {
      const affiliateUrl = rawUrl ? new URL(decodeURIComponent(rawUrl)).toString() : null;
      return {
        businessModel: "AFFILIATE",
        affiliateUrl,
        sourceLabel: "External merchant",
      };
    } catch {
      return {
        businessModel: "AFFILIATE",
        affiliateUrl: null,
        sourceLabel: "External merchant",
      };
    }
  }

  return {
    businessModel: "DROPSHIPPING",
    affiliateUrl: null,
    sourceLabel: "External supplier",
  };
}

export async function recordAffiliateClick(
  productId: string,
  affiliateUrl: string,
  campaign?: string,
) {
  const clickIdentifier = crypto.randomUUID();

  const { error } = await supabase.from("affiliate_click_events").insert({
    internal_product_id: productId,
    click_identifier: clickIdentifier,
    source: "storefront",
    campaign: campaign ?? null,
  });

  if (error) {
    throw error;
  }

  const destination = new URL(affiliateUrl);
  destination.searchParams.set("tumaninah_click", clickIdentifier);
  return destination.toString();
}
