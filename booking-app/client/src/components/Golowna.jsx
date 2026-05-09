// Golowna.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useBookings } from "../context/bookings/useBookings";
import { api } from "../api/http";
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

function SectionShell({ children, className = "" }) {
  return (
    <div className={cn("ui-shell", className)}>
      <div className="ui-shell-line" />
      {children}
    </div>
  );
}

function addMonthsSafe(date, amount) {
  const next = new Date(date);
  const day = next.getDate();

  next.setDate(1);
  next.setMonth(next.getMonth() + amount);

  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  next.setHours(0, 0, 0, 0);

  return next;
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

function MonthlyBookingsChart({ bookings = [], nowTs }) {
  const today = useMemo(() => {
    const d = new Date(nowTs);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [nowTs]);

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d = new Date(nowTs);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [activeDayKey, setActiveDayKey] = useState(null);

  const data = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);

      return {
        day: i + 1,
        date,
        key: toISODateKey(date),
        weekday: getWeekdayShortUA(date),
        count: 0,
        confirmed: 0,
        pending: 0,
      };
    });

    for (const booking of bookings || []) {
      if (!booking?.date) continue;
      if (booking.status === "canceled" || booking.status === "deleted") continue;

      const d = new Date(booking.date);
      if (Number.isNaN(d.getTime())) continue;
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;

      const item = days[d.getDate() - 1];
      item.count += 1;

      if (booking.status === "confirmed") {
        item.confirmed += 1;
      } else {
        item.pending += 1;
      }
    }

    return days;
  }, [bookings, visibleMonth]);

  const chart = useMemo(() => {
    const width = Math.max(920, data.length * 34);
    const height = 330;
   const padding = { top: 28, right: 2, bottom: 54, left: 62 };

    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const max = Math.max(...data.map((item) => item.count), 1);
    const stepX = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;
    const barWidth = Math.max(12, Math.min(22, stepX * 0.52));

    const points = data.map((item, index) => {
      const x = padding.left + index * stepX;
      const y = padding.top + innerHeight - (item.count / max) * innerHeight;

      return { ...item, x, y };
    });


    const gridValues =
      max <= 6
        ? Array.from({ length: max + 1 }, (_, index) => max - index)
        : Array.from(new Set(
            Array.from({ length: 5 }, (_, index) =>
              Math.round(max - max * (index / 4)),
            ),
          ));

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
  }, [data]);

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const confirmed = data.reduce((sum, item) => sum + item.confirmed, 0);
  const pending = data.reduce((sum, item) => sum + item.pending, 0);
  const todayCount = data.find((item) => item.key === toISODateKey(today))?.count || 0;
  const activeDays = data.filter((item) => item.count > 0).length;
  const bestDay = data.reduce(
    (best, item) => (item.count > best.count ? item : best),
    data[0] || { day: "—", count: 0, key: "" },
  );
  const activePoint =
    chart.points.find((item) => item.key === activeDayKey) ||
    chart.points.find((item) => item.key === toISODateKey(today) && item.count > 0) ||
    (bestDay.count > 0 ? chart.points.find((item) => item.key === bestDay.key) : null);

  const monthLabel = visibleMonth.toLocaleDateString("uk-UA", {
    month: "long",
    year: "numeric",
  });

  const isCurrentMonth = isSameMonth(visibleMonth, today);

  return (
    <SectionShell>
      <div className="px-4 pb-5 pt-5 sm:px-6 sm:pb-7 sm:pt-6">
        <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
              Професійна аналітика
            </div>

            <h2 className="text-2xl font-black tracking-tight text-[var(--color-ink)] sm:text-3xl">
              Графік записів
            </h2>

          </div>


        </div>


<div className="mt-4 flex justify-center">
  <div className="flex flex-wrap items-center justify-center gap-2">
    <button
      type="button"
      onClick={() => {
        setActiveDayKey(null);
        setVisibleMonth((current) => addMonthsSafe(current, -1));
      }}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white text-[var(--color-ink)] shadow-sm transition hover:bg-[var(--color-cream)] active:scale-[0.98]"
      aria-label="Попередній місяць"
      title="Попередній місяць"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>

    <button
      type="button"
      onClick={() => {
        const current = new Date(nowTs);
        current.setDate(1);
        current.setHours(0, 0, 0, 0);
        setActiveDayKey(null);
        setVisibleMonth(current);
      }}
      disabled={isCurrentMonth}
      className="inline-flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white px-4 text-sm font-black text-[var(--color-primary-buttom)] shadow-sm transition hover:bg-[var(--color-cream)] active:scale-[0.98]"
    >
<CalendarDays className="h-4 w-4" />

<span className="capitalize">
  {isCurrentMonth
    ? "Поточний місяць"
    : visibleMonth.toLocaleDateString("uk-UA", {
        month: "long",
        year: "numeric",
      })}
</span>
    </button>

    <button
      type="button"
      onClick={() => {
        setActiveDayKey(null);
        setVisibleMonth((current) => addMonthsSafe(current, 1));
      }}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white text-[var(--color-ink)] shadow-sm transition hover:bg-[var(--color-cream)] active:scale-[0.98]"
      aria-label="Наступний місяць"
      title="Наступний місяць"
    >
      <ChevronRight className="h-5 w-5" />
    </button>
  </div>
</div>
        <div className="mb-5 mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <ChartKpi label="Усього записів" value={total} tone="emerald" />
          <ChartKpi label="Підтверджені" value={confirmed} tone="sky" />
          <ChartKpi label="Очікують" value={pending} tone="amber" />
          <ChartKpi label="Записи на сьогодні" value={todayCount} tone="slate" />
        </div>
        <div className="relative mt-4 overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

         <div className="grid gap-0">
            <div className="min-w-0 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-emerald-50/45 p-3 sm:p-4 xl:border-b-0 xl:border-r">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-black text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-6 rounded-full bg-[var(--color-mist)]" />
                    Нема записів
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-6 rounded-full bg-emerald-600" />
                    Записи
                  </span>
                </div>

                <p className="text-[11px] font-bold text-slate-400">
                  Наведіть або натисніть на дату
                </p>
              </div>

<div className="relative">
<div className="pointer-events-none absolute -left-5 top-0 z-20 h-[320px] w-16 rounded-l-[24px] border-r border-slate-200/80 bg-gradient-to-r from-white via-white to-white/90 shadow-[14px_0_24px_rgba(255,255,255,0.86)] sm:h-[360px]">
  <span
    className="absolute whitespace-nowrap text-[9px] font-black uppercase tracking-[0.14em] text-slate-500"
style={{
  left: "42%",
  top: "50%",
  writingMode: "vertical-rl",
  transform: "translate(-50%, -50%) rotate(180deg)",
}}
  >
    К-ть записів
  </span>

    {chart.grid.map((line) => (
      <span
        key={`fixed-axis-${line.value}-${line.y}`}
        className="absolute right-2 -translate-y-1/2 rounded-lg bg-white px-1.5 py-0.5 text-[12px] font-black text-slate-600"
        style={{ top: `${(line.y / chart.height) * 100}%` }}
      >
        {line.value}
      </span>
    ))}
  </div>

  <div className="overflow-x-auto pb-2">
    <svg

                  viewBox={`0 0 ${chart.width} ${chart.height}`}
                  className="h-[320px] min-w-[920px] select-none sm:h-[360px]"
                  role="img"
                  aria-label={`Графік записів за ${monthLabel}`}
                >
                  <defs>
                    <linearGradient id="bookingBarsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="48%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                    <linearGradient id="bookingTrendGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <linearGradient id="bookingAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>

{chart.grid.map((line) => (
  <g key={line.y}>
    <line
      x1={chart.padding.left}
      x2={chart.width - chart.padding.right}
      y1={line.y}
      y2={line.y}
      stroke="#e2e8f0"
      strokeDasharray="5 7"
    />
  </g>
))}


                  {chart.areaPath && <path d={chart.areaPath} fill="url(#bookingAreaGradient)" />}

                  {chart.points.map((item) => {
                    const baseY = chart.padding.top + chart.innerHeight;
                    const barHeight = baseY - item.y;
                    const isToday = item.key === toISODateKey(today);
                    const isActive = activePoint?.key === item.key;
                    const isWeekend = item.date.getDay() === 0 || item.date.getDay() === 6;

                    return (
                      <g
                        key={item.key}
                        onMouseEnter={() => setActiveDayKey(item.key)}
                        onFocus={() => setActiveDayKey(item.key)}
                        onClick={() => setActiveDayKey(item.key)}
                        tabIndex={0}
                        className="cursor-pointer outline-none"
                      >
                        <rect
                          x={item.x - chart.barWidth / 2}
                          y={item.count > 0 ? item.y : baseY - 8}
                          width={chart.barWidth}
                          height={item.count > 0 ? Math.max(8, barHeight) : 8}
                          rx="8"
                          fill={item.count > 0 ? "url(#bookingBarsGradient)" : isWeekend ? "#cbd5e1" : "#e2e8f0"}
                          opacity={isActive ? 1 : item.count > 0 ? 0.88 : 0.75}
                        />

                        {isToday && (
                          <line
                            x1={item.x}
                            x2={item.x}
                            y1={chart.padding.top - 8}
                            y2={baseY + 8}
                            stroke="#047857"
                            strokeWidth="2"
                            strokeDasharray="4 6"
                            opacity="0.75"
                          />
                        )}

                        {isActive && (
                          <circle
                            cx={item.x}
                            cy={item.y}
                            r="8"
                            fill="white"
                            stroke="#047857"
                            strokeWidth="3"
                          />
                        )}

                        <text
                          x={item.x}
                          y={baseY + 24}
                          textAnchor="middle"
                          className={cn(
                            "text-[11px] font-black",
                            isToday ? "fill-emerald-700" : isWeekend ? "fill-slate-500" : "fill-slate-400",
                          )}
                        >
                          {item.day}
                        </text>

                        {(item.day === 1 || item.day % 5 === 0 || item.day === data.length) && (
                          <text
                            x={item.x}
                            y={baseY + 41}
                            textAnchor="middle"
                            className="fill-slate-400 text-[10px] font-bold"
                          >
                            {item.weekday}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {chart.linePath && (
                    <path
                      d={chart.linePath}
                      fill="none"
                      stroke="url(#bookingTrendGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      opacity="0.95"
                    />
                  )}
                  </svg>
  </div>
</div>

              </div>
            </div>

            <div className="bg-white p-4 sm:p-5">
              <div className="rounded-[26px] border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Активна дата
                </p>

                <p className="mt-2 text-2xl font-black text-slate-950">
                  {activePoint ? formatDateUA(activePoint.key) : "—"}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <ChartTinyStat label="Усього" value={activePoint?.count || 0} />
                  <ChartTinyStat label="ОК" value={activePoint?.confirmed || 0} />
                  <ChartTinyStat label="Нові" value={activePoint?.pending || 0} />
                </div>
              </div>

              <div className="mt-3 rounded-[26px] border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                  Найактивніший день
                </p>
                <p className="mt-2 text-xl font-black text-emerald-950">
                  {bestDay.count > 0 ? formatDateUA(bestDay.key) : "Записів немає"}
                </p>
                <p className="mt-1 text-sm font-bold text-emerald-700">
                  {bestDay.count > 0 ? `${bestDay.count} записів` : "Оберіть інший місяць або чекайте бронювань"}
                </p>
              </div>

              <div className="mt-3 rounded-[26px] border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Завантаженість
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-sky-400"
                    style={{
                      width: `${Math.min(100, Math.round((activeDays / Math.max(data.length, 1)) * 100))}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  {activeDays} з {data.length} днів мають записи
                </p>
              </div>
            </div>
          </div>
        </div>
    
    </SectionShell>
  );
}

function ChartKpi({ label, value, tone = "emerald" }) {
  const tones = {
    emerald: "from-emerald-50 to-white text-emerald-700",
    sky: "from-sky-50 to-white text-sky-700",
    amber: "from-amber-50 to-white text-amber-700",
    slate: "from-slate-50 to-white text-slate-700",
  };

  return (
    <div className={cn("rounded-[24px] border border-white/80 bg-gradient-to-br p-4 shadow-sm", tones[tone])}>
      <p className="truncate text-[10px] font-black uppercase tracking-[0.12em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black leading-none text-slate-950">
        {value}
      </p>
    </div>
  );
}

function ChartTinyStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-2 py-3 text-center shadow-sm">
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="mt-0.5 truncate text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>
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
  const activeStatuses = ["confirmed", "new", "pending", "CONFIRMED", "NEW", "PENDING"];

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


<MonthlyBookingsChart bookings={bookings} nowTs={nowTs} />
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
<div className="mt-6 rounded-2xl border-2 border-dashed border-[var(--color-caramel)]/40 bg-[var(--color-cream)] p-6 text-center sm:p-8">
  <div className="mb-3 flex items-center justify-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70">
      <CalendarDays className="h-7 w-7 text-[var(--color-caramel)]" />
    </div>
  </div>

  <p className="text-sm font-medium text-[var(--color-caramel)]">
    Немає запланованих записів
  </p>

  <p className="mt-1 text-xs text-[var(--color-caramel)]/80">
    Коли клієнти почнуть записуватись, тут з’являться всі бронювання
  </p>
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
  "transition-all duration-200 active:scale-[0.98]",

  // 👉 nude-green
  "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",

  // 👉 hover
  "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]"
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
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
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
