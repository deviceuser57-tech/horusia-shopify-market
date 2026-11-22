import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto flex items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
          <h1 className="text-3xl font-bold mb-2">Order confirmed</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your order. Payment is being verified — you will receive
            updates once fulfillment begins.
          </p>
          {orderId && (
            <p className="mb-6 text-sm text-muted-foreground">
              Order reference: <span className="font-mono">{orderId}</span>
            </p>
          )}
          <Button asChild>
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderSuccess;
