// MyBookings.jsx
import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    UserRound,
  Check,
  XCircle,
  Clock,
} from "lucide-react";
import { useClientBookings } from "../context/bookings/useClientBookings";

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

function isPast(dateStr, timeStr, nowTs) {
  if (!dateStr) return false;

  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);

  if (timeStr) {
    const [hh, mm] = String(timeStr).split(":").map(Number);
    dt.setHours(hh || 0, mm || 0, 0, 0);
  } else {
    dt.setHours(23, 59, 59, 999);
  }

  return dt.getTime() < nowTs;
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function FilterTab({ active, children, type = "default", onClick }) {
  const activeStyles = {
    default: "border-stone-900 bg-stone-900 text-white",
    success: "border-emerald-600 bg-emerald-600 text-white",
    info: "border-blue-600 bg-blue-600 text-white",
    danger: "border-red-600 bg-red-600 text-white",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex w-full  items-center justify-center rounded-[18px] border px-3 py-2.5 text-sm font-bold transition-all duration-200 active:scale-95 sm:w-auto",

        active
          ? activeStyles[type]
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
          Коли ви запишетесь у студію, тут зʼявляться всі бронювання — майбутні,
          минулі та скасовані.
        </p>
      </div>
    </div>
  );
}

function getStatusUi(status, canceledBy = null) {
  if (status === "canceled") {
    return {
      text: canceledBy === "owner" ? "Скасовано студією" : "Скасовано вами",
      icon: XCircle,
      badge: "bg-rose-100 text-rose-700",
      button:
        "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
      side: "border-rose-200/80",
      time: "text-rose-700",
    };
  }

  if (status === "confirmed") {
    return {
      text: "Підтверджено",
      icon: Check,
      badge: "bg-emerald-100 text-emerald-700",
      button:
        "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
      side: "border-emerald-200/80",
      time: "text-emerald-700",
    };
  }

  if (status === "completed" || status === "past") {
    return {
      text: "Завершено",
      icon: CheckCheck,
      badge: "bg-sky-100 text-sky-700",
      button:
        "border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
      side: "border-sky-200/80",
      time: "text-sky-700",
    };
  }

  return {
    text: "Очікує",
    icon: Clock,
    badge: "bg-amber-100 text-amber-700",
    button:
      "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    side: "border-amber-200/80",
    time: "text-amber-700",
  };
}

