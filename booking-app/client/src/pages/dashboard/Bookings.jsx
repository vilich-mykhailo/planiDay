// Bookings.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useStudio } from "../../context/studio/useStudio";
import Calendar from "../../components/Calendar";
import StudioBookingWidget from "../../components/StudioBookingWidget";
import BookingSuccessModal from "../../components/BookingSuccessModal";
import { uk } from "date-fns/locale/uk";
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
  Briefcase,
  UserStar,
  FilePenLine,
  PartyPopper,
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

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function startOfWeekMonday(d) {
  const x = startOfDay(d);
  const day = x.getDay();
  const mondayIndex = (day + 6) % 7;
  x.setDate(x.getDate() - mondayIndex);
  return x;
}

function isDateInRange(dateStr, from, to) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  return d >= from && d <= to;
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

function timeToMinutes(value) {
  const match = String(value || "")
    .trim()
    .replace(".", ":")
    .match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    hours < 0 ||
    hours > 24 ||
    minutes < 0 ||
    minutes > 59 ||
    (hours === 24 && minutes !== 0)
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function minutesToTime(total) {
  const value = Number(total);
  if (!Number.isFinite(value)) return "";
  return `${pad2(Math.floor(value / 60))}:${pad2(value % 60)}`;
}

function normalizeScheduleTime(value) {
  if (typeof value === "string" && value.includes(":")) {
    const minutes = timeToMinutes(value);
    return minutes == null ? "" : minutesToTime(minutes);
  }

  const minutes = Number(value);
  return Number.isFinite(minutes) ? minutesToTime(minutes) : "";
}

function getScheduleBreaks(...sources) {
  return sources.flatMap((source) => {
    if (!source) return [];

    if (Array.isArray(source.breaks)) {
      return source.breaks
        .map((item) => ({
          start: normalizeScheduleTime(
            item?.start ?? item?.from ?? item?.breakStart ?? item?.startMin,
          ),
          end: normalizeScheduleTime(
            item?.end ?? item?.to ?? item?.breakEnd ?? item?.endMin,
          ),
        }))
        .filter((item) => item.start && item.end);
    }

    const start = normalizeScheduleTime(
      source.breakStart ??
        source.breakStartTime ??
        source.breakFrom ??
        source.pauseStart ??
        source.lunchStart ??
        source.breakStartMin,
    );
    const end = normalizeScheduleTime(
      source.breakEnd ??
        source.breakEndTime ??
        source.breakTo ??
        source.pauseEnd ??
        source.lunchEnd ??
        source.breakEndMin,
    );

    return start && end ? [{ start, end }] : [];
  });
}

function normalizeScheduleDay(entry) {
  if (!entry || typeof entry !== "object" || entry.enabled === false) {
    return null;
  }

  const start = normalizeScheduleTime(
    entry.start ??
      entry.startTime ??
      entry.from ??
      entry.openTime ??
      entry.startMin,
  );
  const end = normalizeScheduleTime(
    entry.end ??
      entry.endTime ??
      entry.to ??
      entry.closeTime ??
      entry.endMin,
  );

  if (!start || !end || timeToMinutes(end) <= timeToMinutes(start)) {
    return null;
  }

  return {
    enabled: true,
    start,
    end,
    breaks: getScheduleBreaks(entry),
  };
}

function weekdayEnumToKey(value) {
  const keys = {
    MON: "mon",
    TUE: "tue",
    WED: "wed",
    THU: "thu",
    FRI: "fri",
    SAT: "sat",
    SUN: "sun",
  };
  return keys[String(value || "").toUpperCase()] || null;
}

function normalizeSchedule(schedule, scheduleDays = []) {
  if (
    schedule &&
    typeof schedule === "object" &&
    !Array.isArray(schedule) &&
    Object.keys(schedule).length
  ) {
    return schedule;
  }

  return (Array.isArray(scheduleDays) ? scheduleDays : []).reduce(
    (result, item) => {
      const key = weekdayEnumToKey(item?.weekday || item?.day);
      if (key) result[key] = item;
      return result;
    },
    {},
  );
}

function getScheduleForDate(date, schedule, exceptions = []) {
  if (!date) return null;

  const dateKey = toISODateKey(date);
  const exception = (Array.isArray(exceptions) ? exceptions : []).find(
    (item) => String(item?.date || "").slice(0, 10) === dateKey,
  );

  if (exception) return normalizeScheduleDay(exception);

  const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
    date.getDay()
  ];
  return normalizeScheduleDay(schedule?.[dayKey]);
}

function resolveMasterScheduleForDate(date, master) {
  if (!date || !master) return null;

  const exceptions = Array.isArray(master.scheduleExceptions)
    ? master.scheduleExceptions
    : [];
  const dateKey = toISODateKey(date);
  const exception = exceptions.find(
    (item) => String(item?.date || "").slice(0, 10) === dateKey,
  );

  if (exception) return normalizeScheduleDay(exception);

  const schedule = normalizeSchedule(master.schedule, master.scheduleDays);
  if (!Object.keys(schedule).length) return "__USE_STUDIO_SCHEDULE__";

  return getScheduleForDate(date, schedule, []);
}

function intersectScheduleDays(studioDay, masterDay) {
  if (!studioDay?.enabled || !masterDay?.enabled) return null;

  const start = Math.max(
    timeToMinutes(studioDay.start),
    timeToMinutes(masterDay.start),
  );
  const end = Math.min(
    timeToMinutes(studioDay.end),
    timeToMinutes(masterDay.end),
  );

  if (end <= start) return null;

  return {
    enabled: true,
    start: minutesToTime(start),
    end: minutesToTime(end),
    breaks: getScheduleBreaks(studioDay, masterDay),
  };
}

function buildAvailableSlots(day, stepMinutes, durationMinutes) {
  if (!day?.enabled) return [];

  const start = timeToMinutes(day.start);
  const end = timeToMinutes(day.end);
  const step = Number(stepMinutes) > 0 ? Number(stepMinutes) : 15;
  const duration = Number(durationMinutes) > 0 ? Number(durationMinutes) : step;
  const breaks = getScheduleBreaks(day)
    .map((item) => ({
      start: timeToMinutes(item.start),
      end: timeToMinutes(item.end),
    }))
    .filter((item) => item.start != null && item.end != null);

  if (start == null || end == null || end <= start) return [];

  const result = [];
  for (let cursor = start; cursor + duration <= end; cursor += step) {
    const slotEnd = cursor + duration;
    const overlapsBreak = breaks.some(
      (item) => cursor < item.end && slotEnd > item.start,
    );
    if (!overlapsBreak) result.push(minutesToTime(cursor));
  }

  return result;
}

