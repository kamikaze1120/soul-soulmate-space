import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Compass,
  MessageCircle,
  User,
  Heart,
  Users,
  ShieldCheck,
  ChevronDown,
  LogOut,
} from "lucide-react";
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
import { LogoMark } from "@/components/logo-mark";
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
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  const meta = MODES[active];

  return (
    <div className="min-h-screen bg-[var(--app-canvas)]">
      {/* Editorial header — serif wordmark + mode chip */}
      <header
        className="sticky top-0 z-30 border-b border-border/50 bg-background/85 backdrop-blur-xl"
        style={{ paddingTop: "var(--safe-area-top)" }}
      >
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-3.5">
          <Link to="/feed" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8 text-sm" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl font-semibold tracking-tight text-foreground">
                Ummah
              </span>
              <span className="eyebrow mt-0.5 text-[9px] text-muted-foreground">
                {meta.tagline}
              </span>
            </span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1.5 text-sm font-medium shadow-[var(--shadow-soft)] transition hover:bg-muted"
                aria-label="Switch mode"
              >
                <span
                  className="grid h-6 w-6 place-items-center rounded-full text-primary-foreground"
                  style={{ background: `var(--mode-${active})` }}
                >
                  {MODE_ICON[active]}
                </span>
                <span className="font-display text-base text-foreground">{meta.title}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-60 rounded-2xl border-border/60 p-1.5 shadow-[var(--shadow-elevated)]"
            >
              <DropdownMenuLabel className="eyebrow px-2 py-1.5 text-muted-foreground">
                Switch mode
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(MODES) as AppMode[]).map((m) => {
                const isAvailable = available.includes(m);
                return (
                  <DropdownMenuItem
                    key={m}
                    disabled={!isAvailable}
                    onSelect={() => isAvailable && setActive(m)}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2"
                  >
                    <span
                      className="grid h-7 w-7 place-items-center rounded-full text-primary-foreground"
                      style={{ background: `var(--mode-${m})` }}
                    >
                      {MODE_ICON[m]}
                    </span>
                    <span className="font-display flex-1 text-base text-foreground">
                      {MODES[m].title}
                    </span>
                    {!isAvailable && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Locked
                      </span>
                    )}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/modes" className="cursor-pointer rounded-xl">
                  Manage modes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleSignOut} className="rounded-xl text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto max-w-xl pb-28">
        <Outlet />
      </main>

      {/* Floating editorial pill */}
      <nav
        className="fixed inset-x-0 z-30 flex justify-center px-4"
        style={{ bottom: "calc(1.25rem + var(--safe-area-bottom))" }}
      >
        <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card/95 p-1.5 shadow-[var(--shadow-elevated)] backdrop-blur-xl">
          {TABS.map((t) => {
            const isActive = path.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all",
                  isActive
                    ? "bg-[var(--gradient-ink)] text-accent shadow-[var(--shadow-ink)]"
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
