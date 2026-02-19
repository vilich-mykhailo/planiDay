import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Input({ label, hint, ...props }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        {hint && <span className="text-xs text-gray-500">{hint}</span>}
      </div>

      <input
        {...props}
        className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/30"
      />
    </label>
  );
}

export default function RegisterClient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
const [form, setForm] = useState({ name: "", email: "", password: "" });

  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

if (
  !form.name.trim() ||
  !form.email.trim() ||
  !form.phone.trim() ||
  !form.password.trim()
) {
  setError("Заповни всі поля.");
  return;
}

    if (form.password.length < 6) {
      setError("Пароль має бути мінімум 6 символів.");
      return;
    }

    try {
      setLoading(true);

      // TODO: тут твій запит на бекенд
      // await api.registerClient(form)

      // демо:
      localStorage.setItem("role", "client");
      navigate("/");
    } catch {
      setError("Не вдалося створити акаунт. Спробуй ще раз.");
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
              Реєстрація клієнта
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Створи акаунт, щоб записуватися та зберігати улюблені студії.
            </p>
          </div>

          {/* card */}
          <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Ім’я"
                placeholder="Напр. Анна"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
<Input
  label="Номер телефону"
  type="tel"
  autoComplete="tel"
  placeholder="+380 99 123 45 67"
  value={form.phone}
  onChange={(e) =>
    setForm((p) => ({ ...p, phone: e.target.value }))
  }
/>

              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="name@email.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />

              <Input
                label="Пароль"
                type="password"
                autoComplete="new-password"
                placeholder="Мінімум 6 символів"
                hint="мін. 6"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
              />

              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-gray-300" />
                <span>
                  Я погоджуюся з{" "}
                  <Link to="/terms" className="font-bold text-gray-900 hover:underline">
                    умовами
                  </Link>{" "}
                  та{" "}
                  <Link to="/privacy" className="font-bold text-gray-900 hover:underline">
                    політикою конфіденційності
                  </Link>
                  .
                </span>
              </label>

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
                {loading ? "Створення..." : "Зареєструватися"}
              </button>
            </form>

            <div className="mt-6 border-t border-gray-200 pt-5 text-center">
              <p className="text-sm text-gray-600">
                Вже є акаунт?{" "}
                <Link to="/login" className="font-extrabold text-gray-900 hover:underline">
                  Увійти
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            Дані захищені. Ми не публікуємо твій email.
          </p>
        </div>
      </div>
    </main>
  );
}
