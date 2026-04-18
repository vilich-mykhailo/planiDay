// Golowna.jsx
import { useMemo, useState, useEffect } from "react";
import { useBookings } from "../context/bookings/useBookings";
import {
  Sparkles,
  CalendarDays,
  Clock,
  Users,
  CheckCheck,
  ChevronRight,
  X,
  Trash2,
  Check,
  XCircle,
  UserRound,
  Copy,
  Scissors,
  Clock3,
} from "lucide-react";
import { socket } from "../lib/socket";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODateKey(d) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateUA(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function renderBookingDate(b) {
  const raw = b?.date || b?.day;
  if (!raw) return "—";
  return formatDateUA(raw) || "—";
}

function getBookingStatusMeta(booking, nowTs) {
  const status = booking?.status;
  const canceledBy = booking?.canceledBy || null;

  const dt = getBookingDateTime(booking);
  const isArchived = dt ? dt.getTime() < nowTs : false;
  const isDeleted = status === "deleted";
  const isCanceled = status === "canceled";
  const isConfirmed = status === "confirmed";

  if (isDeleted) {
    return {
      label: "Видалено",
      badge: "bg-stone-200 text-stone-700",
      dot: "bg-stone-500",
      ring: "from-stone-400/20 to-stone-100",
      iconBg: "bg-stone-100 text-stone-600",
      Icon: Trash2,
    };
  }

  if (isArchived) {
    return {
      label: "Сеанс завершено",
      badge: "bg-sky-100 text-sky-700",
      dot: "bg-sky-600",
      ring: "from-sky-500/20 to-sky-50",
      iconBg: "bg-sky-100 text-sky-700",
      Icon: CheckCheck,
    };
  }

  if (isConfirmed) {
    return {
      label: "Підтверджено",
      badge: "bg-emerald-100 text-emerald-700",
      dot: "bg-emerald-600",
      ring: "from-emerald-500/20 to-emerald-50",
      iconBg: "bg-emerald-100 text-emerald-700",
      Icon: Check,
    };
  }

  if (isCanceled) {
    return {
      label: canceledBy === "client" ? "Скасовано клієнтом" : "Скасовано вами",
      badge: "bg-red-100 text-red-700",
      dot: "bg-red-600",
      ring: "from-red-500/20 to-red-50",
      iconBg: "bg-red-100 text-red-700",
      Icon: XCircle,
    };
  }

  return {
    label: "Очікує підтвердження",
    badge: "bg-[#FFE7D6] text-[#D85A00]",
    dot: "bg-[#D85A00]",
    ring: "from-amber-500/20 to-amber-50",
    iconBg: "bg-amber-100 text-amber-700",
    Icon: Clock,
  };
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

function startOfWeekMonday(d) {
  const x = new Date(d);
  const day = x.getDay();
  const mondayIndex = (day + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - mondayIndex);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

function formatCompactNumber(num) {
  if (num == null || num === 0) return "0";
  if (num < 1000) return String(num);
  if (num < 10_000) return `${Math.floor(num / 100) / 10}k`;
  if (num < 1_000_000) return `${Math.floor(num / 1000)}k`;
  if (num < 10_000_000) return `${Math.floor(num / 1_000_000)}M`;
  return "999k+";
}

// =========================
// UI
// =========================
function SectionShell({ children, className = "" }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[30px] border border-stone-200/60 bg-white shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]",
        className,
      )}
    >
      <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />
      {children}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, accent = "emerald" }) {
  const displayValue = formatCompactNumber(value);

  const iconTone =
    accent === "amber"
      ? "bg-amber-50 text-amber-700"
      : accent === "blue"
        ? "bg-sky-50 text-sky-700"
        : accent === "rose"
          ? "bg-rose-50 text-rose-700"
          : "bg-emerald-50 text-emerald-700";

  return (
    <div className="group rounded-[22px] border border-stone-200 bg-white p-3 shadow-[0_8px_25px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:rounded-[26px] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-stone-500 sm:text-[10px] sm:tracking-[0.18em]">
            {title}
          </p>

          <div className="mt-2 text-2xl font-bold tracking-tight text-stone-800 sm:mt-3 sm:text-4xl">
            {displayValue}
          </div>
        </div>

        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            iconTone,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold",
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
      className="fixed inset-0 z-[950] flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cn(
          "relative w-full max-h-[90vh] overflow-hidden bg-white shadow-2xl",
          "animate-in fade-in-0 slide-in-from-bottom duration-200",
          "rounded-3xl sm:h-auto sm:max-h-[92vh]",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-50/80 to-transparent" />

        <div className="relative border-b border-stone-100 px-3 py-2.5 sm:px-5 sm:py-4">
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

        <div className="max-h-[calc(90vh-64px)] overflow-y-auto px-3 py-3 sm:px-5 sm:py-5">
          {children}
        </div>

        {footer && (
          <div className="border-t border-stone-100 bg-stone-50/50 px-3 py-2.5 sm:px-5 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Button({ variant = "secondary", className = "", children, ...props }) {
  const variants = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_10px_24px_rgba(5,150,105,0.28)]",
    secondary:
      "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
    danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 bg-[length:200%_100%]",
        className,
      )}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-[22px] border border-stone-200 bg-white p-3 shadow-[0_8px_25px_rgba(0,0,0,0.04)] sm:rounded-[26px] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="mt-3 h-9 w-20" />
        </div>

        <SkeletonBlock className="h-11 w-11 rounded-2xl" />
      </div>
    </div>
  );
}

