import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function parseDate(value) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return "";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function toInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
  return (
    a?.getFullYear() === b?.getFullYear() &&
    a?.getMonth() === b?.getMonth() &&
    a?.getDate() === b?.getDate()
  );
}

function getMonthMatrix(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeekDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = 0; i < startWeekDay; i++) {
    const day = prevMonthLastDay - startWeekDay + i + 1;
    cells.push({
      date: new Date(year, month - 1, day),
      currentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      date: new Date(year, month, day),
      currentMonth: true,
    });
  }

  while (cells.length < 42) {
    const day = cells.length - (startWeekDay + daysInMonth) + 1;
    cells.push({
      date: new Date(year, month + 1, day),
      currentMonth: false,
    });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export default function DatePicker({
  value,
  onChange,
  label = "Дата",
  placeholder = "Оберіть дату",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: undefined,
    bottom: undefined,
    left: 0,
    width: 0,
  });
  const [openUp, setOpenUp] = useState(false);

  const rootRef = useRef(null);

  const selectedDate = useMemo(() => parseDate(value), [value]);
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());

  function updateMenuPosition() {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dropdownHeight = 380;
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

  function handleToggle() {
    if (!open) {
      const nextViewDate = selectedDate || new Date();
      setViewDate(nextViewDate);
      updateMenuPosition();
      setOpen(true);
      return;
    }

    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (!rootRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }

    function handleUpdate() {
      updateMenuPosition();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [open]);

  const weeks = useMemo(() => getMonthMatrix(viewDate), [viewDate]);
  const today = new Date();

  const monthLabel = new Intl.DateTimeFormat("uk-UA", {
    month: "long",
    year: "numeric",
  }).format(viewDate);

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "group flex h-[50px] w-full items-center justify-between gap-3 rounded-2xl border px-4 text-left transition-all duration-200",
          open
            ? "border-amber-400 bg-white ring-2 ring-amber-400/20 shadow-[0_12px_30px_rgba(251,146,60,0.16)]"
            : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-white",
        )}
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-stone-800">
            {value ? formatDate(value) : placeholder}
          </div>
        </div>

        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200",
            open
              ? "border-amber-200 bg-amber-50 text-amber-600"
              : "border-stone-200 bg-white text-stone-500 group-hover:text-stone-700",
          )}
        >
          <CalendarDays className="h-4 w-4" />
        </div>
      </button>

      {open && (
        <div
          className={cn(
            "fixed z-[220] overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.18)]",
            openUp ? "origin-bottom" : "origin-top",
          )}
          style={{
            top: menuPosition.top,
            bottom: menuPosition.bottom,
            left: menuPosition.left,
            width: Math.max(menuPosition.width, 280),
          }}
        >
          <div className="border-b border-stone-100 bg-gradient-to-r from-stone-50 to-orange-50/40 px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setViewDate(
                    new Date(
                      viewDate.getFullYear(),
                      viewDate.getMonth() - 1,
                      1,
                    ),
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="text-sm font-black capitalize tracking-tight text-stone-800">
                {monthLabel}
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewDate(
                    new Date(
                      viewDate.getFullYear(),
                      viewDate.getMonth() + 1,
                      1,
                    ),
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-3">
            <div className="mb-3 grid grid-cols-7 gap-1">
              {WEEK_DAYS.map((day) => (
                <div
                  key={day}
                  className="flex h-7 items-center justify-center text-xs font-bold uppercase tracking-wide text-stone-400"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map(({ date, currentMonth }) => {
                    const selected = selectedDate && isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, today);

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => {
                          onChange?.(toInputValue(date));
                          setViewDate(date);
                          setOpen(false);
                        }}
                        className={cn(
                          "relative flex h-9 items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-200",
                          selected
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_10px_24px_rgba(251,146,60,0.28)]"
                            : currentMonth
                              ? "text-stone-800 hover:bg-stone-100"
                              : "text-stone-300 hover:bg-stone-50",
                          isToday && !selected
                            ? "ring-2 ring-amber-300/60 bg-amber-50 text-amber-700"
                            : "",
                        )}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={() => onChange?.("")}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
              >
                Очистити
              </button>

              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setViewDate(now);
                  onChange?.(toInputValue(now));
                  setOpen(false);
                }}
                className="rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-2 text-sm font-bold text-amber-700 transition hover:from-amber-200 hover:to-orange-200"
              >
                Сьогодні
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}