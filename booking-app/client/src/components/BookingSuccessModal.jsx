// BookingSuccessModal.jsx
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock3,
  CalendarDays,
  UserRound,
  Banknote,
  ChevronRight,
  CheckCheck,
  FilePenLine,
  Timer,
  MapPin,
  Sparkles,
  Copy,
} from "lucide-react";
import confetti from "canvas-confetti";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function toPublicUrl(value) {
  const normalized = String(value || "").trim();

  if (!normalized) return "";
  if (/^https?:\/\//i.test(normalized)) return normalized;

  return PUBLIC ? `${PUBLIC}/${normalized}` : normalized;
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

export default function BookingSuccessModal({
  bookingDetails,
  onClose,
  onViewBookings,
}) {
  const [addressCopied, setAddressCopied] = useState(false);

  const successMode = bookingDetails?.successMode || "create";
  const isReschedule = successMode === "reschedule";

  const studioName = bookingDetails?.studioName || "Студія";
  const studioLogo = toPublicUrl(bookingDetails?.studioLogo);
  const studioAddress = bookingDetails?.address || "";

  const masterName =
    bookingDetails?.masterName || "Буде призначено автоматично";

  const isAutoMaster = String(masterName)
    .toLowerCase()
    .includes("автоматично");

  const masterPhoto = isAutoMaster
    ? ""
    : toPublicUrl(bookingDetails?.masterPhoto);

  const modalTitle = isReschedule
    ? "Запис успішно перенесено"
    : "Запис успішно створено";

  useEffect(() => {
    const scrollY = window.scrollY;

    document.body.dataset.scrollLockY = String(scrollY);

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      const savedY = Number(
        document.body.dataset.scrollLockY || scrollY,
      );

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

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.72 },
      colors: ["#ff6200", "#ffd6bd", "#2C2C2C", "#ffffff"],
    });
  }, []);

  useEffect(() => {
    triggerConfetti();
  }, [triggerConfetti]);

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
      value: "Очікує підтвердження студії",
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

  const quickDetails = [
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
    icon: Timer,
    label: "Тривалість",
    value: bookingDetails?.duration || "—",
  },
  {
    icon: Banknote,
    label: "Ціна",
    value: bookingDetails?.price || "—",
  },
];

