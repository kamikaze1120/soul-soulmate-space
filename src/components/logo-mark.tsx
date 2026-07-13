import { cn } from "@/lib/utils";

// Solid --primary (not the 3-stop --gradient-hero) so the near-white glyph
// keeps consistent contrast everywhere the gradient's lighter gold end
// previously made it hard to read.
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-arabic grid place-items-center rounded-full bg-primary font-bold leading-none text-primary-foreground shadow-[var(--shadow-soft)]",
        className,
      )}
      aria-label="Bismillah"
    >
      ﷽
    </span>
  );
}
