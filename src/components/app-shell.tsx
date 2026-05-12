import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Home, Compass, MessageCircle, User, Heart, Users, ShieldCheck, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useActiveMode } from "@/lib/active-mode";
import { MODES, type AppMode } from "@/lib/modes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const MODE_ICON: Record<AppMode, React.ReactNode> = {
  matrimonial: <Heart className="h-4 w-4" />,
  sisterhood: <Users className="h-4 w-4" />,
  brotherhood: <ShieldCheck className="h-4 w-4" />,
};

const TABS = [
  { to: "/feed" as const, label: "Feed", icon: Home },
  { to: "/discover" as const, label: "Discover", icon: Compass },
  { to: "/messages" as const, label: "Chats", icon: MessageCircle },
  { to: "/profile" as const, label: "Me", icon: User },
];

export function AppShell() {
  const { signOut } = useAuth();
  const { active, setActive, available } = useActiveMode();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const meta = MODES[active];

  return (
    <div className="min-h-screen bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <Link to="/feed" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--gradient-hero)] text-primary-foreground">
              ﷲ
            </span>
            <span className="text-foreground">Ummah</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-[var(--shadow-soft)] transition hover:bg-muted"
                aria-label="Switch mode"
              >
                <span
                  className="grid h-5 w-5 place-items-center rounded-full text-primary-foreground"
                  style={{ background: `var(--mode-${active})` }}
                >
                  {MODE_ICON[active]}
                </span>
                <span className="text-foreground">{meta.title}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Switch mode</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(MODES) as AppMode[]).map((m) => {
                const isAvailable = available.includes(m);
                return (
                  <DropdownMenuItem
                    key={m}
                    disabled={!isAvailable}
                    onSelect={() => isAvailable && setActive(m)}
                    className="flex items-center gap-2"
                  >
                    <span
                      className="grid h-5 w-5 place-items-center rounded-full text-primary-foreground"
                      style={{ background: `var(--mode-${m})` }}
                    >
                      {MODE_ICON[m]}
                    </span>
                    <span className="flex-1">{MODES[m].title}</span>
                    {!isAvailable && <span className="text-xs text-muted-foreground">Locked</span>}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/modes" className="cursor-pointer">Manage modes</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => signOut()} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Page */}
      <main className="mx-auto max-w-xl pb-24">
        <Outlet />
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          {TABS.map((t) => {
            const isActive = path.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-6 w-6", isActive && "scale-110")} strokeWidth={isActive ? 2.4 : 1.8} />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function ModeBadge({ mode, className }: { mode: AppMode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary-foreground",
        className,
      )}
      style={{ background: `var(--mode-${mode})` }}
    >
      {MODE_ICON[mode]}
      {MODES[mode].title}
    </span>
  );
}

export function unused() {
  return Button;
}
