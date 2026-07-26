import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import calendarHero from "../assets/calendarHero1.png";
import {
  Bell,
  CalendarDays,
  Car,
  Dumbbell,
  GraduationCap,
  Grid2X2,
  Heart,
  Home,
  House,
  MapPin,
  Search,
  Scissors,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  ChevronLeft,
  ChevronRight,
  User,
  Zap,
  X,
  Crown,
  Sparkles,
  Hand,
  Eye,
  BrushCleaning,
  HandHeart,
  Activity,
  Gem,
  Waves,
  HeartPulse,
  Smile,
  Footprints,
  Syringe,
  Leaf,
  Brain,
  PawPrint,
  Wallet,
  ShoppingBag,
  HeartHandshake,
  Brush,
  FunnelX,
} from "lucide-react";
import AnimatedDropdown from "../components/AnimatedDropdown";
import FavouriteButton from "../components/FavouriteButton";

function safeText(v) {
  return String(v ?? "").trim();
}

function formatStreetForDisplay(value) {
  const street = String(value || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!street) return "";

  const prefixRules = [
    [/^(?:вулиця|вул\.?)\s*/iu, "вул. "],
    [/^(?:проспект|просп\.?|пр-т)\s*/iu, "просп. "],
    [/^(?:провулок|пров\.?)\s*/iu, "пров. "],
    [/^(?:бульвар|бул\.?)\s*/iu, "бул. "],
    [/^(?:площа|пл\.?)\s*/iu, "пл. "],
    [/^(?:набережна|наб\.?)\s*/iu, "наб. "],
    [/^(?:узвіз|узв\.?)\s*/iu, "узв. "],
    [/^(?:проїзд|пр-д)\s*/iu, "пр-д "],
    [/^(?:алея|ал\.?)\s*/iu, "ал. "],
    [/^(?:шосе)\s*/iu, "шосе "],
    [/^(?:майдан)\s*/iu, "майдан "],
    [/^(?:дорога)\s*/iu, "дорога "],
    [/^(?:тупик)\s*/iu, "тупик "],
  ];

  for (const [pattern, replacement] of prefixRules) {
    if (pattern.test(street)) {
      return street.replace(pattern, replacement).trim();
    }
  }

  const suffixRules = [
    [/^(.+?)\s+(?:вулиця|вул\.?)$/iu, "вул. $1"],
    [/^(.+?)\s+(?:проспект|просп\.?|пр-т)$/iu, "просп. $1"],
    [/^(.+?)\s+(?:провулок|пров\.?)$/iu, "пров. $1"],
    [/^(.+?)\s+(?:бульвар|бул\.?)$/iu, "бул. $1"],
    [/^(.+?)\s+(?:площа|пл\.?)$/iu, "пл. $1"],
    [/^(.+?)\s+(?:набережна|наб\.?)$/iu, "наб. $1"],
    [/^(.+?)\s+(?:узвіз|узв\.?)$/iu, "узв. $1"],
    [/^(.+?)\s+(?:проїзд|пр-д)$/iu, "пр-д $1"],
    [/^(.+?)\s+(?:алея|ал\.?)$/iu, "ал. $1"],
  ];

  for (const [pattern, replacement] of suffixRules) {
    if (pattern.test(street)) {
      return street.replace(pattern, replacement).trim();
    }
  }

  return street;
}

const R2_PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

const CATEGORY_LABELS = {
  hair: "Перукарня",
  barber: "Барбершоп",
  beauty_salon: "Салон краси",
  nails: "Манікюр і педикюр",
  brows_lashes: "Брови та вії",
  cosmetology: "Косметологія",
  makeup: "Макіяж",
  massage: "Масаж",
  physiotherapy: "Фізіотерапія",
  depilation: "Депіляція",
  tattoo_piercing: "Тату і пірсинг",
  spa: "SPA і wellness",
  health: "Здоровʼя",
  fitness_diet: "Тренування і дієта",
  dentistry: "Стоматологія",
  podiatry: "Подологія",
  aesthetic_medicine: "Естетична медицина",
  natural_medicine: "Натуральна медицина",
  psychotherapy: "Психотерапія",
  pets: "Тварини",
  finance: "Фінансові послуги",
  shopping: "Покупки",
  auto: "Автосервіс",
  other: "Інше",
};

const CITY_TO_REGION = {
  Луцьк: "Волинська область",
  Львів: "Львівська область",
  Київ: "Київська область",
  Рівне: "Рівненська область",
  Тернопіль: "Тернопільська область",
  ІваноФранківськ: "Івано-Франківська область",
  Ужгород: "Закарпатська область",
  Чернівці: "Чернівецька область",
  Вінниця: "Вінницька область",
  Житомир: "Житомирська область",
  Хмельницький: "Хмельницька область",
  Черкаси: "Черкаська область",
  Кропивницький: "Кіровоградська область",
  Полтава: "Полтавська область",
  Суми: "Сумська область",
  Чернігів: "Чернігівська область",
  Харків: "Харківська область",
  Дніпро: "Дніпропетровська область",
  Запоріжжя: "Запорізька область",
  Миколаїв: "Миколаївська область",
  Одеса: "Одеська область",
  Херсон: "Херсонська область",
  Донецьк: "Донецька область",
  Луганськ: "Луганська область",
  Сімферополь: "АР Крим",
};

