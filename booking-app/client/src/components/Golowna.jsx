import { useEffect, useMemo, useRef, useState } from "react";
import { useBookings } from "../context/bookings/useBookings";
import { useStudio } from "../context/studio/useStudio";
import {
  Sparkles,
  CalendarDays,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  ChevronDown,
  Trash2,
  XCircle,
  Phone,
  CircleAlert,
  CircleCheckBig,
  ClockAlert,
  ChartColumn,
  LayoutGrid,
  MoreHorizontal,
  MoreVertical,
  SlidersHorizontal,
  Scissors,
  Minus,
  Plus,
  Bell,
  Megaphone,
  Store,
} from "lucide-react";

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
      Icon: CheckCheck,
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
   label: (
  <>
    Очікує ваше
    <br />
    підтвердження
  </>
),
    badge: "badge-theme-warning",
    dot: "bg-[var(--color-dot-wait)]",
    iconBg: "status-theme-warning",
    Icon: Clock,
    text: "text-[#ffb020]",
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

function SectionShell({ children, className = "" }) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[32px] border border-[#ebe7df] bg-white shadow-[0_14px_44px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />
      {children}
    </div>
  );
}

function addMonthsSafe(date, amount) {
  const next = new Date(date);
  const day = next.getDate();

  next.setDate(1);
  next.setMonth(next.getMonth() + amount);

  const lastDay = new Date(
    next.getFullYear(),
    next.getMonth() + 1,
    0,
  ).getDate();
  next.setDate(Math.min(day, lastDay));
  next.setHours(0, 0, 0, 0);

  return next;
}

function Avatar({ name, photoUrl, className = "" }) {
  const initials =
    String(name || "К")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "К";

  const src = toPublicUrl(photoUrl);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-[#eadbc9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.08)]",
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
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,122,24,0.20),transparent_36%),radial-gradient(circle_at_80%_90%,rgba(255,231,208,0.50),transparent_42%)]" />
          <div className="absolute -right-3 -top-3 h-10 w-10 rounded-full bg-white/55 blur-sm" />
          <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-[var(--color-cream)]/80 blur-sm" />

          <span className="relative z-10 text-[21px] font-black tracking-tight text-[#ff5a00]">
            {initials}
          </span>
        </>
      )}
    </div>
  );
}

