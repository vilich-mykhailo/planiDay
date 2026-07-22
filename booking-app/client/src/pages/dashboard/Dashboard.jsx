// Dashboard.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { socket } from "../../lib/socket";
import { useBookings } from "../../context/bookings/useBookings";
import {
  Building2,
  ClipboardPen,
  Clock3,
  CalendarDays,
  UserStar,
  Users,
  LogOut,
  Sparkles,
  Bell,
  ChartColumn,
  Menu,
  X,
  ArrowLeftToLine,
  ArrowRightToLine,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const linkClass = ({ isActive }) =>
  [
    "group relative flex h-[52px] items-center gap-3 overflow-hidden rounded-[16px] text-[14px] font-semibold transition-all duration-300 ease-out active:scale-[0.98]",
    isActive
      ? "bg-[#fff5ee] text-[#ff6200] shadow-[0_6px_18px_rgba(255,98,0,0.12)] ring-1 ring-[#ff6200]/10"
      : "text-[#3f3f46] hover:scale-[1.02] hover:text-[#ff6200] hover:shadow-[0_6px_18px_rgba(15,23,42,0.08)]",
  ].join(" ");

function SidebarText({ children, collapsed, className = "" }) {
  return (
    <span
      className={cn(
        "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
        collapsed
          ? "max-w-0 translate-x-[-6px] opacity-0"
          : "max-w-[170px] translate-x-0 opacity-100",
        className,
      )}
    >
      {children}
    </span>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-[#ececec]", className)}
      aria-hidden="true"
    />
  );
}

function NavItemSkeleton() {
  return <SkeletonBlock className="h-[52px] w-full rounded-[16px]" />;
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#fbfaf8]">
      <aside className="fixed left-0 top-0 hidden h-screen w-[250px] border-r border-[#ececec] bg-white lg:block">
        <div className="flex h-[88px] items-center px-8">
          <SkeletonBlock className="h-8 w-28 rounded-xl" />
        </div>

        <nav className="space-y-2 px-4">
          <NavItemSkeleton />
          <NavItemSkeleton />
          <NavItemSkeleton />
          <NavItemSkeleton />
          <NavItemSkeleton />
          <NavItemSkeleton />
        </nav>
      </aside>

      <main className="min-h-screen lg:pl-[250px]">
        <header className="h-[88px] border-b border-[#ececec] bg-white" />

        <section className="px-4 py-6 sm:px-6 lg:px-10">
          <SkeletonBlock className="h-8 w-48 rounded-xl" />
          <SkeletonBlock className="mt-3 h-4 w-80 max-w-full" />
          <SkeletonBlock className="mt-8 h-40 w-full rounded-[24px]" />
          <SkeletonBlock className="mt-5 h-72 w-full rounded-[24px]" />
        </section>
      </main>
    </div>
  );
}

function pad2(n) {
  return String(n).padStart(2, "0");
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

function getBookingDateTime(booking) {
  const dateStr = booking?.date;
  const timeStr = parseTimeToHHMM(booking?.time);

  if (!dateStr || !timeStr) return null;

  const dt = new Date(`${dateStr}T${timeStr}:00`);
  if (Number.isNaN(dt.getTime())) return null;

  return dt;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [studioId, setStudioId] = useState(() =>
    localStorage.getItem("studioId"),
  );

  const { bookings = [] } = useBookings();

  const navLinkClass = (props) =>
    cn(
      linkClass(props),
      sidebarCollapsed ? "justify-center px-0" : "px-4",
    );

  const newBookingsCount = useMemo(() => {
    const nowTs = Date.now();

    return bookings.filter((booking) => {
      if (!booking?.id) return false;
      if (booking.status && booking.status !== "new") return false;

      const dt = getBookingDateTime(booking);
      if (!dt) return false;

      return dt.getTime() >= nowTs;
    }).length;
  }, [bookings]);

  useEffect(() => {
    if (!token) {
      navigate("/login-owner", { replace: true });
    }
  }, [token, navigate]);

const getCurrentStudioId = useCallback(async () => {
  const currentToken = localStorage.getItem("token");

  if (!currentToken) return null;

  try {
    const res = await fetch(`${API_URL}/owner`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || "Не вдалося отримати студії");
    }

    const studios = Array.isArray(data) ? data : [];

    if (!studios.length) {
      localStorage.removeItem("studioId");
      setStudioId(null);
      return null;
    }

    const savedStudioId = localStorage.getItem("studioId");

    const validSavedStudio = savedStudioId
      ? studios.find((studio) => String(studio.id) === String(savedStudioId))
      : null;

    const currentStudioId = validSavedStudio?.id || studios[0]?.id || null;

    if (currentStudioId) {
      localStorage.setItem("studioId", currentStudioId);
      setStudioId(currentStudioId);
    }

    return currentStudioId;
  } catch (e) {
    console.error("Failed to resolve studio id:", e);
    localStorage.removeItem("studioId");
    setStudioId(null);
    return null;
  }
}, []);

const loadUnreadNotifications = useCallback(async () => {
  const currentToken = localStorage.getItem("token");

  if (!currentToken) {
    setUnreadNotifications(0);
    setStudioId(null);
    return;
  }

  const currentStudioId = await getCurrentStudioId();

  if (!currentStudioId) {
    setUnreadNotifications(0);
    setStudioId(null);
    return;
  }

  setStudioId(currentStudioId);

  try {
    const res = await fetch(
      `${API_URL}/owner/studio/${currentStudioId}/notifications`,
      {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 404) {
        localStorage.removeItem("studioId");
        setStudioId(null);
      }

      throw new Error(data?.message || "Не вдалося завантажити повідомлення");
    }

    const items = Array.isArray(data?.notifications)
      ? data.notifications
      : [];

    setUnreadNotifications(items.filter((item) => !item.isRead).length);
  } catch (e) {
    console.error("Failed to load unread notifications:", e);
    setUnreadNotifications(0);
  }
}, [getCurrentStudioId]);

  useEffect(() => {
    if (!token) return;
    loadUnreadNotifications();
  }, [token, loadUnreadNotifications]);

useEffect(() => {
  if (!token) return;

  let activeStudioId = null;
  let isMounted = true;

  const joinResolvedStudio = async () => {
    const resolvedStudioId = await getCurrentStudioId();

    if (!isMounted || !resolvedStudioId) return;

    activeStudioId = resolvedStudioId;

    socket.emit("join:studio", { studioId: resolvedStudioId });
  };

  joinResolvedStudio();

  const handleConnect = () => {
    joinResolvedStudio();
    loadUnreadNotifications();
  };

  const handleNotificationNew = (payload) => {
    if (!payload) return;

    const currentStudioId = activeStudioId || localStorage.getItem("studioId");

    if (String(payload.studioId) !== String(currentStudioId)) {
      return;
    }

    setUnreadNotifications((prev) => prev + 1);
  };

  const handleNotificationsUpdated = () => {
    loadUnreadNotifications();
  };

  const handleAuthChanged = () => {
    joinResolvedStudio();
    loadUnreadNotifications();
  };

  socket.on("connect", handleConnect);
  socket.on("notification:new", handleNotificationNew);
  socket.on("notifications:updated", handleNotificationsUpdated);
  window.addEventListener("auth-changed", handleAuthChanged);

  return () => {
    isMounted = false;

    socket.off("connect", handleConnect);
    socket.off("notification:new", handleNotificationNew);
    socket.off("notifications:updated", handleNotificationsUpdated);
    window.removeEventListener("auth-changed", handleAuthChanged);
  };
}, [token, getCurrentStudioId, loadUnreadNotifications]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("studioId");

    setUnreadNotifications(0);
    setStudioId(null);

    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login-owner", { replace: true });
  };

  if (!token) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen text-[#111827]">
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen border-r border-[#ececec] bg-white transition-all duration-300 ease-in-out lg:flex lg:flex-col",
          sidebarCollapsed ? "w-[88px]" : "w-[250px]",
        )}
      >
<div
  className={cn(
    "relative transition-all duration-300 ease-in-out",
sidebarCollapsed
  ? "flex h-[130px] flex-col items-center justify-start px-2 pt-3"
  : "flex h-[130px] items-center justify-between px-8"
  )}
>
  {sidebarCollapsed && (
    <img
      src="/aveliio_logo.png"
      alt="Aveliio"
      className="mt-2 h-[44px] w-[74px] object-contain transition-all duration-300"
    />
  )}

<div
  className={cn(
    "overflow-hidden transition-all duration-300 ease-in-out",
    sidebarCollapsed
      ? "max-w-0 translate-x-[-8px] opacity-0"
      : "max-w-[180px] translate-x-4 opacity-100",
  )}
>
  <button
    type="button"
    onClick={() => navigate("/dashboard")}
    className="flex flex-col items-center"
  >
<img
  src="/Logo_aveliio_text_font.png"
  alt="Aveliio"
  className="h-[90px] w-auto shrink-0 object-contain select-none"
  draggable={false}
/>

  </button>
</div>

  <button
    type="button"
    onClick={() => setSidebarCollapsed((prev) => !prev)}
    className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#f8f8f8] text-[#5f6673] transition-all duration-300 hover:bg-[#f1f1f1] active:scale-[0.96]"
    aria-label={sidebarCollapsed ? "Розгорнути меню" : "Згорнути меню"}
    title={sidebarCollapsed ? "Розгорнути меню" : "Згорнути меню"}
  >
    <span className="relative grid h-5 w-5 place-items-center">
      <ArrowRightToLine
        className={cn(
          "absolute h-5 w-5 transition-all duration-300 ease-in-out",
          sidebarCollapsed
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-75 opacity-0",
        )}
      />

      <ArrowLeftToLine
        className={cn(
          "absolute h-5 w-5 transition-all duration-300 ease-in-out",
          sidebarCollapsed
            ? "rotate-90 scale-75 opacity-0"
            : "rotate-0 scale-100 opacity-100",
        )}
      />
    </span>
  </button>
</div>

<nav
  className={cn(
    "flex-1 space-y-1.5 transition-all duration-300 ease-in-out",
    sidebarCollapsed ? "px-3 pt-3" : "px-4 pt-4",
  )}
>
          <NavLink to="/dashboard" end className={navLinkClass}>
            <ChartColumn className="h-5 w-5 shrink-0" />
            <SidebarText collapsed={sidebarCollapsed}>Головна</SidebarText>
          </NavLink>

          <NavLink to="/dashboard/bookings" className={navLinkClass}>
            <CalendarDays className="h-5 w-5 shrink-0" />
            <SidebarText collapsed={sidebarCollapsed} className="flex-1">
              Записи
            </SidebarText>

            {newBookingsCount > 0 && (
              <span
                className={cn(
                  "grid h-5 min-w-5 place-items-center rounded-full bg-[#ff4f12] px-1.5 text-[10px] font-black text-white transition-all duration-300 ease-in-out",
                  sidebarCollapsed
                    ? "absolute right-2 top-2 h-4 min-w-4 px-1 text-[9px]"
                    : "relative",
                )}
              >
                {newBookingsCount > 9 ? "9+" : newBookingsCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/dashboard/services" className={navLinkClass}>
            <ClipboardPen className="h-5 w-5 shrink-0" />
            <SidebarText collapsed={sidebarCollapsed}>Послуги</SidebarText>
          </NavLink>
          <NavLink to="/dashboard/clients" className={navLinkClass}>
            <Users className="h-5 w-5 shrink-0" />
            <SidebarText collapsed={sidebarCollapsed}>Клієнти</SidebarText>
          </NavLink>


          <NavLink to="/dashboard/masters" className={navLinkClass}>
            <UserStar className="h-5 w-5 shrink-0" />
            <SidebarText collapsed={sidebarCollapsed}>Майстри</SidebarText>
          </NavLink>
          <NavLink to="/dashboard/studio" className={navLinkClass}>
            <Building2 className="h-5 w-5 shrink-0" />
            <SidebarText collapsed={sidebarCollapsed}>
              Профіль
            </SidebarText>
          </NavLink>

          <NavLink to="/dashboard/notifications" className={navLinkClass}>
            <Bell className="h-5 w-5 shrink-0" />
            <SidebarText collapsed={sidebarCollapsed} className="flex-1">
              Повідомлення
            </SidebarText>

            {unreadNotifications > 0 && (
              <span
                className={cn(
                  "grid h-5 min-w-5 place-items-center rounded-full bg-[#ff4f12] px-1.5 text-[10px] font-black text-white transition-all duration-300 ease-in-out",
                  sidebarCollapsed
                    ? "absolute right-2 top-2 h-4 min-w-4 px-1 text-[9px]"
                    : "relative",
                )}
              >
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </NavLink>


          <NavLink to="/dashboard/schedule" className={navLinkClass}>
            <Clock3 className="h-5 w-5 shrink-0" />
            <SidebarText collapsed={sidebarCollapsed}>
              Графік роботи
            </SidebarText>
          </NavLink>
        </nav>

        <div
          className={cn(
            "pb-6 transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "px-3" : "px-4",
          )}
        >
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              sidebarCollapsed
                ? "max-h-0 translate-y-3 opacity-0"
                : "max-h-[260px] translate-y-0 opacity-100",
            )}
          >
            <div className="rounded-[22px] border border-[#f0ebe6] bg-[#fffaf6] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-[16px] bg-[#fff0e6] text-[#ff4f12]">
                <Sparkles className="h-5 w-5" />
              </div>

              <p className="text-[14px] font-black text-[#18181b]">
                Преміум план
              </p>

              <p className="mt-1.5 text-[12px] font-medium leading-5 text-[#6b7280]">
                Розширте можливості вашої студії
              </p>

<button
  type="button"
  onClick={() => navigate("/dashboard/billing")}
  className="mt-4 h-10 w-full rounded-[14px] border border-[#ff865c] bg-white text-[13px] font-bold text-[#ff4f12] transition hover:bg-[#fff3ed] active:scale-[0.98]"
>
  Оновити план
</button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
className={cn(
  "mt-4 flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-[16px] text-[14px] font-bold text-[#5f6673] transition-all duration-300 ease-out hover:scale-[1.02] hover:text-[#ff6200] hover:shadow-[0_6px_18px_rgba(15,23,42,0.08)] active:scale-[0.98]",
  sidebarCollapsed ? "px-0" : "px-4",
)}
            title="Вихід"
          >
            <LogOut className="h-4 w-4 shrink-0" />

            <SidebarText collapsed={sidebarCollapsed}>
              Вихід
            </SidebarText>
          </button>
        </div>
      </aside>

      <main
        className={cn(
          "min-h-screen pt-[72px] transition-all duration-300 ease-in-out sm:pt-[80px] lg:pt-0",
          sidebarCollapsed ? "lg:pl-[88px]" : "lg:pl-[250px]",
        )}
      >
        <section className="px-4 py-4 sm:px-4 lg:px-4">
          <Outlet />
        </section>
      </main>
    </div>
  );
}