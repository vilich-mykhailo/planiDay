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

const SCHEDULE_DAY_ALIASES = {
  mon: "mon",
  monday: "mon",
  понеділок: "mon",
  пн: "mon",
  tue: "tue",
  tuesday: "tue",
  вівторок: "tue",
  вт: "tue",
  wed: "wed",
  wednesday: "wed",
  середа: "wed",
  ср: "wed",
  thu: "thu",
  thursday: "thu",
  четвер: "thu",
  чт: "thu",
  fri: "fri",
  friday: "fri",
  пʼятниця: "fri",
  "п'ятниця": "fri",
  пт: "fri",
  sat: "sat",
  saturday: "sat",
  субота: "sat",
  сб: "sat",
  sun: "sun",
  sunday: "sun",
  неділя: "sun",
  нд: "sun",
};

function scheduleDayKey(value) {
  if (value == null) return "";

  if (typeof value === "number" || /^\d+$/.test(String(value).trim())) {
    const dayNumber = Number(value);

    if (dayNumber === 0) return "sun";
    if (dayNumber >= 1 && dayNumber <= 7) {
      return ["mon", "tue", "wed", "thu", "fri", "sat", "sun"][
        dayNumber - 1
      ];
    }
  }

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[._\s-]+/g, "");

  return (
    MASTER_ENUM_TO_KEY[String(value).trim().toUpperCase()] ||
    SCHEDULE_DAY_ALIASES[normalized] ||
    ""
  );
}

function scheduleObject(value) {
  if (!value) return null;
  if (typeof value === "object") return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

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
  const list =
    [
      master?.scheduleExceptions,
      master?.workScheduleExceptions,
      master?.workingHoursExceptions,
      master?.specialDates,
      master?.specialDays,
      master?.exceptions,
    ].find((value) => Array.isArray(value) && value.length > 0) || [];

  return Array.isArray(list)
    ? list.map((item) => ({
        ...item,
        date: scheduleDateKey(
          item?.date ||
            item?.dateKey ||
            item?.day ||
            item?.exceptionDate ||
            item?.specialDate,
        ),
        enabled: normalizeEnabled(item?.enabled, true),
        start:
          item?.start ||
          item?.startTime ||
          item?.from ||
          item?.open ||
          (Number.isFinite(Number(item?.startMin))
            ? scheduleTimeLabel(Number(item.startMin))
            : null),
        end:
          item?.end ||
          item?.endTime ||
          item?.to ||
          item?.close ||
          (Number.isFinite(Number(item?.endMin))
            ? scheduleTimeLabel(Number(item.endMin))
            : null),
      }))
    : [];
}