const additionalDetails = details.filter(
  (item) =>
    !["Статус", "Дата", "Час", "Тривалість", "Ціна"].includes(
      item.label,
    ),
);

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[220] bg-[#202020]/45 backdrop-blur-[7px]"
          onClick={onClose}
        />

        <div className="fixed inset-0 z-[221] flex items-end justify-center p-0 sm:items-center sm:p-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 24 }}
            transition={{
              duration: 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={(event) => event.stopPropagation()}
className={cn(
  "relative flex w-full flex-col overflow-hidden bg-[#f0fdf4]",
  "h-[100dvh] rounded-none shadow-[0_35px_100px_rgba(22,101,52,0.20)]",
  "sm:h-auto sm:max-h-[90dvh] sm:max-w-[590px] sm:rounded-[34px] sm:border sm:border-[#bbf7d0]",
)}
          >
            {/* Шапка */}
           <div className="relative shrink-0 overflow-hidden bg-[#dcfce7] px-5 pb-5 pt-[max(16px,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
            <div className="absolute right-[-70px] top-[-90px] h-[220px] w-[220px] rounded-full bg-[#22c55e]/15 blur-3xl" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
<span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#16a34a] shadow-[0_8px_20px_rgba(34,197,94,0.12)]">
  <CheckCheck className="h-3.5 w-3.5" />

  {isReschedule ? "Запис перенесено" : "Запит створено"}
</span>

                  <h2 className="mt-4 text-[25px] font-black leading-none tracking-[-0.05em] text-[#202020] sm:text-[28px]">
                    {modalTitle}
                  </h2>

<p className="mt-2 text-[13px] font-semibold text-[#15803d]">
  Запит надіслано студії
</p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#77716b] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96]"
                  aria-label="Закрити"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Контент */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#f0fdf4] px-5 pb-5 pt-4 sm:px-6">
              {/* Статус запису */}
<div className="mb-3 flex justify-center">
  <span
    className="
      inline-flex min-h-8 items-center justify-center gap-1.5
      rounded-full border border-[#fed7aa] bg-white
      px-4 py-1.5 text-center text-[11px] font-black
      leading-tight text-[#ff6200]
      shadow-[0_8px_20px_rgba(255,98,0,0.08)]

      max-[639px]:min-h-7
      max-[639px]:gap-1
      max-[639px]:px-3
      max-[639px]:py-1
      max-[639px]:text-[9px]
    "
  >
    <Clock3 className="h-3.5 w-3.5 shrink-0 max-[639px]:h-3 max-[639px]:w-3" />

    Очікує підтвердження студії
  </span>
</div>
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
{/* Швидкі деталі */}
<div className="mt-4 grid grid-cols-4 gap-2 max-[639px]:gap-1.5">
  {quickDetails.map((item) => {
    const Icon = item.icon;

    return (
      <div
        key={item.label}
className="
  flex min-h-[94px] flex-col items-center justify-center
  rounded-[18px] border border-[#eadfce] bg-white
  px-2 py-2 text-center
  shadow-[0_10px_26px_rgba(15,23,42,0.05)]

  max-[639px]:min-h-[78px]
  max-[639px]:rounded-[14px]
  max-[639px]:px-1
  max-[639px]:py-1.5
"
      >
<div className="grid place-items-center">
<Icon className="h-5 w-5 text-[#ff6200] max-[639px]:h-4 max-[639px]:w-4" />
</div>

<span className="mt-1.5 text-[12px] font-semibold text-[#77716b] max-[639px]:mt-1 max-[639px]:text-[10px]">
  {item.label}
</span>

<span className="mt-0.5 line-clamp-2 text-[13px] font-black leading-[1.1] text-[#202020] max-[639px]:text-[10px]">
  {item.value}
</span>
      </div>
    );
  })}
</div>

{/* Інші деталі */}
<div className="mt-3 overflow-hidden rounded-[20px] border border-[#eadfce] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
  {additionalDetails.map((item) => {
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
      : "text-[#ff6200]",
  )}
>
          {item.photo ? (
            <img
              src={item.photo}
              alt={item.value}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>

        <span className="min-w-0 flex-1 text-[14px] font-bold text-[#77716b]">
          {item.label}
        </span>

        {item.badge ? (
          <span className="inline-flex min-h-7 max-w-[55%] items-center gap-1 rounded-full border border-[#fed7aa] text-[#ff6200] px-2 py-1 text-right text-[9px] font-black leading-[1.05] ">
            <Clock3 className="h-3 w-3 shrink-0" />
            {item.value}
          </span>
        ) : (
          <span className="max-w-[58%] text-right text-[13px] font-black leading-tight text-[#202020]">
            {item.value}
          </span>
        )}
      </div>
    );
  })}
</div>
            </div>

            {/* Кнопки */}
           <div className="grid shrink-0 grid-cols-[0.8fr_1.2fr] gap-2 border-t border-[#bbf7d0] bg-[#dcfce7] px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-12 items-center justify-center rounded-[16px] border border-[#eadfce] bg-white px-4 text-sm font-black text-[#2C2C2C] transition hover:border-[#ffd6bd] hover:bg-[#fff7f0] active:scale-[0.98]"
              >
                Закрити
              </button>
              <button
  type="button"
  onClick={onViewBookings}
  className="
    group inline-flex h-12 items-center justify-center gap-2
    rounded-[16px]
    border border-[#202020]
    bg-[#202020]
    px-4
    text-sm font-black text-white
    shadow-[0_12px_26px_rgba(15,15,15,0.18)]
    transition-all duration-300
    hover:scale-[1.015]
    hover:border-[#ff6200]
    hover:bg-[#ff6200]
    hover:shadow-[0_14px_30px_rgba(255,98,0,0.24)]
    active:scale-[0.98]
  "
>
  Мої записи

  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
</button>
            </div>
          </motion.div>
        </div>
      </>
    </AnimatePresence>
  );
}