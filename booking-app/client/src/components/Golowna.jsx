import { useEffect, useMemo, useRef, useState } from "react";
import { useBookings } from "../context/bookings/useBookings";
import {
  Sparkles,
  CalendarDays,
  Clock,
  Users,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  X,
  Trash2,
  Check,
  XCircle,
  UserRound,
  Copy,
  Clock3,
  Banknote,
  Timer,
  Phone,
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

function formatDateFullUA(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";

  const months = [
    "січня",
    "лютого",
    "березня",
    "квітня",
    "травня",
    "червня",
    "липня",
    "серпня",
    "вересня",
    "жовтня",
    "листопада",
    "грудня",
  ];

  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}р.`;
}

function formatDateUA(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
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
      badge: "badge-theme-neutral",
      dot: "bg-[var(--color-caramel)]",
      iconBg: "status-theme-archived",
      Icon: Trash2,
    };
  }

  if (isArchived) {
    return {
      label: "Сеанс завершено",
      badge: "badge-theme-archived",
      dot: "bg-[var(--color-caramel)]",
      iconBg: "status-theme-archived",
      Icon: CheckCheck,
      text: "text-[var(--color-archived-dark)]",
    };
  }

  if (isConfirmed) {
    return {
      label: "Підтверджено",
      badge: "badge-theme-success",
      dot: "bg-[var(--color-buttom-ok)]",
      iconBg: "status-theme-success",
      Icon: Check,
      text: "text-[var(--color-confirmed-dark)]",
    };
  }

  if (isCanceled) {
    return {
      label: canceledBy === "client" ? "Скасовано клієнтом" : "Скасовано вами",
      badge: "badge-theme-danger",
      dot: "bg-[var(--color-danger)]",
      iconBg: "status-theme-danger",
      Icon: XCircle,
      text: "text-[var(--color-canceled-dark)]",
    };
  }

  return {
    label: "Очікує ваше підтвердження",
    badge: "badge-theme-warning",
    dot: "bg-[var(--color-dot-wait)]",
    iconBg: "status-theme-warning",
    Icon: Clock,
    text: "text-[var(--color-pending-dark)]",
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

function SectionShell({ children, className = "" }) {
  return (
    <div className={cn("ui-shell", className)}>
      <div className="ui-shell-line" />
      {children}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, accent = "emerald" }) {
  const displayValue = formatCompactNumber(value);

  const iconTone =
    accent === "amber"
      ? "bg-[var(--color-pending-bg)] text-[var(--color-caramel)]"
      : accent === "blue"
        ? "bg-[var(--color-archived-bg)] text-[var(--color-ink)]"
        : accent === "rose"
          ? "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
          : "bg-[var(--color-confirmed-bg)] text-[var(--color-forest)]";

  return (
    <div className="group rounded-[22px] border border-[var(--color-cream)] bg-gradient-to-br from-white via-[var(--color-cream)] to-white p-3 shadow-[0_10px_28px_rgba(27,27,27,0.06)] transition-all duration-300 hover:shadow-[0_14px_34px_rgba(27,27,27,0.10)] sm:rounded-[26px] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
         <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary-buttom)] sm:text-[10px] sm:tracking-[0.18em]">
            {title}
          </p>

          <div className="ui-title-section mt-2 text-2xl sm:mt-3 sm:text-4xl">
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
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold",
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

function Modal({ open, onClose, children, footer, size = "md" }) {
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
      className="fixed inset-0 z-[950] flex items-center justify-center bg-[rgba(5,5,5,0.40)] p-4 backdrop-blur-sm sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cn(
          "relative w-full max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl",
          "animate-in fade-in-0 slide-in-from-bottom duration-200",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[calc(90vh-72px)] overflow-y-auto px-4 py-6 sm:px-5 sm:py-7">
          {children}
        </div>

        {footer && (
          <div className="border-soft border-t bg-white px-4 py-4 sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Button({ variant = "secondary", className = "", children, ...props }) {
  const variants = {
    primary: "btn-theme-primary",
    secondary: "btn-theme-secondary border",
    danger: "btn-theme-danger border",
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

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[linear-gradient(90deg,var(--surface-card-alt),var(--surface-card-strong),var(--surface-card-alt))] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-card-theme border-soft rounded-[22px] border p-3 shadow-[0_8px_25px_rgba(27,27,27,0.04)] sm:rounded-[26px] sm:p-5">
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
    <li className="bg-card-theme border-soft rounded-[24px] border p-4 shadow-[0_8px_25px_rgba(27,27,27,0.04)] sm:p-5">
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

  const isCanceled = item.status === "canceled";
  const isConfirmed = item.status === "confirmed";
  const dt = getBookingDateTime(item);
  const isArchived = dt ? dt.getTime() < nowTs : false;

  return (
    <li className="ui-card ui-card-hover group p-4 sm:p-5">
      <button
        type="button"
        onClick={() => onOpen?.(item.id)}
        className="block w-full text-left"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center justify-center gap-2 px-2.5 py-1 text-xs font-semibold rounded-2xl border border-[var(--border-soft)] bg-white shadow-sm transition-all duration-200 ",
                    statusMeta.text,
                  )}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {item.time}
                </span>

                <span
                  className={cn(
                    "inline-flex items-center justify-center gap-2 px-2.5 py-1 text-xs font-semibold rounded-2xl border border-[var(--border-soft)] bg-white shadow-sm transition-all duration-200 ",
                    statusMeta.text,
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {isToday ? "Сьогодні" : dateLabel}
                </span>

                <span
                  className={cn(
                    "inline-flex items-center justify-center gap-2 px-2.5 py-1 text-xs font-semibold rounded-2xl border border-[var(--border-soft)] bg-white shadow-sm transition-all duration-200 ",
                    statusMeta.text,
                  )}
                >
                  <IconDot className={statusMeta.dot} />
                  {statusMeta.label}
                </span>
              </div>
            </div>

            <p className="ui-title-section mt-3 text-base sm:text-lg">
              {item.serviceName || "—"}
            </p>

            <p className="ui-text-muted mt-1 truncate text-sm">
              Клієнт:{" "}
              <span className="ui-title-section font-semibold">
                {item.clientName || "—"}
              </span>
            </p>
          </div>

          <div className="text-label flex items-center gap-2 self-start text-xs font-semibold sm:self-center">
            Детальніше
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>
        </div>
      </button>
    </li>
  );
}

function updateCalendarScrollState(el, setHasScroll, setShowScrollHint) {
  if (!el) return;

  const isScrollable = el.scrollHeight > el.clientHeight;
  const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 12;

  setHasScroll(isScrollable);
  setShowScrollHint(isScrollable && !isAtBottom);
}

export default function Golowna() {
  const { bookings, confirmBooking, cancelBooking, loading } = useBookings();
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [detailsId, setDetailsId] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [showDetailsScrollHint, setShowDetailsScrollHint] = useState(true);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [hasScroll, setHasScroll] = useState(false);
  const calendarScrollRef = useRef(null);
  const [visibleAppointmentsCount, setVisibleAppointmentsCount] = useState(5);
  const isInitialLoading = loading;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [socketState, setSocketState] = useState(
    socket.connected ? "ok" : "offline",
  );

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
        .map(
          (item) =>
            `${item.id}:${item.date || ""}:${item.time || ""}:${item.status || ""}`,
        )
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

const liveStatusUi = useMemo(() => {
  const base =
    "inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-3 py-1.5 text-[13px] font-semibold shadow-[var(--shadow-card)]";

  if (!isOnline || socketState === "offline") {
    return {
      text: "Немає інтернету",
      dotClass:
        "h-2 w-2 rounded-full bg-[var(--color-canceled)] shadow-[0_0_0_3px_var(--color-canceled-light)] animate-[pulse-soft_1.8s_ease-in-out_infinite]",
      wrapClass: `${base} text-[var(--color-canceled-dark)]`,
    };
  }

  if (socketState === "pending" || isRefreshing) {
    return {
      text: "Оновлення...",
      dotClass:
        "h-2 w-2 rounded-full bg-[var(--color-pending)] shadow-[0_0_0_3px_var(--color-pending-light)] animate-[pulse-soft_1.8s_ease-in-out_infinite]",
      wrapClass: `${base} text-[var(--color-pending-dark)]`,
    };
  }

  return {
    text: "Оновлюється автоматично",
    dotClass:
      "h-2 w-2 rounded-full bg-[var(--color-confirmed)] shadow-[0_0_0_3px_var(--color-confirmed-light)] animate-[pulse-soft_1.8s_ease-in-out_infinite]",
    wrapClass: `${base} text-[var(--color-confirmed-dark)]`,
  };
}, [isOnline, socketState, isRefreshing]);

  return (
    <div className="">
      <div className="mx-auto w-full max-w-[1200px] space-y-3">
        <SectionShell>
          <div className="relative overflow-hidden px-5 pb-6 pt-6 sm:px-7 sm:pb-7 sm:pt-7">
            <div className="absolute inset-0" />

            <div className="relative z-10">
                          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-cream)] px-3 py-1.5">
              <Sparkles className="h-4 w-4 text-[var(--color-forest)]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink)]">
                 dashboard студії
              </span>
            </div>
             

              <h1 className="ui-title-hero mt-2 !text-[32px] leading-[1.2] sm:text-3xl sm:leading-[1.15] lg:text-5xl">
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <span>Вітаємо в кабінеті майстра</span>
                </span>
              </h1>

              <p className="ui-text-muted mt-3 text-[13.5px] leading-6 sm:text-base sm:leading-7">
                Керуйте студією, послугами та записами в одному теплому,
                сучасному та зручному просторі.
              </p>
            </div>
          </div>
        </SectionShell>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {isInitialLoading
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
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 sm:text-xs sm:tracking-[0.22em]">
                  Розклад
                </p>

<div
  className={cn(
    "inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold shadow-sm sm:text-xs",
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


              </div>

              <h2 className="ui-title-section text-2xl sm:text-3xl">
                Найближчі записи
              </h2>

              <p className="ui-text-muted text-sm">
                Тільки майбутні записи, відсортовані за датою та часом.
              </p>
            </div>

            {isInitialLoading ? (
              <ul className="mt-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <AppointmentCardSkeleton key={i} />
                ))}
              </ul>
            ) : upcomingAppointments.length === 0 ? (
              <div className="ui-empty-panel mt-6 p-8 text-center text-sm">
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
                      className="ui-button-secondary inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
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

      {selectedBooking &&
        detailsId != null &&
        (() => {
          const isCanceled = selectedBooking.status === "canceled";
          const isConfirmed = selectedBooking.status === "confirmed";
          const isDeleted = selectedBooking.status === "deleted";
          const dt = getBookingDateTime(selectedBooking);
          const isArchived = dt ? dt.getTime() < nowTs : false;

          const statusMeta = isArchived
            ? {
                label: "Завершено",
                top: "from-[var(--color-archived-light)] to-white",
                Icon: CheckCheck,
                iconColor: "text-[var(--color-archived-dark)]",
                pillText: "text-[var(--color-archived-dark)]",
                accent: "text-[var(--color-archived)]",
              }
            : isConfirmed
              ? {
                  label: "Підтверджено",
                  top: "from-[var(--color-confirmed-light)] to-white",
                  Icon: Check,
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
              onClick={() => {
                setDetailsId(null);
                setCopiedPhone(false);
                setShowDetailsScrollHint?.(true);
              }}
            >
              <div
                className={cn(
                  "relative flex w-full flex-col overflow-hidden bg-white",
                  "h-[100dvh] rounded-none border-0 shadow-none",
                  "sm:h-auto sm:max-h-[80vh] sm:max-w-[420px] sm:rounded-[34px] sm:border sm:border-[var(--color-cream)] sm:shadow-[0_35px_100px_rgba(27,27,27,0.18)]",
                )}
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
                        setShowDetailsScrollHint?.(true);
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
                        setShowDetailsScrollHint?.(true);
                      }}
                      className="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--color-ink)] shadow-[0_4px_18px_rgba(27,27,27,0.08)] transition hover:bg-[var(--color-cream)]"
                      aria-label="Закрити"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-2 flex justify-center">
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
                      <Clock3 className={cn("h-4 w-4", statusMeta.iconColor)} />
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
                      <Timer className={cn("h-4 w-4", statusMeta.iconColor)} />
                      <span className="text-[var(--color-ink)]">
                        {duration != null ? `${duration} хв` : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-1 sm:px-5 sm:pb-5">
                  <div
                    className="calendar-day-scroll min-h-0 flex-1 overflow-y-auto pb-16 sm:pb-6"
                    onScroll={(e) => {
                      const el = e.currentTarget;
                      const isScrollable = el.scrollHeight > el.clientHeight;
                      const isAtBottom =
                        el.scrollTop + el.clientHeight >= el.scrollHeight - 12;

                      setHasScroll?.(isScrollable);
                      setShowScrollHint?.(isScrollable && !isAtBottom);
                    }}
                  >
                    <div className="space-y-3">
                      <div className="rounded-[26px] border border-[#e6ebe3]  from-[#f6faf4] via-[#edf4ea] to-[#fbfdf9] p-4 shadow-[0_8px_24px_rgba(120,140,120,0.08)]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--color-ink)] shadow-sm">
                            <UserRound className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-caramel)]">
                              Клієнт
                            </span>
                            <p className="truncate text-[15px] font-extrabold text-[var(--color-ink)]">
                              {clientName}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[26px] border border-[#e6ebe3]  from-[#f6faf4] via-[#edf4ea] to-[#fbfdf9] p-4 shadow-[0_8px_24px_rgba(120,140,120,0.08)]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white font-bold text-[var(--color-ink)] shadow-sm">
                            {masterName?.[0] || "—"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-caramel)]">
                              Майстер
                            </span>
                            <p className="truncate text-[15px] font-extrabold text-[var(--color-ink)]">
                              {masterName}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[26px] border border-[#e6ebe3]  from-[#f6faf4] via-[#edf4ea] to-[#fbfdf9] p-4 ">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--color-ink)] shadow-sm">
                            <Phone className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-caramel)]">
                              Телефон клієнта
                            </span>
                            <p className="truncate text-[15px] font-extrabold text-[var(--color-ink)]">
                              {phone || "—"}
                            </p>
                          </div>

                          {phone ? (
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(phone)}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--color-ink)] shadow-sm transition hover:bg-[var(--color-cream)]"
                              aria-label="Скопіювати телефон"
                              title="Скопіювати телефон"
                            >
                              {copiedPhone ? (
                                <CheckCheck className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <div className="h-10 w-10 shrink-0 rounded-2xl bg-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>


                  {!isConfirmed && !isCanceled && !isArchived && !isDeleted ? (
                    <>
<button
  type="button"
  onClick={async () => {
    try {
      await confirmBooking(selectedBooking.id);
    } catch (e) {
      alert(e.message || "Не вдалося підтвердити запис");
    }
  }}
  className={cn(
    "mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white",
    "bg-gradient-to-r from-[#9fb29a] to-[#7f9a78]",
    "shadow-[0_10px_24px_rgba(127,154,120,0.25)]",
    "transition-all duration-200 active:scale-[0.98]",
    "hover:from-[#8fa88a] hover:to-[#6f8c69]"
  )}
>
  <Check className="h-4 w-4" />
  Підтвердити запис
</button>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setCancelConfirmId(selectedBooking.id)}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98],
"
                        >
                          <XCircle className="h-4 w-4" />
                          Скасувати
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDetailsId(null);
                            setCopiedPhone(false);
                            setShowDetailsScrollHint?.(true);
                          }}
                          className="ui-button-secondary inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold shadow-sm transition-all duration-200 active:scale-[0.98]"
                        >
                          Закрити
                        </button>
                      </div>
                    </>
                  ) : !isCanceled && !isArchived && !isDeleted ? (
                    <div className="mt-8 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCancelConfirmId(selectedBooking.id)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
                      >
                        <XCircle className="h-4 w-4" />
                        Скасувати
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDetailsId(null);
                          setCopiedPhone(false);
                          setShowDetailsScrollHint?.(true);
                        }}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
                      >
                        Закрити
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsId(null);
                        setCopiedPhone(false);
                        setShowDetailsScrollHint?.(true);
                      }}
                      className="ui-button-secondary mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold shadow-sm transition-all duration-200 active:scale-[0.98]"
                    >
                      Закрити
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-danger)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(213,92,82,0.28)] transition-all duration-200 hover:bg-[var(--color-danger-dark)] active:scale-[0.98] sm:w-auto"
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
              Запис залишиться в системі, але буде позначений як скасований і
              більше не вважатиметься активним.
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
                  Клієнт отримає статус скасованого.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
