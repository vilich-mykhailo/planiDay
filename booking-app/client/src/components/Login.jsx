import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { continuePendingAuthAction } from "../utils/pendingAuthAction";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Lock,
  Mail,
  PhoneOff,
  ShieldCheck,
  User,
  Eye,
  EyeOff,
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
const [showPassword, setShowPassword] = useState(false);
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

continuePendingAuthAction(navigate);
    } catch (err) {
      setError(err?.message || "Невірний email або пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] p-0 sm:p-3 lg:p-5">
      <div className="mx-auto grid min-h-[100dvh] max-w-[1700px] overflow-hidden sm:min-h-[calc(100dvh-24px)] sm:rounded-[30px] sm:border sm:border-[#eadfce] sm:shadow-[0_30px_90px_rgba(15,23,42,0.08)] lg:grid-cols-[520px_1fr] lg:rounded-[36px]">
        <aside className="relative hidden overflow-hidden lg:block">
          <img
            src={salonHero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/65" />

          <div className="relative flex h-full flex-col px-12 pb-20 pt-[31%] text-white">
<div className="relative flex flex-col items-center text-center">
  <div
    aria-hidden="true"
    className="
      pointer-events-none absolute left-1/2 top-1/2
      h-[340px] w-[430px]
      -translate-x-1/2 -translate-y-1/2
      rounded-full
      bg-black/25
      blur-[65px]
    "
  />

  <div className="relative z-10 mx-auto mb-4 h-18 w-18 sm:h-25 sm:w-25">
    <img
      src="/aveliio_logo.png"
      alt="Aveliio"
      className="
        h-full w-full object-contain
        drop-shadow-[0_4px_5px_rgba(0,0,0,0.9)]
        drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]
      "
    />
  </div>

  <p
    className="
      relative z-10
      text-[88px] font-black leading-none tracking-[-0.065em]
      text-white
      [text-shadow:0_3px_4px_rgba(0,0,0,0.95),0_12px_28px_rgba(0,0,0,0.65)]
    "
  >
    Avel
    <span
      className="
        text-[#fc511e]
        [text-shadow:0_3px_4px_rgba(0,0,0,0.95),0_12px_28px_rgba(0,0,0,0.65)]
      "
    >
      ii
    </span>
    o
  </p>

  <p
    className="
      relative z-10
      mt-9 max-w-[320px]
      text-[18px] font-semibold leading-[1.6] text-white
      [text-shadow:0_2px_3px_rgba(0,0,0,0.95),0_8px_20px_rgba(0,0,0,0.7)]
    "
  >
    Записуйся на послуги
    <br />
    у кілька кліків
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
  <PhoneOff
    className="mt-1 h-8 w-8 shrink-0 text-[#f8783b]"
    strokeWidth={1.8}
  />

  <p>
    Онлайн-запис без
    <br />
    дзвінків та очікування
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
<div className="mx-auto mb-3 h-25 w-25 sm:hidden">
  <img
    src="/aveliio_logo.png"
    alt="Aveliio"
    className="
      h-full w-full object-contain
      drop-shadow-[0_4px_8px_rgba(15,23,42,0.18)]
    "
  />
</div>

              <h1 className="text-[28px] font-black leading-[1] tracking-[-0.06em] text-[#202020] sm:text-[42px]">
                Вітаємо у Aveliio !
              </h1>

              <p className="mt-1 text-[13px] font-semibold text-[#77716b] sm:mt-3 sm:text-[16px]">
                Увійдіть у свій акаунт, щоб продовжити
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-3">
<button
  type="button"
  onClick={() => {
    setRole("client");
    setError("");
  }}
  className={cn(
    `
      flex h-[54px] items-center justify-center gap-2
      rounded-[18px]
      border
      bg-white
      text-[12px] font-black
      transition-all duration-300
      active:scale-[0.98]
      sm:h-16 sm:gap-3 sm:rounded-[22px] sm:text-[15px]
    `,
    !isOwner
      ? `
          border-[#ff6200]
          text-[#ff6200]
          shadow-[0_8px_22px_rgba(255,98,0,0.10)]
        `
      : `
          border-[#ded8d1]
          text-[#77716b]
          hover:border-[#ff6200]
          hover:text-[#ff6200]
          hover:shadow-[0_8px_22px_rgba(255,98,0,0.10)]
        `,
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
    `
      flex h-[54px] items-center justify-center gap-2
      rounded-[18px]
      border
      bg-white
      text-[12px] font-black
      transition-all duration-300
      active:scale-[0.98]
      sm:h-16 sm:gap-3 sm:rounded-[22px] sm:text-[15px]
    `,
    isOwner
      ? `
          border-[#ff6200]
          text-[#ff6200]
          shadow-[0_8px_22px_rgba(255,98,0,0.10)]
        `
      : `
          border-[#ded8d1]
          text-[#77716b]
          hover:border-[#ff6200]
          hover:text-[#ff6200]
          hover:shadow-[0_8px_22px_rgba(255,98,0,0.10)]
        `,
  )}
>
  <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
  <span className="truncate">Для власників</span>
</button>
            </div>

            <div className="mt-2 rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:mt-7 sm:rounded-[15px] sm:p-7 sm:shadow-[0_16px_44px_rgba(15,23,42,0.05)]">
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

<label className="block">
  <span className="mb-1 block text-[13px] font-black text-[#202020] sm:text-[14px]">
    Пароль
  </span>

  <div
    className={cn(
      "flex h-12 items-center gap-2.5 rounded-[16px] border bg-white px-3.5 transition-all sm:h-14 sm:gap-3 sm:rounded-[18px] sm:px-4",
      error
        ? "border-[#ef4444]/40 ring-4 ring-[#ef4444]/10"
        : "border-[#eadfce] focus-within:border-[#ff6200] focus-within:ring-4 focus-within:ring-[#ff6200]/10",
    )}
  >
    <span className="text-[#8a847d]">
      <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
    </span>

    <input
      type={showPassword ? "text" : "password"}
      placeholder="Введіть пароль"
      value={form.password}
      onChange={(e) =>
        setForm((p) => ({
          ...p,
          password: e.target.value,
        }))
      }
      className="w-full bg-transparent text-[13px] font-bold text-[#202020] outline-none placeholder:text-[#b8afa5] sm:text-[14px]"
    />

    <button
      type="button"
      onClick={() => setShowPassword((p) => !p)}
      className="text-[#8a847d] transition hover:text-[#ff6200]"
    >
{showPassword ? (
  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
) : (
  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
)}
    </button>
  </div>
</label>

                <div className="flex justify-end">
<Link
  to="/forgot-password"
  className="
    relative inline-flex
    origin-center
    text-[13px] font-black text-[#ff6200]
    transition-all duration-300
    active:scale-[0.98]
    sm:text-[14px]

    after:absolute
    after:-bottom-1
    after:left-0
    after:h-[2px]
    after:w-full
    after:origin-left
    after:scale-x-0
    after:rounded-full
    after:bg-current
    after:transition-transform
    after:duration-300

    hover:after:scale-x-100
  "
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
  className="
    group inline-flex h-12 w-full items-center justify-center gap-2
    rounded-[16px]
    bg-[#202020]
    text-[14px] font-black text-white
    shadow-[0_12px_26px_rgba(15,15,15,0.18)]
    transition-all duration-300
    hover:scale-[1.015]
    hover:bg-[#ff6200]
    hover:shadow-[0_14px_30px_rgba(255,98,0,0.24)]
    active:scale-[0.98]
    disabled:pointer-events-none
    disabled:bg-[#f1ebe4]
    disabled:text-[#aaa19a]
    disabled:shadow-none
    disabled:opacity-100
    sm:h-15
    sm:rounded-[20px]
    sm:text-[16px]
  "
>
  {loading ? (
    "Вхід..."
  ) : (
    <>
      Увійти

      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 sm:h-5 sm:w-5" />
    </>
  )}
</button>
              </form>

              <div className="mt-3 flex items-center gap-3 sm:mt-8 sm:gap-4">
                <div className="h-px flex-1 bg-[#ece5dc]" />

                <span className="whitespace-nowrap text-[12px] font-semibold text-[#8a847d] sm:text-[14px]">
                  або продовжити з
                </span>

                <div className="h-px flex-1 bg-[#ece5dc]" />
              </div>

<div className="mt-2 sm:mt-6">
  <button
    type="button"
    className="
      flex h-12 w-full items-center justify-center gap-3
      rounded-[16px]
      border border-[#ded8d1]
      bg-transparent
      px-4
      text-[13px] font-black text-[#202020]
      transition-all duration-300
      hover:border-[#ff6200]
      hover:text-[#ff6200]
      hover:shadow-[0_8px_22px_rgba(255,98,0,0.10)]
      active:scale-[0.98]
      sm:h-14
      sm:rounded-[18px]
      sm:text-[15px]
    "
  >
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-1.99 3.02v2.54h3.22c1.88-1.73 2.99-4.29 2.99-7.41Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.89 6.61-2.36l-3.22-2.54c-.89.6-2.03.95-3.39.95-2.6 0-4.81-1.76-5.6-4.13H3.08v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.92A6 6 0 0 1 6.08 12c0-.67.12-1.32.32-1.92V7.46H3.08A10 10 0 0 0 2 12c0 1.61.38 3.14 1.08 4.54l3.32-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 2.96 14.7 2 12 2a10 10 0 0 0-8.92 5.46l3.32 2.62C7.19 7.71 9.4 5.95 12 5.95Z"
      />
    </svg>

    <span>Продовжити через Google</span>
  </button>
</div>
            </div>

            <div className="mt-2 text-center text-[13px] font-semibold text-[#77716b] sm:mt-8 sm:text-[15px]">
              {isOwner ? "Немає салону?" : "Ще не маєте акаунту?"}{" "}
<Link
  to={isOwner ? "/register-owner" : "/register"}
  className="
    relative inline-flex
    origin-center
    font-black text-[#ff6200]
    transition-all duration-300
    active:scale-[0.98]

    after:absolute
    after:-bottom-1
    after:left-0
    after:h-[2px]
    after:w-full
    after:origin-left
    after:scale-x-0
    after:rounded-full
    after:bg-current
    after:transition-transform
    after:duration-300

    hover:after:scale-x-100
  "
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