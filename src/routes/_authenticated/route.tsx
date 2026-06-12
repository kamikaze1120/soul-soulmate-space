import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Integration-managed auth gate. ssr:false because Supabase session lives in
// localStorage and cannot be read on the server. beforeLoad runs client-side
// and revalidates via getUser() (NOT getSession) before mounting children.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
