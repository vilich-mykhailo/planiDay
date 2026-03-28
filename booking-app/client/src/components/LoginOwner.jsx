// LoginOwner.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { api } from "../api/http";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Input({ label, icon, error, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>

      <div
        className={cn(
          "mt-2 flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 transition-all",
          error
            ? "border-red-200 bg-red-50/40 focus-within:border-red-300 focus-within:ring-4 focus-within:ring-red-100"
            : "border-stone-200 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-400/10",
        )}
      >
        {icon && <span className="text-stone-400">{icon}</span>}

        <input
          {...props}
          className="w-full bg-transparent text-sm font-medium text-stone-800 outline-none placeholder:text-stone-400"
        />
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-500">{error}</p>
      )}
    </label>
  );
}

export default function LoginOwner() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Вкажіть email та пароль");
      return;
    }

    try {
      setLoading(true);

      const data = await api("/auth/owner/login", {
        method: "POST",
        body: {
          email: form.email,
          password: form.password,
        },
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", "owner");

      window.dispatchEvent(new Event("auth-changed"));

      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Невірний email або пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/20">
      <div className="w-full max-w-6xl px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-md">
          {/* Header */}
          <div className="text-center">

            <h1 className="mt-14 text-xl font-black tracking-tight text-stone-800 leading-[1.05] sm:mt-14 sm:text-3xl md:text-4xl">
              Вхід для власника салону
            </h1>

            <p className="mt-3 hidden text-sm leading-6 text-stone-600 sm:block">
              Керуйте записами та розвивайте свій бізнес
            </p>
          </div>

          {/* Card */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)] sm:mt-8 sm:rounded-3xl">
            <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

            <div className="p-4 sm:p-6 md:p-7">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="studio@email.com"
                  value={form.email}
                  error={!!error}
                  icon={<Mail className="h-4 w-4" />}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />

                <Input
                  label="Пароль"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  error={!!error}
                  icon={<Lock className="h-4 w-4" />}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                />

                <div className="flex justify-between text-xs sm:text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-semibold text-stone-800 transition hover:text-emerald-700 hover:underline"
                  >
                    Забули пароль?
                  </Link>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    {error}
                  </div>
                )}

                <button
                  disabled={loading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-60 sm:h-auto sm:rounded-2xl sm:px-5 sm:py-3.5"
                >
                  {loading ? (
                    "Вхід..."
                  ) : (
                    <>
                      Увійти
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 border-t border-stone-100 pt-4 text-center sm:mt-6 sm:pt-5">
                <p className="text-xs text-stone-600 sm:text-sm">
                  Немає салону?{" "}
                  <Link
                    to="/register-owner"
                    className="font-bold text-stone-800 transition hover:text-emerald-700 hover:underline"
                  >
                    Створити салон
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