function AppointmentCardSkeleton() {
  return (
    <li className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_8px_25px_rgba(0,0,0,0.04)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SkeletonBlock className="h-7 w-20 rounded-full" />
            <SkeletonBlock className="h-7 w-28 rounded-full" />
            <SkeletonBlock className="h-7 w-36 rounded-full" />
          </div>

          <SkeletonBlock className="mt-4 h-5 w-52 max-w-full" />
          <SkeletonBlock className="mt-3 h-4 w-40 max-w-full" />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <SkeletonBlock className="h-4 w-20" />
        </div>
      </div>
    </li>
  );
}

function AppointmentCard({ item, todayKey, nowTs, onOpen }) {
  const key = item.date ? String(item.date) : "";
  const dateLabel = key ? formatDateUA(key) : "—";
  const isToday = key === todayKey;
  const statusMeta = getBookingStatusMeta(item, nowTs);

  return (
    <li className="group rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_8px_25px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:p-5">
      <button
        type="button"
        onClick={() => onOpen?.(item.id)}
        className="block w-full text-left"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                {item.time}
              </span>

              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  isToday
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700",
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {isToday ? "Сьогодні" : dateLabel}
              </span>

              <Badge className={statusMeta.badge}>
                <IconDot className={statusMeta.dot} />
                {statusMeta.label}
              </Badge>
            </div>

            <p className="mt-3 text-base font-semibold text-stone-800 sm:text-lg">
              {item.serviceName || "—"}
            </p>

            <p className="mt-1 truncate text-sm text-stone-500">
              Клієнт:{" "}
              <span className="font-semibold text-stone-800">
                {item.clientName || "—"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start text-xs font-semibold text-stone-400 sm:self-center">
            Детальніше
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>
        </div>
      </button>
    </li>
  );
}
// =========================
export default function Golowna() {
const { bookings, confirmBooking, cancelBooking, loading } = useBookings();
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [detailsId, setDetailsId] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [visibleAppointmentsCount, setVisibleAppointmentsCount] = useState(5);
const isInitialLoading = loading;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [socketState, setSocketState] = useState(
    socket.connected ? "ok" : "offline",
  );

const showStatsSkeleton = isInitialLoading;
const showAppointmentsSkeleton = isInitialLoading;


    useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const list = (bookings || []).filter(
      (b) =>
        b &&
        b.id &&
        (b.status === "confirmed" || b.status === "new" || !b.status),
    );

    const now = new Date(nowTs);
    const todayKey = toISODateKey(now);

    const weekStart = startOfWeekMonday(now);
    const weekEnd = addDays(weekStart, 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    let todayActive = 0;
    let weekActive = 0;
    let monthActive = 0;
    let todayNew = 0;

    for (const b of list) {
      const dt = getBookingDateTime(b);
      if (!dt) continue;
      if (dt.getTime() < nowTs) continue;

      const dateOnly = new Date(b.date);
      if (Number.isNaN(dateOnly.getTime())) continue;

      const key = toISODateKey(dateOnly);
      const isNew = !b.status || b.status === "new";

      if (key === todayKey) {
        todayActive++;
        if (isNew) todayNew++;
      }

      if (dateOnly >= weekStart && dateOnly < weekEnd) {
        weekActive++;
      }

      if (dateOnly >= monthStart && dateOnly < monthEnd) {
        monthActive++;
      }
    }

    return [
      {
        key: "today-active",
        title: "Активні на сьогодні",
        value: todayActive,
        icon: CalendarDays,
        accent: "emerald",
      },
      {
        key: "today-new",
        title: "Очікують підтвердження",
        value: todayNew,
        icon: Sparkles,
        accent: "amber",
      },
      {
        key: "week-active",
        title: "Активні на тижні",
        value: weekActive,
        icon: CheckCheck,
        accent: "blue",
      },
      {
        key: "month-active",
        title: "Активні на місяць",
        value: monthActive,
        icon: Users,
        accent: "rose",
      },
    ];
  }, [bookings, nowTs]);

  const selectedBooking = useMemo(() => {
    if (detailsId == null) return null;
    return (bookings || []).find((b) => b.id === detailsId) || null;
  }, [detailsId, bookings]);

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
  const upcomingAppointments = useMemo(() => {
    const list = (bookings || []).filter(
      (b) =>
        b &&
        b.id &&
        (b.status === "confirmed" || b.status === "new" || !b.status),
    );

    const upcoming = [];
    for (const b of list) {
      const dt = getBookingDateTime(b);
      if (!dt) continue;
      if (dt.getTime() < nowTs) continue;
      upcoming.push({ b, ts: dt.getTime() });
    }

    upcoming.sort((a, c) => a.ts - c.ts);

    return upcoming.map(({ b }) => ({
      ...b,
      date: b.date,
      time: parseTimeToHHMM(b.time) || b.time || "—",
      serviceName: b.serviceName || "—",
      clientName: b.clientName || "—",
    }));
  }, [bookings, nowTs]);

  const todayKey = toISODateKey(new Date(nowTs));

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
const upcomingAppointmentsResetKey = useMemo(
  () =>
    upcomingAppointments
      .map((item) => `${item.id}:${item.date || ""}:${item.time || ""}:${item.status || ""}`)
      .join("|"),
  [upcomingAppointments],
);
useEffect(() => {
  const id = window.setTimeout(() => {
    setVisibleAppointmentsCount(5);
  }, 0);

  return () => window.clearTimeout(id);
}, [upcomingAppointmentsResetKey]);

useEffect(() => {
  const studioId = localStorage.getItem("studioId");

  const joinStudio = () => {
    if (studioId) {
      socket.emit("join:studio", { studioId });
    }
    setSocketState("ok");
  };

  const handleConnect = () => {
    joinStudio();
  };

  const handleDisconnect = () => {
    setSocketState("offline");
  };

  const handleBookingUpdated = (payload) => {
    if (!payload) return;
    if (String(payload.studioId) !== String(studioId)) return;

    setIsRefreshing(true);
    setSocketState("pending");

    window.clearTimeout(handleBookingUpdated._t);
    handleBookingUpdated._t = window.setTimeout(() => {
      setIsRefreshing(false);
      setSocketState(socket.connected ? "ok" : "offline");
    }, 800);
  };

if (socket.connected) {
  joinStudio();
} else {
  const id = window.setTimeout(() => {
    setSocketState("offline");
  }, 0);

  return () => window.clearTimeout(id);
}

  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("booking:updated", handleBookingUpdated);

  return () => {
    socket.off("connect", handleConnect);
    socket.off("disconnect", handleDisconnect);
    socket.off("booking:updated", handleBookingUpdated);
    window.clearTimeout(handleBookingUpdated._t);
  };
}, []);

  const liveStatusUi =
    !isOnline || socketState === "offline"
      ? {
          text: "Немає інтернету",
          dotClass: "live-indicator live-indicator--offline",
          wrapClass: "border-red-200 bg-red-50 text-red-700",
        }
      : socketState === "pending" || isRefreshing
        ? {
            text: "Оновлення...",
            dotClass: "live-indicator live-indicator--pending",
            wrapClass: "border-amber-200 bg-amber-50 text-amber-700",
          }
        : {
            text: "Оновлюється автоматично",
            dotClass: "live-indicator live-indicator--ok",
            wrapClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
          };

  return (
    <div className="min-h-screen ">
      <div className="mx-auto w-full max-w-[1200px] space-y-6 ">
        <SectionShell>
          <div className="relative overflow-hidden px-5 pb-6 pt-6 sm:px-7 sm:pb-7 sm:pt-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_22%),radial-gradient(circle_at_left,rgba(16,185,129,0.08),transparent_24%)]" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">
                <Sparkles className="h-3.5 w-3.5" />
                dashboard студії
              </div>

              <h1
                className="
    mt-2 font-bold tracking-tight text-stone-800
    !text-[32px] leading-[1.2]        /* було 26 */
    sm:text-3xl sm:leading-[1.15]    /* трохи менше і на планшеті */
    lg:text-5xl
  "
              >
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <span>Вітаємо в кабінеті майстра</span>
                  <span className="hidden sm:inline">👋</span>
                </span>
              </h1>

              <p
                className="
    mt-3 text-stone-600
    text-[13.5px] leading-6        /* мобілка */
    sm:text-base sm:leading-7
  "
              >
                Керуйте студією, послугами та записами в одному теплому,
                сучасному та зручному просторі.
              </p>
            </div>
          </div>
        </SectionShell>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {showStatsSkeleton
            ? Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            : stats.map((item) => (
                <StatCard
                  key={item.key}
                  title={item.title}
                  value={item.value}
                  icon={item.icon}
                  accent={item.accent}
                />
              ))}
        </div>

        <SectionShell>
          <div className="px-5 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6">
            <div className="flex flex-col gap-2">
              {/* TOP ROW: Розклад + live */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
                  Розклад
                </p>

                <div className="flex shrink-0 items-center">
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold sm:text-xs",
                      liveStatusUi.wrapClass,
                    )}
                  >
                    <span className={liveStatusUi.dotClass} />
                    <span className="whitespace-nowrap">
                      {liveStatusUi.text}
                    </span>
                  </div>
                </div>
              </div>

              {/* TITLE */}
              <h2 className="text-2xl font-bold tracking-tight text-stone-800 sm:text-3xl">
                Найближчі записи
              </h2>

              {/* SUBTITLE */}
              <p className="text-sm text-stone-500">
                Тільки майбутні записи, відсортовані за датою та часом.
              </p>
            </div>

            {showAppointmentsSkeleton ? (
              <ul className="mt-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <AppointmentCardSkeleton key={i} />
                ))}
              </ul>
            ) : upcomingAppointments.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-stone-200 bg-stone-50 p-8 text-center text-sm text-stone-500">
                Немає запланованих записів
              </div>
            ) : (
              <>
                <ul className="mt-6 space-y-3">
                  {upcomingAppointments
                    .slice(0, visibleAppointmentsCount)
                    .map((item) => (
                      <AppointmentCard
                        key={item.id}
                        item={item}
                        todayKey={todayKey}
                        nowTs={nowTs}
                        onOpen={setDetailsId}
                      />
                    ))}
                </ul>

                {visibleAppointmentsCount < upcomingAppointments.length && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleAppointmentsCount((prev) => prev + 5)
                      }
                      className="inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition-all duration-200 hover:bg-stone-100 active:scale-[0.98]"
                    >
                      Показати ще
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </SectionShell>
      </div>
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
        size="lg"
      >
        {selectedBooking &&
          (() => {
            const statusMeta = getBookingStatusMeta(selectedBooking, nowTs);
            const StatusIcon = statusMeta.Icon;
            const isCanceled = selectedBooking.status === "canceled";
            const isConfirmed = selectedBooking.status === "confirmed";
            const isDeleted = selectedBooking.status === "deleted";
            const dt = getBookingDateTime(selectedBooking);
            const isArchived = dt ? dt.getTime() < nowTs : false;
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
                          <Badge className={statusMeta.badge}>
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
                        <StatusIcon className="h-7 w-7" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                          <CalendarDays className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                            Дата і час
                          </p>

                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm font-bold text-stone-800">
                            <span>{renderBookingDate(selectedBooking)}</span>

                            <span className="text-stone-400">•</span>

                            <span className="flex items-center gap-1">
                              <Clock3 className="h-4 w-4" />
                              {time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="rounded-[22px] border border-stone-200 bg-white p-3 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.08)] sm:rounded-[24px] sm:p-4">
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

                    <div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50/70 p-2.5 sm:mt-4 sm:p-3">
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
                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:justify-end">
                  {!isConfirmed && !isCanceled && !isArchived && !isDeleted && (
                    <Button
                      variant="primary"
                      onClick={async () => {
                        try {
                          await confirmBooking(selectedBooking.id);
                        } catch (e) {
                          alert(e.message || "Не вдалося підтвердити запис");
                        }
                      }}
                    >
                      <Check className="h-4 w-4" />
                      Підтвердити запис
                    </Button>
                  )}

                  {!isCanceled && !isArchived && !isDeleted && (
                    <Button
                      variant="danger"
                      onClick={() => setCancelConfirmId(selectedBooking.id)}
                    >
                      Скасувати запис
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setDetailsId(null);
                      setCopiedPhone(false);
                    }}
                  >
                    Закрити
                  </Button>
                </div>
              </div>
            );
          })()}
      </Modal>
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
                  setDetailsId(null);
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
    </div>
  );
}
