import { Link } from "react-router-dom";
import calendarHero from "../assets/calendarHero2.png";
import {
  Bell,
  Grid2X2,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Clock3,
  Scissors,
  User,
  Dumbbell,
  Home,
  Car,
  GraduationCap,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useFavourites } from "../context/favourites.context";

const R2_PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
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
      className="group grid grid-cols-[112px_1fr_auto] gap-3 rounded-[24px] bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.06)] transition active:scale-[0.99] sm:grid-cols-[150px_1fr_auto] sm:p-4 lg:hover:-translate-y-1"
    >
      <div className="my-auto h-[112px] overflow-hidden rounded-[20px] bg-[#f4f0ea] sm:h-[132px]">
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
<div className="inline-flex h-[30px] items-center gap-1.5 rounded-[11px] border border-[#f0e7da] bg-[#fff3e9] px-2.5 text-[10px] font-bold text-[#ff6200] shadow-[0_4px_12px_rgba(15,23,42,0.025)]">
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

  const categories = useMemo(() => {
    const unique = [...new Set(favourites.map((s) => s.category).filter(Boolean))];
    return unique.slice(0, 8);
  }, [favourites]);

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
    <main className="min-h-screen bg-[#f7f5f1] pb-[calc(env(safe-area-inset-bottom)+88px)] sm:pb-10">
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8 lg:px-8">


<section className="relative mb-5 mt-15 overflow-hidden max-[639px]:rounded-[26px] bg-[#f3eee7] px-5 py-7 sm:rounded-[34px] sm:px-8 sm:py-9 lg:px-10">
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

<section className="mb-5 rounded-[24px] bg-white p-2 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
  <div className="flex items-center gap-2">
    <Search className="ml-2 h-4 w-4 shrink-0 text-stone-400" />

    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Пошук улюблених студій"
      className="h-10 min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-[#202020] outline-none placeholder:text-stone-400 sm:h-11 sm:text-sm"
    />

    <button className="flex h-10 shrink-0 items-center gap-2 rounded-[18px] bg-[#f7f5f1] px-3 text-[12px] font-black text-[#202020] transition hover:bg-[#fff1e8] hover:text-[#ff6200] sm:h-11 sm:px-4 sm:text-sm">
      <SlidersHorizontal className="h-3.5 w-3.5" />
      <span className="hidden xs:inline">Фільтри</span>
    </button>
  </div>
</section>

<div className="relative mb-6">
  <div className="-mx-4 overflow-x-auto overflow-y-hidden px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden">
    <div className="flex w-max min-w-full touch-pan-x snap-x snap-mandatory flex-nowrap gap-2.5 scroll-smooth sm:gap-4">
      <FeaturePill
        active={activeCategory === "all"}
        icon={Grid2X2}
        onClick={() => setActiveCategory("all")}
      >
        Усі студії
      </FeaturePill>

      {categories.map((cat) => (
        <FeaturePill
          key={cat}
          active={activeCategory === cat}
          icon={getCategoryIcon(cat)}
          onClick={() => setActiveCategory(cat)}
        >
          {getCategoryLabel(cat)}
        </FeaturePill>
      ))}
    </div>
  </div>
</div>

<div className="mb-4 flex items-center justify-between">
  <p className="text-sm font-black text-[#202020]">
    {filtered.length} улюблених студій
  </p>

</div>

        {filtered.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((studio) => (
              <FavouriteCard
                key={studio.slug}
                studio={studio}
                toggleFavourite={toggleFavourite}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] bg-white px-6 py-12 text-center shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            <Heart className="mx-auto h-12 w-12 text-[#ff6200]" />
            <h2 className="mt-4 text-xl font-black text-[#202020]">
              Поки що немає улюблених
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Додайте студії в обране, щоб швидко знаходити їх тут.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}