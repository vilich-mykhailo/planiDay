// MyBookings.jsx
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
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
  Scissors,
  UserRound,
  ChevronRight,
} from "lucide-react";

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

const PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return PUBLIC ? `${PUBLIC}/${s}` : s;
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
    <div className="rounded-[28px] border border-stone-200/70 bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.06)] sm:p-10">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-stone-200 bg-gradient-to-br from-stone-50 to-stone-100 shadow-sm">
          <CalendarDays className="h-8 w-8 text-stone-500" />
        </div>

        <h3 className="mt-5 text-xl font-black tracking-tight text-stone-900 sm:text-2xl">
          Поки що немає записів
        </h3>

        <p className="mt-2 text-sm leading-6 text-stone-500 sm:text-[15px]">
          Коли ви запишетесь у студію, тут зʼявляться всі бронювання —
          майбутні, минулі та скасовані.
        </p>
      </div>
    </div>
  );
}

function getStatusUi(status) {
  if (status === "canceled") {
    return {
      text: "Скасовано",
      badge: "bg-rose-100 text-rose-700",
      button:
        "from-rose-500 to-red-500 shadow-[0_10px_24px_rgba(244,63,94,0.24)] hover:brightness-105",
      side: "border-rose-200/80",
      time: "text-rose-700",
    };
  }

  if (status === "confirmed") {
    return {
      text: "Підтверджено",
      badge: "bg-emerald-100 text-emerald-700",
      button:
        "from-emerald-500 to-green-500 shadow-[0_10px_24px_rgba(16,185,129,0.24)] hover:brightness-105",
      side: "border-emerald-200/80",
      time: "text-emerald-700",
    };
  }

  if (status === "completed" || status === "past") {
    return {
      text: "Завершено",
      badge: "bg-sky-100 text-sky-700",
      button:
        "from-sky-500 to-cyan-500 shadow-[0_10px_24px_rgba(14,165,233,0.24)] hover:brightness-105",
      side: "border-sky-200/80",
      time: "text-sky-700",
    };
  }

  return {
    text: "Очікує",
    badge: "bg-amber-100 text-amber-700",
    button:
      "from-amber-500 to-orange-500 shadow-[0_10px_24px_rgba(245,158,11,0.24)] hover:brightness-105",
    side: "border-amber-200/80",
    time: "text-amber-700",
  };
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");
  const [q, setQ] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const copyTimerRef = useRef(null);
  const [activeBooking, setActiveBooking] = useState(null);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || role !== "client") {
        setBookings([]);
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/client/bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || `Load client bookings failed (${res.status})`,
        );
      }

      setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
    } catch (e) {
      console.error(e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (!activeBooking) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeBooking]);

  async function cancelBooking(booking) {
    if (!booking?.id) return;

    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/client/bookings/${booking.id}/cancel`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || `Cancel booking failed (${res.status})`);
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: "canceled" } : b)),
    );
  }

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
        b.masterName,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-orange-50/20">
        <div className="mx-auto max-w-6xl px-2.5 pb-4 pt-18 sm:px-4 sm:pb-8 sm:pt-14 lg:pt-16">
          <div className="rounded-[28px] border border-stone-200 bg-white p-8 text-sm text-stone-500 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
            Завантаження записів...
          </div>
        </div>
      </div>
    );
  }

  const activeStatus = activeBooking?.status || "new";
  const activePast =
    activeStatus !== "canceled" &&
    isPast(activeBooking?.date, activeBooking?.time);

  const activeTitle = activeBooking?.studioName || "Студія";
  const activeService = activeBooking?.serviceName || "Послуга";
  const activeWhen = activeBooking?.date
    ? `${activeBooking?.time || ""}${activeBooking?.time ? " • " : ""}${formatUA(
        activeBooking.date,
      )}`
    : "";

  const activePhone = activeBooking?.studioPhone || null;
  const activeAddr =
    activeBooking?.address ||
    activeBooking?.studioAddress ||
    activeBooking?.location ||
    null;

  const activeStatusUi = getStatusUi(activeStatus);
  const activeLogo =
    activeBooking?.studio?.logoUrl ||
    activeBooking?.logoUrl ||
    activeBooking?.studioLogo ||
    "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-orange-50/20">
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

                  <FilterTab
                    active={tab === "past"}
                    onClick={() => setTab("past")}
                  >
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
                const rawStatus = b.status || "new";
const bookingPast = isPast(b.date, b.time);

const status =
  rawStatus === "canceled"
    ? "canceled"
    : bookingPast
      ? "completed"
      : rawStatus;
                const statusUi = getStatusUi(status);

                const title = b.studioName || "Студія";
                const service = b.serviceName || "Послуга";
                const price =
                  typeof b.price === "number" ? `${b.price} грн` : null;
                const phone = b.studioPhone || null;
                const addr = b.address || b.studioAddress || b.location || null;

                const rowId =
                  b.id ??
                  `${b.studioSlug ?? "studio"}-${b.date ?? "d"}-${b.time ?? "t"}-${idx}`;

                const numberLabel = `#${String(idx + 1).padStart(3, "0")}`;

                const dt = b.date
                  ? new Date(`${b.date}T${b.time || "00:00"}`)
                  : null;

                const monthLabel = dt
                  ? dt.toLocaleDateString("uk-UA", { month: "long" })
                  : "";

                const dayLabel = dt
                  ? dt.toLocaleDateString("uk-UA", { day: "numeric" })
                  : "";

                const timeLabel = b.time || "";

                const studioImage = toPublicUrl(
                  b.studio?.coverUrl ||
                    b.coverUrl ||
                    b.studioCover ||
                    b.studio?.photoUrl ||
                    ""
                );

                const studioLogo = toPublicUrl(
                  b.studio?.logoUrl || b.logoUrl || b.studioLogo || ""
                );

                return (
<div
  key={rowId}
  className="rounded-[28px] border border-stone-200/70 bg-white p-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-4"
>
  <div className="grid grid-cols-[1fr_88px] gap-3">
    <div className="min-w-0">
      <div
        className={cn(
          "inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold",
          statusUi.badge,
        )}
      >
        {statusUi.text}
      </div>

      <h3 className="mt-3 line-clamp-2 text-[18px] font-black leading-[1.05] tracking-[-0.03em] text-stone-900">
        {service}
      </h3>

      {!!b.masterName && (
        <p className="mt-1 text-[13px] text-stone-500">
          працівник: <span className="font-medium text-stone-600">{b.masterName}</span>
        </p>
      )}

      <div className="mt-3 flex items-center gap-2 min-w-0">
        {studioLogo ? (
          <img
            src={studioLogo}
            alt={title}
            className="h-7 w-7 shrink-0 rounded-full border border-stone-200 object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-100">
            <Sparkles className="h-3.5 w-3.5 text-stone-400" />
          </div>
        )}

        <p className="truncate text-[15px] font-medium text-stone-800">
          {title}
        </p>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setActiveBooking(b)}
          className={cn(
            "inline-flex h-12 items-center justify-center rounded-[14px] bg-gradient-to-r px-4 text-[15px] font-black text-white transition-all duration-200 active:scale-[0.98]",
            statusUi.button,
          )}
        >
          {bookingPast ? "Забронювати ще раз" : "Переглянути"}
        </button>
      </div>
    </div>

    <div
      className={cn(
        "flex flex-col items-center justify-center border-l pl-3 text-center",
        statusUi.side,
      )}
    >
      <span className="text-[14px] font-medium capitalize text-stone-600">
        {monthLabel}
      </span>

      <span className="mt-1 text-[28px] font-light leading-none tracking-[-0.05em] text-stone-900">
        {dayLabel}
      </span>

      <span className={cn("mt-2 text-[16px] font-semibold", statusUi.time)}>
        {timeLabel}
      </span>
    </div>
  </div>
</div>
                );
              })}
            </div>
          )}
        </div>
      </div>

