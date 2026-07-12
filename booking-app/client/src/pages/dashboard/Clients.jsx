// Clients.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/http";
import XLSX from "xlsx-js-style";
import { useStudio } from "../../context/studio/useStudio";
import { useBookings } from "../../context/bookings/useBookings";
import {
  AlertTriangle,
  CalendarDays,
  Camera,
  CheckCircle2,
  Download,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
ClipboardPen,
Clock3,
PhoneCall,
Timer,


  FileSpreadsheet,
  Clock,
  X,
  XCircle,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  Check,
  Crown,
  NotebookText,
  Repeat,
  Search,
  ShieldOff,
  Sparkles,
  Star,
  TrendingDown,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  Archive,
  BadgeCheck,
  Heart,
  UserStar,
  Scissors,
  User,
  Cake,
  Phone,
  Mail,
  Copy,
  ContactRound,
  MoreVertical,
  Plus,
  CircleCheckBig,
  CookingPot,
  PartyPopper,
  Banknote,
  Receipt,
  CircleAlert,
  ArrowDownToLine,
  Eye,
  TrendingUp,
  PhoneOff,
} from "lucide-react";

const PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

async function uploadClientPhoto(studioId, file) {
  const token = localStorage.getItem("token");
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/media/studio/${studioId}/client-photo`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    },
  );

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `Upload failed (${res.status})`);
  }

  return data;
}

function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return PUBLIC ? `${PUBLIC}/${s}` : s;
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function initialsFromName(name) {
  const s = String(name || "").trim();
  if (!s) return "C";

  return (
    s
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "C"
  );
}

function formatMoney(value) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function dateScore(value) {
  if (!value) return 0;

  const raw = String(value);

  if (raw.includes("T") || raw.includes("-")) {
    const time = new Date(raw).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  const [day, month, year] = raw.split(".").map(Number);
  return new Date(year || 0, (month || 1) - 1, day || 1).getTime();
}

function formatDateUA(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("uk-UA");
}

function getBookingStatusUi(status, canceledBy = null) {
  const base =
    "border border-[#eadbc9] bg-white shadow-[0_8px_22px_rgba(17,17,17,0.05)]";

  if (status === "CONFIRMED") {
    return {
      text: "Підтверджено",
      icon: CircleCheckBig,
      badge: `${base} text-[#0f8a5f]`,
    };
  }

  if (status === "CANCELED") {
    const canceledText =
      canceledBy === "owner" || canceledBy === "studio"
        ? "Скасовано вами"
        : "Скасовано клієнтом";

    return {
      text: canceledText,
      icon: XCircle,
      badge: `${base} text-[#e5484d]`,
    };
  }

  if (status === "COMPLETED") {
    return {
      text: "Сеанс завершено",
      icon: PartyPopper,
      badge: "border border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280]",
    };
  }

  return {
    text: "Очікує підтвердження",
    icon: Clock,
    badge: `${base} text-[#ff5a00]`,
  };
}

function parseClientTimeToHHMM(timeStr) {
  const value = String(timeStr || "").trim();

  if (!value) return "";

  const cleaned = value.replace(".", ":");
  const match = cleaned.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) return value;

  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const minutes = Math.min(59, Math.max(0, Number(match[2])));

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getClientBookingDateTime(booking) {
  const rawDate = String(booking?.date || "");

  if (!rawDate) return null;

  if (rawDate.includes("T")) {
    const date = new Date(rawDate);

    if (!Number.isNaN(date.getTime())) return date;
  }

  const time = parseClientTimeToHHMM(booking?.time) || "00:00";
  const date = new Date(`${rawDate.slice(0, 10)}T${time}:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getClientBookingStatusMeta(booking) {
  const status = String(booking?.status || "").toUpperCase();
  const canceledBy = String(booking?.canceledBy || "").toLowerCase();

  if (status === "CONFIRMED") {
    return {
      status: "confirmed",
      label: "Підтверджено",
      Icon: CheckCheck,
      text: "text-[#41a85f]",
      border: "border-[#bbf7d0]",
      dateText: "text-[#41a85f]",
      top: "from-[#eafaf0] to-white",
      iconColor: "text-[#41a85f]",
      pillText: "text-[#41a85f]",
      accent: "text-[#41a85f]",
    };
  }

  if (status === "CANCELED") {
    return {
      status: "canceled",
      label:
        canceledBy === "owner" || canceledBy === "studio"
          ? "Скасовано вами"
          : "Скасовано клієнтом",
      Icon: XCircle,
      text: "text-[#ef4444]",
      border: "border-[#fecaca]",
      dateText: "text-[#ef4444]",
      top: "from-[#fff1f1] to-white",
      iconColor: "text-[#ef4444]",
      pillText: "text-[#ef4444]",
      accent: "text-[#ef4444]",
    };
  }

  if (status === "COMPLETED") {
    return {
      status: "completed",
      label: "Сеанс завершено",
      Icon: PartyPopper,
      text: "text-[#6b7280]",
      border: "border-[#d1d5db]",
      dateText: "text-[#6b7280]",
      top: "from-[#f3f4f6] to-white",
      iconColor: "text-[#6b7280]",
      pillText: "text-[#6b7280]",
      accent: "text-[#6b7280]",
    };
  }

  return {
    status: "pending",
    label: "Очікує підтвердження",
    Icon: Clock,
    text: "text-[#ffb020]",
    border: "border-[#fed7aa]",
    dateText: "text-[#ffb020]",
    top: "from-[#fff7ed] to-white",
    iconColor: "text-[#ffb020]",
    pillText: "text-[#ffb020]",
    accent: "text-[#ffb020]",
  };
}

function ClientHistoryBookingCard({ booking, client, onClick }) {
  const fullName =
    [client?.firstName, client?.lastName].filter(Boolean).join(" ") ||
    "Клієнт";

  const statusMeta = getClientBookingStatusMeta(booking);
  const StatusIcon = statusMeta.Icon;

  const date = getClientBookingDateTime(booking);
  const timeLabel =
    parseClientTimeToHHMM(booking?.time) ||
    (date
      ? `${String(date.getHours()).padStart(2, "0")}:${String(
          date.getMinutes(),
        ).padStart(2, "0")}`
      : "—");

  const dayLabel =
    date && !Number.isNaN(date.getTime())
      ? String(date.getDate()).padStart(2, "0")
      : "—";

  const monthLabel =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString("uk-UA", { month: "long" })
      : "";

  return (
    <li className="list-none">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group mt-1 w-full overflow-hidden rounded-[24px] border border-[#eadfce] bg-white text-left transition-all duration-200",
          "hover:-translate-y-0.5 hover:!border-[#ffd6bd] hover:!bg-[#fff7f0]",
          "active:scale-[0.99]",
          "focus:outline-none focus:ring-4 focus:ring-[#ff6200]/10",
          statusMeta.status === "completed" && "opacity-85",
        )}
      >
        <div className="grid min-h-[108px] grid-cols-[92px_minmax(0,1fr)_96px] items-center gap-3 px-4 py-3 max-[639px]:min-h-0 max-[639px]:grid-cols-[1fr_82px] max-[639px]:gap-3 max-[639px]:px-3 max-[639px]:py-3">
          <div className="contents max-[639px]:block max-[639px]:min-w-0">
            <div className="mb-2 hidden justify-center max-[639px]:flex">
              <div
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-full border border-[#eadfce] bg-white px-3 py-1 text-center text-[10px] font-black shadow-sm",
                  statusMeta.text,
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" />

                <span className="text-center leading-[1.05]">
                  {statusMeta.label}
                </span>
              </div>
            </div>

            <div className="contents max-[639px]:flex max-[639px]:items-center max-[639px]:gap-3">
              <div className="grid h-[70px] w-[70px] shrink-0 place-items-center overflow-hidden rounded-full border border-[#eadfce] bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:ml-2 lg:ml-3 max-[639px]:h-[64px] max-[639px]:w-[64px]">
                <Avatar
                  name={booking.master || "Майстер"}
                  photoUrl={booking.masterPhotoUrl || ""}
                  className="h-full w-full rounded-full border-0"
                />
              </div>

              <div className="min-w-0">
                <div
                  className={cn(
                    "mb-2 inline-flex w-fit items-center justify-center gap-1.5 rounded-full border border-[#eadfce] bg-white px-3 py-1 text-[10px] font-black shadow-sm max-[639px]:hidden",
                    statusMeta.text,
                  )}
                >
                  <StatusIcon className="h-3.5 w-3.5" />

                  <span className="text-center leading-[1.05]">
                    {statusMeta.label}
                  </span>
                </div>

                <h2 className="line-clamp-1 text-[16px] font-black leading-tight tracking-[-0.04em] text-[#202020] max-[639px]:text-[13px] lg:text-[18px]">
                  {booking.master || "Майстер"}
                </h2>

                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#77716b] max-[767px]:mt-1 max-[767px]:text-[8px] lg:text-[10px]">
                  <ClipboardPen className="h-4 w-4 shrink-0 text-[#77716b] max-[767px]:h-3 max-[767px]:w-3" />

                  <span className="line-clamp-2">
                    {booking.service || "Послуга"}
                  </span>
                </div>

              </div>
            </div>
          </div>

          <div
            className={cn(
              "hidden h-full items-center justify-center border-l pl-3 max-[639px]:flex",
              statusMeta.border,
            )}
          >
            <div className="flex h-[74px] w-[58px] flex-col items-center justify-center">
              <p className="text-center text-[11px] font-bold capitalize text-[#aaa19a]">
                {monthLabel}
              </p>

              <p
                className={cn(
                  "text-[28px] font-[300] leading-none tracking-[-0.05em]",
                  statusMeta.dateText,
                )}
              >
                {dayLabel}
              </p>

              <p className="text-[12px] font-semibold tracking-[0.08em] text-[#5f5a55]">
                {timeLabel}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "mr-2 flex items-center justify-center border-l pl-5 max-[639px]:hidden",
              statusMeta.border,
            )}
          >
            <div className="flex h-[82px] w-[78px] flex-col items-center justify-center">
              <span className="text-[13px] font-bold capitalize text-[#aaa19a]">
                {monthLabel}
              </span>

              <span
                className={cn(
                  "mt-0.5 text-[36px] font-[300] leading-none tracking-[-0.05em]",
                  statusMeta.dateText,
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
      </button>
    </li>
  );
}

function ClientFallbackAvatar({ name, className = "", textClassName = "" }) {
  const initials = initialsFromName(name);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden border border-[#e6ddd3] bg-[#f6f3ee]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_22px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#fbfaf8_0%,#f1ebe4_48%,#e8ded4_100%)]" />

      <div className="absolute left-[-18%] top-[-22%] h-[70%] w-[70%] rounded-full bg-white/70 blur-xl" />
      <div className="absolute bottom-[-28%] right-[-24%] h-[76%] w-[76%] rounded-full bg-[#d8cec3]/45 blur-2xl" />

      <div className="absolute inset-x-0 top-0 h-px bg-white/80" />

      <span
        className={cn(
          "relative z-10 font-black tracking-[-0.06em] text-[#756d66]",
          textClassName || "text-[24px]",
        )}
      >
        {initials}
      </span>
    </div>
  );
}

function Avatar({ name, photoUrl, className = "" }) {
  const initials = initialsFromName(name);
  const src = toPublicUrl(photoUrl);

  return (
    <div
      className={cn(
    "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-[#eadfce] bg-[#f6f3ee] ",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name || "Клієнт"}
          className="h-full w-full object-cover"
        />
) : (
  <ClientFallbackAvatar
    name={name}
    className="h-full w-full rounded-[20px]"
    textClassName="text-[25px]"
  />
)}
    </div>
  );
}

function Button({ variant = "secondary", className = "", children, ...props }) {
  const variants = {
    primary:
      "bg-[var(--color-primary-buttom)] text-white hover:bg-[#4a4a4a]",
    secondary:
      "border border-[#eadbc9] bg-white text-[#202020] shadow-sm hover:border-[#ffd6bd] hover:bg-[#fff7f0]",
    danger:
      "border border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00] shadow-sm hover:border-[#ff5a00] hover:bg-[#ffe5d4]",
    ghost: "text-[#202020] hover:bg-[#fff7f0]",
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

function MiniChart({ data = [], trend = "flat" }) {
  const trendColor = {
    up: "text-emerald-500",
    flat: "text-sky-500",
    down: "text-rose-500",
  };

  const points = useMemo(() => {
    const values = data.length ? data.map(Number) : [0, 0, 0, 0, 0, 0, 0];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return values.map((v, i) => ({
      x: i * (108 / Math.max(values.length - 1, 1)),
      y: 54 - ((v - min) / range) * 40,
    }));
  }, [data]);

  const smoothPath = points
    .map((point, i, arr) => {
      if (i === 0) return `M ${point.x} ${point.y}`;

      const prev = arr[i - 1];
      const cx = (prev.x + point.x) / 2;

      return `C ${cx} ${prev.y}, ${cx} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(" ");

  const areaPath = `${smoothPath} L ${points.at(-1).x} 60 L ${points[0].x} 60 Z`;
  const gradientId = `mini-chart-${trend}-${data.join("-")}`;

  return (
    <svg
      viewBox="0 0 108 60"
      className={cn("hidden h-14 w-28 shrink-0 sm:block", trendColor[trend])}
      fill="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill={`url(#${gradientId})`} />

      <path
        d={smoothPath}
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx={points.at(-1).x}
        cy={points.at(-1).y}
        r="4"
        fill="currentColor"
      />
    </svg>
  );
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
        "group relative overflow-hidden rounded-[15px] border border-[#ebe7df] bg-white shadow-[0_14px_44px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

      {(title || subtitle || badge || actions) && (
        <div className="flex flex-col gap-3 border-b border-[#f1ece5] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {typeof title === "string" ? (
                <h2 className="text-lg font-black tracking-[-0.03em] text-[#202020]">
                  {title}
                </h2>
              ) : (
                title
              )}

              {badge && (
                <span className="inline-flex items-center rounded-full bg-[#fff4ec] px-2.5 py-1 text-xs font-black text-[#ff6200]">
                  {badge}
                </span>
              )}
            </div>

            {subtitle && (
              <p className="mt-1 text-sm font-medium leading-5 text-[#7b766f]">
                {subtitle}
              </p>
            )}
          </div>

          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}

      <div className="p-5">{children}</div>
    </section>
  );
}

