import { createFileRoute } from "@tanstack/react-router";
import { ActiveModeProvider } from "@/lib/active-mode";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <ActiveModeProvider>
      <AppShell />
    </ActiveModeProvider>
  );
}
