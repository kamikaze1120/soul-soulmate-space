import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAdminReports, useUpdateReportStatus } from "@/lib/queries/reports";
import { ArrowLeft, Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [{ title: "Reports · Ummah Admin" }] }),
  beforeLoad: async ({ context }) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (error || !data) throw redirect({ to: "/feed" });
  },
  component: ReportsPage,
});

function ReportsPage() {
  const { data: reports, isLoading } = useAdminReports();
  const updateStatus = useUpdateReportStatus();

  return (
    <div className="mx-auto max-w-2xl px-5 py-6">
      <Link
        to="/profile"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="font-display mt-4 text-2xl font-medium tracking-tight text-foreground">
        Reports
      </h1>

      <div className="mt-5 space-y-3">
        {!isLoading && reports?.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No reports.</p>
        )}
        {reports?.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {r.target_type} · {new Date(r.created_at).toLocaleString()}
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">{r.reason}</div>
                {r.details && <div className="mt-1 text-sm text-muted-foreground">{r.details}</div>}
                <div className="mt-1 text-[11px] text-muted-foreground">target: {r.target_id}</div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  r.status === "open"
                    ? "bg-amber-100 text-amber-800"
                    : r.status === "resolved"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {r.status}
              </span>
            </div>
            {r.status === "open" && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => updateStatus.mutate({ id: r.id, status: "resolved" })}
                  className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background"
                >
                  <Check className="h-3 w-3" /> Resolve
                </button>
                <button
                  onClick={() => updateStatus.mutate({ id: r.id, status: "dismissed" })}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground"
                >
                  <X className="h-3 w-3" /> Dismiss
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
