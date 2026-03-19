import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/http"; // ✅ додали

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-900">{label}</span>

      <input
        {...props}
        className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/30"
      />
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

      // ✅ Реальний login
      const data = await api("/auth/owner/login", {
        method: "POST",
        body: {
          email: form.email,
          password: form.password,
        },
      });

      // ✅ зберігаємо токен + роль
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", "owner");

      window.dispatchEvent(new Event("auth-changed")); // 👈 ОСЬ СЮДИ

      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Невірний email або пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] space-y-6">
      <div className="mx-auto max-w-md px-4 py-10 ">
        {/* Header */}
        <div className="text-center ">
          <h1 className="mt-12 text-2xl font-extrabold text-gray-900">
            Вхід для власників салону
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Керуйте записами та розвивайте свій бізнес
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-3xl bg-white border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="studio@email.com"
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

            <div className="flex justify-between text-sm">
              <Link to="/forgot-password" className="font-bold hover:underline">
                Забули пароль?
              </Link>
            </div>

            {error && (
              <div className="text-sm text-red-600 font-semibold">{error}</div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-black py-3 text-sm font-extrabold text-white hover:bg-gray-900 transition disabled:opacity-60"
            >
              {loading ? "Вхід..." : "Увійти"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Немає салону?{" "}
            <Link
              to="/register-owner"
              className="font-extrabold text-black hover:underline"
            >
              Створити салон
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
