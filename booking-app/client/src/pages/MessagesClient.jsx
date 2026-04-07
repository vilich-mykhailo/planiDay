// SecurityClient.jsx
import { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Phone,
  Mail,
  KeyRound,
  CheckCircle2,
  X,
  Lock,
} from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SectionCard({ icon, title, subtitle, children }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-stone-200/60 bg-white shadow-[0_4px_20px_-6px_rgba(120,90,60,0.08)] sm:rounded-3xl">
      <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

      <div className="px-4 pb-6 pt-6 sm:px-6 sm:pb-6 sm:pt-5 lg:px-8 lg:pt-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-stone-100">
            {icon}
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-black tracking-[-0.02em] text-stone-800 sm:text-xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm leading-6 text-stone-500">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}

function Field({ label, icon, hint, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-stone-500">{icon}</span>
        <label className="text-sm font-bold text-stone-700">{label}</label>
      </div>

      {children}

      {hint ? <p className="text-xs text-stone-400">{hint}</p> : null}
    </div>
  );
}

function SuccessNote({ children }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
      {children}
    </div>
  );
}

export default function SecurityClient() {
  const [phone, setPhone] = useState("+48 500 123 456");
  const [newPhone, setNewPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);

  const [email, setEmail] = useState("client@example.com");
  const [newEmail, setNewEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  function handleSendCode() {
    if (!newPhone.trim()) return;
    setCodeSent(true);
    setPhoneSaved(false);
  }

  function handleConfirmPhone() {
    if (!newPhone.trim() || !phoneCode.trim()) return;

    setPhone(newPhone);
    setNewPhone("");
    setPhoneCode("");
    setCodeSent(false);
    setPhoneSaved(true);
  }

  function handleSaveEmail() {
    if (!newEmail.trim()) return;
    setEmail(newEmail);
    setNewEmail("");
    setEmailSaved(true);
  }

  function handleSavePassword(e) {
    e.preventDefault();

    if (!password.trim() || !newPassword.trim() || !repeatPassword.trim()) {
      return;
    }

    if (newPassword !== repeatPassword) {
      return;
    }

    setPassword("");
    setNewPassword("");
    setRepeatPassword("");
    setPasswordSaved(true);
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-2.5 pb-4 pt-0 sm:px-4 sm:pb-8 sm:pt-14 lg:pt-16">
        <div className="space-y-4 px-0 pt-2 sm:space-y-5 sm:pt-8 lg:pt-6">
          <section className="overflow-hidden rounded-[24px] border border-stone-200/60 bg-white shadow-[0_4px_20px_-6px_rgba(120,90,60,0.08)] sm:rounded-3xl">
            <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

            <div className="px-4 pb-7 pt-7 sm:px-6 sm:pb-4 sm:pt-5 lg:px-8 lg:pt-6">
              <div className="mb-5 space-y-3 sm:mb-4 sm:space-y-2 lg:mb-5">
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 sm:px-4 sm:py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 sm:h-4 sm:w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 sm:text-xs sm:tracking-[0.22em]">
                    Налаштування безпеки
                  </span>
                </div>

                <h1 className="max-w-full !text-[34px] font-black leading-tight tracking-[-0.03em] text-stone-800 sm:max-w-none sm:!text-5xl lg:!text-5xl">
                  Безпека вашого{" "}
                  <span className="text-amber-600">акаунта</span>
                </h1>

                <p className="max-w-2xl text-sm leading-6 text-stone-600 sm:text-base sm:leading-7">
                  Тут ви можете змінити номер телефону, email та пароль для
                  захисту свого профілю.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-[18px] border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  Захист профілю
                </span>

                <span className="inline-flex items-center gap-2 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Дані під контролем
                </span>
              </div>
            </div>
          </section>

          <SectionCard
            icon={<Phone className="h-5 w-5 text-amber-600" />}
            title="Зміна телефону"
            subtitle="Для зміни номера підтвердьте його за допомогою коду."
          >
            <div className="grid gap-4">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                  Поточний номер
                </p>
                <p className="mt-1 text-base font-bold text-stone-800">
                  {phone}
                </p>
              </div>

              <Field
                label="Новий номер телефону"
                icon={<Phone className="h-4 w-4" />}
              >
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+48 123 456 789"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                />
              </Field>

              {!codeSent ? (
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100 active:scale-[0.99] sm:w-fit"
                >
                  <KeyRound className="h-4 w-4" />
                  Надіслати код підтвердження
                </button>
              ) : (
                <div className="grid gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <Field
                    label="Код підтвердження"
                    icon={<ShieldCheck className="h-4 w-4" />}
                    hint="Введіть код, який ви отримали на новий номер."
                  >
                    <input
                      type="text"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      placeholder="123456"
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                    />
                  </Field>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleConfirmPhone}
                      className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.99]"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Підтвердити номер
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCodeSent(false);
                        setPhoneCode("");
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-600 transition hover:bg-stone-50 active:scale-[0.99]"
                    >
                      <X className="h-4 w-4" />
                      Скасувати
                    </button>
                  </div>
                </div>
              )}

              {phoneSaved ? (
                <SuccessNote>
                  Номер телефону успішно оновлено.
                </SuccessNote>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            icon={<Mail className="h-5 w-5 text-amber-600" />}
            title="Зміна email"
            subtitle="Оновіть адресу електронної пошти для входу та сповіщень."
          >
            <div className="grid gap-4">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                  Поточний email
                </p>
                <p className="mt-1 text-base font-bold text-stone-800">
                  {email}
                </p>
              </div>

              <Field
                label="Новий email"
                icon={<Mail className="h-4 w-4" />}
              >
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="newmail@example.com"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                />
              </Field>

              <button
                type="button"
                onClick={handleSaveEmail}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100 active:scale-[0.99] sm:w-fit"
              >
                <CheckCircle2 className="h-4 w-4" />
                Зберегти новий email
              </button>

              {emailSaved ? (
                <SuccessNote>Email успішно оновлено.</SuccessNote>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            icon={<Lock className="h-5 w-5 text-amber-600" />}
            title="Зміна пароля"
            subtitle="Використовуйте надійний пароль для додаткового захисту акаунта."
          >
            <form onSubmit={handleSavePassword} className="grid gap-4">
              <Field
                label="Поточний пароль"
                icon={<KeyRound className="h-4 w-4" />}
              >
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введіть поточний пароль"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                />
              </Field>

              <Field
                label="Новий пароль"
                icon={<ShieldCheck className="h-4 w-4" />}
              >
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Введіть новий пароль"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                />
              </Field>

              <Field
                label="Повторіть новий пароль"
                icon={<ShieldCheck className="h-4 w-4" />}
              >
                <input
                  type="password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  placeholder="Повторіть новий пароль"
                  className={cn(
                    "w-full rounded-2xl border bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:ring-4",
                    repeatPassword &&
                      newPassword !== repeatPassword
                      ? "border-red-300 focus:border-red-300 focus:ring-red-100"
                      : "border-stone-200 focus:border-amber-300 focus:ring-amber-100",
                  )}
                />
              </Field>

              {repeatPassword && newPassword !== repeatPassword ? (
                <p className="text-sm font-medium text-red-600">
                  Паролі не співпадають.
                </p>
              ) : null}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100 active:scale-[0.99] sm:w-fit"
              >
                <CheckCircle2 className="h-4 w-4" />
                Оновити пароль
              </button>

              {passwordSaved ? (
                <SuccessNote>Пароль успішно змінено.</SuccessNote>
              ) : null}
            </form>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}