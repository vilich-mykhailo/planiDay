import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Sparkles,
  CalendarDays,
  Check,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  Clock3,
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
      className={cn("animate-pulse rounded-xl bg-[var(--color-cream)]", className)}
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
          className="rounded-2xl border border-[var(--color-cream)] bg-white p-4"
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
      if (!rootRef.current?.contains(e.target)) {
        setOpen(false);
      }
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

    const handleUpdate = () => {
      updateMenuPosition();
    };

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative w-full sm:w-auto", className)}>
      <button
        type="button"
        onClick={toggleOpen}
        className={cn(
          "group flex w-full min-w-[170px] items-center justify-between rounded-[18px] border px-4 py-3 text-left text-sm font-semibold outline-none transition-all duration-200",
          open
            ? "border-[var(--color-caramel)] bg-white shadow-[0_10px_30px_rgba(180,140,108,0.18)] ring-2 ring-[rgba(180,140,108,0.18)]"
            : "border-[var(--color-cream)] bg-[var(--color-cream)] hover:border-[var(--color-mist)] hover:bg-white",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate text-[var(--color-ink)]">
          {selected?.label || "Оберіть"}
        </span>

        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 text-[var(--color-caramel)] transition-all duration-200",
            "group-hover:text-[var(--color-ink)]",
            open && "rotate-180 text-[var(--color-forest)]",
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "fixed z-[200] overflow-hidden rounded-[20px] border border-[var(--color-cream)] bg-white shadow-[0_24px_70px_rgba(27,27,27,0.18)] animate-in fade-in zoom-in-95 duration-150",
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
                    "flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors",
                    isActive
                      ? "bg-[var(--color-pending-bg)] text-[var(--color-forest)]"
                      : "text-[var(--color-ink)] hover:bg-[var(--color-cream)]",
                  )}
                  role="option"
                  aria-selected={isActive}
                >
                  <span>{opt.label}</span>
                  {isActive && <Check className="h-4 w-4 flex-shrink-0" />}
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
        "group relative overflow-hidden rounded-3xl border border-[var(--color-cream)] bg-white shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-soft-hover)] transition-all duration-300",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--color-forest)] via-[var(--color-caramel)] to-[var(--color-ink)] opacity-70" />

      <div className="flex flex-col gap-3 border-b border-[var(--color-cream)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-[var(--color-ink)]">
              {title}
            </h2>

            {badge && (
              <span className="inline-flex items-center rounded-full border border-[var(--color-sand)] bg-[var(--color-pending-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-forest)]">
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="mt-0.5 text-sm text-[var(--color-caramel)]">
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
      "bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-soft)] shadow-[var(--shadow-button)]",
    secondary:
      "bg-white border border-[var(--color-cream)] text-[var(--color-ink)] hover:bg-[var(--color-cream)] hover:border-[var(--color-mist)]",
    danger:
      "border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)] hover:border-[var(--color-danger)] hover:bg-[rgba(213,92,82,0.12)]",
    ghost:
      "text-[var(--color-caramel)] hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]",
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
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
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
        "relative inline-flex h-7 w-12 items-center rounded-full ",
        checked
          ? "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]"
          : "bg-[var(--color-mist)]",
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </span>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--color-sand)] bg-[var(--color-pending-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--color-forest)] shadow-sm">
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
          className="rounded-2xl border border-[var(--color-cream)] bg-white p-4"
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
              <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[20px] border border-[var(--color-cream)] bg-white px-2.5 py-2">
                <SkeletonBlock className="h-11 w-full rounded-[14px]" />
                <div className="flex items-center justify-center">
                  <span className="block h-px w-3 bg-[var(--color-mist)]" />
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
            "relative overflow-hidden rounded-[24px] border bg-white/95 backdrop-blur-xl shadow-[0_18px_50px_rgba(27,27,27,0.16)]",
            toast.type === "success"
              ? "border-[var(--color-sand)] ring-1 ring-[var(--color-confirmed-bg)]"
              : "border-[var(--color-danger-border)] ring-1 ring-[rgba(213,92,82,0.10)]",
          )}
        >
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-1",
              toast.type === "success"
                ? "bg-gradient-to-r from-[var(--color-forest)] via-[var(--color-forest)] to-[var(--color-caramel)]"
                : "bg-gradient-to-r from-[var(--color-danger-border)] via-[var(--color-danger)] to-[var(--color-danger-dark)]",
            )}
          />

          <div className="relative flex items-start gap-3 px-4 py-4 sm:px-5">