function Modal({
  open,
  onClose,
  title,
  badge = "Редагування",
  icon: Icon = NotebookText,
  children,
  footer,
  size = "md",
}) {
  useEffect(() => {
    if (!open) return undefined;

    document.body.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
<div
  className="fixed inset-0 z-[9999] flex items-stretch justify-center bg-[#202020]/45 p-0 backdrop-blur-[6px] sm:items-center sm:p-6"
  onMouseDown={(e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }}
>
      <div
        className={cn(
          "flex h-dvh w-full flex-col overflow-hidden rounded-none border-0 bg-[#f7f5f1] shadow-[0_30px_90px_rgba(15,23,42,0.24)]",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          "sm:h-auto sm:max-h-[calc(100dvh-48px)] sm:rounded-[30px] sm:border sm:border-[#f0e2d3]",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="relative shrink-0 overflow-hidden bg-[#f3eee7] px-5 py-5 sm:px-6 sm:py-6">
            <div className="absolute right-[-55px] top-[-70px] h-[180px] w-[180px] rounded-full bg-[#ff6200]/10 blur-3xl" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
                  <Icon className="h-3.5 w-3.5" />
                  {badge}
                </span>

                <h3 className="mt-3 text-[26px] font-black leading-[0.95] tracking-[-0.05em] text-[#202020] sm:text-[32px]">
                  {title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => onClose?.()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#77716b] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96]"
                aria-label="Закрити"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5 pb-[110px] sm:px-6 sm:pb-5">
          {children}
        </div>

        {footer && (
          <div className="sticky bottom-0 shrink-0 border-t border-[#f0e7da] bg-[#fbfaf8] px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  chartData = [],
  hideChart = false,
}) {
  const first = chartData?.[0] ?? 0;
  const last = chartData?.[chartData.length - 1] ?? 0;

  const trend = last > first ? "up" : last < first ? "down" : "flat";

  const trendStyles = {
    up: {
      text: "text-[#ff5a00]",
      bg: "from-[#fff1e8] via-white to-[#fff7f0]",
      iconBg: "from-[#fff1e8] to-white",
    },
    flat: {
      text: "text-[#77716b]",
      bg: "from-[#f3eee7] via-white to-[#fff7f0]",
      iconBg: "from-[#f3eee7] to-white",
    },
    down: {
      text: "text-[#e5484d]",
      bg: "from-[#fff1f1] via-white to-[#fff7f7]",
      iconBg: "from-[#fff1f1] to-white",
    },
  };

  const style = trendStyles[trend];

  return (
    <div
      className={cn(
        "group relative min-h-[112px] overflow-hidden rounded-[26px] border border-[#eadbc9] bg-gradient-to-br p-3.5 shadow-[0_12px_32px_rgba(17,17,17,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(17,17,17,0.09)] sm:min-h-[128px] sm:p-4 lg:min-h-[138px] lg:rounded-[30px] lg:p-5",
        style.bg,
      )}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />

      <div className="relative z-10 flex h-full items-center gap-3 sm:gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-white/80 bg-gradient-to-br shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-all duration-300 group-hover:scale-105 sm:h-14 sm:w-14 sm:rounded-[20px] lg:h-16 lg:w-16 lg:rounded-[22px]",
            style.iconBg,
          )}
        >
          <Icon
            className={cn("h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7", style.text)}
            strokeWidth={2.6}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-[#77716b] sm:text-[10px] lg:text-[11px]">
            {label}
          </p>

          <p className="mt-2 truncate text-[20px] font-black leading-none tracking-tight text-[#202020] sm:text-2xl lg:text-[28px]">
            {value}
          </p>

          {hint && (
            <p className="mt-2 truncate text-[11px] font-semibold text-[#77716b] sm:text-xs lg:text-sm">
              {hint}
            </p>
          )}
        </div>

        {!hideChart && <MiniChart data={chartData} trend={trend} />}
      </div>
    </div>
  );
}

const clientStatusBadgeClass =
  "border-[#eadbc9] bg-white shadow-[0_8px_22px_rgba(17,17,17,0.05)]";

const clientStatusIconClass = "text-[#ff6200]";

const statusMeta = {
  loyal: {
    label: "Постійний",
    icon: Repeat,
    className: clientStatusBadgeClass,
    iconClassName: clientStatusIconClass,
  },

  new: {
    label: "Новий",
    icon: UserPlus,
    className: clientStatusBadgeClass,
    iconClassName: clientStatusIconClass,
  },

  attention: {
    label: "Активний",
    icon: TrendingUp,
    className: clientStatusBadgeClass,
    iconClassName: clientStatusIconClass,
  },

  risk: {
    label: "Неактивний",
    icon: TrendingDown,
    className: clientStatusBadgeClass,
    iconClassName: clientStatusIconClass,
  },

  vip: {
    label: "VIP",
    icon: Crown,
    className:
      "border-[#f6d365] bg-gradient-to-r from-[#fff8dc] via-[#fff3b0] to-[#ffe08a] text-[#9a6700] shadow-[0_0_14px_rgba(246,211,101,0.45)]",
    iconClassName: "text-[#9a6700]",
  },
};

const statusDescriptions = {
  new: {
    title: "Новий",
    description:
      "Клієнт має тільки один запис або ще не має сформованої історії відвідувань.",
  },

  loyal: {
    title: "Постійний",
    description:
      "Клієнт має 2 або більше записів, а останній візит був протягом останніх 30 днів.",
  },

  attention: {
    title: "Активний",
    description:
      "Останній запис був більше 30 днів тому, але не більше 60 днів.",
  },

  risk: {
    title: "Неактивний",
    description: "Клієнт не відвідував студію більше 60 днів.",
  },
  vip: {
    title: "VIP-клієнт",
    description:
      "Статус лояльного клієнта, який автоматично встановлюється платформою. Його не можна змінити або прибрати вручну.",
  },
};

function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.new;
  const info = statusDescriptions[status];
  const Icon = meta.icon;

  return (
    <div className="relative inline-flex">
      <span
className={cn(
  "inline-flex items-center gap-1 rounded-full border px-1.5 py-[2px] text-[9px] font-bold sm:px-2 sm:py-0.5 sm:text-[10px]",
  meta.className,
)}

      >
     <Icon className="h-2 w-2 sm:h-3 sm:w-3" />
        {meta.label}
      </span>
    </div>
  );
}

function ClientStatusBadges({ client }) {
  const isVip = client.isVip || client.status === "vip";

  const mainStatus =
    client.status === "vip"
      ? client.originalStatus || client.baseStatus || "loyal"
      : client.status;

  return (
    <div className="flex flex-wrap items-center gap-2">
{isVip ? (
  <StatusBadge status="vip" />
) : (
  <StatusBadge status={mainStatus} />
)}
    </div>
  );
}

const filterItems = [
  { value: "all", label: "Усі" },
  { value: "new", label: "Нові" },
  { value: "loyal", label: "Постійні" },
  { value: "attention", label: "Активні" },
  { value: "risk", label: "Неактивні" },
  { value: "vip", label: "VIP" },
];

const sortItems = [
  { value: "nameAsc", label: "За алфавітом" },
  { value: "newest", label: "За датою додавання" },
  { value: "lastVisit", label: "За останнім візитом" },
  { value: "bookings", label: "За кількістю бронювань" },
  { value: "spent", label: "За витратами" },
];

const emptyClientForm = {
  photoUrl: "",
  photoKey: null,
  photoFile: null,
  firstName: "",
  lastName: "",
  birthDate: "",
  email: "",
  phone: "",
};

const emptyFilterInfo = {
  all: {
    icon: Users,
    title: "Поки що немає клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Клієнти зʼявляться тут автоматично після перших бронювань.</span>
      </span>
    ),
  },

  new: {
    icon: UserPlus,
    title: "Поки що немає нових клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Тут зʼявляться клієнти з першими записами.</span>
      </span>
    ),
  },

  loyal: {
    icon: Repeat,
    title: "Поки що немає постійних клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Постійні клієнти зʼявляться після повторних відвідувань.</span>
      </span>
    ),
  },

  attention: {
    icon: TrendingUp,
    title: "Поки що немає активних клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Тут будуть клієнти, які нещодавно записувались до студії.</span>
      </span>
    ),
  },

  risk: {
    icon: TrendingDown,
    title: "Поки що немає неактивних клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Неактивні клієнти зʼявляться, якщо давно не було записів.</span>
      </span>
    ),
  },

  vip: {
    icon: Crown,
    title: "Поки що немає VIP клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>VIP-статус зʼявиться у найцінніших клієнтів студії.</span>
      </span>
    ),
  },
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addMonthsSafe(date, amount) {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getClientFullName(client) {
  return (
    [client?.firstName, client?.lastName].filter(Boolean).join(" ").trim() ||
    client?.name ||
    "Клієнт"
  );
}

function findDuplicateClientByContacts(payload, clients = []) {
  const phoneKey = normalizePhone(payload.phone);
  const emailKey = normalizeEmail(payload.email);

  if (!phoneKey && !emailKey) return null;

  return clients.find((client) => {
    const clientPhoneKey = normalizePhone(client.phone);
    const clientEmailKey = normalizeEmail(client.email);

    const samePhone =
      phoneKey &&
      clientPhoneKey &&
      phoneKey === clientPhoneKey;

    const sameEmail =
      emailKey &&
      clientEmailKey &&
      emailKey === clientEmailKey;

    return samePhone || sameEmail;
  });
}

function getClientSource(client) {
  return String(
    client?.source ||
      client?.clientSource ||
      client?.studioClientSource ||
      client?.studioClient?.source ||
      "",
  ).toUpperCase();
}

function isManualClient(client) {
  return (
    getClientSource(client) === "MANUAL" ||
    client?.isManual === true ||
    client?.createdManually === true
  );
}

function getClientBookingsCount(client) {
  const historyCount = Array.isArray(client?.history)
    ? client.history.length
    : 0;

  return Math.max(
    historyCount,
    Number(client?.bookings || 0),
    Number(client?.totalBookings || 0),
    Number(client?.bookingsCount || 0),
    Number(client?.cancellations || 0),
  );
}

function getDeleteClientBlockReason(client) {
  if (!client) return "Клієнта не знайдено.";

  if (!isManualClient(client)) {
    return "Видаляти можна тільки клієнтів, які були додані вручну.";
  }

  if (getClientBookingsCount(client) > 0) {
    return "У цього клієнта вже є записи. Спочатку видаліть усі записи цього клієнта, після цього його можна буде видалити.";
  }

  return "";
}

function CreateClientErrorBox({ error, onOpenDuplicate }) {
  if (!error) return null;

  const isObject = typeof error === "object";

  const type = isObject ? error.type : "default";
  const title = isObject
    ? error.title
    : "Не вдалося додати клієнта";

  const message = isObject
    ? error.message
    : String(error || "");

  const value = isObject ? error.value : "";
  const duplicateName = isObject ? error.duplicateName : "";

  const Icon =
    type === "phone"
      ? Phone
      : type === "email"
        ? Mail
        : CircleAlert;

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[#ffd6bd] bg-[#fff7f0] p-4 shadow-[0_14px_36px_rgba(255,98,0,0.08)]">
      <div className="absolute right-[-38px] top-[-45px] h-28 w-28 rounded-full bg-[#ff6200]/10 blur-2xl" />
      <div className="absolute bottom-[-48px] left-[-38px] h-28 w-28 rounded-full bg-[#ffd6bd]/55 blur-2xl" />

      <div className="relative flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#ffd6bd] bg-white text-[#ff6200] shadow-sm">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black uppercase tracking-[0.08em] text-[#ff6200]">
            Дублікат клієнта
          </p>

          <h4 className="mt-1 text-[16px] font-black leading-tight text-[#202020]">
            {title}
          </h4>

          {duplicateName && (
            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-[#eadbc9] bg-white px-3 py-1.5 shadow-sm">
              <User className="h-3.5 w-3.5 shrink-0 text-[#ff6200]" />
              <span className="truncate text-xs font-black text-[#202020]">
                {duplicateName}
              </span>
            </div>
          )}

          {value && (
            <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-[#eadbc9] bg-white px-3 py-1.5 shadow-sm">
              <Icon className="h-3.5 w-3.5 shrink-0 text-[#77716b]" />
              <span className="truncate text-xs font-bold text-[#77716b]">
                {value}
              </span>
            </div>
          )}

          <p className="mt-3 text-sm font-semibold leading-5 text-[#77716b]">
            {message}
          </p>

          {onOpenDuplicate && (
            <button
              type="button"
              onClick={onOpenDuplicate}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#ff5a00] px-4 text-sm font-black text-white transition-all duration-200 hover:bg-[#ef4f00] active:scale-[0.98]"
            >
              <User className="h-4 w-4" />
              Відкрити існуючого клієнта
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const { studio } = useStudio();
  const { confirmBooking, cancelBooking } = useBookings();

  const studioId = studio?.id ?? null;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("nameAsc");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clientTabs, setClientTabs] = useState({});
  const [detailsClientBooking, setDetailsClientBooking] = useState(null);
  const [clientBookingActionLoading, setClientBookingActionLoading] =
  useState(false);

const [cancelClientBookingConfirm, setCancelClientBookingConfirm] =
  useState(null);
  const clientsListRef = useRef(null);
  const [statusInfoClient, setStatusInfoClient] = useState(null);
  const filterRef = useRef(null);
const sortRef = useRef(null);
const createClientErrorRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [exportOpen, setExportOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [createClientForm, setCreateClientForm] = useState(emptyClientForm);
  const [createClientError, setCreateClientError] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [deleteClientConfirm, setDeleteClientConfirm] = useState({
  open: false,
  client: null,
  loading: false,
  error: "",
});
  const [exportFields, setExportFields] = useState({
    name: true,
    phone: true,
    email: true,
    status: true,
    birthDate: true,

    bookings: true,
    cancellations: true,
    spent: true,
    averageCheck: true,

    lastVisit: true,
    nextVisit: true,
    favoriteService: true,

    notes: false,
    registeredAt: false,
    vip: false,
    favorite: false,
  });

  useEffect(() => {
  function handleClickOutside(event) {
    if (
      filterRef.current &&
      !filterRef.current.contains(event.target)
    ) {
      setFilterOpen(false);
    }

    if (
      sortRef.current &&
      !sortRef.current.contains(event.target)
    ) {
      setSortOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  useEffect(() => {
    function calculateItemsPerPage() {
      const width = window.innerWidth;

      if (width >= 1280) {
        setItemsPerPage(12); // 4 колонки × 3 рядки
      } else if (width >= 1024) {
        setItemsPerPage(9); // 3 колонки × 3 рядки
      } else if (width >= 640) {
        setItemsPerPage(8); // 2 колонки × 4 рядки
      } else {
        setItemsPerPage(6); // телефон
      }
    }

    calculateItemsPerPage();

    window.addEventListener("resize", calculateItemsPerPage);

    return () => {
      window.removeEventListener("resize", calculateItemsPerPage);
    };
  }, []);

  const [noteClient, setNoteClient] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(false);

  const studioCreatedMonth = useMemo(() => {
    const source = studio?.ownerCreatedAt || studio?.createdAt || new Date();

    const d = new Date(source);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);

    return d;
  }, [studio?.ownerCreatedAt, studio?.createdAt]);

  const [statsTabIndex, setStatsTabIndex] = useState(() => {
    const saved = Number(localStorage.getItem("clientsStatsTabIndex"));
    return Number.isFinite(saved) ? saved : 0;
  });

  const emptyInfo = emptyFilterInfo[filter] || emptyFilterInfo.all;
  const EmptyIcon = emptyInfo.icon;
  async function handleCopyPhone(phone) {
    if (!phone) return;

    try {
      await navigator.clipboard.writeText(phone);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = phone;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopiedPhone(true);

    setTimeout(() => {
      setCopiedPhone(false);
    }, 1600);
  }

  useEffect(() => {
    let alive = true;

    async function loadClients() {
      try {
        setLoading(true);
        setError("");

        if (!studioId) {
          setAllClients([]);
          return;
        }

        const data = await api(`/owner/studio/${studioId}/clients`);

        if (!alive) return;

        setAllClients(Array.isArray(data?.clients) ? data.clients : []);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Не вдалося завантажити клієнтів");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadClients();

    return () => {
      alive = false;
    };
  }, [studioId]);

  async function handleAddNote() {
    if (!studioId) return;

    const text = noteDraft.trim();
    if (!text || !noteClient?.id) return;

const data = await api(
  `/owner/studio/${studioId}/clients/${noteClient.id}/notes`,
  {
    method: "POST",
    body: { text },
  },
);

setAllClients((current) =>
  current.map((client) =>
    client.id === noteClient.id
      ? {
          ...client,
          notes: [data.note, ...(client.notes || [])],
        }
      : client,
  ),
);

setNoteClient((current) => ({
  ...current,
  notes: [data.note, ...(current?.notes || [])],
}));

setNoteDraft("");
  }

  function updateCreateClientField(field, value) {
    setCreateClientForm((current) => ({
      ...current,
      [field]: value,
    }));
    setCreateClientError("");
  }

  function closeCreateClientModal() {
    if (creatingClient) return;

    if (createClientForm.photoUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(createClientForm.photoUrl);
    }

    setCreateClientOpen(false);
    setCreateClientForm(emptyClientForm);
    setCreateClientError("");
  }

  function handlePickClientPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setCreateClientForm((current) => {
      if (current.photoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.photoUrl);
      }

      return {
        ...current,
        photoUrl: URL.createObjectURL(file),
        photoKey: null,
        photoFile: file,
      };
    });
    setCreateClientError("");
  }

  function removeCreateClientPhoto() {
    setCreateClientForm((current) => {
      if (current.photoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.photoUrl);
      }

      return {
        ...current,
        photoUrl: "",
        photoKey: null,
        photoFile: null,
      };
    });
    setCreateClientError("");
  }

  useEffect(() => {
  if (!createClientOpen || !createClientError) return;

  const isMobile = window.innerWidth < 640;

  if (!isMobile) return;

  const timer = window.setTimeout(() => {
    createClientErrorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 120);

  return () => {
    window.clearTimeout(timer);
  };
}, [createClientError, createClientOpen]);

  async function handleCreateClient(e) {
    e?.preventDefault?.();
    if (!studioId) return;

    const payload = {
      photoUrl: createClientForm.photoUrl?.startsWith("blob:")
        ? ""
        : createClientForm.photoUrl.trim(),
      photoKey: createClientForm.photoKey,
      firstName: createClientForm.firstName.trim(),
      lastName: createClientForm.lastName.trim(),
      birthDate: createClientForm.birthDate,
      email: createClientForm.email.trim(),
      phone: createClientForm.phone.trim(),
    };

if (!payload.firstName || !payload.lastName) {
  setCreateClientError("Вкажіть імʼя та прізвище клієнта.");
  return;
}

const duplicateClient = findDuplicateClientByContacts(payload, allClients);

if (duplicateClient) {
  const duplicateName = getClientFullName(duplicateClient);

  const duplicateByPhone =
    normalizePhone(payload.phone) &&
    normalizePhone(payload.phone) === normalizePhone(duplicateClient.phone);

setCreateClientError({
  type: duplicateByPhone ? "phone" : "email",
  duplicateId: duplicateClient.id,
  duplicateName,
  value: duplicateByPhone ? payload.phone : payload.email,
  title: duplicateByPhone
    ? "Клієнт з таким номером телефону вже є в базі"
    : "Клієнт з таким email вже є в базі",
  message: duplicateByPhone
    ? "Щоб не створювати дубль, відкрийте вже існуючого клієнта або змініть номер телефону."
    : "Щоб не створювати дубль, відкрийте вже існуючого клієнта або змініть email.",
});

return;
}

setCreatingClient(true);
setCreateClientError("");

    try {
      if (createClientForm.photoFile) {
        const uploaded = await uploadClientPhoto(
          studioId,
          createClientForm.photoFile,
        );
        payload.photoKey = uploaded.key ?? null;
        payload.photoUrl = uploaded.url || "";
      }

      const data = await api(`/owner/studio/${studioId}/clients`, {
        method: "POST",
        body: payload,
      });

      const createdClient = data?.client || data || {};
const normalizedClient = {
  id: createdClient.id || `local-${Date.now()}`,
  firstName: createdClient.firstName ?? payload.firstName,
  lastName: createdClient.lastName ?? payload.lastName,
  photoUrl: createdClient.photoUrl ?? payload.photoUrl,
  photoKey: createdClient.photoKey ?? payload.photoKey,
  birthDate: createdClient.birthDate ?? payload.birthDate,
  email: createdClient.email ?? payload.email,
  phone: createdClient.phone ?? payload.phone,
  source: createdClient.source || "MANUAL",
  isManual: createdClient.isManual ?? true,
  status: createdClient.status || "new",
  bookings: createdClient.bookings ?? 0,
  cancellations: createdClient.cancellations ?? 0,
  spent: createdClient.spent ?? 0,
  averageCheck: createdClient.averageCheck ?? 0,
  favoriteService: createdClient.favoriteService || "",
  notes: createdClient.notes || [],
  history: createdClient.history || [],
  registeredAt: createdClient.registeredAt || new Date().toISOString(),
  ...createdClient,
};

      setAllClients((current) => [normalizedClient, ...current]);
      setSelectedClientId(normalizedClient.id);
      setFilter("all");
      setSort("newest");
      setCurrentPage(1);
      setCreateClientOpen(false);
      if (createClientForm.photoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(createClientForm.photoUrl);
      }
      setCreateClientForm(emptyClientForm);
    } catch (e) {
      setCreateClientError(
        e?.message || "Не вдалося додати клієнта. Спробуйте ще раз.",
      );
    } finally {
      setCreatingClient(false);
    }
  }

  async function handleDeleteNote(clientId, noteId) {
    if (!studioId) return;

    await api(`/owner/studio/${studioId}/clients/${clientId}/notes/${noteId}`, {
      method: "DELETE",
    });

    setAllClients((current) =>
      current.map((client) =>
        client.id === clientId
          ? {
              ...client,
              notes: (client.notes || []).filter((note) => note.id !== noteId),
            }
          : client,
      ),
    );
  }

  function updateClientHistoryBookingStatus(bookingId, patch) {
  setDetailsClientBooking((current) =>
    current && String(current.id) === String(bookingId)
      ? {
          ...current,
          ...patch,
        }
      : current,
  );

  setAllClients((current) =>
    current.map((client) => ({
      ...client,
      history: (client.history || []).map((booking) =>
        String(booking.id) === String(bookingId)
          ? {
              ...booking,
              ...patch,
            }
          : booking,
      ),
      allBookings: (client.allBookings || []).map((booking) =>
        String(booking.id) === String(bookingId)
          ? {
              ...booking,
              ...patch,
            }
          : booking,
      ),
    })),
  );
}

async function handleConfirmClientBooking(booking) {
  if (!booking?.id || clientBookingActionLoading) return;

  setClientBookingActionLoading(true);

  try {
    await confirmBooking(booking.id);

    updateClientHistoryBookingStatus(booking.id, {
      status: "CONFIRMED",
      canceledBy: null,
    });
  } catch (error) {
    alert(error?.message || "Не вдалося підтвердити запис");
  } finally {
    setClientBookingActionLoading(false);
  }
}

async function handleCancelClientBooking(booking) {
  if (!booking?.id || clientBookingActionLoading) return;

  setClientBookingActionLoading(true);

  try {
    await cancelBooking(booking.id);

    updateClientHistoryBookingStatus(booking.id, {
      status: "CANCELED",
      canceledBy: "owner",
    });

    setCancelClientBookingConfirm(null);
  } catch (error) {
    alert(error?.message || "Не вдалося скасувати запис");
  } finally {
    setClientBookingActionLoading(false);
  }
}

  function openDeleteClientConfirm(client) {
  setDeleteClientConfirm({
    open: true,
    client,
    loading: false,
    error: "",
  });
}

function closeDeleteClientConfirm() {
  if (deleteClientConfirm.loading) return;

  setDeleteClientConfirm({
    open: false,
    client: null,
    loading: false,
    error: "",
  });
}

async function deleteClientPhoto(currentStudioId, key) {
  if (!key) return;

  const token = localStorage.getItem("token");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/media/studio/${currentStudioId}/client-photo`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key }),
    },
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || `Delete client photo failed (${res.status})`);
  }

  return data;
}

async function confirmDeleteClient() {
  const client = deleteClientConfirm.client;

  if (!studioId || !client || deleteClientConfirm.loading) return;

  const blockReason = getDeleteClientBlockReason(client);

  if (blockReason) {
    setDeleteClientConfirm((current) => ({
      ...current,
      error: blockReason,
    }));
    return;
  }

  setDeleteClientConfirm((current) => ({
    ...current,
    loading: true,
    error: "",
  }));

  try {
    await api(`/owner/studio/${studioId}/clients/${client.id}`, {
      method: "DELETE",
    });

    if (client.photoKey) {
      try {
        await deleteClientPhoto(studioId, client.photoKey);
      } catch (error) {
        console.warn("Client photo delete failed:", error);
      }
    }

    setAllClients((current) =>
      current.filter((item) => String(item.id) !== String(client.id)),
    );

    if (String(selectedClientId) === String(client.id)) {
      setSelectedClientId(null);
    }

    setNoteClient((current) =>
      String(current?.id) === String(client.id) ? null : current,
    );

    setDeleteClientConfirm({
      open: false,
      client: null,
      loading: false,
      error: "",
    });
  } catch (error) {
    setDeleteClientConfirm((current) => ({
      ...current,
      loading: false,
      error:
        error?.message ||
        "Не вдалося видалити клієнта. Перевірте, чи немає у нього записів.",
    }));
  }
}


  function handleExportClients() {
    const sortedClients = [...clients].sort((a, b) => {
      const firstNameCompare = (a.firstName || "").localeCompare(
        b.firstName || "",
        "uk",
        { sensitivity: "base" },
      );

      if (firstNameCompare !== 0) {
        return firstNameCompare;
      }

      return (a.lastName || "").localeCompare(b.lastName || "", "uk", {
        sensitivity: "base",
      });
    });

    const rows = sortedClients.map((client) => {
      const row = {};

      if (exportFields.name) {
        row["Ім'я"] = client.firstName || "-";
        row["Прізвище"] = client.lastName || "-";
      }

      // решта полів...
      if (exportFields.phone) row["Телефон"] = client.phone || "-";
      if (exportFields.email) row["Email"] = client.email || "-";
      if (exportFields.birthDate) {
        row["Дата народження"] = client.birthDate
          ? formatDateUA(client.birthDate)
          : "-";
      }
      if (exportFields.bookings) row["Всього записів"] = client.bookings || 0;
      if (exportFields.cancellations)
        row["Скасовано"] = client.cancellations || 0;
      if (exportFields.lastVisit) {
        row["Останній візит"] = client.lastVisit
          ? formatDateUA(client.lastVisit)
          : "-";
      }

      if (exportFields.nextVisit) {
        row["Наступний візит"] = client.nextBooking?.date
          ? formatDateUA(client.nextBooking.date)
          : "-";
      }
      if (exportFields.spent) row["Витрачено"] = client.spent || 0;
      if (exportFields.averageCheck)
        row["Середній чек"] = client.averageCheck || 0;
      if (exportFields.status) {
        row["Статус"] =
          statusMeta[client.status]?.label || client.status || "-";
      }

      if (exportFields.favoriteService)
        row["Улюблена послуга"] = client.favoriteService || "-";

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const columnWidths = Object.keys(rows[0] || {}).map((key) => {
      const maxLength = Math.max(
        key.length,
        ...rows.map((row) => String(row[key] ?? "").length),
      );

      return {
        wch: Math.max(maxLength + 8, 18),
      };
    });

    worksheet["!cols"] = columnWidths;

    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({
          r: row,
          c: col,
        });

        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          font: {
            bold: row === 0,
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
          },
        };
      }
    }

    // Дані
    for (let row = 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

        if (worksheet[cellAddress] && worksheet[cellAddress].v === "-") {
          worksheet[cellAddress].s = {
            alignment: {
              horizontal: "center",
              vertical: "center",
            },
          };
        }
      }
    }
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Клієнти");
    XLSX.writeFile(
      workbook,
      `clients-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  const clients = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allClients
      .map((client) => ({
        ...client,
      }))
      .filter((client) => {
        const matchesFilter =
          filter === "all" ||
          client.status === filter ||
          (filter === "vip" && client.isVip);
        const haystack = `${
          [client.firstName, client.lastName].filter(Boolean).join(" ") || ""
        } ${client.phone || ""} ${client.email || ""}`.toLowerCase();

        return matchesFilter && (!q || haystack.includes(q));
      })
      .sort((a, b) => {
        if (sort === "bookings") {
          return (b.bookings || 0) - (a.bookings || 0);
        }

        if (sort === "spent") {
          return (b.spent || 0) - (a.spent || 0);
        }

if (sort === "nameAsc") {
  const nameA = [a.firstName, a.lastName]
    .filter(Boolean)
    .join(" ");

  const nameB = [b.firstName, b.lastName]
    .filter(Boolean)
    .join(" ");

  return nameA.localeCompare(nameB, "uk", {
    sensitivity: "base",
  });
}

        if (sort === "newest") {
          return dateScore(b.registeredAt) - dateScore(a.registeredAt);
        }

        return dateScore(b.lastVisit) - dateScore(a.lastVisit);
      });
  }, [allClients, filter, query, sort]);

  const totalPages = Math.max(1, Math.ceil(clients.length / itemsPerPage));

  const visibleClients = clients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  useEffect(() => {
    clientsListRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [currentPage]);

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;

    return (
      allClients.find(
        (client) => String(client.id) === String(selectedClientId),
      ) || null
    );
  }, [allClients, selectedClientId]);

  const totalSpent = allClients.reduce((sum, client) => sum + client.spent, 0);
  const totalBookings = allClients.reduce(
    (sum, client) => sum + client.bookings,
    0,
  );
  const averageCheck = Math.round(totalSpent / Math.max(totalBookings, 1));
  const newClientsCount = allClients.filter(
    (client) => client.status === "new",
  ).length;
  const clientsWithStatuses = allClients.map((client) => ({
    ...client,
    status: client.status,
  }));
  const loyalPercent = clientsWithStatuses.length
    ? Math.round(
        (clientsWithStatuses.filter((client) =>
          ["loyal", "vip"].includes(client.status),
        ).length /
          clientsWithStatuses.length) *
          100,
      )
    : 0;

  const selectedFilterLabel =
    filterItems.find((item) => item.value === filter)?.label || "Усі статуси";
  const selectedSortLabel =
    sortItems.find((item) => item.value === sort)?.label ||
    "За датою додавання";

  const filterItemsWithCounts = filterItems.map((item) => {
    let count = 0;

    if (item.value === "all") {
      count = allClients.length;
    } else if (item.value === "vip") {
      count = allClients.filter((client) => client.isVip).length;
    } else {
      count = allClients.filter(
        (client) => client.status === item.value,
      ).length;
    }

    return {
      ...item,
      count,
    };
  });

  const mostActiveDay = useMemo(() => {
    const dayNames = [
      "Неділя",
      "Понеділок",
      "Вівторок",
      "Середа",
      "Четвер",
      "Пʼятниця",
      "Субота",
    ];

    const counts = Array(7).fill(0);

    allClients.forEach((client) => {
      (client.history || []).forEach((booking) => {
        if (!booking?.date) return;

        const date = new Date(booking.date);
        if (Number.isNaN(date.getTime())) return;

        counts[date.getDay()] += 1;
      });
    });

    const max = Math.max(...counts);

    if (max === 0) {
      return {
        label: "—",
        count: 0,
      };
    }

    const dayIndex = counts.indexOf(max);

    return {
      label: dayNames[dayIndex],
      count: max,
    };
  }, [allClients]);

  const currentMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const statsTabs = useMemo(() => {
    const tabs = [];

    let cursor = new Date(studioCreatedMonth);

    for (let i = 0; i < 120; i++) {
      const date = new Date(cursor);

      if (isSameMonth(date, currentMonth)) {
        tabs.push({
          type: "today",
          date: null,
          label: "Сьогодні",
        });
      }

      tabs.push({
        type: "month",
        date,
        label: isSameMonth(date, currentMonth)
          ? "Поточний місяць"
          : date.toLocaleDateString("uk-UA", {
              month: "long",
              year: "numeric",
            }),
      });

      cursor = addMonthsSafe(cursor, 1);
    }

    return tabs;
  }, [studioCreatedMonth, currentMonth]);

  useEffect(() => {
    if (!statsTabs.length) return;

    if (statsTabIndex < 0 || statsTabIndex >= statsTabs.length) {
      setStatsTabIndex(0);
      localStorage.setItem("clientsStatsTabIndex", "0");
      return;
    }

    localStorage.setItem("clientsStatsTabIndex", String(statsTabIndex));
  }, [statsTabIndex, statsTabs.length]);

  const activeStatsTab = statsTabs[statsTabIndex] || statsTabs[0] || null;

  const filteredClientsForStats = useMemo(() => {
    if (!activeStatsTab) return [];

    if (activeStatsTab?.type === "today") {
      const todayKey = toISODateKey(new Date());

      return allClients
        .map((client) => {
          const history = (client.history || []).filter(
            (booking) => String(booking.date || "").slice(0, 10) === todayKey,
          );

          return { ...client, history };
        })
        .filter((client) => client.history.length > 0);
    }

    const year = activeStatsTab.date.getFullYear();
    const month = activeStatsTab.date.getMonth();

    return allClients
      .map((client) => {
        const history = (client.history || []).filter((booking) => {
          const d = new Date(booking.date);
          if (Number.isNaN(d.getTime())) return false;

          return d.getFullYear() === year && d.getMonth() === month;
        });

        return { ...client, history };
      })
      .filter((client) => client.history.length > 0);
  }, [allClients, activeStatsTab]);

  const statsBookings = useMemo(() => {
    return filteredClientsForStats.flatMap((client) => client.history || []);
  }, [filteredClientsForStats]);

  const filteredTotalBookings = statsBookings.length;

  const filteredTotalSpent = statsBookings.reduce(
    (sum, booking) => sum + Number(booking.price || 0),
    0,
  );

  const filteredAverageCheck = Math.round(
    filteredTotalSpent / Math.max(filteredTotalBookings, 1),
  );

  const filteredNewClientsCount = filteredClientsForStats.filter(
    (client) => client.status === "new",
  ).length;

  const filteredLoyalPercent = filteredClientsForStats.length
    ? Math.round(
        (filteredClientsForStats.filter((client) =>
          ["loyal", "vip"].includes(client.status),
        ).length /
          filteredClientsForStats.length) *
          100,
      )
    : 0;

  const filteredMostActiveDay = useMemo(() => {
    const dayNames = [
      "Неділя",
      "Понеділок",
      "Вівторок",
      "Середа",
      "Четвер",
      "Пʼятниця",
      "Субота",
    ];

    const counts = Array(7).fill(0);

    statsBookings.forEach((booking) => {
      if (!booking?.date) return;

      const date = new Date(booking.date);
      if (Number.isNaN(date.getTime())) return;

      counts[date.getDay()] += 1;
    });

    const max = Math.max(...counts);

    if (max === 0) {
      return { label: "—", count: 0 };
    }

    const dayIndex = counts.indexOf(max);

    return {
      label: dayNames[dayIndex],
      count: max,
    };
  }, [statsBookings]);

  const filteredMostActiveHour = useMemo(() => {
    const counts = Array.from({ length: 24 }, (_, hour) => ({
      label: `${String(hour).padStart(2, "0")}:00`,
      count: 0,
    }));

    statsBookings.forEach((booking) => {
      if (!booking?.date) return;
      if (booking.status === "CANCELED" || booking.status === "canceled")
        return;

      const date = new Date(booking.date);

      if (Number.isNaN(date.getTime())) return;

      const hour = date.getHours();

      counts[hour].count += 1;
    });

    const best = counts.reduce((max, item) =>
      item.count > max.count ? item : max,
    );

    if (best.count === 0) {
      return { label: "—", count: 0 };
    }

    return best;
  }, [statsBookings]);
const clientToDelete = deleteClientConfirm.client;
const clientToDeleteName = getClientFullName(clientToDelete);
const clientToDeleteBookingsCount = getClientBookingsCount(clientToDelete);
const deleteClientBlockReason = getDeleteClientBlockReason(clientToDelete);
const canDeleteClient = Boolean(clientToDelete) && !deleteClientBlockReason;
  return (
    <div className="min-h-screen bg-[#fbfaf8] pb-8">
      <div className="mx-auto max-w-6xl space-y-6 ">

<div className="relative mb-6 overflow-hidden rounded-[15px] border border-[#ebe7df] bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-7">
  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

  <div className="relative flex items-start justify-between gap-3">
    <div className="min-w-0 flex-1">
      <h1 className="text-[40px] font-black leading-[0.95] tracking-tight text-[#202020] sm:text-6xl">
        Клі<span className="text-[#ff5a00]">єнти</span>
      </h1>

      <p className="mt-3 max-w-[640px] text-[12px] font-semibold text-[#77716b] sm:text-[16px]">
        Всі клієнти студії, історія записів, статистика та нотатки в одному місці.
      </p>
    </div>

    <div className="flex shrink-0 items-center">
      <button
        type="button"
        onClick={() => setInfoOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-full text-[#ff6200] transition-all hover:bg-[#fff7f0] active:scale-95"
        title="Інформація"
      >
        <CircleAlert className="h-5 w-5" />
      </button>

      <div className="hidden sm:block">
        <Button
          variant="ghost"
          className="mr-2 h-12 !px-1.5 transition-all active:scale-95"
          onClick={() => setExportOpen(true)}
        >
          <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
          Експорт
        </Button>
      </div>

<Button
  variant="primary"
  onClick={() => setCreateClientOpen(true)}
  className="h-10 shrink-0 px-3 sm:h-12 sm:px-5"
>
  <Plus className="h-4 w-4" />
  <span className="hidden sm:inline">Додати клієнта</span>
</Button>
    </div>
  </div>
</div>


<SectionCard
  title="Список клієнтів"
  subtitle="Пошук, фільтрація, сортування та картки клієнтів."
  badge={`${clients.length} клієнт(ів)`}
>
        <section className="space-y-6">
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div className="relative w-full sm:max-w-[390px]">
    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b95a5]" />

    <input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        setCurrentPage(1);
        setSelectedClientId(null);
        setClientTabs({});
      }}
      placeholder="Пошук клієнтів..."
      className="h-12 w-full rounded-[14px] border border-[#e5eaf0] bg-white pl-12 pr-4 text-sm font-semibold text-[#202020] outline-none transition placeholder:text-[#9aa3af] hover:border-[#d8dee8] focus:border-[#ff6200] focus:ring-4 focus:ring-[#ff6200]/10"
    />
  </div>

  <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:shrink-0">
    <div ref={filterRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => {
          setFilterOpen((current) => !current);
          setSortOpen(false);
        }}
        className="inline-flex h-12 w-full items-center justify-between gap-3 rounded-[14px] border border-[#e5eaf0] bg-white px-4 text-sm font-bold text-[#202020] shadow-sm transition hover:border-[#d8dee8] hover:bg-[#fff8f3] sm:min-w-[180px]"
      >
        <span className="truncate">
          {filter === "all" ? "Усі статуси" : selectedFilterLabel}
        </span>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#6b7280] transition",
            filterOpen && "rotate-180 text-[#ff6200]",
          )}
        />
      </button>

      {filterOpen && (
      <div className="absolute left-0 right-0 z-30 mt-2 w-full overflow-hidden rounded-[16px] border border-[#e5eaf0] bg-white py-2 shadow-[0_18px_42px_rgba(15,23,42,0.14)] sm:right-0 sm:left-auto sm:min-w-[220px]">
          {filterItemsWithCounts.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setFilter(item.value);
                setFilterOpen(false);
                setCurrentPage(1);
                setSelectedClientId(null);
                setClientTabs({});
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm font-bold transition",
                filter === item.value
                  ? "bg-[#fff1e8] text-[#ff6200]"
                  : "text-[#202020] hover:bg-[#fbfaf8]",
              )}
            >
              <span>{item.label}</span>
              <span className="text-xs text-[#8b95a5]">{item.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>

    <div ref={sortRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => {
          setSortOpen((current) => !current);
          setFilterOpen(false);
        }}
        className="inline-flex h-12 w-full items-center justify-between gap-3 rounded-[14px] border border-[#e5eaf0] bg-white px-4 text-sm font-bold text-[#202020] shadow-sm transition hover:border-[#d8dee8] hover:bg-[#fff8f3] sm:min-w-[210px]"
      >
        <span className="truncate">{selectedSortLabel}</span>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#6b7280] transition",
            sortOpen && "rotate-180 text-[#ff6200]",
          )}
        />
      </button>

      {sortOpen && (
      <div className="absolute left-0 right-0 z-30 mt-2 w-full overflow-hidden rounded-[16px] border border-[#e5eaf0] bg-white py-2 shadow-[0_18px_42px_rgba(15,23,42,0.14)] sm:right-0 sm:left-auto sm:min-w-[240px]">
          {sortItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setSort(item.value);
                setSortOpen(false);
                setCurrentPage(1);
                setSelectedClientId(null);
                setClientTabs({});
              }}
              className={cn(
                "block w-full px-4 py-2 text-left text-sm font-bold transition",
                sort === item.value
                  ? "bg-[#fff1e8] text-[#ff6200]"
                  : "text-[#202020] hover:bg-[#fbfaf8]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
</div>

          {loading && (
            <div className="rounded-[20px] border border-[#e5eaf0] bg-white p-6 text-center text-sm font-bold text-[#77716b] shadow-sm">
              Завантажуємо клієнтів...
            </div>
          )}

          {error && !loading && (
            <div className="rounded-[20px] border border-[#ffd8d8] bg-[#fff7f7] p-6 text-center text-sm font-bold text-[#e5484d] shadow-sm">
              {error}
            </div>
          )}

{!loading && !error && clients.length === 0 ? (
  <div className="rounded-[15px] border-2 border-dashed border-[#ffd6bd] bg-[#fff7f0] px-6 py-12 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#ff6200] shadow-sm">
      <EmptyIcon className="h-7 w-7" />
    </div>

<h2 className="mt-4 text-xl font-black text-[#202020]">
  {query.trim()
    ? "Нічого не знайдено"
    : emptyInfo.title}
</h2>

<p className="mt-2 text-sm text-[#77716b]">
  {query.trim()
    ? `За запитом "${query}" не знайдено жодного клієнта.`
    : emptyInfo.description}
</p>
  </div>
) : !loading && !error ? (
            <>
<div
  ref={clientsListRef}
  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
>
                {visibleClients.map((client) => (
<ClientAccordion
  key={client.id}
  client={{
    ...client,
    notes: client.notes || [],
  }}
  onOpenDetails={() => {
    setSelectedClientId(client.id);
    setClientTabs((current) => ({
      ...current,
      [client.id]: current[client.id] || "history",
    }));
  }}
  onAddNote={() => {
    setNoteClient(client);
    setNoteDraft("");
  }}
  onOpenStatusInfo={() => setStatusInfoClient(client)}
  onDeleteNote={(noteId) => handleDeleteNote(client.id, noteId)}
  onAskDelete={() => openDeleteClientConfirm(client)}
  onCopyPhone={handleCopyPhone}
  copiedPhone={copiedPhone}
/>
                ))}
              </div>

              <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-sm font-medium text-[#6b7280]">
                  Показано{" "}
                  {clients.length === 0
                    ? 0
                    : (currentPage - 1) * itemsPerPage + 1}
                  -{Math.min(currentPage * itemsPerPage, clients.length)} з{" "}
                  {clients.length}
                </p>

                <div className="flex items-center justify-center gap-2 self-center sm:self-auto">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#e5eaf0] bg-white text-[#6b7280] transition hover:bg-[#fff8f3] active:scale-[0.98] disabled:opacity-40"
                    aria-label="Попередня сторінка"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: Math.min(totalPages, 3) }).map(
                    (_, index) => {
                      const page = index + 1;

                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "grid h-10 w-10 place-items-center rounded-[12px] border text-sm font-black transition active:scale-[0.98]",
                            currentPage === page
                              ? "border-[#ff6200] bg-[#fff7f0] text-[#ff6200]"
                              : "border-[#e5eaf0] bg-white text-[#202020] hover:bg-[#fff8f3]",
                          )}
                        >
                          {page}
                        </button>
                      );
                    },
                  )}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#e5eaf0] bg-white text-[#6b7280] transition hover:bg-[#fff8f3] active:scale-[0.98] disabled:opacity-40"
                    aria-label="Наступна сторінка"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </section>
</SectionCard>

      </div>

      <Modal
        open={selectedClient != null}
        onClose={() => {
  setSelectedClientId(null);
  setDetailsClientBooking(null);
}}
        title={"Профіль клієнта"}
        badge="Клієнт"
        icon={ContactRound}
        size="lg"
      >
        {selectedClient && (
<ClientDetails
  client={{
    ...selectedClient,
    notes: selectedClient.notes || [],
  }}
  activeTab={clientTabs[selectedClient.id] || "history"}
  onTabChange={(tab) =>
    setClientTabs((current) => ({
      ...current,
      [selectedClient.id]: tab,
    }))
  }
  onAddNote={() => {
    setNoteClient(selectedClient);
    setNoteDraft("");
  }}
  onDeleteNote={(noteId) =>
    handleDeleteNote(selectedClient.id, noteId)
  }
  onOpenBooking={(booking) =>
    setDetailsClientBooking({
      ...booking,
      client: selectedClient,
    })
  }
/>
        )}
      </Modal>

{detailsClientBooking &&
  (() => {
    const selectedBooking = detailsClientBooking;

    const rawStatus = String(selectedBooking.status || "").toLowerCase();
    const isCanceled = rawStatus === "canceled";
    const isConfirmed = rawStatus === "confirmed";
    const dt = getClientBookingDateTime(selectedBooking);
    const isArchived = dt ? dt.getTime() < Date.now() : false;

const statusMeta = isCanceled
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
  : isArchived
    ? {
          label: "Сеанс завершено",
          top: "from-[var(--color-archived-light)] to-white",
          Icon: PartyPopper,
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
      : {
          label: "Очікує підтвердження",
          top: "from-[var(--color-pending-light)] to-white",
          Icon: Clock,
          iconColor: "text-[#ffb020]",
          pillText: "text-[#ffb020]",
          accent: "text-[#ffb020]",
        };

    const StatusIcon = statusMeta.Icon;

    const client = selectedBooking.client || selectedClient || {};

    const clientName =
      [client.firstName, client.lastName].filter(Boolean).join(" ") ||
      client.name ||
      selectedBooking.clientName ||
      "Клієнт";

    const phone =
      client.phone ||
      selectedBooking.clientPhone ||
      selectedBooking.phone ||
      "";

    const service =
      selectedBooking.service ||
      selectedBooking.serviceName ||
      "Послуга";

    const time =
      parseClientTimeToHHMM(selectedBooking.time) ||
      selectedBooking.time ||
      "—";

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
      selectedBooking.master ||
      selectedBooking.masterName ||
      selectedBooking.staffName ||
      selectedBooking.employeeName ||
      "Довільний майстер";

    const dateLabel =
      dt && !Number.isNaN(dt.getTime())
        ? dt
            .toLocaleDateString("uk-UA", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
            .replace(" р.", "р.")
        : "—";

    const closeDetails = () => {
      setDetailsClientBooking(null);
      setCopiedPhone(false);
    };

    const clientPhoto = toPublicUrl(
      client.photoUrl ||
        selectedBooking.clientPhotoUrl ||
        selectedBooking.clientPhoto ||
        selectedBooking.client?.photoUrl ||
        selectedBooking.client?.photo ||
        selectedBooking.client?.avatar ||
        "",
    );

    const masterPhoto = toPublicUrl(
      selectedBooking.masterPhotoUrl ||
        selectedBooking.masterPhoto ||
        selectedBooking.master?.photoUrl ||
        selectedBooking.master?.photo ||
        selectedBooking.master?.avatar ||
        "",
    );

    return (
      <div
        className="fixed inset-0 z-[10050] flex items-end justify-center bg-[#1b1b1b]/35 p-0 backdrop-blur-[10px] sm:items-center sm:p-5"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            closeDetails();
          }
        }}
      >
        <div
          className={cn(
            "relative flex w-full flex-col overflow-hidden bg-[#fbfaf8]",
            "h-[100dvh] rounded-none border-0 shadow-none",
            "sm:h-auto sm:max-h-[88vh] sm:max-w-[640px] sm:rounded-[34px] sm:border sm:border-[#eadfce] sm:shadow-[0_35px_110px_rgba(27,27,27,0.22)]",
          )}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={cn(
              "relative overflow-hidden px-5 pb-5 pt-[max(16px,env(safe-area-inset-top))] sm:px-6 sm:pt-6",
              "bg-gradient-to-b",
              statusMeta.top,
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.58),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.20),rgba(255,255,255,0))]" />

            <div className="relative flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#77716b] shadow-sm backdrop-blur">
                <ClipboardPen className="h-4 w-4 text-[#ff6200]" />
                Деталі запису
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#202020] shadow-[0_8px_24px_rgba(27,27,27,0.10)] transition hover:bg-[#fff7f0] active:scale-[0.98]"
                aria-label="Закрити"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mt-8 flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[13px] font-black shadow-[0_8px_24px_rgba(27,27,27,0.08)] backdrop-blur">
                <StatusIcon className={cn("h-4 w-4", statusMeta.iconColor)} />

                <span className={statusMeta.pillText}>
                  {statusMeta.label}
                </span>
              </div>

              <h2 className="mt-8 break-words text-center text-[30px] font-black leading-[1.05] tracking-tight text-[#202020] sm:text-[34px]">
                {service}
              </h2>

              <p className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm font-bold text-[#77716b]">
                <CalendarDays className="h-4 w-4 text-[#ff6200]" />
                <span>{dateLabel}</span>
              </p>
            </div>

            <div className="relative mt-4 grid grid-cols-3 gap-2">
              <div className="flex min-h-[90px] flex-col items-center justify-center rounded-[22px] border border-white/70 bg-white/88 p-3 text-center shadow-sm backdrop-blur">
                <Clock3 className={cn("h-4 w-4", statusMeta.iconColor)} />

                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#aaa19a]">
                  Час запису
                </p>

                <p className="mt-1 text-sm font-black text-[#202020]">
                  {time}
                </p>
              </div>

              <div className="flex min-h-[90px] flex-col items-center justify-center rounded-[22px] border border-white/70 bg-white/88 p-3 text-center shadow-sm backdrop-blur">
                <Banknote className={cn("h-4 w-4", statusMeta.iconColor)} />

                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#aaa19a]">
                  Сума
                </p>

                <p className="mt-1 text-sm font-black text-[#202020]">
                  {price != null ? `${price} грн` : "—"}
                </p>
              </div>

              <div className="flex min-h-[90px] flex-col items-center justify-center rounded-[22px] border border-white/70 bg-white/88 p-3 text-center shadow-sm backdrop-blur">
                <Timer className={cn("h-4 w-4", statusMeta.iconColor)} />

                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#aaa19a]">
                  Тривалість
                </p>

                <p className="mt-1 text-sm font-black text-[#202020]">
                  {duration != null ? `${duration} хв` : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col bg-white px-4 pt-4 sm:px-6">
            <div className="calendar-day-scroll min-h-0 flex-1 overflow-y-auto pb-28 sm:pb-24">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[28px] border border-[#eadfce] bg-white p-4 sm:col-span-2">
                  <div className="flex items-center gap-4">
                    <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border border-[#eadfce] bg-white p-1">
                      {clientPhoto ? (
                        <img
                          src={clientPhoto}
                          alt={clientName}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
<ClientFallbackAvatar
  name={clientName}
  className="h-full w-full rounded-full"
  textClassName="text-[24px]"
/>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#aaa19a]">
                        Клієнт
                      </p>

                      <p className="truncate text-[20px] font-black text-[#202020]">
                        {clientName}
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-[#77716b]">
                        {phone || "Телефон не вказано"}
                      </p>
                    </div>

                    {phone && (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(phone)}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#eadfce] bg-white text-[#77716b] transition-all duration-200 hover:bg-[#fff7f0] hover:text-[#202020] active:scale-[0.95]"
                          title="Скопіювати номер"
                        >
                          {copiedPhone ? (
                            <CheckCheck className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>

                        <a
                          href={`tel:${phone}`}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff6200] text-white transition-all duration-200 hover:bg-[#ef4f00] active:scale-[0.95]"
                          title="Подзвонити"
                        >
                          <PhoneCall className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#eadfce] bg-white p-3 sm:col-span-2">
                  <div className="ml-2 flex items-center gap-3">
                    <div className="h-[62px] w-[62px] shrink-0 overflow-hidden rounded-full border border-[#eadfce] bg-white p-1">
                      {masterPhoto ? (
                        <img
                          src={masterPhoto}
                          alt={masterName}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#fff1e8] text-[#ff6200]">
                          <UserStar className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="ml-2 min-w-0 flex-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#aaa19a]">
                        Майстер
                      </p>

                      <p className="mt-0.5 truncate text-[15px] font-black text-[#202020]">
                        {masterName}
                      </p>

                      <p className="truncate text-[12px] font-semibold text-[#77716b]">
                        Виконавець послуги
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!isArchived && !isCanceled && (
              <div className="absolute inset-x-0 bottom-0 border-t border-[#eadfce] bg-white/92 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-6 sm:pb-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {!isConfirmed && (
                    <button
                      type="button"
                      disabled={clientBookingActionLoading}
                      onClick={async () => {
                        await handleConfirmClientBooking(selectedBooking);
                        closeDetails();
                      }}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-[22px] bg-[var(--color-primary-buttom)] text-sm font-black text-white transition-all duration-200 hover:bg-[#4a4a4a] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                    >
                      <CheckCheck className="h-4 w-4" />
                      {clientBookingActionLoading
                        ? "Підтверджуємо..."
                        : "Підтвердити"}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={clientBookingActionLoading}
                    onClick={() => {
                      closeDetails();
                      setCancelClientBookingConfirm(selectedBooking);
                    }}
                    className={cn(
                      "inline-flex h-12 items-center justify-center gap-2 rounded-[22px] border border-[#fecaca] bg-[#fff5f5] px-4 text-sm font-black text-[#ef4444] transition-all duration-200 hover:border-[#fca5a5] hover:bg-[#ffecec] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
                      isConfirmed && "sm:col-span-2",
                    )}
                  >
                    <XCircle className="h-4 w-4" />
                    Скасувати запис
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  })()}

<Modal
  open={cancelClientBookingConfirm != null}
  onClose={() => setCancelClientBookingConfirm(null)}
  title="Скасувати запис?"
  badge="Підтвердження"
  icon={XCircle}
  size="sm"
  footer={
    <div className="flex justify-end gap-2">
      <Button
        variant="secondary"
        onClick={() => setCancelClientBookingConfirm(null)}
        disabled={clientBookingActionLoading}
        className="w-full sm:w-auto"
      >
        Назад
      </Button>

      <button
        type="button"
        disabled={clientBookingActionLoading}
        onClick={() => handleCancelClientBooking(cancelClientBookingConfirm)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ef4444] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#dc2626] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
      >
        <XCircle className="h-4 w-4" />
        {clientBookingActionLoading ? "Скасовуємо..." : "Так, скасувати"}
      </button>
    </div>
  }
>
  <div className="space-y-4">
    <div className="flex justify-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-[#ef4444]/30 blur-2xl" />

        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ef4444] text-white">
          <XCircle className="h-7 w-7" />
        </div>
      </div>
    </div>

    <div className="text-center">
      <h3 className="text-xl font-black tracking-tight text-[#202020]">
        Скасувати запис?
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#77716b]">
        Запис буде позначений як скасований вами. Після цього він більше не
        буде активним.
      </p>
    </div>

    <div className="rounded-2xl border border-[#ffd8d8] bg-[#fff7f7] p-3.5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#ef4444] shadow-sm">
          <AlertTriangle className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-[#202020]">
            Після скасування
          </p>

          <p className="mt-1 text-xs leading-5 text-[#77716b]">
            У профілі клієнта цей запис залишиться в історії зі статусом
            “Скасовано вами”.
          </p>
        </div>
      </div>
    </div>
  </div>
</Modal>
<Modal
  open={deleteClientConfirm.open}
  onClose={closeDeleteClientConfirm}
  title={canDeleteClient ? "Видалити клієнта?" : "Клієнта не можна видалити"}
  badge="Підтвердження"
  icon={Trash2}
  size="sm"
  footer={
    <div className="flex flex-row gap-2 sm:justify-end">
      <Button
        variant="secondary"
        disabled={deleteClientConfirm.loading}
        onClick={closeDeleteClientConfirm}
        className="flex-1 sm:flex-none"
      >
        Скасувати
      </Button>

      {canDeleteClient ? (
        <Button
          variant="danger"
          disabled={deleteClientConfirm.loading}
          onClick={confirmDeleteClient}
          className="flex-1 sm:flex-none"
        >
          <Trash2 className="h-4 w-4" />
          {deleteClientConfirm.loading ? "Видаляємо..." : "Видалити"}
        </Button>
      ) : (
        <Button
          variant="primary"
          disabled={deleteClientConfirm.loading || !clientToDelete}
          onClick={() => {
            if (!clientToDelete) return;

            setSelectedClientId(clientToDelete.id);
            setClientTabs((current) => ({
              ...current,
              [clientToDelete.id]: current[clientToDelete.id] || "history",
            }));
            closeDeleteClientConfirm();
          }}
          className="flex-1 sm:flex-none"
        >
          <Eye className="h-4 w-4" />
          Відкрити
        </Button>
      )}
    </div>
  }
>
  <div className="py-4 text-center">
    <div className="mb-5 flex items-center justify-center gap-4">
      <Avatar
        name={clientToDeleteName}
        photoUrl={clientToDelete?.photoUrl}
        className="h-20 w-20 rounded-full border-4 border-white shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
      />

      <div className="flex h-10 w-10 items-center justify-center rounded-full">
        <ChevronRight className="h-5 w-5 text-[#ff6200]" />
      </div>

      <div
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full border shadow-[0_12px_32px_rgba(229,72,77,0.12)]",
          canDeleteClient
            ? "border-[#fecaca] bg-[#fff1f1]"
            : "border-[#ffd6bd] bg-[#fff7f0]",
        )}
      >
        {canDeleteClient ? (
          <Trash2 className="h-9 w-9 text-[#e5484d]" />
        ) : (
          <CircleAlert className="h-9 w-9 text-[#ff5a00]" />
        )}
      </div>
    </div>

    <h4 className="break-words text-lg font-black leading-6 text-[#202020]">
      Клієнт

      <span className="my-1 block break-words text-[28px] font-black leading-[1.3] text-[#ff6200] sm:text-[32px]">
        {clientToDeleteName}
      </span>

      {canDeleteClient
        ? "буде видалений зі списку клієнтів."
        : "не може бути видалений."}
    </h4>

    {!canDeleteClient && (
      <div className="mt-5 rounded-[22px] border border-[#ffd6bd] bg-[#fff7f0] p-4 text-left">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-[#ff6200] shadow-sm">
            <CircleAlert className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-black text-[#202020]">
              Спочатку видаліть записи клієнта
            </p>

            <p className="mt-1 text-sm font-semibold leading-5 text-[#77716b]">
              {deleteClientBlockReason}
            </p>

            {clientToDeleteBookingsCount > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#eadbc9] bg-white px-3 py-1.5 text-xs font-black text-[#202020] shadow-sm">
                <CalendarDays className="h-3.5 w-3.5 text-[#ff6200]" />
                Записів: {clientToDeleteBookingsCount}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {deleteClientConfirm.error && (
      <div className="mt-4 rounded-[18px] border border-[#fecaca] bg-[#fff1f1] px-4 py-3 text-sm font-bold text-[#e5484d]">
        {deleteClientConfirm.error}
      </div>
    )}
  </div>
</Modal>
      <Modal
        open={createClientOpen}
        onClose={closeCreateClientModal}
        title="Додати клієнта"
        badge="Клієнт"
        icon={Plus}
        subtitle="Заповніть фото, ім'я, прізвище та контактні дані клієнта."
        size="md"
        footer={
          <div className="flex flex-row gap-2 sm:justify-end">
            <Button
              variant="secondary"
              onClick={closeCreateClientModal}
              disabled={creatingClient}
              className="flex-1 sm:flex-none"
            >
              Скасувати
            </Button>

            <Button
              type="submit"
              form="add-client-form"
              variant="primary"
              disabled={
                creatingClient ||
                !createClientForm.firstName.trim() ||
                !createClientForm.lastName.trim()
              }
              className="flex-1 sm:flex-none"
            >
              <Check className="h-4 w-4" />
              {creatingClient ? "Додаємо..." : "Додати"}
            </Button>
          </div>
        }
      >
        <form
          id="add-client-form"
          onSubmit={handleCreateClient}
          className="space-y-5"
        >
          <div className="flex items-center gap-4">
            <Avatar
              name={`${createClientForm.firstName} ${createClientForm.lastName}`}
              photoUrl={createClientForm.photoUrl}
              className="h-20 w-20 rounded-full border-4 border-white "
            />

            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#eadbc9] bg-white px-4 py-2.5 text-sm font-black text-[#202020] transition hover:border-[#ffd6bd] hover:bg-[#fff7f0]">
                  <Camera className="h-4 w-4" />
                  Додати фото
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePickClientPhoto}
                  className="hidden"
                />
              </label>

              {createClientForm.photoUrl && (
                <Button variant="danger" onClick={removeCreateClientPhoto}>
                  <Trash2 className="h-4 w-4" />
                  Прибрати
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#202020]">
                Ім'я
              </span>
              <input
                name="firstName"
                value={createClientForm.firstName}
                onChange={(e) =>
                  updateCreateClientField("firstName", e.target.value)
                }
                placeholder="Напр. Наталія"
                className="w-full rounded-2xl border border-[#eadbc9] bg-white px-4 py-3 text-sm font-medium text-[#202020] outline-none transition-all placeholder:text-[#77716b] hover:bg-[#fff7f0] focus:border-[#ff5a00] focus:ring-4 focus:ring-[#ff5a00]/10"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#202020]">
                Прізвище
              </span>
              <input
                name="lastName"
                value={createClientForm.lastName}
                onChange={(e) =>
                  updateCreateClientField("lastName", e.target.value)
                }
                placeholder="Напр. Коваленко"
                className="w-full rounded-2xl border border-[#eadbc9] bg-white px-4 py-3 text-sm font-medium text-[#202020] outline-none transition-all placeholder:text-[#77716b] hover:bg-[#fff7f0] focus:border-[#ff5a00] focus:ring-4 focus:ring-[#ff5a00]/10"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#202020]">
                Дата народження
              </span>
              <input
                name="birthDate"
                type="date"
                value={createClientForm.birthDate}
                onChange={(e) =>
                  updateCreateClientField("birthDate", e.target.value)
                }
                className="w-full rounded-2xl border border-[#eadbc9] bg-white px-4 py-3 text-sm font-medium text-[#202020] outline-none transition-all hover:bg-[#fff7f0] focus:border-[#ff5a00] focus:ring-4 focus:ring-[#ff5a00]/10"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#202020]">
                Телефон
              </span>
              <input
                name="phone"
                type="tel"
                value={createClientForm.phone}
                onChange={(e) =>
                  updateCreateClientField("phone", e.target.value)
                }
                placeholder="+380..."
                className="w-full rounded-2xl border border-[#eadbc9] bg-white px-4 py-3 text-sm font-medium text-[#202020] outline-none transition-all placeholder:text-[#77716b] hover:bg-[#fff7f0] focus:border-[#ff5a00] focus:ring-4 focus:ring-[#ff5a00]/10"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-black text-[#202020]">
                Email
              </span>
              <input
                name="email"
                type="email"
                value={createClientForm.email}
                onChange={(e) =>
                  updateCreateClientField("email", e.target.value)
                }
                placeholder="client@email.com"
                className="w-full rounded-2xl border border-[#eadbc9] bg-white px-4 py-3 text-sm font-medium text-[#202020] outline-none transition-all placeholder:text-[#77716b] hover:bg-[#fff7f0] focus:border-[#ff5a00] focus:ring-4 focus:ring-[#ff5a00]/10"
              />
            </label>
          </div>

{createClientError && (
  <div ref={createClientErrorRef}>
    <CreateClientErrorBox
      error={createClientError}
      onOpenDuplicate={
        typeof createClientError === "object" && createClientError?.duplicateId
          ? () => {
              setSelectedClientId(createClientError.duplicateId);
              setCreateClientOpen(false);
              setCreateClientForm(emptyClientForm);
              setCreateClientError("");
            }
          : null
      }
    />
  </div>
)}
        </form>
      </Modal>

      <Modal
        open={noteClient != null}
        onClose={() => {
          setNoteClient(null);
          setNoteDraft("");
        }}
        title="Додати нотатку"
        badge="Нотатка"
        icon={NotebookText}
        size="sm"
        footer={
          <div className="flex w-full flex-row gap-2 sm:justify-end">

            <Button
              variant="primary"
              disabled={!noteDraft.trim()}
              onClick={handleAddNote}
              className="flex-1 sm:flex-none"
            >
              <Check className="h-4 w-4" />
              Додати
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
{(!noteClient?.notes || noteClient.notes.length === 0) && (
  <div className="rounded-[22px] border border-[#ffd6bd] bg-[#fff7f0] p-3.5">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#ff5a00] shadow-sm">
        <AlertTriangle className="h-4.5 w-4.5" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-[#202020]">
          Внутрішня інформація
        </p>

        <p className="mt-1 text-xs font-medium leading-5 text-[#77716b]">
          Додавайте побажання, алергії, звички або важливі деталі перед
          наступним візитом.
        </p>
      </div>
    </div>
  </div>
)}

          <textarea
            value={noteDraft}
            maxLength={100}
            onChange={(e) => setNoteDraft(e.target.value.slice(0, 100))}
            rows={5}
         placeholder={`Наприклад:
Побажання клієнта, важливі деталі перед візитом або примітки для майстра...`}
            className="w-full resize-none rounded-2xl border border-[#eadbc9] bg-white px-4 py-3 text-sm font-medium text-[#202020] outline-none transition-all placeholder:text-[#77716b] hover:bg-[#fff7f0] focus:border-[#ff5a00] focus:ring-4 focus:ring-[#ff5a00]/10"
          />
{noteClient?.notes?.length > 0 && (
  <div className="space-y-2 border-t border-[#f0e7da] pt-4">
    <p className="text-sm font-black text-[#202020]">
      Нотатки клієнта
    </p>

    {noteClient.notes.map((note) => (
      <div
        key={note.id}
        className="flex items-start justify-between gap-3 rounded-2xl border border-[#eadbc9] bg-[#fbfaf8] p-3"
      >
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-medium text-[#202020]">
            {note.text}
          </p>

          <p className="mt-1 text-[11px] font-medium text-[#77716b]">
            {formatDateUA(note.createdAt)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            handleDeleteNote(noteClient.id, note.id);

            setNoteClient((current) => ({
              ...current,
              notes: (current?.notes || []).filter(
                (item) => item.id !== note.id,
              ),
            }));
          }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[#e5484d] transition hover:bg-[#fff1f1] active:scale-95"
          title="Видалити нотатку"
          aria-label="Видалити нотатку"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ))}
  </div>
)}
          <div className="text-right text-[11px] font-medium text-[#77716b]">
            {noteDraft.length}/100
          </div>
        </div>
      </Modal>
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Експорт клієнтів"
        badge="Excel"
        icon={Download}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setExportOpen(false)}
            >
              Скасувати
            </Button>

            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                handleExportClients();
                setExportOpen(false);
              }}
            >
              <Download className="h-4 w-4" />
              Експортувати
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["name", "Ім'я та прізвище"],
            ["phone", "Телефон"],
            ["email", "Email"],
            ["birthDate", "Дата народження"],
            ["nextVisit", "Наступний візит"],
            ["lastVisit", "Останній візит"],
            ["bookings", "Всього записів"],
            ["cancellations", "Скасовано"],
            ["spent", "Витрачено"],
            ["averageCheck", "Середній чек"],
            ["status", "Статус"],
            ["favoriteService", "Улюблена послуга"],
          ].map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-[#eadbc9] p-3"
            >
              <span className="text-sm font-semibold">{label}</span>

              <input
                type="checkbox"
                checked={exportFields[key]}
                onChange={(e) =>
                  setExportFields((prev) => ({
                    ...prev,
                    [key]: e.target.checked,
                  }))
                }
                className="cursor-pointer"
              />
            </label>
          ))}
        </div>
      </Modal>
      <Modal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Інструкція сторінки"
        badge="Клієнти"
        icon={CircleAlert}
        size="lg"
      >
        <div className="space-y-5 text-sm font-medium leading-6 text-[#77716b]">
          <div>
            <h4 className="text-base font-black text-[#202020]">
              Що показує ця сторінка
            </h4>
            <p className="mt-1">
              Тут зібрані всі клієнти студії, які мали записи. Клієнти додаються
              автоматично після бронювання.
            </p>
          </div>

          <div>
            <h4 className="text-base font-black text-[#202020]">
              Статуси клієнтів
            </h4>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {statusInfoItems.map((item) => (
                <div
                  key={item.value}
                  className="rounded-[18px] border border-[#eadbc9] bg-[#fbfaf8] p-4"
                >
                  <div className="mb-2">
                    <StatusBadge status={item.value} />
                  </div>

                  <p className="text-[13px] font-semibold leading-5 text-[#77716b]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-base font-black text-[#202020]">
              Можливості сторінки
            </h4>

            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Пошук клієнтів за іменем, прізвищем, телефоном або email.</li>
              <li>
                Фільтрація за статусами: нові, постійні, активні, неактивні,
                VIP.
              </li>
              <li>
                Сортування за алфавітом, датою додавання, останнім візитом,
                бронюваннями та витратами.
              </li>
              <li>
                Перегляд історії записів, фінансів, статусів і нотаток клієнта.
              </li>
              <li>Експорт клієнтів у Excel з вибором потрібних колонок.</li>
            </ul>
          </div>
        </div>
      </Modal>
      <Modal
  open={statusInfoClient != null}
  onClose={() => setStatusInfoClient(null)}
  title="Статус клієнта"
  badge="Пояснення"
  icon={CircleAlert}
  size="sm"
>
  {statusInfoClient && (
    <ClientStatusInfoModal client={statusInfoClient} />
  )}
</Modal>
    </div>
  );
}

function MiniMetric({ label, value, icon: Icon, danger = false }) {
  return (
    <div className="min-w-0 rounded-[18px] border border-[#ececec] bg-white px-3 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div
            className={cn(
              "ml-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              danger ? "text-[#e5484d]" : "text-[#ff5a00]",
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium leading-tight text-[#7b7b7b]">
            {label}
          </p>

          <p className={cn("mt-1 truncate !text-[13px] font-black sm:text-sm")}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function getClientBookings(client) {
  return Array.isArray(client.history) ? client.history : [];
}
function daysAgo(date) {
  if (!date) return null;

  const diff =
    new Date().setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function ClientAccordion({
  client,
  onOpenDetails,
  onAddNote,
  onOpenStatusInfo,
  onToggleVip,
  onAskDelete,
  onCopyPhone,
}) {
  const fullName =
    [client.firstName, client.lastName].filter(Boolean).join(" ") || "Клієнт";

  const clientStatus =
    client.isVip || client.status === "vip"
      ? "vip"
      : client.status || "new";

  const showDeleteButton = isManualClient(client);
  const deleteBlocked = getClientBookingsCount(client) > 0;

return (
  <article
    className={cn(
      "group/clientCard relative flex h-full flex-col overflow-hidden rounded-[18px] border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fff7f0]",
      client.isVip
        ? "border-[#f6d365] shadow-[0_0_0_1px_rgba(246,211,101,0.4),0_12px_32px_rgba(246,211,101,0.18)] hover:border-[#f6d365]"
        : "border-[#eadbc9] shadow-[0_10px_30px_rgba(17,17,17,0.04)] hover:border-[#ffd6bd]",
    )}
  >
    {showDeleteButton && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAskDelete?.();
        }}
className={cn(
  "absolute right-1  z-20 grid h-9 w-9 place-items-center transition-all duration-200 active:scale-[0.96]",
  deleteBlocked
    ? "border-[#eadbc9] text-[#b8afa6]"
    : "border-[#ffd6bd] text-[#ff5a00] hover:scale-[1.1] ",
)}
        title={
          deleteBlocked
            ? "Спочатку видаліть записи цього клієнта"
            : "Видалити клієнта"
        }
        aria-label="Видалити клієнта"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    )}

    {client.isVip && (
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#f6d365] via-[#fbbf24] to-[#fde68a]" />
    )}

    <div className="flex flex-1 flex-col px-3">
        <button
          type="button"
          onClick={onOpenDetails}
          className="mt-3 block w-full text-left"
        >
          <div className="flex gap-3">
            <div className="relative shrink-0">
<Avatar
  name={fullName}
  photoUrl={client.photoUrl}
  className="h-20 w-20 rounded-[20px] border-[#eef1f5] transition-all duration-200 group-hover/clientCard:border-[#ffd6bd]"
/>

              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                <ClientStatusBadges client={client} />
              </div>
            </div>

            <div className="flex min-h-[48px] min-w-0 flex-1 flex-col justify-center">
              <h3 className="line-clamp-2 text-[15px] font-black text-[#202020]">
                {fullName}
              </h3>

              <p className="mt-1 line-clamp-1 text-[12px] font-bold text-[#77716b]">
                {client.phone || "Номер відсутній"}
              </p>

            </div>
          </div>


        </button>
      </div>

    <div className="mt-4 grid grid-cols-4 border-t border-[#edf0f4] bg-[#fbfcfd]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails?.();
          }}
          className="grid h-11 place-items-center text-[#657084] transition hover:bg-[#fff7f0] hover:text-[#ff6200]"
          title="Деталі"
          aria-label="Деталі"
        >
          <Eye className="h-4 w-4" />
        </button>

<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    onAddNote?.();
  }}
  className="relative grid h-11 place-items-center border-l border-[#edf0f4] text-[#657084] transition hover:bg-[#fff7f0] hover:text-[#ff6200]"
  title="Нотатки"
  aria-label="Нотатки"
>
  <NotebookText className="h-4 w-4" />

  {client.notes?.length > 0 && (
    <span className="absolute left-[52%] top-[18%] flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ff5a00] px-1 text-[9px] font-black text-white">
      {client.notes.length}
    </span>
  )}
</button>

<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    onOpenStatusInfo?.();
  }}
  className="grid h-11 place-items-center border-x border-[#edf0f4] text-[#657084] transition hover:bg-[#fff7f0] hover:text-[#ff6200]"
  title="Інформація про статус"
  aria-label="Інформація про статус"
>
  <CircleAlert className="h-4 w-4" />
</button>

<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();

    if (client.phone) {
      window.location.href = `tel:${client.phone}`;
    }
  }}
  className="grid h-11 place-items-center text-[#657084] transition hover:bg-[#fff7f0] hover:text-[#ff6200]"
  title="Зателефонувати"
  aria-label="Зателефонувати"
>
 {client.phone ? (
  <Phone className="h-4 w-4" />
) : (
  <PhoneOff className="h-4 w-4 text-[#ef4444]" />
)}
</button>
      </div>
    </article>
  );
}

function ClientStatusInfoModal({ client }) {
  const fullName =
    [client.firstName, client.lastName].filter(Boolean).join(" ") || "Клієнт";

const clientStatus =
  client.isVip || client.status === "vip"
    ? "vip"
    : client.status || "new";

  const meta = statusMeta[clientStatus] || statusMeta.new;
  const description = statusDescriptions[clientStatus];

  const Icon = meta.icon || User;

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-[#eadbc9] bg-[#fff7f0] p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#ff6200] shadow-sm">
            <Icon className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-black text-[#202020]">
              {fullName} має статус “{meta.label}”
            </p>

            <p className="mt-2 text-sm font-medium leading-6 text-[#77716b]">
              {description?.description ||
                "Цей статус показує поточний рівень активності клієнта у студії."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-[#e5eaf0] bg-white p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#9b948c]">
          Чому саме цей статус
        </p>

        <p className="mt-2 text-sm font-semibold leading-6 text-[#202020]">
          {getClientStatusReason(client, clientStatus)}
        </p>
      </div>
    </div>
  );
}

function getClientStatusReason(client, status) {
  const fullName =
    [client.firstName, client.lastName].filter(Boolean).join(" ") || "Клієнт";

  if (status === "vip") {
    return `${fullName} має VIP-статус, тому що це один із найцінніших клієнтів платформи Aveliio. Такий статус визначається платформою або логікою лояльності.`;
  }

  if (status === "new") {
    return `${fullName} має статус “Новий”, бо клієнт має тільки перший запис або ще не має достатньої історії відвідувань.`;
  }

  if (status === "loyal") {
    return `${fullName} має статус “Постійний”, бо має повторні записи та нещодавно відвідував студію.`;
  }

  if (status === "attention") {
    return `${fullName} має статус “Активний”, бо останній візит був більше 30 днів тому, але не більше 60 днів.`;
  }

  if (status === "risk") {
    return `${fullName} має статус “Неактивний”, бо давно не було записів.`;
  }

  return `${fullName} має цей статус на основі історії записів у студії.`;
}

const statusInfoItems = [
  {
    value: "new",
    title: "Новий",
    description:
      "Клієнт має тільки один запис або ще не має сформованої історії відвідувань.",
  },
  {
    value: "loyal",
    title: "Постійний",
    description:
      "Клієнт має 2 або більше записів, а останній візит був протягом останніх 30 днів.",
  },
  {
    value: "attention",
    title: "Потребує уваги",
    description:
      "Останній нескасований запис був більше 30 днів тому, але не більше 60 днів.",
  },
  {
    value: "risk",
    title: "Ризик втрати",
    description:
      "Клієнт не був у студії більше 60 днів. Варто нагадати про себе або запропонувати повернутись.",
  },
  {
    value: "favorite",
    title: "Особливий клієнт",
    description:
      "Статус встановлюється вручну власником студії для важливих або пріоритетних клієнтів.",
  },
  {
    value: "vip",
    title: "VIP",
    description:
      "Статус лояльного клієнта, який автоматично встановлюється платформою. Цей статус не можна змінити або прибрати вручну власником студії.",
  },
];

function FinanceItem({ icon: Icon, label, value, color }) {
  return (
    <div className="min-w-0 rounded-[18px] bg-[#fbfaf8] px-3 py-3">
      <div
        className={cn(
          "mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm",
          color,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="text-[11px] font-bold leading-tight text-[#8a837c]">
        {label}
      </p>

      <p className="mt-1 line-clamp-2 text-[14px] font-black leading-5 text-[#202020]">
        {value}
      </p>
    </div>
  );
}

function ClientDetails({
  client,
  activeTab,
  onTabChange,
  onAddNote,
  onDeleteNote,
  onOpenBooking,
  compactHeader = false,
}) {
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(3);
  const [copiedPhone, setCopiedPhone] = useState(false);
async function handleCopyClientPhone(value) {
  const phone = String(value || "").trim();
  if (!phone) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(phone);
    } else {
      throw new Error("Clipboard API is not available");
    }

    setCopiedPhone(true);

    window.setTimeout(() => {
      setCopiedPhone(false);
    }, 1600);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = phone;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand("copy");
      setCopiedPhone(true);

      window.setTimeout(() => {
        setCopiedPhone(false);
      }, 1600);
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
  if (!client) return null;

  const bookings = getClientBookings(client);
  const visibleBookings = bookings.slice(0, visibleHistoryCount);
  const hasMoreBookings = visibleHistoryCount < bookings.length;
  const tabs = [
    { value: "history", label: "Історія", icon: CalendarDays },
    { value: "finance", label: "Фінанси", icon: Wallet },
    { value: "statuses", label: "Статус", icon: BadgeCheck },
    ];

  return (
    <aside
      className={cn(
        "h-fit overflow-hidden bg-white",
        compactHeader ? "border-t border-[#eadbc9]" : "",
      )}
    >
      <div className="">
        {!compactHeader && (
          <div className="flex items-start gap-3">
            <Avatar
              name={[client.firstName, client.lastName]
                .filter(Boolean)
                .join(" ")}
              photoUrl={client.photoUrl}
              className="h-20 w-20 rounded-full border-[#eef1f5] shadow-[0_10px_26px_rgba(15,23,42,0.10)]"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="mt-3 line-clamp-1 text-[16px] font-black text-[#202020]">
                  {[client.firstName, client.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </h3>

                <ClientStatusBadges client={client} />
              </div>

<div className="mt-2 inline-flex max-w-full items-center gap-1.5">
  <Phone className="h-3.5 w-3.5 shrink-0 text-[#ff6200]" />

  <p className="min-w-0 truncate text-sm font-bold text-[#77716b]">
    {client.phone || "Номер відсутній"}
  </p>

  {client.phone && (
    <button
      type="button"
      onClick={() => handleCopyClientPhone(client.phone)}
      className={cn(
        "ml-0.5 inline-flex h-7 w-7 shrink-0 touch-manipulation items-center justify-center rounded-lg transition-all duration-200 active:scale-[0.94]",
        copiedPhone
          ? "bg-emerald-50 text-emerald-600"
          : "text-[#77716b] hover:bg-[#fff1e8] hover:text-[#ff6200]",
      )}
      title="Скопіювати номер"
      aria-label="Скопіювати номер телефону"
    >
      {copiedPhone ? (
        <CheckCheck className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  )}
</div>

              <p className="truncate text-sm text-[#77716b]">
                {client.email}</p>
            </div>
          </div>
        )}

        <div className={cn(!compactHeader && "mt-4")}>
          {/* Телефон + планшет */}
          <div className="grid gap-2 lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              <InfoRow
                icon={BadgeCheck}
                label="Усього записів"
                value={client.bookings}
                color="text-[#ff6200]"
              />
              <InfoRow
                icon={XCircle}
                label="Скасовано клієнтом"
                value={client.cancellations}
                color="text-[#e5484d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <InfoRow
                icon={CalendarDays}
                label="Наступний візит"
                value={
                  client.nextBooking?.date
                    ? formatDateUA(client.nextBooking.date)
                    : "Не заплановано"
                }
                color="text-[#3b82f6]"
              />

              <InfoRow
                icon={CalendarDays}
                label="Останній візит"
                value={
                  client.lastVisit
                    ? formatDateUA(client.lastVisit)
                    : "Ще не було"
                }
                color="text-[#3b82f6]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <InfoRow
                icon={Star}
                label="Улюблена послуга"
                value={client.favoriteService || "Ще не сформовано"}
                color="text-[#ff6200]"
              />

              <InfoRow
                icon={Cake}
                label="Дата народження"
                value={
                  client.birthDate
                    ? formatDateUA(client.birthDate)
                    : "Не вказана"
                }
                color="text-[#f59e0b]"
              />
            </div>
          </div>

          {/* Комп'ютер */}
          <div className="hidden lg:grid lg:grid-cols-3 lg:gap-3">
            <InfoRow
              icon={BadgeCheck}
              label="Усього записів"
              value={client.bookings}
              color="text-[#ff6200]"
            />

            <InfoRow
              icon={CalendarDays}
              label="Наступний візит"
              value={
                client.nextBooking?.date
                  ? formatDateUA(client.nextBooking.date)
                  : "Не заплановано"
              }
              color="text-[#3b82f6]"
            />

            <InfoRow
              icon={Star}
              label="Улюблена послуга"
              value={client.favoriteService || "Ще не сформовано"}
              color="text-[#ff6200]"
            />

            <InfoRow
              icon={XCircle}
              label="Скасовано клієнтом"
              value={client.cancellations}
              color="text-[#e5484d]"
            />

            <InfoRow
              icon={CalendarDays}
              label="Останній візит"
              value={formatDateUA(client.lastBooking?.date)}
              color="text-[#3b82f6]"
            />

            <InfoRow
              icon={Cake}
              label="Дата народження"
              value={
                client.birthDate ? formatDateUA(client.birthDate) : "Не вказана"
              }
              color="text-[#f59e0b]"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex overflow-x-auto border-b border-[#edf0f4] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "relative flex h-10 flex-1 items-center justify-center gap-0.5 px-1 text-[12px] font-bold transition",
                "sm:h-10 sm:gap-1 sm:px-2 sm:text-[12px]",
                active ? "text-[#ff5a00]" : "text-[#77716b]",
              )}
            >
              <Icon className="h-3.5 w-3.5 mr-1 shrink-0 sm:h-3.5 sm:w-3.5 " />

              <span className="truncate">{tab.label}</span>

              {active && (
                <span className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-[#ff5a00] sm:left-2 sm:right-2" />
              )}
            </button>
          );
        })}
      </div>

      <div className="py-4">
{activeTab === "history" && (
  <div className="space-y-3">
    {bookings.length === 0 ? (
      <div className="rounded-[24px] border border-[#eadbc9] bg-white p-5 text-center text-sm font-bold text-[#77716b]">
        Історія записів поки порожня.
      </div>
    ) : (
      <div className="space-y-3">
        <ul className="space-y-3">
          {visibleBookings.map((booking) => (
            <ClientHistoryBookingCard
              key={booking.id}
              booking={booking}
              client={client}
              onClick={() => onOpenBooking?.(booking)}
            />
          ))}
        </ul>

        <div className="flex flex-col items-center gap-2 pt-1">
          <p className="text-xs font-bold text-[#77716b]">
            Показано {visibleBookings.length} з {bookings.length}
          </p>

          {bookings.length > 5 && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() =>
                setVisibleHistoryCount((count) =>
                  hasMoreBookings ? count + 5 : 5,
                )
              }
            >
              {hasMoreBookings ? "Показати ще" : "Сховати все"}

              {hasMoreBookings ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    )}
  </div>
)}

        {activeTab === "finance" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-[20px] bg-[#fff7f0] px-4 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#ff6200]">
                  Всього витрачено
                </p>

                <p className="mt-1 text-[28px] font-black leading-none tracking-[-0.04em] text-[#202020]">
                  {formatMoney(client.spent)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80">
                <Wallet className="h-6 w-6 text-[#ff6200]" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-[20px] bg-[#fbfaf8] px-4 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#10b981]">
                  Середній чек
                </p>

                <p className="mt-1 text-[22px] font-black leading-none tracking-[-0.04em] text-[#202020]">
                  {formatMoney(client.averageCheck)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white">
                <Receipt className="h-5 w-5 text-[#10b981]" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "statuses" &&
          (() => {
            const isVip = client.isVip || client.status === "vip";

            const currentStatus = isVip
              ? "vip"
              : client.isFavorite
                ? "favorite"
                : client.status;

            const item = statusInfoItems.find(
              (status) => status.value === currentStatus,
            );

            if (!item) return null;

            const meta = statusMeta[item.value] || statusMeta.new;
            const Icon = meta.icon;

return (
  <div className="rounded-[24px] border border-[#eadbc9] bg-white p-4 shadow-[0_8px_22px_rgba(17,17,17,0.05)]">
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#eadbc9] bg-[#fff7f0] text-[#ff6200]">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[#eadbc9] bg-white px-2.5 text-[10px] font-black text-[#ff6200] shadow-[0_8px_22px_rgba(17,17,17,0.05)]">
          <Icon className="h-3.5 w-3.5" />
          {item.title}
        </div>

        <p className="mt-3 text-sm font-semibold leading-5 text-[#77716b]">
          {item.description}
        </p>
      </div>
    </div>
  </div>
);
          })()}
      </div>
      
    </aside>
  );
}
function InfoRow({ icon: Icon, label, value, color }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-[16px] bg-[#fbfaf8] px-2.5 py-2">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm",
          color,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold leading-tight text-[#8a837c]">
          {label}
        </p>

        <p
          className={cn(
            "font-black text-[#202020]",
            label === "Улюблена послуга"
              ? "line-clamp-3 text-[11px] leading-4 sm:text-[12px]"
              : "truncate text-[13px]",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
function Insight({ icon: Icon, text, danger = false }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-3",
        danger
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-[#eadbc9] bg-white text-[#202020]",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-sm font-semibold">{text}</p>
    </div>
  );
}
