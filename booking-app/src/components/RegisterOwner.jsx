import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Input({ label, ...props }) {
  return (
    <label className="block">

      <span className="text-sm font-semibold text-gray-900">
        {label}
      </span>

      <input
        {...props}
        className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-black focus:ring-2 focus:ring-black/30"
      />

    </label>
  );
}

export default function RegisterOwner() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {

    e.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.password) {
      setError("Заповніть всі поля");
      return;
    }

    try {

      setLoading(true);

      // TODO API

      localStorage.setItem("role", "owner");

      navigate("/studio/settings");

    } catch {

      setError("Помилка реєстрації");

    } finally {

      setLoading(false);

    }

  }

  return (
    <main className="min-h-[100dvh]">

      <div className="mx-auto max-w-md px-4 py-10">

        <div className="text-center">

          <div className="hidden sm:grid mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-black text-white font-extrabold">
            P
          </div>

          <h1 className="mt-4 text-2xl font-extrabold text-gray-900">
            Створити салон
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Почніть приймати онлайн-записи вже сьогодні
          </p>

        </div>


        <div className="mt-8 rounded-3xl bg-white border border-gray-200 p-6">

          <form onSubmit={handleSubmit} className="space-y-4">

            <Input
              label="Назва салону"
              placeholder="Beauty Studio"
              value={form.name}
              onChange={(e) =>
                setForm(p => ({ ...p, name: e.target.value }))
              }
            />

            <Input
              label="Email"
              type="email"
              placeholder="studio@email.com"
              value={form.email}
              onChange={(e) =>
                setForm(p => ({ ...p, email: e.target.value }))
              }
            />

            <Input
              label="Телефон"
              type="tel"
              placeholder="+380..."
              value={form.phone}
              onChange={(e) =>
                setForm(p => ({ ...p, phone: e.target.value }))
              }
            />

            <Input
              label="Пароль"
              type="password"
              placeholder="Мінімум 6 символів"
              value={form.password}
              onChange={(e) =>
                setForm(p => ({ ...p, password: e.target.value }))
              }
            />


            <label className="flex gap-2 text-sm">

              <input type="checkbox" required />

              <span>

                Я погоджуюся з{" "}

                <Link to="/terms" className="font-bold hover:underline">
                  умовами
                </Link>

                {" "}та{" "}

                <Link to="/privacy" className="font-bold hover:underline">
                  політикою конфіденційності
                </Link>

              </span>

            </label>


            {error && (
              <div className="text-sm text-red-600 font-semibold">
                {error}
              </div>
            )}


            <button
              disabled={loading}
              className="w-full rounded-2xl bg-black py-3 text-sm font-extrabold text-white hover:bg-gray-900"
            >
              {loading ? "Створення..." : "Створити салон"}
            </button>

          </form>


          <div className="mt-6 text-center text-sm text-gray-600">

            Вже маєте акаунт?{" "}

            <Link
              to="/login-owner"
              className="font-extrabold text-black hover:underline"
            >
              Увійти
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}
