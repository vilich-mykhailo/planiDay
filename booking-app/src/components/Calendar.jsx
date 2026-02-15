import { useMemo, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODateKey(d) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function monthKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`; // YYYY-MM
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
  // week starts Monday
  const first = startOfMonth(d);
  const day = first.getDay(); // 0..6 Sun..Sat
  const mondayIndex = (day + 6) % 7; // Monday=0
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

  if (disabled instanceof Set) {
    return (d) => disabled.has(toISODateKey(d));
  }

  if (Array.isArray(disabled)) {
    const hasDates = disabled.some((x) => x instanceof Date);
    if (hasDates) {
      const keys = new Set(disabled.filter(Boolean).map((x) => toISODateKey(x)));
      return (d) => keys.has(toISODateKey(d));
    }

    const keys = new Set(disabled.filter(Boolean).map(String));
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
      const dis = isDisabled(day);


      return {
        day,
        key,
        inMonth,
        disabled: dis,
        isToday: key === todayKey,
        isSelected: selectedKey ? key === selectedKey : false,
      };
    });
  }, [activeMonth, isDisabled, selectedKey, todayKey]);

  function goPrev() {
    setUserTouched(true);
    setNavMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1));
  }

  function goNext() {
    setUserTouched(true);
    setNavMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1));
  }

function goToday() {
  const t = new Date();
  setUserTouched(true);
  setNavMonth(startOfMonth(t));
  onSelect?.(t); // вибрати сьогодні
}


  const activeMonthKey = monthKey(activeMonth);
  const selectedMonthKey = selectedDate ? monthKey(selectedDate) : null;

  return (
    <div className="">
      {/* Header */}
      <div className="relative flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-base sm:text-xl font-semibold text-gray-900">
            {monthLabelUA(activeMonth)}
          </h2>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white p-2 sm:px-3 sm:py-2 text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
            aria-label="Попередній місяць"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* На телефоні коротко, на десктопі повний текст */}
          <button
            type="button"
            onClick={goToday}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-[0.98] hidden sm:inline-flex"
          >
            Сьогодні
          </button>

          <button
            type="button"
            onClick={goToday}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white p-2 text-gray-900 hover:bg-gray-50 active:scale-[0.98] sm:hidden"
            aria-label="Сьогодні"
            title="Сьогодні"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M8 7V5m8 2V5M6 10h12M7 8h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={goNext}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white p-2 sm:px-3 sm:py-2 text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
            aria-label="Наступний місяць"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Week days */}
      <div className="mt-3 sm:mt-4 grid grid-cols-7 gap-1 sm:gap-2 text-[11px] sm:text-xs font-semibold text-gray-500">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((x) => (
          <div key={x} className="px-1 text-center">
            {x}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
        {grid.map((cell) => {
          const { day, inMonth, disabled: dis, isToday, isSelected, key } = cell;

          if (!inMonth) {
            return (
  <button
    key={key}
    type="button"
    disabled
    className={`
      h-10 sm:h-12 md:h-11 lg:h-12 w-full
      rounded-2xl border border-transparent
      ${inMonth ? "" : "opacity-0 pointer-events-none"}
    `}
  >
    {inMonth ? day.getDate() : ""}
  </button>
);

          }

          return (
<button
  key={key}
  type="button"
  disabled={dis}
  onClick={() => {
    if (dis) return;
    onSelect?.(day);

    if (selectedMonthKey && selectedMonthKey !== activeMonthKey) {
      setUserTouched(true);
      setNavMonth(startOfMonth(day));
    }
  }}
className={`
  relative flex items-center justify-center
text-xs sm:text-sm font-semibold
  h-10 sm:h-12 md:h-11 lg:h-12
  w-full

  rounded-2xl border
  transition-all duration-200

  ${!inMonth ? "opacity-0 pointer-events-none border-transparent" : ""}

  ${
    dis
      ? "cursor-not-allowed border-gray-100 bg-white text-gray-300"
      : isSelected
      ? "cursor-pointer !border-black !bg-black !text-white shadow-md"
      : "cursor-pointer bg-gray-100 border-gray-400 text-black hover:bg-black hover:border-black hover:text-white"
  }

    ${isToday ? "ring-2 ring-black/10" : ""}
  `}
>
  {/* число */}
<span>
  {day.getDate()}
</span>


  {/* перекреслення всієї клітинки */}
  {dis && (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="block w-[80%] border-t border-gray-300 rotate-[-35deg]
" />
    </span>
  )}

  {/* today dot */}
  {isToday && !isSelected && (
    <span className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 h-1 w-1 rounded-full bg-black/60" />
  )}
</button>

          );
        })}
      </div>
    </div>
  );
}
