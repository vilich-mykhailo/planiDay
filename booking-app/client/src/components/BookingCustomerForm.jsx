// BookingCustomerForm.jsx
import { motion } from "framer-motion";
import {
  X,
  Clock,
  CalendarDays,
  Clock3,
  User,
  Banknote,
  Building2,
    Copy,
} from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatDateUA(dateStr) {
  if (!dateStr) return "—";

  const str = String(dateStr).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split("-");
    return `${day}.${month}.${year}`;
  }

  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}.${month}.${year}`;
}

function InfoCard({
  icon,
  label,
  value,
  strong = false,
  className = "",
  subValue,
  onCopy,
}) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-stone-200 bg-white px-3 py-3 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-700">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
            {label}
          </p>

          <p
            className={cn(
              "mt-0.5 break-words text-[15px] leading-5 text-stone-700",
              strong && "font-black text-stone-900",
            )}
          >
            {value || "—"}
          </p>

          {subValue && (
            <div className="mt-1.5 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[12px] leading-4 text-stone-500">
                {subValue}
              </p>

              {onCopy && (
                <button
                  type="button"
                  onClick={onCopy}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700 active:scale-95"
                  aria-label="Скопіювати адресу"
                  title="Скопіювати адресу"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingCustomerForm({
  bookingDetails,
  onSubmit,
  onBack,
}) {
  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(e);
  }


const studioAddress = bookingDetails?.address || "";

function copyAddress() {
  if (!studioAddress) return;
  navigator.clipboard.writeText(studioAddress).catch(() => {});
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

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)] sm:max-h-[92vh] sm:rounded-[32px]"
          onClick={(e) => e.stopPropagation()}
          data-testid="booking-form-modal"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-50/80 to-transparent" />

          <div className="relative border-b border-stone-100 px-4 py-3 sm:px-5 sm:py-4">
            <div className="mb-3 flex justify-center sm:hidden">
              <div className="h-1.5 w-14 rounded-full bg-stone-300" />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-bold uppercase tracking-[0.12em] text-amber-600">
                  Підтвердження запису
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Перевірте всі дані перед підтвердженням
                </p>
              </div>

              <button
                type="button"
                onClick={onBack}
                data-testid="booking-form-close-btn"
                className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-200 hover:text-stone-700 active:scale-95"
                aria-label="Закрити"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="max-h-[calc(90vh-64px)] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5"
            data-testid="booking-customer-form"
          >
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50 p-5 sm:p-6">
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/40 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-white/30 blur-2xl" />

                <div className="relative flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">
                        Ваш запис
                      </p>

                      <h2
                        className="mt-2 text-2xl font-black leading-tight tracking-tight text-stone-900"
                        data-testid="booking-form-title"
                      >
                        {bookingDetails?.serviceName || "Послуга"}
                      </h2>

                      <div className="mt-3 inline-flex items-center gap-3 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-black text-amber-700 shadow-sm">
                        <span className="inline-flex items-center gap-1">
                          <Banknote className="h-4 w-4" />
                          {bookingDetails?.price || "—"}
                        </span>

                        <span className="h-3 w-px bg-amber-200" />

                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-4 w-4" />
                          {bookingDetails?.duration || "—"}
                        </span>
                      </div>
                    </div>

<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
 <Clock className="h-7 w-7" />
</div>
                  </div>

                  <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 backdrop-blur">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                        <CalendarDays className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                          Дата і час
                        </p>

                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm font-bold text-stone-800">
                          <span>{formatDateUA(bookingDetails?.date)}</span>
                          <span className="text-stone-400">•</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-4 w-4" />
                            {bookingDetails?.time || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
<InfoCard
  icon={<Building2 className="h-5 w-5" />}
  label="Студія"
  value={bookingDetails?.studioName}
  subValue={studioAddress}
  onCopy={copyAddress}
  strong
/>

                <InfoCard
                  icon={<User className="h-5 w-5" />}
                  label="Майстер"
                  value={bookingDetails?.masterName || "Довільний майстер"}
                />
              </div>
            </div>

            <div className="mt-5 border-t border-stone-100 pt-4">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="submit"
                  data-testid="booking-form-submit-btn"
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(5,150,105,0.28)] transition hover:bg-emerald-700 active:scale-[0.98]"
                >
                  Підтвердити запис
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}