function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function getWeekdayShortUA(date) {
  return date
    .toLocaleDateString("uk-UA", { weekday: "short" })
    .replace(".", "")
    .slice(0, 2);
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

function updateCalendarScrollState(el, setHasScroll, setShowScrollHint) {
  if (!el) return;

  const isScrollable = el.scrollHeight > el.clientHeight;
  const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 12;

  setHasScroll(isScrollable);
  setShowScrollHint(isScrollable && !isAtBottom);
}

const SCHEDULE_START_HOUR = 6;
const SCHEDULE_END_HOUR = 20;
const SCHEDULE_HOUR_HEIGHT = 92;
const SCHEDULE_MIN_CARD_HEIGHT = 54;
const SCHEDULE_DEFAULT_DURATION = 60;
const SCHEDULE_GRID_TOP_PADDING = 18;

const SCHEDULE_STATUS_FILTERS = [
  { key: "all", label: "Усі" },
  { key: "pending", label: "Очікують" },
  { key: "confirmed", label: "Підтверджені" },
  { key: "canceled", label: "Скасовані" },
  { key: "archived", label: "Завершені" },
];

const MASTER_DEFAULT_SCHEDULE = {
  mon: { enabled: true, start: "08:00", end: "18:00" },
  tue: { enabled: true, start: "08:00", end: "18:00" },
  wed: { enabled: true, start: "08:00", end: "18:00" },
  thu: { enabled: true, start: "08:00", end: "18:00" },
  fri: { enabled: true, start: "08:00", end: "18:00" },
  sat: { enabled: false, start: "08:00", end: "18:00" },
  sun: { enabled: false, start: "08:00", end: "18:00" },
};

const MASTER_DAY_KEY_BY_INDEX = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const MASTER_ENUM_TO_KEY = {
  MON: "mon",
  TUE: "tue",
  WED: "wed",
  THU: "thu",
  FRI: "fri",
  SAT: "sat",
  SUN: "sun",
};

function normalizeEnabled(value, fallback = true) {
  if (value === false || value === "false") return false;
  if (value === true || value === "true") return true;
  return fallback;
}

function normalizeMasterSchedule(master) {
  const base = { ...MASTER_DEFAULT_SCHEDULE };

  if (master?.schedule && typeof master.schedule === "object" && !Array.isArray(master.schedule)) {
    for (const [key, value] of Object.entries(master.schedule)) {
      if (!base[key]) continue;

      base[key] = {
        enabled: normalizeEnabled(value?.enabled, base[key].enabled),
        start: value?.start || base[key].start,
        end: value?.end || base[key].end,
      };
    }
  }

  const scheduleDays = Array.isArray(master?.scheduleDays)
    ? master.scheduleDays
    : [];

  for (const row of scheduleDays) {
    const key = MASTER_ENUM_TO_KEY[row?.day];
    if (!key) continue;

    base[key] = {
      enabled: normalizeEnabled(row?.enabled, true),
      start:
        row?.start ||
        (Number.isFinite(row?.startMin)
          ? `${pad2(Math.floor(row.startMin / 60))}:${pad2(row.startMin % 60)}`
          : base[key].start),
      end:
        row?.end ||
        (Number.isFinite(row?.endMin)
          ? `${pad2(Math.floor(row.endMin / 60))}:${pad2(row.endMin % 60)}`
          : base[key].end),
    };
  }

  return base;
}

function normalizeMasterExceptions(master) {
  const list = master?.scheduleExceptions || master?.exceptions || [];

  return Array.isArray(list)
    ? list.map((item) => ({
        ...item,
        date: scheduleDateKey(item?.date),
        enabled: normalizeEnabled(item?.enabled, true),
        start:
          item?.start ||
          (Number.isFinite(Number(item?.startMin))
            ? scheduleTimeLabel(Number(item.startMin))
            : null),
        end:
          item?.end ||
          (Number.isFinite(Number(item?.endMin))
            ? scheduleTimeLabel(Number(item.endMin))
            : null),
      }))
    : [];
}

function masterScheduleWindowFromRow(row, fallbackEnabled = true) {
  const enabled = normalizeEnabled(row?.enabled, fallbackEnabled);

  if (!enabled) {
    return { isWorking: false, startMin: null, endMin: null };
  }

  const startMin = Number.isFinite(Number(row?.startMin))
    ? Number(row.startMin)
    : scheduleMinutesFromTime(row?.start);

  const endMin = Number.isFinite(Number(row?.endMin))
    ? Number(row.endMin)
    : scheduleMinutesFromTime(row?.end);

  if (
    !Number.isFinite(startMin) ||
    !Number.isFinite(endMin) ||
    startMin < 0 ||
    endMin > 24 * 60 ||
    endMin <= startMin
  ) {
    return { isWorking: false, startMin: null, endMin: null };
  }

  return { isWorking: true, startMin, endMin };
}

function getMasterScheduleWindow(master, date = new Date()) {
  const dateKey = toISODateKey(date);
  const exception = normalizeMasterExceptions(master).find(
    (item) => item.date === dateKey,
  );

  if (exception) {
    return {
      ...masterScheduleWindowFromRow(exception, true),
      source: "exception",
    };
  }

  const dayKey = MASTER_DAY_KEY_BY_INDEX[date.getDay()];
  const scheduleDays = Array.isArray(master?.scheduleDays)
    ? master.scheduleDays
    : [];

  if (scheduleDays.length > 0) {
    const row = scheduleDays.find((item) => {
      const itemKey =
        MASTER_ENUM_TO_KEY[item?.day] ||
        String(item?.day || "").toLowerCase();

      return itemKey === dayKey;
    });

    if (!row) {
      return { isWorking: false, startMin: null, endMin: null, source: "schedule" };
    }

    return {
      ...masterScheduleWindowFromRow(row, true),
      source: "schedule",
    };
  }

  if (
    master?.schedule &&
    typeof master.schedule === "object" &&
    !Array.isArray(master.schedule)
  ) {
    const day = master.schedule[dayKey];

    if (!day) {
      return { isWorking: false, startMin: null, endMin: null, source: "schedule" };
    }

    return {
      ...masterScheduleWindowFromRow(day, true),
      source: "schedule",
    };
  }

  return null;
}

function getMasterWorkStatus(master, date = new Date()) {
  const workWindow = getMasterScheduleWindow(master, date);

  if (!workWindow?.isWorking) {
    return {
      isWorking: false,
      label: "Вихідний",
      helper:
        workWindow?.source === "exception"
          ? "Особлива дата"
          : workWindow
            ? "За графіком"
            : "Графік не задано",
    };
  }

  return {
    isWorking: true,
    label: "Працює",
    helper: `${scheduleTimeLabel(workWindow.startMin)} - ${scheduleTimeLabel(
      workWindow.endMin,
    )}`,
  };
}

function numberOrNull(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function scheduleMinutesFromTime(value) {
  const time = parseTimeToHHMM(value);
  if (!time) return null;

  const [hh, mm] = time.split(":").map(Number);
  return hh * 60 + mm;
}

function scheduleDateKey(value) {
  const raw = String(value || "").trim();
  const direct = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (direct) return `${direct[1]}-${direct[2]}-${direct[3]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return toISODateKey(date);
}

function scheduleDateTimeMinutes(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.getHours() * 60 + date.getMinutes();
}

function scheduleTimeLabel(minutes) {
  const safe = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes || 0)));
  return `${pad2(Math.floor(safe / 60))}:${pad2(safe % 60)}`;
}

function scheduleServices(booking) {
  if (Array.isArray(booking?.services)) return booking.services;
  if (Array.isArray(booking?.bookingServices)) return booking.bookingServices;
  if (Array.isArray(booking?.items)) return booking.items;
  return [];
}

function scheduleServiceName(booking) {
  const direct =
    booking?.serviceName ||
    booking?.serviceTitle ||
    booking?.service?.name ||
    booking?.service?.title;

  if (direct) return String(direct);

  const names = scheduleServices(booking)
    .map((item) => item?.name || item?.title || item?.serviceName)
    .filter(Boolean);

  return names.length ? names.join(", ") : "Послуга";
}

function schedulePrice(booking) {
  const direct =
    numberOrNull(booking?.price) ??
    numberOrNull(booking?.servicePrice) ??
    numberOrNull(booking?.totalPrice) ??
    numberOrNull(booking?.amount);

  if (direct != null) return direct;

  const sum = scheduleServices(booking).reduce((total, item) => {
    return (
      total +
      (numberOrNull(item?.price) ??
        numberOrNull(item?.servicePrice) ??
        numberOrNull(item?.amount) ??
        0)
    );
  }, 0);

  return sum > 0 ? sum : null;
}

function scheduleDuration(booking) {
  const direct =
    numberOrNull(booking?.duration) ??
    numberOrNull(booking?.durationMinutes) ??
    numberOrNull(booking?.serviceDuration) ??
    numberOrNull(booking?.service?.duration) ??
    numberOrNull(booking?.service?.durationMinutes);

  if (direct != null) return Math.max(10, direct);

  const sum = scheduleServices(booking).reduce((total, item) => {
    return (
      total +
      (numberOrNull(item?.duration) ??
        numberOrNull(item?.durationMinutes) ??
        numberOrNull(item?.serviceDuration) ??
        0)
    );
  }, 0);

  return sum > 0 ? Math.max(10, sum) : SCHEDULE_DEFAULT_DURATION;
}

function scheduleStaffName(booking) {
  return (
    booking?.masterName ||
    booking?.masterFullName ||
    booking?.staffName ||
    booking?.staffFullName ||
    booking?.employeeName ||
    booking?.employeeFullName ||
    booking?.workerName ||
    booking?.providerName ||
    booking?.specialistName ||
    booking?.performerName ||
    booking?.master?.name ||
    booking?.master?.fullName ||
    booking?.master?.displayName ||
    booking?.master?.user?.name ||
    booking?.master?.user?.fullName ||
    booking?.staff?.name ||
    booking?.staff?.fullName ||
    booking?.staff?.displayName ||
    booking?.staff?.user?.name ||
    booking?.staff?.user?.fullName ||
    booking?.employee?.name ||
    booking?.employee?.fullName ||
    booking?.employee?.displayName ||
    booking?.employee?.user?.name ||
    booking?.employee?.user?.fullName ||
    booking?.worker?.name ||
    booking?.worker?.fullName ||
    booking?.provider?.name ||
    booking?.specialist?.name ||
    booking?.performer?.name ||
    "Вільний майстер"
  );
}

function scheduleStaffRole(booking) {
  return (
    booking?.masterRole ||
    booking?.staffRole ||
    booking?.employeeRole ||
    booking?.providerRole ||
    booking?.specialistRole ||
    booking?.master?.role ||
    booking?.staff?.role ||
    booking?.employee?.role ||
    booking?.master?.position ||
    booking?.staff?.position ||
    booking?.employee?.position ||
    booking?.provider?.role ||
    booking?.specialist?.role ||
    "Співробітник"
  );
}

function scheduleResourceName(booking) {
  return (
    booking?.resourceName ||
    booking?.roomName ||
    booking?.cabinetName ||
    booking?.chairName ||
    booking?.resource?.name ||
    booking?.room?.name ||
    "Основний зал"
  );
}

function schedulePhotoUrl(booking) {
  return toPublicUrl(
    booking?.masterPhotoUrl ||
      booking?.staffPhotoUrl ||
      booking?.employeePhotoUrl ||
      booking?.masterPhoto ||
      booking?.staffPhoto ||
      booking?.employeePhoto ||
      booking?.providerPhotoUrl ||
      booking?.specialistPhotoUrl ||
      booking?.master?.photoUrl ||
      booking?.master?.avatarUrl ||
      booking?.staff?.photoUrl ||
      booking?.staff?.avatarUrl ||
      booking?.employee?.photoUrl ||
      booking?.employee?.avatarUrl ||
      booking?.master?.user?.photoUrl ||
      booking?.master?.user?.avatarUrl ||
      booking?.staff?.user?.photoUrl ||
      booking?.staff?.user?.avatarUrl ||
      booking?.master?.photo ||
      booking?.staff?.photo ||
      booking?.employee?.photo ||
      "",
  );
}

function normalizeScheduleBooking(booking) {
  if (!booking) return null;

  const dateKey =
    scheduleDateKey(booking.date) ||
    scheduleDateKey(booking.startDate) ||
    scheduleDateKey(booking.startAt) ||
    scheduleDateKey(booking.datetime);

  if (!dateKey) return null;

  const startMin =
    scheduleMinutesFromTime(booking.time) ??
    scheduleMinutesFromTime(booking.startTime) ??
    scheduleMinutesFromTime(booking.start) ??
    scheduleDateTimeMinutes(booking.startAt) ??
    scheduleDateTimeMinutes(booking.datetime) ??
    SCHEDULE_START_HOUR * 60;

  const duration = scheduleDuration(booking);
  const staffName = scheduleStaffName(booking);
  const resourceName = scheduleResourceName(booking);
  const staffKey = String(
    booking.masterId ||
      booking.masterUserId ||
      booking.staffId ||
      booking.staffUserId ||
      booking.employeeId ||
      booking.employeeUserId ||
      booking.workerId ||
      booking.providerId ||
      booking.specialistId ||
      booking.performerId ||
      booking.master?.id ||
      booking.master?._id ||
      booking.master?.userId ||
      booking.master?.user?.id ||
      booking.master?.user?._id ||
      booking.staff?.id ||
      booking.staff?._id ||
      booking.staff?.userId ||
      booking.staff?.user?.id ||
      booking.staff?.user?._id ||
      booking.employee?.id ||
      booking.employee?._id ||
      booking.employee?.userId ||
      booking.employee?.user?.id ||
      booking.employee?.user?._id ||
      booking.provider?.id ||
      booking.specialist?.id ||
      booking.performer?.id ||
      staffName,
  );
  const resourceKey = String(
    booking.resourceId ||
      booking.roomId ||
      booking.cabinetId ||
      booking.resource?.id ||
      booking.room?.id ||
      resourceName,
  );

  return {
    id: booking.id ?? booking._id ?? booking.bookingId,
    raw: booking,
    dateKey,
    startMin,
    endMin: Math.min(24 * 60, startMin + duration),
    duration,
    status: String(booking.status || "pending").toLowerCase(),
    clientName:
      booking.clientName ||
      booking.customerName ||
      booking.client?.name ||
      booking.customer?.name ||
      "Клієнт",
    clientPhone:
      booking.clientPhone ||
      booking.customerPhone ||
      booking.phone ||
      booking.client?.phone ||
      booking.customer?.phone ||
      "",
    serviceName: scheduleServiceName(booking),
    price: schedulePrice(booking),
    staffKey: `staff:${staffKey}`,
    staffName,
    staffRole: scheduleStaffRole(booking),
    staffPhotoUrl: schedulePhotoUrl(booking),
    resourceKey: `resource:${resourceKey}`,
    resourceName,
  };
}

function scheduleVisualStatus(booking, nowTs) {
  const status = String(booking?.status || "").toLowerCase();

  if (status === "deleted") return "deleted";
  if (status === "canceled" || status === "cancelled") return "canceled";

  const date = new Date(`${booking.dateKey}T00:00:00`);
  date.setMinutes(booking.endMin || booking.startMin || 0);

  if (!Number.isNaN(date.getTime()) && date.getTime() < nowTs) {
    return "archived";
  }

  if (status === "confirmed" || status === "approved" || status === "done") {
    return "confirmed";
  }

  return "pending";
}

function schedulePalette(booking, nowTs) {
  const status = scheduleVisualStatus(booking, nowTs);

  if (status === "confirmed") {
    return {
      bg: "bg-[#edf8f0]",
      border: "border-[#ccebd6]",
      accent: "bg-[var(--color-buttom-ok)]",
      text: "text-[var(--color-confirmed-dark)]",
      shadow: "shadow-[0_14px_34px_rgba(47,126,83,0.11)]",
    };
  }

  if (status === "pending") {
    return {
      bg: "bg-[#fff7dc]",
      border: "border-[#ffe5a7]",
      accent: "bg-[#ffb020]",
      text: "text-[#8a5f00]",
      shadow: "shadow-[0_14px_34px_rgba(255,176,32,0.12)]",
    };
  }

  if (status === "canceled") {
    return {
      bg: "bg-[#fff5f5]",
      border: "border-[#fecaca]",
      accent: "bg-[var(--color-danger)]",
      text: "text-[var(--color-canceled-dark)]",
      shadow: "shadow-none",
    };
  }

  if (status === "archived") {
    return {
      bg: "bg-[var(--color-archived-light)]",
      border: "border-[#eadbc9]",
      accent: "bg-[var(--color-caramel)]",
      text: "text-[var(--color-archived-dark)]",
      shadow: "shadow-none",
    };
  }

  return {
    bg: "bg-[#f4f1ec]",
    border: "border-[#e2d8cc]",
    accent: "bg-[var(--color-caramel)]",
    text: "text-[var(--color-archived-dark)]",
    shadow: "shadow-none",
  };
}

function scheduleStatusIcon(booking, nowTs) {
  const status = scheduleVisualStatus(booking, nowTs);

  if (status === "confirmed") return CircleCheckBig;
  if (status === "pending") return ClockAlert;
  if (status === "canceled") return XCircle;
  if (status === "archived") return CheckCheck;
  if (status === "deleted") return Trash2;

  return CircleAlert;
}

function scheduleStatusLabel(booking, nowTs) {
  const status = scheduleVisualStatus(booking, nowTs);

  if (status === "confirmed") return "Підтверджено";
  if (status === "pending") return "Очікує підтвердження";
  if (status === "canceled") return "Скасовано";
  if (status === "archived") return "Завершено";

  return "Запис";
}

const SCHEDULE_CARD_TONES = {
  confirmed: {
    bg: "#e7f7f8",
    border: "#b8e5ea",
    accent: "#00a6b2",
    soft: "#d9f2f5",
  },
  pending: {
    bg: "#f9e7ec",
    border: "#f3c6d2",
    accent: "#f04f82",
    soft: "#ffe2ea",
  },
  canceled: {
    bg: "#f1f2f4",
    border: "#d7dce2",
    accent: "#8b93a0",
    soft: "#e8ebef",
  },
  archived: {
    bg: "#dbe8ff",
    border: "#b8cdf8",
    accent: "#6d32d9",
    soft: "#e9f0ff",
  },
  default: {
    bg: "#eef3ff",
    border: "#c9d8ff",
    accent: "#5d6ce1",
    soft: "#e5ebff",
  },
};

function scheduleCardTone(booking, nowTs) {
  const status = scheduleVisualStatus(booking, nowTs);

  return SCHEDULE_CARD_TONES[status] || SCHEDULE_CARD_TONES.default;
}

function scheduleOptionsFromStudio(studio, type) {
  const keys =
    type === "staff"
      ? [
          "staff",
          "employees",
          "masters",
          "workers",
          "members",
          "specialists",
          "team",
          "teamMembers",
          "providers",
          "performers",
          "professionals",
          "users",
          "barbers",
          "stylists",
          "artists",
          "beauticians",
          "technicians",
          "operators",
        ]
      : ["resources", "rooms", "cabinets", "chairs"];
  const keyPattern =
    type === "staff"
      ? /(staff|employee|master|worker|member|specialist|team|provider|performer|professional|user|barber|stylist|artist|beautician|technician|operator)/i
      : /(resource|room|cabinet|chair)/i;
  const nestedCollectionPattern = /^(items|list|data|nodes|records|results|rows)$/i;
  const collected = [];
  const seenContainers = new Set();

  function collectFrom(value, depth = 0, parentKey = "") {
    if (!value || depth > 4) return;

    if (Array.isArray(value)) {
      if (keyPattern.test(parentKey)) {
        collected.push(...value);
      }

      for (const item of value) {
        if (item && typeof item === "object") {
          collectFrom(item, depth + 1, parentKey);
        }
      }

      return;
    }

    if (typeof value !== "object" || seenContainers.has(value)) return;

    seenContainers.add(value);

    for (const [key, child] of Object.entries(value)) {
      if (Array.isArray(child)) {
        if (
          keys.includes(key) ||
          keyPattern.test(key) ||
          (keyPattern.test(parentKey) && nestedCollectionPattern.test(key))
        ) {
          collected.push(...child);
        }
        continue;
      }

      if (child && typeof child === "object") {
        if (
          (keys.includes(key) ||
            keyPattern.test(key) ||
            (keyPattern.test(parentKey) && nestedCollectionPattern.test(key))) &&
          !Array.isArray(child)
        ) {
          if (child.name || child.title || child.fullName || child.label) {
            collected.push(child);
          } else {
            collected.push(...Object.values(child));
          }
        }

        collectFrom(child, depth + 1, key);
      }
    }
  }

  collectFrom(studio);

  return collected
    .map((item) => {
      const rawRole = String(
        item?.role ||
          item?.type ||
          item?.accountType ||
          item?.userType ||
          item?.position ||
          item?.profession ||
          item?.specialty ||
          item?.jobTitle ||
          "",
      ).toLowerCase();

      if (
        type === "staff" &&
        rawRole &&
        /(client|customer|owner|admin|manager)/i.test(rawRole) &&
        !/(staff|employee|master|worker|specialist|provider|performer|barber|stylist|artist|beautician|technician|operator)/i.test(rawRole)
      ) {
        return null;
      }

      const name =
        item?.name ||
        item?.title ||
        item?.fullName ||
        item?.displayName ||
        item?.label ||
        [item?.firstName, item?.lastName].filter(Boolean).join(" ") ||
        item?.username ||
        item?.nickname;
      if (!name) return null;

      const id =
        item?.id ||
        item?._id ||
        item?.masterId ||
        item?.staffId ||
        item?.employeeId ||
        item?.workerId ||
        item?.memberId ||
        item?.userId ||
        item?.uid ||
        item?.uuid ||
        item?.key ||
        item?.value ||
        name;

return {
  id,
  key: `${type === "staff" ? "staff" : "resource"}:${id}`,
  name,
  role:
    item?.role ||
    item?.position ||
    item?.profession ||
    item?.specialty ||
    item?.jobTitle ||
    (type === "staff" ? "Співробітник" : "Ресурс"),
  photoUrl: toPublicUrl(
    item?.photoUrl ||
      item?.avatarUrl ||
      item?.imageUrl ||
      item?.photo ||
      item?.avatar ||
      item?.image ||
      "",
  ),
  schedule: item?.schedule || null,
  scheduleDays: Array.isArray(item?.scheduleDays) ? item.scheduleDays : [],
  scheduleExceptions: Array.isArray(item?.scheduleExceptions)
    ? item.scheduleExceptions
    : [],
};
    })
    .filter(Boolean);
}

function scheduleEntityOptions(bookings, studio, type) {
  const map = new Map();
  const keyByName = new Map();
  const normalizeName = (name) =>
    String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  for (const option of scheduleOptionsFromStudio(studio, type)) {
    map.set(option.key, option);
    keyByName.set(normalizeName(option.name), option.key);
  }

  for (const booking of bookings) {
    if (type === "resource") {
      map.set(booking.resourceKey, {
        key: booking.resourceKey,
        name: booking.resourceName,
        role: "Ресурс",
        photoUrl: "",
      });
      continue;
    }

    const normalizedStaffName = normalizeName(booking.staffName);
    const existingKey = keyByName.get(normalizedStaffName);
    const existingOption = existingKey ? map.get(existingKey) : null;
const nextOption = {
  ...(existingOption || {}),
  key: booking.staffKey,
  name: booking.staffName,
  role: booking.staffRole || existingOption?.role || "Співробітник",
  photoUrl: booking.staffPhotoUrl || existingOption?.photoUrl || "",
  schedule:
    existingOption?.schedule ||
    booking.raw?.master?.schedule ||
    null,

  scheduleDays:
    Array.isArray(existingOption?.scheduleDays) &&
    existingOption.scheduleDays.length > 0
      ? existingOption.scheduleDays
      : Array.isArray(booking.raw?.master?.scheduleDays)
        ? booking.raw.master.scheduleDays
        : [],

  scheduleExceptions:
    Array.isArray(existingOption?.scheduleExceptions) &&
    existingOption.scheduleExceptions.length > 0
      ? existingOption.scheduleExceptions
      : Array.isArray(booking.raw?.master?.scheduleExceptions)
        ? booking.raw.master.scheduleExceptions
        : [],
};

    if (existingKey && existingKey !== booking.staffKey) {
      map.delete(existingKey);
    }

    map.set(booking.staffKey, nextOption);
    keyByName.set(normalizedStaffName, booking.staffKey);
  }

  if (map.size === 0 && type === "resource") {
    map.set("resource:main", {
      key: "resource:main",
      name: "Основний зал",
      role: "Ресурс",
      photoUrl: "",
    });
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "uk"),
  );
}

function layoutScheduleEvents(events) {
  const laneEnds = [];

  return [...events]
    .sort((a, b) => {
      if (a.startMin !== b.startMin) return a.startMin - b.startMin;
      return a.endMin - b.endMin;
    })
    .map((event) => {
      const lane = laneEnds.findIndex((end) => end <= event.startMin);
      const nextLane = lane === -1 ? laneEnds.length : lane;
      laneEnds[nextLane] = event.endMin;

      return {
        ...event,
        lane: nextLane,
        laneCount: Math.max(1, laneEnds.length),
      };
    })
    .map((event, _index, list) => ({
      ...event,
      laneCount: Math.max(1, ...list.map((item) => item.laneCount)),
    }));
}

export function ScheduleViewSwitcher({ value, onChange }) {
  const items = [
    { key: "overview", label: "Огляд", Icon: ChartColumn },
    { key: "schedule", label: "Розклад", Icon: LayoutGrid },
  ];

  return (
    <div className="flex justify-end gap-3">
      {items.map(({ key, label, Icon }) => {
        const active = value === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "inline-flex h-12 items-center justify-center gap-2 rounded-[16px] border px-5 text-[13px] font-black shadow-[0_8px_24px_rgba(39,28,20,0.06)] transition-all active:scale-[0.98]",
              active
                ? "border-[#f15f4a] bg-[#f15f4a] text-white"
                : "border-[#eadfce] bg-[#fff8f1] text-[#3b312b] hover:bg-white",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ScheduleMiniCalendar({
  viewDate,
  countsByDate,
  onSelectDate,
  onNavigateMonth = onSelectDate,
}) {
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const gridStart = startOfWeekMonday(monthStart);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const todayKey = toISODateKey(new Date());

  return (
    <div className="rounded-[28px] border border-[#eadbc9] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigateMonth(addMonthsSafe(viewDate, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#eadbc9] bg-white text-[#202020] transition hover:bg-[#fff7f0]"
          aria-label="Попередній місяць"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <p className="text-sm font-black text-[var(--color-ink)]">
          {viewDate.toLocaleDateString("uk-UA", {
            month: "long",
            year: "numeric",
          })}
        </p>

        <button
          type="button"
          onClick={() => onNavigateMonth(addMonthsSafe(viewDate, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#eadbc9] bg-white text-[#202020] transition hover:bg-[#fff7f0]"
          aria-label="Наступний місяць"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-[var(--color-caramel)]/70">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((date) => {
          const key = toISODateKey(date);
          const active = key === toISODateKey(viewDate);
          const currentMonth = isSameMonth(date, viewDate);
          const hasBookings = countsByDate[key] > 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "relative flex h-8 items-center justify-center rounded-xl text-[11px] font-black transition",
                active
                  ? "bg-[#ff6200] text-white shadow-[0_8px_20px_rgba(255,98,0,0.22)]"
                  : "text-[var(--color-caramel)] hover:bg-[#fff7f0] hover:text-[#202020]",
                !currentMonth && "text-[#c7b8a9]",
                key === todayKey && !active && "ring-1 ring-[#ff6200]/25",
              )}
            >
              {date.getDate()}
              {hasBookings && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1 w-1 rounded-full",
                    active ? "bg-white" : "bg-[#ff6200]",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function pluralUa(value, one, few, many) {
  const n = Math.abs(Number(value) || 0);
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;

  return many;
}

function scheduleStatusSummaryMeta(counts) {
  const total = counts.confirmed + counts.canceled + counts.pending + counts.archived;

  if (total === 0) {
    return {
      title: "День вільний",
      detail: "Записів немає",
      Icon: CalendarDays,
      shell: "border-[#eadbc9] bg-[#fbfaf8] text-[#7a6d61]",
      icon: "bg-white text-[#ff6200]",
    };
  }

  const parts = [
    counts.confirmed > 0 &&
      `${counts.confirmed} ${pluralUa(counts.confirmed, "підтверджений", "підтверджені", "підтверджених")}`,
    counts.canceled > 0 &&
      `${counts.canceled} ${pluralUa(counts.canceled, "скасований", "скасовані", "скасованих")}`,
    counts.pending > 0 &&
      `${counts.pending} ${pluralUa(counts.pending, "очікує", "очікують", "очікують")}`,
    counts.archived > 0 &&
      `${counts.archived} ${pluralUa(counts.archived, "завершений", "завершені", "завершених")}`,
  ].filter(Boolean);

  if (counts.canceled > 0) {
    return {
      title: `${total} ${pluralUa(total, "запис", "записи", "записів")} у розкладі`,
      detail: parts.join(" • "),
      Icon: CircleAlert,
      shell: "border-[#fecaca] bg-[#fff5f5] text-[var(--color-canceled-dark)]",
      icon: "bg-white text-[var(--color-danger)]",
    };
  }

  if (counts.pending > 0) {
    return {
      title: `${total} ${pluralUa(total, "запис", "записи", "записів")} у розкладі`,
      detail: parts.join(" • "),
      Icon: ClockAlert,
      shell: "border-[#ffe5a7] bg-[#fff7dc] text-[#8a5f00]",
      icon: "bg-white text-[#ffb020]",
    };
  }

  return {
    title: `${total} ${pluralUa(total, "запис", "записи", "записів")} у розкладі`,
    detail: parts.join(" • "),
    Icon: CircleCheckBig,
    shell: "border-[#ccebd6] bg-[#edf8f0] text-[var(--color-confirmed-dark)]",
    icon: "bg-white text-[var(--color-buttom-ok)]",
  };
}

export default function Rozklad({
  bookings: bookingsProp,
  nowTs: nowTsProp,
  studio: studioProp,
  loading: loadingProp,
  onOpenBooking,
  viewSwitcher = null,
} = {}) {
  const bookingsContext = useBookings();
  const studioContext = useStudio();
const contextBookings = bookingsContext?.bookings;
const bookings = useMemo(
  () => bookingsProp ?? contextBookings ?? [],
  [bookingsProp, contextBookings],
);

const loading = loadingProp ?? bookingsContext?.loading ?? false;
const studio = studioProp ?? studioContext?.studio ?? null;
  const [localNowTs, setLocalNowTs] = useState(() => Date.now());
  const nowTs = nowTsProp ?? localNowTs;

  useEffect(() => {
    if (nowTsProp != null) return undefined;

    const id = window.setInterval(() => setLocalNowTs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [nowTsProp]);

  const [viewDate, setViewDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [rangeMode, setRangeMode] = useState("day");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [agendaCollapsed, setAgendaCollapsed] = useState(false);
  const [hourHeight, setHourHeight] = useState(SCHEDULE_HOUR_HEIGHT);
  const [staffColumnWidth, setStaffColumnWidth] = useState(216);
  const scrollRef = useRef(null);
  const headerScrollRef = useRef(null);
const handleViewDateChange = (nextDate) => {
  setViewDate(nextDate);
};

const handleSelectedGroupChange = (nextGroup) => {
  setSelectedGroup(nextGroup);
};

const handleRangeModeChange = (nextMode) => {
  setRangeMode(nextMode);
};

const adjustHourHeight = (delta) => {
  setHourHeight((value) => Math.max(50, Math.min(300, value + delta)));
};

const adjustStaffColumnWidth = (delta) => {
  setStaffColumnWidth((value) => Math.max(188, Math.min(340, value + delta)));
};

const syncHorizontalScroll = (source, ...targetRefs) => {
  for (const targetRef of targetRefs) {
    const target = targetRef.current;

    if (!target || target.scrollLeft === source.scrollLeft) continue;

    target.scrollLeft = source.scrollLeft;
  }
};
  const normalizedBookings = useMemo(() => {
    return (bookings || []).map(normalizeScheduleBooking).filter(Boolean);
  }, [bookings]);

const countsByDate = useMemo(() => {
  const result = {};

  for (const booking of normalizedBookings) {
    if (scheduleVisualStatus(booking, nowTs) === "deleted") continue;
    result[booking.dateKey] = (result[booking.dateKey] || 0) + 1;
  }

  return result;
}, [normalizedBookings, nowTs]);

const [scheduleMasters, setScheduleMasters] = useState([]);

useEffect(() => {
  const studioId = studio?.id || localStorage.getItem("studioId");
  const token = localStorage.getItem("token");

  if (!studioId || !token) return;

  let alive = true;

  async function loadScheduleMasters() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/${studioId}/masters`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Load masters failed");
      }

      if (!alive) return;

      setScheduleMasters(Array.isArray(data?.masters) ? data.masters : []);
    } catch (error) {
      console.error("Load schedule masters failed:", error);

      if (alive) {
        setScheduleMasters([]);
      }
    }
  }

  loadScheduleMasters();

  return () => {
    alive = false;
  };
}, [studio?.id]);