<div
  className={cn(
    "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-[0_8px_22px_rgba(27,27,27,0.08)]",
    toast.type === "success"
      ? "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))] text-white"
      : "border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
  )}
>
  {toast.type === "success" ? (
    <Check className="h-5 w-5" />
  ) : (
    <XCircle className="h-5 w-5" />
  )}
</div>

            <div className="min-w-0 flex-1">
              <p className="mt-2 text-[15px] font-black leading-5 text-[var(--color-ink)]">
                {toast.title ||
                  (toast.type === "success" ? "Збережено" : "Помилка")}
              </p>
              <p className="mt-1 text-sm leading-5 text-[var(--color-caramel)]">
                {toast.text}
              </p>
            </div>
          </div>

          <div className="h-[3px] w-full bg-[var(--color-cream)]">
            <div
              key={toast.id}
              className={cn(
                "h-full w-full origin-left",
                toast.type === "success"
                  ? "bg-[var(--color-forest)]"
                  : "bg-[var(--color-danger)]",
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
  const toastTimeoutRef = useRef(null);
  const [expandedExceptions, setExpandedExceptions] = useState({});

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

  function setExceptionExpanded(key, value) {
    setExpandedExceptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function addExceptionRow() {
    const newItem = createEmptyException();

    setExceptions((prev) => {
      const next = sortExceptions([...prev, newItem]);
      const newIndex = next.findIndex((item) => item === newItem);
      const key = getExceptionKey(newItem, newIndex);

      setTimeout(() => {
        setExceptionExpanded(key, true);
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
  const enabledDaysCount = DAYS.filter((d) => schedule[d.key]?.enabled).length;

  return (
    <div className="min-h-screen">
      <Toast toast={toast} />

      <div className="mx-auto max-w-5xl space-y-6">
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-[var(--color-cream)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--color-forest)] via-[var(--color-caramel)] to-[var(--color-ink)] opacity-70" />

          <div className="relative">
<div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white">
    <Clock3 className="h-3 w-3" />
  </div>

  <span>Графік роботи</span>

  <div className="h-1 w-1 rounded-full bg-slate-400" />
</div>

            <h1 className="text-3xl font-black tracking-tight text-[var(--color-ink)] sm:text-4xl">
              Графік роботи
            </h1>

            <p className="mt-2 max-w-xl text-sm text-[var(--color-caramel)] sm:text-base">
              Налаштуйте робочі дні, години роботи та крок запису в зручному
              форматі.
            </p>
          </div>
        </div>

        <SectionCard
          title="Робочі дні"
          subtitle="Увімкни день і задай час початку та завершення."
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
                      "rounded-2xl border p-4 transition-all duration-300",
                      enabled
                        ? "border-[var(--color-cream)] bg-white shadow-[0_6px_18px_rgba(27,27,27,0.05)] hover:border-[var(--color-sand)]"
                        : "border-[var(--color-cream)] bg-[var(--color-cream)]",
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
      <p className="text-[15px] font-bold text-[var(--color-ink)]">
        {day.full}
      </p>
      <p className="text-xs text-[var(--color-caramel)]">
        {enabled ? "Робочий день" : "Вихідний"}
      </p>
    </div>
  </button>

 <div className={cn("w-full sm:w-[260px]", !enabled && "hidden sm:invisible")}>
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[20px] border border-[var(--color-cream)] bg-white px-2.5 py-2 shadow-[0_6px_20px_rgba(27,27,27,0.06)]">
      <div className="min-w-0">
        <div className="rounded-[14px] border border-[var(--color-cream)] bg-white transition-all duration-200 hover:bg-[var(--color-cream)]">
          <TimeSelect
            value={config.start}
            label="Початок зміни"
            dayLabel={day.full}
            onChange={(value) => updateTime(day.key, "start", value)}
            onCommit={(value) =>
              handleTimeCommit(day.key, "start", value)
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <span className="block h-px w-3 bg-[var(--color-mist)]" />
      </div>

      <div className="min-w-0">
        <div className="rounded-[14px] border border-[var(--color-cream)] bg-white transition-all duration-200 hover:bg-[var(--color-cream)]">
          <TimeSelect
            value={config.end}
            label="Кінець зміни"
            dayLabel={day.full}
            onChange={(value) => updateTime(day.key, "end", value)}
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
  onClick={addExceptionRow}
  className={cn(
    "w-full justify-center whitespace-nowrap sm:w-auto sm:shrink-0",
    "inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold text-white",
    "transition-all duration-200 active:scale-[0.98]",

    "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",

    "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]",
  )}
>
  <CalendarDays className="h-4 w-4" />
  Додати особливу дату
</Button>
  }
>
  {exceptionsLoading ? (
    <ExceptionsSkeleton />
  ) : exceptions.length === 0 ? (
<div className="rounded-2xl border-2 border-dashed border-[var(--color-caramel)]/40 bg-[var(--color-cream)] p-6 text-center sm:p-8">
  <div className="mb-3 flex items-center justify-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70">
      <CalendarDays className="h-7 w-7 text-[var(--color-caramel)]" />
    </div>
  </div>

  <p className="text-sm font-medium text-[var(--color-caramel)]">
    Немає особливих дат
  </p>

  <p className="mt-1 text-xs text-[var(--color-caramel)]/80">
    Тут ви можете додати свята, скорочені дні або вихідні. <br />
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
            className="overflow-hidden rounded-2xl border border-[var(--color-cream)] bg-white shadow-[0_6px_18px_rgba(27,27,27,0.04)]"
          >
            <button
              type="button"
              onClick={() =>
                !item.isNew && toggleExceptionExpanded(exceptionKey)
              }
              className={cn(
                "flex w-full items-start justify-between gap-3 p-4 text-left transition-colors",
                !item.isNew && "hover:bg-[var(--color-cream)]",
              )}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-bold text-[var(--color-ink)]">
                    {item.date
                      ? formatExceptionDate(item.date)
                      : "Нова особлива дата"}
                  </p>

                  <div className="rounded-full px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
                    {item.enabled ? "Особливий графік" : "Вихідний"}
                  </div>
                </div>

                <p className="mt-1 text-xs text-[var(--color-caramel)]">
                  {exceptionSubtitle(item)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {!item.isNew && (
                  <span className="hidden text-xs font-medium text-[var(--color-caramel)] sm:inline">
                    {isExpanded ? "Згорнути" : "Розгорнути"}
                  </span>
                )}

                {!item.isNew &&
                  (isExpanded ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-[var(--color-caramel)]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-[var(--color-caramel)]" />
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
                <div className="border-t border-[var(--color-cream)] px-4 pb-4 pt-4">
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

                    <div className="col-span-1 sm:col-span-1">
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-caramel)]">
                        Статус
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          updateException(index, "enabled", !item.enabled)
                        }
                        className="flex h-[50px] w-full items-center gap-3 rounded-2xl border border-[var(--color-cream)] bg-white px-4 transition-all duration-200 hover:bg-[var(--color-cream)] focus:border-[var(--color-forest)] focus:ring-4 focus:ring-[var(--color-forest)]/10"
                      >
<span
  className={cn(
    "relative inline-flex h-7 w-12 items-center rounded-full ",
    item.enabled
      ? "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]"
      : "bg-[var(--color-mist)]",
  )}
>
  <span
    className={cn(
      "inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300",
      item.enabled ? "translate-x-6" : "translate-x-1",
    )}
  />
</span>

                        <span className="whitespace-nowrap text-sm font-semibold text-[var(--color-ink)]">
                          {item.enabled ? "Робочий день" : "Вихідний"}
                        </span>
                      </button>
                    </div>

                    {item.enabled ? (
                      <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                        <div className="min-w-0">
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-caramel)]">
                            Початок
                          </label>

                          <div className="flex h-[50px] items-center overflow-hidden rounded-2xl border border-[var(--color-cream)] bg-white px-2 transition-all hover:bg-[var(--color-cream)] focus-within:ring-4 focus-within:ring-[var(--color-forest)]/10">
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
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-caramel)]">
                            Завершення
                          </label>

                          <div className="flex h-[50px] items-center overflow-hidden rounded-2xl border border-[var(--color-cream)] bg-white px-2 transition-all hover:bg-[var(--color-cream)] focus-within:ring-4 focus-within:ring-[var(--color-forest)]/10">
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
                        <div className="w-full rounded-2xl border border-[#e8b7b0] px-4 py-3 text-center text-sm font-semibold text-[#b6463f]">
                          У цей день студія не працюватиме
                        </div>
                      </div>
                    )}

<div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:col-span-2">
<Button
  onClick={() => saveException(item, index)}
  disabled={!isValid}
  className={cn(
    "w-full sm:w-auto",
    "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white",
    "transition-all duration-200 active:scale-[0.98]",

    // 👉 nude-green
    "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",

    // 👉 hover
    "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]",

    // 👉 disabled
    !isValid &&
      "cursor-not-allowed bg-[var(--color-cream)] text-[var(--color-caramel)] hover:from-[var(--color-cream)] hover:to-[var(--color-cream)]"
  )}
>
  <Check className="h-4 w-4" />
  Зберегти
</Button>

  <Button
    onClick={() => removeException(item, index)}
    className={cn(
      "w-full sm:w-auto",
      "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
    )}
  >
    <Trash2 className="h-4 w-4 text-[#b96b61]" />
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
  className={cn(
    "w-full sm:w-auto sm:shrink-0 justify-center",
    "inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold text-white",
    "transition-all duration-200 active:scale-[0.98]",

    "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",

    "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]"
  )}
>
  <CalendarDays className="h-4 w-4" />
  Згенерувати слоти
</Button>
          }
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--color-ink)]">
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

<div className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)]">
  Поточний крок: <span className="font-black">{slotDuration} хв</span>
</div>
          </div>
        </SectionCard>

        {Object.keys(preview).length > 0 && (
          <SectionCard
            title="Перевірка графіка"
            subtitle="Показуємо слоти, які будуть доступні для запису."
            badge={`Крок ${slotDuration} хв`}
            className="relative z-0"
          >
            <div className="space-y-5">
              {DAYS.map((day) =>
                preview[day.key] ? (
                  <div key={day.key} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-[var(--color-ink)]">
                        {day.full}
                      </p>

                      <span className="text-xs text-[var(--color-caramel)]">
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
            "relative overflow-hidden rounded-[28px] border border-[var(--color-sand)] bg-white/95 px-5 py-4 shadow-[0_24px_80px_rgba(27,27,27,0.18)] ring-1 ring-[var(--color-pending-bg)] backdrop-blur-xl transition-all duration-200",
            dirty
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-4 scale-[0.98] opacity-0",
          )}
        >
          <div className="pointer-events-none absolute left-4 right-4 top-0 h-1 rounded-full bg-gradient-to-r from-[var(--color-forest)] via-[var(--color-caramel)] to-[var(--color-ink)]" />
          <div className="flex items-center gap-4">
            <div className="flex min-w-0 items-center gap-3 pr-2">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-pending-bg)] shadow-[0_8px_20px_rgba(180,140,108,0.20)]">
                <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-[var(--color-caramel)] opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--color-forest)]" />
              </div>

              <div className="min-w-0">
                <p className="text-[16px] font-black leading-none text-[var(--color-ink)]">
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
  className={cn(
    "min-w-[160px]",
    "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white",
    "transition-all duration-200 active:scale-[0.98]",

    // 👉 nude-green
    "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",

    // 👉 hover
    "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]",

    // 👉 disabled
    (!dirty || saving) &&
      "cursor-not-allowed bg-[var(--color-cream)] text-[var(--color-caramel)] hover:from-[var(--color-cream)] hover:to-[var(--color-cream)]"
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
          <div className="relative overflow-hidden rounded-[26px] border border-[var(--color-sand)] bg-white/95 px-4 py-4 shadow-[0_24px_80px_rgba(27,27,27,0.18)] ring-1 ring-[var(--color-pending-bg)] backdrop-blur-xl">
            <div className="pointer-events-none absolute left-4 right-4 top-0 h-1 rounded-full bg-gradient-to-r from-[var(--color-forest)] via-[var(--color-caramel)] to-[var(--color-ink)]" />
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
  className={cn(
    "flex-1",
    "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white",
    "transition-all duration-200 active:scale-[0.98]",

    // 👉 nude-green
    "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",

    // 👉 hover
    "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]",

    // 👉 disabled
    (!dirty || saving) &&
      "cursor-not-allowed bg-[var(--color-cream)] text-[var(--color-caramel)] hover:from-[var(--color-cream)] hover:to-[var(--color-cream)]"
  )}
>
  {saving ? "Збереження..." : "Зберегти"}
</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
