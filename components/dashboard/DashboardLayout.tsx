"use client";

import { motion } from "framer-motion";
import { useTheme } from "./ThemeContext";
import UserMenu from "./UserMenu";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function DashboardLayout({
  children,
  onLogout,
}: DashboardLayoutProps) {
  const { isDarkMode } = useTheme();

  const bgClass = isDarkMode
    ? "bg-slate-950 text-gray-200"
    : "bg-slate-50 text-slate-800";
  const logoClass = isDarkMode ? "text-white" : "text-slate-900";

  return (
    <div
      className={`relative flex min-h-screen flex-col font-sans transition-colors ${bgClass}`}
    >
      <header className="fixed left-0 right-0 top-0 z-40 flex shrink-0 items-center justify-between px-6 py-4">
        <motion.span
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className={`text-xl font-bold tracking-tight ${logoClass}`}
        >
          Alita
        </motion.span>
        <UserMenu onLogout={onLogout} />
      </header>

      <main className="relative flex-1 overflow-auto pt-20">{children}</main>
    </div>
  );
}