function masterScheduleWindowFromRow(row, fallbackEnabled = true) {
  const interval =
    (Array.isArray(row?.intervals) && row.intervals[0]) ||
    (Array.isArray(row?.periods) && row.periods[0]) ||
    (Array.isArray(row?.slots) && row.slots[0]) ||
    null;
  const explicitlyClosed =
    row?.closed === true ||
    row?.isClosed === true ||
    row?.open === false ||
    row?.dayOff === true ||
    row?.isDayOff === true;
  const enabledValue =
    row?.enabled ??
    row?.isOpen ??
    row?.isWorking ??
    row?.working ??
    row?.active;
  const enabled = explicitlyClosed
    ? false
    : normalizeEnabled(enabledValue, fallbackEnabled);

  if (!enabled) {
    return { isWorking: false, startMin: null, endMin: null };
  }

  const rawStart =
    row?.start ??
    row?.startTime ??
    row?.from ??
    row?.fromTime ??
    row?.open ??
    row?.openingTime ??
    row?.opensAt ??
    row?.openTime ??
    row?.workingFrom ??
    row?.workStart ??
    interval?.start ??
    interval?.startTime ??
    interval?.from;
  const rawEnd =
    row?.end ??
    row?.endTime ??
    row?.to ??
    row?.toTime ??
    row?.close ??
    row?.closingTime ??
    row?.closesAt ??
    row?.closeTime ??
    row?.workingTo ??
    row?.workEnd ??
    interval?.end ??
    interval?.endTime ??
    interval?.to;
  const startMinuteValue =
    row?.startMin ?? row?.fromMin ?? row?.openMin ?? interval?.startMin;
  const endMinuteValue =
    row?.endMin ?? row?.toMin ?? row?.closeMin ?? interval?.endMin;
  const startMin = Number.isFinite(Number(startMinuteValue))
    ? Number(startMinuteValue)
    : scheduleMinutesFromTime(rawStart);
  const endMin = Number.isFinite(Number(endMinuteValue))
    ? Number(endMinuteValue)
    : scheduleMinutesFromTime(rawEnd);

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
  const scheduleDays =
    [
      master?.scheduleDays,
      master?.workScheduleDays,
      master?.workingHoursDays,
      master?.weeklySchedule,
    ].find((value) => Array.isArray(value) && value.length > 0) || [];

  if (scheduleDays.length > 0) {
    const row = scheduleDays.find((item) => {
      return (
        scheduleDayKey(
          item?.day ??
            item?.dayOfWeek ??
            item?.weekday ??
            item?.weekDay,
        ) === dayKey
      );
    });

    if (!row) {
      return { isWorking: false, startMin: null, endMin: null, source: "schedule" };
    }

    return {
      ...masterScheduleWindowFromRow(row, true),
      source: "schedule",
    };
  }

  const schedule =
    [
      master?.schedule,
      master?.workSchedule,
      master?.workingHours,
      master?.openingHours,
      master?.businessHours,
      master?.workHours,
      master?.hours,
    ]
      .map(scheduleObject)
      .find(Boolean) || null;
  const nestedSchedule =
    scheduleObject(schedule?.days) ||
    scheduleObject(schedule?.week) ||
    scheduleObject(schedule?.weekly) ||
    schedule;

  if (nestedSchedule && !Array.isArray(nestedSchedule)) {
    const day = Object.entries(nestedSchedule).find(
      ([key]) => scheduleDayKey(key) === dayKey,
    )?.[1];

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

function getStudioScheduleSources(studio) {
  const hasContent = (value) =>
    Array.isArray(value)
      ? value.length > 0
      : Boolean(
          value &&
            typeof value === "object" &&
            Object.keys(value).length > 0,
        );
  const directStudioSchedule =
    studio &&
    typeof studio === "object" &&
    (Object.keys(studio).some((key) => scheduleDayKey(key)) ||
      studio.days ||
      studio.weekdays ||
      studio.weekDays ||
      studio.workingDays)
      ? studio
      : null;
  const roots = [
    directStudioSchedule,
    studio?.schedule,
    studio?.workSchedule,
    studio?.workingHours,
    studio?.workingSchedule,
    studio?.workHours,
    studio?.hours,
    studio?.openingHours,
    studio?.businessHours,
    studio?.studioSchedule,
    studio?.scheduleSettings,
    studio?.settings?.schedule,
    studio?.settings?.workSchedule,
    studio?.settings?.workingHours,
    studio?.settings?.workingSchedule,
    studio?.settings?.workHours,
    studio?.settings?.hours,
    studio?.settings?.openingHours,
    studio?.settings?.businessHours,
  ]
    .map(scheduleObject)
    .filter(hasContent);

  return roots.flatMap((source) => [
    source,
    scheduleObject(source?.days),
    scheduleObject(source?.weekdays),
    scheduleObject(source?.weekDays),
    scheduleObject(source?.workingDays),
    scheduleObject(source?.items),
    scheduleObject(source?.entries),
    scheduleObject(source?.schedule),
  ]).filter(hasContent);
}

function hasStudioSchedulePayload(studio) {
  return (
    getStudioScheduleSources(studio).length > 0 ||
    [
      studio?.scheduleDays,
      studio?.workScheduleDays,
      studio?.openingHoursDays,
      studio?.workingHoursDays,
    ].some((value) => Array.isArray(value) && value.length > 0)
  );
}

function pickStudioScheduleEntry(source, date) {
  if (!source) return null;

  const dateKey = toISODateKey(date);
  const weekdayIndex = (date.getDay() + 6) % 7;
  const longKeys = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const shortKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const ukKeys = [
    "Понеділок",
    "Вівторок",
    "Середа",
    "Четвер",
    "П'ятниця",
    "Субота",
    "Неділя",
  ];

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
          scheduleDateKey(item?.date || item?.dateKey) === dateKey ||
          Number(item?.dayOfWeek) === weekdayIndex + 1 ||
          Number(item?.dayOfWeek) === (weekdayIndex + 1) % 7 ||
          Number(item?.weekday) === weekdayIndex ||
          Number(item?.weekday) === weekdayIndex + 1 ||
          rawDay === longKeys[weekdayIndex] ||
          rawDay === shortKeys[weekdayIndex] ||
          rawDay === ukKeys[weekdayIndex].toLowerCase()
        );
      }) || null
    );
  }

  if (typeof source === "object") {
    return (
      source[dateKey] ||
      source[longKeys[weekdayIndex]] ||
      source[shortKeys[weekdayIndex]] ||
      source[ukKeys[weekdayIndex]] ||
      source[String(weekdayIndex)] ||
      source[String(weekdayIndex + 1)] ||
      null
    );
  }

  return null;
}

function normalizeStudioSchedulePayload(data, studioId) {
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
      list.find((item) => String(item?.id) === String(studioId)) ||
      list.find(hasStudioSchedulePayload) ||
      direct
    );
  }

  return direct;
}

