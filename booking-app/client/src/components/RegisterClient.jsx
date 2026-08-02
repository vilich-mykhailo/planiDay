import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Mail,
  Lock,
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

const STORAGE_KEY = "registerClientForm";

const INITIAL_FORM = {
  email: "",
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
          "flex h-[40px] items-center gap-1.5 rounded-[12px] border bg-white px-2.5 transition-all sm:h-[50px] sm:gap-2.5 sm:rounded-[16px] sm:px-3.5",
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

export default function RegisterClient() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
const [verificationOpen, setVerificationOpen] = useState(false);
const [verificationId, setVerificationId] = useState("");
const [verificationEmail, setVerificationEmail] = useState("");
const [verificationCode, setVerificationCode] = useState("");

const [verificationLoading, setVerificationLoading] =
  useState(false);

const [resendLoading, setResendLoading] = useState(false);
const [verificationError, setVerificationError] =
  useState("");

const [resendSeconds, setResendSeconds] = useState(0);
  const [form, setForm] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_FORM;
      }
    }

    return INITIAL_FORM;
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
  if (!verificationOpen || resendSeconds <= 0) {
    return;
  }

  const timer = window.setInterval(() => {
    setResendSeconds((previous) =>
      previous > 0 ? previous - 1 : 0,
    );
  }, 1000);

  return () => {
    window.clearInterval(timer);
  };
}, [verificationOpen, resendSeconds]);

async function handleSubmit(e) {
  e.preventDefault();

  setError("");
  setVerificationError("");

  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,}$/;

if (
  !form.email.trim() ||
  !form.password.trim()
) {
  setError("Заповни всі обов’язкові поля.");
  return;
}

  if (!passwordRegex.test(form.password)) {
    setError(
      "Пароль має містити мінімум 8 символів, латинську літеру та цифру.",
    );
    return;
  }

  if (/\s/.test(form.password)) {
    setError("Пароль не може містити пробіли.");
    return;
  }


  try {
    setLoading(true);

    const data = await api(
      "/auth/client/register/request-code",
      {
        method: "POST",
body: {
  email: form.email.trim(),
  password: form.password,
},
      },
    );

    setVerificationId(data.verificationId);
    setVerificationEmail(data.email || form.email.trim());
    setVerificationCode("");
    setVerificationError("");
    setResendSeconds(data.resendAfter || 60);
    setVerificationOpen(true);
  } catch (err) {
    setError(
      err?.message ||
        "Не вдалося надіслати код. Спробуй ще раз.",
    );
  } finally {
    setLoading(false);
  }
}

