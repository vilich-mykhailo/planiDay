// BookingCustomerForm.jsx
import { useMemo, useState } from "react";
/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import { X, User, Phone, CheckCheck } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function BookingCustomerForm({
  form,
  setForm,
  onSubmit,
  onBack,
}) {
  const [triedSubmit, setTriedSubmit] = useState(false);

  const digits = String(form?.phone || "").replace(/\D/g, "");

  const isValidPhone = useMemo(() => {
    return /^380\d{9}$/.test(digits);
  }, [digits]);

  function formatPhone(value) {
    let cleaned = String(value || "")
      .replace(/[^\d+]/g, "")
      .replace(/(?!^)\+/g, "");

    if (cleaned === "") return "";

    const hasPlus = cleaned.startsWith("+");
    const numbers = cleaned.replace(/\D/g, "").slice(0, 12);

    if (!numbers.startsWith("380")) {
      return (hasPlus ? "+" : "") + numbers;
    }

    let formatted = hasPlus ? "+380 " : "380 ";

    if (numbers.length > 3) formatted += numbers.slice(3, 5);
    if (numbers.length > 5) formatted += " " + numbers.slice(5, 8);
    if (numbers.length > 8) formatted += " " + numbers.slice(8, 10);
    if (numbers.length > 10) formatted += " " + numbers.slice(10, 12);

    return formatted;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setTriedSubmit(true);

    if (!isValidPhone) return;

    onSubmit(e);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm"
        onClick={onBack}
        data-testid="booking-form-backdrop"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)]"
          onClick={(e) => e.stopPropagation()}
          data-testid="booking-form-modal"
        >
          <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

          <div className="relative border-b border-stone-100 px-7 pb-5 pt-7">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[0_8px_22px_rgba(93,64,55,0.08)]">
                <CheckCheck className="h-5 w-5" />
              </div>

              <div className="min-w-0 pr-10">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
                  Крок 2 з 2
                </p>
                <h2
                  className="text-xl font-bold text-stone-800"
                  data-testid="booking-form-title"
                >
                  Ваші дані
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Вкажіть ім&apos;я та телефон для підтвердження
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onBack}
              data-testid="booking-form-close-btn"
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-500 transition-colors duration-200 hover:bg-stone-100 hover:text-stone-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 px-7 py-6"
            data-testid="booking-customer-form"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-stone-700">
                Ім’я
              </label>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600">
                  <User className="h-4 w-4" />
                </div>

                <input
                  type="text"
                  placeholder="Ваше ім'я"
                  value={form?.name || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  data-testid="booking-form-name-input"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3.5 pl-11 pr-4 text-sm font-medium text-stone-800 placeholder:text-stone-400 outline-none transition-all duration-200 hover:border-stone-300 hover:bg-white focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-stone-700">
                Телефон
              </label>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600">
                  <Phone className="h-4 w-4" />
                </div>

                <input
                  type="tel"
                  placeholder="+380 XX XXX XX XX"
                  value={form?.phone || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      phone: formatPhone(e.target.value),
                    }))
                  }
                  data-testid="booking-form-phone-input"
                  className={cn(
                    "w-full rounded-2xl bg-stone-50 py-3.5 pl-11 pr-4 text-sm font-medium text-stone-800 placeholder:text-stone-400 outline-none transition-all duration-200 hover:bg-white",
                    triedSubmit && !isValidPhone
                      ? "border border-red-300 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-400/10"
                      : "border border-stone-200 hover:border-stone-300 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10",
                  )}
                />
              </div>

              {triedSubmit && !isValidPhone && (
                <p
                  className="mt-1.5 pl-1 text-xs font-medium text-red-500"
                  data-testid="booking-form-phone-error"
                >
                  Формат телефону: +380 XX XXX XX XX
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-3">
              <p className="text-xs leading-5 text-stone-500">
                Після відправки студія отримає ваш запит на бронювання і зможе
                зв’язатися з вами для підтвердження.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                data-testid="booking-form-submit-btn"
                className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98]"
              >
                Записатись
              </button>

              <button
                type="button"
                onClick={onBack}
                data-testid="booking-form-back-btn"
                className="flex-1 rounded-2xl border border-stone-200 bg-white py-3.5 text-sm font-bold text-stone-800 transition-colors duration-200 hover:bg-stone-50 active:scale-[0.98]"
              >
                Назад
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}