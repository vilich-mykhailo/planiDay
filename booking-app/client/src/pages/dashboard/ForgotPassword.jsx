// ForgotPassword.jsx
import { Link } from "react-router-dom";
import { useState } from "react";
import { Sparkles, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Input({ label, icon, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>

      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 transition-all focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-400/10">
        {icon && <span className="text-stone-400">{icon}</span>}

        <input
          {...props}
          className="w-full bg-transparent text-sm font-medium text-stone-800 outline-none placeholder:text-stone-400"
        />
      </div>
    </label>
  );
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    // TODO: api call
    setSent(true);
  }

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/20">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-md">
          <div className="text-center">
                        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 font-extrabold text-white shadow-[0_8px_20px_rgba(74,93,78,0.22)]">
              P
            </div>
            <h1 className="text-3xl font-black tracking-tight text-stone-800 sm:text-4xl">
              Відновлення пароля
            </h1>

            <p className="mt-3 text-sm leading-6 text-stone-600">
              Вкажи email — ми надішлемо інструкцію для зміни пароля.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-stone-200/60 bg-white shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]">
            <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

            <div className="p-6 sm:p-7">
              {sent ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      Якщо акаунт існує — ми надіслали лист на{" "}
                      <b className="break-all">{email}</b>.
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@email.com"
                    value={email}
                    icon={<Mail className="h-4 w-4" />}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <button
                    type="submit"
                    className={cn(
                      "inline-flex w-full items-center justify-center gap-2 rounded-2xl",
                      "bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-3.5",
                      "text-sm font-bold text-white shadow-lg shadow-emerald-500/20",
                      "transition-all hover:from-emerald-700 hover:to-emerald-800",
                    )}
                  >
                    Надіслати інструкцію
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              <div className="mt-6 border-t border-stone-100 pt-5 text-center">
                <p className="text-sm text-stone-600">
                  Повернутися до{" "}
                  <Link
                    to="/login"
                    className="font-bold text-stone-800 transition hover:text-emerald-700 hover:underline"
                  >
                    входу
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-stone-500">
            Якщо листа немає — перевір “Спам” або зачекай 1–2 хвилини.
          </p>
        </div>
      </div>
    </main>
  );
}