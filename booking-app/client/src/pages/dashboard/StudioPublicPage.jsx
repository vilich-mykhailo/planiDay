// StudioPublicPage.jsx
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardPen, ClipboardPenIcon } from "lucide-react";
import BookingSuccessModal from "../../components/BookingSuccessModal";
import { useFavourites } from "../../context/favourites.context";
import { savePendingAuthAction } from "../../utils/pendingAuthAction";
import {
  MapPin,
  Clock,
  Banknote,
  ChevronDown,
  Copy,
  CheckCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  Star,
  Heart,
  Share2,
  Phone,
  Crown,
} from "lucide-react";
import StudioBookingWidget from "../../components/StudioBookingWidget";

const R2_PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const ACTIVE_SELECTION_CLASS =
  "border-[#ef4444] bg-[#ff6200]/15 text-[#202020] ring-2 ring-[#ef4444]/15";

const ACTIVE_SELECTION_ICON =
  "border-[#ef4444] bg-[#ff6200]/20 text-[#ef4444]";
  
function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return R2_PUBLIC ? `${R2_PUBLIC}/${s}` : s;
}

function safe(v) {
  return String(v || "").trim();
}

function parsePortfolio(value) {
  if (Array.isArray(value)) return value.map(toPublicUrl).filter(Boolean);

  const raw = String(value || "").trim();
  if (!raw) return [];

  return raw
    .split(/[\n,]/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(toPublicUrl);
}

function heroIconButtonClass(active = false) {
  return cn(
    "group grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-[0_10px_28px_rgba(15,23,42,0.18)] backdrop-blur-md",
    "transition-all duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20 active:translate-y-[1px] active:scale-[0.97]",
    active && "bg-white text-[#ff5a00] hover:bg-white",
  );
}


function ExpandableText({ text, maxLines = 3 }) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflow, setIsOverflow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    setIsOverflow(el.scrollHeight > el.clientHeight);
  }, [text, maxLines]);

  return (
    <div>
      <p
        ref={ref}
        className={cn(
          "text-sm font-medium leading-7 text-[#77716b] transition-all duration-300",
          !expanded && `line-clamp-${maxLines}`,
        )}
      >
        {text}
      </p>

      {isOverflow && (
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="mt-2 text-xs font-black text-[#ff6200] transition hover:text-[#ef4f00]"
        >
          {expanded ? "Згорнути" : "Показати більше"}
        </button>
      )}
    </div>
  );
}


function SectionShell({ children, className = "" }) {
  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-[15px] border border-[#ebe7df] bg-white shadow-[0_14px_44px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />
      {children}
    </section>
  );
}


function BookingModal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;

    document.body.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
   className="fixed inset-0 z-[9999] flex items-stretch justify-center bg-[#202020]/50 p-0 sm:items-center sm:p-6"
      data-testid="booking-modal"
      role="presentation"
    >
<motion.button
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
        type="button"
        aria-label="Закрити"
        onClick={onClose}
        className="absolute inset-0"
      />

