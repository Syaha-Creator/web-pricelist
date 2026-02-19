"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { motion } from "framer-motion";
import { ThemeProvider, useTheme } from "@/components/dashboard/ThemeContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ActionGrid from "@/components/dashboard/ActionGrid";
import ProductSection from "@/components/dashboard/ProductSection";
import ToolModals from "@/components/dashboard/ToolModals";
import AuroraOrbs from "@/components/dashboard/AuroraOrbs";
import type { ToolType } from "@/components/dashboard/ToolModals";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

function DashboardContent() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>("void");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/");
      return;
    }
    setIsAuthenticated(true);
    setAccessToken(token);
  }, [router]);

  const handleLogout = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
      try {
        await fetch("/api/sign-out", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: token }),
        });
      } catch {
        // Tetap lanjut logout lokal meskipun revoke gagal
      }
    }
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

  return (
    <>
      <AuroraOrbs />

      <DashboardLayout onLogout={handleLogout}>
        <div className="relative mx-auto max-w-6xl px-6 pb-16">
          <ActionGrid onOpenTool={openTool} />

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
