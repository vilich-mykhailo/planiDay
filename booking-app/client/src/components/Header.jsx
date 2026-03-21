// Header.jsx
import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Sparkles,
  User,
  Heart,
  CalendarDays,
  LayoutDashboard,
  Building2,
  BriefcaseBusiness,
  Clock3,
  Users,
  LogOut,
  Menu,
  X,
  Settings2,
} from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
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
  "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-[0_10px_24px_rgba(74,93,78,0.18)]";

const navLinkIdle =
  "text-stone-600 hover:bg-stone-50 hover:text-stone-800";

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
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200",
        active
          ? "border-white/20 bg-white/10 text-white"
          : "border-stone-200 bg-white text-stone-500",
      )}
    >
      {children}
    </span>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  const isOwnerLogin = location.pathname === "/login-owner";
  const role = useRole();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("auth-changed"));
  };

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
          { to: "/", label: "Головна", icon: <Sparkles className="h-4 w-4" /> },
          { to: "/profile", label: "Мої дані", icon: <User className="h-4 w-4" /> },
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
        ],
        actions: (
          <div className="hidden items-center gap-2 md:flex">
            <ButtonLink to="/" variant="secondary" onClick={handleLogout} icon={<LogOut className="h-4 w-4" />}>
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
          <div className="hidden items-center gap-2 md:flex">
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
        <div className="hidden items-center gap-2 md:flex">
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
  }, [role, isLogin, isOwnerLogin]);

  const mobileItems = useMemo(() => {
    if (role === "client") {
      return {
        title: "Меню",
        subtitle: "Клієнтський режим",
        links: [
          { to: "/", label: "Головна", icon: <Sparkles className="h-4 w-4" /> },
          { to: "/profile", label: "Мої дані", icon: <User className="h-4 w-4" /> },
          {
            to: "/bookings",
            label: "Мої записи",
            icon: <CalendarDays className="h-4 w-4" />,
          },
          { to: "/favourites", label: "Улюблені", icon: <Heart className="h-4 w-4" /> },
        ],
        logout: true,
      };
    }

    if (role === "owner") {
      return {
        title: "Панель керування",
        subtitle: "Кабінет",
        links: [
          { to: "/dashboard", label: "Головна", icon: <LayoutDashboard className="h-4 w-4" /> },
          { to: "/dashboard/studio", label: "Студія", icon: <Building2 className="h-4 w-4" /> },
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
            to: "/dashboard/bookings",
            label: "Записи",
            icon: <CalendarDays className="h-4 w-4" />,
          },
          { to: "/dashboard/masters", label: "Майстри", icon: <Users className="h-4 w-4" /> },
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
    <header className="fixed left-0 right-0 top-3 z-[60]">
      <div className="mx-auto max-w-6xl px-4">
        <div
          className="
            overflow-hidden rounded-[28px]
            border border-stone-200/70
            bg-white/90
            backdrop-blur-md
            shadow-[0_10px_30px_rgba(93,64,55,0.08)]
          "
        >
          <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

          <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-4">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-[18px] px-2 py-1.5 transition hover:bg-stone-50"
              aria-label="Planiday"
            >
              <span className="grid h-9 w-9 place-items-center rounded-[18px] bg-gradient-to-r from-emerald-600 to-emerald-700 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(74,93,78,0.22)]">
                P
              </span>

              <span className="text-sm font-extrabold tracking-tight text-stone-800 sm:text-base">
                Plani<span className="text-amber-600">Day</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
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
              className="inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-white p-2.5 text-stone-800 transition hover:bg-stone-50 md:hidden"
              aria-label="Menu"
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={cx(
          "fixed inset-0 z-[70] md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className={cx(
            "absolute inset-0 bg-stone-900/35 backdrop-blur-[2px] transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />

        <div
          className={cx(
            "absolute left-1/2 top-[84px] w-[calc(100%-24px)] max-w-[380px] -translate-x-1/2",
            "transition-all duration-300 ease-out",
            open ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
          )}
        >
          <div className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(93,64,55,0.14)]">
            <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

            <div className="mb-3 border-b border-stone-100 px-4 pb-4 pt-4 text-center">
              <div className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700">
                {mobileItems.subtitle || "Кабінет"}
              </div>

              <h2 className="mt-3 text-[18px] font-bold leading-[1.2] tracking-[-0.02em] text-stone-800">
                {mobileItems.title || "Панель керування"}
              </h2>
            </div>

            <nav className="flex flex-col gap-2 p-4 pt-1">
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
                      "group flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm font-semibold transition-all duration-200",
                      isActive
                        ? "border-emerald-700 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-[0_10px_24px_rgba(74,93,78,0.18)]"
                        : "border-transparent bg-transparent text-stone-600 hover:border-stone-200 hover:bg-stone-50 hover:text-stone-800",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <MobileNavIcon active={isActive}>{i.icon}</MobileNavIcon>
                      <span>{i.label}</span>
                    </>
                  )}
                </NavLink>
              ))}

              {mobileItems.logout && (
                <div className="mt-3 border-t border-stone-100 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    className="
                      inline-flex w-full items-center justify-center gap-2 rounded-2xl
                      border border-red-200 bg-gradient-to-r from-red-50 to-rose-50
                      px-4 py-3 text-sm font-semibold text-red-600 transition-all duration-150
                      hover:from-red-100 hover:to-rose-100
                      active:scale-[0.98]
                      focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/10
                    "
                  >
                    <LogOut className="h-4 w-4" />
                    Вихід
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}