// Golowna.jsx
import { Activity, useEffect, useMemo, useRef, useState } from "react";
import { useBookings } from "../context/bookings/useBookings";
import { api } from "../api/http";
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
  AlertTriangle,
  Trash2,
  Check,
  X,
  XCircle,
  FolderClock,
  UserRound,
  Copy,
  Clock3,
  Banknote,
  Timer,
  Phone,
  CircleCheck,
  CircleAlert,
  CircleCheckBig,
  SquarePen,
  ClockCheck,
  ClockAlert,
  CirclePause,
  CirclePlay,
  ChartColumn,
  LayoutGrid,
  MoreHorizontal,
  BadgeCheck,
  SlidersHorizontal,
  SquareArrowOutUpRight,
  Scissors,
  CopyCheck,
  ClipboardPen,
  PhoneCall,
  Minus,
  Plus,
} from "lucide-react";
import { socket } from "../lib/socket";

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

function MonthlyBookingsChart({
  bookings = [],
  nowTs,
  onModeChange,
  onOpenBooking,
  studioCreatedAt,
  viewSwitcher = null,
}) {
  const [isMobileChart, setIsMobileChart] = useState(
    () => window.innerWidth < 640,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileChart(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [studioSchedule, setStudioSchedule] = useState(null);
  const [studioExceptions, setStudioExceptions] = useState([]);
  const initialChartTab = useMemo(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("bookings-chart-active-tab") || "null",
      );

      if (saved?.type === "today") {
        return { type: "today", date: null };
      }

      if (saved?.type === "month" && saved.date) {
        const date = new Date(saved.date);

        if (!Number.isNaN(date.getTime())) {
          date.setDate(1);
          date.setHours(0, 0, 0, 0);
          return { type: "month", date };
        }
      }
    } catch {
      // Ignore broken saved state and fall back to today.
    }

    return { type: "today", date: null };
  }, []);

  const today = useMemo(() => {
    const d = new Date(nowTs);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [nowTs]);

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d =
      initialChartTab.type === "month" && initialChartTab.date
        ? new Date(initialChartTab.date)
        : new Date(nowTs);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    async function loadStudioSchedule() {
      const token = localStorage.getItem("token");
      const studioId = localStorage.getItem("studioId");

      if (!token || !studioId) return;

      try {
        const [scheduleData, exceptionsData] = await Promise.all([
          api(`/studio/${studioId}/schedule`, { token }),
          api(`/studio/${studioId}/schedule/exceptions`, { token }),
        ]);

        setStudioSchedule(scheduleData?.schedule || null);

        setStudioExceptions(
          Array.isArray(exceptionsData?.exceptions)
            ? exceptionsData.exceptions.map((item) => ({
                ...item,
                date: String(item.date || "").slice(0, 10),
              }))
            : [],
        );
      } catch {
        setStudioSchedule(null);
        setStudioExceptions([]);
      }
    }

    loadStudioSchedule();
  }, []);

  const [activeDayKey, setActiveDayKey] = useState(null);
  const [pinnedDayKey, setPinnedDayKey] = useState(null);
  const [chartMode, setChartMode] = useState(initialChartTab.type);
  const [chartDayKey, setChartDayKey] = useState(null);
  const [chartHourKey, setChartHourKey] = useState(null);
  const [chartSelectionFilter, setChartSelectionFilter] = useState("all");
  const [chartRangeOpen, setChartRangeOpen] = useState(false);
const [visibleBookingsCount, setVisibleBookingsCount] = useState(5);

useEffect(() => {
  const isOpen =
    chartDayKey || chartHourKey || chartRangeOpen;

  if (!isOpen) return;

  const scrollY = window.scrollY;

  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";

  return () => {
    const y = Math.abs(
      parseInt(document.body.style.top || "0", 10),
    );

    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";

    window.scrollTo(0, y);
  };
}, [chartDayKey, chartHourKey, chartRangeOpen]);

  const chartRangeBookings = useMemo(() => {
  return (bookings || [])
    .filter((b) => {
      if (!b?.id || b.status === "deleted") return false;

      if (chartMode === "today") {
        return b.date === toISODateKey(today);
      }

      const d = new Date(b.date);
      if (Number.isNaN(d.getTime())) return false;

      return (
        d.getFullYear() === visibleMonth.getFullYear() &&
        d.getMonth() === visibleMonth.getMonth()
      );
    })
    .sort((a, c) => {
      const dateCompare = String(a.date || "").localeCompare(
        String(c.date || ""),
      );

      if (dateCompare !== 0) return dateCompare;

      return (parseTimeToHHMM(a.time) || "").localeCompare(
        parseTimeToHHMM(c.time) || "",
      );
    });
}, [bookings, chartMode, today, visibleMonth]);

