// Schedule.jsx
import { useMemo, useState, useEffect } from "react";
import TimeSelect from "../../components/TimeSelect";
import { useStudio } from "../../context/studio/useStudio";
import { api } from "../../api/http"; // або твій шлях

const DAYS = [
  { key: "mon", label: "Пн", full: "Понеділок" },
  { key: "tue", label: "Вт", full: "Вівторок" },
  { key: "wed", label: "Ср", full: "Середа" },
  { key: "thu", label: "Чт", full: "Четвер" },
  { key: "fri", label: "Пт", full: "П’ятниця" },
  { key: "sat", label: "Сб", full: "Субота" },
  { key: "sun", label: "Нд", full: "Неділя" },
];

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

function Card({ title, subtitle, children, right }) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-[#E9DED2]  shadow-[0_10px_30px_rgba(93,64,55,0.06)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#F0E7DE] px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#1F2A22]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-[#857A70]">{subtitle}</p>
          )}
        </div>
        {right}
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}

function Toggle({ checked }) {
  return (
    <span
      className={[
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
        checked ? "bg-[#86C991]" : "bg-[#E8DED4]",
      ].join(" ")}
      aria-hidden="true"
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-1",
        ].join(" ")}
      />
    </span>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#EFE5DB] bg-[#F8F4EF] px-3 py-1 text-xs font-bold text-[#7B6D61]">
      {children}
    </span>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gray-200/80 ${className}`}
      aria-hidden="true"
    />
  );
}

function ScheduleSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 bg-[#FFFDF9] pb-24 md:pb-0">
      <div className="space-y-3">
        <SkeletonBlock className="h-9 w-52 rounded-2xl" />
        <SkeletonBlock className="h-4 w-80 max-w-full" />
      </div>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
        <div className="border-b border-gray-100 px-5 py-4">
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="mt-2 h-4 w-72 max-w-full" />
        </div>

        <div className="space-y-3 px-5 py-5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="h-6 w-11 rounded-full" />
                  <div className="space-y-2">
                    <SkeletonBlock className="h-4 w-28" />
                    <SkeletonBlock className="h-3 w-20" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <SkeletonBlock className="h-12 w-[110px] rounded-2xl" />
                  <SkeletonBlock className="h-4 w-4 rounded-md" />
                  <SkeletonBlock className="h-12 w-[110px] rounded-2xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
        <div className="border-b border-gray-100 px-5 py-4">
          <SkeletonBlock className="h-5 w-44" />
          <SkeletonBlock className="mt-2 h-4 w-80 max-w-full" />
        </div>

        <div className="px-5 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-12 w-[160px] rounded-2xl" />
            </div>

            <SkeletonBlock className="h-11 w-44 rounded-2xl" />
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 md:hidden z-[60]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/95 to-transparent" />
        <div className="relative mx-auto max-w-5xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <SkeletonBlock className="h-12 w-1/2 rounded-2xl" />
            <SkeletonBlock className="h-12 w-1/2 rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="hidden md:block fixed right-6 bottom-6 z-[60]">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-10 w-36 rounded-full" />
          <SkeletonBlock className="h-12 w-32 rounded-2xl" />
          <SkeletonBlock className="h-12 w-32 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function Schedule() {
  const { studio } = useStudio();
  const [initialLoading, setInitialLoading] = useState(true);
  const storedSchedule = useMemo(() => getDefaultSchedule(), []);
  const storedSlotDuration = 0.1;

  // draft (те що редагуєш)
  const [schedule, setScheduleDraft] = useState(storedSchedule);
  const [slotDuration, setSlotDuration] = useState(storedSlotDuration);

  // baseline (останнє завантажене/збережене)
  const [savedSchedule, setSavedSchedule] = useState(storedSchedule);
  const [savedSlotDuration, setSavedSlotDuration] =
    useState(storedSlotDuration);

  const [preview, setPreview] = useState({});
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    title: "",
    text: "",
  });

  function showToast({ type = "success", title, text }) {
    setToast({ open: true, type, title, text });

    clearTimeout(showToast._t);
    const ms = type === "error" ? 4500 : 3200;

    showToast._t = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, ms);
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

      // 1) зберегли
      await api(`/studio/${studio.id}/schedule`, {
        method: "PATCH",
        token,
        body: { schedule, slotDuration },
      });

      // 2) одразу прочитали (джерело правди)
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
        title: "Збережено",
        text: "Зміни успішно оновлено.",
      });
    } catch (err) {
      console.error(err);
      showToast({
        type: "error",
        title: "Не збережено",
        text: err?.message || "Помилка.",
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

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20 md:pb-0">
      {/* Professional Toast (same as StudioSettings) */}
      <div
        className={[
          "fixed z-[90] transition-all duration-300",
          // ✅ Mobile: top-center + safe area
          "left-1/2 -translate-x-1/2 top-[calc(1rem+env(safe-area-inset-top))]",
          // ✅ md+: bottom-left
          "md:left-4 md:top-auto md:bottom-6 md:translate-x-0",
          "w-[calc(100%-2rem)] max-w-[420px] md:w-auto md:min-w-[260px] md:max-w-[340px]",
          toast.open
            ? "opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 -translate-y-2",
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        <div
          className={[
            "relative overflow-hidden rounded-[22px] border ",
            "shadow-[0_12px_30px_rgba(0,0,0,0.16)]",
            toast.type === "success" ? "border-emerald-300" : "border-red-300",
          ].join(" ")}
        >
          {/* Glow */}
          <div
            className={[
              "pointer-events-none absolute -inset-10 blur-2xl opacity-30",
              toast.type === "success" ? "bg-emerald-300" : "bg-red-300",
            ].join(" ")}
          />

          {/* Left accent */}
          <div
            className={[
              "absolute left-0 top-0 h-full w-1.5",
              toast.type === "success" ? "bg-emerald-500" : "bg-red-500",
            ].join(" ")}
          />

          <div className="relative flex items-start gap-3 p-4 pl-5">
            {/* Icon bubble */}
            <div
              className={[
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "shadow-[0_6px_14px_rgba(0,0,0,0.12)]",
                "animate-[toastPop_260ms_ease-out]",
                toast.type === "success"
                  ? "bg-emerald-600 text-white"
                  : "bg-red-600 text-white",
              ].join(" ")}
              aria-hidden="true"
            >
              {toast.type === "success" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="#ffffff"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 9v5"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 17h.01"
                    stroke="currentColor"
                    strokeWidth="3.6"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-sm font-extrabold leading-5 text-[#1F2A22]">
                {toast.title ||
                  (toast.type === "success" ? "Збережено" : "Помилка")}
              </p>
              <p className="mt-1 text-sm leading-5 text-[#6F655C]">
                {toast.text}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-[4px] w-full bg-gray-100">
            <div
              className={[
                "h-full w-full origin-left animate-[toastbar_3.2s_linear_forwards]",
                toast.type === "success" ? "bg-emerald-500" : "bg-red-500",
              ].join(" ")}
            />
          </div>
        </div>

        <style>{`
    @keyframes toastbar {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }
    @keyframes toastPop {
      0%   { transform: scale(.92); opacity: .6; }
      100% { transform: scale(1); opacity: 1; }
    }
  `}</style>
      </div>

      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#C89D72]">
            графік студії
          </p>

          <h1 className="mt-2 text-3xl font-black leading-[1.05] tracking-[-0.03em] text-[#1F2A22] sm:text-4xl">
            Графік роботи
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#857A70] sm:text-[15px]">
            Налаштуй робочі дні, години роботи та крок запису в стилі зручного
            онлайн-бронювання.
          </p>
        </div>
      </div>

      {/* schedule card */}
      <Card
        title="Робочі дні"
        subtitle="Увімкни день і задай час початку та завершення."
      >
        <div className="space-y-3">
          {DAYS.map((day) => {
            const config = schedule[day.key];
            const enabled = config.enabled;

            return (
              <div
                key={day.key}
                className={[
                  "rounded-[24px] border p-4 transition-all duration-200",
                  enabled
                    ? "border-[#E9DED2] bg-white shadow-[0_6px_18px_rgba(93,64,55,0.04)]"
                    : "border-[#EEE4DA] bg-[#FBF7F2]",
                ].join(" ")}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className="flex items-center gap-3 text-left"
                  >
                    <Toggle checked={enabled} />
                    <div className="min-w-0">
                      <p className="text-[15px] font-extrabold text-[#1F2A22]">
                        {day.full}
                      </p>
                      <p className="text-xs text-[#8B7F73]">
                        {enabled ? "Робочий день" : "Вихідний"}
                      </p>
                    </div>
                  </button>

                  {enabled ? (
<div className="flex items-center gap-2">
  <div className="flex items-center rounded-[18px] border border-[#EFE4D9] bg-white px-3 py-2 w-[220px]">
    
    <div className="flex-1 min-w-0">
      <TimeSelect
        value={config.start}
        onChange={(value) => updateTime(day.key, "start", value)}
      />
    </div>

    <span className="px-2 text-sm font-bold text-[#B7A899]">
      —
    </span>

    <div className="flex-1 min-w-0">
      <TimeSelect
        value={config.end}
        onChange={(value) => updateTime(day.key, "end", value)}
      />
    </div>

  </div>
</div>
                  ) : (
                    <div className="w-full text-sm font-semibold text-[#A29588] sm:w-auto sm:text-right">
                      Вихідний
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* slot settings */}
      <Card
        title="Налаштування слотів"
        subtitle="Це тривалість одного запису (крок між часами)."
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-2">
            <label className="text-sm font-extrabold text-gray-900 space-y-2 pr-4">
              Тривалість слота
            </label>
            <div className="relative inline-block">
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="
  peer
  w-fit min-w-[150px]
  appearance-none
  rounded-[18px]
  border border-[#E9DED2]
  
  px-4 py-3 pr-12
  text-sm font-extrabold text-[#1F2A22]
  outline-none
  transition
  hover:bg-[#FCF8F3] hover:border-[#DDCFC1]
  focus:border-[#4A5D4E] focus:ring-2 focus:ring-[#4A5D4E]/15
"
              >
                <option value={10}>10 хв</option>
                <option value={15}>15 хв</option>
                <option value={30}>30 хв</option>
                <option value={60}>60 хв</option>
              </select>

              {/* Arrow (rotates on focus = "opened") */}
              <div
                className="
  pointer-events-none
  absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center
  rounded-xl border border-[#E9DED2] bg-white text-[#8C7F73]
  transition
  peer-hover:bg-[#FCF8F3] peer-hover:border-[#DDCFC1]
  peer-focus:rotate-180 peer-focus:border-[#4A5D4E] peer-focus:text-[#1F2A22]
"
                aria-hidden="true"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={generateSlots}
            className="inline-flex items-center justify-center rounded-[18px] bg-[#4A5D4E] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(74,93,78,0.22)] transition hover:bg-[#3F5143] active:scale-[0.98]"
          >
            Згенерувати слоти
          </button>
        </div>
      </Card>

      {/* preview */}
      {Object.keys(preview).length > 0 && (
        <Card
          title="Перевірка графіка"
          subtitle="Показуємо слоти, які будуть доступні для запису."
          right={
            <span className="text-xs font-bold text-[#8B7F73]">
              Крок: {slotDuration} хв
            </span>
          }
        >
          <div className="space-y-5">
            {DAYS.map((day) =>
              preview[day.key] ? (
                <div key={day.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-extrabold text-[#1F2A22]">
                      {day.full}
                    </p>
                    <span className="text-xs text-[#8B7F73]">
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
        </Card>
      )}

      {/* Tablet + Desktop bottom-right actions (md+) */}
      <div className="hidden md:block fixed left-1/2 bottom-6 z-[60]  -translate-x-1/2">
        <div
          className={[
            "rounded-[26px] border border-[#E8DDD2] /95 backdrop-blur-md bg-white ",
            "px-5 py-4 shadow-[0_20px_60px_rgba(93,64,55,0.12)]",
            "transition-all duration-200",
            dirty
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-3 opacity-0",
          ].join(" ")}
        >
          <div className="flex items-center gap-4 ">
            <div className="min-w-0 pr-2">
              <p className="text-[16px] font-extrabold leading-none text-[#1F2A22]">
                Маєте незбережені зміни
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelChanges}
                disabled={!dirty || saving}
                className={[
                  "inline-flex items-center justify-center rounded-[16px] border px-5 py-3 text-sm font-bold transition active:scale-[0.98]",
                  dirty && !saving
                    ? "border-[#E7DED6] bg-white text-[#7A6F65] hover:bg-[#FAF7F4] hover:text-[#374151]"
                    : "cursor-not-allowed border-[#EFE7E0] bg-[#F8F5F2] text-[#B8B1AA]",
                ].join(" ")}
              >
                Скасувати
              </button>

              <button
                type="button"
                onClick={saveAll}
                disabled={!dirty || saving}
                className={[
                  "inline-flex min-w-[148px] items-center justify-center rounded-[16px] px-6 py-3 text-sm font-extrabold transition active:scale-[0.98]",
                  dirty && !saving
                    ? "bg-[#4A5D4E] text-white shadow-[0_10px_24px_rgba(74,93,78,0.24)] hover:bg-[#3F5143]"
                    : "cursor-not-allowed bg-[#BFC8C0] text-white/80",
                ].join(" ")}
              >
                {saving ? "Збереження..." : "Зберегти"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile bottom actions */}
      <div
        className={[
          "fixed inset-x-0 bottom-0 z-[60] transition-all duration-200 md:hidden",
          menuOpen || !dirty
            ? "pointer-events-none translate-y-3 opacity-0"
            : "pointer-events-auto translate-y-0 opacity-100",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#FFFDF9] via-[#FFFDF9]/95 to-transparent" />

        <div className="relative mx-auto max-w-5xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="rounded-[24px] border border-[#E8DDD2] /95 px-4 py-4 backdrop-blur-md shadow-[0_20px_60px_rgba(93,64,55,0.12)]">
            <div className="space-y-3">
              <p className="text-[15px] font-extrabold leading-tight text-[#1F2A22]">
                Маєте незбережені зміни
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelChanges}
                  disabled={!dirty || saving}
                  className={[
                    "flex-1 rounded-[16px] border px-4 py-3 text-sm font-bold transition active:scale-[0.98]",
                    dirty && !saving
                      ? "border-[#E7DED6] bg-white text-[#7A6F65] hover:bg-[#FAF7F4]"
                      : "cursor-not-allowed border-[#EFE7E0] bg-[#F8F5F2] text-[#B8B1AA]",
                  ].join(" ")}
                >
                  Скасувати
                </button>

                <button
                  type="button"
                  onClick={saveAll}
                  disabled={!dirty || saving}
                  className={[
                    "flex-1 rounded-[16px] px-4 py-3 text-sm font-extrabold transition active:scale-[0.98]",
                    dirty && !saving
                      ? "bg-[#4A5D4E] text-white shadow-[0_10px_24px_rgba(74,93,78,0.24)]"
                      : "cursor-not-allowed bg-[#BFC8C0] text-white/80",
                  ].join(" ")}
                >
                  {saving ? "Збереження..." : "Зберегти"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
