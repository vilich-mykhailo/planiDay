// Schedule.jsx
import { useMemo, useState, useEffect } from "react";
import {
  Clock,
  Sparkles,
  CalendarDays,
  Check,
  XCircle,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import TimeSelect from "../../components/TimeSelect";
import { useStudio } from "../../context/studio/useStudio";
import { api } from "../../api/http";

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
      "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:from-emerald-700 hover:to-emerald-800",
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

function ScheduleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <SkeletonBlock className="mb-3 h-8 w-44" />
        <SkeletonBlock className="mb-2 h-12 w-80" />
        <SkeletonBlock className="h-5 w-96 max-w-full" />
      </div>

      {[1, 2].map((i) => (
        <div key={i} className="rounded-3xl border border-stone-200 bg-white p-5">
          <div className="mb-4 flex justify-between">
            <div className="space-y-2">
              <SkeletonBlock className="h-6 w-40" />
              <SkeletonBlock className="h-4 w-72 max-w-full" />
            </div>
            <SkeletonBlock className="h-10 w-32 rounded-2xl" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: i === 1 ? 7 : 1 }).map((_, idx) => (
              <SkeletonBlock key={idx} className="h-20 w-full rounded-2xl" />
            ))}
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
                {toast.title || (toast.type === "success" ? "Збережено" : "Помилка")}
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

export default function Schedule() {
  const { studio } = useStudio();
  const [initialLoading, setInitialLoading] = useState(true);

  const storedSchedule = useMemo(() => getDefaultSchedule(), []);
  const storedSlotDuration = 0.1;

  const [schedule, setScheduleDraft] = useState(storedSchedule);
  const [slotDuration, setSlotDuration] = useState(storedSlotDuration);

  const [savedSchedule, setSavedSchedule] = useState(storedSchedule);
  const [savedSlotDuration, setSavedSlotDuration] =
    useState(storedSlotDuration);

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

  function toggleDay(day) {
    setScheduleDraft((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  }

  function updateTime(day, field, value) {
    setScheduleDraft((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
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
    if (!dirty || saving || !studio?.id) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      await api(`/studio/${studio.id}/schedule`, {
        method: "PATCH",
        token,
        body: { schedule, slotDuration },
      });

      const fresh = await api(`/studio/${studio.id}/schedule`, {
        method: "GET",
        token,
      });

      const nextSchedule = normalizeSchedule(fresh.schedule ?? schedule);
      const nextDuration =
        typeof fresh.slotDuration === "number" ? fresh.slotDuration : 15;

      setScheduleDraft(nextSchedule);
      setSlotDuration(nextDuration);

      setSavedSchedule(nextSchedule);
      setSavedSlotDuration(nextDuration);

      setPreview({});
      showToast({
        type: "success",
        title: "Графік оновлено",
        text: "Зміни успішно збережено.",
      });
    } catch (err) {
      console.error(err);

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

  function cancelChanges() {
    if (saving) return;
    setScheduleDraft(savedSchedule);
    setSlotDuration(savedSlotDuration);
    setPreview({});
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!studio?.id) {
        setInitialLoading(true);
        return;
      }

      try {
        const token = localStorage.getItem("token");

        const data = await api(`/studio/${studio.id}/schedule`, {
          method: "GET",
          token,
        });

        const nextSchedule = normalizeSchedule(data?.schedule);
        const nextDuration =
          typeof data?.slotDuration === "number" ? data.slotDuration : 15;

        if (!alive) return;

        setScheduleDraft(nextSchedule);
        setSlotDuration(nextDuration);

        setSavedSchedule(nextSchedule);
        setSavedSlotDuration(nextDuration);

        setPreview({});
        setInitialLoading(false);
      } catch (e) {
        console.error(e);

        if (!alive) return;

        setInitialLoading(false);
        showToast({
          type: "error",
          title: "Не вдалося завантажити",
          text: e?.message || "Помилка завантаження графіка.",
        });
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio?.id]);

  const [menuOpen, setMenuOpen] = useState(false);

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

  if (initialLoading) {
    return <ScheduleSkeleton />;
  }

  const enabledDaysCount = DAYS.filter((d) => schedule[d.key]?.enabled).length;

  return (
    <div className="min-h-screen ">
      <Toast toast={toast} />

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="mb-2">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Графік студії
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-stone-800 sm:text-5xl">
            Графік роботи
          </h1>

          <p className="mt-3 max-w-2xl text-stone-600">
            Налаштуй робочі дні, години роботи та крок запису в сучасному і
            зручному форматі.
          </p>
        </div>

        {/* Work days */}
        <SectionCard
          title="Робочі дні"
          subtitle="Увімкни день і задай час початку та завершення."
          badge={`${enabledDaysCount} активн.`}
        >
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => toggleDay(day.key)}
                      className="flex items-center gap-3 text-left"
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
                      <div className="flex items-center gap-2">
                        <div className="flex w-full items-center rounded-2xl border border-stone-200 bg-white px-3 py-2 shadow-sm sm:w-[250px]">
                          <div className="min-w-0 flex-1">
                            <TimeSelect
                              value={config.start}
                              onChange={(value) =>
                                updateTime(day.key, "start", value)
                              }
                            />
                          </div>

                          <span className="px-2 text-sm font-bold text-stone-400">
                            —
                          </span>

                          <div className="min-w-0 flex-1">
                            <TimeSelect
                              value={config.end}
                              onChange={(value) =>
                                updateTime(day.key, "end", value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full text-sm font-semibold text-stone-400 sm:w-auto sm:text-right">
                        Вихідний
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Slot settings */}
        <SectionCard
          title="Налаштування слотів"
          subtitle="Це тривалість одного запису — крок між доступними часами."
          actions={
            <Button variant="primary" onClick={generateSlots}>
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

              <div className="relative inline-block">
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                  className="w-fit min-w-[170px] appearance-none rounded-2xl border border-stone-200 bg-white px-4 py-3 pr-12 text-sm font-semibold text-stone-800 outline-none transition-all hover:border-stone-300 hover:bg-stone-50 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
                >
                  <option value={10}>10 хв</option>
                  <option value={15}>15 хв</option>
                  <option value={30}>30 хв</option>
                  <option value={60}>60 хв</option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
              </div>
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
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

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
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

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