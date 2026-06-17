// Schedule.jsx
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  X,
  Clock3,
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

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const defaultDay = (enabled = true) => ({
  enabled,
  start: "08:00",
  end: "18:00",
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
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

function minutesToTime(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
      next[d.key] = { ...base[d.key], ...incoming[d.key] };
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
    primary:
       "bg-[var(--color-primary-buttom)] text-white hover:bg-[#4a4a4a]",
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
  if (!item?.date) return "Нова особлива дата";
  if (!item.enabled) return `${formatExceptionDate(item.date)} • Вихідний`;
  return `${formatExceptionDate(item.date)} • ${item.start}–${item.end}`;
}

function createEmptyException() {
  return {
    id: "",
    date: dateToInputValue(),
    enabled: true,
    start: "08:00",
    end: "18:00",
    isNew: true,
  };
}

function Modal({
  open,
  onClose,
  title,
  badge = "Редагування",
  icon: Icon = CalendarDays,
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

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5 pb-[110px] sm:px-6 sm:pb-5">
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

  const storedSchedule = useMemo(() => getDefaultSchedule(), []);
  const storedSlotDuration = 10;

  const [schedule, setScheduleDraft] = useState(storedSchedule);
  const [slotDuration, setSlotDuration] = useState(storedSlotDuration);
  const [savedSchedule, setSavedSchedule] = useState(storedSchedule);
  const [savedSlotDuration, setSavedSlotDuration] = useState(storedSlotDuration);
  const [exceptions, setExceptions] = useState([]);
  const [preview, setPreview] = useState({});
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedExceptions, setExpandedExceptions] = useState({});
const [exceptionModal, setExceptionModal] = useState({
  open: false,
  draft: createEmptyException(),
});
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
      ? data.exceptions.map((item) => ({
          ...item,
          date: String(item?.date || "").slice(0, 10),
          isNew: false,
        }))
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

  const dirty = useMemo(() => {
    return (
      JSON.stringify(savedSchedule) !== JSON.stringify(schedule) ||
      savedSlotDuration !== slotDuration
    );
  }, [savedSchedule, schedule, savedSlotDuration, slotDuration]);

  async function handleSlotDurationChange(nextDuration) {
    if (!studioId) return;

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

      setSlotDuration(savedSlotDuration);
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

      setScheduleDraft(savedSchedule);
      queryClient.setQueryData(["studio-schedule", studioId], previous);

      showToast({
        type: "error",
        title: "Не вдалося зберегти",
        text: err?.message || "Сталася помилка під час збереження.",
      });
    }
  }

  function updateTime(day, field, value) {
    setScheduleDraft((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  async function handleTimeCommit(dayKey, field, nextValue) {
    if (!studioId) return;

    const token = localStorage.getItem("token");
    const previous = queryClient.getQueryData(["studio-schedule", studioId]);

    const nextSchedule = {
      ...schedule,
      [dayKey]: {
        ...schedule[dayKey],
        [field]: nextValue,
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
      setSavedSlotDuration(slotDuration);
      setPreview({});

      showToast({
        type: "success",
        title: "Час оновлено",
        text: "Зміни збережено в розкладі.",
      });
    } catch (err) {
      console.error(err);

      setScheduleDraft(savedSchedule);
      queryClient.setQueryData(["studio-schedule", studioId], previous);

      showToast({
        type: "error",
        title: "Не вдалося зберегти",
        text: err?.message || "Сталася помилка під час збереження.",
      });

      throw err;
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
  setExceptionModal((prev) => ({
    ...prev,
    draft: {
      ...prev.draft,
      [field]: value,
    },
  }));
}

async function saveExceptionFromModal() {
  const item = exceptionModal.draft;

  const duplicate = exceptions.find((row) => row.date === item.date);

  if (duplicate) {
    showToast({
      type: "error",
      title: "Дата вже існує",
      text: "Для цієї дати вже додано особливий графік.",
    });
    return;
  }

  setExceptions((prev) => sortExceptions([...prev, item]));

  const nextIndex = sortExceptions([...exceptions, item]).findIndex(
    (row) => row === item,
  );

  await saveException(item, nextIndex);

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

      const slots = [];
      let minutes = start;

      while (minutes + slotDuration <= end) {
        slots.push(minutesToTime(minutes));
        minutes += slotDuration;
      }

      result[day.key] = slots;
    }

    setPreview(result);
  }

  async function saveAll() {
    if (!dirty || saving || !studioId) return;

    setSaving(true);

    const token = localStorage.getItem("token");
    const previous = queryClient.getQueryData(["studio-schedule", studioId]);

    queryClient.setQueryData(["studio-schedule", studioId], (old) => ({
      ...(old || {}),
      schedule,
      slotDuration,
    }));

    try {
      await api(`/studio/${studioId}/schedule`, {
        method: "PATCH",
        token,
        body: { schedule, slotDuration },
      });

      setSavedSchedule(schedule);
      setSavedSlotDuration(slotDuration);
      setPreview({});

      showToast({
        type: "success",
        title: "Графік оновлено",
        text: "Зміни успішно збережено.",
      });
    } catch (err) {
      console.error(err);

      queryClient.setQueryData(["studio-schedule", studioId], previous);

      const rawMessage = String(err?.message || "").toLowerCase();
      const isOffline =
        !navigator.onLine ||
        rawMessage.includes("failed to fetch") ||
        rawMessage.includes("networkerror") ||
        rawMessage.includes("network error") ||
        rawMessage.includes("load failed") ||
        rawMessage.includes("fetch");

      showToast({
        type: "error",
        title: isOffline ? "Немає інтернету" : "Не вдалося зберегти",
        text: isOffline
          ? "Перевірте підключення до інтернету."
          : err?.message || "Сталася помилка під час збереження.",
      });
    } finally {
      setSaving(false);
    }
  }

  function sortExceptions(list) {
    return [...list].sort((a, b) => {
      const ad = a.date || "";
      const bd = b.date || "";
      return ad.localeCompare(bd);
    });
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
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  async function saveException(item, index) {
    if (!studio?.id) return;

    const token = localStorage.getItem("token");

    if (!item.date) {
      showToast({
        type: "error",
        title: "Не вказано дату",
        text: "Оберіть дату для особливого графіка.",
      });
      return;
    }

    if (item.enabled) {
      const startMin = timeToMinutes(item.start);
      const endMin = timeToMinutes(item.end);

      if (
        !Number.isFinite(startMin) ||
        !Number.isFinite(endMin) ||
        endMin <= startMin
      ) {
        showToast({
          type: "error",
          title: "Некоректний час",
          text: "Час завершення має бути пізніше за час початку.",
        });
        return;
      }
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
      return;
    }

    try {
      const body = {
        date: item.date,
        enabled: item.enabled,
        start: item.enabled ? item.start : null,
        end: item.enabled ? item.end : null,
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

      queryClient.setQueryData(
        ["studio-schedule-exceptions", studioId],
        (old = []) => {
          const exists = old.some((row) => row.id === res.exception?.id);
          const normalized = {
            ...res.exception,
            date: String(res.exception?.date || "").slice(0, 10),
            isNew: false,
          };

          if (exists) {
            return old.map((row) =>
              row.id === res.exception?.id ? normalized : row,
            );
          }

          return [...old, normalized];
        },
      );

      setExceptions((prev) => {
        const next = sortExceptions(
          prev.map((row, i) =>
            i === index
              ? {
                  ...res.exception,
                  date: String(res.exception?.date || "").slice(0, 10),
                  isNew: false,
                }
              : row,
          ),
        );

        const savedIndex = next.findIndex(
          (row) =>
            row.id === res.exception?.id ||
            (!row.id && row.date === res.exception?.date),
        );

        const nextKey =
          savedIndex >= 0
            ? getExceptionKey(next[savedIndex], savedIndex)
            : getExceptionKey(res.exception, index);

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
    } catch (err) {
      console.error(err);

      showToast({
        type: "error",
        title: "Не вдалося зберегти",
        text: err?.message || "Сталася помилка під час збереження.",
      });
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

  function cancelChanges() {
    if (saving) return;
    setScheduleDraft(savedSchedule);
    setSlotDuration(savedSlotDuration);
    setPreview({});
  }

  useEffect(() => {
    if (!scheduleQuery.data) return;

    const nextSchedule = normalizeSchedule(scheduleQuery.data?.schedule);
    const nextDuration =
      typeof scheduleQuery.data?.slotDuration === "number"
        ? scheduleQuery.data.slotDuration
        : 15;

    setScheduleDraft(nextSchedule);
    setSlotDuration(nextDuration);
    setSavedSchedule(nextSchedule);
    setSavedSlotDuration(nextDuration);
    setPreview({});
  }, [scheduleQuery.data]);

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

  useEffect(() => {
    const syncMenuState = () => {
      setMenuOpen(document.body.classList.contains("menu-open"));
    };

    syncMenuState();

    const observer = new MutationObserver(syncMenuState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

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
        >
          {initialLoading ? (
            <WorkDaysSkeleton />
          ) : (
            <div className="space-y-3">
              {DAYS.map((day) => {
                const config = schedule[day.key];
                const enabled = config.enabled;

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
                    <div className="grid gap-4 sm:grid-cols-[1fr_260px] sm:items-center">
                      <button
                        type="button"
                        onClick={() => toggleDay(day.key)}
                        disabled={saving}
                        className="flex items-center gap-3 text-left disabled:opacity-60"
                      >
                        <Toggle checked={enabled} />

                        <div className="min-w-0">
                          <p className="text-[15px] font-black text-[#202020]">
                            {day.full}
                          </p>

                          <p className="text-xs font-semibold text-[#8a847d]">
                            {enabled ? "Робочий день" : "Вихідний"}
                          </p>
                        </div>
                      </button>

                      <div
                        className={cn(
                          "w-full sm:w-[260px]",
                          enabled ? "block" : "hidden sm:block sm:invisible",
                        )}
                      >
                        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[22px] border border-[#ece7e1] bg-[#fcfbf9] px-2.5 py-2 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
                          <div className="min-w-0">
                            <div className="rounded-[14px] border border-[#ece7e1] bg-white transition-all duration-200 hover:bg-[#fffaf6]">
                              <TimeSelect
                                value={config.start}
                                label="Початок зміни"
                                dayLabel={day.full}
                                onChange={(value) =>
                                  updateTime(day.key, "start", value)
                                }
                                onCommit={(value) =>
                                  handleTimeCommit(day.key, "start", value)
                                }
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-center">
                            <span className="block h-px w-3 bg-[#ddd6ce]" />
                          </div>

                          <div className="min-w-0">
                            <div className="rounded-[14px] border border-[#ece7e1] bg-white transition-all duration-200 hover:bg-[#fffaf6]">
                              <TimeSelect
                                value={config.end}
                                label="Кінець зміни"
                                dayLabel={day.full}
                                onChange={(value) =>
                                  updateTime(day.key, "end", value)
                                }
                                onCommit={(value) =>
                                  handleTimeCommit(day.key, "end", value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                <br />
                У ці дні студія працюватиме за окремим графіком.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {exceptions.map((item, index) => {
                const exceptionKey = getExceptionKey(item, index);
                const isExpanded =
                  item.isNew || expandedExceptions[exceptionKey] === true;
                const isValid = Boolean(item.date);

                return (
                  <div
                    key={exceptionKey}
                    className="overflow-hidden rounded-[24px] border border-[#ebe7df] bg-white shadow-[0_8px_26px_rgba(15,23,42,0.04)]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        !item.isNew && toggleExceptionExpanded(exceptionKey)
                      }
                      className={cn(
                        "flex w-full items-start justify-between gap-3 p-4 text-left transition-colors",
                        !item.isNew && "hover:bg-[#fffaf6]",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-black text-[#202020]">
                            {item.date
                              ? formatExceptionDate(item.date)
                              : "Нова особлива дата"}
                          </p>

                          <div className="rounded-full bg-[#fff4ec] px-3 py-1 text-xs font-black text-[#ff6200]">
                            {item.enabled ? "Особливий графік" : "Вихідний"}
                          </div>
                        </div>

                        <p className="mt-1 text-xs font-medium text-[#8a847d]">
                          {exceptionSubtitle(item)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {!item.isNew && (
                          <span className="hidden text-xs font-bold text-[#8a847d] sm:inline">
                            {isExpanded ? "Згорнути" : "Розгорнути"}
                          </span>
                        )}

                        {!item.isNew &&
                          (isExpanded ? (
                            <ChevronUp className="h-5 w-5 shrink-0 text-[#ff6200]" />
                          ) : (
                            <ChevronDown className="h-5 w-5 shrink-0 text-[#ff6200]" />
                          ))}
                      </div>
                    </button>

                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-out",
                        isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="border-t border-[#f1ece5] px-4 pb-4 pt-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
                            <div className="min-w-0">
                              <DatePicker
                                label="Дата"
                                value={item.date}
                                onChange={(value) =>
                                  updateException(index, "date", value)
                                }
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#8a847d]">
                                Статус
                              </label>

                              <button
                                type="button"
                                onClick={() =>
                                  updateException(
                                    index,
                                    "enabled",
                                    !item.enabled,
                                  )
                                }
                                className="flex h-[50px] w-full items-center gap-3 rounded-2xl border border-[#ebe7df] bg-white px-4 transition-all duration-200 hover:bg-[#fffaf6] focus:border-[#ff6200] focus:ring-4 focus:ring-[#ff6200]/10"
                              >
                                <Toggle checked={item.enabled} />

                                <span className="whitespace-nowrap text-sm font-black text-[#202020]">
                                  {item.enabled ? "Робочий день" : "Вихідний"}
                                </span>
                              </button>
                            </div>

                            {item.enabled ? (
                              <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                                <div className="min-w-0">
                                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#8a847d]">
                                    Початок
                                  </label>

                                  <div className="flex h-[50px] items-center overflow-hidden rounded-2xl border border-[#ebe7df] bg-white px-2 transition-all hover:bg-[#fffaf6] focus-within:ring-4 focus-within:ring-[#ff6200]/10">
                                    <TimeSelect
                                      value={item.start}
                                      label="Початок"
                                      dayLabel={item.date || "Особлива дата"}
                                      onChange={(value) =>
                                        updateException(index, "start", value)
                                      }
                                      onCommit={(value) =>
                                        updateException(index, "start", value)
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="min-w-0">
                                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#8a847d]">
                                    Завершення
                                  </label>

                                  <div className="flex h-[50px] items-center overflow-hidden rounded-2xl border border-[#ebe7df] bg-white px-2 transition-all hover:bg-[#fffaf6] focus-within:ring-4 focus-within:ring-[#ff6200]/10">
                                    <TimeSelect
                                      value={item.end}
                                      label="Завершення"
                                      dayLabel={item.date || "Особлива дата"}
                                      onChange={(value) =>
                                        updateException(index, "end", value)
                                      }
                                      onCommit={(value) =>
                                        updateException(index, "end", value)
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center sm:col-span-2">
                                <div className="w-full rounded-2xl border border-[#f0b8b0] bg-[#fff4f2] px-4 py-3 text-center text-sm font-bold text-[#c8483d]">
                                  У цей день студія не працюватиме
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:flex sm:justify-end">
                              <Button
                                onClick={() => saveException(item, index)}
                                disabled={!isValid}
                                variant="primary"
                                className={cn(
                                  "h-11 w-full rounded-2xl px-4 text-sm sm:w-auto",
                                  !isValid &&
                                    "cursor-not-allowed bg-[#f6f1eb] text-[#8a847d] hover:from-[#f6f1eb] hover:to-[#f6f1eb]",
                                )}
                              >
                                <Check className="h-4 w-4" />
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

      <div className="fixed bottom-6 left-1/2 z-[80] hidden -translate-x-1/2 md:block">
        <div
          className={cn(
            "relative overflow-hidden rounded-[30px] border border-[#ffe1cf] bg-white/95 px-5 py-4 shadow-[0_24px_80px_rgba(15,23,42,0.18)] ring-1 ring-[#fff0e6] backdrop-blur-xl transition-all duration-200",
            dirty
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-4 scale-[0.98] opacity-0",
          )}
        >
          <div className="pointer-events-none absolute left-4 right-4 top-0 h-1 rounded-full bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

          <div className="flex items-center gap-4">
            <div className="flex min-w-0 items-center gap-3 pr-2">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff4ec] shadow-[0_8px_20px_rgba(255,98,0,0.14)]">
                <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-[#ff6200] opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#ff6200]" />
              </div>

              <div className="min-w-0">
                <p className="text-[16px] font-black leading-none text-[#202020]">
                  Маєте незбережені зміни
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={cancelChanges}
                disabled={!dirty || saving}
              >
                <RefreshCw className="h-4 w-4" />
                Скасувати
              </Button>

              <Button
                onClick={saveAll}
                disabled={!dirty || saving}
                variant="primary"
                className={cn(
                  "h-11 min-w-[160px] rounded-2xl px-4 text-sm",
                  (!dirty || saving) &&
                    "cursor-not-allowed bg-[#f6f1eb] text-[#8a847d] hover:from-[#f6f1eb] hover:to-[#f6f1eb]",
                )}
              >
                {saving ? "Збереження..." : "Зберегти"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[80] transition-all duration-300 md:hidden",
          menuOpen || !dirty
            ? "pointer-events-none translate-y-4 opacity-0"
            : "pointer-events-auto translate-y-0 opacity-100",
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/95 to-transparent" />

        <div className="relative mx-auto max-w-5xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="relative overflow-hidden rounded-[26px] border border-[#ffe1cf] bg-white/95 px-4 py-4 shadow-[0_24px_80px_rgba(15,23,42,0.18)] ring-1 ring-[#fff0e6] backdrop-blur-xl">
            <div className="pointer-events-none absolute left-4 right-4 top-0 h-1 rounded-full bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={cancelChanges}
                disabled={!dirty || saving}
                className="flex-1"
              >
                Скасувати
              </Button>

              <Button
                onClick={saveAll}
                disabled={!dirty || saving}
                variant="primary"
                className={cn(
                  "h-11 flex-1 rounded-2xl px-4 text-sm",
                  (!dirty || saving) &&
                    "cursor-not-allowed bg-[#f6f1eb] text-[#8a847d] hover:from-[#f6f1eb] hover:to-[#f6f1eb]",
                )}
              >
                {saving ? "Збереження..." : "Зберегти"}
              </Button>
            </div>
          </div>
        </div>
        
      </div>
<Modal
  open={exceptionModal.open}
  title="Додати особливу дату"
  onClose={closeExceptionModal}
  icon={CalendarDays}
  footer={
    <div className="flex flex-row gap-2 sm:justify-end">
      <Button
        variant="secondary"
        className="flex-1 sm:flex-none"
        onClick={closeExceptionModal}
      >
        Скасувати
      </Button>

      <Button
        variant="primary"
        className="flex-1 sm:flex-none"
        onClick={saveExceptionFromModal}
        disabled={!exceptionModal.draft.date || saving}
      >
        {saving ? "Завантаження..." : "Зберегти"}
      </Button>
    </div>
  }
>
  <div className="grid gap-4">
    <DatePicker
      label="Дата"
      value={exceptionModal.draft.date}
      onChange={(value) => updateExceptionDraft("date", value)}
    />

    <div>
      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#8a847d]">
        Статус
      </label>

      <button
        type="button"
        onClick={() =>
          updateExceptionDraft("enabled", !exceptionModal.draft.enabled)
        }
        className="flex h-[50px] w-full items-center gap-3 rounded-2xl border border-[#ebe7df] bg-white px-4 transition hover:bg-[#fffaf6]"
      >
        <Toggle checked={exceptionModal.draft.enabled} />

        <span className="text-sm font-black text-[#202020]">
          {exceptionModal.draft.enabled ? "Робочий день" : "Вихідний"}
        </span>
      </button>
    </div>

    {exceptionModal.draft.enabled ? (
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#8a847d]">
            Початок
          </label>

          <div className="flex h-[50px] items-center overflow-hidden rounded-2xl border border-[#ebe7df] bg-white px-2">
            <TimeSelect
              value={exceptionModal.draft.start}
              label="Початок"
              dayLabel={exceptionModal.draft.date || "Особлива дата"}
              onChange={(value) => updateExceptionDraft("start", value)}
              onCommit={(value) => updateExceptionDraft("start", value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#8a847d]">
            Завершення
          </label>

          <div className="flex h-[50px] items-center overflow-hidden rounded-2xl border border-[#ebe7df] bg-white px-2">
            <TimeSelect
              value={exceptionModal.draft.end}
              label="Завершення"
              dayLabel={exceptionModal.draft.date || "Особлива дата"}
              onChange={(value) => updateExceptionDraft("end", value)}
              onCommit={(value) => updateExceptionDraft("end", value)}
            />
          </div>
        </div>
      </div>
    ) : (
      <div className="rounded-2xl border border-[#f0b8b0] bg-[#fff4f2] px-4 py-3 text-center text-sm font-bold text-[#c8483d]">
        У цей день студія не працюватиме
      </div>
    )}
  </div>
</Modal>
    </div>
  );
}