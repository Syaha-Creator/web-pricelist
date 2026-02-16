"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "./ThemeContext";

interface ActionCardProps {
  title: string;
  icon: LucideIcon;
  color: "red" | "blue" | "green";
  onClick: () => void;
}

const colorMap = {
  red: {
    glow: "hover:shadow-red-500/30",
    iconBg: "from-red-500 to-rose-600",
    iconShadow: "shadow-red-500/50",
  },
  blue: {
    glow: "hover:shadow-blue-500/30",
    iconBg: "from-blue-500 to-cyan-500",
    iconShadow: "shadow-blue-500/50",
  },
  green: {
    glow: "hover:shadow-emerald-500/30",
    iconBg: "from-emerald-500 to-teal-500",
    iconShadow: "shadow-emerald-500/50",
  },
};

export default function ActionCard({
  title,
  icon: Icon,
  color,
  onClick,
}: ActionCardProps) {
  const { isDarkMode } = useTheme();
  const style = colorMap[color];

  const glassClass = isDarkMode
    ? "border-white/10 bg-white/5"
    : "border-slate-200/80 bg-white/60";
  const textClass = isDarkMode ? "text-gray-200" : "text-slate-800";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={`flex flex-col items-center justify-center gap-4 rounded-2xl border p-6 backdrop-blur-xl transition-shadow ${glassClass} ${style.glow} hover:shadow-2xl`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${style.iconBg} text-white shadow-lg ${style.iconShadow}`}
      >
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <span
        className={`text-center text-sm font-bold uppercase tracking-wide ${textClass}`}
      >
        {title}
      </span>
    </motion.button>
  );
}
