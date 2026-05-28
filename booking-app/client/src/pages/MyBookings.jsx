// MyBookings.jsx
import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import bookingsHero from "../assets/bookingsHero.png";
import { api } from "../api/http";
import {
  Sparkles,
  Search,
  CalendarDays,
  Clock3,
  MapPin,
  Copy,
  CheckCheck,
  Banknote,
  X,
    AlertTriangle,
  XCircle,
  Check,
  Clock,
  RefreshCw,
  ChevronLeft,
UserRound,
Scissors,
  Eye,
  Timer,
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

async function fetchClientBookings() {
  const token = localStorage.getItem("token");
  if (!token) return [];

  const data = await api("/client/bookings", { token });
  return Array.isArray(data?.bookings) ? data.bookings : [];
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
    default: "border-[var(--color-ink)] bg-[var(--color-ink)] text-white",
    success: "border-[var(--color-forest)] bg-[var(--color-forest)] text-white",
    info: "border-[var(--color-caramel)] bg-[var(--color-caramel)] text-white",
    danger: "border-[var(--color-danger)] bg-[var(--color-danger)] text-white",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex w-full items-center justify-center rounded-[18px] border px-3 py-2.5 text-sm font-bold transition-all duration-200 active:scale-95 sm:w-auto",
        active
          ? activeStyles[type]
          : "border-[var(--color-cream)] bg-white text-[var(--color-ink)] hover:border-[var(--color-mist)] hover:bg-[var(--color-cream)]",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[32px] bg-white px-6 py-12 text-center shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <CalendarDays className="mx-auto h-12 w-12 text-[#ff6200]" />

      <h2 className="mt-4 text-xl font-black text-[#202020]">
        Поки що немає записів
      </h2>

      <p className="mt-2 text-sm text-stone-500">
        Коли ви запишетесь у студію, тут зʼявляться всі ваші бронювання.
      </p>
    </div>
  );
}

