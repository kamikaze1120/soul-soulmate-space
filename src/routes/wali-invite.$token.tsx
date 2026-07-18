import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWaliInviteInfo } from "@/lib/queries/wali";
import { MODES } from "@/lib/modes";
import { LogoMark } from "@/components/logo-mark";

export const PENDING_WALI_INVITE_KEY = "pending_wali_invite_token";

export const Route = createFileRoute("/wali-invite/$token")({
  head: () => ({ meta: [{ title: "Wali invite · Ummah" }] }),
  component: WaliInvitePage,
});

function WaliInvitePage() {
  const { token } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: info, isLoading } = useWaliInviteInfo(token);

  const accept = () => {
    sessionStorage.setItem(PENDING_WALI_INVITE_KEY, token);
    navigate({ to: user ? "/feed" : "/auth" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--app-canvas)] px-6 text-center">
      <LogoMark className="h-12 w-12 text-lg" />

      {isLoading || loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading invite…</p>
      ) : !info ? (
        <>
          <h1 className="font-display mt-6 text-2xl font-medium text-foreground">
            Invite not found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This link may be invalid. Ask for a new one.
          </p>
        </>
      ) : info.expired ? (
        <>
          <h1 className="font-display mt-6 text-2xl font-medium text-foreground">
            This invite has expired
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Ask for a new invite link.</p>
        </>
      ) : info.redeemed ? (
        <>
          <h1 className="font-display mt-6 text-2xl font-medium text-foreground">
            This invite has already been used
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Ask for a new invite link.</p>
        </>
      ) : (
        <>
          <span className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-full bg-[var(--gradient-gold)] text-accent-foreground shadow-[var(--shadow-elevated)]">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="font-display mt-4 text-2xl font-medium tracking-tight text-foreground">
            {info.inviter_name ?? "Someone"} invited you as a Wali
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            You'll be able to see and comment on posts in {MODES[info.mode].title}, and join the
            conversation you were invited to. 14 days free, then ${4.99}/mo.
          </p>
          <button
            onClick={accept}
            className="mt-6 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background"
          >
            {user ? "Accept invite" : "Sign up to accept"}
          </button>
        </>
      )}
    </div>
  );
}
