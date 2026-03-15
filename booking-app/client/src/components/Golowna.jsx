import { useMemo, useState, useEffect } from "react";
import { useBookings } from "../context/bookings/useBookings";

// =========================
// Helpers (як у Bookings)
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
  // week starts Monday
  const x = new Date(d);
  const day = x.getDay(); // 0..6 Sun..Sat
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

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

function Card({ className = "", children }) {
  return (
    <section
      className={cx(
        "rounded-[28px] border border-[#E9DED2] bg-[#FFFCF8] shadow-[0_10px_30px_rgba(93,64,55,0.06)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </div>
      <div className="mt-2 text-3xl font-black tracking-tight text-gray-900">
        {value}
      </div>
    </div>
  );
}

function ButtonBase({ className = "", ...props }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-[16px] px-4 py-2.5 text-sm font-semibold",
        "transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        "focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/15",
        className,
      )}
      {...props}
    />
  );
}

function PrimaryButton({ className = "", ...props }) {
  return (
    <ButtonBase
      className={cx(
        "bg-[#4A5D4E] text-white shadow-[0_10px_24px_rgba(74,93,78,0.22)] hover:bg-[#3F5143]",
        className,
      )}
      {...props}
    />
  );
}

function GhostButton({ className = "", ...props }) {
  return (
    <ButtonBase
      className={cx(
        "border border-[#E7DED6] bg-white text-[#6B625A] hover:bg-[#FAF7F4] hover:text-[#1F2A22]",
        className,
      )}
      {...props}
    />
  );
}

// =========================
// Page
// =========================
export default function Golowna() {
  const { bookings } = useBookings();

  // щоб “майбутні” самі оновлювалися щохвилини
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

const stats = useMemo(() => {
  const list = (bookings || []).filter(
    (b) => b && b.id && b.status !== "deleted" && b.status !== "canceled"
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

  let todayNew = 0; // ✅ нові (не підтверджені) на сьогодні

  for (const b of list) {
    const dt = getBookingDateTime(b);
    if (!dt) continue;

    // тільки активні (не в минулому)
    if (dt.getTime() < nowTs) continue;

    const dateOnly = new Date(b.date);
    if (Number.isNaN(dateOnly.getTime())) continue;

    const key = toISODateKey(dateOnly);

    const isNew = !b.status || b.status === "new";

    // сьогодні
    if (key === todayKey) {
      todayActive++;
      if (isNew) todayNew++;
    }

    // тиждень
    if (dateOnly >= weekStart && dateOnly < weekEnd) {
      weekActive++;
    }

    // місяць
    if (dateOnly >= monthStart && dateOnly < monthEnd) {
      monthActive++;
    }
  }

return [
  { title: <>Активні записи<br />на сьогодні</>, value: todayActive },
  { title: <>Нові записи<br />(не підтверджені)</>, value: todayNew },
  { title: <>Активні записи<br />на тижні</>, value: weekActive },
  { title: <>Активні записи<br />на місяць</>, value: monthActive },
];
}, [bookings, nowTs]);

  const upcomingAppointments = useMemo(() => {
    const list = (bookings || []).filter((b) => b && b.id && b.status !== "deleted");

    const upcoming = [];
    for (const b of list) {
      const dt = getBookingDateTime(b);
      if (!dt) continue;
      if (dt.getTime() < nowTs) continue; // тільки майбутні
      upcoming.push({ b, ts: dt.getTime() });
    }

    upcoming.sort((a, c) => a.ts - c.ts);

    // покажемо 5 найближчих
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
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Welcome */}
<Card className="p-6 sm:p-7">
  <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#C89D72]">
    dashboard студії
  </p>

  <h2 className="mt-3 text-center text-2xl font-black tracking-[-0.03em] text-[#1F2A22] sm:text-3xl">
    Вітаємо в кабінеті майстра 👋
  </h2>

  <p className="mt-3 text-center text-sm leading-6 text-[#857A70] sm:text-base">
    Керуйте студією, послугами та записами в одному теплому, зручному просторі.
  </p>
</Card>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map((item) => (
          <StatCard key={item.title} title={item.title} value={item.value} />
        ))}
      </div>


      {/* Upcoming */}
<Card className="p-5 sm:p-6">
  <div className="flex items-start justify-between gap-3">
    <div>
      <h3 className="text-lg font-bold text-[#1F2A22]">Найближчі записи</h3>
      <p className="mt-1 text-sm text-[#857A70]">
        Тільки майбутні записи, відсортовані за датою та часом.
      </p>
    </div>
  </div>

        {upcomingAppointments.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
            Немає запланованих записів
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {upcomingAppointments.map((x) => {
              const key = x.date ? String(x.date) : "";
              const dateLabel = key ? formatDateUA(key) : "—";
              const showDate = key && key !== todayKey;

              return (
<li
  key={x.id}
  className="flex flex-col gap-1 rounded-[22px] border border-[#E9DED2] bg-white p-4 transition hover:bg-[#FCF8F3] sm:flex-row sm:items-center sm:justify-between"
>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-[#1F2A22]">
                      {x.time}{" "}
                      <span className="font-medium text-[#D8C8B8]">•</span>{" "}
                      {x.service}
                    </p>
<p className="mt-1 truncate text-sm text-[#857A70]">
  Клієнт: <span className="font-semibold text-[#1F2A22]">{x.client}</span>
</p>
                  </div>

                  <div className="text-sm font-semibold text-[#857A70] sm:text-right">
                    {showDate ? dateLabel : "Сьогодні"}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}