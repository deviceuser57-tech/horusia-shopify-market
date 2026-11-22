import { Button } from "@/components/ui/button";
import { ShopifyProduct } from "@/lib/shopify";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { classifyShopifyProduct, recordAffiliateClick } from "@/lib/productClassification";

interface ProductCardProps {
  product: ShopifyProduct;
  onCompare?: (item: {
    id: string;
    title: string;
    price: number;
    image: string;
    category: string;
    affiliateUrl?: string;
  }) => void;
}

export const ProductCard = ({ product, onCompare }: ProductCardProps) => {
  const addItem = useCartStore(state => state.addItem);
  const { node } = product;
  const price = node.priceRange.minVariantPrice;
  const image = node.images.edges[0]?.node;
  const firstVariant = node.variants.edges[0]?.node;
  const classification = classifyShopifyProduct(product);

  const handleAffiliateClick = async () => {
    if (!classification.affiliateUrl) {
      toast.error("External product link is unavailable.");
      return;
    }

    try {
      const destination = await recordAffiliateClick(node.id, classification.affiliateUrl);
      window.open(destination, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("We could not start external tracking. Please try again.");
    }
  };

  const handleAddToCart = () => {
    if (!firstVariant) return;

    const cartItem = {
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions || []
    };
    
    addItem(cartItem);
    toast.success("Added to cart", {
      description: `${node.title} has been added to your cart`,
      position: "top-center",
    });
  };

  return (
    <div className="group bg-card rounded-lg border border-border overflow-hidden hover:shadow-medium hover:border-accent transition-all duration-300">
      <Link to={`/product/${node.handle}`}>
        <div className="aspect-square bg-secondary/20 overflow-hidden relative">
          {image ? (
            <img
              src={image.url}
              alt={image.altText || node.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/20">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4 space-y-3">
        <span className="inline-flex rounded-md bg-secondary/50 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-secondary-foreground">
          {classification.sourceLabel}
        </span>
        <Link to={`/product/${node.handle}`}>
          <h3 className="font-medium text-foreground hover:text-accent-hover transition-colors line-clamp-1">
            {node.title}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-semibold text-foreground">
            {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
          </span>
          {classification.businessModel === "AFFILIATE" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-border hover:bg-secondary"
                onClick={handleAffiliateClick}
                disabled={!classification.affiliateUrl}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Visit
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                className="h-8 bg-foreground text-background hover:bg-accent-hover hover:text-foreground transition-all duration-300"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                Add
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
