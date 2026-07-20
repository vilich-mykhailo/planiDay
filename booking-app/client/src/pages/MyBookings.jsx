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
  FilePenLine,
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
  Eye,
  Timer,
  CalendarClock,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { useClientBookings } from "../context/bookings/useClientBookings";

function formatUA(dateStr) {
  if (!dateStr) return "";

  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);

  return dt.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
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

function EmptyState({ isSearch = false, query = "", onClearSearch }) {
  const searchText = query.trim();

  return (
    <div className="rounded-[15px] border-2 border-dashed border-[#ffd6bd] bg-[#fff7f0] px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#ff6200]">
        {isSearch ? (
          <Search className="h-7 w-7" />
        ) : (
          <CalendarDays className="h-7 w-7" />
        )}
      </div>

      <h2 className="mt-4 text-xl font-black text-[#202020]">
        {isSearch ? "Нічого не знайдено" : "У вас ще немає записів"}
      </h2>

      <p className="mt-2 text-sm text-[#77716b]">
        {isSearch ? (
          <>
            За запитом{" "}
            <span className="font-black text-[#202020]">
              "{searchText}"
            </span>{" "}
            не знайдено жодного запису.
          </>
        ) : (
          "Оберіть студію та забронюйте перший візит — усі ваші записи з'являться тут."
        )}
      </p>

      {isSearch && (
        <button
          type="button"
          onClick={onClearSearch}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl bg-[#ff6200] px-4 text-sm font-black text-white transition hover:bg-[#f25c00] active:scale-[0.98]"
        >
          Очистити пошук
        </button>
      )}
    </div>
  );
}


function getStatusUi(status, canceledBy = null) {
  if (status === "completed" || status === "past") {
    return {
      text: "Завершено",
      icon: CheckCheck,
      badge:
        "border-[var(--color-archived-light)] text-[var(--color-archived-dark)]",
      side: "border-[var(--color-archived-light)]",
      time: "text-[var(--color-archived-dark)]",
    };
  }

  if (status === "confirmed") {
    return {
      text: "Підтверджено",
      icon: CheckCheck,
      badge:
        "border-[var(--color-confirmed-light)] text-[var(--color-confirmed-dark)]",
      side: "border-[var(--color-confirmed-light)]",
      time: "text-[var(--color-confirmed-dark)]",
    };
  }

  if (status === "canceled") {
    return {
      text: canceledBy === "owner" ? "Скасовано студією" : "Скасовано вами",
      icon: XCircle,
      badge:
        "border-[var(--color-canceled-light)] text-[var(--color-canceled-dark)]",
      side: "border-[var(--color-canceled-light)]",
      time: "text-[var(--color-canceled-dark)]",
    };
  }

  return {
    text: "Очікує підтвердження студії",
    icon: Clock,
    badge: "border-[#fed7aa] text-[#ff6200]",
    side: "border-[var(--color-pending-light)]",
    time: "text-[#ffb020]",
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
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
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
            <p className="text-[11px] text-[var(--color-caramel)]">
              {subtitle}
            </p>
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
    const savedActiveBookingId = sessionStorage.getItem(
      "myBookingsActiveBookingId",
    );

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
  activeBooking?.masterPhotoUrl ||
    activeBooking?.masterPhoto ||
    activeBooking?.masterAvatar ||
    activeBooking?.masterImage ||
    activeBooking?.master?.photoUrl ||
    activeBooking?.master?.photo ||
    activeBooking?.master?.avatarUrl ||
    activeBooking?.master?.avatar ||
    activeBooking?.employee?.photoUrl ||
    activeBooking?.employee?.photo ||
    activeBooking?.employee?.avatarUrl ||
    activeBooking?.employee?.avatar ||
    activeBooking?.staff?.photoUrl ||
    activeBooking?.staff?.photo ||
    activeBooking?.staff?.avatarUrl ||
    activeBooking?.staff?.avatar ||
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
      sessionStorage.setItem(
        "myBookingsActiveBookingId",
        String(activeBookingId),
      );
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
    <div className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+88px)] sm:pb-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 sm:pt-11 lg:px-8">
        <div className="space-y-3 mb-5 mt-2  px-0 pt-2 sm:space-y-3 sm:pt-8 lg:pt-6">
          <section className="relative mb-5 overflow-hidden rounded-[30px] border border-[#eadfce] bg-white px-5 py-7 shadow-[0_14px_36px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:px-8 sm:py-9 lg:px-10">
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

          <section className="mb-5 grid gap-3 lg:grid-cols-[auto_360px] lg:items-center lg:justify-between max-[639px]:mb-3 max-[639px]:gap-2">
            <div className="flex justify-center gap-2 overflow-x-auto rounded-[22px] border border-[#eadfce] bg-white p-2 shadow-[0_14px_34px_rgba(15,23,42,0.05)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[639px]:justify-center max-[639px]:gap-[3px] max-[639px]:rounded-[14px] max-[639px]:px-2 max-[639px]:py-[8px]">
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
  "inline-flex h-11 shrink-0 items-center gap-2 rounded-[16px] px-4 text-[13px] font-black transition-all duration-200 active:scale-[0.97]",
  "max-[639px]:h-7 max-[639px]:gap-[3px] max-[639px]:rounded-[9px] max-[639px]:px-1.5 max-[639px]:text-[10px]",
  active
    ? "bg-[#ff6200] text-white"
    : "bg-white text-[#77716b] hover:text-[#ff6200]",
)}
                  >
                    <Icon className="h-4 w-4 max-[639px]:h-3 max-[639px]:w-3" /> 

                    {item.label}
                  </button>
                );
              })}
            </div>

