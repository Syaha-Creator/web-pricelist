"use client";

import { motion } from "framer-motion";
import UserMenu from "./UserMenu";
import { useTheme } from "./ThemeContext";

interface HeaderProps {
  onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  const { isDarkMode } = useTheme();
  const logoClass = isDarkMode ? "text-white" : "text-slate-900";

  return (
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
  );
}
