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
  ClipboardPen,
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
  Home,
  ChevronRight,
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
  "inline-flex items-center gap-2 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ease-out";

const navLinkActive =
  "bg-[#fff5ee] text-[#ff6200] shadow-[0_6px_18px_rgba(255,98,0,0.12)] ring-1 ring-[#ff6200]/10";

const navLinkIdle =
  "text-[#3f3f46] hover:text-[#ff6200] hover:scale-105 active:scale-[0.99]";

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
      ? "bg-[var(--color-ink)] text-white  hover:bg-[var(--color-ink-soft)]"
      : "border border-[var(--color-cream)] bg-white text-[var(--color-ink)] hover:bg-[#ff6200]/5";

  const disabledStyles = "pointer-events-none cursor-not-allowed opacity-50";

  return (
    <Link
      to={to}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled ? "true" : "false"}
      tabIndex={disabled ? -1 : 0}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-bold transition-all duration-200",
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
  const hideHeader =
  location.pathname === "/login" ||
  location.pathname === "/login-owner" ||
  location.pathname === "/register" ||
  location.pathname === "/register-owner" ||
  location.pathname === "/forgot-password";
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
  const identityTitle =
    role === "owner"
      ? studioName || "Aveliio Studio"
      : role === "client"
        ? clientFullName || "Мій профіль"
        : "Aveliio";
  const identitySubtitle =
    role === "owner"
      ? "Кабінет керування"
      : role === "client"
        ? "Кабінет клієнта"
        : "Гостьовий режим";
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
const getMobileBadge = (to) => {
  if (to === "/dashboard/bookings" && newBookingsCount > 0) {
    return newBookingsCount > 9 ? "9+" : String(newBookingsCount);
  }

  if (to === "/dashboard/notifications" && unreadNotifications > 0) {
    return unreadNotifications > 9 ? "9+" : String(unreadNotifications);
  }

  return null;
};
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
  className="transition-all duration-150 hover:scale-105 hover:shadow-[0_6px_18px_rgba(15,23,42,0.08)]"
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
   className="bg-[var(--color-sidebar-accent)] text-[var(--color-white)] hover:bg-[var(--color-sidebar-accent-hover)]"
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
    label: "Головна",
    icon: <Home className="h-6 w-6" />,
  },
  {
    to: "/profile",
    label: "Профіль",
    icon: <User className="h-6 w-6" />,
  },
  {
    to: "/bookings",
    label: "Записи",
    icon: <CalendarDays className="h-6 w-6" />,
  },
  {
    to: "/favourites",
    label: "Улюблені",
    icon: <Heart className="h-6 w-6" />,
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
            label: "Головна",
            icon: <LayoutDashboard className="h-4 w-4" />,
          },
          {
            to: "/dashboard/bookings",
            label: "Записи",
            icon: <CalendarDays className="h-4 w-4" />,
          },
                    {
            to: "/dashboard/services",
            label: "Послуги",
            icon: <ClipboardPen className="h-4 w-4" />,
          },
                    {
            to: "/dashboard/clients",
            label: "Клієнти",
            icon: <Users className="h-4 w-4" />,
          },
                    {
            to: "/dashboard/masters",
            label: "Майстри",
            icon: <UserStar className="h-4 w-4" />,
          },

          {
            to: "/dashboard/studio",
            label: "Профіль",
            icon: <Building2 className="h-4 w-4" />,
          },
          {
            to: "/dashboard/notifications",
            label: "Повідомлення",
            icon: <Bell className="h-4 w-4" />,
          },

          {
            to: "/dashboard/schedule",
            label: "Графік роботи",
            icon: <Clock3 className="h-4 w-4" />,
          },

          {
  to: "#logout",
  label: "Вихід",
  icon: <LogOut className="h-4 w-4" />,
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

if (isStudioPublicPage || hideHeader) {
  return null;
}
  return (
    <>
<header
  className={cx(
    "fixed left-0 right-0 top-3 z-[60]",
    role === "owner" &&
      location.pathname.startsWith("/dashboard") &&
      "lg:hidden",
  )}
>
  <div className="mx-auto max-w-[1260px] px-4 max-[639px]:px-5 sm:px-6 lg:px-10">
    <div className="flex h-[58px] items-center justify-between rounded-[20px] border border-[#eadfce] bg-white/90 px-3  backdrop-blur-2xl sm:h-[64px] sm:px-4 lg:h-[66px]">
      <Link
        to="/"
        className="flex min-w-0 items-center gap-2 rounded-2xl px-1.5 py-1 transition-transform duration-200 hover:scale-105 active:scale-[0.98]"
        aria-label="Aveliio"
      >
<span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden shadow-[0_10px_24px_rgba(15,23,42,0.14)]">
  <img
    src="/aveliio_logo.png"
    alt="Aveliio"
    className="h-full w-full object-contain"
  />
</span>

<span className="truncate text-[15px] font-black tracking-[-0.04em] text-zinc-700 transition-colors duration-300 group-hover:text-[#ff6200] sm:text-[16px]">
  Aveliio
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
        className="grid h-12 w-12 translate-x-[5px] place-items-center rounded-[18px] border border-[#eadfce] bg-white text-[#111111] shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition hover:border-[#f1dfbf] hover:text-[#ff6200] hover:ring-4 hover:ring-orange-200/20 active:scale-95 lg:hidden"
        aria-label="Menu"
        aria-expanded={open}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
         <Menu className="h-6 w-6" />
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
    "absolute inset-x-3 top-[calc(env(safe-area-inset-top)+6px)] max-h-[calc(100dvh-20px)] overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.22)] backdrop-blur-3xl transition-all duration-300 sm:left-auto sm:right-6 sm:w-[360px] sm:max-h-[calc(100dvh-80px)]",
    open
      ? "translate-y-0 scale-100 opacity-100"
      : "-translate-y-3 scale-[0.98] opacity-0 pointer-events-none",
  )}
