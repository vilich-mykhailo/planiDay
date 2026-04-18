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
  AlertTriangle,
} from "lucide-react";
import { useBookings } from "../../context/bookings/useBookings";
import { socket } from "../../lib/socket";

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

function getStatusUi(status, isArchived = false, canceledBy = null) {
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
    const canceledText =
      canceledBy === "client" ? "Скасовано клієнтом" : "Скасовано вами";

    return {
      text: canceledText,
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

      <div className="border-b border-stone-100 px-5 py-4">
        {/* TOP ROW */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="!text-[26px] font-bold tracking-tight text-stone-800">
                {title}
              </h2>

              {badge && (
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  {badge}
                </span>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex items-center shrink-0">{actions}</div>
          )}
        </div>

        {/* SUBTITLE */}
        {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
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
    md: "sm:max-w-lg lg:max-w-xl",
    lg: "sm:max-w-xl lg:max-w-2xl",
  };

  return (
    <div
      className="fixed inset-0 z-[950] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-[8px] sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cn(
          "relative w-full max-h-[90vh] overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-[0_35px_120px_rgba(15,23,42,0.24)]",
          "animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-3 duration-200",
          "sm:max-h-[92vh]",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.10),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-amber-50/70 via-orange-50/40 to-transparent" />
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-200/15 blur-3xl" />

        {/* header */}
        <div className="relative border-b border-stone-100/80 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-600">
                {title}
              </p>

              {subtitle && (
                <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200/80 bg-white/80 text-stone-400 backdrop-blur transition-all duration-200 hover:bg-stone-100 hover:text-stone-700 active:scale-95"
              aria-label="Закрити"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* content */}
        <div className="relative max-h-[calc(90vh-76px)] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          {children}
        </div>

        {/* footer */}
        {footer && (
          <div className="relative border-t border-stone-100/80 bg-stone-50/70 px-4 py-3 sm:px-5 sm:py-4">
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

export default function Bookings() {
const {
  bookings,
  confirmBooking,
  cancelBooking,
  deleteBooking,
  loading,
} = useBookings();

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
  const [socketState, setSocketState] = useState(
    socket.connected ? "ok" : "offline",
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [expandedCalendarCards, setExpandedCalendarCards] = useState({});
const [showLoadingSkeleton, setShowLoadingSkeleton] = useState(false);

useEffect(() => {
  const timer = window.setTimeout(() => {
    setShowLoadingSkeleton(Boolean(loading));
  }, loading ? 300 : 0);

  return () => window.clearTimeout(timer);
}, [loading]);

  useEffect(() => {
    if (detailsId == null && calendarDayKey == null) return;

    const scrollY = window.scrollY;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    return () => {
      const y = Math.abs(parseInt(document.body.style.top || "0", 10));

      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";

      window.scrollTo(0, y);
    };
  }, [detailsId, calendarDayKey]);

useEffect(() => {
  const studioId = localStorage.getItem("studioId");
  const userId = localStorage.getItem("userId");
  let offlineTimerId = null;

  const joinRooms = () => {
    if (userId) socket.emit("auth:join", { userId, studioId, role: "owner" });
    if (studioId) socket.emit("join:studio", { studioId });
    setSocketState("ok");
  };

  const handleConnect = () => joinRooms();
  const handleDisconnect = () => setSocketState("offline");

  const handleBookingUpdated = (payload) => {
    if (!payload || String(payload.studioId) !== String(studioId)) return;

    setIsRefreshing(true);
    setSocketState("pending");

    window.clearTimeout(handleBookingUpdated._t);
    handleBookingUpdated._t = window.setTimeout(() => {
      setIsRefreshing(false);
      setSocketState(socket.connected ? "ok" : "offline");
    }, 800);
  };

  const handleNotificationNew = (payload) => {
    if (!payload || String(payload.studioId) !== String(studioId)) return;
    console.log("Нове повідомлення:", payload);
  };

  if (socket.connected) {
    joinRooms();
  } else {
    offlineTimerId = window.setTimeout(() => {
      setSocketState("offline");
    }, 0);
  }

  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("booking:updated", handleBookingUpdated);
  socket.on("notification:new", handleNotificationNew);

  return () => {
    socket.off("connect", handleConnect);
    socket.off("disconnect", handleDisconnect);
    socket.off("booking:updated", handleBookingUpdated);
    socket.off("notification:new", handleNotificationNew);
    window.clearTimeout(handleBookingUpdated._t);
    window.clearTimeout(offlineTimerId);
  };
}, []);

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
  const liveStatusUi = useMemo(() => {
    if (socketState === "pending" || isRefreshing) {
      return {
        text: "Оновлення...",
        dotClass: "live-indicator live-indicator--pending",
        wrapClass: "border-amber-200 bg-amber-50 text-amber-700",
      };
    }

    if (socketState === "offline") {
      return {
        text: "Немає інтернету",
        dotClass: "live-indicator live-indicator--offline",
        wrapClass: "border-red-200 bg-red-50 text-red-700",
      };
    }

    return {
      text: "Оновлюється автоматично",
      dotClass: "live-indicator live-indicator--ok",
      wrapClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }, [socketState, isRefreshing]);


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

  return (
    <div className="min-h-screen ">
      <div className="mx-auto max-w-6xl space-y-6 ">
        {/* Header */}
        <div className="relative mb-3 overflow-hidden rounded-3xl border border-stone-200/60 bg-white p-3.5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]">
          {/* top accent */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-60" />

          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            {/* left */}
            <div className="relative">
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
          <SectionCard
            title="Фільтри"
            subtitle="Швидке сортування записів"
            actions={
              <div className="flex items-center">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                    liveStatusUi.wrapClass,
                  )}
                >
                  <span className={liveStatusUi.dotClass} />
                  {liveStatusUi.text}
                </div>
              </div>
            }
          >
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
  showLoadingSkeleton ? (
    <SectionCard title="Записи" subtitle="Завантажуємо дані...">
      <div className="space-y-3">
        <BookingCardSkeleton />
        <BookingCardSkeleton />
        <BookingCardSkeleton />
      </div>
    </SectionCard>
  ) : loading ? null : keys.length === 0 ? (
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

                          const statusUi = getStatusUi(
                            statusKey,
                            isArchived,
                            b.canceledBy,
                          );

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
                                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 shadow-sm transition-all duration-200 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.98]"
                                    >
                                      <Eye className="h-4 w-4" />
                                      Переглянути
                                    </button>

                                    {!isConfirmed &&
                                      !isCanceled &&
                                      !isArchived &&
                                      !isDeleted && (
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
                                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(16,185,129,0.22)] transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98]"
                                        >
                                          <Check className="h-4 w-4" />
                                          Підтвердити
                                        </button>
                                      )}

                                    {!isCanceled && (
                                      <button
                                        type="button"
                                        onClick={() => setCancelConfirmId(b.id)}
                                        disabled={
                                          isCanceled || isArchived || isDeleted
                                        }
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 px-4 text-sm font-bold text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.08)] transition-all duration-200 hover:from-rose-100 hover:to-red-100 active:scale-[0.98]"
                                      >
                                        Скасувати запис
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
) : showLoadingSkeleton ? (
  <SectionCard
    title="Календар записів"
    subtitle="Завантажуємо дані..."
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
      {Array.from({ length: 42 }).map((_, i) => (
        <SkeletonBlock key={i} className="aspect-square rounded-[20px]" />
      ))}
    </div>
  </SectionCard>
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
          title="Підтвердження видалення"
          subtitle="Цю дію не можна скасувати"
          size="sm"
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => setConfirmId(null)}
                className="w-full sm:w-auto"
              >
                Назад
              </Button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await handleDelete(confirmId);
                    setConfirmId(null);
                  } catch (e) {
                    alert(e.message || "Не вдалося видалити запис");
                  }
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 px-4 py-2.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(220,38,38,0.24)] transition-all duration-200 hover:from-red-700 hover:to-rose-800 active:scale-[0.98] sm:w-auto"
              >
                <Trash2 className="h-4 w-4" />
                Так, видалити
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-300/30 blur-2xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-[0_16px_36px_rgba(220,38,38,0.22)]">
                  <Trash2 className="h-7 w-7" />
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-black tracking-tight text-stone-900">
                Видалити запис?
              </h3>
            </div>

            <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-3.5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-red-700">Увага</p>
                  <p className="mt-1 text-xs leading-5 text-red-600/90">
                    Видалений запис не можна буде повернути назад.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Cancel confirm */}
        <Modal
          open={cancelConfirmId != null}
          onClose={() => setCancelConfirmId(null)}
          title="Підтвердження скасування"
          subtitle="Запис отримає статус скасованого"
          size="sm"
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => setCancelConfirmId(null)}
                className="w-full sm:w-auto"
              >
                Назад
              </Button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await cancelBooking(cancelConfirmId);
                    setCancelConfirmId(null);
                  } catch (e) {
                    alert(e.message || "Не вдалося скасувати запис");
                  }
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(217,119,6,0.24)] transition-all duration-200 hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] sm:w-auto"
              >
                <XCircle className="h-4 w-4" />
                Так, скасувати
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-amber-300/30 blur-2xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_16px_36px_rgba(217,119,6,0.22)]">
                  <XCircle className="h-7 w-7" />
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-black tracking-tight text-stone-900">
                Скасувати запис?
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Запис залишиться в системі, але буде позначений як скасований і
                більше не вважатиметься активним.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3.5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-700">
                    Після скасування
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-700/90">
                    Клієн отримає статус скасованого.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Details */}
        {/* Details */}
        {selectedBooking && detailsId != null && (
          <div
            className="fixed inset-0 z-[220] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-[8px]"
            onClick={() => {
              setDetailsId(null);
              setCopiedPhone(false);
            }}
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-[0_35px_120px_rgba(15,23,42,0.24)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.10),transparent_28%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-amber-50/80 via-stone-50/50 to-transparent" />
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/20 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-200/15 blur-3xl" />

              {(() => {
                const isCanceled = selectedBooking.status === "canceled";
                const isConfirmed = selectedBooking.status === "confirmed";
                const isDeleted = selectedBooking.status === "deleted";
                console.log("selectedBooking modal:", selectedBooking);
                const dt = getBookingDateTime(selectedBooking);
                const isArchived = dt ? dt.getTime() < nowTs : false;

                const statusMeta = isDeleted
                  ? {
                      label: "Видалено",
                      badge: "neutral",
                      dot: "bg-stone-500",
                      ring: "from-stone-500 to-stone-700",
                    }
                  : isArchived
                    ? {
                        label: "Завершено",
                        badge: "info",
                        dot: "bg-blue-600",
                        ring: "from-blue-500 to-sky-600",
                      }
                    : isConfirmed
                      ? {
                          label: "Підтверджено",
                          badge: "success",
                          dot: "bg-emerald-600",
                          ring: "from-emerald-500 to-emerald-700",
                        }
                      : isCanceled
                        ? {
                            label:
                              selectedBooking.canceledBy === "client"
                                ? "Скасовано клієнтом"
                                : "Скасовано вами",
                            badge: "danger",
                            dot: "bg-red-600",
                            ring: "from-red-500 to-rose-700",
                          }
                        : {
                            label: "Очікує підтвердження",
                            badge: "warning",
                            dot: "bg-amber-600",
                            ring: "from-amber-500 to-orange-600",
                          };

                const clientName = selectedBooking.clientName || "—";
                const phone = selectedBooking.clientPhone || "";
                const service = selectedBooking.serviceName || "—";
                const time = selectedBooking.time || "—";
                const price =
                  selectedBooking.price ??
                  selectedBooking.servicePrice ??
                  selectedBooking.totalPrice ??
                  null;

                const duration =
                  selectedBooking.duration ??
                  selectedBooking.serviceDuration ??
                  selectedBooking.durationMinutes ??
                  null;
                const masterName =
                  selectedBooking.masterName ||
                  selectedBooking.staffName ||
                  selectedBooking.employeeName ||
                  "—";

                return (
                  <div className="relative px-5 pb-4 pt-2 sm:px-6 sm:pb-5 sm:pt-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setDetailsId(null);
                          setCopiedPhone(false);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200/80 bg-white/80 text-stone-400 backdrop-blur transition-all duration-200 hover:bg-stone-100 hover:text-stone-700 active:scale-95"
                        aria-label="Закрити"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 sm:mt-4 flex justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-amber-300/20 blur-2xl" />
                        <div
                          className={cn(
                            "relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]",
                            statusMeta.ring,
                          )}
                        >
                          {isDeleted ? (
                            <Trash2 className="h-8 w-8" />
                          ) : isArchived ? (
                            <CheckCheck className="h-8 w-8" />
                          ) : isCanceled ? (
                            <X className="h-8 w-8" />
                          ) : isConfirmed ? (
                            <Check className="h-8 w-8" />
                          ) : (
                            <Clock className="h-8 w-8" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-5 text-center">
                      <h2 className="text-[28px] font-black leading-[1.05] tracking-[-0.04em] text-stone-900">
                        {service}
                      </h2>

                      <div className="mt-3 flex justify-center">
                        <Badge variant={statusMeta.badge}>
                          <IconDot className={statusMeta.dot} />
                          {statusMeta.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-4 overflow-hidden rounded-[28px] border border-stone-200/80 bg-white/95 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur">
                      <div className="h-[3px] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

                      <div className="p-3 sm:p-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                                <CalendarDays className="h-4.5 w-4.5" />
                              </div>

                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                                  Дата
                                </p>
                                <p className="mt-1 text-sm font-black text-stone-900">
                                  {renderBookingDate(selectedBooking) || "—"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                                <Clock3 className="h-4.5 w-4.5" />
                              </div>

                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                                  Час
                                </p>
                                <p className="mt-1 text-sm font-black text-stone-900">
                                  {time || "—"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
                                <BadgeCheck className="h-4.5 w-4.5" />
                              </div>

                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                                  Ціна
                                </p>
                                <p className="mt-1 text-sm font-black text-stone-900">
                                  {price != null ? `${price} грн` : "—"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
                                <Clock className="h-4.5 w-4.5" />
                              </div>

                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                                  Тривалість
                                </p>
                                <p className="mt-1 text-sm font-black text-stone-900">
                                  {duration != null ? `${duration} хв` : "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 space-y-3">
                          <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm">
                                <UserRound className="h-4.5 w-4.5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                                  Клієнт
                                </p>
                                <p className="mt-1 text-sm font-black text-stone-900 break-words">
                                  {clientName}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm">
                                <Phone className="h-4.5 w-4.5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                                  Телефон клієнта
                                </p>
                                <p className="mt-1 text-sm font-black text-stone-900 break-all">
                                  {phone || "—"}
                                </p>
                              </div>

                              {phone ? (
                                <button
                                  type="button"
                                  onClick={() => handleCopyPhone(phone)}
                                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 active:scale-[0.98]"
                                  aria-label="Скопіювати телефон"
                                  title="Скопіювати телефон"
                                >
                                  {copiedPhone ? (
                                    <CheckCheck className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              ) : null}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm">
                                <Scissors className="h-4.5 w-4.5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                                  Майстер
                                </p>
                                <p className="mt-1 text-sm font-black text-stone-900 break-words">
                                  {masterName}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {phone ? (
                        <a
                          href={`tel:${phone}`}
                          className="group inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-[0_12px_28px_rgba(16,185,129,0.10)] active:scale-[0.98]"
                        >
                          <Phone className="h-4 w-4" />
                          Дзвінок
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setDetailsId(null);
                            setCopiedPhone(false);
                          }}
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition-all duration-200 hover:bg-stone-50 active:scale-[0.98]"
                        >
                          Закрити
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setDetailsId(null);
                          setCopiedPhone(false);
                        }}
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 text-sm font-bold text-white shadow-[0_14px_34px_rgba(16,185,129,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-[0_18px_40px_rgba(16,185,129,0.30)] active:scale-[0.98]"
                      >
                        Готово
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Calendar day bookings */}
        {calendarDayKey && (
          <div
            className="fixed inset-0 z-[220] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-[8px]"
            onClick={() => {
              setCalendarDayKey(null);
              setExpandedCalendarCards({});
            }}
          >
            <div
              className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-[0_35px_120px_rgba(15,23,42,0.24)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.10),transparent_28%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-amber-50/80 via-stone-50/50 to-transparent" />
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/20 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-200/15 blur-3xl" />

              <div className="relative px-5 pb-4 pt-2 sm:px-6 sm:pb-5 sm:pt-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarDayKey(null);
                      setExpandedCalendarCards({});
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200/80 bg-white/80 text-stone-400 backdrop-blur transition-all duration-200 hover:bg-stone-100 hover:text-stone-700 active:scale-95"
                    aria-label="Закрити"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2 sm:mt-4 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-amber-300/20 blur-2xl" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]">
                      <CalendarDays className="h-8 w-8" />
                    </div>
                  </div>
                </div>

                <div className="mt-3 sm:mt-5 text-center">
                  <h2 className="text-[28px] font-black leading-[1.05] tracking-[-0.04em] text-stone-900">
                    Записи на {formatDateUA(calendarDayKey)}
                  </h2>

                  <div className="mt-3 flex justify-center">
                    <Badge variant="success">
                      <IconDot className="bg-emerald-600" />
                      Всього:{" "}
                      {bookingsByDateKey.get(calendarDayKey)?.count ?? 0}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 sm:mt-4 max-h-[68vh] overflow-y-auto rounded-[26px] border border-stone-200/80 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
                  <div className="h-[3px] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

                  <div className="space-y-3 p-3.5">
                    {(bookingsByDateKey.get(calendarDayKey)?.items || []).map(
                      (b) => {
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
                              ring: "from-stone-500 to-stone-700",
                              card: "bg-stone-50",
                            }
                          : isArchived
                            ? {
                                label: "Завершено",
                                badge: "info",
                                dot: "bg-blue-600",
                                ring: "from-blue-500 to-sky-600",
                                card: "bg-blue-50/60",
                              }
                            : isConfirmed
                              ? {
                                  label: "Підтверджено",
                                  badge: "success",
                                  dot: "bg-emerald-600",
                                  ring: "from-emerald-500 to-emerald-700",
                                  card: "bg-emerald-50/60",
                                }
                              : isCanceled
                                ? {
                                    label:
                                      b.canceledBy === "client"
                                        ? "Скасовано клієнтом"
                                        : "Скасовано вами",
                                    badge: "danger",
                                    dot: "bg-red-600",
                                    ring: "from-red-500 to-rose-700",
                                    card: "bg-red-50/60",
                                  }
                                : {
                                    label: "Очікує підтвердження",
                                    badge: "warning",
                                    dot: "bg-amber-600",
                                    ring: "from-amber-500 to-orange-600",
                                    card: "bg-amber-50/70",
                                  };

                        const masterName =
                          b.masterName ||
                          b.staffName ||
                          b.employeeName ||
                          "Довільний майстер";

                        return (
                          <div
                            key={b.id}
                            className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.08)]"
                          >
                            <div className={cn("p-4 sm:p-5", statusMeta.card)}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg font-black tracking-tight text-stone-900">
                                      {b.serviceName || "Послуга"}
                                    </h3>

                                    <Badge variant={statusMeta.badge}>
                                      <IconDot className={statusMeta.dot} />
                                      {statusMeta.label}
                                    </Badge>
                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-stone-800">
                                    <span>{formatDateUA(calendarDayKey)}</span>
                                    <span className="text-stone-400">•</span>
                                    <span className="inline-flex items-center gap-1.5">
                                      <Clock3 className="h-4 w-4 text-stone-500" />
                                      {b.time || "—"}
                                    </span>
                                  </div>

                                  <p className="mt-2 text-sm text-stone-600">
                                    Клієнт:{" "}
                                    <span className="font-semibold text-stone-800">
                                      {b.clientName || "—"}
                                    </span>
                                  </p>
                                </div>

                                <div
                                  className={cn(
                                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)]",
                                    statusMeta.ring,
                                  )}
                                >
                                  {isDeleted ? (
                                    <Trash2 className="h-5 w-5" />
                                  ) : isArchived ? (
                                    <CheckCheck className="h-5 w-5" />
                                  ) : isCanceled ? (
                                    <X className="h-5 w-5" />
                                  ) : isConfirmed ? (
                                    <Check className="h-5 w-5" />
                                  ) : (
                                    <Clock className="h-5 w-5" />
                                  )}
                                </div>
                              </div>

                              <div className="mt-4">
                                <button
                                  type="button"
                                  onClick={() => toggleCalendarCard(b.id)}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50 active:scale-[0.98]"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-4 w-4" />
                                      Сховати деталі
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4" />
                                      Розгорнути деталі
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="border-t border-stone-100 p-4 sm:p-5">
                                <div className="space-y-3">
                                  {(b.price != null || b.duration != null) && (
  <div className="grid grid-cols-2 gap-2">
    
    {b.price != null && (
      <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-500">
          <BadgeCheck className="h-4 w-4" />
        </div>

        <div className="leading-tight">
          <p className="text-[10px] font-semibold uppercase text-stone-500">
            Ціна
          </p>
          <p className="text-sm font-bold text-stone-900">
            {b.price} грн
          </p>
        </div>
      </div>
    )}

    {b.duration != null && (
      <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-500">
          <Clock3 className="h-4 w-4" />
        </div>

        <div className="leading-tight">
          <p className="text-[10px] font-semibold uppercase text-stone-500">
            Тривалість
          </p>
          <p className="text-sm font-bold text-stone-900">
            {b.duration} хв
          </p>
        </div>
      </div>
    )}

  </div>
)}
                                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    
                                    <div className="flex items-start gap-3 rounded-2xl bg-stone-50 p-3.5">
                                      
                                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm">
                                        <UserRound className="h-5 w-5" />
                                      </div>

                                      <div className="min-w-0">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                                          Клієнт
                                        </p>
                                        <p className="mt-1 text-sm font-black text-stone-900">
                                          {b.clientName || "—"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-2xl bg-stone-50 p-3.5">
                                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm">
                                        <Scissors className="h-5 w-5" />
                                      </div>

                                      <div className="min-w-0">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                                          Майстер
                                        </p>
                                        <p className="mt-1 text-sm font-black text-stone-900">
                                          {masterName}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {b.clientPhone && (
                                    <div className="flex items-start gap-3 rounded-2xl bg-stone-50 p-3.5">
                                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm">
                                        <Phone className="h-5 w-5" />
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                                          Телефон клієнта
                                        </p>
                                        <p className="mt-1 text-sm font-black text-stone-900">
                                          {b.clientPhone}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                              <div className="mt-4 flex items-center justify-end gap-2 flex-wrap">
                                    {!isConfirmed &&
                                      !isCanceled &&
                                      !isArchived &&
                                      !isDeleted && (
                                        <Button
                                          variant="primary"
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
                                          className="w-full h-10 px-4 rounded-full flex items-center gap-2 text-sm font-semibold sm:w-auto"
                                        >
                                          <Check className="h-4 w-4" />
                                          Підтвердити
                                        </Button>
                                      )}

                                    {!isCanceled ? (
                                      <button
                                        type="button"
                                        onClick={() => setCancelConfirmId(b.id)}
                                        disabled={
                                          isCanceled || isArchived || isDeleted
                                        }
                                        className="h-10 px-4 rounded-full flex items-center gap-2 text-sm font-semibold
                                          border border-rose-200 bg-white text-rose-600
                                          transition-all duration-200
                                          hover:bg-rose-50 hover:border-rose-300
                                          active:scale-[0.98]
                                          disabled:opacity-50"
                                      >
                                        <XCircle className="h-4 w-4" />
                                        Скасувати
                                      </button>
                                    ) : (
                                      <Button
                                        variant="danger"
                                        onClick={() => setConfirmId(b.id)}
                                        disabled={isArchived || isDeleted}
                                        className="w-full sm:w-auto"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Видалити запис
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}

                    {(bookingsByDateKey.get(calendarDayKey)?.count ?? 0) ===
                      0 && (
                      <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-6 text-center text-sm text-stone-500">
                        На цей день записів немає.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
