import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

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
  "rounded-[16px] px-3 py-2.5 text-sm font-semibold transition-all duration-200";
const navLinkActive =
  "bg-[#4A5D4E] text-white shadow-[0_10px_22px_rgba(74,93,78,0.18)]";
const navLinkIdle =
  "text-[#6B625A] hover:bg-[#FAF7F4] hover:text-[#1F2A22]";

function HeaderLink({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cx(navLinkBase, isActive ? navLinkActive : navLinkIdle)
      }
    >
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
}) {
  const styles =
    variant === "primary"
      ? "bg-[#4A5D4E] text-white shadow-[0_10px_24px_rgba(74,93,78,0.22)] hover:bg-[#3F5143]"
      : "border border-[#E7DED6] bg-white text-[#6B625A] hover:bg-[#FAF7F4] hover:text-[#1F2A22]";

  const disabledStyles = "opacity-50 pointer-events-none cursor-not-allowed";

  return (
    <Link
      to={to}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled ? "true" : "false"}
      tabIndex={disabled ? -1 : 0}
      className={[
        "inline-flex items-center justify-center rounded-[16px] px-4 py-2.5 text-sm font-extrabold transition",
        styles,
        disabled ? disabledStyles : "",
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isLogin = location.pathname === "/login";
  const isRegister = location.pathname === "/register";
  const isOwnerLogin = location.pathname === "/login-owner";
  const isOwnerRegister = location.pathname === "/register-owner";

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
          { to: "/", label: "Головна" },
          { to: "/profile", label: "Мої дані" },
          { to: "/bookings", label: "Мої записи" },
          { to: "/favourites", label: "Улюблені" },
        ],
        actions: (
          <div className="hidden items-center gap-2 md:flex">
            <ButtonLink to="/" variant="secondary" onClick={handleLogout}>
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
            <ButtonLink to="/dashboard/studio" className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.1a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-.4-1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4h-.1a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6c.3 0 .6-.1 1-.4a1.7 1.7 0 0 0 .4-1V3a2 2 0 1 1 4 0v.1c0 .4.1.7.4 1 .4.3.7.4 1 .4.6 0 1.2-.2 1.8-.7l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.5.6-.7 1.2-.7 1.8 0 .3.1.6.4 1 .3.4.6.7 1 .7h.1a2 2 0 1 1 0 4h-.1c-.4 0-.7.1-1 .4-.3.4-.4.7-.4 1z" />
              </svg>
              &nbsp;&nbsp;Керувати студією
            </ButtonLink>
          </div>
        ),
      };
    }

    const ownerAuthScreen = isOwnerLogin || isOwnerRegister;

    return {
      links: [],
      actions: (
        <div className="hidden items-center gap-2 md:flex">
          {ownerAuthScreen ? (
            <ButtonLink
              to="/register-owner"
              variant="primary"
              disabled={isOwnerRegister}
            >
              Зареєструватись
            </ButtonLink>
          ) : (
            <ButtonLink to="/login" variant="primary" disabled={isLogin}>
              Увійти як клієнт
            </ButtonLink>
          )}

          {isLogin || isRegister ? (
            <ButtonLink
              to="/register"
              variant="secondary"
              disabled={isRegister}
            >
              Зареєструватись
            </ButtonLink>
          ) : (
            <ButtonLink
              to="/login-owner"
              variant="secondary"
              disabled={isOwnerLogin}
            >
              Увійти як власник
            </ButtonLink>
          )}
        </div>
      ),
    };
  }, [role, isLogin, isRegister, isOwnerLogin, isOwnerRegister]);

  const mobileItems = useMemo(() => {
    if (role === "client") {
      return {
        title: "Меню",
        subtitle: "Клієнтський режим",
        links: [
          { to: "/", label: "Головна" },
          { to: "/profile", label: "Мої дані" },
          { to: "/bookings", label: "Мої записи" },
          { to: "/favourites", label: "Улюблені" },
        ],
        logout: true,
      };
    }

    if (role === "owner") {
      return {
        title: "Панель керування",
        subtitle: "Кабінет",
        links: [
          { to: "/dashboard", label: "Головна" },
          { to: "/dashboard/studio", label: "Студія" },
          { to: "/dashboard/services", label: "Послуги" },
          { to: "/dashboard/schedule", label: "Графік роботи" },
          { to: "/dashboard/bookings", label: "Записи" },
          { to: "/dashboard/masters", label: "Майстри" },
        ],
        logout: true,
      };
    }

    return {
      title: "Меню",
      subtitle: "Гостьовий режим",
      links: [
        { to: "/login", label: "Я клієнт" },
        { to: "/login-owner", label: "Я власник" },
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
            rounded-[28px]
            border border-[#E9DED2]
            bg-[#FFFCF8]/92
            backdrop-blur-md
            shadow-[0_10px_30px_rgba(93,64,55,0.08)]
          "
        >
          <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-4">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-[18px] px-2 py-1.5 transition hover:bg-[#FAF7F4]"
              aria-label="Planiday"
            >
              <span className="grid h-9 w-9 place-items-center rounded-[18px] bg-[#4A5D4E] text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(74,93,78,0.22)]">
                P
              </span>
              <span className="text-sm font-extrabold tracking-tight text-[#1F2A22] sm:text-base">
                Plani<span className="text-[#C89D72]">Day</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {desktopItems.links?.map((i) => (
                <HeaderLink key={i.to} to={i.to}>
                  {i.label}
                </HeaderLink>
              ))}
            </nav>

            {desktopItems.actions}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-[16px] border border-[#E9DED2] bg-white px-3 py-2 text-sm font-bold text-[#1F2A22] transition hover:bg-[#FAF7F4] md:hidden"
              aria-label="Menu"
              aria-expanded={open}
            >
              {open ? (
                <span className="text-lg leading-none">×</span>
              ) : (
                <span className="text-lg leading-none">≡</span>
              )}
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
            "absolute inset-0 bg-[rgba(32,24,18,0.38)] transition-opacity duration-300",
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
          <div className="rounded-[24px] border border-[#E9DED2] bg-[#FFFCF8] p-4 shadow-[0_20px_60px_rgba(93,64,55,0.14)]">
            <div className="mb-3 border-b border-[#F1E7DE] px-2 pb-[14px] pt-[10px] text-center">
              <div className="inline-flex items-center rounded-full border border-[#E9DED2] bg-[#F8F4EF] px-[10px] py-[6px] text-xs font-extrabold uppercase tracking-[0.12em] text-[#7B6D61]">
                {mobileItems.subtitle || "Кабінет"}
              </div>

              <h2 className="mb-1 mt-[10px] text-[18px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#1F2A22]">
                {mobileItems.title || "Панель керування"}
              </h2>
            </div>

            <nav className="flex flex-col gap-[8px] p-1">
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
                    [
                      "relative flex items-center rounded-[16px] border px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                      isActive
                        ? "border-[#4A5D4E] bg-[#4A5D4E] text-white shadow-[0_10px_22px_rgba(74,93,78,0.18)] before:absolute before:-left-2 before:top-1/2 before:h-[22px] before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-[#4A5D4E]"
                        : "border-transparent bg-transparent text-[#6B625A] hover:border-[#E9DED2] hover:bg-[#FAF7F4] hover:text-[#1F2A22]",
                    ].join(" ")
                  }
                >
                  {i.label}
                </NavLink>
              ))}

              {mobileItems.logout && (
                <div className="mt-3 border-t border-[#E9DED2] pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    className="
                      inline-flex w-full items-center justify-center rounded-[16px] border border-[#F0D6D1]
                      bg-[#FFF3F1] px-4 py-2.5 text-sm font-semibold text-[#B2504A] transition-all duration-150
                      hover:bg-[#FDE8E4]
                      active:translate-y-[1px]
                      focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B2504A]/15
                    "
                  >
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