const chartFilteredRangeBookings = useMemo(() => {
  if (chartSelectionFilter === "confirmed") {
    return chartRangeBookings.filter(
      (b) => b.status === "confirmed",
    );
  }

  if (chartSelectionFilter === "pending") {
    return chartRangeBookings.filter(
      (b) => b.status !== "confirmed" &&
             b.status !== "canceled",
    );
  }

  if (chartSelectionFilter === "canceled") {
    return chartRangeBookings.filter(
      (b) => b.status === "canceled",
    );
  }

  return chartRangeBookings;
}, [chartRangeBookings, chartSelectionFilter]);

  useEffect(() => {
    onModeChange?.(chartMode);
  }, [chartMode, onModeChange]);

  const data = useMemo(() => {
    if (chartMode === "today") {
      const todayKey = toISODateKey(new Date(nowTs));

      const hours = Array.from({ length: 24 }, (_, hour) => ({
        day: hour,
        hour,
        date: new Date(nowTs),
        key: `${todayKey}-${pad2(hour)}`,
        label: `${pad2(hour)}:00`,
        weekday: "",
        count: 0,
        confirmed: 0,
        pending: 0,
        canceled: 0,
      }));

      for (const booking of bookings || []) {
        if (!booking?.date) continue;
        if (booking.status === "deleted") continue;
        if (booking.date !== todayKey) continue;

        const dt = getBookingDateTime(booking);
        if (!dt) continue;

        const hour = dt.getHours();
        const isCanceled = booking.status === "canceled";

        hours[hour] = {
          ...hours[hour],
          count: hours[hour].count + (isCanceled ? 0 : 1),
          confirmed:
            hours[hour].confirmed + (booking.status === "confirmed" ? 1 : 0),
          pending:
            hours[hour].pending +
            (!isCanceled && booking.status !== "confirmed" ? 1 : 0),
          canceled: hours[hour].canceled + (isCanceled ? 1 : 0),
        };
      }

      return hours;
    }

    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);

      return {
        day: i + 1,
        date,
        key: toISODateKey(date),
        label: String(i + 1),
        weekday: getWeekdayShortUA(date),
        count: 0,
        confirmed: 0,
        pending: 0,
        canceled: 0,
      };
    });

    for (const booking of bookings || []) {
      if (!booking?.date) continue;
      if (booking.status === "deleted") continue;

      const d = new Date(booking.date);
      if (Number.isNaN(d.getTime())) continue;
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;

      const index = d.getDate() - 1;
      const isCanceled = booking.status === "canceled";

      days[index] = {
        ...days[index],
        count: days[index].count + (isCanceled ? 0 : 1),
        confirmed:
          days[index].confirmed + (booking.status === "confirmed" ? 1 : 0),
        pending:
          days[index].pending +
          (!isCanceled && booking.status !== "confirmed" ? 1 : 0),
        canceled: days[index].canceled + (isCanceled ? 1 : 0),
      };
    }

    return days;
  }, [bookings, visibleMonth, chartMode, nowTs]);

  const liveKpi = useMemo(() => {
    let today = 0;
    let confirmed = 0;
    let pending = 0;
    let canceled = 0;
    let total = 0;

    const todayKey = toISODateKey(new Date(nowTs));

    for (const booking of bookings || []) {
      if (!booking?.date) continue;
      if (booking.status === "deleted") continue;

      const dt = getBookingDateTime(booking);
      if (!dt) continue;

      const isCanceled = booking.status === "canceled";
      const isArchived = dt.getTime() < nowTs;

      if (chartMode === "today") {
        if (booking.date !== todayKey) continue;

        total += 1;

        if (isCanceled) {
          canceled += 1;
        } else if (booking.status === "confirmed") {
          confirmed += 1;
        } else if (!isCanceled) {
          pending += 1;
        }

        if (!isArchived && !isCanceled) {
          today += 1;
        }

        continue;
      }

      if (
        dt.getFullYear() !== visibleMonth.getFullYear() ||
        dt.getMonth() !== visibleMonth.getMonth()
      ) {
        continue;
      }

      if (!isCanceled) {
        total += 1;
      }

      if (booking.date === todayKey && !isCanceled) {
        today += 1;
      }

      if (booking.status === "confirmed" && !isCanceled) {
        confirmed += 1;
      } else if (!isCanceled) {
        pending += 1;
      }
    }

    return { today, confirmed, pending, canceled, total };
  }, [bookings, nowTs, chartMode, visibleMonth]);

  const chart = useMemo(() => {
    const height = 300;
    const width = Math.max(720, data.length * 18);
    const padding = isMobileChart
      ? {
          top: 30,
          right: 48,
          bottom: 40,
          left: 10,
        }
      : {
          top: 32,
          right: 48,
          bottom: 40,
          left: 10,
        };

    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const max = Math.max(...data.map((item) => item.count), 1);
    const stepX = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;
    const barWidth = Math.max(16, Math.min(22, stepX * 0.52));

    const points = data.map((item, index) => {
      const x = padding.left + index * stepX;
      const y = padding.top + innerHeight - (item.count / max) * innerHeight;

      return { ...item, x, y };
    });

    const gridValues =
      max <= 6
        ? Array.from({ length: max + 1 }, (_, index) => max - index)
        : Array.from(
            new Set(
              Array.from({ length: 5 }, (_, index) =>
                Math.round(max - max * (index / 4)),
              ),
            ),
          );

    const grid = gridValues.map((value) => {
      const ratio = 1 - value / max;
      const y = padding.top + innerHeight * ratio;

      return { y, value };
    });

    return {
      width,
      height,
      padding,
      innerHeight,
      max,
      barWidth,
      points,
      grid,
    };
  }, [data, isMobileChart]);

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const activeDays = data.filter((item) => item.count > 0).length;
  const maxCount = Math.max(...data.map((item) => item.count), 0);

  const bestDays =
    maxCount > 0 ? data.filter((item) => item.count === maxCount) : [];

  const hoveredPoint = chart.points.find((item) => item.key === activeDayKey);
  const pinnedPoint = chart.points.find((item) => item.key === pinnedDayKey);
  const currentMonth = useMemo(() => {
    const d = new Date(nowTs);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [nowTs]);

  const chartTabs = useMemo(() => {
    const tabs = [];

    const start = new Date(studioCreatedAt || nowTs);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    let cursor = new Date(start);

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
  }, [studioCreatedAt, currentMonth, nowTs]);

  const [chartTabIndex, setChartTabIndex] = useState(() => {
    const currentIndex = chartTabs.findIndex((tab) => {
      if (initialChartTab.type === "today") return tab.type === "today";

      return (
        tab.type === "month" &&
        initialChartTab.date &&
        isSameMonth(tab.date, initialChartTab.date)
      );
    });

    return currentIndex >= 0 ? currentIndex : 0;
  });

  const activeChartTab = chartTabs[chartTabIndex];

  useEffect(() => {
    if (!activeChartTab) return;

    try {
      localStorage.setItem(
        "bookings-chart-active-tab",
        JSON.stringify({
          type: activeChartTab.type,
          date:
            activeChartTab.type === "month" && activeChartTab.date
              ? toISODateKey(activeChartTab.date)
              : null,
        }),
      );
    } catch {
      // Saving the selected chart tab is optional.
    }
  }, [activeChartTab]);

  const activePoint =
    hoveredPoint ||
    pinnedPoint ||
    chart.points.find(
      (item) => item.key === toISODateKey(today) && item.count > 0,
    ) ||
    (bestDays.length > 0
      ? chart.points.find((item) => item.key === bestDays[0].key)
      : null);
      const activePointIndex = activePoint
  ? chart.points.findIndex((item) => item.key === activePoint.key)
  : -1;

  const activePointTotal =
  activePoint
    ? activePoint.confirmed +
      activePoint.pending +
      activePoint.canceled
    : 0;

const activePointConfirmedPercent = activePointTotal
  ? Math.round((activePoint.confirmed / activePointTotal) * 100)
  : 0;

const activePointPendingPercent = activePointTotal
  ? Math.round((activePoint.pending / activePointTotal) * 100)
  : 0;

const activePointCanceledPercent = activePointTotal
  ? 100 - activePointConfirmedPercent - activePointPendingPercent
  : 0;

const goPrevPoint = () => {
  if (activePointIndex <= 0) return;

  const prev = chart.points[activePointIndex - 1];

  setPinnedDayKey(prev.key);
  setActiveDayKey(prev.key);
};

const goNextPoint = () => {
  if (activePointIndex >= chart.points.length - 1) return;

  const next = chart.points[activePointIndex + 1];

  setPinnedDayKey(next.key);
  setActiveDayKey(next.key);
};
  const monthLabel = visibleMonth.toLocaleDateString("uk-UA", {
    month: "long",
    year: "numeric",
  });

  const chartDayBookings = useMemo(() => {
    if (!chartDayKey) return [];

    return (bookings || [])
      .filter((b) => b?.id && b.date === chartDayKey && b.status !== "deleted")
      .sort((a, c) =>
        (parseTimeToHHMM(a.time) || "").localeCompare(
          parseTimeToHHMM(c.time) || "",
        ),
      );
  }, [bookings, chartDayKey]);

  const chartHourBookings = useMemo(() => {
    if (!chartHourKey) return [];

    return (bookings || [])
      .filter((b) => {
        if (!b?.id || b.status === "deleted") return false;
        if (b.date !== chartHourKey.date) return false;

        const dt = getBookingDateTime(b);
        return dt ? dt.getHours() === chartHourKey.hour : false;
      })
      .sort((a, c) =>
        (parseTimeToHHMM(a.time) || "").localeCompare(
          parseTimeToHHMM(c.time) || "",
        ),
      );
  }, [bookings, chartHourKey]);

  const chartSelectionBookings = chartHourKey
    ? chartHourBookings
    : chartDayBookings;
  const chartFilteredSelectionBookings = useMemo(() => {
    if (chartSelectionFilter === "confirmed") {
      return chartSelectionBookings.filter((b) => b.status === "confirmed");
    }

    if (chartSelectionFilter === "pending") {
      return chartSelectionBookings.filter(
        (b) => b.status !== "confirmed" && b.status !== "canceled",
      );
    }

    if (chartSelectionFilter === "canceled") {
      return chartSelectionBookings.filter((b) => b.status === "canceled");
    }

    return chartSelectionBookings;
  }, [chartSelectionBookings, chartSelectionFilter]);

  const chartSelectionTitle = {
    all: "Усі записи за вибрану дату",
    confirmed: "Підтверджені записи",
    pending: "Очікують підтвердження",
    canceled: "Скасовані записи",
  };

  const modalBookings = chartRangeOpen
  ? chartFilteredRangeBookings
  : chartFilteredSelectionBookings;

const displayedBookings = modalBookings.slice(0, visibleBookingsCount);

  const isCurrentMonth = isSameMonth(visibleMonth, today);
  function isStudioWorkingDay(date) {
    const dateKey = toISODateKey(date);

    const exception = studioExceptions.find((item) => item.date === dateKey);

    if (exception) {
      return Boolean(exception.enabled);
    }

    const dayKeyMap = {
      0: "sun",
      1: "mon",
      2: "tue",
      3: "wed",
      4: "thu",
      5: "fri",
      6: "sat",
    };

    const dayKey = dayKeyMap[date.getDay()];

    if (!studioSchedule) return true;

    return Boolean(studioSchedule?.[dayKey]?.enabled);
  }

  return (
    <SectionShell>
      <div className="px-4 pb-5 pt-5 sm:px-6 sm:pb-7 sm:pt-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#eadbc9] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#202020] shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff5a00] text-white">
                <ChartColumn className="h-3.5 w-3.5" />
              </span>
              Професійна аналітика
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-[28px] font-black leading-tight tracking-tight text-[var(--color-ink)] sm:text-[34px]">
                  Графік записів
                </h2>
                <p className="mt-1 max-w-2xl text-sm font-medium text-[var(--color-caramel)]">
                  Динаміка бронювань, статуси та пікові години в одному робочому
                  огляді.
                </p>
              </div>

              <div className="flex shrink-0 items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={chartTabIndex === 0}
                  onClick={() => {
                    const nextIndex = Math.max(0, chartTabIndex - 1);
                    const nextTab = chartTabs[nextIndex];

                    setChartTabIndex(nextIndex);
                    setChartMode(nextTab.type);
                    setPinnedDayKey(null);
                    setActiveDayKey(null);

                    if (nextTab.type === "month") {
                      setVisibleMonth(nextTab.date);
                    }
                  }}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#eadbc9] bg-white text-[#202020] shadow-sm transition-all duration-200 hover:border-[#ffd6bd] hover:bg-[#fff7f0] active:scale-[0.98] disabled:opacity-40"
                  aria-label="Попередній період"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="inline-flex h-11 min-w-[190px] items-center justify-center gap-2 rounded-2xl border border-[#eadbc9] bg-white px-4 text-sm font-black  shadow-sm">
                  <CalendarDays className="h-4 w-4 text-[#ff5a00]" />
                  <span className="capitalize">{activeChartTab.label}</span>
                </div>

                <button
                  type="button"
                  disabled={chartTabIndex === chartTabs.length - 1}
                  onClick={() => {
                    const nextIndex = Math.min(
                      chartTabs.length - 1,
                      chartTabIndex + 1,
                    );
                    const nextTab = chartTabs[nextIndex];

                    setChartTabIndex(nextIndex);
                    setChartMode(nextTab.type);
                    setPinnedDayKey(null);
                    setActiveDayKey(null);

                    if (nextTab.type === "month") {
                      setVisibleMonth(nextTab.date);
                    }
                  }}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#eadbc9] bg-white text-[#202020] shadow-sm transition-all duration-200 hover:border-[#ffd6bd] hover:bg-[#fff7f0] active:scale-[0.98] disabled:opacity-40"
                  aria-label="Наступний період"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {viewSwitcher && (
            <div className="flex justify-end xl:pt-0">{viewSwitcher}</div>
          )}
        </div>

<div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
  <ChartKpi
    label={
      chartMode === "today" ? (
        <>
          <span className="sm:hidden">
            Активні
            <br />
            сьогодні
          </span>
          <span className="hidden sm:inline">Активні сьогодні</span>
        </>
      ) : (
        <>
          <span className="sm:hidden">
            Підтверджені
            <br />
            записи
          </span>
          <span className="hidden sm:inline">Підтверджені записи</span>
        </>
      )
    }
    value={chartMode === "today" ? liveKpi.today : liveKpi.confirmed}
    icon={chartMode === "today" ? CalendarDays : BadgeCheck}
    tone="emerald"
onClick={() => {
  setChartSelectionFilter("confirmed");
  setVisibleBookingsCount(5);
  setChartRangeOpen(true);
}}
  />

  <ChartKpi
    label={
      <>
        <span className="sm:hidden">
          Очікують
          <br />
          підтвердження
        </span>
        <span className="hidden sm:inline">Очікують підтвердження</span>
      </>
    }
    value={liveKpi.pending}
    icon={ClockAlert}
    tone="amber"
onClick={() => {
  setChartSelectionFilter("pending");
  setVisibleBookingsCount(5);
  setChartRangeOpen(true);
}}
  />

  <ChartKpi
    label={
      <>
        <span className="sm:hidden">
          Скасовані
          <br />
          записи
        </span>
        <span className="hidden sm:inline">Скасовані записи</span>
      </>
    }
    value={liveKpi.canceled}
    icon={XCircle}
    tone="rose"
onClick={() => {
  setChartSelectionFilter("canceled");
  setVisibleBookingsCount(5);
  setChartRangeOpen(true);
}}
  />

  <ChartKpi
    label={
      chartMode === "today" ? (
        <>
          <span className="sm:hidden">
            Усього
            <br />
            записів
          </span>
          <span className="hidden sm:inline">Усього записів</span>
        </>
      ) : (
        <>
          <span className="sm:hidden">
            Усього
            <br />
            бронювань
          </span>
          <span className="hidden sm:inline">Усього бронювань</span>
        </>
      )
    }
    value={total}
    icon={LayoutGrid}
    tone="slate"
onClick={() => {
  setChartSelectionFilter("all");
  setVisibleBookingsCount(5);
  setChartRangeOpen(true);
}}
  />
</div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 overflow-hidden rounded-[30px] border border-[#ebe7df] bg-white shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
            <div className="border-b border-[var(--color-cream)] px-4 py-3 sm:px-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-xs font-bold text-[var(--color-caramel)]">
                  {chartMode === "today"
                    ? "Натисніть на годину для фіксації"
                    : "Натисніть на дату для фіксації"}
                </p>
              </div>
            </div>

            <div
              className="relative px-2 pt-4 sm:px-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setPinnedDayKey(null);
                  setActiveDayKey(null);
                }
              }}
            >
              <div className="overflow-x-auto">
                <svg
                  onMouseLeave={() => {
                    if (!pinnedDayKey) {
                      setActiveDayKey(null);
                    }
                  }}
                  viewBox={`0 0 ${chart.width} ${chart.height}`}
                  className="h-[330px] min-w-[620px] select-none sm:h-[380px] sm:min-w-[920px]"
                  role="img"
                  aria-label={
                    chartMode === "today"
                      ? "Графік записів за сьогодні"
                      : `Графік записів за ${monthLabel}`
                  }
                >
                  <defs>
                    <linearGradient
                      id="professionalBarGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#ff8c42" />
                      <stop offset="52%" stopColor="#ff5a00" />
                      <stop offset="100%" stopColor="#ef4f00" />
                    </linearGradient>
                    <linearGradient
                      id="professionalActiveGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#202020"
                        stopOpacity="0.16"
                      />
                      <stop
                        offset="100%"
                        stopColor="#202020"
                        stopOpacity="0.02"
                      />
                    </linearGradient>
                  </defs>

                  {chart.grid.map((line) => (
                    <g key={`grid-${line.value}-${line.y}`}>
                      <line
                        x1={chart.padding.left + 18}
                        x2={chart.width + 36 - chart.padding.right}
                        y1={line.y}
                        y2={line.y}
                        stroke="#eadbc9"
                        strokeDasharray="5 7"
                      />
                      <text
                        x={chart.padding.left + 5}
                        y={line.y + 4}
                        textAnchor="end"
                        className="fill-[#b48c6c] text-[11px] font-black"
                      >
                        {line.value}
                      </text>
                    </g>
                  ))}

                  {chart.points.map((item) => {
                    const baseY = chart.padding.top + chart.innerHeight;
                    const barHeight = baseY - item.y;
                    const isCurrent =
                      chartMode === "today"
                        ? item.hour === new Date(nowTs).getHours()
                        : item.key === toISODateKey(today);
                    const isActive = activePoint?.key === item.key;
                    const isPinned = pinnedDayKey === item.key;
                    const isNonWorkingDay =
                      chartMode === "month"
                        ? !isStudioWorkingDay(item.date)
                        : false;
                    const width = Math.max(14, chart.barWidth);
                    const x = item.x - width / 2 + 36;
                    const activeWidth = width + 8;
                    const labelColor =
                      isActive || isPinned
                        ? "#ff5a00"
                        : isCurrent
                          ? "#ef4f00"
                          : "#8a6b54";

                    return (
                      <g
                        key={item.key}
                        className="cursor-pointer outline-none"
                        tabIndex={0}
                        onMouseEnter={() => {
                          if (!pinnedDayKey) setActiveDayKey(item.key);
                        }}
                        onFocus={() => {
                          if (!pinnedDayKey) setActiveDayKey(item.key);
                        }}
                        onClick={() => {
                          setPinnedDayKey((prev) =>
                            prev === item.key ? null : item.key,
                          );
                          setActiveDayKey(item.key);
                        }}
                      >
                        <rect
                          x={x - 9}
                          y={chart.padding.top - 8}
                          width={width + 18}
                          height={chart.innerHeight + 70}
                          rx="12"
                          fill={
                            isActive || isPinned
                              ? "url(#professionalActiveGradient)"
                              : "transparent"
                          }
                        />

                        {isCurrent && (
                          <line
                            x1={x + width / 2}
                            x2={x + width / 2}
                            y1={chart.padding.top - 8}
                            y2={baseY + 10}
                            stroke="#ff5a00"
                            strokeWidth="2"
                            strokeDasharray="4 7"
                            opacity="0.7"
                          />
                        )}

                        <rect
                          x={x}
                          y={item.count > 0 ? item.y : baseY - 4}
                          width={width}
                          height={item.count > 0 ? Math.max(10, barHeight) : 8}
                          rx="3"
                          fill={
                            item.count > 0
                              ? "url(#professionalBarGradient)"
                              : chartMode === "today"
                                ? "#efe4d8"
                                : isNonWorkingDay
                                  ? "#eee8df"
                                  : "#ffd6bd"
                          }
                          opacity={item.count > 0 ? 0.95 : 0.85}
                        />

                        {(isActive || isPinned) && (
                          <rect
                            x={x - 4}
                            y={item.count > 0 ? item.y - 5 : baseY - 8}
                            width={activeWidth}
                            height={
                              item.count > 0 ? Math.max(18, barHeight + 10) : 16
                            }
                            rx="9"
                            fill="none"
                            stroke="#ff5a00"
                            strokeWidth="2"
                          />
                        )}

                        {item.count > 0 && (isActive || isPinned) && (
                          <text
                            x={x + width / 2}
                            y={Math.max(18, item.y - 10)}
                            textAnchor="middle"
                            className="fill-[#202020] text-[12px] font-black"
                          >
                            {item.count}
                          </text>
                        )}

                        <text
                          x={x + width / 2}
                          y={baseY + 22}
                          textAnchor="middle"
                          fill={labelColor}
                          className="text-[11px] font-black"
                        >
                          {chartMode === "today" ? item.label : item.day}
                        </text>

                        {chartMode === "month" && (
                          <text
                            x={x + width / 2}
                            y={baseY + 34}
                            textAnchor="middle"
                            className={cn(
                              "text-[10px] font-bold",
                              isNonWorkingDay
                                ? "fill-[#c9b8a7]"
                                : "fill-[#b48c6c]",
                            )}
                          >
                            {item.weekday}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          <aside className="rounded-[30px] border border-[#ebe7df] bg-white p-5 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#eadbc9] bg-[#fff7f0] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5a00]">
              {chartMode === "today" ? (
                <Clock className="h-3.5 w-3.5" />
              ) : (
                <CalendarDays className="h-3.5 w-3.5" />
              )}
              {chartMode === "today" ? "Обрана година" : "Обрана дата"}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex mt-4 items-center gap-3">

                <div>
                  <p className="text-[24px] font-black leading-none tracking-[-0.04em] text-[#202020]">
                    {activePoint
                      ? chartMode === "today"
                        ? activePoint.label
                        : formatDateUA(activePoint.key)
                      : "—"}
                  </p>

                  <p className="mt-1 text-[13px] font-semibold text-[#77716b]">
                    {activePoint && chartMode !== "today"
                      ? activePoint.date.toLocaleDateString("uk-UA", {
                          weekday: "long",
                        })
                      : "Обрана година"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
<button
  type="button"
  onClick={goPrevPoint}
  disabled={activePointIndex <= 0}
  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#202020] transition hover:bg-[#fff7f0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
>
  <ChevronLeft className="h-5 w-5" />
</button>

<button
  type="button"
  onClick={goNextPoint}
  disabled={activePointIndex >= chart.points.length - 1}
  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#202020] transition hover:bg-[#fff7f0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
>
  <ChevronRight className="h-5 w-5" />
</button>
              </div>
              
            </div>
            <p className="mt-1 text-sm font-semibold text-[var(--color-caramel)]">
              {activePoint
                ? chartMode === "today"
                  ? "Структура записів у вибрану годину"
                  : "Структура записів у вибраний день"
                : "Оберіть точку на графіку"}
            </p>
<div className="mt-5 grid gap-4">
  <div className="flex justify-center">
    <div
      className="relative flex h-[132px] w-[132px] items-center justify-center rounded-full"
      style={{
        background: activePointTotal
          ? `conic-gradient(
              #16a34a 0 ${activePointConfirmedPercent}%,
              #ff7a18 ${activePointConfirmedPercent}% ${activePointConfirmedPercent + activePointPendingPercent}%,
              #ef233c ${activePointConfirmedPercent + activePointPendingPercent}% 100%
            )`
          : "#eef0f3",
      }}
    >
      
      <div className="flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full bg-white shadow-inner">
        <span className="text-[30px] font-black leading-none text-[#202020]">
          {activePointTotal}
        </span>
        <span className="mt-1 text-[11px] font-bold text-[#77716b]">
          усього
        </span>
      </div>
    </div>
  </div>
<div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-[#77716b]">
  <div className="flex items-center gap-1.5">
    <span className="h-2.5 w-2.5 rounded-full bg-[#16a34a]" />
    Підтверджені
  </div>

  <div className="flex items-center gap-1.5">
    <span className="h-2.5 w-2.5 rounded-full bg-[#ef233c]" />
    Скасовані
  </div>

  <div className="flex items-center gap-1.5">
    <span className="h-2.5 w-2.5 rounded-full bg-[#ff7a18]" />
    Очікують підтвердження
  </div>


</div>
  <div className="grid grid-cols-2 gap-2">
  <ChartTinyStat
    label="Підтверджені"
    value={activePoint?.confirmed || 0}
    className="border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]"
                onClick={
                  activePoint
                    ? () => {
                        setChartSelectionFilter("confirmed");
                        setVisibleBookingsCount(5);
                        if (chartMode === "today") {
                          setChartHourKey({
                            date: toISODateKey(today),
                            hour: activePoint.hour,
                            label: activePoint.label,
                          });
                        } else {
                          setChartDayKey(activePoint.key);
                        }
                      }
                    : null
                }
              />
  <ChartTinyStat
    label="Очікують"
    value={activePoint?.pending || 0}
    className="border-[#fed7aa] bg-[#fff7ed] text-[#ff7a18]"
                onClick={
                  activePoint
                    ? () => {
                        setChartSelectionFilter("pending");
                        if (chartMode === "today") {
                          setChartHourKey({
                            date: toISODateKey(today),
                            hour: activePoint.hour,
                            label: activePoint.label,
                          });
                        } else {
                          setChartDayKey(activePoint.key);
                        }
                      }
                    : null
                }
              />
  <ChartTinyStat
    label="Скасовані"
    value={activePoint?.canceled || 0}
    className="border-[#fecaca] bg-[#fef2f2] text-[#ef233c]"
                onClick={
                  activePoint
                    ? () => {
                        setChartSelectionFilter("canceled");
                        if (chartMode === "today") {
                          setChartHourKey({
                            date: toISODateKey(today),
                            hour: activePoint.hour,
                            label: activePoint.label,
                          });
                        } else {
                          setChartDayKey(activePoint.key);
                        }
                      }
                    : null
                }
              />
  <ChartTinyStat
    label="Усього"
    value={
      activePoint
        ? activePoint.confirmed +
          activePoint.pending +
          activePoint.canceled
        : 0
    }
    className="border-[#e5e7eb] bg-[#f8fafc] text-[#202020]"
                onClick={
                  activePoint
                    ? () => {
                        setChartSelectionFilter("all");
                        if (chartMode === "today") {
                          setChartHourKey({
                            date: toISODateKey(today),
                            hour: activePoint.hour,
                            label: activePoint.label,
                          });
                        } else {
                          setChartDayKey(activePoint.key);
                        }
                      }
                    : null
                }
              />
            </div>
            </div>

            {chartMode === "month" && activePoint && (
              <button
                type="button"
                onClick={() => {
                  setChartSelectionFilter("all");
                  setChartDayKey(activePoint.key);
                }}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff5a00] px-4 text-sm font-black text-white shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#ef4f00] active:scale-[0.98]"
              >
                <CalendarDays className="h-4 w-4" />
                Показати всі записи за дату
              </button>
            )}

            {chartMode === "today" && activePoint && (
              <button
                type="button"
                onClick={() => {
                  setChartSelectionFilter("all");
                  setChartHourKey({
                    date: toISODateKey(today),
                    hour: activePoint.hour,
                    label: activePoint.label,
                  });
                }}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff5a00] px-4 text-sm font-black text-white shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#ef4f00] active:scale-[0.98]"
              >
                <Clock className="h-4 w-4" />
                Показати всі записи за годину
              </button>
            )}
          </aside>
        </div>


       {(chartDayKey || chartHourKey || chartRangeOpen) && (
          <div
            className="fixed inset-0 z-[230] flex items-end justify-center bg-[var(--color-bg)]/45 p-0 backdrop-blur-[7px] sm:items-center sm:p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setChartDayKey(null);
                setChartHourKey(null);
                setChartRangeOpen(false);
              }
            }}
          >
            <div
              className={cn(
                "relative flex w-full flex-col overflow-hidden bg-white",
                "h-[100dvh] rounded-none border-0 shadow-none",
                "sm:h-auto sm:max-h-[85vh] sm:max-w-[580px] sm:rounded-[32px] sm:border sm:border-[var(--color-cream)] sm:shadow-[0_35px_100px_rgba(27,27,27,0.18)]",
              )}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative overflow-hidden bg-gradient-to-b from-[#fff7f0] via-white to-white px-5 pb-5 pt-[max(16px,env(safe-area-inset-top))] sm:pt-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,110,32,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,231,208,0.30),transparent_30%)]" />

                <div className="relative flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setChartDayKey(null);
                      setChartHourKey(null);
                      setChartRangeOpen(false);
                    }}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#eadbc9] bg-white text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:border-[#ffd6bd] hover:bg-[#fff7f0] active:scale-[0.98]"
                    aria-label="Назад"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="inline-flex items-center gap-2 rounded-full border border-[#eadbc9] bg-white px-3 py-1.5 text-[13px] font-semibold shadow-sm">
                    <LayoutGrid className="h-4 w-4 text-[#ff5a00]" />
                    <span className="whitespace-nowrap text-[var(--color-ink)]">
                     Всього записів: {chartRangeOpen
  ? chartFilteredRangeBookings.length
  : chartFilteredSelectionBookings.length}
                    </span>
                  </div>

                  <div className="w-11" />
                </div>

                <div className="relative mt-5 text-center">
                  <h2 className="text-[24px] font-black leading-tight tracking-tight text-[var(--color-ink)]">
                    {chartHourKey
                      ? `Записи на ${chartHourKey.label}`
                      : `Записи на ${formatDateUA(chartDayKey)}`}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-caramel)]">
                    {chartHourKey
                      ? `${chartSelectionTitle[chartSelectionFilter]} за ${formatDateUA(chartHourKey.date)}`
                      : chartSelectionTitle[chartSelectionFilter]}
                  </p>
                </div>
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:flex-none sm:px-5 sm:pb-5">
                <div className="calendar-day-scroll min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 pb-16 sm:max-h-[60vh] sm:flex-none sm:pb-2">
                  {modalBookings.length > 0 ? (
  <>
    {displayedBookings.map((item) => (
      <AppointmentCard
        key={item.id}
        item={{
          ...item,
          time: parseTimeToHHMM(item.time) || item.time || "—",
          serviceName: item.serviceName || "—",
          clientName: item.clientName || "—",
          clientPhotoUrl:
            item.clientPhotoUrl || item.client?.photoUrl || "",
          masterPhotoUrl:
            item.masterPhotoUrl || item.master?.photoUrl || "",
        }}
        todayKey={toISODateKey(today)}
        nowTs={nowTs}
        onOpen={(id) => {
          setChartDayKey(null);
          setChartHourKey(null);
          setChartRangeOpen(false);
          onOpenBooking?.(id);
        }}
        hideDate
      />
    ))}

    {modalBookings.length > visibleBookingsCount && (
      <button
        type="button"
        onClick={() => setVisibleBookingsCount((prev) => prev + 5)}
        className="mt-2 w-full rounded-2xl border border-[#eadbc9] bg-white py-3 text-sm font-black text-[#ff5a00] transition-all hover:bg-[#fff7f0] active:scale-[0.98]"
      >
        Показати ще 5 записів
      </button>
    )}
  </>
) : (
  <div className="rounded-2xl border-2 border-dashed border-[#eadbc9] bg-[#fff7f0] p-6 text-center sm:p-8">
    <div className="mb-3 flex items-center justify-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
        <CalendarDays className="h-7 w-7 text-[#ff5a00]" />
      </div>
    </div>

    <p className="text-sm font-bold text-[var(--color-ink)]">
      {chartHourKey
        ? "На цю годину записів немає"
        : "На цю дату записів немає"}
    </p>
  </div>
)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

function ChartKpi({
  label,
  value,
  icon: Icon,
  tone = "emerald",
  onClick,
}) {
const tones = {
  emerald: "border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]",
  amber: "border-[#fed7aa] bg-[#fff7ed] text-[#ff7a18]",
  rose: "border-[#fecaca] bg-[#fef2f2] text-[#ef233c]",
  slate: "border-[#e5e7eb] bg-[#f8fafc] text-[#202020]",
};

const Component = onClick ? "button" : "div";

return (
  <Component
    type={onClick ? "button" : undefined}
    onClick={onClick || undefined}
      className={cn(
    "flex w-full items-center justify-between rounded-[18px] border bg-white px-3 py-2.5 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#fff7f0] hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)] active:scale-[0.98]",
onClick && "cursor-pointer",
        tones[tone],
      )}
    >
      <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
        <p className="flex h-[30px] items-center justify-center text-center text-[9px] font-black uppercase leading-[1.1] tracking-[0.06em] text-[var(--color-caramel)] sm:h-auto sm:justify-start sm:text-left sm:text-[9px]">
          {label}
        </p>

        <p className="mt-1 text-[21px] font-black leading-none text-[#202020] sm:text-[22px]">
          {value}
        </p>
      </div>

      <div className="hidden h-10 w-10 items-center justify-center rounded-2xl sm:flex">
        {Icon && <Icon className="h-8 w-8" />}
      </div>
    </Component>
  );
}

function ChartTinyStat({
  label,
  value,
  onClick,
  className = "",
}) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick || undefined}
className={cn(
  "relative flex min-h-[68px] flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center shadow-sm transition-all duration-200",
  onClick &&
    "hover:-translate-y-[1px] active:scale-[0.98]",
  className,
)}
    >
      {onClick && (
        <SquareArrowOutUpRight className="absolute right-2 top-2 h-3.5 w-3.5 text-[#ff6200]" />
      )}

      <p className="text-lg font-black leading-none text-[#202020]">{value}</p>

      <p className="mt-2 break-words text-center text-[9px] font-black uppercase leading-tight tracking-[0.08em] text-[var(--color-caramel)]">
        {label}
      </p>
    </Component>
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
      className="fixed inset-0 z-[950] flex items-center justify-center bg-[var(--color-bg)]/45 p-4 backdrop-blur-[8px] sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className={cn(
          "relative w-full max-h-[90vh] overflow-hidden rounded-[32px] border border-[var(--color-cream)] bg-white",
          "animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-3 duration-200",
          sizeClasses[size],
        )}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,110,32,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,231,208,0.32),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[var(--color-cream)]/90 via-[var(--color-cream)]/45 to-transparent" />

        <div className="relative max-h-[calc(90vh-72px)] overflow-y-auto px-4 py-6 sm:px-5 sm:py-7">
          {children}
        </div>

        {footer && (
          <div className="relative border-t border-[var(--color-cream)] px-4 py-4 sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Button({ variant = "secondary", className = "", children, ...props }) {
  const variants = {
    primary: "bg-[#ff5a00] text-white hover:bg-[#ef4f00]",
    secondary:
      "border border-[#eadbc9] bg-white text-[#202020] hover:border-[#ffd6bd] hover:bg-[#fff7f0]",
    danger:
      "border border-[#ffd8d8] bg-[#fff7f7] text-[#e5484d] hover:border-[#e5484d] hover:bg-[#fff1f1]",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
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
        "animate-pulse rounded-2xl bg-[var(--color-cream)]",
        className,
      )}
    />
  );
}

