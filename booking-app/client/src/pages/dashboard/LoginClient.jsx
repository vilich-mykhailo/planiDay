import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../../api/http";

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-900">{label}</span>
      <input
        {...props}
        className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/30"
      />
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
    <main className="min-h-[100dvh]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-md">
          {/* header */}
          <div className="text-center">
            <div className="hidden sm:grid mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-black text-white font-extrabold">
              P
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-gray-900">
              Вхід для клієнтів
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Увійди, щоб швидко записуватися та керувати бронюваннями.
            </p>
          </div>

          {/* card */}
          <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="name@email.com"
                value={form.email}
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
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
              />

              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Запам’ятати мене
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm font-bold text-gray-900 hover:underline"
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
                className="w-full rounded-2xl bg-black px-5 py-3.5 text-sm font-extrabold text-white hover:bg-gray-900 disabled:opacity-50 transition"
              >
                {loading ? "Вхід..." : "Увійти"}
              </button>
            </form>

            <div className="mt-6 border-t border-gray-200 pt-5 text-center">
              <p className="text-sm text-gray-600">
                Немає акаунта?{" "}
                <Link
                  to="/register"
                  className="font-extrabold text-gray-900 hover:underline"
                >
                  Зареєструватися
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            Продовжуючи, ти погоджуєшся з умовами сервісу та політикою
            конфіденційності.
          </p>
        </div>
      </div>
    </main>
  );
}
