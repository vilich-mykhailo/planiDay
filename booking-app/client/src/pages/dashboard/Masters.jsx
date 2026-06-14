//Masters.jsx
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import XLSX from "xlsx-js-style";
import Cropper from "react-easy-crop";
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
  ChevronDown,
  ChevronUp,
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
  Banknote,
  ChevronRight,
  ArrowDownToLine,

} from "lucide-react";
import DatePicker from "../../components/ui/DatePicker";
import TimeSelect from "../../components/TimeSelect";
import { useStudio } from "../../context/studio/useStudio";

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
  if (/^https?:\/\//i.test(s)) return s;
  return PUBLIC ? `${PUBLIC}/${s}` : s;
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
  return item.start < item.end;
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
      "bg-[var(--color-primary-buttom)] text-white hover:bg-[#4a4a4a]",
    secondary:
      "bg-white border border-[#eadbc9] text-[#202020] hover:bg-[#fff7f0] hover:border-[#ffd6bd]",
    danger:
      "border border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00] hover:border-[#ff5a00] hover:bg-[#ffe5d4]",
    accent:
      "border border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00] shadow-sm hover:bg-[#ff5a00] hover:text-white",
    ghost: "text-[#202020] hover:bg-[#fff7f0]",
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
    primary:
      "bg-[#ff5a00] text-white hover:bg-[#ef4f00]",
    secondary:
      "bg-white border border-[#eadbc9] text-[#202020] hover:bg-[#fff7f0] hover:border-[#ffd6bd]",
    danger:
      "border border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00] hover:border-[#ff5a00] hover:bg-[#ffe5d4]",
    accent:
      "border border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00] shadow-sm hover:bg-[#ff5a00] hover:text-white",
    ghost: "text-[#202020] hover:bg-[#fff7f0]",
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
  className="fixed inset-0 z-[9999] flex items-stretch justify-center bg-[#202020]/45 p-0 backdrop-blur-[6px] sm:items-center sm:p-6"
>
     <div
  className={cn(
    "flex h-dvh w-full flex-col overflow-hidden rounded-none border-0 bg-[#f7f5f1] shadow-[0_30px_90px_rgba(15,23,42,0.24)]",
    "sm:h-auto sm:max-h-[calc(100dvh-48px)] sm:rounded-[30px] sm:border sm:border-[#f0e2d3]",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
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

function Avatar({ name, photoUrl, size = "md", className = "" }) {
  const initials = initialsFromName(name);

  const sizes = {
    sm: "h-12 w-12 rounded-2xl text-xs",
    md: "h-20 w-20 rounded-[22px] text-sm",
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border-2 border-white bg-gradient-to-br from-[#fff1e8] via-white to-[#f2eee8] shadow-[0_10px_26px_rgba(17,17,17,0.10)]",
        sizes[size],
        className,
      )}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : initials ? (
       <span
  className={cn(
    "font-black tracking-[-0.08em] text-[#ff5a00]",
    size === "sm" && "text-xl",
    size === "md" && "text-4xl",
    size === "lg" && "text-6xl",
  )}
>
  {initials}
</span>
      ) : (
        <Camera className="h-6 w-6 text-[#ff5a00]" />
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
    "hover:-translate-y-0.5 hover:border-[#ffd6bd] hover:bg-[#fff7f0]",
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

function isPastExceptionDate(dateStr) {
  if (!dateStr) return false;

  const today = new Date();
  const todayLocal = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const [y, m, d] = String(dateStr).split("-").map(Number);
  const target = new Date(y, (m || 1) - 1, d || 1);

  return target < todayLocal;
}

async function deleteExpiredMasterExceptions(masterId, list) {
  const token = localStorage.getItem("token");

  const expired = (list || []).filter(
    (item) => item?.id && isPastExceptionDate(item.date),
  );

  if (!expired.length) return list || [];

  await Promise.allSettled(
    expired.map((item) =>
      fetch(
        `${import.meta.env.VITE_API_URL}/studio/masters/${masterId}/schedule/exceptions/${item.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
    ),
  );

  return (list || []).filter((item) => !isPastExceptionDate(item.date));
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
  const [exceptionsLoading, setExceptionsLoading] = useState(false);
  const [expandedExceptions, setExpandedExceptions] = useState({});
  const [bookingsMaster, setBookingsMaster] = useState(null);
  const [bookingsFilter, setBookingsFilter] = useState("all");
const [bookingsModalOpen, setBookingsModalOpen] = useState(false);
const [visibleMasterBookingsCount, setVisibleMasterBookingsCount] = useState(10);
const [detailsBookingId, setDetailsBookingId] = useState(null);
const [copiedPhone, setCopiedPhone] = useState(false);
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
  const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));

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

  const masters = useMemo(
  () => mastersQuery.data || [],
  [mastersQuery.data],
);
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

  function createEmptyException() {
    return {
      id: "",
      date: dateToInputValue(),
      enabled: true,
      start: "08:00",
      end: "18:00",
      isNew: true,
    };
  }

  function sortExceptions(list) {
    return [...list].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }

  function getExceptionKey(item, index) {
    return item.id || `${item.date || "new"}-${index}`;
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
    setExpandedExceptions({});

    try {
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
        throw new Error(data?.message || "Не вдалося завантажити особливі дати");
      }

      const rawExceptions = Array.isArray(data?.exceptions)
        ? data.exceptions.map((item) => ({
            ...item,
            date: String(item?.date || "").slice(0, 10),
            isNew: false,
          }))
        : [];

      const cleanedExceptions = await deleteExpiredMasterExceptions(
        master.id,
        rawExceptions,
      );

      setMasterExceptions(sortExceptions(cleanedExceptions));
    } catch (error) {
      alert(error?.message || "Помилка завантаження");
    } finally {
      setExceptionsLoading(false);
    }
  }

  function addExceptionRow() {
    const newItem = createEmptyException();

    setMasterExceptions((prev) => {
      const next = sortExceptions([...prev, newItem]);
      const newIndex = next.findIndex((item) => item === newItem);
      const key = getExceptionKey(newItem, newIndex);

      setTimeout(() => {
        setExpandedExceptions((prevExpanded) => ({
          ...prevExpanded,
          [key]: true,
        }));
      }, 0);

      return next;
    });
  }

  function updateException(index, field, value) {
    setMasterExceptions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  async function saveException(item, index) {
    if (!exceptionsMaster?.id) return;

    const token = localStorage.getItem("token");

    if (!item.date) {
      alert("Оберіть дату");
      return;
    }

    const body = {
      date: item.date,
      enabled: item.enabled,
      start: item.enabled ? item.start : null,
      end: item.enabled ? item.end : null,
    };

    const url = item.id
      ? `${import.meta.env.VITE_API_URL}/studio/masters/${exceptionsMaster.id}/schedule/exceptions/${item.id}`
      : `${import.meta.env.VITE_API_URL}/studio/masters/${exceptionsMaster.id}/schedule/exceptions`;

    const method = item.id ? "PATCH" : "POST";

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
      alert(data?.message || "Не вдалося зберегти");
      return;
    }

    setMasterExceptions((prev) => {
      const next = sortExceptions(
        prev.map((row, i) =>
          i === index
            ? {
                ...data.exception,
                isNew: false,
              }
            : row,
        ),
      );

      const savedIndex = next.findIndex(
        (row) =>
          row.id === data.exception?.id ||
          (!row.id && row.date === data.exception?.date),
      );

      const nextKey =
        savedIndex >= 0
          ? getExceptionKey(next[savedIndex], savedIndex)
          : getExceptionKey(data.exception, index);

      setTimeout(() => {
        setExpandedExceptions((prevExpanded) => {
          const updated = { ...prevExpanded };
          Object.keys(updated).forEach((k) => {
            if (k.includes(item.date || "")) delete updated[k];
          });
          updated[nextKey] = false;
          return updated;
        });
      }, 0);

      return next;
    });

await queryClient.invalidateQueries({
  queryKey: ["masters", studioId],
  exact: true,
});

await mastersQuery.refetch();
  }


  async function removeException(item, index) {
    if (!exceptionsMaster?.id) return;

if (!item.id) {
  setMasterExceptions((prev) => prev.filter((_, i) => i !== index));

  await queryClient.invalidateQueries({
    queryKey: ["masters", studioId],
    exact: true,
  });

  await mastersQuery.refetch();

  return;
}

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
      alert(data?.message || "Не вдалося видалити");
      return;
    }

    setMasterExceptions((prev) => prev.filter((_, i) => i !== index));
    await queryClient.invalidateQueries({
  queryKey: ["masters", studioId],
  exact: true,
});

await mastersQuery.refetch();
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
    "hover:bg-[#fff7f0] hover:border-[#ffd6bd] " +
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
console.log(
  "EXCEPTIONS",
  sortedMasters[0]?.scheduleExceptions
);
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
    if (exportFields.status) row["Статус сьогодні"] = isWorkingToday ? "Працює" : "Вихідний";

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

  row["Особливі дати"] = exceptions.length ? exceptions.join("\n") : "-";
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
    className="grid !px-0 h-10 w-10 place-items-center rounded-full text-[#ff6200] transition-all  hover:bg-[#fff7f0] active:scale-95 "
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
          Керуйте майстрами, редагуйте профілі та додавайте особливі дати.
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
    <span className="font-black text-[#202020]">
      "{query}"
    </span>{" "}
    не знайдено жодного майстра.
  </p>
</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
{filteredMasters.map((m) => {
  const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const todayException = m.scheduleExceptions?.find(
  (e) => String(e.date || "").slice(0, 10) === today,
);
const activeExceptionsCount =
  (m.scheduleExceptions || []).filter((e) => {
    const date = String(e.date || "").slice(0, 10);
    return date >= today;
  }).length;
  const isWorkingToday =
    !todayException || todayException.enabled;

  return (
<article
  key={m.id}
  className="group/masterCard overflow-hidden rounded-[18px] border border-[#eadbc9] bg-white shadow-[0_10px_30px_rgba(17,17,17,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffd6bd] hover:bg-[#fff7f0] "
>
                    <div className="px-3">
<button
  type="button"
  onClick={() => {
    setBookingsMaster(m);
    setBookingsFilter("today");
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
  className="relative grid h-11 place-items-center text-[#657084] transition hover:bg-[#fff7f0] hover:text-[#ff6200]"
  title="Особливі дні"
  aria-label="Особливі дні"
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
  setBookingsFilter("today");
  setVisibleMasterBookingsCount(10);
  setBookingsModalOpen(true);
}}
  className="grid h-11 place-items-center border-l border-[#edf0f4] text-[#657084] transition hover:bg-[#fff7f0] hover:text-[#ff6200]"
  title="Записи майстра"
  aria-label="Записи майстра"
>
  <CalendarCheck className="h-4 w-4" />
</button>

                      <button
                        type="button"
                        onClick={() => openEdit(m)}
                        className="grid h-11 place-items-center border-x border-[#edf0f4] text-[#657084] transition hover:bg-[#fff7f0] hover:text-[#ff6200]"
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
                  <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#eadbc9] bg-white px-4 py-2.5 text-sm font-black text-[#202020] transition hover:border-[#ffd6bd] hover:bg-[#fff7f0]">
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
                  <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#eadbc9] bg-white px-4 py-2.5 text-sm font-black text-[#202020] transition hover:border-[#ffd6bd] hover:bg-[#fff7f0]">
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
            setExpandedExceptions({});
          }}
          title={`Особливі дати — ${exceptionsMaster?.name || ""}`}
          subtitle="Керуйте індивідуальним графіком майстра на конкретні дати."
          size="md"
          footer={
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={addExceptionRow}
                className="w-full justify-center whitespace-nowrap sm:w-auto sm:shrink-0"
              >
                <CalendarDays className="h-4 w-4" />
                Додати дату
              </Button>
            </div>
          }
        >
          {exceptionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-[24px] border border-[#eadbc9] bg-white p-4"
                >
                  <SkeletonBlock className="h-5 w-44" />
                  <SkeletonBlock className="mt-2 h-4 w-36" />
                </div>
              ))}
            </div>
          ) : masterExceptions.length === 0 ? (
<div className="rounded-[28px] border-2 border-dashed border-[#ffd6bd] bg-[#fffaf6] px-5 py-8 text-center">
  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ffd6bd] bg-white text-[#ff6200] shadow-sm">
    <CalendarDays className="h-7 w-7" />
  </div>

  <h4 className="mt-4 text-base font-black text-[#202020]">
    Немає особливих дат
  </h4>

  <p className="mx-auto mt-1.5 max-w-[280px] text-sm font-semibold leading-5 text-[#77716b]">
    Для цього майстра ще не додано індивідуальний графік або вихідні дні.
  </p>
</div>
          ) : (
            <div className="space-y-3">
              {masterExceptions.map((item, index) => {
                const isValid = isExceptionValid(item);
                const exceptionKey = getExceptionKey(item, index);
                const isExpanded =
                  item.isNew || expandedExceptions[exceptionKey] === true;

                return (
                  <div
                    key={exceptionKey}
                    className="overflow-hidden rounded-[24px] border border-[#eadbc9] bg-white shadow-[0_12px_32px_rgba(17,17,17,0.05)]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (item.isNew) return;

                        setExpandedExceptions((prev) => ({
                          ...prev,
                          [exceptionKey]: !prev[exceptionKey],
                        }));
                      }}
                      className={cn(
                        "flex w-full items-start justify-between gap-3 p-4 text-left transition-colors",
                        !item.isNew && "hover:bg-[#fff7f0]",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-black text-[#202020]">
                            {item.date
                              ? formatExceptionDate(item.date)
                              : "Нова особлива дата"}
                          </p>

                          <div className="rounded-full border border-[#ffd6bd] bg-[#fff1e8] px-3 py-1 text-xs font-black text-[#ff5a00]">
                            {item.enabled ? "Особливий графік" : "Вихідний"}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {!item.isNew && (
                          <span className="hidden text-xs font-semibold text-[#77716b] sm:inline">
                            {isExpanded ? "Згорнути" : "Розгорнути"}
                          </span>
                        )}

                        {!item.isNew &&
                          (isExpanded ? (
                            <ChevronUp className="h-5 w-5 shrink-0 text-[#ff5a00]" />
                          ) : (
                            <ChevronDown className="h-5 w-5 shrink-0 text-[#ff5a00]" />
                          ))}
                      </div>
                    </button>

                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-out",
                        isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="border-t border-[#eadbc9] bg-[#fffaf6] px-4 pb-4 pt-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
                            <div className="min-w-0">
                              <DatePicker
                                label="Дата"
                                value={item.date}
                                onChange={(value) =>
                                  updateException(index, "date", value)
                                }
                              />
                            </div>

                            <div className="col-span-1 sm:col-span-1">
                              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#77716b]">
                                Статус
                              </label>

                              <button
                                type="button"
                                onClick={() =>
                                  updateException(index, "enabled", !item.enabled)
                                }
                                className="flex h-[50px] w-full items-center gap-3 rounded-2xl border border-[#eadbc9] bg-white px-4 transition-all duration-200 hover:border-[#ffd6bd] hover:bg-[#fff7f0]"
                              >
                                <span
                                  className={cn(
                                    "relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300",
                                    item.enabled
                                      ? "bg-[#ff5a00]"
                                      : "bg-[var(--color-mist)]",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300",
                                      item.enabled ? "translate-x-6" : "translate-x-1",
                                    )}
                                  />
                                </span>

                                <span className="whitespace-nowrap text-sm font-black text-[#202020]">
                                  {item.enabled ? "Робочий день" : "Вихідний"}
                                </span>
                              </button>
                            </div>

                            {item.enabled ? (
                              <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                                <div className="min-w-0">
                                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#77716b]">
                                    Початок
                                  </label>

                                  <div className="flex h-[50px] items-center overflow-hidden rounded-[16px] border border-[#eadbc9] bg-white">
                                    <TimeSelect
                                      value={item.start}
                                      label="Початок"
                                      dayLabel={item.date || "Особлива дата"}
                                      onChange={(value) =>
                                        updateException(index, "start", value)
                                      }
                                      onCommit={(value) =>
                                        updateException(index, "start", value)
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="min-w-0">
                                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#77716b]">
                                    Завершення
                                  </label>
                                  <div className="flex h-[50px] items-center overflow-hidden rounded-[16px] border border-[#eadbc9] bg-white">
                                    <TimeSelect
                                      value={item.end}
                                      label="Завершення"
                                      dayLabel={item.date || "Особлива дата"}
                                      onChange={(value) =>
                                        updateException(index, "end", value)
                                      }
                                      onCommit={(value) =>
                                        updateException(index, "end", value)
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center sm:col-span-2">
                                <div className="w-full rounded-2xl border border-[#ffd6bd] bg-[#fff1e8] px-4 py-3 text-sm font-black text-[#ff5a00]">
                                  У цей день майстер не працює
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:flex">
                              <Button
                                variant={isValid ? "primary" : "secondary"}
                                onClick={() => saveException(item, index)}
                                disabled={!isValid}
                                className={cn(
                                  "h-[50px] w-full justify-center",
                                  !isValid &&
                                    "cursor-not-allowed border-[#eadbc9] bg-[#f5f1ea] text-[#77716b]",
                                )}
                              >
                                <Check className="h-4 w-4" />
                                Зберегти
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => removeException(item, index)}
                                className="h-[50px] w-full justify-center text-center"
                              >
                                <Trash2 className="h-4 w-4" />
                                Видалити
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
    ["today", "Сьогодні"],
    ["week", "Тиждень"],
    ["month", "Місяць"],
    ["all", "Усі"],
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
      Показано {visibleMasterBookings.length} з {sortedMasterBookings.length}
    </p>

    {hasMoreMasterBookings && (
      <button
        type="button"
        onClick={() =>
          setVisibleMasterBookingsCount((prev) => prev + 10)
        }
        className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-[#eadbc9] bg-white px-4 text-sm font-black text-[#202020] transition-all duration-200 hover:border-[#ffd6bd] hover:bg-[#fff7f0] active:scale-[0.98]"
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
            if (cropModal.imageUrl) URL.revokeObjectURL(cropModal.imageUrl);

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

            <div className="absolute inset-x-0 bottom-0 border-[#eadfce] bg-white/92 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-6 sm:pb-5">
              <button
                type="button"
                onClick={closeDetails}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[22px] bg-[var(--color-primary-buttom)] text-sm font-black text-white transition-all duration-200 hover:bg-[#4a4a4a] active:scale-[0.98]"
              >
                <X className="h-4 w-4" />
                Закрити
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  })()}
    </div>
  );
}
