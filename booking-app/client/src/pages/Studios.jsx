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
      { value: "recommended", label: "Рекомендовані" },
      { value: "priceAsc", label: "Ціна: ↑" },
      { value: "priceDesc", label: "Ціна: ↓" },
      { value: "nameAsc", label: "Назва: A–Z" },
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
          (Array.isArray(s.services) ? s.services.map((x) => x?.name) : []).join(" "),
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
          ? "Сортування: ціна ↑"
          : sort === "priceDesc"
            ? "Сортування: ціна ↓"
            : "Сортування: назва A–Z";
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
    setIsApplying(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/20">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-20">
        <div className="space-y-5 px-0 pt-6 sm:px-0 sm:pt-8 lg:pt-6">
          <section className="overflow-hidden rounded-3xl border border-stone-200/60 bg-white shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]">
            <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

            <div className="px-4 pb-5 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pt-6">
              <div className="mb-6 space-y-3 sm:mb-8 lg:mb-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-1.5">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
                    Пошук студій
                  </span>
                </div>

                <h1 className="text-3xl font-black tracking-[-0.03em] text-stone-800 sm:text-4xl lg:text-5xl">
                  Обирай та <span className="text-amber-600">записуйся онлайн</span>
                </h1>

                <p className="hidden max-w-2xl text-base leading-7 text-stone-600 sm:block">
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

                <AnimatedDropdown
                  label="Сортування"
                  value={sort}
                  onChange={setSort}
                  placeholder=""
                  options={sortOptions}
                />
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {activeChips.length === 0 ? (
                    <span className="text-sm text-stone-500">Фільтри не вибрані</span>
                  ) : (
                    activeChips.map((ch) => (
                      <FilterChip key={ch.key} onClick={() => removeChip(ch.key)}>
                        {ch.label}
                      </FilterChip>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">
                    Знайдено:{" "}
                    <span className="font-semibold text-stone-800">
                      {filtered.length}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={!hasPendingChanges || isApplying || isLoadingMore}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-200 active:scale-95",
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
                    className="shrink-0 whitespace-nowrap rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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

            {hasPendingChanges && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Натисніть “Знайти”
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

                const street = safeText(studio.street);
                const building = safeText(studio.building);
                const address = [street, building].filter(Boolean).join(", ");

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
                        navigate(`/${studio.slug}`);
                      }
                    }}
                    className={cn(
                      "group relative flex h-full cursor-pointer flex-col overflow-visible rounded-[26px] border bg-white transform-gpu transition-all duration-300 will-change-transform active:scale-[0.98]",
                      studio.premium
                        ? "border-amber-300 hover:-translate-y-[4px] hover:border-amber-400 hover:shadow-[0_14px_34px_rgba(221,181,108,0.24)]"
                        : "border-stone-200 hover:-translate-y-[2px] hover:border-stone-300 hover:shadow-[0_12px_28px_rgba(93,64,55,0.08)]",
                    )}
                  >
                    {studio.premium && (
                      <div className="absolute right-3 top-3 z-50 flex items-center gap-1 rounded-full border border-yellow-300/40 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-lg backdrop-blur-sm pointer-events-none">
                        <Crown className="h-3.5 w-3.5" />
                        PREMIUM
                      </div>
                    )}

                    <div className="relative shrink-0 overflow-hidden rounded-t-[26px]">
                      <div className="relative h-28 bg-stone-100">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={`${name} cover`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-stone-500">
                            Без обкладинки
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="absolute left-4 top-[88px] z-40 h-12 w-12 overflow-hidden rounded-[18px] border border-stone-200 bg-white shadow-[0_8px_18px_rgba(93,64,55,0.10)]">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={`${name} logo`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-stone-400">
                          LOGO
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col px-4 pb-4 pt-8">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-semibold text-stone-800">
                            {name}
                          </h2>

                          <p className="mt-0.5 text-sm text-stone-500">
                            {cat || "Категорія"}
                            {cityLabel ? ` • ${cityLabel}` : ""}
                          </p>
                        </div>

                        {studio.priceFrom != null && (
                          <div className="shrink-0 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1 text-sm font-semibold text-stone-800">
                            від {studio.priceFrom} грн
                          </div>
                        )}
                      </div>

                      {description && (
                        <p className="mt-3 line-clamp-2 text-sm text-stone-600">
                          {description}
                        </p>
                      )}

                      {address && (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-stone-500">
                          <MapPin className="h-4 w-4" />
                          {address}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-4">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-stone-800 group-hover:underline">
                          Переглянути <ArrowRight className="h-4 w-4" />
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