function getStatusUi(status, canceledBy = null) {
  const base =
    "bg-white border border-[var(--border-soft)] shadow-[var(--shadow-card)]";

  if (status === "completed" || status === "past") {
    return {
      text: "Завершено",
      icon: CheckCheck,
      badge: `${base} text-[var(--color-archived-dark)]`,
      side: "border-[var(--color-archived-light)]",
      time: "text-[var(--color-archived)]",
    };
  }

  if (status === "confirmed") {
    return {
      text: "Підтверджено",
      icon: Check,
      badge: `${base} text-[var(--color-confirmed-dark)]`,
      side: "border-[var(--color-confirmed-light)]",
      time: "text-[var(--color-confirmed)]",
    };
  }

  if (status === "canceled") {
    return {
      text: canceledBy === "owner" ? "Скасовано студією" : "Скасовано вами",
      icon: XCircle,
      badge: `${base} text-[var(--color-canceled-dark)]`,
      side: "border-[var(--color-canceled-light)]",
      time: "text-[var(--color-canceled)]",
    };
  }

  return {
    text: "Очікуємо підтвердження",
    icon: Clock,
    badge: `${base} text-[var(--color-pending-dark)]`,
    side: "border-[var(--color-pending-light)]",
    time: "text-[var(--color-pending)]",
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
      "bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-soft)] shadow-[var(--shadow-button)]",
    secondary:
      "bg-white border border-[var(--color-cream)] text-[var(--color-ink)] hover:bg-[var(--color-cream)] hover:border-[var(--color-mist)]",
    danger:
      "border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)] hover:bg-[rgba(213,92,82,0.12)]",
    ghost: "text-[var(--color-caramel)] hover:bg-[var(--color-cream)]",
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
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
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
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(5,5,5,0.40)] p-4 backdrop-blur-sm sm:p-6"
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
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--color-pending-bg)] to-transparent" />

        <div className="relative border-b border-[var(--color-cream)] px-3 py-2.5 sm:px-5 sm:py-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-bold uppercase tracking-[0.12em] text-[var(--color-forest)]">
              {title}
            </p>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-caramel)] transition hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)] active:scale-95"
              aria-label="Закрити"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {subtitle && (
            <p className="text-[11px] text-[var(--color-caramel)]">{subtitle}</p>
          )}
        </div>

        <div className="overflow-hidden px-3 py-3 sm:px-5 sm:py-5">
          {children}
        </div>

        {footer && (
          <div className="border-t border-[var(--color-cream)] bg-[var(--color-cream)]/50 px-3 py-2.5 sm:px-5 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonPulse({ className = "" }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[linear-gradient(90deg,var(--color-cream),var(--color-sand),var(--color-cream))] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}

function BookingCardSkeleton() {
  return (
    <div className="rounded-[28px] border border-[var(--color-cream)] bg-white p-3.5 shadow-[0_10px_30px_rgba(27,27,27,0.06)] sm:p-4">
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="min-w-0">
          <SkeletonPulse className="h-7 w-32 rounded-full" />
          <SkeletonPulse className="mt-3 h-6 w-[72%] rounded-xl" />
          <SkeletonPulse className="mt-2 h-4 w-28 rounded-xl" />

          <div className="mt-3 flex items-center gap-2">
            <SkeletonPulse className="h-8 w-8 rounded-full" />
            <SkeletonPulse className="h-4 w-32 rounded-xl" />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <SkeletonPulse className="h-11 w-36 rounded-2xl" />
            <SkeletonPulse className="h-11 w-32 rounded-2xl" />
            <SkeletonPulse className="h-11 w-28 rounded-2xl" />
          </div>
        </div>

        <div className="flex min-w-[72px] flex-col items-center justify-center border-l border-[var(--color-cream)] pl-3 text-center">
          <SkeletonPulse className="h-4 w-14 rounded-xl" />
          <SkeletonPulse className="mt-2 h-8 w-10 rounded-xl" />
          <SkeletonPulse className="mt-2 h-5 w-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function MyBookingsSkeleton() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(180,140,108,0.10),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(50,78,41,0.06),transparent_24%)] pb-[calc(env(safe-area-inset-bottom)+68px)] sm:pb-0">
      <div className="mx-auto max-w-6xl px-2.5 pb-4 pt-0 sm:px-4 sm:pb-8 sm:pt-14 lg:pt-16">
        <div className="space-y-3 px-0 pt-2 sm:space-y-3 sm:pt-8 lg:pt-6">
          <section className="overflow-hidden rounded-[24px] border border-[var(--color-cream)] bg-white shadow-[var(--shadow-soft)] sm:rounded-3xl">
            <div className="h-[2px] bg-gradient-to-r from-[var(--color-forest)] via-[var(--color-caramel)] to-[var(--color-ink)] opacity-40" />

            <div className="px-4 pb-7 pt-7 sm:px-6 sm:pb-4 sm:pt-5 lg:px-8 lg:pt-6">
              <div className="mb-5 space-y-3 sm:space-y-2 lg:mb-5">
                <SkeletonPulse className="hidden h-8 w-36 rounded-full sm:block" />
                <SkeletonPulse className="h-10 w-[320px] max-w-full rounded-2xl sm:h-14 sm:w-[430px]" />
                <SkeletonPulse className="h-4 w-[420px] max-w-full rounded-xl" />
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <SkeletonPulse className="h-11 w-full rounded-[18px] sm:w-32" />
                  <SkeletonPulse className="h-11 w-full rounded-[18px] sm:w-28" />
                  <SkeletonPulse className="h-11 w-full rounded-[18px] sm:w-32" />
                  <SkeletonPulse className="h-11 w-full rounded-[18px] sm:w-24" />
                </div>

                <div className="w-full lg:w-[360px]">
                  <SkeletonPulse className="h-[50px] w-full rounded-2xl" />
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyBookings() {
  const queryClient = useQueryClient();
  const { cancelBooking } = useClientBookings();
  const navigate = useNavigate();

  const bookingsQuery = useQuery({
    queryKey: ["client-bookings"],
    queryFn: fetchClientBookings,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const bookings = useMemo(() => {
    return Array.isArray(bookingsQuery.data) ? bookingsQuery.data : [];
  }, [bookingsQuery.data]);

  const [removingIds] = useState([]);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [tab, setTab] = useState("upcoming");
  const [q, setQ] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const isInitialLoading = bookingsQuery.isLoading && !bookingsQuery.data;
  const copyTimerRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      setNowTs(Date.now());
    }, 60_000);

    return () => clearInterval(id);
  }, []);

useEffect(() => {
  const savedScroll = sessionStorage.getItem("myBookingsScrollY");
  const savedActiveBookingId = sessionStorage.getItem("myBookingsActiveBookingId");

  requestAnimationFrame(() => {
    if (savedScroll) {
      window.scrollTo({
        top: Number(savedScroll),
        behavior: "instant",
      });

      sessionStorage.removeItem("myBookingsScrollY");
    }

    if (savedActiveBookingId) {
      setActiveBookingId(savedActiveBookingId);
      sessionStorage.removeItem("myBookingsActiveBookingId");
    }
  });
}, []);

  function resolveBookingStatus(booking, currentNowTs) {
    const rawStatus = booking?.status || "new";

    if (rawStatus === "canceled") return "canceled";

    const past = isPast(booking?.date, booking?.time, currentNowTs);
    if (past) return "completed";

    if (rawStatus === "confirmed") return "confirmed";

    return "new";
  }

  function canRescheduleBooking(booking) {
    const status = resolveBookingStatus(booking, nowTs);
    return status !== "canceled" && status !== "completed";
  }

  const activeBooking = useMemo(() => {
    if (!activeBookingId) return null;
    return bookings.find((b) => b.id === activeBookingId) || null;
  }, [bookings, activeBookingId]);

  const activeMasterName =
    activeBooking?.masterName ||
    activeBooking?.master?.name ||
    activeBooking?.staffName ||
    activeBooking?.staff?.name ||
    activeBooking?.employeeName ||
    activeBooking?.employee?.name ||
    "";

  const activeMasterPhoto = toPublicUrl(
    activeBooking?.masterPhoto ||
      activeBooking?.masterAvatar ||
      activeBooking?.masterImage ||
      activeBooking?.master?.photo ||
      activeBooking?.master?.photoUrl ||
      activeBooking?.master?.avatar ||
      activeBooking?.master?.avatarUrl ||
      activeBooking?.employee?.photo ||
      activeBooking?.employee?.photoUrl ||
      activeBooking?.employee?.avatar ||
      activeBooking?.employee?.avatarUrl ||
      activeBooking?.staff?.photo ||
      activeBooking?.staff?.photoUrl ||
      "",
  );

  const isAnyMasterSelected =
    !activeMasterName ||
    [
      "any",
      "anyone",
      "Будь-хто",
      "Будь хто",
      "Довільний майстер",
      "Не має значення",
    ].includes(String(activeMasterName).trim());

useEffect(() => {
  if (!activeBooking) return;

  const scrollY = window.scrollY;

  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.overflow = "";

    window.scrollTo(0, scrollY);
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

  if (isInitialLoading) {
    return <MyBookingsSkeleton />;
  }

  if (bookingsQuery.isLoading && !bookingsQuery.data) {
    return null;
  }

  const activeStatus = activeBooking
    ? resolveBookingStatus(activeBooking, nowTs)
    : "new";

  const activeTitle = activeBooking?.studioName || "Студія";
  const activeService = activeBooking?.serviceName || "Послуга";
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
  const activePrice =
    activeBooking?.price ??
    activeBooking?.servicePrice ??
    activeBooking?.totalPrice ??
    null;
  const activeDuration =
    activeBooking?.duration ??
    activeBooking?.serviceDuration ??
    activeBooking?.durationMinutes ??
    null;

function openStudio(booking) {
  const studioPath =
    booking?.studioSlug || booking?.studio?.slug || booking?.studioId;

  if (!studioPath) {
    alert("Не вдалося відкрити сторінку студії");
    return;
  }

  sessionStorage.setItem("myBookingsScrollY", String(window.scrollY));

  if (activeBookingId) {
    sessionStorage.setItem("myBookingsActiveBookingId", String(activeBookingId));
  } else {
    sessionStorage.removeItem("myBookingsActiveBookingId");
  }

  setActiveBookingId(null);
  setCopiedId(null);

  navigate(`/${studioPath}`, {
    state: {
      fromMyBookings: true,
    },
  });
}

function handleBookAgainClick(booking) {
  const studioPath =
    booking?.studioSlug || booking?.studio?.slug || booking?.studioId;

  if (!studioPath) {
    alert("Не вдалося відкрити студію для повторного запису");
    return;
  }

  setActiveBookingId(null);
  setCopiedId(null);

  navigate(`/${studioPath}`, {
    state: {
      openBooking: true,
      preselectedService: booking?.serviceId
        ? { serviceId: booking.serviceId }
        : null,
      preselectedMasterId: booking?.masterId || null,
    },
  });
}

  function handleRescheduleClick(booking) {
    const studioPath =
      booking?.studioSlug || booking?.studio?.slug || booking?.studioId;

    if (!studioPath) {
      alert("Не вдалося відкрити студію для перенесення запису");
      return;
    }

    setActiveBookingId(null);
    setCopiedId(null);

    navigate(`/${studioPath}`, {
      state: {
        openBooking: true,
        reschedule: true,
        bookingId: booking.id,
        preselectedService: booking?.serviceId
          ? { serviceId: booking.serviceId }
          : null,
        preselectedMasterId: booking?.masterId || null,
        preselectedDate: booking?.date || null,
        preselectedTime: booking?.time || null,
      },
    });
  }

  return (
   <div className="min-h-screen bg-[#fdfcfb] pb-[calc(env(safe-area-inset-bottom)+68px)] sm:pb-0">
      <div className="mx-auto max-w-6xl px-2.5 pb-4 pt-18 sm:px-4 sm:pb-8 sm:pt-14 lg:pt-16">
        <div className="space-y-3 px-0 pt-2 sm:space-y-3 sm:pt-8 lg:pt-6">
<section className="relative mb-5 overflow-hidden rounded-[30px] border border-[#eadfce] bg-[#f3eee7] px-5 py-7 shadow-[0_14px_36px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:px-8 sm:py-9 lg:px-10">
  <div className="pointer-events-none absolute right-0 top-0 z-0 h-[150px] w-[240px] sm:h-[180px] sm:w-[320px] lg:h-[220px] lg:w-[380px]">
    <img
      src={bookingsHero}
      alt=""
      aria-hidden="true"
      className="h-full w-full object-contain object-right"
    />
  </div>

  <div className="relative z-10 max-w-[760px]">
    <h1 className="text-[38px] font-black leading-[0.9] tracking-[-0.06em] text-[#202020] sm:text-[54px] lg:text-[64px]">
      <span className="block">Мої</span>
      <span className="block text-[#ff6200]">записи</span>
    </h1>

    <p className="mt-1 max-w-[240px] text-[12px] font-semibold leading-5 text-[#7a7d87] sm:max-w-[360px] sm:text-[15px]">
      Усі ваші візити в одному місці
    </p>
  </div>
</section>

<section className="mb-5 grid gap-3 lg:grid-cols-[auto_1fr] lg:items-center lg:justify-between max-[639px]:mb-3 max-[639px]:gap-2">
<div className="flex justify-center gap-2 overflow-x-auto rounded-[22px] border border-[#eadfce] bg-white p-2 shadow-[0_14px_34px_rgba(15,23,42,0.05)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[639px]:justify-center max-[639px]:gap-[3px] max-[639px]:rounded-[14px] max-[639px]:px-2 max-[639px]:py-[3px]">
    {[
      {
        key: "all",
        label: "Усі записи",
        icon: CalendarDays,
        count: counters.all,
      },
      {
        key: "upcoming",
        label: "Майбутні",
        icon: Clock3,
        count: counters.upcoming,
      },
      {
        key: "past",
        label: "Минулі",
        icon: CheckCheck,
        count: counters.past,
      },
      {
        key: "canceled",
        label: "Скасовані",
        icon: XCircle,
        count: counters.canceled,
      },
    ].map((item) => {
      const Icon = item.icon;
      const active = tab === item.key;

      return (
        <button
          key={item.key}
          type="button"
          onClick={() => setTab(item.key)}
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-2 rounded-[16px] px-4 text-[13px] font-black transition active:scale-[0.97] max-[639px]:h-10 max-[639px]:gap-1 max-[639px]:rounded-[11px] max-[639px]:px-2.5 max-[639px]:text-[10px]",
            active
              ? "text-[#ff6200]"
              : "bg-white text-[#77716b] hover:bg-[#fbfaf8] hover:text-[#ff6200]",
          )}
        >
          <Icon className="h-4 w-4 max-[639px]:h-[14px] max-[639px]:w-[14px]" />

          {item.label}

        </button>
      );
    })}
  </div>

  <div className="flex h-14 items-center gap-3 rounded-[22px] border border-[#eadfce] bg-white px-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] max-[639px]:h-10 max-[639px]:gap-1.5 max-[639px]:rounded-[14px] max-[639px]:px-2.5">
    <Search className="h-4 w-4 shrink-0 text-[#8b8794] max-[639px]:h-3 max-[639px]:w-3" />

    <input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder="Пошук..."
      className="h-full min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-[#202020] outline-none placeholder:text-[#b8afa5] max-[639px]:text-[11px]"
    />

    <button
      type="button"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-[15px] bg-[#f7f5f1] text-[#77716b] transition hover:bg-[#fff3e9] hover:text-[#ff6200] max-[639px]:h-7 max-[639px]:w-7 max-[639px]:rounded-[9px]"
    >
      <Search className="h-4 w-4 max-[639px]:h-3 max-[639px]:w-3" />
    </button>
  </div>
</section>

          {visibleBookings.length === 0 ? (
            <EmptyState />
          ) : (
<div className="grid grid-cols-1 gap-3">
  {visibleBookings.map((b, idx) => {
    
                const status = resolveBookingStatus(b, nowTs);
                const bookingPast = status === "completed";
                const statusUi = getStatusUi(status, b.canceledBy);
                const title = b.studioName || "Студія";
                const service = b.serviceName || "Послуга";
const statusBadge = {
  canceled: {
    label: "Скасовано",
    className: "bg-[#ef4444] text-white",
  },
  confirmed: {
    label: "Підтверджено",
    className: "bg-[#22c55e] text-white",
  },
  completed: {
    label: "Завершено",
    className: "bg-[#6b7280] text-white",
  },
  new: {
    label: "Очікує підтвердження",
    className: "bg-[#f59e0b] text-white",
  },
}[status] || {
  label: "Очікує підтвердження",
  className: "bg-[#f59e0b] text-white",
};
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
const masterName =
  b?.masterName ||
  b?.master?.name ||
  b?.staffName ||
  b?.staff?.name ||
  b?.employeeName ||
  b?.employee?.name ||
  "Майстер";

const masterPhoto = toPublicUrl(
  b?.masterPhoto ||
    b?.masterAvatar ||
    b?.masterImage ||
    b?.master?.photo ||
    b?.master?.photoUrl ||
    b?.master?.avatar ||
    b?.master?.avatarUrl ||
    b?.employee?.photo ||
    b?.employee?.photoUrl ||
    b?.employee?.avatar ||
    b?.employee?.avatarUrl ||
    b?.staff?.photo ||
    b?.staff?.photoUrl ||
    "",
);

return (
  <div
    key={rowId}
    role="button"
    tabIndex={0}
    onClick={() => setActiveBookingId(b.id)}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setActiveBookingId(b.id);
      }
    }}
    className={cn(
      "group overflow-hidden rounded-[24px] border border-[#eadfce] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.055)] transition-all duration-200 hover:border-[#f1dfbf] hover:shadow-[0_18px_46px_rgba(15,23,42,0.09)] active:scale-[0.99]",
      bookingPast && "opacity-85",
    )}
  >
    <div className="grid min-h-[138px] grid-cols-[150px_minmax(0,1fr)_190px_150px] items-center gap-5 px-5 py-4 max-[767px]:min-h-0 max-[767px]:grid-cols-[74px_1fr_82px] max-[767px]:gap-3 max-[767px]:px-3 max-[767px]:py-3">
      
      {/* Фото + статус */}
      <div className="flex flex-col items-center gap-2">
        <div className="h-[110px] w-full overflow-hidden rounded-[20px] bg-[#f4f0ea] max-[767px]:h-[74px] max-[767px]:w-[74px] max-[767px]:rounded-[16px]">
          {studioLogo ? (
            <img
              src={studioLogo}
              alt={title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-[10px] font-bold text-[#aaa19a]">
              Фото
            </div>
          )}
        </div>

      </div>

      {/* Текст */}
      <div className="min-w-0">
        <h2 className="truncate text-[22px] font-black leading-tight tracking-[-0.04em] text-[#202020] max-[767px]:text-[13px]">
          {title}
        </h2>

        {(b.address || b.studioAddress || b.location) && (
          <div className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-[#77716b] max-[767px]:mt-1 max-[767px]:text-[10px]">
            <MapPin className="h-4 w-4 shrink-0 text-[#77716b] max-[767px]:h-3 max-[767px]:w-3" />
            <span className="truncate">
              {b.address || b.studioAddress || b.location}
            </span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-1.5 text-[14px] font-black text-[#202020] max-[767px]:mt-1 max-[767px]:text-[10px]">
          <Scissors className="h-4 w-4 shrink-0 text-[#77716b] max-[767px]:h-3 max-[767px]:w-3" />
          <span className="line-clamp-1">{service}</span>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-[#77716b] max-[767px]:mt-1.5 max-[767px]:gap-1.5 max-[767px]:text-[10px]">
          {masterPhoto ? (
            <img
              src={masterPhoto}
              alt={masterName}
              className="h-7 w-7 rounded-full object-cover max-[767px]:h-5 max-[767px]:w-5"
            />
          ) : (
            <div className="grid h-7 w-7 place-items-center rounded-full bg-[#fff1e8] text-[11px] font-black text-[#ff6200] max-[767px]:h-5 max-[767px]:w-5 max-[767px]:text-[8px]">
              {masterName?.[0] || "М"}
            </div>
          )}

          <span className="truncate">Майстер: {masterName}</span>
        </div>
      </div>

      {/* Мобільний блок: дата → деталі → час */}
<div className="hidden h-full flex-col items-center justify-center gap-1 max-[767px]:flex">
<div
  className={cn(
    "mb-1 flex min-h-[24px] w-full items-center justify-center rounded-full px-2 py-[3px] text-center font-black leading-[1.1] text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]",
    status === "new"
      ? "text-[7px]"
      : "text-[8px]",
    statusBadge.className,
  )}
>
  {statusBadge.label}
</div>
        <div className="text-center">
          <p className="text-[9px] font-bold capitalize text-[#aaa19a]">
            {monthLabel}
          </p>

          <p className="text-[24px] font-light leading-none tracking-[-0.06em] text-[#202020]">
            {dayLabel}
          </p>
        </div>


        <p className="text-[10px] font-black text-[#aaa19a]">
          {timeLabel}
        </p>
      </div>

{/* <div className="col-span-full hidden pt-1 max-[767px]:flex max-[767px]:justify-center">
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setActiveBookingId(b.id);
    }}
    className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-[14px] border border-[#eadfce] bg-white px-3 text-[10px] font-black text-[#77716b] transition hover:border-[#ff6200] hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.98]"
  >
    <Eye className="h-3.5 w-3.5" />
    Деталі
  </button>
</div> */}

      {/* Desktop: статус + деталі */}
      <div className="flex flex-col items-center justify-center gap-3 max-[767px]:hidden">
        <div
          className={cn(
            "inline-flex h-11 w-[190px] items-center justify-center rounded-[14px] text-[14px] font-black text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]",
            statusBadge.className,
          )}
        >
          {statusBadge.label}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveBookingId(b.id);
          }}
          className="inline-flex h-11 w-[190px] items-center justify-center gap-2 rounded-[14px] border border-[#eadfce] bg-white px-5 text-[14px] font-black text-[#77716b] transition hover:border-[#ff6200] hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.98]"
        >
          <Eye className="h-4 w-4" />
          Деталі
        </button>
      </div>

      {/* Desktop: дата */}
      <div className="relative flex h-full min-h-[110px] flex-col items-center justify-center border-l border-[#eee8df] px-4 text-center max-[767px]:hidden">
        <span className="mt-2 text-[13px] font-semibold capitalize text-[#aaa19a]">
          {monthLabel}
        </span>

        <span className="mt-1 text-[42px] font-light leading-none tracking-[-0.07em] text-[#202020]">
          {dayLabel}
        </span>

        <span className="mt-1 text-[16px] font-black text-[#aaa19a]">
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

{activeBooking &&
  (() => {
    const isCanceled = activeStatus === "canceled";
    const isConfirmed = activeStatus === "confirmed";
    const isCompleted = activeStatus === "completed";
const showBookAgain = isCanceled || isCompleted;
const statusMeta = {
  canceled: {
    label:
      activeBooking?.canceledBy === "owner"
        ? "Скасовано студією"
        : "Скасовано вами",
    Icon: XCircle,
    className: "bg-[#ef4444] text-white",
    iconColor: "text-[#ef4444]",
  },
  confirmed: {
    label: "Підтверджено",
    Icon: Check,
    className: "bg-[#22c55e] text-white",
    iconColor: "text-[#22c55e]",
  },
  completed: {
    label: "Завершено",
    Icon: CheckCheck,
    className: "bg-[#6b7280] text-white",
    iconColor: "text-[#6b7280]",
  },
  new: {
    label: "Очікує підтвердження",
    Icon: Clock3,
    className: "bg-[#f59e0b] text-white",
    iconColor: "text-[#f59e0b]",
  },
}[activeStatus] || {
  label: "Очікує",
  Icon: Clock3,
  className: "bg-[#f59e0b] text-white",
  iconColor: "text-[#f59e0b]",
};

    const masterLabel = isAnyMasterSelected
      ? "Будь-який майстер"
      : activeMasterName || "Не вказано";

    return (
      <div
        className="fixed inset-0 z-[220] flex items-end justify-center bg-[#202020]/45 p-0 backdrop-blur-[7px] sm:items-center sm:p-5"
        onClick={() => {
          setActiveBookingId(null);
          setCopiedId(null);
        }}
      >
        <div
          className="relative flex h-[100dvh] w-full flex-col overflow-hidden rounded-none bg-[#fdfcfb] shadow-[0_35px_100px_rgba(15,23,42,0.22)] sm:h-auto sm:max-h-[90dvh] sm:max-w-[590px] sm:rounded-[34px] sm:border sm:border-[#eadfce]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative overflow-hidden bg-[#f3eee7] px-5 pb-5 pt-[max(18px,env(safe-area-inset-top))] sm:px-8 sm:pt-8">
            <div className="absolute right-[-70px] top-[-90px] h-[220px] w-[220px] rounded-full bg-[#ff6200]/10 blur-3xl" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Запис
                </span>

                <h2 className="mt-3 text-[28px] font-black leading-none tracking-[-0.05em] text-[#202020] max-[639px]:text-[24px]">
                  Деталі запису
                </h2>

                <p className="mt-2 text-[14px] font-semibold text-[#77716b] max-[639px]:text-[12px]">
                  Повна інформація про ваш візит
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveBookingId(null);
                  setCopiedId(null);
                }}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#77716b] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96] max-[639px]:h-10 max-[639px]:w-10"
                aria-label="Закрити"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-5 sm:px-8">
            <div className="flex items-center gap-5 max-[639px]:gap-3">
              <div
  role="button"
  tabIndex={0}
  onClick={() => openStudio(activeBooking)}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openStudio(activeBooking);
    }
  }}
  className="h-[154px] w-[210px] shrink-0 cursor-pointer overflow-hidden rounded-[24px] bg-[#f4f0ea] shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition duration-200 hover:scale-[1.02] active:scale-[0.99] max-[639px]:h-[106px] max-[639px]:w-[128px] max-[639px]:rounded-[18px]"
>
                {activeStudioLogo ? (
                  <img
                    src={activeStudioLogo}
                    alt={activeTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-[#fff3e9] text-[#ff6200]">
                    <Sparkles className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[24px] font-black tracking-[-0.04em] text-[#202020] max-[639px]:text-[18px]">
                  {activeTitle || "Студія"}
                </h3>

                <div className="mt-3 flex items-center gap-2 text-[15px] font-semibold text-[#77716b] max-[639px]:mt-2 max-[639px]:text-[12px]">
                  <MapPin className="h-5 w-5 shrink-0 text-[#ff6200] max-[639px]:h-4 max-[639px]:w-4" />
                  <span className="line-clamp-2">
                    {activeAddr || "Адресу не вказано"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-7 overflow-hidden rounded-[24px] border border-[#eadfce] bg-white shadow-[0_18px_44px_rgba(15,23,42,0.07)] max-[639px]:mt-5 max-[639px]:rounded-[20px]">
              {[
                {
                  icon: statusMeta.Icon,
                  label: "Статус",
                  value: statusMeta.label,
                  badge: true,
                },
                {
                  icon: Scissors,
                  label: "Послуга",
                  value: activeService || "Послуга",
                },
                {
                  icon: Banknote,
                  label: "Ціна",
                  value:
                    activePrice != null
                      ? `${activePrice} грн`
                      : "Не вказано",
                },
                {
                  icon: CalendarDays,
                  label: "Дата",
                  value: formatUA(activeBooking.date) || "—",
                },
                {
                  icon: Clock3,
                  label: "Час",
                  value: activeBooking.time || "—",
                },
                {
                  icon: UserRound,
                  label: "Майстер",
                  value: masterLabel,
                  photo: !isAnyMasterSelected ? activeMasterPhoto : "",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex min-h-[58px] items-center gap-4 border-b border-[#eee8df] px-5 last:border-b-0 max-[639px]:min-h-[52px] max-[639px]:gap-3 max-[639px]:px-4"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[14px] bg-[#f8f5f1] text-[#77716b] max-[639px]:h-8 max-[639px]:w-8">
                      <Icon
                        className={cn(
                          "h-4.5 w-4.5 max-[639px]:h-4 max-[639px]:w-4",
                          item.badge ? statusMeta.iconColor : "",
                        )}
                      />
                    </div>

                    <span className="min-w-0 flex-1 text-[15px] font-bold text-[#77716b] max-[639px]:text-[13px]">
                      {item.label}
                    </span>

                    <div className="flex min-w-0 items-center justify-end gap-2">
                      {item.badge ? (
                        <span
                          className={cn(
                            "inline-flex h-8 items-center justify-center rounded-full px-4 text-[13px] font-black max-[639px]:h-7 max-[639px]:px-3 max-[639px]:text-[11px]",
                            statusMeta.className,
                          )}
                        >
                          {item.value}
                        </span>
                      ) : (
                        <>
                          <span className="text-right text-[15px] font-black leading-tight text-[#202020] max-[639px]:max-w-[165px] max-[639px]:text-[12px] sm:max-w-[260px]">
                            {item.value}
                          </span>

                          {item.photo ? (
                            <img
                              src={item.photo}
                              alt={item.value}
                              className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-[#fff3e9] max-[639px]:h-7 max-[639px]:w-7"
                            />
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

<div className={cn(
  "border-t border-[#eadfce] bg-[#fbfaf8] px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-4 sm:px-8 sm:pb-8",
  showBookAgain ? "grid grid-cols-1" : "grid grid-cols-2 gap-3",
)}>
  {showBookAgain ? (
    <button
      type="button"
      onClick={() => handleBookAgainClick(activeBooking)}
      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-[#ff6200] text-[15px] font-black text-white shadow-[0_16px_34px_rgba(255,98,0,0.24)] transition hover:bg-[#f25c00] active:scale-[0.98] max-[639px]:h-11 max-[639px]:rounded-[16px] max-[639px]:gap-1.5 max-[639px]:text-[12px]"
    >
      <RefreshCw className="h-5 w-5" />
      Записатись ще раз
    </button>
  ) : (
    <>
      <button
        type="button"
        onClick={() => handleRescheduleClick(activeBooking)}
        disabled={!canRescheduleBooking(activeBooking)}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-[#ff6200] text-[15px] font-black text-white shadow-[0_16px_34px_rgba(255,98,0,0.24)] transition hover:bg-[#f25c00] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 max-[639px]:h-11 max-[639px]:rounded-[16px] max-[639px]:gap-1.5 max-[639px]:text-[12px]"
      >
        <CalendarDays className="h-5 w-5" />
        Перенести запис
      </button>

      <button
        type="button"
        onClick={() => setCancelConfirmId(activeBooking.id)}
        disabled={!canRescheduleBooking(activeBooking)}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[20px] border border-[#ef4444]/55 bg-white text-[15px] font-black text-[#ef4444] transition hover:bg-[#fff1f1] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 max-[639px]:h-11 max-[639px]:rounded-[16px] max-[639px]:gap-1.5 max-[639px]:text-[12px]"
      >
        <XCircle className="h-5 w-5" />
        Скасувати запис
      </button>
    </>
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
            const canceledId = cancelConfirmId;

            await cancelBooking(canceledId);

            queryClient.setQueryData(["client-bookings"], (old = []) =>
              old.map((booking) =>
                booking.id === canceledId
                  ? {
                      ...booking,
                      status: "canceled",
                      canceledBy: booking.canceledBy || "client",
                    }
                  : booking,
              ),
            );

            setCancelConfirmId(null);

            if (activeBookingId === canceledId) {
              setActiveBookingId(null);
              setCopiedId(null);
            }
          } catch (e) {
            alert(e.message || "Не вдалося скасувати запис");
          }
        }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-danger)] px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-[var(--color-danger-dark)] active:scale-[0.98] sm:w-auto"
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
        <div className="absolute inset-0 rounded-full bg-[var(--color-danger)]/40 blur-2xl" />

        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-windows-cancel)] text-white shadow-lg">
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
            Студія побачить статус скасованого запису.
          </p>
        </div>
      </div>
    </div>
  </div>
</Modal>
    </div>
  );
}
