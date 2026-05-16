// Dashboard.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { socket } from "../../lib/socket";
import { useBookings } from "../../context/bookings/useBookings";
import {
  LayoutDashboard,
  Building2,
  BriefcaseBusiness,
  Clock3,
  CalendarDays,
  UserStar ,
  Users,
  LogOut,
  Sparkles,
  Bell,
  ChartColumn,
  MonitorCog,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const linkClass = ({ isActive }) =>
  [
    "group relative flex items-center gap-3 overflow-hidden rounded-[18px] border px-3 py-3 text-sm font-semibold transition-all duration-300 ease-out",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-sand)]/30",
isActive
  ? "border-transparent text-white bg-[var(--color-sidebar-accent)] hover:bg-[var(--color-sidebar-accent-hover)]"  
    : "border-transparent text-[var(--color-caramel)] hover:bg-[var(--color-cream)]",
  ].join(" ");

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[color:var(--color-mist)]/80 ${className}`}
      aria-hidden="true"
    />
  );
}

function NavItemSkeleton() {
  return <SkeletonBlock className="h-12 w-full rounded-2xl" />;
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen ">
      <div className="mx-auto max-w-6xl px-4 pt-24 md:pt-22">
        <div className="grid min-h-[calc(100vh-72px)] grid-cols-1 items-start gap-2 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
          <aside
            className="
              hidden lg:block
              relative top-auto h-fit overflow-hidden rounded-3xl border border-[var(--color-mist)] bg-white p-4
              shadow-[var(--shadow-soft)]
              md:sticky lg:top-[88px]
            "
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[var(--color-ink)] via-[var(--color-forest)] to-[var(--color-caramel)]" />

            <div className="mb-4 border-b border-[var(--color-mist)] px-2 pb-4 pt-2 text-center">
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

              <div className="mt-3 border-t border-[var(--color-mist)] pt-3">
                <SkeletonBlock className="h-12 w-full rounded-2xl" />
              </div>
            </nav>
          </aside>

          <section
            className="
              min-h-[200px] overflow-hidden rounded-3xl border border-[var(--color-mist)] bg-white p-6
              shadow-[var(--shadow-soft)]
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

// SidebarLinkIcon
function SidebarLinkIcon({ children, isActive }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200",
        isActive
          ? "border-white/10 bg-white/10 text-white"
          : "border-slate-200 bg-white text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
      )}
    >
      {children}
    </span>
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
    <div
      className="min-h-screen"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(180,140,108,0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(50,78,41,0.12), transparent 30%)",
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-0 pt-18 lg:px-4">
        <div className="grid min-h-[calc(100vh-72px)] grid-cols-1 items-start gap-2 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
          <aside
            className="
    hidden lg:block
    relative h-fit overflow-hidden rounded-3xl
    border border-[var(--color-mist)]
    bg-white p-3
    shadow-[var(--shadow-soft-hover)]
    lg:sticky lg:top-[88px] lg:mt-4
  "
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[var(--color-sidebar-accent)] via-[var(--color-sidebar-accent-hover)] to-[var(--color-sidebar-accent-soft)]" />

            <div className="mb-2 border-b border-[var(--color-mist)] px-1 pb-3 pt-2 text-center">
<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
  <div className="h-1 w-1 rounded-full bg-slate-400" />
  <span>Особистий кабінет</span>

  <div className="h-1 w-1 rounded-full bg-slate-400" />
</div>

              <h2 className="text-lg font-bold tracking-tight text-[var(--color-ink)]">
                Панель керування
              </h2>
            </div>

            <nav className="flex flex-col gap-1 p-1">
              <NavLink to="/dashboard" end className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200",
                        isActive
  ? "bg-[var(--color-sidebar-accent-soft)]"
  : "bg-transparent"
                      )}
                    />

                    <SidebarLinkIcon isActive={isActive}>
                      <ChartColumn className="h-4.5 w-4.5" />
                    </SidebarLinkIcon>

                    <span>Аналітика</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/dashboard/bookings" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200",
                        isActive ? "bg-white" : "bg-transparent",
                      )}
                    />

                    <SidebarLinkIcon isActive={isActive}>
                      <CalendarDays className="h-4.5 w-4.5" />
                    </SidebarLinkIcon>

                    <span className="flex-1">Записи</span>

                    {newBookingsCount > 0 && (
                      <span
                        className={cn(
                          "ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                          isActive
                            ? "bg-[var(--color-danger)] text-white "
                            : "bg-[var(--color-danger)] text-white ",
                        )}
                      >
                        {newBookingsCount > 9 ? "9+" : newBookingsCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>

              <NavLink to="/dashboard/notifications" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200",
                        isActive ? "bg-white" : "bg-transparent",
                      )}
                    />

                    <SidebarLinkIcon isActive={isActive}>
                      <Bell className="h-4.5 w-4.5" />
                    </SidebarLinkIcon>
                    <span className="flex-1 truncate">Повідомлення</span>

                    {unreadNotifications > 0 && (
                      <span
                        className={cn(
                          "ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                          isActive
                            ? "bg-[var(--color-danger)] text-white "
                            : "bg-[var(--color-danger)] text-white ",
                        )}
                      >
                        {unreadNotifications > 9 ? "9+" : unreadNotifications}
                      </span>
                    )}
                  </>
                )}
              </NavLink>

              <NavLink to="/dashboard/studio" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200",
                        isActive ? "bg-white" : "bg-transparent",
                      )}
                    />

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
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200",
                        isActive ? "bg-white" : "bg-transparent",
                      )}
                    />

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
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200",
                        isActive ? "bg-white" : "bg-transparent",
                      )}
                    />
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200",
                        isActive ? "bg-white" : "bg-transparent",
                      )}
                    />

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
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200",
                        isActive ? "bg-white" : "bg-transparent",
                      )}
                    />

                    <SidebarLinkIcon isActive={isActive}>
                      <Clock3 className="h-4.5 w-4.5" />
                    </SidebarLinkIcon>
                    <span>Графік роботи</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/dashboard/clients" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200",
                        isActive ? "bg-white" : "bg-transparent",
                      )}
                    />

                    <SidebarLinkIcon isActive={isActive}>
                      <UserStar   className="h-4.5 w-4.5" />
                    </SidebarLinkIcon>
                    <span>База клієнтів</span>
                  </>
                )}
              </NavLink>

              <div className="mt-3 border-t border-[var(--color-mist)] pt-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
                >
                  <LogOut className="h-4 w-4 text-[var(--color-danger)]" />
                  Вихід
                </button>
              </div>
            </nav>
          </aside>

          <section
            className="self-start overflow-hidden px-3 py-2 sm:py-4 ">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}
