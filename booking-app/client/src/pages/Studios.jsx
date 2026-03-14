// Studios.jsx
import { Link, useSearchParams, useNavigate  } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import AnimatedField from "../components/AnimatedField";
import AnimatedDropdown from "../components/AnimatedDropdown";
import FavouriteButton from "../components/FavouriteButton";
import PremiumBadge from "../components/PremiumBadge";

function safeText(v) {
  return String(v ?? "").trim();
}

const R2_PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s; // вже повний
  return R2_PUBLIC ? `${R2_PUBLIC}/${s}` : s; // key -> url
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
    .replace(/[^\p{L}\p{N}\s-]/gu, " ") // прибирає пунктуацію (unicode)
    .replace(/\s+/g, " ")
    .trim();
}

function stemUa(word) {
  // дуже простий стемінг під укр/рус закінчення, вистачить для "стрижк*"
  return word.replace(
    /(ами|ями|ові|еві|ого|ому|ими|іми|ий|ій|ої|ої|ая|яя|ого|ею|єю|ою|ю|а|я|і|и|у|ю|е|о)$/u,
    "",
  );
}

function tokenizeAndStem(text) {
  const n = normalizeUa(text);
  if (!n) return [];
  return n.split(" ").map(stemUa).filter(Boolean);
}

const STOP_WORDS = new Set([
  "салон",
  "студія",
  "студия",
  "послуги",
  "процедури",
  "service",
  "beauty",
  "hair",
]);

const QUERY_EXPAND = {
  // Салон стрижок
  стриж: ["перукар", "перукарня", "барбер", "уклад", "фарб", "haircut"],
  перукар: ["стриж", "уклад", "фарб", "перукарня"],
  барбер: ["стриж", "barber", "barbershop"],

  // Манікюр
  манік: ["нігт", "гель", "лак", "покрит", "shellac", "шелак", "френч"],
  педик: ["нігт", "стоп", "покрит", "педикюр"],

  // Масаж
  масаж: ["спин", "шия", "комірц", "ноги", "стоп", "релакс", "massage"],
  спин: ["масаж", "спина"],
  шия: ["масаж", "комірц"],
  стоп: ["масаж", "педик"],
  ног: ["масаж", "педик"],

  // Брови та вії
  бров: ["корекц", "архітект", "ламін", "фарб", "brows"],
  вії: ["нарощ", "ламін", "lash", "lashes"],

  // Салон краси
  косметолог: ["чистк", "пілінг", "догляд", "маск", "facial", "skincare"],
  пілінг: ["косметолог", "догляд"],
  чистк: ["косметолог", "догляд"],

  // SPA
  спа: ["spa", "wellness", "обгорт", "хамам", "сауна", "релакс"],
  spa: ["спа", "wellness", "обгорт", "хамам", "сауна", "релакс"],
};

const STOP_TOKENS = new Set(["салон", "студ", "послуг", "процедур"]);

function expandQueryTokens(rawQuery) {
  const base = tokenizeAndStem(rawQuery).filter((t) => t.length >= 3);
  const extras = [];

  for (const t of base) {
    if (STOP_TOKENS.has(t)) continue;
    const arr = QUERY_EXPAND[t];
    if (arr) extras.push(...arr.flatMap((x) => tokenizeAndStem(x)));
  }

  return Array.from(new Set([...base, ...extras])).filter(
    (t) => t.length >= 3 && !STOP_TOKENS.has(t),
  );
}

function tokensFrom(value) {
  return tokenizeAndStem(safeText(value));
}

function countTokenHits(hayTokens, qTokens) {
  // рахуємо унікальні токени запиту, які реально знайшлись у hay
  let hits = 0;
  for (const qt of qTokens) {
    if (hayTokens.some((ht) => ht.includes(qt))) hits += 1;
  }
  return hits;
}

