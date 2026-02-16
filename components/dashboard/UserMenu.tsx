"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "./ThemeContext";

interface UserMenuProps {
  onLogout: () => void;
}

export default function UserMenu({ onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const glassClass = isDarkMode
    ? "border-white/10 bg-slate-900/80 backdrop-blur-xl"
    : "border-slate-200/80 bg-white/80 backdrop-blur-xl";
  const textClass = isDarkMode ? "text-gray-200" : "text-slate-800";
  const hoverClass = isDarkMode
    ? "hover:bg-white/10"
    : "hover:bg-slate-100";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
        className={
          isDarkMode
            ? "flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 backdrop-blur-xl transition hover:bg-white/10 hover:ring-white/20"
            : "flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/60 ring-1 ring-slate-300/60 backdrop-blur-xl transition hover:bg-slate-300/60 hover:ring-slate-400/60"
        }
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/80 to-violet-500/80 text-sm font-semibold text-white">
          U
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border ${glassClass} py-1 shadow-xl`}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${textClass} ${hoverClass}`}
            >
              <User className="h-4 w-4 shrink-0 opacity-70" />
              Profile
            </button>
            <button
              type="button"
              onClick={() => {
                toggleTheme();
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${textClass} ${hoverClass}`}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 shrink-0 opacity-70" />
              ) : (
                <Moon className="h-4 w-4 shrink-0 opacity-70" />
              )}
              {isDarkMode ? "Light mode" : "Dark mode"}
            </button>
            <div
              className={`my-1 h-px ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`}
              role="separator"
            />
            <button
              type="button"
              onClick={() => {
                onLogout();
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
