// Header.jsx
import {
  Link,
  NavLink,
  useLocation,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  User,
  Heart,
  CalendarDays,
  ShieldCheck,
  Building2,
  BriefcaseBusiness,
  LayoutDashboard,
  Clock3,
  Users,
  LogOut,
  Menu,
  Bell,
  UserStar,
  Search,
  X,
  Settings2,
  LayoutGrid,
} from "lucide-react";
import { api } from "../api/http";
import { useStudio } from "../context/studio/useStudio";
import { socket } from "../lib/socket";
import { useBookings } from "../context/bookings/useBookings";

const PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function cx(...a) {
  return a.flat().filter(Boolean).join(" ");
}

function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return PUBLIC ? `${PUBLIC}/${s}` : s;
}

function useRole() {
  const [params] = useSearchParams();

  const getSnapshot = () => {
    const q = params.get("role");
    if (q === "client" || q === "owner") return q;

    const ls = localStorage.getItem("role");
    if (ls === "client" || ls === "owner") return ls;

    return "guest";
  };

  const subscribe = (callback) => {
    const onChange = () => callback();

    window.addEventListener("auth-changed", onChange);
    window.addEventListener("storage", onChange);
    window.addEventListener("popstate", onChange);

    return () => {
      window.removeEventListener("auth-changed", onChange);
      window.removeEventListener("storage", onChange);
      window.removeEventListener("popstate", onChange);
    };
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => "guest");
}

const navLinkBase =
  "inline-flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200";

const navLinkActive =
  "bg-[#ff6200] text-white shadow-[0_10px_24px_rgba(255,98,0,0.18)]";

const navLinkIdle =
  "text-[#77716b] hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.99]";

