import { useMemo, useRef, useState, useEffect } from "react";
import { useBookings } from "../context/bookings/useBookings";

function formatUA(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isPast(dateStr, timeStr) {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  if (timeStr) {
    const [hh, mm] = String(timeStr).split(":").map(Number);
    dt.setHours(hh || 0, mm || 0, 0, 0);
  } else {
    dt.setHours(23, 59, 59, 999);
  }
  return dt.getTime() < Date.now();
}

function Badge({ children, tone = "gray" }) {
  const map = {
    gray: "border-gray-200 bg-gray-50 text-gray-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M7 3v3M17 3v3M4 8h16M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 8v5l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M9 9h10v10H9V9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed bg-gradient-to-b from-gray-50 to-white p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gray-900 text-white">
        <IconCalendar />
      </div>
      <h3 className="mt-4 text-base font-extrabold text-gray-900">
        Поки що немає записів
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        Коли ви запишетесь у студію, запис з’явиться тут (майбутні та минулі).
      </p>
    </div>
  );
}

export default function MyBookings() {
  const { bookings, cancelBooking } = useBookings();
  const [tab, setTab] = useState("upcoming"); // upcoming | past | canceled | all
  const [q, setQ] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const copyTimerRef = useRef(null);
  const normalized = useMemo(() => {
    const list = Array.isArray(bookings) ? bookings : [];
    // нові зверху
    return [...list].reverse();
  }, [bookings]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return normalized.filter((b) => {
      const status = b.status || "active";
      const past = isPast(b.date, b.time);

      const matchTab =
        tab === "all"
          ? true
          : tab === "canceled"
            ? status === "canceled"
            : tab === "past"
              ? status !== "canceled" && past
              : status !== "canceled" && !past;

      if (!matchTab) return false;
      if (!query) return true;

      const hay = [
        b.studioName,
        b.serviceName,
        b.date,
        b.time,
        b.clientName,
        b.clientPhone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });
  }, [normalized, tab, q]);

  const counters = useMemo(() => {
    const list = normalized;
    let upcoming = 0;
    let past = 0;
    let canceled = 0;

    for (const b of list) {
      const status = b.status || "active";
      if (status === "canceled") {
        canceled += 1;
        continue;
      }
      if (isPast(b.date, b.time)) past += 1;
      else upcoming += 1;
    }

    return { upcoming, past, canceled, all: list.length };
  }, [normalized]);
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);
  async function copyText(text, id) {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.top = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }

    setCopiedId(id);

    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedId(null), 1200);
  }

  return (
    <div className="pt-6 px-4 sm:pt-8 sm:px-6 lg:pt-6 lg:px-8 space-y-6">
      <div className="rounded-[28px] border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-7 py-6 border-b bg-gradient-to-b from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                Мої записи
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Майбутні та минулі записи у студії. Тут можна швидко знайти
                потрібний.
              </p>
            </div>

            {/* Search */}
            <div className="w-full sm:w-[320px]">
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 text-gray-400"
                >
                  <path
                    d="M21 21l-4.3-4.3m1.3-5.4a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Пошук: студія, послуга, дата…"
                  className="w-full bg-transparent text-sm outline-none"
                />
                {q ? (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="text-gray-400 hover:text-gray-700 transition"
                    aria-label="Очистити пошук"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("upcoming")}
              className={[
                "rounded-2xl px-4 py-2 text-sm font-bold border transition",
                tab === "upcoming"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50",
              ].join(" ")}
            >
              Майбутні <span className="opacity-80">({counters.upcoming})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("past")}
              className={[
                "rounded-2xl px-4 py-2 text-sm font-bold border transition",
                tab === "past"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50",
              ].join(" ")}
            >
              Минулі <span className="opacity-80">({counters.past})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("canceled")}
              className={[
                "rounded-2xl px-4 py-2 text-sm font-bold border transition",
                tab === "canceled"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50",
              ].join(" ")}
            >
              Скасовані{" "}
              <span className="opacity-80">({counters.canceled})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("all")}
              className={[
                "rounded-2xl px-4 py-2 text-sm font-bold border transition",
                tab === "all"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50",
              ].join(" ")}
            >
              Усі <span className="opacity-80">({counters.all})</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7">
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-3">
              {filtered.map((b, idx) => {
                const status = b.status || "active";
                const past = status !== "canceled" && isPast(b.date, b.time);

                const badge =
                  status === "canceled"
                    ? { text: "Скасовано", tone: "rose" }
                    : past
                      ? { text: "Минув", tone: "amber" }
                      : { text: "Майбутній", tone: "emerald" };

                const title = b.studioName || "Студія";
                const service = b.serviceName || "Послуга";
                const when = b.date
                  ? `${b.time || ""} • ${formatUA(b.date)}`.trim()
                  : "";
                const price =
                  typeof b.price === "number" ? `${b.price} грн` : null;
                const phone = b.clientPhone || null;
                const addr = b.address || b.studioAddress || b.location || null; // якщо колись додаси — підхопить

                return (
                  <div
                    key={
                      b.id ??
                      `${b.studioSlug ?? "studio"}-${b.date ?? "d"}-${b.time ?? "t"}-${idx}`
                    }
                    className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_18px_60px_-50px_rgba(0,0,0,0.45)]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-extrabold text-gray-900 truncate">
                            {title}
                          </h3>
                          <Badge tone={badge.tone}>{badge.text}</Badge>
                          {price ? <Badge>{price}</Badge> : null}
                        </div>

                        <p className="mt-1 text-sm font-semibold text-gray-700">
                          {service}
                        </p>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {when ? (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="text-gray-400">
                                <IconClock />
                              </span>
                              <span className="font-semibold">{when}</span>
                            </div>
                          ) : null}

                          {phone ? (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="text-gray-400">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  className="h-5 w-5"
                                >
                                  <path
                                    d="M22 16.9v3a2 2 0 0 1-2.2 2 19.9 19.9 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.9 19.9 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2L8.1 9a16 16 0 0 0 7 7l.7-1.1a2 2 0 0 1 2-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.6 1.9Z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              <span className="font-semibold">{phone}</span>
                            </div>
                          ) : null}

                          {addr ? (
                            <div className="flex items-start gap-2 text-sm text-gray-700 sm:col-span-2">
                              <span className="mt-0.5 text-gray-400">
                                <IconPin />
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold break-words">
                                  {addr}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => copyText(addr, b.id ?? idx)}
                                className="group relative ml-auto inline-flex items-center justify-center text-gray-400 hover:text-gray-900 transition active:scale-[0.96]"
                                aria-label="Скопіювати адресу"
                                title="Скопіювати адресу"
                              >
                                <IconCopy />
                                <span
                                  className={`
                                    pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2
                                    whitespace-nowrap rounded-md bg-gray-900 px-2 py-1
                                    text-[11px] font-bold text-white
                                    opacity-0 translate-y-1 transition
                                    group-hover:opacity-100 group-hover:translate-y-0
                                    ${copiedId === (b.id ?? idx) ? "opacity-100 translate-y-0" : ""}
                                  `}
                                >
                                  {copiedId === (b.id ?? idx)
                                    ? "Скопійовано!"
                                    : "Копіювати"}
                                </span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2">
                        {/* actions */}
                        {status !== "canceled" && !past ? (
                          <button
                            type="button"
                            onClick={() => cancelBooking?.(b)}
                            className="w-full sm:w-auto rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-extrabold text-rose-700 hover:bg-rose-100 transition"
                          >
                            Скасувати
                          </button>
                        ) : null}

                        <div className="w-full sm:w-auto rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">
                          #{String((b.id ?? idx) + 1).padStart(3, "0")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