function getStudioScheduleWindow(studio, date = new Date()) {
  if (!studio) return null;

  const dateKey = toISODateKey(date);
  const studioSchedule = getStudioScheduleSources(studio)[0] || null;
  const exceptionSources = [
    studio.scheduleExceptions,
    studio.openingExceptions,
    studio.workScheduleExceptions,
    studio.workingHoursExceptions,
    studio.settings?.scheduleExceptions,
    studio.settings?.openingExceptions,
    studio.settings?.workScheduleExceptions,
    studio.specialDates,
    studio.specialDays,
    studio.specialSchedule,
    studio.holidays,
    studioSchedule?.scheduleExceptions,
    studioSchedule?.exceptions,
    studioSchedule?.specialDates,
    studioSchedule?.specialDays,
  ];
  const exceptionValue = exceptionSources.find(
    (value) => {
      const objectValue = scheduleObject(value);

      return (
        (Array.isArray(value) && value.length > 0) ||
        (!Array.isArray(value) &&
          objectValue &&
          Object.keys(objectValue).length > 0)
      );
    },
  );
  const exceptionObject = scheduleObject(exceptionValue);
  const exceptions = Array.isArray(exceptionValue)
    ? exceptionValue
    : exceptionObject
      ? Object.entries(exceptionObject).map(([date, value]) => ({
          ...(value && typeof value === "object" ? value : {}),
          date,
        }))
      : [];
  const exception = exceptions.find(
    (item) =>
      scheduleDateKey(
        item?.date ||
          item?.dateKey ||
          item?.day ||
          item?.exceptionDate ||
          item?.specialDate,
      ) === dateKey,
  );

  if (exception) {
    return {
      ...masterScheduleWindowFromRow(exception, true),
      source: "studio-exception",
    };
  }

  const scheduleDayLists = [
    studio.scheduleDays,
    studio.workScheduleDays,
    studio.openingHoursDays,
    studio.workingHoursDays,
    studio.businessHoursDays,
    studio.weeklySchedule,
  ];
  const scheduleDays =
    scheduleDayLists.find(
      (value) => Array.isArray(value) && value.length > 0,
    ) || [];

  if (scheduleDays.length > 0) {
    const row = pickStudioScheduleEntry(scheduleDays, date);

    if (!row) {
      return {
        isWorking: false,
        startMin: null,
        endMin: null,
        source: "studio-schedule",
      };
    }

    return {
      ...masterScheduleWindowFromRow(row, true),
      source: "studio-schedule",
    };
  }

  const scheduleObjects = [
    ...getStudioScheduleSources(studio),
    studio.weeklySchedule,
  ]
    .map(scheduleObject)
    .filter(Boolean);
  const row = scheduleObjects
    .map((schedule) => pickStudioScheduleEntry(schedule, date))
    .find(Boolean);

  if (row) {
    return {
      ...masterScheduleWindowFromRow(row, true),
      source: "studio-schedule",
    };
  }

  const directWindow = masterScheduleWindowFromRow(
    {
      enabled:
        studio.enabled ??
        studio.isOpen ??
        studio.isWorking,
      start:
        studio.start ||
        studio.startTime ||
        studio.open ||
        studio.openTime ||
        studio.openingTime ||
        studio.opensAt ||
        studio.workingFrom,
      end:
        studio.end ||
        studio.endTime ||
        studio.close ||
        studio.closeTime ||
        studio.closingTime ||
        studio.closesAt ||
        studio.workingTo,
      startMin: studio.startMin ?? studio.openMin,
      endMin: studio.endMin ?? studio.closeMin,
    },
    true,
  );

  if (directWindow.isWorking) {
    return { ...directWindow, source: "studio-schedule" };
  }

  return null;
}