export default function Studios() {
  const [searchParams, setSearchParams] = useSearchParams();
  // ✅ initial values з URL (тільки 1 раз)
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(false);
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
  const [applied, setApplied] = useState(() => ({
    q,
    city,
    category,
    minPrice,
    maxPrice,
    sort,
  }));
  const [isLoadingMore, setIsLoadingMore] = useState(false);

const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    async function loadStudios() {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/client/`,
        );
        const data = await res.json().catch(() => null);

        if (!res.ok)
          throw new Error(data?.message || `Load failed (${res.status})`);

        const list = Array.isArray(data?.studios) ? data.studios : [];

        // ✅ нормалізація під твій UI
        const normalized = list.map((s) => ({
          ...s,
          slug: s.slug || s.id, // щоб Link працював
          coverUrl: toPublicUrl(s.coverUrl), // key -> url
          logoUrl: toPublicUrl(s.logoUrl), // key -> url
        }));

        if (alive) setStudios(normalized);
      } catch (e) {
        console.error(e);
        if (alive) setStudios([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadStudios();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
  const saved = sessionStorage.getItem("studios-scroll");
  if (!saved) return;

  const y = Number(saved);

  const restore = () => {
    window.scrollTo(0, Number.isFinite(y) ? y : 0);
  };

  requestAnimationFrame(() => {
    restore();
    setTimeout(restore, 0);
    setTimeout(restore, 80);
    setTimeout(restore, 200);
  });
}, []);



  // ✅ синхронізація state -> URL
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
      { value: "recommended", label: "Рекомендовані" },
      { value: "priceAsc", label: "Ціна: ↑" },
      { value: "priceDesc", label: "Ціна: ↓" },
      { value: "nameAsc", label: "Назва: A–Z" },
    ],
    [],
  );

  // ✅ Options
  const cities = useMemo(() => {
    const set = new Set(
      (studios || []).map((s) => safeText(s.city)).filter(Boolean),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [studios]);

  const categories = useMemo(() => {
    const set = new Set(
      (studios || []).map((s) => safeText(s.category)).filter(Boolean),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [studios]);

  // ✅ Filtered + Sorted
  const filtered = useMemo(() => {
    const cityN = normalize(applied.city);
    const catN = normalize(applied.category);

    const min = toNumber(applied.minPrice);
    const max = toNumber(applied.maxPrice);

    const qTokens = expandQueryTokens(applied.q); // вже з синонімами

    const scored = (studios || [])
      .map((s) => {
        const catNItem = normalize(s.category);
        const cityNItem = normalize(s.city);

        const matchCity = !cityN || cityNItem === cityN;
        const matchCategory = !catN || catNItem === catN;

        const priceFrom = toNumber(s.priceFrom);
        const matchMin = min == null || (priceFrom != null && priceFrom >= min);
        const matchMax = max == null || (priceFrom != null && priceFrom <= max);

        // якщо фільтри міста/категорії/ціни не пройшли — одразу відсікаємо
        if (!matchCity || !matchCategory || !matchMin || !matchMax) {
          return { s, score: -1, matchQuery: false };
        }

        // Розбиваємо текст студії по полях (щоб важити по-різному)
        const nameTokens = tokensFrom(s.name);
        const categoryTokens = tokensFrom(s.category);
        const descTokens = tokensFrom(s.description);
        const servicesTokens = tokenizeAndStem(
          (Array.isArray(s.services)
            ? s.services.map((x) => x?.name)
            : []
          ).join(" "),
        );

        // Якщо запит пустий — матчимо все (score = 0, далі сортування)
        if (qTokens.length === 0) {
          return { s, score: 0, matchQuery: true };
        }

        // Хіти по полях
        const nameHits = countTokenHits(nameTokens, qTokens);
        const catHits = countTokenHits(categoryTokens, qTokens);
        const descHits = countTokenHits(descTokens, qTokens);
        const servicesHits = countTokenHits(servicesTokens, qTokens);

        // Хоч один збіг — тоді студія релевантна
        const matchQuery = nameHits + catHits + descHits + servicesHits > 0;

        if (!matchQuery) {
          return { s, score: -1, matchQuery: false };
        }

        // ✅ scoring (ваги “як у маркетплейсах”)
        let score = 0;

        score += nameHits * 6; // назва — найважливіше
        score += catHits * 5; // категорія — дуже важливо
        score += servicesHits * 4; // послуги — майже як категорія
        score += descHits * 2; // опис — менш важливо

        // бонуси
        if (nameHits > 0) score += 4; // якщо є збіг у назві
        if (catHits > 0) score += 3; // якщо є збіг у категорії
        if (servicesHits > 0) score += 2; // якщо є збіг у послугах
        if (s.premium) score += 1; // легкий бонус преміуму

        return { s, score, matchQuery: true };
      })
      .filter((x) => x.matchQuery && x.score >= 0);

    // Сортування
    const sorted = scored.sort((a, b) => {
      // ✅ Premium завжди зверху (у будь-якому sort)
      const aPrem = a.s.premium ? 1 : 0;
      const bPrem = b.s.premium ? 1 : 0;
      if (bPrem !== aPrem) return bPrem - aPrem;

      const ap = toNumber(a.s.priceFrom) ?? Number.POSITIVE_INFINITY;
      const bp = toNumber(b.s.priceFrom) ?? Number.POSITIVE_INFINITY;

      // далі — твій вибраний sort
      if (applied.sort === "priceAsc") return ap - bp;
      if (applied.sort === "priceDesc") return bp - ap;
      if (applied.sort === "nameAsc")
        return safeText(a.s.name).localeCompare(safeText(b.s.name));

      // recommended: score -> ціна
      if (b.score !== a.score) return b.score - a.score;
      return ap - bp;
    });

    return sorted.map((x) => x.s);
  }, [applied, studios]);

  const activeChips = useMemo(() => {
    const chips = [];
    if (safeText(q)) chips.push({ key: "q", label: `Пошук: ${safeText(q)}` });
    if (safeText(city))
      chips.push({ key: "city", label: `Місто: ${safeText(city)}` });
    if (safeText(category))
      chips.push({
        key: "category",
        label: `Категорія: ${safeText(category)}`,
      });
    if (safeText(minPrice))
      chips.push({ key: "minPrice", label: `Від: ${safeText(minPrice)} грн` });
    if (safeText(maxPrice))
      chips.push({ key: "maxPrice", label: `До: ${safeText(maxPrice)} грн` });

    if (sort !== "recommended") {
      const label =
        sort === "priceAsc"
          ? "Сортування: ціна ↑"
          : sort === "priceDesc"
            ? "Сортування: ціна ↓"
            : "Сортування: назва A–Z";
      chips.push({ key: "sort", label });
    }
    return chips;
  }, [q, city, category, minPrice, maxPrice, sort]);

  function clearAll() {
    setVisibleCount(PAGE_SIZE);

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

  function removeChip(key) {
    if (key === "q") setQ("");
    if (key === "city") setCity("");
    if (key === "category") setCategory("");
    if (key === "minPrice") setMinPrice("");
    if (key === "maxPrice") setMaxPrice("");
    if (key === "sort") setSort("recommended");
  }
  const PAGE_SIZE = 12;

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isApplying, setIsApplying] = useState(false);

  function handleLoadMore() {
    if (isLoadingMore) return;

    setIsLoadingMore(true);

    setVisibleCount((prev) => prev + PAGE_SIZE);

    setIsLoadingMore(false);
  }

  function handleApply() {
    if (isApplying || !hasPendingChanges) return;

    setIsApplying(true);

    setApplied({ q, city, category, minPrice, maxPrice, sort });
    setVisibleCount(PAGE_SIZE);

    // одразу завершуємо loading
    setIsApplying(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-20 pb-8">
    <div className="pt-6 px-4 sm:pt-8 sm:px-6 lg:pt-6 lg:px-8 space-y-6">
      {/* Filters */}
      <section className="rounded-2xl border border-gray-600 bg-white p-4 px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 lg:pt-6">
        {/* Header */}
        <div className="space-y-3 mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
            Обирай та <span className="text-blue-600">записуйся онлайн</span>
          </h1>

          <p className="hidden sm:block max-w-2xl text-base text-gray-600">
            Обирай послуги поруч із тобою — швидко, зручно та без зайвих
            дзвінків.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr]">
          <AnimatedField
            label="Пошук"
            value={q}
            onChange={setQ}
            placeholder="Напр. тату, брови, манікюр…"
          />

          <AnimatedDropdown
            label="Місто"
            value={city}
            onChange={setCity}
            placeholder=""
            options={cities.map((c) => ({ value: c, label: c }))}
            searchable
          />

          <AnimatedDropdown
            label="Категорія"
            value={category}
            onChange={setCategory}
            placeholder=""
            options={categories.map((c) => ({ value: c, label: c }))}
            searchable
          />

          {/* Якщо хочеш — увімкни сортування */}
          <AnimatedDropdown
            label="Сортування"
            value={sort}
            onChange={setSort}
            placeholder=""
            options={sortOptions}
          />
        </div>

        {/* Active chips + actions */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {activeChips.length === 0 ? (
              <span className="text-sm text-gray-500">Фільтри не вибрані</span>
            ) : (
              activeChips.map((ch) => (
                <button
                  key={ch.key}
                  type="button"
                  onClick={() => removeChip(ch.key)}
                  className="
                            group
                            rounded-full
                            border border-gray-200
                            bg-gray-50
                            px-3 py-1
                            text-xs font-medium
                            text-gray-700
                            transition-all duration-200
                            hover:bg-red-50
                            hover:border-red-200
                            hover:text-red-600
                            hover:shadow-sm
                            hover:-translate-y-[1px]
                            active:scale-95
                            cursor-pointer
                          "
                  title="Прибрати фільтр"
                >
                  {ch.label}
                  <span
                    className="
        ml-1
        inline-block
        text-gray-400
        transition-all duration-200
        group-hover:text-red-700
        group-hover:scale-125
      "
                  >
                    ×
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={!hasPendingChanges || isApplying || isLoadingMore}
              className={`
    ui-button-one
    flex-1
    transition-all duration-200
    active:scale-95
    flex items-center justify-center gap-2
    ${
      !hasPendingChanges || isApplying
        ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none"
        : "bg-black text-white hover:bg-gray-900 shadow-sm hover:shadow-md"
    }
  `}
            >
              {isApplying ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                  Пошук...
                </>
              ) : (
                "Знайти"
              )}
            </button>

            <button
              type="button"
              onClick={clearAll}
              disabled={activeChips.length === 0}
              className="
    ui-button ui-button-secondary
    shrink-0
    whitespace-nowrap
    transition-all duration-200
    hover:bg-red-50 hover:border-red-200 hover:text-red-600 hover:shadow-sm
    active:scale-95
    disabled:opacity-50 
    disabled:cursor-not-allowed
  "
            >
              Очистити все
            </button>
          </div>
        </div>
      </section>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>
          Знайдено:{" "}
          <span className="font-semibold text-gray-900">{filtered.length}</span>
        </span>

        {loading && (
          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs">
            Завантаження...
          </span>
        )}

        {hasPendingChanges && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            Натисніть “Знайти”
          </span>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 sm:p-10">
          <div className="mx-auto max-w-xl text-center">
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-7 w-7 text-gray-700"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 10a2 2 0 1 0 0.001-4.001A2 2 0 0 0 10 10Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M21 21l-4.3-4.3m1.3-5.2a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Text */}
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-gray-900">
              Немає результатів за цими фільтрами
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Спробуй змінити місто або категорію, або прибери частину фільтрів
              — тоді ми покажемо більше доступних студій.
            </p>

            {/* Tips */}

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={clearAll}
                className="
            ui-button ui-button-secondary
            w-full sm:w-auto
            rounded-xl
            px-5 py-3
            border border-gray-200
            bg-white
            text-gray-900
            transition-all duration-200
            hover:bg-gray-50 hover:shadow-sm
            active:scale-[0.98]
          "
              >
                Очистити фільтри
              </button>
            </div>

            {/* Small footer */}
            <p className="mt-4 text-xs text-gray-500">
              Порада: якщо шукаєш конкретну послугу — введи загальніше слово
              (наприклад “масаж”, “манікюр”, “стрижка”).
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(0, visibleCount).map((studio) => {
            const name = safeText(studio.name) || "Студія";
            const cat = safeText(studio.category);
            const cityLabel = safeText(studio.city);
            const description = safeText(studio.description);
            const coverUrl = safeText(studio.coverUrl);
            const logoUrl = safeText(studio.logoUrl);

            const street = safeText(studio.street);
            const building = safeText(studio.building);
            const address = [street, building].filter(Boolean).join(", ");

            const hasInstagram = Boolean(safeText(studio.instagram));
            const hasWebsite = Boolean(safeText(studio.website));

            return (
<div
  key={studio.slug}
  role="button"
  tabIndex={0}
  onClick={() => {
    sessionStorage.setItem(
      "studios-scroll",
      String(window.scrollY || 0),
    );

    navigate(`/${studio.slug}`);
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();

      sessionStorage.setItem(
        "studios-scroll",
        String(window.scrollY || 0),
      );

      navigate(`/${studio.slug}`);
    }
  }}
  className={`
    group relative flex flex-col h-full
    overflow-visible rounded-2xl border bg-white
    transform-gpu will-change-transform
    transition-all duration-300 cursor-pointer
    active:scale-[0.98]
    ${
      studio.premium
        ? `
          border-yellow-200
          hover:border-yellow-400
          hover:-translate-y-[4px]
          hover:shadow-[0_10px_30px_rgba(234,179,8,0.25)]
        `
        : `
          border-gray-200
          hover:border-gray-300
          hover:-translate-y-[2px]
          hover:shadow-md
        `
    }
  `}
>
                {/* ✅ PREMIUM badge (обов’язково ПЕРШИМ, і з високим z-index) */}
                {studio.premium && (
                  <div
                    className="
        absolute top-3 right-3
        z-50
        px-3 py-1
        rounded-full
        text-[11px] font-semibold tracking-wide
        text-white
        bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600
        shadow-lg
        border border-yellow-400/40
        backdrop-blur-sm
        pointer-events-none
      "
                  >
                    ★ PREMIUM
                  </div>
                )}

                {/* Cover (кути тільки зверху) */}
                <div className="relative overflow-hidden rounded-t-2xl shrink-0">
                  <div className="relative h-28 bg-gray-100">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={`${name} cover`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                        Без обкладинки
                      </div>
                    )}
                  </div>
                </div>

                {/* ✅ Logo НЕ обрізається (і над cover) */}
                <div className="absolute left-4 top-[88px] z-40 h-12 w-12 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={`${name} logo`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-gray-400">
                      LOGO
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="px-4 pb-4 pt-8 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-gray-900">
                        {name}
                      </h2>

                      <p className="mt-0.5 text-sm text-gray-600">
                        {cat || "Категорія"}
                        {cityLabel ? ` • ${cityLabel}` : ""}
                      </p>
                    </div>

                    {studio.priceFrom != null && (
                      <div className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-900">
                        від {studio.priceFrom} грн
                      </div>
                    )}
                  </div>

                  {description && (
                    <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                      {description}
                    </p>
                  )}

                  {address && (
                    <p className="mt-3 text-sm text-gray-500">📍 {address}</p>
                  )}

                  {(hasInstagram || hasWebsite) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {hasInstagram && (
                        <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                          Instagram
                        </span>
                      )}
                      {hasWebsite && (
                        <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                          Сайт
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 group-hover:underline">
                      Переглянути →
                    </span>
                    <FavouriteButton studio={studio} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {visibleCount < filtered.length && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className={`
        ui-button-one
        px-6 py-3
        flex items-center gap-2
        transition-all duration-200
        active:scale-95
        ${isLoadingMore ? "opacity-70 cursor-not-allowed" : "hover:shadow-md"}
      `}
          >
            {isLoadingMore ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Завантаження...
              </>
            ) : (
              <>Показати ще</>
            )}
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
