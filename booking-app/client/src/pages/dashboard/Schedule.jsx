// Schedule.jsx
import { useMemo, useState, useEffect, useRef } from "react";
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

function ExceptionsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-stone-200 bg-white p-4"
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
          "group flex w-full min-w-[170px] items-center justify-between",
          "rounded-[18px] border px-4 py-3 text-left text-sm font-semibold outline-none transition-all duration-200",
          open
            ? "border-amber-400 bg-white shadow-[0_10px_30px_rgba(251,146,60,0.18)] ring-2 ring-amber-400/20"
            : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-white",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate text-stone-800">
          {selected?.label || "Оберіть"}
        </span>

        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 text-stone-400 transition-all duration-200",
            "group-hover:text-stone-600",
            open && "rotate-180 text-amber-500",
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "fixed z-[200] overflow-hidden rounded-[20px] border border-stone-200 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.18)] animate-in fade-in zoom-in-95 duration-150",
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
                      ? "bg-amber-50 text-amber-700"
                      : "text-stone-700 hover:bg-stone-50",
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

function getScheduleForDate(date, weeklySchedule, exceptions) {
  const iso = new Date(date).toISOString().slice(0, 10);

  const exact = exceptions.find((item) => item.date === iso);
  if (exact) {
    if (!exact.enabled) return null;

    return {
      enabled: true,
      start: exact.start,
      end: exact.end,
    };
  }

  const jsDay = new Date(date).getDay(); // 0 = Sun
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const key = map[jsDay];
  const fallback = weeklySchedule[key];

  if (!fallback?.enabled) return null;
  return fallback;
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
        "group relative overflow-hidden rounded-3xl border border-stone-200/60 bg-white",
        "shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)] hover:shadow-[0_8px_32px_-4px_rgba(120,90,60,0.12)]",
        "transition-all duration-300",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-60" />

      <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-stone-800">
              {title}
            </h2>

            {badge && (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>
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
      "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:shadow-emerald-500/35 hover:from-emerald-700 hover:to-emerald-800",
    secondary:
      "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300",
    danger:
      "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-600 hover:from-red-100 hover:to-rose-100",
    ghost: "text-stone-600 hover:bg-stone-100",
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
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
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
        "relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300",
        checked
          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-[0_8px_18px_rgba(16,185,129,0.28)]"
          : "bg-stone-200",
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.18)] transition-transform duration-300",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </span>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm">
      {children}
    </span>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-stone-200/60", className)}
      aria-hidden="true"
    />
  );
}

function WorkDaysSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-stone-200 bg-white p-4"
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
              <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[20px] border border-stone-200 bg-white px-2.5 py-2">
                <SkeletonBlock className="h-11 w-full rounded-[14px]" />
                <div className="flex items-center justify-center">
                  <span className="block h-px w-3 bg-stone-300" />
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
            "relative overflow-hidden rounded-[24px] border bg-white/95 backdrop-blur-xl shadow-[0_18px_50px_rgba(93,64,55,0.16)]",
            toast.type === "success"
              ? "border-emerald-200 ring-1 ring-emerald-100"
              : "border-red-200 ring-1 ring-red-100",
          )}
        >
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-1",
              toast.type === "success"
                ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600"
                : "bg-gradient-to-r from-red-300 via-red-400 to-rose-500",
            )}
          />

          <div className="relative flex items-start gap-3 px-4 py-4 sm:px-5">
            <div
              className={cn(
                "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-[0_8px_22px_rgba(93,64,55,0.10)]",
                toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                  : "border-red-200 bg-red-50 text-red-500",
              )}
            >
              {toast.type === "success" ? (
                <Check className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="mt-2 text-[15px] font-black leading-5 text-stone-800">
                {toast.title ||
                  (toast.type === "success" ? "Збережено" : "Помилка")}
              </p>
              <p className="mt-1 text-sm leading-5 text-stone-500">
                {toast.text}
              </p>
            </div>
          </div>

          <div className="h-[3px] w-full bg-stone-100">
            <div
              key={toast.id}
              className={cn(
                "h-full w-full origin-left",
                toast.type === "success" ? "bg-emerald-400" : "bg-red-400",
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

  const [toast, setToast] = useState({
    id: 0,
    open: false,
    type: "success",
    title: "",
    text: "",
    duration: 2200,
  });

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

  function showToast({ type = "success", title, text }) {
    const duration = 2200;

    setToast({
      id: Date.now(),
      open: true,
      type,
      title,
      text,
      duration,
    });

    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, duration);
  }

  const dirty = useMemo(() => {
    return (
      JSON.stringify(savedSchedule) !== JSON.stringify(schedule) ||
      savedSlotDuration !== slotDuration
    );
  }, [savedSchedule, schedule, savedSlotDuration, slotDuration]);

  async function fetchStudioSchedule(studioId) {
  if (!studioId) return null;

  const token = localStorage.getItem("token");

  return api(`/studio/${studioId}/schedule`, {
    method: "GET",
    token,
  });
}

async function fetchStudioExceptions(studioId) {
  if (!studioId) return [];

  const token = localStorage.getItem("token");

  const data = await api(`/studio/${studioId}/schedule/exceptions`, {
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

  async function deleteExpiredExceptions(studioId, token, list) {
  const expired = (list || []).filter(
    (item) => item?.id && isPastExceptionDate(item.date),
  );

  if (!expired.length) return list || [];

  await Promise.allSettled(
    expired.map((item) =>
      api(`/studio/${studioId}/schedule/exceptions/${item.id}`, {
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

 let res;

if (item.id) {
  res = await api(`/studio/${studio.id}/schedule/exceptions/${item.id}`, {
    method: "PATCH",
    token,
    body,
  });
} else {
  res = await api(`/studio/${studio.id}/schedule/exceptions`, {
    method: "POST",
    token,
    body,
  });
}

queryClient.setQueryData(
  ["studio-schedule-exceptions", studioId],
  (old = []) => {
    const exists = old.some((row) => row.id === res.exception?.id);

    if (exists) {
      return old.map((row) =>
        row.id === res.exception?.id
          ? {
              ...res.exception,
              date: String(res.exception?.date || "").slice(0, 10),
              isNew: false,
            }
          : row,
      );
    }

    return [
      ...old,
      {
        ...res.exception,
        date: String(res.exception?.date || "").slice(0, 10),
        isNew: false,
      },
    ];
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

      setExceptions((prev) => {
        const next = sortExceptions(
          prev.map((row, i) =>
            i === index
              ? {
                  ...res.exception,
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

// 🔥 ОНОВЛЕННЯ КЕШУ
queryClient.setQueryData(
  ["studio-schedule-exceptions", studioId],
  (old = []) => old.filter((row) => row.id !== item.id),
);

// твій локальний state
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [exceptionsQuery.data, studioId]);

const initialLoading =
  scheduleQuery.isLoading && !scheduleQuery.data;

const exceptionsLoading =
  exceptionsQuery.isLoading && !exceptionsQuery.data;

  
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedExceptions, setExpandedExceptions] = useState({});

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

  const enabledDaysCount = DAYS.filter((d) => schedule[d.key]?.enabled).length;

  return (
    <div className="min-h-screen ">
      <Toast toast={toast} />

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
<div className="relative mb-6 overflow-hidden rounded-3xl border border-stone-200/60 bg-white p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]">
  {/* top accent */}
  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-60" />

  <div className="relative">
    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1.5">
      <Sparkles className="h-4 w-4 text-amber-600" />
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
        Графік студії
      </span>
    </div>

    <h1 className="text-3xl font-black tracking-tight text-stone-800 sm:text-4xl">
      Графік роботи
    </h1>

    <p className="mt-2 max-w-xl text-sm text-stone-600 sm:text-base">
      Налаштуйте робочі дні, години роботи та крок запису в зручному форматі.
    </p>
  </div>
</div>

        {/* Work days */}
        <SectionCard
          title="Робочі дні"
          subtitle="Увімкни день і задай час початку та завершення."
          badge={`${enabledDaysCount} активн.`}
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
              ? "border-stone-200 bg-white shadow-[0_6px_18px_rgba(93,64,55,0.04)] hover:border-amber-200"
              : "border-stone-200/70 bg-stone-50/70",
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
                <p className="text-[15px] font-bold text-stone-800">
                  {day.full}
                </p>
                <p className="text-xs text-stone-500">
                  {enabled ? "Робочий день" : "Вихідний"}
                </p>
              </div>
            </button>

            {enabled ? (
              <div className="w-full sm:w-[260px]">
                <div
                  className={cn(
                    "grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2",
                    "rounded-[20px] border border-stone-200 bg-white",
                    "px-2.5 py-2 shadow-[0_6px_20px_rgba(120,90,60,0.06)]",
                  )}
                >
                  <div className="min-w-0">
                    <div className="rounded-[14px] border border-stone-200 bg-stone-50">
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
                    <span className="block h-px w-3 bg-stone-300" />
                  </div>

                  <div className="min-w-0">
                    <div className="rounded-[14px] border border-stone-200 bg-stone-50">
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
            ) : (
              <div className="hidden sm:block" />
            )}
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
              variant="primary"
              onClick={addExceptionRow}
              className="w-full sm:w-auto sm:shrink-0 whitespace-nowrap justify-center"
            >
              <CalendarDays className="h-4 w-4" />
              Додати дату
            </Button>
          }
        >
{exceptionsLoading ? (
  <ExceptionsSkeleton />
) : exceptions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-500">
              Ще немає особливих дат. Наприклад: Пасха 08:00–12:00 або вихідний
              на конкретну дату.
            </div>
          ) : (
            <div className="space-y-3">
              {exceptions.map((item, index) => {
                const exceptionKey = getExceptionKey(item, index);
                const isExpanded =
                  item.isNew || expandedExceptions[exceptionKey] === true;

                return (
                  <div
                    key={exceptionKey}
                    className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_6px_18px_rgba(93,64,55,0.04)] transition-all duration-300"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        !item.isNew && toggleExceptionExpanded(exceptionKey)
                      }
                      className={cn(
                        "flex w-full items-start justify-between gap-3 p-4 text-left transition-colors",
                        !item.isNew && "hover:bg-stone-50/80",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-bold text-stone-800">
                            {item.date
                              ? formatExceptionDate(item.date)
                              : "Нова особлива дата"}
                          </p>

                          <div className="rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            {item.enabled ? "Особливий графік" : "Вихідний"}
                          </div>
                        </div>

                        <p className="mt-1 text-xs text-stone-500">
                          {exceptionSubtitle(item)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!item.isNew && (
                          <span className="hidden text-xs font-medium text-stone-400 sm:inline">
                            {isExpanded ? "Згорнути" : "Розгорнути"}
                          </span>
                        )}

                        {!item.isNew &&
                          (isExpanded ? (
                            <ChevronUp className="h-5 w-5 shrink-0 text-stone-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 shrink-0 text-stone-400" />
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
                        <div className="border-t border-stone-100 px-4 pb-4 pt-4">
                          <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
                            {" "}
                            <div>
                              <DatePicker
                                label="Дата"
                                value={item.date}
                                onChange={(value) =>
                                  updateException(index, "date", value)
                                }
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
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
                                className="flex h-[50px] w-full items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 transition-all duration-200 hover:border-stone-300 hover:bg-white"
                              >
                                <div className="shrink-0">
                                  <Toggle checked={item.enabled} />
                                </div>

                                <span className="whitespace-nowrap text-sm font-semibold text-stone-700">
                                  {item.enabled ? "Робочий день" : "Вихідний"}
                                </span>
                              </button>
                            </div>
                            {item.enabled ? (
                              <div className="grid gap-2 sm:grid-cols-2">
                                <div className="min-w-0">
                                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                    Початок
                                  </label>
                                  <div className="rounded-[16px] border border-stone-200 bg-stone-50">
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
                                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                    Завершення
                                  </label>
                                  <div className="rounded-[16px] border border-stone-200 bg-stone-50">
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
                              <div className="flex items-center">
                                <div className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                                  У цей день студія не працює
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 lg:justify-end">
                              <Button
                                variant="secondary"
                                onClick={() => saveException(item, index)}
                                disabled={!item.date}
                                className="flex-1 h-[50px] lg:flex-none"
                              >
                                Зберегти
                              </Button>

                              <Button
                                variant="danger"
                                onClick={() => removeException(item, index)}
                                className="flex-1 h-[50px] lg:flex-none"
                              >
                                <Trash2 className="h-4 w-4" />
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

        {/* Slot settings */}
        <SectionCard
          title="Налаштування слотів"
          subtitle="Це тривалість одного запису — крок між доступними часами."
          className="relative z-20"
          actions={
            <Button
              variant="primary"
              onClick={generateSlots}
              className="w-full sm:w-auto sm:shrink-0 whitespace-nowrap justify-center"
            >
              <CalendarDays className="h-4 w-4" />
              Згенерувати слоти
            </Button>
          }
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700">
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

            <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
              Поточний крок:{" "}
              <span className="font-bold">{slotDuration} хв</span>
            </div>
          </div>
        </SectionCard>

        {/* Preview */}
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
                      <p className="text-sm font-bold text-stone-800">
                        {day.full}
                      </p>

                      <span className="text-xs text-stone-500">
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

      {/* Desktop save bar */}
      <div className="fixed bottom-6 left-1/2 z-[80] hidden -translate-x-1/2 md:block">
        <div
          className={cn(
            "relative overflow-hidden rounded-[28px] border border-amber-200 bg-white/95 px-5 py-4 shadow-[0_24px_80px_rgba(31,42,34,0.18)] ring-1 ring-amber-100 backdrop-blur-xl transition-all duration-200",
            dirty
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-4 scale-[0.98] opacity-0",
          )}
        >
          <div className="pointer-events-none absolute left-4 right-4 top-0 h-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
          <div className="flex items-center gap-4">
            <div className="flex min-w-0 items-center gap-3 pr-2">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 shadow-[0_8px_20px_rgba(226,154,84,0.20)]">
                <span className="absolute inline-flex h-3 w-3 rounded-full bg-orange-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-orange-500" />
              </div>

              <div className="min-w-0">
                <p className="text-[16px] font-black leading-none text-stone-800">
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
                variant="primary"
                onClick={saveAll}
                disabled={!dirty || saving}
                className="min-w-[160px]"
              >
                {saving ? "Збереження..." : "Зберегти"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile save bar */}
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
          <div className="relative overflow-hidden rounded-[26px] border border-amber-200 bg-white/95 px-4 py-4 shadow-[0_24px_80px_rgba(31,42,34,0.18)] ring-1 ring-amber-100 backdrop-blur-xl">
            <div className="pointer-events-none absolute left-4 right-4 top-0 h-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
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
                variant="primary"
                onClick={saveAll}
                disabled={!dirty || saving}
                className="flex-1"
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
