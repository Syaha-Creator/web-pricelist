"use client";

interface GlassCardProps {
  children: React.ReactNode;
  /** Dark mode glass style (e.g. from useTheme) */
  isDark?: boolean;
  className?: string;
  as?: "div" | "article" | "section";
}

export default function GlassCard({
  children,
  isDark = true,
  className = "",
  as: Component = "div",
}: GlassCardProps) {
  const glassClass = isDark
    ? "border-white/10 bg-white/5 backdrop-blur-xl"
    : "border-slate-200/80 bg-white/60 backdrop-blur-xl";

  return (
    <Component
      className={`rounded-2xl border ${glassClass} ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
