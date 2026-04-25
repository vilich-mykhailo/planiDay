// DatePicker.jsx
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
  }, [open, selectedDate]);

  const weeks = useMemo(() => getMonthMatrix(viewDate), [viewDate]);
  const today = new Date();

  const monthLabel = new Intl.DateTimeFormat("uk-UA", {
    month: "long",
    year: "numeric",
  }).format(viewDate);

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-caramel)]">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "group flex h-[50px] w-full items-center justify-between gap-3 rounded-2xl border px-4 text-left transition-all duration-200",
          open
            ? "border-[var(--color-caramel)] bg-white ring-2 ring-[rgba(180,140,108,0.18)] shadow-[0_12px_30px_rgba(180,140,108,0.16)]"
            : "border-[var(--color-cream)] bg-[var(--color-cream)] hover:border-[var(--color-mist)] hover:bg-white",
        )}
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--color-ink)]">
            {value ? formatDate(value) : placeholder}
          </div>
        </div>

        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200",
            open
              ? "border-[var(--color-sand)] bg-[var(--color-pending-bg)] text-[var(--color-forest)]"
              : "border-[var(--color-cream)] bg-white text-[var(--color-caramel)] group-hover:text-[var(--color-ink)]",
          )}
        >
          <CalendarDays className="h-4 w-4" />
        </div>
      </button>

      {open && (
        <div
          className={cn(
            "fixed z-[220] overflow-hidden rounded-[24px] border border-[var(--color-cream)] bg-white shadow-[0_24px_70px_rgba(27,27,27,0.18)]",
            openUp ? "origin-bottom" : "origin-top",
          )}
          style={{
            top: menuPosition.top,
            bottom: menuPosition.bottom,
            left: menuPosition.left,
            width: Math.max(menuPosition.width, 280),
          }}
        >
          <div className="border border-[var(--color-cream)] bg-gradient-to-br from-white via-[var(--color-cream)] to-white px-3 py-1">
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
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-cream)] bg-white text-[var(--color-ink)] transition hover:border-[var(--color-mist)] hover:bg-[var(--color-cream)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="text-sm font-black capitalize tracking-tight text-[var(--color-ink)]">
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
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-cream)] bg-white text-[var(--color-ink)] transition hover:border-[var(--color-mist)] hover:bg-[var(--color-cream)]"
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
                  className="flex h-7 items-center justify-center text-xs font-bold uppercase tracking-wide text-[var(--color-caramel)]"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map(({ date, currentMonth }) => {
                    const selected =
                      selectedDate && isSameDay(date, selectedDate);
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
                            ? "bg-[var(--color-ink)] text-white shadow-[var(--shadow-button)]"
                            : currentMonth
                              ? "text-[var(--color-ink)] hover:bg-[var(--color-cream)]"
                              : "text-[var(--color-caramel)]/50 hover:bg-[var(--color-cream)]",
                          isToday && !selected
                            ? "bg-[var(--color-cream)] text-[var(--color-forest)]"
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


          </div>
        </div>
      )}
    </div>
  );
}
