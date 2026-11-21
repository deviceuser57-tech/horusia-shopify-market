import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroBannerStudio } from "@/components/admin/HeroBannerStudio";
import { AiImageStudioModal } from "@/components/admin/AiImageStudioModal";

const links = [
  { title: "Trend Intelligence", description: "Product opportunities and test channels", to: "/admin/trends" },
  { title: "AI Approvals", description: "Review and approve agent proposals", to: "/admin/approvals" },
  { title: "Affiliate & Suppliers", description: "Manage external links and supplier records", to: "/admin/connectors" },
  { title: "BI & Risk", description: "Operations, commissions and sync health", to: "/admin/bi" },
];

export default function AdminHome() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Store Operations</h1>
            <p className="text-muted-foreground">Zero-local-inventory administration</p>
          </div>
          <AiImageStudioModal />
        </div>
        <div className="mb-10 grid gap-4 md:grid-cols-4">
          {links.map((link) => (
            <Link key={link.to} to={link.to}>
              <Card className="h-full transition-colors hover:border-primary"><CardHeader><CardTitle>{link.title}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{link.description}</CardContent></Card>
            </Link>
          ))}
        </div>
        <HeroBannerStudio />
      </main>
      <Footer />
    </div>
  );
}
