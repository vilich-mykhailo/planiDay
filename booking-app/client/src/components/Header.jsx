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
  Search,
  X,
  Settings2,
} from "lucide-react";
import { useStudio } from "../context/studio/useStudio";

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
  "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white";

const navLinkIdle = "text-stone-600 hover:bg-stone-50 hover:text-stone-800";

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
      ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-emerald-800"
      : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-800";

  const disabledStyles = "opacity-50 pointer-events-none cursor-not-allowed";

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
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 sm:h-11 sm:w-11 sm:rounded-2xl",
        active
          ? "border-emerald-500/20 bg-white/12 text-white"
          : "border-stone-200 bg-white text-stone-500 shadow-[0_2px_8px_rgba(28,25,23,0.04)]",
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
      className={({ isActive }) =>
        cx(
          "flex flex-1 flex-col items-center justify-center gap-[2px] px-1 py-1 transition-all duration-200",
          isActive ? "text-amber-500" : "text-stone-500",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cx(
              "flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200",
              isActive
                ? "scale-105 bg-amber-500 text-white shadow-[0_6px_16px_rgba(251,191,36,0.35)]"
                : "text-stone-500",
            )}
          >
            {icon}
          </span>

          <span
            className={cx(
              "text-[9px] leading-none",
              isActive ? "text-amber-500" : "text-stone-500 opacity-80",
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
  const isLogin = location.pathname === "/login";
  const isOwnerLogin = location.pathname === "/login-owner";
  const role = useRole();
  const { studio } = useStudio();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const studioName = studio?.name?.trim() || "";
  const studioLogo = toPublicUrl(studio?.logoUrl);
  const showOwnerIdentity = role === "owner";
  const showClientBottomBar = role === "client" && isMobile;

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
        subtitle: "Клієнтський режим",
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
            label: "Головна",
            icon: <LayoutDashboard className="h-4 w-4" />,
          },
          {
            to: "/dashboard/bookings",
            label: "Записи",
            icon: <CalendarDays className="h-4 w-4" />,
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
  ];

  const isStudioPublicPage = !staticRoutes.includes(location.pathname);

  if (isStudioPublicPage) return null;

  return (
    <>
      {!showClientBottomBar && (
        <header className="fixed left-0 right-0 top-2 z-[60] sm:top-3">
          <div className="mx-auto max-w-6xl px-3 sm:px-4">
            <div
              className="
                overflow-hidden rounded-[22px] border border-stone-200/70 bg-white/90
                shadow-[0_10px_30px_rgba(93,64,55,0.08)] backdrop-blur-md
                sm:rounded-[28px]
              "
            >
              <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

              <div className="flex h-14 items-center justify-between gap-2 px-2.5 sm:h-16 sm:gap-3 sm:px-4">
                <Link
                  to="/"
                  className="flex min-w-0 items-center gap-2 rounded-2xl px-1.5 py-1 transition hover:bg-stone-50 sm:px-2 sm:py-1.5"
                  aria-label="Planiday"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(74,93,78,0.22)] sm:h-9 sm:w-9 sm:text-sm">
                    P
                  </span>

                  <span className="truncate text-sm font-extrabold tracking-tight text-stone-800 sm:text-base">
                    Plani<span className="text-amber-600">Day</span>
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
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200/80 bg-white/90 text-stone-800 shadow-[0_4px_16px_rgba(28,25,23,0.06)] transition-all duration-200 hover:bg-stone-50 active:scale-[0.97] sm:h-11 sm:w-11 sm:rounded-2xl lg:hidden"
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
              "absolute inset-0 bg-stone-950/45 backdrop-blur-[6px] transition-opacity duration-300",
              open ? "opacity-100" : "opacity-0",
            )}
            onClick={() => setOpen(false)}
          />

          <aside
            className={cx(
              "absolute right-0 top-0 h-dvh w-[84%] max-w-[320px] overflow-hidden border-l border-white/20 bg-[rgba(255,255,255,0.96)] backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.22)] transition-transform duration-300 ease-out sm:w-[88%] sm:max-w-[360px]",
              open ? "translate-x-0" : "translate-x-full",
            )}
          >
            <div className="flex h-full flex-col">
              <div className="relative border-b border-stone-200/80 px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
                <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600 opacity-90" />

                <div className="flex items-start justify-between gap-3 pt-1.5 sm:pt-2">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <div className="relative">
                      <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-[18px] bg-gradient-to-br from-emerald-600 to-emerald-700 text-sm font-extrabold text-white sm:h-12 sm:w-12 sm:rounded-[20px] sm:text-base">
                        {showOwnerIdentity && studioLogo ? (
                          <img
                            src={studioLogo}
                            alt={studioName || "Лого студії"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          "P"
                        )}
                      </div>

                      <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 sm:h-4 sm:w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold tracking-tight text-stone-900">
                        {showOwnerIdentity && studioName ? (
                          studioName
                        ) : (
                          <>
                            Plani<span className="text-amber-600">Day</span>
                          </>
                        )}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] font-medium text-stone-500 sm:text-xs">
                        {mobileItems.subtitle || "Меню"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 transition hover:bg-stone-50 active:scale-[0.98] sm:h-10 sm:w-10 sm:rounded-2xl"
                    aria-label="Закрити меню"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>

                <div className="mt-3 rounded-[20px] border border-stone-200/80 bg-gradient-to-br from-stone-50 via-white to-stone-50 p-3 text-center shadow-[0_8px_24px_rgba(28,25,23,0.04)] sm:mt-4 sm:rounded-[24px] sm:p-4">
                  <div className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                    {mobileItems.subtitle || "Режим"}
                  </div>

                  <h2 className="mt-2 text-lg font-bold leading-tight tracking-[-0.03em] text-stone-900 sm:text-[20px]">
                    {mobileItems.title || "Меню"}
                  </h2>
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
                            ? "border-amber-400/70 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
                            : "border-transparent text-stone-700 hover:-translate-y-[1px] hover:border-amber-300/70 hover:bg-gradient-to-r hover:from-stone-100 hover:via-white hover:to-stone-100 hover:text-stone-900 hover:shadow-[0_10px_24px_rgba(28,25,23,0.08)] active:scale-[0.99]",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cx(
                              "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200 sm:h-7",
                              isActive ? "bg-white" : "bg-transparent",
                            )}
                          />

                          <MobileNavIcon active={isActive}>
                            {i.icon}
                          </MobileNavIcon>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold">
                              {i.label}
                            </div>
                          </div>
                        </>
                      )}
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="border-t border-stone-200/80 bg-white/70 p-2.5 backdrop-blur-xl sm:p-3">
                {mobileItems.logout ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:from-red-100 hover:to-rose-100 active:scale-[0.99] sm:rounded-[20px] sm:py-3"
                  >
                    <LogOut className="h-4 w-4" />
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
          <div className="
  overflow-hidden rounded-[26px]
  border border-white/40
  bg-white/80
  backdrop-blur-2xl
  shadow-[0_-20px_50px_rgba(0,0,0,0.18)]
">
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