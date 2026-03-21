import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { api } from "../../api/http";

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

      {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
    </label>
  );
}

export default function LoginClient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Вкажи email та пароль.");
      return;
    }

    try {
      setLoading(true);

      const data = await api("/auth/client/login", {
        method: "POST",
        body: {
          email: form.email.trim(),
          password: form.password,
        },
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.kind);

      window.dispatchEvent(new Event("auth-changed"));

      navigate("/");
    } catch (err) {
      setError(err?.message || "Невірний email або пароль.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] mt-10 bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/20">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-md">
          {/* header */}
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Кабінет клієнта
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-stone-800 sm:text-4xl">
              Вхід для клієнтів
            </h1>

            <p className="mt-3 text-sm leading-6 text-stone-600">
              Увійди, щоб швидко записуватися та керувати бронюваннями.
            </p>
          </div>

          {/* card */}
          <div className="mt-8 overflow-hidden rounded-3xl border border-stone-200/60 bg-white shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]">
            <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

            <div className="p-6 sm:p-7">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@email.com"
                  value={form.email}
                  error={error ? true : false}
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
                  error={error ? true : false}
                  icon={<Lock className="h-4 w-4" />}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                />

                <div className="flex items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-stone-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Запам’ятати мене
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-stone-800 transition hover:text-emerald-700 hover:underline"
                  >
                    Забули пароль?
                  </Link>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50"
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

              <div className="mt-6 border-t border-stone-100 pt-5 text-center">
                <p className="text-sm text-stone-600">
                  Немає акаунта?{" "}
                  <Link
                    to="/register"
                    className="font-bold text-stone-800 transition hover:text-emerald-700 hover:underline"
                  >
                    Зареєструватися
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-stone-500">
            Продовжуючи, ти погоджуєшся з умовами сервісу та політикою
            конфіденційності.
          </p>
        </div>
      </div>
    </main>
  );
}