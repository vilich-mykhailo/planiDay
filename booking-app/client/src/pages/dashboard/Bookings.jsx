import { useEffect, useMemo, useRef, useState } from "react";
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
  BadgeCheck,
  FolderClock,
  XCircle,
  Clock,
    MapPin,
  Scissors,
  Clock3,
  CheckCheck,
  UserRound,
  Phone,
  Copy,
  Banknote,
  Timer,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Users,
  UserPlus,
  CircleUser,
  CircleCheck,
  CopyCheck,
  ListTodo,
  CalendarCheck,
  ClipboardPen,
  PhoneCall,
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

function formatDateLongUA(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";

  const formatted = d.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return formatted.replace(" р.", "р.");
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
  const base =
  "border border-[#eadbc9] bg-white shadow-sm";

  if (isArchived) {
    return {
      text: "Завершено",
      icon: CalendarCheck,
      badge: `${base} text-[#64748b]`,
      button:
        "bg-[var(--color-archived)] text-white hover:bg-[var(--color-archived-dark)]",
      side: "border-[var(--color-archived-light)]",
      time: "text-[var(--color-archived)]",
    };
  }

  if (status === "confirmed") {
    return {
      text: "Підтверджено",
      icon: CheckCheck,
      badge: `${base} text-[#16a34a]`,
      button:
        "bg-[var(--color-confirmed)] text-white hover:bg-[var(--color-confirmed-dark)]",
      side: "border-[var(--color-confirmed-light)]",
      time: "text-[var(--color-confirmed)]",
    };
  }

  if (status === "canceled") {
    const canceledText =
      canceledBy === "client" ? "Скасовано клієнтом" : "Скасовано вами";

    return {
      text: canceledText,
      icon: XCircle,
     badge: `${base} text-[#dc2626]`,
      button:
        "bg-[var(--color-canceled)] text-white hover:bg-[var(--color-canceled-dark)]",
      side: "border-[var(--color-canceled-light)]",
      time: "text-[var(--color-canceled)]",
    };
  }

  return {
    text: "Очікує підтвердження",
    icon: Clock,
    badge: `${base} text-[#ff5a00]`,
    button:
      "bg-[var(--color-pending)] text-white hover:bg-[var(--color-pending-dark)]",
    side: "border-[var(--color-pending-light)]",
    time: "text-[var(--color-pending)]",
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
  const hasHeader = Boolean(title || subtitle || badge || actions);

  return (
    <section
      className={cn(
      "group relative overflow-hidden rounded-[32px] border border-[#ebe7df] bg-white shadow-[0_14px_44px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      {hasHeader && (
        <>
         <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

          <div className="border-b border-[var(--color-cream)] px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                {(title || badge) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {title && (
                      <h2 className="text-[26px] font-bold tracking-tight text-[var(--color-ink)]">
                        {title}
                      </h2>
                    )}

                    {badge && (
                      <span className="inline-flex items-center rounded-full bg-[var(--color-cream)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-ink)]">
                        {badge}
                      </span>
                    )}
                  </div>
                )}

                {subtitle && (
                  <p className="mt-2 text-sm text-[var(--color-caramel)]">
                    {subtitle}
                  </p>
                )}
              </div>

              {actions && (
                <div className="flex w-full items-center justify-center sm:w-auto sm:justify-end">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </>
      )}

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
    "bg-[#ff5a00] text-white hover:bg-[#ef4f00]",
  secondary:
    "border border-[#eadbc9] bg-white text-[#202020] hover:border-[#ffd6bd] hover:bg-[#fff7f0]",
  danger:
    "border border-[#ffd8d8] bg-[#fff7f7] text-[#e5484d] hover:border-[#e5484d] hover:bg-[#fff1f1]",
  ghost: "text-[#77716b] hover:bg-[#fff7f0] hover:text-[#202020]",
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
"inline-flex items-center justify-center gap-2 font-black transition-all duration-200",
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
    "border border-[#eadbc9] bg-white text-[#77716b] hover:bg-[#fff7f0] hover:text-[#202020]",
  danger:
    "border border-[#ffd8d8] bg-[#fff7f7] text-[#e5484d] hover:bg-[#fff1f1]",
};

  return (
    <button
      type="button"
      className={cn(
    "inline-flex items-center justify-center rounded-xl p-2.5 transition-all duration-200 active:scale-95 hover:shadow-sm",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Pill({ active, count, showCount = false, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
      active
  ? "inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-[#ff5a00] bg-[#ff5a00] px-2 text-sm font-bold text-white  transition-all duration-200 hover:bg-[#ef4f00] active:scale-[0.98]"
          : "inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-[#eadbc9] bg-white px-2 text-sm font-bold text-[#202020] shadow-sm transition-all duration-200 hover:border-[#ffd6bd] hover:bg-[#fff7f0] active:scale-[0.98]",
      )}
    >
      <span>{children}</span>

      {showCount && (
        <span
          className={cn(
            "text-[11px] font-medium tracking-tight",
            active
             ? "text-white/80"
: "text-[#ff5a00]"
          )}
        >
          +{count ?? 0}
        </span>
      )}
    </button>
  );
}

const emptyBookingInfo = {
  all: {
    icon: CalendarDays,
    title: "Поки що немає записів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Тут зʼявляться всі активні записи клієнтів.</span>
        <span>Нові бронювання автоматично додаватимуться у список.</span>
      </span>
    ),
  },

  new: {
    icon: CircleCheck,
    title: "Поки що немає нових записів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Тут зʼявляться записи, які очікують підтвердження.</span>
        <span>Після підтвердження вони перейдуть у відповідну вкладку.</span>
      </span>
    ),
  },

  confirmed: {
    icon: CheckCheck,
    title: "Поки що немає підтверджених записів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Тут зʼявляться записи, які ви вже підтвердили.</span>
        <span>Вони залишатимуться активними до дати візиту.</span>
      </span>
    ),
  },

  canceled: {
    icon: XCircle,
    title: "Поки що немає скасованих записів",
    description: (
      <span className="flex flex-col gap-1">
        <span>
          Тут зʼявляться записи, які були скасовані вами або клієнтом.
        </span>
        <span>За потреби їх можна буде переглянути або видалити.</span>
      </span>
    ),
  },

  archive: {
    icon: FolderClock,
    title: "Поки що немає записів в архіві",
    description: (
      <span className="flex flex-col gap-1">
        <span>Тут зʼявляться записи, дата й час яких уже минули.</span>
        <span>Архів допомагає переглядати завершену історію візитів.</span>
      </span>
    ),
  },
};

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

  const hasHeader = Boolean(title || subtitle);

  return (
<div
  className="fixed inset-0 z-[950] flex items-center justify-center bg-[var(--color-bg)]/45 p-4 backdrop-blur-[8px] sm:p-6"
  onMouseDown={(e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }}
>
      <div
        className={cn(
          "relative w-full max-h-[90vh] overflow-hidden rounded-[32px] border bg-white ",
          "animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-3 duration-200",
          "border-[var(--color-cream)]",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,110,32,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,231,208,0.32),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[var(--color-cream)]/90 via-[var(--color-cream)]/45 to-transparent" />

        {hasHeader && (
          <div className="relative border-b border-[var(--color-cream)] px-4 py-3 sm:px-5 sm:py-4">
            {title && (
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-forest)]">
                {title}
              </p>
            )}

            {subtitle && (
              <p className="mt-1 text-sm text-[var(--color-caramel)]">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div
          className={cn(
            "relative overflow-y-auto px-4 sm:px-5",
            hasHeader
              ? "max-h-[calc(90vh-76px)] py-4 sm:py-5"
              : "max-h-[calc(90vh-52px)] py-5 sm:py-6",
          )}
        >
          {children}
        </div>

        {footer && (
          <div className="relative border-t border-[var(--color-cream)] px-4 py-3 sm:px-5 sm:py-4">
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
      className={cn(
        "animate-pulse rounded-xl bg-[var(--color-cream)]",
        className,
      )}
      aria-hidden="true"
    />
  );
}

function BookingCardSkeleton() {
  return (
    <div className="rounded-3xl border border-[var(--color-cream)] bg-white p-5">
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

function toPublicUrl(v) {
  const PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;
  const s = String(v || "").trim();

  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;

  return PUBLIC ? `${PUBLIC}/${s}` : s;
}

function getOwnerBookingStatus(booking) {
  const raw = booking?.status || "new";

  if (raw === "canceled" || raw === "CANCELED") return "canceled";
  if (raw === "confirmed" || raw === "CONFIRMED") return "confirmed";
  if (raw === "completed" || raw === "COMPLETED") return "completed";

  return "new";
}

export default function Bookings() {
  const { bookings, confirmBooking, cancelBooking, deleteBooking, loading } =
    useBookings();

  const [confirmId, setConfirmId] = useState(null);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [tab, setTab] = useState(() => {
    return localStorage.getItem("bookings-tab") || "list";
  });
  const [activeMonth, setActiveMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [calendarDayKey, setCalendarDayKey] = useState(null);
  const [filter, setFilter] = useState("all");
  const [socketState, setSocketState] = useState(
    socket.connected ? "ok" : "offline",
  );
  const [hasScroll, setHasScroll] = useState(false);
  const [showDetailsScrollHint, setShowDetailsScrollHint] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [expandedCalendarCards, setExpandedCalendarCards] = useState({});
  const [showLoadingSkeleton, setShowLoadingSkeleton] = useState(false);
  const [visibleBookingCount, setVisibleBookingCount] = useState(10);
  useEffect(() => {
    localStorage.setItem("bookings-tab", tab);
  }, [tab]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        setShowLoadingSkeleton(Boolean(loading));
      },
      loading ? 300 : 0,
    );

    return () => window.clearTimeout(timer);
  }, [loading]);
  const calendarScrollRef = useRef(null);
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

  function updateCalendarScrollState(el) {
    if (!el) return;

    const isScrollable = el.scrollHeight > el.clientHeight;
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 12;

    setHasScroll(isScrollable);
    setShowScrollHint(isScrollable && !isAtBottom);
  }

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

  const selectedBooking = useMemo(() => {
    if (detailsId == null) return null;
    return (bookings || []).find((b) => b.id === detailsId) || null;
  }, [detailsId, bookings]);

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
    const active = [];
    const archive = [];

    for (const b of bookings || []) {
      if (!b?.id) continue;

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
  }, [bookings, nowTs]);

  const listData = useMemo(() => {
    if (filter === "archive") return split.archive;

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
  }, [filter, split]);

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

      if (current.has(key)) current.delete(key);
      else current.add(key);

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

  for (const b of bookings || []) {
    if (!b?.id) continue;

    const raw = b?.date;
    if (!raw) continue;

    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;

    const key = toISODateKey(d);

if (!map.has(key)) {
  map.set(key, {
    items: [],
    count: 0,
    pendingCount: 0,
    confirmedCount: 0,
    canceledCount: 0,
  });
}

const bucket = map.get(key);

bucket.items.push(b);
bucket.count += 1;

if (b.status === "canceled") {
  bucket.canceledCount += 1;
} else if (b.status === "confirmed") {
  bucket.confirmedCount += 1;
} else {
  bucket.pendingCount += 1;
}
  }

    for (const [k, bucket] of map.entries()) {
      bucket.items.sort((a, c) => (a.time || "").localeCompare(c.time || ""));
      map.set(k, bucket);
    }

    return map;
  }, [bookings]);

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
      archive: archive.length,
    };
  }, [split]);

  const liveStatusUi = useMemo(() => {
    const base =
      "inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-3 py-1.5 text-[13px] font-semibold shadow-[var(--shadow-card)]";

    if (socketState === "pending" || isRefreshing) {
      return {
        text: "Оновлення...",
        dotClass:
          "h-2 w-2 rounded-full bg-[var(--color-pending)] shadow-[0_0_0_3px_var(--color-pending-light)] animate-[pulse-soft_1.8s_ease-in-out_infinite]",
        wrapClass: `${base} text-[var(--color-pending-dark)]`,
      };
    }

    if (socketState === "offline") {
      return {
        text: "Немає інтернету",
        dotClass:
          "h-2 w-2 rounded-full bg-[var(--color-canceled)] shadow-[0_0_0_3px_var(--color-canceled-light)] animate-[pulse-soft_1.8s_ease-in-out_infinite]",
        wrapClass: `${base} text-[var(--color-canceled-dark)]`,
      };
    }

    return {
      text: "Оновлюється автоматично",
      dotClass:
        "h-2 w-2 rounded-full bg-emerald-600 shadow-[0_0_0_3px_var(--color-confirmed-light)] animate-[pulse-soft_1s_ease-in-out_infinite]",
      wrapClass: `${base} text-emerald-600`,
    };
  }, [socketState, isRefreshing]);

  async function handleDelete(id) {
    await deleteBooking(id);

    if (detailsId === id) {
      setDetailsId(null);
      setCopiedPhone(false);
    }

    if (confirmId === id) {
      setConfirmId(null);
    }
  }

  const emptyInfo = emptyBookingInfo[filter] || emptyBookingInfo.all;
  const EmptyIcon = emptyInfo.icon;

  return (
    <div className="h-full">
      <div className="mx-auto max-w-6xl space-y-6">
<div className="relative overflow-hidden rounded-[32px] border border-[#ebe7df] bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-7">
  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

  <div className="absolute -right-7 -top-10 hidden h-28 w-28 rounded-full bg-white/40 sm:block" />
  <div className="absolute bottom-4 right-24 hidden h-5 w-5 rounded-full bg-[#ff5a00]/20 sm:block" />


  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="max-w-2xl">
      <h1 className="max-w-xl text-4xl font-black leading-[0.95] tracking-tight text-[#202020] sm:text-6xl">
        Зап<span className="text-[#ff5a00]">иси</span>
      </h1>

      <p className="mt-3 max-w-[640px] text-[14px] leading-6 text-[#7b766f] sm:text-[16px]">
        Перегляд записів списком або через календар у зручному форматі.
      </p>
    </div>

    <div className="inline-flex self-center rounded-2xl border border-[#eadbc9] bg-white p-1 shadow-sm sm:self-start">
      <button
        type="button"
        onClick={() => setTab("list")}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold sm:px-4 sm:py-2.5 sm:text-sm",
          tab === "list"
            ? "bg-[#ff5a00] text-white hover:bg-[#f04f00]"
            : "text-[#202020] hover:bg-[#fff7f0]",
        )}
      >
        <List className="h-4 w-4" />
        Список
      </button>

      <button
        type="button"
        onClick={() => setTab("calendar")}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold sm:px-4 sm:py-2.5 sm:text-sm",
          tab === "calendar"
            ? "bg-[#ff5a00] text-white hover:bg-[#f04f00]"
            : "text-[#202020] hover:bg-[#fff7f0]",
        )}
      >
        <CalendarDays className="h-4 w-4" />
        Календар
      </button>
    </div>
  </div>
