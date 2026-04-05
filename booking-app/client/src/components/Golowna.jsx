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
} from "lucide-react";

// =========================
// Helpers
// =========================
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

function AppointmentCard({ item, todayKey }) {
  const key = item.date ? String(item.date) : "";
  const dateLabel = key ? formatDateUA(key) : "—";
  const isToday = key === todayKey;

  return (
    <li className="group rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_8px_25px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:p-5">
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
          </div>

          <p className="mt-3 text-base font-semibold text-stone-800 sm:text-lg">
            {item.service}
          </p>

          <p className="mt-1 truncate text-sm text-stone-500">
            Клієнт:{" "}
            <span className="font-semibold text-stone-800">{item.client}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start text-xs font-semibold text-stone-400 sm:self-center">
          Детальніше
          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </div>
    </li>
  );
}

// =========================
// Page
// =========================
export default function Golowna() {
  const { bookings } = useBookings();

  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const list = (bookings || []).filter(
      (b) => b && b.id && b.status !== "deleted" && b.status !== "canceled",
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

  const upcomingAppointments = useMemo(() => {
    const list = (bookings || []).filter(
      (b) => b && b.id && b.status !== "deleted",
    );

    const upcoming = [];
    for (const b of list) {
      const dt = getBookingDateTime(b);
      if (!dt) continue;
      if (dt.getTime() < nowTs) continue;
      upcoming.push({ b, ts: dt.getTime() });
    }

    upcoming.sort((a, c) => a.ts - c.ts);

    return upcoming.slice(0, 5).map(({ b }) => ({
      id: b.id,
      date: b.date,
      time: parseTimeToHHMM(b.time) || b.time || "—",
      service: b.serviceName || "—",
      client: b.clientName || "—",
    }));
  }, [bookings, nowTs]);

  const todayKey = toISODateKey(new Date(nowTs));

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
          {stats.map((item) => (
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
                  Розклад
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-800 sm:text-3xl">
                  Найближчі записи
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  Тільки майбутні записи, відсортовані за датою та часом.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Оновлюється автоматично
              </div>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-stone-200 bg-stone-50 p-8 text-center text-sm text-stone-500">
                Немає запланованих записів
              </div>
            ) : (
              <ul className="mt-6 space-y-3">
                {upcomingAppointments.map((item) => (
                  <AppointmentCard
                    key={item.id}
                    item={item}
                    todayKey={todayKey}
                  />
                ))}
              </ul>
            )}
          </div>
        </SectionShell>
      </div>
    </div>
  );
}