{activeBooking && (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/55 backdrop-blur-[8px] sm:items-center sm:p-4"
    onClick={() => setActiveBooking(null)}
  >
    <div
      className="relative w-full max-w-xl overflow-hidden rounded-t-[32px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,250,249,0.98))] shadow-[0_30px_90px_rgba(15,23,42,0.24)] sm:rounded-[32px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r",
          activeStatusUi.topGlow,
        )}
      />

      <div className="px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
        <div className="mb-4 flex justify-center sm:hidden">
          <div className="h-1.5 w-14 rounded-full bg-stone-300" />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm",
                activeStatusUi.soft,
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-[11px] font-black uppercase tracking-[0.18em]">
                Деталі запису
              </span>
            </div>

            <h2 className="mt-3 text-[24px] font-black leading-[1.05] tracking-[-0.04em] text-stone-900 sm:text-[28px]">
              {activeService}
            </h2>

            <p className="mt-1 text-sm font-medium text-stone-500">
              {activeTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveBooking(null)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white/90 text-stone-500 shadow-sm transition-all duration-200 hover:bg-stone-100 hover:text-stone-800 active:scale-[0.96]"
            aria-label="Закрити"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_110px] gap-3">
          <div
            className={cn(
              "rounded-[26px] border p-4 shadow-sm",
              activeStatusUi.dateBox,
            )}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">
              Статус запису
            </p>

            <p
              className={cn(
                "mt-2 text-[15px] font-black",
                activeStatusUi.accentText,
              )}
            >
              {activeStatusUi.text}
            </p>

            <p className="mt-3 text-sm leading-6 text-stone-600">
              {activePast
                ? "Цей запис уже завершився. Ви можете переглянути деталі або записатися повторно."
                : activeStatus === "canceled"
                  ? "Запис був скасований. За потреби можна створити нове бронювання."
                  : "Перевірте інформацію про послугу, студію та час вашого візиту."}
            </p>
          </div>

          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-[26px] border px-3 py-4 text-center shadow-sm",
              activeStatusUi.dateBox,
            )}
          >
            <span className="text-[12px] font-bold capitalize text-stone-500">
              {activeBooking?.date
                ? new Date(
                    `${activeBooking.date}T${activeBooking.time || "00:00"}`,
                  ).toLocaleDateString("uk-UA", {
                    month: "long",
                  })
                : ""}
            </span>

            <span className="mt-1 text-[40px] font-light leading-none tracking-[-0.06em] text-stone-900">
              {activeBooking?.date
                ? new Date(
                    `${activeBooking.date}T${activeBooking.time || "00:00"}`,
                  ).toLocaleDateString("uk-UA", {
                    day: "numeric",
                  })
                : ""}
            </span>

            <span
              className={cn(
                "mt-2 inline-flex rounded-full border px-2.5 py-1 text-[12px] font-bold",
                activeStatusUi.soft,
              )}
            >
              {activeBooking?.time || ""}
            </span>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-[28px] border border-stone-200/80 bg-white shadow-sm">
          <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              {activeLogo ? (
                <img
                  src={toPublicUrl(activeLogo)}
                  alt={activeTitle}
                  className="h-14 w-14 shrink-0 rounded-[18px] border border-stone-200 bg-white object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-stone-200 bg-stone-100 shadow-sm">
                  <Sparkles className="h-5 w-5 text-stone-400" />
                </div>
              )}

              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-stone-400">
                  Студія
                </p>
                <p className="mt-1 text-base font-black leading-5 text-stone-900">
                  {activeTitle}
                </p>

                {activeBooking?.masterName ? (
                  <p className="mt-1 text-sm text-stone-500">
                    Майстер:{" "}
                    <span className="font-semibold text-stone-700">
                      {activeBooking.masterName}
                    </span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-amber-600 shadow-sm">
                <Scissors className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-stone-400">
                  Послуга
                </p>
                <p className="mt-1 text-sm font-bold leading-5 text-stone-800">
                  {activeService}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-600 shadow-sm">
                <Clock3 className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-stone-400">
                  Дата і час
                </p>
                <p className="mt-1 text-sm font-bold leading-5 text-stone-800">
                  {activeWhen}
                </p>
              </div>
            </div>
          </div>

          {activePhone && (
            <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-600 shadow-sm">
                  <Phone className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-stone-400">
                    Телефон студії
                  </p>
                  <p className="mt-1 text-sm font-bold leading-5 text-stone-800">
                    {activePhone}
                  </p>
                </div>

                <a
                  href={`tel:${activePhone}`}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-700 transition-all duration-200 hover:bg-amber-100 active:scale-[0.96]"
                >
                  Дзвінок
                </a>
              </div>
            </div>
          )}

          {activeAddr && (
            <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-600 shadow-sm">
                  <MapPin className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-stone-400">
                    Адреса
                  </p>
                  <p className="mt-1 text-sm font-bold leading-5 text-stone-800">
                    {activeAddr}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => copyText(activeAddr, activeBooking.id)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-500 transition-all duration-200 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 active:scale-[0.96]"
                  aria-label="Скопіювати адресу"
                >
                  {copiedId === activeBooking.id ? (
                    <CheckCheck className="h-4.5 w-4.5" />
                  ) : (
                    <Copy className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {activeStatus !== "canceled" && !activePast ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await cancelBooking(activeBooking);
                  setActiveBooking(null);
                } catch (e) {
                  alert(e.message || "Не вдалося скасувати запис");
                }
              }}
              className="inline-flex h-13 items-center justify-center rounded-[20px] border border-rose-200 bg-gradient-to-b from-rose-50 to-rose-100 px-5 text-sm font-black text-rose-700 transition-all duration-200 hover:shadow-[0_10px_24px_rgba(244,63,94,0.14)] active:scale-[0.98]"
            >
              Скасувати запис
            </button>

            <button
              type="button"
              onClick={() => setActiveBooking(null)}
              className="inline-flex h-13 items-center justify-center rounded-[20px] border border-stone-200 bg-white px-5 text-sm font-black text-stone-700 transition-all duration-200 hover:bg-stone-50 active:scale-[0.98]"
            >
              Закрити
            </button>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveBooking(null)}
              className="inline-flex h-13 items-center justify-center rounded-[20px] border border-stone-200 bg-white px-5 text-sm font-black text-stone-700 transition-all duration-200 hover:bg-stone-50 active:scale-[0.98]"
            >
              Закрити
            </button>

            {activePast && activeStatus !== "canceled" ? (
              <button
                type="button"
                onClick={() => setActiveBooking(null)}
                className="inline-flex h-13 items-center justify-center rounded-[20px] bg-gradient-to-r from-sky-500 to-cyan-500 px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(14,165,233,0.22)] transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
              >
                Забронювати ще раз
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  </div>
)}
    </div>
  );

}