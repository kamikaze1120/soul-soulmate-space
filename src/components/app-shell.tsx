import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Home, Compass, MessageCircle, User, Heart, Users, ShieldCheck, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useActiveMode } from "@/lib/active-mode";
import { MODES, type AppMode } from "@/lib/modes";
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
    <div className="min-h-screen bg-[var(--app-canvas)]">
      {/* Top header — wordmark left, mode pill right */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <Link to="/feed" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[var(--gradient-hero)] text-lg font-semibold text-primary-foreground shadow-[var(--shadow-soft)]">
              ﷲ
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-semibold tracking-tight text-foreground">Ummah</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{meta.tagline}</span>
            </span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1.5 rounded-2xl border border-border/70 bg-card px-2.5 py-1.5 text-sm font-medium shadow-[var(--shadow-soft)] transition hover:bg-muted"
                aria-label="Switch mode"
              >
                <span
                  className="grid h-6 w-6 place-items-center rounded-xl text-primary-foreground"
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
      <main className="mx-auto max-w-xl pb-28">
        <Outlet />
      </main>

      {/* Floating pill nav — distinct from IG's full-width bar */}
      <nav className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
        <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card/95 p-1.5 shadow-[var(--shadow-elevated)] backdrop-blur-xl">
          {TABS.map((t) => {
            const isActive = path.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition",
                  isActive
                    ? "bg-foreground text-background shadow-[var(--shadow-soft)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.4 : 1.9} />
                <span className={cn(isActive ? "inline" : "hidden sm:inline")}>{t.label}</span>
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

