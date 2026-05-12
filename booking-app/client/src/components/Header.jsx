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
  "border-transparent text-[var(--color-white)] bg-[var(--color-sidebar-accent)] shadow-[0_14px_30px_rgba(24,24,27,0.22)]";

const navLinkIdle =
  "border-transparent text-[var(--color-ink)] hover:bg-[var(--color-cream)] active:scale-[0.99]";

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
  const showClientBottomBar = role === "client" && isMobile;
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
      {!showClientBottomBar && (
        <header className="fixed left-0 right-0 top-2 z-[60] sm:top-3">
          <div className="mx-auto max-w-6xl px-3 sm:px-4">
          <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white/85 shadow-[0_18px_50px_rgba(24,24,27,0.10)] ring-1 ring-black/[0.03] backdrop-blur-2xl sm:rounded-[30px]">
              <div className="h-[2px] bg-gradient-to-r from-[var(--color-sidebar-accent)] via-[var(--color-sidebar-accent-hover)] to-[var(--color-sidebar-accent-soft)]" />

              <div className="flex h-14 items-center justify-between gap-2 px-2.5 sm:h-16 sm:gap-3 sm:px-4">
                <Link
                  to="/"
                  className="flex min-w-0 items-center gap-2 rounded-2xl px-1.5 py-1 transition hover:bg-[var(--color-cream)] sm:px-2 sm:py-1.5"
                  aria-label="Planiday"
                >
<span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[var(--color-sidebar-accent)] text-sm font-black text-[var(--color-white)] shadow-[0_12px_26px_rgba(24,24,27,0.22)]">
  P
</span>

<span className="truncate text-sm font-black tracking-tight text-[var(--color-ink)] sm:text-base">
  Plani<span className="text-[var(--color-sidebar-accent-soft)]">Day</span>
</span>
                </Link>

                <nav className="hidden items-center gap-1 lg:flex">
                  {desktopItems.links?.map((i) => (
                    <HeaderLink key={i.to} to={i.to} icon={i.icon}>
                      {i.label}
                    </HeaderLink>
                  ))}
                </nav>

                {desktopItems.actions}

                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-cream)] bg-white/90 text-[var(--color-ink)] shadow-[0_4px_16px_rgba(27,27,27,0.06)] transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.97] sm:h-11 sm:w-11 sm:rounded-2xl lg:hidden"
                  aria-label="Menu"
                  aria-expanded={open}
                >
                  {open ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

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
              "absolute right-0 top-0 h-dvh w-[76%] max-w-[280px] overflow-hidden border-l border-white/20 bg-[rgba(255,255,255,0.96)] backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.22)] transition-transform duration-300 ease-out sm:w-[88%] sm:max-w-[360px]",
              open ? "translate-x-0" : "translate-x-full",
            )}
          >
            <div className="flex h-full flex-col">
<div className="relative border-b border-[var(--color-cream)] bg-white px-3 pb-2.5 pt-2.5 sm:px-4 sm:pb-3 sm:pt-3">
<div className="relative overflow-hidden rounded-[26px] border border-[#ece6dd] bg-[#fcfaf7] p-3 shadow-[0_16px_40px_rgba(60,40,20,0.10)]">

  {/* left accent */}
  <div className="absolute left-0 top-0 h-full w-[7px] bg-[#2a2723]" />

  {/* dots */}
  <div className="absolute left-4 top-4 grid grid-cols-5 gap-[5px] opacity-25">
    {Array.from({ length: 20 }).map((_, i) => (
      <span
        key={i}
        className="h-[2px] w-[2px] rounded-full bg-[#8b8177]"
      />
    ))}
  </div>

  {/* soft decor */}
  <div className="pointer-events-none absolute bottom-0 right-0 h-full w-[42%] overflow-hidden">
    <div className="absolute bottom-0 right-0 h-28 w-28 rounded-full bg-[#f3ede5]" />
    <div className="absolute bottom-[-10px] right-10 h-20 w-20 rounded-full bg-[#efe6dc]" />
  </div>

  <div className="relative flex items-start justify-between gap-3">

    {/* content */}
    <div className="flex items-center gap-3 min-w-0">

      {/* logo */}
      <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-[22px] bg-white p-2 shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
        <div className="grid h-full w-full place-items-center overflow-hidden rounded-[16px] bg-black">
          {showOwnerIdentity && studioLogo ? (
            <img
              src={studioLogo}
              className="h-full w-full object-cover"
            />
          ) : role === "client" && clientPhoto ? (
            <img
              src={clientPhoto}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl font-black text-white">
              P
            </span>
          )}
        </div>
      </div>

      {/* text */}
      <div className="min-w-0 flex-1 pt-1">

        <h2 className="max-w-[170px] truncate text-[20px] font-black leading-none tracking-[-0.04em] text-[#1d2329]">
          {showOwnerIdentity && studioName
            ? studioName
            : role === "client" && clientFullName
            ? clientFullName
            : "MotorCar"}
        </h2>

        <p className="mt-1 text-[10px] font-medium text-[#8d8a86]">
          Панель керування
        </p>


      </div>
    </div>

    {/* close */}
    <button
      onClick={() => setOpen(false)}
      className="relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#2b2118] shadow-[0_6px_16px_rgba(0,0,0,0.10)] transition hover:bg-[#f7efe4]"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
</div>
</div>

              <div className="flex-1 overflow-y-auto px-2.5 py-3 sm:px-3 sm:py-4">
                <nav className="space-y-0.5 sm:space-y-1">
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
      "group relative flex items-center gap-3 overflow-hidden rounded-[18px] border px-3 py-3 transition-all duration-300 ease-out sm:rounded-[22px] sm:py-3.5",
isActive
  ? "border-transparent bg-[var(--color-sidebar-selected)] text-[var(--color-ink)] shadow-[0_10px_24px_rgba(80,55,30,0.10)]"
  : "border-transparent text-[var(--color-caramel)] hover:bg-[var(--color-cream)]"
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
            "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200 sm:h-7",
            isActive
  ? "bg-[var(--color-white)]"
  : "bg-transparent"
          )}
        />

        <MobileNavIcon active={isActive}>{i.icon}</MobileNavIcon>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{i.label}</div>
        </div>

        {badgeCount > 0 && (
          <span
            className={cx(
              "ml-auto mr-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
isActive
  ? "bg-[var(--color-danger)] text-white"
  : "bg-[var(--color-danger)] text-white",
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

              <div className="border-t border-[var(--color-cream)] bg-white/70 p-2.5 backdrop-blur-xl sm:p-3">
                {mobileItems.logout ? (
<button
  type="button"
  onClick={() => {
    handleLogout();
    setOpen(false);
  }}
  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
>
  <LogOut className="h-4 w-4 text-[var(--color-danger)]" />
  Вийти
</button>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    <ButtonLink
                      to="/login"
                      variant="primary"
                      disabled={isLogin}
                      onClick={() => setOpen(false)}
                      className="w-full rounded-[18px] py-2.5 sm:rounded-[20px] sm:py-3"
                    >
                      Увійти як клієнт
                    </ButtonLink>

                    <ButtonLink
                      to="/login-owner"
                      variant="secondary"
                      disabled={isOwnerLogin}
                      onClick={() => setOpen(false)}
                      className="w-full rounded-[18px] py-2.5 sm:rounded-[20px] sm:py-3"
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

      {showClientBottomBar && (
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
      )}
    </>
  );
}
