import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

import { api } from "../api/http";
import salonHero from "../assets/salon-login-hero.png";
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Input({ label, icon, error, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-black text-[#202020] sm:text-[14px]">
        {label}
      </span>

      <div
        className={cn(
          "flex h-12 items-center gap-2.5 rounded-[16px] border bg-white px-3.5 transition-all sm:h-14 sm:gap-3 sm:rounded-[18px] sm:px-4",
          error
            ? "border-[#ef4444]/40 ring-4 ring-[#ef4444]/10"
            : "border-[#eadfce] focus-within:border-[#ff6200] focus-within:ring-4 focus-within:ring-[#ff6200]/10",
        )}
      >
        <span className="text-[#8a847d]">{icon}</span>

        <input
          {...props}
          className="w-full bg-transparent text-[13px] font-bold text-[#202020] outline-none placeholder:text-[#b8afa5] sm:text-[14px]"
        />
      </div>
    </label>
  );
}

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("client");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const isOwner = role === "owner";

  const heroTitle = useMemo(() => {
    return isOwner
      ? "Керуйте своєю студією"
      : "Онлайн-запис у вашу улюблену студію краси";
  }, [isOwner]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Вкажіть email та пароль");
      return;
    }

    try {
      setLoading(true);

      if (isOwner) {
        const data = await api("/auth/owner/login", {
          method: "POST",
          body: {
            email: form.email.trim(),
            password: form.password,
          },
        });

        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "owner");

        const studios = await api("/owner", {
          token: data.token,
        });

        if (!Array.isArray(studios) || studios.length === 0) {
          localStorage.removeItem("studioId");
          throw new Error("Не знайдено студій");
        }

        localStorage.setItem("studioId", studios[0].id);

        window.dispatchEvent(new Event("auth-changed"));

        navigate("/dashboard");
        return;
      }

      const data = await api("/auth/client/login", {
        method: "POST",
        body: {
          email: form.email.trim(),
          password: form.password,
        },
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.kind || "client");

      window.dispatchEvent(new Event("auth-changed"));

      navigate("/");
    } catch (err) {
      setError(err?.message || "Невірний email або пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#f8f5f1] p-0 sm:p-3 lg:p-5">
      <div className="mx-auto grid min-h-[100dvh] max-w-[1700px] overflow-hidden bg-[#fcfbf9] sm:min-h-[calc(100dvh-24px)] sm:rounded-[30px] sm:border sm:border-[#eadfce] sm:shadow-[0_30px_90px_rgba(15,23,42,0.08)] lg:grid-cols-[520px_1fr] lg:rounded-[36px]">
        <aside className="relative hidden overflow-hidden lg:block">
          <img
            src={salonHero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/65" />

          <div className="relative flex h-full flex-col px-12 pb-20 pt-[31%] text-white">
            <div>
              <p className="text-[48px] font-black leading-none tracking-[-0.065em]">
                Plani<span className="text-[#fc511e]">Day</span>
              </p>
              <p className="mt-9 max-w-[275px] text-[18px] font-semibold leading-[1.6] text-white/95">
                Онлайн-запис у вашу
                <br />
                улюблену студію краси
              </p>
            </div>

            <div className="mt-auto space-y-8 text-[15px] font-medium leading-6">
              <div className="flex items-start gap-5">
                <CalendarDays
                  className="mt-1 h-8 w-8 shrink-0 text-[#f8783b]"
                  strokeWidth={1.8}
                />
                <p>
                  Зручний онлайн-запис
                  <br />
                  24/7 у кілька кліків
                </p>
              </div>
              <div className="flex items-start gap-5">
                <ShieldCheck
                  className="mt-1 h-8 w-8 shrink-0 text-[#f8783b]"
                  strokeWidth={1.8}
                />
                <p>
                  Безпечно та надійно
                  <br />
                  Ваші дані під захистом
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
          <div className="w-full max-w-[560px] max-[639px]:pb-[calc(env(safe-area-inset-bottom)+18px)]">
            <div className="text-center">
              <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-[#202020] text-[15px] font-black text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] sm:hidden">
                P
              </div>

              <h1 className="text-[28px] font-black leading-[1] tracking-[-0.06em] text-[#202020] sm:text-[42px]">
                Вітаємо знову! 👋
              </h1>

              <p className="mt-2 text-[13px] font-semibold text-[#77716b] sm:mt-3 sm:text-[16px]">
                Увійдіть у свій акаунт, щоб продовжити
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setRole("client");
                  setError("");
                }}
                className={cn(
                  "flex h-[54px] items-center justify-center gap-2 rounded-[18px] border text-[12px] font-black transition-all sm:h-16 sm:gap-3 sm:rounded-[22px] sm:text-[15px]",
                  !isOwner
                    ? "border-[#ff6200]/35 bg-[#fff7f1] text-[#ff6200]"
                    : "border-[#eadfce] bg-white text-[#77716b]",
                )}
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="truncate">Для клієнтів</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole("owner");
                  setError("");
                }}
                className={cn(
                  "flex h-[54px] items-center justify-center gap-2 rounded-[18px] border text-[12px] font-black transition-all sm:h-16 sm:gap-3 sm:rounded-[22px] sm:text-[15px]",
                  isOwner
                    ? "border-[#ff6200]/35 bg-[#fff7f1] text-[#ff6200]"
                    : "border-[#eadfce] bg-white text-[#77716b]",
                )}
              >
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="truncate">Для власників</span>
              </button>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:mt-7 sm:rounded-[32px] sm:p-7 sm:shadow-[0_16px_44px_rgba(15,23,42,0.05)]">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <Input
                  label="Email"
                  type="email"
                  placeholder="Введіть ваш email"
                  icon={<Mail className="h-4 w-4 sm:h-5 sm:w-5" />}
                  value={form.email}
                  error={!!error}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      email: e.target.value,
                    }))
                  }
                />

                <Input
                  label="Пароль"
                  type="password"
                  placeholder="Введіть пароль"
                  icon={<Lock className="h-4 w-4 sm:h-5 sm:w-5" />}
                  value={form.password}
                  error={!!error}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      password: e.target.value,
                    }))
                  }
                />

                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-[13px] font-black text-[#ff6200] transition hover:opacity-70 sm:text-[14px]"
                  >
                    Забули пароль?
                  </Link>
                </div>

                {error && (
                  <div className="rounded-[16px] border border-[#ef4444]/30 bg-[#fff1f1] px-4 py-3 text-[12px] font-bold text-[#ef4444] sm:rounded-[18px] sm:text-[13px]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-[#ff6200] text-[14px] font-black text-white shadow-[0_16px_34px_rgba(255,98,0,0.24)] transition hover:bg-[#f25c00] active:scale-[0.98] disabled:opacity-50 sm:h-15 sm:rounded-[20px] sm:text-[16px]"
                >
                  {loading ? (
                    "Вхід..."
                  ) : (
                    <>
                      Увійти
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-3 sm:mt-8 sm:gap-4">
                <div className="h-px flex-1 bg-[#ece5dc]" />

                <span className="whitespace-nowrap text-[12px] font-semibold text-[#8a847d] sm:text-[14px]">
                  або продовжити з
                </span>

                <div className="h-px flex-1 bg-[#ece5dc]" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6">
                <button
                  type="button"
                  className="flex h-12 items-center justify-center rounded-[16px] border border-[#eadfce] bg-white text-[13px] font-black text-[#202020] transition hover:bg-[#faf7f3] sm:h-14 sm:rounded-[18px] sm:text-[15px]"
                >
                  Google
                </button>

                <button
                  type="button"
                  className="flex h-12 items-center justify-center rounded-[16px] border border-[#eadfce] bg-white text-[13px] font-black text-[#202020] transition hover:bg-[#faf7f3] sm:h-14 sm:rounded-[18px] sm:text-[15px]"
                >
                  Apple
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-[13px] font-semibold text-[#77716b] sm:mt-8 sm:text-[15px]">
              {isOwner ? "Немає салону?" : "Ще не маєте акаунту?"}{" "}
              <Link
                to={isOwner ? "/register-owner" : "/register"}
                className="font-black text-[#ff6200]"
              >
                {isOwner ? "Створити салон" : "Зареєструватися"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}