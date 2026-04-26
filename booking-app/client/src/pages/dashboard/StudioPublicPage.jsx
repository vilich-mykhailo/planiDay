// StudioPublicPage.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine } from "lucide-react";
import BookingSuccessModal from "../../components/BookingSuccessModal";
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
  Wifi,
  Car,
  Users,
  Crown,
} from "lucide-react";
import StudioBookingWidget from "../../components/StudioBookingWidget";

const R2_PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

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
    "group flex h-12 w-12 items-center justify-center rounded-2xl",
    "transition-all duration-200 ease-out",
    "hover:-translate-y-0.5 hover:scale-[1.03]",
    "active:translate-y-[1px] active:scale-[0.97]",
    "hover:bg-white/10",
    active ? "text-rose-500" : "text-white",
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
          "text-sm leading-7 text-stone-600 transition-all duration-300",
          !expanded && `line-clamp-${maxLines}`,
        )}
      >
        {text}
      </p>

      {isOverflow && (
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="mt-2 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
        >
          {expanded ? "Згорнути" : "Показати більше"}
        </button>
      )}
    </div>
  );
}

function SectionShell({ children, className = "" }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[22px] border border-stone-200/60 bg-white shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)] sm:rounded-[30px]",
        className,
      )}
    >
      <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />
      {children}
    </div>
  );
}

function BookingModal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      data-testid="booking-modal"
    >
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        type="button"
        aria-label="Закрити"
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
      />

      <div className="relative z-10 m-auto w-full max-w-2xl px-3 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex max-h-[78vh] sm:max-h-[85vh] lg:max-h-[88vh] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_40px_120px_-30px_rgba(0,0,0,0.2)]"
          role="dialog"
          aria-modal="true"
        >
          <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

          <div className="flex-shrink-0 border-b border-stone-100 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
                  Онлайн бронювання
                </p>
                <h3 className="mt-1 truncate text-lg font-bold text-stone-800 sm:text-xl">
                  {title}
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-500 transition-colors duration-200 hover:bg-stone-100 hover:text-stone-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-0 pt-6 sm:px-6">
            {children}
          </div>
        </motion.div>
      </div>
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
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-stone-800 shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {hasMany && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-4 top-1/2 z-[130] hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-800 shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95 sm:flex"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 top-1/2 z-[130] hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-800 shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95 sm:flex"
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
    <div className="group flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:p-5">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-stone-800 transition-colors duration-200 group-hover:text-emerald-700 sm:text-base">
          {service.name}
        </p>

        {!!service.description && (
          <p className="mt-1 line-clamp-2 text-xs text-stone-500 sm:text-sm">
            {service.description}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-stone-500">
          {service.duration && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              {service.duration} хв
            </span>
          )}

          {service.price != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 font-semibold text-stone-800">
              <Banknote className="h-3.5 w-3.5 text-amber-600" />
              {service.price} грн
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onBook(service)}
        className={cn(
          "inline-flex h-9 sm:h-10 items-center justify-center gap-2",
          "rounded-xl px-3 sm:px-4 text-xs sm:text-sm font-bold text-white",
          "active:scale-95",
          "whitespace-nowrap",

          // 👉 nude-green
          "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",

          // 👉 hover
          "hover:scale-[1.03] hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]",
        )}
      >
        Забронювати
      </button>
    </div>
  );
}