const QUERY_EXPAND = {
  стрижк: [
    "стрижка",
    "стрижки",
    "перукар",
    "перукарня",
    "барбер",
    "укладка",
    "фарбування",
    "haircut",
  ],
  перукар: ["стриж", "уклад", "фарб", "перукарня"],
  барбер: ["стриж", "barber", "barbershop"],
  манік: [
    "нігт",
    "гель",
    "лак",
    "покрит",
    "shellac",
    "шелак",
    "френч",
    "салон краси",
    "нейл",
  ],
  педик: ["нігт", "стоп", "покрит", "педикюр"],
  масаж: ["спин", "шия", "комірц", "ноги", "стоп", "релакс", "massage"],
  спин: ["масаж", "спина"],
  шия: ["масаж", "комірц"],
  стоп: ["масаж", "педик"],
  ног: ["масаж", "педик"],
  бров: ["корекц", "архітект", "ламін", "фарб", "brows"],
  вії: ["нарощ", "ламін", "lash", "lashes"],
  косметолог: ["чистк", "пілінг", "догляд", "маск", "facial", "skincare"],
  пілінг: ["косметолог", "догляд"],
  чистк: ["косметолог", "догляд"],
  спа: ["spa", "wellness", "обгорт", "хамам", "сауна", "релакс"],
  spa: ["спа", "wellness", "обгорт", "хамам", "сауна", "релакс"],
  уклад: ["зачіска", "волосся", "перукар", "стайлінг"],
  фарб: ["волосся", "колорист", "тонування", "балаяж", "мелірування"],
  зачіск: ["укладка", "волосся", "перукар", "стрижка"],
  нігт: ["манікюр", "педикюр", "нейл", "покриття", "салон краси"],
  нейл: ["манікюр", "педикюр", "нігті", "nails", "салон краси"],
  макіяж: ["візаж", "мейкап", "makeup", "салон краси"],
  візаж: ["макіяж", "мейкап", "makeup", "салон краси"],
  депіл: ["епіляція", "шугаринг", "віск", "лазер"],
  епіл: ["депіляція", "шугаринг", "віск", "лазер"],
  шугар: ["депіляція", "епіляція", "віск"],
  тату: ["татуювання", "пірсинг", "tattoo"],
  стомат: ["зуби", "зубний", "дантист", "лікування зубів"],
  зуб: ["стоматологія", "дантист", "гігієна", "відбілювання"],
  психолог: ["психотерапія", "терапія", "консультація", "ментальне здоров'я"],
  реабіліт: ["фізіотерапія", "відновлення", "масаж"],
  тренув: ["фітнес", "спорт", "тренер", "зал"],
  фітнес: ["тренування", "спорт", "тренер", "зал"],
  ветеринар: ["тварини", "ветклініка", "кіт", "собака"],
};

const STOP_TOKENS = new Set(["салон", "студ", "послуг", "процедур"]);

const CATEGORY_PILL_ICONS = {
  hair: Scissors,
  barber: Scissors,

  beauty_salon: Sparkles,
  nails: Hand,
  brows_lashes: Eye,
  cosmetology: Sparkles,
  makeup: BrushCleaning,

  massage: HandHeart,
  physiotherapy: Activity,

  depilation: Zap,
  tattoo_piercing: Gem,

  spa: Waves,
  health: HeartPulse,
  fitness_diet: Dumbbell,
  dentistry: Smile,
  podiatry: Footprints,

  aesthetic_medicine: Syringe,
  natural_medicine: Leaf,
  psychotherapy: Brain,

  pets: PawPrint,
  finance: Wallet,
  shopping: ShoppingBag,

  auto: Car,
  other: Grid2X2,
};

function getCategoryLabel(value) {
  const key = safeText(value);
  return CATEGORY_LABELS[key] || key;
}

function getCategoryIcon(value) {
  const key = safeText(value).toLowerCase();

  if (key.includes("манік") || key.includes("nails")) {
    return Hand;
  }

  if (key.includes("масаж") || key.includes("massage")) {
    return HandHeart;
  }

  if (key.includes("перук") || key.includes("hair")) {
    return Scissors;
  }

  if (key.includes("барбер") || key.includes("barber")) {
    return Scissors;
  }

  if (key.includes("spa") || key.includes("wellness")) {
    return Waves;
  }

  if (key.includes("стомат")) {
    return Smile;
  }

  if (key.includes("авто")) {
    return Car;
  }

  return CATEGORY_PILL_ICONS[key] || Grid2X2;
}

function toPublicUrl(v) {
  const s = safeText(v);
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return R2_PUBLIC ? `${R2_PUBLIC}/${s}` : s;
}

function normalize(v) {
  return safeText(v).toLowerCase();
}

