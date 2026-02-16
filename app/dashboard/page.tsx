"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Store, User } from "lucide-react";
import { Inter } from "next/font/google";
import { motion } from "framer-motion";
import { ThemeProvider, useTheme } from "@/components/dashboard/ThemeContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProductSection from "@/components/dashboard/ProductSection";
import ActionCard from "@/components/dashboard/ActionCard";
import ToolModals from "@/components/dashboard/ToolModals";
import AuroraOrbs from "@/components/dashboard/AuroraOrbs";
import type { ToolType } from "@/components/dashboard/ToolModals";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

function getGreetingDate(): string {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function DashboardContent() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>("void");
  const [greetingDate, setGreetingDate] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/");
      return;
    }
    setIsAuthenticated(true);
    setAccessToken(token);
    setGreetingDate(getGreetingDate());
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
    router.replace("/");
  };

  const openTool = (tool: ToolType) => {
    setActiveTool(tool);
    setModalOpen(true);
  };

  if (isAuthenticated === null) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          isDarkMode ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        <div
          className={`h-8 w-8 animate-spin rounded-full border-2 ${
            isDarkMode
              ? "border-slate-600 border-t-cyan-400"
              : "border-slate-300 border-t-blue-500"
          }`}
        />
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null;
  }

  const headingClass = isDarkMode ? "text-white" : "text-slate-900";
  const subClass = isDarkMode ? "text-gray-400" : "text-slate-500";

  return (
    <>
      <AuroraOrbs />

      <DashboardLayout onLogout={handleLogout}>
        <div className="relative mx-auto max-w-6xl px-6 pb-16">
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
              <p className={`mt-1 text-sm ${subClass}`}>{greetingDate}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ActionCard
                title="Void Order"
                icon={Trash2}
                color="red"
                onClick={() => openTool("void")}
              />
              <ActionCard
                title="Mutasi Toko"
                icon={Store}
                color="blue"
                onClick={() => openTool("mutasi")}
              />
              <ActionCard
                title="Ganti Sales"
                icon={User}
                color="green"
                onClick={() => openTool("ganti-sales")}
              />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-10"
          >
            <ProductSection />
          </motion.section>
        </div>
      </DashboardLayout>

      <ToolModals
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tool={activeTool}
        accessToken={accessToken}
      />
    </>
  );
}

export default function DashboardPage() {
  return (
    <ThemeProvider defaultTheme="dark">
      <div
        className={`${inter.variable} font-sans`}
        style={{
          fontFamily:
            "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <DashboardContent />
      </div>
    </ThemeProvider>
  );
}
