import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

interface Proposal {
  id: string;
  agent_name: string;
  action_type: string;
  target_type: string | null;
  proposed_value: unknown;
  status: string;
  confidence: string | null;
  created_at: string;
}

export default function AgentApprovalCenter() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [reason, setReason] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("agent_action_proposals")
      .select("id,agent_name,action_type,target_type,proposed_value,status,confidence,created_at")
      .eq("status", "PENDING_APPROVAL")
      .order("created_at", { ascending: false });
    setProposals((data ?? []) as Proposal[]);
  };

  useEffect(() => { void load(); }, []);

  const decide = async (proposal: Proposal, status: "APPROVED" | "REJECTED") => {
    const { data: session } = await supabase.auth.getSession();
    const { error } = await supabase
      .from("agent_action_proposals")
      .update({
        status,
        decided_at: new Date().toISOString(),
        reviewed_by: session.session?.user.id ?? null,
        rejection_reason: status === "REJECTED" ? reason : null,
      })
      .eq("id", proposal.id);
    if (error) {
      toast.error("The decision could not be saved.");
      return;
    }
    await supabase.from("audit_logs").insert({
      actor_id: session.session?.user.id ?? null,
      action: `AI_PROPOSAL_${status}`,
      target_type: "agent_action_proposals",
      target_id: proposal.id,
      previous_value: { status: proposal.status },
      new_value: { status },
      reason: reason || (status === "APPROVED" ? "Approved by manager" : "Rejected by manager"),
    });
    toast.success(status === "APPROVED" ? "Proposal approved." : "Proposal rejected.");
    setReason("");
    await load();
  };

  return (
    <AdminPageShell>
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">AI Governance</h1>
      <div className="mb-5 max-w-xl"><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Decision reason (required for rejection)" /></div>
      <div className="grid gap-4">
        {proposals.map((proposal) => (
          <Card key={proposal.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{proposal.agent_name} — {proposal.action_type}</CardTitle>
              <Badge variant="outline">{proposal.confidence ?? "draft"}</Badge>
            </CardHeader>
            <CardContent>
              <pre className="mb-4 max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(proposal.proposed_value, null, 2)}</pre>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => decide(proposal, "REJECTED")} disabled={!reason.trim()}>Reject</Button>
                <Button onClick={() => decide(proposal, "APPROVED")}>Approve</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {proposals.length === 0 && <p className="text-muted-foreground">No pending proposals.</p>}
      </div>
    </div>
    </AdminPageShell>
  );
}
