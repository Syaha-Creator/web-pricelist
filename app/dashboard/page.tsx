"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import AlitaChat from "@/components/AlitaChat";

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

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

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
    router.replace("/");
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-blue-50/50 to-indigo-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-linear-to-br from-slate-50 via-blue-50/50 to-indigo-50">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-bold text-slate-800">Alita Assistant</h1>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        <AlitaChat accessToken={accessToken} />
      </main>
    </div>
  );
}