async function handleVerifyCode(e) {
  e.preventDefault();

  setVerificationError("");

  const normalizedCode = verificationCode
    .replace(/\D/g, "")
    .slice(0, 6);

  if (normalizedCode.length !== 6) {
    setVerificationError("Введи 6-значний код.");
    return;
  }

  try {
    setVerificationLoading(true);

    const data = await api(
      "/auth/client/register/verify-code",
      {
        method: "POST",
        body: {
          verificationId,
          code: normalizedCode,
        },
      },
    );

    if (!data?.token) {
      throw new Error(
        "Акаунт створено, але сервер не повернув токен авторизації.",
      );
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", "client");
    localStorage.removeItem("studioId");

    sessionStorage.removeItem(STORAGE_KEY);

    setVerificationOpen(false);
    setVerificationCode("");
    setVerificationId("");

    window.dispatchEvent(new Event("auth-changed"));

navigate("/create-client-profile", {
  replace: true,
});
  } catch (err) {
    setVerificationError(
      err?.message || "Не вдалося підтвердити код.",
    );
  } finally {
    setVerificationLoading(false);
  }
}

async function handleResendCode() {
  if (
    resendLoading ||
    resendSeconds > 0 ||
    !verificationId
  ) {
    return;
  }

  setVerificationError("");

  try {
    setResendLoading(true);

    const data = await api(
      "/auth/client/register/resend-code",
      {
        method: "POST",
        body: {
          verificationId,
        },
      },
    );

    setVerificationCode("");
    setResendSeconds(data.resendAfter || 60);
  } catch (err) {
    setVerificationError(
      err?.message ||
        "Не вдалося повторно надіслати код.",
    );
  } finally {
    setResendLoading(false);
  }
}

return (
  <>

     <main className="min-h-[100dvh] p-0 sm:p-3 lg:p-5">
      <div className="mx-auto grid min-h-[calc(100dvh-24px)] max-w-[1700px] overflow-hidden lg:grid-cols-[520px_1fr]">
         <aside className="relative hidden overflow-hidden lg:block">
           <img
             src={salonHero}
             alt=""
             className="absolute inset-0 h-full w-full object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/65" />
 
           <div className="relative flex h-full flex-col px-12 pb-20 pt-[31%] text-white">
 <div className="flex flex-col items-center text-center">
   <p className="text-[88px] font-black leading-none tracking-[-0.065em]">
     Avel<span className="text-[#fc511e]">ii</span>o
   </p>
 
   <p className="mt-9 max-w-[320px] text-[18px] font-semibold leading-[1.6] text-white/95">
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
<section className="flex items-center justify-center px-4 py-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
  <div className="w-full max-w-[560px] pb-3 sm:max-w-[510px] lg:max-w-[500px] max-[639px]:pb-[calc(env(safe-area-inset-bottom)+10px)]">
    <div className="text-center max-[639px]:mb-1">
<div className="mx-auto mb-4 h-20 w-20 sm:mb-3 sm:h-16 sm:w-16 lg:h-[68px] lg:w-[68px]">
  <img
    src="/aveliio_logo.png"
    alt="Aveliio"
    className="h-full w-full object-contain"
  />
</div>

      <h1 className="text-[28px] font-black leading-[1] tracking-[-0.06em] text-[#202020] sm:text-[34px] lg:text-[36px]">
        Реєстрація клієнта
      </h1>

      <p className="mt-2 text-[14px] leading-5 text-[#77716b] sm:mt-2 sm:text-[14px] sm:leading-5 lg:text-[15px]">
        Створи акаунт, щоб записатися до студії
      </p>
    </div>

    <div className="mt-3 rounded-[22px] border border-[#eadfce] bg-white p-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:mt-4 sm:rounded-[15px] sm:p-5 sm:shadow-[0_16px_44px_rgba(15,23,42,0.05)] lg:p-5">
      <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3.5">
        <Input
          label="Email"
          type="email"
          placeholder="name@email.com"
          icon={<Mail className="h-4 w-4" />}
          error={!!error}
          value={form.email}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              email: e.target.value,
            }))
          }
        />

        <Input
          label="Пароль"
          type={showPassword ? "text" : "password"}
          placeholder="Мінімум 8 символів"
          icon={<Lock className="h-4 w-4" />}
          error={!!error}
          value={form.password}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              password: e.target.value,
            }))
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

  <span className="text-[10px] leading-4 text-[#7a7a7a] sm:text-[12px] sm:leading-5">
    Реєструючи обліковий запис, ви приймаєте {" "}
    <Link
      to="/termsclient"
      state={{ from: location.pathname }}
      className="font-semibold text-black"
    >
      Умови використання
    </Link>{" "}
    та{" "}
    <Link
      to="/privacyclient"
      state={{ from: location.pathname }}
      className="font-semibold text-black"
    >
      Політику конфіденційності
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
    mt-0 inline-flex h-[44px] w-full items-center justify-center
    rounded-[12px]
    bg-[#202020]
    text-[14px] font-black text-white
    transition-all duration-300
    hover:scale-[1.015]
    hover:bg-[#ff6200]
    active:scale-[0.98]
    disabled:pointer-events-none
    disabled:bg-[#f1ebe4]
    disabled:text-[#aaa19a]
    disabled:shadow-none
    disabled:opacity-100
    sm:h-[48px]
    sm:text-[14px]
    lg:text-[15px]
  "
>
  {loading ? "Надсилання коду..." : "Зареєструватися"}
</button>
      </form>
<div className="mt-4 flex items-center gap-2 sm:mt-4 sm:gap-3">
  <div className="h-px flex-1 bg-[#ece5dc]" />

  <span className="whitespace-nowrap text-[11px] font-semibold text-[#8a847d] sm:text-[14px]">
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
      sm:h-12
      sm:rounded-[16px]
      sm:text-[14px]
      lg:text-[15px]
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

<div className="mt-3 text-center text-[11px] font-semibold text-[#77716b] sm:mt-3 sm:text-[14px] lg:text-[15px]">
  Вже є акаунт?

  <Link
    to="/login"
   className="
    relative ml-2 inline-flex
    origin-center
    text-[15px] font-black text-[#ff6200]
    transition-all duration-300
    active:scale-[0.98]
    sm:text-[15px]

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

    {verificationOpen && (
      <div
        className="
          fixed inset-0 z-[200]
          flex items-center justify-center
          bg-black/45 px-3
          backdrop-blur-[5px]
        "
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="registration-code-title"
          className="
            relative w-full max-w-[440px]
            rounded-[26px]
            border border-[#eadfce]
            bg-white
            p-5
            shadow-[0_30px_90px_rgba(15,15,15,0.25)]
            sm:rounded-[32px]
            sm:p-8
          "
        >
          <button
            type="button"
            onClick={() => {
              if (
                verificationLoading ||
                resendLoading
              ) {
                return;
              }

              setVerificationOpen(false);
              setVerificationError("");
              setVerificationCode("");
            }}
            className="
              absolute right-4 top-4
              grid h-9 w-9 place-items-center
              rounded-full
              bg-[#f6f3ef]
              text-[#77716b]
              transition
              hover:bg-[#202020]
              hover:text-white
            "
            aria-label="Закрити"
          >
            ×
          </button>

          <div
            className="
              mx-auto grid h-16 w-16
              place-items-center
              rounded-full
              bg-[#fff2e9]
              text-[#ff6200]
            "
          >
            <Mail className="h-7 w-7" />
          </div>

          <div className="mt-5 text-center">
            <h2
              id="registration-code-title"
              className="
                text-[23px] font-black
                leading-tight tracking-[-0.04em]
                text-[#202020]
                sm:text-[28px]
              "
            >
              Перевірте вашу пошту
            </h2>

            <p
              className="
                mt-3 text-[13px]
                leading-5 text-[#77716b]
                sm:text-[15px]
                sm:leading-6
              "
            >
              Код для реєстрації відправлено на
            </p>

            <p
              className="
                mt-1 break-all
                text-[13px] font-black
                text-[#202020]
                sm:text-[15px]
              "
            >
              {verificationEmail}
            </p>
          </div>

          <form
            onSubmit={handleVerifyCode}
            className="mt-6"
          >
            <label className="block">
              <span
                className="
                  block text-center
                  text-[12px] font-black
                  text-[#202020]
                  sm:text-[14px]
                "
              >
                Код підтвердження
              </span>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={verificationCode}
                onChange={(event) => {
                  const value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

                  setVerificationCode(value);
                  setVerificationError("");
                }}
                placeholder="000000"
                className="
                  mt-3 h-[62px] w-full
                  rounded-[18px]
                  border border-[#ded8d1]
                  bg-[#faf9f7]
                  px-4
                  text-center
                  text-[27px] font-black
                  tracking-[0.35em]
                  text-[#202020]
                  outline-none
                  transition
                  placeholder:text-[#d2ccc5]
                  focus:border-[#ff6200]
                  focus:bg-white
                  focus:ring-4
                  focus:ring-[#ff6200]/10
                  sm:h-[70px]
                  sm:text-[32px]
                "
              />
            </label>

            {verificationError && (
              <div
                className="
                  mt-3 rounded-[14px]
                  border border-[#ef4444]/20
                  bg-[#fff1f1]
                  px-4 py-3
                  text-center
                  text-[12px] font-semibold
                  text-[#ef4444]
                "
              >
                {verificationError}
              </div>
            )}

            <button
              type="submit"
              disabled={
                verificationLoading ||
                verificationCode.length !== 6
              }
              className="
                mt-4 inline-flex h-[50px]
                w-full items-center
                justify-center
                rounded-[15px]
                bg-[#202020]
                text-[14px] font-black
                text-white
                transition-all
                hover:scale-[1.015]
                hover:bg-[#ff6200]
                active:scale-[0.98]
                disabled:pointer-events-none
                disabled:bg-[#eee9e3]
                disabled:text-[#aaa19a]
                disabled:shadow-none
                sm:h-[54px]
                sm:text-[15px]
              "
            >
              {verificationLoading
                ? "Перевірка..."
                : "Підтвердити код"}
            </button>

            <div
              className="
                mt-5 text-center
                text-[12px] font-semibold
                text-[#77716b]
                sm:text-[13px]
              "
            >
              Не отримали код?

              <button
                type="button"
                disabled={
                  resendLoading ||
                  resendSeconds > 0
                }
                onClick={handleResendCode}
                className="
                  ml-1.5 font-black
                  text-[#ff6200]
                  transition
                  hover:underline
                  disabled:cursor-default
                  disabled:text-[#aaa19a]
                  disabled:no-underline
                "
              >
                {resendLoading
                  ? "Надсилання..."
                  : resendSeconds > 0
                    ? `Надіслати повторно через ${resendSeconds} с`
                    : "Надіслати повторно"}
              </button>
            </div>

            <p
              className="
                mt-4 text-center
                text-[11px] leading-4
                text-[#aaa19a]
              "
            >
              Код дійсний протягом 10 хвилин
            </p>
          </form>
        </div>
      </div>
    )}
  </>
);
}