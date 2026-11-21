import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export interface CompareItem {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  affiliateUrl?: string;
}

export const ProductComparisonModal = ({
  items,
  isOpen,
  onClose,
  onRemove,
}: {
  items: CompareItem[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-5xl overflow-x-auto">
      <DialogHeader><DialogTitle>Product comparison ({items.length} of 4)</DialogTitle></DialogHeader>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add products to compare.</p>
      ) : (
        <div className="grid min-w-[620px] grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col items-center space-y-3 text-center">
              <img src={item.image} alt={item.title} className="h-24 w-24 rounded object-cover" />
              <h4 className="line-clamp-2 text-sm font-semibold">{item.title}</h4>
              <span className="font-bold text-primary">{item.price.toFixed(2)}</span>
              <span className="rounded bg-muted px-2 py-1 text-xs">{item.category}</span>
              {item.affiliateUrl ? (
                <Button size="sm" className="w-full" asChild><a href={item.affiliateUrl} target="_blank" rel="noopener noreferrer">Visit merchant <ExternalLink className="ml-1 h-3 w-3" /></a></Button>
              ) : (
                <Button size="sm" className="w-full" asChild><a href="/shop">View in shop</a></Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => onRemove(item.id)}>Remove</Button>
            </div>
          ))}
        </div>
      )}
    </DialogContent>
  </Dialog>
);
