// MyBookings.jsx
import { useMemo, useRef, useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  CalendarDays,
  Clock3,
  MapPin,
  Phone,
  Copy,
  CheckCheck,
  X,
} from "lucide-react";
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

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ children, tone = "gray" }) {
  const map = {
    gray: "border-stone-200 bg-stone-100 text-stone-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}

function FilterTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[18px] border px-4 py-2 text-sm font-bold transition-all duration-200 active:scale-95",
        active
          ? "border-stone-900 bg-stone-900 text-white shadow-sm"
          : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-stone-200/70 bg-white p-8 shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)] sm:p-10">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-stone-200 bg-stone-100">
          <CalendarDays className="h-7 w-7 text-stone-500" />
        </div>

        <h3 className="mt-4 text-xl font-semibold tracking-tight text-stone-800">
          Поки що немає записів
        </h3>

        <p className="mt-2 text-sm text-stone-500">
          Коли ви запишетесь у студію, усі записи зʼявляться тут — майбутні,
          минулі або скасовані.
        </p>
      </div>
    </div>
  );
}

export default function MyBookings() {
  const { bookings, cancelBooking } = useBookings();
  const [tab, setTab] = useState("upcoming");
  const [q, setQ] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const copyTimerRef = useRef(null);

  const normalized = useMemo(() => {
    const list = Array.isArray(bookings) ? bookings : [];
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
        b.address,
        b.studioAddress,
        b.location,
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

      if (isPast(b.date, b.time)) {
        past += 1;
      } else {
        upcoming += 1;
      }
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
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-2.5 pb-4 pt-18 sm:px-4 sm:pb-8 sm:pt-14 lg:pt-16">
        <div className="space-y-3 px-0 pt-2 sm:space-y-5 sm:pt-8 lg:pt-6">
      <section className="overflow-hidden rounded-[24px] border border-stone-200/60 bg-white shadow-[0_4px_20px_-6px_rgba(120,90,60,0.08)] sm:rounded-3xl">
        <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

        <div className="px-4 pb-7 pt-7 sm:px-6 sm:pb-4 sm:pt-5 lg:px-8 lg:pt-6">
          <div className="mb-5 space-y-3 sm:mb-4 sm:space-y-2 lg:mb-5">
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 sm:px-4 sm:py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 sm:h-4 sm:w-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 sm:text-xs sm:tracking-[0.22em]">
                Мої бронювання
              </span>
            </div>

            <h1 className="max-w-full !text-[34px] font-black leading-tight tracking-[-0.03em] text-stone-800 sm:max-w-none sm:!text-5xl lg:!text-5xl">
              Керуйте своїми <span className="text-amber-600">записами</span>
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-stone-600 sm:text-base sm:leading-7">
              Переглядай майбутні, минулі та скасовані записи, знаходь потрібну
              студію та швидко керуй бронюваннями.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <FilterTab
                active={tab === "upcoming"}
                onClick={() => setTab("upcoming")}
              >
                Майбутні ({counters.upcoming})
              </FilterTab>

              <FilterTab active={tab === "past"} onClick={() => setTab("past")}>
                Минулі ({counters.past})
              </FilterTab>

              <FilterTab
                active={tab === "canceled"}
                onClick={() => setTab("canceled")}
              >
                Скасовані ({counters.canceled})
              </FilterTab>

              <FilterTab active={tab === "all"} onClick={() => setTab("all")}>
                Усі ({counters.all})
              </FilterTab>
            </div>

            <div className="w-full lg:w-[360px]">
              <div className="flex items-center gap-2.5 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition-all duration-200 focus-within:border-amber-300 focus-within:ring-4 focus-within:ring-amber-100">
                <Search className="h-4 w-4 text-stone-400" />

                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Пошук: студія, послуга, дата…"
                  className="w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
                />

                {q ? (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="text-stone-400 transition hover:text-red-600"
                    aria-label="Очистити пошук"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 text-sm text-stone-500">
        <span className="rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
          Знайдено: {filtered.length}
        </span>

        {q ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            Пошук: {q}
          </span>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 sm:gap-4">
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
              ? `${b.time || ""}${b.time ? " • " : ""}${formatUA(b.date)}`
              : "";
            const price = typeof b.price === "number" ? `${b.price} грн` : null;
            const phone = b.clientPhone || null;
            const addr = b.address || b.studioAddress || b.location || null;
            const rowId =
              b.id ??
              `${b.studioSlug ?? "studio"}-${b.date ?? "d"}-${b.time ?? "t"}-${idx}`;
            const numberLabel = `#${String((b.id ?? idx) + 1).padStart(3, "0")}`;

            return (
              <div
                key={rowId}
                className={cn(
                  "group relative overflow-hidden rounded-[24px] border bg-white p-5 transition-all duration-300 sm:rounded-[28px]",
                  "shadow-[0_10px_26px_rgba(15,23,42,0.07)] hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)]",
                  status === "canceled"
                    ? "border-rose-200/70"
                    : past
                      ? "border-amber-200/70"
                      : "border-stone-200/80",
                )}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-black tracking-[-0.02em] text-stone-900 sm:text-lg">
                        {title}
                      </h3>

                      <Badge tone={badge.tone}>{badge.text}</Badge>

                      {price ? <Badge tone="gray">{price}</Badge> : null}
                    </div>

                    <p className="mt-1 text-sm font-semibold text-stone-700">
                      {service}
                    </p>

                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                      {when ? (
                        <div className="flex items-center gap-2.5 rounded-2xl border border-stone-200/80 bg-stone-50/80 px-3 py-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                            <Clock3 className="h-4 w-4 text-amber-600" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
                              Час запису
                            </p>
                            <p className="mt-1 text-sm font-medium leading-5 text-stone-700">
                              {when}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {phone ? (
                        <div className="flex items-center gap-2.5 rounded-2xl border border-stone-200/80 bg-stone-50/80 px-3 py-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                            <Phone className="h-4 w-4 text-emerald-600" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
                              Телефон
                            </p>
                            <p className="mt-1 break-words text-sm font-medium leading-5 text-stone-700">
                              {phone}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {addr ? (
                        <div className="flex items-start gap-2.5 rounded-2xl border border-stone-200/80 bg-stone-50/80 px-3 py-3 sm:col-span-2">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                            <MapPin className="h-4 w-4 text-rose-500" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
                              Адреса
                            </p>
                            <p className="mt-1 break-words text-sm font-medium leading-5 text-stone-700">
                              {addr}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => copyText(addr, rowId)}
                            className="group/copy relative ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 transition-all duration-200 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 active:scale-[0.96]"
                            aria-label="Скопіювати адресу"
                            title="Скопіювати адресу"
                          >
                            {copiedId === rowId ? (
                              <CheckCheck className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}

                            <span
                              className={cn(
                                "pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-[11px] font-bold text-white opacity-0 translate-y-1 transition",
                                "group-hover/copy:opacity-100 group-hover/copy:translate-y-0",
                                copiedId === rowId &&
                                  "opacity-100 translate-y-0",
                              )}
                            >
                              {copiedId === rowId
                                ? "Скопійовано!"
                                : "Копіювати"}
                            </span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    {status !== "canceled" && !past ? (
                      <button
                        type="button"
                        onClick={() => cancelBooking?.(b)}
                        className="w-full rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition-all duration-200 hover:bg-rose-100 hover:shadow-sm active:scale-95 sm:w-auto"
                      >
                        Скасувати
                      </button>
                    ) : null}

                    <div className="inline-flex items-center justify-center rounded-[18px] border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 shadow-sm">
                      {numberLabel}
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
