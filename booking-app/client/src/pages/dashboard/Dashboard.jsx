// Dashboard.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { socket } from "../../lib/socket";
import { useBookings } from "../../context/bookings/useBookings";
import {
  LayoutDashboard,
  Building2,
  BriefcaseBusiness,
  Clock3,
  CalendarDays,
  Users,
  LogOut,
  Sparkles,
  Bell,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const linkClass = ({ isActive }) =>
  [
    "group relative flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm font-semibold transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/10",
    isActive
      ? "border-emerald-700 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)]"
      : "border-transparent bg-transparent text-stone-600 hover:border-stone-200 hover:bg-stone-50 hover:text-stone-800",
  ].join(" ");

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-stone-200/60 ${className}`}
      aria-hidden="true"
    />
  );
}

function NavItemSkeleton() {
  return <SkeletonBlock className="h-12 w-full rounded-2xl" />;
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/20">
      <div className="mx-auto max-w-6xl px-4 pt-24 md:pt-22">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside
            className="
              hidden lg:block
              relative top-auto h-fit overflow-hidden rounded-3xl border border-stone-200/60 bg-white p-4
              shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]
              md:sticky lg:top-[88px]
            "
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-60" />

            <div className="mb-4 border-b border-stone-100 px-2 pb-4 pt-2 text-center">
              <SkeletonBlock className="mx-auto h-8 w-24 rounded-full" />
              <SkeletonBlock className="mx-auto mt-3 h-7 w-40 rounded-xl" />
            </div>

            <nav className="flex flex-col gap-2 p-1">
              <NavItemSkeleton />
              <NavItemSkeleton />
              <NavItemSkeleton />
              <NavItemSkeleton />
              <NavItemSkeleton />
              <NavItemSkeleton />

              <div className="mt-3 border-t border-stone-100 pt-3">
                <SkeletonBlock className="h-12 w-full rounded-2xl" />
              </div>
            </nav>
          </aside>

          <section
            className="
              min-h-[200px] overflow-hidden rounded-3xl border border-stone-200/60 bg-white p-6
              shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]
            "
          >
            <div className="space-y-4">
              <SkeletonBlock className="h-8 w-48 rounded-xl" />
              <SkeletonBlock className="h-4 w-72 max-w-full" />
              <SkeletonBlock className="h-32 w-full rounded-2xl" />
              <SkeletonBlock className="h-32 w-full rounded-2xl" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SidebarLinkIcon({ children, isActive }) {
  return (
    <span
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200",
        "border-stone-200 bg-white",
        isActive
          ? "text-emerald-600" // 👈 зелена іконка
          : "text-stone-500 group-hover:border-stone-300 group-hover:text-stone-700",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [studioId, setStudioId] = useState(() =>
    localStorage.getItem("studioId"),
  );

  const { newBookingsCount = 0 } = useBookings();

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
      const unread = items.filter((item) => !item.isRead).length;

      setUnreadNotifications(unread);
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
      if (String(payload.studioId) !== String(localStorage.getItem("studioId"))) {
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
    <div className="min-h-screen ">
      <div className="mx-auto w-full max-w-6xl px-0 pt-18 lg:px-4">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside
            className="
              hidden lg:block
              relative top-auto h-fit overflow-hidden rounded-3xl border border-stone-200/60 bg-white p-3
              shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]
              lg:sticky lg:top-[88px]
            "
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-60" />

            <div className="mb-2 border-b border-stone-100 px-1 pb-1 pt-1 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                  Кабінет
                </span>
              </div>

              <h2 className="mt-3 text-lg font-bold tracking-tight text-stone-800">
                Панель керування
              </h2>
            </div>

            <nav className="flex flex-col gap-1 p-1">
              <NavLink to="/dashboard" end className={linkClass}>
                {({ isActive }) => (
                  <>
                    <SidebarLinkIcon isActive={isActive}>
                      <LayoutDashboard className="h-4.5 w-4.5" />
                    </SidebarLinkIcon>
                    <span>Головна</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/dashboard/bookings" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span className="relative inline-flex">
                      <SidebarLinkIcon isActive={isActive}>
                        <CalendarDays className="h-4.5 w-4.5" />
                      </SidebarLinkIcon>

                      {newBookingsCount > 0 && (
                        <span
                          className={cn(
                            "absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 text-[10px] font-bold leading-none shadow-sm",
isActive
  ? "border-white bg-red-500 text-white"
  : "border-white bg-red-500 text-white"
                          )}
                        >
                          {newBookingsCount > 9 ? "9+" : newBookingsCount}
                        </span>
                      )}
                    </span>

                    <span>Записи</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/dashboard/notifications" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span className="relative inline-flex">
                      <SidebarLinkIcon isActive={isActive}>
                        <Bell className="h-4.5 w-4.5" />
                      </SidebarLinkIcon>

                      {unreadNotifications > 0 && (
                        <span
                          className={cn(
                            "absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 text-[10px] font-bold leading-none shadow-sm",
                            isActive
                              ? "border-white bg-red-500 text-white"
                              : "border-white bg-red-500 text-white",
                          )}
                        >
                          {unreadNotifications > 9 ? "9+" : unreadNotifications}
                        </span>
                      )}
                    </span>

                    <span className="truncate">Повідомлення</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/dashboard/studio" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <SidebarLinkIcon isActive={isActive}>
                      <Building2 className="h-4.5 w-4.5" />
                    </SidebarLinkIcon>
                    <span>Профіль студії</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/dashboard/masters" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <SidebarLinkIcon isActive={isActive}>
                      <Users className="h-4.5 w-4.5" />
                    </SidebarLinkIcon>
                    <span>Майстри</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/dashboard/services" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <SidebarLinkIcon isActive={isActive}>
                      <BriefcaseBusiness className="h-4.5 w-4.5" />
                    </SidebarLinkIcon>
                    <span>Послуги</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/dashboard/schedule" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <SidebarLinkIcon isActive={isActive}>
                      <Clock3 className="h-4.5 w-4.5" />
                    </SidebarLinkIcon>
                    <span>Графік роботи</span>
                  </>
                )}
              </NavLink>

              <div className="mt-3 border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200
                    bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 text-sm font-semibold text-red-600
                    transition-all duration-200 hover:from-red-100 hover:to-rose-100
                    active:scale-[0.98]
                    focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/10
                  "
                >
                  <LogOut className="h-4 w-4" />
                  Вихід
                </button>
              </div>
            </nav>
          </aside>

          <section
            className="
              min-h-[200px] overflow-hidden rounded-3xl px-3 py-2 sm:px-4 sm:py-4
              lg:border lg:border-stone-200/60 lg:bg-white lg:p-6 lg:mb-4 lg:mt-4
              lg:shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]
            "
          >
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}