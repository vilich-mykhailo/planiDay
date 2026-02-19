import { useEffect, useMemo, useState } from "react";

/**
 * StaffSchedule.jsx
 * - add employees
 * - set hourly rate
 * - plan shifts per day (start/end) for selected month
 * - calculates hours + salary per person
 * - persists in localStorage
 */

const STORAGE_KEY = "planiday_staff_schedule_v1";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function daysInMonth(date) {
  return endOfMonth(date).getDate();
}

// Monday-first weekday index: Mon=0..Sun=6
function weekdayMonFirst(date) {
  const js = date.getDay(); // Sun=0..Sat=6
  return (js + 6) % 7;
}

function parseTimeToMinutes(str) {
  // "HH:MM"
  if (!str || typeof str !== "string") return null;
  const [h, m] = str.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function calcShiftMinutes(startStr, endStr) {
  const s = parseTimeToMinutes(startStr);
  const e = parseTimeToMinutes(endStr);
  if (s == null || e == null) return 0;
  // allow overnight (e.g., 22:00 - 02:00)
  if (e < s) return 24 * 60 - s + e;
  return e - s;
}

function formatMoney(amount) {
  // simple UI formatting (PLN/UAH etc — you can change later)
  if (!Number.isFinite(amount)) return "0";
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function IconPlus() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 3h6m-9 4h12m-2 0-1 14H9L8 7"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.35)] overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-gray-900 truncate">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
            aria-label="Close"
            title="Закрити"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6l-12 12"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5">{children}</div>

        {footer && (
          <div className="px-5 py-4 border-t border-gray-100">{footer}</div>
        )}
      </div>
    </div>
  );
}

