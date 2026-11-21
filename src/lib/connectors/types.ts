export type CommercePlatform = "shopify" | "woocommerce" | "zid" | "kzamizaa";

export interface ExternalProduct {
  externalId: string;
  title: string;
  description?: string;
  handle?: string;
  price?: number;
  currency?: string;
  available?: boolean;
  raw: unknown;
}

export interface StoreProduct {
  title: string;
  description?: string;
  handle?: string;
  price: number;
  currency: string;
  variants: Array<{
    externalId?: string;
    title: string;
    price: number;
    available: boolean;
  }>;
}

export interface UnifiedStoreConnector {
  platformName: CommercePlatform;
  syncCatalog(): Promise<ExternalProduct[]>;
  pushProduct(product: StoreProduct): Promise<{ externalId: string }>;
  checkSupplierAvailability(supplierSku: string): Promise<{
    status: "AVAILABLE" | "UNAVAILABLE" | "OUT_OF_STOCK" | "UNKNOWN";
    externalPrice?: number;
    currency?: string;
  }>;
}
