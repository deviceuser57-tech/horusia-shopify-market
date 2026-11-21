import { fetchProducts } from "@/lib/shopify";
import type {
  ExternalProduct,
  StoreProduct,
  UnifiedStoreConnector,
} from "@/lib/connectors/types";

export class ShopifyConnector implements UnifiedStoreConnector {
  platformName = "shopify" as const;

  async syncCatalog(): Promise<ExternalProduct[]> {
    const products = await fetchProducts(250);
    return products.map((product) => ({
      externalId: product.node.id,
      title: product.node.title,
      description: product.node.description,
      handle: product.node.handle,
      price: Number(product.node.priceRange.minVariantPrice.amount),
      currency: product.node.priceRange.minVariantPrice.currencyCode,
      available: product.node.variants.edges.some((variant) => variant.node.availableForSale),
      raw: product,
    }));
  }

  async pushProduct(product: StoreProduct): Promise<{ externalId: string }> {
    void product;
    throw new Error(
      "Shopify product publishing requires a server-only Shopify Admin API connector and is not enabled.",
    );
  }

  async checkSupplierAvailability(supplierSku: string): Promise<{
    status: "AVAILABLE" | "UNAVAILABLE" | "OUT_OF_STOCK" | "UNKNOWN";
    externalPrice?: number;
    currency?: string;
  }> {
    if (!supplierSku.trim()) {
      return { status: "UNKNOWN" };
    }

    const products = await this.syncCatalog();
    const match = products.find((product) =>
      JSON.stringify(product.raw).toLowerCase().includes(supplierSku.toLowerCase()),
    );

    if (!match) return { status: "UNKNOWN" };
    return {
      status: match.available ? "AVAILABLE" : "OUT_OF_STOCK",
      externalPrice: match.price,
      currency: match.currency,
    };
  }
}
