//Favourites.jsx
import { Link } from "react-router-dom";
import calendarHero from "../assets/calendarHero2.png";
import {
  Bell,
  Grid2X2,
  Heart,
  MapPin,
  Search,
  Star,
  Clock3,
  Scissors,
  Sparkles,
  User,
  Dumbbell,
  Home,
  Car,
  GraduationCap,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFavourites } from "../context/favourites.context";

const R2_PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SectionCard({
  title,
  subtitle,
  badge,
  children,
  className = "",
  headerClassName = "",
  contentClassName = "",
}) {
  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-[15px] border border-[#ebe7df] bg-white transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

      {(title || subtitle || badge) && (
        <div
  className={cn(
    "flex flex-col gap-3 border-b border-[#f1ece5] px-4 py-5 sm:px-5",
    headerClassName,
  )}
>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-[-0.03em] text-[#202020]">
                {title}
              </h2>

              {badge && (
                <span className="inline-flex items-center rounded-full bg-[#fff7f0] px-2.5 py-1 text-xs font-black text-[#ff6200]">
                  {badge}
                </span>
              )}
            </div>

            {subtitle && (
              <p className="mt-1 text-sm font-medium leading-5 text-[#7b766f]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      <div className={cn("p-4 sm:p-5", contentClassName)}>
  {children}
</div>
    </section>
  );
}

function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return R2_PUBLIC ? `${R2_PUBLIC}/${s}` : s;
}

function safeText(v) {
  return String(v ?? "").trim();
}

const CATEGORY_LABELS = {
  hair: "Перукарня",
  barber: "Барбершоп",
  beauty_salon: "Салон краси",
  nails: "Манікюр",
  massage: "Масаж",
  spa: "SPA",
  cosmetology: "Косметологія",
  brows_lashes: "Брови та вії",
  makeup: "Макіяж",
  other: "Інше",
};

const CATEGORY_PILL_ICONS = {
  hair: Scissors,
  barber: Scissors,
  beauty_salon: Heart,
  nails: Grid2X2,
  brows_lashes: Heart,
  cosmetology: Heart,
  makeup: Heart,
  massage: User,
  physiotherapy: User,
  depilation: Heart,
  tattoo_piercing: Grid2X2,
  spa: Heart,
  health: Heart,
  fitness_diet: Dumbbell,
  dentistry: Heart,
  podiatry: User,
  aesthetic_medicine: Heart,
  natural_medicine: Heart,
  psychotherapy: User,
  pets: Heart,
  finance: Grid2X2,
  shopping: Home,
  auto: Car,
  other: GraduationCap,
};

function getCategoryIcon(value) {
  return CATEGORY_PILL_ICONS[safeText(value)] || Grid2X2;
}

function FeaturePill({ active, icon: Icon, children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex h-[32px] min-w-max shrink-0 select-none items-center justify-center gap-1 rounded-[11px] border border-[#f0e7da] bg-white px-2.5 text-[10px] font-bold text-[#77716b] shadow-[0_4px_12px_rgba(15,23,42,0.025)] transition-all duration-200 active:scale-[0.97]",
        "snap-start whitespace-nowrap",
        "sm:h-[34px] sm:gap-1.5 sm:rounded-[12px] sm:px-3 sm:text-[11px]",
        active && "bg-[#fff3e9] text-[#ff6200]",
        className,
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0 transition-colors duration-200 sm:h-[12px] sm:w-[12px]",
          active
            ? "text-[#ff6200]"
            : "text-[#8b8794] group-hover:text-[#ff6200]",
        )}
      />

      {children}
    </button>
  );
}

function CategoryFilterSelect({
  label,
  value,
  options = [],
  open,
  setOpen,
  onChange,
  selectRef,
}) {
  const [dropDirection, setDropDirection] = useState("bottom");
const [dropdownStyle, setDropdownStyle] = useState({});
const updateDropdownPosition = useCallback(() => {
  const rect = selectRef.current?.getBoundingClientRect();

  if (!rect) return;

  const dropdownHeight = Math.min(280, options.length * 54 + 16);
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;

  const direction =
    spaceBelow < dropdownHeight && spaceAbove > spaceBelow
      ? "top"
      : "bottom";

  setDropDirection(direction);

  setDropdownStyle({
    left: rect.left,
    width: rect.width,
    ...(direction === "top"
      ? {
          top: "auto",
          bottom: window.innerHeight - rect.top + 8,
        }
      : {
          top: rect.bottom + 8,
          bottom: "auto",
        }),
  });
}, [options.length, selectRef]);
  const selected = options.find((item) => item.key === value) || options[0];
  const SelectedIcon = selected?.icon || Grid2X2;

function handleToggle() {
  const nextOpen = !open;

  if (nextOpen) {
    updateDropdownPosition();
  }

  setOpen(nextOpen);
}

useEffect(() => {
  if (!open) return;

  function handlePositionUpdate() {
    updateDropdownPosition();
  }

  window.addEventListener("scroll", handlePositionUpdate, true);
  window.addEventListener("resize", handlePositionUpdate);

  return () => {
    window.removeEventListener("scroll", handlePositionUpdate, true);
    window.removeEventListener("resize", handlePositionUpdate);
  };
}, [open, updateDropdownPosition]);

  return (
    <div ref={selectRef} className="relative min-w-0 w-full">
      <button
        type="button"
        onClick={handleToggle}
className={cn(
  "inline-flex h-12 w-full items-center justify-between gap-3 rounded-[20px] border bg-white px-3 text-left transition-all duration-200 max-[639px]:h-10 max-[639px]:rounded-[14px] max-[639px]:px-2.5",
  open
    ? "border-[#d8c7b6] bg-[#fbfaf8] ring-4 ring-[#eadfce]/35"
    : "border-[#eadfce] hover:border-[#d8c7b6] hover:bg-[#fbfaf8]",
)}
      >
        <span className="flex min-w-0 items-center gap-2">
<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#eadfce] bg-[#f7f5f1] text-[#ff6200] max-[639px]:h-7 max-[639px]:w-7 max-[639px]:rounded-[10px]">
  <SelectedIcon className="h-4 w-4 max-[639px]:h-3.5 max-[639px]:w-3.5" />
</span>

          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#aaa19a] max-[639px]:hidden">
              {label}
            </span>

            <span className="block truncate text-sm font-black text-[#202020] max-[639px]:text-[11px]">
              {selected?.label || "Категорія"}
            </span>
          </span>
        </span>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#77716b] transition-transform duration-200 max-[639px]:h-3.5 max-[639px]:w-3.5",
            open && "rotate-180 text-[#ff6200]",
          )}
        />
      </button>

{open && (
  <div
    className={cn(
      "fixed z-[9999] max-h-[280px] overflow-y-auto rounded-[18px] border border-[#eadfce] bg-white py-2 shadow-[0_18px_42px_rgba(15,23,42,0.14)]",
      dropDirection === "top" ? "translate-y-[-8px]" : "translate-y-[8px]",
    )}
    style={dropdownStyle}
  >
          {options.map((item) => {
            const active = item.key === value;
            const Icon = item.icon || Grid2X2;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onChange(item.key);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-all duration-200",
active
  ? "bg-[#fbfaf8] text-[#202020]"
  : "text-[#202020] hover:bg-[#fbfaf8]",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-200",
active
  ? "border-[#ff6200] bg-[#ff6200] text-white"
  : "border-[#eadfce] bg-[#f7f5f1] text-[#77716b]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="truncate text-sm font-black">
                    {item.label}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2">
                  {typeof item.count === "number" && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-black",
                        active
                          ? "bg-white text-[#ff6200]"
                          : "bg-[#fff1e8] text-[#ff6200]",
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getCategoryLabel(value) {
  const key = String(value || "").trim();
  return CATEGORY_LABELS[key] || key || "Студія";
}

const DAY_KEYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function minutesToTime(total) {
  const h = Math.floor(Number(total || 0) / 60);
  const m = Number(total || 0) % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDateLocal(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getStudioOpenStatus(studio) {
  const now = new Date();
  const todayIso = formatDateLocal(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const exception = studio.scheduleExceptions?.find(
    (item) => String(item.date).slice(0, 10) === todayIso,
  );

  let day = null;

  if (exception) {
    if (!exception.enabled) {
      return {
        isOpen: false,
        text: "Сьогодні зачинено",
      };
    }

    day = exception;
  } else {
    const todayKey = DAY_KEYS[now.getDay()];
    day = studio.scheduleDays?.find((item) => item.day === todayKey);
  }

  if (!day?.enabled) {
    return {
      isOpen: false,
      text: "Сьогодні зачинено",
    };
  }

  const startMin = Number(day.startMin || 0);
  const endMin = Number(day.endMin || 0);

  if (nowMin >= startMin && nowMin < endMin) {
    return {
      isOpen: true,
      text: `Відкрито до ${minutesToTime(endMin)}`,
    };
  }

  if (nowMin < startMin) {
    return {
      isOpen: false,
      text: `Відкриється о ${minutesToTime(startMin)}`,
    };
  }

return {
  isOpen: false,
  text: "Сьогодні зачинено",
};
}

function FavouriteCard({ studio, toggleFavourite }) {
  const coverUrl = toPublicUrl(studio.coverUrl);
  const name = safeText(studio.name) || "Студія";
  const city = safeText(studio.city);
  const category = safeText(studio.category);
  const CategoryIcon = getCategoryIcon(category);
  const address = [studio?.street, studio?.building].filter(Boolean).join(", ");
  const fullAddress = [city, address].filter(Boolean).join(", ");
const openStatus = getStudioOpenStatus(studio);

  return (
    <Link
      to={`/${studio.slug}`}
      className="group grid grid-cols-[88px_1fr_auto] gap-3 rounded-[24px] border border-[#f0e7da] bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.06)] transition active:scale-[0.99] sm:grid-cols-[150px_1fr_auto] sm:p-4 lg:hover:-translate-y-1"
    >
      <div className="my-auto h-[88px] overflow-hidden rounded-[16px] bg-[#f4f0ea] sm:h-[132px] sm:rounded-[20px]">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs font-bold text-stone-400">
            Фото
          </div>
        )}
      </div>

      <div className="min-w-0 py-1">
        <h2 className="truncate text-[17px] font-black tracking-[-0.03em] text-[#202020] sm:text-xl">
          {name}
        </h2>

        {fullAddress && (
          <div className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-stone-500 sm:text-sm">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{fullAddress}</span>
          </div>
        )}

<div
  className={cn(
    "inline-flex items-center gap-1 text-[10px] font-bold sm:mt-2 sm:h-[30px] sm:gap-1.5 sm:rounded-[11px] sm:border sm:px-2.5 sm:shadow-[0_4px_12px_rgba(15,23,42,0.025)]",
openStatus.isOpen
  ? "text-emerald-700 sm:border-emerald-100 sm:bg-emerald-50"
  : "text-[#8b8794] sm:border-[#f0e7da] sm:bg-[#f8f6f3]"
  )}
>
{openStatus.isOpen ? (
  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
) : (
  <XCircle className="h-3.5 w-3.5 text-[#b0aba5]" />
)}

  {openStatus.text}
</div>

<div className="mt-3 flex flex-wrap gap-2">
<div className="inline-flex h-[30px] items-center gap-1.5 rounded-[11px] border border-[#f0e7da] bg-white px-2.5 text-[10px] font-bold text-[#77716b] shadow-[0_4px_12px_rgba(15,23,42,0.025)]">
  {React.createElement(CategoryIcon, {
    className: "h-3.5 w-3.5 text-[#ff6200]",
  })}
  {getCategoryLabel(category)}
</div>

  <div className="hidden h-[30px] items-center gap-1.5 rounded-[11px] border border-[#f0e7da] bg-white px-2.5 text-[10px] font-bold text-[#77716b] shadow-[0_4px_12px_rgba(15,23,42,0.025)] sm:inline-flex">
    <Clock3 className="h-3.5 w-3.5 text-[#ff6200]" />
    Онлайн запис
  </div>
</div>
      </div>

      <div className="flex flex-col items-end justify-between py-1">
        <div className="flex items-center gap-1 text-[13px] font-black text-[#202020]">
          <Star className="h-4 w-4 fill-[#ff8a00] text-[#ff8a00]" />
          4.9
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavourite(studio);
          }}
          className="grid h-12 w-12 place-items-center  text-[#ff6200]  transition hover:scale-115 active:scale-95"
        >
          <Heart className="h-6 w-6 fill-[#ff6200] text-[#ff6200]" />
        </button>
      </div>
    </Link>
  );
}

const heroImageBoxClass =
  "pointer-events-none absolute z-0 " +
  "max-[639px]:right-[0px] max-[639px]:top-[0px] max-[639px]:h-[150px] max-[639px]:w-[240px] " +
  "sm:right-[0px] sm:top-[-5px] sm:h-[160px] sm:w-[268px] " +
  "md:right-[10px] md:top-[-10px] md:h-[180px] md:w-[320px] " +
  "lg:right-[10px] lg:top-[-10px] lg:h-[200px] lg:w-[340px]";

const heroImageClass =
  "h-full w-full object-contain object-right";


export default function Favourites() {
  const { favourites = [], toggleFavourite, loading } = useFavourites();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
const categoryFilterRef = useRef(null);
const categories = useMemo(() => {
  const map = new Map();

  favourites.forEach((studio) => {
    const category = safeText(studio.category);
    if (!category) return;

    map.set(category, (map.get(category) || 0) + 1);
  });

  return Array.from(map.entries()).map(([category, count]) => ({
    key: category,
    label: getCategoryLabel(category),
    icon: getCategoryIcon(category),
    count,
  }));
}, [favourites]);

const categoryOptions = useMemo(() => {
  return [
    {
      key: "all",
      label: "Усі студії",
      icon: Grid2X2,
      count: favourites.length,
    },
    ...categories,
  ];
}, [categories, favourites.length]);

  useEffect(() => {
  if (!categoryFilterOpen) return;

  function handleClickOutside(e) {
    if (
      categoryFilterRef.current &&
      !categoryFilterRef.current.contains(e.target)
    ) {
      setCategoryFilterOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [categoryFilterOpen]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    return favourites.filter((s) => {
      const matchesQuery =
        !q ||
        [s.name, s.city, s.street, getCategoryLabel(s.category)]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesCategory =
        activeCategory === "all" || s.category === activeCategory;

      return matchesQuery && matchesCategory;
    });
  }, [favourites, query, activeCategory]);
const totalFavourites = favourites.length;
const hasSearch = query.trim().length > 0;
const hasCategoryFilter = activeCategory !== "all";
const hasActiveFilters = hasSearch || hasCategoryFilter;
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5f1] px-4 pt-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-56 rounded-[36px] bg-white" />
          <div className="h-16 rounded-[28px] bg-white" />
          <div className="h-36 rounded-[28px] bg-white" />
          <div className="h-36 rounded-[28px] bg-white" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+88px)] sm:pb-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 sm:pt-18 lg:px-8">


<section className="relative mb-5 mt-3 border border-[#eadfce] overflow-hidden max-[639px]:rounded-[26px] bg-white px-5 py-7 sm:rounded-[34px] sm:px-8 sm:py-9 lg:px-10">
  <div className={cn(heroImageBoxClass, "mask-hero-image")}>
  <img
    src={calendarHero}
    alt=""
    aria-hidden="true"
    className={heroImageClass}
  />
</div>

<div className="relative z-10 max-w-[760px]">
  <h1
    className="
      flex flex-wrap items-end gap-x-3
      text-[#202020] font-black tracking-[-0.06em] leading-[0.9]

      sm:text-[48px]
      md:text-[58px]
      lg:text-[68px]

      max-[639px]:block
      max-[639px]:max-w-[220px]
      max-[639px]:text-[34px]
    "
  >
    <span className="block">Улюблені</span>

    <span className="block text-[#ff6200]">
      студії
    </span>
  </h1>

  <p
    className="
      font-medium text-[#7a7d87]

      sm:mt-4 sm:max-w-[360px] sm:text-[14px]
      md:max-w-[420px] md:text-[15px]
      lg:max-w-[520px] lg:text-[16px]

      max-[639px]:mt-3
      max-[639px]:max-w-[220px]
      max-[639px]:text-[11px]
    "
  >
    Студії, які ви додали до обраного
  </p>
</div>

  </section>

<SectionCard
  className="
    max-[639px]:overflow-visible
    max-[639px]:rounded-none
    max-[639px]:border-0
    max-[639px]:bg-transparent
    max-[639px]:shadow-none
    max-[639px]:hover:shadow-none
    max-[639px]:[&>div:first-child]:hidden
  "
  headerClassName="max-[639px]:hidden"
  contentClassName="max-[639px]:p-0"
  title={
    <div className="hidden items-center gap-3 sm:flex">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ff6200] text-white">
        <Heart className="h-5 w-5 fill-white" />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black tracking-[-0.03em] text-[#202020]">
            Улюблені студії
          </h2>

          <span className="inline-flex items-center rounded-full bg-[#fff7f0] px-2.5 py-1 text-xs font-black text-[#ff6200]">
            {filtered.length}
          </span>
        </div>

        <p className="mt-1 text-sm font-medium text-[#7b766f]">
          Переглядайте збережені студії та швидко знаходьте потрібну.
        </p>
      </div>
    </div>
  }
>
  {hasCategoryFilter && (
    <div className="mb-4 hidden flex-wrap items-center gap-2 sm:flex">

      <span className="inline-flex items-center gap-2 rounded-full border border-[#ffd6bd] bg-[#fffaf6] px-3 py-1.5 text-xs font-black text-[#ff6200]">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#fff1e8] text-[#ff6200]">
          {React.createElement(getCategoryIcon(activeCategory), {
            className: "h-3.5 w-3.5",
          })}
        </span>

        {getCategoryLabel(activeCategory)}

        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className="-mr-1 grid h-5 w-5 place-items-center rounded-full text-[#ff6200] transition hover:bg-[#fff1e8] active:scale-95"
          aria-label="Очистити фільтр категорії"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  )}

  {totalFavourites === 0 ? (
    <div className="rounded-[15px] border-2 border-dashed border-[#ffd6bd] bg-[#fff7f0] px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#ff6200]">
        <Heart className="h-7 w-7" />
      </div>

      <h2 className="mt-4 text-xl font-black text-[#202020]">
        Поки що немає улюблених студій
      </h2>

      <p className="mt-2 text-sm text-[#77716b]">
        Додавайте студії в обране, щоб швидко знаходити їх тут.
      </p>
    </div>
  ) : filtered.length === 0 ? (
    <div className="rounded-[15px] border-2 border-dashed border-[#ffd6bd] bg-[#fff7f0] px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#ff6200]">
        <Search className="h-7 w-7" />
      </div>

      <h2 className="mt-4 text-xl font-black text-[#202020]">
        Нічого не знайдено
      </h2>

      <p className="mt-2 text-sm text-[#77716b]">
        {hasSearch ? (
          <>
            За запитом{" "}
            <span className="font-black text-[#202020]">
              "{query}"
            </span>{" "}
            не знайдено жодної студії.
          </>
        ) : hasCategoryFilter ? (
          <>
            У категорії{" "}
            <span className="font-black text-[#202020]">
              "{getCategoryLabel(activeCategory)}"
            </span>{" "}
            немає улюблених студій.
          </>
        ) : (
          "Спробуйте змінити пошук або фільтр категорії."
        )}
      </p>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setActiveCategory("all");
          }}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl bg-[#ff6200] px-4 text-sm font-black text-white transition hover:bg-[#f25c00] active:scale-[0.98]"
        >
          Очистити фільтри
        </button>
      )}
    </div>
  ) : (
    <>
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        {filtered.map((studio) => (
          <FavouriteCard
            key={studio.slug}
            studio={studio}
            toggleFavourite={toggleFavourite}
          />
        ))}
      </div>

      <p className="mt-6 mb-2 hidden text-sm font-medium text-[#6b7280] sm:block">
        Показано {filtered.length} з {totalFavourites} улюблених студій
      </p>
    </>
  )}
</SectionCard>

      </div>
    </main>
  );
}