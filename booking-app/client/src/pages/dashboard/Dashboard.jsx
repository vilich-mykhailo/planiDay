// Dashboard.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { socket } from "../../lib/socket";
import { useBookings } from "../../context/bookings/useBookings";
import {
  Building2,
  BriefcaseBusiness,
  Clock3,
  CalendarDays,
  UserStar,
  Users,
  LogOut,
  Sparkles,
  Bell,
  ChartColumn,
  Menu,
  ChevronDown,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const linkClass = ({ isActive }) =>
  [
    "group flex h-[52px] items-center gap-3 rounded-[16px] px-4 text-[14px] font-semibold transition-all duration-200",
    isActive
      ? "bg-[#fff3ed] text-[#ff4f12]"
      : "text-[#5f6673] hover:bg-[#f8f8f8] hover:text-[#111827]",
  ].join(" ");

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
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
  const [studioId, setStudioId] = useState(() =>
    localStorage.getItem("studioId"),
  );

  const { bookings = [] } = useBookings();

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

  const loadUnreadNotifications = useCallback(async () => {
    const currentToken = localStorage.getItem("token");
    const currentStudioId = localStorage.getItem("studioId");

    if (!currentToken || !currentStudioId) {
      setUnreadNotifications(0);
      setStudioId(currentStudioId || null);
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
  }, []);

  useEffect(() => {
    if (!token) return;
    loadUnreadNotifications();
  }, [token, loadUnreadNotifications]);

  useEffect(() => {
    if (!token) return;

    const currentStudioId = localStorage.getItem("studioId");
    if (!currentStudioId) return;

    const joinStudio = () => {
      socket.emit("join:studio", { studioId: currentStudioId });
    };

    if (socket.connected) {
      joinStudio();
    }

    const handleConnect = () => {
      joinStudio();
      loadUnreadNotifications();
    };

    const handleNotificationNew = (payload) => {
      if (!payload) return;

      if (
        String(payload.studioId) !== String(localStorage.getItem("studioId"))
      ) {
        return;
      }

      setUnreadNotifications((prev) => prev + 1);
    };

    const handleNotificationsUpdated = () => {
      loadUnreadNotifications();
    };

    const handleAuthChanged = () => {
      loadUnreadNotifications();
    };

    socket.on("connect", handleConnect);
    socket.on("notification:new", handleNotificationNew);
    socket.on("notifications:updated", handleNotificationsUpdated);
    window.addEventListener("auth-changed", handleAuthChanged);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("notification:new", handleNotificationNew);
      socket.off("notifications:updated", handleNotificationsUpdated);
      window.removeEventListener("auth-changed", handleAuthChanged);
    };
  }, [token, loadUnreadNotifications]);

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
    <div className="min-h-screen bg-[#fbfaf8] text-[#111827]">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[250px] border-r border-[#ececec] bg-white lg:flex lg:flex-col">
        <div className="flex h-[88px] items-center justify-between px-8">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-[25px] font-black leading-none tracking-[-0.06em] text-[#111827]"
          >
            Plani<span className="text-[#ff4f12]">Day</span>
          </button>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#f8f8f8] text-[#5f6673] transition hover:bg-[#f1f1f1]"
            aria-label="Меню"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 pt-4">
          <NavLink to="/dashboard" end className={linkClass}>
            <ChartColumn className="h-5 w-5 shrink-0" />
            <span>Головна</span>
          </NavLink>

          <NavLink to="/dashboard/bookings" className={linkClass}>
            <CalendarDays className="h-5 w-5 shrink-0" />
            <span className="flex-1">Записи</span>

            {newBookingsCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#ff4f12] px-1.5 text-[10px] font-black text-white">
                {newBookingsCount > 9 ? "9+" : newBookingsCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/dashboard/clients" className={linkClass}>
            <UserStar className="h-5 w-5 shrink-0" />
            <span>Клієнти</span>
          </NavLink>

          <NavLink to="/dashboard/services" className={linkClass}>
            <BriefcaseBusiness className="h-5 w-5 shrink-0" />
            <span>Послуги</span>
          </NavLink>

          <NavLink to="/dashboard/masters" className={linkClass}>
            <Users className="h-5 w-5 shrink-0" />
            <span>Майстри</span>
          </NavLink>

          <NavLink to="/dashboard/schedule" className={linkClass}>
            <Clock3 className="h-5 w-5 shrink-0" />
            <span>Графік роботи</span>
          </NavLink>

          <NavLink to="/dashboard/notifications" className={linkClass}>
            <Bell className="h-5 w-5 shrink-0" />
            <span className="flex-1 truncate">Повідомлення</span>

            {unreadNotifications > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#ff4f12] px-1.5 text-[10px] font-black text-white">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </NavLink>

          <NavLink to="/dashboard/studio" className={linkClass}>
            <Building2 className="h-5 w-5 shrink-0" />
            <span>Налаштування</span>
          </NavLink>
        </nav>

        <div className="px-4 pb-6">
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
              className="mt-4 h-10 w-full rounded-[14px] border border-[#ff865c] bg-white text-[13px] font-bold text-[#ff4f12] transition hover:bg-[#fff3ed]"
            >
              Оновити план
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[16px] text-[14px] font-bold text-[#5f6673] transition hover:bg-[#f8f8f8] active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" />
            Вихід
          </button>
        </div>
      </aside>

     <main className="min-h-screen pt-[72px] sm:pt-[80px] lg:pl-[250px] lg:pt-0">
        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </section>
      </main>
    </div>
  );
}