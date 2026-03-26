// Bookings.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  List,
  CalendarDays,
  Eye,
  Check,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

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

function IconButton({ variant = "secondary", className = "", children, ...props }) {
  const variants = {
    secondary:
      "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-800",
    danger: "bg-red-50 border border-red-200 text-red-500 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-xl p-2.5 transition-all duration-200 active:scale-95",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Badge({ variant = "neutral", children, className = "" }) {
  const styles = {
    neutral: "border-stone-200 bg-stone-100 text-stone-600",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    danger: "border-red-200 bg-red-50 text-red-600",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
    dark: "border-stone-800 bg-stone-800 text-white",
  };

  return (
    <span
      className={cn(
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
  return <span className={cn("h-1.5 w-1.5 rounded-full", className)} />;
}

function Pill({ active, count, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition active:scale-[0.98]",
        active
          ? "border-emerald-700 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm"
          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50",
      )}
    >
      <span>{children}</span>
      <span
        className={cn(
          "inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-xs font-bold",
          active
            ? "bg-white text-emerald-700"
            : "bg-stone-100 text-stone-600",
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
  size = "md",
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";

      const handleEscape = (e) => {
        if (e.key === "Escape") onClose?.();
      };

      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEscape);
      };
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/40 p-4 backdrop-blur-sm sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cn(
          "relative my-8 w-full overflow-hidden rounded-3xl bg-white shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-50/80 to-transparent" />

        <div className="relative border-b border-stone-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-600">
                {title}
              </p>
              {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              aria-label="Закрити"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-6 py-6">
          {children}
        </div>

        {footer && (
          <div className="border-t border-stone-100 bg-stone-50/50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
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

function BookingCardSkeleton() {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SkeletonBlock className="h-6 w-52 rounded-lg" />
            <SkeletonBlock className="h-6 w-28 rounded-full" />
          </div>

          <div className="mt-3 grid gap-2">
            <SkeletonBlock className="h-4 w-48 max-w-full" />
            <SkeletonBlock className="h-4 w-40 max-w-full" />
          </div>
        </div>

        <SkeletonBlock className="h-4 w-24 rounded-lg" />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        <SkeletonBlock className="h-10 w-full rounded-2xl sm:w-32" />
        <SkeletonBlock className="h-10 w-full rounded-2xl sm:w-32" />
        <SkeletonBlock className="h-10 w-full rounded-2xl sm:w-32" />
      </div>
    </div>
  );
}

function BookingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <SkeletonBlock className="mb-3 h-8 w-44" />
        <SkeletonBlock className="mb-2 h-12 w-64" />
        <SkeletonBlock className="h-5 w-96 max-w-full" />
      </div>

      <div className="flex gap-2">
        <SkeletonBlock className="h-11 w-28 rounded-2xl" />
        <SkeletonBlock className="h-11 w-28 rounded-2xl" />
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <SkeletonBlock className="h-10 w-20 rounded-full" />
          <SkeletonBlock className="h-10 w-24 rounded-full" />
          <SkeletonBlock className="h-10 w-36 rounded-full" />
          <SkeletonBlock className="h-10 w-28 rounded-full" />
        </div>
      </div>

      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, groupIndex) => (
          <section key={groupIndex} className="space-y-3">
            <SkeletonBlock className="h-6 w-32 rounded-lg" />
            <div className="space-y-3">
              <BookingCardSkeleton />
              <BookingCardSkeleton />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function Bookings() {
  const { bookings, confirmBooking, cancelBooking, deleteBooking, loading } =
    useBookings();

  const [confirmId, setConfirmId] = useState(null);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [tab, setTab] = useState("list");
  const [activeMonth, setActiveMonth] = useState(() => startOfMonth(new Date()));
  const [calendarDayKey, setCalendarDayKey] = useState(null);
  const [filter, setFilter] = useState("all");

  const DELETED_STORE_KEY = "bookings_deleted_store_v1";

  const [deletedStore, setDeletedStore] = useState(() => {
    try {
      const raw = localStorage.getItem(DELETED_STORE_KEY);
      if (!raw) return new Map();
      const arr = JSON.parse(raw);
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
      //
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

  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

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

    return base;
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

  if (loading) {
    return <BookingsSkeleton />;
  }

  return (
    <div className="min-h-screen ">
      <div className="mx-auto max-w-6xl space-y-6 ">
        {/* Header */}
<div className="relative mb-6 overflow-hidden rounded-3xl border border-stone-200/60 bg-white p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]">
  {/* top accent */}
  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-60" />

  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    {/* left */}
    <div className="min-w-0">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1.5">
        <Sparkles className="h-4 w-4 text-amber-600" />
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
          Записи клієнтів
        </span>
      </div>

      <h1 className="text-3xl font-black tracking-tight text-stone-800 sm:text-4xl">
        Записи
      </h1>

      <p className="mt-2 max-w-xl text-sm text-stone-600 sm:text-base">
        Перегляд записів списком або через календар у зручному форматі.
      </p>
    </div>

    {/* right tabs */}
<div className="inline-flex self-center sm:self-start rounded-2xl border border-stone-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => setTab("list")}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition sm:px-4 sm:py-2.5 sm:text-sm",
          tab === "list"
            ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-[0_10px_24px_rgba(74,93,78,0.18)]"
            : "text-stone-600 hover:bg-stone-50",
        )}
      >
        <List className="h-4 w-4" />
        Список
      </button>

      <button
        type="button"
        onClick={() => setTab("calendar")}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition sm:px-4 sm:py-2.5 sm:text-sm",
          tab === "calendar"
            ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white "
            : "text-stone-600 hover:bg-stone-50",
        )}
      >
        <CalendarDays className="h-4 w-4" />
        Календар
      </button>
    </div>
  </div>
</div>

        {/* Filters */}
        {tab === "list" && (
          <SectionCard title="Фільтри" subtitle="Швидке сортування записів">
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
          </SectionCard>
        )}

        {/* Content */}
        {tab === "list" ? (
          keys.length === 0 ? (
            <SectionCard title="Порожньо" subtitle="У цій вкладці записів немає">
              <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
                  <CalendarDays className="h-6 w-6 text-stone-400" />
                </div>
                <p className="text-sm text-stone-500">Немає записів у цій вкладці</p>
                <p className="mt-1 text-xs text-stone-400">
                  Змініть фільтр або дочекайтесь нових бронювань
                </p>
              </div>
            </SectionCard>
          ) : (
            <div className="space-y-6">
              {keys.map((key) => (
                <section key={key} className="space-y-3">
                  <div className="sticky top-0 z-10 -mx-2 bg-stone-50/85 px-2 py-2 backdrop-blur">
                    <h2 className="text-base font-bold text-stone-800 sm:text-lg">
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
                            dot: "bg-stone-500",
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
                        <div
                          key={b.id}
                          className={cn(
                            "group rounded-3xl border border-stone-200 bg-white p-4 transition-all hover:border-amber-200 hover:shadow-md hover:shadow-amber-500/5 sm:p-5",
                            isArchived && "bg-stone-50/60",
                          )}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-bold text-stone-800 sm:text-lg">
                                  {b.time}{" "}
                                  <span className="font-medium text-stone-300">•</span>{" "}
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

                              <div className="mt-3 grid gap-1 text-sm text-stone-500">
                                <p className="truncate">
                                  <span className="text-stone-400">Клієнт:</span>{" "}
                                  <span className="font-semibold text-stone-800">
                                    {b.clientName || "—"}
                                  </span>
                                </p>

                                <p className="truncate">
                                  <span className="text-stone-400">Тел:</span>{" "}
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

                            <div className="text-xs font-semibold text-stone-400">
                              {renderBookingDate(b)}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                            <Button
                              variant="secondary"
                              onClick={() => setDetailsId(b.id)}
                              className="w-full sm:w-auto"
                            >
                              <Eye className="h-4 w-4" />
                              Переглянути
                            </Button>

                            <Button
                              variant="primary"
                              onClick={() => confirmBooking(b.id)}
                              disabled={
                                isConfirmed || isCanceled || isArchived || isDeleted
                              }
                              className="w-full sm:w-auto"
                            >
                              <Check className="h-4 w-4" />
                              Підтвердити
                            </Button>

                            {!isCanceled ? (
                              <Button
                                variant="secondary"
                                onClick={() => setCancelConfirmId(b.id)}
                                disabled={isCanceled || isArchived || isDeleted}
                                className="w-full sm:w-auto"
                              >
                                Скасувати
                              </Button>
                            ) : (
                              <Button
                                variant="danger"
                                onClick={() => setConfirmId(b.id)}
                                disabled={isArchived || isDeleted}
                                className="w-full sm:w-auto"
                                title="Видалити"
                                aria-label="Видалити"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
          <SectionCard
            title="Календар записів"
            subtitle="Натисни на день, щоб переглянути записи."
           actions={
  <div className="flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-end">
    <IconButton
      onClick={() =>
        setActiveMonth(
          new Date(
            activeMonth.getFullYear(),
            activeMonth.getMonth() - 1,
            1,
          ),
        )
      }
      title="Попередній місяць"
    >
      <ChevronLeft className="h-4 w-4" />
    </IconButton>

    <Button
      variant="primary"
      onClick={() => setActiveMonth(startOfMonth(new Date()))}
    >
      Сьогодні
    </Button>

    <IconButton
      onClick={() =>
        setActiveMonth(
          new Date(
            activeMonth.getFullYear(),
            activeMonth.getMonth() + 1,
            1,
          ),
        )
      }
      title="Наступний місяць"
    >
      <ChevronRight className="h-4 w-4" />
    </IconButton>
  </div>
}
            badge={monthLabelUA(activeMonth)}
          >
            <div className="grid grid-cols-7 gap-1.5 text-[11px] font-semibold text-stone-500 sm:gap-2 sm:text-xs">
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
                  const isPastDay = key < todayKey;

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
                      className={cn(
                        "relative aspect-square rounded-[20px] border p-2 transition-all duration-200 active:scale-[0.98] sm:aspect-auto sm:p-3",
                        isInMonth ? "bg-white" : "bg-stone-50/60",
                        count > 0 ? "cursor-pointer" : "cursor-default opacity-70",
                        isToday && "ring-2 ring-emerald-500/20",
                        isPastDay
                          ? "border-stone-200 bg-stone-100 text-stone-400 opacity-80 hover:opacity-90"
                          : newCount > 0
                            ? "border-amber-200 bg-amber-50 shadow-sm hover:border-amber-300 hover:shadow-md"
                            : count > 0
                              ? "border-stone-200 hover:border-stone-300 hover:shadow-sm"
                              : "border-stone-100",
                      )}
                    >
                      <div className="flex h-full flex-col items-center justify-center sm:hidden">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            isInMonth ? "text-stone-800" : "text-stone-400",
                            isPastDay && "text-stone-400",
                          )}
                        >
                          {day.getDate()}
                        </span>

                        {count > 0 && (
                          <span
                            className={cn(
                              "mt-1 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                              isPastDay
                                ? "bg-stone-300 text-stone-500"
                                : newCount > 0
                                  ? "bg-amber-500 text-white"
                                  : "bg-emerald-700 text-white",
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </div>

                      <div className="hidden sm:flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            isInMonth ? "text-stone-800" : "text-stone-400",
                            isPastDay && "text-stone-400",
                          )}
                        >
                          {day.getDate()}
                        </span>

                        {count > 0 && (
                          <span
                            className={cn(
                              "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                              isPastDay
                                ? "bg-stone-300 text-stone-500"
                                : newCount > 0
                                  ? "bg-amber-500 text-white"
                                  : "bg-emerald-700 text-white",
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

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-stone-500">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-700" />
                Є записи
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Є нові записи
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-stone-400" />
                Минулі дні
              </span>
            </div>
          </SectionCard>
        )}

        {/* Delete confirm */}
        <Modal
          open={confirmId != null}
          onClose={() => setConfirmId(null)}
          title="Видалення запису"
          subtitle="Цю дію неможливо буде повернути."
          size="sm"
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => setConfirmId(null)}
              >
                Скасувати
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  handleDelete(confirmId);
                  setConfirmId(null);
                }}
              >
                Так, видалити
              </Button>
            </div>
          }
        >
          <div className="text-sm text-stone-500">
            Ви впевнені, що хочете видалити цей запис?
          </div>
        </Modal>

        {/* Cancel confirm */}
        <Modal
          open={cancelConfirmId != null}
          onClose={() => setCancelConfirmId(null)}
          title="Скасування запису"
          subtitle="Запис буде позначено як скасований."
          size="sm"
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => setCancelConfirmId(null)}
              >
                Назад
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  cancelBooking(cancelConfirmId);
                  setCancelConfirmId(null);
                }}
              >
                Так, скасувати
              </Button>
            </div>
          }
        >
          <div className="text-sm text-stone-500">
            Підтвердити скасування запису?
          </div>
        </Modal>

        {/* Details */}
        <Modal
          open={detailsId != null && Boolean(selectedBooking)}
          onClose={() => setDetailsId(null)}
          title="Деталі запису"
          subtitle={selectedBooking ? `ID: ${selectedBooking.id}` : undefined}
          size="md"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDetailsId(null)}>
                Закрити
              </Button>
            </div>
          }
        >
          {selectedBooking &&
            (() => {
              const isCanceled = selectedBooking.status === "canceled";
              const isConfirmed = selectedBooking.status === "confirmed";
              const isDeleted = selectedBooking.status === "deleted";

              const dt = getBookingDateTime(selectedBooking);
              const isArchived = dt ? dt.getTime() < nowTs : false;

              const statusMeta = isDeleted
                ? { label: "Видалено", badge: "neutral", dot: "bg-stone-500" }
                : isConfirmed
                  ? {
                      label: "Підтверджено",
                      badge: "success",
                      dot: "bg-emerald-600",
                    }
                  : isCanceled
                    ? { label: "Скасовано", badge: "danger", dot: "bg-red-600" }
                    : { label: "Новий", badge: "warning", dot: "bg-amber-600" };

              const clientName = selectedBooking.clientName || "—";
              const phone = selectedBooking.clientPhone || "";
              const service = selectedBooking.serviceName || "—";
              const time = selectedBooking.time || "—";

              return (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-stone-200 bg-gradient-to-b from-amber-50/70 to-white p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                          Запис
                        </p>

                        <h3 className="mt-1 text-xl font-black tracking-tight text-stone-800">
                          {time} <span className="font-medium text-stone-300">•</span>{" "}
                          <span className="font-extrabold">{service}</span>
                        </h3>

                        <p className="mt-2 text-sm text-stone-500">
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

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-stone-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                        Клієнт
                      </p>
                      <p className="mt-2 text-base font-bold text-stone-800">
                        {clientName}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-stone-500">
                          {phone ? phone : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                    <span>
                      Створено:{" "}
                      <span className="font-semibold text-stone-600">
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

        {/* Calendar day bookings */}
        <Modal
          open={Boolean(calendarDayKey)}
          onClose={() => setCalendarDayKey(null)}
          title={
            calendarDayKey ? `Записи на ${formatDateUA(calendarDayKey)}` : "Записи"
          }
          subtitle={
            calendarDayKey
              ? `Всього: ${bookingsByDateKey.get(calendarDayKey)?.count ?? 0}`
              : undefined
          }
          size="lg"
        >
          {calendarDayKey && (
            <div className="space-y-3">
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
                  <div
                    key={b.id}
                    className="rounded-2xl border border-stone-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-bold text-stone-800">
                          {b.time} • {b.serviceName}
                        </p>
                        <p className="mt-1 truncate text-sm text-stone-500">
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
                      <Button
                        variant="primary"
                        onClick={() => confirmBooking(b.id)}
                        disabled={isConfirmed || isCanceled || isArchived}
                        className="w-full sm:w-auto"
                      >
                        Підтвердити
                      </Button>

                      {!isCanceled ? (
                        <Button
                          variant="secondary"
                          onClick={() => cancelBooking(b.id)}
                          disabled={isCanceled || isArchived}
                          className="w-full sm:w-auto"
                        >
                          Скасувати
                        </Button>
                      ) : (
                        <Button
                          variant="danger"
                          onClick={() => setConfirmId(b.id)}
                          disabled={isArchived}
                          className="w-full sm:w-auto"
                        >
                          Видалити
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {(bookingsByDateKey.get(calendarDayKey)?.count ?? 0) === 0 && (
                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-6 text-sm text-stone-500">
                  На цей день записів немає.
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}