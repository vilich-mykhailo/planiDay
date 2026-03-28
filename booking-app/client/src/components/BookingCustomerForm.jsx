// BookingCustomerForm.jsx
import { motion } from "framer-motion";
import { X, CheckCheck, CalendarDays, Clock3, User, Scissors, Banknote, Building2 } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function DetailRow({ icon, label, value, strong = false }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 text-sm leading-5 text-stone-700",
            strong && "font-bold text-stone-900",
          )}
        >
          {value || "—"}
        </p>
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
                  Підтвердження запису
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Перевірте всі дані перед підтвердженням
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
            className="space-y-4 px-7 py-6"
            data-testid="booking-customer-form"
          >
            <DetailRow
              icon={<Building2 className="h-4 w-4" />}
              label="Студія"
              value={bookingDetails?.studioName}
              strong
            />

            <DetailRow
              icon={<Scissors className="h-4 w-4" />}
              label="Послуга"
              value={bookingDetails?.serviceName}
            />

            <DetailRow
              icon={<User className="h-4 w-4" />}
              label="Майстер"
              value={bookingDetails?.masterName}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Дата"
                value={bookingDetails?.date}
              />

              <DetailRow
                icon={<Clock3 className="h-4 w-4" />}
                label="Час"
                value={bookingDetails?.time}
                strong
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow
                icon={<Clock3 className="h-4 w-4" />}
                label="Тривалість"
                value={bookingDetails?.duration}
              />

              <DetailRow
                icon={<Banknote className="h-4 w-4" />}
                label="Вартість"
                value={bookingDetails?.price}
                strong
              />
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-3">
              <p className="text-xs leading-5 text-stone-500">
                Після підтвердження студія отримає ваш запит на бронювання.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                data-testid="booking-form-submit-btn"
                className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98]"
              >
                Підтвердити запис
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