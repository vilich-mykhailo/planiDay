import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
/* eslint-disable no-unused-vars */
import { motion, AnimatePresence } from "framer-motion";

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
    const keys = new Set(disabled.filter(Boolean).map((x) => (x instanceof Date ? toISODateKey(x) : String(x))));
    return (d) => keys.has(toISODateKey(d));
  }
  return () => false;
}

export default function Calendar({ selected, onSelect, disabled }) {
  const selectedDate = selected instanceof Date ? selected : null;
  const selectedKey = selectedDate ? toISODateKey(selectedDate) : null;

  const [navMonth, setNavMonth] = useState(() => startOfMonth(selectedDate || new Date()));
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
    setNavMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1));
  }

  function goNext() {
    setDirection(1);
    setUserTouched(true);
    setNavMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1));
  }

  function goToday() {
    const t = new Date();
    setDirection(0);
    setUserTouched(true);
    setNavMonth(startOfMonth(t));
    onSelect?.(t);
  }

  const monthKey = `${activeMonth.getFullYear()}-${activeMonth.getMonth()}`;

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  return (
    <div data-testid="calendar-container" className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-lg font-semibold text-[#2A2A2A]"
          style={{ fontFamily: "var(--font-heading)" }}
          data-testid="calendar-month-label"
        >
          {monthLabelUA(activeMonth)}
        </h3>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goPrev}
            data-testid="calendar-prev-btn"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E0DCD8] bg-white text-[#2A2A2A] hover:bg-[#F0EEEA] active:scale-95 transition-colors duration-200"
            aria-label="Попередній місяць"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={goToday}
            data-testid="calendar-today-btn"
            className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl border border-[#E0DCD8] bg-white text-[#2A2A2A] hover:bg-[#F0EEEA] active:scale-95 transition-colors duration-200"
            aria-label="Сьогодні"
            title="Сьогодні"
          >
            <CalendarDays className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={goToday}
            data-testid="calendar-today-mobile-btn"
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-[#E0DCD8] bg-white text-[#2A2A2A] hover:bg-[#F0EEEA] active:scale-95 transition-colors duration-200"
            aria-label="Сьогодні"
          >
            <CalendarDays className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={goNext}
            data-testid="calendar-next-btn"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E0DCD8] bg-white text-[#2A2A2A] hover:bg-[#F0EEEA] active:scale-95 transition-colors duration-200"
            aria-label="Наступний місяць"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-[#C8A278] py-1"
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
          className="grid grid-cols-7 gap-1"
        >
          {grid.map((cell) => {
            const { day, inMonth, disabled: dis, isToday, isSelected, key } = cell;

            if (!inMonth) {
              return <div key={key} className="h-10 sm:h-11" />;
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
                className={`
                  relative h-10 sm:h-11 w-full rounded-xl
                  text-xs sm:text-sm font-semibold
                  flex items-center justify-center
                  transition-colors duration-200
                  ${dis
                    ? "text-[#D0CCC8] cursor-not-allowed"
                    : isSelected
                    ? "bg-[#4A5D4E] text-white shadow-lg shadow-[#4A5D4E]/20"
                    : isToday
                    ? "bg-[#C8A278]/15 text-[#4A5D4E] font-bold hover:bg-[#4A5D4E]/10"
                    : "text-[#2A2A2A] hover:bg-[#4A5D4E]/8"
                  }
                `}
              >
                <span>{day.getDate()}</span>

                {isToday && !isSelected && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C8A278]" />
                )}

                {dis && inMonth && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="block w-[60%] h-px bg-[#D0CCC8] rotate-[-30deg]" />
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


