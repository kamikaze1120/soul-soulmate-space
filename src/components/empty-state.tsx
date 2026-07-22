import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = Sparkles,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="px-6 py-16 text-center"
    >
      <div className="relative mx-auto mb-5 grid h-16 w-16 place-items-center">
        <div className="absolute inset-0 rounded-full bg-[var(--gradient-gold)] opacity-20 blur-md" />
        <div className="relative grid h-14 w-14 place-items-center rounded-full border border-border bg-card shadow-[var(--shadow-soft)]">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
      <p className="font-display text-xl font-medium tracking-tight text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}