function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:shadow-emerald-500/35 hover:from-emerald-700 hover:to-emerald-800",
    secondary:
      "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300",
    danger:
      "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-600 hover:from-red-100 hover:to-rose-100",
    ghost: "text-stone-600 hover:bg-stone-100",
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
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200",
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

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}) {
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
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cn(
          "relative w-full max-h-[90vh] overflow-hidden bg-white shadow-2xl",
          "animate-in fade-in-0 slide-in-from-bottom duration-200",
          "rounded-3xl sm:h-auto sm:max-h-[92vh]",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-50/80 to-transparent" />

        <div className="relative border-b border-stone-100 px-3 py-2.5 sm:px-5 sm:py-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-bold uppercase tracking-[0.12em] text-amber-600">
              {title}
            </p>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-200 hover:text-stone-700 active:scale-95"
              aria-label="Закрити"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {subtitle && <p className="text-[11px] text-stone-500">{subtitle}</p>}
        </div>

        <div className="overflow-hidden px-3 py-3 sm:px-5 sm:py-5">
          {children}
        </div>

        {footer && (
          <div className="border-t border-stone-100 bg-stone-50/50 px-3 py-2.5 sm:px-5 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}


export default function MyBookings() {
  const { bookings, loading, cancelBooking } = useClientBookings();
  const [removingIds, setRemovingIds] = useState([]);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const navigate = useNavigate();
  useEffect(() => {
    const id = setInterval(() => {
      setNowTs(Date.now());
    }, 60_000);

    return () => clearInterval(id);
  }, []);

  function resolveBookingStatus(booking, nowTs) {
    const rawStatus = booking?.status || "new";

    if (rawStatus === "canceled") return "canceled";

    const past = isPast(booking?.date, booking?.time, nowTs);
    if (past) return "completed";

    if (rawStatus === "confirmed") return "confirmed";

    return "new";
  }
  const [tab, setTab] = useState("upcoming");
  const [q, setQ] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const copyTimerRef = useRef(null);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const activeBooking = useMemo(() => {
    if (!activeBookingId) return null;
    return bookings.find((b) => b.id === activeBookingId) || null;
  }, [bookings, activeBookingId]);

  const activeMasterName =
    activeBooking?.masterName ||
    activeBooking?.staffName ||
    activeBooking?.employeeName ||
    "";

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

  const normalized = useMemo(() => {
    const list = Array.isArray(bookings) ? bookings : [];
    return [...list].reverse();
  }, [bookings]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return normalized.filter((b) => {
      const status = resolveBookingStatus(b, nowTs);
      const past = status === "completed";

      const matchTab =
        tab === "all"
          ? true
          : tab === "canceled"
            ? status === "canceled"
            : tab === "past"
              ? past
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
  }, [normalized, tab, q, nowTs]);

  const visibleBookings = useMemo(() => {
    return filtered.filter((b) => !removingIds.includes(b.id));
  }, [filtered, removingIds]);

  const counters = useMemo(() => {
    const list = normalized;
    let upcoming = 0;
    let past = 0;
    let canceled = 0;

    for (const b of list) {
      const status = resolveBookingStatus(b, nowTs);

      if (status === "canceled") {
        canceled += 1;
        continue;
      }

      if (status === "completed") {
        past += 1;
      } else {
        upcoming += 1;
      }
    }

    return { upcoming, past, canceled, all: list.length };
  }, [normalized, nowTs]);

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
        <div className="mx-auto max-w-6xl px-2.5 pb-4  sm:px-4 sm:pb-8 pt-20 sm:pt-24 lg:pt-24">
          <div className="rounded-[28px] border border-stone-200 bg-white p-8 text-sm text-stone-500 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
            Завантаження записів...
          </div>
        </div>
      </div>
    );
  }

  const activeStatus = activeBooking
    ? resolveBookingStatus(activeBooking, nowTs)
    : "new";

  const activeTitle = activeBooking?.studioName || "Студія";
  const activeService = activeBooking?.serviceName || "Послуга";

  const activePhone = activeBooking?.studioPhone || null;
  const activeAddr =
    activeBooking?.address ||
    activeBooking?.studioAddress ||
    activeBooking?.location ||
    null;
const activeStudioLogo = toPublicUrl(
  activeBooking?.studio?.logoUrl ||
    activeBooking?.logoUrl ||
    activeBooking?.studioLogo ||
    "",
);
  function Badge({ variant = "neutral", children, className = "" }) {
    const styles = {
      neutral: "border-stone-200 bg-stone-100 text-stone-600",
      success: "border-emerald-200 bg-emerald-50 text-emerald-700",
      danger: "border-red-200 bg-red-50 text-red-600",
      warning: "border-amber-200 bg-amber-50 text-amber-700",
      info: "border-blue-200 bg-blue-50 text-blue-700",
    };

    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold",
          styles[variant],
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

function openStudio(booking) {
  const studioPath = booking?.studioSlug || booking?.studio?.slug || booking?.studioId;

  if (!studioPath) {
    alert("Не вдалося відкрити сторінку студії");
    return;
  }

  setActiveBookingId(null);
  setCopiedId(null);
  navigate(`/${studioPath}`);
}

  return (
     <div className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+68px)] sm:pb-0">
      <div className="mx-auto max-w-6xl px-2.5 pb-4 pt-0 sm:px-4 sm:pb-8 sm:pt-14 lg:pt-16">
        <div className="space-y-3 px-0 pt-2 sm:space-y-3 sm:pt-8 lg:pt-6">
          <section className="overflow-hidden rounded-[24px] border border-stone-200/60 bg-white shadow-[0_4px_20px_-6px_rgba(120,90,60,0.08)] sm:rounded-3xl">
            <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

            <div className="px-4 pb-7 pt-7 sm:px-6 sm:pb-4 sm:pt-5 lg:px-8 lg:pt-6">
              <div className="mb-5 space-y-3 sm:mb- sm:space-y-2 lg:mb-5">
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 sm:px-4 sm:py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 sm:h-4 sm:w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 sm:text-xs sm:tracking-[0.22em]">
                    Мої бронювання
                  </span>
                </div>

                <h1 className="max-w-full  !text-[34px] font-black leading-tight tracking-[-0.03em] text-stone-800 sm:max-w-none sm:!text-5xl lg:!text-5xl">
                  Керуйте своїми{" "}
                  <span className="text-amber-600">записами</span>
                </h1>

                <p className="max-w-2xl text-sm leading-6 text-stone-600 sm:text-base sm:leading-7">
                  Переглядай майбутні, минулі та скасовані записи, знаходь
                  потрібну студію та швидко керуй бронюваннями.
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <FilterTab
                    type="success"
                    active={tab === "upcoming"}
                    onClick={() => setTab("upcoming")}
                  >
                    Майбутні ({counters.upcoming})
                  </FilterTab>

                  <FilterTab
                    type="info"
                    active={tab === "past"}
                    onClick={() => setTab("past")}
                  >
                    Минулі ({counters.past})
                  </FilterTab>

                  <FilterTab
                    type="danger"
                    active={tab === "canceled"}
                    onClick={() => setTab("canceled")}
                  >
                    Скасовані ({counters.canceled})
                  </FilterTab>
                  <FilterTab
                    type="default"
                    active={tab === "all"}
                    onClick={() => setTab("all")}
                  >
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
            {q ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Пошук: {q}
              </span>
            ) : null}
          </div>

          {visibleBookings.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
{visibleBookings.map((b, idx) => {
                  const status = resolveBookingStatus(b, nowTs);
                  const bookingPast = status === "completed";
                  const statusUi = getStatusUi(status, b.canceledBy);
                  const title = b.studioName || "Студія";
                  const service = b.serviceName || "Послуга";
                  const rowId =
                    b.id ??
                    `${b.studioSlug ?? "studio"}-${b.date ?? "d"}-${b.time ?? "t"}-${idx}`;

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

                  const studioLogo = toPublicUrl(
                    b.studio?.logoUrl || b.logoUrl || b.studioLogo || "",
                  );

                  return (
<div
  key={rowId}
  className="rounded-[28px] border border-stone-200/70 bg-white p-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-4"
>
                      <div className="grid grid-cols-[1fr_auto] gap-3">
                        <div className="min-w-0">
                          <div
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold",
                              statusUi.badge,
                            )}
                          >
                            <statusUi.icon className="h-3.5 w-3.5" />
                            {statusUi.text}
                          </div>

                          <h3 className="mt-3 line-clamp-2 text-[18px] font-black leading-[1.05] tracking-[-0.03em] text-stone-900">
                            {service}
                          </h3>

                          {!!b.masterName && (
                            <p className="mt-1 text-[13px] text-stone-500">
                              майстер:{" "}
                              <span className="font-medium text-stone-600">
                                {b.masterName}
                              </span>
                            </p>
                          )}

<button
  type="button"
  onClick={() => openStudio(b)}
  className="mt-3 flex min-w-0 items-center gap-2 rounded-2xl text-left transition hover:bg-stone-50 active:scale-[0.99]"
>
  {studioLogo ? (
    <img
      src={studioLogo}
      alt={title}
      className="h-8 w-8 shrink-0 rounded-full border border-stone-200 object-cover"
    />
  ) : (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-100">
      <Sparkles className="h-4 w-4 text-stone-400" />
    </div>
  )}

  <p className="truncate text-[15px] font-medium text-stone-800">
    {title}
  </p>
</button>

                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (bookingPast) {
                                  const studioPath =
                                    b.studioSlug ||
                                    b.studio?.slug ||
                                    b.studioId;

                                  if (!studioPath) {
                                    alert(
                                      "Не вдалося відкрити студію для повторного запису",
                                    );
                                    return;
                                  }

                                  navigate(`/${studioPath}`, {
                                    state: {
                                      openBooking: true,
                                      rebook: true,
                                      preselectedService: {
                                        serviceId: b.serviceId,
                                      },
                                      preselectedMasterId: b.masterId || null,
                                    },
                                  });

                                  return;
                                }

                                setActiveBookingId(b.id);
                              }}
className={cn(
  "inline-flex h-12 flex-1 items-center justify-center rounded-[14px] px-4 text-[15px] font-bold transition-all duration-200 active:scale-[0.98]",
  statusUi.button,
)}
                            >
                              {bookingPast
                                ? "Забронювати ще раз"
                                : "Переглянути"}
                            </button>

                            {status !== "canceled" && !bookingPast && (
                              <button
                                type="button"
                                onClick={() => setCancelConfirmId(b.id)}
                                className="inline-flex h-12 items-center justify-center rounded-[14px] border border-rose-200 bg-rose-50 px-4 text-[14px] font-bold text-rose-700 transition-all duration-200 hover:bg-rose-100 active:scale-[0.96]"
                              >
                                Скасувати
                              </button>
                            )}
                          </div>
                        </div>

                        <div
                          className={cn(
                            "flex min-w-[72px] flex-col items-center justify-center border-l pl-3 text-center",
                            statusUi.side,
                          )}
                        >
                          <span className="text-[14px] font-medium capitalize text-stone-600">
                            {monthLabel}
                          </span>

                          <span className="mt-1 text-[28px] font-light leading-none tracking-[-0.05em] text-stone-900">
                            {dayLabel}
                          </span>

                          <span
                            className={cn(
                              "mt-2 text-[16px] font-semibold",
                              statusUi.time,
                            )}
                          >
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
    className="fixed inset-0 z-[220] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-[8px]"
    onClick={() => {
      setActiveBookingId(null);
      setCopiedId(null);
    }}
  >
    <div
      className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-[0_35px_120px_rgba(15,23,42,0.24)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.10),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-amber-50/80 via-stone-50/50 to-transparent" />
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/20 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-200/15 blur-3xl" />

      <div className="relative px-5 pb-4 pt-2 sm:px-6 sm:pb-5 sm:pt-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setActiveBookingId(null);
              setCopiedId(null);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200/80 bg-white/80 text-stone-400 backdrop-blur transition-all duration-200 hover:bg-stone-100 hover:text-stone-700 active:scale-95"
            aria-label="Закрити"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 sm:mt-4 flex justify-center">
          {(() => {
            const isCanceled = activeStatus === "canceled";
            const isConfirmed = activeStatus === "confirmed";
            const isCompleted = activeStatus === "completed";

            const statusMeta = isCompleted
              ? {
                  label: "Завершено",
                  badge: "info",
                  dot: "bg-blue-600",
                  ring: "from-blue-500 to-sky-600",
                  iconBg: "bg-blue-100 text-blue-700",
                }
              : isConfirmed
                ? {
                    label: "Підтверджено",
                    badge: "success",
                    dot: "bg-emerald-600",
                    ring: "from-emerald-500 to-emerald-700",
                    iconBg: "bg-emerald-100 text-emerald-700",
                  }
                : isCanceled
                  ? {
                      label:
                        activeBooking?.canceledBy === "owner"
                          ? "Скасовано студією"
                          : "Скасовано вами",
                      badge: "danger",
                      dot: "bg-red-600",
                      ring: "from-red-500 to-rose-700",
                      iconBg: "bg-red-100 text-red-700",
                    }
                  : {
                      label: "Очікує підтвердження",
                      badge: "warning",
                      dot: "bg-amber-600",
                      ring: "from-amber-500 to-orange-600",
                      iconBg: "bg-amber-100 text-amber-700",
                    };

            return (
              <>
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-amber-300/20 blur-2xl" />
                  <div
                    className={cn(
                      "relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]",
                      statusMeta.ring,
                    )}
                  >
                    {isCompleted ? (
                      <CheckCheck className="h-8 w-8" />
                    ) : isCanceled ? (
                      <X className="h-8 w-8" />
                    ) : isConfirmed ? (
                      <Check className="h-8 w-8" />
                    ) : (
                      <Clock className="h-8 w-8" />
                    )}
                  </div>
                </div>

                <div className="sr-only">{statusMeta.label}</div>
              </>
            );
          })()}
        </div>

        <div className="mt-3 sm:mt-5 text-center">
          <h2 className="text-[28px] font-black leading-[1.05] tracking-[-0.04em] text-stone-900">
  {activeService}
          </h2>

          <div className="mt-3 flex justify-center">
            {(() => {
              const isCanceled = activeStatus === "canceled";
              const isConfirmed = activeStatus === "confirmed";
              const isCompleted = activeStatus === "completed";

              const statusMeta = isCompleted
                ? {
                    label: "Завершено",
                    badge: "info",
                    dot: "bg-blue-600",
                  }
                : isConfirmed
                  ? {
                      label: "Підтверджено",
                      badge: "success",
                      dot: "bg-emerald-600",
                    }
                  : isCanceled
                    ? {
                        label:
                          activeBooking?.canceledBy === "owner"
                            ? "Скасовано студією"
                            : "Скасовано вами",
                        badge: "danger",
                        dot: "bg-red-600",
                      }
                    : {
                        label: "Очікує підтвердження",
                        badge: "warning",
                        dot: "bg-amber-600",
                      };

              return (
                <Badge variant={statusMeta.badge}>
                  <IconDot className={statusMeta.dot} />
                  {statusMeta.label}
                </Badge>
              );
            })()}
          </div>
        </div>

        <div className="mt-3 sm:mt-4 overflow-hidden rounded-[26px] border border-stone-200/80 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="h-[3px] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

          <div className="space-y-3 p-3.5">

            <div className="rounded-2xl bg-stone-50 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-500 shadow-sm">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                    Дата і час
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-black text-stone-900">
                    <span>{formatUA(activeBooking.date) || "—"}</span>
                    <span className="text-stone-400">•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4 text-stone-500" />
                      {activeBooking.time || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              {activeStudioLogo ? (
                <img
                  src={activeStudioLogo}
                  alt={activeTitle}
                  className="h-11 w-11 shrink-0 rounded-2xl border border-stone-200 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                  <Sparkles className="h-5 w-5" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                  Студія
                </p>
                <button
                  type="button"
                  onClick={() => openStudio(activeBooking)}
                  className="mt-1 text-left text-sm font-black text-stone-900 transition hover:text-emerald-700"
                >
                  {activeTitle}
                </button>
              </div>
            </div>
            
            {activeAddr && (
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                  <MapPin className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                    Адреса
                  </p>
                  <p className="mt-1 text-sm font-black text-stone-900">
                    {activeAddr}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => copyText(activeAddr, activeBooking.id)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 active:scale-[0.98]"
                  aria-label="Скопіювати адресу"
                  title="Скопіювати адресу"
                >
                  {copiedId === activeBooking.id ? (
                    <CheckCheck className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}



            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                <UserRound className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                  Майстер
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm font-black",
                    activeMasterName
                      ? "text-stone-900"
                      : "text-stone-400 italic",
                  )}
                >
                  {activeMasterName || "Довільний майстер"}
                </p>
              </div>
            </div>

            {activePhone && (
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                  <Phone className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                    Телефон
                  </p>
                  <p className="mt-1 text-sm font-black text-stone-900">
                    {activePhone}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {activePhone ? (
            <a
              href={`tel:${activePhone}`}
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-[0_12px_28px_rgba(16,185,129,0.10)] active:scale-[0.98]"
            >
              <Phone className="h-4 w-4" />
              Дзвінок
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                setActiveBookingId(null);
                setCopiedId(null);
              }}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition-all duration-200 hover:bg-stone-50 active:scale-[0.98]"
            >
              Закрити
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveBookingId(null);
              setCopiedId(null);
            }}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 text-sm font-bold text-white shadow-[0_14px_34px_rgba(16,185,129,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-[0_18px_40px_rgba(16,185,129,0.30)] active:scale-[0.98]"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      <Modal
        open={cancelConfirmId != null}
        onClose={() => setCancelConfirmId(null)}
        title="Скасування запису"
        subtitle="Запис буде позначено як скасований."
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setCancelConfirmId(null)}
            >
              Назад
            </Button>

            <Button
              variant="danger"
              onClick={async () => {
                try {
                  await cancelBooking(cancelConfirmId);
                  setCancelConfirmId(null);

                  if (activeBookingId === cancelConfirmId) {
                    setActiveBookingId(null);
                    setCopiedId(null);
                  }
                } catch (e) {
                  alert(e.message || "Не вдалося скасувати запис");
                }
              }}
            >
              Так, скасувати
            </Button>
          </div>
        }
      >
        <div className="text-sm text-stone-500">
          Підтвердити скасування запису?
        </div>
      </Modal>
    </div>
  );
}
