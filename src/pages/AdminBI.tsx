import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Metrics {
  dropshipOrders: number;
  affiliateClicks: number;
  estimatedCommissions: number;
  approvedCommissions: number;
  paidCommissions: number;
  stalePriceSnapshots: number;
  failedSyncJobs: number;
  lowMarginAlerts: number;
}

const emptyMetrics: Metrics = {
  dropshipOrders: 0,
  affiliateClicks: 0,
  estimatedCommissions: 0,
  approvedCommissions: 0,
  paidCommissions: 0,
  stalePriceSnapshots: 0,
  failedSyncJobs: 0,
  lowMarginAlerts: 0,
};

const AdminBI = () => {
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics);
  const [loading, setLoading] = useState(true);
  const [restricted, setRestricted] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadMetrics = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        if (mounted) {
          setRestricted(true);
          setLoading(false);
        }
        return;
      }

      try {
        const [orders, clicks, commissions, snapshots, syncJobs] = await Promise.all([
          supabase.from("orders").select("id", { count: "exact", head: true }),
          supabase.from("affiliate_click_events").select("id", { count: "exact", head: true }),
          supabase.from("affiliate_commissions").select("status,amount"),
          supabase.from("external_product_snapshots").select("freshness_status"),
          supabase.from("sync_jobs").select("status"),
        ]);

        const commissionRows = commissions.data ?? [];
        const snapshotRows = snapshots.data ?? [];
        const syncRows = syncJobs.data ?? [];

        if (mounted) {
          setMetrics({
            dropshipOrders: orders.count ?? 0,
            affiliateClicks: clicks.count ?? 0,
            estimatedCommissions: commissionRows
              .filter((row) => row.status === "ESTIMATED")
              .reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
            approvedCommissions: commissionRows
              .filter((row) => row.status === "APPROVED")
              .reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
            paidCommissions: commissionRows
              .filter((row) => row.status === "PAID")
              .reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
            stalePriceSnapshots: snapshotRows.filter((row) => row.freshness_status === "STALE").length,
            failedSyncJobs: syncRows.filter((row) => row.status === "FAILED").length,
            lowMarginAlerts: 0,
          });
        }
      } catch {
        if (mounted) setRestricted(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadMetrics();
    return () => {
      mounted = false;
    };
  }, []);

  const chartData = [
    { name: "Dropship orders", value: metrics.dropshipOrders },
    { name: "Affiliate clicks", value: metrics.affiliateClicks },
    { name: "Paid commission", value: metrics.paidCommissions },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold">Unified Business Intelligence</h1>
        <p className="mb-8 text-muted-foreground">
          Source-backed operations and finance metrics. No local inventory or simulated sales are included.
        </p>

        {restricted && (
          <Alert className="mb-6">
            <AlertTitle>Restricted dashboard</AlertTitle>
            <AlertDescription>Sign in and obtain an operational role before viewing BI data.</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading source metrics...</p>
        ) : (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-4">
              <Card><CardHeader><CardTitle>Dropship orders</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{metrics.dropshipOrders}</CardContent></Card>
              <Card><CardHeader><CardTitle>Affiliate clicks</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{metrics.affiliateClicks}</CardContent></Card>
              <Card><CardHeader><CardTitle>Stale snapshots</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{metrics.stalePriceSnapshots}</CardContent></Card>
              <Card><CardHeader><CardTitle>Failed sync jobs</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{metrics.failedSyncJobs}</CardContent></Card>
            </div>

            <Card className="mb-8">
              <CardHeader><CardTitle>Operational activity</CardTitle></CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card><CardHeader><CardTitle>Estimated commission</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{metrics.estimatedCommissions.toFixed(2)}</CardContent></Card>
              <Card><CardHeader><CardTitle>Approved commission</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{metrics.approvedCommissions.toFixed(2)}</CardContent></Card>
              <Card><CardHeader><CardTitle>Paid commission</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{metrics.paidCommissions.toFixed(2)}</CardContent></Card>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminBI;
