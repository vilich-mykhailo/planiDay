import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

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

    if (!form.email || !form.password) {
      setError("Вкажіть email та пароль");
      return;
    }

    try {
      setLoading(true);

      // TODO API
      localStorage.setItem("role", "owner");

      navigate("/studio/settings");

    } catch {
      setError("Невірний email або пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh]">
      <div className="mx-auto max-w-md px-4 py-10">

        {/* Header */}
        <div className="text-center">

          <div className="hidden sm:grid mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-black text-white font-extrabold">
            P
          </div>

          <h1 className="mt-4 text-2xl font-extrabold text-gray-900">
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
                setForm(p => ({ ...p, email: e.target.value }))
              }
            />

            <Input
              label="Пароль"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm(p => ({ ...p, password: e.target.value }))
              }
            />


            <div className="flex justify-between text-sm">

              <Link
                to="/forgot-password"
                className="font-bold hover:underline"
              >
                Забули пароль?
              </Link>

            </div>


            {error && (
              <div className="text-sm text-red-600 font-semibold">
                {error}
              </div>
            )}


            <button
              disabled={loading}
              className="w-full rounded-2xl bg-black py-3 text-sm font-extrabold text-white hover:bg-gray-900 transition"
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
