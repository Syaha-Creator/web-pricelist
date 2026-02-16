"use client";

import { motion } from "framer-motion";
import { useTheme } from "./ThemeContext";

export default function AuroraOrbs() {
  const { isDarkMode } = useTheme();

  const orbTransition = {
    duration: 20,
    repeat: Infinity,
    repeatType: "reverse" as const,
  };

  if (isDarkMode) {
    return (
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={orbTransition}
          className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]"
          aria-hidden
        />
        <motion.div
          animate={{ x: [0, -60, 0], y: [0, 80, 0] }}
          transition={{ ...orbTransition, duration: 22 }}
          className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-violet-500/25 blur-[100px]"
          aria-hidden
        />
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ ...orbTransition, duration: 18 }}
          className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/15 blur-[80px]"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <motion.div
        animate={{ x: [0, 80, 0], y: [0, -40, 0] }}
        transition={orbTransition}
        className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-rose-400/30 blur-[120px]"
        aria-hidden
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
        transition={{ ...orbTransition, duration: 22 }}
        className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-sky-400/30 blur-[100px]"
        aria-hidden
      />
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
        transition={{ ...orbTransition, duration: 18 }}
        className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-400/20 blur-[80px]"
        aria-hidden
      />
    </div>
  );
}
