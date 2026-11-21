import type { UnifiedStoreConnector, ExternalProduct, StoreProduct } from "./types";

abstract class UnconfiguredConnector implements UnifiedStoreConnector {
  abstract platformName: "woocommerce" | "zid" | "kzamizaa";
  async syncCatalog(): Promise<ExternalProduct[]> {
    throw new Error(`${this.platformName} sync requires account credentials and an official server-side connector.`);
  }
  async pushProduct(_product: StoreProduct): Promise<{ externalId: string }> {
    throw new Error(`${this.platformName} publishing is not enabled.`);
  }
  async checkSupplierAvailability(_supplierSku: string): Promise<{
    status: "AVAILABLE" | "UNAVAILABLE" | "OUT_OF_STOCK" | "UNKNOWN";
    externalPrice?: number;
    currency?: string;
  }> {
    return { status: "UNKNOWN" };
  }
}

export class WooCommerceConnector extends UnconfiguredConnector {
  platformName = "woocommerce" as const;
}

export class ZidConnector extends UnconfiguredConnector {
  platformName = "zid" as const;
}

export class KzamizaaConnector extends UnconfiguredConnector {
  platformName = "kzamizaa" as const;
}
