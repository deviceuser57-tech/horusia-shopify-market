import { supabase } from "@/integrations/supabase/client";
import type { UnifiedStoreConnector, ExternalProduct, StoreProduct } from "./types";

export class CJDropshipAdapter implements UnifiedStoreConnector {
  platformName = "kzamizaa" as const;

  async syncCatalog(keyword = "decor"): Promise<ExternalProduct[]> {
    const { data, error } = await supabase.functions.invoke("cj-connector", {
      body: { action: "SEARCH_PRODUCTS", keyword },
    });

    if (error || !data) return [];

    // CJ returns { code, data: { list: [...] } }; tolerate alternate shapes.
    const list = data?.data?.list ?? data?.data ?? [];
    if (!Array.isArray(list)) return [];

    return list.map((item: Record<string, unknown>) => ({
      externalId: String(item.pid ?? item.productId ?? item.id ?? ""),
      title: String(item.productNameEn ?? item.productName ?? item.name ?? ""),
      description: item.description ? String(item.description) : undefined,
      price: Number(item.sellPrice ?? item.price ?? 0) || undefined,
      currency: "USD",
      available: true,
      raw: item,
    }));
  }

  async checkSupplierAvailability(supplierSku: string): Promise<{
    status: "AVAILABLE" | "UNAVAILABLE" | "OUT_OF_STOCK" | "UNKNOWN";
    externalPrice?: number;
    currency?: string;
  }> {
    if (!supplierSku) return { status: "UNKNOWN" as const };

    const { data, error } = await supabase.functions.invoke("cj-connector", {
      body: { action: "CHECK_STOCK", sku: supplierSku },
    });

    if (error || !data || data.code !== 200) {
      return { status: "UNKNOWN" as const };
    }

    const inventory = Number(data.data?.inventory ?? 0);
    return {
      status: inventory > 0 ? ("AVAILABLE" as const) : ("OUT_OF_STOCK" as const),
      externalPrice: Number(data.data?.costPrice ?? 0) || undefined,
      currency: "USD",
    };
  }

  async pushProduct(_product: StoreProduct): Promise<{ externalId: string }> {
    throw new Error("Products are sourced from CJ into the store, not pushed back to CJ.");
  }
}
