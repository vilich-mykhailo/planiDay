// BookingSuccessModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  CalendarDays,
  Clock3,
  UserRound,
  Banknote,
  Building2,
  ChevronRight,
  AlertCircle,
  CheckCheck ,
  Sparkles,
  Receipt ,
  CircleCheckBig,
  Tag,
  Users,
} from "lucide-react";
import confetti from "canvas-confetti";
import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatDateUA(dateStr) {
  if (!dateStr) return "—";

  const str = String(dateStr).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split("-");
    const dt = new Date(Number(year), Number(month) - 1, Number(day));

    return dt.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;

  return d.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BookingSuccessModal({
  bookingDetails,
  onClose,
  onViewBookings,
}) {

  React.useEffect(() => {
  const scrollY = window.scrollY;

  document.body.dataset.scrollLockY = String(scrollY);

  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
  document.body.style.overflow = "hidden";

  document.documentElement.style.overflow = "hidden";

  return () => {
    const savedY = Number(document.body.dataset.scrollLockY || scrollY);

    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.overflow = "";

    document.documentElement.style.overflow = "";
    document.documentElement.style.overscrollBehavior = "";

    delete document.body.dataset.scrollLockY;

    requestAnimationFrame(() => {
      window.scrollTo(0, savedY);
    });
  };
}, []);

  const triggerConfetti = React.useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.72 },
      colors: ["#b48c6c", "#f0e5ce", "#324e29", "#f7f5ef"],
    });
  }, []);

  React.useEffect(() => {
    triggerConfetti();
  }, [triggerConfetti]);

  const {
    studioName,
    serviceName,
    masterName,
    date,
    time,
    price,
    duration,
  } = bookingDetails || {};

  const formattedDate = formatDateUA(date);

  const isAutoMaster = String(masterName || "")
    .toLowerCase()
    .includes("автоматично");

return (
  <AnimatePresence>
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[220] bg-[var(--color-bg)]/45 backdrop-blur-[7px]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[221] flex items-end justify-center p-0 sm:items-center sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "relative flex w-full flex-col overflow-hidden bg-white",
            "h-[100dvh] rounded-none border-0 shadow-none",
            "sm:h-auto sm:max-h-[86vh] sm:max-w-[420px] sm:rounded-[34px] sm:border sm:border-[var(--color-cream)] sm:shadow-[0_35px_100px_rgba(27,27,27,0.18)]",
          )}
        >
          {/* HEADER */}
          <div className="relative bg-gradient-to-b from-[var(--color-pending-light)] via-white to-white px-5 pb-6 pt-[max(16px,env(safe-area-inset-top))] sm:pt-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%)]" />
<div className="relative flex items-center justify-end">
  <button
    type="button"
    onClick={onClose}
    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--color-ink)] shadow-[0_4px_18px_rgba(27,27,27,0.08)] transition hover:bg-[var(--color-cream)]"
    aria-label="Закрити"
  >
    <X className="h-5 w-5" />
  </button>
</div>

            {/* badge */}
            <div className="relative mt-4 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[13px] font-semibold shadow-[0_4px_18px_rgba(27,27,27,0.06)] backdrop-blur">
                <AlertCircle className="h-4 w-4 text-[var(--color-pending-dark)]" />
                <span className="text-[var(--color-pending-dark)]">
                  Очікуємо підтвердження студії
                </span>
              </div>
            </div>

            {/* BIG ICON */}
<div className=" mt-4 mb-4 flex justify-center">
<div className="flex h-35 w-35 shrink-0 items-center justify-center ">
  <CircleCheckBig className="h-28 w-28 text-[var(--color-confirmed-dark)]" />
</div>
</div>

            {/* TEXT */}
            <div className=" text-center">
              <h2 className="text-[24px] font-black leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                Запис успішно створено
              </h2>

<div className="mt-4 grid grid-cols-1 gap-2 text-left">
  
  {/* Студія */}
  {bookingDetails?.studioName && (
    <div className="flex items-center gap-3 rounded-[20px] border border-stone-200 bg-white px-3 py-3 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.08)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-700">
        <Building2 className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
          Студія
        </p>
        <p className="mt-0.5 truncate text-[15px] font-black text-stone-900">
          {bookingDetails?.studioName}
        </p>
      </div>
    </div>
  )}
  {/* Послуга */}
  <div className="flex items-center gap-3 rounded-[20px] border border-stone-200 bg-white px-3 py-3 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.08)]">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-700">
      <Sparkles className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
        Послуга
      </p>
      <p className="mt-0.5 truncate text-[15px] font-black text-stone-900">
        {bookingDetails?.serviceName || "—"}
      </p>
    </div>
  </div>

  {/* Дата і час */}
  <div className="flex items-center gap-3 rounded-[20px] border border-stone-200 bg-white px-3 py-3 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.08)]">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-700">
      <CalendarDays className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
        Дата і час
      </p>
      <p className="mt-0.5 text-[15px] font-black text-stone-900">
        {bookingDetails?.date
          ? new Date(bookingDetails.date).toLocaleDateString("uk-UA", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "—"}{" "}
        • {bookingDetails?.time || "—"}
      </p>
    </div>
  </div>

<div className="grid grid-cols-2 gap-2">
  {/* Ціна */}
  <div className="flex items-center gap-3 rounded-[20px] border border-stone-200 bg-white px-3 py-3 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.08)]">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-700">
      <Banknote className="h-4 w-4" />
    </div>

    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
        Ціна
      </p>
      <p className="mt-0.5 text-[14px] font-black text-stone-900">
        {bookingDetails?.price || "—"}
      </p>
    </div>
  </div>

  {/* Тривалість */}
  <div className="flex items-center gap-3 rounded-[20px] border border-stone-200 bg-white px-3 py-3 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.08)]">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-700">
      <Clock className="h-4 w-4" />
    </div>

    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
        Тривалість
      </p>
      <p className="mt-0.5 text-[14px] font-black text-stone-900">
        {bookingDetails?.duration || "—"}
      </p>
    </div>
  </div>
</div>
</div>
            </div>
          </div>

          {/* ACTIONS */}
<div className="mt-auto flex justify-end px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-5">
  <button
    type="button"
    onClick={onViewBookings}
    className={cn(
      "group inline-flex h-12 items-center justify-center gap-2 rounded-[22px] px-5 text-sm font-bold text-white transition-all duration-200 active:scale-[0.98]",
      "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",
      "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]",
    )}
  >
    Мої записи
    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
  </button>
</div>
        </motion.div>
      </div>
    </>
  </AnimatePresence>
);
}