<div className="relative w-full lg:max-w-[360px]">
  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a847d] max-[639px]:left-2.5 max-[639px]:h-3.5 max-[639px]:w-3.5" />

  <input
    value={q}
    onChange={(e) => setQ(e.target.value)}
    placeholder="Пошук записів..."
    className="
      h-10 w-full
      rounded-xl
      border border-[#ebe7df]
      bg-white
      pl-9 pr-9
      text-[13px]
      font-semibold
      text-[#202020]
      outline-none
      transition-all
      placeholder:text-[#9b948c]

      sm:h-12
      sm:rounded-2xl
      sm:pl-11
      sm:pr-10
      sm:text-[14px]

      hover:border-[#ffd8c2]
      hover:bg-white
      focus:border-[#ff6200]
      focus:ring-4
      focus:ring-[#ff6200]/10
    "
  />

  {q.trim() && (
    <button
      type="button"
      onClick={() => setQ("")}
      className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[#8a847d] transition hover:bg-[#fff1e8] hover:text-[#ff6200] active:scale-95"
      aria-label="Очистити пошук"
    >
      <X className="h-4 w-4" />
    </button>
  )}
</div>
          </section>

{visibleBookings.length === 0 ? (
  <EmptyState
    isSearch={q.trim().length > 0}
    query={q}
    onClearSearch={() => setQ("")}
  />
) : (
            <div className="grid grid-cols-1 gap-3">
              {visibleBookings.map((b, idx) => {
                const status = resolveBookingStatus(b, nowTs);
                const bookingPast = status === "completed";
               const statusUi = getStatusUi(status, b.canceledBy);
const StatusIcon = statusUi.icon;
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
                const masterName =
                  b?.masterName ||
                  b?.master?.name ||
                  b?.staffName ||
                  b?.staff?.name ||
                  b?.employeeName ||
                  b?.employee?.name ||
                  "Майстер";

const masterPhoto = toPublicUrl(
  b?.masterPhotoUrl ||
    b?.masterPhoto ||
    b?.masterAvatar ||
    b?.masterImage ||
    b?.master?.photoUrl ||
    b?.master?.photo ||
    b?.master?.avatarUrl ||
    b?.master?.avatar ||
    b?.employee?.photoUrl ||
    b?.employee?.photo ||
    b?.employee?.avatarUrl ||
    b?.employee?.avatar ||
    b?.staff?.photoUrl ||
    b?.staff?.photo ||
    b?.staff?.avatarUrl ||
    b?.staff?.avatar ||
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
  "group overflow-hidden rounded-[24px] border border-[#eadfce] bg-white transition-all duration-200 cursor-pointer",
  "hover:bg-[#fff7f0] hover:-translate-y-0.5 hover:border-[#ffd6bd]",
  "active:scale-[0.99]",
  bookingPast && "opacity-85",
)}
                  >
            <div className="grid min-h-[138px] grid-cols-[120px_minmax(0,1fr)_110px_110px] items-center gap-5 px-5 py-4 lg:grid-cols-[130px_minmax(0,1fr)_150px_120px] max-[639px]:min-h-0 max-[639px]:grid-cols-[1fr_82px] max-[639px]:gap-3 max-[639px]:px-3 max-[639px]:py-3">                 
<div className="contents max-[639px]:block max-[639px]:min-w-0">
  <div className="mb-2 hidden justify-center max-[639px]:flex">
<div
  className={cn(
    "inline-flex items-center justify-center gap-1.5 rounded-full border bg-white px-3 py-1 text-center text-[10px] font-black shadow-sm",
    statusUi.badge,
  )}
>
  <StatusIcon className="h-3.5 w-3.5 shrink-0 max-[639px]:h-3 max-[639px]:w-3" />
  {statusUi.text}
</div>
  </div>

<div className="contents max-[639px]:flex max-[639px]:items-center max-[639px]:gap-3">
<div className="h-[110px] w-[120px] shrink-0 overflow-hidden rounded-[22px] border border-[#eadfce] bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.06)]
min-[639px]:max-[767px]:h-[110px]
min-[639px]:max-[767px]:w-[110px]
max-[639px]:h-[74px]
max-[639px]:w-[74px]
max-[639px]:rounded-[18px]">
      {studioLogo ? (
<img
  src={studioLogo}
  alt={title}
  className="h-full w-full rounded-[18px] object-cover transition duration-500 group-hover:scale-105"
/>
      ) : (
        <div className="grid h-full w-full place-items-center text-[10px] font-bold text-[#aaa19a]">
          Фото
        </div>
      )}
    </div>

    <div className="min-w-0">
     <h2 className="line-clamp-3 text-[17px] font-black leading-tight tracking-[-0.04em] text-[#202020] max-[639px]:text-[13px] lg:text-[22px]">
        {title}
      </h2>

      {(b.address || b.studioAddress || b.location) && (
        <div className="mt-2 flex items-center gap-1.5 text-[12px] lg:text-[13px] font-semibold text-[#77716b] max-[767px]:mt-1 max-[767px]:text-[10px]">
          <MapPin className="h-4 w-4 shrink-0 text-[#77716b] max-[767px]:h-3 max-[767px]:w-3" />
<span className="line-clamp-3">
  {b.address || b.studioAddress || b.location}
</span>
        </div>
      )}

<div className="mt-2 flex items-center gap-1.5 text-[12px] lg:text-[13px] font-semibold text-[#77716b] max-[767px]:mt-1 max-[767px]:text-[10px]">
  <FilePenLine className="h-4 w-4 shrink-0 text-[#77716b] max-[767px]:h-3 max-[767px]:w-3" />
  <span className="line-clamp-3">
    {service}
  </span>
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

                      {/* Мобільний блок: дата → деталі → час */}
<div
className={cn(
  "hidden h-full items-center justify-center border-l pl-3 max-[639px]:flex",
  statusUi.side,
)}
>
<div className="flex h-[74px] w-[58px] flex-col items-center justify-center">
                        <div className="text-center">
                          <p className="text-[11px] font-bold capitalize text-[#aaa19a]">
                            {monthLabel}
                          </p>
<p
  className={cn(
    "text-[28px] font-[300] leading-none tracking-[-0.05em]",
    statusUi.time,
  )}
>
  {dayLabel}
</p>
                        </div>

<p className="text-[12px] font-semibold tracking-[0.08em] text-[#5f5a55]">
  {timeLabel}
</p>
                      </div>
                      </div>

                      {/* Desktop: статус + деталі */}
<div className="flex flex-col items-center justify-center gap-3 max-[639px]:hidden">
<div
  className={cn(
    "inline-flex items-center justify-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-center text-[10px] font-black shadow-sm",
    "min-[639px]:max-[767px]:gap-1",
    "min-[639px]:max-[767px]:px-2",
    "min-[639px]:max-[767px]:py-1",
    "min-[639px]:max-[767px]:text-[9px]",
    "min-[768px]:mr-24",
    statusUi.badge,
  )}
>
  <StatusIcon className="h-3.5 w-3.5 min-[639px]:max-[767px]:h-3 min-[639px]:max-[767px]:w-3" />

  <span className="whitespace-nowrap">
    {statusUi.text}
  </span>
</div>
</div>

                      {/* Desktop: дата */}
<div
  className={cn(
    "flex items-center justify-center border-l pl-5 max-[639px]:hidden",
    status === "confirmed"
      ? "border-[#bbf7d0]"
      : status === "new"
        ? "border-[#fed7aa]"
        : status === "canceled"
          ? "border-[#fecaca]"
          : "border-[#d1d5db]",
  )}
>
<div className="flex h-[108px] w-[100px] flex-col items-center justify-center">
<span className="text-[13px] font-bold capitalize text-[#aaa19a]">
  {monthLabel}
</span>

<span
  className={cn(
    "mt-1 text-[48px] font-[300] leading-none tracking-[-0.05em]",
    statusUi.time,
  )}
>
  {dayLabel}
</span>

    <span className="mt-2 text-[18px] font-black text-[#77716b]">
      {timeLabel}
    </span>
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

      {activeBooking &&
        (() => {
          const isCanceled = activeStatus === "canceled";
          const isConfirmed = activeStatus === "confirmed";
          const isCompleted = activeStatus === "completed";
          const showBookAgain = isCanceled || isCompleted;
const activeStatusUi = getStatusUi(
  activeStatus,
  activeBooking?.canceledBy,
);

const statusMeta = {
  label: activeStatusUi.text,
  Icon: activeStatusUi.icon,
  className: activeStatusUi.badge,
  iconBox: activeStatusUi.badge,
};

          const masterLabel = isAnyMasterSelected
            ? "Будь-який майстер"
            : activeMasterName || "Не вказано";
const quickDetails = [
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
    icon: Timer,
    label: "Тривалість",
    value:
      activeDuration != null
        ? `${activeDuration} хв`
        : "Не вказано",
  },
  {
    icon: Banknote,
    label: "Ціна",
    value:
      activePrice != null
        ? `${activePrice} грн`
        : "Не вказано",
  },
];

const additionalDetails = [
  {
    icon: FilePenLine,
    label: "Послуга",
    value: activeService || "Послуга",
  },
  {
    icon: UserRound,
    label: "Майстер",
    value: masterLabel,
    photo: !isAnyMasterSelected ? activeMasterPhoto : "",
  },
];
const StatusIcon = statusMeta.Icon;
const modalTheme =
  activeStatus === "confirmed"
    ? {
        modal: "bg-[#f0fdf4] sm:border-[#bbf7d0]",
        header: "bg-[#dcfce7]",
        content: "bg-[#f0fdf4]",
        footer: "border-[#bbf7d0] bg-[#dcfce7]",
        glow: "bg-[#22c55e]/15",
        shadow: "shadow-[0_35px_100px_rgba(22,101,52,0.20)]",
      }
    : activeStatus === "canceled"
      ? {
          modal: "bg-[#fff1f2] sm:border-[#fecdd3]",
          header: "bg-[#ffe4e6]",
          content: "bg-[#fff1f2]",
          footer: "border-[#fecdd3] bg-[#ffe4e6]",
          glow: "bg-[#ef4444]/15",
          shadow: "shadow-[0_35px_100px_rgba(185,28,28,0.18)]",
        }
      : {
          modal: "bg-[#fdfcfb] sm:border-[#eadfce]",
          header: "bg-[#f3eee7]",
          content: "bg-[#fdfcfb]",
          footer: "border-[#eadfce] bg-[#fbfaf8]",
          glow: "bg-[#ff6200]/10",
          shadow: "shadow-[0_35px_100px_rgba(15,23,42,0.22)]",
        };
          return (
            <div
              className="fixed inset-0 z-[220] flex items-end justify-center bg-[#202020]/45 p-0 backdrop-blur-[7px] sm:items-center sm:p-5"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setActiveBookingId(null);
                  setCopiedId(null);
                }
              }}
            >
              <div
                className={cn(
  "relative flex h-[100dvh] w-full flex-col overflow-hidden rounded-none",
  "sm:h-auto sm:max-h-[90dvh] sm:max-w-[590px] sm:rounded-[34px] sm:border",
  modalTheme.modal,
  modalTheme.shadow,
)}
                onClick={(e) => e.stopPropagation()}
              >
                <div
  className={cn(
    "relative overflow-hidden px-5 pb-4 pt-[max(16px,env(safe-area-inset-top))] sm:px-6 sm:pb-4 sm:pt-5",
    modalTheme.header,
  )}
>
                  <div className="absolute right-[-70px] top-[-90px] h-[220px] w-[220px] rounded-full bg-[#ff6200]/10 blur-3xl" />

                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Запис
                      </span>

                      <h2 className="mt-4 text-[24px] font-black leading-none tracking-[-0.05em] text-[#202020] max-[639px]:text-[24px] sm:text-[22px]">
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

                <div
  className={cn(
    "min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-4 sm:px-6 sm:pb-4 sm:pt-4",
    modalTheme.content,
  )}
>
                  {/* Статус запису */}
<div className="mb-3 flex justify-center">
  <span
    className={cn(
"inline-flex min-h-9 items-center justify-center gap-2 rounded-full border bg-white px-5 py-2 text-center text-[12px] font-black leading-tight shadow-[0_8px_20px_rgba(15,23,42,0.06)]",
"max-[639px]:min-h-8 max-[639px]:gap-1.5 max-[639px]:px-4 max-[639px]:py-1.5 max-[639px]:text-[10px]",
      statusMeta.className,
    )}
  >
    <statusMeta.Icon className="h-3.5 w-3.5 shrink-0 max-[639px]:h-3 max-[639px]:w-3" />

    {statusMeta.label}
  </span>
</div>
                  <div className="rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] max-[639px]:rounded-[18px] max-[639px]:p-3">
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
                        className="h-[154px] w-[210px] shrink-0 cursor-pointer overflow-hidden rounded-[24px] bg-[#f4f0ea] shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition duration-200 hover:scale-[1.02] active:scale-[0.99] max-[639px]:h-[106px] max-[639px]:w-[128px] max-[639px]:rounded-[18px] sm:h-[118px] sm:w-[150px] sm:rounded-[20px]"
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
<div className="flex min-w-0 items-center gap-1.5">
 {activeAddr || "Адресу не вказано"}

  {activeAddr && (
    <button
      type="button"
      onClick={() => copyText(activeAddr, `address-${activeBooking.id}`)}
      className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[#77716b] transition hover:text-[#ff6200] active:scale-95"
      title="Скопіювати адресу"
    >
      {copiedId === `address-${activeBooking.id}` ? (
        <CheckCheck className="h-3.5 w-3.5 text-[#22c55e]" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  )}
</div>
                        </div>
                      </div>
                    </div>
                  </div>
{/* Дата, час, тривалість і ціна */}
<div className="mt-4 grid grid-cols-4 gap-2 max-[639px]:gap-1.5">
  {quickDetails.map((item) => {
    const Icon = item.icon;

    return (
      <div
        key={item.label}
className="
  flex min-h-[94px] flex-col items-center justify-center
  rounded-[18px] border border-[#eadfce] bg-white
  px-2 py-2 text-center
  shadow-[0_10px_26px_rgba(15,23,42,0.05)]

  max-[639px]:min-h-[78px]
  max-[639px]:rounded-[14px]
  max-[639px]:px-1
  max-[639px]:py-1.5
"
      >
<Icon className="h-5 w-5 text-[#ff6200] max-[639px]:h-4 max-[639px]:w-4" />

<span className="mt-1.5 text-[12px] font-semibold text-[#77716b] max-[639px]:mt-1 max-[639px]:text-[10px]">
  {item.label}
</span>

<span className="mt-0.5 line-clamp-2 text-[13px] font-black leading-[1.1] text-[#202020] max-[639px]:text-[10px]">
  {item.value}
</span>
      </div>
    );
  })}
</div>

{/* Статус, послуга і майстер */}
<div className="mt-3 overflow-hidden rounded-[20px] border border-[#eadfce] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
  {additionalDetails.map((item) => {
    const Icon = item.icon;

    return (
      <div
        key={item.label}
        className="flex min-h-[48px] items-center gap-3 border-b border-[#eee8df] px-4 last:border-b-0 max-[639px]:min-h-[52px]"
      >
<div
  className={cn(
    "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden text-[#ff6200] max-[639px]:h-8 max-[639px]:w-8",
    item.photo &&
      "rounded-full border border-[#eadfce] bg-white p-0.5 shadow-sm",
  )}
>
{item.photo ? (
  <img
    src={item.photo}
    alt={item.value}
    className="block h-full w-full rounded-full object-cover object-center"
  />
) : (
  <Icon className="h-5 w-5 max-[639px]:h-4 max-[639px]:w-4" />
)}
        </div>

        <span className="min-w-0 flex-1 text-[15px] font-bold text-[#77716b] max-[639px]:text-[13px]">
          {item.label}
        </span>

        {item.badge ? (
          <span
            className={cn(
              "inline-flex h-8 max-w-[58%] items-center gap-1.5 rounded-full border bg-white px-3.5 text-right text-[12px] font-black leading-tight shadow-sm",
              "max-[639px]:h-7 max-[639px]:gap-1 max-[639px]:px-2 max-[639px]:text-[9px]",
              statusMeta.className,
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 max-[639px]:h-3 max-[639px]:w-3" />
            {item.value}
          </span>
        ) : (
          <span className="max-w-[58%] text-right text-[15px] font-black leading-tight text-[#202020] max-[639px]:text-[12px]">
            {item.value}
          </span>
        )}
      </div>
    );
  })}
</div>
                </div>

<div
  className={cn(
    "border-t border-[#eadfce] bg-[#fbfaf8] px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5",
    showBookAgain
      ? "grid grid-cols-1"
      : "grid grid-cols-2 gap-2 sm:flex sm:justify-end",
  )}
>
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
                        className="
  inline-flex h-14 w-full items-center justify-center gap-2
  rounded-[12px]
  bg-[#202020]
  text-[15px] font-black text-white
  shadow-[0_12px_26px_rgba(15,15,15,0.18)]
  transition-all duration-300
  hover:scale-[1.015]
  hover:bg-[#ff6200]
  active:scale-[0.98]
  disabled:pointer-events-none
  disabled:bg-[#f1ebe4]
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
                        <CalendarDays className="h-5 w-5" />
                        Перенести запис
                      </button>

<button
  type="button"
  onClick={() => setCancelConfirmId(activeBooking.id)}
  disabled={!canRescheduleBooking(activeBooking)}
  className="
    inline-flex h-14 w-full items-center justify-center gap-2
    rounded-[12px]
    border border-[#ef4444]/45
    bg-white
    text-[15px] font-black text-[#ef4444]
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
    disabled:opacity-100
    max-[639px]:h-11
    max-[639px]:rounded-[16px]
    max-[639px]:gap-1.5
    max-[639px]:text-[12px]
    sm:h-10
    sm:w-auto
    sm:min-w-[150px]
    sm:px-4
    sm:text-[13px]
  "
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