function CategoryAccordion({ category, onBook }) {
  const [open, setOpen] = useState(false);
  const services = category.services || [];

  return (
    <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors duration-200 hover:bg-stone-50 sm:p-6"
      >
        <div className="min-w-0">
          <p className="text-base font-semibold text-stone-800 sm:text-lg">
            {category.name}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            {services.length} {services.length === 1 ? "послуга" : "послуг"}
          </p>
        </div>

        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-stone-100 text-stone-500 transition-transform duration-300",
            open ? "rotate-180" : "",
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-stone-100 bg-[#FFFEFD] px-4 py-4 sm:px-6">
              {services.length === 0 ? (
                <p className="py-4 text-sm text-stone-500">
                  Послуги не додані.
                </p>
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

  return (
    <div className="flex min-w-[96px] max-w-[120px] flex-col items-center text-center sm:min-w-[120px]">
      <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-stone-100 shadow-[0_10px_24px_rgba(0,0,0,0.06)] sm:h-24 sm:w-24">
        {photo ? (
          <img
            src={photo}
            alt={name || "member"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-stone-400">
            {name ? name.slice(0, 1).toUpperCase() : "?"}
          </div>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm font-semibold text-stone-800">
        {name || "Майстер"}
      </p>
      <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">
        {role || "Спеціаліст"}
      </p>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="rounded-[26px] border border-stone-200 bg-white p-5 shadow-[0_8px_25px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-800">
            {review.author}
          </p>
          <div className="mt-1 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-stone-200",
                )}
              />
            ))}
          </div>
        </div>

        <span className="text-xs text-stone-500">{review.date}</span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-stone-600">
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
      className={cn("animate-pulse rounded-2xl bg-stone-200/80", className)}
    />
  );
}

function StudioPublicPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/20 text-stone-800">
      <div className="mx-auto w-full max-w-[1220px] px-0 sm:px-2 md:px-3 lg:px-6">
        <div className="mx-auto w-full max-w-[1120px] pb-0 text-stone-800 sm:pb-20 lg:pb-5">
          <section className="relative">
            <div className="relative h-[320px] overflow-hidden rounded-b-[24px] bg-stone-200 sm:mx-[-8px] sm:h-[420px] md:mx-[-12px] md:h-[480px] lg:mx-0 lg:h-[520px]">
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

                <div className="border-t border-stone-100 bg-white/95 backdrop-blur-xl">
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
                            className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
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
  const location = useLocation();
  const [studio, setStudio] = useState(null);
  const [loading, setLoading] = useState(false);
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
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState(null);
  const [preselectedDate, setPreselectedDate] = useState(null);
  const [preselectedTime, setPreselectedTime] = useState(null);
  const [isFavourite, setIsFavourite] = useState(false);
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
    let alive = true;

    async function loadStudio() {
      if (!slug) return;

      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/client/${slug}`,
        );
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || `Load failed (${res.status})`);
        }

        const s = data?.studio || null;
        if (!s) throw new Error("Studio missing in response");

        const normalized = {
          ...s,
          slug: s.slug || s.id,
          coverUrl: toPublicUrl(s.coverUrl),
          logoUrl: toPublicUrl(s.logoUrl),
          portfolioUrls: s.portfolioUrls ?? [],
          schedule: s.schedule || {},
          scheduleExceptions: Array.isArray(s.scheduleExceptions)
            ? s.scheduleExceptions.map((item) => ({
                ...item,
                date: String(item?.date || "").slice(0, 10),
              }))
            : [],
          masters: Array.isArray(s.masters)
            ? s.masters.map((master) => ({
                ...master,
                schedule:
                  master?.schedule &&
                  typeof master.schedule === "object" &&
                  Object.keys(master.schedule).length > 0
                    ? master.schedule
                    : undefined,
                scheduleExceptions: Array.isArray(master?.scheduleExceptions)
                  ? master.scheduleExceptions.map((item) => ({
                      ...item,
                      date: String(item?.date || "").slice(0, 10),
                    }))
                  : [],
              }))
            : [],
          slotDuration:
            typeof s.slotDuration === "number" ? s.slotDuration : 15,
        };

        if (alive) setStudio(normalized);
      } catch (e) {
        console.error(e);
        if (alive) {
          setStudio(null);
          setError(String(e?.message || "Load failed"));
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadStudio();

    return () => {
      alive = false;
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
    return arr.filter((url, index, self) => self.indexOf(url) === index);
  }, [coverUrl, portfolio]);

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
    setPreselectedService({ categoryId: null, serviceId: service.id });
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

  function handleToggleFavourite() {
    setIsFavourite((prev) => !prev);
  }

  if (loading) {
    return <StudioPublicPageSkeleton />;
  }

  if (!studio) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-2xl rounded-[28px] border border-stone-200 bg-white p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <h1 className="text-xl font-bold text-stone-800">
            {error ? "Не вдалося завантажити студію" : "Студію не знайдено"}
          </h1>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
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
      className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/20 text-stone-800"
      data-testid="studio-public-page"
    >
      <div className="mx-auto w-full max-w-[1220px] px-0 sm:px-2 md:px-3 lg:px-6">
        <div className="mx-auto w-full max-w-[1120px] pb-0 text-stone-800 sm:pb-20 lg:pb-5">
          <section className="relative">
            <div className="relative h-[320px] sm:h-[420px] md:h-[480px] lg:h-[520px] overflow-hidden rounded-b-[24px] bg-stone-100 sm:mx-[-8px] md:mx-[-12px] lg:mx-0">
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
                              <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-100/80">
                                <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-[var(--color-forest)]" />
                                  <span className="text-xs font-semibold text-stone-600">
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
                <div className="absolute inset-0 bg-stone-200" />
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
                    aria-label="В обране"
                    className={heroIconButtonClass(isFavourite)}
                  >
                    <Heart
                      className={cn(
                        "h-[25px] w-[25px] transition-all duration-200",
                        isFavourite
                          ? "fill-current scale-105"
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
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] sm:h-20 sm:w-20">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={`${name} logo`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold tracking-widest text-amber-600">
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

                        <h1 className="mt-2 text-[26px] font-bold leading-[1.05] tracking-tight text-stone-800 sm:text-4xl lg:text-5xl">
                          {name}
                        </h1>

                        {fullAddress && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-stone-500">
                            <MapPin className="h-4 w-4 shrink-0 text-amber-600" />
                            <p className="line-clamp-1">{fullAddress}</p>
                            {fullAddress && (
                              <button
                                type="button"
                                onClick={handleCopyAddress}
                                className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white/90 px-2 text-[11px] font-semibold text-stone-600 shadow-sm backdrop-blur transition hover:bg-white"
                                title={
                                  copied ? "Скопійовано" : "Копіювати адресу"
                                }
                              >
                                {copied ? (
                                  <CheckCheck className="h-3 w-3 text-emerald-700" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
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
  onClick={() => {
    setPreselectedService(null);
    setSelectedMaster(null);
    setRescheduleMode(false);
    setRescheduleBookingId(null);
    setPreselectedDate(null);
    setPreselectedTime(null);
    setOpenBooking(true);
  }}
  className={cn(
    "rounded-2xl px-7 py-4 text-sm font-bold text-white",
    "transition-all duration-200 active:scale-[0.98]",

    // 👉 nude-green
    "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",

    // 👉 hover
    "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]"
  )}
>
  <span className="flex items-center gap-2 whitespace-nowrap">
    Забронювати онлайн
    <Sparkles className="h-4 w-4 opacity-75" />
  </span>
</button>
                    </div>
                  </div>
                </div>
                {!!description && (
                  <div className="px-2  sm:px-5 lg:px-6">
                    <div className="rounded-[26px] pb-4 px-2 sm:p-6">
                      <p className="text-sm leading-5.5 text-stone-600">
                        {description}
                      </p>
                    </div>
                  </div>
                )}
                <div className="sticky top-0 z-30 border-t border-stone-100 bg-white/95 backdrop-blur-xl">
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
                                ? "text-stone-800"
                                : "text-stone-400 hover:text-stone-700",
                            )}
                          >
                            {tab.label}

                            {isActive && (
                              <motion.span
                                layoutId="activeStudioTab"
                                className="absolute bottom-0 left-4 right-4 h-[2.5px] rounded-full bg-emerald-700"
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
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
                              Меню послуг
                            </p>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                              Популярні послуги
                            </h2>
                          </div>
                        </div>

                        <div className="relative mb-6">
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Пошук послуг"
                            className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 pl-11 pr-4 text-sm text-stone-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
                          />
                        </div>

                        {filteredCategories.length === 0 &&
                        filteredUncategorizedServices.length === 0 ? (
                          <div className="rounded-2xl bg-stone-100 p-8 text-center text-sm text-stone-500">
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
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
                              Довіра клієнтів
                            </p>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-800 sm:text-3xl">
                              Відгуки та оцінки
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                              Реальні враження клієнтів, загальний рейтинг і
                              фото робіт.
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-5 xl:grid-cols-[340px,1fr]">
                          <div className="space-y-5">
                            <div className="overflow-hidden rounded-[24px] sm:rounded-[30px] border border-stone-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                              <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

                              <div className="p-4 sm:p-6">
                                <div className="text-center">
                                  <div className="mx-auto flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-sm">
                                    <Star className="h-5 w-5 sm:h-6 sm:w-6 fill-amber-400 text-amber-400" />
                                  </div>

                                  <p className="mt-3 sm:mt-4 text-[38px] sm:text-[54px] font-extrabold leading-none tracking-tight text-stone-900">
                                    {reviewsSummary.rating.toFixed(1)}
                                  </p>

                                  <div className="mt-2 sm:mt-3 flex items-center justify-center gap-0.5 sm:gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={cn(
                                          "h-4 w-4 sm:h-5 sm:w-5",
                                          i < Math.round(reviewsSummary.rating)
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-stone-200",
                                        )}
                                      />
                                    ))}
                                  </div>

                                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-stone-500">
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
                                        <div className="flex w-7 sm:w-8 items-center gap-1 text-[11px] sm:text-xs font-semibold text-stone-600">
                                          <span>{num}</span>
                                          <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-400 text-amber-400" />
                                        </div>

                                        <div className="h-2 sm:h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                                          <div
                                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                                            style={{ width: `${width}%` }}
                                          />
                                        </div>

                                        <span className="w-8 sm:w-10 text-right text-[11px] sm:text-xs font-medium text-stone-500">
                                          {val}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {displayedPortfolio.length > 0 && (
                              <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                                <div className="p-5 sm:p-6">
                                  <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">
                                        Галерея клієнтів
                                      </p>
                                      <h3 className="mt-1 text-lg font-bold text-stone-800">
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
                                      <div className="group flex flex-col rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                                        <div>
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-stone-100 text-sm font-bold text-stone-700">
                                                {initials || "K"}
                                              </div>

                                              <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-stone-800">
                                                  {author}
                                                </p>
                                                <p className="mt-0.5 text-xs text-stone-400">
                                                  Клієнт студії
                                                </p>
                                              </div>
                                            </div>

                                            <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-500">
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
                                                      ? "fill-amber-400 text-amber-400"
                                                      : "text-stone-200",
                                                  )}
                                                />
                                              ),
                                            )}

                                            <span className="ml-2 text-xs font-semibold text-stone-500">
                                              {review.rating.toFixed(1)}
                                            </span>
                                          </div>

                                          <div className="mt-4">
                                            <ExpandableText
                                              text={review.text}
                                            />
                                          </div>
                                        </div>

                                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
                                          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                            <CheckCheck className="h-3.5 w-3.5" />
                                            Перевірений відгук
                                          </div>

                                          <div className="text-[11px] font-medium text-stone-400">
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
                              <div className="rounded-[28px] border border-dashed border-stone-300 bg-gradient-to-br from-stone-50 to-amber-50/40 p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-10">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                                  <Star className="h-6 w-6 text-amber-500" />
                                </div>

                                <h3 className="mt-4 text-lg font-bold text-stone-800">
                                  Ще немає відгуків
                                </h3>

                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
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
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
                            Наші роботи
                          </p>
                          <h2 className="text-2xl font-bold tracking-tight text-stone-800 md:text-4xl">
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
                                className="group relative mb-3 block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-stone-100 sm:mb-4"
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
                          <div className="rounded-[28px] border border-dashed border-stone-300 bg-gradient-to-br from-stone-50 to-amber-50/40 p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-10">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                              <PenLine className="h-6 w-6 text-amber-600" />
                            </div>

                            <h3 className="mt-4 text-lg font-bold text-stone-800">
                              Портфоліо поки що порожнє
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
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
                          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
                            Контакти та інформація
                          </p>
                          <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-800 sm:text-3xl">
                            Деталі студії
                          </h2>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                            Інформація про студію, графік роботи, контакти та
                            майстри.
                          </p>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                          {/* ЛІВА КОЛОНКА */}
                          <div className="space-y-5">
                            <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
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
                                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700 backdrop-blur">
                                    <MapPin className="h-3.5 w-3.5" />
                                    Локація студії
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-xl font-bold text-stone-800 sm:text-2xl">
                                      {name}
                                    </h3>
                                  </div>

                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <p className="max-w-xl text-sm leading-6 text-stone-700">
                                      {fullAddress || "Адресу ще не додано"}
                                    </p>

                                    {fullAddress && (
                                      <button
                                        type="button"
                                        onClick={handleCopyAddress}
                                        className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white/90 px-2 text-[11px] font-semibold text-stone-600 shadow-sm backdrop-blur transition hover:bg-white"
                                        title={
                                          copied
                                            ? "Скопійовано"
                                            : "Копіювати адресу"
                                        }
                                      >
                                        {copied ? (
                                          <CheckCheck className="h-3 w-3 text-emerald-700" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-6 lg:hidden">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                  <Clock className="h-5 w-5" />
                                </div>

                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">
                                    Графік роботи
                                  </p>
                                  <h3 className="mt-1 text-lg font-bold text-stone-800">
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
                                          ? "border-emerald-200 bg-emerald-50/60"
                                          : "border-stone-200 bg-stone-50",
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={cn(
                                            "h-2.5 w-2.5 rounded-full",
                                            isToday
                                              ? "bg-emerald-500"
                                              : "bg-stone-300",
                                          )}
                                        />
                                        <span
                                          className={cn(
                                            "text-sm",
                                            isToday
                                              ? "font-bold text-stone-800"
                                              : "font-medium text-stone-600",
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
                                              ? "text-emerald-700"
                                              : "text-stone-800",
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
                            <div className="grid w-full gap-3 border-t border-stone-100 bg-white px-0 py-0 sm:grid-cols-2 sm:px-6 lg:hidden">
                              <div className="relative w-full overflow-hidden rounded-[24px] border border-amber-200/60 bg-gradient-to-br from-white via-amber-50/40 to-stone-50 px-4 py-4 shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
                                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-200/25 blur-2xl" />
                                <div className="absolute -bottom-6 left-0 h-16 w-16 rounded-full bg-orange-200/20 blur-2xl" />

                                <div className="relative z-10 sm:hidden">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 shadow-sm">
                                      <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">
                                        Рейтинг
                                      </p>

                                      <div className="mt-1 flex items-baseline gap-2">
                                        <span className="text-[30px] font-extrabold leading-none text-stone-900">
                                          {reviewsSummary.rating.toFixed(1)}
                                        </span>
                                        <span className="text-sm font-medium text-stone-500">
                                          ({reviewsSummary.count})
                                        </span>
                                      </div>

                                      <p className="mt-1 text-xs text-stone-500">
                                        Висока оцінка клієнтів
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="relative z-10 hidden text-center sm:block">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 shadow-sm">
                                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                  </div>

                                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-700">
                                    Рейтинг
                                  </p>

                                  <div className="mt-2 flex items-baseline justify-center gap-2">
                                    <span className="text-[34px] font-extrabold leading-none text-stone-900">
                                      {reviewsSummary.rating.toFixed(1)}
                                    </span>
                                    <span className="text-base font-medium text-stone-500">
                                      ({reviewsSummary.count})
                                    </span>
                                  </div>

                                  <p className="mt-2 text-sm text-stone-500">
                                    Висока оцінка клієнтів
                                  </p>
                                </div>
                              </div>

                              <div className="relative w-full overflow-hidden rounded-[24px] border border-emerald-200/60 bg-gradient-to-br from-white via-emerald-50/30 to-stone-50 px-4 py-4 shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
                                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-200/25 blur-2xl" />
                                <div className="absolute -bottom-6 left-0 h-16 w-16 rounded-full bg-emerald-100/30 blur-2xl" />

                                <div className="relative z-10 sm:hidden">
                                  <div className="flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 shadow-sm">
                                        <Phone className="h-5 w-5 text-emerald-600" />
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                                          Телефон
                                        </p>

                                        {studioPhone ? (
                                          <>
                                            <div className="mt-1 break-all text-[20px] font-extrabold leading-tight text-stone-900">
                                              {studioPhone}
                                            </div>
                                          </>
                                        ) : (
                                          <p className="mt-1 text-sm text-stone-400">
                                            Не вказано
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {studioPhone && (
                                      <a
                                        href={`tel:${studioPhone}`}
                                        className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-700 transition-all duration-150 active:scale-95 active:bg-emerald-50 active:shadow-inner"
                                      >
                                        Зателефонувати
                                      </a>
                                    )}
                                  </div>
                                </div>

                                <div className="relative z-10 hidden text-center sm:block">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 shadow-sm">
                                    <Phone className="h-5 w-5 text-emerald-600" />
                                  </div>

                                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                                    Телефон
                                  </p>

                                  {studioPhone ? (
                                    <>
                                      <div className="mt-2 break-all text-base font-extrabold text-stone-900">
                                        {studioPhone}
                                      </div>

                                      <a
                                        href={`tel:${studioPhone}`}
                                        className="mt-3 inline-flex h-9 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 text-xs font-bold text-emerald-700 transition-all duration-150 active:translate-y-[1px] active:scale-95 active:bg-emerald-50 active:shadow-inner"
                                      >
                                        Зателефонувати
                                      </a>
                                    </>
                                  ) : (
                                    <p className="mt-2 text-sm text-stone-400">
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
                                      <div className="mt-1 text-base font-extrabold leading-tight text-stone-900">
                                        Онлайн запис
                                      </div>
                                      <p className="mt-1 text-xs text-stone-500">
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

                                  <div className="mt-2 text-base font-extrabold text-stone-900">
                                    Онлайн запис
                                  </div>

                                  <p className="mt-1 text-xs text-stone-500">
                                    Швидко та без дзвінків
                                  </p>
                                </div>
                              </div>

                              <div className="relative w-full overflow-hidden rounded-[24px] border border-amber-200/60 bg-gradient-to-br from-white via-amber-50/40 to-stone-50 px-4 py-4 shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
                                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-200/25 blur-2xl" />
                                <div className="absolute -bottom-6 left-0 h-16 w-16 rounded-full bg-orange-200/20 blur-2xl" />

                                <div className="relative z-10 sm:hidden">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 shadow-sm">
                                      <Banknote className="h-5 w-5 text-amber-700" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">
                                        Оплата
                                      </p>
                                      <div className="mt-1 text-base font-extrabold leading-tight text-stone-900">
                                        Без передоплати
                                      </div>
                                      <p className="mt-1 text-xs text-stone-500">
                                        Оплата після візиту
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="relative z-10 hidden text-center sm:block">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 shadow-sm">
                                    <Banknote className="h-5 w-5 text-amber-700" />
                                  </div>

                                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-700">
                                    Оплата
                                  </p>

                                  <div className="mt-2 text-base font-extrabold text-stone-900">
                                    Без передоплати
                                  </div>

                                  <p className="mt-1 text-xs text-stone-500">
                                    Оплата після візиту
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* ДЕСКТОП — окремий великий графік */}
                            <div className="hidden rounded-[30px] border border-stone-200 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-6 lg:block">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                  <Clock className="h-5 w-5" />
                                </div>

                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">
                                    Графік роботи
                                  </p>
                                  <h3 className="mt-1 text-lg font-bold text-stone-800">
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
                                          ? "border-emerald-200 bg-emerald-50/60"
                                          : "border-stone-200 bg-stone-50",
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={cn(
                                            "h-2.5 w-2.5 rounded-full",
                                            isToday
                                              ? "bg-emerald-500"
                                              : "bg-stone-300",
                                          )}
                                        />
                                        <span
                                          className={cn(
                                            "text-sm",
                                            isToday
                                              ? "font-bold text-stone-800"
                                              : "font-medium text-stone-600",
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
                                              ? "text-emerald-700"
                                              : "text-stone-800",
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
                              <div className="relative overflow-hidden rounded-[24px] border border-amber-200/60 bg-gradient-to-br from-white via-amber-50/40 to-stone-50 px-4 py-4 text-center shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
                                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-200/25 blur-2xl" />
                                <div className="absolute -bottom-6 left-0 h-16 w-16 rounded-full bg-orange-200/20 blur-2xl" />

                                <div className="relative z-10">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 shadow-sm">
                                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                  </div>

                                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-700">
                                    Рейтинг
                                  </p>

                                  <div className="mt-2 flex items-baseline justify-center gap-2">
                                    <span className="text-[34px] font-extrabold leading-none text-stone-900">
                                      {reviewsSummary.rating.toFixed(1)}
                                    </span>
                                    <span className="text-base font-medium text-stone-500">
                                      ({reviewsSummary.count})
                                    </span>
                                  </div>

                                  <p className="mt-2 text-sm text-stone-500">
                                    Висока оцінка клієнтів
                                  </p>
                                </div>
                              </div>

                              <div className="relative overflow-hidden rounded-[24px] border border-emerald-200/60 bg-gradient-to-br from-white via-emerald-50/30 to-stone-50 px-4 py-4 text-center shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
                                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-200/25 blur-2xl" />
                                <div className="absolute -bottom-6 left-0 h-16 w-16 rounded-full bg-emerald-100/30 blur-2xl" />

                                <div className="relative z-10">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 shadow-sm">
                                    <Phone className="h-5 w-5 text-emerald-600" />
                                  </div>

                                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                                    Телефон
                                  </p>

                                  {studioPhone ? (
                                    <>
                                      <div className="mt-2 break-all text-base font-extrabold text-stone-900">
                                        {studioPhone}
                                      </div>

                                      <a
                                        href={`tel:${studioPhone}`}
                                        className="mt-3 inline-flex h-9 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 text-xs font-bold text-emerald-700 transition-all duration-150 active:translate-y-[1px] active:scale-95 active:bg-emerald-50 active:shadow-inner"
                                      >
                                        Зателефонувати
                                      </a>
                                    </>
                                  ) : (
                                    <p className="mt-2 text-sm text-stone-400">
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

                                  <div className="mt-2 text-base font-extrabold text-stone-900">
                                    Онлайн запис
                                  </div>

                                  <p className="mt-1 text-xs text-stone-500">
                                    Швидко та без дзвінків
                                  </p>
                                </div>
                              </div>

                              <div className="relative overflow-hidden rounded-[24px] border border-amber-200/60 bg-gradient-to-br from-white via-amber-50/40 to-stone-50 px-4 py-4 text-center shadow-[0_10px_30px_rgba(120,90,60,0.08)]">
                                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-200/25 blur-2xl" />
                                <div className="absolute -bottom-6 left-0 h-16 w-16 rounded-full bg-orange-200/20 blur-2xl" />

                                <div className="relative z-10">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 shadow-sm">
                                    <Banknote className="h-5 w-5 text-amber-700" />
                                  </div>

                                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-700">
                                    Оплата
                                  </p>

                                  <div className="mt-2 text-base font-extrabold text-stone-900">
                                    Без передоплати
                                  </div>

                                  <p className="mt-1 text-xs text-stone-500">
                                    Оплата після візиту
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-[30px] border border-stone-200 bg-gradient-to-br from-[#fffaf6] via-white to-[#f8f5f1] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-6">
                              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">
                                Швидкий контакт
                              </p>
                              <h3 className="mt-2 text-lg font-bold text-stone-800">
                                Потрібна консультація?
                              </h3>
                              <p className="mt-2 text-sm leading-6 text-stone-500">
                                Зв’яжіться зі студією напряму або забронюйте
                                послугу онлайн за кілька кліків.
                              </p>

                              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {studioPhone && (
                                  <a
                                    href={`tel:${studioPhone}`}
                                    className="group flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-stone-200/80 bg-gradient-to-b from-white to-stone-50 text-sm font-semibold text-stone-800 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-200 active:scale-[0.98] sm:hover:-translate-y-0.5 sm:hover:border-amber-200 sm:hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                                  >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors duration-200 sm:group-hover:bg-amber-100">
                                      <Phone className="h-4 w-4" />
                                    </span>
                                    <span>Зателефонувати</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            {teamMembers.length > 0 && (
                              <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-6">
                                <div className="mb-5 flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">
                                      Команда
                                    </p>
                                    <h3 className="mt-1 text-lg font-bold text-stone-800">
                                      Працівники студії
                                    </h3>
                                  </div>

                                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                                    {teamMembers.length}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                                  {teamMembers.map((member, idx) => (
                                    <div
                                      key={member.id || idx}
                                      className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
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
                  onClick={() => {
                    setPreselectedService(null);
                    setSelectedMaster(null);
                    setRescheduleMode(false);
                    setRescheduleBookingId(null);
                    setPreselectedDate(null);
                    setPreselectedTime(null);
                    setOpenBooking(true);
                  }}
                  className={cn(
                    "flex h-12 w-full items-center justify-center gap-2.5",
                    "rounded-[22px] px-5 text-sm font-semibold text-white",
                    "transition-all duration-200 active:scale-[0.985]",

                    // 👉 nude-green
                    "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",

                    // 👉 hover
                    "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]",
                  )}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                    <Sparkles className="h-4 w-4 opacity-90" />
                  </span>

                  <span>Обрати послугу</span>
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {openBooking && (
              <BookingModal
                open={openBooking}
                title={name}
                onClose={() => {
                  setOpenBooking(false);
                  setPreselectedService(null);
                  setSelectedMaster(null);
                  setRescheduleMode(false);
                  setRescheduleBookingId(null);
                  setPreselectedDate(null);
                  setPreselectedTime(null);
                }}
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
                  onCancel={() => {
                    setOpenBooking(false);
                    setPreselectedService(null);
                    setSelectedMaster(null);
                    setRescheduleMode(false);
                    setRescheduleBookingId(null);
                    setPreselectedDate(null);
                    setPreselectedTime(null);
                  }}
                  onSuccess={(data) => {
                    setSuccessData({
                      ...data,
                      address: fullAddress,
                      studioName: name,
                    });
                    setOpenBooking(false);
                    setPreselectedService(null);
                    setSelectedMaster(null);
                    setRescheduleMode(false);
                    setRescheduleBookingId(null);
                    setPreselectedDate(null);
                    setPreselectedTime(null);
                  }}
                />
              </BookingModal>
            )}
          </AnimatePresence>
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
