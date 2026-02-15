import { useEffect, useMemo, useState } from "react";
import { useBookings } from "../../context/bookings/useBookings";

const DAY_LABEL = {
  mon: "Пн",
  tue: "Вт",
  wed: "Ср",
  thu: "Чт",
  fri: "Пт",
  sat: "Сб",
  sun: "Нд",
};

function formatDateUA(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function getDayKeyFromDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[d.getDay()];
}

// ===== Calendar helpers =====
function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODateKey(d) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function monthLabelUA(d) {
  return d.toLocaleDateString("uk-UA", { month: "long", year: "numeric" });
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfCalendarGrid(d) {
  // week starts Monday
  const first = startOfMonth(d);
  const day = first.getDay(); // 0..6 Sun..Sat
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

// ===== datetime helpers =====
function parseTimeToHHMM(timeStr) {
  const t = String(timeStr || "").trim();
  if (!t) return null;
  // supports "9:00", "09:00", "9.00"
  const cleaned = t.replace(".", ":");
  const m = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Math.min(23, Math.max(0, Number(m[1])));
  const mm = Math.min(59, Math.max(0, Number(m[2])));
  return `${pad2(hh)}:${pad2(mm)}`;
}

function getBookingDateTime(b) {
  const dateStr = b?.date;
  const timeStr = parseTimeToHHMM(b?.time);
  if (!dateStr || !timeStr) return null;
  const dt = new Date(`${dateStr}T${timeStr}:00`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export default function Bookings() {
  const { bookings, confirmBooking, cancelBooking, deleteBooking } =
    useBookings();

  // delete modal
  const [confirmId, setConfirmId] = useState(null);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);

  // details modal
  const [detailsId, setDetailsId] = useState(null);

  // tabs
  const [tab, setTab] = useState("list"); // "list" | "calendar"

  // calendar
  const [activeMonth, setActiveMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [calendarDayKey, setCalendarDayKey] = useState(null); // YYYY-MM-DD

  // ✅ filters for LIST view
  // all | new | confirmed | canceled | deleted | archive
  const [filter, setFilter] = useState("all");

  // ✅ local stash for "Deleted" (since deleteBooking removes from source)
  const DELETED_STORE_KEY = "bookings_deleted_store_v1";

  const [deletedStore, setDeletedStore] = useState(() => {
    try {
      const raw = localStorage.getItem(DELETED_STORE_KEY);
      if (!raw) return new Map();
      const arr = JSON.parse(raw); // [[id, booking], ...]
      if (!Array.isArray(arr)) return new Map();
      return new Map(arr);
    } catch {
      return new Map();
    }
  });

  // ✅ persist to localStorage on changes
  useEffect(() => {
    try {
      const arr = Array.from(deletedStore.entries());
      localStorage.setItem(DELETED_STORE_KEY, JSON.stringify(arr));
    } catch {
      // ignore
    }
  }, [deletedStore]);

  const selectedBooking = useMemo(() => {
    if (detailsId == null) return null;

    // prefer live booking; fallback to deleted stash
    const live = (bookings || []).find((b) => b.id === detailsId) || null;
    if (live) return live;

    const snap = deletedStore.get(detailsId);
    return snap || null;
  }, [detailsId, bookings, deletedStore]);

  function renderBookingDate(b) {
    const raw = b?.date || b?.day;
    if (!raw) return "—";
    const formatted = formatDateUA(raw);
    const dayKey = getDayKeyFromDate(raw);
    if (formatted && dayKey) return `${formatted}`;
    return DAY_LABEL[raw] ? DAY_LABEL[raw] : raw;
  }

  function renderStatusLabel(b) {
    if (b?.status === "confirmed") return "Підтверджено";
    if (b?.status === "canceled") return "Скасовано";
    return "Новий";
  }

  // ✅ Split into ACTIVE vs ARCHIVE (by date+time < now)
  // ✅ "тепер" як state (щоб не викликати Date.now() під час render)
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    // оновлюємо час періодично, щоб архів автоматично оновлювався
    const id = setInterval(() => setNowTs(Date.now()), 60_000); // 1 хв
    return () => clearInterval(id);
  }, []);

  const split = useMemo(() => {
    const deletedIds = new Set(deletedStore.keys());

    const active = [];
    const archive = [];

    for (const b of bookings || []) {
      if (!b?.id) continue;
      if (deletedIds.has(b.id)) continue; // in case stash overlaps

      const dt = getBookingDateTime(b);
      const isPast = dt ? dt.getTime() < nowTs : false;

      if (isPast) archive.push(b);
      else active.push(b);
    }

    // sort: nearest first
    const byDateTimeAsc = (a, c) => {
      const da = getBookingDateTime(a)?.getTime() ?? Number.POSITIVE_INFINITY;
      const dc = getBookingDateTime(c)?.getTime() ?? Number.POSITIVE_INFINITY;
      if (da !== dc) return da - dc;
      return (a.time || "").localeCompare(c.time || "");
    };

    active.sort(byDateTimeAsc);
    archive.sort(byDateTimeAsc);

    return { active, archive };
  }, [bookings, deletedStore, nowTs]);

  const deletedList = useMemo(() => {
    // newest first by snapshot datetime
    const arr = Array.from(deletedStore.values());
    arr.sort((a, c) => {
      const da = getBookingDateTime(a)?.getTime() ?? 0;
      const dc = getBookingDateTime(c)?.getTime() ?? 0;
      return dc - da;
    });
    return arr;
  }, [deletedStore]);

  // ✅ Apply filter to LIST view
  const listData = useMemo(() => {
    if (filter === "archive") return split.archive;
    if (filter === "deleted") return deletedList;

    const base = split.active;

    if (filter === "new") {
      return base.filter((b) => !b.status || b.status === "new");
    }
    if (filter === "confirmed") {
      return base.filter((b) => b.status === "confirmed");
    }
    if (filter === "canceled") {
      return base.filter((b) => b.status === "canceled");
    }

    return base; // all
  }, [filter, split, deletedList]);

  // ✅ Grouping for listData (not the whole bookings anymore)
  const grouped = useMemo(() => {
    const map = {};

    for (const b of listData || []) {
      // for list view we want real date grouping when possible
      const key = b.date || b.day || "other";
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }

    Object.keys(map).forEach((k) => {
      map[k].sort((a, c) => (a.time || "").localeCompare(c.time || ""));
    });

    const keys = Object.keys(map).sort((a, b) => {
      const da = new Date(a);
      const db = new Date(b);
      const aOk = !Number.isNaN(da.getTime());
      const bOk = !Number.isNaN(db.getTime());
      if (aOk && bOk) return da - db;
      return String(a).localeCompare(String(b));
    });

    return { map, keys };
  }, [listData]);

  const keys = grouped.keys;

  function renderGroupTitle(key) {
    const formattedDate = formatDateUA(key);
    const dayKey = getDayKeyFromDate(key);

    if (formattedDate && dayKey) {
      return `${formattedDate}`.trim();
    }
    return DAY_LABEL[key] || key;
  }

  // ✅ Calendar buckets: key -> { items, count, newCount }
  const bookingsByDateKey = useMemo(() => {
    const map = new Map();

    // calendar should show ACTIVE + ARCHIVE? usually yes, but you asked to see NEW clearly.
    // We'll show ALL non-deleted bookings in calendar (both future and past),
    // and still mark NEW.
    const deletedIds = new Set(deletedStore.keys());

    for (const b of bookings || []) {
      if (!b?.id) continue;
      if (deletedIds.has(b.id)) continue;

      const raw = b?.date;
      if (!raw) continue;

      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) continue;

      const key = toISODateKey(d);

      if (!map.has(key)) {
        map.set(key, { items: [], count: 0, newCount: 0 });
      }

      const bucket = map.get(key);
      bucket.items.push(b);
      bucket.count += 1;
      if (!b.status || b.status === "new") bucket.newCount += 1;
    }

    for (const [k, bucket] of map.entries()) {
      bucket.items.sort((a, c) => (a.time || "").localeCompare(c.time || ""));
      map.set(k, bucket);
    }

    return map;
  }, [bookings, deletedStore]);

  // ===== Filter counts (for pills) =====
  const filterCounts = useMemo(() => {
    const active = split.active;
    const archive = split.archive;

    const newCount = active.filter(
      (b) => !b.status || b.status === "new",
    ).length;
    const confirmedCount = active.filter(
      (b) => b.status === "confirmed",
    ).length;
    const canceledCount = active.filter((b) => b.status === "canceled").length;

    return {
      all: active.length,
      new: newCount,
      confirmed: confirmedCount,
      canceled: canceledCount,
      deleted: deletedList.length,
      archive: archive.length,
    };
  }, [split, deletedList]);

  // ===== Delete handler that feeds "Deleted" filter =====
  function handleDelete(id) {
    const snap =
      (bookings || []).find((b) => b.id === id) || deletedStore.get(id) || null;

    if (snap) {
      setDeletedStore((prev) => {
        const next = new Map(prev);
        next.set(id, { ...snap, status: "deleted" });
        return next;
      });
    }

    deleteBooking(id);
  }

  return (
    <div className="space-y-6">
      {/* Header + tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Записи
          </h1>
          <p className="text-sm text-gray-600">
            Перегляд списком або через календар.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setTab("list")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition
                ${
                  tab === "list"
                    ? "bg-black text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              Список
            </button>
            <button
              type="button"
              onClick={() => setTab("calendar")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition
                ${
                  tab === "calendar"
                    ? "bg-black text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              Календар
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Filters (only in LIST tab) */}
      {tab === "list" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: "Усі" },
              { key: "new", label: "Нові" },
              { key: "confirmed", label: "Підтверджені" },
              { key: "canceled", label: "Скасовані" },
              { key: "deleted", label: "Видалені" },
              { key: "archive", label: "Архів" },
            ].map((x) => {
              const isActive = filter === x.key;
              const c = filterCounts[x.key] ?? 0;

              return (
                <button
                  key={x.key}
                  type="button"
                  onClick={() => setFilter(x.key)}
                  className={`
  inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold
  transition-all duration-200 active:scale-[0.97]

  ${
    isActive
      ? `
        !bg-black
        !text-white
        !border-black
        shadow-sm
      `
      : `
        bg-white
        text-gray-800
        border-gray-200
        hover:bg-gray-50
        hover:border-gray-300
      `
  }
`}
                >
                  <span>{x.label}</span>

                  <span
                    className={`
      inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-xs font-bold border transition-all duration-200
      ${
        isActive
          ? "bg-white text-black border-white"
          : "bg-gray-100 text-gray-700 border-transparent"
      }
    `}
                  >
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      {tab === "list" ? (
        keys.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6 text-gray-700"
                >
                  <path
                    d="M7 2v3M17 2v3M3.5 9h17M6 13h4M6 17h7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M5 5h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Немає записів у цій вкладці
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Змініть фільтр — або дочекайтесь нових бронювань.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {keys.map((key) => (
              <section key={key} className="space-y-3">
                <div className="sticky top-0 z-10 -mx-2 bg-white/80 px-2 py-2 backdrop-blur">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {renderGroupTitle(key)}
                  </h2>
                </div>

                <div className="space-y-3">
                  {grouped.map[key].map((b) => {
                    const isCanceled = b.status === "canceled";
                    const isConfirmed = b.status === "confirmed";
                    const isDeleted = b.status === "deleted";

                    const dt = getBookingDateTime(b);
                    const isArchived = dt ? dt.getTime() < nowTs : false;

                    // ✅ статус — завжди показуємо реальний (навіть якщо архів)
                    const statusMeta = isDeleted
                      ? {
                          label: "Видалено",
                          cls: "border-gray-300 bg-gray-100 text-gray-700",
                          dot: "bg-gray-500",
                        }
                      : isConfirmed
                        ? {
                            label: "Підтверджено",
                            cls: "border-green-200 bg-green-50 text-green-700",
                            dot: "bg-green-600",
                          }
                        : isCanceled
                          ? {
                              label: "Скасовано",
                              cls: "border-red-200 bg-red-50 text-red-700",
                              dot: "bg-red-600",
                            }
                          : {
                              label: "Новий",
                              cls: "border-amber-200 bg-amber-50 text-amber-800",
                              dot: "bg-amber-600",
                            };

                    return (
                      <div
                        key={b.id}
                        className={`
          rounded-2xl border border-gray-200 bg-white p-4
          shadow-sm transition-all
          hover:border-gray-300 hover:shadow-md
          ${isArchived ? "bg-gray-50/40" : ""}
        `}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold text-gray-900">
                                {b.time}{" "}
                                <span className="font-normal text-gray-400">
                                  •
                                </span>{" "}
                                {b.serviceName}
                              </p>

                              {/* ✅ Status (реальний) */}
                              <span
                                className={`
                  inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold
                  ${statusMeta.cls}
                `}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`}
                                />
                                {statusMeta.label}
                              </span>

                              {/* ✅ Archive tag (окремо, щоб не перекривало статус) */}
                              {isArchived && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                  СЕАНС ЗАВЕРШЕНО
                                </span>
                              )}
                            </div>

                            <div className="mt-2 grid gap-1 text-sm text-gray-600">
                              <p className="truncate">
                                <span className="text-gray-400">Клієнт:</span>{" "}
                                <span className="font-medium text-gray-900">
                                  {b.clientName || "—"}
                                </span>
                              </p>

                              <p className="truncate">
                                <span className="text-gray-400">Тел:</span>{" "}
                                <a
                                  href={`tel:${b.clientPhone || ""}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-medium text-blue-700 hover:underline"
                                >
                                  {b.clientPhone || "—"}
                                </a>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                            <div className="text-xs text-gray-500">
                              {renderBookingDate(b)}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                          <button
                            type="button"
                            onClick={() => setDetailsId(b.id)}
                            className="ui-button ui-button-outline w-full sm:w-auto"
                          >
                            Переглянути
                          </button>

                          <button
                            type="button"
                            onClick={() => confirmBooking(b.id)}
                            disabled={
                              isConfirmed ||
                              isCanceled ||
                              isArchived ||
                              isDeleted
                            }
                            className="
              ui-button ui-button-primary
              w-full sm:w-auto
              disabled:opacity-50 disabled:cursor-not-allowed
            "
                          >
                            Підтвердити
                          </button>

                          {!isCanceled ? (
                            <button
                              type="button"
                              onClick={() => setCancelConfirmId(b.id)}
                              disabled={isCanceled || isArchived || isDeleted}
                              className="
                ui-button ui-button-secondary
                w-full sm:w-auto
                disabled:opacity-50 disabled:cursor-not-allowed
              "
                            >
                              Скасувати
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmId(b.id)}
                              disabled={isArchived || isDeleted}
                              className="ui-button ui-button-danger w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Видалити
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )
      ) : (
        // ✅ Calendar tab
        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg sm:text-xl font-semibold text-gray-900 capitalize">
                {monthLabelUA(activeMonth)}
              </h2>
              <p className="text-sm text-gray-600">
                Натисни на день, щоб переглянути записи.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setActiveMonth(
                    new Date(
                      activeMonth.getFullYear(),
                      activeMonth.getMonth() - 1,
                      1,
                    ),
                  )
                }
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
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
              <button
                type="button"
                onClick={() => setActiveMonth(startOfMonth(new Date()))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
              >
                Сьогодні
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveMonth(
                    new Date(
                      activeMonth.getFullYear(),
                      activeMonth.getMonth() + 1,
                      1,
                    ),
                  )
                }
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
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

          <div className="mt-4 grid grid-cols-7 gap-2 text-xs font-semibold text-gray-500">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((x) => (
              <div key={x} className="px-1 text-center">
                {x}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {(() => {
              const start = startOfCalendarGrid(activeMonth);
              const totalDays = 42;
              const todayKey = toISODateKey(new Date());

              return Array.from({ length: totalDays }).map((_, i) => {
                const day = addDays(start, i);
                const key = toISODateKey(day);

                const isInMonth = day.getMonth() === activeMonth.getMonth();
                const isToday = key === todayKey;

                const bucket = bookingsByDateKey.get(key);
                const count = bucket?.count ?? 0;
                const newCount = bucket?.newCount ?? 0;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => count > 0 && setCalendarDayKey(key)}
                    className={`
  relative rounded-2xl border p-2 sm:p-3 text-left transition-all duration-200

  ${isInMonth ? "bg-white" : "bg-gray-50"}

  ${
    newCount > 0
      ? `
        border-amber-400
        bg-amber-50/40
        shadow-sm
        hover:border-amber-500
        hover:shadow-md
      `
      : count > 0
        ? `
          border-gray-200
          hover:border-gray-300
          hover:shadow-sm
        `
        : "border-gray-100"
  }

  ${isToday ? "ring-2 ring-black/10" : ""}

  ${count > 0 ? "cursor-pointer" : "cursor-default opacity-70"}

  active:scale-[0.98]
`}
                    disabled={count === 0}
                    title={count > 0 ? `Записів: ${count}` : "Немає записів"}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          isInMonth ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {day.getDate()}
                      </span>

                      {count > 0 && (
                        <span
                          className={`
        inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold
        ${newCount > 0 ? "bg-amber-500 text-white" : "bg-black text-white"}
      `}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              });
            })()}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-black" />Є записи
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />Є нові
              записи
            </span>
          </div>
        </section>
      )}

      {/* ✅ Modal confirm delete */}
      {confirmId != null && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            px-4
            bg-black/40
            backdrop-blur-[2px]
            backdrop-saturate-150
            transition-all duration-200
"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Видалити запис?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Цю дію неможливо буде повернути.
            </p>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  handleDelete(confirmId);
                  setConfirmId(null);
                }}
                className="ui-button ui-button-danger"
              >
                Так, видалити
              </button>
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="ui-button ui-button-secondary"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal confirm cancel */}
      {cancelConfirmId != null && (
        <div
          className="
  fixed inset-0 z-50
  flex items-center justify-center
  px-4
  bg-black/40
  backdrop-blur-[2px]
  backdrop-saturate-150
  transition-all duration-200
"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Скасувати запис?
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Запис буде позначено як скасований.
            </p>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  cancelBooking(cancelConfirmId);
                  setCancelConfirmId(null);
                }}
                className="ui-button ui-button-danger"
              >
                Так, скасувати
              </button>

              <button
                type="button"
                onClick={() => setCancelConfirmId(null)}
                className="ui-button ui-button-secondary"
              >
                Назад
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal details */}
      {detailsId != null && selectedBooking && (
        <div
          className="
  fixed inset-0 z-50
  flex items-center justify-center
  px-4
  bg-black/40
  backdrop-blur-[2px]
  backdrop-saturate-150
  transition-all duration-200
"
          onClick={() => setDetailsId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Деталі запису
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Статус:{" "}
                  <span className="font-medium text-gray-900">
                    {renderStatusLabel(selectedBooking)}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetailsId(null)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Клієнт</p>
                <p className="font-medium text-gray-900">
                  {selectedBooking.clientName || "—"}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedBooking.clientPhone || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Послуга</p>
                <p className="font-medium text-gray-900">
                  {selectedBooking.serviceName || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Дата і час</p>
                <p className="font-medium text-gray-900">
                  {renderBookingDate(selectedBooking)} •{" "}
                  {selectedBooking.time || "—"}
                </p>
              </div>

              {/* If it's deleted snapshot */}
              {selectedBooking.status === "deleted" && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs text-gray-500">Примітка</p>
                  <p className="text-sm text-gray-700">
                    Цей запис відображається у вкладці “Видалені” як локальна
                    історія.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailsId(null)}
                className="ui-button ui-button-secondary"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal: bookings for selected day from calendar */}
      {calendarDayKey && (
        <div
          className="
          fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4
          "
          onClick={() => setCalendarDayKey(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Записи на {formatDateUA(calendarDayKey)}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Всього:{" "}
                  <span className="font-semibold text-gray-900">
                    {bookingsByDateKey.get(calendarDayKey)?.count ?? 0}
                  </span>
                  {(() => {
                    const n =
                      bookingsByDateKey.get(calendarDayKey)?.newCount ?? 0;
                    if (!n) return null;
                    return (
                      <span className="ml-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
                        НОВІ {n}
                      </span>
                    );
                  })()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCalendarDayKey(null)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-auto pr-1">
              {(bookingsByDateKey.get(calendarDayKey)?.items || []).map((b) => {
                const isCanceled = b.status === "canceled";
                const isConfirmed = b.status === "confirmed";
                const dt = getBookingDateTime(b);
                const isArchived = dt ? dt.getTime() < nowTs : false;

                return (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-gray-900">
                          {b.time} • {b.serviceName}
                        </p>
                        <p className="mt-1 truncate text-sm text-gray-600">
                          {b.clientName} •{" "}
                          <a
                            href={`tel:${b.clientPhone || ""}`}
                            className="font-semibold text-blue-700 hover:underline"
                          >
                            {b.clientPhone}
                          </a>
                        </p>
                      </div>

                      <span
                        className={`
                          inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold
                          ${
                            isArchived
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : isConfirmed
                                ? "border-green-200 bg-green-50 text-green-700"
                                : isCanceled
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "border-amber-200 bg-amber-50 text-amber-800"
                          }
                        `}
                      >
                        <span
                          className={`
                            h-1.5 w-1.5 rounded-full
                            ${
                              isArchived
                                ? "bg-blue-600"
                                : isConfirmed
                                  ? "bg-green-600"
                                  : isCanceled
                                    ? "bg-red-600"
                                    : "bg-amber-600"
                            }
                          `}
                        />
                        {isArchived
                          ? "Архів"
                          : isConfirmed
                            ? "Підтверджено"
                            : isCanceled
                              ? "Скасовано"
                              : "Новий"}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setDetailsId(b.id)}
                        className="ui-button ui-button-outline w-full sm:w-auto"
                      >
                        Деталі
                      </button>

                      <button
                        type="button"
                        onClick={() => confirmBooking(b.id)}
                        disabled={isConfirmed || isCanceled || isArchived}
                        className="ui-button ui-button-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Підтвердити
                      </button>

                      {!isCanceled ? (
                        <button
                          type="button"
                          onClick={() => cancelBooking(b.id)}
                          disabled={isCanceled || isArchived}
                          className="ui-button ui-button-secondary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Скасувати
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(b.id)}
                          disabled={isArchived}
                          className="ui-button ui-button-danger w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Видалити
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {(bookingsByDateKey.get(calendarDayKey)?.count ?? 0) === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                  На цей день записів немає.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
