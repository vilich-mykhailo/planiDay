// RegisterOwner.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Mail, Lock, Phone, Building2, ArrowRight } from "lucide-react";
import { api } from "../api/http";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const STORAGE_KEY = "registerOwnerForm";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

function Input({ label, hint, icon, error, ...props }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-stone-700 sm:text-sm">
          {label}
        </span>

        {hint && (
          <span className="text-[11px] text-stone-400 sm:text-xs">{hint}</span>
        )}
      </div>

      <div
        className={cn(
          "mt-1.5 flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2.5 transition-all sm:mt-2 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 md:py-3.5",
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
    </label>
  );
}

export default function RegisterOwner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(() => {
    const shouldPreserve = location.state?.preserveForm === true;

    if (!shouldPreserve) {
      sessionStorage.removeItem(STORAGE_KEY);
      return INITIAL_FORM;
    }

    const saved = sessionStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }

    return INITIAL_FORM;
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

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

    if (form.password.trim().length < 6) {
      setError("Пароль має бути мінімум 6 символів.");
      return;
    }

    try {
      setLoading(true);

      const data = await api("/auth/owner/register", {
        method: "POST",
        body: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          password: form.password,
        },
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.kind);

      window.dispatchEvent(new Event("auth-changed"));

      sessionStorage.removeItem(STORAGE_KEY);
      navigate("/dashboard/studio");
    } catch (err) {
      setError(err?.message || "Не вдалося створити акаунт. Спробуй ще раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/20">
      <div className="w-full max-w-6xl px-4 py-8 sm:py-10 md:py-12">
        <div className="mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <div className="text-center">
            <h1 className="mt-14 text-xl font-black leading-[1.05] tracking-tight text-stone-800 sm:mt-10 sm:text-3xl md:mt-16 md:text-4xl">
              <span className="block">Створити салон</span>
            </h1>

            <p className="mt-2 hidden text-sm leading-6 text-stone-600 sm:block">
              Почніть приймати онлайн-записи вже сьогодні.
            </p>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)] sm:mt-6 sm:rounded-3xl">
            <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

            <div className="p-4 sm:p-6 md:p-8">
              <form
                onSubmit={handleSubmit}
                className="space-y-3 sm:space-y-3.5"
              >
                <Input
                  label="Назва салону"
                  placeholder="Beauty Studio"
                  autoComplete="organization"
                  icon={<Building2 className="h-4 w-4" />}
                  error={!!error}
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                />

                <Input
                  label="Телефон"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+380 99 123 45 67"
                  icon={<Phone className="h-4 w-4" />}
                  error={!!error}
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />

                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="studio@email.com"
                  icon={<Mail className="h-4 w-4" />}
                  error={!!error}
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />

                <Input
                  label="Пароль"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Мінімум 6 символів"
                  hint="мін. 6"
                  icon={<Lock className="h-4 w-4" />}
                  error={!!error}
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                />

                <label className="flex items-start gap-2 text-xs text-stone-600 sm:text-sm">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    Я погоджуюся з{" "}
                    <Link
                      to="/termsowner"
                      state={{
                        from: location.pathname,
                        preserveForm: true,
                      }}
                      className="font-semibold text-stone-800 hover:text-emerald-700 hover:underline"
                    >
                      умовами
                    </Link>{" "}
                    та{" "}
                    <Link
                      to="/privacyowner"
                      state={{
                        from: location.pathname,
                        preserveForm: true,
                      }}
                      className="font-semibold text-stone-800 hover:text-emerald-700 hover:underline"
                    >
                      політикою конфіденційності
                    </Link>
                  </span>
                </label>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.99] disabled:opacity-50 sm:h-auto sm:rounded-2xl sm:px-6 sm:py-3.5 md:py-4"
                >
                  {loading ? (
                    "Створення..."
                  ) : (
                    <>
                      Створити салон
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 border-t border-stone-100 pt-4 text-center sm:mt-5 sm:pt-4">
                <p className="text-xs text-stone-600 sm:text-sm">
                  Вже є акаунт?{" "}
                  <Link
                    to="/login-owner"
                    className="font-bold text-stone-800 hover:text-emerald-700 hover:underline"
                  >
                    Увійти
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] leading-5 text-stone-500 sm:mt-4 sm:text-xs">
            Після реєстрації ви зможете налаштувати профіль студії, послуги,
            графік роботи та прийом онлайн-записів.
          </p>
        </div>
      </div>
    </main>
  );
}