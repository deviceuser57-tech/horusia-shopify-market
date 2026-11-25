import React from "react";
import { AdminGuard } from "@/components/AdminGuard";
import TrendIntelligence from "../TrendIntelligence";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const AdminTrendsPage: React.FC = () => {
  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container mx-auto flex-1 px-4 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Trend Intelligence</h1>
            <p className="text-muted-foreground">Product opportunities and test channels</p>
          </div>
          <TrendIntelligence />
        </main>
        <Footer />
      </div>
    </AdminGuard>
  );
};

export default AdminTrendsPage;