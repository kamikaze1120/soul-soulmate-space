import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ActiveModeProvider } from "@/lib/active-mode";
import { AppShell } from "@/components/app-shell";

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
  return (
    <ActiveModeProvider>
      <AppShell />
    </ActiveModeProvider>
  );
}
