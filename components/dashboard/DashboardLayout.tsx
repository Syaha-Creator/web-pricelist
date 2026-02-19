"use client";

import { useTheme } from "./ThemeContext";
import Header from "./Header";

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

  return (
    <div
      className={`relative flex min-h-screen flex-col font-sans transition-colors ${bgClass}`}
    >
      <Header onLogout={onLogout} />
      <main className="relative flex-1 overflow-auto pt-20">{children}</main>
    </div>
  );
}
