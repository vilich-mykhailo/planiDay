// Studios.jsx
import {
  Link,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Search,
  MapPin,
  SlidersHorizontal,
  X,
  ArrowRight,
  Crown,
  Star,
} from "lucide-react";
import AnimatedField from "../components/AnimatedField";
import AnimatedDropdown from "../components/AnimatedDropdown";
import FavouriteButton from "../components/FavouriteButton";

function safeText(v) {
  return String(v ?? "").trim();
}

const R2_PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function toPublicUrl(v) {
  const s = String(v || "").trim();
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
    /(ами|ями|ові|еві|ого|ому|ими|іми|ий|ій|ої|ої|ая|яя|ого|ею|єю|ою|ю|а|я|і|и|у|ю|е|о)$/u,
    "",
  );
}

function tokenizeAndStem(text) {
  const n = normalizeUa(text);
  if (!n) return [];
  return n.split(" ").map(stemUa).filter(Boolean);
}

const QUERY_EXPAND = {
  стриж: ["перукар", "перукарня", "барбер", "уклад", "фарб", "haircut"],
  перукар: ["стриж", "уклад", "фарб", "перукарня"],
  барбер: ["стриж", "barber", "barbershop"],

  манік: ["нігт", "гель", "лак", "покрит", "shellac", "шелак", "френч"],
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
  let hits = 0;
  for (const qt of qTokens) {
    if (hayTokens.some((ht) => ht.includes(qt))) hits += 1;
  }
  return hits;
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function FilterChip({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group cursor-pointer rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 transition-all duration-200 hover:-translate-y-[1px] hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-sm active:scale-95"
      title="Прибрати фільтр"
    >
      {children}
      <span className="ml-1 inline-block text-stone-400 transition-all duration-200 group-hover:scale-125 group-hover:text-red-600">
        ×
      </span>
    </button>
  );
}

export default function Studios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [studios, setStudios] = useState([]);
  const [shouldRestoreScroll, setShouldRestoreScroll] = useState(false);
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
  const location = useLocation();
  const [hasSearched, setHasSearched] = useState(false);
  useEffect(() => {
    const flag = sessionStorage.getItem("restore-studios-scroll") === "1";
    if (flag) {
      setShouldRestoreScroll(true);
    }
  }, []);

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
    const shouldRestore =
      sessionStorage.getItem("restore-studios-scroll") === "1";
    const savedY = sessionStorage.getItem("studios-scroll-y");

    if (!shouldRestore || !savedY) return;

    const restore = () => {
      window.scrollTo(0, Number(savedY));
      sessionStorage.removeItem("restore-studios-scroll");
    };

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(restore);
    });

    return () => cancelAnimationFrame(id);
  }, [studios.length]);

  useEffect(() => {
    let alive = true;

    async function loadStudios() {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/client/`);
        const data = await res.json().catch(() => null);

        if (!res.ok)
          throw new Error(data?.message || `Load failed (${res.status})`);

        const list = Array.isArray(data?.studios) ? data.studios : [];

        const normalized = list.map((s) => ({
          ...s,
          slug: s.slug || s.id,
          coverUrl: toPublicUrl(s.coverUrl),
          logoUrl: toPublicUrl(s.logoUrl),
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
      { value: "nameAsc", label: "За назвою (A–Z)" },
    ],
    [],
  );

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

  const filtered = useMemo(() => {
    const cityN = normalize(applied.city);
    const catN = normalize(applied.category);

    const min = toNumber(applied.minPrice);
    const max = toNumber(applied.maxPrice);

    const qTokens = expandQueryTokens(applied.q);

    const scored = (studios || [])
      .map((s) => {
        const catNItem = normalize(s.category);
        const cityNItem = normalize(s.city);

        const matchCity = !cityN || cityNItem === cityN;
        const matchCategory = !catN || catNItem === catN;

        const priceFrom = toNumber(s.priceFrom);
        const matchMin = min == null || (priceFrom != null && priceFrom >= min);
        const matchMax = max == null || (priceFrom != null && priceFrom <= max);

        if (!matchCity || !matchCategory || !matchMin || !matchMax) {
          return { s, score: -1, matchQuery: false };
        }

        const nameTokens = tokensFrom(s.name);
        const categoryTokens = tokensFrom(s.category);
        const descTokens = tokensFrom(s.description);
        const servicesTokens = tokenizeAndStem(
          (Array.isArray(s.services)
            ? s.services.map((x) => x?.name)
            : []
          ).join(" "),
        );

        if (qTokens.length === 0) {
          return { s, score: 0, matchQuery: true };
        }

        const nameHits = countTokenHits(nameTokens, qTokens);
        const catHits = countTokenHits(categoryTokens, qTokens);
        const descHits = countTokenHits(descTokens, qTokens);
        const servicesHits = countTokenHits(servicesTokens, qTokens);

        const matchQuery = nameHits + catHits + descHits + servicesHits > 0;

        if (!matchQuery) {
          return { s, score: -1, matchQuery: false };
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

        return { s, score, matchQuery: true };
      })
      .filter((x) => x.matchQuery && x.score >= 0);

    const sorted = scored.sort((a, b) => {
      const aPrem = a.s.premium ? 1 : 0;
      const bPrem = b.s.premium ? 1 : 0;
      if (bPrem !== aPrem) return bPrem - aPrem;

      const ap = toNumber(a.s.priceFrom) ?? Number.POSITIVE_INFINITY;
      const bp = toNumber(b.s.priceFrom) ?? Number.POSITIVE_INFINITY;

      if (applied.sort === "priceAsc") return ap - bp;
      if (applied.sort === "priceDesc") return bp - ap;
      if (applied.sort === "nameAsc")
        return safeText(a.s.name).localeCompare(safeText(b.s.name));

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
          ? "Ціна ↑"
          : sort === "priceDesc"
            ? "Ціна ↓"
            : "Назва A–Z";

      chips.push({ key: "sort", label });
    }
    return chips;
  }, [q, city, category, minPrice, maxPrice, sort]);

  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isApplying, setIsApplying] = useState(false);

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

    setHasSearched(false);
  }

  function generateFakeRating(seed) {
    const str = String(seed || "");
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const normalized = Math.abs(hash % 1000) / 1000;

    // рейтинг 4.2 – 5.0
    const rating = 4.2 + normalized * 0.8;

    // кількість відгуків 5 – 120
    const reviewsCount = Math.floor(5 + normalized * 115);

    return {
      rating: Number(rating.toFixed(1)),
      reviewsCount,
    };
  }

  function removeChip(key) {
    if (key === "q") setQ("");
    if (key === "city") setCity("");
    if (key === "category") setCategory("");
    if (key === "minPrice") setMinPrice("");
    if (key === "maxPrice") setMaxPrice("");
    if (key === "sort") setSort("recommended");
  }

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
    setHasSearched(true);
    setIsApplying(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/20">
      <div className="mx-auto max-w-6xl px-3 pb-6 pt-12 sm:px-4 sm:pb-8 sm:pt-16">
        <div className="space-y-4 px-0 pt-3 sm:space-y-5 sm:pt-8 lg:pt-6">
          <section className="overflow-hidden rounded-[28px] border border-stone-200/60 bg-white shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)] sm:rounded-3xl">
            {" "}
            <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />
            <div className="px-3.5 pb-4 pt-3.5 sm:px-6 sm:pb-5 sm:pt-5 lg:px-8 lg:pt-6">
              <div className="mb-4 space-y-2.5 sm:mb-8 sm:space-y-3 lg:mb-10">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 sm:px-4 sm:py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 sm:h-4 sm:w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 sm:text-xs sm:tracking-[0.22em]">
                    Пошук студій
                  </span>
                </div>

                <h1 className="max-w-[260px] text-[30px] font-black leading-[0.95] tracking-[-0.04em] text-stone-800 sm:max-w-none sm:text-4xl lg:text-5xl">
                  Обирай та{" "}
                  <span className="text-amber-600">записуйся онлайн</span>
                </h1>

                <p className="hidden max-w-2xl text-base leading-7 text-stone-600 sm:block">
                  Обирай послуги поруч із тобою — швидко, зручно та без зайвих
                  дзвінків.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr]">
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

                <AnimatedDropdown
                  label="Сортування"
                  value={sort}
                  onChange={setSort}
                  placeholder=""
                  options={sortOptions}
                />
              </div>

              <div className="mt-3 flex flex-col gap-2.5 sm:mt-4 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {activeChips.length === 0 ? (
                    <span className="text-xs text-stone-500 sm:text-sm">
                      Фільтри не вибрані
                    </span>
                  ) : (
                    activeChips.map((ch) => (
                      <FilterChip
                        key={ch.key}
                        onClick={() => removeChip(ch.key)}
                      >
                        {ch.label}
                      </FilterChip>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={!hasPendingChanges || isApplying || isLoadingMore}
                    className={cn(
                      "flex h-11 flex-1 items-center justify-center gap-2 rounded-[18px] px-4 text-sm font-bold transition-all duration-200 active:scale-95 sm:h-auto sm:rounded-2xl sm:px-5 sm:py-3",
                      !hasPendingChanges || isApplying
                        ? "cursor-not-allowed border border-stone-200 bg-stone-100 text-stone-400 shadow-none"
                        : "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-[0_10px_24px_rgba(74,93,78,0.22)] hover:from-emerald-700 hover:to-emerald-800 hover:shadow-md",
                    )}
                  >
                    {isApplying ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                        Пошук...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Знайти
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={activeChips.length === 0}
                    className="h-11 shrink-0 whitespace-nowrap rounded-[18px] border border-stone-200 bg-white px-4 text-sm font-bold text-stone-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-auto sm:rounded-2xl sm:py-3"
                  >
                    Очистити все
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-2 text-sm text-stone-500">
            {loading && (
              <span className="rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                Завантаження...
              </span>
            )}

            {hasPendingChanges && !loading && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Натисніть “Знайти”
              </span>
            )}

            {!hasPendingChanges && hasSearched && !loading && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Знайдено: {filtered.length}
              </span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-stone-200/60 bg-white p-8 shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)] sm:p-10">
              <div className="mx-auto max-w-xl text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-stone-200 bg-stone-100">
                  <Search className="h-7 w-7 text-stone-500" />
                </div>

                <h3 className="mt-4 text-xl font-semibold tracking-tight text-stone-800">
                  Немає результатів за цими фільтрами
                </h3>
                <p className="mt-2 text-sm text-stone-500">
                  Спробуй змінити місто або категорію, або прибери частину
                  фільтрів — тоді ми покажемо більше доступних студій.
                </p>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-3 text-stone-600 transition-all duration-200 hover:bg-stone-50 hover:shadow-sm active:scale-[0.98] sm:w-auto"
                  >
                    Очистити фільтри
                  </button>
                </div>

                <p className="mt-4 text-xs text-stone-500">
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
                const { rating, reviewsCount } = generateFakeRating(studio.id);
                const isTopRated = rating >= 4.8;
                const address = [
                  studio?.street,
                  studio?.building,
                  studio?.apartment,
                ]
                  .filter(Boolean)
                  .join(", ");
                const fullAddress = [address, cityLabel]
                  .filter(Boolean)
                  .join(", ");

                const topServices = Array.isArray(studio.services)
                  ? studio.services
                      .map((s) => safeText(s?.name))
                      .filter(Boolean)
                      .slice(0, 3)
                  : [];
                const priceLabel =
                  studio.priceFrom != null && studio.priceFrom !== ""
                    ? `від ${studio.priceFrom} грн`
                    : null;

                return (
                  <div
                    key={studio.slug}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (location.pathname === "/") {
                        sessionStorage.setItem(
                          "studios-scroll-y",
                          String(window.scrollY),
                        );
                        sessionStorage.setItem("restore-studios-scroll", "1");
                      }
                      navigate(`/${studio.slug}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        sessionStorage.setItem(
                          "studios-scroll-y",
                          String(window.scrollY),
                        );
                        sessionStorage.setItem("restore-studios-scroll", "1");
                        navigate(`/${studio.slug}`);
                      }
                    }}
                    className={cn(
                      "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[30px] border transition-all duration-500 will-change-transform",
                      "bg-white/95 backdrop-blur-sm",
                      studio.premium
                        ? "border-amber-300/70 shadow-[0_20px_60px_rgba(217,168,72,0.22)] hover:-translate-y-2 hover:shadow-[0_28px_70px_rgba(217,168,72,0.30)]"
                        : "border-stone-200/80 shadow-[0_14px_38px_rgba(15,23,42,0.08)] hover:-translate-y-1.5 hover:border-stone-300 hover:shadow-[0_22px_48px_rgba(15,23,42,0.12)]",
                    )}
                  >
                    {studio.premium && (
                      <>
                        <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[linear-gradient(135deg,rgba(251,191,36,0.10),rgba(255,255,255,0),rgba(245,158,11,0.08))]" />
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-90" />
                      </>
                    )}

                    <div className="relative h-56 overflow-hidden">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={`${name} cover`}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                          loading="lazy"
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-sm text-stone-500">
                          Без обкладинки
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-900/20 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-r from-stone-950/20 via-transparent to-transparent" />

                      <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2">
                        {studio.premium && (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(245,158,11,0.30)]">
                            <Crown className="h-3.5 w-3.5" />
                            Premium
                          </div>
                        )}

                        {cat && (
                          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/12 px-3 py-1.5 text-[11px] font-semibold text-white/95 backdrop-blur-md">
                            {cat}
                          </div>
                        )}
                      </div>

                      {rating !== null && (
                        <div
                          className={cn(
                            "absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold backdrop-blur-md",
                            isTopRated
                              ? "border border-amber-300/50 bg-gradient-to-r from-amber-100/95 via-yellow-100/95 to-amber-200/95 text-amber-900 shadow-[0_10px_26px_rgba(245,158,11,0.25)]"
                              : "border border-white/20 bg-white/92 text-stone-800 shadow-[0_8px_22px_rgba(15,23,42,0.16)]",
                          )}
                        >
                          <Star
                            className={cn(
                              "h-3.5 w-3.5",
                              isTopRated
                                ? "fill-amber-500 text-amber-500"
                                : "fill-amber-400 text-amber-400",
                            )}
                          />
                          <span>{rating.toFixed(1)}</span>
                          {reviewsCount > 0 && (
                            <span
                              className={cn(
                                "font-semibold",
                                isTopRated
                                  ? "text-amber-800/80"
                                  : "text-stone-500",
                              )}
                            >
                              ({reviewsCount})
                            </span>
                          )}
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 z-20 p-4">
                        <div className="flex items-end gap-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[20px] border border-white/35 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] ring-1 ring-black/5">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={`${name} logo`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={(e) =>
                                  (e.currentTarget.style.display = "none")
                                }
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-[11px] font-bold text-stone-500">
                                LOGO
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 pb-1">
                            <h2 className="truncate text-xl font-black tracking-[-0.03em] text-white drop-shadow-sm">
                              {name}
                            </h2>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/90">
                              {cityLabel && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-4 w-4 text-rose-300" />
                                  {cityLabel}
                                </span>
                              )}

                              {priceLabel && (
                                <span className="rounded-full border border-white/15 bg-white/12 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                  {priceLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex flex-1 flex-col p-5">
                      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

                      <div className="space-y-4">
                        {description ? (
                          <p className="line-clamp-2 text-sm leading-6 text-stone-600">
                            {description}
                          </p>
                        ) : (
                          <p className="text-sm leading-6 text-stone-400">
                            Детальний опис студії скоро буде додано.
                          </p>
                        )}

                        {fullAddress && (
                          <div className="flex items-start gap-2.5 rounded-2xl border border-stone-200/80 bg-stone-50/80 px-3 py-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                              <MapPin className="h-4 w-4 text-rose-500" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
                                Адреса
                              </p>
                              <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-stone-700">
                                {fullAddress}
                              </p>
                            </div>
                          </div>
                        )}

                        {topServices.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
                              Популярні послуги
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {topServices.map((service) => (
                                <span
                                  key={service}
                                  className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto pt-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "relative flex h-12 w-full items-center justify-center overflow-hidden rounded-[18px]",
                              "px-4 text-sm font-semibold tracking-[-0.01em] transition-all duration-300",
                              "active:scale-[0.985]",
                              studio.premium
                                ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white shadow-[0_12px_28px_rgba(245,158,11,0.24)]"
                                : "border border-stone-200 bg-white text-stone-900 shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_14px_32px_rgba(15,23,42,0.10)]",
                            )}
                          >
                            {!studio.premium && (
                              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
                            )}

                            <span className="relative z-10 flex items-center gap-2.5">
                              <span
                                className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-full",
                                  studio.premium
                                    ? "bg-white/15"
                                    : "bg-emerald-50",
                                )}
                              >
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full",
                                    studio.premium
                                      ? "bg-white"
                                      : "bg-emerald-500",
                                  )}
                                />
                              </span>

                              <span>Переглянути студію</span>

                              <ArrowRight
                                className={cn(
                                  "h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5",
                                  studio.premium
                                    ? "text-white/90"
                                    : "text-stone-500",
                                )}
                              />
                            </span>
                          </div>

                          <div
                            className="relative z-20 flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <FavouriteButton studio={studio} />
                          </div>
                        </div>
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
                className={cn(
                  "flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-all duration-200 active:scale-95",
                  isLoadingMore
                    ? "cursor-not-allowed bg-stone-300 text-white/80"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-[0_10px_24px_rgba(74,93,78,0.22)] hover:from-emerald-700 hover:to-emerald-800 hover:shadow-md",
                )}
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
    </div>
  );
}
