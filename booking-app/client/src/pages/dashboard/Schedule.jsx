// Schedule.jsx
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  RefreshCw,
  Trash2,
  X,
  Clock3,
  Clock,
  Timer,
  Coffee,
  CalendarCheck,
  ClipboardPen,
  Save,
  PhoneOff,
  ShieldCheck,
} from "lucide-react";
import TimeSelect from "../../components/TimeSelect";
import { useStudio } from "../../context/studio/useStudio";
import { api } from "../../api/http";
import DatePicker from "../../components/ui/DatePicker";

const DAYS = [
  { key: "mon", label: "Пн", full: "Понеділок" },
  { key: "tue", label: "Вт", full: "Вівторок" },
  { key: "wed", label: "Ср", full: "Середа" },
  { key: "thu", label: "Чт", full: "Четвер" },
  { key: "fri", label: "Пт", full: "П’ятниця" },
  { key: "sat", label: "Сб", full: "Субота" },
  { key: "sun", label: "Нд", full: "Неділя" },
];
const EXCEPTIONS_PAGE_SIZE = 5;
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const defaultDay = (enabled = true) => ({
  enabled,
  start: "08:00",
  end: "18:00",
  breakStart: "",
  breakEnd: "",
});

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-[#f6f1eb]", className)}
      aria-hidden="true"
    />
  );
}

function ExceptionsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[24px] border border-[#ebe7df] bg-white p-4"
        >
          <SkeletonBlock className="h-5 w-44" />
          <SkeletonBlock className="mt-2 h-4 w-36" />
        </div>
      ))}
    </div>
  );
}