export default function StaffSchedule() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {
          employees: [],
          shifts: {}, // key: `${employeeId}__${YYYY-MM-DD}` -> { start, end }
        };
      }
      return JSON.parse(raw);
    } catch {
      return { employees: [], shifts: {} };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data]);

  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [activeEmployeeId, setActiveEmployeeId] = useState(
    () => data.employees?.[0]?.id || "",
  );

  // Add employee modal
  const [addOpen, setAddOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: "", role: "", rate: "" });

  function addEmployee() {
    const name = newEmp.name.trim();
    if (!name) return;

    const rateNum = Number(String(newEmp.rate).replace(",", "."));
    const employee = {
      id: uid(),
      name,
      role: newEmp.role.trim(),
      rate: Number.isFinite(rateNum) ? rateNum : 0,
    };

    setData((prev) => ({ ...prev, employees: [employee, ...prev.employees] }));
    setActiveEmployeeId(employee.id);
    setNewEmp({ name: "", role: "", rate: "" });
    setAddOpen(false);
  }

  function removeEmployee(empId) {
    setData((prev) => {
      const nextEmployees = prev.employees.filter((e) => e.id !== empId);
      const nextShifts = { ...prev.shifts };
      Object.keys(nextShifts).forEach((k) => {
        if (k.startsWith(empId + "__")) delete nextShifts[k];
      });
      return { employees: nextEmployees, shifts: nextShifts };
    });

    setActiveEmployeeId((curr) => {
      if (curr !== empId) return curr;
      const left = data.employees.filter((e) => e.id !== empId);
      return left[0]?.id || "";
    });
  }

  function updateEmployee(empId, patch) {
    setData((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === empId ? { ...e, ...patch } : e,
      ),
    }));
  }

  // Calendar grid
  const monthMeta = useMemo(() => {
    const first = startOfMonth(monthDate);
    const totalDays = daysInMonth(monthDate);
    const startOffset = weekdayMonFirst(first); // 0..6
    return { first, totalDays, startOffset };
  }, [monthDate]);

  const datesGrid = useMemo(() => {
    const { totalDays, startOffset } = monthMeta;

    const cells = [];
    // leading blanks
    for (let i = 0; i < startOffset; i++) cells.push(null);

    // month days
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
      cells.push(date);
    }

    // trailing blanks to complete weeks (optional)
    while (cells.length % 7 !== 0) cells.push(null);

    // chunk by weeks
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, [monthDate, monthMeta]);

  const activeEmployee = useMemo(
    () => data.employees.find((e) => e.id === activeEmployeeId) || null,
    [data.employees, activeEmployeeId],
  );

  function shiftKey(empId, iso) {
    return `${empId}__${iso}`;
  }

  // Shift editor modal
  const [edit, setEdit] = useState({
    open: false,
    iso: "",
    start: "09:00",
    end: "18:00",
  });

  function openShiftEditor(dateObj) {
    if (!activeEmployee) return;
    const iso = toISODate(dateObj);
    const existing = data.shifts[shiftKey(activeEmployee.id, iso)];
    setEdit({
      open: true,
      iso,
      start: existing?.start || "09:00",
      end: existing?.end || "18:00",
    });
  }

  function saveShift() {
    if (!activeEmployee) return;

    const minutes = calcShiftMinutes(edit.start, edit.end);
    // if user enters invalid => minutes=0. allow clearing shift.
    setData((prev) => {
      const key = shiftKey(activeEmployee.id, edit.iso);
      const next = { ...prev.shifts };

      // if 0 minutes => remove shift (clean UX)
      if (!minutes) {
        delete next[key];
        return { ...prev, shifts: next };
      }

      next[key] = { start: edit.start, end: edit.end };
      return { ...prev, shifts: next };
    });

    setEdit((p) => ({ ...p, open: false }));
  }

  function clearShift() {
    if (!activeEmployee) return;
    setData((prev) => {
      const next = { ...prev.shifts };
      delete next[shiftKey(activeEmployee.id, edit.iso)];
      return { ...prev, shifts: next };
    });
    setEdit((p) => ({ ...p, open: false }));
  }

  const monthSummary = useMemo(() => {
    // calculates per employee: minutes + salary for current month
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const map = new Map(); // empId -> { minutes, salary }

    for (const emp of data.employees) {
      map.set(emp.id, { minutes: 0, salary: 0 });
    }

    // iterate shifts keys
    for (const [key, value] of Object.entries(data.shifts || {})) {
      const [empId, iso] = key.split("__");
      if (!empId || !iso) continue;

      const d = new Date(iso + "T00:00:00");
      if (d < start || d > end) continue;

      const minutes = calcShiftMinutes(value?.start, value?.end);
      const emp = data.employees.find((e) => e.id === empId);
      if (!emp) continue;

      const rec = map.get(empId);
      if (!rec) continue;
      rec.minutes += minutes;
      rec.salary += (minutes / 60) * (Number(emp.rate) || 0);
    }

    return map;
  }, [data.employees, data.shifts, monthDate]);

  const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  function prevMonth() {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const headerTitle = useMemo(() => {
    const fmt = monthDate.toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    });
    // capitalize first letter
    return fmt.charAt(0).toUpperCase() + fmt.slice(1);
  }, [monthDate]);

  return (
    <div className="mx-auto max-w-7xl min-h-[100dvh] pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Графік персоналу
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Додавай працівників, плануй зміни по днях та отримуй розрахунок
              зарплат за місяць.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="
              inline-flex items-center gap-2
              rounded-2xl bg-black px-4 py-3
              text-sm font-extrabold text-white
              shadow-[0_12px_30px_rgba(0,0,0,0.18)]
              hover:bg-gray-900 active:scale-[0.99] transition
            "
          >
            <IconPlus />
            Додати працівника
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar employees */}
        <aside className="lg:col-span-4 space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-extrabold text-gray-900">
                  Працівники
                </h2>
                <span className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700">
                  {data.employees.length}
                </span>
              </div>
            </div>

            <div className="p-3">
              {!data.employees.length ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  Додай першого працівника — після цього зможеш заповнювати
                  графік та рахувати зарплату.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.employees.map((emp) => {
                    const sum = monthSummary.get(emp.id) || {
                      minutes: 0,
                      salary: 0,
                    };
                    const hours = sum.minutes / 60;

                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => setActiveEmployeeId(emp.id)}
                        className={[
                          "w-full rounded-2xl border px-4 py-3 text-left transition",
                          emp.id === activeEmployeeId
                            ? "border-black bg-black text-white"
                            : "border-gray-200 bg-white hover:bg-gray-50",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className={[
                                "text-sm font-extrabold truncate",
                                emp.id === activeEmployeeId
                                  ? "text-white"
                                  : "text-gray-900",
                              ].join(" ")}
                            >
                              {emp.name}
                            </p>
                            <p
                              className={[
                                "mt-0.5 text-xs truncate",
                                emp.id === activeEmployeeId
                                  ? "text-white/80"
                                  : "text-gray-600",
                              ].join(" ")}
                            >
                              {emp.role || "Посада не вказана"} • ставка:{" "}
                              {formatMoney(Number(emp.rate) || 0)}/год
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p
                              className={[
                                "text-xs font-bold",
                                emp.id === activeEmployeeId
                                  ? "text-white/90"
                                  : "text-gray-700",
                              ].join(" ")}
                            >
                              {hours.toFixed(1)} год
                            </p>
                            <p
                              className={[
                                "text-sm font-extrabold",
                                emp.id === activeEmployeeId
                                  ? "text-white"
                                  : "text-gray-900",
                              ].join(" ")}
                            >
                              {formatMoney(sum.salary)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Active employee settings */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900">
                Налаштування
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Ставка впливає на розрахунок зарплати.
              </p>
            </div>

            <div className="px-5 py-5">
              {!activeEmployee ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  Обери працівника зі списку або додай нового.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-900">
                        Імʼя
                      </label>
                      <input
                        value={activeEmployee.name}
                        onChange={(e) =>
                          updateEmployee(activeEmployee.id, {
                            name: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/40"
                        placeholder="Напр. Марія"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-900">
                        Посада
                      </label>
                      <input
                        value={activeEmployee.role || ""}
                        onChange={(e) =>
                          updateEmployee(activeEmployee.id, {
                            role: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/40"
                        placeholder="Майстер / Адмін…"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-900">
                        Ставка (за годину)
                      </label>
                      <input
                        inputMode="decimal"
                        value={String(activeEmployee.rate ?? "")}
                        onChange={(e) => {
                          const v = e.target.value.replace(",", ".");
                          const num = Number(v);
                          updateEmployee(activeEmployee.id, {
                            rate: Number.isFinite(num) ? num : 0,
                          });
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/40"
                        placeholder="Напр. 150"
                      />
                      <p className="text-xs text-gray-500">
                        Підказка: можна вводити “150.5”.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      {(() => {
                        const sum = monthSummary.get(activeEmployee.id) || {
                          minutes: 0,
                          salary: 0,
                        };
                        const hours = sum.minutes / 60;
                        return (
                          <>
                            <p className="text-xs font-semibold text-gray-500">
                              Підсумок за місяць
                            </p>
                            <p className="mt-1 text-sm font-extrabold text-gray-900">
                              {hours.toFixed(1)} год • {formatMoney(sum.salary)}
                            </p>
                            <p className="mt-2 text-xs text-gray-600">
                              Розрахунок: години * ставка.
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeEmployee(activeEmployee.id)}
                    className="
                      inline-flex items-center gap-2
                      rounded-2xl border border-gray-200 bg-white
                      px-4 py-3 text-sm font-extrabold text-red-600
                      hover:bg-red-50 hover:border-red-200 active:scale-[0.99] transition
                    "
                  >
                    <IconTrash />
                    Видалити працівника
                  </button>
                </div>
              )}
            </div>
          </section>
        </aside>

        {/* Calendar */}
        <main className="lg:col-span-8 space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-extrabold text-gray-900 truncate">
                    Розклад на місяць
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Натисни на день, щоб задати час зміни. Порожня зміна =
                    вихідний.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                    title="Попередній місяць"
                    aria-label="Prev month"
                  >
                    <IconChevronLeft />
                  </button>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-extrabold text-gray-900">
                    {headerTitle}
                  </div>

                  <button
                    type="button"
                    onClick={nextMonth}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                    title="Наступний місяць"
                    aria-label="Next month"
                  >
                    <IconChevronRight />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-5">
              {!activeEmployee ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  Спочатку додай та обери працівника — календар стане активним.
                </div>
              ) : (
                <>
                  {/* Weekdays header */}
                  <div className="grid grid-cols-7 gap-2">
                    {weekdays.map((w) => (
                      <div
                        key={w}
                        className="text-center text-xs font-bold text-gray-500"
                      >
                        {w}
                      </div>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="mt-3 grid gap-2">
                    {datesGrid.map((week, wi) => (
                      <div key={wi} className="grid grid-cols-7 gap-2">
                        {week.map((d, di) => {
                          if (!d) {
                            return (
                              <div
                                key={di}
                                className="h-[84px] rounded-2xl bg-gray-50 border border-gray-100"
                              />
                            );
                          }

                          const iso = toISODate(d);
                          const s =
                            data.shifts[shiftKey(activeEmployee.id, iso)];
                          const todayIso = toISODate(new Date());
                          const isToday = iso === todayIso;

                          return (
                            <button
                              key={di}
                              type="button"
                              onClick={() => openShiftEditor(d)}
                              className={[
                                "h-[84px] rounded-2xl border p-3 text-left transition relative",
                                s
                                  ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                                  : "border-red-200 bg-red-50 hover:bg-red-100",
                                isToday ? "ring-2 ring-black/20" : "",
                              ].join(" ")}
                              title="Редагувати зміну"
                            >
<div className="h-full flex flex-col justify-between">
  {/* header */}
  <div className="flex items-start justify-between gap-2">
    <p className="text-[11px] sm:text-xs font-bold text-gray-600">
      {d.getDate()}
    </p>

    {isToday && (
      <span className="rounded-full bg-black px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold text-white">
        Сьогодні
      </span>
    )}
  </div>

  {/* time block */}
  <div className="flex flex-1 items-center justify-center">
    {s ? (
      <div className="flex flex-col items-center leading-none">
        <span className="text-sm sm:text-base font-extrabold text-emerald-900 ">
          {s.start}
        </span>
        <span className="text-sm sm:text-base font-extrabold text-emerald-900 ">
          {s.end}
        </span>
      </div>
    ) : (
      <span className="text-sm sm:text-base font-extrabold text-red-900/40 ">
        —
      </span>
    )}
  </div>
</div>

                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-400" />
                      <span className="text-sm font-semibold text-gray-700">
                        Працює
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-red-400" />
                      <span className="text-sm font-semibold text-gray-700">
                        Вихідний
                      </span>
                    </div>

                    <span className="text-xs text-gray-500">
                      Натисни на день, щоб задати/змінити час зміни.
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold text-gray-500">
                      Порада
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      Якщо вказати однаковий час для всіх робочих днів — можна
                      швидко “наклацати” календар. Пізніше додамо шаблони (Пн–Пт
                      09:00–18:00) одним кліком.
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Totals table */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900">
                Зарплата за {headerTitle}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Підсумок по кожному працівнику.
              </p>
            </div>

            <div className="px-5 py-5">
              {!data.employees.length ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  Додай працівників — тут зʼявиться таблиця зарплат.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs text-gray-500">
                        <th className="py-2 pr-3 font-bold">Працівник</th>
                        <th className="py-2 pr-3 font-bold">Ставка</th>
                        <th className="py-2 pr-3 font-bold">Години</th>
                        <th className="py-2 pr-3 font-bold">Зарплата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.employees.map((emp) => {
                        const sum = monthSummary.get(emp.id) || {
                          minutes: 0,
                          salary: 0,
                        };
                        const hours = sum.minutes / 60;
                        const isActive = emp.id === activeEmployeeId;

                        return (
                          <tr
                            key={emp.id}
                            className={[
                              "border-t",
                              isActive ? "bg-gray-50" : "",
                            ].join(" ")}
                          >
                            <td className="py-3 pr-3">
                              <div className="min-w-0">
                                <p className="text-sm font-extrabold text-gray-900 truncate">
                                  {emp.name}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500 truncate">
                                  {emp.role || "Посада не вказана"}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 pr-3 text-sm font-bold text-gray-900">
                              {formatMoney(Number(emp.rate) || 0)}/год
                            </td>
                            <td className="py-3 pr-3 text-sm font-bold text-gray-900">
                              {hours.toFixed(1)}
                            </td>
                            <td className="py-3 pr-3 text-sm font-extrabold text-gray-900">
                              {formatMoney(sum.salary)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Add employee modal */}
      <Modal
        open={addOpen}
        title="Додати працівника"
        onClose={() => setAddOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50 transition"
            >
              Скасувати
            </button>
            <button
              type="button"
              onClick={addEmployee}
              className="rounded-xl bg-black px-4 py-2.5 text-sm font-extrabold text-white hover:bg-gray-900 transition"
            >
              Додати
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-semibold text-gray-900">Імʼя</label>
            <input
              value={newEmp.name}
              onChange={(e) =>
                setNewEmp((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/40"
              placeholder="Напр. Олександр"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-900">
              Посада
            </label>
            <input
              value={newEmp.role}
              onChange={(e) =>
                setNewEmp((p) => ({ ...p, role: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/40"
              placeholder="Майстер"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-900">
              Ставка / год
            </label>
            <input
              inputMode="decimal"
              value={newEmp.rate}
              onChange={(e) =>
                setNewEmp((p) => ({ ...p, rate: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/40"
              placeholder="150"
            />
          </div>

          <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-500">Як це працює</p>
            <p className="mt-1 text-sm text-gray-700">
              Далі обереш працівника → натискатимеш на дні календаря →
              задаватимеш час зміни. Зарплата рахується автоматично:{" "}
              <span className="font-semibold">години × ставка</span>.
            </p>
          </div>
        </div>
      </Modal>

      {/* Shift editor modal */}
      <Modal
        open={edit.open}
        title={
          activeEmployee
            ? `Зміна: ${activeEmployee.name} • ${edit.iso}`
            : `Зміна • ${edit.iso}`
        }
        onClose={() => setEdit((p) => ({ ...p, open: false }))}
        footer={
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={clearShift}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-extrabold text-red-600 hover:bg-red-50 hover:border-red-200 transition"
            >
              Очистити (вихідний)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEdit((p) => ({ ...p, open: false }))}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50 transition"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={saveShift}
                className="rounded-xl bg-black px-4 py-2.5 text-sm font-extrabold text-white hover:bg-gray-900 transition"
              >
                Зберегти
              </button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-900">
              Початок
            </label>
            <input
              type="time"
              value={edit.start}
              onChange={(e) =>
                setEdit((p) => ({ ...p, start: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-900">
              Кінець
            </label>
            <input
              type="time"
              value={edit.end}
              onChange={(e) => setEdit((p) => ({ ...p, end: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/40"
            />
          </div>

          <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            {(() => {
              const mins = calcShiftMinutes(edit.start, edit.end);
              const hours = mins / 60;
              const rate = Number(activeEmployee?.rate) || 0;
              return (
                <>
                  <p className="text-xs font-semibold text-gray-500">
                    Підсумок зміни
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-gray-900">
                    {hours.toFixed(2)} год • {formatMoney(hours * rate)}
                  </p>
                  <p className="mt-2 text-xs text-gray-600">
                    Якщо час некоректний або 0 год — зміна буде очищена
                    (вихідний).
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      </Modal>
    </div>
  );
}
