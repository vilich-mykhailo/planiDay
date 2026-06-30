//Masters.jsx
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import XLSX from "xlsx-js-style";
import Cropper from "react-easy-crop";
import { useBookings } from "../../context/bookings/useBookings";
import {
  Sparkles,
  Download,
  Plus,
  Pencil,
  Trash2,
  X,
  FilePenLine,
  UserStar,
  Timer,
  Copy,
  PhoneCall,
  FileSpreadsheet,
  CircleAlert,
  Check,
  Camera,
  CalendarDays,
  UserRound,
  ClipboardPen,
  CheckCheck,
  XCircle,
  Search,
  Users,
  MoreVertical,
  ArrowRight,
  CalendarCheck,
  Clock3,
  Clock,
  Coffee,
  Banknote,
  ChevronRight,
  ArrowDownToLine,
  Save,
  Building2,
} from "lucide-react";
import { useStudio } from "../../context/studio/useStudio";
import TimeSelect from "../../components/TimeSelect";

async function uploadMasterPhoto(studioId, file) {
  const token = localStorage.getItem("token");
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/media/studio/${studioId}/master-photo`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    },
  );

  const data = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(data?.message || `Upload failed (${res.status})`);
  return data;
}

function initialsFromName(name) {
  const s = String(name || "").trim();
  if (!s) return "M";

  return (
    s
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "M"
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";

  if (/^(https?:|blob:|data:)/i.test(s)) return s;

  if (!PUBLIC) return s;

  return `${PUBLIC.replace(/\/$/, "")}/${s.replace(/^\/+/, "")}`;
}

function pad2(n) {
  return String(n).padStart(2, "0");
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

function getBookingDateTime(booking) {
  const dateStr = booking?.date;
  const timeStr = parseTimeToHHMM(booking?.time);

  if (!dateStr || !timeStr) return null;

  const dt = new Date(`${dateStr}T${timeStr}:00`);

  if (Number.isNaN(dt.getTime())) return null;

  return dt;
}

function isMasterBookingCompleted(booking, nowTs) {
  const status = String(booking?.status || "").toLowerCase();

  if (status === "completed" || status === "deleted") return true;

  const dt = getBookingDateTime(booking);

  return dt ? dt.getTime() < nowTs : false;
}

function getCanceledBookingLabel(booking) {
  const canceledBy = String(
    booking?.canceledBy || booking?.cancelledBy || "",
  ).toLowerCase();

  if (canceledBy === "client") {
    return "Скасовано клієнтом";
  }

  return "Скасовано вами";
}

function getMasterBookingStatusMeta(booking, nowTs) {
  const status = String(booking?.status || "").toLowerCase();
  const canceledBy = booking?.canceledBy || null;
  const dt = getBookingDateTime(booking);
  const isArchived = dt ? dt.getTime() < nowTs : false;

  if (status === "deleted") {
    return {
      status: "completed",
      label: "Видалено",
      Icon: Trash2,
      text: "text-[#6b7280]",
    };
  }

  if (isArchived) {
    return {
      status: "completed",
      label: "Сеанс завершено",
      Icon: CheckCheck,
      text: "text-[#6b7280]",
    };
  }

  if (status === "confirmed") {
    return {
      status: "confirmed",
      label: "Підтверджено",
      Icon: CheckCheck,
      text: "text-[#41a85f]",
    };
  }

  if (status === "canceled") {
    return {
      status: "canceled",
      label: getCanceledBookingLabel(booking),
      Icon: XCircle,
      text: "text-[#ef4444]",
    };
  }

  return {
    status: "new",
    label: (
      <>
        Очікує ваше
        <br />
        підтвердження
      </>
    ),
    Icon: Clock3,
    text: "text-[#ffb020]",
  };
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

function getBookingClientName(booking) {
  return (
    booking?.clientName ||
    booking?.client?.name ||
    [booking?.client?.firstName, booking?.client?.lastName]
      .filter(Boolean)
      .join(" ") ||
    [booking?.clientAccount?.firstName, booking?.clientAccount?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Клієнт"
  );
}

function getBookingClientPhone(booking) {
  return (
    booking?.clientPhone ||
    booking?.phone ||
    booking?.client?.phone ||
    booking?.clientAccount?.phone ||
    ""
  );
}

function getBookingServiceName(booking) {
  return (
    booking?.serviceName ||
    booking?.service?.name ||
    booking?.service?.title ||
    "Послуга"
  );
}

function getBookingMasterName(booking, fallbackMaster) {
  return (
    booking?.masterName ||
    booking?.master?.name ||
    fallbackMaster?.name ||
    "Майстер"
  );
}

function getBookingClientPhoto(booking) {
  return toPublicUrl(
    booking?.clientPhotoUrl ||
      booking?.clientPhoto ||
      booking?.client?.photoUrl ||
      booking?.clientAccount?.photoUrl ||
      "",
  );
}

function getBookingMasterPhoto(booking, fallbackMaster) {
  return toPublicUrl(
    booking?.masterPhotoUrl ||
      booking?.masterPhoto ||
      booking?.master?.photoUrl ||
      fallbackMaster?.photoUrl ||
      "",
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
        "group relative overflow-hidden rounded-[32px] border border-[#ebe7df] bg-white transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

      {(title || subtitle || badge || actions) && (
        <div className="flex flex-col gap-3 border-b border-[#f1ece5] px-4 py-5 sm:px-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-[-0.03em] text-[#202020]">
                {title}
              </h2>

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

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function isExceptionValid(item) {
  if (!item.date) return false;
  if (!item.enabled) return true;
  if (!item.start || !item.end) return false;

  if (item.start >= item.end) return false;

  const breakStart = getExceptionBreakStart(item);
  const breakEnd = getExceptionBreakEnd(item);

  if (!breakStart && !breakEnd) return true;
  if (!breakStart || !breakEnd) return false;

  return (
    item.start < breakStart && breakStart < breakEnd && breakEnd < item.end
  );
}

function getExceptionBreakStart(item) {
  return (
    item?.breakStart ||
    item?.pauseStart ||
    item?.lunchStart ||
    item?.break?.start ||
    ""
  );
}

function getExceptionBreakEnd(item) {
  return (
    item?.breakEnd || item?.pauseEnd || item?.lunchEnd || item?.break?.end || ""
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
    primary: "bg-[var(--color-primary-buttom)] text-white hover:bg-[#4a4a4a]",
    secondary:
      "bg-white border border-[#eadbc9] text-[#202020] hover:!bg-[#fff7f0] hover:!border-[#ffd6bd]",
    danger:
      "border border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00] hover:border-[#ff5a00] hover:bg-[#ffe5d4]",
    accent:
      "border border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00] shadow-sm hover:bg-[#ff5a00] hover:text-white",
    ghost: "text-[#202020] hover:!bg-[#fff7f0]",
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
    primary: "bg-[#ff5a00] text-white hover:bg-[#ef4f00]",
    secondary:
      "bg-white border border-[#eadbc9] text-[#202020] hover:!bg-[#fff7f0] hover:!border-[#ffd6bd]",
    danger:
      "border border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00] hover:border-[#ff5a00] hover:bg-[#ffe5d4]",
    accent:
      "border border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00] shadow-sm hover:bg-[#ff5a00] hover:text-white",
    ghost: "text-[#202020] hover:!bg-[#fff7f0]",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-2xl px-3 transition-all duration-200 active:scale-95",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Modal({
  open,
  onClose,
  title,
  badge = "Редагування",
  icon: Icon = Pencil,
  subtitle,
  children,
  footer,
  size = "md",
  zIndexClass = "z-[9999]",
  mobileCompact = false,
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
    xl: "max-w-5xl",
  };

  return (
<div
  className={cn(
    "fixed inset-0 flex justify-center bg-[#202020]/45 backdrop-blur-[6px]",
    mobileCompact
      ? "items-center p-4 sm:p-6"
      : "items-stretch p-0 sm:items-center sm:p-6",
    zIndexClass,
  )}
>
<div
  className={cn(
    "flex w-full flex-col overflow-hidden bg-[#f7f5f1] shadow-[0_30px_90px_rgba(15,23,42,0.24)]",
    mobileCompact
      ? "h-auto max-h-[calc(100dvh-32px)] rounded-[28px] border border-[#f0e2d3] sm:max-h-[calc(100dvh-48px)] sm:rounded-[30px]"
      : "h-dvh rounded-none border-0 sm:h-auto sm:max-h-[calc(100dvh-48px)] sm:rounded-[30px] sm:border sm:border-[#f0e2d3]",
    "animate-in fade-in-0 zoom-in-95 duration-200",
    sizeClasses[size],
  )}
  onClick={(e) => e.stopPropagation()}
>
        <div className="relative shrink-0 overflow-hidden bg-[#f3eee7] px-5 py-5 sm:px-6 sm:py-6">
          <div className="absolute right-[-55px] top-[-70px] h-[180px] w-[180px] rounded-full bg-[#ff6200]/10 blur-3xl" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-[26px] font-black leading-[0.95] tracking-[-0.05em] text-[#202020] sm:text-[32px]">
                {title}
              </h3>

              {subtitle && (
                <p className="mt-2 text-sm font-medium leading-6 text-[#77716b]">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#77716b] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96]"
              aria-label="Закрити"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

<div
  className={cn(
    "min-h-0 flex-1 overflow-y-auto bg-[#fbfaf8] px-5 py-5 sm:px-6 sm:pb-5",
    mobileCompact ? "pb-5" : "pb-[110px]",
  )}
>
  {children}
</div>

{footer && (
  <div
    className={cn(
      "shrink-0 border-t border-[#f0e7da] bg-[#fbfaf8] px-5 py-4 sm:px-6",
      !mobileCompact && "sticky bottom-0",
    )}
  >
    {footer}
  </div>
)}
      </div>
    </div>
  );
}

function MasterFallbackAvatar({ name, className = "", textClassName = "" }) {
  const initials = initialsFromName(name || "Майстер");

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden border border-[#e6ddd3] bg-[#f6f3ee]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_26px_rgba(15,23,42,0.05)]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#fbfaf8_0%,#f2ede7_45%,#e7ddd3_100%)]" />

      <div className="absolute left-[-22%] top-[-24%] h-[76%] w-[76%] rounded-full bg-white/75 blur-xl" />
      <div className="absolute bottom-[-30%] right-[-26%] h-[80%] w-[80%] rounded-full bg-[#d5cabf]/45 blur-2xl" />

      <div className="absolute inset-x-0 top-0 h-px bg-white/90" />

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
function Avatar({ name, photoUrl, size = "md", className = "" }) {
  const sizes = {
    sm: {
      box: "h-12 w-12 rounded-2xl",
      text: "text-xl",
    },
    md: {
      box: "h-20 w-20 rounded-[22px]",
      text: "text-4xl",
    },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border-2 border-white bg-[#f6f3ee] shadow-[0_10px_26px_rgba(17,17,17,0.10)]",
        currentSize.box,
        className,
      )}
    >
      {photoUrl ? (
        <img
          src={toPublicUrl(photoUrl)}
          alt={name || "Майстер"}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <MasterFallbackAvatar
          name={name || "Майстер"}
          className="h-full w-full rounded-[inherit]"
          textClassName={currentSize.text}
        />
      )}
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-[#f2eee8]", className)}
      aria-hidden="true"
    />
  );
}

function MasterBookingCard({ booking, master, nowTs, onClick }) {
  const key = booking.date ? String(booking.date) : "";

  const statusMeta = getMasterBookingStatusMeta(booking, nowTs);
  const StatusIcon = statusMeta.Icon;
  const status = statusMeta.status;

  const clientName = getBookingClientName(booking);
  const service = getBookingServiceName(booking);
  const masterName = getBookingMasterName(booking, master);
  const clientPhoto = getBookingClientPhoto(booking);

  const timeLabel = parseTimeToHHMM(booking.time) || booking.time || "—";

  const date = key ? new Date(`${key}T00:00:00`) : null;

  const dayLabel =
    date && !Number.isNaN(date.getTime())
      ? String(date.getDate()).padStart(2, "0")
      : "—";

  const monthLabel =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString("uk-UA", { month: "long" })
      : "";

  const statusBorder =
    status === "confirmed"
      ? "border-[#bbf7d0]"
      : status === "new"
        ? "border-[#fed7aa]"
        : status === "canceled"
          ? "border-[#fecaca]"
          : "border-[#d1d5db]";

  const dateText =
    status === "confirmed"
      ? "text-[#41a85f]"
      : status === "new"
        ? "text-[#ff6200]"
        : status === "canceled"
          ? "text-[#ef4444]"
          : "text-[#6b7280]";

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
          status === "completed" && "opacity-85",
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
                  {clientName}
                </h2>

                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#77716b] max-[767px]:mt-1 max-[767px]:text-[8px] lg:text-[10px]">
                  <ClipboardPen className="h-4 w-4 shrink-0 text-[#77716b] max-[767px]:h-3 max-[767px]:w-3" />

                  <span className="line-clamp-2">{service}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "hidden h-full items-center justify-center border-l pl-3 max-[639px]:flex",
              statusBorder,
            )}
          >
            <div className="flex h-[74px] w-[58px] flex-col items-center justify-center">
              <p className="text-center text-[11px] font-bold capitalize text-[#aaa19a]">
                {monthLabel}
              </p>

              <p
                className={cn(
                  "text-[28px] font-[300] leading-none tracking-[-0.05em]",
                  dateText,
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
              statusBorder,
            )}
          >
            <div className="flex h-[82px] w-[78px] flex-col items-center justify-center">
              <span className="text-[13px] font-bold capitalize text-[#aaa19a]">
                {monthLabel}
              </span>

              <span
                className={cn(
                  "mt-0.5 text-[36px] font-[300] leading-none tracking-[-0.05em]",
                  dateText,
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

function MasterSkeletonRow() {
  return (
    <div className="rounded-[24px] border border-[#eadbc9] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-[#f2eee8]" />
          <div className="w-full min-w-0">
            <div className="h-4 w-40 animate-pulse rounded bg-[#f2eee8]" />
            <div className="mt-2 h-3 w-52 animate-pulse rounded bg-[#f2eee8]" />
            <div className="mt-2 h-3 w-64 animate-pulse rounded bg-[#f2eee8]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className="h-10 w-28 animate-pulse rounded-2xl bg-[#f2eee8]" />
          <div className="h-10 w-28 animate-pulse rounded-2xl bg-[#f2eee8]" />
        </div>
      </div>
    </div>
  );
}

function MastersListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <MasterSkeletonRow key={i} />
      ))}
    </div>
  );
}

export default function Masters() {
  const { studio } = useStudio();
  const queryClient = useQueryClient();
const { confirmBooking, cancelBooking } = useBookings();
  const studioId = studio?.id ?? null;
  const mastersQuery = useQuery({
    queryKey: ["masters", studioId],
    queryFn: () => fetchMasters(studioId),
    enabled: Boolean(studioId),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const [adding, setAdding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [exceptionsMaster, setExceptionsMaster] = useState(null);
  const [exceptionsModalOpen, setExceptionsModalOpen] = useState(false);
  const [masterExceptions, setMasterExceptions] = useState([]);
  const [studioSchedulePreview, setStudioSchedulePreview] = useState(null);
  const [exceptionsLoading, setExceptionsLoading] = useState(false);
  const [scheduleErrorModal, setScheduleErrorModal] = useState({
    open: false,
    title: "Помилка графіка",
    message: "",
    hint: "",
  });
  const [scheduleMonthDate, setScheduleMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [scheduleMultiSelect, setScheduleMultiSelect] = useState(false);
  const [selectedScheduleDates, setSelectedScheduleDates] = useState([]);
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [bulkScheduleDraft, setBulkScheduleDraft] = useState({
    enabled: true,
    start: "09:00",
    end: "18:00",
    breakStart: "12:00",
    breakEnd: "13:00",
  });
  const [bulkSaving, setBulkSaving] = useState(false);
  const studioScheduleQuery = useQuery({
    queryKey: ["studioScheduleWithExceptions", studioId],
    queryFn: () => fetchStudioScheduleFromDb(),
    enabled: Boolean(studioId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });

  const studioScheduleForCounters =
    studioSchedulePreview || studioScheduleQuery.data || studio;
  const [bookingsMaster, setBookingsMaster] = useState(null);
  const [bookingsFilter, setBookingsFilter] = useState("all");
  const [bookingsModalOpen, setBookingsModalOpen] = useState(false);
  const [visibleMasterBookingsCount, setVisibleMasterBookingsCount] =
    useState(10);
const [detailsBookingId, setDetailsBookingId] = useState(null);
const [copiedPhone, setCopiedPhone] = useState(false);
const [masterBookingActionLoading, setMasterBookingActionLoading] =
  useState(false);
const [cancelMasterBookingConfirm, setCancelMasterBookingConfirm] =
  useState(null);
  const bookingsQuery = useQuery({
    queryKey: ["bookings", studioId],
    queryFn: () => fetchStudioBookings(studioId),
    enabled: Boolean(studioId),
  });
  const todayDate = new Date();
  const nowTs = Date.now();
  const masterBookings = (bookingsQuery.data || []).filter(
    (b) => String(b.masterId) === String(bookingsMaster?.id),
  );

  const filteredMasterBookings = masterBookings.filter((booking) => {
    const bookingDate = new Date(`${booking.date}T00:00:00`);
    const today = new Date(
      todayDate.getFullYear(),
      todayDate.getMonth(),
      todayDate.getDate(),
    );

    const diffDays = Math.floor((bookingDate - today) / 86400000);
    const isCompleted = isMasterBookingCompleted(booking, nowTs);

    if (bookingsFilter === "completed") {
      return isCompleted;
    }

    if (bookingsFilter === "all") {
      return true;
    }

    if (bookingsFilter === "today") {
      return diffDays === 0;
    }

    if (isCompleted) {
      return false;
    }

    if (bookingsFilter === "all") {
      return true;
    }

    if (bookingsFilter === "week") {
      return diffDays >= 0 && diffDays <= 7;
    }

    if (bookingsFilter === "month") {
      return diffDays >= 0 && diffDays <= 30;
    }

    return true;
  });

  const sortedMasterBookings = [...filteredMasterBookings].sort((a, b) => {
    const dateCompare = String(a.date || "").localeCompare(
      String(b.date || ""),
    );

    if (dateCompare !== 0) return dateCompare;

    return (parseTimeToHHMM(a.time) || "").localeCompare(
      parseTimeToHHMM(b.time) || "",
    );
  });

  const visibleMasterBookings = sortedMasterBookings.slice(
    0,
    visibleMasterBookingsCount,
  );

  const hasMoreMasterBookings =
    visibleMasterBookingsCount < sortedMasterBookings.length;
  const selectedMasterBooking = useMemo(() => {
    if (detailsBookingId == null) return null;

    const booking = (bookingsQuery.data || []).find(
      (item) => String(item.id) === String(detailsBookingId),
    );

    if (!booking) return null;

    return booking;
  }, [detailsBookingId, bookingsQuery.data]);

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

  function closeBookingDetails() {
    setDetailsBookingId(null);
    setCopiedPhone(false);
  }

  function updateMasterBookingStatus(bookingId, patch) {
  queryClient.setQueryData(["bookings", studioId], (old = []) => {
    if (!Array.isArray(old)) return old;

    return old.map((booking) =>
      String(booking.id) === String(bookingId)
        ? {
            ...booking,
            ...patch,
          }
        : booking,
    );
  });
}

async function handleConfirmMasterBooking(booking) {
  if (!booking?.id || masterBookingActionLoading) return;

  setMasterBookingActionLoading(true);

  try {
    await confirmBooking(booking.id);

    updateMasterBookingStatus(booking.id, {
      status: "confirmed",
      canceledBy: null,
    });

    await queryClient.invalidateQueries({
      queryKey: ["bookings", studioId],
      exact: true,
    });
  } catch (error) {
    alert(error?.message || "Не вдалося підтвердити запис");
  } finally {
    setMasterBookingActionLoading(false);
  }
}

async function handleCancelMasterBooking(booking) {
  if (!booking?.id || masterBookingActionLoading) return;

  setMasterBookingActionLoading(true);

  try {
    await cancelBooking(booking.id);

    updateMasterBookingStatus(booking.id, {
      status: "canceled",
      canceledBy: "owner",
    });

    setCancelMasterBookingConfirm(null);

    await queryClient.invalidateQueries({
      queryKey: ["bookings", studioId],
      exact: true,
    });
  } catch (error) {
    alert(error?.message || "Не вдалося скасувати запис");
  } finally {
    setMasterBookingActionLoading(false);
  }
}

  function openScheduleError({
    title = "Помилка графіка",
    message,
    hint = "",
  }) {
    setScheduleErrorModal({
      open: true,
      title,
      message: message || "Перевірте графік роботи",
      hint,
    });
  }

  function closeScheduleError() {
    setScheduleErrorModal({
      open: false,
      title: "Помилка графіка",
      message: "",
      hint: "",
    });
  }

  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    master: null,
    loading: false,
  });
  const [cropModal, setCropModal] = useState({
    open: false,
    imageUrl: "",
    file: null,
    target: "", // "add" або "edit"
  });

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  async function fetchStudioBookings(studioId) {
    if (!studioId) return [];

    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/bookings/studio/${studioId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || "Load bookings failed");
    }

    return Array.isArray(data?.bookings) ? data.bookings : [];
  }

  async function syncMastersRelatedQueries() {
    if (!studioId) return;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["masters", studioId],
        exact: true,
      }),
      queryClient.invalidateQueries({
        queryKey: ["services", studioId],
        exact: true,
      }),
    ]);
  }

  async function fetchMasters(currentStudioId) {
    if (!currentStudioId) return [];

    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/studio/${currentStudioId}/masters`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || `Load masters failed (${res.status})`);
    }

    return Array.isArray(data?.masters) ? data.masters : [];
  }

  async function getCroppedImage(imageSrc, cropPixels) {
    const image = new Image();
    image.src = imageSrc;

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 900;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas error");

    ctx.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      900,
      900,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Crop failed"));
            return;
          }

          resolve(
            new File([blob], "master-photo.jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            }),
          );
        },
        "image/jpeg",
        0.82,
      );
    });
  }

  async function confirmDeleteMaster() {
    if (!deleteConfirm.master || deleteConfirm.loading) return;

    setDeleteConfirm((prev) => ({ ...prev, loading: true }));

    try {
      await deleteMaster(deleteConfirm.master);

      setDeleteConfirm({
        open: false,
        master: null,
        loading: false,
      });
    } catch {
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
  }

  async function deleteMasterPhoto(currentStudioId, key) {
    if (!key) return;
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/media/studio/${currentStudioId}/master-photo`,
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
      throw new Error(data?.message || `Delete failed (${res.status})`);
    }
    return data;
  }

  const [editOriginal, setEditOriginal] = useState({
    photoKey: null,
    photoUrl: "",
  });

  const masters = useMemo(() => mastersQuery.data || [], [mastersQuery.data]);
  const loading = mastersQuery.isLoading;
  const [query, setQuery] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const [exportFields, setExportFields] = useState({
    name: true,
    role: true,
    bio: false,
    status: true,
    exceptionsCount: true,
  });
  const [form, setForm] = useState({
    name: "",
    role: "",
    bio: "",
    photoUrl: "",
    photoKey: null,
    photoFile: null,
  });

  const [editMaster, setEditMaster] = useState(null);
  const [editDraft, setEditDraft] = useState({
    id: "",
    name: "",
    role: "",
    bio: "",
    photoUrl: "",
    photoKey: null,
    photoFile: null,
  });

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handlePickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);

    setCropModal({
      open: true,
      imageUrl,
      file,
      target: "add",
    });
  }

  function removePhoto() {
    setPhotoBroken(false);

    setForm((p) => {
      if (p.photoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(p.photoUrl);
      }
      return { ...p, photoUrl: "", photoKey: null, photoFile: null };
    });
  }

  async function addMaster(e) {
    e.preventDefault();
    const name = String(form.name || "").trim();
    if (!name || !studio?.id || adding) return;

    setAdding(true);
    try {
      let photoKey = null;
      let photoUrl = "";

      if (form.photoFile) {
        const uploaded = await uploadMasterPhoto(studio.id, form.photoFile);
        photoKey = uploaded.key;
        photoUrl = uploaded.url;
      }

      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/${studio.id}/masters`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            role: form.role,
            bio: form.bio,
            photoUrl,
            photoKey,
          }),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Add master failed:", res.status, data);

        if (photoKey) {
          try {
            await deleteMasterPhoto(studio.id, photoKey);
          } catch (error) {
            console.warn("Rollback delete failed:", error);
          }
        }

        alert(data?.message || `Add master failed (${res.status})`);
        return;
      }

      if (data?.master) {
        queryClient.setQueryData(["masters", studioId], (old = []) => [
          data.master,
          ...old,
        ]);
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["masters", studioId],
          exact: true,
        });
      }

      await queryClient.invalidateQueries({
        queryKey: ["services", studioId],
        exact: true,
      });

      if (form.photoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(form.photoUrl);
      }

      setForm({
        name: "",
        role: "",
        bio: "",
        photoUrl: "",
        photoKey: null,
        photoFile: null,
      });
      setPhotoBroken(false);
      setAddOpen(false);
    } finally {
      setAdding(false);
    }
  }

  async function deleteMaster(master) {
    if (!studio?.id) return;

    const token = localStorage.getItem("token");
    const id = master?.id;
    const key = master?.photoKey;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/masters/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.message || `Delete master failed (${res.status})`);
        return;
      }

      if (key) {
        try {
          await deleteMasterPhoto(studio.id, key);
        } catch (error) {
          console.warn("Photo delete from R2 failed:", error);
        }
      }

      queryClient.setQueryData(["masters", studioId], (old = []) =>
        old.filter((m) => m.id !== id),
      );

      await queryClient.invalidateQueries({
        queryKey: ["services", studioId],
        exact: true,
      });
    } catch (error) {
      console.error(error);
      alert("Помилка при видаленні майстра");
    }
  }

  function dateToInputValue(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getTodayDateKey() {
  return dateToInputValue(new Date());
}

function isPastDateKey(dateKey) {
  return String(dateKey || "") < getTodayDateKey();
}

  function createEmptyException() {
    return {
      id: "",
      date: dateToInputValue(),
      enabled: false,
      start: "09:00",
      end: "18:00",
      breakStart: "12:00",
      breakEnd: "13:00",
      isNew: true,
    };
  }

  function sortExceptions(list) {
    return [...list].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }

  function formatExceptionDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateStr;

    return new Intl.DateTimeFormat("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  function getExceptionDateValue(item) {
    return String(item?.date || "").slice(0, 10);
  }

  function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function addMonths(date, amount) {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
  }

  function getMonthTitle(date) {
    return new Intl.DateTimeFormat("uk-UA", {
      month: "long",
      year: "numeric",
    }).format(date);
  }

  function getWeekdayShort(date) {
    return new Intl.DateTimeFormat("uk-UA", {
      weekday: "short",
    }).format(date);
  }

  function getScheduleDayTitle(date) {
    return new Intl.DateTimeFormat("uk-UA", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);
  }

  function getBulkDraftFromItem(item) {
    const enabled = item?.enabled !== false;
    const breakStart = getExceptionBreakStart(item);
    const breakEnd = getExceptionBreakEnd(item);

    return {
      enabled,
      start: item?.start || "09:00",
      end: item?.end || "18:00",
      breakStart: breakStart && breakEnd ? breakStart : "",
      breakEnd: breakStart && breakEnd ? breakEnd : "",
    };
  }

  function getMasterBookingsForDate(master, dateKey) {
    return (bookingsQuery.data || []).filter((booking) => {
      const status = String(booking?.status || "").toLowerCase();

      return (
        String(booking?.masterId) === String(master?.id) &&
        String(booking?.date || "").slice(0, 10) === dateKey &&
        status !== "canceled" &&
        status !== "deleted"
      );
    });
  }

  function getScheduleItemForDate(dateKey) {
    const index = masterExceptions.findIndex(
      (item) => getExceptionDateValue(item) === dateKey,
    );

    if (index >= 0) {
      return {
        index,
        item: {
          ...masterExceptions[index],
          breakStart: getExceptionBreakStart(masterExceptions[index]),
          breakEnd: getExceptionBreakEnd(masterExceptions[index]),
          isStudioDefault: false,
        },
      };
    }

    const studioSchedule =
      getStudioScheduleForDay(
        getScheduleDayMeta(dateKey),
        studioSchedulePreview,
      ) || getStudioScheduleForDay(getScheduleDayMeta(dateKey), studio);

    return {
      index: -1,
      item: {
        ...createEmptyException(),
        date: dateKey,
        enabled: studioSchedule ? studioSchedule.enabled : false,
        start: studioSchedule?.start || "09:00",
        end: studioSchedule?.end || "18:00",
        breakStart: studioSchedule?.breakStart || "",
        breakEnd: studioSchedule?.breakEnd || "",
        isGenerated: true,
        isStudioDefault: Boolean(studioSchedule),
      },
    };
  }

  function buildMasterScheduleMonth(monthDate) {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const daysInMonth = new Date(
      firstDay.getFullYear(),
      firstDay.getMonth() + 1,
      0,
    ).getDate();
    const monthStartOffset = (firstDay.getDay() + 6) % 7;
    const weeksCount = Math.ceil((monthStartOffset + daysInMonth) / 7);
    const gridStart = addDays(firstDay, -monthStartOffset);

    return Array.from({ length: weeksCount * 7 }).map((_, index) => {
      const date = addDays(gridStart, index);
      const dateKey = dateToInputValue(date);
      const schedule = getScheduleItemForDate(dateKey);
      const dayBookings = getMasterBookingsForDate(exceptionsMaster, dateKey);

const todayKey = getTodayDateKey();

return {
  date,
  dateKey,
  dayNumber: date.getDate(),
  weekday: getWeekdayShort(date),
  weekdayIndex: (date.getDay() + 6) % 7,
  isCurrentMonth: date.getMonth() === firstDay.getMonth(),
  isToday: dateKey === todayKey,
  isPast: dateKey < todayKey,
  bookingsCount: dayBookings.length,
  ...schedule,
};
    });
  }

  function updateExceptionByDate(dateKey, field, value) {
    const applyScheduleChange = (item) => {
      const updated = { ...item, [field]: value };

      if (field === "enabled" && value) {
        return {
          ...updated,
          start: updated.start || "09:00",
          end: updated.end || "18:00",
          breakStart: getExceptionBreakStart(updated) || "12:00",
          breakEnd: getExceptionBreakEnd(updated) || "13:00",
        };
      }

      return updated;
    };

    setMasterExceptions((prev) => {
      const existingIndex = prev.findIndex(
        (item) => getExceptionDateValue(item) === dateKey,
      );

      if (existingIndex >= 0) {
        return prev.map((item, index) =>
          index === existingIndex ? applyScheduleChange(item) : item,
        );
      }

      const newItem = applyScheduleChange({
        ...createEmptyException(),
        date: dateKey,
      });

      return sortExceptions([...prev, newItem]);
    });
  }

  function closeScheduleSelection() {
    setScheduleMultiSelect(false);
    setSelectedScheduleDates([]);
    setScheduleEditorOpen(false);
  }

  function closeScheduleEditorWindow() {
    setScheduleEditorOpen(false);
  }

  function shiftScheduleMonth(amount) {
    setScheduleMonthDate((prev) => addMonths(prev, amount));
    closeScheduleSelection();
  }

  function resetScheduleMonthToToday() {
    const now = new Date();
    setScheduleMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    closeScheduleSelection();
  }

function toggleScheduleDate(dateKey) {
  if (isPastDateKey(dateKey)) {
    return;
  }

  if (!scheduleMultiSelect) {
    const current = getScheduleItemForDate(dateKey);

    setBulkScheduleDraft(getBulkDraftFromItem(current.item));
    setSelectedScheduleDates([dateKey]);
    setScheduleEditorOpen(true);
    return;
  }

  setScheduleEditorOpen(false);

  setSelectedScheduleDates((prev) =>
    prev.includes(dateKey)
      ? prev.filter((key) => key !== dateKey)
      : [...prev, dateKey],
  );
}

function toggleScheduleWeekday(monthDays, weekdayIndex) {
  const keys = monthDays
    .filter(
      (day) =>
        day.isCurrentMonth &&
        day.weekdayIndex === weekdayIndex &&
        !day.isPast,
    )
    .map((day) => day.dateKey);

  if (!keys.length) return;

  setScheduleMultiSelect(true);
  setScheduleEditorOpen(false);

  setSelectedScheduleDates((prev) => {
    const allSelected = keys.every((key) => prev.includes(key));

    if (allSelected) {
      return prev.filter((key) => !keys.includes(key));
    }

    return [...new Set([...prev, ...keys])];
  });
}

function quickSelectWorkdays(monthDays) {
  const keys = monthDays
    .filter(
      (day) =>
        day.isCurrentMonth &&
        day.weekdayIndex < 5 &&
        !day.isPast,
    )
    .map((day) => day.dateKey);

  if (!keys.length) return;

  setScheduleMultiSelect(true);
  setScheduleEditorOpen(false);
  setSelectedScheduleDates(keys);
}

  function openScheduleEditorForSelectedDates() {
    if (!selectedScheduleDates.length) return;

    const current = getScheduleItemForDate(selectedScheduleDates[0]);

    setBulkScheduleDraft(getBulkDraftFromItem(current.item));
    setScheduleEditorOpen(true);
  }

  function getScheduleTimeLines(item) {
    if (!item.enabled) return ["Вихідний"];

    const start = parseTimeToHHMM(item.start) || item.start || "--:--";
    const end = parseTimeToHHMM(item.end) || item.end || "--:--";

    const breakStartRaw = getExceptionBreakStart(item);
    const breakEndRaw = getExceptionBreakEnd(item);

    const breakStart = parseTimeToHHMM(breakStartRaw) || breakStartRaw || "";
    const breakEnd = parseTimeToHHMM(breakEndRaw) || breakEndRaw || "";

    const lines = [`${start} – ${end}`];

    if (breakStart && breakEnd) {
      lines.push(`${breakStart} – ${breakEnd}`);
    } else {
      lines.push("Без перерви");
    }

    return lines;
  }

  function buildBulkScheduleItem(dateKey, enabled) {
    const current = getScheduleItemForDate(dateKey);

    return {
      ...current.item,
      date: dateKey,
      enabled,
      start: enabled ? bulkScheduleDraft.start : current.item.start,
      end: enabled ? bulkScheduleDraft.end : current.item.end,
      breakStart: enabled ? bulkScheduleDraft.breakStart : "",
      breakEnd: enabled ? bulkScheduleDraft.breakEnd : "",
    };
  }

  function updateBulkScheduleField(field, value) {
    setBulkScheduleDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateBulkScheduleBreak(enabled) {
    setBulkScheduleDraft((prev) => ({
      ...prev,
      breakStart: enabled ? prev.breakStart || "12:00" : "",
      breakEnd: enabled ? prev.breakEnd || "13:00" : "",
    }));
  }

  function pickScheduleEntry(source, day) {
    if (!source) return null;

    const weekdayKeys = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const shortWeekdayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const ukWeekdayKeys = [
      "Понеділок",
      "Вівторок",
      "Середа",
      "Четвер",
      "П'ятниця",
      "Субота",
      "Неділя",
    ];
    const weekdayKey = weekdayKeys[day.weekdayIndex];

    if (Array.isArray(source)) {
      return (
        source.find((item) => {
          const rawDay = String(
            item?.date ??
              item?.day ??
              item?.weekday ??
              item?.dayOfWeek ??
              item?.name ??
              "",
          ).toLowerCase();

          return (
            String(item?.date || "").slice(0, 10) === day.dateKey ||
            Number(item?.dayOfWeek) === day.weekdayIndex + 1 ||
            Number(item?.dayOfWeek) === (day.weekdayIndex + 1) % 7 ||
            Number(item?.weekday) === day.weekdayIndex ||
            Number(item?.weekday) === day.weekdayIndex + 1 ||
            rawDay === weekdayKey ||
            rawDay === shortWeekdayKeys[day.weekdayIndex] ||
            rawDay === ukWeekdayKeys[day.weekdayIndex].toLowerCase()
          );
        }) || null
      );
    }

    if (typeof source === "object") {
      return (
        source[day.dateKey] ||
        source[weekdayKey] ||
        source[shortWeekdayKeys[day.weekdayIndex]] ||
        source[ukWeekdayKeys[day.weekdayIndex]] ||
        source[String(day.weekdayIndex)] ||
        source[String(day.weekdayIndex + 1)] ||
        null
      );
    }

    return null;
  }

  function getStudioScheduleExceptionSources(sourceStudio) {
    const roots = [
      sourceStudio?.scheduleExceptions,
      sourceStudio?.exceptions,
      sourceStudio?.schedule?.exceptions,
      sourceStudio?.schedule?.scheduleExceptions,
      sourceStudio?.workSchedule?.exceptions,
      sourceStudio?.workingHours?.exceptions,
      sourceStudio?.settings?.scheduleExceptions,
      sourceStudio?.settings?.exceptions,
      sourceStudio?.settings?.schedule?.exceptions,
      sourceStudio?.settings?.schedule?.scheduleExceptions,
    ];

    return roots.filter(Boolean);
  }

  function getStudioScheduleSources(sourceStudio) {
    const roots = [
      sourceStudio?.schedule,
      sourceStudio?.workSchedule,
      sourceStudio?.workingHours,
      sourceStudio?.workingSchedule,
      sourceStudio?.workHours,
      sourceStudio?.hours,
      sourceStudio?.openingHours,
      sourceStudio?.businessHours,
      sourceStudio?.studioSchedule,
      sourceStudio?.scheduleSettings,
      sourceStudio?.settings?.schedule,
      sourceStudio?.settings?.workSchedule,
      sourceStudio?.settings?.workingHours,
      sourceStudio?.settings?.workingSchedule,
      sourceStudio?.settings?.workHours,
      sourceStudio?.settings?.hours,
      sourceStudio?.settings?.openingHours,
      sourceStudio?.settings?.businessHours,
    ];

    return roots.flatMap((source) =>
      source
        ? [
            source,
            source?.days,
            source?.weekdays,
            source?.weekDays,
            source?.workingDays,
            source?.items,
            source?.entries,
            source?.schedule,
          ].filter(Boolean)
        : [],
    );
  }

  function hasStudioSchedulePayload(sourceStudio) {
    return getStudioScheduleSources(sourceStudio).length > 0;
  }

  function normalizeStudioPayload(data) {
    const direct = data?.studio || data?.data?.studio || data?.data || data;
    const list =
      (Array.isArray(data) ? data : null) ||
      (Array.isArray(data?.data) ? data.data : null) ||
      data?.studios ||
      data?.data?.studios ||
      data?.items ||
      data?.data?.items ||
      null;

    if (hasStudioSchedulePayload(direct)) return direct;

    if (Array.isArray(list)) {
      return (
        list.find((item) => String(item?.id) === String(studio?.id)) ||
        list.find(hasStudioSchedulePayload) ||
        direct
      );
    }

    return direct;
  }

  async function fetchStudioScheduleExceptionsFromDb() {
    if (!studio?.id) return [];

    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/studio/${studio.id}/schedule/exceptions`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return [];
    }

    return Array.isArray(data?.exceptions)
      ? data.exceptions.map((item) => ({
          ...item,
          date: String(item?.date || "").slice(0, 10),
          enabled: item?.enabled !== false,
          breakStart: getExceptionBreakStart(item),
          breakEnd: getExceptionBreakEnd(item),
        }))
      : [];
  }

  async function fetchStudioScheduleFromDb() {
    const studioExceptions = await fetchStudioScheduleExceptionsFromDb();
    const studioFromContext = normalizeStudioPayload(studio);

    if (hasStudioSchedulePayload(studioFromContext)) {
      return {
        ...studioFromContext,
        scheduleExceptions: studioExceptions,
      };
    }

    if (!studio?.id) {
      throw new Error(
        "\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0432\u0438\u0437\u043d\u0430\u0447\u0438\u0442\u0438 \u0441\u0442\u0443\u0434\u0456\u044e",
      );
    }

    const token = localStorage.getItem("token");
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const urls = [
      `${import.meta.env.VITE_API_URL}/studio/${studio.id}/schedule`,
      `${import.meta.env.VITE_API_URL}/studio/${studio.id}`,
      `${import.meta.env.VITE_API_URL}/studios/${studio.id}`,
      `${import.meta.env.VITE_API_URL}/studio/me`,
      `${import.meta.env.VITE_API_URL}/studio/profile`,
      `${import.meta.env.VITE_API_URL}/studio`,
      `${import.meta.env.VITE_API_URL}/studios`,
    ];
    let lastMessage = "";

    for (const url of urls) {
      try {
        const res = await fetch(url, { headers });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          lastMessage = data?.message || lastMessage;
          continue;
        }

        const studioFromDb = normalizeStudioPayload(data);

        if (hasStudioSchedulePayload(studioFromDb)) {
          return {
            ...studioFromDb,
            scheduleExceptions: studioExceptions,
          };
        }
      } catch (error) {
        lastMessage = error?.message || lastMessage;
      }
    }

    throw new Error(
      lastMessage ||
        "\u0423 \u0441\u0442\u0443\u0434\u0456\u0457 \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0438\u0439 \u0433\u0440\u0430\u0444\u0456\u043a",
    );
  }

  function getStudioScheduleForDay(day, sourceStudio = studio) {
    const exceptionRaw = getStudioScheduleExceptionSources(sourceStudio)
      .map((source) => pickScheduleEntry(source, day))
      .find(Boolean);

    const raw =
      exceptionRaw ||
      getStudioScheduleSources(sourceStudio)
        .map((source) => pickScheduleEntry(source, day))
        .find(Boolean);

    if (!raw) return null;

    const isClosed =
      raw.closed === true ||
      raw.enabled === false ||
      raw.isWorking === false ||
      raw.working === false ||
      raw.isOpen === false ||
      raw.open === false;

    if (isClosed) {
      return {
        enabled: false,
        start: "09:00",
        end: "18:00",
        breakStart: "",
        breakEnd: "",
        isStudioException: Boolean(exceptionRaw),
      };
    }

    const start = parseTimeToHHMM(
      raw?.start ||
        raw?.startTime ||
        raw?.from ||
        raw?.fromTime ||
        (typeof raw?.open === "string" ? raw.open : "") ||
        raw?.openTime ||
        raw?.opensAt ||
        raw?.workStart,
    );

    const end = parseTimeToHHMM(
      raw?.end ||
        raw?.endTime ||
        raw?.to ||
        raw?.toTime ||
        raw?.close ||
        raw?.closeTime ||
        raw?.closesAt ||
        raw?.workEnd,
    );

    if (!start || !end) return null;

    const breakStart = parseTimeToHHMM(
      getExceptionBreakStart(raw) ||
        raw?.breakFrom ||
        raw?.pauseFrom ||
        raw?.lunchFrom ||
        raw?.break?.from ||
        raw?.pause?.start ||
        raw?.lunch?.start ||
        raw?.breaks?.[0]?.start,
    );

    const breakEnd = parseTimeToHHMM(
      getExceptionBreakEnd(raw) ||
        raw?.breakTo ||
        raw?.pauseTo ||
        raw?.lunchTo ||
        raw?.break?.to ||
        raw?.pause?.end ||
        raw?.lunch?.end ||
        raw?.breaks?.[0]?.end,
    );

    return {
      enabled: true,
      start,
      end,
      breakStart: breakStart || "",
      breakEnd: breakEnd || "",
      isStudioException: Boolean(exceptionRaw),
    };
  }

  function getScheduleDayMeta(dateKey) {
    const date = new Date(`${dateKey}T00:00:00`);

    return {
      date,
      dateKey,
      weekdayIndex: (date.getDay() + 6) % 7,
    };
  }
  function timeToMinutes(value) {
    const time = parseTimeToHHMM(value);

    if (!time) return null;

    const [hours, minutes] = time.split(":").map(Number);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return null;
    }

    return hours * 60 + minutes;
  }
  function normalizeScheduleForCompare(item) {
    const enabled = item?.enabled !== false;

    if (!enabled) {
      return {
        enabled: false,
        start: "",
        end: "",
        breakStart: "",
        breakEnd: "",
      };
    }

    return {
      enabled: true,
      start: parseTimeToHHMM(item?.start) || "",
      end: parseTimeToHHMM(item?.end) || "",
      breakStart: parseTimeToHHMM(getExceptionBreakStart(item)) || "",
      breakEnd: parseTimeToHHMM(getExceptionBreakEnd(item)) || "",
    };
  }

  function isSameScheduleAsStudio(item, studioSchedule) {
    if (!studioSchedule) return false;

    const masterSchedule = normalizeScheduleForCompare(item);
    const studioDaySchedule = normalizeScheduleForCompare(studioSchedule);

    if (masterSchedule.enabled !== studioDaySchedule.enabled) {
      return false;
    }

    if (!masterSchedule.enabled && !studioDaySchedule.enabled) {
      return true;
    }

    return (
      masterSchedule.start === studioDaySchedule.start &&
      masterSchedule.end === studioDaySchedule.end &&
      masterSchedule.breakStart === studioDaySchedule.breakStart &&
      masterSchedule.breakEnd === studioDaySchedule.breakEnd
    );
  }

  function validateMasterScheduleInsideStudio(item, studioSchedule) {
    if (!studioSchedule) {
      throw new Error("Не знайдено графік студії для цієї дати");
    }

    const masterSchedule = normalizeScheduleForCompare(item);
    const studioDaySchedule = normalizeScheduleForCompare(studioSchedule);

    if (!masterSchedule.enabled) {
      return;
    }

    if (!studioDaySchedule.enabled) {
      throw new Error(
        "Студія у цей день не працює, тому майстер не може мати робочий графік",
      );
    }

    const masterStart = timeToMinutes(masterSchedule.start);
    const masterEnd = timeToMinutes(masterSchedule.end);
    const studioStart = timeToMinutes(studioDaySchedule.start);
    const studioEnd = timeToMinutes(studioDaySchedule.end);

    if (
      masterStart == null ||
      masterEnd == null ||
      studioStart == null ||
      studioEnd == null
    ) {
      throw new Error("Не вдалося перевірити години майстра та студії");
    }

    if (masterStart < studioStart) {
      throw new Error(
        `Майстер не може починати раніше за студію. Студія відкривається о ${studioDaySchedule.start}`,
      );
    }

    if (masterEnd > studioEnd) {
      throw new Error(
        `Майстер не може закінчувати пізніше за студію. Студія працює до ${studioDaySchedule.end}`,
      );
    }
  }

  function isRealMasterException(item, sourceStudio = studio) {
    const dateKey = getExceptionDateValue(item);

    if (!dateKey) return false;

    const studioSchedule = getStudioScheduleForDay(
      getScheduleDayMeta(dateKey),
      sourceStudio,
    );

    if (!studioSchedule) return true;

    return !isSameScheduleAsStudio(item, studioSchedule);
  }

  function getMasterScheduleExceptions(master) {
    return Array.isArray(master?.scheduleExceptions)
      ? master.scheduleExceptions.map((item) => ({
          ...item,
          date: String(item?.date || "").slice(0, 10),
          enabled: item?.enabled !== false,
          breakStart: getExceptionBreakStart(item),
          breakEnd: getExceptionBreakEnd(item),
        }))
      : [];
  }

  function getMasterIndividualExceptions(
    master,
    sourceStudio = studioScheduleForCounters,
  ) {
    return getMasterScheduleExceptions(master).filter((item) => {
      const dateKey = getExceptionDateValue(item);

      if (!dateKey) return false;

      return isRealMasterException(item, sourceStudio);
    });
  }

  function getActiveMasterIndividualExceptionsCount(
    master,
    sourceStudio = studioScheduleForCounters,
  ) {
    const today = dateToInputValue(new Date());

    return getMasterIndividualExceptions(master, sourceStudio).filter(
      (item) => {
        const dateKey = getExceptionDateValue(item);

        return dateKey >= today;
      },
    ).length;
  }

  function getMasterTodayWorkingStatus(
    master,
    today,
    sourceStudio = studioScheduleForCounters,
  ) {
    const todayException = getMasterIndividualExceptions(
      master,
      sourceStudio,
    ).find((item) => getExceptionDateValue(item) === today);

    if (todayException) {
      return todayException.enabled !== false;
    }

    const studioTodaySchedule = getStudioScheduleForDay(
      getScheduleDayMeta(today),
      sourceStudio,
    );

    if (!studioTodaySchedule) return true;

    return studioTodaySchedule.enabled !== false;
  }

  async function applyStudioScheduleToMonth(monthDays) {
    if (bulkSaving) return;

    if (scheduleMultiSelect && selectedScheduleDates.length === 0) {
      openScheduleError({
        title: "Дати не вибрано",
        message: "Оберіть дати, для яких потрібно застосувати графік студії",
        hint: "У режимі множинного вибору спочатку натисніть на потрібні дні в календарі.",
      });

      return;
    }

    setBulkSaving(true);

    try {
      const studioFromDb = await fetchStudioScheduleFromDb();
      setStudioSchedulePreview(studioFromDb);

      const shouldUseSelectedDates =
        scheduleMultiSelect && selectedScheduleDates.length > 0;

      const selectedDatesSet = new Set(selectedScheduleDates);

      const targetDays = monthDays.filter((day) => {
        if (!day.isCurrentMonth) return false;

        if (shouldUseSelectedDates) {
          return selectedDatesSet.has(day.dateKey);
        }

        return true;
      });

      const items = targetDays.map((day) => {
        const current = getScheduleItemForDate(day.dateKey);
        const studioSchedule = getStudioScheduleForDay(day, studioFromDb);

        if (!studioSchedule) {
          throw new Error(
            `Не знайдено графік студії для ${getScheduleDayTitle(day.date)}`,
          );
        }

        return {
          index: current.index,
          item: {
            ...current.item,
            date: day.dateKey,
            ...studioSchedule,
          },
        };
      });

      const invalidItem = items.find(({ item }) => !isExceptionValid(item));

      if (invalidItem) {
        throw new Error(
          "Перевірте графік студії: години або перерва заповнені некоректно",
        );
      }

      for (const { item, index } of items) {
        await persistScheduleException(item, index, studioFromDb);
      }

      await syncScheduleAfterSave();
      closeScheduleSelection();
    } catch (error) {
      openScheduleError({
        title: "Не вдалося застосувати графік студії",
        message: error?.message || "Не вдалося застосувати графік студії",
        hint: "Перевірте, чи для студії збережено графік на ці дні.",
      });
    } finally {
      setBulkSaving(false);
    }
  }

  function getBookingClientName(booking) {
    return (
      booking?.clientName ||
      booking?.client?.name ||
      [booking?.client?.firstName, booking?.client?.lastName]
        .filter(Boolean)
        .join(" ") ||
      [booking?.clientAccount?.firstName, booking?.clientAccount?.lastName]
        .filter(Boolean)
        .join(" ") ||
      "Клієнт"
    );
  }

  function getBookingClientPhone(booking) {
    return (
      booking?.clientPhone ||
      booking?.phone ||
      booking?.client?.phone ||
      booking?.clientAccount?.phone ||
      ""
    );
  }

  function getBookingServiceName(booking) {
    return (
      booking?.serviceName ||
      booking?.service?.name ||
      booking?.service?.title ||
      "Послуга"
    );
  }

  function getBookingMasterName(booking, fallbackMaster) {
    return (
      booking?.masterName ||
      booking?.master?.name ||
      fallbackMaster?.name ||
      "Майстер"
    );
  }

  function getBookingClientPhoto(booking) {
    return toPublicUrl(
      booking?.clientPhotoUrl ||
        booking?.clientPhoto ||
        booking?.client?.photoUrl ||
        booking?.clientAccount?.photoUrl ||
        "",
    );
  }

  function getBookingMasterPhoto(booking, fallbackMaster) {
    return toPublicUrl(
      booking?.masterPhotoUrl ||
        booking?.masterPhoto ||
        booking?.master?.photoUrl ||
        fallbackMaster?.photoUrl ||
        "",
    );
  }

  async function openMasterExceptions(master) {
    if (!studio?.id || !master?.id) return;

    setExceptionsMaster(master);
    setExceptionsModalOpen(true);
    setExceptionsLoading(true);
    setScheduleMultiSelect(false);
    setSelectedScheduleDates([]);
    setScheduleEditorOpen(false);
    setMasterExceptions([]);
    setStudioSchedulePreview(null);
    setScheduleMonthDate(() => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    try {
      const studioFromDb = await fetchStudioScheduleFromDb();
      setStudioSchedulePreview(studioFromDb);

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/masters/${master.id}/schedule/exceptions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || "Не вдалося завантажити особливі дати",
        );
      }

      const rawExceptions = Array.isArray(data?.exceptions)
        ? data.exceptions.map((item) => ({
            ...item,
            date: String(item?.date || "").slice(0, 10),
            enabled: item?.enabled !== false,
            breakStart: getExceptionBreakStart(item),
            breakEnd: getExceptionBreakEnd(item),
            isNew: false,
          }))
        : [];

      setMasterExceptions(sortExceptions(rawExceptions));
    } catch (error) {
      openScheduleError({
        title: "Помилка завантаження",
        message: error?.message || "Не вдалося завантажити особливі дати",
        hint: "Закрийте вікно майстра та відкрийте його ще раз.",
      });
    } finally {
      setExceptionsLoading(false);
    }
  }
  async function deleteScheduleException(item) {
    const dateKey = getExceptionDateValue(item);

    if (!item?.id) {
      setMasterExceptions((prev) =>
        prev.filter((row) => getExceptionDateValue(row) !== dateKey),
      );

      return null;
    }

    if (!exceptionsMaster?.id) return null;

    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/studio/masters/${exceptionsMaster.id}/schedule/exceptions/${item.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || "Не вдалося видалити особливу дату");
    }

    setMasterExceptions((prev) =>
      prev.filter(
        (row) =>
          String(row.id) !== String(item.id) &&
          getExceptionDateValue(row) !== dateKey,
      ),
    );

    return data;
  }
  async function persistScheduleException(item, index, sourceStudio = null) {
    if (!exceptionsMaster?.id) return null;

    const dateKey = getExceptionDateValue(item);

    if (!dateKey) {
      throw new Error("Оберіть дату");
    }

    const normalizedItem = {
      ...item,
      date: dateKey,
      breakStart: getExceptionBreakStart(item),
      breakEnd: getExceptionBreakEnd(item),
    };

    const studioFromDb = sourceStudio || (await fetchStudioScheduleFromDb());

    const studioSchedule = getStudioScheduleForDay(
      getScheduleDayMeta(dateKey),
      studioFromDb,
    );

    if (!studioSchedule) {
      throw new Error(`Не знайдено графік студії для ${dateKey}`);
    }

    if (!isExceptionValid(normalizedItem)) {
      throw new Error("Перевірте години роботи та перерви");
    }

    validateMasterScheduleInsideStudio(normalizedItem, studioSchedule);

    if (isSameScheduleAsStudio(normalizedItem, studioSchedule)) {
      await deleteScheduleException(normalizedItem);
      return null;
    }

    const token = localStorage.getItem("token");

    const body = {
      date: normalizedItem.date,
      enabled: normalizedItem.enabled,
      start: normalizedItem.enabled ? normalizedItem.start : null,
      end: normalizedItem.enabled ? normalizedItem.end : null,
      breakStart: normalizedItem.enabled
        ? getExceptionBreakStart(normalizedItem) || null
        : null,
      breakEnd: normalizedItem.enabled
        ? getExceptionBreakEnd(normalizedItem) || null
        : null,
    };

    const url = normalizedItem.id
      ? `${import.meta.env.VITE_API_URL}/studio/masters/${exceptionsMaster.id}/schedule/exceptions/${normalizedItem.id}`
      : `${import.meta.env.VITE_API_URL}/studio/masters/${exceptionsMaster.id}/schedule/exceptions`;

    const method = normalizedItem.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || "Не вдалося зберегти");
    }

    const savedException = {
      ...(data?.exception || normalizedItem),
      date: String(data?.exception?.date || normalizedItem.date || "").slice(
        0,
        10,
      ),
      breakStart:
        getExceptionBreakStart(data?.exception) ||
        getExceptionBreakStart(normalizedItem),
      breakEnd:
        getExceptionBreakEnd(data?.exception) ||
        getExceptionBreakEnd(normalizedItem),
      isNew: false,
      isGenerated: false,
    };

    setMasterExceptions((prev) => {
      const next = sortExceptions(
        index >= 0
          ? prev.map((row, i) => (i === index ? savedException : row))
          : [
              ...prev.filter(
                (row) => getExceptionDateValue(row) !== savedException.date,
              ),
              savedException,
            ],
      );

      return next;
    });

    return savedException;
  }

  async function syncScheduleAfterSave() {
    await queryClient.invalidateQueries({
      queryKey: ["masters", studioId],
      exact: true,
    });

    await mastersQuery.refetch();
  }

  async function saveException(item, index) {
    try {
      await persistScheduleException(item, index);
      await syncScheduleAfterSave();
    } catch (error) {
      openScheduleError({
        title: "Не вдалося зберегти графік",
        message: error?.message || "Не вдалося зберегти графік майстра",
        hint: "Перевірте, щоб години майстра не виходили за межі графіка студії.",
      });
    }
  }

  async function applyBulkSchedule(enabled = bulkScheduleDraft.enabled) {
    if (!selectedScheduleDates.length || bulkSaving) return;

    setBulkSaving(true);

    try {
      const studioFromDb = await fetchStudioScheduleFromDb();
      setStudioSchedulePreview(studioFromDb);
      const items = selectedScheduleDates.map((dateKey) => {
        const current = getScheduleItemForDate(dateKey);
        return {
          item: buildBulkScheduleItem(dateKey, enabled),
          index: current.index,
        };
      });

      const invalidItem = items.find(({ item }) => {
        const dateKey = getExceptionDateValue(item);

        const studioSchedule = getStudioScheduleForDay(
          getScheduleDayMeta(dateKey),
          studioFromDb,
        );

        if (!isExceptionValid(item)) {
          return true;
        }

        try {
          validateMasterScheduleInsideStudio(item, studioSchedule);
          return false;
        } catch {
          return true;
        }
      });

      if (invalidItem) {
        const dateKey = getExceptionDateValue(invalidItem.item);

        const studioSchedule = getStudioScheduleForDay(
          getScheduleDayMeta(dateKey),
          studioFromDb,
        );

        try {
          validateMasterScheduleInsideStudio(invalidItem.item, studioSchedule);
        } catch (error) {
          openScheduleError({
            title: "Графік поза межами студії",
            message:
              error?.message ||
              "Графік майстра має бути в межах графіка студії",
            hint: "Наприклад, якщо студія працює 07:00–20:00, майстер не може працювати 06:00–20:05.",
          });

          return;
        }

        openScheduleError({
          title: "Некоректний графік",
          message: "Перевірте години роботи та перерви",
          hint: "Початок має бути раніше кінця, а перерва має бути всередині робочого часу.",
        });

        return;
      }

      for (const { item, index } of items) {
        await persistScheduleException(item, index, studioFromDb);
      }

      await syncScheduleAfterSave();
      closeScheduleSelection();
    } catch (error) {
      openScheduleError({
        title: "Не вдалося застосувати графік",
        message: error?.message || "Не вдалося застосувати графік",
        hint: "Перевірте вибрані дати та графік студії.",
      });
    } finally {
      setBulkSaving(false);
    }
  }

  function openEdit(master) {
    setEditMaster(master);

    setEditOriginal({
      photoKey: master.photoKey ?? null,
      photoUrl: master.photoUrl || "",
    });

    setEditDraft({
      id: master.id,
      name: master.name || "",
      role: master.role || "",
      bio: master.bio || "",
      photoUrl: master.photoUrl || "",
      photoKey: master.photoKey ?? null,
      photoFile: null,
    });
  }

  async function closeEdit() {
    const prevKey = editOriginal.photoKey;
    const draftKey = editDraft.photoKey;

    const uploadedNewButCancelled = Boolean(draftKey) && draftKey !== prevKey;

    if (uploadedNewButCancelled) {
      try {
        await deleteMasterPhoto(studio.id, draftKey);
      } catch (error) {
        console.warn("Cancel cleanup delete failed:", error);
      }
    }

    setEditMaster(null);
    setEditDraft({
      id: "",
      name: "",
      role: "",
      bio: "",
      photoUrl: "",
      photoKey: null,
      photoFile: null,
    });
    setEditOriginal({ photoKey: null, photoUrl: "" });
  }

  async function editPickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);

    setCropModal({
      open: true,
      imageUrl,
      file,
      target: "edit",
    });
  }

  async function confirmCrop() {
    if (!cropModal.imageUrl || !croppedAreaPixels) return;

    const croppedFile = await getCroppedImage(
      cropModal.imageUrl,
      croppedAreaPixels,
    );

    const localUrl = URL.createObjectURL(croppedFile);

    if (cropModal.target === "add") {
      setForm((p) => {
        if (p.photoUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(p.photoUrl);
        }

        return {
          ...p,
          photoUrl: localUrl,
          photoFile: croppedFile,
          photoKey: null,
        };
      });

      setPhotoBroken(false);
    }

    if (cropModal.target === "edit") {
      setEditDraft((p) => {
        if (p.photoUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(p.photoUrl);
        }

        return {
          ...p,
          photoUrl: localUrl,
          photoFile: croppedFile,
        };
      });
    }

    URL.revokeObjectURL(cropModal.imageUrl);

    setCropModal({
      open: false,
      imageUrl: "",
      file: null,
      target: "",
    });

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  const inputBaseClass =
    "w-full rounded-2xl border border-[#eadbc9] bg-white px-4 py-3 " +
    "text-sm font-semibold text-[#202020] outline-none transition-all " +
    "placeholder:text-[#9b948c] " +
    "hover:!bg-[#fff7f0] hover:!border-[#ffd6bd] " +
    "focus:border-[#ff5a00] focus:ring-4 focus:ring-[#ff5a00]/10";

  async function saveEdit() {
    const name = String(editDraft.name || "").trim();
    if (!name || !studio?.id) return;

    const token = localStorage.getItem("token");

    const prevKey = editOriginal.photoKey;

    let nextKey = editDraft.photoKey ?? null;
    let nextUrl = editDraft.photoUrl || "";

    if (editDraft.photoFile) {
      const uploaded = await uploadMasterPhoto(studio.id, editDraft.photoFile);
      nextKey = uploaded.key;
      nextUrl = uploaded.url;
    }

    if (!nextUrl) nextUrl = "";
    if (!nextKey) nextKey = null;

    const shouldDeletePrev = Boolean(prevKey) && prevKey !== nextKey;

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/studio/masters/${editDraft.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          role: editDraft.role,
          bio: editDraft.bio,
          photoUrl: nextUrl,
          photoKey: nextKey,
        }),
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (editDraft.photoFile && nextKey) {
        try {
          await deleteMasterPhoto(studio.id, nextKey);
        } catch (error) {
          console.warn("Rollback delete failed:", error);
        }
      }
      alert(data?.message || `Update failed (${res.status})`);
      return;
    }

    if (shouldDeletePrev) {
      try {
        await deleteMasterPhoto(studio.id, prevKey);
      } catch (error) {
        console.warn("Old photo delete failed:", error);
      }
    }

    if (editDraft.photoUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(editDraft.photoUrl);
    }

    if (data?.master) {
      queryClient.setQueryData(["masters", studioId], (old = []) =>
        old.map((m) => (m.id === data.master.id ? data.master : m)),
      );
    } else {
      await queryClient.invalidateQueries({
        queryKey: ["masters", studioId],
        exact: true,
      });
    }

    closeEdit();

    await queryClient.invalidateQueries({
      queryKey: ["services", studioId],
      exact: true,
    });
  }

  const total = masters.length;
  const filteredMasters = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return masters;

    return masters.filter((master) =>
      `${master.name || ""} ${master.role || ""} ${master.bio || ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [masters, query]);
  const [photoBroken, setPhotoBroken] = useState(false);

  async function handleExportMasters() {
    const sortedMasters = [...filteredMasters].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "uk", {
        sensitivity: "base",
      }),
    );
    console.log("MASTER", sortedMasters[0]);
    console.log("EXCEPTIONS", sortedMasters[0]?.scheduleExceptions);
    const token = localStorage.getItem("token");

    const rows = await Promise.all(
      sortedMasters.map(async (master) => {
        const row = {};

        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/studio/masters/${master.id}/schedule/exceptions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await res.json().catch(() => null);

        const scheduleExceptions = Array.isArray(data?.exceptions)
          ? data.exceptions
          : [];

        const todayException = scheduleExceptions.find(
          (e) => String(e.date || "").slice(0, 10) === today,
        );

        const isWorkingToday = !todayException || todayException.enabled;

        if (exportFields.name) row["Імʼя"] = master.name || "-";
        if (exportFields.role) row["Спеціалізація"] = master.role || "-";
        if (exportFields.status)
          row["Статус сьогодні"] = isWorkingToday ? "Працює" : "Вихідний";

        if (exportFields.exceptionsCount) {
          const exceptions = scheduleExceptions
            .filter((e) => e.date)
            .sort((a, b) => String(a.date).localeCompare(String(b.date)))
            .map((e) => {
              const date = formatExceptionDate(String(e.date).slice(0, 10));

              if (!e.enabled) {
                return `${date} — Вихідний`;
              }

              return `${date} — ${e.start || "--:--"} - ${e.end || "--:--"}`;
            });

          row["Особливі дати"] = exceptions.length
            ? exceptions.join("\n")
            : "-";
        }

        return row;
      }),
    );

    if (!rows.length) {
      alert("Немає майстрів для експорту");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = Object.keys(rows[0] || {}).map((key) => {
      worksheet["!rows"] = rows.map((row) => {
        const exceptions = String(row["Особливі дати"] || "");

        const lines = exceptions.split("\n").length;

        return {
          hpt: Math.max(28, lines * 22),
        };
      });
      if (key === "Опис") {
        return { wch: 40 };
      }

      if (key === "Особливі дати") {
        return { wch: 32 };
      }

      const maxLength = Math.max(
        key.length,
        ...rows.map((row) => String(row[key] ?? "").length),
      );

      return { wch: Math.max(maxLength + 8, 18) };
    });

    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          font: { bold: row === 0 },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
        };
      }
    }
    worksheet["!rows"] = [
      { hpt: 28 }, // заголовок
      ...rows.map((row) => {
        const exceptions = String(row["Особливі дати"] || "");

        const lines = exceptions.split("\n").length;

        return {
          hpt: Math.max(24, lines * 22),
        };
      }),
    ];
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Майстри");
    XLSX.writeFile(
      workbook,
      `masters-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf8]">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="relative mb-6 overflow-hidden rounded-[32px] border border-[#ebe7df] bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-7">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-[#202020] sm:text-6xl">
                Май<span className="text-[#ff5a00]">стри</span>
              </h1>

              <p className="mt-3 max-w-[640px] text-[14px] leading-6 text-[#7b766f] sm:text-[16px]">
                Керуйте командою студії, профілями майстрів та їхніми особливими
                датами.
              </p>
            </div>

            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                className="grid !px-0 h-10 w-10 place-items-center rounded-full text-[#ff6200] transition-all  hover:!bg-[#fff7f0] active:scale-95 "
                title="Інформація"
              >
                <CircleAlert className="h-5 w-5" />
              </button>

              <div className="hidden sm:block">
                <Button
                  variant="ghost"
                  className="h-12 !px-1.5 transition-all active:scale-95 mr-2"
                  onClick={() => setExportOpen(true)}
                >
                  <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
                  Експорт
                </Button>
              </div>

              <Button
                variant="primary"
                onClick={() => setAddOpen(true)}
                className="h-10 shrink-0 px-3 sm:h-12 sm:px-5"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Додати майстра</span>
              </Button>
            </div>
          </div>
        </div>

        <SectionCard
          title={
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-buttom)] text-white">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-[-0.03em] text-[#202020]">
                    Майстри
                  </h2>

                  <span className="inline-flex items-center rounded-full bg-[#fff7f0] px-2.5 py-1 text-xs font-black text-[#ff6200]">
                    {filteredMasters.length}
                  </span>
                </div>

                <p className="mt-1 text-sm font-medium text-[var(--color-caramel)]">
                  Керуйте майстрами, редагуйте профілі та додавайте особливі
                  дати.
                </p>
              </div>
            </div>
          }
        >
          <div className="flex flex-col mb-3 gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-[360px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a847d]" />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Пошук майстрів..."
                className="
      h-10 w-full
      rounded-xl
      border border-[#ebe7df]
      bg-[#fcfbf9]
      pl-9 pr-3
      text-[13px]
      font-semibold
      text-[#202020]
      outline-none
      transition-all
      placeholder:text-[#9b948c]

      sm:h-12
      sm:rounded-2xl
      sm:pl-11
      sm:pr-4
      sm:text-[14px]

      hover:border-[#ffd8c2]
      hover:bg-white
      focus:border-[#ff6200]
      focus:ring-4
      focus:ring-[#ff6200]/10
    "
              />
            </div>
          </div>

          {loading ? (
            <MastersListSkeleton />
          ) : total === 0 ? (
            <div className="rounded-[32px] border-2 border-dashed border-[#ffd6bd] bg-[#fff7f0] px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#ff6200] shadow-sm">
                <Users className="h-7 w-7" />
              </div>

              <h2 className="mt-4 text-xl font-black text-[#202020]">
                Поки що немає майстрів
              </h2>

              <p className="mt-2 text-sm text-[#77716b]">
                Додайте першого майстра, щоб почати приймати записи клієнтів.
              </p>
            </div>
          ) : filteredMasters.length === 0 ? (
            <div className="rounded-[32px] border-2 border-dashed border-[#ffd6bd] bg-[#fff7f0] px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#ff6200] shadow-sm">
                <Search className="h-7 w-7" />
              </div>

              <h2 className="mt-4 text-xl font-black text-[#202020]">
                Нічого не знайдено
              </h2>

              <p className="mt-2 text-sm text-[#77716b]">
                За запитом{" "}
                <span className="font-black text-[#202020]">"{query}"</span> не
                знайдено жодного майстра.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredMasters.map((m) => {
                  const now = new Date();
                  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

                  const activeExceptionsCount =
                    getActiveMasterIndividualExceptionsCount(m);

                  const isWorkingToday = getMasterTodayWorkingStatus(m, today);

                  return (
                    <article
                      key={m.id}
                      className="group/masterCard overflow-hidden rounded-[18px] border border-[#eadbc9] bg-white shadow-[0_10px_30px_rgba(17,17,17,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] "
                    >
                      <div className="px-3">
                        <button
                          type="button"
                          onClick={() => {
                            setBookingsMaster(m);
                            setBookingsFilter("all");
                            setVisibleMasterBookingsCount(10);
                            setBookingsModalOpen(true);
                          }}
                          className="mt-3 block w-full text-left"
                        >
                          <div className="flex gap-3">
                            <div className="relative shrink-0">
                              <Avatar
                                name={m.name}
                                photoUrl={m.photoUrl}
                                size="lg"
                                className="h-20 w-20 rounded-[20px] border-[#eef1f5] transition-all duration-200 group-hover/masterCard:border-[#ffd6bd] group-hover/masterCard:shadow-[0_12px_30px_rgba(255,98,0,0.14)]"
                              />

                              <div
                                className={cn(
                                  "absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-black shadow-sm",
                                  isWorkingToday
                                    ? "bg-emerald-500 text-white"
                                    : "bg-red-500 text-white",
                                )}
                              >
                                {isWorkingToday ? "Працює" : "Вихідний"}
                              </div>
                            </div>

                            <div className="flex min-h-[48px] min-w-0 flex-1 flex-col justify-center">
                              <h3 className="line-clamp-2 text-[15px] font-black text-[#202020]">
                                {m.name || "Майстер"}
                              </h3>

                              <p className="mt-1 line-clamp-2 text-[12px] font-bold text-[#77716b]">
                                {m.role || "Спеціалізація не вказана"}
                              </p>
                            </div>
                          </div>

                          {m.bio ? (
                            <p className="mt-2.5 mb-2.5 min-h-[36px] line-clamp-2 text-[11px] font-medium leading-4 text-[#77716b]">
                              {m.bio}
                            </p>
                          ) : (
                            <div className="mt-2.5 mb-2.5 flex min-h-[36px] items-center justify-center px-2 text-center">
                              <p className="text-[11px] font-semibold italic text-[#b8afa5] leading-4">
                                Додайте опис майстра
                              </p>
                            </div>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-4 border-t border-[#edf0f4] bg-[#fbfcfd]">
                        <button
                          type="button"
                          onClick={() => openMasterExceptions(m)}
                          className="relative grid h-11 place-items-center text-[#657084] transition hover:!bg-[#fff7f0] hover:text-[#ff6200]"
                          title="Особливі дати"
                          aria-label="Особливі дати"
                        >
                          <CalendarDays className="h-4 w-4" />

                          {activeExceptionsCount > 0 && (
                            <span className="absolute left-[52%] top-[18%] flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ff5a00] px-1 text-[9px] font-black text-white">
                              {activeExceptionsCount}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBookingsMaster(m);
                            setBookingsFilter("all");
                            setVisibleMasterBookingsCount(10);
                            setBookingsModalOpen(true);
                          }}
                          className="grid h-11 place-items-center border-l border-[#edf0f4] text-[#657084] transition hover:!bg-[#fff7f0] hover:text-[#ff6200]"
                          title="Записи майстра"
                          aria-label="Записи майстра"
                        >
                          <CalendarCheck className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEdit(m)}
                          className="grid h-11 place-items-center border-x border-[#edf0f4] text-[#657084] transition hover:!bg-[#fff7f0] hover:text-[#ff6200]"
                          title="Редагувати"
                          aria-label="Редагувати"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirm({
                              open: true,
                              master: m,
                              loading: false,
                            })
                          }
                          className="grid h-11 place-items-center text-[#e5484d] transition hover:bg-[#fff7f7]"
                          title="Видалити"
                          aria-label="Видалити"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <p className="text-sm mt-6 mb-2 font-medium text-[#6b7280]">
                Показано {filteredMasters.length} з {total} майстрів
              </p>
            </>
          )}
        </SectionCard>

        <Modal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          title="Додати майстра"
          badge="Майстер"
          icon={Plus}
          subtitle="Заповніть фото, імʼя, спеціалізацію та короткий опис."
          size="md"
          footer={
            <div className="flex flex-row gap-2 sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => setAddOpen(false)}
                className="flex-1 sm:flex-none"
              >
                Скасувати
              </Button>
              <Button
                type="submit"
                form="add-master-form"
                variant="primary"
                disabled={adding || !String(form.name || "").trim()}
                className="flex-1 sm:flex-none"
              >
                <Check className="h-4 w-4" />
                {adding ? "Додаємо..." : "Додати"}
              </Button>
            </div>
          }
        >
          <form id="add-master-form" onSubmit={addMaster} className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar
                name={form.name || "Фото"}
                photoUrl={!photoBroken ? form.photoUrl : ""}
                size="md"
              />

              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#eadbc9] bg-white px-4 py-2.5 text-sm font-black text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0]">
                    <Camera className="h-4 w-4" />
                    Додати фото
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePickPhoto}
                    className="hidden"
                  />
                </label>

                {form.photoUrl && (
                  <Button variant="danger" onClick={removePhoto}>
                    <Trash2 className="h-4 w-4" />
                    Прибрати
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#202020]">
                Імʼя
              </label>
              <input
                name="name"
                placeholder="Напр. Наталія"
                value={form.name}
                onChange={handleChange}
                className={inputBaseClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#202020]">
                Посада / Спеціалізація
              </label>
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                className={inputBaseClass}
                placeholder="Напр. Стиліст або Барбер"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#202020]">
                Опис
              </label>
              <textarea
                name="bio"
                placeholder="Напр. 6 років досвіду, спеціалізація: фарбування, укладки..."
                value={form.bio}
                onChange={handleChange}
                rows={4}
                className={cn(inputBaseClass, "resize-none")}
              />
            </div>
          </form>
        </Modal>

        <Modal
          open={Boolean(editMaster)}
          onClose={closeEdit}
          title="Редагування майстра"
          subtitle="Онови фото, імʼя або опис для майстра."
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={closeEdit}>
                Скасувати
              </Button>
              <Button
                variant="primary"
                onClick={saveEdit}
                disabled={!String(editDraft.name || "").trim()}
              >
                <Check className="h-4 w-4" />
                Зберегти
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  name={editDraft.name || "Майстер"}
                  photoUrl={editDraft.photoUrl}
                  size="md"
                />
                <div className="absolute -bottom-2 -right-2 rounded-xl border border-[#eadbc9] bg-white p-2 shadow-sm">
                  <Camera className="h-4 w-4 text-[#ff5a00]" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#eadbc9] bg-white px-4 py-2.5 text-sm font-black text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0]">
                    <Pencil className="h-4 w-4" />
                    Змінити фото
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={editPickPhoto}
                  />
                </label>

                {editDraft.photoUrl && (
                  <Button
                    variant="danger"
                    onClick={() =>
                      setEditDraft((p) => {
                        if (p.photoUrl?.startsWith("blob:")) {
                          URL.revokeObjectURL(p.photoUrl);
                        }
                        return {
                          ...p,
                          photoUrl: "",
                          photoKey: null,
                          photoFile: null,
                        };
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Видалити
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#202020]">
                Імʼя
              </label>
              <input
                value={editDraft.name}
                onChange={(e) =>
                  setEditDraft((p) => ({ ...p, name: e.target.value }))
                }
                className={inputBaseClass}
                placeholder="Напр. Олена Коваль"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#202020]">
                Посада / Спеціалізація
              </label>
              <input
                value={editDraft.role || ""}
                onChange={(e) =>
                  setEditDraft((p) => ({ ...p, role: e.target.value }))
                }
                className={inputBaseClass}
                placeholder="Напр. Стиліст або Барбер"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#202020]">
                Опис
              </label>
              <textarea
                value={editDraft.bio}
                onChange={(e) =>
                  setEditDraft((p) => ({ ...p, bio: e.target.value }))
                }
                rows={4}
                className={cn(inputBaseClass, "resize-none")}
                placeholder="Коротко про досвід та спеціалізацію…"
              />
            </div>
          </div>
        </Modal>

        <Modal
          open={exceptionsModalOpen}
          onClose={() => {
            setExceptionsModalOpen(false);
            setExceptionsMaster(null);
            setMasterExceptions([]);
            closeScheduleSelection();
          }}
          title={`Особливі дати — ${exceptionsMaster?.name || ""}`}
          subtitle="Налаштовуйте графік майстра на місяць."
          badge="Графік"
          icon={CalendarDays}
          size="xl"
        >
          {exceptionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-[24px] border border-[#eadbc9] bg-white p-4"
                >
                  <SkeletonBlock className="h-5 w-44" />
                  <SkeletonBlock className="mt-3 h-12 w-full" />
                </div>
              ))}
            </div>
          ) : (
            (() => {
              const weekdayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
              const monthDays = buildMasterScheduleMonth(scheduleMonthDate);
              const currentMonthDays = monthDays.filter(
                (day) => day.isCurrentMonth,
              );
              const workingDays = currentMonthDays.filter(
                (day) => day.item.enabled,
              ).length;
              const daysOff = currentMonthDays.length - workingDays;
              const totalBookings = currentMonthDays.reduce(
                (sum, day) => sum + day.bookingsCount,
                0,
              );
              const selectedCount = selectedScheduleDates.length;
              const selectedDays = selectedScheduleDates
                .map((dateKey) =>
                  monthDays.find((day) => day.dateKey === dateKey),
                )
                .filter(Boolean);
              const selectedLabel =
                selectedCount === 1 && selectedDays[0]
                  ? getScheduleDayTitle(selectedDays[0].date)
                  : `${selectedCount} днів`;
              const bulkHasBreak = Boolean(
                bulkScheduleDraft.breakStart && bulkScheduleDraft.breakEnd,
              );
              const getVisibleScheduleItemForDay = (day) => {
                const shouldUseDraft =
                  scheduleEditorOpen &&
                  selectedScheduleDates.includes(day.dateKey) &&
                  day.isCurrentMonth;

                if (!shouldUseDraft) {
                  return day.item;
                }

                return {
                  ...day.item,
                  enabled: bulkScheduleDraft.enabled,
                  start: bulkScheduleDraft.enabled
                    ? bulkScheduleDraft.start
                    : day.item.start,
                  end: bulkScheduleDraft.enabled
                    ? bulkScheduleDraft.end
                    : day.item.end,
                  breakStart: bulkScheduleDraft.enabled
                    ? bulkScheduleDraft.breakStart || ""
                    : "",
                  breakEnd: bulkScheduleDraft.enabled
                    ? bulkScheduleDraft.breakEnd || ""
                    : "",
                };
              };
              return (
                <div className="relative text-[#202020] ">
                  <div className="mt-0 grid w-full gap-4 lg:grid-cols-[minmax(0,455px)_minmax(320px,450px)] lg:items-start lg:justify-center lg:gap-x-2">
                    {/* Ліва колонка: статистика + дата */}
                    <div className="min-w-0">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex h-12 items-center justify-center rounded-2xl bg-white px-3 text-center text-sm font-black text-[#77716b]">
                          {workingDays} робочих
                        </div>

                        <div className="flex h-12 items-center justify-center rounded-2xl bg-[#fff1e8] px-3 text-center text-sm font-black text-[#ff5a00]">
                          {daysOff} вихідних
                        </div>

                        <div className="flex h-12 items-center justify-center rounded-2xl bg-white px-3 text-center text-sm font-black text-[#77716b]">
                          {totalBookings} записів
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-[64px_minmax(0,1fr)_64px] items-center gap-2">
                        <button
                          type="button"
                          onClick={() => shiftScheduleMonth(-1)}
                          className="grid h-[60px] place-items-center rounded-2xl border border-[#eadbc9] bg-white text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] hover:text-[#ff6200]"
                          aria-label="Попередній місяць"
                        >
                          <ChevronRight className="h-5 w-5 rotate-180" />
                        </button>

                        <button
                          type="button"
                          onClick={resetScheduleMonthToToday}
                          className="flex h-[60px] min-w-0 items-center justify-center gap-3 rounded-2xl border border-[#eadbc9] bg-white px-4 text-center transition "
                        >
                          <CalendarDays className="h-5 w-5 shrink-0 text-[#ff6200]" />

                          <span className="truncate text-[18px] font-black capitalize tracking-[-0.03em] text-[#202020]">
                            {getMonthTitle(scheduleMonthDate)}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => shiftScheduleMonth(1)}
                          className="grid h-[60px] place-items-center rounded-2xl border border-[#eadbc9] bg-white text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] hover:text-[#ff6200]"
                          aria-label="Наступний місяць"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Права колонка: кнопки */}
                    <div
                      className={cn(
                        "grid gap-3 lg:pt-0",
                        scheduleMultiSelect
                          ? "grid-cols-2 md:grid-cols-[1.35fr_0.85fr_0.85fr] lg:grid-cols-2"
                          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-1",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => applyStudioScheduleToMonth(monthDays)}
                        disabled={bulkSaving}
                        className={cn(
                          "inline-flex min-h-[60px] w-full items-center justify-center gap-3 rounded-2xl border border-[#eadbc9] bg-white px-5 text-center text-[16px] font-black leading-tight text-[#202020] transition hover:border-[#ffd6bd] hover:bg-[#fff7f0] hover:text-[#ff6200] disabled:opacity-60",
                          scheduleMultiSelect &&
                            "col-span-2 md:col-span-1 lg:col-span-2",
                        )}
                      >
                        <Building2 className="h-5 w-5 shrink-0" />

                        <span>
                          Автоматично заповнити
                          <br />
                          за графіком студії
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!scheduleMultiSelect) {
                            setScheduleMultiSelect(true);
                            setSelectedScheduleDates([]);
                            setScheduleEditorOpen(false);
                          }
                        }}
                        className={cn(
                          "inline-flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl border px-3 text-[14px] font-black transition sm:h-[60px] sm:px-4 sm:text-[15px]",
                          scheduleMultiSelect
                            ? "border-[#ff6200] bg-[#fff1e8] text-[#ff6200]"
                            : "border-[#eadbc9] bg-white text-[#202020] hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] hover:text-[#ff6200]",
                        )}
                      >
                        <ClipboardPen className="h-4 w-4 shrink-0" />
                        <span className="truncate">Множинний вибір</span>
                      </button>

                      {scheduleMultiSelect && (
                        <button
                          type="button"
                          onClick={closeScheduleSelection}
                          className="inline-flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl border border-[#eadbc9] bg-white px-3 text-[14px] font-black text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] hover:text-[#ff6200] sm:h-[60px] sm:px-4 sm:text-[15px]"
                        >
                          <X className="h-4 w-4 shrink-0" />
                          <span className="truncate">Скасувати</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 hidden grid-cols-7 gap-3 lg:grid">
                    {weekdayLabels.map((label, index) => {
                      const weekdayKeys = currentMonthDays
                        .filter((day) => day.weekdayIndex === index)
                        .map((day) => day.dateKey);
                      const allSelected =
                        weekdayKeys.length > 0 &&
                        weekdayKeys.every((key) =>
                          selectedScheduleDates.includes(key),
                        );

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            scheduleMultiSelect &&
                            toggleScheduleWeekday(monthDays, index)
                          }
                          className={cn(
                            "flex h-9 items-center justify-center gap-2 rounded-xl text-xs font-bold text-[#77716b]",
                            scheduleMultiSelect && "hover:!bg-[#fff7f0]",
                          )}
                        >
                          {scheduleMultiSelect && (
                            <span
                              className={cn(
                                "grid h-7 w-7 place-items-center rounded-lg border transition",
allSelected
  ? "border-[#ff6200] bg-[#fff1e8] text-[#ff6200]"
  : "border-[#eadbc9] bg-white text-transparent",
                              )}
                            >
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className={cn(
                      "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden",
                      scheduleMultiSelect &&
                        selectedCount > 0 &&
                        !scheduleEditorOpen
                        ? "pb-28"
                        : "pb-4 sm:pb-5",
                    )}
                  >
{currentMonthDays.map((day) => {
  const item = getVisibleScheduleItemForDay(day);
  const isSelected = selectedScheduleDates.includes(day.dateKey);
  const isPastDay = day.isPast;
  const lines = getScheduleTimeLines(item);
                      const isDayOff = !item.enabled;
                      const isSpecialDay =
                        day.isCurrentMonth &&
                        day.item.isStudioDefault === false;
                      return (
<button
  key={day.dateKey}
  type="button"
  disabled={isPastDay}
  onClick={() => toggleScheduleDate(day.dateKey)}
className={cn(
  "flex min-h-[74px] w-full items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-left transition-all duration-200",
  isDayOff
    ? "border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00]"
    : "border-[#eadbc9] bg-white text-[#202020]",
  isSelected &&
    (scheduleMultiSelect
      ? "border-[#ff6200] bg-[#fff1e8] text-[#ff6200] shadow-[0_0_0_2px_rgba(255,98,0,0.16)]"
      : "border-[#ff6200] shadow-[0_0_0_2px_rgba(255,98,0,0.16)]"),
  isPastDay &&
    "pointer-events-none cursor-not-allowed border-[#e5e7eb] bg-[#f3f4f6] text-[#9ca3af] opacity-55 shadow-none",
)}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {scheduleMultiSelect && (
                              <span
                                className={cn(
                                  "grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition",
isSelected
  ? "border-[#ff6200] bg-[#fff1e8] text-[#ff6200]"
  : "border-[#eadbc9] bg-white text-transparent",
                                )}
                              >
                                <Check className="h-5 w-5" />
                              </span>
                            )}

                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "flex items-center gap-1.5 text-xs font-black capitalize",
                                  isDayOff
                                    ? "text-[#ff5a00]"
                                    : "text-[#77716b]",
                                )}
                              >
                                <CalendarDays className="h-3.5 w-3.5" />
                                {day.weekday}
                              </p>
                              <p className="mt-1 text-sm font-black">
                                {day.dayNumber}{" "}
                                {new Intl.DateTimeFormat("uk-UA", {
                                  month: "long",
                                }).format(day.date)}
                              </p>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "shrink-0 text-right text-xs font-black leading-5",
                              isDayOff ? "text-[#ff5a00]" : "text-[#202020]",
                            )}
                          >
                            {lines.map((line, lineIndex) => {
                              const LineIcon = isDayOff
                                ? XCircle
                                : lineIndex === 1
                                  ? Coffee
                                  : Clock;

                              return (
                                <p
                                  key={line}
                                  className="flex items-center justify-end gap-1.5"
                                >
                                  <LineIcon className="h-3.5 w-3.5" />
                                  {line}
                                </p>
                              );
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>

<div className="mt-3 hidden grid-cols-7 gap-1 lg:grid">
  {monthDays.map((day) => {
    const item = getVisibleScheduleItemForDay(day);
    const isSelected = selectedScheduleDates.includes(
      day.dateKey,
    );
    const lines = getScheduleTimeLines(item);
    const isDayOff = !item.enabled;
    const isSpecialDay = item.isStudioDefault === false;
    const isPastDay = day.isPast;

    return (
      <button
        key={day.dateKey}
        type="button"
        disabled={!day.isCurrentMonth || isPastDay}
        onClick={() =>
          day.isCurrentMonth &&
          !isPastDay &&
          toggleScheduleDate(day.dateKey)
        }
        className={cn(
          "relative flex min-h-[118px] flex-col items-center justify-start overflow-hidden rounded-[12px] border p-3 text-center transition-all duration-200",

          day.isCurrentMonth && !isPastDay
            ? "hover:-translate-y-0.5 hover:border-[#ffb784]"
            : "cursor-default border-[#eadbc9] bg-transparent opacity-45",

          day.isCurrentMonth &&
            !isPastDay &&
            (isDayOff
              ? "border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00]"
              : "border-[#eadbc9] bg-white text-[#202020]"),

          isSpecialDay &&
            !isPastDay &&
            "border-[#ff6200] bg-[#fff7f0] shadow-[0_0_0_2px_rgba(255,98,0,0.12)]",

          isSelected &&
            !isPastDay &&
            (scheduleMultiSelect
              ? "border-[#ff6200] bg-[#fff1e8] text-[#ff6200] shadow-[0_0_0_2px_rgba(255,98,0,0.16)]"
              : "border-[#ff6200] bg-[#fff7f0] shadow-[0_0_0_2px_rgba(255,98,0,0.18)]"),

          isPastDay &&
            "pointer-events-none cursor-not-allowed border-[#e5e7eb] bg-[#f3f4f6] text-[#9ca3af] opacity-55 shadow-none",
        )}
      >
                        <span
  className={cn(
    "grid h-6 min-w-6 place-items-center rounded-full px-1 text-sm font-black",
    day.isToday && !isPastDay && "bg-[#ff6200] text-white",
    !day.isToday &&
      !isPastDay &&
      (isDayOff
        ? "text-[#ff5a00]"
        : "text-[#202020]"),
    !day.isCurrentMonth && "text-[#aaa19a]",
    isPastDay && "text-[#9ca3af] line-through",
  )}
>
  {day.dayNumber}
</span>

                          {isSpecialDay && (
                            <span className="mt-1 inline-flex items-center justify-center rounded-full bg-[#ff6200] px-1.5 py-0.5 text-[9px] font-black uppercase leading-none tracking-wide text-white shadow-sm">
                              Індивідуально
                            </span>
                          )}

                          {!isSpecialDay && (
                            <span className="mt-2 h-px w-14 bg-[#eadbc9]" />
                          )}

                          <div className="mt-auto space-y-1 pb-2 text-[12px] font-black leading-tight">
                            {lines.map((line, lineIndex) => {
                              const LineIcon = isDayOff
                                ? XCircle
                                : lineIndex === 1
                                  ? Coffee
                                  : Clock;

                              return (
                                <p
                                  key={line}
                                  className="flex items-center justify-center gap-1.5"
                                >
                                  <LineIcon className="h-3.5 w-3.5" />
                                  {line}
                                </p>
                              );
                            })}
                          </div>

                          {day.bookingsCount > 0 && (
                            <span className="absolute right-2 top-2 rounded-full bg-[#41a85f] px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                              {day.bookingsCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {scheduleMultiSelect &&
                    selectedCount > 0 &&
                    !scheduleEditorOpen && (
                      <div className="fixed inset-x-0 bottom-0 z-[10060] border-t border-[#eadbc9] bg-[#fbfaf8]/95 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_34px_rgba(15,23,42,0.12)] backdrop-blur sm:sticky sm:inset-x-auto sm:bottom-0 sm:mt-5 sm:rounded-[18px] sm:border sm:bg-white/95 sm:p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#41a85f] text-white">
                              <Check className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-[#202020]">
                                {"\u0412\u0438\u0431\u0440\u0430\u043d\u043e"}{" "}
                                {selectedCount} {"\u0434\u043d\u0456\u0432"}
                              </p>
                              <p className="truncate text-xs font-bold text-[#77716b]">
                                {selectedLabel}
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="primary"
                            onClick={openScheduleEditorForSelectedDates}
                            className="h-12 w-full sm:w-auto sm:px-5"
                          >
                            <Clock className="h-4 w-4" />
                            {
                              "\u0412\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u0438 \u0433\u0440\u0430\u0444\u0456\u043a"
                            }
                            <span className="hidden min-[390px]:inline">
                              {
                                "\u043d\u0430 \u0432\u0438\u0431\u0440\u0430\u043d\u0456 \u0434\u0430\u0442\u0438"
                              }
                            </span>
                          </Button>
                        </div>
                      </div>
                    )}

                  {scheduleEditorOpen && selectedCount > 0 && (
                    <Modal
                      open={scheduleEditorOpen && selectedCount > 0}
                      onClose={closeScheduleEditorWindow}
                      title={
                        selectedCount === 1
                          ? "Налаштування дня"
                          : `Вибрано ${selectedCount} днів`
                      }
                      subtitle={selectedLabel}
                      badge="Графік"
                      icon={Clock}
                      size="lg"
                      zIndexClass="z-[10020]"
                      footer={
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="primary"
                            onClick={() =>
                              applyBulkSchedule(bulkScheduleDraft.enabled)
                            }
                            disabled={bulkSaving}
                            className="h-[54px] w-full"
                          >
                            <Save className="h-4 w-4" />
                            {bulkSaving ? "Зберігаємо" : "Зберегти"}
                          </Button>

                          <Button
                            variant="secondary"
                            onClick={closeScheduleEditorWindow}
                            disabled={bulkSaving}
                            className="h-[54px] w-full"
                          >
                            <X className="h-4 w-4" />
                            Скасувати
                          </Button>
                        </div>
                      }
                    >
                      <div className="space-y-4">
                        <div className="flex flex-1 flex-col gap-3 sm:flex-none sm:pt-3 lg:grid  lg:items-end">
                          <div className="flex flex-col gap-3">
                            <div
                              className={cn(
                                "grid grid-cols-2 gap-2 sm:items-end",
                                bulkScheduleDraft.enabled &&
                                  "sm:grid-cols-[1.35fr_0.82fr_0.82fr]",
                              )}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setBulkScheduleDraft((prev) => ({
                                    ...prev,
                                    enabled: !prev.enabled,
                                  }))
                                }
                                className="col-span-2 flex h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-[#eadbc9] bg-white px-4 text-sm font-black text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] sm:col-span-1"
                              >
                                <span className="flex items-center gap-2">
                                  {bulkScheduleDraft.enabled ? (
                                    <CalendarCheck className="h-4 w-4 shrink-0 text-[#41a85f]" />
                                  ) : (
                                    <XCircle className="h-4 w-4 shrink-0 text-[#8d8177]" />
                                  )}

                                  <span>
                                    {bulkScheduleDraft.enabled
                                      ? "Робочий"
                                      : "Вихідний"}
                                  </span>
                                </span>

                                <span
                                  className={cn(
                                    "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-300",
                                    bulkScheduleDraft.enabled
                                      ? "bg-[#41a85f]"
                                      : "bg-[#c9c2b9]",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300",
                                      bulkScheduleDraft.enabled
                                        ? "translate-x-6"
                                        : "translate-x-1",
                                    )}
                                  />
                                </span>
                              </button>

                              {bulkScheduleDraft.enabled &&
                                [
                                  ["start", "Початок", Clock],
                                  ["end", "Кінець", Timer],
                                ].map(([field, label, Icon]) => (
                                  <div key={field} className="min-w-0">
                                    <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#77716b]">
                                      <Icon className="h-3.5 w-3.5 text-[#ff6200]" />
                                      {label}
                                    </label>

                                    <div className="flex h-[52px] items-center overflow-hidden rounded-xl border border-[#eadbc9] bg-white px-2 transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0]">
                                      <TimeSelect
                                        value={bulkScheduleDraft[field]}
                                        label={label}
                                        dayLabel={selectedLabel}
                                        placeholder="--:--"
                                        onChange={(value) =>
                                          updateBulkScheduleField(field, value)
                                        }
                                        onCommit={(value) =>
                                          updateBulkScheduleField(field, value)
                                        }
                                        className="h-full justify-center text-base"
                                      />
                                    </div>
                                  </div>
                                ))}
                            </div>

                            {bulkScheduleDraft.enabled && (
                              <div
                                className={cn(
                                  "grid grid-cols-2 gap-2 sm:items-end",
                                  bulkHasBreak &&
                                    "sm:grid-cols-[1.35fr_0.82fr_0.82fr]",
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateBulkScheduleBreak(!bulkHasBreak)
                                  }
                                  className="col-span-2 flex h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-[#eadbc9] bg-white px-4 text-sm font-black text-[#202020] transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] sm:col-span-1"
                                >
                                  <span className="flex items-center gap-2">
                                    {bulkHasBreak ? (
                                      <Coffee className="h-4 w-4 text-[#41a85f]" />
                                    ) : (
                                      <Coffee className="h-4 w-4 text-[#8d8177]" />
                                    )}

                                    {bulkHasBreak ? "Перерва" : "Без перерви"}
                                  </span>

                                  <span
                                    className={cn(
                                      "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-300",
                                      bulkHasBreak
                                        ? "bg-[#41a85f]"
                                        : "bg-[#c9c2b9]",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300",
                                        bulkHasBreak
                                          ? "translate-x-6"
                                          : "translate-x-1",
                                      )}
                                    />
                                  </span>
                                </button>

                                {bulkHasBreak &&
                                  [
                                    ["breakStart", "Перерва з", Coffee],
                                    ["breakEnd", "Перерва до", Coffee],
                                  ].map(([field, label, Icon]) => (
                                    <div key={field} className="min-w-0">
                                      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#77716b]">
                                        <Icon className="h-3.5 w-3.5 text-[#ff6200]" />
                                        {label}
                                      </label>

                                      <div className="flex h-[52px] items-center overflow-hidden rounded-xl border border-[#eadbc9] bg-white px-2 transition hover:!border-[#ffd6bd] hover:!bg-[#fff7f0]">
                                        <TimeSelect
                                          value={bulkScheduleDraft[field]}
                                          label={label}
                                          dayLabel={selectedLabel}
                                          placeholder="--:--"
                                          onChange={(value) =>
                                            updateBulkScheduleField(
                                              field,
                                              value,
                                            )
                                          }
                                          onCommit={(value) =>
                                            updateBulkScheduleField(
                                              field,
                                              value,
                                            )
                                          }
                                          className="h-full justify-center text-base"
                                        />
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Modal>
                  )}
                </div>
              );
            })()
          )}
        </Modal>
      </div>
      <Modal
        open={bookingsModalOpen}
        onClose={() => {
          setBookingsModalOpen(false);
          setBookingsMaster(null);
          setBookingsFilter("today");
          setVisibleMasterBookingsCount(10);
        }}
        title={`Записи — ${bookingsMaster?.name || ""}`}
        badge="Записи"
        icon={CalendarCheck}
        subtitle={`Усі записи вибраного майстра: ${filteredMasterBookings.length}`}
        size="md"
      >
        {bookingsQuery.isLoading ? (
          <div className="rounded-[24px] border border-[#eadbc9] bg-white p-5 text-center text-sm font-bold text-[#77716b]">
            Завантажуємо записи...
          </div>
        ) : masterBookings.length === 0 ? (
          <div className="rounded-[24px] border-2 border-dashed border-[#ffd6bd] bg-[#fff7f0] p-8 text-center">
            <CalendarCheck className="mx-auto h-10 w-10 text-[#ff6200]" />

            <p className="mt-3 text-sm font-black text-[#202020]">
              Записів поки немає
            </p>

            <p className="mt-1 text-xs font-medium text-[#77716b]">
              Для цього майстра ще немає записів.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                ["all", "Усі"],
                ["today", "Сьогодні"],
                ["week", "Тиждень"],
                ["month", "Місяць"],
                ["completed", "Завершені"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setBookingsFilter(value);
                    setVisibleMasterBookingsCount(10);
                  }}
                  className={cn(
                    "h-9 rounded-xl border px-2 text-[11px] font-black transition-all duration-300",
                    bookingsFilter === value
                      ? "border-[#ff6200] bg-[#ff6200] text-white "
                      : "border-[#eadbc9] bg-white text-[#77716b] hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] hover:!text-[#202020] active:scale-[0.98]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {sortedMasterBookings.length === 0 ? (
              <div className="rounded-[24px] border border-[#eadbc9] bg-white p-5 text-center text-sm font-bold text-[#77716b]">
                За вибраний період записів немає.
              </div>
            ) : (
              <div className="space-y-3">
                <ul className="space-y-3">
                  {visibleMasterBookings.map((booking) => (
                    <MasterBookingCard
                      key={booking.id}
                      booking={booking}
                      master={bookingsMaster}
                      nowTs={nowTs}
                      onClick={() => setDetailsBookingId(booking.id)}
                    />
                  ))}
                </ul>

                <div className="flex flex-col items-center gap-2 pt-1">
                  <p className="text-xs font-bold text-[#77716b]">
                    Показано {visibleMasterBookings.length} з{" "}
                    {sortedMasterBookings.length}
                  </p>

                  {hasMoreMasterBookings && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleMasterBookingsCount((prev) => prev + 10)
                      }
                      className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-[#eadbc9] bg-white px-4 text-sm font-black text-[#202020] transition-all duration-200 hover:!border-[#ffd6bd] hover:!bg-[#fff7f0] active:scale-[0.98]"
                    >
                      Показати ще
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
      <Modal
        open={deleteConfirm.open}
        onClose={() =>
          !deleteConfirm.loading &&
          setDeleteConfirm({ open: false, master: null, loading: false })
        }
        title="Видалити майстра?"
        badge="Підтвердження"
        icon={Trash2}
        size="sm"
        footer={
          <div className="flex flex-row gap-2 sm:justify-end">
            <Button
              variant="secondary"
              disabled={deleteConfirm.loading}
              onClick={() =>
                setDeleteConfirm({ open: false, master: null, loading: false })
              }
              className="flex-1 sm:flex-none"
            >
              Скасувати
            </Button>

            <Button
              variant="danger"
              disabled={deleteConfirm.loading}
              onClick={confirmDeleteMaster}
              className="flex-1 sm:flex-none"
            >
              <Trash2 className="h-4 w-4" />
              {deleteConfirm.loading ? "Видаляємо..." : "Видалити"}
            </Button>
          </div>
        }
      >
        <div className="py-4 text-center">
          <div className="mb-5 flex items-center justify-center gap-4">
            <Avatar
              name={deleteConfirm.master?.name || "Майстер"}
              photoUrl={deleteConfirm.master?.photoUrl}
              size="md"
              className="h-20 w-20 rounded-full border-4 border-white shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
            />

            <div className="flex h-10 w-10 items-center justify-center rounded-full">
              <ArrowRight className="h-5 w-5 text-[#ff6200]" />
            </div>

            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#fecaca] bg-[#fff1f1] shadow-[0_12px_32px_rgba(229,72,77,0.12)]">
              <Trash2 className="h-9 w-9 text-[#e5484d]" />
            </div>
          </div>

          <h4 className="break-words text-lg font-black leading-6 text-[#202020]">
            Майстер
            <span className="my-1 block break-words text-[28px] font-black leading-[1.3] text-[#ff6200] sm:text-[32px]">
              {deleteConfirm.master?.name || "Без імені"}
            </span>
            буде видалений зі списку майстрів.
          </h4>
        </div>
      </Modal>
      {cropModal.open && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#202020]/45 px-3 pb-3 backdrop-blur-[6px] sm:items-center sm:p-6">
          <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-[#f0e2d3] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
            <div className="px-5 py-5 text-center">
              <h3 className="text-[24px] font-black tracking-[-0.04em] text-[#202020]">
                Обрізати фото
              </h3>

              <p className="mt-2 text-sm font-medium text-[#77716b]">
                Виберіть область, яка буде видима у профілі майстра.
              </p>
            </div>

            <div className="mx-5 h-[340px] overflow-hidden rounded-[26px] bg-black">
              <div className="relative h-full w-full">
                <Cropper
                  image={cropModal.imageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) => {
                    setCroppedAreaPixels(croppedPixels);
                  }}
                />
              </div>
            </div>

            <div className="px-5 py-4">
              <label className="mb-2 block text-sm font-black text-[#202020]">
                Масштаб
              </label>

              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex gap-2 border-t border-[#f0e7da] bg-[#fbfaf8] px-5 py-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  if (cropModal.imageUrl)
                    URL.revokeObjectURL(cropModal.imageUrl);

                  setCropModal({
                    open: false,
                    imageUrl: "",
                    file: null,
                    target: "",
                  });

                  setCroppedAreaPixels(null);
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                }}
              >
                Скасувати
              </Button>

              <Button
                variant="primary"
                className="flex-1"
                onClick={confirmCrop}
              >
                <Check className="h-4 w-4" />
                Застосувати
              </Button>
            </div>
          </div>
        </div>
      )}
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Експорт майстрів"
        badge="Експорт"
        icon={FileSpreadsheet}
        subtitle="Оберіть, які дані майстрів потрібно додати в Excel-файл."
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
                handleExportMasters();
                setExportOpen(false);
              }}
            >
              <Download className="h-4 w-4" />
              Експорт
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["name", "Імʼя"],
            ["role", "Спеціалізація"],
            ["status", "Статус сьогодні"],
            ["exceptionsCount", "Особливі дати"],
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
                className="h-4 w-4 rounded border-[#eadbc9] text-[#ff5a00] focus:ring-[#ff5a00]"
              />
            </label>
          ))}
        </div>
      </Modal>

      <Modal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Інформація про майстрів"
        badge="Інформація"
        icon={CircleAlert}
        subtitle="Ця сторінка відповідає за майстрів студії, їхні профілі, записи та особливі дати."
        size="lg"
      >
        <div className="space-y-5 text-sm font-medium leading-6 text-[#77716b]">
          <div>
            <h4 className="text-base font-black text-[#202020]">
              Можливості сторінки
            </h4>

            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Додавання нових майстрів.</li>
              <li>Редагування фото, імені, спеціалізації та опису.</li>
              <li>Перегляд записів конкретного майстра.</li>
              <li>Додавання особливих дат або вихідних.</li>
              <li>Видалення майстрів із підтвердженням.</li>
              <li>Експорт списку майстрів у Excel.</li>
            </ul>
          </div>
        </div>
      </Modal>
<Modal
  open={scheduleErrorModal.open}
  onClose={closeScheduleError}
  title={scheduleErrorModal.title}
  badge="Перевірка"
  icon={CircleAlert}
  subtitle="Графік майстра має бути в межах графіка студії"
  size="sm"
  zIndexClass="z-[10050]"
  mobileCompact
        footer={
          <div className="flex justify-end">
            <Button variant="primary" onClick={closeScheduleError}>
              Зрозуміло
            </Button>
          </div>
        }
      >
        <div className="rounded-[24px] border border-[#ffd6bd] bg-[#fff7f0] p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff1e8] text-[#ff6200]">
              <CircleAlert className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-black leading-5 text-[#202020]">
                {scheduleErrorModal.message}
              </p>

              {scheduleErrorModal.hint && (
                <p className="mt-2 text-xs font-semibold leading-5 text-[#77716b]">
                  {scheduleErrorModal.hint}
                </p>
              )}
            </div>
          </div>
        </div>
      </Modal>
      {selectedMasterBooking &&
        detailsBookingId != null &&
        (() => {
          const booking = selectedMasterBooking;

          const isCanceled = booking.status === "canceled";
          const isConfirmed = booking.status === "confirmed";
          const dt = getBookingDateTime(booking);
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
                    label: getCanceledBookingLabel(booking),
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
                    iconColor: "text-[#ffb020]",
                    pillText: "text-[#ffb020]",
                    accent: "text-[#ffb020]",
                  };

          const StatusIcon = statusMeta.Icon;

          const clientName = getBookingClientName(booking);
          const phone = getBookingClientPhone(booking);
          const service = getBookingServiceName(booking);
          const masterName = getBookingMasterName(booking, bookingsMaster);

          const time = parseTimeToHHMM(booking.time) || booking.time || "—";

          const price =
            booking.price ??
            booking.servicePrice ??
            booking.totalPrice ??
            booking.service?.price ??
            null;

          const duration =
            booking.duration ??
            booking.serviceDuration ??
            booking.durationMinutes ??
            booking.service?.duration ??
            null;

          const dateLabel = formatDateFullUA(booking?.date);

          const clientPhoto = getBookingClientPhoto(booking);
          const masterPhoto = getBookingMasterPhoto(booking, bookingsMaster);

          const closeDetails = () => {
            closeBookingDetails();
          };

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
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#202020] shadow-[0_8px_24px_rgba(27,27,27,0.10)] transition hover:!bg-[#fff7f0] active:scale-[0.98]"
                      aria-label="Закрити"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="relative mt-8 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[13px] font-black shadow-[0_8px_24px_rgba(27,27,27,0.08)] backdrop-blur">
                      <StatusIcon
                        className={cn("h-4 w-4", statusMeta.iconColor)}
                      />

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
                      <Banknote
                        className={cn("h-4 w-4", statusMeta.iconColor)}
                      />

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
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#fff1e8] text-[#ff6200]">
                                <UserRound className="h-5 w-5" />
                              </div>
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
                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#eadfce] bg-white text-[#77716b] transition-all duration-200 hover:!bg-[#fff7f0] hover:text-[#202020] active:scale-[0.95]"
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
                                <UserRound className="h-5 w-5" />
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

                      {(booking.comment || booking.note) && (
                        <div className="rounded-[24px] border border-[#eadfce] bg-white p-4 sm:col-span-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#aaa19a]">
                            Коментар
                          </p>

                          <p className="mt-2 text-sm font-semibold leading-6 text-[#202020]">
                            {booking.comment || booking.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

{!isArchived && !isCanceled && (
  <div className="absolute inset-x-0 bottom-0 border-[#eadfce] bg-white/92 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-6 sm:pb-5">
    <div
      className={cn(
        "grid gap-3",
        !isConfirmed ? "sm:grid-cols-2" : "sm:grid-cols-1",
      )}
    >
      {!isConfirmed && (
        <button
          type="button"
          disabled={masterBookingActionLoading}
          onClick={() => handleConfirmMasterBooking(booking)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[22px] bg-[var(--color-primary-buttom)] px-4 text-sm font-black text-white transition-all duration-200 hover:bg-[#4a4a4a] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          <CheckCheck className="h-4 w-4" />
          {masterBookingActionLoading ? "Підтверджуємо..." : "Підтвердити"}
        </button>
      )}

      <button
        type="button"
        disabled={masterBookingActionLoading}
        onClick={() => setCancelMasterBookingConfirm(booking)}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-[22px] border border-[#fecaca] bg-[#fff5f5] px-4 text-sm font-black text-[#ef4444] transition-all duration-200 hover:border-[#fca5a5] hover:bg-[#ffecec] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
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
  open={cancelMasterBookingConfirm != null}
  onClose={() => setCancelMasterBookingConfirm(null)}
  title="Скасувати запис?"
  badge="Підтвердження"
  icon={XCircle}
  size="sm"
  zIndexClass="z-[10060]"
  mobileCompact
  footer={
    <div className="flex justify-end gap-2">
      <Button
        variant="secondary"
        onClick={() => setCancelMasterBookingConfirm(null)}
        disabled={masterBookingActionLoading}
        className="w-full sm:w-auto"
      >
        Назад
      </Button>

      <button
        type="button"
        disabled={masterBookingActionLoading}
        onClick={() => handleCancelMasterBooking(cancelMasterBookingConfirm)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ef4444] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#dc2626] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
      >
        <XCircle className="h-4 w-4" />
        {masterBookingActionLoading ? "Скасовуємо..." : "Так, скасувати"}
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
          <CircleAlert className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-[#202020]">
            Після скасування
          </p>

          <p className="mt-1 text-xs leading-5 text-[#77716b]">
            У записах майстра цей запис залишиться в історії зі статусом
            “Скасовано вами”.
          </p>
        </div>
      </div>
    </div>
  </div>
</Modal>
    </div>
  );
}
