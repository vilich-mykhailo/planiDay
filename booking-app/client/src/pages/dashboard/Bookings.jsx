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
  CheckCheck,
  XCircle,
  Clock,
  UserRound,
  Phone,
  Copy,
  Scissors,
  Clock3,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
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

function getStatusUi(status, isArchived = false) {
  if (status === "deleted") {
    return {
      text: "Видалено",
      icon: Trash2,
      badge: "bg-stone-200 text-stone-700",
      button:
        "bg-stone-700 shadow-[0_10px_24px_rgba(68,64,60,0.22)] hover:bg-stone-800",
      side: "border-stone-200",
      time: "text-stone-700",
    };
  }

  if (isArchived) {
    return {
      text: "Завершено",
      icon: CheckCheck,
      badge: "bg-sky-100 text-sky-700",
      button:
        "bg-sky-600 shadow-[0_10px_24px_rgba(2,132,199,0.25)] hover:bg-sky-700",
      side: "border-sky-200/80",
      time: "text-sky-700",
    };
  }

  if (status === "confirmed") {
    return {
      text: "Підтверджено",
      icon: Check,
      badge: "bg-emerald-100 text-emerald-700",
      button:
        "bg-emerald-600 shadow-[0_10px_24px_rgba(5,150,105,0.28)] hover:bg-emerald-700",
      side: "border-emerald-200/80",
      time: "text-emerald-700",
    };
  }

  if (status === "canceled") {
    return {
      text: "Скасовано",
      icon: XCircle,
      badge: "bg-red-100 text-red-700",
      button:
        "bg-red-600 shadow-[0_10px_24px_rgba(220,38,38,0.28)] hover:bg-red-700",
      side: "border-red-200/80",
      time: "text-red-700",
    };
  }

  return {
    text: "Очікує ваше підтвердження",
    icon: Clock,
    badge: "bg-[#FFE7D6] text-[#D85A00]",
    button:
      "bg-[#D85A00] shadow-[0_10px_24px_rgba(216,90,0,0.32)] hover:bg-[#C24F00]",
    side: "border-[#FFD2B3]",
    time: "text-[#D85A00]",
  };
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
      "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:shadow-emerald-500/35 hover:from-emerald-700 hover:to-emerald-800",
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

function IconButton({
  variant = "secondary",
  className = "",
  children,
  ...props
}) {
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
          active ? "bg-white text-emerald-700" : "bg-stone-100 text-stone-600",
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
    if (!open) return;

    const scrollY = window.scrollY;

    // фіксуємо позицію
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);

      // повертаємо скрол назад
      const y = Math.abs(parseInt(document.body.style.top || "0", 10));

      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";

      window.scrollTo(0, y);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: "sm:max-w-md",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
  };

  return (
    <div
      className="fixed inset-0 z-950 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm sm:p-6 "
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cn(
          "relative w-full max-h-[90vh] overflow-hidden bg-white  shadow-2xl",
          "animate-in fade-in-0 slide-in-from-bottom duration-200",
          "rounded-3xl sm:h-auto sm:max-h-[92vh]",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-50/80 to-transparent" />

        <div className="relative border-b border-stone-100 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-bold uppercase tracking-[0.12em] text-amber-600">
              {title}
            </p>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-200 hover:text-stone-700 active:scale-95"
              aria-label="Закрити"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {subtitle && <p className="text-[11px] text-stone-500">{subtitle}</p>}
        </div>

        <div className="max-h-[calc(90vh-64px)] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          {children}
        </div>

        {footer && (
          <div className="border-t border-stone-100 bg-stone-50/50 px-4 py-3 sm:px-5 sm:py-4">
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
  const [activeMonth, setActiveMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [calendarDayKey, setCalendarDayKey] = useState(null);
  const [filter, setFilter] = useState("all");
  const DELETED_STORE_KEY = "bookings_deleted_store_v1";

  const [copiedPhone, setCopiedPhone] = useState(false);
const [expandedCalendarCards, setExpandedCalendarCards] = useState({});
  async function handleCopyPhone(value) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedPhone(true);
      window.setTimeout(() => setCopiedPhone(false), 1600);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedPhone(true);
      window.setTimeout(() => setCopiedPhone(false), 1600);
    }
  }

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

    if (filter === "new") {
      return base.filter((b) => !b.status || b.status === "new");
    }

    if (filter === "confirmed") {
      return base.filter((b) => b.status === "confirmed");
    }

    if (filter === "canceled") {
      return base.filter((b) => b.status === "canceled");
    }

    return base;
  }, [filter, split, deletedList]);

  const [collapsedGroupsByFilter, setCollapsedGroupsByFilter] = useState({});

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

  const collapsedGroups = useMemo(() => {
    const saved = collapsedGroupsByFilter[filter];

    // якщо для цього фільтра ще нічого не зберігали —
    // значить усі групи мають бути згорнуті
    if (!(saved instanceof Set)) {
      return new Set(keys);
    }

    const visibleKeys = new Set(keys);
    return new Set([...saved].filter((key) => visibleKeys.has(key)));
  }, [collapsedGroupsByFilter, filter, keys]);

  function toggleGroup(key) {
    setCollapsedGroupsByFilter((prev) => {
      const current =
        prev[filter] instanceof Set ? new Set(prev[filter]) : new Set(keys);

      if (current.has(key)) {
        current.delete(key);
      } else {
        current.add(key);
      }

      return {
        ...prev,
        [filter]: current,
      };
    });
  }

function toggleCalendarCard(id) {
  setExpandedCalendarCards((prev) => ({
    ...prev,
    [id]: !prev[id],
  }));
}

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

  async function handleDelete(id) {
    const snap =
      (bookings || []).find((b) => b.id === id) || deletedStore.get(id) || null;

    if (snap) {
      setDeletedStore((prev) => {
        const next = new Map(prev);
        next.set(id, { ...snap, status: "deleted" });
        return next;
      });
    }

    await deleteBooking(id);
  }

  if (loading) {
    return <BookingsSkeleton />;
  }

  return (
    <div className="min-h-screen ">
      <div className="mx-auto max-w-6xl space-y-6 ">
        {/* Header */}
        <div className="relative mb-3 overflow-hidden rounded-3xl border border-stone-200/60 bg-white p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]">
          {/* top accent */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-60" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* left */}
            <div className="min-w-0">
              <div className="mb- inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1.5">
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
            <SectionCard
              title="Порожньо"
              subtitle="У цій вкладці записів немає"
            >
              <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
                  <CalendarDays className="h-6 w-6 text-stone-400" />
                </div>
                <p className="text-sm text-stone-500">
                  Немає записів у цій вкладці
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  Змініть фільтр або дочекайтесь нових бронювань
                </p>
              </div>
            </SectionCard>
          ) : (
            <div className="space-y-2">
              {keys.map((key) => {
                const isCollapsed = collapsedGroups.has(key);
                const items = grouped.map[key] || [];

                return (
                  <section
                    key={key}
                    className="overflow-hidden rounded-[28px] border border-stone-200/70 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(key)}
                      className="flex w-full items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/80 px-4 py-4 text-left transition hover:bg-stone-100/70 sm:px-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-black text-stone-800 sm:text-lg">
                            {renderGroupTitle(key)}
                          </h2>

                          <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-stone-600 border border-stone-200">
                            {items.length}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-stone-500 sm:text-sm">
                          {isCollapsed
                            ? "Натисни, щоб розгорнути записи"
                            : "Натисни, щоб згорнути записи"}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-600">
                        {isCollapsed ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronUp className="h-5 w-5" />
                        )}
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="space-y-3 p-3 sm:p-4">
                        {items.map((b) => {
                          const isCanceled = b.status === "canceled";
                          const isConfirmed = b.status === "confirmed";
                          const isDeleted = b.status === "deleted";

                          const dt = getBookingDateTime(b);
                          const isArchived = dt ? dt.getTime() < nowTs : false;

                          const statusKey = isDeleted
                            ? "deleted"
                            : isCanceled
                              ? "canceled"
                              : isConfirmed
                                ? "confirmed"
                                : "new";

                          const statusUi = getStatusUi(statusKey, isArchived);

                          const dtObj = getBookingDateTime(b);
                          const monthLabel = dtObj
                            ? dtObj.toLocaleDateString("uk-UA", {
                                month: "long",
                              })
                            : "";
                          const dayLabel = dtObj
                            ? dtObj.toLocaleDateString("uk-UA", {
                                day: "numeric",
                              })
                            : "";
                          const timeLabel = b.time || "";

                          return (
                            <div
                              key={b.id}
                              className={cn(
                                "rounded-[28px] border border-stone-200/70 bg-white p-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:border-amber-200 hover:shadow-[0_14px_34px_rgba(245,158,11,0.08)] sm:p-4",
                                isArchived && "bg-stone-50/70",
                              )}
                            >
                              <div className="relative grid grid-cols-[1fr_auto] gap-3">
                                <div className="min-w-0">
                                  <div
                                    className={cn(
                                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold",
                                      statusUi.badge,
                                    )}
                                  >
                                    <statusUi.icon className="h-3.5 w-3.5" />
                                    {statusUi.text}
                                  </div>

                                  <h3 className="mt-3 line-clamp-2 text-[18px] font-black leading-[1.05] tracking-[-0.03em] text-stone-900">
                                    {b.serviceName || "Послуга"}
                                  </h3>

                                  <div className="mt-1 flex min-w-0 items-center gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-100">
                                      <UserRound className="h-3.5 w-3.5 text-stone-400" />
                                    </div>

                                    <p className="truncate text-[15px] font-medium text-stone-800">
                                      {b.clientName || "Клієнт"}
                                    </p>
                                  </div>

                                  {b.clientPhone && (
                                    <p className="mt-2 text-[13px] text-stone-500">
                                      телефон:{" "}
                                      <a
                                        href={`tel:${b.clientPhone}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="font-medium text-stone-700 hover:underline"
                                      >
                                        {b.clientPhone}
                                      </a>
                                    </p>
                                  )}

                                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                    <button
                                      type="button"
                                      onClick={() => setDetailsId(b.id)}
                                      className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] border border-stone-200 bg-white px-4 text-[15px] font-black text-stone-700 transition-all duration-200 hover:bg-stone-50 active:scale-[0.98]"
                                    >
                                      <Eye className="h-4 w-4" />
                                      Переглянути
                                    </button>

                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await confirmBooking(b.id);
                                        } catch (e) {
                                          alert(
                                            e.message ||
                                              "Не вдалося підтвердити запис",
                                          );
                                        }
                                      }}
                                      disabled={
                                        isConfirmed ||
                                        isCanceled ||
                                        isArchived ||
                                        isDeleted
                                      }
                                      className={cn(
                                        "inline-flex h-12 items-center justify-center gap-2 rounded-[14px] px-4 text-[15px] font-black text-white transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
                                        "bg-emerald-600 shadow-[0_10px_24px_rgba(5,150,105,0.28)] hover:bg-emerald-700",
                                      )}
                                    >
                                      <Check className="h-4 w-4" />
                                      Підтвердити
                                    </button>

                                    {!isCanceled && (
                                      <button
                                        type="button"
                                        onClick={() => setCancelConfirmId(b.id)}
                                        disabled={
                                          isCanceled || isArchived || isDeleted
                                        }
                                        className="inline-flex h-12 items-center justify-center rounded-[14px] border border-red-200 bg-red-50 px-4 text-[14px] font-bold text-red-700 transition-all duration-200 hover:bg-red-100 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50"
                                      >
                                        Скасувати
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {isCanceled && !isArchived && !isDeleted && (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmId(b.id)}
                                    disabled={isArchived || isDeleted}
                                    className="absolute right-[92px] top-0 inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600  transition hover:scale-110 hover:bg-red-50 hover:text-red-700 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                                    aria-label="Видалити запис"
                                    title="Видалити"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                )}

                                <div
                                  className={cn(
                                    "relative flex min-w-[78px] flex-col items-center justify-center border-l pl-3 text-center",
                                    statusUi.side,
                                  )}
                                >
                                  <span className="text-[14px] font-medium capitalize text-stone-600">
                                    {monthLabel}
                                  </span>

                                  <span className="mt-1 text-[28px] font-light leading-none tracking-[-0.05em] text-stone-900">
                                    {dayLabel}
                                  </span>

                                  <span
                                    className={cn(
                                      "mt-2 text-[16px] font-semibold",
                                      statusUi.time,
                                    )}
                                  >
                                    {timeLabel}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
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
                        count > 0
                          ? "cursor-pointer"
                          : "cursor-default opacity-70",
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
                <span className="h-2 w-2 rounded-full bg-emerald-700" />Є записи
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />Є нові
                записи
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
              <Button variant="secondary" onClick={() => setConfirmId(null)}>
                Скасувати
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    await handleDelete(confirmId);
                    setConfirmId(null);
                  } catch (e) {
                    alert(e.message || "Не вдалося видалити запис");
                  }
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
                onClick={async () => {
                  try {
                    await cancelBooking(cancelConfirmId);
                    setCancelConfirmId(null);
                  } catch (e) {
                    alert(e.message || "Не вдалося скасувати запис");
                  }
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
          onClose={() => {
            setDetailsId(null);
            setCopiedPhone(false);
          }}
          title="Деталі запису"
          subtitle={
            selectedBooking?.createdAt
              ? `Створено: ${new Date(selectedBooking.createdAt).toLocaleString("uk-UA")}`
              : undefined
          }
          size="md"
        >
          {selectedBooking &&
            (() => {
              const isCanceled = selectedBooking.status === "canceled";
              const isConfirmed = selectedBooking.status === "confirmed";
              const isDeleted = selectedBooking.status === "deleted";

              const dt = getBookingDateTime(selectedBooking);
              const isArchived = dt ? dt.getTime() < nowTs : false;

              const statusMeta = isDeleted
                ? {
                    label: "Видалено",
                    badge: "neutral",
                    dot: "bg-stone-500",
                    ring: "from-stone-400/20 to-stone-100",
                    iconBg: "bg-stone-100 text-stone-600",
                  }
                : isArchived
                  ? {
                      label: "Сеанс завершено",
                      badge: "info",
                      dot: "bg-blue-600",
                      ring: "from-blue-500/20 to-blue-50",
                      iconBg: "bg-blue-100 text-blue-700",
                    }
                  : isConfirmed
                    ? {
                        label: "Підтверджено",
                        badge: "success",
                        dot: "bg-emerald-600",
                        ring: "from-emerald-500/20 to-emerald-50",
                        iconBg: "bg-emerald-100 text-emerald-700",
                      }
                    : isCanceled
                      ? {
                          label: "Скасовано",
                          badge: "danger",
                          dot: "bg-red-600",
                          ring: "from-red-500/20 to-red-50",
                          iconBg: "bg-red-100 text-red-700",
                        }
                      : {
                          label: "Очікує підтвердження",
                          badge: "warning",
                          dot: "bg-amber-600",
                          ring: "from-amber-500/20 to-amber-50",
                          iconBg: "bg-amber-100 text-amber-700",
                        };

              const clientName = selectedBooking.clientName || "—";
              const phone = selectedBooking.clientPhone || "";
              const service = selectedBooking.serviceName || "—";
              const time = selectedBooking.time || "—";
              const masterName =
                selectedBooking.masterName ||
                selectedBooking.staffName ||
                selectedBooking.employeeName ||
                "—";

              return (
                <div className="space-y-3">
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-[28px] border border-stone-200 p-5 sm:p-6",
                      "bg-gradient-to-br",
                      statusMeta.ring,
                    )}
                  >
                    <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/40 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-white/30 blur-2xl" />

                    <div className="relative flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
<div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
  <span>Запис</span>

</div>

                          <h3 className="mt-2 text-2xl font-black leading-tight tracking-tight text-stone-900">
                            {service}
                          </h3>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge variant={statusMeta.badge}>
                              <IconDot className={statusMeta.dot} />
                              {statusMeta.label}
                            </Badge>
                          </div>
                        </div>

                        <div
                          className={cn(
                            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm",
                            statusMeta.iconBg,
                          )}
                        >
                          {isDeleted ? (
                            <Trash2 className="h-7 w-7" />
                          ) : isArchived ? (
                            <CheckCheck className="h-7 w-7" />
                          ) : isCanceled ? (
                            <X className="h-7 w-7" />
                          ) : isConfirmed ? (
                            <Check className="h-7 w-7" />
                          ) : (
                            <Clock className="h-7 w-7" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 backdrop-blur">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                            <CalendarDays className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                              Дата і час
                            </p>

                            <div className="mt-0.5 flex items-center gap-2 text-sm font-bold text-stone-800">
                              <span>{renderBookingDate(selectedBooking)}</span>

                              <span className="text-stone-400">•</span>

                              <span className="flex items-center gap-1 ">
                                <Clock3 className="h-4 w-4" />
                                {time}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.08)]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                          <UserRound className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                            Клієнт
                          </p>
                          <p className="truncate text-base font-black text-stone-900">
                            {clientName}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50/70 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                              Номер телефону
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold text-stone-800">
                              {phone || "—"}
                            </p>
                          </div>

                          {phone ? (
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(phone)}
                              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 active:scale-[0.98]"
                            >
                              {copiedPhone ? (
                                <>
                                  <CheckCheck className="h-4 w-4" />
                                  Скопійовано
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  Копіювати
                                </>
                              )}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.08)]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                          <Scissors className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                            Послуга
                          </p>
                          <p className="truncate text-base font-black text-stone-900">
                            {service}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50/70 p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-700 border border-stone-200">
                            <UserRound className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                              Майстер
                            </p>
                            <p className="truncate text-sm font-semibold text-stone-800">
                              {masterName}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
        </Modal>

        {/* Calendar day bookings */}
        <Modal
          open={Boolean(calendarDayKey)}
          onClose={() => {
  setCalendarDayKey(null);
  setExpandedCalendarCards({});
}}
          title={
            calendarDayKey
              ? `Записи на ${formatDateUA(calendarDayKey)}`
              : "Записи"
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
      const isDeleted = b.status === "deleted";
      const dt = getBookingDateTime(b);
      const isArchived = dt ? dt.getTime() < nowTs : false;
const isExpanded = !!expandedCalendarCards[b.id];
      const statusMeta = isDeleted
        ? {
            label: "Видалено",
            badge: "neutral",
            dot: "bg-stone-500",
            ring: "from-stone-400/20 to-stone-100",
            iconBg: "bg-stone-100 text-stone-600",
          }
        : isArchived
          ? {
              label: "Сеанс завершено",
              badge: "info",
              dot: "bg-blue-600",
              ring: "from-blue-500/20 to-blue-50",
              iconBg: "bg-blue-100 text-blue-700",
            }
          : isConfirmed
            ? {
                label: "Підтверджено",
                badge: "success",
                dot: "bg-emerald-600",
                ring: "from-emerald-500/20 to-emerald-50",
                iconBg: "bg-emerald-100 text-emerald-700",
              }
            : isCanceled
              ? {
                  label: "Скасовано",
                  badge: "danger",
                  dot: "bg-red-600",
                  ring: "from-red-500/20 to-red-50",
                  iconBg: "bg-red-100 text-red-700",
                }
              : {
                  label: "Очікує підтвердження",
                  badge: "warning",
                  dot: "bg-amber-600",
                  ring: "from-amber-500/20 to-amber-50",
                  iconBg: "bg-amber-100 text-amber-700",
                };

      const masterName =
        b.masterName || b.staffName || b.employeeName || "Довільний майстер";

      return (
<div
  key={b.id}
  className="overflow-hidden rounded-[26px] border border-stone-200 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.08)]"
>
  <div
    className={cn(
      "relative overflow-hidden border-b border-stone-100 bg-gradient-to-br p-4 sm:p-5",
      statusMeta.ring,
    )}
  >
    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/40 blur-2xl" />
    <div className="pointer-events-none absolute -bottom-10 -left-8 h-20 w-20 rounded-full bg-white/30 blur-2xl" />

    <div className="relative flex items-start justify-between gap-3">
<div className="min-w-0">
  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
    <span>Запис</span>

    <span className="text-stone-300">•</span>

<span
  className={cn(
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm",
    isArchived
      ? "border-sky-200 bg-sky-50 text-sky-700"
      : isConfirmed
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : isCanceled
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
  )}
>
  <span
    className={cn(
      "h-1.5 w-1.5 rounded-full",
      isArchived
        ? "bg-sky-500"
        : isConfirmed
          ? "bg-emerald-500"
          : isCanceled
            ? "bg-red-500"
            : "bg-amber-500",
    )}
  />
  {b.time || "—"}
</span>
  </div>

  <h3 className="mt-2 text-lg font-black leading-tight tracking-tight text-stone-900 sm:text-xl">
    {b.serviceName || "Послуга"}
  </h3>

  <div className="mt-3 flex flex-wrap items-center gap-2">
    <Badge variant={statusMeta.badge}>
      <IconDot className={statusMeta.dot} />
      {statusMeta.label}
    </Badge>
  </div>
</div>

      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm",
          statusMeta.iconBg,
        )}
      >
        {isDeleted ? (
          <Trash2 className="h-6 w-6" />
        ) : isArchived ? (
          <CheckCheck className="h-6 w-6" />
        ) : isCanceled ? (
          <X className="h-6 w-6" />
        ) : isConfirmed ? (
          <Check className="h-6 w-6" />
        ) : (
          <Clock className="h-6 w-6" />
        )}
      </div>
    </div>

  </div>

<div className="border-b border-stone-100 px-4 py-3">
  <button
    type="button"
    onClick={() => toggleCalendarCard(b.id)}
    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50 active:scale-[0.98]"
  >
    {isExpanded ? (
      <>
        <ChevronUp className="h-4 w-4" />
        Сховати
      </>
    ) : (
      <>
        <ChevronDown className="h-4 w-4" />
        Розгорнути
      </>
    )}
  </button>
</div>

  <div className={cn("p-4 sm:p-5", !isExpanded && "hidden")}>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-[22px] border border-stone-200 bg-stone-50/70 p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700">
            <UserRound className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              Клієнт
            </p>
            <p className="truncate text-sm font-bold text-stone-800">
              {b.clientName || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[22px] border border-stone-200 bg-stone-50/70 p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700">
            <Scissors className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              Майстер
            </p>
            <p className="truncate text-sm font-bold text-stone-800">
              {masterName}
            </p>
          </div>
        </div>
      </div>
    </div>

<div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
  {b.clientPhone && (
    <div className="hidden rounded-[22px] border border-stone-200 bg-stone-50/70 p-3.5 sm:block">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700">
            <Phone className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              Телефон клієнта
            </p>
            <a
              href={`tel:${b.clientPhone}`}
              className="mt-0.5 block truncate text-sm font-bold text-stone-800 hover:underline"
            >
              {b.clientPhone}
            </a>
          </div>
        </div>
      </div>
    </div>
  )}

  <div className="rounded-[22px] border border-stone-200 bg-stone-50/70 p-3.5">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700">
        <Clock3 className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          Час запису
        </p>
        <p className="mt-0.5 text-sm font-bold text-stone-800">
          {b.time || "—"}
        </p>
      </div>
    </div>
  </div>
</div>
<div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
  {b.clientPhone ? (
    <div className="rounded-[22px] border border-stone-200 bg-stone-50/70 p-3.5 sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700">
            <Phone className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              Телефон клієнта
            </p>
            <a
              href={`tel:${b.clientPhone}`}
              className="mt-0.5 block truncate text-sm font-bold text-stone-800 hover:underline"
            >
              {b.clientPhone}
            </a>
          </div>
        </div>
      </div>
    </div>
  ) : null}


</div>

    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
      <Button
        variant="primary"
        onClick={async () => {
          try {
            await confirmBooking(b.id);
          } catch (e) {
            alert(e.message || "Не вдалося підтвердити запис");
          }
        }}
        disabled={isConfirmed || isCanceled || isArchived || isDeleted}
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
          className="w-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100 sm:w-auto"
        >
          Скасувати
        </Button>
      ) : (
        <Button
          variant="danger"
          onClick={() => setConfirmId(b.id)}
          disabled={isArchived || isDeleted}
          className="w-full sm:w-auto"
        >
          <Trash2 className="h-4 w-4" />
          Видалити
        </Button>
      )}
    </div>
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
