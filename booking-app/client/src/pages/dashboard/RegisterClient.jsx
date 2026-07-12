import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Mail,
  Lock,
  Phone,
  User,
  ArrowRight,
  Eye,
  EyeOff,
    CalendarDays,
  PhoneOff,
  ShieldCheck,
} from "lucide-react";
import { api } from "../../api/http";
import salonHero from "../../assets/salon-login-hero.png";
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const STORAGE_KEY = "registerClientForm";

const INITIAL_FORM = {
  name: "",
  phone: "",
  email: "",
  password: "",
  lastName: "",
confirmPassword: "",
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

export default function RegisterClient() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

async function handleSubmit(e) {
  e.preventDefault();
  setError("");

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,}$/;

  if (
    !form.name.trim() ||
    !form.lastName.trim() ||
    !form.email.trim() ||
    !form.password.trim() ||
    !form.confirmPassword.trim()
  ) {
    setError("Заповни всі поля.");
    return;
  }

  if (!passwordRegex.test(form.password)) {
    setError("Пароль має містити мінімум 8 символів, латинську літеру та цифру.");
    return;
  }

  if (/\s/.test(form.password)) {
    setError("Пароль не може містити пробіли.");
    return;
  }

  if (form.password !== form.confirmPassword) {
    setError("Паролі не співпадають.");
    return;
  }

  try {
    setLoading(true);

    const data = await api("/auth/client/register", {
      method: "POST",
      body: {
        name: `${form.name.trim()} ${form.lastName.trim()}`,
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
      },
    });

localStorage.removeItem("token");
localStorage.removeItem("role");
localStorage.removeItem("studioId");

window.dispatchEvent(new Event("auth-changed"));

sessionStorage.removeItem(STORAGE_KEY);
navigate("/login");
  } catch (err) {
    setError(err?.message || "Не вдалося створити акаунт. Спробуй ще раз.");
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
<section className="flex items-start justify-center px-3 py-3 sm:items-center sm:px-6 sm:py-10 lg:px-8">
  <div className="w-full max-w-[560px] pb-3 max-[639px]:pb-[calc(env(safe-area-inset-bottom)+10px)]">
    <div className="text-center max-[639px]:mb-1">
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-[#202020] text-[13px] font-black text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] sm:mb-5 sm:h-12 sm:w-12 sm:text-[15px]">
        P
      </div>

      <h1 className="text-[22px] font-black leading-[1] tracking-[-0.06em] text-[#202020] sm:text-[42px]">
        Реєстрація клієнта
      </h1>

      <p className="mt-1 text-[11px] leading-4 text-[#77716b] sm:mt-3 sm:text-[16px] sm:leading-6">
        Створи акаунт, щоб записуватися та зберігати улюблені студії
      </p>
    </div>

    <div className="mt-3 rounded-[22px] border border-[#eadfce] bg-white p-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:mt-7 sm:rounded-[15px] sm:p-7 sm:shadow-[0_16px_44px_rgba(15,23,42,0.05)]">
      <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4">
          <Input
            label="Імʼя"
            placeholder="Наталія"
            icon={<User className="h-4 w-4" />}
            error={!!error}
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
          />

          <Input
            label="Прізвище"
            placeholder="Ковальчук"
            icon={<User className="h-4 w-4" />}
            error={!!error}
            value={form.lastName}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                lastName: e.target.value,
              }))
            }
          />
        </div>

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

          <p className="text-[10px] leading-4 text-[#8a8a8a] sm:text-[12px]">
            • Без пробілів
          </p>
        </div>

        <Input
          label="Підтвердіть пароль"
          type={showPassword ? "text" : "password"}
          placeholder="Повторіть пароль"
          icon={<Lock className="h-4 w-4" />}
          error={!!error}
          value={form.confirmPassword}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              confirmPassword: e.target.value,
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

        <label className="flex items-start gap-2 pt-0.5">
          <input
            type="checkbox"
            required
            className="mt-[2px] h-4 w-4 rounded border-[#d9d9d9] text-[#ff6200] focus:ring-[#ff6200]"
          />

          <span className="text-[10px] leading-4 text-[#7a7a7a] sm:text-[12px] sm:leading-5">
            Я погоджуюсь з{" "}
            <Link
              to="/termsclient"
              state={{ from: location.pathname }}
              className="font-semibold text-[#ff6200]"
            >
              Умовами використання
            </Link>{" "}
            та{" "}
            <Link
              to="/privacyclient"
              state={{ from: location.pathname }}
              className="font-semibold text-[#ff6200]"
            >
              Політикою конфіденційності
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
          className="mt-0 inline-flex h-[44px] w-full items-center justify-center rounded-[12px] bg-[#ff5a00] text-[14px] font-bold text-white transition hover:bg-[#f25500] active:scale-[0.99] disabled:opacity-50 sm:h-[52px] sm:text-[15px]"
        >
          {loading ? "Створення..." : "Зареєструватися"}
        </button>
      </form>
<div className="mt-4 flex items-center gap-2 sm:mt-6 sm:gap-4">
  <div className="h-px flex-1 bg-[#ece5dc]" />

  <span className="whitespace-nowrap text-[11px] font-semibold text-[#8a847d] sm:text-[14px]">
    або продовжити з
  </span>

  <div className="h-px flex-1 bg-[#ece5dc]" />
</div>

<div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
  <button
    type="button"
    className="flex h-[40px] items-center justify-center rounded-[12px] border border-[#eadfce] bg-white text-[11px] font-black text-[#202020] transition hover:bg-[#faf7f3] sm:h-14 sm:rounded-[18px] sm:text-[15px]"
  >
    Google
  </button>

  <button
    type="button"
    className="flex h-[40px] items-center justify-center rounded-[12px] border border-[#eadfce] bg-white text-[11px] font-black text-[#202020] transition hover:bg-[#faf7f3] sm:h-14 sm:rounded-[18px] sm:text-[15px]"
  >
    Apple
  </button>
</div>

<div className="mt-3 text-center text-[11px] font-semibold text-[#77716b] sm:mt-5 sm:text-[15px]">
  Вже є акаунт?{" "}
  <Link
    to="/login"
    className="font-black text-[#ff6200] transition hover:opacity-70"
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