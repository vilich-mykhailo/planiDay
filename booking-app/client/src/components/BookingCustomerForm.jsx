import { useMemo, useState } from "react";
/* eslint-disable no-unused-vars */
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone } from "lucide-react";

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
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
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
          <div className="relative border-b border-[#E0DCD8] px-7 pb-5 pt-7">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A278]">
              Крок 2 з 2
            </p>
            <h2
              className="text-xl font-semibold text-[#2A2A2A]"
              style={{ fontFamily: "var(--font-heading)" }}
              data-testid="booking-form-title"
            >
              Ваші дані
            </h2>
            <p className="mt-1 text-sm text-[#7A7A7A]">
              Вкажіть ім&apos;я та телефон для підтвердження
            </p>

            <button
              type="button"
              onClick={onBack}
              data-testid="booking-form-close-btn"
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-xl border border-[#E0DCD8] bg-[#F8F5F2] text-[#7A7A7A] transition-colors duration-200 hover:bg-[#F0EEEA] hover:text-[#2A2A2A]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 px-7 py-6"
            data-testid="booking-customer-form"
          >
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C8A278]">
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
                className="w-full rounded-xl border border-[#E0DCD8] bg-[#F8F5F2] py-3.5 pl-11 pr-4 text-sm text-[#2A2A2A] placeholder:text-[#B0ACA8] transition-colors duration-200 focus:border-[#4A5D4E] focus:outline-none focus:ring-1 focus:ring-[#4A5D4E]/20"
              />
            </div>

            <div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C8A278]">
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
                  className={`w-full rounded-xl border bg-[#F8F5F2] py-3.5 pl-11 pr-4 text-sm text-[#2A2A2A] placeholder:text-[#B0ACA8] transition-colors duration-200 focus:outline-none ${
                    triedSubmit && !isValidPhone
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                      : "border-[#E0DCD8] focus:border-[#4A5D4E] focus:ring-1 focus:ring-[#4A5D4E]/20"
                  }`}
                />
              </div>

              {triedSubmit && !isValidPhone && (
                <p
                  className="mt-1.5 pl-1 text-xs text-red-500"
                  data-testid="booking-form-phone-error"
                >
                  Формат телефону +380 XX XXX XX XX
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                data-testid="booking-form-submit-btn"
                className="flex-1 rounded-xl bg-[#4A5D4E] py-3.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#3A4A3E] active:scale-[0.98]"
              >
                Записатись
              </button>

              <button
                type="button"
                onClick={onBack}
                data-testid="booking-form-back-btn"
                className="flex-1 rounded-xl border border-[#E0DCD8] bg-white py-3.5 text-sm font-bold text-[#2A2A2A] transition-colors duration-200 hover:bg-[#F8F5F2] active:scale-[0.98]"
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