function toNumber(v) {
  if (v === "" || v == null) return null;
  const cleaned = String(v).replace(/\s+/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normalizeUa(text) {
  return safeText(text)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stemUa(word) {
  return word.replace(
    /(ами|ями|ові|еві|ого|ому|ими|іми|ий|ій|ої|ая|яя|ею|єю|ою|ю|а|я|і|и|у|е|о)$/u,
    "",
  );
}

function tokenizeAndStem(text) {
  const n = normalizeUa(text);
  if (!n) return [];
  return n.split(" ").map(stemUa).filter(Boolean);
}

function expandQueryTokens(rawQuery) {
  const base = tokenizeAndStem(rawQuery).filter((t) => t.length >= 3);
  const extras = [];

  for (const t of base) {
    if (STOP_TOKENS.has(t)) continue;
    const matchingEntries = Object.entries(QUERY_EXPAND).filter(
      ([key]) => key.includes(t) || t.includes(key),
    );
    for (const [, arr] of matchingEntries) {
      extras.push(...arr.flatMap((x) => tokenizeAndStem(x)));
    }
  }

  return Array.from(new Set([...base, ...extras])).filter(
    (t) => t.length >= 3 && !STOP_TOKENS.has(t),
  );
}

function tokensFrom(value) {
  return tokenizeAndStem(safeText(value));
}

function countTokenHits(hayTokens, qTokens) {
  let hits = 0;
  for (const qt of qTokens) {
    if (hayTokens.some((ht) => ht.includes(qt))) hits += 1;
  }
  return hits;
}

function getCityRegion(city) {
  const clean = safeText(city)
    .replace(/^м\.\s*/i, "")
    .trim();
  return CITY_TO_REGION[clean] || "";
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

async function fetchStudios() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/client/`);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || `Load failed (${res.status})`);
  }

  const list = Array.isArray(data?.studios) ? data.studios : [];

  return list.map((s) => ({
    ...s,
    slug: s.slug || s.id,
    coverUrl: toPublicUrl(s.coverUrl),
    logoUrl: toPublicUrl(s.logoUrl),
    schedule: s.schedule || {},
    scheduleExceptions: Array.isArray(s.scheduleExceptions)
      ? s.scheduleExceptions.map((item) => ({
          ...item,
          date: String(item?.date || "").slice(0, 10),
        }))
      : [],
  }));
}

function generateFakeRating(seed) {
  const str = String(seed || "");
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const normalized = Math.abs(hash % 1000) / 1000;

  return {
    rating: Number((4.2 + normalized * 0.8).toFixed(1)),
    reviewsCount: Math.floor(5 + normalized * 115),
  };
}

function SkeletonPulse({ className = "" }) {
  return (
    <div className={cn("animate-pulse rounded-[28px] bg-black/5", className)} />
  );
}

function StudiosSkeleton() {
  return (
    <main className="min-h-screen bg-[#fbfaf8] px-4 pb-24 pt-4 text-[#111111]">
      <div className="mx-auto max-w-[1260px]">
        <div className="flex items-center justify-between">
          <SkeletonPulse className="h-12 w-36 rounded-full bg-white" />
          <div className="flex gap-3">
            <SkeletonPulse className="h-12 w-12 rounded-[18px] bg-white" />
            <SkeletonPulse className="h-12 w-12 rounded-[18px] bg-white" />
          </div>
        </div>
        <SkeletonPulse className="mt-12 h-52 w-full bg-white" />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-60 bg-white" />
          ))}
        </div>
      </div>
    </main>
  );
}

function IconButton({ children, className = "", badge }) {
  return (
    <button
      type="button"
      className={cn(
        "relative grid h-12 w-12 place-items-center rounded-[18px] bg-white text-black shadow-[0_16px_36px_rgba(20,20,20,0.08)] transition active:scale-95 sm:h-11 sm:w-11 sm:rounded-2xl",
        className,
      )}
    >
      {children}
      {badge ? (
        <span className="absolute right-2 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#ff6200] px-1 text-[10px] font-black leading-none text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function BrandBar() {
  return <div className="mt-12 flex items-center justify-between gap-4"></div>;
}

function FeaturePill({
  active,
  icon: Icon,
  children,
  onClick,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex h-[25px] min-w-max shrink-0 select-none items-center justify-center gap-1 rounded-[8px] border border-transparent bg-white px-2.5 text-[10px] font-bold text-[#3f3f46] transition-all duration-300 ease-out active:scale-[0.97]",
        "snap-start whitespace-nowrap",
        "sm:h-[28px] sm:gap-1.5 sm:rounded-[8px] sm:px-3 sm:text-[11px]",

        active
          ? "bg-[#fff5ee] text-[#ff6200] shadow-[0_6px_18px_rgba(255,98,0,0.12)] ring-1 ring-[#ff6200]/10"
          : "hover:scale-105 hover:text-[#ff6200] hover:shadow-[0_6px_18px_rgba(15,23,42,0.08)]",

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

function RatingBadge({ rating, reviewsCount }) {
  return (
    <div className="inline-flex h-6 items-center gap-1 rounded-full bg-white px-2 text-[9px] font-black text-[#151515] shadow-[0_8px_18px_rgba(20,20,20,0.1)] sm:h-7 sm:px-2.5 sm:text-[10px]">
      <Star className="h-3 w-3 fill-[#ffb11a] text-[#ffb11a] sm:h-4 sm:w-4" />
      <span>{rating.toFixed(1)}</span>
      <span className="font-semibold text-[#6f7280]">({reviewsCount})</span>
    </div>
  );
}

function getTodaySchedule(schedule, exceptions = []) {
  const now = new Date();

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayIso = `${y}-${m}-${d}`;

  const exception = exceptions.find(
    (item) => String(item.date || "").slice(0, 10) === todayIso,
  );

  if (exception) {
    if (!exception.enabled) return null;

    return {
      enabled: true,
      start: exception.start,
      end: exception.end,
    };
  }

  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const key = map[now.getDay()];
  const fallback = schedule?.[key];

  if (!fallback?.enabled) return null;
  return fallback;
}

function isStudioOpenNow(schedule, exceptions = []) {
  const today = getTodaySchedule(schedule, exceptions);
  if (!today?.enabled) return false;

  const [sh, sm] = String(today.start || "00:00")
    .split(":")
    .map(Number);
  const [eh, em] = String(today.end || "00:00")
    .split(":")
    .map(Number);

  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return nowMin >= startMin && nowMin < endMin;
}

function StudioCard({ studio, onOpen, mode = "carousel" }) {
  const name = safeText(studio.name) || "Студія";
  const cat = getCategoryLabel(safeText(studio.category)) || "Послуга";
  const CategoryIcon = getCategoryIcon(studio.category);
  const cityLabel = safeText(studio.city);
  const coverUrl = safeText(studio.coverUrl);
  const logoUrl = safeText(studio.logoUrl);
  const openNow = isStudioOpenNow(
    studio?.schedule || {},
    studio?.scheduleExceptions || [],
  );
  const { rating, reviewsCount } = generateFakeRating(
    studio.id || studio.slug || name,
  );
const address = [
  [
    formatStreetForDisplay(studio?.street),
    safeText(studio?.building),
  ]
    .filter(Boolean)
    .join(" "),
  safeText(studio?.apartment),
]
  .filter(Boolean)
  .join(", ");
  const fullAddress = [cityLabel, address].filter(Boolean).join(", ");
  const services = Array.isArray(studio.services)
    ? studio.services.map((s) => safeText(s?.name)).filter(Boolean)
    : [];
  const serviceLabel = services[0] || cat;
  const priceLabel =
    studio.priceFrom != null && studio.priceFrom !== ""
      ? `від ${studio.priceFrom} ₴`
      : "від 350 ₴";

  const isGrid = mode === "grid";
  const isPremium = studio.premium === true || studio.premium === "true";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(studio)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(studio);
        }
      }}
      className={cn(
        "group relative shrink-0 cursor-pointer outline-none transition-transform duration-300 ease-out hover:scale-[1.02]",
        isGrid ? "w-full max-w-none" : "w-[84%] shrink-0 sm:w-[48%] lg:w-[32%]",
      )}
    >
      <article
        className={cn(
          "relative z-10 h-[200px] overflow-hidden rounded-[20px] bg-[#202020] text-white shadow-[0_14px_34px_rgba(0,0,0,0.16)] sm:h-[215px] sm:rounded-[18px]",
        )}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${name} cover`}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,#5c5248,#191919_56%)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

        <div className="absolute left-2.5 top-2.5 z-10 inline-flex h-6 max-w-[58%] items-center gap-1 rounded-full border border-white/40 bg-white/92 px-2 shadow-[0_8px_18px_rgba(20,20,20,0.1)] backdrop-blur-md sm:left-4 sm:top-4 sm:h-7 sm:px-3">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-[#fff3e9] text-[#ff6200] sm:h-5 sm:w-5">
            {React.createElement(CategoryIcon, {
              className: "h-3.5 w-3.5 sm:h-3 sm:w-3",
            })}
          </span>

          <span className="truncate text-[9px] font-bold tracking-[-0.01em] text-[#1c1c1c] sm:text-[11px]">
            {cat}
          </span>
        </div>

        <div className="absolute right-2.5 top-2.5 z-10 sm:right-4 sm:top-4">
          <RatingBadge rating={rating} reviewsCount={reviewsCount} />
        </div>

        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end gap-2 sm:bottom-4 sm:left-4 sm:right-4 sm:gap-3">
          <div className="grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-[18px] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.22)] sm:h-[58px] sm:w-[58px] sm:rounded-[15px]">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${name} logo`}
                className="h-full w-full object-cover object-center"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Scissors className="h-9 w-9 text-black sm:h-7 sm:w-7" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[16px] font-black leading-none tracking-[-0.04em] sm:text-[17px]">
              {name}
            </h2>

            {fullAddress ? (
              <p className="mt-2 flex items-center gap-1 truncate text-[10px] font-medium leading-[1.3] text-white sm:mt-1 sm:text-[10px] md:text-[10px] lg:text-[11px]">
                <MapPin className="h-3 w-3 shrink-0 text-[#ff6200] sm:h-3 sm:w-3" />
                {fullAddress}
              </p>
            ) : null}

            <p
              className={cn(
                "mt-1 flex items-center gap-1 text-[10px] font-semibold sm:text-xs",
                openNow ? "text-[#13a044]" : "text-[#ef4444]",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2",
                  openNow
                    ? "bg-[#13a044] shadow-[0_0_0_3px_rgba(19,160,68,0.16)]"
                    : "bg-[#ef4444] shadow-[0_0_0_3px_rgba(239,68,68,0.16)]",
                )}
              />

              {openNow ? "Відкрито зараз" : "Зачинено зараз"}
            </p>
          </div>

          <div
            className="relative z-20"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <FavouriteButton studio={studio} />
          </div>
        </div>
      </article>

      {isPremium ? (
        <div className="absolute left-2.5 top-[38px] z-10 sm:left-4 sm:top-[48px]">
          <div className="inline-flex items-center gap-1 rounded-full border border-[#ffd7b5]/50 bg-[linear-gradient(90deg,#ff6200_0%,#ff8a00_18%,#ffc266_50%,#ff8a00_82%,#ff6200_100%)] px-2 py-[4px] shadow-[0_8px_20px_rgba(255,98,0,0.28)] backdrop-blur-md sm:px-2.5">
            <Crown className="h-3 w-3 fill-white text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.22)]" />

            <span className="text-[9px] font-black uppercase tracking-[0.08em] text-white">
              Premium
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const CATEGORY_SERVICE_TERMS = {
  nails: [
    "манікюр",
    "педикюр",
    "нігті",
    "гель лак",
    "шелак",
    "покриття",
    "френч",
  ],

  hair: ["стрижка", "зачіска", "укладка", "фарбування", "волосся"],

  barber: ["чоловіча стрижка", "борода", "барбер"],

  brows_lashes: ["брови", "вії", "ламінування", "нарощування вій"],

  massage: ["масаж", "спина", "шия", "релакс"],
};

function getStudioServicesSearchText(studio) {
  const directServices = Array.isArray(studio?.services) ? studio.services : [];

  const serviceCategories = [
    ...(Array.isArray(studio?.serviceCategories)
      ? studio.serviceCategories
      : []),

    ...(Array.isArray(studio?.categories) ? studio.categories : []),
  ];

  const directServicesText = directServices.flatMap((service) => [
    service?.name,
    service?.description,
    service?.category?.name,
    service?.serviceCategory?.name,
  ]);

  const categoryServicesText = serviceCategories.flatMap((category) => [
    category?.name,

    ...(Array.isArray(category?.services)
      ? category.services.flatMap((service) => [
          service?.name,
          service?.description,
        ])
      : []),
  ]);

  return [...directServicesText, ...categoryServicesText]
    .filter(Boolean)
    .join(" ");
}

function getSelectedCategoryTerms(categoryKey) {
  if (!categoryKey) return [];

  return [
    getCategoryLabel(categoryKey),
    ...(CATEGORY_SERVICE_TERMS[categoryKey] || []),
  ]
    .map((term) => normalizeUa(term))
    .filter(Boolean);
}

function getSelectedCategoryTokens(categoryKey) {
  return Array.from(
    new Set(
      getSelectedCategoryTerms(categoryKey)
        .flatMap((term) => expandQueryTokens(term))
        .filter((token) => token.length >= 3),
    ),
  );
}
export default function Studios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const isGuest = !token || (role !== "client" && role !== "owner");
  const studiosQuery = useQuery({
    queryKey: ["studios"],
    queryFn: fetchStudios,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const studios = useMemo(() => {
    return Array.isArray(studiosQuery.data) ? studiosQuery.data : [];
  }, [studiosQuery.data]);

  const [shouldRestoreScroll, setShouldRestoreScroll] = useState(() => {
    return sessionStorage.getItem("restore-studios-scroll") === "1";
  });
  const [q, setQ] = useState(() => searchParams.get("q") || "");
  const [city, setCity] = useState(() => searchParams.get("city") || "");
  const [category, setCategory] = useState(
    () => searchParams.get("category") || "",
  );
  const [minPrice, setMinPrice] = useState(
    () => searchParams.get("minPrice") || "",
  );
  const [maxPrice, setMaxPrice] = useState(
    () => searchParams.get("maxPrice") || "",
  );
  const [sort, setSort] = useState(
    () => searchParams.get("sort") || "recommended",
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [applied, setApplied] = useState(() => ({
    q,
    city,
    category,
    minPrice,
    maxPrice,
    sort,
  }));

  const recommendedScrollRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    if (!shouldRestoreScroll) return;

    const tryRestore = () => {
      const savedY = Number(sessionStorage.getItem("studios-scroll-y") || 0);
      if (savedY > 10) {
        window.scrollTo({ top: savedY, behavior: "instant" });
      }
      sessionStorage.removeItem("restore-studios-scroll");
      sessionStorage.removeItem("studios-scroll-y");
      setShouldRestoreScroll(false);
    };

    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        const raf3 = requestAnimationFrame(tryRestore);
        return () => cancelAnimationFrame(raf3);
      });
      return () => cancelAnimationFrame(raf2);
    });

    const timeout = setTimeout(tryRestore, 120);

    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(timeout);
    };
  }, [shouldRestoreScroll, studios.length]);

  useEffect(() => {
    const params = {};

    if (applied.q) params.q = applied.q;
    if (applied.city) params.city = applied.city;
    if (applied.category) params.category = applied.category;
    if (applied.minPrice) params.minPrice = applied.minPrice;
    if (applied.maxPrice) params.maxPrice = applied.maxPrice;
    if (applied.sort !== "recommended") params.sort = applied.sort;

    setSearchParams(params, { replace: true });
  }, [applied, setSearchParams]);

  const hasPendingChanges =
    q !== applied.q ||
    city !== applied.city ||
    category !== applied.category ||
    minPrice !== applied.minPrice ||
    maxPrice !== applied.maxPrice ||
    sort !== applied.sort;

  const sortOptions = useMemo(
    () => [
      { value: "recommended", label: "Рекомендовано" },
      { value: "priceAsc", label: "За зростанням ціни" },
      { value: "priceDesc", label: "За спаданням ціни" },
      { value: "nameAsc", label: "За назвою" },
    ],
    [],
  );

  const cities = useMemo(() => {
    const set = new Set(studios.map((s) => safeText(s.city)).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "uk"));
  }, [studios]);

  const regions = useMemo(() => {
    const set = new Set(
      studios
        .map((s) =>
          safeText(s.region || s.oblast || s.area || getCityRegion(s.city)),
        )
        .filter(Boolean),
    );

    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, "uk"))
      .map((r) => ({
        value: r,
        label: r,
      }));
  }, [studios]);

  const districts = useMemo(() => {
    const set = new Set(
      studios.map((s) => safeText(s.district || s.raion)).filter(Boolean),
    );

    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, "uk"))
      .map((d) => ({
        value: d,
        label: d,
        meta: "Район",
      }));
  }, [studios]);

  const categories = useMemo(() => {
    const raw = Array.from(
      new Set(studios.map((s) => safeText(s.category)).filter(Boolean)),
    );

    return raw
      .map((value) => ({ value, label: getCategoryLabel(value) }))
      .sort((a, b) => a.label.localeCompare(b.label, "uk"));
  }, [studios]);

  const searchSuggestions = useMemo(() => {
    const query = normalizeUa(q);
    const queryTokens = tokenizeAndStem(query).filter(
      (token) => token.length >= 2,
    );
    if (query.length < 2 || queryTokens.length === 0) {
      return { terms: [], studios: [] };
    }

    const expandedTokens = expandQueryTokens(query);
    const termMap = new Map();

    function addTerm(label, type, studioCategory = "") {
      const cleanLabel = safeText(label);
      if (!cleanLabel || cleanLabel.length < 2) return;
      const normalizedLabel = normalizeUa(cleanLabel);
      const labelTokens = tokenizeAndStem(cleanLabel);
      const directHits = countTokenHits(labelTokens, queryTokens);
      const semanticHits = countTokenHits(labelTokens, expandedTokens);
      const containsPhrase = normalizedLabel.includes(query) ? 1 : 0;
      if (!directHits && !semanticHits && !containsPhrase) return;

      const score = containsPhrase * 20 + directHits * 12 + semanticHits * 4;
      const key = normalizedLabel;
      const previous = termMap.get(key);
      if (!previous || previous.score < score) {
        termMap.set(key, {
          label: cleanLabel,
          type,
          category: studioCategory,
          score,
        });
      }
    }

    categories.forEach((item) => {
      addTerm(item.label, "Категорія", item.value);
      (CATEGORY_SERVICE_TERMS[item.value] || []).forEach((term) =>
        addTerm(term, "Категорія", item.value),
      );
    });

    studios.forEach((studio) => {
      (Array.isArray(studio.services) ? studio.services : []).forEach(
        (service) => {
          addTerm(service?.name, "Послуга");
          addTerm(service?.category?.name, "Категорія");
          addTerm(service?.serviceCategory?.name, "Категорія");
        },
      );
      (Array.isArray(studio.serviceCategories)
        ? studio.serviceCategories
        : []
      ).forEach((serviceCategory) => {
        addTerm(serviceCategory?.name, "Категорія");
        (Array.isArray(serviceCategory?.services)
          ? serviceCategory.services
          : []
        ).forEach((service) => addTerm(service?.name, "Послуга"));
      });
    });

    const matchedStudios = studios
      .map((studio) => {
        const categoryLabel = getCategoryLabel(studio.category);
        const searchText = [
          studio.name,
          categoryLabel,
          studio.description,
          getStudioServicesSearchText(studio),
          ...(CATEGORY_SERVICE_TERMS[studio.category] || []),
        ]
          .filter(Boolean)
          .join(" ");
        const tokens = tokenizeAndStem(searchText);
        const directHits = countTokenHits(tokens, queryTokens);
        const semanticHits = countTokenHits(tokens, expandedTokens);
        const nameMatch = normalizeUa(studio.name).includes(query) ? 1 : 0;
        return {
          studio,
          score: nameMatch * 30 + directHits * 10 + semanticHits * 3,
          reason: directHits
            ? categoryLabel
            : `Пов’язано із запитом «${q.trim()}»`,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    return {
      terms: Array.from(termMap.values())
        .sort(
          (a, b) => b.score - a.score || a.label.localeCompare(b.label, "uk"),
        )
        .slice(0, 6),
      studios: matchedStudios,
    };
  }, [q, categories, studios]);

  const flatSuggestions = useMemo(
    () => [
      ...searchSuggestions.terms.map((item) => ({ ...item, kind: "term" })),
      ...searchSuggestions.studios.map((item) => ({ ...item, kind: "studio" })),
    ],
    [searchSuggestions],
  );

  const showSearchSuggestions =
    searchFocused && q.trim().length >= 2 && flatSuggestions.length > 0;

  useEffect(() => {
    const container = categoryScrollRef.current;
    if (!container) return undefined;

    function handleCategoryWheel(event) {
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (maxScroll <= 0) return;

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (!delta) return;

      const canScrollLeft = delta < 0 && container.scrollLeft > 0;

      const canScrollRight = delta > 0 && container.scrollLeft < maxScroll;

      if (!canScrollLeft && !canScrollRight) {
        return;
      }

      event.preventDefault();
      container.scrollLeft += delta;
    }

    container.addEventListener("wheel", handleCategoryWheel, {
      passive: false,
    });

    return () => {
      container.removeEventListener("wheel", handleCategoryWheel);
    };
  }, [categories.length]);

  const filtered = useMemo(() => {
    const cityN = normalize(applied.city);
    const catN = normalize(applied.category);
    const min = toNumber(applied.minPrice);
    const max = toNumber(applied.maxPrice);
    const qTokens = expandQueryTokens(applied.q);
    const selectedCategoryTerms = getSelectedCategoryTerms(catN);
    const selectedCategoryTokens = getSelectedCategoryTokens(catN);

    const scored = studios
      .map((s) => {
        const catNItem = normalize(s.category);

        const locationValues = [
          s.city,
          s.region,
          s.oblast,
          s.area,
          getCityRegion(s.city),
        ]
          .map(normalize)
          .filter(Boolean);

        const matchCity = !cityN || locationValues.includes(cityN);

        const servicesSearchText = getStudioServicesSearchText(s);
        const normalizedServicesSearchText = normalizeUa(servicesSearchText);
        const servicesTokens = tokenizeAndStem(servicesSearchText).filter(
          (token) => token.length >= 3,
        );

        const exactCategoryMatch = Boolean(catN) && catNItem === catN;

        const serviceCategoryMatch =
          Boolean(catN) &&
          (selectedCategoryTerms.some((term) =>
            normalizedServicesSearchText.includes(term),
          ) ||
            selectedCategoryTokens.some((categoryToken) =>
              servicesTokens.some(
                (serviceToken) =>
                  serviceToken === categoryToken ||
                  serviceToken.startsWith(categoryToken),
              ),
            ));

        const matchCategory =
          !catN || exactCategoryMatch || serviceCategoryMatch;

        const categoryPriority = !catN || exactCategoryMatch ? 0 : 1;

        const priceFrom = toNumber(s.priceFrom);

        const matchMin = min == null || (priceFrom != null && priceFrom >= min);

        const matchMax = max == null || (priceFrom != null && priceFrom <= max);

        if (!matchCity || !matchCategory || !matchMin || !matchMax) {
          return {
            s,
            score: -1,
            matchQuery: false,
            categoryPriority,
          };
        }

        const nameTokens = tokensFrom(s.name);
        const categoryTokens = tokensFrom(s.category);
        const descTokens = tokensFrom(s.description);

        if (qTokens.length === 0) {
          return {
            s,
            score: 0,
            matchQuery: true,
            categoryPriority,
          };
        }

        const nameHits = countTokenHits(nameTokens, qTokens);
        const catHits = countTokenHits(categoryTokens, qTokens);
        const descHits = countTokenHits(descTokens, qTokens);
        const servicesHits = countTokenHits(servicesTokens, qTokens);

        const matchQuery = nameHits + catHits + descHits + servicesHits > 0;

        if (!matchQuery) {
          return {
            s,
            score: -1,
            matchQuery: false,
            categoryPriority,
          };
        }

        let score = 0;

        score += nameHits * 6;
        score += catHits * 5;
        score += servicesHits * 4;
        score += descHits * 2;

        if (nameHits > 0) score += 4;
        if (catHits > 0) score += 3;
        if (servicesHits > 0) score += 2;
        if (s.premium) score += 1;

        return {
          s,
          score,
          matchQuery: true,
          categoryPriority,
        };
      })
      .filter((item) => item.matchQuery && item.score >= 0);

    const sorted = scored.sort((a, b) => {
      if (a.categoryPriority !== b.categoryPriority) {
        return a.categoryPriority - b.categoryPriority;
      }

      const aPremium = a.s.premium ? 1 : 0;
      const bPremium = b.s.premium ? 1 : 0;

      if (bPremium !== aPremium) {
        return bPremium - aPremium;
      }

      const aPrice = toNumber(a.s.priceFrom) ?? Number.POSITIVE_INFINITY;

      const bPrice = toNumber(b.s.priceFrom) ?? Number.POSITIVE_INFINITY;

      if (applied.sort === "priceAsc") {
        return aPrice - bPrice;
      }

      if (applied.sort === "priceDesc") {
        return bPrice - aPrice;
      }

      if (applied.sort === "nameAsc") {
        return safeText(a.s.name).localeCompare(safeText(b.s.name), "uk");
      }

      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return aPrice - bPrice;
    });

    return sorted.map((item) => item.s);
  }, [applied, studios]);

  const premiumStudios = studios.filter((studio) => studio.premium === true);

  const recommended =
    premiumStudios.length > 0
      ? premiumStudios.slice(0, 6)
      : studios.slice(0, 6);
  const allStudios = filtered;

  function clearAll() {
    setQ("");
    setCity("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort("recommended");
    setApplied({
      q: "",
      city: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      sort: "recommended",
    });
  }

  function handleApply() {
    const searchQuery = q.trim();

    const nextCategory = searchQuery ? "" : category;

    if (searchQuery) {
      setCategory("");
    }

    setApplied({
      q: searchQuery,
      city,
      category: nextCategory,
      minPrice,
      maxPrice,
      sort,
    });
  }

  function selectSearchTerm(label) {
    const nextQuery = safeText(label);
    setQ(nextQuery);
    setCategory("");
    setApplied((prev) => ({
      ...prev,
      q: nextQuery,
      category: "",
    }));
    setSearchFocused(false);
    setActiveSuggestion(-1);
  }

  function handleSearchKeyDown(event) {
    if (event.key === "ArrowDown" && flatSuggestions.length) {
      event.preventDefault();
      setSearchFocused(true);
      setActiveSuggestion((current) =>
        current >= flatSuggestions.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (event.key === "ArrowUp" && flatSuggestions.length) {
      event.preventDefault();
      setActiveSuggestion((current) =>
        current <= 0 ? flatSuggestions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Escape") {
      setSearchFocused(false);
      setActiveSuggestion(-1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected = flatSuggestions[activeSuggestion];
      if (showSearchSuggestions && selected) {
        if (selected.kind === "studio") openStudio(selected.studio);
        else selectSearchTerm(selected.label);
        return;
      }
      handleApply();
      setSearchFocused(false);
    }
  }

  function handleCategorySelect(nextCategory) {
    setCategory(nextCategory);

    if (nextCategory) {
      setQ("");
    }

    setApplied((prev) => ({
      ...prev,
      q: nextCategory ? "" : prev.q,
      category: nextCategory,
    }));
  }

  function handleCitySelect(nextCity) {
    setCity(nextCity);

    setApplied((prev) => ({
      ...prev,
      city: nextCity,
    }));
  }

  function handleClearSearch() {
    setQ("");

    setApplied((prev) => ({
      ...prev,
      q: "",
    }));
  }

  function openStudio(studio) {
    if (location.pathname === "/") {
      sessionStorage.setItem("studios-scroll-y", String(window.scrollY));
      sessionStorage.setItem("restore-studios-scroll", "1");
    }
    navigate(`/${studio.slug}`);
  }

  if (studiosQuery.isLoading && !studiosQuery.data) {
    return <StudiosSkeleton />;
  }

  const heroImageBoxClass =
    "pointer-events-none absolute z-0 " +
    "max-[639px]:right-[-55px] max-[639px]:top-[-120px] max-[639px]:h-[360px] max-[639px]:w-[620px] " +
    "sm:right-[-50px] sm:top-[-120px] sm:h-[390px] sm:w-[680px] " +
    "md:right-[-60px] md:top-[-170px] md:h-[500px] md:w-[820px] " +
    "lg:right-[-80px] lg:top-[-240px] lg:h-[620px] lg:w-[1040px]";

  const heroImageClass = "h-full w-full object-contain object-right";

  function scrollCategories(direction) {
    const container = categoryScrollRef.current;
    if (!container) return;

    const scrollAmount = Math.max(280, container.clientWidth * 0.65);

    container.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth",
    });
  }

  function scrollRecommended(direction) {
    const container = recommendedScrollRef.current;
    if (!container) return;

    const card = container.querySelector("article");
    if (!card) return;

    const gap = 16;
    const scrollAmount = card.offsetWidth + gap;

    container.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth",
    });
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfaf8] pb-[calc(env(safe-area-inset-bottom)+92px)] text-[#111111]">
      <div className="mx-auto max-w-[1260px] mt-8 px-4 max-[639px]:px-5 max-[639px]:pt-4 sm:px-6 sm:pt-12 lg:px-10 lg:pt-13">
        <section className="relative mt-2 max-[639px]:mt-0 sm:mt-12 lg:mt-10">
          <div className={cn(heroImageBoxClass, "mask-hero-image")}>
            <img
              src={calendarHero}
              alt=""
              aria-hidden="true"
              className={heroImageClass}
            />
          </div>

          <div
            className={cn(
              "relative z-10 max-w-[720px]",
              isGuest ? "mt-12" : "mt-2 max-[639px]:mt-0 sm:mt-12 lg:mt-16",
            )}
          >
            <h1 className="max-w-[360px] text-[44px] font-black leading-[1.02] tracking-[-0.06em] text-[#202020] max-[639px]:max-w-[260px] max-[639px]:text-[38px] max-[639px]:leading-[0.98] sm:max-w-[520px] sm:text-[46px] sm:leading-[0.98] md:text-[52px] lg:max-w-[720px] lg:text-[54px]">
              <span className="block">Обирай та</span>

              <span className="block text-[#ff6200] sm:inline">записуйся </span>

              <span className="block text-[#ff6200] sm:inline">онлайн</span>
            </h1>
            <p className="mb-14 mt-3 max-w-[250px] text-[13px] font-medium leading-5 text-[#7a7d87] max-[639px]:mb-7 max-[639px]:mt-2.5 max-[639px]:max-w-[210px] max-[639px]:text-[12px] max-[639px]:leading-4 sm:mt-3 sm:max-w-[360px] sm:text-[13px] sm:leading-5 md:max-w-[420px] md:text-[14px]">
              Пошук послуг і закладів <br className="sm:hidden" />у твоєму місті
            </p>
          </div>
        </section>

        <section className="relative mt-10 sm:mt-8">
          <div
            ref={searchBoxRef}
            className="relative z-30 flex h-[56px] items-center rounded-[15px] border border-[#eadfce] bg-white pl-5 pr-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-[#f1dfbf] hover:ring-4 hover:ring-orange-200/20 sm:max-w-[450px] md:max-w-[500px] lg:max-w-[660px]"
          >
            <Search className="h-5 w-5 shrink-0 text-[#8b8794] sm:h-6 sm:w-6" />

            <div className="flex min-w-0 flex-1 items-center">
              <input
                value={q}
                onChange={(event) => {
                  setQ(event.target.value);
                  setSearchFocused(true);
                  setActiveSuggestion(-1);
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() =>
                  window.setTimeout(() => setSearchFocused(false), 120)
                }
                onKeyDown={handleSearchKeyDown}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showSearchSuggestions}
                aria-controls="service-search-suggestions"
                placeholder="Пошук послуг"
                className="min-w-0 flex-1 bg-transparent px-4 text-[15px] font-semibold text-[#111111] outline-none placeholder:font-semibold placeholder:text-[#8b8794] sm:text-[18px]"
              />

              {q ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="mr-2 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f5f1eb] text-[#8b8794] transition hover:bg-[#fff1e7] hover:text-[#ff6200]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleApply}
              disabled={!hasPendingChanges}
              className={cn(
                "flex h-[38px] items-center justify-center rounded-[11px] px-4 text-[14px] font-black text-white transition-all duration-300 active:scale-[0.98] sm:h-[38px] sm:px-5 sm:text-[13px]",
                hasPendingChanges
                  ? "animate-[heartbeat_1.8s_ease-in-out_infinite] bg-[#ff6200] shadow-[0_12px_30px_rgba(255,98,0,0.24)] hover:bg-[#ff6f14]"
                  : "bg-[#ff6200] shadow-[0_10px_24px_rgba(255,98,0,0.18)] opacity-70",
              )}
            >
              Знайти
            </button>
          </div>

          {showSearchSuggestions ? (
            <div
              id="service-search-suggestions"
              role="listbox"
              onMouseDown={(event) => event.preventDefault()}
              className="absolute left-0 right-0 top-[64px] z-50 max-h-[440px] overflow-y-auto rounded-[18px] border border-[#eee5da] bg-white p-2.5 shadow-[0_24px_70px_rgba(39,31,24,0.18)] sm:right-auto sm:w-[min(660px,calc(100vw-3rem))]"
            >
              {searchSuggestions.terms.length ? (
                <div>
                  <p className="px-3 pb-1.5 pt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#aaa29a]">
                    Послуги та категорії
                  </p>
                  {searchSuggestions.terms.map((item, index) => (
                    <button
                      key={`${item.type}-${item.label}`}
                      type="button"
                      role="option"
                      aria-selected={activeSuggestion === index}
                      onMouseEnter={() => setActiveSuggestion(index)}
                      onClick={() => selectSearchTerm(item.label)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[13px] px-3 py-2.5 text-left transition",
                        activeSuggestion === index
                          ? "bg-[#fff3e9]"
                          : "hover:bg-[#faf7f3]",
                      )}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff3e9] text-[#ff6200]">
                        {React.createElement(
                          item.type === "Послуга" ? Scissors : Grid2X2,
                          { className: "h-4 w-4" },
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-extrabold text-[#24211f]">
                          {item.label}
                        </span>
                        <span className="block text-[11px] font-semibold text-[#938b84]">
                          {item.type}
                        </span>
                      </span>
                      <Search className="h-4 w-4 text-[#c5bdb6]" />
                    </button>
                  ))}
                </div>
              ) : null}

              {searchSuggestions.studios.length ? (
                <div
                  className={cn(
                    searchSuggestions.terms.length &&
                      "mt-2 border-t border-[#f0e9e2] pt-2",
                  )}
                >
                  <p className="px-3 pb-1.5 pt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#aaa29a]">
                    Студії з такими послугами
                  </p>
                  {searchSuggestions.studios.map((item, studioIndex) => {
                    const index = searchSuggestions.terms.length + studioIndex;
                    const studio = item.studio;
                    return (
                      <button
                        key={studio.slug || studio.id}
                        type="button"
                        role="option"
                        aria-selected={activeSuggestion === index}
                        onMouseEnter={() => setActiveSuggestion(index)}
                        onClick={() => openStudio(studio)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-[13px] px-3 py-2.5 text-left transition",
                          activeSuggestion === index
                            ? "bg-[#fff3e9]"
                            : "hover:bg-[#faf7f3]",
                        )}
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f4efe9] text-[#ff6200]">
                          {studio.logoUrl ? (
                            <img
                              src={studio.logoUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            React.createElement(
                              getCategoryIcon(studio.category),
                              { className: "h-5 w-5" },
                            )
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-extrabold text-[#24211f]">
                            {studio.name}
                          </span>
                          <span className="block truncate text-[11px] font-semibold text-[#938b84]">
                            {item.reason}
                            {studio.city ? ` · ${studio.city}` : ""}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-[#b9b1aa]" />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-5 sm:grid-cols-[1fr_1fr_auto] lg:max-w-[900px]">
            <AnimatedDropdown
              size="compact"
              icon={MapPin}
              label="Місто"
              value={city}
              onChange={handleCitySelect}
              placeholder="Локація"
              options={cities.map((c) => ({
                value: c,
                label: c,
              }))}
              regionOptions={regions}
              districtOptions={districts}
              searchable
              className="h-10 rounded-[16px] sm:h-[54px] sm:rounded-[20px]"
            />
            <AnimatedDropdown
              size="compact"
              icon={Grid2X2}
              label="Категорія"
              value={category}
              onChange={handleCategorySelect}
              placeholder="Категорія"
              options={categories}
              searchable
              className="h-[76px] rounded-full bg-white px-5 shadow-[0_18px_42px_rgba(20,20,20,0.08)] sm:h-[52px]"
            />
            <button
              type="button"
              onClick={clearAll}
              className={cn(
                "hidden sm:flex",
                "group relative h-10 w-full items-center justify-center gap-2 rounded-[15px] border border-[#eadfce] bg-white px-4 text-left transition-all duration-200",
                "shadow-[0_8px_22px_rgba(15,23,42,0.035)]",
                "sm:h-[50px] sm:min-w-[120px] sm:rounded-[13px]",
                "active:scale-[0.99]",
                "hover:border-[#f1dfbf] hover:ring-4 hover:ring-orange-200/20",
              )}
            >
              <FunnelX className="h-6 w-6 text-[#8a8580] transition-colors duration-200 group-hover:text-[#ff6b00] sm:h-[14px] sm:w-[22px]" />

              <span className="text-[12px] font-bold text-[#77716b] sm:text-[14px]">
                Очистити фільтри
              </span>
            </button>
          </div>

          <div className="relative mt-6 sm:mt-5">
            <button
              type="button"
              onClick={() => scrollCategories(-1)}
              aria-label="Попередні категорії"
              className="absolute left-0 top-1/2 z-20 hidden h-9 w-9 -translate-y-[65%] place-items-center rounded-full bg-white text-[#6f6a65] shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-all duration-150 ease-out hover:scale-108 hover:text-[#ff6200] hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] active:scale-95 lg:grid"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div
              ref={categoryScrollRef}
              className="-mx-5 overflow-x-auto overflow-y-hidden px-5 pb-3 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-11 lg:px-1 [&::-webkit-scrollbar]:hidden"
            >
              <div className="pt-2 pb-3 flex w-max min-w-full touch-pan-x snap-x snap-mandatory flex-nowrap gap-2.5 sm:gap-4">
                <FeaturePill
                  active={!category}
                  icon={Grid2X2}
                  onClick={() => handleCategorySelect("")}
                >
                  Усі категорії
                </FeaturePill>

                {categories.map((cat) => (
                  <FeaturePill
                    key={cat.value}
                    active={category === cat.value}
                    icon={getCategoryIcon(cat.value)}
                    onClick={() => handleCategorySelect(cat.value)}
                  >
                    {cat.label}
                  </FeaturePill>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => scrollCategories(1)}
              aria-label="Наступні категорії"
              className="absolute right-0 top-1/2 z-20 hidden h-9 w-9 -translate-y-[65%] place-items-center rounded-full bg-white text-[#6f6a65] shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-all duration-150 ease-out hover:scale-108 hover:text-[#ff6200] hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] active:scale-95 lg:grid"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        {allStudios.length > 0 ? (
          <>
            <section className="mt-1 sm:mt-5">
              <div className="mb-5 flex items-end justify-between gap-4 sm:mb-4">
                <div>
                  <h2 className="text-[30px] font-black tracking-[-0.05em] sm:text-xl">
                    Усі салони
                  </h2>

                  <p className="mt-1 text-sm font-medium text-[#6f7280]">
                    {allStudios.length} закладів за вибраними фільтрами
                  </p>
                </div>

                {hasPendingChanges ? (
                  <button
                    type="button"
                    onClick={handleApply}
                    className="hidden rounded-full bg-[#ff6200] px-5 py-3 text-sm font-black text-white shadow-[0_12px_26px_rgba(255,98,0,0.22)] sm:inline-flex"
                  >
                    Оновити
                  </button>
                ) : null}
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {allStudios.map((studio) => (
                  <StudioCard
                    key={studio.slug}
                    studio={studio}
                    onOpen={openStudio}
                    mode="grid"
                  />
                ))}
              </div>
            </section>
          </>
        ) : (
          <section>
            <div className="px-5 py-2 sm:py-12 lg:py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#ff6200] shadow-sm">
                <Search className="h-7 w-7" />
              </div>

              <h2 className="mt-4 text-xl font-black text-[#202020]">
                Нічого не знайдено
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm text-[#77716b]">
                Спробуйте змінити фільтри.
              </p>

              <button
                type="button"
                onClick={clearAll}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[#ff6200] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(255,98,0,0.22)] transition-all hover:bg-[#ef5700] active:scale-[0.98]"
              >
                Очистити фільтри
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