function filterPastManualSlots(slots, selectedDate, timestamp) {
  if (!selectedDate) return slots;

  const now = new Date(timestamp);
  if (toISODateKey(selectedDate) !== toISODateKey(now)) return slots;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return slots.filter((time) => timeToMinutes(time) > currentMinutes);
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
  if (isArchived) {
    return {
      text: "Сеанс завершено",
      icon: PartyPopper,
      badge: "badge-theme-archived",
      side: "border-[var(--color-caramel)]",
      time: "text-[var(--color-archived-dark)]",
    };
  }

  if (status === "confirmed") {
    return {
      text: "Підтверджено",
      icon: CheckCheck,
      badge: "badge-theme-success",
      side: "border-[var(--color-buttom-ok)]",
      time: "text-[var(--color-confirmed-dark)]",
    };
  }

  if (status === "canceled") {
    return {
      text: canceledBy === "client" ? "Скасовано клієнтом" : "Скасовано вами",
      icon: XCircle,
      badge: "badge-theme-danger",
      side: "border-[var(--color-danger)]",
      time: "text-[var(--color-canceled-dark)]",
    };
  }

  return {
    text: "Очікує ваше підтвердження",
    icon: Clock,
    badge: "badge-theme-warning",
    side: "border-[var(--color-dot-wait)]",
    time: "text-[#ffb020]",
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
        "group relative overflow-hidden rounded-[15px] border border-[#ebe7df] bg-white shadow-[0_14px_44px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
    

      {hasHeader && (
        <div className="flex flex-col gap-3 border-b border-[#f1ece5] px-4 py-5 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {(title || badge) && (
                <div className="flex items-center gap-2">
                  {title && (
                    <h2 className="text-lg font-black tracking-[-0.03em] text-[#202020]">
                      {title}
                    </h2>
                  )}

                  {badge && (
                    <span className="inline-flex items-center rounded-full bg-[#fff7f0] px-2.5 py-1 text-xs font-black text-[#ff6200]">
                      {badge}
                    </span>
                  )}
                </div>
              )}

              {subtitle && (
                <p className="mt-1 text-sm font-medium leading-5 text-[#7b766f]">
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
      )}

      <div className="p-4 sm:p-5">{children}</div>
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
    primary: "bg-[#ff5a00] text-white hover:bg-[#ef4f00]",
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
            active ? "text-white/80" : "text-[#ff5a00]",
          )}
        >
          +{count ?? 0}
        </span>
      )}
    </button>
  );
}

function BookingFilterSelect({
  label,
  value,
  options = [],
  open,
  setOpen,
  onChange,
  selectRef,
}) {
  const [dropDirection, setDropDirection] = useState("bottom");

  const selected = options.find((item) => item.key === value) || options[0];
  const SelectedIcon = selected?.icon || List;

  function handleToggle() {
    const nextOpen = !open;

    if (nextOpen) {
      const rect = selectRef.current?.getBoundingClientRect();

      if (rect) {
        const dropdownHeight = Math.min(280, options.length * 54 + 16);
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        setDropDirection(
          spaceBelow < dropdownHeight && spaceAbove > spaceBelow
            ? "top"
            : "bottom",
        );
      }
    }

    setOpen(nextOpen);
  }

  const dropdownPositionClass =
    dropDirection === "top" ? "bottom-full mb-2" : "top-full mt-2";

  return (
    <div ref={selectRef} className="relative min-w-0 w-full">
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "inline-flex h-12 w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 text-left shadow-sm transition-all duration-200",
          open
            ? "border-[#ff6200] bg-[#fff7f0] ring-4 ring-[#ff6200]/10"
            : "border-[#eadbc9] hover:border-[#ffd6bd] hover:bg-[#fff1e8]",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#eadbc9] bg-[#fff1e8] text-[#ff6200]">
            <SelectedIcon className="h-4 w-4" />
          </span>

          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#aaa19a]">
              {label}
            </span>

            <span className="block truncate text-sm font-black text-[#202020]">
              {selected?.label || "Оберіть"}
            </span>
          </span>
        </span>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#77716b] transition-transform duration-200",
            open && "rotate-180 text-[#ff6200]",
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 right-0 z-[999] max-h-[280px] w-full overflow-y-auto rounded-[18px] border border-[#eadbc9] bg-white py-2 shadow-[0_18px_42px_rgba(15,23,42,0.14)]",
            dropdownPositionClass,
          )}
        >
          {options.map((item) => {
            const active = item.key === value;
            const Icon = item.icon || List;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onChange(item.key);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-all duration-200",
                  active
                    ? "bg-[#fff1e8] text-[#ff6200]"
                    : "text-[#202020] hover:bg-[#fff7f0]",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-200",
                      active
                        ? "border-[#ff6200] bg-[#ff6200] text-white"
                        : "border-[#eadbc9] bg-[#fffaf6] text-[#ff6200]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="truncate text-sm font-black">
                    {item.label}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2">
                  {typeof item.count === "number" && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-black",
                        active
                          ? "bg-white text-[#ff6200]"
                          : "bg-[#fff1e8] text-[#ff6200]",
                      )}
                    >
                      {item.count}
                    </span>
                  )}

                  {active && <Check className="h-4 w-4" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const emptyBookingInfo = {
  all: {
    icon: CalendarDays,
    title: "Поки що немає записів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Тут зʼявляться всі активні записи клієнтів.</span>
      </span>
    ),
  },

  new: {
    icon: CircleCheck,
    title: "Поки що немає нових записів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Тут зʼявляться записи, які очікують підтвердження.</span>
      </span>
    ),
  },

  confirmed: {
    icon: CheckCheck,
    title: "Поки що немає підтверджених записів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Тут зʼявляться записи, які ви вже підтвердили.</span>
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
      </span>
    ),
  },

  archive: {
    icon: PartyPopper,
    title: "Поки що немає завершених записів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Тут зʼявляться записи, дата й час яких уже минули.</span>
      </span>
    ),
  },
};

