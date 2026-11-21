import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Status = "LOADING" | "AUTHORIZED" | "UNAUTHORIZED";

export const AdminGuard = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<Status>("LOADING");

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus("UNAUTHORIZED");
        return;
      }

      const { data: memberships, error } = await supabase
        .from("user_roles")
        .select("role_id,roles(name)")
        .eq("user_id", data.session.user.id);

      if (error) {
        setStatus("UNAUTHORIZED");
        return;
      }

      const allowed = new Set(["OWNER", "STORE_MANAGER", "MARKETING_SPECIALIST"]);
      const authorized = (memberships ?? []).some((membership) => {
        const role = membership.roles as unknown as { name?: string } | null;
        return Boolean(role?.name && allowed.has(role.name));
      });

      setStatus(authorized ? "AUTHORIZED" : "UNAUTHORIZED");
    };

    void check();
  }, []);

  if (status === "LOADING") {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "UNAUTHORIZED") {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
