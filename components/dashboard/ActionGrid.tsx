"use client";

import { motion } from "framer-motion";
import { Trash2, Store, User, FileEdit } from "lucide-react";
import ActionCard from "./ActionCard";
import { useTheme } from "./ThemeContext";

interface ActionGridProps {
  onOpenTool: (tool: "void" | "mutasi" | "ganti-sales" | "edit-order") => void;
}

const actions = [
  { tool: "void" as const, title: "Void Order", icon: Trash2, color: "red" as const },
  { tool: "mutasi" as const, title: "Mutasi Toko", icon: Store, color: "blue" as const },
  { tool: "ganti-sales" as const, title: "Ganti Sales", icon: User, color: "green" as const },
  { tool: "edit-order" as const, title: "Edit Order", icon: FileEdit, color: "blue" as const },
];

export default function ActionGrid({ onOpenTool }: ActionGridProps) {
  const { isDarkMode } = useTheme();
  const headingClass = isDarkMode ? "text-white" : "text-slate-900";
  const subClass = isDarkMode ? "text-gray-400" : "text-slate-500";

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <div className="mb-8">
        <h1
          className={`text-2xl font-bold tracking-wide sm:text-3xl ${headingClass}`}
        >
          Welcome back
        </h1>
        <p className={`mt-1 text-sm ${subClass}`}>
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map(({ tool, title, icon, color }) => (
          <ActionCard
            key={tool}
            title={title}
            icon={icon}
            color={color}
            onClick={() => onOpenTool(tool)}
          />
        ))}
      </div>
    </motion.section>
  );
}