function CustomSelect({ value, onChange, options, className = "" }) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: undefined,
    bottom: undefined,
    left: 0,
    width: 0,
  });

  const rootRef = useRef(null);
  const selected = options.find((opt) => String(opt.value) === String(value));

  function updateMenuPosition() {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dropdownHeight = 260;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUp =
      spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;

    setOpenUp(shouldOpenUp);
    setMenuPosition({
      left: rect.left,
      width: rect.width,
      top: shouldOpenUp ? undefined : rect.bottom + 8,
      bottom: shouldOpenUp ? window.innerHeight - rect.top + 8 : undefined,
    });
  }

  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }

    updateMenuPosition();
    setOpen(true);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }

    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative w-full sm:w-auto", className)}>
      <button
        type="button"
        onClick={toggleOpen}
        className={cn(
          "group flex w-full min-w-[170px] items-center justify-between rounded-[18px] border px-4 py-3 text-left text-sm font-bold outline-none transition-all duration-200",
          open
            ? "border-[#ff6200]/35 bg-white shadow-[0_12px_30px_rgba(255,98,0,0.12)] ring-4 ring-[#ff6200]/10"
            : "border-[#ebe7df] bg-[#fcfbf9] hover:border-[#ffd8c2] hover:bg-white",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate text-[#202020]">
          {selected?.label || "Оберіть"}
        </span>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#ff6200] transition-all duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "fixed z-[200] overflow-hidden rounded-[22px] border border-[#ebe7df] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] animate-in fade-in zoom-in-95 duration-150",
            openUp ? "origin-bottom" : "origin-top",
          )}
          style={{
            top: menuPosition.top,
            bottom: menuPosition.bottom,
            left: menuPosition.left,
            width: menuPosition.width,
          }}
        >
          <div className="max-h-72 overflow-y-auto py-2">
            {options.map((opt) => {
              const isActive = String(opt.value) === String(value);

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-[#fff4ec] text-[#ff6200]"
                      : "text-[#202020] hover:bg-[#fcfbf9]",
                  )}
                  role="option"
                  aria-selected={isActive}
                >
                  <span>{opt.label}</span>
                  {isActive && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function timeToMinutes(t) {
  const [hh, mm] = String(t || "")
    .split(":")
    .map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return Number.NaN;
  return hh * 60 + mm;
}
function minutesToTime(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getBreakStart(item) {
  return (
    item?.breakStart ||
    item?.pauseStart ||
    item?.lunchStart ||
    item?.break?.start ||
    item?.break?.from ||
    item?.pause?.start ||
    item?.lunch?.start ||
    item?.breaks?.[0]?.start ||
    ""
  );
}

function getBreakEnd(item) {
  return (
    item?.breakEnd ||
    item?.pauseEnd ||
    item?.lunchEnd ||
    item?.break?.end ||
    item?.break?.to ||
    item?.pause?.end ||
    item?.lunch?.end ||
    item?.breaks?.[0]?.end ||
    ""
  );
}

function getDefaultBreakForItem(item) {
  const startMin = timeToMinutes(item?.start);
  const endMin = timeToMinutes(item?.end);
  const preferredStart = timeToMinutes("12:00");
  const preferredEnd = timeToMinutes("13:00");

  if (
    Number.isFinite(startMin) &&
    Number.isFinite(endMin) &&
    startMin < preferredStart &&
    preferredEnd < endMin
  ) {
    return { breakStart: "12:00", breakEnd: "13:00" };
  }

  const duration = endMin - startMin;
  if (Number.isFinite(duration) && duration >= 30) {
    const breakLength = Math.min(
      60,
      Math.max(10, Math.floor(duration / 4 / 5) * 5),
    );
    const breakStart =
      startMin + Math.max(5, Math.floor((duration - breakLength) / 2 / 5) * 5);
    const breakEnd = Math.min(endMin - 5, breakStart + breakLength);

    if (startMin < breakStart && breakStart < breakEnd && breakEnd < endMin) {
      return {
        breakStart: minutesToTime(breakStart),
        breakEnd: minutesToTime(breakEnd),
      };
    }
  }

  return { breakStart: "12:00", breakEnd: "13:00" };
}

function withBreakState(item, enabled) {
  if (!enabled) {
    return { ...item, breakStart: "", breakEnd: "" };
  }

  const breakStart = getBreakStart(item);
  const breakEnd = getBreakEnd(item);

  if (breakStart && breakEnd) {
    return { ...item, breakStart, breakEnd };
  }

  return { ...item, ...getDefaultBreakForItem(item) };
}

function normalizeScheduleItem(item, fallback) {
  const source = item || {};
  const merged = { ...fallback, ...source };
  const breakStart = getBreakStart(source) || getBreakStart(merged);
  const breakEnd = getBreakEnd(source) || getBreakEnd(merged);

  return {
    ...merged,
    breakStart: breakStart && breakEnd ? breakStart : "",
    breakEnd: breakStart && breakEnd ? breakEnd : "",
  };
}

function normalizeException(item, fallback = {}) {
  const source = item || {};
  const breakStart = getBreakStart(source) || getBreakStart(fallback);
  const breakEnd = getBreakEnd(source) || getBreakEnd(fallback);

  return {
    ...fallback,
    ...source,
    date: String(source?.date || fallback?.date || "").slice(0, 10),
    breakStart: breakStart && breakEnd ? breakStart : "",
    breakEnd: breakStart && breakEnd ? breakEnd : "",
    isNew: false,
  };
}

function isScheduleItemValid(item) {
  if (!item?.enabled) return true;

  const startMin = timeToMinutes(item.start);
  const endMin = timeToMinutes(item.end);

  if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) return false;
  if (endMin <= startMin) return false;

  const breakStart = getBreakStart(item);
  const breakEnd = getBreakEnd(item);

  if (!breakStart && !breakEnd) return true;
  if (!breakStart || !breakEnd) return false;

  const breakStartMin = timeToMinutes(breakStart);
  const breakEndMin = timeToMinutes(breakEnd);

  if (!Number.isFinite(breakStartMin) || !Number.isFinite(breakEndMin)) {
    return false;
  }

  return (
    startMin < breakStartMin &&
    breakStartMin < breakEndMin &&
    breakEndMin < endMin
  );
}

function getInvalidScheduleFields(item) {
  if (!item?.enabled) return [];

  const startMin = timeToMinutes(item.start);
  const endMin = timeToMinutes(item.end);

  if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) {
    return ["start", "end"];
  }

  if (endMin <= startMin) {
    return ["start", "end"];
  }

  const breakStart = getBreakStart(item);
  const breakEnd = getBreakEnd(item);

  if (!breakStart && !breakEnd) return [];

  if (!breakStart || !breakEnd) {
    return ["breakStart", "breakEnd"];
  }

  const breakStartMin = timeToMinutes(breakStart);
  const breakEndMin = timeToMinutes(breakEnd);

  if (!Number.isFinite(breakStartMin) || !Number.isFinite(breakEndMin)) {
    return ["breakStart", "breakEnd"];
  }

  if (
    !(
      startMin < breakStartMin &&
      breakStartMin < breakEndMin &&
      breakEndMin < endMin
    )
  ) {
    return ["breakStart", "breakEnd"];
  }

  return [];
}

function isExceptionValid(item) {
  return Boolean(item?.date) && isScheduleItemValid(item);
}

function getDefaultSchedule() {
  return {
    mon: defaultDay(),
    tue: defaultDay(),
    wed: defaultDay(),
    thu: defaultDay(),
    fri: defaultDay(),
    sat: defaultDay(false),
    sun: defaultDay(false),
  };
}

function isPastExceptionDate(dateStr) {
  if (!dateStr) return false;

  const today = new Date();
  const todayLocal = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const [y, m, d] = String(dateStr).split("-").map(Number);
  const target = new Date(y, (m || 1) - 1, d || 1);

  return target < todayLocal;
}

function normalizeSchedule(incoming) {
  const base = getDefaultSchedule();
  if (!incoming) return base;

  const next = { ...base };
  for (const d of DAYS) {
    if (incoming[d.key]) {
      next[d.key] = normalizeScheduleItem(incoming[d.key], base[d.key]);
    }
  }

  return next;
}

function SectionCard({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = "",
}) {
  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-[32px] border border-[#ebe7df] bg-white shadow-[0_14px_44px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

      <div className="flex flex-col gap-3 border-b border-[#f1ece5] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {typeof title === "string" ? (
              <h2 className="text-lg font-black tracking-[-0.03em] text-[#202020]">
                {title}
              </h2>
            ) : (
              title
            )}

            {badge && (
              <span className="inline-flex items-center rounded-full bg-[#fff4ec] px-2.5 py-1 text-xs font-black text-[#ff6200]">
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="mt-1 text-sm font-medium leading-5 text-[#7b766f]">
              {subtitle}
            </p>
          )}
        </div>

        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const variants = {
    primary: "bg-[var(--color-primary-buttom)] text-white hover:bg-[#4a4a4a]",
    secondary:
      "border border-[#ebe7df] bg-white text-[#202020] hover:border-[#ffd8c2] hover:bg-[#fffaf6]",
    danger:
      "border border-[#f0b8b0] bg-[#fff4f2] text-[#c8483d] hover:border-[#c8483d] hover:bg-[#ffeceb]",
    ghost: "text-[#8a847d] hover:bg-[#fcfbf9] hover:text-[#202020]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-4 py-2.5 text-sm rounded-2xl",
    lg: "px-6 py-3 text-sm rounded-2xl",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function TimeField({ children, className = "" }) {
  const fieldRef = useRef(null);

  function handleClick(event) {
    const clickedControl = event.target.closest(
      "button,input,[role='button']",
    );

    if (clickedControl && fieldRef.current?.contains(clickedControl)) {
      return;
    }

    const control =
      fieldRef.current?.querySelector("button,input,[role='button']") ||
      fieldRef.current?.firstElementChild;

    if (!control) return;

    control.focus?.();
    control.click?.();
  }

  return (
    <div
      ref={fieldRef}
      onClick={handleClick}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </div>
  );
}

function Toggle({ checked }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full transition-all",
        checked
          ? "bg-gradient-to-r from-[#22c55e] to-[#16a34a]"
          : "bg-[#d8d2ca]",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </span>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#ffd8c2] bg-[#fff4ec] px-3 py-1.5 text-xs font-black text-[#ff6200] shadow-sm">
      {children}
    </span>
  );
}

function WorkDaysSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[24px] border border-[#ebe7df] bg-white p-4"
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_260px] sm:items-center">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-7 w-12 rounded-full" />
              <div className="min-w-0">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="mt-2 h-3 w-20" />
              </div>
            </div>

            <div className="w-full sm:w-[260px]">
              <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[22px] border border-[#ebe7df] bg-[#fcfbf9] px-2.5 py-2">
                <SkeletonBlock className="h-11 w-full rounded-[14px]" />
                <div className="flex items-center justify-center">
                  <span className="block h-px w-3 bg-[#ddd6ce]" />
                </div>
                <SkeletonBlock className="h-11 w-full rounded-[14px]" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Toast({ toast }) {
  return (
    <>
      <div
        className={cn(
          "fixed z-[90] transition-all duration-300",
          "left-1/2 top-[calc(1rem+env(safe-area-inset-top))] w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2",
          "md:bottom-6 md:left-6 md:top-auto md:w-auto md:min-w-[300px] md:max-w-[360px] md:translate-x-0",
          toast.open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0 md:translate-y-2",
        )}
        role="status"
        aria-live="polite"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-[24px] border bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl",
            toast.type === "success"
              ? "border-[#ffd8c2] ring-1 ring-[#fff0e6]"
              : "border-[#f0b8b0] ring-1 ring-[#ffeceb]",
          )}
        >
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-1",
              toast.type === "success"
                ? "bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]"
                : "bg-gradient-to-r from-[#f0b8b0] via-[#c8483d] to-[#9e3029]",
            )}
          />

          <div className="relative flex items-start gap-3 px-4 py-4 sm:px-5">
            <div
              className={cn(
                "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-[0_8px_22px_rgba(15,23,42,0.08)]",
                toast.type === "success"
                  ? "bg-gradient-to-r from-[#ff7a18] to-[#ff6200] text-white"
                  : "border border-[#f0b8b0] bg-[#fff4f2] text-[#c8483d]",
              )}
            >
              {toast.type === "success" ? (
                <Check className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="mt-2 text-[15px] font-black leading-5 text-[#202020]">
                {toast.title ||
                  (toast.type === "success" ? "Збережено" : "Помилка")}
              </p>

              <p className="mt-1 text-sm leading-5 text-[#7b766f]">
                {toast.text}
              </p>
            </div>
          </div>

          <div className="h-[3px] w-full bg-[#f6f1eb]">
            <div
              key={toast.id}
              className={cn(
                "h-full w-full origin-left",
                toast.type === "success" ? "bg-[#ff6200]" : "bg-[#c8483d]",
              )}
              style={{
                animation: `toastbar ${toast.duration}ms linear forwards`,
              }}
            />
          </div>
        </div>
      </div>
      <style>{`
  .exception-date-picker > div {
    width: 100%;
  }

  .exception-date-picker > div > div:not(.react-datepicker-popper),
  .exception-date-picker > div > button {
    height: 52px !important;
    width: 100% !important;
    border: 1px solid #eadbc9 !important;
    border-radius: 12px !important;
    background: #ffffff !important;
    color: #202020 !important;
    font-size: 14px !important;
    font-weight: 900 !important;
    transition: all 0.2s ease !important;
    box-shadow: none !important;
  }

  .exception-date-picker > div > div:not(.react-datepicker-popper):hover,
  .exception-date-picker > div > button:hover {
    border-color: #ffd6bd !important;
    background: #fff7f0 !important;
  }

  .exception-date-picker > div > div:not(.react-datepicker-popper):focus-within,
  .exception-date-picker > div > button:focus,
  .exception-date-picker > div > button:focus-visible {
    outline: none !important;
    box-shadow: 0 0 0 4px rgba(255, 98, 0, 0.1) !important;
  }

  .exception-date-picker input {
    height: 100% !important;
    border: 0 !important;
    background: transparent !important;
    color: #202020 !important;
    font-size: 14px !important;
    font-weight: 900 !important;
    outline: none !important;
    box-shadow: none !important;
  }

.exception-date-picker svg {
  color: #ff6200 !important;
  stroke: #ff6200 !important;
}
`}</style>
      <style>{`
        @keyframes toastbar {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </>
  );
}

function dateToInputValue(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatExceptionDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function exceptionSubtitle(item) {
  if (!item?.enabled) return null;

  const start = item?.start || "--:--";
  const end = item?.end || "--:--";
  const breakStart = getBreakStart(item);
  const breakEnd = getBreakEnd(item);

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-[#ff6200]" />
        {start}
      </span>

      <span className="text-[#c5b8ab]">—</span>

      <span className="inline-flex items-center gap-1.5">
        {end}
      </span>

      {breakStart && breakEnd && (
        <>
          <span className="text-[#d8cec4]">•</span>

          <span className="inline-flex items-center gap-1.5">
            <Coffee className="h-3.5 w-3.5 text-[#ff6200]" />
            {breakStart} — {breakEnd}
          </span>
        </>
      )}
    </span>
  );
}

function createEmptyException() {
  return {
    id: "",
    date: dateToInputValue(),
    enabled: true,
    start: "08:00",
    end: "18:00",
    breakStart: "12:00",
    breakEnd: "13:00",
    isNew: true,
  };
}

function getExceptionDateValue(item) {
  return String(item?.date || "").slice(0, 10);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getMonthTitle(date) {
  return new Intl.DateTimeFormat("uk-UA", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getWeekdayShort(date) {
  return new Intl.DateTimeFormat("uk-UA", {
    weekday: "short",
  }).format(date);
}

function getScheduleDayTitle(date) {
  return new Intl.DateTimeFormat("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function getScheduleTimeLines(item) {
  if (!item?.enabled)
    return ["\u0412\u0438\u0445\u0456\u0434\u043d\u0438\u0439"];

  const start = item?.start || "--:--";
  const end = item?.end || "--:--";
  const breakStart = getBreakStart(item);
  const breakEnd = getBreakEnd(item);
  const lines = [`${start} - ${end}`];

  if (breakStart && breakEnd) {
    lines.push(`${breakStart} - ${breakEnd}`);
  } else {
    lines.push("\u0411\u0435\u0437 \u043f\u0435\u0440\u0435\u0440\u0432\u0438");
  }

  return lines;
}

function createBulkScheduleDraftFromItem(item) {
  const enabled = item?.enabled !== false;
  const breakStart = getBreakStart(item);
  const breakEnd = getBreakEnd(item);

  return {
    enabled,
    start: item?.start || "08:00",
    end: item?.end || "18:00",
    breakStart: breakStart && breakEnd ? breakStart : "",
    breakEnd: breakStart && breakEnd ? breakEnd : "",
  };
}

function Modal({
  open,
  onClose,
  title,
  badge = "Редагування",
  icon: Icon = CalendarDays,
  subtitle,
  children,
  footer,
  size = "md",
}) {
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

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-stretch justify-center bg-[#202020]/45 p-0 backdrop-blur-[6px] sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className={cn(
          "flex h-dvh w-full flex-col overflow-hidden rounded-none border-0 bg-[#f7f5f1] shadow-[0_30px_90px_rgba(15,23,42,0.24)]",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          "sm:h-auto sm:max-h-[calc(100dvh-48px)] sm:rounded-[30px] sm:border sm:border-[#f0e2d3]",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="relative shrink-0 overflow-hidden bg-[#f3eee7] px-5 py-5 sm:px-6 sm:py-6">
            <div className="absolute right-[-55px] top-[-70px] h-[180px] w-[180px] rounded-full bg-[#ff6200]/10 blur-3xl" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
                  <Icon className="h-3.5 w-3.5" />
                  {badge}
                </span>

                <h3 className="mt-3 text-[26px] font-black leading-[0.95] tracking-[-0.05em] text-[#202020] sm:text-[32px]">
                  {title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => onClose?.()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#77716b] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96]"
                aria-label="Закрити"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfaf8] px-5 py-5 pb-[110px] sm:px-6 sm:pb-5">
          {children}
        </div>

        {footer && (
          <div className="sticky bottom-0 shrink-0 border-t border-[#f0e7da] bg-[#fbfaf8] px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Schedule() {
  const { studio } = useStudio();
  const queryClient = useQueryClient();
  const studioId = studio?.id ?? null;

  const fallbackSchedule = useMemo(() => getDefaultSchedule(), []);
  const fallbackSlotDuration = 10;

  const [scheduleDraft, setScheduleDraft] = useState(null);
  const [slotDurationDraft, setSlotDuration] = useState(null);
  const [savedSchedule, setSavedSchedule] = useState(null);
  const [savedSlotDuration, setSavedSlotDuration] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [preview, setPreview] = useState({});
  const [saving, setSaving] = useState(false);
  const [scheduleFieldErrors, setScheduleFieldErrors] = useState({});
  const [expandedExceptions, setExpandedExceptions] = useState({});
  const [visibleExceptionsCount, setVisibleExceptionsCount] =
    useState(EXCEPTIONS_PAGE_SIZE);
  const [exceptionModal, setExceptionModal] = useState({
    open: false,
    draft: createEmptyException(),
  });
  const [scheduleViewMode, setScheduleViewMode] = useState("week");
  const [scheduleMonthDate, setScheduleMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [scheduleMultiSelect, setScheduleMultiSelect] = useState(false);
  const [selectedScheduleDates, setSelectedScheduleDates] = useState([]);
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [bulkScheduleDraft, setBulkScheduleDraft] = useState({
    enabled: true,
    start: "08:00",
    end: "18:00",
    breakStart: "",
    breakEnd: "",
  });
  const [bulkSaving, setBulkSaving] = useState(false);
  const toastTimeoutRef = useRef(null);

  const [toast, setToast] = useState({
    id: 0,
    open: false,
    type: "success",
    title: "",
    text: "",
    duration: 2200,
  });

  async function fetchStudioSchedule(targetStudioId) {
    if (!targetStudioId) return null;

    const token = localStorage.getItem("token");

    return api(`/studio/${targetStudioId}/schedule`, {
      method: "GET",
      token,
    });
  }

  async function fetchStudioExceptions(targetStudioId) {
    if (!targetStudioId) return [];

    const token = localStorage.getItem("token");

    const data = await api(`/studio/${targetStudioId}/schedule/exceptions`, {
      method: "GET",
      token,
    });

    return Array.isArray(data?.exceptions)
      ? data.exceptions.map((item) => normalizeException(item))
      : [];
  }

  const scheduleQuery = useQuery({
    queryKey: ["studio-schedule", studioId],
    queryFn: () => fetchStudioSchedule(studioId),
    enabled: Boolean(studioId),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const exceptionsQuery = useQuery({
    queryKey: ["studio-schedule-exceptions", studioId],
    queryFn: () => fetchStudioExceptions(studioId),
    enabled: Boolean(studioId),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const loadedSchedule = useMemo(() => {
    if (!scheduleQuery.data?.schedule) return fallbackSchedule;

    return normalizeSchedule(scheduleQuery.data.schedule);
  }, [fallbackSchedule, scheduleQuery.data?.schedule]);

  const loadedSlotDuration = useMemo(() => {
    const value = scheduleQuery.data?.slotDuration;

    return typeof value === "number" ? value : fallbackSlotDuration;
  }, [fallbackSlotDuration, scheduleQuery.data?.slotDuration]);

  const schedule = scheduleDraft ?? savedSchedule ?? loadedSchedule;
  const slotDuration =
    slotDurationDraft ?? savedSlotDuration ?? loadedSlotDuration;

  const rollbackSchedule = savedSchedule ?? loadedSchedule;
  const rollbackSlotDuration = savedSlotDuration ?? loadedSlotDuration;
  const showToast = useCallback(({ type = "success", title, text }) => {
    const duration = 2200;

    setToast({
      id: Date.now(),
      open: true,
      type,
      title,
      text,
      duration,
    });

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, duration);
  }, []);

  function getInvalidScheduleDay(candidateSchedule) {
    return DAYS.find((day) => !isScheduleItemValid(candidateSchedule[day.key]));
  }

  function showScheduleValidationError(day) {
    showToast({
      type: "error",
      title: "Некоректний час",
      text: day
        ? `Перевірте години роботи та перерви для дня: ${day.full}.`
        : "Перевірте години роботи та перерви.",
    });
  }

  function scheduleErrorKey(dayKey, field) {
    return `${dayKey}.${field}`;
  }

  function hasScheduleFieldError(dayKey, field) {
    return Boolean(scheduleFieldErrors[scheduleErrorKey(dayKey, field)]);
  }

  function setScheduleDayErrors(dayKey, fields = []) {
    setScheduleFieldErrors((prev) => {
      const next = { ...prev };

      Object.keys(next).forEach((key) => {
        if (key.startsWith(`${dayKey}.`)) {
          delete next[key];
        }
      });

      fields.forEach((field) => {
        next[scheduleErrorKey(dayKey, field)] = true;
      });

      return next;
    });
  }

  function clearScheduleDayErrors(dayKey) {
    setScheduleFieldErrors((prev) => {
      const next = { ...prev };

      Object.keys(next).forEach((key) => {
        if (key.startsWith(`${dayKey}.`)) {
          delete next[key];
        }
      });

      return next;
    });
  }

  async function handleSlotDurationChange(nextDuration) {
    if (!studioId) return;

    const invalidDay = getInvalidScheduleDay(schedule);
    if (invalidDay) {
      showScheduleValidationError(invalidDay);
      return;
    }

    const token = localStorage.getItem("token");
    const previous = queryClient.getQueryData(["studio-schedule", studioId]);

    setSlotDuration(nextDuration);

    queryClient.setQueryData(["studio-schedule", studioId], (old) => ({
      ...(old || {}),
      schedule,
      slotDuration: nextDuration,
    }));

    try {
      await api(`/studio/${studioId}/schedule`, {
        method: "PATCH",
        token,
        body: {
          schedule,
          slotDuration: nextDuration,
        },
      });

      setSavedSlotDuration(nextDuration);
      setPreview({});

      showToast({
        type: "success",
        title: "Крок оновлено",
        text: "Тривалість слота збережено.",
      });
    } catch (err) {
      console.error(err);

      setSlotDuration(rollbackSlotDuration);
      queryClient.setQueryData(["studio-schedule", studioId], previous);

      showToast({
        type: "error",
        title: "Не вдалося зберегти",
        text: err?.message || "Сталася помилка під час збереження.",
      });
    }
  }

  async function toggleDay(dayKey) {
    if (!studioId || saving) return;

    const token = localStorage.getItem("token");
    const previous = queryClient.getQueryData(["studio-schedule", studioId]);

    const nextSchedule = {
      ...schedule,
      [dayKey]: {
        ...schedule[dayKey],
        enabled: !schedule[dayKey].enabled,
      },
    };

    setScheduleDraft(nextSchedule);

    queryClient.setQueryData(["studio-schedule", studioId], (old) => ({
      ...(old || {}),
      schedule: nextSchedule,
      slotDuration,
    }));

    try {
      await api(`/studio/${studioId}/schedule`, {
        method: "PATCH",
        token,
        body: {
          schedule: nextSchedule,
          slotDuration,
        },
      });

      setSavedSchedule(nextSchedule);
      setPreview({});

      showToast({
        type: "success",
        title: nextSchedule[dayKey].enabled
          ? "День увімкнено"
          : "День вимкнено",
        text: "Зміни збережено в розкладі.",
      });
    } catch (err) {
      console.error(err);

      setScheduleDraft(rollbackSchedule);
      queryClient.setQueryData(["studio-schedule", studioId], previous);

      showToast({
        type: "error",
        title: "Не вдалося зберегти",
        text: err?.message || "Сталася помилка під час збереження.",
      });
    }
  }

  async function toggleDayBreak(dayKey) {
    if (!studioId || saving) return;

    const token = localStorage.getItem("token");
    const previous = queryClient.getQueryData(["studio-schedule", studioId]);
    const config = schedule[dayKey];
    const hasBreak = Boolean(getBreakStart(config) && getBreakEnd(config));

    const nextSchedule = {
      ...schedule,
      [dayKey]: withBreakState(config, !hasBreak),
    };

    if (!isScheduleItemValid(nextSchedule[dayKey])) {
      showScheduleValidationError(DAYS.find((day) => day.key === dayKey));
      return;
    }

    setScheduleDraft(nextSchedule);

    queryClient.setQueryData(["studio-schedule", studioId], (old) => ({
      ...(old || {}),
      schedule: nextSchedule,
      slotDuration,
    }));

    try {
      await api(`/studio/${studioId}/schedule`, {
        method: "PATCH",
        token,
        body: {
          schedule: nextSchedule,
          slotDuration,
        },
      });

      setSavedSchedule(nextSchedule);
      setPreview({});

      showToast({
        type: "success",
        title: hasBreak ? "Перерву вимкнено" : "Перерву додано",
        text: "Зміни збережено в розкладі.",
      });
    } catch (err) {
      console.error(err);

      setScheduleDraft(rollbackSchedule);
      queryClient.setQueryData(["studio-schedule", studioId], previous);

      showToast({
        type: "error",
        title: "Не вдалося зберегти",
        text: err?.message || "Сталася помилка під час збереження.",
      });
    }
  }

  function updateTime(day, field, value) {
    const baseSchedule = getDefaultSchedule();

    const currentSchedule = {
      ...baseSchedule,
      ...(schedule || {}),
    };

    const nextDay = {
      ...(baseSchedule[day] || {}),
      ...(currentSchedule[day] || {}),
      [field]: value,
    };

    const nextSchedule = {
      ...currentSchedule,
      [day]: nextDay,
    };

    const invalidFields = getInvalidScheduleFields(nextDay);

    if (invalidFields.length > 0) {
      setScheduleDayErrors(day, invalidFields);
    } else {
      clearScheduleDayErrors(day);
    }

    setScheduleDraft(nextSchedule);
  }

  async function handleTimeCommit(dayKey, field, nextValue) {
    if (!studioId) return;

    const token = localStorage.getItem("token");
    const previous = queryClient.getQueryData(["studio-schedule", studioId]);

    const baseSchedule = getDefaultSchedule();

    const currentSchedule = {
      ...baseSchedule,
      ...(schedule || {}),
    };

    const nextDay = {
      ...(baseSchedule[dayKey] || {}),
      ...(currentSchedule[dayKey] || {}),
      [field]: nextValue,
    };

    const nextSchedule = {
      ...currentSchedule,
      [dayKey]: nextDay,
    };

    const invalidFields = getInvalidScheduleFields(nextDay);

    if (invalidFields.length > 0) {
      setScheduleDayErrors(dayKey, invalidFields);
      showScheduleValidationError(DAYS.find((day) => day.key === dayKey));
      return;
    }

    clearScheduleDayErrors(dayKey);
    setScheduleDraft(nextSchedule);

    queryClient.setQueryData(["studio-schedule", studioId], (old) => ({
      ...(old || {}),
      schedule: nextSchedule,
      slotDuration,
    }));

    try {
      await api(`/studio/${studioId}/schedule`, {
        method: "PATCH",
        token,
        body: {
          schedule: nextSchedule,
          slotDuration,
        },
      });

      setSavedSchedule(nextSchedule);
      setSavedSlotDuration(slotDuration);
      setPreview({});

      showToast({
        type: "success",
        title: "Час оновлено",
        text: "Зміни збережено в розкладі.",
      });
    } catch (err) {
      console.error(err);

      setScheduleDayErrors(dayKey, [field]);
      queryClient.setQueryData(["studio-schedule", studioId], previous);

      showToast({
        type: "error",
        title: "Не вдалося зберегти",
        text: err?.message || "Сталася помилка під час збереження.",
      });
    }
  }

  async function deleteExpiredExceptions(targetStudioId, token, list) {
    const expired = (list || []).filter(
      (item) => item?.id && isPastExceptionDate(item.date),
    );

    if (!expired.length) return list || [];

    await Promise.allSettled(
      expired.map((item) =>
        api(`/studio/${targetStudioId}/schedule/exceptions/${item.id}`, {
          method: "DELETE",
          token,
        }),
      ),
    );

    return (list || []).filter((item) => !isPastExceptionDate(item.date));
  }

  function openAddExceptionModal() {
    setExceptionModal({
      open: true,
      draft: createEmptyException(),
    });
  }

  function closeExceptionModal() {
    if (saving) return;

    setExceptionModal({
      open: false,
      draft: createEmptyException(),
    });
  }

  function updateExceptionDraft(field, value) {
    setExceptionModal((prev) => {
      let draft = {
        ...prev.draft,
        [field]: value,
      };

      if (field === "enabled") {
        draft = value
          ? withBreakState(
              {
                ...draft,
                start: draft.start || "08:00",
                end: draft.end || "18:00",
              },
              true,
            )
          : withBreakState(draft, false);
      }

      return {
        ...prev,
        draft,
      };
    });
  }

  function updateExceptionDraftBreak(enabled) {
    setExceptionModal((prev) => ({
      ...prev,
      draft: withBreakState(prev.draft, enabled),
    }));
  }

  async function saveExceptionFromModal() {
    const item = exceptionModal.draft;

    if (!isExceptionValid(item)) {
      showToast({
        type: "error",
        title: "Некоректний час",
        text: "Перевірте години роботи та перерви.",
      });
      return;
    }

    const duplicate = exceptions.find((row) => row.date === item.date);

    if (duplicate) {
      showToast({
        type: "error",
        title: "Дата вже існує",
        text: "Для цієї дати вже додано особливий графік.",
      });
      return;
    }

    const nextExceptions = sortExceptions([...exceptions, item]);
    const nextIndex = nextExceptions.findIndex((row) => row === item);

    setExceptions(nextExceptions);

    const saved = await saveException(item, nextIndex);

    if (!saved) {
      setExceptions((prev) => prev.filter((row) => row !== item));
      return;
    }

    closeExceptionModal();
  }

  function generateSlots() {
    const result = {};

    for (const day of DAYS) {
      const config = schedule[day.key];
      if (!config.enabled) continue;

      const start = timeToMinutes(config.start);
      const end = timeToMinutes(config.end);
      if (end <= start) continue;

      const breakStart = timeToMinutes(getBreakStart(config));
      const breakEnd = timeToMinutes(getBreakEnd(config));
      const hasValidBreak =
        Number.isFinite(breakStart) &&
        Number.isFinite(breakEnd) &&
        start < breakStart &&
        breakStart < breakEnd &&
        breakEnd < end;

      const slots = [];
      let minutes = start;

      while (minutes + slotDuration <= end) {
        const slotEnd = minutes + slotDuration;
        const overlapsBreak =
          hasValidBreak && minutes < breakEnd && slotEnd > breakStart;

        if (!overlapsBreak) {
          slots.push(minutesToTime(minutes));
        }

        minutes += slotDuration;
      }

      result[day.key] = slots;
    }

    setPreview(result);
  }

  function sortExceptions(list) {
    return [...list].sort((a, b) => {
      const ad = a.date || "";
      const bd = b.date || "";
      return ad.localeCompare(bd);
    });
  }

  function handleScheduleViewModeChange(nextMode) {
    setScheduleViewMode(nextMode);

    if (nextMode === "week") {
      closeScheduleSelection();
    }
  }

  function getScheduleItemForDate(dateKey) {
    const index = exceptions.findIndex(
      (item) => getExceptionDateValue(item) === dateKey,
    );

    if (index >= 0) {
      return {
        index,
        item: {
          ...exceptions[index],
          breakStart: getBreakStart(exceptions[index]),
          breakEnd: getBreakEnd(exceptions[index]),
        },
      };
    }

    const date = new Date(`${dateKey}T00:00:00`);
    const weekdayIndex = Number.isNaN(date.getTime())
      ? 0
      : (date.getDay() + 6) % 7;
    const dayKey = DAYS[weekdayIndex]?.key || "mon";
    const fallback = getDefaultSchedule()[dayKey] || defaultDay();
    const weeklyItem = normalizeScheduleItem(schedule?.[dayKey], fallback);

    return {
      index: -1,
      item: {
        ...weeklyItem,
        id: "",
        date: dateKey,
        isGenerated: true,
      },
    };
  }

  function buildStudioScheduleMonth(monthDate) {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const daysInMonth = new Date(
      firstDay.getFullYear(),
      firstDay.getMonth() + 1,
      0,
    ).getDate();
    const monthStartOffset = (firstDay.getDay() + 6) % 7;
    const weeksCount = Math.ceil((monthStartOffset + daysInMonth) / 7);
    const gridStart = addDays(firstDay, -monthStartOffset);

    return Array.from({ length: weeksCount * 7 }).map((_, index) => {
      const date = addDays(gridStart, index);
      const dateKey = dateToInputValue(date);
      const daySchedule = getScheduleItemForDate(dateKey);

      return {
        date,
        dateKey,
        dayNumber: date.getDate(),
        weekday: getWeekdayShort(date),
        weekdayIndex: (date.getDay() + 6) % 7,
        isCurrentMonth: date.getMonth() === firstDay.getMonth(),
        isToday: dateKey === dateToInputValue(new Date()),
        hasException: daySchedule.index >= 0,
        ...daySchedule,
      };
    });
  }

  function closeScheduleSelection() {
    setScheduleMultiSelect(false);
    setSelectedScheduleDates([]);
    setScheduleEditorOpen(false);
  }

  function shiftScheduleMonth(amount) {
    setScheduleMonthDate((prev) => addMonths(prev, amount));
    closeScheduleSelection();
  }

  function resetScheduleMonthToToday() {
    const now = new Date();
    setScheduleMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    closeScheduleSelection();
  }

  function toggleScheduleDate(dateKey) {
    if (!scheduleMultiSelect) {
      const current = getScheduleItemForDate(dateKey);

      setBulkScheduleDraft(createBulkScheduleDraftFromItem(current.item));
      setSelectedScheduleDates([dateKey]);
      setScheduleEditorOpen(true);
      return;
    }

    setScheduleEditorOpen(false);
    setSelectedScheduleDates((prev) =>
      prev.includes(dateKey)
        ? prev.filter((key) => key !== dateKey)
        : [...prev, dateKey],
    );
  }

  function toggleScheduleWeekday(monthDays, weekdayIndex) {
    const keys = monthDays
      .filter((day) => day.isCurrentMonth && day.weekdayIndex === weekdayIndex)
      .map((day) => day.dateKey);

    setScheduleMultiSelect(true);
    setScheduleEditorOpen(false);
    setSelectedScheduleDates((prev) => {
      const allSelected = keys.every((key) => prev.includes(key));

      if (allSelected) {
        return prev.filter((key) => !keys.includes(key));
      }

      return [...new Set([...prev, ...keys])];
    });
  }

  function quickSelectWorkdays(monthDays) {
    const keys = monthDays
      .filter((day) => day.isCurrentMonth && day.weekdayIndex < 5)
      .map((day) => day.dateKey);

    setScheduleMultiSelect(true);
    setScheduleEditorOpen(false);
    setSelectedScheduleDates(keys);
  }

  function openScheduleEditorForSelectedDates() {
    if (!selectedScheduleDates.length) return;

    const current = getScheduleItemForDate(selectedScheduleDates[0]);

    setBulkScheduleDraft(createBulkScheduleDraftFromItem(current.item));
    setScheduleEditorOpen(true);
  }

  function getVisibleScheduleItemForDay(day) {
    const shouldUseDraft =
      scheduleEditorOpen &&
      selectedScheduleDates.includes(day.dateKey) &&
      day.isCurrentMonth;

    if (!shouldUseDraft) {
      return day.item;
    }

    return {
      ...day.item,
      enabled: bulkScheduleDraft.enabled,
      start: bulkScheduleDraft.enabled
        ? bulkScheduleDraft.start
        : day.item.start,
      end: bulkScheduleDraft.enabled ? bulkScheduleDraft.end : day.item.end,
      breakStart: bulkScheduleDraft.enabled
        ? bulkScheduleDraft.breakStart || ""
        : "",
      breakEnd: bulkScheduleDraft.enabled
        ? bulkScheduleDraft.breakEnd || ""
        : "",
    };
  }

  function buildBulkScheduleItem(dateKey, enabled) {
    const current = getScheduleItemForDate(dateKey);

    return {
      ...current.item,
      date: dateKey,
      enabled,
      start: enabled ? bulkScheduleDraft.start : current.item.start,
      end: enabled ? bulkScheduleDraft.end : current.item.end,
      breakStart: enabled ? bulkScheduleDraft.breakStart : "",
      breakEnd: enabled ? bulkScheduleDraft.breakEnd : "",
    };
  }

  function updateBulkScheduleField(field, value) {
    setBulkScheduleDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateBulkScheduleBreak(enabled) {
    setBulkScheduleDraft((prev) => ({
      ...prev,
      breakStart: enabled ? prev.breakStart || "12:00" : "",
      breakEnd: enabled ? prev.breakEnd || "13:00" : "",
    }));
  }

  async function saveStudioExceptionEntry(item) {
    if (!studio?.id) {
      throw new Error(
        "\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0432\u0438\u0437\u043d\u0430\u0447\u0438\u0442\u0438 \u0441\u0442\u0443\u0434\u0456\u044e",
      );
    }

    const existing = exceptions.find(
      (row) => getExceptionDateValue(row) === getExceptionDateValue(item),
    );
    const itemToSave = {
      ...existing,
      ...item,
      id: item.id || existing?.id || "",
    };

    if (!isExceptionValid(itemToSave)) {
      throw new Error(
        "\u041f\u0435\u0440\u0435\u0432\u0456\u0440\u0442\u0435 \u0433\u043e\u0434\u0438\u043d\u0438 \u0440\u043e\u0431\u043e\u0442\u0438 \u0442\u0430 \u043f\u0435\u0440\u0435\u0440\u0432\u0438.",
      );
    }

    const token = localStorage.getItem("token");
    const body = {
      date: itemToSave.date,
      enabled: itemToSave.enabled,
      start: itemToSave.enabled ? itemToSave.start : null,
      end: itemToSave.enabled ? itemToSave.end : null,
      breakStart: itemToSave.enabled ? getBreakStart(itemToSave) || null : null,
      breakEnd: itemToSave.enabled ? getBreakEnd(itemToSave) || null : null,
    };

    const res = itemToSave.id
      ? await api(`/studio/${studio.id}/schedule/exceptions/${itemToSave.id}`, {
          method: "PATCH",
          token,
          body,
        })
      : await api(`/studio/${studio.id}/schedule/exceptions`, {
          method: "POST",
          token,
          body,
        });

    const savedException = normalizeException(
      res.exception || itemToSave,
      itemToSave,
    );

    queryClient.setQueryData(
      ["studio-schedule-exceptions", studioId],
      (old = []) => {
        const exists = old.some((row) =>
          savedException.id
            ? row.id === savedException.id
            : row.date === savedException.date,
        );
        const next = exists
          ? old.map((row) =>
              (
                savedException.id
                  ? row.id === savedException.id
                  : row.date === savedException.date
              )
                ? savedException
                : row,
            )
          : [...old, savedException];

        return sortExceptions(next);
      },
    );

    setExceptions((prev) => {
      const exists = prev.some((row) =>
        savedException.id
          ? row.id === savedException.id
          : row.date === savedException.date,
      );
      const next = exists
        ? prev.map((row) =>
            (
              savedException.id
                ? row.id === savedException.id
                : row.date === savedException.date
            )
              ? savedException
              : row,
          )
        : [...prev, savedException];

      return sortExceptions(next);
    });

    return savedException;
  }

  async function applyBulkSchedule(enabled = bulkScheduleDraft.enabled) {
    if (!selectedScheduleDates.length || bulkSaving) return;

    const items = selectedScheduleDates.map((dateKey) =>
      buildBulkScheduleItem(dateKey, enabled),
    );
    const invalidItem = items.find((item) => !isExceptionValid(item));

    if (invalidItem) {
      showToast({
        type: "error",
        title:
          "\u041d\u0435\u043a\u043e\u0440\u0435\u043a\u0442\u043d\u0438\u0439 \u0447\u0430\u0441",
        text: "\u041f\u0435\u0440\u0435\u0432\u0456\u0440\u0442\u0435 \u0433\u043e\u0434\u0438\u043d\u0438 \u0440\u043e\u0431\u043e\u0442\u0438 \u0442\u0430 \u043f\u0435\u0440\u0435\u0440\u0432\u0438.",
      });
      return;
    }

    setBulkSaving(true);

    try {
      await Promise.all(items.map((item) => saveStudioExceptionEntry(item)));
      setPreview({});
      closeScheduleSelection();

      showToast({
        type: "success",
        title:
          "\u0413\u0440\u0430\u0444\u0456\u043a \u043e\u043d\u043e\u0432\u043b\u0435\u043d\u043e",
        text: "\u0417\u043c\u0456\u043d\u0438 \u0434\u043b\u044f \u0432\u0438\u0431\u0440\u0430\u043d\u0438\u0445 \u0434\u0430\u0442 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e.",
      });
    } catch (error) {
      console.error(error);

      showToast({
        type: "error",
        title:
          "\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0431\u0435\u0440\u0435\u0433\u0442\u0438",
        text:
          error?.message ||
          "\u0421\u0442\u0430\u043b\u0430\u0441\u044f \u043f\u043e\u043c\u0438\u043b\u043a\u0430 \u043f\u0456\u0434 \u0447\u0430\u0441 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f.",
      });
    } finally {
      setBulkSaving(false);
    }
  }

  function getExceptionKey(item, index) {
    return item.id || `${item.date || "new"}-${index}`;
  }

  function toggleExceptionExpanded(key) {
    setExpandedExceptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function addExceptionRow() {
    const newItem = createEmptyException();

    setExceptions((prev) => {
      const next = sortExceptions([...prev, newItem]);
      const newIndex = next.findIndex((item) => item === newItem);
      const key = getExceptionKey(newItem, newIndex);

      setTimeout(() => {
        setExpandedExceptions((prevExpanded) => ({
          ...prevExpanded,
          [key]: true,
        }));
      }, 0);

      return next;
    });
  }

  function updateException(index, field, value) {
    setExceptions((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        let next = { ...item, [field]: value };

        if (field === "enabled") {
          next = value
            ? withBreakState(
                {
                  ...next,
                  start: next.start || "08:00",
                  end: next.end || "18:00",
                },
                true,
              )
            : withBreakState(next, false);
        }

        return next;
      }),
    );
  }

  function updateExceptionBreak(index, enabled) {
    setExceptions((prev) =>
      prev.map((item, i) =>
        i === index ? withBreakState(item, enabled) : item,
      ),
    );
  }

  async function saveException(item, index) {
    if (!studio?.id) return false;

    const token = localStorage.getItem("token");

    if (!item.date) {
      showToast({
        type: "error",
        title: "Не вказано дату",
        text: "Оберіть дату для особливого графіка.",
      });

      return false;
    }

    if (!isExceptionValid(item)) {
      showToast({
        type: "error",
        title: "Некоректний час",
        text: "Перевірте години роботи та перерви.",
      });

      return false;
    }

    const duplicate = exceptions.find(
      (row, i) => i !== index && row.date === item.date,
    );

    if (duplicate) {
      showToast({
        type: "error",
        title: "Дата вже існує",
        text: "Для цієї дати вже додано особливий графік.",
      });

      return false;
    }

    try {
      const body = {
        date: item.date,
        enabled: item.enabled,
        start: item.enabled ? item.start : null,
        end: item.enabled ? item.end : null,
        breakStart: item.enabled ? getBreakStart(item) || null : null,
        breakEnd: item.enabled ? getBreakEnd(item) || null : null,
      };

      const res = item.id
        ? await api(`/studio/${studio.id}/schedule/exceptions/${item.id}`, {
            method: "PATCH",
            token,
            body,
          })
        : await api(`/studio/${studio.id}/schedule/exceptions`, {
            method: "POST",
            token,
            body,
          });

      const savedException = normalizeException(res.exception || item, item);

      queryClient.setQueryData(
        ["studio-schedule-exceptions", studioId],
        (old = []) => {
          const exists = old.some((row) =>
            savedException.id
              ? row.id === savedException.id
              : row.date === savedException.date,
          );

          if (exists) {
            return old.map((row) =>
              (
                savedException.id
                  ? row.id === savedException.id
                  : row.date === savedException.date
              )
                ? savedException
                : row,
            );
          }

          return [...old, savedException];
        },
      );

      setExceptions((prev) => {
        const next = sortExceptions(
          prev.map((row, i) => (i === index ? savedException : row)),
        );

        const savedIndex = next.findIndex(
          (row) =>
            (savedException.id && row.id === savedException.id) ||
            row.date === savedException.date,
        );

        const nextKey =
          savedIndex >= 0
            ? getExceptionKey(next[savedIndex], savedIndex)
            : getExceptionKey(savedException, index);

        setTimeout(() => {
          setExpandedExceptions((prevExpanded) => {
            const updated = { ...prevExpanded };

            Object.keys(updated).forEach((k) => {
              if (k.includes(item.date || "")) delete updated[k];
            });

            updated[nextKey] = false;
            return updated;
          });
        }, 0);

        return next;
      });

      setPreview({});

      showToast({
        type: "success",
        title: "Особливу дату збережено",
        text: item.enabled
          ? "Графік для вибраної дати оновлено."
          : "Для вибраної дати встановлено вихідний.",
      });

      return true;
    } catch (err) {
      console.error(err);

      showToast({
        type: "error",
        title: "Не вдалося зберегти",
        text: err?.message || "Сталася помилка під час збереження.",
      });

      return false;
    }
  }

  async function removeException(item, index) {
    if (!studio?.id) return;

    if (!item.id) {
      setExceptions((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    const token = localStorage.getItem("token");

    try {
      await api(`/studio/${studio.id}/schedule/exceptions/${item.id}`, {
        method: "DELETE",
        token,
      });

      queryClient.setQueryData(
        ["studio-schedule-exceptions", studioId],
        (old = []) => old.filter((row) => row.id !== item.id),
      );

      setExceptions((prev) => prev.filter((_, i) => i !== index));
      setPreview({});

      showToast({
        type: "success",
        title: "Особливу дату видалено",
        text: "Дата повернулась до стандартного графіка.",
      });
    } catch (err) {
      console.error(err);

      showToast({
        type: "error",
        title: "Не вдалося видалити",
        text: err?.message || "Сталася помилка під час видалення.",
      });
    }
  }

  useEffect(() => {
    if (!exceptionsQuery.data) return;

    let alive = true;

    (async () => {
      try {
        const token = localStorage.getItem("token");

        const cleanedExceptions = await deleteExpiredExceptions(
          studioId,
          token,
          exceptionsQuery.data,
        );

        if (!alive) return;
        setExceptions(sortExceptions(cleanedExceptions));
      } catch (e) {
        console.error(e);

        if (!alive) return;

        showToast({
          type: "error",
          title: "Не вдалося завантажити",
          text: e?.message || "Помилка завантаження особливих дат.",
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [exceptionsQuery.data, studioId, showToast]);

  const visibleExceptions = exceptions.slice(0, visibleExceptionsCount);
  const hiddenExceptionsCount = exceptions.length - visibleExceptions.length;
  const hasMoreExceptions = hiddenExceptionsCount > 0;
  const initialLoading = scheduleQuery.isLoading && !scheduleQuery.data;
  const exceptionsLoading = exceptionsQuery.isLoading && !exceptionsQuery.data;

  return (
    <div className="min-h-screen">
      <Toast toast={toast} />

      <div className="mx-auto max-w-6xl space-y-6">
        <div className="relative mb-6 overflow-hidden rounded-[32px] border border-[#ebe7df] bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-7">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

          <div className="relative">
            <h1 className="text-4xl font-black leading-[0.95] tracking-tight text-[#202020] sm:text-6xl">
              Графік <span className="text-[#ff5a00]">роботи</span>
            </h1>

            <p className="mt-3 max-w-[640px] text-[14px] leading-6 text-[#7b766f] sm:text-[16px]">
              Налаштуйте робочі дні, години роботи та крок запису в зручному
              форматі.
            </p>
          </div>
        </div>

        <SectionCard
          title={
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-buttom)] text-white">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-black tracking-[-0.03em] text-[#202020]">
                  Робочі дні
                </h2>

                <p className="mt-1 text-sm font-medium text-[#7b766f]">
                  Увімкни день і задай час початку та завершення.
                </p>
              </div>
            </div>
          }
          actions={
            <div className="grid w-full grid-cols-2 rounded-2xl border border-[#ebe7df] bg-[#fcfbf9] p-1 sm:w-auto">
              {[
                [
                  "week",
                  "\u0422\u0438\u0436\u0434\u0435\u043d\u044c",
                  CalendarDays,
                ],
                ["days", "\u041f\u043e \u0434\u043d\u044f\u0445", ClipboardPen],
              ].map(([value, label, Icon]) => {
                const active = scheduleViewMode === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleScheduleViewModeChange(value)}
                    className={cn(
                      "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition-all duration-200",
                      active
                        ? "bg-[#ff6200] text-white shadow-[0_8px_22px_rgba(255,98,0,0.22)]"
                        : "text-[#7b766f] hover:bg-white hover:text-[#202020]",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          }
        >
          {initialLoading ? (
            <WorkDaysSkeleton />
          ) : scheduleViewMode === "week" ? (
            <div className="space-y-3">
              {DAYS.map((day) => {
                const config = schedule[day.key];
                const enabled = config.enabled;
                const breakStart = getBreakStart(config);
                const breakEnd = getBreakEnd(config);
                const hasBreak = Boolean(breakStart && breakEnd);

                return (
                  <div
                    key={day.key}
                    className={cn(
                      "rounded-[24px] border p-4 transition-all duration-300",
                      enabled
                        ? "border-[#ebe7df] bg-white shadow-[0_8px_26px_rgba(15,23,42,0.04)] hover:border-[#ffdcc7]"
                        : "border-[#f0ece6] bg-[#faf8f5]",
                    )}
                  >
                    <div className="grid gap-4 sm:grid-cols-[1fr_minmax(300px,440px)] sm:items-center">
                      <button
                        type="button"
                        onClick={() => toggleDay(day.key)}
                        disabled={saving}
                        className="flex w-full items-center justify-between gap-3 text-left disabled:opacity-60 sm:w-auto sm:justify-start"
                      >
                        <div className="order-1 min-w-0 pl-2 sm:order-2 sm:pl-0">
                          <p className="text-[15px] font-black text-[#202020]">
                            {day.full}
                          </p>

                          <p className="text-xs font-semibold text-[#8a847d]">
                            {enabled ? "Робочий" : "Вихідний"}
                          </p>
                        </div>

                        <span className="order-2 shrink-0 sm:order-1">
                          <Toggle checked={enabled} />
                        </span>
                      </button>

                      <div
                        className={cn(
                          "w-full",
                          enabled ? "block" : "hidden sm:block sm:invisible",
                        )}
                      >
<div className="grid w-full grid-cols-2 gap-2 min-[640px]:max-[739px]:ml-auto min-[640px]:max-[739px]:mr-0 min-[640px]:max-[739px]:max-w-[320px]">
  {[
    ["start", "Початок", Clock],
    ["end", "Кінець", Timer],
  ].map(([field, label, Icon]) => (
                            <div key={field} className="min-w-0">
                              <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#77716b]">
                                <Icon className="h-3.5 w-3.5 text-[#ff6200]" />
                                {label}
                              </label>

<TimeField
  className={cn(
    "schedule-time-field flex h-[50px] cursor-pointer items-center overflow-hidden rounded-[18px] border p-0 transition-all duration-200 focus-within:ring-4",
    hasScheduleFieldError(day.key, field)
      ? "border-[#ef4444] bg-[#fff5f5] focus-within:ring-[#ef4444]/10"
      : "border-[#eadbc9] bg-white hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] focus-within:ring-[#ff6200]/10",
  )}
>
  <TimeSelect
    value={config[field]}
    label={label}
    dayLabel={day.full}
    onChange={(value) => updateTime(day.key, field, value)}
    onCommit={(value) => handleTimeCommit(day.key, field, value)}
    className="h-full w-full justify-center text-base"
  />
</TimeField>
                            </div>
                          ))}
                        </div>

                        {enabled && (
<div
  className={cn(
    "mt-2 grid w-full gap-2",
    "min-[640px]:max-[739px]:ml-auto min-[640px]:max-[739px]:mr-0 min-[640px]:max-[739px]:max-w-[320px]",
    hasBreak && "grid-cols-2 min-[740px]:grid-cols-[1fr_1fr_1fr]",
  )}
>
  <button
    type="button"
    onClick={() => toggleDayBreak(day.key)}
    disabled={saving}
    className={cn(
      "flex h-[50px] w-full items-center justify-between gap-3 rounded-[18px] border border-[#eadbc9] bg-white px-4 text-left text-sm font-black text-[#202020] transition-all duration-200 hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] disabled:opacity-60",
      hasBreak && "col-span-2 min-[740px]:col-span-1",
    )}
  >
                              <span className="flex min-w-0 items-center gap-2">
                                <Coffee
                                  className={cn(
                                    "h-4 w-4 shrink-0",
                                    hasBreak
                                      ? "text-[#41a85f]"
                                      : "text-[#8a847d]",
                                  )}
                                />
                                <span className="truncate">
                                  {hasBreak ? "Перерва" : "Без перерви"}
                                </span>
                              </span>

                              <Toggle checked={hasBreak} />
                            </button>

                            {hasBreak &&
                              [
                                ["breakStart", "Перерва з", Coffee],
                                ["breakEnd", "Перерва до", Coffee],
                              ].map(([field, label, Icon]) => (
                                <div key={field} className="min-w-0">
                                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#77716b]">
                                    <Icon className="h-3.5 w-3.5 text-[#ff6200]" />
                                    {label}
                                  </label>

                                  <div
                                    className={cn(
                                      "schedule-time-field flex h-[50px] items-center overflow-hidden rounded-[18px] border px-2 transition-all duration-200 focus-within:ring-4",
                                      hasScheduleFieldError(day.key, field)
                                        ? "border-[#ef4444] bg-[#fff5f5] focus-within:ring-[#ef4444]/10"
                                        : "border-[#eadbc9] bg-white hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] focus-within:ring-[#ff6200]/10",
                                    )}
                                  >
                                    <TimeSelect
                                      value={config[field]}
                                      label={label}
                                      dayLabel={day.full}
                                      onChange={(value) =>
                                        updateTime(day.key, field, value)
                                      }
                                      onCommit={(value) =>
                                        handleTimeCommit(day.key, field, value)
                                      }
                                      className="h-full w-full justify-center text-base"
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                        {Object.keys(scheduleFieldErrors).some((key) =>
                          key.startsWith(`${day.key}.`),
                        ) && (
                          <p className="mt-2 rounded-2xl border border-[#fecaca] bg-[#fff5f5] px-3 py-2 text-xs font-bold text-[#dc2626]">
                            Перевірте час: завершення має бути пізніше початку,
                            а перерва — всередині робочого часу.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            (() => {
              const weekdayLabels = DAYS.map((day) => day.label);
              const monthDays = buildStudioScheduleMonth(scheduleMonthDate);
              const currentMonthDays = monthDays.filter(
                (day) => day.isCurrentMonth,
              );
              const workingDays = currentMonthDays.filter(
                (day) => day.item.enabled,
              ).length;
              const daysOff = currentMonthDays.length - workingDays;
              const specialDays = currentMonthDays.filter(
                (day) => day.hasException,
              ).length;
              const selectedCount = selectedScheduleDates.length;
              const selectedDays = selectedScheduleDates
                .map((dateKey) =>
                  monthDays.find((day) => day.dateKey === dateKey),
                )
                .filter(Boolean);
              const selectedLabel =
                selectedCount === 1 && selectedDays[0]
                  ? getScheduleDayTitle(selectedDays[0].date)
                  : `${selectedCount} \u0434\u043d\u0456\u0432`;
              const bulkHasBreak = Boolean(
                bulkScheduleDraft.breakStart && bulkScheduleDraft.breakEnd,
              );
              const bulkDraftValid = selectedScheduleDates.every((dateKey) =>
                isExceptionValid(
                  buildBulkScheduleItem(dateKey, bulkScheduleDraft.enabled),
                ),
              );

              return (
                <div className="relative text-[#202020]">
<div className="rounded-[22px] border border-[#ebe7df] bg-[#fbfaf8] p-2.5">
  <div className="grid gap-1.5">
    <div className="grid gap-1.5 min-[640px]:grid-cols-[minmax(280px,1.25fr)_minmax(230px,1fr)] min-[640px]:items-stretch min-[1024px]:grid-cols-[minmax(320px,1.2fr)_minmax(280px,1fr)]">
      <div className="grid grid-cols-[38px_minmax(0,1fr)_38px] items-center gap-1.5">
        <button
          type="button"
          onClick={() => shiftScheduleMonth(-1)}
          className="grid h-10 place-items-center rounded-[14px] border border-[#eadbc9] bg-white text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] hover:text-[#ff6200]"
          aria-label="Попередній місяць"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>

        <button
          type="button"
          onClick={resetScheduleMonthToToday}
          className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-[14px] border border-[#eadbc9] bg-white px-3 text-center transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0]"
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-[#ff6200]" />

          <span className="truncate text-[14px] font-black capitalize tracking-[-0.02em] text-[#202020]">
            {getMonthTitle(scheduleMonthDate)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => shiftScheduleMonth(1)}
          className="grid h-10 place-items-center rounded-[14px] border border-[#eadbc9] bg-white text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] hover:text-[#ff6200]"
          aria-label="Наступний місяць"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

<div className="grid min-w-0 grid-cols-3 gap-1.5">
  <div className="flex h-10 min-w-0 flex-col items-center justify-center rounded-[14px] border border-[#eadbc9] bg-white px-1.5 text-center">
    <p className="line-clamp-2 min-w-0 text-center text-[8px] font-black uppercase leading-[8.5px] tracking-wide text-[#77716b]">
      Робочих
    </p>

    <p className="mt-0.5 text-center text-[14px] font-black leading-none text-[#41a85f]">
      {workingDays}
    </p>
  </div>

  <div className="flex h-10 min-w-0 flex-col items-center justify-center rounded-[14px] border border-[#eadbc9] bg-white px-1.5 text-center">
    <p className="line-clamp-2 min-w-0 text-center text-[8px] font-black uppercase leading-[8.5px] tracking-wide text-[#77716b]">
      Вихідних
    </p>

    <p className="mt-0.5 text-center text-[14px] font-black leading-none text-[#ff5a00]">
      {daysOff}
    </p>
  </div>

  <div className="flex h-10 min-w-0 flex-col items-center justify-center rounded-[14px] border border-[#eadbc9] bg-white px-1.5 text-center">
    <p className="line-clamp-2 min-w-0 text-center text-[8px] font-black uppercase leading-[8.5px] tracking-wide text-[#77716b]">
      Особливі дати
    </p>

    <p className="mt-0.5 text-center text-[14px] font-black leading-none text-[#ff6200]">
      {specialDays}
    </p>
  </div>
</div>
    </div>

    <div
      className={cn(
        "grid gap-1.5",
        scheduleMultiSelect
          ? "grid-cols-3"
          : "grid-cols-2",
      )}
    >
      <button
        type="button"
        onClick={() => quickSelectWorkdays(monthDays)}
        className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[14px] border border-[#eadbc9] bg-white px-2 text-[12px] font-black leading-none text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] hover:text-[#ff6200]"
      >
        <CalendarCheck className="h-4 w-4 shrink-0 text-[#ff6200]" />
        <span className="truncate">Вибрати будні</span>
      </button>

      <button
        type="button"
        onClick={() => {
          if (!scheduleMultiSelect) {
            setScheduleMultiSelect(true);
            setSelectedScheduleDates([]);
            setScheduleEditorOpen(false);
          }
        }}
        className={cn(
          "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[14px] border px-2 text-[12px] font-black leading-none transition",
          scheduleMultiSelect
            ? "border-[#ff6200] bg-[#fff1e8] text-[#ff6200]"
            : "border-[#eadbc9] bg-white text-[#202020] hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] hover:text-[#ff6200]",
        )}
      >
        <ClipboardPen className="h-4 w-4 shrink-0" />
        <span className="truncate">Множинний</span>
      </button>

      {scheduleMultiSelect && (
        <button
          type="button"
          onClick={closeScheduleSelection}
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[14px] border border-[#eadbc9] bg-white px-2 text-[12px] font-black text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] hover:text-[#ff6200]"
        >
          <X className="h-4 w-4 shrink-0" />
          <span className="truncate">Скасувати</span>
        </button>
      )}
    </div>
  </div>
</div>

                  <div className="mt-5 hidden grid-cols-7 gap-3 lg:grid">
                    {weekdayLabels.map((label, index) => {
                      const weekdayKeys = currentMonthDays
                        .filter((day) => day.weekdayIndex === index)
                        .map((day) => day.dateKey);
                      const allSelected =
                        weekdayKeys.length > 0 &&
                        weekdayKeys.every((key) =>
                          selectedScheduleDates.includes(key),
                        );

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            scheduleMultiSelect &&
                            toggleScheduleWeekday(monthDays, index)
                          }
                          className={cn(
                            "flex h-9 items-center justify-center gap-2 rounded-xl text-xs font-bold text-[#77716b]",
                            scheduleMultiSelect && "hover:bg-[#fffaf6]",
                          )}
                        >
                          {scheduleMultiSelect && (
                            <span
                              className={cn(
                                "grid h-7 w-7 place-items-center rounded-lg border transition",
                                allSelected
                                  ? "border-[#41a85f] bg-[#41a85f] text-white"
                                  : "border-[#ebe7df] bg-white text-transparent",
                              )}
                            >
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className={cn(
                      "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden",
                      scheduleMultiSelect &&
                        selectedCount > 0 &&
                        !scheduleEditorOpen
                        ? "pb-28"
                        : "pb-4 sm:pb-5",
                    )}
                  >
                    {currentMonthDays.map((day) => {
                      const item = getVisibleScheduleItemForDay(day);
                      const isSelected = selectedScheduleDates.includes(
                        day.dateKey,
                      );
                      const lines = getScheduleTimeLines(item);
                      const isDayOff = !item.enabled;

                      return (
                        <button
                          key={day.dateKey}
                          type="button"
                          onClick={() => toggleScheduleDate(day.dateKey)}
                          className={cn(
                            "flex min-h-[74px] w-full items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-left transition-all duration-200",
                            isDayOff
                              ? "border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00]"
                              : "border-[#ebe7df] bg-white text-[#202020]",
                            day.hasException &&
                              !isSelected &&
                              "shadow-[0_0_0_1px_rgba(255,98,0,0.10)]",
                            isSelected &&
                              (scheduleMultiSelect
                                ? "border-[#41a85f] shadow-[0_0_0_2px_rgba(65,168,95,0.18)]"
                                : "border-[#ff6200] shadow-[0_0_0_2px_rgba(255,98,0,0.16)]"),
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {scheduleMultiSelect && (
                              <span
                                className={cn(
                                  "grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition",
                                  isSelected
                                    ? "border-[#41a85f] bg-[#41a85f] text-white"
                                    : "border-[#ebe7df] bg-white text-transparent",
                                )}
                              >
                                <Check className="h-5 w-5" />
                              </span>
                            )}

                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "flex items-center gap-1.5 text-xs font-black capitalize",
                                  isDayOff
                                    ? "text-[#ff5a00]"
                                    : "text-[#77716b]",
                                )}
                              >
                                <CalendarDays className="h-3.5 w-3.5" />
                                {day.weekday}
                              </p>
                              <p className="mt-1 text-sm font-black">
                                {day.dayNumber}{" "}
                                {new Intl.DateTimeFormat("uk-UA", {
                                  month: "long",
                                }).format(day.date)}
                              </p>
                              {day.hasException && (
                                <p className="mt-1 text-[11px] font-black text-[#ff6200]">
                                  {
                                    "\u0406\u043d\u0434\u0438\u0432\u0456\u0434\u0443\u0430\u043b\u044c\u043d\u043e"
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          <div
                            className={cn(
                              "shrink-0 text-right text-xs font-black leading-5",
                              isDayOff ? "text-[#ff5a00]" : "text-[#202020]",
                            )}
                          >
                            {lines.map((line, lineIndex) => {
                              const LineIcon = isDayOff
                                ? XCircle
                                : lineIndex === 1
                                  ? Coffee
                                  : Clock;

                              return (
                                <p
                                  key={line}
                                  className="flex items-center justify-end gap-1.5"
                                >
                                  <LineIcon className="h-3.5 w-3.5" />
                                  {line}
                                </p>
                              );
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 hidden grid-cols-7 gap-1 lg:grid">
{monthDays.map((day) => {
  const item = getVisibleScheduleItemForDay(day);
  const isSelected = selectedScheduleDates.includes(day.dateKey);
  const lines = getScheduleTimeLines(item);
  const isDayOff = !item.enabled;

  return (
    <button
      key={day.dateKey}
      type="button"
      disabled={!day.isCurrentMonth}
      onClick={() =>
        day.isCurrentMonth && toggleScheduleDate(day.dateKey)
      }
      className={cn(
        "relative flex min-h-[88px] flex-col items-center justify-start rounded-[10px] border px-2 py-2 text-center transition-all duration-200",
        day.isCurrentMonth
          ? "hover:-translate-y-0.5 hover:border-[#ffb784]"
          : "cursor-default border-[#ebe7df] bg-transparent opacity-40",
        day.isCurrentMonth &&
          (isDayOff
            ? "border-[#ffd6bd] bg-[#fff7f0] text-[#ff5a00]"
            : "border-[#ebe7df] bg-white text-[#202020]"),
        day.hasException &&
          day.isCurrentMonth &&
          !isSelected &&
          "ring-1 ring-[#ff6200]/10",
        isSelected &&
          (scheduleMultiSelect
            ? "border-[#41a85f] bg-[#f4fbf6] shadow-[0_0_0_2px_rgba(65,168,95,0.18)]"
            : "border-[#ff6200] bg-[#fff7f0] shadow-[0_0_0_2px_rgba(255,98,0,0.18)]"),
      )}
    >
      <span
        className={cn(
          "grid h-6 min-w-6 place-items-center rounded-full px-1 text-[13px] font-black leading-none",
          day.isToday && "bg-[#ff6200] text-white",
          !day.isToday &&
            (isDayOff ? "text-[#ff5a00]" : "text-[#202020]"),
          !day.isCurrentMonth && "text-[#aaa19a]",
        )}
      >
        {day.dayNumber}
      </span>

      <div className="mt-2 w-full space-y-0.5 text-[10px] font-black leading-4">
        {lines.slice(0, 2).map((line, lineIndex) => {
          const LineIcon = isDayOff
            ? XCircle
            : lineIndex === 1
              ? Coffee
              : Clock;

          return (
<p
  key={line}
  className="flex min-w-0 items-center justify-center gap-1 max-[1180px]:gap-0"
>
  <LineIcon className="h-3 w-3 shrink-0 max-[1180px]:hidden" />
  <span className="truncate">{line}</span>
</p>
          );
        })}
      </div>

      {day.hasException && day.isCurrentMonth && (
        <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[#ff6200] text-white">
          <CalendarCheck className="h-2.5 w-2.5" />
        </span>
      )}

      {scheduleMultiSelect && day.isCurrentMonth && isSelected && (
        <span className="absolute left-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[#41a85f] text-white">
          <Check className="h-2.5 w-2.5" />
        </span>
      )}
    </button>
  );
})}
                  </div>

                  {scheduleMultiSelect &&
                    selectedCount > 0 &&
                    !scheduleEditorOpen && (
                      <div className="fixed inset-x-0 bottom-0 z-[10060] border-t border-[#ebe7df] bg-[#fbfaf8]/95 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_34px_rgba(15,23,42,0.12)] backdrop-blur sm:sticky sm:inset-x-auto sm:bottom-0 sm:mt-5 sm:rounded-[18px] sm:border sm:bg-white/95 sm:p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#41a85f] text-white">
                              <Check className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-[#202020]">
                                {"\u0412\u0438\u0431\u0440\u0430\u043d\u043e"}{" "}
                                {selectedCount} {"\u0434\u043d\u0456\u0432"}
                              </p>
                              <p className="truncate text-xs font-bold text-[#77716b]">
                                {selectedLabel}
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="primary"
                            onClick={openScheduleEditorForSelectedDates}
                            className="h-12 w-full sm:w-auto sm:px-5"
                          >
                            <Clock className="h-4 w-4" />
                            {
                              "\u0412\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u0438 \u0433\u0440\u0430\u0444\u0456\u043a"
                            }
                            <span className="hidden min-[390px]:inline">
                              {
                                "\u043d\u0430 \u0432\u0438\u0431\u0440\u0430\u043d\u0456 \u0434\u0430\u0442\u0438"
                              }
                            </span>
                          </Button>
                        </div>
                      </div>
                    )}

                  {scheduleEditorOpen && selectedCount > 0 && (
                    <div
                      className={cn(
                        "z-[10080] !bg-[#fbfaf8] text-[#202020]",
                        "max-[639px]:fixed max-[639px]:inset-0 max-[639px]:flex max-[639px]:flex-col max-[639px]:p-4",
                        "sm:sticky sm:bottom-0 sm:z-20 sm:mt-5 sm:rounded-[22px] sm:border sm:border-[#ebe7df] sm:bg-white/95 sm:p-3 sm:shadow-[0_16px_45px_rgba(15,23,42,0.12)] sm:backdrop-blur",
                      )}
                    >
                      <div className="mb-5 flex items-start justify-between gap-4 sm:hidden">
                        <div>
                          <h3 className="text-xl font-black text-[#202020]">
                            {
                              "\u0417\u043c\u0456\u043d\u0438\u0442\u0438 \u0433\u0440\u0430\u0444\u0456\u043a \u0440\u043e\u0431\u043e\u0442\u0438"
                            }
                          </h3>
                          <p className="mt-8 text-xs font-bold text-[#77716b]">
                            {selectedCount === 1
                              ? "\u041d\u0430 \u0434\u0430\u0442\u0443"
                              : "\u0412\u0438\u0431\u0440\u0430\u043d\u043e"}
                          </p>
                          <p className="mt-1 text-base font-black capitalize text-[#202020]">
                            {selectedLabel}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={closeScheduleSelection}
                          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#f2eee8] text-[#77716b] transition hover:bg-[#fff1e8] hover:text-[#ff6200]"
                          aria-label="\u0417\u0430\u043a\u0440\u0438\u0442\u0438"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="hidden items-center justify-between gap-3 border-b border-[#ebe7df] pb-3 sm:flex">
                        <div>
                          <p className="text-sm font-black text-[#202020]">
                            {selectedCount === 1
                              ? "\u041d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f \u0434\u043d\u044f"
                              : `\u0412\u0438\u0431\u0440\u0430\u043d\u043e ${selectedCount} \u0434\u043d\u0456\u0432`}
                          </p>
                          <p className="mt-0.5 text-xs font-bold capitalize text-[#77716b]">
                            {selectedLabel}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={closeScheduleSelection}
                          className="grid h-10 w-10 place-items-center rounded-xl border border-[#ebe7df] bg-white text-[#77716b] transition hover:bg-[#fffaf6] hover:text-[#ff6200]"
                          aria-label="\u0421\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438 \u0432\u0438\u0431\u0456\u0440"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex flex-1 flex-col gap-3 sm:flex-none sm:pt-3 lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
                        <div className="flex flex-col gap-3">
                          <div
                            className={cn(
                              "grid gap-2 sm:items-end",
                              bulkScheduleDraft.enabled &&
                                "sm:grid-cols-[1.35fr_0.82fr_0.82fr]",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setBulkScheduleDraft((prev) => ({
                                  ...prev,
                                  enabled: !prev.enabled,
                                }))
                              }
                              className="flex h-[50px] w-full items-center justify-between gap-3 rounded-xl border border-[#ebe7df] bg-white px-4 text-sm font-black text-[#202020] transition hover:border-[#ffd8c2] hover:bg-[#fffaf6]"
                            >
                              <span className="flex items-center gap-2">
                                {bulkScheduleDraft.enabled ? (
                                  <CalendarCheck className="h-4 w-4 shrink-0 text-[#41a85f]" />
                                ) : (
                                  <XCircle className="h-4 w-4 shrink-0 text-[#8d8177]" />
                                )}

                                <span>
                                  {bulkScheduleDraft.enabled
                                    ? "\u0420\u043e\u0431\u043e\u0447\u0438\u0439"
                                    : "\u0412\u0438\u0445\u0456\u0434\u043d\u0438\u0439"}
                                </span>
                              </span>

                              <Toggle checked={bulkScheduleDraft.enabled} />
                            </button>

                            {bulkScheduleDraft.enabled &&
                              [
                                [
                                  "start",
                                  "\u041f\u043e\u0447\u0430\u0442\u043e\u043a",
                                  Clock,
                                ],
                                [
                                  "end",
                                  "\u041a\u0456\u043d\u0435\u0446\u044c",
                                  Timer,
                                ],
                              ].map(([field, label, Icon]) => (
                                <div key={field} className="min-w-0">
                                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#77716b]">
                                    <Icon className="h-3.5 w-3.5 text-[#ff6200]" />
                                    {label}
                                  </label>

                                  <div className="schedule-time-field flex h-[52px] items-center overflow-hidden rounded-xl border border-[#ebe7df] bg-white px-2 transition hover:border-[#ffd8c2] hover:bg-[#fffaf6]">
                                    <TimeSelect
                                      value={bulkScheduleDraft[field]}
                                      label={label}
                                      dayLabel={selectedLabel}
                                      placeholder="--:--"
                                      onChange={(value) =>
                                        updateBulkScheduleField(field, value)
                                      }
                                      onCommit={(value) =>
                                        updateBulkScheduleField(field, value)
                                      }
                                      className="h-full w-full justify-center text-base"
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>

                          {bulkScheduleDraft.enabled && (
                            <div
                              className={cn(
                                "grid gap-2 sm:items-end",
                                bulkHasBreak &&
                                  "sm:grid-cols-[1.35fr_0.82fr_0.82fr]",
                              )}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  updateBulkScheduleBreak(!bulkHasBreak)
                                }
                                className="flex h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-[#ebe7df] bg-white px-4 text-sm font-black text-[#202020] transition hover:border-[#ffd8c2] hover:bg-[#fffaf6]"
                              >
                                <span className="flex items-center gap-2">
                                  <Coffee
                                    className={cn(
                                      "h-4 w-4",
                                      bulkHasBreak
                                        ? "text-[#41a85f]"
                                        : "text-[#8d8177]",
                                    )}
                                  />

                                  {bulkHasBreak
                                    ? "\u041f\u0435\u0440\u0435\u0440\u0432\u0430"
                                    : "\u0411\u0435\u0437 \u043f\u0435\u0440\u0435\u0440\u0432\u0438"}
                                </span>

                                <Toggle checked={bulkHasBreak} />
                              </button>

                              {bulkHasBreak &&
                                [
                                  [
                                    "breakStart",
                                    "\u041f\u0435\u0440\u0435\u0440\u0432\u0430 \u0437",
                                    Coffee,
                                  ],
                                  [
                                    "breakEnd",
                                    "\u041f\u0435\u0440\u0435\u0440\u0432\u0430 \u0434\u043e",
                                    Coffee,
                                  ],
                                ].map(([field, label, Icon]) => (
                                  <div key={field} className="min-w-0">
                                    <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#77716b]">
                                      <Icon className="h-3.5 w-3.5 text-[#ff6200]" />
                                      {label}
                                    </label>

                                    <div className="schedule-time-field flex h-[52px] items-center overflow-hidden rounded-xl border border-[#ebe7df] bg-white px-2 transition hover:border-[#ffd8c2] hover:bg-[#fffaf6]">
                                      <TimeSelect
                                        value={bulkScheduleDraft[field]}
                                        label={label}
                                        dayLabel={selectedLabel}
                                        placeholder="--:--"
                                        onChange={(value) =>
                                          updateBulkScheduleField(field, value)
                                        }
                                        onCommit={(value) =>
                                          updateBulkScheduleField(field, value)
                                        }
                                        className="h-full w-full justify-center text-base"
                                      />
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[#ebe7df] pt-4 sm:mt-0 sm:border-t-0 sm:pt-0 lg:self-end">
                          <Button
                            variant="primary"
                            onClick={() =>
                              applyBulkSchedule(bulkScheduleDraft.enabled)
                            }
                            disabled={bulkSaving || !bulkDraftValid}
                            className="h-[54px] w-full"
                          >
                            <Save className="h-4 w-4" />
                            {bulkSaving
                              ? "\u0417\u0431\u0435\u0440\u0456\u0433\u0430\u0454\u043c\u043e"
                              : "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438"}
                          </Button>

                          <Button
                            variant="secondary"
                            onClick={closeScheduleSelection}
                            disabled={bulkSaving}
                            className="h-[54px] w-full"
                          >
                            <X className="h-4 w-4" />
                            {
                              "\u0421\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438"
                            }
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </SectionCard>

        <SectionCard
          title="Особливі дати"
          subtitle="Задай інший графік для конкретної дати: свято, скорочений день або вихідний."
          badge={`К-ть днів: ${exceptions.length}`}
          actions={
            <Button
              onClick={openAddExceptionModal}
              variant="primary"
              className="h-11 w-full justify-center whitespace-nowrap rounded-2xl px-4 text-sm sm:w-auto"
            >
              <CalendarDays className="h-4 w-4" />
              Додати особливу дату
            </Button>
          }
        >
          {exceptionsLoading ? (
            <ExceptionsSkeleton />
          ) : exceptions.length === 0 ? (
            <div className="rounded-[24px] border-2 border-dashed border-[#ffd8c2] bg-[#fffaf6] p-6 text-center sm:p-8">
              <div className="mb-3 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <CalendarDays className="h-7 w-7 text-[#ff6200]" />
                </div>
              </div>

              <p className="text-sm font-black text-[#202020]">
                Немає особливих дат
              </p>

              <p className="mt-1 text-xs font-medium leading-5 text-[#8a847d]">
                Тут ви можете додати свята, скорочені дні або вихідні.
                <br />У ці дні студія працюватиме за окремим графіком.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleExceptions.map((item, index) => {
                const exceptionKey = getExceptionKey(item, index);
                const isExpanded =
                  item.isNew || expandedExceptions[exceptionKey] === true;
                const breakStart = getBreakStart(item);
                const breakEnd = getBreakEnd(item);
                const hasBreak = Boolean(breakStart && breakEnd);
                const isValid = isExceptionValid(item);

return (
<div
  key={exceptionKey}
  className="overflow-hidden rounded-[24px] border border-[#eadbc9] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]"
>
    <button
      type="button"
      onClick={() =>
        !item.isNew && toggleExceptionExpanded(exceptionKey)
      }
className={cn(
  "relative w-full overflow-hidden bg-white px-4 py-4 text-left transition",
  !item.isNew && "hover:bg-[#fffaf6]",
)}
    >
     <div className="absolute right-[-45px] top-[-60px] h-[120px] w-[120px] rounded-full bg-[#ff6200]/5 blur-3xl" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#fff4ec] px-2.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#ff6200]">
            <CalendarDays className="h-3.5 w-3.5" />
            Особлива дата
          </span>
            <span
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-black",
                item.enabled
                  ? "text-[#41a85f]"
                  : " text-[#c8483d]",
              )}
            >
              {item.enabled ? (
                <CalendarCheck className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}

              {item.enabled ? "Робочий" : "Вихідний"}
            </span>
          <h3 className="mt-2 text-[20px] font-black leading-none tracking-[-0.03em] text-[#202020] sm:text-[24px]">
            {item.date
              ? formatExceptionDate(item.date)
              : "Нова особлива дата"}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">


{item.enabled && (
  <span className="inline-flex min-h-7 items-center rounded-full bg-[#fbfaf8] px-2.5 py-1 text-[11px] font-bold text-[#77716b]">
    {exceptionSubtitle(item)}
  </span>
)}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!item.isNew && (
            <span className="hidden text-xs font-black uppercase tracking-wide text-[#8d8177] sm:inline">
              {isExpanded ? "Згорнути" : "Редагувати"}
            </span>
          )}

          {!item.isNew &&
            (isExpanded ? (
              <ChevronUp className="h-5 w-5 shrink-0 text-[#ff6200]" />
            ) : (
              <ChevronDown className="h-5 w-5 shrink-0 text-[#ff6200]" />
            ))}
        </div>
      </div>
    </button>

    <div
      className={cn(
        "grid transition-all duration-300 ease-out",
        isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div className="overflow-hidden">
<div className="border-t border-[#f0e7da] bg-white px-4 py-4">
  <div className="space-y-3">

            <div
              className={cn(
                "grid grid-cols-2 gap-2 sm:items-end",
                item.enabled && "sm:grid-cols-[1.35fr_0.82fr_0.82fr]",
              )}
            >
              <button
                type="button"
                onClick={() =>
                  updateException(index, "enabled", !item.enabled)
                }
                className="col-span-2 flex h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-[#eadbc9] bg-white px-4 text-sm font-black text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] sm:col-span-1"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {item.enabled ? (
                    <CalendarCheck className="h-4 w-4 shrink-0 text-[#41a85f]" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-[#8d8177]" />
                  )}

                  <span className="truncate">
                    {item.enabled ? "Робочий" : "Вихідний"}
                  </span>
                </span>

                <Toggle checked={item.enabled} />
              </button>

              {item.enabled &&
                [
                  ["start", "Початок", Clock],
                  ["end", "Кінець", Timer],
                ].map(([field, label, Icon]) => (
                  <div key={field} className="min-w-0">
                    <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#77716b]">
                      <Icon className="h-3.5 w-3.5 text-[#ff6200]" />
                      {label}
                    </label>

                    <TimeField className="schedule-time-field flex h-[52px] items-center overflow-hidden rounded-xl border border-[#eadbc9] bg-white p-0 transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0]">
                      <TimeSelect
                        value={item[field]}
                        label={label}
                        dayLabel={item.date || "Особлива дата"}
                        placeholder="--:--"
                        onChange={(value) =>
                          updateException(index, field, value)
                        }
                        onCommit={(value) =>
                          updateException(index, field, value)
                        }
                        className="h-full w-full justify-center text-base"
                      />
                    </TimeField>
                  </div>
                ))}
            </div>

            {item.enabled ? (
              <div
                className={cn(
                  "grid grid-cols-2 gap-2 sm:items-end",
                  hasBreak && "sm:grid-cols-[1.35fr_0.82fr_0.82fr]",
                )}
              >
                <button
                  type="button"
                  onClick={() => updateExceptionBreak(index, !hasBreak)}
                  className="col-span-2 flex h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-[#eadbc9] bg-white px-4 text-sm font-black text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] sm:col-span-1"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Coffee
                      className={cn(
                        "h-4 w-4 shrink-0",
                        hasBreak ? "text-[#41a85f]" : "text-[#8d8177]",
                      )}
                    />

                    <span className="truncate">
                      {hasBreak ? "Перерва" : "Без перерви"}
                    </span>
                  </span>

                  <Toggle checked={hasBreak} />
                </button>

                {hasBreak &&
                  [
                    ["breakStart", "Перерва з", Coffee],
                    ["breakEnd", "Перерва до", Coffee],
                  ].map(([field, label, Icon]) => (
                    <div key={field} className="min-w-0">
                      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#77716b]">
                        <Icon className="h-3.5 w-3.5 text-[#ff6200]" />
                        {label}
                      </label>

                      <TimeField className="schedule-time-field flex h-[52px] items-center overflow-hidden rounded-xl border border-[#eadbc9] bg-white p-0 transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0]">
                        <TimeSelect
                          value={item[field]}
                          label={label}
                          dayLabel={item.date || "Особлива дата"}
                          placeholder="--:--"
                          onChange={(value) =>
                            updateException(index, field, value)
                          }
                          onCommit={(value) =>
                            updateException(index, field, value)
                          }
                          className="h-full w-full justify-center text-base"
                        />
                      </TimeField>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-[#ffd6bd] bg-[#fff1e8] p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#ff6200] shadow-sm">
                    <XCircle className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#202020]">
                      У цей день студія не працюватиме
                    </p>

<p className="mt-1 text-xs font-semibold leading-5 text-[#77716b] max-[639px]:hidden">
  Клієнти не зможуть записатися на вибрану дату.
</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 border-t border-[#f0e7da] pt-4 sm:flex sm:justify-end">
              <Button
                onClick={() => saveException(item, index)}
                disabled={!isValid}
                variant="primary"
                className={cn(
                  "h-11 w-full rounded-2xl px-4 text-sm sm:w-auto",
                  !isValid &&
                    "cursor-not-allowed bg-[#f6f1eb] text-[#8a847d]",
                )}
              >
                <Save className="h-4 w-4" />
                Зберегти
              </Button>

              <Button
                onClick={() => removeException(item, index)}
                variant="secondary"
                className="h-11 w-full rounded-2xl px-4 text-sm sm:w-auto"
              >
                <Trash2 className="h-4 w-4 text-[#c8483d]" />
                Видалити
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
              })}

              {hasMoreExceptions && (
                <Button
                  onClick={() =>
                    setVisibleExceptionsCount((prev) =>
                      Math.min(prev + EXCEPTIONS_PAGE_SIZE, exceptions.length),
                    )
                  }
                  variant="secondary"
                  className="mt-1 h-12 w-full rounded-[18px] text-sm"
                >
                  <ChevronDown className="h-4 w-4" />
                  Показати ще{" "}
                  {Math.min(EXCEPTIONS_PAGE_SIZE, hiddenExceptionsCount)}
                </Button>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Налаштування слотів"
          subtitle="Це тривалість одного запису — крок між доступними часами."
          className="relative z-20"
          actions={
            <Button
              onClick={generateSlots}
              variant="primary"
              className="h-11 w-full justify-center rounded-2xl px-4 text-sm sm:w-auto"
            >
              <CalendarDays className="h-4 w-4" />
              Згенерувати слоти
            </Button>
          }
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <label className="block text-sm font-black text-[#202020]">
                Тривалість слота
              </label>

              <CustomSelect
                value={slotDuration}
                onChange={(val) => handleSlotDurationChange(Number(val))}
                options={[
                  { value: 10, label: "10 хв" },
                  { value: 15, label: "15 хв" },
                  { value: 30, label: "30 хв" },
                  { value: 60, label: "60 хв" },
                ]}
              />
            </div>

            <div className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#ebe7df] bg-white px-4 text-sm font-black text-[#202020] shadow-sm transition-all duration-200 hover:bg-[#fffaf6]">
              Поточний крок:{" "}
              <span className="text-[#ff6200]">{slotDuration} хв</span>
            </div>
          </div>
        </SectionCard>

        {Object.keys(preview).length > 0 && (
          <SectionCard
            title="Перевірка графіка"
            subtitle="Показуємо слоти, які будуть доступні для запису."
            badge={`Крок ${slotDuration} хв`}
          >
            <div className="space-y-5">
              {DAYS.map((day) =>
                preview[day.key] ? (
                  <div key={day.key} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-[#202020]">
                        {day.full}
                      </p>

                      <span className="text-xs font-semibold text-[#8a847d]">
                        {preview[day.key].length} слот(и)
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {preview[day.key].map((time) => (
                        <Chip key={time}>{time}</Chip>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          </SectionCard>
        )}
      </div>

      <Modal
        open={exceptionModal.open}
        title="Додати особливу дату"
        badge="Особлива дата"
        subtitle="Вкажіть дату, статус дня, години роботи та перерву для окремого графіка студії."
        onClose={closeExceptionModal}
        icon={CalendarDays}
        size="md"
        footer={
          <div className="flex flex-row gap-2 sm:justify-end">
            <Button
              variant="secondary"
              className="flex-1 sm:flex-none"
              onClick={closeExceptionModal}
            >
              <X className="h-4 w-4" />
              Скасувати
            </Button>
            <Button
              variant="primary"
              className="flex-1 sm:flex-none"
              onClick={saveExceptionFromModal}
              disabled={!isExceptionValid(exceptionModal.draft) || saving}
            >
              <Save className="h-4 w-4" />
              {saving ? "Зберігаємо..." : "Зберегти"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div
            className={cn(
              "exception-date-picker",
              "[&_label]:mb-1.5 [&_label]:flex [&_label]:items-center [&_label]:gap-1.5",
              "[&_label]:text-[10px] [&_label]:font-black [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-[#77716b]",
            )}
          >
            <DatePicker
              label={
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-[#ff6200]" />
                  Дата
                </span>
              }
              value={exceptionModal.draft.date}
              onChange={(value) => updateExceptionDraft("date", value)}
            />
          </div>

          <div
            className={cn(
              "grid grid-cols-2 gap-2 sm:items-end",
              exceptionModal.draft.enabled &&
                "sm:grid-cols-[1.35fr_0.82fr_0.82fr]",
            )}
          >
            <button
              type="button"
              onClick={() =>
                updateExceptionDraft("enabled", !exceptionModal.draft.enabled)
              }
              className="col-span-2 flex h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-[#eadbc9] bg-white px-4 text-sm font-black text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] sm:col-span-1"
            >
              <span className="flex min-w-0 items-center gap-2">
                {exceptionModal.draft.enabled ? (
                  <CalendarCheck className="h-4 w-4 shrink-0 text-[#41a85f]" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-[#8d8177]" />
                )}

                <span className="truncate">
                  {exceptionModal.draft.enabled ? "Робочий" : "Вихідний"}
                </span>
              </span>

              <Toggle checked={exceptionModal.draft.enabled} />
            </button>

            {exceptionModal.draft.enabled &&
              [
                ["start", "Початок", Clock],
                ["end", "Кінець", Timer],
              ].map(([field, label, Icon]) => (
                <div key={field} className="min-w-0">
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#77716b]">
                    <Icon className="h-3.5 w-3.5 text-[#ff6200]" />
                    {label}
                  </label>

                  <div className="schedule-time-field flex h-[52px] items-center overflow-hidden rounded-xl border border-[#eadbc9] bg-white px-2 transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0]">
                    <TimeSelect
                      value={exceptionModal.draft[field]}
                      label={label}
                      dayLabel={exceptionModal.draft.date || "Особлива дата"}
                      placeholder="--:--"
                      onChange={(value) => updateExceptionDraft(field, value)}
                      onCommit={(value) => updateExceptionDraft(field, value)}
                      className="h-full w-full justify-center text-base"
                    />
                  </div>
                </div>
              ))}
          </div>

          {exceptionModal.draft.enabled ? (
            (() => {
              const modalHasBreak = Boolean(
                getBreakStart(exceptionModal.draft) &&
                getBreakEnd(exceptionModal.draft),
              );

              return (
                <div
                  className={cn(
                    "grid grid-cols-2 gap-2 sm:items-end",
                    modalHasBreak && "sm:grid-cols-[1.35fr_0.82fr_0.82fr]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => updateExceptionDraftBreak(!modalHasBreak)}
                    className="col-span-2 flex h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-[#eadbc9] bg-white px-4 text-sm font-black text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] sm:col-span-1"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Coffee
                        className={cn(
                          "h-4 w-4 shrink-0",
                          modalHasBreak ? "text-[#41a85f]" : "text-[#8d8177]",
                        )}
                      />

                      <span className="truncate">
                        {modalHasBreak ? "Перерва" : "Без перерви"}
                      </span>
                    </span>

                    <Toggle checked={modalHasBreak} />
                  </button>

                  {modalHasBreak &&
                    [
                      ["breakStart", "Перерва з", Coffee],
                      ["breakEnd", "Перерва до", Coffee],
                    ].map(([field, label, Icon]) => (
                      <div key={field} className="min-w-0">
                        <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#77716b]">
                          <Icon className="h-3.5 w-3.5 text-[#ff6200]" />
                          {label}
                        </label>

                        <div className="schedule-time-field flex h-[52px] items-center overflow-hidden rounded-xl border border-[#eadbc9] bg-white px-2 transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0]">
                          <TimeSelect
                            value={exceptionModal.draft[field]}
                            label={label}
                            dayLabel={
                              exceptionModal.draft.date || "Особлива дата"
                            }
                            placeholder="--:--"
                            onChange={(value) =>
                              updateExceptionDraft(field, value)
                            }
                            onCommit={(value) =>
                              updateExceptionDraft(field, value)
                            }
                            className="h-full w-full justify-center text-base"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              );
            })()
          ) : (
            <div className="rounded-[22px] border border-[#ffd6bd] bg-[#fff1e8] p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#ff6200] shadow-sm">
                  <XCircle className="h-5 w-5" />
                </span>

                <div className="min-w-0">
                  <p className="text-sm font-black text-[#202020]">
                    У цей день студія не працюватиме
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-[#77716b]">
                    Клієнти не зможуть записатися на вибрану дату.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