</div>

        {tab === "list" && (
          <SectionCard
            title={
              <div className="flex items-center gap-3">
<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ff5a00] text-white">
  <ListTodo className="h-5 w-5" />
</div>

                <div className="min-w-0">
                  <h2 className="text-lg font-black tracking-[-0.03em]text-[#202020]">
                    Усі записи
                  </h2>

                  <p className="mt-1 text-sm font-medium text-[var(--color-caramel)]">
                    Переглядайте записи за статусами, датою та типом бронювання.
                  </p>
                </div>
              </div>
            }
            actions={
<div
  className={cn(
    "!hidden md:inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold shadow-sm",
    liveStatusUi.wrapClass,
  )}
>
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.9)]",
                    liveStatusUi.dotClass,
                  )}
                />
                <span className="whitespace-nowrap">{liveStatusUi.text}</span>
              </div>
            }
          >
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { key: "all", label: "Усі" },
                { key: "new", label: "Нові" },
                { key: "archive", label: "Архів" },
                { key: "confirmed", label: "Підтверджені" },
                { key: "canceled", label: "Скасовані" },
              ].map((x) => (
                <Pill
                  key={x.key}
                  active={filter === x.key}
                  count={filterCounts[x.key] ?? 0}
                  showCount={x.key === "new"}
                  onClick={() => setFilter(x.key)}
                >
                  {x.label}
                </Pill>
              ))}
            </div>
          </SectionCard>
        )}

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
              title={emptyInfo.title}
              subtitle="У цій вкладці записів немає"
            >
              <div className="rounded-2xl border-2 border-dashed border-[var(--color-caramel)]/40 bg-[var(--color-cream)] p-6 text-center sm:p-8">
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70">
                    <EmptyIcon className="h-6 w-6 text-[var(--color-caramel)]" />
                  </div>
                </div>

                <p className="text-sm font-medium text-[var(--color-caramel)]">
                  {emptyInfo.title}
                </p>

                <p className="mt-1 text-xs text-[var(--color-caramel)]/80">
                  {emptyInfo.description}
                </p>
              </div>
            </SectionCard>
          ) : (
            <div className="space-y-2">
              {keys.slice(0, visibleBookingCount).map((key) => {
                const isCollapsed = collapsedGroups.has(key);
                const items = grouped.map[key] || [];

                return (
<section
  key={key}
  className="overflow-hidden rounded-[28px] border border-[#eadbc9] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
>
                    <button
                      type="button"
                      onClick={() => toggleGroup(key)}
                      className="flex w-full items-center justify-between gap-3 border-b border-[#eadbc9] px-4 py-4 text-left transition hover:bg-[#fff7f0] sm:px-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-black text-[#202020] sm:text-lg">
                            {renderGroupTitle(key)}
                          </h2>

                          <span className="inline-flex items-center rounded-full border border-[#eadbc9] bg-white px-2.5 py-1 text-xs font-bold text-[#202020]">
                            {items.length}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-[#77716b] sm:text-sm">
                          {isCollapsed
                            ? "Натисни, щоб розгорнути записи"
                            : "Натисни, щоб згорнути записи"}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#eadbc9] bg-white text-[#202020]">
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

  const status = getOwnerBookingStatus(b);

  const clientName =
    b.clientName ||
    b.client?.name ||
    "Клієнт";

  const service =
    b.serviceName ||
    b.service?.name ||
    "Послуга";

  const masterName =
    b.masterName ||
    b.master?.name ||
    "Майстер";

  const clientPhoto = toPublicUrl(
    b.clientPhoto ||
    b.client?.photoUrl ||
    b.client?.avatar ||
    "",
  );

  const isCanceled = b.status === "canceled";
  const isConfirmed = b.status === "confirmed";

  const dt = getBookingDateTime(b);
  const isArchived = dt ? dt.getTime() < nowTs : false;
                          const statusKey = isCanceled
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
                          const statusBadge =
  {
    canceled: {
      label:
        b.canceledBy === "client"
          ? "Скасовано клієнтом"
          : "Скасовано",
      className: "border-[#fecaca] bg-[#fff5f5] text-[#ef4444]",
      icon: XCircle,
    },
    confirmed: {
      label: "Підтверджено",
      className: "border-[#bbf7d0] bg-[#f0fdf4] text-[#22c55e]",
      icon: Check,
    },
    completed: {
      label: "Завершено",
      className: "border-[#d1d5db] bg-[#f9fafb] text-[#6b7280]",
      icon: CheckCheck,
    },
    new: {
      label: "Очікує підтвердження",
      className: "border-[#fed7aa] bg-[#fff7ed] text-[#ff6200]",
      icon: Clock3,
    },
  }[status] || {
    label: "Очікує підтвердження",
    className: "border-[#fed7aa] bg-[#fff7ed] text-[#ff6200]",
    icon: Clock3,
  };

const StatusIcon = statusBadge.icon;

return (
  <div
    key={b.id}
    role="button"
    tabIndex={0}
    onClick={() => setDetailsId(b.id)}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setDetailsId(b.id);
      }
    }}
    className={cn(
      "group cursor-pointer overflow-hidden rounded-[24px] border border-[#eadfce] bg-white transition-all duration-200",
      "hover:-translate-y-0.5 hover:border-[#ffd6bd] hover:bg-[#fff7f0] hover:shadow-[0_18px_44px_rgba(255,90,0,0.10)]",
      "active:scale-[0.99]",
      status === "completed" && "opacity-85",
    )}
  >
    <div className="grid min-h-[108px] grid-cols-[92px_minmax(0,1fr)_132px_96px] items-center gap-3 px-4 py-3 max-[639px]:min-h-0 max-[639px]:grid-cols-[1fr_82px] max-[639px]:gap-3 max-[639px]:px-3 max-[639px]:py-3">
      <div className="contents max-[639px]:block max-[639px]:min-w-0">
        <div className="mb-2 hidden justify-center max-[639px]:flex">
          <div
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-center text-[10px] font-black",
              statusBadge.className,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {statusBadge.label}
          </div>
        </div>

        <div className="contents max-[639px]:flex max-[639px]:items-center max-[639px]:gap-3">
       <div className="grid h-[70px] w-[70px] shrink-0 place-items-center overflow-hidden rounded-full border border-[#eadfce] bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:ml-2 lg:ml-3 max-[639px]:h-[64px] max-[639px]:w-[64px]">
            {clientPhoto ? (
              <img
                src={clientPhoto}
                alt={clientName}
                className="h-full w-full rounded-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full w-full place-items-center rounded-full bg-[#fff1e8] text-[#ff6200]">
                <UserRound className="h-9 w-9 max-[639px]:h-6 max-[639px]:w-6" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h2 className="line-clamp-1 text-[16px] font-black leading-tight tracking-[-0.04em] text-[#202020] max-[639px]:text-[13px] lg:text-[18px]">
              {clientName}
            </h2>

            {b.clientPhone && (
              <div className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#77716b] max-[767px]:mt-1 max-[767px]:text-[10px] lg:text-[13px]">
                 <Phone className="h-4 w-4 shrink-0 text-[#77716b] max-[767px]:h-3 max-[767px]:w-3" />
                <span className="line-clamp-1">{b.clientPhone}</span>
              </div>
            )}

            <div className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#77716b] max-[767px]:mt-1 max-[767px]:text-[10px] lg:text-[13px]">
              <ClipboardPen className="h-4 w-4 shrink-0 text-[#77716b] max-[767px]:h-3 max-[767px]:w-3" />
              <span className="line-clamp-2">{service}</span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-[#77716b] max-[767px]:mt-1.5 max-[767px]:gap-1.5 max-[767px]:text-[10px] lg:text-[13px]">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-[#fff1e8] text-[11px] font-black text-[#ff6200] max-[767px]:h-5 max-[767px]:w-5 max-[767px]:text-[8px]">
                {masterName?.[0] || "М"}
              </div>

              <span className="truncate">Майстер: {masterName}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "hidden h-full items-center justify-center border-l pl-3 max-[639px]:flex",
          status === "confirmed"
            ? "border-[#bbf7d0]"
            : status === "new"
              ? "border-[#fed7aa]"
              : status === "canceled"
                ? "border-[#fecaca]"
                : "border-[#d1d5db]",
        )}
      >
        <div className="flex h-[74px] w-[58px] flex-col items-center justify-center">
          <p className="text-center text-[11px] font-bold capitalize text-[#aaa19a]">
            {monthLabel}
          </p>

          <p
            className={cn(
              "text-[28px] font-[300] leading-none tracking-[-0.05em]",
              status === "confirmed"
                ? "text-[#41a85f]"
                : status === "new"
                  ? "text-[#ff6200]"
                  : status === "canceled"
                    ? "text-[#ef4444]"
                    : "text-[#6b7280]",
            )}
          >
            {dayLabel}
          </p>

          <p className="text-[12px] font-semibold tracking-[0.08em] text-[#5f5a55]">
           {timeLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 max-[639px]:hidden">
<div
  className={cn(
    "mr-10 inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-center text-[11px] font-black",
    statusBadge.className,
  )}
>
          <StatusIcon className="h-4 w-4" />
          <span className="whitespace-nowrap">{statusBadge.label}</span>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center justify-center border-l pl-5 max-[639px]:hidden",
          status === "confirmed"
            ? "border-[#bbf7d0]"
            : status === "new"
              ? "border-[#fed7aa]"
              : status === "canceled"
                ? "border-[#fecaca]"
                : "border-[#d1d5db]",
        )}
      >
        <div className="flex h-[82px] w-[78px] flex-col items-center justify-center">
<span className="text-[13px] font-bold capitalize text-[#aaa19a]">
  {monthLabel}
</span>

          <span
            className={cn(
              "mt-0.5 text-[36px] font-[300] leading-none tracking-[-0.05em]",
              status === "confirmed"
                ? "text-[#41a85f]"
                : status === "new"
                  ? "text-[#ff6200]"
                  : status === "canceled"
                    ? "text-[#ef4444]"
                    : "text-[#6b7280]",
            )}
          >
            {dayLabel}
          </span>

          <span className="mt-1 text-[15px] font-black text-[#77716b]">
            {timeLabel}
          </span>
        </div>
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
              {visibleBookingCount < keys.length && (
  <div className="mt-5 flex justify-center">
    <button
      type="button"
      onClick={() => setVisibleBookingCount((prev) => prev + 5)}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-primary-buttom)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
    >
      Показати ще
    </button>
  </div>
)}
            </div>
          )
        ) : showLoadingSkeleton ? (
          <SectionCard
            title="Календар записів"
            subtitle="Завантажуємо дані..."
            badge={monthLabelUA(activeMonth)}
          >
            <div className="grid grid-cols-7 gap-1.5 text-[11px] font-semibold text-[var(--color-caramel)] sm:gap-2 sm:text-xs">
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((x) => (
                <div key={x} className="px-1 text-center">
                  {x}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
              {Array.from({ length: 42 }).map((_, i) => (
                <SkeletonBlock
                  key={i}
                  className="aspect-square rounded-[20px]"
                />
              ))}
            </div>
          </SectionCard>
        ) : (
          <SectionCard>
            <div className="mb-5 flex items-center justify-between">
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
className="
  group
  h-10 w-10 shrink-0
  !border !border-[#eadbc9]
  !bg-white
  !text-[#202020]
  !shadow-sm
  !transition-all !duration-300
  hover:!border-[#ffd6bd]
  hover:!bg-[#fff7f0]
  hover:!scale-110
  active:!scale-[0.98]
"
              >
                <ChevronLeft className="h-5 w-5" />
              </IconButton>

              <h3 className="text-center text-[22px] font-extrabold tracking-tight text-[var(--color-ink)] capitalize sm:text-[24px]">
                {monthLabelUA(activeMonth)}
              </h3>

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
className="
  group
  h-10 w-10 shrink-0
  !border !border-[#eadbc9]
  !bg-white
  !text-[#202020]
  !shadow-sm
  !transition-all !duration-300
  hover:!border-[#ffd6bd]
  hover:!bg-[#fff7f0]
  hover:!scale-110
  active:!scale-[0.98]
"
              >
                <ChevronRight className="h-5 w-5" />
              </IconButton>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-[11px] font-semibold text-[var(--color-caramel)] sm:gap-2 sm:text-xs">
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
const pendingCount = bucket?.pendingCount ?? 0;
const confirmedCount = bucket?.confirmedCount ?? 0;
const canceledCount = bucket?.canceledCount ?? 0;

const hasPending = pendingCount > 0;
const hasConfirmed = confirmedCount > 0;
const allCanceled = count > 0 && canceledCount === count;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => count > 0 && setCalendarDayKey(key)}
                      disabled={count === 0}
                      title={count > 0 ? `Записів: ${count}` : "Немає записів"}
                      className={cn(
           "relative min-h-[58px] sm:h-11 sm:min-h-0 gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-2 sm:px-4 py-2 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-300 hover:border-[#ffd6bd] hover:bg-[#fff7f0] hover:shadow-[0_12px_28px_rgba(255,90,0,0.12)] hover:-translate-y-0.5 active:scale-[0.98]",
                        // база
                        "bg-white border-[var(--border-soft)] shadow-[0_4px_12px_rgba(0,0,0,0.04)]",

                        // не в місяці
                        !isInMonth && "bg-[var(--color-cream)] opacity-60",

                        // курсор
                        count > 0
                          ? "cursor-pointer"
                          : "cursor-default opacity-70",

                        // today (акцент)
                        isToday &&
                          "ring-2 ring-[var(--color-pending-light)] border-[var(--border-hover-primary)]",

                        // минулий день
                        isPastDay &&
                          "relative border-[var(--border-soft)] bg-[var(--color-cream)] text-[var(--color-cream-secondary)] opacity-70 ",

                        // є нові записи (акцент)
!isPastDay &&
  allCanceled &&
  "border-[var(--color-canceled)] bg-[var(--color-canceled-light)] shadow-[0_6px_18px_rgba(0,0,0,0.06)]",

!isPastDay &&
  !allCanceled &&
  hasPending &&
  "!border-[#ff6200] bg-[#ffe5d4] shadow-[0_8px_24px_rgba(255,98,0,0.25)]",

!isPastDay &&
  !allCanceled &&
  !hasPending &&
  hasConfirmed &&
  "border-[var(--color-buttom-ok)] hover:border-[var(--color-buttom-ok)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)]",
                        // пустий день
                        !isPastDay &&
                          count === 0 &&
                          "border-[var(--border-soft)] bg-white",
                      )}
                    >
                      <div className="flex h-full flex-col items-center justify-center sm:hidden">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            isInMonth
                              ? "text-[var(--color-ink)]"
                              : "text-[var(--color-caramel)]",
                            isPastDay && "text-gray-400 line-through",
                          )}
                        >
                          {day.getDate()}
                        </span>

                        {count > 0 && (
                          <span
                            className={cn(
                              "mt-1 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
isPastDay
  ? "bg-[var(--color-archived-light)] text-[var(--color-archived-dark)]"
  : allCanceled
    ? "bg-[var(--color-canceled)] text-white"
    : hasPending
      ? "bg-[var(--color-pending)] text-white"
      : hasConfirmed
        ? "bg-[var(--color-confirmed)] text-white"
        : "bg-[var(--color-confirmed)] text-white",
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </div>

                      <div className="hidden items-start justify-between gap-2 sm:flex">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            isInMonth
                              ? "text-[var(--color-ink)]"
                              : "text-[var(--color-caramel)]",
                            isPastDay && "text-gray-400 line-through",
                          )}
                        >
                          {day.getDate()}
                        </span>
                        {count > 0 && (
                          <span
                            className={cn(
                              "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
isPastDay
  ? "bg-[var(--color-archived-light)] text-[var(--color-archived-dark)]"
  : allCanceled
    ? "bg-[var(--color-canceled)] text-white"
: hasPending
  ? "bg-[#ff6200] text-white"
      : hasConfirmed
        ? "bg-[var(--color-confirmed)] text-white"
        : "bg-[var(--color-confirmed)] text-white",
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

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--color-caramel)]">
<span className="inline-flex items-center gap-2 font-semibold">
  <span className="h-2 w-2 rounded-full bg-[#ff6200]" />
  Є записи, що очікують підтвердження
</span>

<span className="inline-flex items-center gap-2">
  <span className="h-2 w-2 rounded-full bg-[var(--color-confirmed)]" />
  Усі записи підтверджені
</span>

<span className="inline-flex items-center gap-2">
  <span className="h-2 w-2 rounded-full bg-[var(--color-canceled)]" />
  Усі записи скасовані
</span>

<span className="inline-flex items-center gap-2">
  <span className="h-2 w-2 rounded-full bg-[var(--color-confirmed-light)]" />
  Минулі дні
</span>
            </div>
          </SectionCard>
        )}

        <Modal
          open={confirmId != null}
          onClose={() => setConfirmId(null)}
          size="sm"
          footer={
            <div className="flex justify-end gap-2">
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-danger)] px-4 py-2.5 text-sm font-bold text-white  hover:bg-[var(--color-danger-dark)] active:scale-[0.98] sm:w-auto"
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
                <div className="absolute inset-0 rounded-full bg-[var(--color-danger-bg)]/90 blur-2xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-danger)] text-white shadow-[0_16px_36px_rgba(213,92,82,0.24)]">
                  <Trash2 className="h-7 w-7" />
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-black tracking-tight text-[var(--color-ink)]">
                Видалити запис?
              </h3>
            </div>

            <div className="rounded-2xl bg-[var(--color-danger-bg)] p-3.5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--color-danger-dark)] shadow-sm">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--color-danger-dark)]">
                    Увага
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-ink)]">
                    Видалений запис не можна буде повернути назад.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          open={cancelConfirmId != null}
          onClose={() => setCancelConfirmId(null)}
          size="sm"
          footer={
            <div className="flex justify-end gap-2">
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-danger)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--color-danger-dark)] active:scale-[0.98] sm:w-auto"
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
                <div className="absolute inset-0 rounded-full bg-[var(--color-forest)]/70 blur-2xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-windows-cancel)] text-white ">
                  <XCircle className="h-7 w-7" />
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-black tracking-tight text-[var(--color-ink)]">
                Скасувати запис?
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-caramel)]">
                Запис вважатиметься не активним і буде позначений як скасований.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--color-cream)] bg-[var(--color-cream)] p-3.5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--color-delete)] shadow-sm">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--color-ink)]">
                    Після скасування
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-ink)]">
                    Клієн отримає статус скасованого.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {selectedBooking &&
          detailsId != null &&
          (() => {
            const isCanceled = selectedBooking.status === "canceled";
            const isConfirmed = selectedBooking.status === "confirmed";
            const dt = getBookingDateTime(selectedBooking);
            const isArchived = dt ? dt.getTime() < nowTs : false;

            const statusMeta = isArchived
              ? {
                  label: "Завершено",
                  top: "from-[var(--color-archived-light)] to-white",
                  Icon: CalendarCheck,
                  iconColor: "text-[var(--color-archived-dark)]",
                  pillText: "text-[var(--color-archived-dark)]",
                  accent: "text-[var(--color-archived)]",
                }
              : isConfirmed
                ? {
                    label: "Підтверджено",
                    top: "from-[var(--color-confirmed-light)] to-white",
                    Icon: CheckCheck,
                    iconColor: "text-[var(--color-confirmed-dark)]",
                    pillText: "text-[var(--color-confirmed-dark)]",
                    accent: "text-[var(--color-confirmed)]",
                  }
                : isCanceled
                  ? {
                      label:
                        selectedBooking.canceledBy === "client"
                          ? "Скасовано клієнтом"
                          : "Скасовано вами",
                      top: "from-[var(--color-canceled-light)] to-white",
                      Icon: XCircle,
                      iconColor: "text-[var(--color-canceled-dark)]",
                      pillText: "text-[var(--color-canceled-dark)]",
                      accent: "text-[var(--color-canceled)]",
                    }
                  : {
                      label: "Очікує підтвердження",
                      top: "from-[var(--color-pending-light)] to-white",
                      Icon: Clock,
                      iconColor: "text-[var(--color-pending-dark)]",
                      pillText: "text-[var(--color-pending-dark)]",
                      accent: "text-[var(--color-pending)]",
                    };

            const StatusIcon = statusMeta.Icon;
            const clientName = selectedBooking.clientName || "—";
            const phone = selectedBooking.clientPhone || "";
            const service = selectedBooking.serviceName || "Послуга";
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
              "Довільний майстер";

            return (
<div
  className="fixed inset-0 z-[220] flex items-end justify-center bg-[var(--color-bg)]/45 p-0 backdrop-blur-[7px] sm:items-center sm:p-4"
  onMouseDown={(e) => {
    if (e.target === e.currentTarget) {
      setDetailsId(null);
      setCopiedPhone(false);
      setShowDetailsScrollHint(true);
    }
  }}
>
                <div
                  className={cn(
                    "relative flex w-full flex-col overflow-hidden bg-white",
                    "h-[100dvh] rounded-none border-0 shadow-none",
                    "sm:h-auto sm:max-h-[76vh] sm:max-w-[420px] sm:rounded-[34px] sm:border sm:border-[var(--color-cream)] sm:shadow-[0_35px_100px_rgba(27,27,27,0.18)]",
                  )}
 onMouseDown={(e) => e.stopPropagation()}
  onClick={(e) => e.stopPropagation()}
>
                  <div
                    className={cn(
                      "relative px-5 pb-5 pt-[max(16px,env(safe-area-inset-top))] sm:pt-5",
                      "bg-gradient-to-b",
                      statusMeta.top,
                    )}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%)]" />

                    <div className="relative flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setDetailsId(null);
                          setCopiedPhone(false);
                          setShowDetailsScrollHint(true);
                        }}
                        className="sm:hidden inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--color-ink)] shadow-[0_4px_18px_rgba(27,27,27,0.08)]"
                        aria-label="Назад"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <div className="w-11 sm:hidden" />

                      <button
                        type="button"
                        onClick={() => {
                          setDetailsId(null);
                          setCopiedPhone(false);
                          setShowDetailsScrollHint(true);
                        }}
                        className="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--color-ink)] shadow-[0_4px_18px_rgba(27,27,27,0.08)] transition hover:bg-[var(--color-cream)]"
                        aria-label="Закрити"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-4 flex justify-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[13px] font-semibold shadow-[0_4px_18px_rgba(27,27,27,0.06)] backdrop-blur">
                        <StatusIcon
                          className={cn("h-4 w-4", statusMeta.iconColor)}
                        />
                        <span className={statusMeta.pillText}>
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>

                    <div className="relative mt-5 text-center">
                      <h2 className="text-[24px] font-black leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                        {service}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-[var(--color-ink-soft)]">
                        {formatDateLongUA(selectedBooking?.date)}
                      </p>
                    </div>

                    <div className="relative mt-4 grid grid-cols-3 gap-2">
                      <div className="inline-flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[22px] bg-white px-3 py-2 text-sm font-semibold shadow-sm">
                        <Clock3
                          className={cn("h-4 w-4", statusMeta.iconColor)}
                        />
                        <span className="text-[var(--color-ink)]">{time}</span>
                      </div>

                      <div className="inline-flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[22px] bg-white px-3 py-2 text-sm font-semibold shadow-sm">
                        <Banknote
                          className={cn("h-4 w-4", statusMeta.iconColor)}
                        />
                        <span className="text-[var(--color-ink)]">
                          {price != null ? `${price} грн` : "—"}
                        </span>
                      </div>

                      <div className="inline-flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[22px] bg-white px-3 py-2 text-sm font-semibold shadow-sm">
                        <Timer
                          className={cn("h-4 w-4", statusMeta.iconColor)}
                        />
                        <span className="text-[var(--color-ink)]">
                          {duration != null ? `${duration} хв` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-5">
                    <div
                      className="calendar-day-scroll min-h-0 flex-1 overflow-y-auto pb-16 sm:pb-6"
                      onScroll={(e) => {
                        const el = e.currentTarget;
                        const isScrollable = el.scrollHeight > el.clientHeight;
                        const isAtBottom =
                          el.scrollTop + el.clientHeight >=
                          el.scrollHeight - 12;

                        setHasScroll(isScrollable);
                        setShowScrollHint(isScrollable && !isAtBottom);
                      }}
                    >
<div className="space-y-3">
<div className="rounded-[28px] border border-[#eadfce] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
  <div className="flex items-center gap-4">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#fff1e8] text-[#ff6200]">
      {selectedBooking.clientPhoto ? (
        <img
          src={toPublicUrl(selectedBooking.clientPhoto)}
          alt={clientName}
          className="h-full w-full object-cover"
        />
      ) : (
        <CircleUser className="h-5 w-5" />
      )}
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#aaa19a]">
        Клієнт
      </p>

      <p className="truncate text-[17px] font-black text-[#202020]">
        {clientName}
      </p>

    </div>
  </div>
</div>

  <div className="rounded-[28px] border border-[#eadfce] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1e8] font-black text-[#ff6200]">
        {masterName?.[0] || "М"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#aaa19a]">
          Майстер
        </p>

        <p className="truncate text-[17px] font-black text-[#202020]">
          {masterName}
        </p>
      </div>
    </div>
  </div>

  <div className="rounded-[28px] border border-[#eadfce] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
  <div className="flex items-center gap-4">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff1e8] text-[#ff6200]">
      <Phone className="h-5 w-5" />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#aaa19a]">
        Телефон
      </p>

      <p className="truncate text-[17px] font-black text-[#202020]">
        {phone || "—"}
      </p>
    </div>

<div className="flex items-center gap-2">


  {phone && (
    <button
      type="button"
      onClick={() => handleCopyPhone(phone)}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#eadfce] bg-white text-[#77716b] transition-all duration-200 hover:bg-[#fff7f0] hover:text-[#202020]"
      title="Скопіювати номер"
    >
      {copiedPhone ? (
        <CheckCheck className="h-4 w-4 text-emerald-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  )}
    {phone && (
    <a
      href={`tel:${phone}`}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#eadfce] bg-white text-[#ff6200] transition-all duration-200 hover:bg-[#fff7f0] hover:scale-105 active:scale-[0.95]"
      title="Подзвонити"
    >
      <PhoneCall className="h-4 w-4" />
    </a>
  )}
</div>
  </div>
</div>
</div>
                    </div>

<div className="mt-4 grid grid-cols-2 gap-3 pt-2">
  {!isConfirmed && !isCanceled && !isArchived && (
<button
  type="button"
  onClick={async () => {
    await confirmBooking(selectedBooking.id);
    setDetailsId(null);
  }}
  className="inline-flex h-12 items-center justify-center gap-2 rounded-[22px] bg-[#22c55e] text-sm font-black text-white transition-all duration-200 hover:bg-[#16a34a] hover:-translate-y-[1px] active:scale-[0.98]"
>
  <CheckCheck className="h-4 w-4" />
  Підтвердити
</button>
  )}

  {!isCanceled && !isArchived && (
    <button
      type="button"
      onClick={() => {
        setDetailsId(null);
        setCancelConfirmId(selectedBooking.id);
      }}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-[22px] border border-[#fecaca] bg-[#fff5f5] text-sm font-black text-[#ef4444] transition-all duration-200 hover:border-[#fca5a5] hover:bg-[#ffecec] active:scale-[0.98]"
    >
      <XCircle className="h-4 w-4" />
      Скасувати запис
    </button>
  )}

</div>
                  </div>
                </div>
              </div>
            );
          })()}

        {calendarDayKey &&
          (() => {
            const dayItems = bookingsByDateKey.get(calendarDayKey)?.items || [];
            const totalCount =
              bookingsByDateKey.get(calendarDayKey)?.count ?? 0;

            return (
<div
  className="fixed inset-0 z-[220] flex items-end justify-center bg-[var(--color-bg)]/45 p-0 backdrop-blur-[7px] sm:items-center sm:p-4"
  onMouseDown={(e) => {
    if (e.target === e.currentTarget) {
      setCalendarDayKey(null);
      setExpandedCalendarCards({});
    }
  }}
>
                <div
                  className={cn(
                    "relative flex w-full flex-col overflow-hidden border-[var(--border-soft)] bg-white",
                    "h-[100dvh] rounded-none border-0 shadow-none",
                    "sm:h-auto sm:max-h-[85vh] sm:max-w-[460px] sm:rounded-[30px] sm:border sm:shadow-[0_35px_100px_rgba(27,27,27,0.18)]",
                  )}
                 onMouseDown={(e) => e.stopPropagation()}
onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative overflow-hidden bg-gradient-to-b from-[var(--color-pending-light)] via-white to-white px-5 pb-5 pt-[max(16px,env(safe-area-inset-top))] sm:pt-4">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.20),transparent_30%)]" />

                    <div className="relative flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setCalendarDayKey(null);
                          setExpandedCalendarCards({});
                        }}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--color-ink)] shadow-[0_4px_18px_rgba(27,27,27,0.08)] transition hover:bg-[var(--color-cream)]"
                        aria-label="Назад"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <div className="w-11" />
                    </div>

                    <div className="relative mt-4 flex justify-center">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-3 py-1.5 text-[13px] font-semibold shadow-[var(--shadow-card)]">
                        <ListTodo className="h-4 w-4 text-[var(--color-pending-dark)]" />
                        <span className="whitespace-nowrap text-[var(--color-ink)]">
                          Всього записів: {totalCount}
                        </span>
                      </div>
                    </div>

                    <div className="relative mt-6 text-center">
                      <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                        Записи на {formatDateUA(calendarDayKey)}
                      </h2>
                    </div>
                  </div>

                  <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:flex-none sm:px-5 sm:pb-5">
                    <div
                      ref={(el) => {
                        calendarScrollRef.current = el;
                        if (el) {
                          requestAnimationFrame(() =>
                            updateCalendarScrollState(el),
                          );
                        }
                      }}
                      className="calendar-day-scroll min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 pb-16 sm:max-h-[60vh] sm:flex-none sm:pb-2"
                      onScroll={(e) =>
                        updateCalendarScrollState(e.currentTarget)
                      }
                    >
                      {showScrollHint && hasScroll && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4 sm:hidden">
                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/90 to-transparent" />

                          <div className="relative inline-flex flex-col items-center gap-1 rounded-full  px-4 py-2 ">
                            <ChevronDown className="h-10 w-10 animate-bounce text-stone-400" />
                          </div>
                        </div>
                      )}
                      {dayItems.length > 0 ? (
                        dayItems.map((b) => {
                          const isCanceled = b.status === "canceled";
                          const isConfirmed = b.status === "confirmed";
                          const dt = getBookingDateTime(b);
                          const isArchived = dt ? dt.getTime() < nowTs : false;
                          const actions = [];

                          if (!isConfirmed && !isCanceled && !isArchived)
                            actions.push("confirm");
                          if (!isCanceled) actions.push("cancel");
                          if (isCanceled && !isArchived) actions.push("delete");

                          const actionsCount = actions.length;
                          const isExpanded = !!expandedCalendarCards[b.id];

                          const statusUi = getStatusUi(
                            isCanceled
                              ? "canceled"
                              : isConfirmed
                                ? "confirmed"
                                : "new",
                            isArchived,
                            b.canceledBy,
                          );

                          const masterName =
                            b.masterName ||
                            b.staffName ||
                            b.employeeName ||
                            "Довільний майстер";

                          const price =
                            b.price ?? b.servicePrice ?? b.totalPrice ?? null;
                          const duration =
                            b.duration ??
                            b.serviceDuration ??
                            b.durationMinutes ??
                            null;

                          return (
                            <div
                              key={b.id}
                              onClick={() => toggleCalendarCard(b.id)}
                              className={cn(
                                "group overflow-hidden rounded-[24px] border border-[var(--border-primary)] bg-white shadow-[0_8px_30px_-12px_rgba(27,27,27,0.08)] transition-all duration-200 cursor-pointer",
                                isExpanded &&
                                  "border-[var(--border-hover-primary)] shadow-[0_14px_34px_rgba(27,27,27,0.12)]",
                              )}
                            >
                              <div className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div
                                    className={cn(
                                      "inline-flex items-center justify-center gap-2 px-3 py-1 text-xs font-semibold rounded-2xl border border-[var(--border-soft)] bg-white shadow-sm transition-all duration-200",
                                      statusUi.badge,
                                    )}
                                  >
                                    <statusUi.icon className="h-3.5 w-3.5" />
                                    {statusUi.text}
                                  </div>

<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    toggleCalendarCard(b.id);
  }}
  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold text-[var(--border-hover-primary)] transition group-hover:text-[var(--color-sidebar-accent-hover)] active:scale-[0.98]"
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

                                <h3 className="mt-3 text-center text-[17px] font-black leading-[1.15] tracking-[-0.03em] text-[var(--color-ink)]">
                                  {b.serviceName || "Послуга"}
                                </h3>

                                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-center text-sm font-semibold text-[var(--color-ink)]">
                                  {/* Час */}
                                  <span className="inline-flex items-center gap-1.5">
                                    <Clock3
                                      className={cn("h-4 w-4", statusUi.time)}
                                    />
                                    {b.time || "—"}
                                  </span>

                                  {/* Ціна */}
                                  {price != null && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <Banknote
                                        className={cn("h-4 w-4", statusUi.time)}
                                      />
                                      {price} грн
                                    </span>
                                  )}

                                  {/* Тривалість */}
                                  {duration != null && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <Timer
                                        className={cn("h-4 w-4", statusUi.time)}
                                      />
                                      {duration} хв
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div
                                className={cn(
                                  "grid transition-all duration-300 ease-out",
                                  isExpanded
                                    ? "grid-rows-[1fr] opacity-100"
                                    : "grid-rows-[0fr] opacity-0",
                                )}
                              >
                                <div className="overflow-hidden">
                                  <div className="border-t border-[var(--color-cream)] bg-[var(--color-cream)] p-4">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-cream)] text-[var(--color-ink)] shadow-sm">
                                          <UserRound className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0">
                                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                                            Клієнт
                                          </p>
                                          <p className="truncate text-sm font-bold text-[var(--color-ink)]">
                                            {b.clientName || "—"}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-cream)] text-[var(--color-ink)] shadow-sm">
                                          <Scissors className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0">
                                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                                            Майстер
                                          </p>
                                          <p className="truncate text-sm font-bold text-[var(--color-ink)]">
                                            {masterName}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {b.clientPhone && (
                                      <div className="mt-2 flex items-center gap-3 rounded-2xl bg-white px-3 py-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-cream)] text-[var(--color-ink)] shadow-sm">
                                          <Phone className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                                            Телефон
                                          </p>
                                          <p className="truncate text-sm font-bold text-[var(--color-ink)]">
                                            {b.clientPhone}
                                          </p>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleCopyPhone(b.clientPhone)
                                          }
                                          className={cn(
                                            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm transition-all duration-200 active:scale-[0.95]",
                                            copiedPhone
                                              ? "border-[var(--color-forest)] bg-[var(--color-cream)] text-[var(--color-ink)]"
                                              : "border-[var(--color-cream)] text-[var(--color-ink)] hover:border-[var(--color-forest)] hover:text-[var(--color-ink-soft)] hover:bg-[var(--color-cream)]",
                                          )}
                                          aria-label="Скопіювати телефон"
                                          title="Скопіювати телефон"
                                        >
                                          {copiedPhone ? (
                                            <FolderClock className="h-4 w-4" />
                                          ) : (
                                            <Copy className="h-4 w-4" />
                                          )}
                                        </button>
                                      </div>
                                    )}

                                    <div
                                      className={cn(
                                        "mt-3 gap-2",
                                        actionsCount === 1
                                          ? "flex justify-end"
                                          : "grid grid-cols-2",
                                      )}
                                    >
                                      {!isConfirmed &&
                                        !isCanceled &&
                                        !isArchived && (
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
className={cn(
  "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-white transition-all duration-200",
  "bg-[#22c55e]",
  "hover:bg-[#16a34a] hover:-translate-y-[1px]",
  "active:scale-[0.98]",
  actionsCount > 1 ? "w-full" : "min-w-[160px]",
)}
                                          >
                                            <CheckCheck className="h-4 w-4" />
                                            Підтвердити
                                          </button>
                                        )}

                                      {!isCanceled && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCancelConfirmId(b.id);
                                          }}
                                          disabled={isCanceled || isArchived}
className={cn(
  "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition-all duration-200",
  "border border-[#fecaca] bg-[#fff5f5] text-[#ef4444]",

  "hover:bg-[#ef4444] hover:text-white hover:border-[#ef4444]",
  "hover:shadow-[0_18px_36px_rgba(239,68,68,0.20)] hover:-translate-y-[1px]",
  "active:scale-[0.98]",
  "disabled:pointer-events-none disabled:opacity-50",
  actionsCount > 1 ? "w-full" : "min-w-[160px]",
)}
                                        >
                                          <XCircle className="h-4 w-4" />
                                          Скасувати
                                        </button>
                                      )}

                                      {isCanceled && !isArchived && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setConfirmId(b.id);
                                          }}
className={cn(
  "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-white transition-all duration-200",
  "bg-[#ef4444]",
  "hover:bg-[#dc2626] hover:shadow-[0_18px_36px_rgba(239,68,68,0.28)] hover:-translate-y-[1px]",
  "active:scale-[0.98]",
  actionsCount > 1 ? "w-full" : "min-w-[160px]",
)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          Видалити
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-[var(--color-cream)] bg-[var(--color-sand)] p-6 text-center text-sm text-[var(--color-ink)]">
                          На цей день записів немає.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
