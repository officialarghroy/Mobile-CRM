"use client";

import { useState, type FormEvent } from "react";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const fieldLabelClass = "mb-1.5 block text-sm font-normal text-[#64748b]";
const fieldInputClass =
  "w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-[0.9375rem] text-[#0f172a] shadow-none outline-none transition-[border-color,box-shadow] placeholder:text-[#9ca3af] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20";

function signInErrorMessage(error: { message?: string; status?: number; code?: string }): string {
  const code = String(error.code ?? "").toLowerCase();
  const msg = String(error.message ?? "").toLowerCase();
  if (error.status === 429 || msg.includes("rate limit")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
    return "Confirm your email before signing in.";
  }
  if (
    code === "invalid_credentials" ||
    msg.includes("invalid login") ||
    msg.includes("invalid credentials")
  ) {
    return "Invalid login credentials";
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "You appear to be offline.";
  }
  return "Sign in failed. Try again.";
}

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    const password = String(new FormData(form).get("password") ?? "");

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setFormError(signInErrorMessage(error));
        return;
      }

      window.location.assign("/leads");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 flex w-full flex-col" onSubmit={handleSubmit}>
      <div className="mb-6">
        <label htmlFor="login-email" className={fieldLabelClass}>
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={loading}
          className={fieldInputClass}
        />
      </div>

      <div>
        <label htmlFor="login-password" className={fieldLabelClass}>
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            disabled={loading}
            className={`${fieldInputClass} pr-14`}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-1 top-1/2 flex h-11 min-h-11 w-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] disabled:opacity-40"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <RiEyeOffLine className="h-5 w-5" aria-hidden /> : <RiEyeLine className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {formError ? (
        <p className="mt-4 text-center text-sm font-normal text-[#ef4444]" role="alert">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className={`${formError ? "mt-4" : "mt-6"} w-full rounded-xl bg-[#6366f1] px-4 py-3.5 text-center text-base font-bold text-white shadow-none outline-none transition-[filter,opacity] hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
