// BookingCustomerForm.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Clock3,
  CalendarDays,
  UserRound,
  Banknote,
  Copy,
  CheckCheck,
  FilePenLine,
  Timer,
  MapPin,
  Sparkles,
} from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatDateUA(dateStr) {
  if (!dateStr || dateStr === "—") return "—";

  const value = String(dateStr).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BookingCustomerForm({
  bookingDetails,
  onSubmit,
  onBack,
}) {
  const [addressCopied, setAddressCopied] = useState(false);

  const studioName = bookingDetails?.studioName || "Студія";
  const studioLogo = bookingDetails?.studioLogo || "";
  const studioAddress = bookingDetails?.address || "";
  const masterPhoto = bookingDetails?.masterPhoto || "";
  const masterName =
    bookingDetails?.masterName || "Буде призначено автоматично";

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit?.(event);
  }

  async function copyAddress() {
    if (!studioAddress) return;

    try {
      await navigator.clipboard.writeText(studioAddress);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = studioAddress;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setAddressCopied(true);

    window.setTimeout(() => {
      setAddressCopied(false);
    }, 1500);
  }

  const details = [
    {
      icon: Clock3,
      label: "Статус",
      value: "Очікує підтвердження",
      badge: true,
    },
    {
      icon: FilePenLine,
      label: "Послуга",
      value: bookingDetails?.serviceName || "—",
    },
    {
      icon: CalendarDays,
      label: "Дата",
      value: formatDateUA(bookingDetails?.date),
    },
    {
      icon: Clock3,
      label: "Час",
      value: bookingDetails?.time || "—",
    },
    {
      icon: UserRound,
      label: "Майстер",
      value: masterName,
      photo: masterPhoto,
    },
    {
      icon: Banknote,
      label: "Ціна",
      value: bookingDetails?.price || "—",
    },
    {
      icon: Timer,
      label: "Тривалість",
      value: bookingDetails?.duration || "—",
    },
  ];

  return (
    <>
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onBack}
        className="fixed inset-0 z-50 bg-[#202020]/45 backdrop-blur-[7px]"
        aria-label="Закрити вікно підтвердження"
        data-testid="booking-form-backdrop"
      />

      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-5">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, scale: 0.97, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 24 }}
          transition={{
            duration: 0.25,
            ease: [0.22, 1, 0.36, 1],
          }}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "relative flex w-full flex-col overflow-hidden bg-[#fdfcfb]",
            "h-[100dvh] rounded-none shadow-[0_35px_100px_rgba(15,23,42,0.22)]",
            "sm:h-auto sm:max-h-[90dvh] sm:max-w-[590px] sm:rounded-[34px] sm:border sm:border-[#eadfce]",
          )}
          data-testid="booking-form-modal"
        >
          {/* Шапка */}
          <div className="relative shrink-0 overflow-hidden bg-[#f3eee7] px-5 pb-5 pt-[max(16px,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
            <div className="absolute right-[-70px] top-[-90px] h-[220px] w-[220px] rounded-full bg-[#ff6200]/10 blur-3xl" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Новий запис
                </span>

                <h2 className="mt-4 text-[25px] font-black leading-none tracking-[-0.05em] text-[#202020] sm:text-[28px]">
                  Підтвердження запису
                </h2>

                <p className="mt-2 text-[13px] font-semibold text-[#77716b]">
                  Перевірте всі дані перед підтвердженням
                </p>
              </div>

              <button
                type="button"
                onClick={onBack}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#77716b] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96]"
                aria-label="Закрити"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Основний контент */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4 sm:px-6">
            {/* Картка студії */}
            <div className="rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-4">
                <div className="h-[105px] w-[125px] shrink-0 overflow-hidden rounded-[20px] border border-[#eadfce] bg-[#f4f0ea] shadow-[0_10px_28px_rgba(15,23,42,0.07)] sm:h-[118px] sm:w-[150px]">
                  {studioLogo ? (
                    <img
                      src={studioLogo}
                      alt={studioName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[#fff3e9] text-[#ff6200]">
                      <Sparkles className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-[19px] font-black leading-tight tracking-[-0.04em] text-[#202020] sm:text-[22px]">
                    {studioName}
                  </h3>

                  {studioAddress && (
                    <div className="mt-3 flex items-start gap-2 text-[12px] font-semibold leading-5 text-[#77716b]">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6200]" />

                      <span className="line-clamp-3 min-w-0 flex-1">
                        {studioAddress}
                      </span>

                      <button
                        type="button"
                        onClick={copyAddress}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#77716b] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-95"
                        title={
                          addressCopied
                            ? "Адресу скопійовано"
                            : "Скопіювати адресу"
                        }
                        aria-label="Скопіювати адресу"
                      >
                        {addressCopied ? (
                          <CheckCheck className="h-4 w-4 text-[#22c55e]" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Деталі запису */}
            <div className="mt-4 overflow-hidden rounded-[20px] border border-[#eadfce] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
              {details.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex min-h-[54px] items-center gap-3 border-b border-[#eee8df] px-4 last:border-b-0"
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden",
                        item.photo
                          ? "rounded-full border border-[#eadfce] bg-white p-0.5 shadow-sm"
                          : item.badge
                            ? "rounded-[14px] border border-[#fed7aa] bg-[#fff7ed] text-[#ff6200]"
                            : "rounded-[14px] bg-[#f8f5f1] text-[#77716b]",
                      )}
                    >
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.value}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <Icon className="h-[18px] w-[18px]" />
                      )}
                    </div>

                    <span className="min-w-0 flex-1 text-[14px] font-bold text-[#77716b]">
                      {item.label}
                    </span>

                    {item.badge ? (
                      <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#fed7aa] bg-[#fff7ed] px-3 text-right text-[11px] font-black text-[#ff6200]">
                        <Clock3 className="h-3.5 w-3.5 shrink-0" />
                        {item.value}
                      </span>
                    ) : (
                      <span className="max-w-[58%] text-right text-[13px] font-black leading-tight text-[#202020] sm:text-[14px]">
                        {item.value}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Кнопки */}
          <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-[#eadfce] bg-[#fbfaf8] px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
            <button
              type="submit"
              data-testid="booking-form-submit-btn"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] border border-[#2C2C2C] bg-[#2C2C2C] px-4 text-sm font-black text-white transition hover:bg-[#1f1f1f] active:scale-[0.98]"
            >
              <CheckCheck className="h-4.5 w-4.5" />
              Підтвердити
            </button>

            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-12 items-center justify-center rounded-[16px] border border-[#eadfce] bg-white px-4 text-sm font-black text-[#2C2C2C] transition hover:border-[#ffd6bd] hover:bg-[#fff7f0] active:scale-[0.98]"
            >
              Назад
            </button>
          </div>
        </motion.form>
      </div>
    </>
  );
}