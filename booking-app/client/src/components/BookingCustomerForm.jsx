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
  ChevronLeft,
  AlertCircle,
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

function CheckIcon() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]">
      <span className="h-1.5 w-1.5 rounded-full bg-white" />
    </span>
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
      className="fixed inset-0 z-50 bg-[var(--color-bg)]/45 backdrop-blur-[7px]"
      onClick={onBack}
      data-testid="booking-form-backdrop"
    />

    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 24 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative flex w-full flex-col overflow-hidden bg-white",
          "h-[100dvh] rounded-none border-0 shadow-none",
          "sm:h-auto sm:max-h-[86vh] sm:max-w-[420px] sm:rounded-[34px] sm:border sm:border-[var(--color-cream)] sm:shadow-[0_35px_100px_rgba(27,27,27,0.18)]",
        )}
        onClick={(e) => e.stopPropagation()}
        data-testid="booking-form-modal"
      >
        <div className="relative bg-gradient-to-b from-[var(--color-pending-light)] via-white to-white px-5 pb-5 pt-[max(16px,env(safe-area-inset-top))] sm:pt-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%)]" />

          <div className="relative flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--color-ink)] shadow-[0_4px_18px_rgba(27,27,27,0.08)] transition hover:bg-[var(--color-cream)]"
              aria-label="Назад"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="w-11" />
          </div>

          <div className="relative mt-4 flex justify-center">
<div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[13px] font-semibold shadow-[0_4px_18px_rgba(27,27,27,0.06)] backdrop-blur">
  <AlertCircle className="h-4 w-4 text-[var(--color-pending-dark)]" />
  <span className="text-[var(--color-pending-dark)]">
    Майже готово — підтвердіть запис
  </span>
</div>
          </div>

          <div className="relative mt-5 text-center">
            <h2 className="text-[24px] font-black leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
              {bookingDetails?.serviceName || "Послуга"}
            </h2>

            <p className="mt-1 text-sm font-medium text-[var(--color-ink-soft)]">
              Перевірте всі дані перед підтвердженням
            </p>
          </div>

          <div className="relative mt-4 grid grid-cols-3 gap-2">
            <div className="inline-flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[22px] bg-white px-3 py-2 text-sm font-semibold shadow-sm">
              <Clock3 className="h-4 w-4 text-[var(--color-pending-dark)]" />
              <span className="text-[var(--color-ink)]">
                {bookingDetails?.time || "—"}
              </span>
            </div>

            <div className="inline-flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[22px] bg-white px-3 py-2 text-sm font-semibold shadow-sm">
              <Banknote className="h-4 w-4 text-[var(--color-pending-dark)]" />
              <span className="text-[var(--color-ink)]">
                {bookingDetails?.price || "—"}
              </span>
            </div>

            <div className="inline-flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[22px] bg-white px-3 py-2 text-sm font-semibold shadow-sm">
              <Clock className="h-4 w-4 text-[var(--color-pending-dark)]" />
              <span className="text-[var(--color-ink)]">
                {bookingDetails?.duration || "—"}
              </span>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative flex min-h-0 flex-1 flex-col px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-5"
          data-testid="booking-customer-form"
        >
          <div className="min-h-0 flex-1 overflow-y-auto pb-16 sm:pb-6">
            <div className="space-y-3">
              <div className="rounded-[26px] border border-[#e6ebe3] p-4 shadow-[0_8px_24px_rgba(120,140,120,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--color-ink)] shadow-sm">
                    <CalendarDays className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-caramel)]">
                      Дата
                    </span>
<p className="truncate text-[15px] font-extrabold text-[var(--color-ink)]">
  {bookingDetails?.date
    ? new Date(bookingDetails.date).toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—"}{" "}
  </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-[#e6ebe3] p-4 shadow-[0_8px_24px_rgba(120,140,120,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--color-ink)] shadow-sm">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-caramel)]">
                      Студія
                    </span>

                    <p className="truncate text-[15px] font-extrabold text-[var(--color-ink)]">
                      {bookingDetails?.studioName || "—"}
                    </p>

                    {studioAddress && (
                      <p className="mt-0.5 truncate text-xs text-[var(--color-caramel)]">
                        {studioAddress}
                      </p>
                    )}
                  </div>

                  {studioAddress ? (
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--color-ink)] shadow-sm transition hover:bg-[var(--color-cream)]"
                      aria-label="Скопіювати адресу"
                      title="Скопіювати адресу"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-2xl bg-white" />
                  )}
                </div>
              </div>

              <div className="rounded-[26px] border border-[#e6ebe3] p-4 shadow-[0_8px_24px_rgba(120,140,120,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--color-ink)] shadow-sm">
                    <User className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-caramel)]">
                      Майстер
                    </span>

                    <p className="truncate text-[15px] font-extrabold text-[var(--color-ink)]">
                      {bookingDetails?.masterName || "Довільний майстер"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 pt-2">
            <button
              type="submit"
              data-testid="booking-form-submit-btn"
              className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-[22px] px-4 text-sm font-bold text-white transition-all duration-200 active:scale-[0.98]",
                "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",
                "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]",
              )}
            >
              Підтвердити
            </button>

            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[22px] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
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