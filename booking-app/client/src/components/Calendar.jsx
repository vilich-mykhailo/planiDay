// Calendar.jsx
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function monthLabelUA(d) {
  const month = d.toLocaleDateString("uk-UA", { month: "long" });
  const year = d.getFullYear();
  return month.charAt(0).toUpperCase() + month.slice(1) + " " + year;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfCalendarGrid(d) {
  const first = startOfMonth(d);
  const day = first.getDay();
  const mondayIndex = (day + 6) % 7;
  const res = new Date(first);
  res.setDate(first.getDate() - mondayIndex);
  return res;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function normalizeDisabled(disabled) {
  if (!disabled) return () => false;
  if (typeof disabled === "function") return disabled;
  if (disabled instanceof Set) return (d) => disabled.has(toISODateKey(d));
  if (Array.isArray(disabled)) {
    const keys = new Set(
      disabled
        .filter(Boolean)
        .map((x) => (x instanceof Date ? toISODateKey(x) : String(x))),
    );
    return (d) => keys.has(toISODateKey(d));
  }
  return () => false;
}

export default function Calendar({ selected, onSelect, disabled }) {
  const selectedDate = selected instanceof Date ? selected : null;
  const selectedKey = selectedDate ? toISODateKey(selectedDate) : null;

  const [navMonth, setNavMonth] = useState(() =>
    startOfMonth(selectedDate || new Date()),
  );
  const [userTouched, setUserTouched] = useState(false);
  const [direction, setDirection] = useState(0);

  const activeMonth = useMemo(() => {
    if (!userTouched && selectedDate) return startOfMonth(selectedDate);
    return navMonth;
  }, [userTouched, selectedDate, navMonth]);

  const isDisabled = useMemo(() => normalizeDisabled(disabled), [disabled]);
  const todayKey = useMemo(() => toISODateKey(new Date()), []);

  const grid = useMemo(() => {
    const start = startOfCalendarGrid(activeMonth);

    return Array.from({ length: 42 }).map((_, i) => {
      const day = addDays(start, i);
      const key = toISODateKey(day);
      const inMonth = day.getMonth() === activeMonth.getMonth();

      return {
        day,
        key,
        inMonth,
        disabled: isDisabled(day),
        isToday: key === todayKey,
        isSelected: selectedKey ? key === selectedKey : false,
      };
    });
  }, [activeMonth, isDisabled, selectedKey, todayKey]);

  function goPrev() {
    setDirection(-1);
    setUserTouched(true);
    setNavMonth(
      new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1),
    );
  }

  function goNext() {
    setDirection(1);
    setUserTouched(true);
    setNavMonth(
      new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1),
    );
  }
  function goToday() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);

    setDirection(0);
    setUserTouched(true);
    setNavMonth(startOfMonth(t));

    if (!isDisabled(t)) {
      onSelect?.(t);
    }
  }

  const monthKey = `${activeMonth.getFullYear()}-${activeMonth.getMonth()}`;
  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  return (
    <div data-testid="calendar-container" className="select-none">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">
            Календар
          </p>
          <h3
            className="text-lg font-bold text-stone-800"
            data-testid="calendar-month-label"
          >
            {monthLabelUA(activeMonth)}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goPrev}
            data-testid="calendar-prev-btn"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 transition-all duration-200 hover:bg-stone-50 hover:text-stone-900 active:scale-95"
            aria-label="Попередній місяць"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={goToday}
            data-testid="calendar-today-btn"
            className="hidden h-10 items-center justify-center rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition-all duration-200 hover:bg-stone-50 hover:text-stone-900 active:scale-95 sm:inline-flex"
            aria-label="Сьогодні"
            title="Сьогодні"
          >
            <CalendarDays className="mr-2 h-4 w-4 text-amber-600" />
            Сьогодні
          </button>

          <button
            type="button"
            onClick={goToday}
            data-testid="calendar-today-mobile-btn"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 transition-all duration-200 hover:bg-stone-50 hover:text-stone-900 active:scale-95 sm:hidden"
            aria-label="Сьогодні"
          >
            <CalendarDays className="h-4 w-4 text-amber-600" />
          </button>

          <button
            type="button"
            onClick={goNext}
            data-testid="calendar-next-btn"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 transition-all duration-200 hover:bg-stone-50 hover:text-stone-900 active:scale-95"
            aria-label="Наступний місяць"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {weekDays.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600 sm:text-xs"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={monthKey}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="grid grid-cols-7 gap-1.5"
        >
          {grid.map((cell) => {
            const {
              day,
              inMonth,
              disabled: dis,
              isToday,
              isSelected,
              key,
            } = cell;

            if (!inMonth) {
              return <div key={key} className="h-11 sm:h-12" />;
            }

            return (
              <button
                key={key}
                type="button"
                disabled={dis}
                data-testid={`calendar-day-${key}`}
                onClick={() => {
                  if (!dis) onSelect?.(day);
                }}
                className={cn(
                  "relative flex h-11 w-full items-center justify-center rounded-2xl text-xs font-semibold transition-all duration-200 sm:h-12 sm:text-sm",
isSelected
   ? "border border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/15 shadow-[0_8px_24px_rgba(16,185,129,0.10)]"
                    : dis
                      ? "cursor-not-allowed border border-stone-200 bg-stone-100 text-stone-400"
                      : isToday
                        ? "border border-amber-300 text-stone-900 hover:bg-amber-100"
                        : "border border-transparent text-stone-800 hover:border-stone-200 hover:bg-stone-50",
                )}
              >
                <span>{day.getDate()}</span>

                {/* {isToday && !isSelected && (
                  <span className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                )} */}

                {dis && inMonth && !isToday && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="block h-px w-[60%] rotate-[-30deg] bg-stone-300" />
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
