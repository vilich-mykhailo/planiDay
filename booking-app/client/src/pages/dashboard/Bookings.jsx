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

// =========================
// Helpers
// =========================
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

// =========================
// UI helpers (modern style)
// =========================
function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

function Card({ className = "", children }) {
  return (
    <section
      className={cx(
        "rounded-3xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function Badge({ variant = "neutral", children, className = "" }) {
  const styles = {
    neutral: "border-gray-200 bg-gray-50 text-gray-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-blue-200 bg-blue-50 text-blue-700",
    dark: "border-black bg-black text-white",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

function IconDot({ className = "" }) {
  return <span className={cx("h-1.5 w-1.5 rounded-full", className)} />;
}

function ButtonBase({ className = "", ...props }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold",
        "transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        "focus:outline-none focus:ring-2 focus:ring-black/10",
        className,
      )}
      {...props}
    />
  );
}

function PrimaryButton({ className = "", ...props }) {
  return (
    <ButtonBase
      className={cx(
        "bg-black text-white hover:bg-gray-900 shadow-[0_8px_18px_rgba(0,0,0,0.12)]",
        className,
      )}
      {...props}
    />
  );
}

function GhostButton({ className = "", ...props }) {
  return (
    <ButtonBase
      className={cx(
        "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
        className,
      )}
      {...props}
    />
  );
}

function DangerButton({ className = "", ...props }) {
  return (
    <ButtonBase
      className={cx(
        "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        className,
      )}
      {...props}
    />
  );
}

function Pill({ active, count, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
        "transition active:scale-[0.98]",
        active
          ? "border-black bg-black text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-300",
      )}
    >
      <span>{children}</span>
      <span
        className={cx(
          "inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-xs font-bold border",
          active
            ? "bg-white text-black border-white"
            : "bg-gray-100 text-gray-700 border-transparent",
        )}
      >
        {count ?? 0}
      </span>
    </button>
  );
}


