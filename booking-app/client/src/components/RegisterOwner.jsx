import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Mail,
  Lock,
  Phone,
  Building2,
  ArrowRight,
  Eye,
  EyeOff,
  CalendarDays,
  PhoneOff,
  ShieldCheck,
} from "lucide-react";

import { api } from "../api/http";
import salonHero from "../assets/salon-login-hero.png";

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

function Input({ label, hint, icon, error, rightElement, ...props }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between gap-2 sm:mb-2 sm:gap-3">
        <span className="block text-[11px] font-black text-[#202020] sm:text-[14px]">
          {label}
        </span>

        {hint && (
          <span className="text-[10px] font-bold text-[#8a847d] sm:text-xs">
            {hint}
          </span>
        )}
      </div>

      <div
        className={cn(
          "flex h-[40px] items-center gap-1.5 rounded-[12px] border bg-white px-2.5 transition-all sm:h-14 sm:gap-3 sm:rounded-[18px] sm:px-4",
          error
            ? "border-[#ef4444]/40 ring-2 ring-[#ef4444]/10 sm:ring-4"
            : "border-[#eadfce] focus-within:border-[#ff6200] focus-within:ring-2 focus-within:ring-[#ff6200]/10 sm:focus-within:ring-4",
        )}
      >
        {icon && (
          <span className="text-[#8a847d] [&>svg]:h-3.5 [&>svg]:w-3.5 sm:[&>svg]:h-5 sm:[&>svg]:w-5">
            {icon}
          </span>
        )}

        <input
          {...props}
          className="w-full bg-transparent text-[11px] font-bold text-[#202020] outline-none placeholder:text-[#b8afa5] sm:text-[14px]"
        />

        {rightElement}
      </div>
    </label>
  );
}

export default function RegisterOwner() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

    if (form.password.trim().length < 8) {
      setError("Пароль має бути мінімум 8 символів.");
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
    <span className="text-[#fc511e]">ii</span>
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
    Керуйте студією
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
                  Приймайте онлайн-записи
                  <br />
                  24/7 без зайвих дзвінків
                </p>
              </div>

              <div className="flex items-start gap-5">
                <PhoneOff
                  className="mt-1 h-8 w-8 shrink-0 text-[#f8783b]"
                  strokeWidth={1.8}
                />
                <p>
                  Менше ручної роботи
                  <br />
                  більше контролю над записами
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
                  Дані студії під захистом
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex items-start justify-center px-3 py-3 sm:items-center sm:px-6 sm:py-10 lg:px-8">
          <div className="w-full max-w-[560px] pb-3 max-[639px]:pb-[calc(env(safe-area-inset-bottom)+10px)]">
            <div className="text-center max-[639px]:mb-1">
<div className="mx-auto mb-2 h-12 w-12 sm:mb-2 sm:h-16 sm:w-16">
  <img
    src="/aveliio_logo.png"
    alt="Aveliio"
    className="h-full w-full object-contain"
  />
</div>

              <h1 className="text-[22px] font-black leading-[1] tracking-[-0.06em] text-[#202020] sm:text-[42px]">
                Створити салон
              </h1>

              <p className="mt-1 text-[11px] leading-4 text-[#77716b] sm:mt-3 sm:text-[16px] sm:leading-6">
                Почніть приймати онлайн-записи вже сьогодні
              </p>
            </div>

            <div className="mt-3 rounded-[22px] border border-[#eadfce] bg-white p-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:mt-7 sm:rounded-[15px] sm:p-7 sm:shadow-[0_16px_44px_rgba(15,23,42,0.05)]">
              <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-5">
                <Input
                  label="Назва салону"
                  placeholder="Beauty Studio"
                  autoComplete="organization"
                  icon={<Building2 />}
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
                  icon={<Phone />}
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
                  icon={<Mail />}
                  error={!!error}
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />

                <Input
                  label="Пароль"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Мінімум 8 символів"
                  icon={<Lock />}
                  error={!!error}
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="text-[#9f9f9f] transition hover:text-[#ff6200]"
                    >
                      {showPassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  }
                />

                <div className="space-y-[1px] pl-1">
                  <p className="text-[10px] leading-4 text-[#8a8a8a] sm:text-[12px]">
                    • Мінімум 8 символів
                  </p>
                  <p className="text-[10px] leading-4 text-[#8a8a8a] sm:text-[12px]">
                    • Лише латинські літери
                  </p>
                </div>

                <label className="flex items-start gap-2 pt-0.5">
<input
  type="checkbox"
  required
  className="
    mt-[2px] h-4 w-4
     cursor-pointer
    rounded border-[#d9d9d9]
    accent-[#ff6200]
    focus:ring-[#ff6200]
  "
/>

                  <span className="text-[10px] leading-4 text-[#7a7a7a] sm:text-[12px] sm:leading-5">
                    Я погоджуюся з{" "}
                    <Link
                      to="/termsowner"
                      state={{
                        from: location.pathname,
                        preserveForm: true,
                      }}
                      className="font-semibold text-[#ff6200]"
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
                      className="font-semibold text-[#ff6200]"
                    >
                      політикою конфіденційності
                    </Link>
                  </span>
                </label>

                {error && (
                  <div className="rounded-[14px] border border-[#ef4444]/20 bg-[#fff1f1] px-4 py-3 text-[12px] font-semibold text-[#ef4444]">
                    {error}
                  </div>
                )}

<button
  type="submit"
  disabled={loading}
  className="
    group mt-0 inline-flex h-[44px] w-full items-center justify-center gap-2
    rounded-[12px]
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
    sm:h-[52px]
    sm:text-[15px]
  "
>
  {loading ? (
    "Створення..."
  ) : (
    <>
      Створити салон

      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </>
  )}
</button>
              </form>

              <div className="mt- flex items-center gap-2 sm:mt-4 sm:gap-4">
                <div className="h-px flex-1 bg-[#ece5dc]" />

                <span className="mt-2 whitespace-nowrap text-[11px] font-semibold text-[#8a847d] sm:text-[14px]">
                  або продовжити з
                </span>

                <div className="h-px flex-1 bg-[#ece5dc]" />
              </div>

<div className="mt-2 sm:mt-4">
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

              <div className="mt-3 text-center text-[11px] font-semibold text-[#77716b] sm:mt-3 sm:text-[15px]">
                Вже є акаунт?{" "}
<Link
  to="/login-owner"
  className="
    relative  ml-2 inline-flex
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
  Увійти
</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}