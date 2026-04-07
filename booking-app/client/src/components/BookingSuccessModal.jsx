// BookingSuccessModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCheck,
  CalendarDays,
  UserRound,
  Sparkles,
  Users,
  Clock3,
  Banknote,
  Building2 ,
  X,
  ChevronRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatDateUA(dateStr) {
  if (!dateStr) return "";

  const [y, m, d] = String(dateStr).split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);

  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();

  return `${dd}.${mm}.${yyyy}`;
}

export default function BookingSuccessModal({
  bookingDetails,
  onClose,
  onViewBookings,
}) {
  const triggerConfetti = React.useCallback(() => {
    const count = 150;
    const defaults = { origin: { y: 0.6 } };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        colors: ["#10b981", "#34d399", "#f59e0b", "#fde68a"],
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  React.useEffect(() => {
    triggerConfetti();

    const timeout = setTimeout(() => {
      triggerConfetti();
    }, 400);

    return () => clearTimeout(timeout);
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
      <div
        className="fixed inset-0 z-[220] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-[8px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 18 }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-[0_35px_120px_rgba(15,23,42,0.24)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.12),transparent_28%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-50 via-amber-50/60 to-transparent" />
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/25 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-200/20 blur-3xl" />

          <div className="relative px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">


            <div className="mt-4 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-2xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-[0_18px_45px_rgba(16,185,129,0.30)]">
                  <CheckCheck className="h-10 w-10" />
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-[28px] font-black leading-[1.05] tracking-[-0.04em] text-stone-900">
                Ви успішно
                <br />
                записались
              </h2>

            </div>

            <div className="mt-4 overflow-hidden rounded-[26px] border border-stone-200/80 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
              <div className="h-[3px] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

              <div className="space-y-4 p-4">
{studioName ? (
  <div className="flex items-start gap-3">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
      <Building2  className="h-5 w-5" />
    </div>

    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
        Студія
      </p>
      <p className="mt-1 text-sm font-black text-stone-900">
        {studioName}
      </p>
    </div>
  </div>
) : null}

                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                      Послуга
                    </p>
                    <p className="mt-1 text-sm font-black text-stone-900">
                      {serviceName || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                    {isAutoMaster ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      <UserRound className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                      Майстер
                    </p>
                    <p className="mt-1 text-sm font-black text-stone-900">
                      {masterName || "—"}
                    </p>
                  </div>
                </div>

<div className="rounded-2xl bg-stone-50 p-3.5">
  <div className="flex items-center gap-3">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-500 shadow-sm">
      <CalendarDays className="h-5 w-5" />
    </div>

    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
        Дата і час
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-black text-stone-900">
        <span>{formattedDate || "—"}</span>
        <span className="text-stone-400">•</span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="h-4 w-4 text-stone-500" />
          {time || "—"}
        </span>
      </div>
    </div>
  </div>
</div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                      Ціна
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-black text-stone-900">
                      <Banknote className="h-4 w-4 text-emerald-700" />
                      {price || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                      Тривалість
                    </p>
                    <p className="mt-1 text-sm font-black text-stone-900">
                      {duration || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

           <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onClose}
               className="group inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-[0_12px_28px_rgba(16,185,129,0.10)] active:scale-[0.98]"
              >
                Готово
              </button>
              <button
                type="button"
                onClick={onViewBookings}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 text-sm font-bold text-white shadow-[0_14px_34px_rgba(16,185,129,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-[0_18px_40px_rgba(16,185,129,0.30)] active:scale-[0.98]"
               
              >
                Мої записи
                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}