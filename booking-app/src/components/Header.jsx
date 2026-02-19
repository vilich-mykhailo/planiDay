import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function useRole() {
  const [params] = useSearchParams();

  return useMemo(() => {
    const q = params.get("role");
    if (q === "client" || q === "owner") return q;

    const ls = localStorage.getItem("role");
    if (ls === "client" || ls === "owner") return ls;

    return "guest"; // guest | client | owner
  }, [params]);
}

const navLinkBase = "rounded-xl px-3 py-2 text-sm font-semibold transition";
const navLinkActive = "bg-gray-900 text-white";
const navLinkIdle = "text-gray-700 hover:bg-gray-50";

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

function ButtonLink({ to, variant = "primary", children, onClick, disabled }) {
  const styles =
    variant === "primary"
      ? "bg-black text-white hover:bg-gray-900"
      : "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50";

  const disabledStyles = "opacity-50 pointer-events-none cursor-not-allowed";

  return (
    <Link
      to={to}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled ? "true" : "false"}
      tabIndex={disabled ? -1 : 0}
      className={[
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-extrabold transition",
        styles,
        disabled ? disabledStyles : "",
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

  // блокування скролу при моб. меню
  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", open);
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  const desktopItems = useMemo(() => {
    // CLIENT MODE (як було)
    if (role === "client") {
      return {
        links: [],
        actions: (
          <div className="hidden md:flex items-center gap-2">
            <ButtonLink to="/register" variant="primary" disabled={isRegister}>
              Зареєструватись
            </ButtonLink>
          </div>
        ),
      };
    }

    // OWNER MODE (опціонально — якщо ти реально логіниш owner)
    if (role === "owner") {
      return {
        links: [],
        actions: (
          <div className="hidden md:flex items-center gap-2">
            <ButtonLink to="/create-studio" variant="primary">
              Додати салон
            </ButtonLink>
          </div>
        ),
      };
    }

    // GUEST MODE
    // Особливий режим: коли на сторінці /login-owner або /register-owner
    const ownerAuthScreen = isOwnerLogin || isOwnerRegister;

    return {
      links: [],
      actions: (
        <div className="hidden md:flex items-center gap-2">
          {/* LEFT BUTTON */}
          {ownerAuthScreen ? (
            // замість "Увійти як клієнт" показуємо реєстрацію власника
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

          {/* RIGHT BUTTON */}
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
        links: [
          {
            to: "/register",

            label: "Зареєструватись",
          },
        ],
      };
    }

    if (role === "owner") {
      return {
        links: [
          {
            to: "/create-studio",
            label: "Додати салон",
          },
        ],
      };
    }

    return {
      links: [
        {
          to: "/login",
          label: "Я клієнт",
        },
        {
          to: "/login-owner",
          label: "Я власник",
        },
      ],
    };
  }, [role]);

  return (
    <header className="sticky top-0 z-[60] border-a border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Brand */}
          <Link
            to="/studios"
            className="flex items-center gap-2 rounded-2xl px-2 py-1.5 hover:bg-gray-50 transition"
            aria-label="Planiday"
          >
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-black text-white text-sm font-extrabold">
              P
            </span>
            <span className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">
              Plani<span className="text-blue-600">Day</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {desktopItems.links?.map((i) => (
              <HeaderLink key={i.to} to={i.to}>
                {i.label}
              </HeaderLink>
            ))}
          </nav>

          {/* Desktop actions */}
          {desktopItems.actions}

          {/* Mobile burger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50 transition"
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

{/* Mobile sheet (premium) */}
<div
  className={cx(
    "md:hidden fixed inset-0 z-[70]",
    open ? "pointer-events-auto" : "pointer-events-none"
  )}
  aria-hidden={!open}
>
  {/* Backdrop */}
  <div
    className={cx(
      "absolute inset-0 bg-black/40 transition-opacity duration-300",
      open ? "opacity-100" : "opacity-0"
    )}
    onClick={() => setOpen(false)}
  />

  {/* Panel */}
<div
  className={cx(
    "absolute right-0 top-0 h-full",
    "w-[84%] max-w-[320px]",
    "bg-white border-l border-gray-200",
    "transition-transform duration-300 ease-out",
    open ? "translate-x-0" : "translate-x-full"
  )}
    role="dialog"
    aria-modal="true"
  >
    {/* Panel header */}
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-gray-900 leading-5">
            Меню
          </p>
          <p className="mt-0.5 text-xs text-gray-600">
            {role === "client"
              ? "Клієнтський режим"
              : role === "owner"
              ? "Режим власника"
              : "Гостьовий режим"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 transition"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6l-12 12"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>

    {/* Content */}
    <div className="px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
        Навігація
      </p>

      <div className="mt-3 space-y-2">
        {mobileItems.links.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cx(
                "group flex items-center justify-between rounded-2xl border px-4 py-3",
                "text-sm font-extrabold transition",
                isActive
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
              )
            }
          >
            <span className="truncate">{i.label}</span>

            <span className="ml-3 grid h-9 w-9 place-items-center rounded-2xl border border-gray-200 bg-white/70 text-gray-700 transition group-hover:bg-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </NavLink>
        ))}
      </div>

      {/* Spacer so content doesn't hide behind CTA */}
      <div className="h-24" />
    </div>

    {/* Bottom CTA */}
    <div className="absolute inset-x-0 bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur">
      <div className="px-4 py-4">
        {role === "client" ? (
          <ButtonLink to="/studios" variant="primary" onClick={() => setOpen(false)}>
            Записатися зараз
          </ButtonLink>
        ) : role === "owner" ? (
          <ButtonLink to="/studio/settings" variant="primary" onClick={() => setOpen(false)}>
            Налаштувати салон
          </ButtonLink>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <ButtonLink to="/login" variant="secondary" onClick={() => setOpen(false)}>
              Клієнт
            </ButtonLink>
            <ButtonLink to="/login-owner" variant="primary" onClick={() => setOpen(false)}>
              Власник
            </ButtonLink>
          </div>
        )}

        <p className="mt-3 text-center text-[11px] text-gray-500">
          Натисни поза панеллю, щоб закрити
        </p>
      </div>
    </div>
  </div>
</div>

    </header>
  );
}
