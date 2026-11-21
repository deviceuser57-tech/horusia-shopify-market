import type { UnifiedStoreConnector, ExternalProduct, StoreProduct } from "./types";

export class CJDropshipAdapter implements UnifiedStoreConnector {
  platformName = "kzamizaa" as const;

  async syncCatalog(): Promise<ExternalProduct[]> {
    return [];
  }

  async pushProduct(_product: StoreProduct): Promise<{ externalId: string }> {
    throw new Error("CJ order submission is disabled until real server credentials and a verified official API contract are configured.");
  }

  async checkSupplierAvailability(supplierSku: string): Promise<{
    status: "AVAILABLE" | "UNAVAILABLE" | "OUT_OF_STOCK" | "UNKNOWN";
    externalPrice?: number;
    currency?: string;
  }> {
    if (!supplierSku.trim()) return { status: "UNKNOWN" };
    const endpoint = import.meta.env.VITE_CJ_AVAILABILITY_ENDPOINT;
    if (!endpoint) return { status: "UNKNOWN" };
    try {
      const response = await fetch(`${endpoint}?sku=${encodeURIComponent(supplierSku)}`);
      if (!response.ok) return { status: "UNKNOWN" };
      const data = await response.json();
      if (typeof data.available !== "boolean") return { status: "UNKNOWN" };
      return {
        status: data.available ? "AVAILABLE" : "OUT_OF_STOCK",
        externalPrice: typeof data.price === "number" ? data.price : undefined,
        currency: typeof data.currency === "string" ? data.currency : "USD",
      };
    } catch {
      return { status: "UNKNOWN" };
    }
  }
}