function intersectScheduleWindows(...windows) {
  const known = windows.filter(Boolean);

  if (known.some((window) => window.isWorking === false)) {
    return { isWorking: false, startMin: null, endMin: null };
  }

  const working = known.filter((window) => window.isWorking);
  if (working.length === 0) return null;

  const startMin = Math.max(...working.map((window) => window.startMin));
  const endMin = Math.min(...working.map((window) => window.endMin));

  if (endMin <= startMin) {
    return { isWorking: false, startMin: null, endMin: null };
  }

  return { isWorking: true, startMin, endMin };
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
      bg: "bg-[#ecfdf3]",
      border: "border-[#abefc6]",
      accent: "bg-[#039855]",
      text: "text-[#027a48]",
      shadow: "shadow-[0_14px_34px_rgba(3,152,85,0.11)]",
    };
  }

  if (status === "pending") {
    return {
      bg: "bg-[#fffaeb]",
      border: "border-[#fedf89]",
      accent: "bg-[#dc6803]",
      text: "text-[#b54708]",
      shadow: "shadow-[0_14px_34px_rgba(220,104,3,0.12)]",
    };
  }

  if (status === "canceled") {
    return {
      bg: "bg-[#fef3f2]",
      border: "border-[#fecdca]",
      accent: "bg-[#d92d20]",
      text: "text-[#b42318]",
      shadow: "shadow-none",
    };
  }

  if (status === "archived") {
    return {
      bg: "bg-[#f2f4f7]",
      border: "border-[#d0d5dd]",
      accent: "bg-[#667085]",
      text: "text-[#475467]",
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

function ScheduleStatusIcon({ booking, nowTs, className = "", style }) {
  const status = scheduleVisualStatus(booking, nowTs);

  if (status === "confirmed") {
    return <CircleCheckBig className={className} style={style} />;
  }

  if (status === "pending") {
    return <ClockAlert className={className} style={style} />;
  }

  if (status === "canceled") {
    return <XCircle className={className} style={style} />;
  }

  if (status === "archived") {
    return <CheckCheck className={className} style={style} />;
  }

  if (status === "deleted") {
    return <Trash2 className={className} style={style} />;
  }

  return <CircleAlert className={className} style={style} />;
}

function scheduleStatusLabel(booking, nowTs) {
  const status = scheduleVisualStatus(booking, nowTs);

  if (status === "confirmed") return "Підтверджено";
  if (status === "pending") return "Очікує підтвердження";
  if (status === "canceled") return "Скасовано";
  if (status === "archived") return "Завершено";

  return "Запис";
}

function scheduleBookingNotes(booking) {
  return (
    booking?.notes ||
    booking?.note ||
    booking?.comment ||
    booking?.comments ||
    booking?.clientComment ||
    booking?.customerComment ||
    booking?.description ||
    ""
  );
}

function scheduleClientEmail(booking) {
  return (
    booking?.clientEmail ||
    booking?.customerEmail ||
    booking?.email ||
    booking?.client?.email ||
    booking?.customer?.email ||
    ""
  );
}

function BookingHoverCard({ preview, nowTs, formatPrice }) {
  if (!preview?.booking) return null;

  const booking = preview.booking;
  const tone = scheduleCardTone(booking, nowTs);
  const statusLabel = scheduleStatusLabel(booking, nowTs);
  const startLabel =
    parseTimeToHHMM(booking.raw?.time) ||
    scheduleTimeLabel(booking.startMin);
  const endLabel = scheduleTimeLabel(booking.endMin);
  const notes = String(scheduleBookingNotes(booking.raw) || "");
  const email = String(scheduleClientEmail(booking.raw) || "");
  const services = scheduleServices(booking.raw);

  return (
    <div
      className="pointer-events-none fixed z-[320] max-h-[calc(100dvh-24px)] w-[min(340px,calc(100vw-24px))] overflow-y-auto rounded-[18px] border bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
      style={{
        left: preview.left,
        top: preview.top,
        borderColor: tone.border,
      }}
      role="tooltip"
    >
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: tone.accent }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black"
              style={{ backgroundColor: tone.soft, color: tone.accent }}
            >
             <ScheduleStatusIcon
  booking={booking}
  nowTs={nowTs}
  className="h-3.5 w-3.5"
/>
              {statusLabel}
            </span>
            <p className="mt-2 truncate text-[16px] font-black text-[#15171d]">
              {booking.clientName}
            </p>
            <p className="mt-0.5 text-[12px] font-semibold text-[#59616d]">
              {booking.serviceName}
            </p>
          </div>

          {booking.price != null && (
            <span className="shrink-0 rounded-full bg-[#edf8f0] px-2.5 py-1 text-[13px] font-black text-[#008c4f]">
              ₴{formatPrice(booking.price)}
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-2 rounded-[13px] bg-[#f7f8fa] p-3 text-[11px] font-bold text-[#59616d]">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-[#89919b]" />
            {formatDateLongUA(booking.dateKey)}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-[#89919b]" />
            {startLabel} – {endLabel} · {booking.duration} хв
          </span>
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-[#89919b]" />
            {booking.staffName}
            {booking.staffRole ? ` · ${booking.staffRole}` : ""}
          </span>
          <span className="flex items-center gap-2">
            <Store className="h-4 w-4 shrink-0 text-[#89919b]" />
            {booking.resourceName}
          </span>
          {booking.clientPhone && (
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-[#89919b]" />
              {booking.clientPhone}
            </span>
          )}
          {email && (
            <span className="break-all">
              Email: {email}
            </span>
          )}
        </div>

        {services.length > 1 && (
          <div className="mt-3">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#969da8]">
              Послуги
            </p>
            <div className="mt-1.5 grid gap-1">
              {services.map((service, index) => (
                <p
                  key={service?.id || service?._id || `${service?.name || "service"}-${index}`}
                  className="text-[11px] font-semibold text-[#59616d]"
                >
                  {service?.name || service?.title || service?.serviceName || "Послуга"}
                </p>
              ))}
            </div>
          </div>
        )}

        {notes && (
          <div className="mt-3 border-t border-[#eceff3] pt-3">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#969da8]">
              Коментар
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-[11px] font-medium leading-relaxed text-[#59616d]">
              {notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const SCHEDULE_CARD_TONES = {
  confirmed: {
    bg: "#ecfdf3",
    border: "#abefc6",
    accent: "#039855",
    soft: "#d1fadf",
  },
  pending: {
    bg: "#fffaeb",
    border: "#fedf89",
    accent: "#dc6803",
    soft: "#fef0c7",
  },
  canceled: {
    bg: "#fef3f2",
    border: "#fecdca",
    accent: "#d92d20",
    soft: "#fee4e2",
  },
  archived: {
    bg: "#f2f4f7",
    border: "#d0d5dd",
    accent: "#667085",
    soft: "#eaecf0",
  },
  default: {
    bg: "#f2f4f7",
    border: "#d0d5dd",
    accent: "#667085",
    soft: "#eaecf0",
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
  schedule:
    item?.schedule ||
    item?.workSchedule ||
    item?.workingHours ||
    null,
  scheduleDays:
    [item?.scheduleDays, item?.workScheduleDays, item?.workingHoursDays].find(
      Array.isArray,
    ) || [],
  scheduleExceptions:
    [
      item?.scheduleExceptions,
      item?.workScheduleExceptions,
      item?.workingHoursExceptions,
    ].find((value) => Array.isArray(value) && value.length > 0) || [],
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
    booking.raw?.master?.workSchedule ||
    booking.raw?.master?.workingHours ||
    null,

  scheduleDays:
    Array.isArray(existingOption?.scheduleDays) &&
    existingOption.scheduleDays.length > 0
      ? existingOption.scheduleDays
      : [
          booking.raw?.master?.scheduleDays,
          booking.raw?.master?.workScheduleDays,
          booking.raw?.master?.workingHoursDays,
        ].find((value) => Array.isArray(value) && value.length > 0) || [],

  scheduleExceptions:
    Array.isArray(existingOption?.scheduleExceptions) &&
    existingOption.scheduleExceptions.length > 0
      ? existingOption.scheduleExceptions
      : [
          booking.raw?.master?.scheduleExceptions,
          booking.raw?.master?.workScheduleExceptions,
          booking.raw?.master?.workingHoursExceptions,
        ].find((value) => Array.isArray(value) && value.length > 0) || [],
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
  const [bookingPreview, setBookingPreview] = useState(null);
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

const showBookingPreview = (event, booking) => {
  if (event.pointerType === "touch") return;

  const rect = event.currentTarget.getBoundingClientRect();
  const cardWidth = Math.min(340, window.innerWidth - 24);
  const estimatedHeight = Math.min(520, window.innerHeight - 24);
  const gap = 12;
  const preferredLeft = rect.right + gap;
  const canOpenRight = preferredLeft + cardWidth <= window.innerWidth - 12;
  const left = canOpenRight
    ? preferredLeft
    : Math.max(12, rect.left - cardWidth - gap);
  const top = Math.max(
    12,
    Math.min(rect.top, window.innerHeight - estimatedHeight - 12),
  );

  setBookingPreview({ booking, left, top });
};

const hideBookingPreview = () => {
  setBookingPreview(null);
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
const [scheduleStudio, setScheduleStudio] = useState(null);
const [scheduleDataLoading, setScheduleDataLoading] = useState(false);
const [scheduleDataError, setScheduleDataError] = useState("");
const studioId = studio?.id || studio?._id || localStorage.getItem("studioId");
useEffect(() => {
   const token = localStorage.getItem("token");

  if (!studioId || !token) return;

  const controller = new AbortController();
  const apiUrl = import.meta.env.VITE_API_URL;

  async function loadScheduleData() {
    setScheduleDataLoading(true);
    setScheduleDataError("");

    try {
      const requestOptions = {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const loadStudioSchedule = async () => {
        const urls = [
          `${apiUrl}/studio/${studioId}/schedule`,
          `${apiUrl}/studio/${studioId}`,
          `${apiUrl}/studios/${studioId}`,
          `${apiUrl}/studio/me`,
          `${apiUrl}/studio/profile`,
          `${apiUrl}/studio`,
          `${apiUrl}/studios`,
        ];
        let lastError = "";

        for (const url of urls) {
          try {
            const response = await fetch(url, requestOptions);
            const data = await response.json().catch(() => null);

            if (!response.ok) {
              lastError = data?.message || lastError;
              continue;
            }

            const nextStudio = normalizeStudioSchedulePayload(data, studioId);

            if (hasStudioSchedulePayload(nextStudio)) {
              return nextStudio;
            }
          } catch (error) {
            if (controller.signal.aborted) throw error;
            lastError = error?.message || lastError;
          }
        }

        const contextStudio = normalizeStudioSchedulePayload(studio, studioId);

        if (hasStudioSchedulePayload(contextStudio)) {
          return contextStudio;
        }

        throw new Error(
          lastError || "У студії не знайдено збережений графік",
        );
      };
      const [studioResult, mastersResult] = await Promise.allSettled([
        loadStudioSchedule(),
        fetch(`${apiUrl}/studio/${studioId}/masters`, requestOptions),
      ]);

      if (controller.signal.aborted) return;

      if (studioResult.status === "fulfilled") {
        setScheduleStudio(studioResult.value);
      } else {
        throw studioResult.reason;
      }

      if (mastersResult.status === "fulfilled") {
        const response = mastersResult.value;
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || "Не вдалося завантажити майстрів");
        }

        const masters =
          data?.masters ||
          data?.data?.masters ||
          (Array.isArray(data?.data) ? data.data : null) ||
          (Array.isArray(data) ? data : []);

        setScheduleMasters(Array.isArray(masters) ? masters : []);
      } else {
        throw mastersResult.reason;
      }
    } catch (error) {
      if (controller.signal.aborted) return;

      console.error("Load schedule data failed:", error);
      setScheduleDataError(
        error?.message || "Не вдалося оновити графік із бази даних",
      );
    } finally {
      if (!controller.signal.aborted) {
        setScheduleDataLoading(false);
      }
    }
  }

  loadScheduleData();

  return () => {
    controller.abort();
  };
}, [studioId, studio]);

const studioForSchedule = useMemo(() => {
  const dbStudio = scheduleStudio || {};
  const contextStudio = studio || {};

  return {
    ...contextStudio,
    ...dbStudio,
    schedule:
      dbStudio.schedule ||
      dbStudio.workSchedule ||
      dbStudio.workingHours ||
      contextStudio.schedule ||
      contextStudio.workSchedule ||
      contextStudio.workingHours ||
      null,
    scheduleDays:
      dbStudio.scheduleDays ||
      dbStudio.workScheduleDays ||
      contextStudio.scheduleDays ||
      contextStudio.workScheduleDays ||
      [],
    scheduleExceptions:
      dbStudio.scheduleExceptions ||
      dbStudio.openingExceptions ||
      contextStudio.scheduleExceptions ||
      contextStudio.openingExceptions ||
      [],
    masters: scheduleMasters.length
      ? scheduleMasters
      : Array.isArray(dbStudio.masters)
        ? dbStudio.masters
        : Array.isArray(contextStudio.masters)
          ? contextStudio.masters
          : [],
  };
}, [studio, scheduleStudio, scheduleMasters]);

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
    const studioWindow = getStudioScheduleWindow(studioForSchedule, date);

    if (studioWindow?.isWorking) {
      includeWindow(studioWindow.startMin, studioWindow.endMin);
    }
  }

  if (start == null || end == null) {
    start = SCHEDULE_START_HOUR * 60;
    end = SCHEDULE_END_HOUR * 60;
  }

  start = Math.max(0, Math.floor(start / 60) * 60);
  end = Math.min(24 * 60, Math.ceil(end / 60) * 60);

  return { start, end };
}, [studioForSchedule, visibleDates]);

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
  const selectedStudioWindow = getStudioScheduleWindow(
    studioForSchedule,
    viewDate,
  );
  const studioClosedForSelectedDay =
    rangeMode === "day" && selectedStudioWindow?.isWorking === false;
  const studioClosedHelper =
    selectedStudioWindow?.source === "studio-exception"
      ? "Особлива дата у графіку студії"
      : "Вихідний за графіком студії";
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
  const selectedMaster =
    selectedGroup === "all"
      ? null
      : groupOptions.find((option) => option.key === selectedGroup) || null;
  const getColumnWorkWindow = (column) => {
    const date = column.type === "date" ? column.date : viewDate;
    const studioWindow = getStudioScheduleWindow(studioForSchedule, date);
    const master =
      column.type === "staff" ? column : selectedMaster;
    const masterWindow = master
      ? getMasterScheduleWindow(master, date)
      : null;

    return intersectScheduleWindows(studioWindow, masterWindow);
  };
  const workWindowLabel = (workWindow, fallback = "") => {
    if (!workWindow) return fallback || "Графік не задано";
    if (!workWindow.isWorking) return "Вихідний";

    return `${scheduleTimeLabel(workWindow.startMin)} – ${scheduleTimeLabel(
      workWindow.endMin,
    )}`;
  };
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
          className="calendar-day-scroll touch-pan-x overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-[#ebeef3] bg-white [scrollbar-gutter:stable]"
          onScroll={
            compact
              ? undefined
              : (event) => {
                  hideBookingPreview();
                  syncHorizontalScroll(event.currentTarget, scrollRef);
                }
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
                const columnWorkWindow = getColumnWorkWindow(column);

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
                            ? `${formatDateLongUA(toISODateKey(column.date))} · ${workWindowLabel(columnWorkWindow)}`
                            : workWindowLabel(columnWorkWindow, column.role)}
                        </p>
                      </div>
                    </div>

                    {!compact && (
                      <div className="absolute inset-x-4 bottom-2 flex items-center gap-2.5 text-[10px] font-black">
                        <span
                          className="flex items-center gap-1 text-[#667085]"
                          title={`Усього записів: ${totalCount}`}
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          {totalCount}
                        </span>
                        <span
                          className="flex items-center gap-1 text-[#dc6803]"
                          title={`Очікують: ${summaryCounts.pending}`}
                        >
                          <ClockAlert className="h-3.5 w-3.5" />
                          {summaryCounts.pending}
                        </span>
                        <span
                          className="flex items-center gap-1 text-[#039855]"
                          title={`Підтверджені: ${summaryCounts.confirmed}`}
                        >
                          <CircleCheckBig className="h-3.5 w-3.5" />
                          {summaryCounts.confirmed}
                        </span>
                        <span
                          className="flex items-center gap-1 text-[#d92d20]"
                          title={`Скасовані: ${summaryCounts.canceled}`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {summaryCounts.canceled}
                        </span>
                        <span
                          className="flex items-center gap-1 text-[#667085]"
                          title={`Завершені: ${summaryCounts.archived}`}
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          {summaryCounts.archived}
                        </span>
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
          className={cn(
            "calendar-day-scroll relative touch-pan-x overflow-auto overscroll-x-contain [scrollbar-gutter:stable]",
            studioClosedForSelectedDay
              ? "bg-[repeating-linear-gradient(135deg,rgba(148,163,184,0.10)_0,rgba(148,163,184,0.10)_8px,rgba(255,255,255,0.42)_8px,rgba(255,255,255,0.42)_16px)]"
              : "bg-white",
          )}
          style={{ height: bodyHeight }}
          onScroll={
            compact
              ? undefined
              : (event) => {
                  hideBookingPreview();
                  syncHorizontalScroll(event.currentTarget, headerScrollRef);
                }
          }
        >
          {!anyBookings && (
            <div className="pointer-events-none sticky left-0 top-0 z-50 h-0 w-full">
              <div
                className="flex items-center justify-center px-4"
                style={{ height: Math.min(gridHeight, 520) }}
              >
                <div className="pointer-events-auto w-[min(340px,calc(100%-28px))] rounded-[18px] border border-dashed border-[#cfd6df] bg-white/90 p-5 text-center shadow-sm">
                  <div
                    className={cn(
                      "mx-auto flex h-12 w-12 items-center justify-center rounded-full",
                      studioClosedForSelectedDay
                        ? "bg-[#eaecf0] text-[#667085]"
                        : "bg-[#ffe1e8] text-[#ff3369]",
                    )}
                  >
                    {loading ? (
                      <Sparkles className="h-5 w-5 animate-pulse" />
                    ) : studioClosedForSelectedDay ? (
                      <Store className="h-5 w-5" />
                    ) : (
                      <CalendarDays className="h-5 w-5" />
                    )}
                  </div>
                  <p className="mt-3 text-sm font-black text-[#1f2329]">
                    {loading
                      ? "Завантажуємо записи"
                      : studioClosedForSelectedDay
                        ? "Студія не працює"
                        : "Записів немає"}
                  </p>
                  {!loading && studioClosedForSelectedDay && (
                    <p className="mt-1.5 text-[11px] font-semibold text-[#667085]">
                      {studioClosedHelper}
                    </p>
                  )}
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
                className={cn(
                  "sticky left-0 z-40 border-r border-[#ebeef3]",
                  studioClosedForSelectedDay
                    ? "bg-[repeating-linear-gradient(135deg,rgba(148,163,184,0.10)_0,rgba(148,163,184,0.10)_8px,rgba(255,255,255,0.42)_8px,rgba(255,255,255,0.42)_16px)]"
                    : "bg-white",
                )}
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

                {showNowLine &&
                  !studioClosedForSelectedDay &&
                  visibleDateKeys.has(todayKey) && (
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
                const columnDate =
                  column.type === "date" ? column.date : viewDate;
                const columnStudioWindow = getStudioScheduleWindow(
                  studioForSchedule,
                  columnDate,
                );
                const isStudioClosed =
                  columnStudioWindow?.isWorking === false;
                const columnWorkWindow = getColumnWorkWindow(column);
                const isTodayColumn =
                  (column.type === "date" &&
                    toISODateKey(column.date) === todayKey) ||
                  (rangeMode === "day" && visibleDateKeys.has(todayKey));
                const workStartTop = columnWorkWindow?.isWorking
                  ? topForMinute(
                      Math.max(columnWorkWindow.startMin, timeBounds.start),
                    )
                  : SCHEDULE_GRID_TOP_PADDING;
                const workEndTop = columnWorkWindow?.isWorking
                  ? topForMinute(
                      Math.min(columnWorkWindow.endMin, timeBounds.end),
                    )
                  : gridHeight;

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

                    {isStudioClosed && (
                      <div
                        className="pointer-events-none absolute inset-x-0 z-[2] flex items-start justify-center bg-[repeating-linear-gradient(135deg,rgba(148,163,184,0.10)_0,rgba(148,163,184,0.10)_8px,rgba(255,255,255,0.42)_8px,rgba(255,255,255,0.42)_16px)] pt-6"
                        style={{
                          top: SCHEDULE_GRID_TOP_PADDING,
                          height: gridBodyHeight,
                        }}
                      >
                        <span className="rounded-full border border-[#dfe4ea] bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#8b94a0] shadow-sm">
                          Студія не працює
                        </span>
                      </div>
                    )}

                    {!isStudioClosed &&
                      columnWorkWindow &&
                      !columnWorkWindow.isWorking && (
                        <div
                          className="pointer-events-none absolute inset-x-0 z-[2] flex items-start justify-center bg-[repeating-linear-gradient(135deg,rgba(148,163,184,0.10)_0,rgba(148,163,184,0.10)_8px,rgba(255,255,255,0.42)_8px,rgba(255,255,255,0.42)_16px)] pt-6"
                          style={{
                            top: SCHEDULE_GRID_TOP_PADDING,
                            height: gridBodyHeight,
                          }}
                        >
                          <span className="rounded-full border border-[#dfe4ea] bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#8b94a0] shadow-sm">
                            Майстер не працює
                          </span>
                        </div>
                      )}

                    {!isStudioClosed &&
                      columnWorkWindow?.isWorking &&
                      workStartTop > SCHEDULE_GRID_TOP_PADDING && (
                      <div
                        className="pointer-events-none absolute inset-x-0 z-[2] bg-[repeating-linear-gradient(135deg,rgba(148,163,184,0.09)_0,rgba(148,163,184,0.09)_8px,rgba(255,255,255,0.38)_8px,rgba(255,255,255,0.38)_16px)]"
                        style={{
                          top: SCHEDULE_GRID_TOP_PADDING,
                          height: workStartTop - SCHEDULE_GRID_TOP_PADDING,
                        }}
                      />
                    )}

                    {!isStudioClosed &&
                      columnWorkWindow?.isWorking &&
                      workEndTop < gridHeight && (
                      <div
                        className="pointer-events-none absolute inset-x-0 z-[2] bg-[repeating-linear-gradient(135deg,rgba(148,163,184,0.09)_0,rgba(148,163,184,0.09)_8px,rgba(255,255,255,0.38)_8px,rgba(255,255,255,0.38)_16px)]"
                        style={{
                          top: workEndTop,
                          height: gridHeight - workEndTop,
                        }}
                      />
                    )}

                    {showNowLine && !isStudioClosed && isTodayColumn && (
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
                          onPointerEnter={(event) => showBookingPreview(event, booking)}
                          onPointerLeave={hideBookingPreview}
                          onFocus={(event) => showBookingPreview(event, booking)}
                          onBlur={hideBookingPreview}
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
                              <ScheduleStatusIcon
  booking={booking}
  nowTs={nowTs}
  className="h-3.5 w-3.5"
/>
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
          className="hidden h-[min(760px,calc(100dvh-32px))] min-h-[620px] overflow-hidden rounded-[30px] border border-[#d8dde5] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] md:grid"
          style={{
            gridTemplateColumns: agendaCollapsed
              ? "minmax(0,1fr) 46px"
              : "minmax(0,1fr) clamp(280px,24vw,326px)",
          }}
        >
          <main className="min-w-0 bg-white">
            <div className="flex min-h-[58px] flex-wrap items-center justify-between gap-2 border-b border-[#e6e9ef] px-3 py-2 xl:px-4">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
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
                  className="flex h-8 min-w-[176px] items-center gap-2 rounded-md border border-[#e1e5eb] bg-white px-3 text-[11px] font-black text-[#15171d] xl:min-w-[210px]"
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

              <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                {(scheduleDataLoading || scheduleDataError) && (
                  <span
                    className={cn(
                      "max-w-[190px] truncate rounded-full px-2.5 py-1 text-[9px] font-black",
                      scheduleDataError
                        ? "bg-[#fff0f0] text-[#b42318]"
                        : "bg-[#eef8ff] text-[#1261a0]",
                    )}
                    title={scheduleDataError || "Оновлюємо графік із бази даних"}
                  >
                    {scheduleDataError ? "Дані БД: використано кеш" : "Синхронізація з БД…"}
                  </span>
                )}
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
                  {studioClosedForSelectedDay ? (
                    <Store className="mx-auto h-6 w-6 text-[#667085]" />
                  ) : (
                    <CalendarDays className="mx-auto h-6 w-6 text-[#a1aab5]" />
                  )}
                  <p className="mt-3 text-[13px] font-black text-[#15171d]">
                    {studioClosedForSelectedDay
                      ? "Студія не працює"
                      : "Записів немає"}
                  </p>
                  {studioClosedForSelectedDay && (
                    <p className="mt-1 text-[10px] font-semibold text-[#667085]">
                      {studioClosedHelper}
                    </p>
                  )}
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
                        {group.items.length}{" "}
                        {pluralUa(group.items.length, "запис", "записи", "записів")}
                      </span>
                    </div>

                    <div className="grid gap-3">
                      {group.items.map((booking) => {
                        const tone = scheduleCardTone(booking, nowTs);
                        const startLabel =
                          parseTimeToHHMM(booking.raw.time) ||
                          scheduleTimeLabel(booking.startMin);
                        const endLabel = scheduleTimeLabel(booking.endMin);
                      

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
                              <ScheduleStatusIcon
  booking={booking}
  nowTs={nowTs}
  className="h-4 w-4"
  style={{ color: tone.accent }}
/>
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

        <div className="relative mx-auto flex min-h-[100dvh] max-w-[520px] flex-col overflow-hidden bg-white pb-[112px] text-[#15171d] md:hidden">
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

        <BookingHoverCard
          preview={bookingPreview}
          nowTs={nowTs}
          formatPrice={formatPrice}
        />

        {calendarOpen && (
          <div
            className="fixed inset-0 z-[240] flex items-center justify-center bg-[#111318]/35 p-4 backdrop-blur-[4px]"
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
