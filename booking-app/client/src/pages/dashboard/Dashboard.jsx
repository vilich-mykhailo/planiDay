import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const linkClass = ({ isActive }) =>
  [
    "relative flex items-center rounded-[16px] border px-3 py-2.5 text-sm font-semibold transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4A5D4E]/15",
    isActive
      ? "border-[#4A5D4E] bg-[#4A5D4E] text-white shadow-[0_10px_22px_rgba(74,93,78,0.18)] before:absolute before:-left-2 before:top-1/2 before:h-[22px] before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-[#4A5D4E]"
      : "border-transparent bg-transparent text-[#6B625A] hover:-translate-y-[1px] hover:border-[#E9DED2] hover:bg-[#FAF7F4] hover:text-[#1F2A22] hover:shadow-[0_1px_0_rgba(93,64,55,0.05)]",
  ].join(" ");

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gray-200/80 ${className}`}
      aria-hidden="true"
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-24 md:pt-22">
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
        <aside
          className="
            hidden md:block
            relative top-auto h-fit rounded-[18px] border border-gray-200 bg-white p-4
            shadow-[0_1px_2px_rgba(16,24,40,0.06),0_10px_26px_rgba(16,24,40,0.08)]
            md:sticky md:top-[88px]
          "
        >
          <div className="mb-3 border-b border-slate-100 px-2 pb-[14px] pt-[10px] text-center">
            <SkeletonBlock className="mx-auto h-7 w-20 rounded-full" />
            <SkeletonBlock className="mx-auto mt-[10px] h-6 w-36 rounded-xl" />
          </div>

          <nav className="flex flex-col gap-[6px] p-1">
            <SkeletonBlock className="h-11 w-full rounded-[14px]" />
            <SkeletonBlock className="h-11 w-full rounded-[14px]" />
            <SkeletonBlock className="h-11 w-full rounded-[14px]" />
            <SkeletonBlock className="h-11 w-full rounded-[14px]" />
            <SkeletonBlock className="h-11 w-full rounded-[14px]" />
            <SkeletonBlock className="h-11 w-full rounded-[14px]" />

            <div className="mt-3 border-t border-gray-200 pt-3">
              <SkeletonBlock className="h-11 w-full rounded-xl" />
            </div>
          </nav>
        </aside>

        <section
          className="
            min-h-[200px] rounded-[18px] border border-gray-200 bg-white p-6
            shadow-[0_1px_2px_rgba(16,24,40,0.06),0_12px_28px_rgba(16,24,40,0.08)]
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
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login-owner", { replace: true });
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login-owner", { replace: true });
  };

  if (!token) {
    return <DashboardSkeleton />;
  }

  return (
   <div className="mx-auto max-w-6xl px-4 pt-24 md:pt-22">
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
<aside
  className="
    hidden md:block
    relative top-auto h-fit rounded-[18px] border border-gray-200 bg-white p-4
    shadow-[0_1px_2px_rgba(16,24,40,0.06),0_10px_26px_rgba(16,24,40,0.08)]
    md:sticky md:top-[88px]
  "
>
<div className="mb-3 border-b border-[#F1E7DE] px-2 pb-[14px] pt-[10px] text-center">
  <div className="inline-flex items-center rounded-full border border-[#E9DED2] bg-[#F8F4EF] px-[10px] py-[6px] text-xs font-extrabold uppercase tracking-[0.12em] text-[#7B6D61]">
    Кабінет
  </div>

  <h2 className="mt-[8px] mb-1 text-[18px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#1F2A22]">
    Панель керування
  </h2>
</div>

         <nav className="flex flex-col gap-[2px] p-1">
            <NavLink to="/dashboard" end className={linkClass}>
              Головна
            </NavLink>

            <NavLink to="/dashboard/studio" className={linkClass}>
              Студія
            </NavLink>

            <NavLink to="/dashboard/services" className={linkClass}>
              Послуги
            </NavLink>

            <NavLink to="/dashboard/schedule" className={linkClass}>
              Графік роботи
            </NavLink>

            <NavLink to="/dashboard/bookings" className={linkClass}>
              Записи
            </NavLink>

            <NavLink to="/dashboard/masters" className={linkClass}>
              Майстри
            </NavLink>

<div className="mt-3 border-t border-[#E9DED2] pt-3">
  <button
    type="button"
    onClick={handleLogout}
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
          </nav>
        </aside>

        <section
          className="
            min-h-[200px] rounded-[18px] border border-gray-200 bg-white p-6
            shadow-[0_1px_2px_rgba(16,24,40,0.06),0_12px_28px_rgba(16,24,40,0.08)]
          "
        >
          <Outlet />
        </section>
      </div>
    </div>
  );
}