function HeaderLink({ to, children, icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cx(navLinkBase, isActive ? navLinkActive : navLinkIdle)
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}

function ButtonLink({
  to,
  variant = "primary",
  children,
  onClick,
  disabled,
  className = "",
  icon,
}) {
  const styles =
    variant === "primary"
      ? "bg-[var(--color-ink)] text-white shadow-[var(--shadow-button)] hover:bg-[var(--color-ink-soft)]"
      : "border border-[var(--color-cream)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-cream)]";

  const disabledStyles = "pointer-events-none cursor-not-allowed opacity-50";

  return (
    <Link
      to={to}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled ? "true" : "false"}
      tabIndex={disabled ? -1 : 0}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-200",
        styles,
        disabled ? disabledStyles : "",
        className,
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

function MobileNavIcon({ children, active }) {
  return (
    <span
      className={cx(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200",
active
  ? "border-transparent bg-white/70 text-[var(--color-ink)]"
          : "border-[var(--color-cream)] bg-[var(--color-white)] text-[var(--color-sidebar-accent-soft)] shadow-sm",
      )}
    >
      {children}
    </span>
  );
}

function MobileBottomLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className="flex flex-1 flex-col items-center justify-center gap-[3px] px-1 py-1"
    >
      {({ isActive }) => (
        <>
          <span
            className={cx(
              "flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200",
              isActive
                ? "bg-[var(--color-sidebar-accent)] text-[var(--color-white)] shadow-[0_10px_22px_rgba(24,24,27,0.24)]"
                : "text-[var(--color-caramel)] hover:bg-[var(--color-cream)]",
            )}
          >
            {icon}
          </span>

          <span
            className={cx(
              "text-[9px] leading-none transition-colors duration-200",
              isActive
                ? "font-bold text-[var(--color-sidebar-accent)]"
                : "text-[var(--color-caramel)] opacity-80",
            )}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [nowTs, setNowTs] = useState(() => Date.now());
  const isLogin = location.pathname === "/login";
  const isOwnerLogin = location.pathname === "/login-owner";
  const role = useRole();
  const { bookings = [] } = useBookings();
const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { studio } = useStudio();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [clientProfile, setClientProfile] = useState({
    firstName: "",
    lastName: "",
    photoUrl: "",
  });

  const studioName = studio?.name?.trim() || "";
  const studioLogo = toPublicUrl(studio?.logoUrl);
  const showOwnerIdentity = role === "owner";
 const showClientBottomBar = false;
  const clientFullName = `${clientProfile.firstName || ""} ${clientProfile.lastName || ""}`.trim();
  const clientPhoto = toPublicUrl(clientProfile.photoUrl);
  const clientInitials =
    `${(clientProfile.firstName || "").trim().slice(0, 1)}${(clientProfile.lastName || "").trim().slice(0, 1)}`
      .toUpperCase() || "U";
      useEffect(() => {
  const id = window.setInterval(() => {
    setNowTs(Date.now());
  }, 60_000);

  return () => window.clearInterval(id);
}, []);

const newBookingsCount = useMemo(() => {
  return bookings.filter((booking) => {
    if (!booking?.id) return false;
    if (booking.status && booking.status !== "new") return false;

    const dt = new Date(
      `${booking.date}T${String(booking.time || "").replace(".", ":")}:00`,
    );

    if (Number.isNaN(dt.getTime())) return false;

    return dt.getTime() >= nowTs;
  }).length;
}, [bookings, nowTs]);
  const handleLogout = useCallback(() => {
    const currentRole = localStorage.getItem("role") || role;

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("auth-changed"));

    if (currentRole === "owner") {
      navigate("/login-owner", { replace: true });
      return;
    }

    navigate("/login", { replace: true });
  }, [navigate, role]);

  useEffect(() => {
  if (role !== "owner") return;

  async function loadUnreadNotifications() {
    const token = localStorage.getItem("token");
    const studioId = localStorage.getItem("studioId");
    if (!token || !studioId) return;

    try {
      const data = await api(`/owner/studio/${studioId}/notifications`, {
        token,
      });

      const items = Array.isArray(data?.notifications)
        ? data.notifications
        : [];

      setUnreadNotifications(items.filter((item) => !item.isRead).length);
    } catch {
      setUnreadNotifications(0);
    }
  }

  loadUnreadNotifications();

  const handleNew = (payload) => {
    if (String(payload?.studioId) !== String(localStorage.getItem("studioId"))) return;
    setUnreadNotifications((prev) => prev + 1);
  };

  const handleUpdated = () => loadUnreadNotifications();

  socket.on("notification:new", handleNew);
  socket.on("notifications:updated", handleUpdated);

  return () => {
    socket.off("notification:new", handleNew);
    socket.off("notifications:updated", handleUpdated);
  };
}, [role]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", open);
    document.body.classList.toggle("menu-open", open);

    return () => {
      document.body.classList.remove("overflow-hidden");
      document.body.classList.remove("menu-open");
    };
  }, [open]);

  useEffect(() => {
    let ignore = false;

    async function loadClientProfile() {
      if (role !== "client") {
        setClientProfile({
          firstName: "",
          lastName: "",
          photoUrl: "",
        });
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const data = await api("/client/me", { token });

        if (ignore) return;

        setClientProfile({
          firstName: data?.firstName || "",
          lastName: data?.lastName || "",
          photoUrl: data?.photoUrl || "",
        });
      } catch {
        if (ignore) return;
        setClientProfile({
          firstName: "",
          lastName: "",
          photoUrl: "",
        });
      }
    }

    loadClientProfile();

    const onAuthChanged = () => {
      loadClientProfile();
    };

    window.addEventListener("auth-changed", onAuthChanged);

    return () => {
      ignore = true;
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, [role]);

  const desktopItems = useMemo(() => {
    if (role === "client") {
      return {
        links: [
          { to: "/", label: "Пошук", icon: <Search className="h-4 w-4" /> },
          {
            to: "/profile",
            label: "Профіль",
            icon: <User className="h-4 w-4" />,
          },
          {
            to: "/bookings",
            label: "Мої записи",
            icon: <CalendarDays className="h-4 w-4" />,
          },
          {
            to: "/favourites",
            label: "Улюблені",
            icon: <Heart className="h-4 w-4" />,
          },
          {
            to: "/security-client",
            label: "Безпека",
            icon: <ShieldCheck className="h-4 w-4" />,
          },
        ],
        actions: (
          <div className="hidden items-center gap-2 lg:flex">
            <ButtonLink
              to="/"
              variant="secondary"
              onClick={handleLogout}
              icon={<LogOut className="h-4 w-4" />}
            >
              Вийти
            </ButtonLink>
          </div>
        ),
      };
    }

    if (role === "owner") {
      return {
        links: [],
        actions: (
<div className="hidden items-center gap-2 lg:flex">
  <ButtonLink
    to="/dashboard/studio"
    icon={<Settings2 className="h-4 w-4" />}
   className="bg-[var(--color-sidebar-accent)] text-[var(--color-white)] shadow-[0_12px_26px_rgba(24,24,27,0.22)] hover:bg-[var(--color-sidebar-accent-hover)]"
  >
    Керувати студією
  </ButtonLink>
</div>

        ),
      };
    }

    return {
      links: [],
      actions: (
        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink to="/login" variant="primary" disabled={isLogin}>
            Увійти як клієнт
          </ButtonLink>

          <ButtonLink
            to="/login-owner"
            variant="secondary"
            disabled={isOwnerLogin}
          >
            Увійти як власник
          </ButtonLink>
        </div>
      ),
    };
  }, [role, isLogin, isOwnerLogin, handleLogout]);

  const mobileItems = useMemo(() => {
    if (role === "client") {
      return {
        title: "Меню",
        subtitle: "КАБІНЕТ КЛІЄНТА",
        links: [
          {
            to: "/",
            label: "Пошук",
            icon: <Search className="h-5 w-5" />,
          },
          {
            to: "/bookings",
            label: "Записи",
            icon: <CalendarDays className="h-5 w-5" />,
          },
          {
            to: "/favourites",
            label: "Улюблені",
            icon: <Heart className="h-5 w-5" />,
          },
          {
            to: "/profile",
            label: "Профіль",
            icon: <User className="h-5 w-5" />,
          },
        ],
        logout: true,
      };
    }

    if (role === "owner") {
      return {
        title: "Кабінет керування",
        subtitle: "Панель керування",
        links: [
          {
            to: "/dashboard",
            label: "Аналітика",
            icon: <LayoutDashboard className="h-4 w-4" />,
          },
          {
            to: "/dashboard/bookings",
            label: "Записи",
            icon: <CalendarDays className="h-4 w-4" />,
          },
          {
            to: "/dashboard/notifications",
            label: "Повідомлення",
            icon: <Bell className="h-4 w-4" />,
          },
          {
            to: "/dashboard/studio",
            label: "Профіль студії",
            icon: <Building2 className="h-4 w-4" />,
          },
          {
            to: "/dashboard/masters",
            label: "Майстри",
            icon: <Users className="h-4 w-4" />,
          },
          {
            to: "/dashboard/services",
            label: "Послуги",
            icon: <BriefcaseBusiness className="h-4 w-4" />,
          },
          {
            to: "/dashboard/schedule",
            label: "Графік роботи",
            icon: <Clock3 className="h-4 w-4" />,
          },
          {
            to: "/dashboard/clients",
            label: "База клієнтів",
            icon: <UserStar className="h-4 w-4" />,
          },
        ],
        logout: true,
      };
    }

    return {
      title: "Меню",
      subtitle: "Гостьовий режим",
      links: [
        { to: "/login", label: "Я клієнт", icon: <User className="h-4 w-4" /> },
        {
          to: "/login-owner",
          label: "Я власник",
          icon: <Settings2 className="h-4 w-4" />,
        },
      ],
      logout: false,
    };
  }, [role]);

const staticRoutes = [
  "/",
  "/login",
  "/register",
  "/login-owner",
  "/register-owner",
  "/profile",
  "/bookings",
  "/favourites",
  "/security-client",
  "/dashboard",
  "/dashboard/studio",
  "/dashboard/services",
  "/dashboard/schedule",
  "/dashboard/bookings",
  "/dashboard/masters",
  "/dashboard/notifications",
  "/dashboard/clients",
];

  const isStudioPublicPage = !staticRoutes.includes(location.pathname);

  if (isStudioPublicPage) return null;

  return (
    <>
<header className="fixed left-0 right-0 top-3 z-[60]">
  <div className="mx-auto max-w-[1260px] px-4 max-[639px]:px-5 sm:px-6 lg:px-10">
    <div className="flex h-[58px] items-center justify-between rounded-[28px] border border-[#eadfce] bg-white/82 px-3 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur-2xl sm:h-[64px] sm:px-4 lg:h-[66px]">
      <Link
        to="/"
        className="flex min-w-0 items-center gap-2 rounded-2xl px-1.5 py-1 transition active:scale-[0.98]"
        aria-label="PlaniDay"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#111111] text-sm font-black text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)]">
          P
        </span>

        <span className="truncate text-[15px] font-black tracking-[-0.04em] text-[#202020] sm:text-[16px]">
          Plani<span className="text-[#ff6200]">Day</span>
        </span>
      </Link>

      <nav className="hidden items-center gap-1 lg:flex">
        {desktopItems.links?.map((i) => (
          <HeaderLink key={i.to} to={i.to} icon={i.icon}>
            {i.label}
          </HeaderLink>
        ))}
      </nav>

      <div className="hidden lg:block">{desktopItems.actions}</div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-12 w-12 place-items-center rounded-[18px] border border-[#eadfce] bg-white text-[#111111] shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition hover:border-[#f1dfbf] hover:text-[#ff6200] hover:ring-4 hover:ring-orange-200/20 active:scale-95 lg:hidden"
        aria-label="Menu"
        aria-expanded={open}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <LayoutGrid className="h-6 w-6" />
        )}
      </button>
    </div>
  </div>
</header>

      {!showClientBottomBar && (
        <div
          className={cx(
            "fixed inset-0 z-[70] lg:hidden",
            open ? "pointer-events-auto" : "pointer-events-none",
          )}
          aria-hidden={!open}
        >
          <div
            className={cx(
              "absolute inset-0 bg-[rgba(5,5,5,0.45)] backdrop-blur-[6px] transition-opacity duration-300",
              open ? "opacity-100" : "opacity-0",
            )}
            onClick={() => setOpen(false)}
          />

<aside
  className={cx(
    "absolute right-0 top-0 h-dvh w-[76%] max-w-[360px] overflow-hidden bg-white shadow-[0_24px_80px_rgba(0,0,0,0.22)] transition-transform duration-300 ease-out",
    open ? "translate-x-0" : "translate-x-full",
  )}
>
  <div className="flex h-full flex-col">
    {/* TOP */}
    <div className="border-b border-stone-100 px-5 pb-5 pt-[calc(env(safe-area-inset-top)+18px)]">
      <div className="mb-5 flex items-center justify-between">
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--color-sidebar-accent)] text-sm font-black text-white shadow-[0_10px_24px_rgba(24,24,27,0.20)]">
            P
          </span>

          <span className="text-lg font-black tracking-tight text-[var(--color-ink)]">
            Plani
            <span className="text-[var(--color-sidebar-accent-soft)]">
              Day
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="grid h-10 w-10 place-items-center rounded-full bg-stone-100 text-stone-700 transition hover:bg-stone-200 active:scale-95"
          aria-label="Закрити меню"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-[24px] bg-stone-50 p-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-sm">
          {showOwnerIdentity && studioLogo ? (
            <img src={studioLogo} className="h-full w-full object-cover" />
          ) : role === "client" && clientPhoto ? (
            <img src={clientPhoto} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-black text-[var(--color-sidebar-accent)]">
              P
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
            {mobileItems.subtitle}
          </p>

          <h2 className="mt-1 truncate text-lg font-black leading-tight text-[var(--color-ink)]">
            {showOwnerIdentity && studioName
              ? studioName
              : role === "client" && clientFullName
              ? clientFullName
              : "PlaniDay"}
          </h2>
        </div>
      </div>
    </div>

    {/* LINKS */}
    <div className="flex-1 overflow-y-auto px-3 py-4">
      <nav className="space-y-1">
        {mobileItems.links.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.to === "/dashboard"}
            onClick={() => {
              i.onClick?.();
              setOpen(false);
            }}
            className={({ isActive }) =>
              cx(
                "group flex min-h-[54px] items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[15px] font-bold transition-all duration-200",
                isActive
                  ? "bg-[var(--color-sidebar-accent)] text-white shadow-[0_12px_28px_rgba(24,24,27,0.18)]"
                  : "text-stone-800 hover:bg-stone-100 active:scale-[0.99]",
              )
            }
          >
            {({ isActive }) => {
              const badgeCount =
                i.to === "/dashboard/bookings"
                  ? newBookingsCount
                  : i.to === "/dashboard/notifications"
                    ? unreadNotifications
                    : 0;

              return (
                <>
                  <span
                    className={cx(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition",
                      isActive
                        ? "bg-white/15 text-white"
                        : "bg-stone-100 text-stone-600 group-hover:bg-white",
                    )}
                  >
                    {i.icon}
                  </span>

                  <span className="min-w-0 flex-1 truncate">{i.label}</span>

                  {badgeCount > 0 && (
                    <span
                      className={cx(
                        "grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[11px] font-black",
                        isActive
                          ? "bg-white text-[var(--color-sidebar-accent)]"
                          : "bg-red-500 text-white",
                      )}
                    >
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </>
              );
            }}
          </NavLink>
        ))}
      </nav>
    </div>

    {/* BOTTOM */}
    <div className="border-t border-stone-100 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
      {mobileItems.logout ? (
        <button
          type="button"
          onClick={() => {
            handleLogout();
            setOpen(false);
          }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-100 px-4 text-sm font-black text-stone-900 transition hover:bg-stone-200 active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4 text-red-500" />
          Вийти
        </button>
      ) : (
        <div className="grid gap-2">
          <ButtonLink
            to="/login"
            variant="primary"
            disabled={isLogin}
            onClick={() => setOpen(false)}
            className="w-full rounded-2xl py-3"
          >
            Увійти як клієнт
          </ButtonLink>

          <ButtonLink
            to="/login-owner"
            variant="secondary"
            disabled={isOwnerLogin}
            onClick={() => setOpen(false)}
            className="w-full rounded-2xl py-3"
          >
            Увійти як власник
          </ButtonLink>
        </div>
      )}
    </div>
  </div>
</aside>
        </div>
      )}

      {/* {showClientBottomBar && (
        <div className="fixed inset-x-0 bottom-0 z-[80] sm:hidden">
          <div className="mx-auto max-w-6xl px-2 pb-[calc(env(safe-area-inset-bottom)+6px)]">
            <div className="overflow-hidden rounded-[26px] border border-white/40 bg-white/80 backdrop-blur-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.18)]">
              <div className="grid grid-cols-4 gap-1 px-1.5 py-1">
                {mobileItems.links.map((item) => (
                  <MobileBottomLink
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    icon={item.icon}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )} */}
    </>
  );
}
