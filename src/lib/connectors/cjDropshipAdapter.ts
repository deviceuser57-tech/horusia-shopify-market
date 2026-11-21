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
    try {
      const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/stock?sku=${supplierSku}`, {
        headers: { "CJ-Access-Token": import.meta.env.VITE_CJ_API_TOKEN || "" }
      });
      const data = await response.json();
      
      if (data.code === 200 && data.data?.inventory > 0) {
        return {
          status: "AVAILABLE",
          externalPrice: Number(data.data.costPrice),
          currency: "USD"
        };
      }
      return { status: "OUT_OF_STOCK" };
    } catch {
      return { status: "UNKNOWN" };
    }
  }
}