function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  center = false,
  maxWidth = "max-w-lg",
  closeOnBackdrop = false,
}) {
  const [mouseDownBackdrop, setMouseDownBackdrop] = useState(false);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] overflow-y-auto"
      onMouseDown={(e) => {
        if (!closeOnBackdrop) return;
        setMouseDownBackdrop(e.target === e.currentTarget);
      }}
      onMouseUp={(e) => {
        if (!closeOnBackdrop) return;
        const upOnBackdrop = e.target === e.currentTarget;
        if (mouseDownBackdrop && upOnBackdrop) onClose?.();
        setMouseDownBackdrop(false);
      }}
      onMouseLeave={() => setMouseDownBackdrop(false)}
    >
      <div
        className={cx(
          "min-h-full px-4 py-4 sm:py-6 flex justify-center",
          center ? "items-center" : "items-start",
        )}
      >
        <div
          className={cx(
            "w-full rounded-3xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] overflow-hidden",
            maxWidth,
          )}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header + ✕ */}
          <div className="border-b border-gray-100 px-6 py-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {title}
              </p>
              {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
className="
  inline-flex items-center justify-center
  h-9 w-9
  rounded-xl

  text-gray-500
  hover:bg-gray-200
  hover:text-gray-900
  transition
  active:scale-[0.95]
"
                aria-label="Закрити"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Body (always scrollable) */}
          <div className="px-6 py-6 max-h-[calc(100vh-220px)] overflow-y-auto">
            {children}
          </div>

          {footer && <div className="border-t border-gray-100 px-6 py-4">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

// =========================
// Page
// =========================
export default function Bookings() {
  const { bookings, confirmBooking, cancelBooking, deleteBooking } =
    useBookings();

  // modals
  const [confirmId, setConfirmId] = useState(null);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [detailsId, setDetailsId] = useState(null);

  // tabs
  const [tab, setTab] = useState("list"); // "list" | "calendar"

  // calendar
  const [activeMonth, setActiveMonth] = useState(() => startOfMonth(new Date()));
  const [calendarDayKey, setCalendarDayKey] = useState(null); // YYYY-MM-DD

  // filters for list
  const [filter, setFilter] = useState("all");
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

  // now timestamp (for archive auto-update)
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // split ACTIVE vs ARCHIVE (past datetime)
  const split = useMemo(() => {
    const deletedIds = new Set(deletedStore.keys());
    const active = [];
    const archive = [];

    for (const b of bookings || []) {
      if (!b?.id) continue;
      if (deletedIds.has(b.id)) continue;

      const dt = getBookingDateTime(b);
      const isPast = dt ? dt.getTime() < nowTs : false;
      if (isPast) archive.push(b);
      else active.push(b);
    }

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
    const arr = Array.from(deletedStore.values());
    arr.sort((a, c) => {
      const da = getBookingDateTime(a)?.getTime() ?? 0;
      const dc = getBookingDateTime(c)?.getTime() ?? 0;
      return dc - da;
    });
    return arr;
  }, [deletedStore]);

  const listData = useMemo(() => {
    if (filter === "archive") return split.archive;
    if (filter === "deleted") return deletedList;

    const base = split.active;

    if (filter === "new") return base.filter((b) => !b.status || b.status === "new");
    if (filter === "confirmed") return base.filter((b) => b.status === "confirmed");
    if (filter === "canceled") return base.filter((b) => b.status === "canceled");

    return base; // all
  }, [filter, split, deletedList]);

  const grouped = useMemo(() => {
    const map = {};

    for (const b of listData || []) {
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
    if (formattedDate && dayKey) return `${formattedDate}`.trim();
    return DAY_LABEL[key] || key;
  }

  // calendar buckets (exclude deleted)
  const bookingsByDateKey = useMemo(() => {
    const map = new Map();
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

  const filterCounts = useMemo(() => {
    const active = split.active;
    const archive = split.archive;

    const newCount = active.filter((b) => !b.status || b.status === "new").length;
    const confirmedCount = active.filter((b) => b.status === "confirmed").length;
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
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header + Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
            Записи
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Перегляд списком або через календар.
          </p>
        </div>

        <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("list")}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-semibold transition",
              tab === "list"
                ? "bg-black text-white"
                : "text-gray-700 hover:bg-gray-50",
            )}
          >
            Список
          </button>
          <button
            type="button"
            onClick={() => setTab("calendar")}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-semibold transition",
              tab === "calendar"
                ? "bg-black text-white"
                : "text-gray-700 hover:bg-gray-50",
            )}
          >
            Календар
          </button>
        </div>
      </div>

      {/* Filters (LIST only) */}
      {tab === "list" && (
        <Card className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: "Усі" },
              { key: "new", label: "Нові" },
              { key: "confirmed", label: "Підтверджені" },
              { key: "canceled", label: "Скасовані" },
              { key: "deleted", label: "Видалені" },
              { key: "archive", label: "Архів" },
            ].map((x) => (
              <Pill
                key={x.key}
                active={filter === x.key}
                count={filterCounts[x.key] ?? 0}
                onClick={() => setFilter(x.key)}
              >
                {x.label}
              </Pill>
            ))}
          </div>
        </Card>
      )}

      {/* Content */}
      {tab === "list" ? (
        keys.length === 0 ? (
          <Card className="p-8">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-gray-700">
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
          </Card>
        ) : (
          <div className="space-y-6">
            {keys.map((key) => (
              <section key={key} className="space-y-3">
                <div className="sticky top-0 z-10 -mx-2 bg-white/80 px-2 py-2 backdrop-blur">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
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

                    const statusMeta = isDeleted
                      ? {
                          label: "Видалено",
                          badge: "neutral",
                          dot: "bg-gray-500",
                        }
                      : isConfirmed
                        ? {
                            label: "Підтверджено",
                            badge: "success",
                            dot: "bg-emerald-600",
                          }
                        : isCanceled
                          ? {
                              label: "Скасовано",
                              badge: "danger",
                              dot: "bg-red-600",
                            }
                          : {
                              label: "Новий",
                              badge: "warning",
                              dot: "bg-amber-600",
                            };

                    return (
                      <Card
                        key={b.id}
                        className={cx("p-4 sm:p-5", isArchived && "bg-gray-50/50")}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base sm:text-lg font-bold text-gray-900">
                                {b.time}{" "}
                                <span className="text-gray-300 font-medium">•</span>{" "}
                                <span className="font-semibold">{b.serviceName}</span>
                              </p>

                              <Badge variant={statusMeta.badge}>
                                <IconDot className={statusMeta.dot} />
                                {statusMeta.label}
                              </Badge>

                              {isArchived && (
                                <Badge variant="info">
                                  <IconDot className="bg-blue-600" />
                                  СЕАНС ЗАВЕРШЕНО
                                </Badge>
                              )}
                            </div>

                            <div className="mt-3 grid gap-1 text-sm text-gray-600">
                              <p className="truncate">
                                <span className="text-gray-400">Клієнт:</span>{" "}
                                <span className="font-semibold text-gray-900">
                                  {b.clientName || "—"}
                                </span>
                              </p>

                              <p className="truncate">
                                <span className="text-gray-400">Тел:</span>{" "}
                                <a
                                  href={`tel:${b.clientPhone || ""}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-semibold text-blue-700 hover:underline"
                                >
                                  {b.clientPhone || "—"}
                                </a>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                            <div className="text-xs font-semibold text-gray-500">
                              {renderBookingDate(b)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
<GhostButton
  onClick={() => setDetailsId(b.id)}
  className="w-full sm:w-auto ui-button-secondary flex items-center justify-center gap-2"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
  Переглянути
</GhostButton>

                          <PrimaryButton
                            onClick={() => confirmBooking(b.id)}
                            disabled={isConfirmed || isCanceled || isArchived || isDeleted}
                            className="w-full sm:w-auto ui-button-primary"
                          >
                            Підтвердити
                          </PrimaryButton>

                          {!isCanceled ? (
                            <GhostButton
                              onClick={() => setCancelConfirmId(b.id)}
                              disabled={isCanceled || isArchived || isDeleted}
                              className="w-full sm:w-auto ui-button-cancel"
                            >
                              Скасувати
                            </GhostButton>
                          ) : (
<DangerButton
  onClick={() => setConfirmId(b.id)}
  disabled={isArchived || isDeleted}
  className="w-full sm:w-auto ui-button-danger flex items-center justify-center"
  title="Видалити"
  aria-label="Видалити"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
</DangerButton>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )
      ) : (
        // Calendar tab
<Card className="p-4 sm:p-5">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <h2 className="truncate text-lg sm:text-xl font-bold text-gray-900 capitalize">
        {monthLabelUA(activeMonth)}
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Натисни на день, щоб переглянути записи.
      </p>
    </div>

    <div className="flex items-center justify-between gap-2 sm:justify-end">
      <GhostButton
        onClick={() =>
          setActiveMonth(
            new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1),
          )
        }
        className="px-2 sm:px-3"
        title="Попередній місяць"
      >
        ←
      </GhostButton>

      <PrimaryButton
        onClick={() => setActiveMonth(startOfMonth(new Date()))}
        className="px-3 sm:px-4"
      >
        Сьогодні
      </PrimaryButton>

      <GhostButton
        onClick={() =>
          setActiveMonth(
            new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1),
          )
        }
        className="px-2 sm:px-3"
        title="Наступний місяць"
      >
        →
      </GhostButton>
    </div>
  </div>

  <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-gray-500">
    {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((x) => (
      <div key={x} className="px-1 text-center">
        {x}
      </div>
    ))}
  </div>

  <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
    {(() => {
      const start = startOfCalendarGrid(activeMonth);
      const totalDays = 42;
      const todayKey = toISODateKey(new Date());

      return Array.from({ length: totalDays }).map((_, i) => {
        const day = addDays(start, i);
        const key = toISODateKey(day);

        const isInMonth = day.getMonth() === activeMonth.getMonth();
        const isToday = key === todayKey;
        const isPastDay = key < todayKey; // ✅ все, що раніше сьогодні — сіре

        const bucket = bookingsByDateKey.get(key);
        const count = bucket?.count ?? 0;
        const newCount = bucket?.newCount ?? 0;

        return (
<button
  key={key}
  type="button"
  onClick={() => count > 0 && setCalendarDayKey(key)}
  disabled={count === 0}
  title={count > 0 ? `Записів: ${count}` : "Немає записів"}
  className={cx(
    "relative aspect-square sm:aspect-auto rounded-2xl border p-2 sm:p-3 transition-all duration-200 active:scale-[0.98]",
    isInMonth ? "bg-white" : "bg-gray-50",
    count > 0 ? "cursor-pointer" : "cursor-default opacity-70",
    isToday && "ring-2 ring-black/10",
    isPastDay
      ? "border-gray-200 bg-gray-100/70 text-gray-500 opacity-80 hover:opacity-90"
      : newCount > 0
        ? "border-amber-400 bg-amber-50/40 shadow-sm hover:border-amber-500 hover:shadow-md"
        : count > 0
          ? "border-gray-200 hover:border-gray-300 hover:shadow-sm"
          : "border-gray-100",
  )}
>


  {/* 💻 TABLET+ LAYOUT */}
{/* 📱 MOBILE: число зверху, бейдж знизу (той самий стиль) */}
<div className="flex h-full flex-col items-center justify-center sm:hidden">
  <span
    className={cx(
      "text-sm font-semibold",
      isInMonth ? "text-gray-900" : "text-gray-400",
      isPastDay && "text-gray-500",
    )}
  >
    {day.getDate()}
  </span>

  {count > 0 && (
    <span
      className={cx(
        "mt-1 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
        isPastDay
          ? "bg-gray-300 text-gray-700"
          : newCount > 0
            ? "bg-amber-500 text-white"
            : "bg-black text-white",
      )}
    >
      {count}
    </span>
  )}
</div>

{/* 💻 TABLET+: як було — число зліва, бейдж справа */}
<div className="hidden sm:flex items-start justify-between gap-2">
  <span
    className={cx(
      "text-sm font-semibold",
      isInMonth ? "text-gray-900" : "text-gray-400",
      isPastDay && "text-gray-500",
    )}
  >
    {day.getDate()}
  </span>

  {count > 0 && (
    <span
      className={cx(
        "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
        isPastDay
          ? "bg-gray-300 text-gray-700"
          : newCount > 0
            ? "bg-amber-500 text-white"
            : "bg-black text-white",
      )}
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
      <span className="h-2 w-2 rounded-full bg-black" />
      Є записи
    </span>
    <span className="inline-flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-amber-500" />
      Є нові записи
    </span>
    <span className="inline-flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-gray-400" />
      Минулі дні
    </span>
  </div>
</Card>
      )}

      {/* ===== Modals (unified) ===== */}

      {/* Delete confirm */}
      <Modal
        open={confirmId != null}
        onClose={() => setConfirmId(null)}
        title="Видалення запису"
        subtitle="Цю дію неможливо буде повернути."
        center
        maxWidth="max-w-md"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DangerButton
              onClick={() => {
                handleDelete(confirmId);
                setConfirmId(null);
              }}
            >
              Так, видалити
            </DangerButton>
            <GhostButton onClick={() => setConfirmId(null)}>Скасувати</GhostButton>
          </div>
        }
      >
        <div className="text-sm text-gray-700">
          Ви впевнені, що хочете видалити цей запис?
        </div>
      </Modal>

      {/* Cancel confirm */}
      <Modal
        open={cancelConfirmId != null}
        onClose={() => setCancelConfirmId(null)}
        title="Скасування запису"
        subtitle="Запис буде позначено як скасований."
        center
        maxWidth="max-w-md"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DangerButton
              onClick={() => {
                cancelBooking(cancelConfirmId);
                setCancelConfirmId(null);
              }}
            >
              Так, скасувати
            </DangerButton>
            <GhostButton onClick={() => setCancelConfirmId(null)}>Назад</GhostButton>
          </div>
        }
      >
        <div className="text-sm text-gray-700">
          Підтвердити скасування запису?
        </div>
      </Modal>

      {/* Details */}
<Modal
  open={detailsId != null && Boolean(selectedBooking)}
  onClose={() => setDetailsId(null)}
  title="Деталі запису"
  subtitle={selectedBooking ? `ID: ${selectedBooking.id}` : undefined}
  maxWidth="max-w-lg"
  center
  footer={
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <GhostButton 
      className="ui-button-cancel"
      onClick={() => setDetailsId(null)}
      >
        Закрити</GhostButton>
    </div>
  }
>
  {selectedBooking && (() => {
    const isCanceled = selectedBooking.status === "canceled";
    const isConfirmed = selectedBooking.status === "confirmed";
    const isDeleted = selectedBooking.status === "deleted";

    const dt = getBookingDateTime(selectedBooking);
    const isArchived = dt ? dt.getTime() < nowTs : false;

    const statusMeta = isDeleted
      ? { label: "Видалено", badge: "neutral", dot: "bg-gray-500" }
      : isConfirmed
        ? { label: "Підтверджено", badge: "success", dot: "bg-emerald-600" }
        : isCanceled
          ? { label: "Скасовано", badge: "danger", dot: "bg-red-600" }
          : { label: "Новий", badge: "warning", dot: "bg-amber-600" };

    const clientName = selectedBooking.clientName || "—";
    const phone = selectedBooking.clientPhone || "";
    const service = selectedBooking.serviceName || "—";
    const time = selectedBooking.time || "—";

    return (
      <div className="space-y-4">
        {/* Top summary */}
        <div className="rounded-3xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Запис
              </p>

              <h3 className="mt-1 text-xl font-black tracking-tight text-gray-900">
                {time} <span className="text-gray-300 font-medium">•</span>{" "}
                <span className="font-extrabold">{service}</span>
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                {renderBookingDate(selectedBooking)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusMeta.badge}>
                <IconDot className={statusMeta.dot} />
                {statusMeta.label}
              </Badge>

              {isArchived && (
                <Badge variant="info">
                  <IconDot className="bg-blue-600" />
                  СЕАНС ЗАВЕРШЕНО
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Клієнт
            </p>
            <p className="mt-2 text-base font-bold text-gray-900">{clientName}</p>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {phone ? phone : "—"}
              </span>

              {phone && (
                <>
                </>
              )}
            </div>
          </div>
        </div>


        {/* Optional: compact meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span>
            Створено:{" "}
            <span className="font-semibold text-gray-700">
              {selectedBooking.createdAt
                ? new Date(selectedBooking.createdAt).toLocaleString("uk-UA")
                : "—"}
            </span>
          </span>


        </div>
      </div>
    );
  })()}
</Modal>

      {/* Calendar day bookings list */}
<Modal
  open={Boolean(calendarDayKey)}
  onClose={() => setCalendarDayKey(null)}
  title={calendarDayKey ? `Записи на ${formatDateUA(calendarDayKey)}` : "Записи"}
  subtitle={
    calendarDayKey
      ? `Всього: ${bookingsByDateKey.get(calendarDayKey)?.count ?? 0}`
      : undefined
  }
  maxWidth="max-w-2xl"
  center
>
        {calendarDayKey && (
          <div className="space-y-3">
            {(() => {
              const n = bookingsByDateKey.get(calendarDayKey)?.newCount ?? 0;
              if (!n) return null;
            })()}

            {(bookingsByDateKey.get(calendarDayKey)?.items || []).map((b) => {
              const isCanceled = b.status === "canceled";
              const isConfirmed = b.status === "confirmed";
              const dt = getBookingDateTime(b);
              const isArchived = dt ? dt.getTime() < nowTs : false;

              const badgeVariant = isArchived
                ? "info"
                : isConfirmed
                  ? "success"
                  : isCanceled
                    ? "danger"
                    : "warning";

              const dotCls = isArchived
                ? "bg-blue-600"
                : isConfirmed
                  ? "bg-emerald-600"
                  : isCanceled
                    ? "bg-red-600"
                    : "bg-amber-600";

              const label = isArchived
                ? "Архів"
                : isConfirmed
                  ? "Підтверджено"
                  : isCanceled
                    ? "Скасовано"
                    : "Новий";

              return (
                <Card key={b.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-bold text-gray-900">
                        {b.time} • {b.serviceName}
                      </p>
                      <p className="mt-1 truncate text-sm text-gray-600">
                        {b.clientName || "—"} •{" "}
                        <a
                          href={`tel:${b.clientPhone || ""}`}
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          {b.clientPhone || "—"}
                        </a>
                      </p>
                    </div>

                    <Badge variant={badgeVariant}>
                      <IconDot className={dotCls} />
                      {label}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                    {/* <GhostButton
                      onClick={() => setDetailsId(b.id)}
                      className="w-full sm:w-auto ui-button-secondary"
                    >
                      Деталі
                    </GhostButton> */}

                    <PrimaryButton
                      onClick={() => confirmBooking(b.id)}
                      disabled={isConfirmed || isCanceled || isArchived}
                      className="w-full sm:w-auto ui-button-primary"
                    >
                      Підтвердити
                    </PrimaryButton>

                    {!isCanceled ? (
                      <GhostButton
                        onClick={() => cancelBooking(b.id)}
                        disabled={isCanceled || isArchived}
                        className="w-full sm:w-auto ui-button-cancel"
                      >
                        Скасувати
                      </GhostButton>
                    ) : (
                      <DangerButton
                        onClick={() => setConfirmId(b.id)}
                        disabled={isArchived}
                        className="w-full sm:w-auto"
                      >
                        Видалити
                      </DangerButton>
                    )}
                  </div>
                </Card>
              );
            })}

            {(bookingsByDateKey.get(calendarDayKey)?.count ?? 0) === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                На цей день записів немає.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}