const studioForSchedule = useMemo(() => {
  return {
    ...(studio || {}),
    masters: scheduleMasters.length
      ? scheduleMasters
      : Array.isArray(studio?.masters)
        ? studio.masters
        : [],
  };
}, [studio, scheduleMasters]);

const staffOptions = useMemo(
  () => scheduleEntityOptions(normalizedBookings, studioForSchedule, "staff"),
  [normalizedBookings, studioForSchedule],
);

  const groupOptions = staffOptions;
  const groupKey = "staffKey";
  const groupOptionKeys = useMemo(
    () => new Set(groupOptions.map((option) => option.key)),
    [groupOptions],
  );
  const weekStart = useMemo(() => startOfWeekMonday(viewDate), [viewDate]);

  const visibleDates = useMemo(() => {
    if (rangeMode === "week") {
      return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    }

    if (rangeMode === "month") {
      const daysInMonth = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth() + 1,
        0,
      ).getDate();

      return Array.from(
        { length: daysInMonth },
        (_, index) => new Date(viewDate.getFullYear(), viewDate.getMonth(), index + 1),
      );
    }

    return [viewDate];
  }, [rangeMode, viewDate, weekStart]);

  const visibleDateKeys = useMemo(
    () => new Set(visibleDates.map((date) => toISODateKey(date))),
    [visibleDates],
  );

  const rangeBookings = useMemo(() => {
    return normalizedBookings
      .filter((booking) => visibleDateKeys.has(booking.dateKey))
      .filter((booking) => scheduleVisualStatus(booking, nowTs) !== "deleted")
      .sort((a, b) => {
        const dateCompare = a.dateKey.localeCompare(b.dateKey);
        if (dateCompare !== 0) return dateCompare;
        return a.startMin - b.startMin;
      });
  }, [normalizedBookings, nowTs, visibleDateKeys]);

  const baseFilteredBookings = useMemo(() => {
    return rangeBookings.filter((booking) => {
      if (rangeMode === "day" && !groupOptionKeys.has(booking[groupKey])) {
        return false;
      }

      if (selectedGroup !== "all" && booking[groupKey] !== selectedGroup) {
        return false;
      }

      return true;
    });
  }, [rangeBookings, rangeMode, groupOptionKeys, selectedGroup, groupKey]);

  const statusCounts = useMemo(() => {
    const result = {
      all: baseFilteredBookings.length,
      pending: 0,
      confirmed: 0,
      canceled: 0,
      archived: 0,
    };

    for (const booking of baseFilteredBookings) {
      const status = scheduleVisualStatus(booking, nowTs);
      if (result[status] != null) result[status] += 1;
    }

    return result;
  }, [baseFilteredBookings, nowTs]);

  const scheduleSummaryByColumn = useMemo(() => {
    const result = {};

    for (const booking of baseFilteredBookings) {
      const key = rangeMode === "day" ? booking[groupKey] : booking.dateKey;

      if (!result[key]) {
        result[key] = {
          confirmed: 0,
          canceled: 0,
          pending: 0,
          archived: 0,
        };
      }

      const status = scheduleVisualStatus(booking, nowTs);

      if (result[key][status] != null) {
        result[key][status] += 1;
      }
    }

    return result;
  }, [baseFilteredBookings, groupKey, nowTs, rangeMode]);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return baseFilteredBookings;

    return baseFilteredBookings.filter(
      (booking) => scheduleVisualStatus(booking, nowTs) === statusFilter,
    );
  }, [baseFilteredBookings, nowTs, statusFilter]);

  const timeBoundsMasters = useMemo(() => {
  if (rangeMode !== "day") return groupOptions;

  return selectedGroup === "all"
    ? groupOptions
    : groupOptions.filter((option) => option.key === selectedGroup);
}, [groupOptions, rangeMode, selectedGroup]);