function Modal({
  open,
  onClose,
  title,
  badge = "Редагування",
  icon: Icon = CalendarDays,
  subtitle,
  children,
  footer,
  size = "md",
  contentClassName = "",
}) {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-stretch justify-center bg-[#202020]/45 p-0 backdrop-blur-[6px] sm:items-center sm:p-6">
      <div
        className={cn(
          "flex h-dvh w-full flex-col overflow-hidden rounded-none border-0 bg-[#f7f5f1] shadow-[0_30px_90px_rgba(15,23,42,0.24)]",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          "sm:h-[85vh] sm:max-h-[85vh] sm:rounded-[30px] sm:border sm:border-[#f0e2d3]",
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

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5 pb-[110px] sm:px-6 sm:pb-5",
            contentClassName,
          )}
        >
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

function getCurrentClientName(booking) {
  const clientFullName = [
    booking?.client?.firstName,
    booking?.client?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const clientAccountFullName = [
    booking?.clientAccount?.firstName,
    booking?.clientAccount?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    clientFullName ||
    booking?.client?.name ||
    clientAccountFullName ||
    booking?.clientAccount?.name ||
    booking?.clientName ||
    "Клієнт"
  );
}

function getOwnerBookingStatus(booking) {
  const raw = booking?.status || "new";

  if (raw === "canceled" || raw === "CANCELED") return "canceled";
  if (raw === "confirmed" || raw === "CONFIRMED") return "confirmed";
  if (raw === "completed" || raw === "COMPLETED") return "completed";

  return "new";
}

function AppointmentCard({ item, nowTs, onOpen }) {
  const key = item.date ? String(item.date) : "";
  const status = getOwnerBookingStatus(item);

  const clientName = getCurrentClientName(item);
  const service = item.serviceName || item.service?.name || "Послуга";
  const masterName =
    item.masterName ||
    item.master?.name ||
    item.staffName ||
    item.employeeName ||
    "Майстер";

  const clientPhoto = toPublicUrl(
    item.clientPhotoUrl ||
      item.clientPhoto ||
      item.client?.photoUrl ||
      item.client?.photo ||
      item.client?.avatar ||
      "",
  );

  const masterPhoto = toPublicUrl(
    item.masterPhotoUrl ||
      item.masterPhoto ||
      item.master?.photoUrl ||
      item.master?.photo ||
      item.master?.avatar ||
      "",
  );

  const isCanceled = status === "canceled";
  const isConfirmed = status === "confirmed";
  const dt = getBookingDateTime(item);
  const isArchived = dt ? dt.getTime() < nowTs : false;

  const statusKey = isArchived
    ? "completed"
    : isConfirmed
      ? "confirmed"
      : isCanceled
        ? "canceled"
        : "new";

  const statusBadge = {
    canceled: {
      label:
        item.canceledBy === "client" ? "Скасовано клієнтом" : "Скасовано вами",
      className:
        "border-[var(--color-canceled-light)] text-[var(--color-canceled-dark)]",
      icon: XCircle,
    },

    confirmed: {
      label: "Підтверджено",
      className:
        "border-[var(--color-confirmed-light)]  text-[var(--color-confirmed-dark)]",
      icon: CheckCheck,
    },

    completed: {
      label: "Сеанс завершено ",
      className:
        "border-[var(--color-archived-light)] text-[var(--color-archived-dark)]",
      icon: PartyPopper,
    },

    new: {
      label: "Очікує підтвердження",
      className: "border-[var(--color-pending-light)]  text-[#ffb020]",
      icon: Clock,
    },
  }[statusKey] || {
    label: "Очікує підтвердження",
    className: "border-[var(--color-pending-light)]  text-[#ffb020]",
    icon: Clock,
  };

  const StatusIcon = statusBadge.icon;

  const date = key ? new Date(`${key}T00:00:00`) : null;

  const dayLabel =
    date && !Number.isNaN(date.getTime())
      ? String(date.getDate()).padStart(2, "0")
      : "—";

  const monthLabel =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString("uk-UA", { month: "long" })
      : "";

  const timeLabel = parseTimeToHHMM(item.time) || item.time || "—";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(item.id);
        }
      }}
      className={cn(
        "group cursor-pointer mt-1 overflow-hidden rounded-[24px] border border-[#eadfce] bg-white transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-[#ffd6bd] hover:bg-[#fff7f0]",
        "active:scale-[0.99]",
        statusKey === "completed" && "opacity-85",
      )}
    >
      <div className="grid min-h-[108px] grid-cols-[92px_minmax(0,1fr)_132px_96px] items-center gap-3 px-4 py-3 max-[639px]:min-h-0 max-[639px]:grid-cols-[1fr_82px] max-[639px]:gap-3 max-[639px]:px-3 max-[639px]:py-3">
        <div className="contents max-[639px]:block max-[639px]:min-w-0">
          <div className="mb-2 hidden justify-center max-[639px]:flex">
            <div
              className={cn(
               "inline-flex items-center justify-center gap-1.5 rounded-full border bg-white px-3 py-1 text-center text-[10px] font-black shadow-sm group-hover:bg-white",
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

              <div className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#77716b] max-[767px]:mt-1 max-[767px]:text-[10px] lg:text-[13px]">
                <ClipboardPen className="h-4 w-4 shrink-0 text-[#77716b] max-[767px]:h-3 max-[767px]:w-3" />
                <span className="line-clamp-2">{service}</span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-[#77716b] max-[767px]:mt-1.5 max-[767px]:gap-1.5 max-[767px]:text-[10px] lg:text-[13px]">
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-[#eadfce] bg-white max-[767px]:h-5 max-[767px]:w-5">
                  {masterPhoto ? (
                    <img
                      src={masterPhoto}
                      alt={masterName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#fff1e8] text-[11px] font-black text-[#ff6200] max-[767px]:text-[8px]">
                      {masterName?.[0] || "М"}
                    </div>
                  )}
                </div>

                <span className="truncate">Майстер: {masterName}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "hidden h-full items-center justify-center border-l pl-3 max-[639px]:flex",
            statusKey === "confirmed"
              ? "border-[#bbf7d0]"
              : statusKey === "new"
                ? "border-[#fed7aa]"
                : statusKey === "canceled"
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
                statusKey === "confirmed"
                  ? "text-[#41a85f]"
                  : statusKey === "new"
                    ? "text-[#ffb020]"
                    : statusKey === "canceled"
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

        <div className="hidden min-w-0 flex-col items-center justify-center max-[639px]:hidden sm:flex sm:-ml-2 pr-4 lg:pr-6">
          <div
            className={cn(
              "mb-2 inline-flex w-fit items-center justify-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[10px] font-black shadow-sm group-hover:bg-white",
              statusBadge.className,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />

            <span className="whitespace-nowrap text-center leading-[1.05]">
              {statusBadge.label}
            </span>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center mr-2 justify-center border-l pl-5 max-[639px]:hidden",
            statusKey === "confirmed"
              ? "border-[#bbf7d0]"
              : statusKey === "new"
                ? "border-[#fed7aa]"
                : statusKey === "canceled"
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
                statusKey === "confirmed"
                  ? "text-[#41a85f]"
                  : statusKey === "new"
                    ? "text-[#ffb020]"
                    : statusKey === "canceled"
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
}

function ManualSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Оберіть",
  type = "client",
}) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const selected = options.find((item) => String(item.id) === String(value));

  function getTitle(item) {
    if (type === "service") return item.name || "Послуга";
    return `${item.firstName || item.name || ""} ${item.lastName || ""}`.trim();
  }

  function getSubtitle(item) {
    if (type === "client") return item.phone || item.email || "Без контактів";
    if (type === "master") return item.role || "Майстер";
    return "Послуга студії";
  }

  return (
    <div ref={selectRef} className="relative">
      <label className="mb-2 block text-sm font-black text-[#202020]">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-full items-center justify-between gap-3 rounded-2xl border border-[#eadbc9] bg-white px-3 text-left shadow-sm transition hover:border-[#ffd6bd] hover:bg-[#fff7f0] focus:border-[#ff6200] focus:ring-4 focus:ring-[#ff6200]/10"
      >
        {selected ? (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {type !== "service" && (
              <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[#eadbc9] bg-[#fff1e8] text-[#ff6200]">
                {selected.photoUrl ? (
                  <img
                    src={toPublicUrl(selected.photoUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : type === "client" ? (
                  <UserRound className="h-5 w-5" />
                ) : (
                  <Scissors className="h-5 w-5" />
                )}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-[#202020]">
                {getTitle(selected)}
              </p>

              <p className="truncate text-xs font-semibold text-[#77716b]">
                {getSubtitle(selected)}
              </p>
            </div>

            {type === "service" && (
              <div className="shrink-0 text-right leading-tight">
                <p className="text-xs font-black text-[#202020]">
                  {selected.duration || 0} хв
                </p>

                <p className="mt-0.5 text-xs font-black text-[#ff6200]">
                  {selected.price || 0} грн
                </p>
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm font-bold text-[#9b948c]">
            {placeholder}
          </span>
        )}

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#77716b] transition",
            open && "rotate-180 text-[#ff6200]",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-[10000] mt-2 max-h-[260px] overflow-y-auto rounded-[22px] border border-[#eadbc9] bg-white p-2 shadow-[0_18px_46px_rgba(15,23,42,0.16)]">
          {options.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm font-bold text-[#77716b]">
              Немає даних
            </div>
          ) : (
            options.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-[#fff7f0]",
                  String(value) === String(item.id) && "bg-[#fff1e8]",
                )}
              >
                {type !== "service" && (
                  <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-[#eadbc9] bg-[#fff1e8] text-[#ff6200]">
                    {item.photoUrl ? (
                      <img
                        src={toPublicUrl(item.photoUrl)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : type === "client" ? (
                      <UserRound className="h-5 w-5" />
                    ) : (
                      <Scissors className="h-5 w-5" />
                    )}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-[#202020]">
                    {getTitle(item)}
                  </p>

                  <p className="truncate text-xs font-semibold text-[#77716b]">
                    {getSubtitle(item)}
                  </p>
                </div>

                {type === "service" && (
                  <div className="shrink-0 text-right leading-tight">
                    <p className="text-xs font-black text-[#202020]">
                      {item.duration || 0} хв
                    </p>

                    <p className="mt-0.5 text-xs font-black text-[#ff6200]">
                      {item.price || 0} грн
                    </p>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function dateStringToDate(value) {
  if (!value) return null;

  const [year, month, day] = String(value).split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function dateToDateString(date) {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function TwoLineName({ value, fallback = "—" }) {
  const text = String(value || fallback).trim();
  const parts = text.split(/\s+/);

  const firstLine = parts[0] || fallback;
  const secondLine = parts.slice(1).join(" ");

  return (
    <span className="block max-w-full leading-[1.15]">
      <span className="block truncate">{firstLine}</span>

      {secondLine && (
        <span className="block truncate text-[13px] font-semibold text-[#77716b]">
          {secondLine}
        </span>
      )}
    </span>
  );
}

export default function Bookings() {
  const { bookings, confirmBooking, cancelBooking, deleteBooking, loading } =
    useBookings();
  const { studio } = useStudio();
  const studioId = studio?.id ?? null;
  const [confirmId, setConfirmId] = useState(null);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [manualBookingOpen, setManualBookingOpen] = useState(false);
  const [manualSuccessData, setManualSuccessData] = useState(null);
  const [tab, setTab] = useState(() => {
    return localStorage.getItem("bookings-tab") || "list";
  });
  const [activeMonth, setActiveMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [calendarDayKey, setCalendarDayKey] = useState(null);
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [bookingFilterOpen, setBookingFilterOpen] = useState(false);
  const [bookingDateFilterOpen, setBookingDateFilterOpen] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState(null);
  const [customDateTo, setCustomDateTo] = useState(null);
  const [manualBookingError, setManualBookingError] = useState("");
  const [manualBookingSaving, setManualBookingSaving] = useState(false);
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
  const [manualClientId, setManualClientId] = useState("");
  const [manualServiceId, setManualServiceId] = useState("");
  const [manualMasterId, setManualMasterId] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [manualBusyTimes, setManualBusyTimes] = useState(() => new Set());
  const [manualBusyLoading, setManualBusyLoading] = useState(false);
  const [manualTimeTick, setManualTimeTick] = useState(() => Date.now());
  const [services, setServices] = useState([]);
  const [masters, setMasters] = useState([]);
  const [clients, setClients] = useState([]);
  const [manualStudioSettings, setManualStudioSettings] = useState({
    scheduleDays: [],
    scheduleExceptions: [],
    slotDuration: null,
  });
  useEffect(() => {
    localStorage.setItem("bookings-tab", tab);
  }, [tab]);

  useEffect(() => {
    if (!manualBookingOpen) return;
    if (!studioId) return;

    const loadManualBookingData = async () => {
      try {
        const token = localStorage.getItem("token");

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [clientsRes, servicesRes, mastersRes] = await Promise.all([
          fetch(
            `${import.meta.env.VITE_API_URL}/owner/studio/${studioId}/clients`,
            { headers },
          ),

          fetch(
            `${import.meta.env.VITE_API_URL}/owner/studio/${studioId}/services`,
            { headers },
          ),

          fetch(
            `${import.meta.env.VITE_API_URL}/owner/studio/${studioId}/masters`,
            { headers },
          ),
        ]);

        const clientsData = await clientsRes.json();
        const servicesData = await servicesRes.json();
        const mastersData = await mastersRes.json();

        setClients(
          (clientsData.clients || []).map((client) => ({
            ...client,
            accountId:
              client.accountId ||
              (client.studioClientId &&
              String(client.studioClientId) === String(client.id)
                ? null
                : client.id || null),
            id: client.studioClientId || client.id,
          })),
        );
        setServices(servicesData.services || servicesData || []);
        setMasters(mastersData.masters || mastersData || []);
        setManualStudioSettings({
          scheduleDays: Array.isArray(mastersData.scheduleDays)
            ? mastersData.scheduleDays
            : [],
          scheduleExceptions: Array.isArray(mastersData.scheduleExceptions)
            ? mastersData.scheduleExceptions
            : [],
          slotDuration:
            Number(mastersData.slotDuration) > 0
              ? Number(mastersData.slotDuration)
              : null,
        });
      } catch (e) {
        console.error(e);
      }
    };

    loadManualBookingData();
  }, [manualBookingOpen, studioId]);

  const selectedManualService = useMemo(
    () =>
      services.find(
        (item) => String(item.id) === String(manualServiceId),
      ) || null,
    [services, manualServiceId],
  );

  const manualAvailableMasters = useMemo(() => {
    if (!selectedManualService) return [];
    if (selectedManualService.allMasters) return masters;

    const allowedIds = Array.isArray(selectedManualService.masters)
      ? selectedManualService.masters
          .map((item) =>
            String(
              typeof item === "string" || typeof item === "number"
                ? item
                : item?.id || item?.masterId || item?.master?.id || "",
            ),
          )
          .filter(Boolean)
      : [];

    return masters.filter((item) => allowedIds.includes(String(item.id)));
  }, [masters, selectedManualService]);

  const selectedManualMaster = useMemo(
    () =>
      manualAvailableMasters.find(
        (item) => String(item.id) === String(manualMasterId),
      ) || null,
    [manualAvailableMasters, manualMasterId],
  );

  const manualSelectedDate = useMemo(
    () => dateStringToDate(manualDate),
    [manualDate],
  );

  const manualStudioSchedule = useMemo(
    () =>
      manualStudioSettings.scheduleDays.length
        ? normalizeSchedule(null, manualStudioSettings.scheduleDays)
        : normalizeSchedule(studio?.schedule, studio?.scheduleDays),
    [
      studio?.schedule,
      studio?.scheduleDays,
      manualStudioSettings.scheduleDays,
    ],
  );

  const manualStudioExceptions = useMemo(
    () =>
      manualStudioSettings.scheduleExceptions.length
        ? manualStudioSettings.scheduleExceptions
        : Array.isArray(studio?.scheduleExceptions)
          ? studio.scheduleExceptions
          : [],
    [studio?.scheduleExceptions, manualStudioSettings.scheduleExceptions],
  );

  const manualDayConfig = useMemo(() => {
    if (!manualSelectedDate || !selectedManualMaster) return null;

    const studioDay = getScheduleForDate(
      manualSelectedDate,
      manualStudioSchedule,
      manualStudioExceptions,
    );
    if (!studioDay) return null;

    const masterDay = resolveMasterScheduleForDate(
      manualSelectedDate,
      selectedManualMaster,
    );
    if (!masterDay) return null;

    return masterDay === "__USE_STUDIO_SCHEDULE__"
      ? studioDay
      : intersectScheduleDays(studioDay, masterDay);
  }, [
    manualSelectedDate,
    manualStudioSchedule,
    manualStudioExceptions,
    selectedManualMaster,
  ]);

  const manualSlots = useMemo(() => {
    const duration = Number(selectedManualService?.duration);
    const slotDuration =
      Number(manualStudioSettings.slotDuration) ||
      Number(studio?.slotDuration) ||
      15;

    return filterPastManualSlots(
      buildAvailableSlots(
        manualDayConfig,
        slotDuration,
        duration > 0 ? duration : slotDuration,
      ),
      manualSelectedDate,
      manualTimeTick,
    );
  }, [
    manualDayConfig,
    manualSelectedDate,
    manualTimeTick,
    selectedManualService?.duration,
    studio?.slotDuration,
    manualStudioSettings.slotDuration,
  ]);

  const manualDisabledDays = useMemo(
    () => (date) => {
      const candidate = startOfDay(new Date(date));
      if (candidate < startOfDay(new Date())) return true;
      if (!selectedManualMaster) return true;

      const studioDay = getScheduleForDate(
        candidate,
        manualStudioSchedule,
        manualStudioExceptions,
      );
      if (!studioDay) return true;

      const masterDay = resolveMasterScheduleForDate(
        candidate,
        selectedManualMaster,
      );
      if (!masterDay) return true;
      if (masterDay === "__USE_STUDIO_SCHEDULE__") return false;

      return !intersectScheduleDays(studioDay, masterDay);
    },
    [
      manualStudioSchedule,
      manualStudioExceptions,
      selectedManualMaster,
    ],
  );

  useEffect(() => {
    if (!manualBookingOpen) return undefined;

    const intervalId = window.setInterval(() => {
      setManualTimeTick(Date.now());
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [manualBookingOpen]);

  useEffect(() => {
    if (
      manualMasterId &&
      !manualAvailableMasters.some(
        (item) => String(item.id) === String(manualMasterId),
      )
    ) {
      setManualMasterId("");
      setManualDate("");
      setManualTime("");
    }
  }, [manualAvailableMasters, manualMasterId]);

  useEffect(() => {
    if (!manualTime || manualSlots.includes(manualTime)) return;
    setManualTime("");
  }, [manualSlots, manualTime]);

  useEffect(() => {
    if (!manualTime || !manualBusyTimes.has(manualTime)) return;
    setManualTime("");
    setManualBookingError("Цей час уже зайнятий. Оберіть інший слот.");
  }, [manualBusyTimes, manualTime]);

  useEffect(() => {
    let alive = true;

    async function loadManualBusyTimes() {
      if (
        !manualBookingOpen ||
        !studioId ||
        !manualDate ||
        !manualMasterId ||
        !manualServiceId
      ) {
        setManualBusyTimes(new Set());
        setManualBusyLoading(false);
        return;
      }

      setManualBusyLoading(true);

      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({
          date: manualDate,
          masterId: String(manualMasterId),
          serviceId: String(manualServiceId),
        });
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/bookings/studio/${studioId}/busy?${params.toString()}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            data?.message || "Не вдалося перевірити доступність часу.",
          );
        }

        const busy = (Array.isArray(data?.busy) ? data.busy : [])
          .map((item) =>
            parseTimeToHHMM(
              typeof item === "string" ? item : item?.time || item?.start,
            ),
          )
          .filter(Boolean);

        if (alive) {
          setManualBusyTimes(new Set(busy));
          setManualBookingError("");
        }
      } catch (error) {
        if (alive) {
          setManualBusyTimes(new Set());
          setManualBookingError(
            error?.message || "Не вдалося перевірити доступність часу.",
          );
        }
      } finally {
        if (alive) setManualBusyLoading(false);
      }
    }

    loadManualBusyTimes();

    return () => {
      alive = false;
    };
  }, [
    manualBookingOpen,
    studioId,
    manualDate,
    manualMasterId,
    manualServiceId,
  ]);

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
  const datePickerFromRef = useRef(null);
  const manualTimeRowRef = useRef(null);
  const datePickerToRef = useRef(null);
  const bookingFilterRef = useRef(null);
  const bookingDateFilterRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        bookingFilterRef.current &&
        !bookingFilterRef.current.contains(e.target)
      ) {
        setBookingFilterOpen(false);
      }

      if (
        bookingDateFilterRef.current &&
        !bookingDateFilterRef.current.contains(e.target)
      ) {
        setBookingDateFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
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
    let result = [];

    if (filter === "archive") {
      result = split.archive;
    } else {
      const base = split.active;

      if (filter === "new") {
        result = base.filter((b) => !b.status || b.status === "new");
      } else if (filter === "confirmed") {
        result = base.filter((b) => b.status === "confirmed");
      } else if (filter === "canceled") {
        result = base.filter((b) => b.status === "canceled");
      } else {
        result = base;
      }
    }

    const today = startOfDay(new Date());

    if (dateFilter === "today") {
      const from = startOfDay(today);
      const to = endOfDay(today);

      return result.filter((b) => isDateInRange(b.date, from, to));
    }

    if (dateFilter === "week") {
      const from = startOfWeekMonday(today);
      const to = endOfDay(addDays(from, 6));

      return result.filter((b) => isDateInRange(b.date, from, to));
    }

    if (dateFilter === "nextWeek") {
      const from = addDays(startOfWeekMonday(today), 7);
      const to = endOfDay(addDays(from, 6));

      return result.filter((b) => isDateInRange(b.date, from, to));
    }

    if (dateFilter === "month") {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      const to = endOfDay(
        new Date(today.getFullYear(), today.getMonth() + 1, 0),
      );

      return result.filter((b) => isDateInRange(b.date, from, to));
    }

    if (dateFilter === "custom") {
      const from = customDateFrom ? startOfDay(customDateFrom) : null;

      const to = customDateTo ? endOfDay(customDateTo) : null;

      return result.filter((b) => {
        if (!b.date) return false;

        const d = new Date(`${b.date}T00:00:00`);
        if (Number.isNaN(d.getTime())) return false;

        if (from && d < from) return false;
        if (to && d > to) return false;

        return true;
      });
    }

    return result;
  }, [filter, split, dateFilter, customDateFrom, customDateTo]);

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

  const bookingStatusOptions = useMemo(
    () => [
      {
        key: "all",
        label: "Усі записи",
        icon: ListTodo,
        count: filterCounts.all,
      },
      {
        key: "new",
        label: "Очікують підтвердження",
        icon: Clock,
        count: filterCounts.new,
      },
      {
        key: "confirmed",
        label: "Підтверджені",
        icon: CheckCheck,
        count: filterCounts.confirmed,
      },
      {
        key: "canceled",
        label: "Скасовані",
        icon: XCircle,
        count: filterCounts.canceled,
      },
      {
        key: "archive",
        label: "Завершені сеанси",
        icon: PartyPopper,
        count: filterCounts.archive,
      },
    ],
    [filterCounts],
  );

  const bookingDateOptions = [
    { key: "all", label: "Увесь період", icon: CalendarDays },
    { key: "today", label: "Сьогодні", icon: CalendarCheck },
    { key: "week", label: "Цей тиждень", icon: CalendarDays },
    { key: "nextWeek", label: "Наступний тиждень", icon: ChevronRight },
    { key: "month", label: "Цей місяць", icon: CalendarDays },
    { key: "custom", label: "Період", icon: CalendarDays },
  ];

  const selectedStatusFilter =
    bookingStatusOptions.find((item) => item.key === filter) ||
    bookingStatusOptions[0];

  const selectedDateFilter =
    bookingDateOptions.find((item) => item.key === dateFilter) ||
    bookingDateOptions[0];

  const selectedDateFilterLabel =
    dateFilter === "custom"
      ? `${customDateFrom ? `від ${formatDateUA(customDateFrom)}` : "від не вибрано"} ${
          customDateTo ? `до ${formatDateUA(customDateTo)}` : "до не вибрано"
        }`
      : selectedDateFilter?.label || "Увесь період";
  const SelectedStatusHintIcon = selectedStatusFilter?.icon || ListTodo;
  const SelectedDateHintIcon = selectedDateFilter?.icon || CalendarDays;
  function resetStatusFilter() {
    setFilter("all");
    setVisibleBookingCount(10);
  }

  function resetDateFilter() {
    setDateFilter("all");
    setCustomDateFrom(null);
    setCustomDateTo(null);
    setVisibleBookingCount(10);
  }
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

  async function handleCreateManualBooking() {
    try {
      setManualBookingError("");

      if (
        !manualClientId ||
        !manualServiceId ||
        !manualMasterId ||
        !manualDate ||
        !manualTime
      ) {
        throw new Error("Оберіть клієнта, послугу, майстра, дату та час.");
      }

      if (!manualDayConfig || !manualSlots.includes(manualTime)) {
        setManualTime("");
        throw new Error("Обраний час не входить у робочий графік.");
      }

      if (manualBusyTimes.has(manualTime)) {
        setManualTime("");
        throw new Error("Цей час уже зайнятий. Оберіть інший слот.");
      }

      setManualBookingSaving(true);

      const token = localStorage.getItem("token");
      const targetStudioId = studioId || localStorage.getItem("studioId");
      const busyParams = new URLSearchParams({
        date: manualDate,
        masterId: String(manualMasterId),
        serviceId: String(manualServiceId),
      });
      const busyRes = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/studio/${targetStudioId}/busy?${busyParams.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      const busyData = await busyRes.json().catch(() => null);

      if (!busyRes.ok) {
        throw new Error(
          busyData?.message || "Не вдалося перевірити доступність часу.",
        );
      }

      const latestBusyTimes = new Set(
        (Array.isArray(busyData?.busy) ? busyData.busy : [])
          .map((item) =>
            parseTimeToHHMM(
              typeof item === "string" ? item : item?.time || item?.start,
            ),
          )
          .filter(Boolean),
      );
      setManualBusyTimes(latestBusyTimes);

      if (latestBusyTimes.has(manualTime)) {
        setManualTime("");
        throw new Error(
          "Слот щойно зайняли. Дані оновлено — оберіть інший час.",
        );
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/owner/studio/${targetStudioId}/manual-booking`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studioClientId: manualClientId,
            serviceId: manualServiceId,
            masterId: manualMasterId,
            date: manualDate,
            time: manualTime,
          }),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Не вдалося створити запис.");
      }

      setManualBookingOpen(false);
      setManualClientId("");
      setManualServiceId("");
      setManualMasterId("");
      setManualDate("");
      setManualTime("");
      setManualBusyTimes(new Set());
    } catch (e) {
      setManualBookingError(e?.message || "Не вдалося створити запис.");
    } finally {
      setManualBookingSaving(false);
    }
  }

  function scrollManualTimeRow(direction) {
    const container = manualTimeRowRef.current;
    if (!container) return;

    container.scrollBy({
      left: direction * Math.max(220, container.clientWidth * 0.75),
      behavior: "smooth",
    });
  }

  return (
    <div className="h-full">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="relative overflow-hidden rounded-[15px] border border-[#ebe7df] bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-7">
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

            <div
              role="tablist"
              aria-label="Перемикання вигляду записів"
              className="relative grid w-[248px] min-w-[248px] shrink-0 grid-cols-2 self-center overflow-hidden rounded-2xl border border-[#eadbc9] bg-white p-1  sm:self-start"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute bottom-1 left-1 top-1 w-[calc(50%_-_0.25rem)] rounded-xl bg-[#ff5a00] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  tab === "calendar" ? "translate-x-full" : "translate-x-0",
                )}
              />

              <button
                type="button"
                role="tab"
                aria-selected={tab === "list"}
                onClick={() => setTab("list")}
                className={cn(
                  "relative z-10 inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-300 sm:px-4 sm:py-2.5 sm:text-sm",
                  tab === "list"
                    ? "text-white"
                    : "text-[#202020] hover:text-[#ff5a00] active:scale-[0.98]",
                )}
              >
                <List
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    tab === "list" ? "scale-110" : "scale-100",
                  )}
                />
                Список
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={tab === "calendar"}
                onClick={() => setTab("calendar")}
                className={cn(
                  "relative z-10 inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-300 sm:px-4 sm:py-2.5 sm:text-sm",
                  tab === "calendar"
                    ? "text-white"
                    : "text-[#202020] hover:text-[#ff5a00] active:scale-[0.98]",
                )}
              >
                <CalendarDays
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    tab === "calendar" ? "scale-110" : "scale-100",
                  )}
                />
                Календар
              </button>
            </div>
          </div>
        </div>

        {tab === "list" && (
          <SectionCard
            className="!overflow-visible"
            title={
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-buttom)] text-white sm:h-12 sm:w-12">
                  <ListTodo className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-[17px] font-black tracking-[-0.03em] text-[#202020] sm:text-lg">
                    Усі записи
                  </h2>

                  <p className="mt-1 max-w-[620px] text-[13px] font-medium leading-5 text-[var(--color-caramel)] sm:text-sm sm:leading-6">
                    Переглядайте записи за статусами, датою та типом бронювання.
                  </p>
                </div>
              </div>
            }
            actions={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
<Button
  variant="primary"
  size="md"
  onClick={() => setManualBookingOpen(true)}
  className="
    inline-flex h-14 w-full items-center justify-center gap-2
    rounded-[12px]
    !bg-[#202020]
    text-[15px] font-black text-white
    shadow-[0_12px_26px_rgba(15,15,15,0.18)]
    transition-all duration-300
    hover:scale-[1.015]
    hover:!bg-[#ff6200]
    active:scale-[0.98]
    disabled:pointer-events-none
    disabled:!bg-[#f1ebe4]
    disabled:text-[#aaa19a]
    disabled:shadow-none
    disabled:opacity-100
    max-[639px]:h-11
    max-[639px]:rounded-[16px]
    max-[639px]:gap-1.5
    max-[639px]:text-[12px]
    sm:h-10
    sm:w-auto
    sm:min-w-[160px]
    sm:px-4
    sm:text-[13px]
  "
>
  <UserPlus className="h-4 w-4" />
  Додати запис вручну
</Button>

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
              </div>
            }
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <BookingFilterSelect
                label="Статус"
                value={filter}
                options={bookingStatusOptions}
                open={bookingFilterOpen}
                setOpen={(value) => {
                  setBookingFilterOpen(value);
                  setBookingDateFilterOpen(false);
                }}
                selectRef={bookingFilterRef}
                onChange={(nextValue) => {
                  setFilter(nextValue);
                  setVisibleBookingCount(10);
                }}
              />

              <BookingFilterSelect
                label="Дата"
                value={dateFilter}
                options={bookingDateOptions}
                open={bookingDateFilterOpen}
                setOpen={(value) => {
                  setBookingDateFilterOpen(value);
                  setBookingFilterOpen(false);
                }}
                selectRef={bookingDateFilterRef}
                onChange={(nextValue) => {
                  setDateFilter(nextValue);
                  setVisibleBookingCount(10);
                }}
              />
            </div>
            {(filter !== "all" || dateFilter !== "all") && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {filter !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#ffd6bd] bg-[#fffaf6] px-3 py-1.5 text-xs font-black text-[#ff6200] shadow-sm">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#fff1e8] text-[#ff6200]">
                      <SelectedStatusHintIcon className="h-3.5 w-3.5" />
                    </span>

                    {selectedStatusFilter?.label}

                    <button
                      type="button"
                      onClick={resetStatusFilter}
                      className="-mr-1 grid h-5 w-5 place-items-center rounded-full text-[#ff6200] transition hover:bg-[#fff1e8] active:scale-95"
                      aria-label="Очистити фільтр статусу"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}

                {dateFilter !== "all" && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#ffd6bd] bg-[#fffaf6] px-3 py-1.5 text-xs font-black text-[#ff6200] shadow-sm">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#fff1e8] text-[#ff6200]">
                      <SelectedDateHintIcon className="h-3.5 w-3.5" />
                    </span>

                    {selectedDateFilterLabel}

                    <button
                      type="button"
                      onClick={resetDateFilter}
                      className="-mr-1 grid h-5 w-5 place-items-center rounded-full text-[#ff6200] transition hover:bg-[#fff1e8] active:scale-95"
                      aria-label="Очистити фільтр дати"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {dateFilter === "custom" && (
              <div className="mt-4 border-t border-[#eadbc9] pt-4">
                <div className="flex justify-center">
                  <div className="w-full max-w-[320px] rounded-[24px] border border-[#eadbc9] bg-[#fffaf6] p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                    <div className="flex gap-2 max-[639px]:items-end">
                      {[
                        {
                          label: "Дата від",
                          value: customDateFrom,
                          onChange: setCustomDateFrom,
                          ref: datePickerFromRef,
                        },
                        {
                          label: "Дата до",
                          value: customDateTo,
                          onChange: setCustomDateTo,
                          ref: datePickerToRef,
                        },
                      ].map((item) => (
                        <label key={item.label} className="group block">
                          <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-[0.1em] text-[#aaa19a]">
                            {item.label}
                          </span>

                          <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[#ff6200]" />

                            <DatePicker
                              ref={item.ref}
                              selected={item.value}
                              onChange={(date) => {
                                item.onChange(date);
                                setVisibleBookingCount(10);

                                setTimeout(() => {
                                  item.ref.current?.setOpen(false);
                                }, 0);
                              }}
                              locale={uk}
                              dateFormat="dd.MM.yyyy"
                              calendarStartDay={1}
                              shouldCloseOnSelect={true}
                              placeholderText="Оберіть дату"
                              readOnly
                              inputMode="none"
                              onKeyDown={(e) => e.preventDefault()}
                              popperPlacement="top-start"
                              popperClassName="z-[9999] datepicker-popper-mobile"
                              className="h-9 w-full rounded-xl border border-[#eadbc9] bg-white pl-8 pr-2 text-[12px] font-bold text-[#202020] shadow-sm outline-none transition-all duration-200 hover:border-[#ffd6bd] focus:border-[#ff6200] focus:ring-4 focus:ring-[#ff6200]/10"
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            <SectionCard>
              <div className="rounded-2xl border-2 border-dashed border-[#eadbc9] bg-[#fff7f0] p-6 text-center sm:p-8">
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                    <EmptyIcon className="h-7 w-7 text-[#ff5a00]" />
                  </div>
                </div>

                <p className="text-sm font-bold text-[var(--color-ink)]">
                  {filter === "all"
                    ? "Сьогодні ще немає жодного запису."
                    : emptyInfo.title}
                </p>

                <p className="mt-1 text-xs text-[var(--color-caramel)]/80">
                  {filter === "all"
                    ? "Коли клієнти почнуть записуватись, тут з’являться всі бронювання"
                    : emptyInfo.description}
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
                    className="overflow-hidden rounded-[15px] border border-[#eadbc9] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
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

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center text-[#202020]">
                        {isCollapsed ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronUp className="h-5 w-5" />
                        )}
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="space-y-3 p-3 sm:p-4">
                        {items.map((b) => (
                          <AppointmentCard
                            key={b.id}
                            item={b}
                            nowTs={nowTs}
                            onOpen={(id) => setDetailsId(id)}
                          />
                        ))}
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
                <span className="h-2 w-2 rounded-full bg-[#ff6200]" />Є записи,
                що очікують підтвердження
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
                      iconColor: "text-[#ffb020]",
                      pillText: "text-[#ffb020]",
                      accent: "text-[#ffb020]",
                    };

            const StatusIcon = statusMeta.Icon;
            const clientName = getCurrentClientName(selectedBooking);
            const rawPhone = String(selectedBooking.clientPhone || "").trim();

const phone =
  rawPhone && rawPhone !== "—" && rawPhone !== "null"
    ? rawPhone
    : "";
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
            const dateLabel = formatDateLongUA(selectedBooking?.date);
            const closeDetails = () => {
              setDetailsId(null);
              setCopiedPhone(false);
              setShowDetailsScrollHint(true);
            };
            const clientPhoto = toPublicUrl(
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
                className="fixed inset-0 z-[220] flex items-end justify-center bg-[#1b1b1b]/35 p-0 backdrop-blur-[10px] sm:items-center sm:p-5"
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
                        <Clock3
                          className={cn("h-4 w-4", statusMeta.iconColor)}
                        />

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
                          Вартість
                        </p>

                        <p className="mt-1 text-sm font-black text-[#202020]">
                          {price != null ? `${price} грн` : "—"}
                        </p>
                      </div>

                      <div className="flex min-h-[90px] flex-col items-center justify-center rounded-[22px] border border-white/70 bg-white/88 p-3 text-center shadow-sm backdrop-blur">
                        <Timer
                          className={cn("h-4 w-4", statusMeta.iconColor)}
                        />

                        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#aaa19a]">
                          Тривалість
                        </p>

                        <p className="mt-1 text-sm font-black text-[#202020]">
                          {duration != null ? `${duration} хв` : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative bg-white flex min-h-0 flex-1 flex-col px-4 pt-4 sm:px-6">
                    <div
                      className="calendar-day-scroll min-h-0 flex-1 overflow-y-auto pb-28 sm:pb-24"
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
<div className="grid gap-3 sm:grid-cols-2">
  {/* Клієнт */}
  <div className="min-h-[90px] rounded-[24px] border border-[#eadfce] bg-white p-3 max-[639px]:min-h-[66px] max-[639px]:rounded-[20px] max-[639px]:p-2.5 sm:col-span-2">
    <div className="flex h-full items-center gap-3 max-[639px]:gap-2.5">
      <div className="h-[62px] w-[62px] shrink-0 overflow-hidden rounded-full border border-[#eadfce] bg-white p-1 max-[639px]:h-[46px] max-[639px]:w-[46px] max-[639px]:p-0.5">
        {clientPhoto ? (
          <img
            src={clientPhoto}
            alt={clientName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#fff1e8] text-[#ff6200]">
            <UserRound className="h-5 w-5 max-[639px]:h-4 max-[639px]:w-4" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase leading-none tracking-[0.12em] text-[#aaa19a] max-[639px]:text-[8px]">
          Клієнт
        </p>

        <p className="mt-1 truncate text-[15px] font-black leading-tight text-[#202020] max-[639px]:text-[18px]">
          {clientName}
        </p>

        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 max-[639px]:gap-1">
          <p className="min-w-0 truncate text-[12px] font-semibold leading-tight text-[#77716b] max-[639px]:text-[12px]">
            {phone || "Номер телефона не вказано"}
          </p>

          {phone && (
            <button
              type="button"
              onClick={() => handleCopyPhone(phone)}
              className="
                flex h-7 w-7 shrink-0 items-center justify-center
                rounded-lg text-[#aaa19a]
                transition-all duration-200
                hover:bg-[#fff1e8]
                hover:text-[#ff6200]
                active:scale-[0.92]
                max-[639px]:h-6
                max-[639px]:w-6
              "
              title={copiedPhone ? "Скопійовано" : "Скопіювати номер"}
              aria-label={
                copiedPhone
                  ? "Номер скопійовано"
                  : "Скопіювати номер"
              }
            >
              {copiedPhone ? (
                <CheckCheck className="h-4 w-4 text-emerald-600 max-[639px]:h-3.5 max-[639px]:w-3.5" />
              ) : (
                <Copy className="h-4 w-4 max-[639px]:h-3.5 max-[639px]:w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {phone && (
        <a
          href={`tel:${phone}`}
          className="
            flex h-10 w-10 shrink-0 items-center justify-center
            text-[#77716b]
            transition-all duration-200
            hover:scale-[1.06]
            hover:text-[#ff6200]
            active:scale-[0.94]
            max-[639px]:h-8
            max-[639px]:w-8
          "
          title="Подзвонити"
          aria-label="Подзвонити"
        >
          <PhoneCall
            className="h-6 w-6 max-[639px]:h-5 max-[639px]:w-5"
            strokeWidth={2.2}
          />
        </a>
      )}
    </div>
  </div>

  {/* Майстер */}
  <div className="min-h-[90px] rounded-[24px] border border-[#eadfce] bg-white p-3 max-[639px]:min-h-[66px] max-[639px]:rounded-[20px] max-[639px]:p-2.5 sm:col-span-2">
    <div className="flex h-full items-center gap-3 max-[639px]:gap-2.5">
      <div className="h-[62px] w-[62px] shrink-0 overflow-hidden rounded-full border border-[#eadfce] bg-white p-1 max-[639px]:h-[46px] max-[639px]:w-[46px] max-[639px]:p-0.5">
        {masterPhoto ? (
          <img
            src={masterPhoto}
            alt={masterName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#fff1e8] text-[#ff6200]">
            <UserRound className="h-5 w-5 max-[639px]:h-4 max-[639px]:w-4" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase leading-none tracking-[0.12em] text-[#aaa19a] max-[639px]:text-[8px]">
          Майстер
        </p>

        <p className="mt-1 truncate text-[15px] font-black leading-tight text-[#202020] max-[639px]:text-[18px]">
          {masterName}
        </p>

        <p className="mt-0.5 truncate text-[12px] font-semibold leading-tight text-[#77716b] max-[639px]:text-[10px]">
          Виконавець послуги
        </p>
      </div>

      <div className="h-10 w-10 shrink-0 max-[639px]:h-8 max-[639px]:w-8" />
    </div>
  </div>
</div>
                    </div>

{!isArchived && !isCanceled && (
  <div className="absolute inset-x-0 bottom-0 border-[#eadfce] bg-white/92 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-6 sm:pb-5">
    <div className="grid grid-cols-2 gap-3">
      {!isCanceled && (
        <button
          type="button"
          onClick={() => {
            closeDetails();
            setCancelConfirmId(selectedBooking.id);
          }}
          className={cn(
            `
              inline-flex h-12 min-w-0 items-center justify-center gap-2
              rounded-[15px] border border-[#ef4444]/45
              bg-white px-3
              text-sm font-black text-[#ef4444]
              shadow-[0_10px_22px_rgba(239,68,68,0.08)]
              transition-all duration-300
              hover:scale-[1.015]
              hover:border-[#ef4444]
              hover:bg-[#ef4444]
              hover:text-white
              hover:shadow-[0_12px_26px_rgba(239,68,68,0.22)]
              active:scale-[0.98]
              disabled:pointer-events-none
              disabled:border-[#eadfce]
              disabled:bg-[#f1ebe4]
              disabled:text-[#aaa19a]
              disabled:shadow-none
            `,
            isConfirmed && "col-span-2",
          )}
        >
          <XCircle className="h-4 w-4 shrink-0" />

          <span className="truncate">
            Скасувати запис
          </span>
        </button>
      )}

      {!isConfirmed && !isCanceled && (
        <button
          type="button"
          onClick={async () => {
            await confirmBooking(selectedBooking.id);
            closeDetails();
          }}
          className="
            inline-flex h-12 min-w-0 items-center justify-center gap-2
            rounded-[15px] bg-[#202020] px-3
            text-sm font-black text-white
            shadow-[0_12px_26px_rgba(15,15,15,0.18)]
            transition-all duration-300
            hover:scale-[1.015]
            hover:bg-[#ff6200]
            hover:shadow-[0_14px_30px_rgba(255,98,0,0.24)]
            active:scale-[0.98]
            disabled:pointer-events-none
            disabled:bg-[#f1ebe4]
            disabled:text-[#aaa19a]
            disabled:shadow-none
          "
        >
          <CheckCheck className="h-4 w-4 shrink-0" />

          <span className="truncate">
            Підтвердити
          </span>
        </button>
      )}
    </div>
  </div>
)}
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

const statusKey = isArchived
  ? "completed"
  : isConfirmed
    ? "confirmed"
    : isCanceled
      ? "canceled"
      : "new";

const statusBadge = {
  canceled: {
    label:
      b.canceledBy === "client" ? "Скасовано клієнтом" : "Скасовано вами",
    className:
      "border-[var(--color-canceled-light)] text-[var(--color-canceled-dark)]",
    icon: XCircle,
  },

  confirmed: {
    label: "Підтверджено",
    className:
      "border-[var(--color-confirmed-light)] text-[var(--color-confirmed-dark)]",
    icon: CheckCheck,
  },

  completed: {
    label: "Сеанс завершено",
    className:
      "border-[var(--color-archived-light)] text-[var(--color-archived-dark)]",
    icon: PartyPopper,
  },

  new: {
    label: "Очікує підтвердження",
    className: "border-[var(--color-pending-light)] text-[#ffb020]",
    icon: Clock,
  },
}[statusKey];

const StatusIcon = statusBadge.icon;

const clientName = getCurrentClientName(b);

const masterName =
  b.masterName ||
  b.master?.name ||
  b.staffName ||
  b.employeeName ||
  "Довільний майстер";

const clientPhoto = toPublicUrl(
  b.clientPhotoUrl ||
    b.clientPhoto ||
    b.client?.photoUrl ||
    b.client?.photo ||
    b.client?.avatar ||
    "",
);

const masterPhoto = toPublicUrl(
  b.masterPhotoUrl ||
    b.masterPhoto ||
    b.master?.photoUrl ||
    b.master?.photo ||
    b.master?.avatar ||
    "",
);

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
    "inline-flex items-center justify-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[10px] font-black shadow-sm transition-all duration-200 group-hover:bg-white",
    statusBadge.className,
  )}
>
  <StatusIcon className="h-3.5 w-3.5" />

  <span className="whitespace-nowrap text-center leading-[1.05]">
    {statusBadge.label}
  </span>
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
  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[#eadfce] bg-white p-0.5 shadow-sm">
    {clientPhoto ? (
      <img
        src={clientPhoto}
        alt={clientName}
        className="h-full w-full rounded-full object-cover"
      />
    ) : (
      <div className="grid h-full w-full place-items-center rounded-full bg-[#fff1e8] text-[#ff6200]">
        <UserRound className="h-5 w-5" />
      </div>
    )}
  </div>

  <div className="min-w-0">
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-forest)]">
      Клієнт
    </p>

    <p className="truncate text-sm font-bold text-[var(--color-ink)]">
      <TwoLineName value={clientName} />
    </p>
  </div>
</div>

<div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3">
  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[#eadfce] bg-white p-0.5 shadow-sm">
    {masterPhoto ? (
      <img
        src={masterPhoto}
        alt={masterName}
        className="h-full w-full rounded-full object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#fff1e8] text-[11px] font-black text-[#ff6200]">
        {masterName?.[0] || "М"}
      </div>
    )}
  </div>

  <div className="min-w-0">
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-forest)]">
      Майстер
    </p>

    <p className="truncate text-sm font-bold text-[var(--color-ink)]">
      <TwoLineName value={masterName} />
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
    `
      inline-flex h-11 items-center justify-center gap-2
      rounded-2xl px-4
      bg-[#202020]
      text-sm font-black text-white
      shadow-[0_12px_26px_rgba(15,15,15,0.18)]
      transition-all duration-300
      hover:scale-[1.015]
      hover:bg-[#ff6200]
      hover:shadow-[0_14px_30px_rgba(255,98,0,0.24)]
      active:scale-[0.98]
      disabled:pointer-events-none
      disabled:bg-[#f1ebe4]
      disabled:text-[#aaa19a]
      disabled:shadow-none
    `,
    actionsCount > 1
      ? "w-full"
      : "min-w-[160px]",
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
                                            actionsCount > 1
                                              ? "w-full"
                                              : "min-w-[160px]",
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
                                            actionsCount > 1
                                              ? "w-full"
                                              : "min-w-[160px]",
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
      <Modal
        open={manualBookingOpen}
        onClose={() => setManualBookingOpen(false)}
        title="Новий запис"
        badge="Онлайн запис"
        icon={Sparkles}
        subtitle="Оберіть клієнта, послугу, майстра, дату та час."
        size="lg"
        contentClassName="!overflow-hidden !p-0 sm:!p-0"
      >
        <StudioBookingWidget
          bookingMode="owner"
          clients={clients}
          studio={{
            ...studio,
            id: studioId,
            services,
            masters,
            schedule: manualStudioSchedule,
            scheduleDays: manualStudioSettings.scheduleDays,
            scheduleExceptions: manualStudioExceptions,
            slotDuration:
              manualStudioSettings.slotDuration || studio?.slotDuration || 15,
          }}
          schedule={manualStudioSchedule}
          scheduleExceptions={manualStudioExceptions}
          slotDuration={
            manualStudioSettings.slotDuration || studio?.slotDuration || 15
          }
          onCancel={() => setManualBookingOpen(false)}
          onSuccess={(data) => {
            setManualBookingOpen(false);
            setManualSuccessData(data);
          }}
        />
      </Modal>

      {manualSuccessData && (
        <BookingSuccessModal
          bookingDetails={manualSuccessData}
          onClose={() => setManualSuccessData(null)}
          onViewBookings={() => setManualSuccessData(null)}
        />
      )}


    </div>
  );
}