>
  <div className="relative overflow-hidden border-b border-[#f0e7da] bg-[#fbfaf8] px-4 py-4">
    <div className="absolute right-[-46px] top-[-70px] h-[150px] w-[150px] rounded-full bg-[#ff6200]/10 blur-3xl" />

    <div className="relative flex items-center gap-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl  text-sm font-black text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)]">
        {role === "owner" && studioLogo ? (
          <img src={studioLogo} alt="" className="h-full w-full object-cover" />
        ) : role === "client" && clientPhoto ? (
          <img src={clientPhoto} alt="" className="h-full w-full object-cover" />
        ) : role === "client" ? (
          clientInitials
) : (
  <img
    src="/Logo_aveliio_font.png"
    alt="Aveliio"
    className="h-full w-full object-contain"
  />
)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-black leading-tight text-[#202020]">
          {identityTitle}
        </p>
        <p className="mt-0.5 truncate text-[12px] font-bold uppercase tracking-[0.12em] text-[#ff6200]">
          {identitySubtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setOpen(false)}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-[#77716b] w-[0_8px_22px_rgba(15,23,42,0.0shado8)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96]"
        aria-label="Закрити меню"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  </div>

 <nav className="max-h-[calc(100dvh-100px)] space-y-1 overflow-y-auto p-2.5 pb-[max(12px,env(safe-area-inset-bottom))]">
{mobileItems.links.map((i) => {
  const badge = getMobileBadge(i.to);

  return i.to === "#logout" ? (
    <button
      key="logout"
      type="button"
      onClick={() => {
        setOpen(false);
        handleLogout();
      }}
      className="group flex h-[54px] w-full items-center gap-3 rounded-[18px] px-3 text-[#ef4444] transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_6px_18px_rgba(239,68,68,0.10)] active:scale-[0.98]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fff1f1] text-[#ef4444]">
        {i.icon}
      </span>

      <span className="flex-1 truncate text-left text-[15px] font-black">
        {i.label}
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-[#ef4444]" />
    </button>
  ) : (
<NavLink
  key={i.to}
  to={i.to}
  end={i.to === "/" || i.to === "/dashboard"}
  onClick={() => {
    setOpen(false);
  }}
className={({ isActive }) =>
  cx(
    "group flex h-[54px] items-center gap-3 rounded-[18px] px-3 transition-all duration-300 ease-out active:scale-[0.98]",
    isActive
      ? "bg-[#fff5ee] text-[#ff6200] shadow-[0_6px_18px_rgba(255,98,0,0.12)] ring-1 ring-[#ff6200]/10"
      : "text-[#3f3f46] hover:scale-[1.02] hover:text-[#ff6200] hover:shadow-[0_6px_18px_rgba(15,23,42,0.08)]",
  )
}
>
      {({ isActive }) => (
        <>
          <span
            className={cx(
              "grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-all duration-200",
              isActive
                ? "bg-white text-[#ff6200] shadow-[0_8px_22px_rgba(255,98,0,0.12)]"
                : "bg-[#f7f5f1] text-[#93919d] group-hover:text-[#ff6200]",
            )}
          >
            {i.icon}
          </span>

          <span className="flex-1 truncate text-[15px] font-black">
            {i.label}
          </span>

          {badge ? (
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[#ff6200] px-1.5 text-[10px] font-black text-white">
              {badge}
            </span>
          ) : (
<ChevronRight
  className={cx(
    "h-4 w-4 shrink-0 transition-all duration-300 group-hover:translate-x-[2px]",
    isActive ? "text-[#ff6200]" : "text-[#b0afb7]",
  )}
/>
          )}
        </>
      )}
    </NavLink>
  );
})}
  </nav>
</aside>
        </div>
      )}

     
    </>
  );
}
