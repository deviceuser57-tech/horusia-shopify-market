import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { OAuthAuthorizationDetails } from "@supabase/auth-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id parameter.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/auth?next=${encodeURIComponent(next)}`;
        return;
      }

      const { data, error: authError } =
        await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (authError) {
        setError(authError.message);
        return;
      }
      // Consent already granted — the API returns the client redirect URI.
      if (data?.redirect_uri && !data?.client) {
        window.location.href = data.redirect_uri;
        return;
      }
      if (data) setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const handleDecision = async (approve: boolean) => {
    setIsSubmitting(true);
    const { data, error: decisionError } = approve
      ? await supabase.auth.oauth.approveAuthorization(authorizationId)
      : await supabase.auth.oauth.denyAuthorization(authorizationId);

    if (decisionError) {
      setIsSubmitting(false);
      setError(decisionError.message);
      return;
    }

    if (data?.redirect_url) {
      window.location.href = data.redirect_url;
    } else {
      setIsSubmitting(false);
      setError("No return URL provided by the authorization server.");
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/20">
        <Navbar />
        <div className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Authorization Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Navbar />
      <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Connect {details.client?.client_name ?? "External Agent"}</CardTitle>
          <CardDescription>
            This application requests access to interact with HORUSIA on your behalf.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">Requested access:</p>
            <p>{details.scope || "Catalog read access"}</p>
            <p className="mt-2">
              Signed in as {details.user?.email ?? "your account"}.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleDecision(false)}
            >
              Deny
            </Button>
            <Button className="flex-1" disabled={isSubmitting} onClick={() => handleDecision(true)}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Authorize
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
      <Footer />
    </div>
  );
}