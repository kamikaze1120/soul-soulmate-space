import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActiveModeProvider } from "@/lib/active-mode";
import { AppShell } from "@/components/app-shell";
import { useRedeemWaliInvite } from "@/lib/queries/wali";
import { PENDING_WALI_INVITE_KEY } from "@/routes/wali-invite.$token";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase
      .from("profiles")
      .select("primary_mode")
      .eq("id", context.user.id)
      .maybeSingle();
    if (!data?.primary_mode) throw redirect({ to: "/onboarding" });
  },
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const redeemInvite = useRedeemWaliInvite();

  // A wali invite may have been accepted before this user had an account —
  // /wali-invite/$token stashes the token and sends them through /auth (and
  // onboarding, if new) first. Once they land back in the authenticated
  // app, redeem it here rather than in the invite page itself, since that
  // page isn't under _authenticated and can't assume onboarding is done.
  useEffect(() => {
    const token = sessionStorage.getItem(PENDING_WALI_INVITE_KEY);
    if (!token) return;
    sessionStorage.removeItem(PENDING_WALI_INVITE_KEY);
    redeemInvite.mutate(token, {
      onSuccess: (threadId) => {
        toast.success("You've joined as a Wali.");
        if (threadId) navigate({ to: "/messages/$id", params: { id: threadId } });
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Couldn't accept that invite.");
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ActiveModeProvider>
      <AppShell />
    </ActiveModeProvider>
  );
}