function AppointmentCardSkeleton() {
  return (
    <li className="rounded-[24px] border border-[#eadbc9] bg-white p-4 shadow-sm sm:p-5">
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

function AppointmentCard({ item, nowTs, onOpen }) {
  const key = item.date ? String(item.date) : "";
  const statusMeta = getBookingStatusMeta(item, nowTs);
  const StatusIcon = statusMeta.Icon;
  const clientName = item.clientName || "—";
  const service = item.serviceName || "—";
  const masterName =
    item.masterName || item.staffName || item.employeeName || "—";
  const clientPhoto = toPublicUrl(
    item.clientPhotoUrl || item.clientPhoto || "",
  );
  const masterPhoto = toPublicUrl(
    item.masterPhotoUrl ||
      item.masterPhoto ||
      item.master?.photoUrl ||
      item.master?.photo ||
      "",
  );
  const timeLabel = parseTimeToHHMM(item.time) || item.time || "—";
  const date = key ? new Date(`${key}T00:00:00`) : null;
  const dayLabel =
    date && !Number.isNaN(date.getTime())
      ? String(date.getDate()).padStart(2, "0")
      : "—";
const monthLabel =
  date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("uk-UA", { month: "long" })
    : "";

  const isCanceled = item.status === "canceled";
  const isConfirmed = item.status === "confirmed";
  const dt = getBookingDateTime(item);
  const isArchived = dt ? dt.getTime() < nowTs : false;
  const status = isArchived
    ? "completed"
    : isConfirmed
      ? "confirmed"
      : isCanceled
        ? "canceled"
        : "new";

  return (
    <li className="list-none">
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
          "hover:-translate-y-0.5 hover:border-[#ffd6bd] hover:bg-[#fff7f0] ",
          "active:scale-[0.99]",
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

                {statusMeta.label}
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


          <div
            className={cn(
              "flex items-center mr-2 justify-center border-l pl-5 max-[639px]:hidden",

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

const SCHEDULE_START_HOUR = 6;
const SCHEDULE_END_HOUR = 20;
const SCHEDULE_HOUR_HEIGHT = 88;
const SCHEDULE_MIN_CARD_HEIGHT = 58;
const SCHEDULE_DEFAULT_DURATION = 60;
const SCHEDULE_GRID_TOP_PADDING = 24;

const SCHEDULE_STATUS_FILTERS = [
  { key: "all", label: "Усі" },
  { key: "pending", label: "Очікують" },
  { key: "confirmed", label: "Підтверджені" },
  { key: "canceled", label: "Скасовані" },
  { key: "archived", label: "Завершені" },
];

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
    booking?.staffName ||
    booking?.employeeName ||
    booking?.workerName ||
    booking?.master?.name ||
    booking?.staff?.name ||
    booking?.employee?.name ||
    booking?.worker?.name ||
    "Вільний майстер"
  );
}

function scheduleStaffRole(booking) {
  return (
    booking?.masterRole ||
    booking?.staffRole ||
    booking?.employeeRole ||
    booking?.master?.role ||
    booking?.staff?.role ||
    booking?.employee?.role ||
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
      booking?.master?.photoUrl ||
      booking?.staff?.photoUrl ||
      booking?.employee?.photoUrl ||
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
      booking.staffId ||
      booking.employeeId ||
      booking.workerId ||
      booking.master?.id ||
      booking.staff?.id ||
      booking.employee?.id ||
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
    bg: "linear-gradient(135deg, #eaf8f1 0%, #f7fcfa 100%)",
    border: "#b6dfce",
    accent: "#2f9b67",
    soft: "#dff3ea",
  },
  pending: {
    bg: "linear-gradient(135deg, #fff4e0 0%, #fffaf2 100%)",
    border: "#f2c99b",
    accent: "#df8a2d",
    soft: "#ffe9cc",
  },
  canceled: {
    bg: "linear-gradient(135deg, #fff0f3 0%, #fff7f8 100%)",
    border: "#f5b8c3",
    accent: "#e75f72",
    soft: "#ffe1e7",
  },
  archived: {
    bg: "linear-gradient(135deg, #f1f2f4 0%, #fafafa 100%)",
    border: "#d8dce2",
    accent: "#7b8490",
    soft: "#eceff3",
  },
  default: {
    bg: "linear-gradient(135deg, #f1f2f4 0%, #fafafa 100%)",
    border: "#d8dce2",
    accent: "#7b8490",
    soft: "#eceff3",
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

    if (booking.staffKey === "staff:free" || booking.staffName === "Вільний майстер") {
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

  return Array.from(map.values())
    .filter(
      (option) =>
        type !== "staff" ||
        (option.key !== "staff:free" && option.name !== "Вільний майстер"),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "uk"));
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

function ScheduleViewSwitcher({ value, onChange }) {
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

function SchedulePlannerView({
  bookings = [],
  nowTs,
  studio,
  loading,
  onOpenBooking,
  viewSwitcher = null,
}) {
  const [viewDate, setViewDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [rangeMode, setRangeMode] = useState("day");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [hourHeight, setHourHeight] = useState(SCHEDULE_HOUR_HEIGHT);
  const [staffColumnWidth, setStaffColumnWidth] = useState(220);
  const scrollRef = useRef(null);
  const topScrollRef = useRef(null);
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
  setStaffColumnWidth((value) => Math.max(232, Math.min(360, value + delta)));
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

  const staffOptions = useMemo(
    () => scheduleEntityOptions(normalizedBookings, studio, "staff"),
    [normalizedBookings, studio],
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
    let start = SCHEDULE_START_HOUR * 60;
    let end = SCHEDULE_END_HOUR * 60;

    for (const booking of rangeBookings) {
      start = Math.min(start, booking.startMin - 30);
      end = Math.max(end, booking.endMin + 30);
    }

    start = Math.max(SCHEDULE_START_HOUR * 60, Math.floor(start / 60) * 60);
    end = Math.min(24 * 60, Math.ceil(end / 60) * 60);

    if (end - start < 6 * 60) {
      end = Math.min(24 * 60, start + 6 * 60);
    }

    return { start, end };
  }, [rangeBookings]);

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
  const timeColumnWidth = 112;
  const scheduleMinWidth = timeColumnWidth + columns.length * staffColumnWidth;
  const scheduleWidth = Math.max(560, scheduleMinWidth);
  const templateColumns = `${timeColumnWidth}px repeat(${columns.length}, ${staffColumnWidth}px)`;
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
  const freeColumnsCount = columns.filter((column) => {
    const counts = scheduleSummaryByColumn[column.key] || {
      confirmed: 0,
      canceled: 0,
      pending: 0,
      archived: 0,
    };

    return counts.confirmed + counts.canceled + counts.pending + counts.archived === 0;
  }).length;
  const plannerStats = [
    {
      label: rangeMode === "day" ? "Сьогодні" : "Усього",
      value: statusCounts.all,
      helper: "записів",
      Icon: null,
      valueClass: "text-[#202020]",
      shell: "border-[#efd8c8] bg-[#fff9f3]",
    },
    {
      label: "Підтверджені",
      value: statusCounts.confirmed,
      Icon: CircleCheckBig,
      valueClass: "text-[#4c9b47]",
      iconClass: "bg-[#eef8ea] text-[#4c9b47]",
    },
    {
      label: "Очікують підтвердження",
      value: statusCounts.pending,
      Icon: ClockAlert,
      valueClass: "text-[#e07d00]",
      iconClass: "bg-[#fff4df] text-[#e07d00]",
    },
    {
      label: "Завершені",
      value: statusCounts.archived,
      Icon: CircleCheck,
      valueClass: "text-[#1f6c9c]",
      iconClass: "bg-[#eaf4ff] text-[#1f6c9c]",
    },
    {
      label: "Скасовані",
      value: statusCounts.canceled,
      Icon: XCircle,
      valueClass: "text-[#e11d48]",
      iconClass: "bg-[#fff0f3] text-[#e11d48]",
    },
    {
      label: "Вихідний",
      value: freeColumnsCount,
      Icon: CirclePause,
      valueClass: "text-[#b18b6a]",
      iconClass: "bg-[#fff3e4] text-[#d09a60]",
    },
  ];
  const navigateRange = (direction) => {
    if (rangeMode === "month") {
      handleViewDateChange(addMonthsSafe(viewDate, direction));
      return;
    }

    handleViewDateChange(addDays(viewDate, direction * moveDays));
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#eadfce] bg-[#fffaf7] shadow-[0_18px_60px_rgba(39,28,20,0.08)]">
      <div className="border-b border-[#eadfce] bg-[#fffaf7] px-5 py-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
          <div className="hidden xl:block" />

          <div className="flex min-w-0 flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigateRange(-1)}
              className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[#eadfce] bg-white text-[#202020] shadow-[0_8px_24px_rgba(39,28,20,0.06)] transition hover:bg-[#fff7f0] active:scale-[0.98]"
              aria-label="Попередній період"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setCalendarOpen(true)}
              className="grid h-12 min-w-[220px] grid-cols-[36px_1fr] items-center rounded-[16px] border border-[#eadfce] bg-white px-3 text-left shadow-[0_8px_24px_rgba(39,28,20,0.06)] transition hover:bg-[#fffaf6] active:scale-[0.99]"
              aria-label="Відкрити календар"
            >
              <CalendarDays className="h-5 w-5 text-[#d38d5f]" />
              <span className="min-w-0">
                <span className="block truncate text-[16px] font-black leading-tight text-[#202020]">
                  {formatDateLongUA(toISODateKey(viewDate))}
                </span>
                <span className="block truncate text-[11px] font-bold capitalize leading-tight text-[#8d8177]">
                  {weekdayLabel}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateRange(1)}
              className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[#eadfce] bg-white text-[#202020] shadow-[0_8px_24px_rgba(39,28,20,0.06)] transition hover:bg-[#fff7f0] active:scale-[0.98]"
              aria-label="Наступний період"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="inline-flex h-12 rounded-[17px] border border-[#ded6cd] bg-white p-1 shadow-[0_8px_24px_rgba(39,28,20,0.06)]">
              {rangeModeItems.map((item) => {
                const active = rangeMode === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleRangeModeChange(item.key)}
                    className={cn(
                      "h-10 rounded-[13px] px-4 text-[13px] font-black transition active:scale-[0.98]",
                      active
                        ? "bg-[#202020] text-white shadow-[0_8px_16px_rgba(32,32,32,0.18)]"
                        : "text-[#4f4944] hover:bg-[#fff7f0]",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-start gap-3 xl:justify-end">
            {viewSwitcher}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-[repeat(6,minmax(120px,1fr))_190px]">
          {plannerStats.map((item) => {
            const Icon = item.Icon;

            return (
              <div
                key={item.label}
                className={cn(
                  "relative min-h-[86px] rounded-[18px] border bg-white px-4 py-3 shadow-[0_10px_28px_rgba(39,28,20,0.05)]",
                  item.shell || "border-[#eadfce]",
                )}
              >
                <div className="min-w-0">
                  <p className="min-h-[32px] pr-1 text-[12px] font-bold leading-tight text-[#202020]">
                    {item.label}
                  </p>
                  <div className={cn(
                    "absolute bottom-4 left-4 flex items-end gap-2",
                    Icon ? "right-14" : "right-4",
                  )}>
                    <p className={cn("text-[28px] font-black leading-none", item.valueClass)}>
                      {item.value}
                    </p>
                    {item.helper && (
                      <p className="pb-0.5 text-[12px] font-bold text-[#8d8177]">
                        {item.helper}
                      </p>
                    )}
                  </div>
                </div>

                {Icon && (
                  <span
                    className={cn(
                      "absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white shadow-sm",
                      item.iconClass,
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                )}
              </div>
            );
          })}

          <div className="grid gap-2 self-center">
            <label className="relative block h-[46px]">
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d6b52]" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-full w-full appearance-none rounded-[16px] border border-[#eadfce] bg-white pl-10 pr-9 text-[13px] font-black text-[#3b312b] shadow-[0_8px_24px_rgba(39,28,20,0.06)] outline-none transition focus:border-[#ffb489]"
              >
                {SCHEDULE_STATUS_FILTERS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label} ({statusCounts[item.key] || 0})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d6b52]" />
            </label>

            <label className="relative block h-[46px]">
              <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d6b52]" />
              <select
                value={selectedGroup}
                onChange={(event) => handleSelectedGroupChange(event.target.value)}
                className="h-full w-full appearance-none rounded-[16px] border border-[#eadfce] bg-white pl-10 pr-9 text-[13px] font-black text-[#3b312b] shadow-[0_8px_24px_rgba(39,28,20,0.06)] outline-none transition focus:border-[#ffb489]"
              >
                <option value="all">Усі майстри</option>
                {groupOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d6b52]" />
            </label>
          </div>
        </div>
      </div>

      {calendarOpen && (
        <div
          className="fixed inset-0 z-[230] flex items-start justify-center bg-[#1b1b1b]/30 p-4 pt-24 backdrop-blur-[6px]"
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

    <div className="bg-white">

        <div
          ref={topScrollRef}
          className="calendar-day-scroll h-3 overflow-x-auto overflow-y-hidden border-b border-[#eadfce] bg-[#fffaf7]"
          onScroll={(event) =>
            syncHorizontalScroll(event.currentTarget, headerScrollRef, scrollRef)
          }
        >
          <div style={{ width: scheduleWidth, height: 1 }} />
        </div>

        <div
          ref={headerScrollRef}
          className="calendar-day-scroll overflow-hidden border-b border-[#eadfce] bg-white"
        >
          <div
            className="min-w-full"
            style={{ minWidth: scheduleWidth }}
          >
            <div
              className="grid bg-white"
              style={{ gridTemplateColumns: templateColumns }}
            >
              <div className="sticky left-0 z-40 flex min-h-[108px] flex-col justify-between border-r border-[#eadfce] bg-white px-3 py-3 shadow-[8px_0_18px_rgba(39,28,20,0.04)]">
<div className="grid gap-1.5">
   <div className="flex h-8 overflow-hidden rounded-lg border border-[#eadfce] bg-[#fffaf7]">

    <button
      type="button"
      onClick={() => adjustStaffColumnWidth(-12)}
      className="flex w-5 items-center justify-center text-[#8d8177] transition hover:bg-white hover:text-[#202020]"
      aria-label="Зменшити ширину колонок"
      title="Зменшити ширину колонок"
    >
      <Minus className="h-2.5 w-2.5" />
    </button>

    <span className="flex min-w-0 flex-1 flex-col items-center justify-center leading-none">
      <span className="text-[7px] font-black uppercase tracking-[0.04em] text-[#8d8177]">
        ВИСОТА
      </span>
      <span className="mt-0.5 text-[9px] font-black text-[#202020]">
        {staffColumnWidth}
      </span>
    </span>

    <button
      type="button"
      onClick={() => adjustStaffColumnWidth(12)}
      className="flex w-5 items-center justify-center text-[#8d8177] transition hover:bg-white hover:text-[#202020]"
      aria-label="Збільшити ширину колонок"
      title="Збільшити ширину колонок"
    >
      <Plus className="h-2.5 w-2.5" />
    </button>
  </div>
  <div className="flex h-8 overflow-hidden rounded-lg border border-[#eadfce] bg-[#fffaf7]">
    <button
      type="button"
      onClick={() => adjustHourHeight(-8)}
      className="flex w-5 items-center justify-center text-[#8d8177] transition hover:bg-white hover:text-[#202020]"
      aria-label="Зменшити висоту рядків"
      title="Зменшити висоту рядків"
    >
      <Minus className="h-2.5 w-2.5" />
    </button>

    <span className="flex min-w-0 flex-1 flex-col items-center justify-center leading-none">
      <span className="text-[7px] font-black uppercase tracking-[0.04em] text-[#8d8177]">
        ШИРИНА
      </span>
      <span className="mt-0.5 text-[9px] font-black text-[#202020]">
        {hourHeight}
      </span>
    </span>

    <button
      type="button"
      onClick={() => adjustHourHeight(8)}
      className="flex w-5 items-center justify-center text-[#8d8177] transition hover:bg-white hover:text-[#202020]"
      aria-label="Збільшити висоту рядків"
      title="Збільшити висоту рядків"
    >
      <Plus className="h-2.5 w-2.5" />

    </button>
  </div>

</div>
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
                const isColumnWorking = totalCount > 0;

                return (
                  <div
                    key={column.key}
                    className="relative min-h-[108px] min-w-0 border-r border-[#eadfce] bg-white px-2 py-3"
                  >
                    <button
                      type="button"
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#fbf5ef] text-[#202020] transition hover:bg-[#fff1e8]"
                      aria-label="Дії"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    <div className="flex min-w-0 items-center gap-3 pr-7">
                      {column.type === "date" ? (
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full bg-[#fff1e8] text-[#ff6200]">
                          <span className="text-[10px] font-black uppercase leading-none">
                            {column.date.toLocaleDateString("uk-UA", { weekday: "short" }).slice(0, 2)}
                          </span>
                          <span className="text-sm font-black leading-none">
                            {column.date.getDate()}
                          </span>
                        </div>
                      ) : (
                        <Avatar
                          name={column.name}
                          photoUrl={column.photoUrl}
                          className="h-12 w-12 rounded-full"
                        />
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-black leading-tight text-[#202020]">
                          {column.name}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] font-bold text-[#8d8177]">
                          {column.type === "date"
                            ? formatDateLongUA(toISODateKey(column.date))
                            : column.role || "Співробітник"}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-[11px] font-black text-[#5f554f]">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-[#8d8177]" />
                            {totalCount}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CircleCheckBig className="h-3.5 w-3.5 text-[#4c9b47]" />
                            {summaryCounts.confirmed}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ClockAlert className="h-3.5 w-3.5 text-[#e07d00]" />
                            {summaryCounts.pending}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5 text-[#e11d48]" />
                            {summaryCounts.canceled}
                          </span>
                        </div>

                        <div
                          className={cn(
                            "mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black",
                            isColumnWorking
                              ? "bg-[#eef8ea] text-[#2f8f55]"
                              : "bg-[#fff0f3] text-[#e11d48]",
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isColumnWorking ? "bg-[#2f8f55]" : "bg-[#e11d48]",
                            )}
                          />
                          {isColumnWorking ? "Працює" : "Вихідний"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

<div
  ref={scrollRef}
  className="calendar-day-scroll relative overflow-auto bg-white pb-3"
  style={{
    height: "clamp(340px, calc(100dvh - 360px), 540px)",
  }}
  onScroll={(event) =>
    syncHorizontalScroll(event.currentTarget, topScrollRef, headerScrollRef)
  }
>
          {!anyBookings && (
  <div className="pointer-events-none sticky left-0 top-0 z-50 h-0 w-full">
   <div className="flex h-[clamp(360px,calc(100dvh-360px),560px)] items-center justify-center px-3">
      <div className="pointer-events-auto w-[min(360px,calc(100%-24px))] rounded-[22px] border-2 border-dashed border-[#eadbc9] bg-white/90 p-4 text-center shadow-sm backdrop-blur">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff6200]">
          {loading ? (
            <Sparkles className="h-5 w-5 animate-pulse" />
          ) : (
            <CalendarDays className="h-5 w-5" />
          )}
        </div>

        <p className="mt-3 text-sm font-black text-[var(--color-ink)]">
          {loading
            ? "Завантажуємо записи"
            : "На цей період записів немає"}
        </p>

        <p className="mt-1 text-xs font-medium text-[var(--color-caramel)]">
          Нові бронювання з'являться у сітці за часом і виконавцем.
        </p>
      </div>
    </div>
  </div>
)}
          <div
            className="min-w-full"
            style={{ minWidth: scheduleWidth }}
          >
            <div className="relative grid" style={{ gridTemplateColumns: templateColumns }}>
              <div
                className="sticky left-0 z-40 border-r border-[#eadfce] bg-white shadow-[8px_0_18px_rgba(39,28,20,0.04)]"
                style={{ height: gridHeight }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute right-4 -translate-y-2 text-[12px] font-black text-[#3b312b]"
                    style={{
                      top: topForMinute(hour * 60),
                    }}
                  >
                    {pad2(hour)}:00
                  </div>
                ))}

                {quarterMarks
                  .filter((mark) => !mark.isHour)
                  .map((mark) => (
                    <div
                      key={`label-${mark.minute}`}
                      className="absolute right-4 -translate-y-1/2 text-[11px] font-bold text-[#b0a49b]"
                      style={{ top: topForMinute(mark.minute) }}
                    >
                      :{pad2(mark.minute % 60)}
                    </div>
                  ))}

                {showNowLine && visibleDateKeys.has(todayKey) && (
                  <div
                    className="absolute inset-x-0 z-30 border-t border-[#f35f49]"
                    style={{ top: topForMinute(nowMinute) }}
                  >
                    <span className="absolute left-1 top-[-10px] rounded-md bg-[#f35f49] px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                      {scheduleTimeLabel(nowMinute)}
                    </span>
                  </div>
                )}
              </div>

              {columns.map((column) => {
                const columnBookings = bookingsByColumn[column.key] || [];
                const isTodayColumn =
                  (column.type === "date" && toISODateKey(column.date) === todayKey) ||
                  (rangeMode === "day" && visibleDateKeys.has(todayKey));

                return (
                  <div
                    key={column.key}
                    className="relative border-r border-[#eadfce] bg-white"
                    style={{ height: gridHeight }}
                  >
                    {quarterMarks.map((mark) => (
                      <div
                        key={mark.minute}
                        className={cn(
                          "absolute inset-x-0 border-t",
                          mark.isHour
                            ? "border-[#eee7df]"
                            : "border-dashed border-[#eadfce]/80",
                        )}
                        style={{
                          top: topForMinute(mark.minute),
                        }}
                      />
                    ))}

                    {showNowLine && isTodayColumn && (
                      <div
                        className="absolute inset-x-0 z-20 border-t border-[#f35f49]"
                        style={{
                          top: topForMinute(nowMinute),
                        }}
                      >
                        <span className="absolute -left-1 -top-[5px] h-2.5 w-2.5 rounded-full bg-[#f35f49]" />
                      </div>
                    )}

                    {columnBookings.map((booking) => {
                      const tone = scheduleCardTone(booking, nowTs);
                      const top = topForMinute(
                        Math.max(booking.startMin, timeBounds.start),
                      );
                      const clippedEnd = Math.min(
                        booking.endMin,
                        timeBounds.end,
                      );
                      const height = Math.max(
                        SCHEDULE_MIN_CARD_HEIGHT,
                        ((clippedEnd -
                          Math.max(booking.startMin, timeBounds.start)) /
                          60) *
                          hourHeight -
                          10,
                      );
                      const width = `calc(${100 / booking.laneCount}% - 6px)`;
                      const left = `calc(${(100 / booking.laneCount) * booking.lane}% + 3px)`;
                      const visualStatus = scheduleVisualStatus(booking, nowTs);
                      const StatusIcon = scheduleStatusIcon(booking, nowTs);
                      const statusLabel = scheduleStatusLabel(booking, nowTs);
                      const showClientLine = height >= 64;
                      const showServiceLine = height >= 84;
                      const showStatusLine = height >= 104;
                      const startLabel =
                        parseTimeToHHMM(booking.raw.time) ||
                        scheduleTimeLabel(booking.startMin);
                      const endLabel = scheduleTimeLabel(booking.endMin);

                      return (
                        <button
                          key={`${booking.id}-${booking.dateKey}-${booking.startMin}`}
                          type="button"
                          onClick={() => booking.id != null && onOpenBooking(booking.id)}
                          className={cn(
                            "group absolute z-10 overflow-visible rounded-[14px] border text-left transition duration-200 hover:z-30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#f35f49]/25",
                            visualStatus === "canceled" && "opacity-70",
                          )}
                          style={{
                            top: top + 3,
                            height,
                            left,
                            width,
                            background: tone.bg,
                            borderColor: tone.border,
                            boxShadow: "0 14px 34px rgba(39, 28, 20, 0.06)",
                          }}
                        >
                          <div
                            className="pointer-events-none absolute bottom-full left-1/2 z-[80] mb-2 hidden w-[240px] -translate-x-1/2 rounded-[16px] border bg-white px-3 py-3 text-left shadow-[0_18px_44px_rgba(39,28,20,0.16)] group-hover:block group-focus-visible:block"
                            style={{ borderColor: tone.border }}
                          >
                            <span
                              className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-black"
                              style={{
                                backgroundColor: tone.soft,
                                color: tone.accent,
                              }}
                            >
                              <StatusIcon className="h-3.5 w-3.5" />
                              {statusLabel}
                            </span>
                            <span className="block text-[13px] font-black text-[#202020]">
                              {booking.clientName}
                            </span>
                            <span className="mt-1 block text-[12px] font-bold text-[#6d625c]">
                              {booking.serviceName}
                            </span>
                            <span className="mt-2 flex items-center gap-2 text-[11px] font-black text-[#8d8177]">
                              <Clock className="h-3.5 w-3.5" />
                              {startLabel} - {endLabel}
                            </span>
                            {booking.clientPhone && (
                              <span className="mt-1 flex items-center gap-2 text-[11px] font-bold text-[#8d8177]">
                                <Phone className="h-3.5 w-3.5" />
                                {booking.clientPhone}
                              </span>
                            )}
                          </div>

                          <div
                            className="absolute inset-y-0 left-0 w-1"
                            style={{ backgroundColor: tone.accent }}
                          />

                          <div className="flex h-full min-h-0 flex-col px-3 py-2 pl-4">
                            <div
                              className="flex min-w-0 items-center gap-1.5 text-[11px] font-black leading-tight"
                              style={{ color: tone.accent }}
                            >
                              <Scissors className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">
                                {startLabel} - {endLabel}
                              </span>
                              <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                            </div>

                            {showClientLine && (
                              <p className="mt-1.5 truncate text-[13px] font-black leading-tight text-[#202020]">
                                {booking.clientName}
                              </p>
                            )}

                            {showServiceLine && (
                              <p className="mt-1 truncate text-[11px] font-bold leading-tight text-[#6d625c]">
                                {booking.serviceName}
                              </p>
                            )}

                            {showStatusLine && (
                              <div className="mt-auto flex min-w-0 items-center gap-1.5 pt-1 text-[10px] font-black text-[#5f554f]">
                                <StatusIcon
                                  className="h-3.5 w-3.5 shrink-0"
                                  style={{ color: tone.accent }}
                                />
                                <span className="truncate">{statusLabel}</span>
                              </div>
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
    </div>
  );
}

export default function Golowna() {
  const { bookings, confirmBooking, cancelBooking, loading } = useBookings();
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [detailsId, setDetailsId] = useState(null);
  const { studio } = useStudio();
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [showDetailsScrollHint, setShowDetailsScrollHint] = useState(true);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [hasScroll, setHasScroll] = useState(false);
  const calendarScrollRef = useRef(null);
  const [visibleAppointmentsCount, setVisibleAppointmentsCount] = useState(5);
  const [appointmentsRange, setAppointmentsRange] = useState("thisWeek");
  const isInitialLoading = loading;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardChartMode, setDashboardChartMode] = useState("month");
  const [homeView, setHomeView] = useState("overview");
  const [todayBookingsFilter, setTodayBookingsFilter] = useState("all");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [socketState, setSocketState] = useState(
    socket.connected ? "ok" : "offline",
  );

  const appointmentRangeItems = [
    { value: "thisWeek", label: "Цей тиждень" },
    { value: "nextWeek", label: "Наступний тиждень" },
    { value: "thisMonth", label: "Цей місяць" },
    { value: "nextMonth", label: "Наступний місяць" },
    { value: "all", label: "Усі" },
  ];

  useEffect(() => {
    let alive = true;

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const activeStatuses = [
      "confirmed",
      "new",
      "pending",
      "CONFIRMED",
      "NEW",
      "PENDING",
    ];

    const list = (bookings || []).filter((b) => {
      if (!b?.id) return false;
      if (b.status === "canceled" || b.status === "deleted") return false;
      return activeStatuses.includes(b.status) || !b.status;
    });

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
      const status = String(b.status || "").toLowerCase();
      const isPending = !status || status === "new" || status === "pending";

      if (key === todayKey) {
        todayActive++;
        if (isPending) todayNew++;
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

    const booking = (bookings || []).find((b) => b.id === detailsId);
    if (!booking) return null;

    return {
      ...booking,
      clientPhotoUrl: booking.clientPhotoUrl || booking.client?.photoUrl || "",
      masterPhotoUrl: booking.masterPhotoUrl || booking.master?.photoUrl || "",
    };
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
    const now = new Date(nowTs);

    const thisWeekStart = startOfWeekMonday(now);
    const thisWeekEnd = addDays(thisWeekStart, 7);

    const nextWeekStart = thisWeekEnd;
    const nextWeekEnd = addDays(nextWeekStart, 7);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const nextMonthStart = thisMonthEnd;
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 1);

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

      const inRange =
        appointmentsRange === "all" ||
        (appointmentsRange === "thisWeek" &&
          dt >= thisWeekStart &&
          dt < thisWeekEnd) ||
        (appointmentsRange === "nextWeek" &&
          dt >= nextWeekStart &&
          dt < nextWeekEnd) ||
        (appointmentsRange === "thisMonth" &&
          dt >= thisMonthStart &&
          dt < thisMonthEnd) ||
        (appointmentsRange === "nextMonth" &&
          dt >= nextMonthStart &&
          dt < nextMonthEnd);

      if (!inRange) continue;

      upcoming.push({ b, ts: dt.getTime() });
    }

    upcoming.sort((a, c) => a.ts - c.ts);

    return upcoming.map(({ b }) => ({
      ...b,
      date: b.date,
      time: parseTimeToHHMM(b.time) || b.time || "—",
      serviceName: b.serviceName || "—",
      clientName: b.clientName || "—",
      clientPhotoUrl: b.clientPhotoUrl || b.client?.photoUrl || "",
      masterPhotoUrl: b.masterPhotoUrl || b.master?.photoUrl || "",
    }));
  }, [bookings, nowTs, appointmentsRange]);

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

  const todayBookings = useMemo(() => {
    const todayKey = toISODateKey(new Date(nowTs));

    return (bookings || [])
      .filter((b) => b?.id && b.date === todayKey && b.status !== "deleted")
      .sort((a, c) => (a.time || "").localeCompare(c.time || ""));
  }, [bookings, nowTs]);

  const todayBookingsFiltered = useMemo(() => {
    return todayBookings.filter((b) => {
      const dt = getBookingDateTime(b);
      const isArchived = dt ? dt.getTime() < nowTs : false;

      if (todayBookingsFilter === "archive") return isArchived;
      if (todayBookingsFilter === "confirmed") {
        return b.status === "confirmed" && !isArchived;
      }
      if (todayBookingsFilter === "canceled") return b.status === "canceled";
      if (todayBookingsFilter === "new") {
        return (
          (!b.status || b.status === "new" || b.status === "pending") &&
          !isArchived
        );
      }

      return true;
    });
  }, [todayBookings, todayBookingsFilter, nowTs]);

  const todayFilterCounts = useMemo(() => {
    return todayBookings.reduce(
      (acc, b) => {
        const dt = getBookingDateTime(b);
        const isArchived = dt ? dt.getTime() < nowTs : false;

        acc.all += 1;
        if (isArchived) acc.archive += 1;
        else if (b.status === "confirmed") acc.confirmed += 1;
        else if (b.status === "canceled") acc.canceled += 1;
        else acc.new += 1;

        return acc;
      },
      { all: 0, new: 0, confirmed: 0, canceled: 0, archive: 0 },
    );
  }, [todayBookings, nowTs]);

  const todayEmptyText = {
    all: "Сьогодні ще немає жодного запису.",
    new: "Ще немає записів, які очікують на підтвердження.",
    confirmed: "Ще немає підтверджених записів.",
    canceled: "Ще немає скасованих записів.",
    archive: "Ще немає завершених записів.",
  };

  const todayEmptyUi = {
    all: {
      Icon: CalendarDays,
      iconClass: "text-[#ff5a00]",
    },
    new: {
      Icon: Clock,
      iconClass: "text-[#ffb020]",
    },
    confirmed: {
      Icon: CheckCheck,
      iconClass: "text-[var(--color-confirmed-dark)]",
    },
    canceled: {
      Icon: XCircle,
      iconClass: "text-[var(--color-canceled-dark)]",
    },
    archive: {
      Icon: FolderClock,
      iconClass: "text-[var(--color-archived-dark)]",
    },
  };

  const TodayEmptyIcon =
    todayEmptyUi[todayBookingsFilter]?.Icon || CalendarDays;
  const todayEmptyIconClass =
    todayEmptyUi[todayBookingsFilter]?.iconClass || "text-[#ff5a00]";

  return (
    <div className="">
      <div className="mx-auto w-full max-w-[1440px] space-y-3">
        {homeView === "overview" ? (
          <MonthlyBookingsChart
            bookings={bookings}
            nowTs={nowTs}
            onModeChange={setDashboardChartMode}
            onOpenBooking={setDetailsId}
            studioCreatedAt={studio?.ownerCreatedAt || studio?.createdAt}
            viewSwitcher={
              <ScheduleViewSwitcher value={homeView} onChange={setHomeView} />
            }
          />
        ) : (
          <SchedulePlannerView
            bookings={bookings}
            nowTs={nowTs}
            studio={studio}
            loading={loading}
            onOpenBooking={setDetailsId}
            viewSwitcher={
              <ScheduleViewSwitcher value={homeView} onChange={setHomeView} />
            }
          />
        )}
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
          const clientName = selectedBooking.clientName || "—";
          const phone = selectedBooking.clientPhone || "";
          const clientPhoto = toPublicUrl(
            selectedBooking.clientPhotoUrl ||
              selectedBooking.clientPhoto ||
              selectedBooking.client?.photoUrl ||
              selectedBooking.client?.photo ||
              "",
          );

          const masterPhoto = toPublicUrl(
            selectedBooking.masterPhotoUrl ||
              selectedBooking.masterPhoto ||
              selectedBooking.master?.photoUrl ||
              selectedBooking.master?.photo ||
              "",
          );
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
            setShowDetailsScrollHint?.(true);
          };

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

                <div className="relative bg-white flex min-h-0 flex-1 flex-col px-4 pt-4 sm:px-6">
                  <div
                    className="calendar-day-scroll min-h-0 flex-1 overflow-y-auto pb-28 sm:pb-24"
                    onScroll={(e) => {
                      const el = e.currentTarget;
                      const isScrollable = el.scrollHeight > el.clientHeight;
                      const isAtBottom =
                        el.scrollTop + el.clientHeight >= el.scrollHeight - 12;

                      setHasScroll(isScrollable);
                      setShowScrollHint(isScrollable && !isAtBottom);
                    }}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[28px] border border-[#eadfce] bg-white p-4  sm:col-span-2">
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
                        <div className="flex ml-2 items-center gap-3">
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

                          <div className="min-w-0 ml-2 flex-1">
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
                    <div className="absolute inset-x-0 bottom-0 border-[#eadfce] bg-white/92 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-6 sm:pb-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {!isConfirmed && !isCanceled && (
                          <button
                            type="button"
                            onClick={async () => {
                              await confirmBooking(selectedBooking.id);
                              closeDetails();
                            }}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-[22px] bg-[var(--color-primary-buttom)] text-sm font-black text-white transition-all duration-200 hover:bg-[#4a4a4a] active:scale-[0.98]"
                          >
                            <CheckCheck className="h-4 w-4" />
                            Підтвердити
                          </button>
                        )}

                        {!isCanceled && (
                          <button
                            type="button"
                            onClick={() => {
                              closeDetails();
                              setCancelConfirmId(selectedBooking.id);
                            }}
                            className={cn(
                              "inline-flex h-12 items-center justify-center gap-2 rounded-[22px] border border-[#fecaca] bg-[#fff5f5] px-4 text-sm font-black text-[#ef4444] transition-all duration-200 hover:border-[#fca5a5] hover:bg-[#ffecec] active:scale-[0.98]",
                              isConfirmed && "sm:col-span-2",
                            )}
                          >
                            <XCircle className="h-4 w-4" />
                            Скасувати запис
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
