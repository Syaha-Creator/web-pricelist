"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import InputField from "@/components/InputField";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/proxy-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          data?.message ??
          data?.error ??
          (typeof data === "string" ? data : "Login failed");
        throw new Error(
          typeof errorMessage === "string" ? errorMessage : "Login failed"
        );
      }

      const accessToken =
        data?.access_token ?? data?.accessToken ?? data?.token;
      if (accessToken && typeof window !== "undefined") {
        localStorage.setItem("access_token", accessToken);
      }

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 font-sans">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white px-6 py-8 shadow-lg shadow-slate-200/80 sm:px-8 sm:py-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Alita Pricelist
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to your account
            </p>
          </div>

          {error && (
            <div
              id="login-error"
              role="alert"
              aria-live="polite"
              className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <InputField
              id="username"
              label="Email"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoComplete="username"
              aria-label="Email"
              ariaDescribedBy={error ? "login-error" : undefined}
              error={!!error}
              placeholder="Enter your email"
              prefixIcon={<User className="h-5 w-5" aria-hidden size={20} />}
            />

            <InputField
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
              aria-label="Password"
              ariaDescribedBy={error ? "login-error" : undefined}
              error={!!error}
              placeholder="Enter your password"
              prefixIcon={<Lock className="h-5 w-5" aria-hidden size={20} />}
              suffixElement={
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className="text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden size={20} />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden size={20} />
                  )}
                </button>
              }
            />

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              aria-live="polite"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2
                    className="h-5 w-5 animate-spin"
                    aria-hidden
                    size={20}
                  />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Enter your credentials to sign in
        </p>
      </div>
    </div>
  );
}