const timeBounds = useMemo(() => {
  let start = null;
  let end = null;

  const includeWindow = (startMin, endMin) => {
    if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) return;
    if (endMin <= startMin) return;

    start = start == null ? startMin : Math.min(start, startMin);
    end = end == null ? endMin : Math.max(end, endMin);
  };

  for (const date of visibleDates) {
    for (const master of timeBoundsMasters) {
      const workWindow = getMasterScheduleWindow(master, date);

      if (!workWindow?.isWorking) continue;

      includeWindow(workWindow.startMin, workWindow.endMin);
    }
  }

  for (const booking of rangeBookings) {
    includeWindow(booking.startMin - 30, booking.endMin + 30);
  }

  if (start == null || end == null) {
    start = SCHEDULE_START_HOUR * 60;
    end = SCHEDULE_END_HOUR * 60;
  }

  start = Math.max(0, Math.floor(start / 60) * 60);
  end = Math.min(24 * 60, Math.ceil(end / 60) * 60);

  return { start, end };
}, [rangeBookings, timeBoundsMasters, visibleDates]);

  const hours = useMemo(() => {
    const startHour = Math.floor(timeBounds.start / 60);
    const endHour = Math.ceil(timeBounds.end / 60);

    return Array.from(
      { length: endHour - startHour + 1 },
      (_, index) => startHour + index,
    );
  }, [timeBounds]);

  const columns = useMemo(() => {
    if (rangeMode !== "day") {
      return visibleDates.map((date) => ({
        key: toISODateKey(date),
        type: "date",
        date,
        name: date.toLocaleDateString("uk-UA", {
          day: "numeric",
          month: "short",
          weekday: "short",
        }),
      }));
    }

    const options =
      selectedGroup === "all"
        ? groupOptions
        : groupOptions.filter((option) => option.key === selectedGroup);

    return options.map((option) => ({
      ...option,
      type: "staff",
    }));
  }, [rangeMode, visibleDates, selectedGroup, groupOptions]);

  const bookingsByColumn = useMemo(() => {
    const result = Object.fromEntries(columns.map((column) => [column.key, []]));

    for (const booking of filteredBookings) {
      const key = rangeMode === "day" ? booking[groupKey] : booking.dateKey;
      if (!result[key]) continue;
      result[key].push(booking);
    }

    for (const key of Object.keys(result)) {
      result[key] = layoutScheduleEvents(result[key]);
    }

    return result;
  }, [columns, filteredBookings, groupKey, rangeMode]);


  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.scrollTop = 0;
  }, [viewDate]);

  const gridBodyHeight =
    ((timeBounds.end - timeBounds.start) / 60) * hourHeight;
  const gridHeight = SCHEDULE_GRID_TOP_PADDING + gridBodyHeight;
  const desktopTimeColumnWidth = 70;
  const mobileTimeColumnWidth = 48;
  const desktopColumnWidth = Math.max(212, staffColumnWidth);
  const mobileColumnWidth = Math.max(214, Math.min(232, staffColumnWidth));
  const desktopScheduleWidth =
    desktopTimeColumnWidth + columns.length * desktopColumnWidth;
  const mobileScheduleWidth =
    mobileTimeColumnWidth + columns.length * mobileColumnWidth;
  const desktopTemplateColumns = `${desktopTimeColumnWidth}px repeat(${columns.length}, ${desktopColumnWidth}px)`;
  const mobileTemplateColumns = `${mobileTimeColumnWidth}px repeat(${columns.length}, ${mobileColumnWidth}px)`;
  const quarterMarks = useMemo(() => {
    const marks = [];

    for (let minute = timeBounds.start; minute <= timeBounds.end; minute += 15) {
      marks.push({
        minute,
        isHour: minute % 60 === 0,
      });
    }

    return marks;
  }, [timeBounds.start, timeBounds.end]);
  const topForMinute = (minute) =>
    SCHEDULE_GRID_TOP_PADDING +
    ((minute - timeBounds.start) / 60) * hourHeight;
  const anyBookings = Object.values(bookingsByColumn).some((items) => items.length > 0);
  const now = new Date(nowTs);
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const todayKey = toISODateKey(now);
  const showNowLine =
    nowMinute >= timeBounds.start &&
    nowMinute <= timeBounds.end;
  const moveDays = rangeMode === "week" ? 7 : 1;
  const rangeModeItems = [
    { key: "day", label: "День" },
    { key: "week", label: "Тиждень" },
    { key: "month", label: "Місяць" },
  ];
  const weekdayLabel = viewDate.toLocaleDateString("uk-UA", {
    weekday: "long",
  });
  const selectedDateKey = toISODateKey(viewDate);
  const currentTimeLabel = now.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const weekStripDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const agendaGroups = useMemo(() => {
    return visibleDates
      .map((date) => {
        const dateKey = toISODateKey(date);
        const items = filteredBookings
          .filter((booking) => booking.dateKey === dateKey)
          .sort((a, b) => a.startMin - b.startMin);
        const totalPrice = items.reduce(
          (sum, booking) => sum + (Number(booking.price) || 0),
          0,
        );

        return { date, dateKey, items, totalPrice };
      })
      .filter((group) => group.items.length > 0);
  }, [filteredBookings, visibleDates]);
  const agendaTotalCount = agendaGroups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );
  const agendaTotalPrice = agendaGroups.reduce(
    (sum, group) => sum + group.totalPrice,
    0,
  );
  const formatPrice = (value) =>
    Number(value || 0).toLocaleString("uk-UA", {
      maximumFractionDigits: 0,
    });
  const navigateRange = (direction) => {
    if (rangeMode === "month") {
      handleViewDateChange(addMonthsSafe(viewDate, direction));
      return;
    }

    handleViewDateChange(addDays(viewDate, direction * moveDays));
  };

  const renderScheduleGrid = ({ compact = false } = {}) => {
    const scheduleWidth = compact ? mobileScheduleWidth : desktopScheduleWidth;
    const templateColumns = compact ? mobileTemplateColumns : desktopTemplateColumns;
    const headerHeight = compact ? "82px" : "112px";
    const bodyHeight = compact
      ? "calc(100dvh - 248px)"
      : "clamp(420px, calc(100dvh - 210px), 590px)";

    return (
      <div className="min-w-0 bg-white">
        <div
          ref={compact ? null : headerScrollRef}
          className="calendar-day-scroll overflow-x-auto overflow-y-hidden border-b border-[#ebeef3] bg-white"
          onScroll={
            compact
              ? undefined
              : (event) => syncHorizontalScroll(event.currentTarget, scrollRef)
          }
        >
          <div className="min-w-full" style={{ minWidth: scheduleWidth }}>
            <div
              className="grid bg-white"
              style={{ gridTemplateColumns: templateColumns }}
            >
              <div
                className={cn(
                  "sticky left-0 z-40 border-r border-[#ebeef3] bg-white",
                  compact
                    ? "flex items-end justify-end px-2 pb-3 text-[10px] font-bold text-[#969da8]"
                    : "px-3 py-3",
                )}
                style={{ height: headerHeight }}
              >
                {compact ? (
                  <span>час</span>
                ) : (
                  <div className="grid h-full content-center gap-1.5">
                    <div className="overflow-hidden rounded-md border border-[#e2e6ed] bg-[#fafbfc]">
                      <div className="grid grid-cols-[22px_1fr_22px] items-center">
                        <button
                          type="button"
                          onClick={() => adjustStaffColumnWidth(-12)}
                          className="flex h-7 items-center justify-center text-[#6f7782] hover:bg-white"
                          aria-label="Зменшити ширину колонок"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-0 text-center leading-none">
                          <span className="block text-[7px] font-black uppercase tracking-[0.08em] text-[#9aa1aa]">
                            ширина
                          </span>
                          <span className="mt-0.5 block text-[9px] font-black text-[#1f2329]">
                            {staffColumnWidth}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustStaffColumnWidth(12)}
                          className="flex h-7 items-center justify-center text-[#6f7782] hover:bg-white"
                          aria-label="Збільшити ширину колонок"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-md border border-[#e2e6ed] bg-[#fafbfc]">
                      <div className="grid grid-cols-[22px_1fr_22px] items-center">
                        <button
                          type="button"
                          onClick={() => adjustHourHeight(-8)}
                          className="flex h-7 items-center justify-center text-[#6f7782] hover:bg-white"
                          aria-label="Зменшити висоту рядків"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-0 text-center leading-none">
                          <span className="block text-[7px] font-black uppercase tracking-[0.08em] text-[#9aa1aa]">
                            висота
                          </span>
                          <span className="mt-0.5 block text-[9px] font-black text-[#1f2329]">
                            {hourHeight}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustHourHeight(8)}
                          className="flex h-7 items-center justify-center text-[#6f7782] hover:bg-white"
                          aria-label="Збільшити висоту рядків"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {columns.map((column) => {
                const summaryCounts = scheduleSummaryByColumn[column.key] || {
                  confirmed: 0,
                  canceled: 0,
                  pending: 0,
                  archived: 0,
                };
                const totalCount =
                  summaryCounts.confirmed +
                  summaryCounts.canceled +
                  summaryCounts.pending +
                  summaryCounts.archived;
                const columnWorkStatus =
                  column.type === "staff"
                    ? getMasterWorkStatus(column, viewDate)
                    : null;

                return (
                  <div
                    key={column.key}
                    className={cn(
                      "relative min-w-0 border-r border-[#ebeef3] bg-white",
                      compact ? "px-3 py-3" : "px-4 py-3",
                    )}
                    style={{ height: headerHeight }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {column.type === "date" ? (
                        <div
                          className={cn(
                            "flex shrink-0 flex-col items-center justify-center rounded-full bg-[#ffe1e8] text-[#ff3369]",
                            compact ? "h-10 w-10" : "h-11 w-11",
                          )}
                        >
                          <span className="text-[9px] font-black uppercase leading-none">
                            {column.date
                              .toLocaleDateString("uk-UA", { weekday: "short" })
                              .slice(0, 2)}
                          </span>
                          <span className="mt-0.5 text-sm font-black leading-none">
                            {column.date.getDate()}
                          </span>
                        </div>
                      ) : (
                        <Avatar
                          name={column.name}
                          photoUrl={column.photoUrl}
                          className={cn(
                            "rounded-full",
                            compact ? "h-10 w-10" : "h-11 w-11",
                          )}
                        />
                      )}

                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate font-black leading-tight text-[#1f2329]",
                            compact ? "text-[14px]" : "text-[13px]",
                          )}
                        >
                          {column.name}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] font-medium leading-tight text-[#8a919a]">
                          {column.type === "date"
                            ? formatDateLongUA(toISODateKey(column.date))
                            : columnWorkStatus?.helper || column.role || "09:00-17:00"}
                        </p>
                      </div>
                    </div>

                    {!compact && (
                      <div className="absolute bottom-2 right-3 flex items-center gap-2 text-[10px] font-black text-[#89919b]">
                        <span>{totalCount}</span>
                        <CircleCheckBig className="h-3 w-3 text-[#00a35d]" />
                        <span>{summaryCounts.confirmed}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          ref={compact ? null : scrollRef}
          className="calendar-day-scroll relative overflow-auto bg-white"
          style={{ height: bodyHeight }}
          onScroll={
            compact
              ? undefined
              : (event) => syncHorizontalScroll(event.currentTarget, headerScrollRef)
          }
        >
          {!anyBookings && (
            <div className="pointer-events-none sticky left-0 top-0 z-50 h-0 w-full">
              <div
                className="flex items-center justify-center px-4"
                style={{ height: Math.min(gridHeight, 520) }}
              >
                <div className="pointer-events-auto w-[min(340px,calc(100%-28px))] rounded-[18px] border border-dashed border-[#cfd6df] bg-white/90 p-5 text-center shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#ffe1e8] text-[#ff3369]">
                    {loading ? (
                      <Sparkles className="h-5 w-5 animate-pulse" />
                    ) : (
                      <CalendarDays className="h-5 w-5" />
                    )}
                  </div>
                  <p className="mt-3 text-sm font-black text-[#1f2329]">
                    {loading ? "Завантажуємо записи" : "Записів немає"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="min-w-full" style={{ minWidth: scheduleWidth }}>
            <div
              className="relative grid"
              style={{ gridTemplateColumns: templateColumns }}
            >
              <div
                className="sticky left-0 z-40 border-r border-[#ebeef3] bg-white"
                style={{ height: gridHeight }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className={cn(
                      "absolute right-2 -translate-y-2 font-medium text-[#8f98a3]",
                      compact ? "text-[11px]" : "text-[10px]",
                    )}
                    style={{ top: topForMinute(hour * 60) }}
                  >
                    {pad2(hour)}:00
                  </div>
                ))}

                {quarterMarks
                  .filter((mark) => !mark.isHour)
                  .map((mark) => (
                    <div
                      key={`label-${mark.minute}`}
                      className="absolute right-2 -translate-y-1/2 text-[10px] font-medium text-[#b6bdc5]"
                      style={{ top: topForMinute(mark.minute) }}
                    >
                      {pad2(mark.minute % 60)}
                    </div>
                  ))}

                {showNowLine && visibleDateKeys.has(todayKey) && (
                  <div
                    className="absolute inset-x-0 z-30 border-t border-[#ff245d]"
                    style={{ top: topForMinute(nowMinute) }}
                  >
                    <span className="absolute -right-1 -top-[5px] h-2.5 w-2.5 rounded-full bg-[#ff245d]" />
                  </div>
                )}
              </div>

              {columns.map((column) => {
                const columnBookings = bookingsByColumn[column.key] || [];
                const isTodayColumn =
                  (column.type === "date" &&
                    toISODateKey(column.date) === todayKey) ||
                  (rangeMode === "day" && visibleDateKeys.has(todayKey));

                return (
                  <div
                    key={column.key}
                    className="relative border-r border-[#ebeef3] bg-white"
                    style={{ height: gridHeight }}
                  >
                    {quarterMarks.map((mark) => (
                      <div
                        key={mark.minute}
                        className={cn(
                          "absolute inset-x-0 border-t",
                          mark.isHour
                            ? "border-[#edf0f4]"
                            : "border-dashed border-[#e4e8ee]",
                        )}
                        style={{ top: topForMinute(mark.minute) }}
                      />
                    ))}

                    {showNowLine && isTodayColumn && (
                      <div
                        className="absolute inset-x-0 z-20 border-t border-[#ff245d]"
                        style={{ top: topForMinute(nowMinute) }}
                      >
                        <span className="absolute -left-1 -top-[5px] h-2.5 w-2.5 rounded-full bg-[#ff245d]" />
                      </div>
                    )}

                    {columnBookings.map((booking) => {
                      const tone = scheduleCardTone(booking, nowTs);
                      const top = topForMinute(
                        Math.max(booking.startMin, timeBounds.start),
                      );
                      const clippedEnd = Math.min(booking.endMin, timeBounds.end);
                      const height = Math.max(
                        SCHEDULE_MIN_CARD_HEIGHT,
                        ((clippedEnd -
                          Math.max(booking.startMin, timeBounds.start)) /
                          60) *
                          hourHeight -
                          8,
                      );
                      const width = `calc(${100 / booking.laneCount}% - ${compact ? 8 : 10}px)`;
                      const left = `calc(${(100 / booking.laneCount) * booking.lane}% + ${compact ? 4 : 5}px)`;
                      const visualStatus = scheduleVisualStatus(booking, nowTs);
                      const StatusIcon = scheduleStatusIcon(booking, nowTs);
                      const statusLabel = scheduleStatusLabel(booking, nowTs);
                      const startLabel =
                        parseTimeToHHMM(booking.raw.time) ||
                        scheduleTimeLabel(booking.startMin);
                      const endLabel = scheduleTimeLabel(booking.endMin);
                      const showClientLine = height >= 62;
                      const showServiceLine = height >= 84;

                      return (
                        <button
                          key={`${booking.id}-${booking.dateKey}-${booking.startMin}`}
                          type="button"
                          onClick={() => booking.id != null && onOpenBooking?.(booking.id)}
                          className={cn(
                            "group absolute z-10 overflow-visible rounded-[7px] text-left transition hover:z-30 focus:outline-none focus:ring-2 focus:ring-[#ff245d]/25",
                            visualStatus === "canceled" && "opacity-70",
                          )}
                          style={{
                            top: top + 4,
                            height,
                            left,
                            width,
                            background: tone.bg,
                            boxShadow: compact
                              ? "none"
                              : "0 8px 18px rgba(15,23,42,0.04)",
                          }}
                        >
                          <div
                            className={cn(
                              "pointer-events-none absolute left-1/2 z-[90] hidden w-[270px] -translate-x-1/2 rounded-[14px] border bg-white p-3 text-left shadow-[0_18px_44px_rgba(15,23,42,0.18)] group-hover:block group-focus-visible:block",
                              compact ? "bottom-full mb-2" : "top-full mt-2",
                            )}
                            style={{ borderColor: tone.border }}
                          >
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-black"
                                style={{
                                  backgroundColor: tone.soft,
                                  color: tone.accent,
                                }}
                              >
                                <StatusIcon className="h-3.5 w-3.5" />
                                {statusLabel}
                              </span>
                              {booking.price != null && (
                                <span className="text-[12px] font-black text-[#00a35d]">
                                  ₴{formatPrice(booking.price)}
                                </span>
                              )}
                            </div>

                            <p className="text-[13px] font-black text-[#15171d]">
                              {booking.clientName}
                            </p>
                            <p className="mt-1 text-[12px] font-semibold text-[#59616d]">
                              {booking.serviceName}
                            </p>

                            <div className="mt-3 grid gap-1.5 text-[11px] font-bold text-[#7b8490]">
                              <span className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" />
                                {startLabel} - {endLabel}
                              </span>
                              <span className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5" />
                                {booking.staffName}
                              </span>
                              {booking.clientPhone && (
                                <span className="flex items-center gap-2">
                                  <Phone className="h-3.5 w-3.5" />
                                  {booking.clientPhone}
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            className="absolute inset-y-0 left-0 w-1"
                            style={{ backgroundColor: tone.accent }}
                          />

                          <div className="absolute right-2 top-2 flex items-center gap-1">
                            {booking.price != null && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00a35d] text-[11px] font-black text-white">
                                ₴
                              </span>
                            )}
                            <span
                              className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                              style={{ backgroundColor: tone.accent }}
                            >
                              <StatusIcon className="h-3.5 w-3.5" />
                            </span>
                          </div>

                          <div className="flex h-full min-h-0 flex-col px-2.5 py-2 pl-3.5 pr-8">
                            <p
                              className={cn(
                                "truncate font-black leading-tight text-[#181b20]",
                                compact ? "text-[16px]" : "text-[12px]",
                              )}
                            >
                              {startLabel} - {endLabel}
                            </p>
                            {showClientLine && (
                              <p
                                className={cn(
                                  "mt-1 truncate font-medium leading-snug text-[#181b20]",
                                  compact ? "text-[15px]" : "text-[11px]",
                                )}
                              >
                                {booking.clientName}
                                <span className="font-normal"> · {booking.serviceName}</span>
                              </p>
                            )}
                            {showServiceLine && !compact && (
                              <p className="mt-0.5 truncate text-[10px] font-medium leading-tight text-[#717b87]">
                                {booking.staffName}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFullDesign = () => {
    const desktopNavItems = [
      CalendarDays,
      LayoutGrid,
      Clock,
      Users,
      ChartColumn,
      SlidersHorizontal,
      CheckCheck,
      Megaphone,
      Store,
    ];
    const mobileNavItems = [
      CalendarDays,
      Users,
      CheckCheck,
      Megaphone,
      Store,
    ];

    return (
      <>
        <div
          className="hidden h-[min(760px,calc(100dvh-32px))] min-h-[620px] overflow-hidden rounded-[30px] border border-[#d8dde5] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] lg:grid"
          style={{
            gridTemplateColumns: agendaCollapsed
              ? "48px minmax(0,1fr) 46px"
              : "48px minmax(0,1fr) 326px",
          }}
        >
          <aside className="flex flex-col items-center justify-between bg-[#171b23] px-2 py-3 text-white">
            <div className="grid gap-2">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
                aria-label="Назад"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {desktopNavItems.map((Icon, index) => (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-white/58 transition hover:bg-white/10 hover:text-white",
                    index === 1 && "bg-white/12 text-white",
                  )}
                  aria-label={`Навігація ${index + 1}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[10px] font-black">
              AD
            </div>
          </aside>

          <main className="min-w-0 bg-white">
            <div className="flex h-[58px] items-center justify-between gap-3 border-b border-[#e6e9ef] px-4">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateRange(-1)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e1e5eb] bg-white text-[#59616d]"
                  aria-label="Попередній період"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarOpen(true)}
                  className="flex h-8 min-w-[210px] items-center gap-2 rounded-md border border-[#e1e5eb] bg-white px-3 text-[11px] font-black text-[#15171d]"
                  aria-label="Відкрити календар"
                >
                  <CalendarDays className="h-3.5 w-3.5 text-[#ff3369]" />
                  <span className="truncate">{formatDateLongUA(toISODateKey(viewDate))}</span>
                  <ChevronDown className="ml-auto h-3.5 w-3.5 text-[#8b94a0]" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateRange(1)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e1e5eb] bg-white text-[#59616d]"
                  aria-label="Наступний період"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>

                <div className="ml-2 flex h-8 rounded-md border border-[#e1e5eb] bg-[#fafbfc] p-0.5">
                  {rangeModeItems.map((item) => {
                    const active = rangeMode === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleRangeModeChange(item.key)}
                        className={cn(
                          "rounded px-2.5 text-[10px] font-black transition",
                          active
                            ? "bg-white text-[#15171d] shadow-sm"
                            : "text-[#8b94a0] hover:text-[#15171d]",
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex min-w-0 items-center justify-end gap-2">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-8 max-w-[150px] rounded-md border border-[#e1e5eb] bg-white px-2 text-[11px] font-black text-[#15171d] outline-none"
                  aria-label="Фільтр статусу"
                >
                  {SCHEDULE_STATUS_FILTERS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label} ({statusCounts[item.key] || 0})
                    </option>
                  ))}
                </select>
                <select
                  value={selectedGroup}
                  onChange={(event) => handleSelectedGroupChange(event.target.value)}
                  className="h-8 max-w-[170px] rounded-md border border-[#e1e5eb] bg-white px-2 text-[11px] font-black text-[#15171d] outline-none"
                  aria-label="Фільтр майстрів"
                >
                  <option value="all">Усі майстри</option>
                  {groupOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {viewSwitcher}
              </div>
            </div>
            {renderScheduleGrid({ compact: false })}
          </main>

          <aside className="border-l border-[#e6e9ef] bg-white">
            {agendaCollapsed ? (
              <div className="flex h-full flex-col items-center gap-4 bg-[#fbfcfe] px-1 py-3">
                <button
                  type="button"
                  onClick={() => setAgendaCollapsed(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e1e5eb] bg-white text-[#59616d] shadow-sm"
                  aria-label="Розгорнути список записів"
                  title="Розгорнути список записів"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="mt-2 rotate-90 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.12em] text-[#8b94a0]">
                  записи
                </span>
              </div>
            ) : (
              <>
            <div className="flex h-[46px] items-center justify-between border-b border-[#e6e9ef] px-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAgendaCollapsed(true)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#59616d]"
                  aria-label="Згорнути список записів"
                  title="Згорнути список записів"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <p className="text-[13px] font-black text-[#15171d]">
                  Список записів
                </p>
              </div>
              <MoreHorizontal className="h-4 w-4 text-[#8c95a1]" />
            </div>

            <div className="calendar-day-scroll h-[calc(100%-46px)] overflow-y-auto px-4 py-3">
              <div className="mb-4 rounded-md border border-[#e5e9ef] bg-[#fbfcfe] px-3 py-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#8f98a3]">
                  <span>Today</span>
                  <span>
                    {scheduleTimeLabel(timeBounds.start)} - {scheduleTimeLabel(timeBounds.end)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[15px] font-black text-[#15171d]">
                      ₴{formatPrice(agendaTotalPrice)}
                    </p>
                    <p className="text-[9px] font-bold uppercase text-[#9aa2ad]">
                      дохід
                    </p>
                  </div>
                  <div>
                    <p className="text-[15px] font-black text-[#15171d]">
                      {agendaTotalCount}
                    </p>
                    <p className="text-[9px] font-bold uppercase text-[#9aa2ad]">
                      записи
                    </p>
                  </div>
                  <div>
                    <p className="text-[15px] font-black text-[#15171d]">
                      {columns.length}
                    </p>
                    <p className="text-[9px] font-bold uppercase text-[#9aa2ad]">
                      майстри
                    </p>
                  </div>
                </div>
              </div>

              {agendaGroups.length === 0 ? (
                <div className="rounded-md border border-dashed border-[#d7dee8] p-5 text-center">
                  <CalendarDays className="mx-auto h-6 w-6 text-[#a1aab5]" />
                  <p className="mt-3 text-[13px] font-black text-[#15171d]">
                    Записів немає
                  </p>
                </div>
              ) : (
                agendaGroups.map((group) => (
                  <div key={group.dateKey} className="mb-5">
                    <div className="mb-2 flex items-center justify-between text-[11px] font-black text-[#5f6875]">
                      <span className="capitalize">
                        {group.date.toLocaleDateString("uk-UA", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="rounded-full border border-[#e4e8ee] px-2 py-0.5 text-[9px] uppercase text-[#8b94a0]">
                        Confirmed
                      </span>
                    </div>

                    <div className="grid gap-3">
                      {group.items.map((booking) => {
                        const tone = scheduleCardTone(booking, nowTs);
                        const startLabel =
                          parseTimeToHHMM(booking.raw.time) ||
                          scheduleTimeLabel(booking.startMin);
                        const endLabel = scheduleTimeLabel(booking.endMin);
                        const StatusIcon = scheduleStatusIcon(booking, nowTs);

                        return (
                          <button
                            key={`agenda-${booking.id}-${booking.dateKey}-${booking.startMin}`}
                            type="button"
                            onClick={() => booking.id != null && onOpenBooking?.(booking.id)}
                            className="grid grid-cols-[42px_1fr_auto] gap-3 rounded-md bg-white py-1 text-left transition hover:bg-[#fafbfc]"
                          >
                            <div className="pt-1 text-[10px] font-bold text-[#8b94a0]">
                              {startLabel}
                            </div>
                            <div className="min-w-0 border-l-2 pl-3" style={{ borderColor: tone.accent }}>
                              <p className="truncate text-[12px] font-black text-[#15171d]">
                                {booking.clientName}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] font-medium text-[#8b94a0]">
                                {booking.serviceName} · {endLabel}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusIcon className="h-4 w-4" style={{ color: tone.accent }} />
                              <Avatar
                                name={booking.staffName || booking.clientName}
                                photoUrl={booking.staffPhotoUrl}
                                className="h-7 w-7 rounded-full"
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
              </>
            )}
          </aside>
        </div>

        <div className="relative mx-auto flex min-h-[100dvh] max-w-[520px] flex-col overflow-hidden bg-white pb-[112px] text-[#15171d] lg:hidden">
          <div className="sticky top-0 z-[120] border-b border-[#e8ebf0] bg-white">
            <div className="flex items-center justify-between px-7 pb-5 pt-6">
              <span className="text-[23px] font-black leading-none">
                {currentTimeLabel}
              </span>
              <div className="flex items-center gap-2 text-[#15171d]">
                <span className="h-3 w-4 rounded-[2px] border-2 border-[#15171d]" />
                <span className="h-3 w-4 rounded-[2px] border-2 border-[#15171d]" />
              </div>
            </div>

            <div className="grid grid-cols-[64px_1fr_48px_38px] items-center px-6 pb-4">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center text-[#15171d]"
                aria-label="Сповіщення"
              >
                <Bell className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={() => setCalendarOpen(true)}
                className="border-l border-[#e4e7ec] pl-5 text-left"
              >
                <span className="flex items-center gap-2 text-[21px] font-black leading-tight">
                  {viewDate.toLocaleDateString("uk-UA", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                  <ChevronDown className="h-5 w-5" />
                </span>
                <span className="mt-1 block text-[16px] font-medium text-[#15171d]">
                  {scheduleTimeLabel(timeBounds.start)} - {scheduleTimeLabel(timeBounds.end)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((value) => !value)}
                className="flex h-11 w-11 items-center justify-center"
                aria-label="Фільтри"
              >
                <SlidersHorizontal className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((value) => !value)}
                className="flex h-11 w-8 items-center justify-center"
                aria-label="Меню"
              >
                <MoreVertical className="h-7 w-7" />
              </button>
            </div>

            <div className="grid grid-cols-7 px-5 pb-3 text-center">
              {weekStripDays.map((date) => {
                const key = toISODateKey(date);
                const active = key === selectedDateKey;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleViewDateChange(date)}
                    className="flex h-[64px] flex-col items-center justify-center"
                  >
                    <span className="text-[13px] font-medium uppercase text-[#858b94]">
                      {date.toLocaleDateString("uk-UA", { weekday: "short" }).slice(0, 3)}
                    </span>
                    <span
                      className={cn(
                        "mt-2 flex h-8 w-8 items-center justify-center rounded-full text-[20px] font-medium",
                        active ? "bg-[#ffe1e8] text-[#ff3369]" : "text-[#15171d]",
                      )}
                    >
                      {date.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className={cn(
                "grid-cols-2 gap-2 border-t border-[#eef1f5] px-5 py-3",
                mobileFiltersOpen ? "grid" : "hidden",
              )}
            >
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-[14px] border border-[#e0e5ec] bg-white px-3 text-[13px] font-black outline-none"
              >
                {SCHEDULE_STATUS_FILTERS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedGroup}
                onChange={(event) => handleSelectedGroupChange(event.target.value)}
                className="h-11 rounded-[14px] border border-[#e0e5ec] bg-white px-3 text-[13px] font-black outline-none"
              >
                <option value="all">Усі майстри</option>
                {groupOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {renderScheduleGrid({ compact: true })}

          <button
            type="button"
            className="fixed bottom-[86px] right-6 z-[140] flex h-16 w-16 items-center justify-center rounded-full bg-[#111318] text-white shadow-[0_14px_34px_rgba(15,23,42,0.35)]"
            aria-label="Додати запис"
          >
            <Plus className="h-9 w-9" />
          </button>

          <nav className="fixed inset-x-0 bottom-0 z-[130] mx-auto flex h-[86px] max-w-[520px] items-center justify-around bg-[#111318] px-6 text-white">
            {mobileNavItems.map((Icon, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl",
                  index === 0 ? "text-white" : "text-white/45",
                )}
                aria-label={`Мобільна навігація ${index + 1}`}
              >
                <Icon className="h-7 w-7" />
              </button>
            ))}
          </nav>
        </div>

        {calendarOpen && (
          <div
            className="fixed inset-0 z-[240] flex items-start justify-center bg-[#111318]/35 p-4 pt-24 backdrop-blur-[4px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setCalendarOpen(false);
              }
            }}
          >
            <div
              className="w-full max-w-[360px]"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <ScheduleMiniCalendar
                viewDate={viewDate}
                countsByDate={countsByDate}
                onNavigateMonth={setViewDate}
                onSelectDate={(date) => {
                  handleViewDateChange(date);
                  setCalendarOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </>
    );
  };

  return renderFullDesign();
}