<motion.div
  initial={{ opacity: 0, scale: 0.96, y: 18 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
className={cn(
  "relative z-10 flex h-dvh w-full max-w-2xl flex-col overflow-hidden rounded-none border-0 bg-[#f7f5f1] shadow-[0_30px_90px_rgba(15,23,42,0.24)]",
  "sm:h-[calc(100dvh-48px)] sm:max-h-[860px] sm:rounded-[30px] sm:border sm:border-[#f0e2d3]",
)}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 overflow-hidden bg-[#f3eee7] px-5 py-5 sm:px-6 sm:py-6">
          <div className="absolute right-[-55px] top-[-70px] h-[180px] w-[180px] rounded-full bg-[#ff6200]/10 blur-3xl" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
                <Sparkles className="h-3.5 w-3.5" />
                Онлайн запис
              </span>

              <h3 className="mt-3 text-[26px] font-black leading-[0.95] tracking-[-0.05em] text-[#202020] sm:text-[32px]">
                {title}
              </h3>

              <p className="mt-2 text-sm font-medium leading-6 text-[#77716b]">
                Оберіть послугу, майстра, дату та час.
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

<div className="min-h-0 flex-1 overflow-hidden bg-white">
  {children}
</div>
      </motion.div>
    </div>
  );
}


function ImageLightbox({ open, images = [], startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    setIdx(startIndex);
  }, [startIndex]);

  useEffect(() => {
    if (!open) return;

    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((p) => (p + 1) % images.length);
      if (e.key === "ArrowLeft") {
        setIdx((p) => (p - 1 + images.length) % images.length);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length, onClose]);

  if (!open || !images.length) return null;

  const hasMany = images.length > 1;

  function goNext() {
    setIdx((p) => (p + 1) % images.length);
  }

  function goPrev() {
    setIdx((p) => (p - 1 + images.length) % images.length);
  }

  function handleLightboxDragEnd(_, info) {
    if (!hasMany) return;

    const offsetX = info.offset.x;
    const velocityX = info.velocity.x;

    if (offsetX < -60 || velocityX < -500) {
      goNext();
      return;
    }

    if (offsetX > 60 || velocityX > 500) {
      goPrev();
    }
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/95">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Закрити"
      />

      <div className="absolute inset-x-0 top-0 z-[130] flex items-center justify-between px-4 py-4">
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 backdrop-blur-md">
          {idx + 1} / {images.length}
        </span>

        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#202020] shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {hasMany && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-4 top-1/2 z-[130] hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#202020] shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95 sm:flex"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 top-1/2 z-[130] hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#202020] shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95 sm:flex"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div className="relative z-[121] flex h-full w-full items-center justify-center px-6 py-20 sm:px-12">
        <AnimatePresence mode="wait">
          <motion.img
            key={idx}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            drag={hasMany ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={handleLightboxDragEnd}
            src={images[idx]}
            alt={`Фото ${idx + 1}`}
            className="max-h-[80vh] max-w-full select-none rounded-2xl object-contain shadow-2xl cursor-grab active:cursor-grabbing touch-pan-y"
            draggable="false"
          />
        </AnimatePresence>
      </div>
    </div>
  );
}

function ServiceRow({ service, onBook }) {
  return (
    <div className="group overflow-hidden rounded-[18px] border border-[#eadfce] bg-white text-left transition-all duration-200 hover:border-[#ffd6bd] hover:bg-[#fff7f0] active:scale-[0.99] sm:rounded-[24px] sm:hover:-translate-y-0.5">
      <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3 gap-y-2.5 p-3 sm:flex sm:items-center sm:gap-4 sm:px-5 sm:py-5">
        {/* Іконка */}
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-[#eadbc9] bg-[#fff1e8] text-[#ff6200] sm:h-12 sm:w-12 sm:rounded-2xl">
          <ClipboardPen className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
        </div>

        {/* Назва і параметри */}
        <div className="min-w-0 self-center sm:flex-1">
          <h3 className="line-clamp-3 text-[13px] font-black leading-[1.25] tracking-[-0.02em] text-[#202020] sm:line-clamp-2 sm:text-base sm:leading-tight">
            {service.name}
          </h3>

          {!!service.description && (
            <p className="mt-1 hidden line-clamp-2 text-sm font-medium leading-5 text-[#77716b] sm:block">
              {service.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-black text-[#77716b] sm:mt-3 sm:gap-2 sm:text-xs">
            {service.duration && (
              <span className="inline-flex h-6 items-center gap-1 rounded-full border border-[#eadbc9] bg-white px-2 shadow-sm sm:h-auto sm:gap-1.5 sm:px-2.5 sm:py-1">
                <Clock className="h-3 w-3 text-[#ff6200] sm:h-3.5 sm:w-3.5" />
                {service.duration} хв
              </span>
            )}

            {service.price != null && (
              <span className="inline-flex h-6 items-center gap-1 rounded-full border border-[#eadbc9] bg-white px-2 text-[#202020] shadow-sm sm:h-auto sm:gap-1.5 sm:px-2.5 sm:py-1">
                <Banknote className="h-3 w-3 text-[#ff6200] sm:h-3.5 sm:w-3.5" />
                {service.price} грн
              </span>
            )}
          </div>
        </div>

        {/* Кнопка */}
        <button
          type="button"
          onClick={() => onBook(service)}
          className="col-span-2 inline-flex h-9 w-full items-center justify-center rounded-xl border border-[#ff6200]/40 bg-[#ff6200]/5 px-3 text-[11px] font-black text-[#ff6200] transition-all duration-200 hover:border-[#ff6200]/60 hover:bg-[#ff6200]/10 active:scale-[0.98] sm:col-span-1 sm:h-11 sm:w-auto sm:shrink-0 sm:rounded-2xl sm:px-5 sm:text-sm"
        >
          Забронювати
        </button>
      </div>
    </div>
  );
}


function CategoryAccordion({ category, onBook }) {
  const [open, setOpen] = useState(false);
  const services = category.services || [];

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#eadfce] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all duration-300 hover:border-[#ffd6bd] hover:shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-5 py-5 text-left transition-colors duration-200 hover:bg-[#fff7f0] sm:px-6"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#eadbc9] bg-[#fff1e8] text-[#ff6200] shadow-sm">
            <ClipboardPenIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-black tracking-[-0.03em] text-[#202020] sm:text-lg">
              {category.name}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-[#77716b]">
              {services.length} {services.length === 1 ? "послуга" : "послуг"}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center text-[#77716b] transition-all duration-300",
            open ? "rotate-180 text-[#ff6200]" : "",
          )}
        >
          <ChevronDown className="h-5 w-5" />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#f1ece5] bg-[#fbfaf8] px-4 py-4 sm:px-6">
              {services.length === 0 ? (
                <div className="rounded-[24px] border-2 border-dashed border-[#ffd6bd] bg-[#fffaf6] px-5 py-8 text-center text-sm font-semibold text-[#77716b]">
                  Послуги не додані.
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((s) => (
                    <ServiceRow key={s.id} service={s} onBook={onBook} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function StaffCard({ member }) {
  const photo = toPublicUrl(
    member?.photoUrl || member?.avatar || member?.image,
  );
  const name = safe(member?.name || member?.fullName || member?.title);
  const role = safe(member?.role || member?.position || member?.speciality);
  const initials = name
    ? name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "M";

  return (
    <div className="group flex min-w-0 flex-col items-center text-center">
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[24px] border-2 border-white bg-gradient-to-br from-[#fff1e8] via-white to-[#f2eee8] text-[#ff6200] shadow-[0_10px_26px_rgba(17,17,17,0.10)] transition duration-300 group-hover:scale-[1.03] sm:h-24 sm:w-24">
        {photo ? (
          <img
            src={photo}
            alt={name || "Майстер"}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className="text-3xl font-black tracking-[-0.08em]">
            {initials}
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm font-black tracking-[-0.03em] text-[#202020]">
        {name || "Майстер"}
      </p>
      <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-[#77716b]">
        {role || "Спеціаліст"}
      </p>
    </div>
  );
}


function ReviewCard({ review }) {
  return (
    <div className="rounded-[26px] border border-[#eadfce] bg-white p-5 shadow-[0_8px_25px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffd6bd] hover:bg-[#fff7f0]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#202020]">
            {review.author}
          </p>
          <div className="mt-1 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < review.rating
                    ? "fill-[#ffb020] text-[#ffb020]"
                    : "text-[#eadfce]",
                )}
              />
            ))}
          </div>
        </div>

        <span className="rounded-full bg-[#fff1e8] px-2.5 py-1 text-xs font-black text-[#ff6200]">
          {review.date}
        </span>
      </div>

      <p className="mt-3 text-sm font-medium leading-relaxed text-[#77716b]">
        {review.text}
      </p>
    </div>
  );
}


const WEEK_DAYS = [
  { key: "mon", label: "Понеділок", jsDay: 1 },
  { key: "tue", label: "Вівторок", jsDay: 2 },
  { key: "wed", label: "Середа", jsDay: 3 },
  { key: "thu", label: "Четвер", jsDay: 4 },
  { key: "fri", label: "П’ятниця", jsDay: 5 },
  { key: "sat", label: "Субота", jsDay: 6 },
  { key: "sun", label: "Неділя", jsDay: 0 },
];

const DEMO_REVIEWS = [
  {
    id: 1,
    author: "Marcelina",
    rating: 5,
    date: "8 бер. 2026",
    text: "Хотіла коротку стрижку, але майстер уважно оцінив риси мого обличчя, структуру волосся та навіть стиль життя, після чого порадив іншу форму, яка виглядає гармонійніше та підкреслює мої сильні сторони. Результат перевершив очікування.",
  },
  {
    id: 2,
    author: "Magdalena",
    rating: 5,
    date: "8 бер. 2026",
    text: "Стрижка дитини, як завжди, бездоганна. Дуже приємна атмосфера і хороший сервіс.",
  },
];

function formatHoursLabel(dayConfig) {
  if (!dayConfig?.enabled) return "Вихідний";
  return `${dayConfig.start} - ${dayConfig.end}`;
}

function getTodaySchedule(schedule, exceptions = []) {
  const now = new Date();

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayIso = `${y}-${m}-${d}`;

  const exception = exceptions.find((item) => item.date === todayIso);
  if (exception) {
    if (!exception.enabled) return null;

    return {
      enabled: true,
      start: exception.start,
      end: exception.end,
    };
  }

  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const key = map[now.getDay()];
  const fallback = schedule?.[key];

  if (!fallback?.enabled) return null;
  return fallback;
}

function isStudioOpenNow(schedule, exceptions = []) {
  const today = getTodaySchedule(schedule, exceptions);
  if (!today?.enabled) return false;

  const [sh, sm] = String(today.start || "00:00")
    .split(":")
    .map(Number);
  const [eh, em] = String(today.end || "00:00")
    .split(":")
    .map(Number);

  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return nowMin >= startMin && nowMin < endMin;
}

function buildWeeklyScheduleRows(schedule) {
  return WEEK_DAYS.map((day) => ({
    day: day.label,
    jsDay: day.jsDay,
    hours: formatHoursLabel(schedule?.[day.key]),
  }));
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-[#f2eee8]", className)}
      aria-hidden="true"
    />
  );
}

function getStudioCacheKey(slug) {
  return slug ? `aveliio:studio:${slug}` : "";
}

function readStudioCache(slug) {
  if (!slug) return null;

  try {
    const raw = sessionStorage.getItem(getStudioCacheKey(slug));
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed?.studio || !parsed?.savedAt) {
      return null;
    }

    // Кеш діє 5 хвилин
    const maxAge = 5 * 60 * 1000;

    if (Date.now() - parsed.savedAt > maxAge) {
      sessionStorage.removeItem(getStudioCacheKey(slug));
      return null;
    }

    return parsed.studio;
  } catch {
    return null;
  }
}

function saveStudioCache(slug, studio) {
  if (!slug || !studio) return;

  try {
    sessionStorage.setItem(
      getStudioCacheKey(slug),
      JSON.stringify({
        studio,
        savedAt: Date.now(),
      }),
    );
  } catch {
    // Ігноруємо помилки sessionStorage
  }
}

function StudioPublicPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f5f1] text-[#202020]">
      <div className="mx-auto w-full max-w-[1220px] px-0 sm:px-2 md:px-3 lg:px-6">
        <div className="mx-auto w-full max-w-[1120px] pb-0 text-[#202020] sm:pb-20 lg:pb-5">
          <section className="relative">
            <div className="relative h-[320px] overflow-hidden rounded-b-[24px] bg-[#f2eee8] sm:mx-[-8px] sm:h-[420px] md:mx-[-12px] md:h-[480px] lg:mx-0 lg:h-[520px]">
              <SkeletonBlock className="h-full w-full rounded-none" />

              <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pb-4 pt-4 sm:px-6">
                <SkeletonBlock className="h-12 w-12 rounded-2xl bg-white/40" />
                <div className="flex items-center gap-2.5">
                  <SkeletonBlock className="h-12 w-12 rounded-2xl bg-white/40" />
                  <SkeletonBlock className="h-12 w-12 rounded-2xl bg-white/40" />
                </div>
              </div>
            </div>

            <div className="relative z-10 -mt-14 w-full sm:-mt-16 sm:px-2 md:px-3 lg:mx-auto lg:max-w-[1240px] lg:px-6">
              <SectionShell>
                <div className="px-4 pb-4 pt-4 sm:px-5 md:px-5 sm:pb-6 lg:px-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <SkeletonBlock className="h-16 w-16 shrink-0 rounded-2xl sm:h-20 sm:w-20" />

                      <div className="flex min-w-0 flex-col">
                        <SkeletonBlock className="h-6 w-24 rounded-full" />
                        <SkeletonBlock className="mt-3 h-8 w-48 max-w-full rounded-2xl sm:h-10 sm:w-72" />
                        <SkeletonBlock className="mt-3 h-4 w-56 max-w-full rounded-xl" />
                        <div className="mt-3 flex items-center gap-3">
                          <SkeletonBlock className="h-4 w-28 rounded-xl" />
                          <SkeletonBlock className="h-6 w-28 rounded-full" />
                        </div>
                      </div>
                    </div>

                    <div className="hidden lg:block mt-4">
                      <SkeletonBlock className="h-14 w-56 rounded-2xl" />
                    </div>
                  </div>
                </div>

                <div className="px-2 pb-4 sm:px-5 lg:px-6">
                  <div className="rounded-[26px] px-2 sm:p-6">
                    <SkeletonBlock className="h-4 w-full rounded-xl" />
                    <SkeletonBlock className="mt-2 h-4 w-[92%] rounded-xl" />
                    <SkeletonBlock className="mt-2 h-4 w-[72%] rounded-xl" />
                  </div>
                </div>

                <div className="border-t border-[#f1ece5] bg-white/95 backdrop-blur-xl">
                  <div className="mx-auto max-w-[900px] px-4">
                    <div className="flex justify-center gap-6 py-4">
                      <SkeletonBlock className="h-5 w-20 rounded-xl" />
                      <SkeletonBlock className="h-5 w-20 rounded-xl" />
                      <SkeletonBlock className="h-5 w-20 rounded-xl" />
                      <SkeletonBlock className="h-5 w-20 rounded-xl" />
                    </div>
                  </div>
                </div>

                <div className="px-4 pt-0 sm:px-2 md:px-3 lg:px-6">
                  <section className="scroll-mt-28">
                    <div className="rounded-[30px] px-0 py-4 pb-18 sm:p-6">
                      <div className="mb-5">
                        <SkeletonBlock className="h-3 w-28 rounded-xl" />
                        <SkeletonBlock className="mt-3 h-8 w-56 rounded-2xl" />
                      </div>

                      <SkeletonBlock className="mb-6 h-12 w-full rounded-2xl" />

                      <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <SkeletonBlock className="h-5 w-40 rounded-xl" />
                                <SkeletonBlock className="mt-2 h-4 w-[85%] rounded-xl" />

                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                  <SkeletonBlock className="h-7 w-20 rounded-full" />
                                  <SkeletonBlock className="h-7 w-24 rounded-full" />
                                </div>
                              </div>

                              <SkeletonBlock className="h-10 w-32 rounded-xl" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              </SectionShell>
            </div>
          </section>

          <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
            <div className="relative px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
              <div className="mx-auto max-w-md rounded-[28px]">
                <SkeletonBlock className="h-12 w-full rounded-[22px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudioPublicPage() {
  const { slug } = useParams();
  const cachedStudioRef = useRef(readStudioCache(slug));
  const location = useLocation();
const [studio, setStudio] = useState(() => cachedStudioRef.current);
const [loading, setLoading] = useState(() => !cachedStudioRef.current);
  const [heroImageLoading, setHeroImageLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedHeroSrc, setLoadedHeroSrc] = useState("");
  const [heroPreviewIndex, setHeroPreviewIndex] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [openBooking, setOpenBooking] = useState(false);
  const [preselectedService, setPreselectedService] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [copied, setCopied] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("services");
  const [mobileTab, setMobileTab] = useState("services");
  const [selectedMaster, setSelectedMaster] = useState(null);
  const servicesRef = useRef(null);
  const reviewsRef = useRef(null);
  const portfolioRef = useRef(null);
  const detailsRef = useRef(null);
  const navigate = useNavigate();
const {
  toggleFavourite,
  isFavourite: checkIsFavourite,
  loading: favouritesLoading,
} = useFavourites();
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState(null);
  const [preselectedDate, setPreselectedDate] = useState(null);
  const [preselectedTime, setPreselectedTime] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [heroDirection, setHeroDirection] = useState(0);
  const [showHeroLoader, setShowHeroLoader] = useState(false);

  useEffect(() => {
    const navState = location.state;

    if (!navState?.openBooking) return;
    if (!studio) return;

    setOpenBooking(true);

    if (navState.preselectedService?.serviceId) {
      setPreselectedService({
        serviceId: navState.preselectedService.serviceId,
      });
    } else {
      setPreselectedService(null);
    }

    if (navState.preselectedMasterId) {
      const foundMaster = Array.isArray(studio?.masters)
        ? studio.masters.find(
            (m) => String(m.id) === String(navState.preselectedMasterId),
          )
        : null;

      setSelectedMaster(foundMaster || null);
    } else {
      setSelectedMaster(null);
    }

    setRescheduleMode(Boolean(navState.reschedule));
    setRescheduleBookingId(navState.bookingId || null);
    setPreselectedDate(navState.preselectedDate || null);
    setPreselectedTime(navState.preselectedTime || null);

    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }, [location.state, location.pathname, navigate, studio]);

useEffect(() => {
  if (!slug) {
    setStudio(null);
    setError("Не вказано адресу студії");
    setLoading(false);
    return undefined;
  }

  let alive = true;
  const controller = new AbortController();

  const cachedStudio = readStudioCache(slug);

  if (cachedStudio) {
    setStudio(cachedStudio);
    setLoading(false);
  } else {
    setStudio(null);
    setLoading(true);
  }

  setError("");

  async function loadStudio() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/client/${slug}`,
        {
          signal: controller.signal,
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || `Load failed (${res.status})`,
        );
      }

      const receivedStudio = data?.studio || null;

      if (!receivedStudio) {
        throw new Error("Студію не знайдено");
      }

      const normalized = {
        ...receivedStudio,

        slug: receivedStudio.slug || receivedStudio.id,

        coverUrl: toPublicUrl(receivedStudio.coverUrl),
        logoUrl: toPublicUrl(receivedStudio.logoUrl),

        portfolioUrls: Array.isArray(receivedStudio.portfolioUrls)
          ? receivedStudio.portfolioUrls
          : [],

        schedule: receivedStudio.schedule || {},

        scheduleExceptions: Array.isArray(
          receivedStudio.scheduleExceptions,
        )
          ? receivedStudio.scheduleExceptions.map((item) => ({
              ...item,
              date: String(item?.date || "").slice(0, 10),
            }))
          : [],

        masters: Array.isArray(receivedStudio.masters)
          ? receivedStudio.masters.map((master) => ({
              ...master,

              schedule:
                master?.schedule &&
                typeof master.schedule === "object" &&
                Object.keys(master.schedule).length > 0
                  ? master.schedule
                  : undefined,

              scheduleExceptions: Array.isArray(
                master?.scheduleExceptions,
              )
                ? master.scheduleExceptions.map((item) => ({
                    ...item,
                    date: String(item?.date || "").slice(0, 10),
                  }))
                : [],
            }))
          : [],

        slotDuration:
          typeof receivedStudio.slotDuration === "number"
            ? receivedStudio.slotDuration
            : 15,
      };

      if (!alive) return;

      setStudio(normalized);
      saveStudioCache(slug, normalized);
      setError("");
    } catch (err) {
      if (err?.name === "AbortError") return;
      if (!alive) return;

      console.error("Studio loading failed:", err);

      // Якщо є кеш, залишаємо сторінку з кешу
      if (!cachedStudio) {
        setStudio(null);
        setError(
          String(err?.message || "Не вдалося завантажити студію"),
        );
      }
    } finally {
      if (alive) {
        setLoading(false);
      }
    }
  }

  loadStudio();

  return () => {
    alive = false;
    controller.abort();
  };
}, [slug]);

  const name = safe(studio?.name) || "Студія";
  const category = safe(studio?.category);
  const city = safe(studio?.city);
  const description = safe(studio?.description);
  const coverUrl = studio?.coverUrl || "";
  const logoUrl = studio?.logoUrl || "";
  const address = [studio?.street, studio?.building, studio?.apartment]
    .filter(Boolean)
    .join(", ");
  const fullAddress = [address, city].filter(Boolean).join(", ");
  const portfolio = useMemo(
    () => parsePortfolio(studio?.portfolioUrls),
    [studio],
  );

const heroImages = useMemo(() => {
  const arr = [coverUrl, ...portfolio].filter(Boolean);

  return arr.filter(
    (url, index, self) => self.indexOf(url) === index,
  );
}, [coverUrl, portfolio]);

const isFavourite = studio?.id
  ? checkIsFavourite(studio.id)
  : false;

useEffect(() => {
  const pendingStudioId =
    location.state?.continueFavouriteStudioId;

  if (!pendingStudioId) return;
  if (!studio?.id) return;
  if (favouritesLoading) return;

  navigate(location.pathname, {
    replace: true,
    state: {},
  });

  const isCurrentStudio =
    String(pendingStudioId) === String(studio.id);

  if (!isCurrentStudio || isFavourite) return;

  toggleFavourite(studio).catch((error) => {
    console.error(
      "Continue favourite action failed:",
      error,
    );
  });
}, [
  location.state,
  location.pathname,
  navigate,
  studio,
  isFavourite,
  favouritesLoading,
  toggleFavourite,
]);

useEffect(() => {
  setHeroIndex(0);
  setHeroPreviewIndex(null);
}, [slug]);

  useEffect(() => {
    const nextSrc = heroImages[heroIndex];

    if (!nextSrc) {
      setLoadedHeroSrc("");
      setHeroImageLoading(false);
      setShowHeroLoader(false);
      return;
    }

    setHeroImageLoading(true);
    setLoadedHeroSrc("");
    setShowHeroLoader(false);

    const loaderTimer = setTimeout(() => {
      setShowHeroLoader(true);
    }, 150);

    const img = new Image();
    img.src = nextSrc;

    img.onload = () => {
      clearTimeout(loaderTimer);
      setLoadedHeroSrc(nextSrc);
      setHeroImageLoading(false);
      setShowHeroLoader(false);
    };

    img.onerror = () => {
      clearTimeout(loaderTimer);
      setLoadedHeroSrc("");
      setHeroImageLoading(false);
      setShowHeroLoader(false);
    };

    return () => {
      clearTimeout(loaderTimer);
    };
  }, [heroIndex, heroImages]);

  const filteredUncategorizedServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    const uncategorizedServices = studio?.uncategorizedServices ?? [];

    if (!q) return uncategorizedServices;

    return uncategorizedServices.filter((s) =>
      `${s.name} ${s.description || ""}`.toLowerCase().includes(q),
    );
  }, [search, studio?.uncategorizedServices]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    const serviceCategories = studio?.serviceCategories ?? [];

    if (!q) return serviceCategories;

    return serviceCategories
      .map((cat) => ({
        ...cat,
        services: (cat.services || []).filter((s) =>
          `${s.name} ${s.description || ""}`.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.services.length > 0);
  }, [search, studio?.serviceCategories]);

  const displayedPortfolio = portfolio.slice(0, 12);
  const teamMembers =
    studio?.teamMembers || studio?.employees || studio?.staff || [];
  const studioPhone = safe(
    studio?.phone || studio?.phoneNumber || studio?.contactPhone,
  );
  const weeklyScheduleRows = useMemo(
    () => buildWeeklyScheduleRows(studio?.schedule || {}),
    [studio?.schedule],
  );

  const openNow = useMemo(
    () =>
      isStudioOpenNow(studio?.schedule || {}, studio?.scheduleExceptions || []),
    [studio?.schedule, studio?.scheduleExceptions],
  );
  const reviewsSummary = {
    rating: Number(studio?.rating || 4.9),
    count: Number(studio?.reviewsCount || 1090),
    distribution: studio?.ratingDistribution || {
      5: 1056,
      4: 19,
      3: 6,
      2: 6,
      1: 3,
    },
  };

  const hasRealReviews =
    Array.isArray(studio?.reviews) && studio.reviews.length > 0;

  const reviews = useMemo(() => {
    const source =
      Array.isArray(studio?.reviews) && studio.reviews.length > 0
        ? studio.reviews
        : DEMO_REVIEWS;

    return source.map((r, index) => ({
      id: r.id || index,
      author: r.author || r.name || "Клієнт",
      rating: Number(r.rating || 5),
      date: r.date || r.createdAt || "Нещодавно",
      text: r.text || r.comment || r.message || "Відгук буде доступний скоро.",
    }));
  }, [studio?.reviews]);

  function handleCopyAddress() {
    if (!fullAddress) return;
    navigator.clipboard?.writeText(fullAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

function openBookingForService(service) {
  const hasAccess = requireClientAuth({
    type: "booking",
    serviceId: service?.id || null,
  });

  if (!hasAccess) return;

  setPreselectedService({
    categoryId: null,
    serviceId: service.id,
  });

  setSelectedMaster(null);
  setRescheduleMode(false);
  setRescheduleBookingId(null);
  setPreselectedDate(null);
  setPreselectedTime(null);
  setOpenBooking(true);
}

function openGeneralBooking() {
  const hasAccess = requireClientAuth({
    type: "booking",
    serviceId: null,
  });

  if (!hasAccess) return;

  setPreselectedService(null);
  setSelectedMaster(null);
  setRescheduleMode(false);
  setRescheduleBookingId(null);
  setPreselectedDate(null);
  setPreselectedTime(null);
  setOpenBooking(true);
}

  function scrollToSection(key) {
    setActiveTab(key);
    setMobileTab(key);

    const map = {
      services: servicesRef,
      reviews: reviewsRef,
      portfolio: portfolioRef,
      details: detailsRef,
    };

    map[key]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    const items = [
      { key: "services", ref: servicesRef },
      { key: "reviews", ref: reviewsRef },
      { key: "portfolio", ref: portfolioRef },
      { key: "details", ref: detailsRef },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        const found = items.find((item) => item.ref.current === visible.target);
        if (found) setActiveTab(found.key);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.3, 0.6] },
    );

    items.forEach((item) => {
      if (item.ref.current) observer.observe(item.ref.current);
    });

    return () => observer.disconnect();
  }, [studio]);

  function handleGoBack() {
    sessionStorage.setItem("restore-studios-scroll", "1");
    navigate(-1);
  }

  async function handleShare(e) {
    e?.stopPropagation?.();

    const shareUrl = window.location.href;
    const shareData = {
      title: name,
      text: `Переглянь студію ${name}`,
      url: shareUrl,
    };

    try {
      if (navigator.share && window.isSecureContext) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1600);
        return;
      }

      alert("На цьому пристрої системне меню 'Поділитися' недоступне.");
    } catch (err) {
      if (err?.name === "AbortError") return;

      console.error("Share failed:", err);

      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1600);
      } catch {
        alert("Не вдалося відкрити меню 'Поділитися'.");
      }
    }
  }

  function requireClientAuth(action) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (token && role === "client") {
    return true;
  }

  savePendingAuthAction({
    ...action,
    studioId: studio?.id || null,
    studioSlug: studio?.slug || slug,
    returnTo: location.pathname,
  });

  navigate("/login");

  return false;
}

async function handleToggleFavourite() {
  if (!studio?.id || favouritesLoading) return;

  const hasAccess = requireClientAuth({
    type: "favourite",
  });

  if (!hasAccess) return;

  try {
    await toggleFavourite(studio);
  } catch (error) {
    console.error("Favourite toggle failed:", error);
    alert("Не вдалося оновити список улюблених");
  }
}

const closeBookingModal = useCallback(() => {
  setOpenBooking(false);
}, []);
if (loading || (!studio && !error)) {
  return <StudioPublicPageSkeleton />;
}

if (error && !studio) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f5f1] px-4">
      <div className="w-full max-w-md rounded-[28px] border border-[#eadfce] bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <h1 className="text-xl font-bold text-[#202020]">
          Не вдалося завантажити студію
        </h1>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[#2C2C2C] px-5 text-sm font-bold text-white transition hover:bg-[#1f1f1f] active:scale-[0.98]"
        >
          Спробувати ще раз
        </button>
      </div>
    </div>
  );
}
  function paginateHero(direction) {
    if (!heroImages.length) return;

    setHeroDirection(direction);
    setHeroIndex((prev) => {
      if (direction > 0) return (prev + 1) % heroImages.length;
      return (prev - 1 + heroImages.length) % heroImages.length;
    });
  }

  function handleHeroDragEnd(_, info) {
    const offsetX = info.offset.x;
    const velocityX = info.velocity.x;

    const swipePower = Math.abs(offsetX) * Math.abs(velocityX);
    const threshold = 6000;

    if (offsetX < -50 || (velocityX < -500 && swipePower > threshold)) {
      paginateHero(1);
      return;
    }

    if (offsetX > 50 || (velocityX > 500 && swipePower > threshold)) {
      paginateHero(-1);
    }
  }

  return (
    <div
      className="min-h-screen bg-[#f7f5f1] text-[#202020]"
      data-testid="studio-public-page"
    >
      <div className="mx-auto w-full max-w-[1220px] px-0 sm:px-2 md:px-3 lg:px-6">
        <div className="mx-auto w-full max-w-[1120px] pb-0 text-[#202020] sm:pb-20 lg:pb-5">
          <section className="relative">
            <div className="relative h-[320px] sm:h-[420px] md:h-[480px] lg:h-[520px] overflow-hidden rounded-b-[24px] bg-[#f8f5f1] sm:mx-[-8px] md:mx-[-12px] lg:mx-0">
              {heroImages.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setHeroPreviewIndex(heroIndex)}
                    className="absolute inset-0 block h-full w-full cursor-zoom-in"
                    aria-label="Переглянути фото студії"
                  >
                    <div
                      className="absolute inset-0"
                      aria-label="Переглянути фото студії"
                    >
                      <AnimatePresence initial={false}>
                        <motion.div
                          key={heroIndex}
                          initial={{ x: heroDirection > 0 ? 40 : -40 }}
                          animate={{ x: 0 }}
                          exit={{ x: heroDirection > 0 ? -40 : 40 }}
                          transition={{
                            duration: 0.22,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          drag="x"
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.06}
                          onDragEnd={handleHeroDragEnd}
                          onClick={() => setHeroPreviewIndex(heroIndex)}
                          className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
                          style={{
                            backfaceVisibility: "hidden",
                            willChange: "transform",
                          }}
                        >
                          <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-stone-200 via-stone-100 to-amber-50">
                            {loadedHeroSrc ? (
                              <img
                                src={loadedHeroSrc}
                                alt={`${name} ${heroIndex + 1}`}
                                className="absolute inset-0 h-full w-full object-cover"
                                draggable="false"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-stone-200 via-stone-100 to-amber-50" />
                            )}

                            {showHeroLoader && (
                              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f8f5f1]/80">
                                <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#eadbc9] border-t-[var(--color-forest)]" />
                                  <span className="text-xs font-semibold text-[#77716b]">
                                    Завантаження фото...
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </button>

                  {heroImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => paginateHero(-1)}
                        className="hidden sm:block group absolute left-4 top-1/2 z-30 -translate-y-1/2 p-2"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-200 group-hover:bg-white/20">
                          <ChevronLeft className="h-7 w-7 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] transition-transform duration-200 group-hover:-translate-x-1 group-hover:scale-110" />
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => paginateHero(1)}
                        className="hidden sm:block group absolute right-4 top-1/2 z-30 -translate-y-1/2 p-2"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-200 group-hover:bg-white/20">
                          <ChevronRight className="h-7 w-7 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] transition-transform duration-200 group-hover:translate-x-1 group-hover:scale-110" />
                        </div>
                      </button>

                      <div className="absolute bottom-16 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-md sm:bottom-18 lg:bottom-18">
                        {heroImages.slice(0, 7).map((img, idx) => (
                          <button
                            key={img + idx}
                            type="button"
                            onClick={() => {
                              if (idx === heroIndex) return;
                              setHeroDirection(idx > heroIndex ? 1 : -1);
                              setHeroIndex(idx);
                            }}
                            aria-label={`Перейти до фото ${idx + 1}`}
                            className={cn(
                              "h-2.5 rounded-full transition-all duration-200",
                              heroIndex === idx
                                ? "w-6 bg-white"
                                : "w-2.5 bg-white/55 hover:bg-white/80",
                            )}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 bg-[#f2eee8]" />
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/20" />

              <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pb-4 pt-4 sm:px-6">
                <button
                  type="button"
                  onClick={handleGoBack}
                  aria-label="Назад"
                  className={heroIconButtonClass()}
                >
                  <ChevronLeft className="h-8 w-8 text-white transition-transform duration-200 group-hover:-translate-x-0.5" />
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label="Поділитися"
                    title={shareCopied ? "Посилання скопійовано" : "Поділитися"}
                    className={heroIconButtonClass()}
                  >
                    <Share2 className="h-[25px] w-[25px] text-white transition-transform duration-200 group-hover:rotate-6" />
                  </button>

<button
  type="button"
  onClick={handleToggleFavourite}
  disabled={favouritesLoading}
  aria-label={
    isFavourite
      ? "Видалити з улюблених"
      : "Додати в улюблені"
  }
  aria-pressed={isFavourite}
  title={
    isFavourite
      ? "Видалити з улюблених"
      : "Додати в улюблені"
  }
  className={cn(
    heroIconButtonClass(isFavourite),
    favouritesLoading && "cursor-wait opacity-70",
  )}
>
  <Heart
    className={cn(
      "h-[25px] w-[25px] transition-all duration-200",
      isFavourite
        ? "scale-105 fill-current"
        : "text-white group-hover:scale-110",
    )}
  />
</button>
                </div>
              </div>
            </div>

            <div className="relative z-10 -mt-14 w-full sm:-mt-16 sm:px-2 md:px-3 lg:mx-auto lg:max-w-[1240px] lg:px-6">
              {" "}
              <SectionShell>
                <div className="px-4 pb-4 pt-4 sm:px-5 md:px-5 sm:pb-6 lg:px-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#eadfce] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] sm:h-20 sm:w-20">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={`${name} logo`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold tracking-widest text-[#ff6200]">
                            LOGO
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                          {studio?.premium && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                              <Crown className="h-3 w-3" />
                              Premium
                            </span>
                          )}
                        </div>

                        <h1 className="mt-2 text-[26px] font-bold leading-[1.05] tracking-tight text-[#202020] sm:text-4xl lg:text-5xl">
                          {name}
                        </h1>

                        {fullAddress && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-[#77716b]">
                            <MapPin className="h-4 w-4 shrink-0 text-[#ff6200]" />
                            <p className="line-clamp-1">{fullAddress}</p>
                            {fullAddress && (
                              <button
                                type="button"
                                onClick={handleCopyAddress}
                                className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-[#eadfce] bg-white/90 px-2 text-[11px] font-semibold text-[#77716b] shadow-sm backdrop-blur transition hover:bg-white"
                                title={
                                  copied ? "Скопійовано" : "Копіювати адресу"
                                }
                              >
                                {copied ? (
                                  <CheckCheck className="h-3 w-3 text-[#ff6200]" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1.5 font-semibold text-[#202020]">
                            <Star className="h-4 w-4 fill-[#ffb020] text-[#ffb020]" />
                            {reviewsSummary.rating.toFixed(1)}
                            <span className="hidden sm:inline font-normal text-sky-700">
                              ({reviewsSummary.count} відгуків)
                            </span>
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-1.5 rounded-full px-2 py-[2px] text-[11px] font-medium",
                              openNow
                                ? "border border-green-300 bg-green-50 text-green-700"
                                : "border border-red-300 bg-red-50 text-red-700",
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                openNow ? "bg-green-500" : "bg-red-500",
                              )}
                            />
                            {openNow ? "Відчинено зараз" : "Наразі зачинено"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="hidden lg:block mt-4">
<button
  type="button"
onClick={openGeneralBooking}
  className={cn(
    "rounded-2xl bg-[#ff5a00] px-7 py-4 text-sm font-black text-white shadow-sm",
    "transition-all duration-200 active:scale-[0.98]",

    // 👉 nude-green
    "bg-[#ff5a00]",

    // 👉 hover
    "hover:bg-[#ef4f00]"
  )}
>
  <span className="flex items-center gap-2 whitespace-nowrap">
    Забронювати онлайн
  </span>
</button>
                    </div>
                  </div>
                </div>
                {!!description && (
                  <div className="px-2  sm:px-5 lg:px-6">
                    <div className="rounded-[26px] pb-4 px-2 sm:p-6">
                      <p className="text-sm leading-5.5 text-[#77716b]">
                        {description}
                      </p>
                    </div>
                  </div>
                )}
                <div className="sticky top-0 z-30 border-t border-[#f1ece5] bg-white/95 backdrop-blur-xl">
                  <div className="mx-auto max-w-[900px] px-4">
                    <div className="scrollbar-none flex justify-center overflow-x-auto">
                      {[
                        { key: "services", label: "Послуги" },
                        { key: "reviews", label: "Відгуки" },
                        { key: "portfolio", label: "Портфоліо" },
                        { key: "details", label: "Деталі" },
                      ].map((tab) => {
                        const isActive = activeTab === tab.key;

                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => scrollToSection(tab.key)}
                            className={cn(
                              "relative shrink-0 px-4 py-4 text-sm font-semibold transition-colors sm:px-5",
                              isActive
                                ? "text-[#202020]"
                                : "text-[#aaa19a] hover:text-[#4b4742]",
                            )}
                          >
                            {tab.label}

                            {isActive && (
                              <motion.span
                                layoutId="activeStudioTab"
                                className="absolute bottom-0 left-4 right-4 h-[2.5px] rounded-full bg-[#ff6200]"
                                transition={{
                                  type: "spring",
                                  stiffness: 380,
                                  damping: 32,
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="px-4 pt-0 sm:px-2 md:px-3 lg:px-6">
                  {mobileTab === "services" && (
                    <motion.section
                      key="services"
                      ref={servicesRef}
                      className="scroll-mt-28"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 18 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="rounded-[30px] px-0 py-4 pb-18 sm:p-6">
                        <div className="mb-5 flex items-end justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#ff6200]">
                              Меню послуг
                            </p>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                              Популярні послуги
                            </h2>
                          </div>
                        </div>

                        <div className="relative mb-6">
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#aaa19a]" />
                          <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Пошук послуг"
                            className="h-12 w-full rounded-2xl border border-[#eadfce] bg-[#f8f5f1] pl-11 pr-4 text-sm text-[#202020] outline-none transition focus:border-[#ff5a00] focus:ring-4 focus:ring-[#ff5a00]/10"
                          />
                        </div>

                        {filteredCategories.length === 0 &&
                        filteredUncategorizedServices.length === 0 ? (
                          <div className="rounded-2xl bg-[#f8f5f1] p-8 text-center text-sm text-[#77716b]">
                            Послуги не знайдено.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {filteredUncategorizedServices.length > 0 && (
                              <div className="space-y-3">
                                {filteredUncategorizedServices.map((s) => (
                                  <ServiceRow
                                    key={s.id}
                                    service={s}
                                    onBook={openBookingForService}
                                  />
                                ))}
                              </div>
                            )}

                            {filteredCategories.map((cat) => (
                              <CategoryAccordion
                                key={cat.id}
                                category={cat}
                                onBook={openBookingForService}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.section>
                  )}

                  {mobileTab === "reviews" && (
                    <motion.section
                      key="reviews"
                      ref={reviewsRef}
                      className="scroll-mt-28"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 18 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="rounded-[30px] px-0 py-4 pb-18 sm:p-6">
                        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#ff6200]">
                              Довіра клієнтів
                            </p>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#202020] sm:text-3xl">
                              Відгуки та оцінки
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77716b]">
                              Реальні враження клієнтів, загальний рейтинг і
                              фото робіт.
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-5 xl:grid-cols-[340px,1fr]">
                          <div className="space-y-5">
                            <div className="overflow-hidden rounded-[24px] sm:rounded-[30px] border border-[#eadfce] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                              <div className="h-[2px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42] opacity-70" />

                              <div className="p-4 sm:p-6">
                                <div className="text-center">
                                  <div className="mx-auto flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff6200] shadow-sm">
                                    <Star className="h-5 w-5 sm:h-6 sm:w-6 fill-[#ffb020] text-[#ffb020]" />
                                  </div>

                                  <p className="mt-3 sm:mt-4 text-[38px] sm:text-[54px] font-extrabold leading-none tracking-tight text-[#202020]">
                                    {reviewsSummary.rating.toFixed(1)}
                                  </p>

                                  <div className="mt-2 sm:mt-3 flex items-center justify-center gap-0.5 sm:gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={cn(
                                          "h-4 w-4 sm:h-5 sm:w-5",
                                          i < Math.round(reviewsSummary.rating)
                                            ? "fill-[#ffb020] text-[#ffb020]"
                                            : "text-stone-200",
                                        )}
                                      />
                                    ))}
                                  </div>

                                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-[#77716b]">
                                    На основі {reviewsSummary.count} відгуків
                                  </p>
                                </div>

                                <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                                  {[5, 4, 3, 2, 1].map((num) => {
                                    const val =
                                      reviewsSummary.distribution?.[num] || 0;
                                    const total = Math.max(
                                      reviewsSummary.count || 1,
                                      1,
                                    );
                                    const width = (val / total) * 100;

                                    return (
                                      <div
                                        key={num}
                                        className="flex items-center gap-2 sm:gap-3"
                                      >
                                        <div className="flex w-7 sm:w-8 items-center gap-1 text-[11px] sm:text-xs font-semibold text-[#77716b]">
                                          <span>{num}</span>
                                          <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-[#ffb020] text-[#ffb020]" />
                                        </div>

                                        <div className="h-2 sm:h-2.5 flex-1 overflow-hidden rounded-full bg-[#f8f5f1]">
                                          <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#ff7a18] to-[#ff6200]"
                                            style={{ width: `${width}%` }}
                                          />
                                        </div>

                                        <span className="w-8 sm:w-10 text-right text-[11px] sm:text-xs font-medium text-[#77716b]">
                                          {val}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {displayedPortfolio.length > 0 && (
                              <div className="overflow-hidden rounded-[30px] border border-[#eadfce] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                                <div className="p-5 sm:p-6">
                                  <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6200]">
                                        Галерея клієнтів
                                      </p>
                                      <h3 className="mt-1 text-lg font-bold text-[#202020]">
                                        Фото робіт
                                      </h3>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {displayedPortfolio
                                      .slice(0, 5)
                                      .map((url, idx) => {
                                        const isLast = idx === 4;
                                        const remaining =
                                          displayedPortfolio.length - 5;

                                        return (
                                          <button
                                            key={url + idx}
                                            type="button"
                                            onClick={() => setPreviewIndex(idx)}
                                            className={cn(
                                              "relative overflow-hidden rounded-xl border border-white shadow-sm group",
                                              "h-14 w-14 sm:h-16 sm:w-16",
                                              idx !== 0 && "-ml-1.5",
                                            )}
                                            style={{ zIndex: 10 - idx }}
                                          >
                                            <img
                                              src={url}
                                              alt={`review-portfolio-${idx}`}
                                              className="h-full w-full object-cover"
                                            />

                                            {/* overlay тільки на останньому */}
                                            {isLast && remaining > 0 && (
                                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white backdrop-blur-[2px] transition-all duration-200 group-hover:bg-black/60">
                                                <span className="text-sm font-bold">
                                                  +{remaining}
                                                </span>
                                              </div>
                                            )}
                                          </button>
                                        );
                                      })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            {reviews.length > 0 ? (
                              <div className="columns-1 gap-4 md:columns-2">
                                {reviews.map((review, index) => {
                                  const author = review.author || "Клієнт";
                                  const initials = author
                                    .split(" ")
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((part) => part[0])
                                    .join("")
                                    .toUpperCase();

                                  return (
                                    <div
                                      key={review.id}
                                      className="mb-4 break-inside-avoid"
                                    >
                                      <div className="group flex flex-col rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                                        <div>
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-stone-100 text-sm font-bold text-[#4b4742]">
                                                {initials || "K"}
                                              </div>

                                              <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-[#202020]">
                                                  {author}
                                                </p>
                                                <p className="mt-0.5 text-xs text-[#aaa19a]">
                                                  Клієнт студії
                                                </p>
                                              </div>
                                            </div>

                                            <span className="shrink-0 rounded-full bg-[#f8f5f1] px-2.5 py-1 text-[11px] font-semibold text-[#77716b]">
                                              {review.date}
                                            </span>
                                          </div>

                                          <div className="mt-4 flex items-center gap-1">
                                            {Array.from({ length: 5 }).map(
                                              (_, i) => (
                                                <Star
                                                  key={i}
                                                  className={cn(
                                                    "h-4 w-4",
                                                    i < review.rating
                                                      ? "fill-[#ffb020] text-[#ffb020]"
                                                      : "text-stone-200",
                                                  )}
                                                />
                                              ),
                                            )}

                                            <span className="ml-2 text-xs font-semibold text-[#77716b]">
                                              {review.rating.toFixed(1)}
                                            </span>
                                          </div>

                                          <div className="mt-4">
                                            <ExpandableText
                                              text={review.text}
                                            />
                                          </div>
                                        </div>

                                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#f1ece5] pt-4">
                                          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#ff6200]">
                                            <CheckCheck className="h-3.5 w-3.5" />
                                            Перевірений відгук
                                          </div>

                                          <div className="text-[11px] font-medium text-[#aaa19a]">
                                            #
                                            {String(index + 1).padStart(2, "0")}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="rounded-[28px] border border-dashed border-[#eadbc9] bg-gradient-to-br from-stone-50 to-amber-50/40 p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-10">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                                  <Star className="h-6 w-6 text-amber-500" />
                                </div>

                                <h3 className="mt-4 text-lg font-bold text-[#202020]">
                                  Ще немає відгуків
                                </h3>

                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#77716b]">
                                  У цієї студії поки що немає публічних
                                  відгуків. Після перших записів тут з’являться
                                  оцінки та враження клієнтів.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.section>
                  )}

                  {mobileTab === "portfolio" && (
                    <motion.section
                      key="portfolio"
                      ref={portfolioRef}
                      className="scroll-mt-28"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 18 }}
                      transition={{
                        duration: 0.35,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <div className="rounded-[30px] px-0 py-4 pb-18 sm:p-6">
                        <div className="mb-2">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#ff6200]">
                            Наші роботи
                          </p>
                          <h2 className="text-2xl font-bold tracking-tight text-[#202020] md:text-4xl">
                            Портфоліо
                          </h2>
                        </div>

                        {displayedPortfolio.length > 0 ? (
                          <div className="rounded-[30px] p-4 sm:p-6 columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
                            {displayedPortfolio.map((url, idx) => (
                              <motion.button
                                key={url + idx}
                                type="button"
                                onClick={() => setPreviewIndex(idx)}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                  delay: idx * 0.05,
                                  duration: 0.4,
                                }}
                                className="group relative mb-3 block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-[#f8f5f1] sm:mb-4"
                              >
                                <img
                                  src={url}
                                  alt={`Портфоліо ${idx + 1}`}
                                  className={cn(
                                    "w-full object-cover transition-transform duration-500 group-hover:scale-105",
                                    idx % 3 === 0
                                      ? "aspect-[3/4]"
                                      : idx % 3 === 1
                                        ? "aspect-square"
                                        : "aspect-[4/5]",
                                  )}
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                              </motion.button>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-[28px] border border-dashed border-[#eadbc9] bg-gradient-to-br from-stone-50 to-amber-50/40 p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-10">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                              <ClipboardPen className="h-6 w-6 text-[#ff6200]" />
                            </div>

                            <h3 className="mt-4 text-lg font-bold text-[#202020]">
                              Портфоліо поки що порожнє
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#77716b]">
                              Студія ще не додала фото своїх робіт. Згодом тут
                              з’являться приклади виконаних послуг та результати
                              для клієнтів.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.section>
                  )}

                  {mobileTab === "details" && (
                    <motion.section
                      key="details"
                      ref={detailsRef}
                      className="scroll-mt-28"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 18 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="rounded-[30px] px-0 py-4 pb-18 sm:p-6">
                        <div className="mb-8">
                          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#ff6200]">
                            Контакти та інформація
                          </p>
                          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#202020] sm:text-3xl">
                            Деталі студії
                          </h2>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77716b]">
                            Інформація про студію, графік роботи, контакти та
                            майстри.
                          </p>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                          {/* ЛІВА КОЛОНКА */}
                          <div className="space-y-5">
                            <div className="overflow-hidden rounded-[30px] border border-[#eadfce] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
                              <div className="relative overflow-hidden px-5 py-6 sm:px-6 sm:py-7">
                                {coverUrl ? (
                                  <div className="absolute inset-0">
                                    <img
                                      src={coverUrl}
                                      alt={name}
                                      className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 via-[58%] to-white/10" />
                                    <div className="absolute inset-0 bg-black/5" />
                                  </div>
                                ) : (
                                  <div className="absolute inset-0 bg-gradient-to-br from-[#f8f5f1] via-[#fffaf6] to-[#f4eee8]" />
                                )}

                                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/20 blur-3xl" />
                                <div className="absolute -bottom-10 left-0 h-28 w-28 rounded-full bg-emerald-200/20 blur-3xl" />

                                <div className="relative z-10 max-w-xl">
                                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ffd6bd] bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff6200] backdrop-blur">
                                    <MapPin className="h-3.5 w-3.5" />
                                    Локація студії
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-xl font-bold text-[#202020] sm:text-2xl">
                                      {name}
                                    </h3>
                                  </div>

                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <p className="max-w-xl text-sm leading-6 text-[#4b4742]">
                                      {fullAddress || "Адресу ще не додано"}
                                    </p>

                                    {fullAddress && (
                                      <button
                                        type="button"
                                        onClick={handleCopyAddress}
                                        className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-[#eadfce] bg-white/90 px-2 text-[11px] font-semibold text-[#77716b] shadow-sm backdrop-blur transition hover:bg-white"
                                        title={
                                          copied
                                            ? "Скопійовано"
                                            : "Копіювати адресу"
                                        }
                                      >
                                        {copied ? (
                                          <CheckCheck className="h-3 w-3 text-[#ff6200]" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-[30px] border border-[#eadfce] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-6 lg:hidden">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff6200]">
                                  <Clock className="h-5 w-5" />
                                </div>

                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6200]">
                                    Графік роботи
                                  </p>
                                  <h3 className="mt-1 text-lg font-bold text-[#202020]">
                                    Актуальний графік
                                  </h3>
                                </div>
                              </div>

                              <div className="mt-5 grid gap-2">
                                {weeklyScheduleRows.map((item) => {
                                  const today = new Date().getDay();
                                  const isToday = today === item.jsDay;

                                  return (
                                    <div
                                      key={item.day}
                                      className={cn(
                                        "flex items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-200",
                                        isToday
                                          ? "border-[#ffd6bd] bg-[#fff1e8]/60"
                                          : "border-[#eadfce] bg-[#f8f5f1]",
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={cn(
                                            "h-2.5 w-2.5 rounded-full",
                                            isToday
                                              ? "bg-[#fff1e8]0"
                                              : "bg-stone-300",
                                          )}
                                        />
                                        <span
                                          className={cn(
                                            "text-sm",
                                            isToday
                                              ? "font-bold text-[#202020]"
                                              : "font-medium text-[#77716b]",
                                          )}
                                        >
                                          {item.day}
                                        </span>
                                      </div>

                                      <span
                                        className={cn(
                                          "text-sm font-semibold",
                                          item.hours === "Вихідний"
                                            ? "text-red-700"
                                            : isToday
                                              ? "text-[#ff6200]"
                                              : "text-[#202020]",
                                        )}
                                      >
                                        {item.hours}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* МОБІЛКА / ПЛАНШЕТ */}
                            <div className="grid w-full gap-3 border-t border-[#f1ece5] bg-white px-0 py-0 sm:grid-cols-2 sm:px-6 lg:hidden">
                              <div className="relative w-full overflow-hidden rounded-[24px] border border-[#ffd6bd] bg-gradient-to-br from-white via-amber-50/40 to-stone-50 px-4 py-4 shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
                                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-200/25 blur-2xl" />
                                <div className="absolute -bottom-6 left-0 h-16 w-16 rounded-full bg-orange-200/20 blur-2xl" />

                                <div className="relative z-10 sm:hidden">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff1e8] shadow-sm">
                                      <Star className="h-5 w-5 fill-[#ffb020] text-[#ffb020]" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6200]">
                                        Рейтинг
                                      </p>

                                      <div className="mt-1 flex items-baseline gap-2">
                                        <span className="text-[30px] font-extrabold leading-none text-[#202020]">
                                          {reviewsSummary.rating.toFixed(1)}
                                        </span>
                                        <span className="text-sm font-medium text-[#77716b]">
                                          ({reviewsSummary.count})
                                        </span>
                                      </div>

                                      <p className="mt-1 text-xs text-[#77716b]">
                                        Висока оцінка клієнтів
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="relative z-10 hidden text-center sm:block">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e8] shadow-sm">
                                    <Star className="h-5 w-5 fill-[#ffb020] text-[#ffb020]" />
                                  </div>

                                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff6200]">
                                    Рейтинг
                                  </p>

                                  <div className="mt-2 flex items-baseline justify-center gap-2">
                                    <span className="text-[34px] font-extrabold leading-none text-[#202020]">
                                      {reviewsSummary.rating.toFixed(1)}
                                    </span>
                                    <span className="text-base font-medium text-[#77716b]">
                                      ({reviewsSummary.count})
                                    </span>
                                  </div>

                                  <p className="mt-2 text-sm text-[#77716b]">
                                    Висока оцінка клієнтів
                                  </p>
                                </div>
                              </div>

                              <div className="relative w-full overflow-hidden rounded-[24px] border border-[#ffd6bd]/60 bg-gradient-to-br from-white via-emerald-50/30 to-stone-50 px-4 py-4 shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
                                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-200/25 blur-2xl" />
                                <div className="absolute -bottom-6 left-0 h-16 w-16 rounded-full bg-emerald-100/30 blur-2xl" />

                                <div className="relative z-10 sm:hidden">
                                  <div className="flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 shadow-sm">
                                        <Phone className="h-5 w-5 text-[#ff6200]" />
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6200]">
                                          Телефон
                                        </p>

                                        {studioPhone ? (
                                          <>
                                            <div className="mt-1 break-all text-[20px] font-extrabold leading-tight text-[#202020]">
                                              {studioPhone}
                                            </div>
                                          </>
                                        ) : (
                                          <p className="mt-1 text-sm text-[#aaa19a]">
                                            Не вказано
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {studioPhone && (
                                      <a
                                        href={`tel:${studioPhone}`}
                                        className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#ffd6bd] bg-white px-4 text-sm font-bold text-[#ff6200] transition-all duration-150 active:scale-95 active:bg-[#fff1e8] active:shadow-inner"
                                      >
                                        Зателефонувати
                                      </a>
                                    )}
                                  </div>
                                </div>

                                <div className="relative z-10 hidden text-center sm:block">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 shadow-sm">
                                    <Phone className="h-5 w-5 text-[#ff6200]" />
                                  </div>

                                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff6200]">
                                    Телефон
                                  </p>

                                  {studioPhone ? (
                                    <>
                                      <div className="mt-2 break-all text-base font-extrabold text-[#202020]">
                                        {studioPhone}
                                      </div>

                                      <a
                                        href={`tel:${studioPhone}`}
                                        className="mt-3 inline-flex h-9 items-center justify-center rounded-xl border border-[#ffd6bd] bg-white px-4 text-xs font-bold text-[#ff6200] transition-all duration-150 active:translate-y-[1px] active:scale-95 active:bg-[#fff1e8] active:shadow-inner"
                                      >
                                        Зателефонувати
                                      </a>
                                    </>
                                  ) : (
                                    <p className="mt-2 text-sm text-[#aaa19a]">
                                      Не вказано
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="relative w-full overflow-hidden rounded-[24px] border border-indigo-200/60 bg-gradient-to-br from-white via-indigo-50/30 to-stone-50 px-4 py-4 shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
                                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-200/20 blur-2xl" />
                                <div className="absolute -bottom-6 left-0 h-16 w-16 rounded-full bg-indigo-100/30 blur-2xl" />

                                <div className="relative z-10 sm:hidden">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 shadow-sm">
                                      <Sparkles className="h-5 w-5 text-indigo-600" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-700">
                                        Формат
                                      </p>
                                      <div className="mt-1 text-base font-extrabold leading-tight text-[#202020]">
                                        Онлайн запис
                                      </div>
                                      <p className="mt-1 text-xs text-[#77716b]">
                                        Швидко та без дзвінків
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="relative z-10 hidden text-center sm:block">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 shadow-sm">
                                    <Sparkles className="h-5 w-5 text-indigo-600" />
                                  </div>

                                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-700">
                                    Формат
                                  </p>

                                  <div className="mt-2 text-base font-extrabold text-[#202020]">
                                    Онлайн запис
                                  </div>

                                  <p className="mt-1 text-xs text-[#77716b]">
                                    Швидко та без дзвінків
                                  </p>
                                </div>
                              </div>

                              <div className="relative w-full overflow-hidden rounded-[24px] border border-[#ffd6bd] bg-gradient-to-br from-white via-amber-50/40 to-stone-50 px-4 py-4 shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
                                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-200/25 blur-2xl" />
                                <div className="absolute -bottom-6 left-0 h-16 w-16 rounded-full bg-orange-200/20 blur-2xl" />

                                <div className="relative z-10 sm:hidden">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff1e8] shadow-sm">
                                      <Banknote className="h-5 w-5 text-[#ff6200]" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6200]">
                                        Оплата
                                      </p>
                                      <div className="mt-1 text-base font-extrabold leading-tight text-[#202020]">
                                        Без передоплати
                                      </div>
                                      <p className="mt-1 text-xs text-[#77716b]">
                                        Оплата після візиту
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="relative z-10 hidden text-center sm:block">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e8] shadow-sm">
                                    <Banknote className="h-5 w-5 text-[#ff6200]" />
                                  </div>

                                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff6200]">
                                    Оплата
                                  </p>

                                  <div className="mt-2 text-base font-extrabold text-[#202020]">
                                    Без передоплати
                                  </div>

                                  <p className="mt-1 text-xs text-[#77716b]">
                                    Оплата після візиту
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* ДЕСКТОП — окремий великий графік */}
                            <div className="hidden rounded-[30px] border border-[#eadfce] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-6 lg:block">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff6200]">
                                  <Clock className="h-5 w-5" />
                                </div>

                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6200]">
                                    Графік роботи
                                  </p>
                                  <h3 className="mt-1 text-lg font-bold text-[#202020]">
                                    Актуальний графік
                                  </h3>
                                </div>
                              </div>

                              <div className="mt-5 grid gap-2">
                                {weeklyScheduleRows.map((item) => {
                                  const today = new Date().getDay();
                                  const isToday = today === item.jsDay;

                                  return (
                                    <div
                                      key={item.day}
                                      className={cn(
                                        "flex items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-200",
                                        isToday
                                          ? "border-[#ffd6bd] bg-[#fff1e8]/60"
                                          : "border-[#eadfce] bg-[#f8f5f1]",
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={cn(
                                            "h-2.5 w-2.5 rounded-full",
                                            isToday
                                              ? "bg-[#fff1e8]0"
                                              : "bg-stone-300",
                                          )}
                                        />
                                        <span
                                          className={cn(
                                            "text-sm",
                                            isToday
                                              ? "font-bold text-[#202020]"
                                              : "font-medium text-[#77716b]",
                                          )}
                                        >
                                          {item.day}
                                        </span>
                                      </div>

                                      <span
                                        className={cn(
                                          "text-sm font-semibold",
                                          item.hours === "Вихідний"
                                            ? "text-red-700"
                                            : isToday
                                              ? "text-[#ff6200]"
                                              : "text-[#202020]",
                                        )}
                                      >
                                        {item.hours}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* ПРАВА КОЛОНКА */}
                          <div className="space-y-2 pb-0 sm:pb-0 lg:pb-0">
                            {/* ДЕСКТОП — 4 карточки 2x2 */}
                            <div className="hidden lg:grid lg:grid-cols-2 lg:gap-3">
                              <div className="relative overflow-hidden rounded-[24px] border border-[#ffd6bd] bg-gradient-to-br from-white via-amber-50/40 to-stone-50 px-4 py-4 text-center shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
                                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-200/25 blur-2xl" />
                                <div className="absolute -bottom-6 left-0 h-16 w-16 rounded-full bg-orange-200/20 blur-2xl" />

                                <div className="relative z-10">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e8] shadow-sm">
                                    <Star className="h-5 w-5 fill-[#ffb020] text-[#ffb020]" />
                                  </div>

                                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff6200]">
                                    Рейтинг
                                  </p>

                                  <div className="mt-2 flex items-baseline justify-center gap-2">
                                    <span className="text-[34px] font-extrabold leading-none text-[#202020]">
                                      {reviewsSummary.rating.toFixed(1)}
                                    </span>
                                    <span className="text-base font-medium text-[#77716b]">
                                      ({reviewsSummary.count})
                                    </span>
                                  </div>

                                  <p className="mt-2 text-sm text-[#77716b]">
                                    Висока оцінка клієнтів
                                  </p>
                                </div>
                              </div>

                              <div className="relative overflow-hidden rounded-[24px] border border-[#ffd6bd]/60 bg-gradient-to-br from-white via-emerald-50/30 to-stone-50 px-4 py-4 text-center shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
                                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-200/25 blur-2xl" />
                                <div className="absolute -bottom-6 left-0 h-16 w-16 rounded-full bg-emerald-100/30 blur-2xl" />

                                <div className="relative z-10">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 shadow-sm">
                                    <Phone className="h-5 w-5 text-[#ff6200]" />
                                  </div>

                                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff6200]">
                                    Телефон
                                  </p>

                                  {studioPhone ? (
                                    <>
                                      <div className="mt-2 break-all text-base font-extrabold text-[#202020]">
                                        {studioPhone}
                                      </div>

                                      <a
                                        href={`tel:${studioPhone}`}
                                        className="mt-3 inline-flex h-9 items-center justify-center rounded-xl border border-[#ffd6bd] bg-white px-4 text-xs font-bold text-[#ff6200] transition-all duration-150 active:translate-y-[1px] active:scale-95 active:bg-[#fff1e8] active:shadow-inner"
                                      >
                                        Зателефонувати
                                      </a>
                                    </>
                                  ) : (
                                    <p className="mt-2 text-sm text-[#aaa19a]">
                                      Не вказано
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="relative overflow-hidden rounded-[24px] border border-indigo-200/60 bg-gradient-to-br from-white via-indigo-50/30 to-stone-50 px-4 py-4 text-center shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
                                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-200/20 blur-2xl" />
                                <div className="absolute -bottom-6 left-0 h-16 w-16 rounded-full bg-indigo-100/30 blur-2xl" />

                                <div className="relative z-10">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 shadow-sm">
                                    <Sparkles className="h-5 w-5 text-indigo-600" />
                                  </div>

                                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-700">
                                    Формат
                                  </p>

                                  <div className="mt-2 text-base font-extrabold text-[#202020]">
                                    Онлайн запис
                                  </div>

                                  <p className="mt-1 text-xs text-[#77716b]">
                                    Швидко та без дзвінків
                                  </p>
                                </div>
                              </div>

                              <div className="relative overflow-hidden rounded-[24px] border border-[#ffd6bd] bg-gradient-to-br from-white via-amber-50/40 to-stone-50 px-4 py-4 text-center shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
                                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-200/25 blur-2xl" />
                                <div className="absolute -bottom-6 left-0 h-16 w-16 rounded-full bg-orange-200/20 blur-2xl" />

                                <div className="relative z-10">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e8] shadow-sm">
                                    <Banknote className="h-5 w-5 text-[#ff6200]" />
                                  </div>

                                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff6200]">
                                    Оплата
                                  </p>

                                  <div className="mt-2 text-base font-extrabold text-[#202020]">
                                    Без передоплати
                                  </div>

                                  <p className="mt-1 text-xs text-[#77716b]">
                                    Оплата після візиту
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-[30px] border border-[#eadfce] bg-gradient-to-br from-[#fffaf6] via-white to-[#f8f5f1] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-6">
                              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6200]">
                                Швидкий контакт
                              </p>
                              <h3 className="mt-2 text-lg font-bold text-[#202020]">
                                Потрібна консультація?
                              </h3>
                              <p className="mt-2 text-sm leading-6 text-[#77716b]">
                                Зв’яжіться зі студією напряму або забронюйте
                                послугу онлайн за кілька кліків.
                              </p>

                              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {studioPhone && (
                                  <a
                                    href={`tel:${studioPhone}`}
                                    className="group flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-[#eadbc9] bg-gradient-to-b from-white to-stone-50 text-sm font-semibold text-[#202020] shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-200 active:scale-[0.98] sm:hover:-translate-y-0.5 sm:hover:border-[#ffd6bd] sm:hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                                  >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff1e8] text-[#ff6200] transition-colors duration-200 sm:group-hover:bg-[#fff1e8]">
                                      <Phone className="h-4 w-4" />
                                    </span>
                                    <span>Зателефонувати</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            {teamMembers.length > 0 && (
                              <div className="rounded-[30px] border border-[#eadfce] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-6">
                                <div className="mb-5 flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6200]">
                                      Команда
                                    </p>
                                    <h3 className="mt-1 text-lg font-bold text-[#202020]">
                                      Працівники студії
                                    </h3>
                                  </div>

                                  <span className="rounded-full bg-[#f8f5f1] px-3 py-1 text-xs font-semibold text-[#77716b]">
                                    {teamMembers.length}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                                  {teamMembers.map((member, idx) => (
                                    <div
                                      key={member.id || idx}
                                      className="rounded-2xl border border-[#eadfce] bg-[#f8f5f1] p-4"
                                    >
                                      <div className="flex flex-col items-center text-center">
                                        <div className="mb-3">
                                          <StaffCard member={member} />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.section>
                  )}
                </div>
              </SectionShell>
            </div>
          </section>

          <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-950/8 to-transparent" />

            <div className="relative px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
              <div className="mx-auto max-w-md rounded-[28px] border border-white/60 backdrop-blur-2xl">
<button
  type="button"
  onClick={openGeneralBooking}
  className={cn(
    `
      flex h-12 w-full items-center justify-center gap-2.5
      rounded-[22px]
      bg-[#202020]
      px-5
      text-sm font-black text-white
      shadow-[0_12px_26px_rgba(15,15,15,0.18)]
      transition-all duration-300
      hover:scale-[1.015]
      hover:bg-[#ff6200]
      hover:shadow-[0_14px_30px_rgba(255,98,0,0.24)]
      active:scale-[0.98]
    `,
  )}
>
  <span
    className="
      flex h-8 w-8 items-center justify-center
      rounded-xl bg-white/10
      transition-colors duration-300
      group-hover:bg-white/15
    "
  >
    <Sparkles className="h-4 w-4 opacity-90" />
  </span>

  <span>Обрати послугу</span>
</button>
              </div>
            </div>
          </div>

{openBooking && (
  <BookingModal
    open
    title={name}
    onClose={closeBookingModal}
  >
    <StudioBookingWidget
      studio={studio}
      schedule={studio?.schedule || {}}
      scheduleExceptions={studio?.scheduleExceptions || []}
      slotDuration={studio?.slotDuration || 15}
      master={selectedMaster || null}
      masterSchedule={selectedMaster?.schedule || {}}
      masterScheduleExceptions={
        selectedMaster?.scheduleExceptions || []
      }
      preselectedService={preselectedService}
      isReschedule={rescheduleMode}
      rescheduleBookingId={rescheduleBookingId}
      preselectedDate={preselectedDate}
      preselectedTime={preselectedTime}
      onCancel={closeBookingModal}
      onSuccess={(data) => {
        setSuccessData({
          ...data,
          address: fullAddress,
          studioName: name,
        });

        setOpenBooking(false);
      }}
    />
  </BookingModal>
)}
          <AnimatePresence>
            {heroPreviewIndex !== null && (
              <ImageLightbox
                open={heroPreviewIndex !== null}
                images={heroImages}
                startIndex={heroPreviewIndex}
                onClose={() => setHeroPreviewIndex(null)}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {previewIndex !== null && (
              <ImageLightbox
                open={previewIndex !== null}
                images={displayedPortfolio}
                startIndex={previewIndex}
                onClose={() => setPreviewIndex(null)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {successData && (
              <BookingSuccessModal
                bookingDetails={successData}
                onClose={() => setSuccessData(null)}
                onViewBookings={() => {
                  setSuccessData(null);
                  navigate("/bookings");
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
