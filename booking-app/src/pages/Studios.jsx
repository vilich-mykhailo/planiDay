import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { studios } from "../data/studios";
import AnimatedField from "../components/AnimatedField";
import AnimatedDropdown from "../components/AnimatedDropdown";
import FavouriteButton from "../components/FavouriteButton";
import PremiumBadge from "../components/PremiumBadge";

function safeText(v) {
  return String(v ?? "").trim();
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

export default function Studios() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ initial values з URL (тільки 1 раз)
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
  }, []);

  const categories = useMemo(() => {
    const set = new Set(
      (studios || []).map((s) => safeText(s.category)).filter(Boolean),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  // ✅ Filtered + Sorted
  const filtered = useMemo(() => {
    const query = normalize(applied.q);
    const cityN = normalize(applied.city);
    const catN = normalize(applied.category);

    const min = toNumber(applied.minPrice);
    const max = toNumber(applied.maxPrice);

    let list = (studios || []).filter((s) => {
      const nameN = normalize(s.name);
      const catNItem = normalize(s.category);
      const cityNItem = normalize(s.city);
      const descN = normalize(s.description);
      const streetN = normalize(s.street);
      const buildingN = normalize(s.building);

      const matchQuery =
        !query ||
        nameN.includes(query) ||
        catNItem.includes(query) ||
        cityNItem.includes(query) ||
        descN.includes(query) ||
        streetN.includes(query) ||
        buildingN.includes(query);

      const matchCity = !cityN || cityNItem === cityN;
      const matchCategory = !catN || catNItem === catN;

      const priceFrom = toNumber(s.priceFrom);
      const matchMin = min == null || (priceFrom != null && priceFrom >= min);
      const matchMax = max == null || (priceFrom != null && priceFrom <= max);

      return matchQuery && matchCity && matchCategory && matchMin && matchMax;
    });

    list = [...list].sort((a, b) => {
      const ap = toNumber(a.priceFrom) ?? Number.POSITIVE_INFINITY;
      const bp = toNumber(b.priceFrom) ?? Number.POSITIVE_INFINITY;

      if (applied.sort === "priceAsc") return ap - bp;
      if (applied.sort === "priceDesc") return bp - ap;
      if (applied.sort === "nameAsc")
        return safeText(a.name).localeCompare(safeText(b.name));
      return 0;
    });

    return list;
  }, [applied]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
          Обирай та <span className="text-blue-600">записуйся онлайн</span>
        </h1>

        <p className="max-w-2xl text-base text-gray-600">
          Обирай послуги поруч із тобою — швидко, зручно та без зайвих дзвінків.
        </p>
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
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

        {hasPendingChanges && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            Натисніть “Знайти”
          </span>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-gray-900">
            Нічого не знайдено
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Спробуй інші фільтри або очисти все.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="w-full ui-button ui-button-secondary">
              Очистити
            </button>

            <button className="w-full ui-button">Закрити</button>
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
              <Link
                key={studio.slug}
                to={`/studios/${studio.slug}`}
className="
  group
  block
  overflow-hidden
  rounded-2xl
  border border-gray-200
  bg-white
  transform-gpu isolate will-change-transform
  transition-all duration-200
  hover:bg-gray-50
  hover:border-gray-300
  hover:shadow-md
  hover:-translate-y-[2px]
  active:scale-[0.98]
"
              >
                {/* Cover */}
                <div className="relative h-28 bg-gray-100">
                  {studio.premium && <PremiumBadge />}

                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={`${name} cover`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                      Без обкладинки
                    </div>
                  )}

                  {/* Logo */}
                  <div className="absolute -bottom-6 left-4 h-12 w-12 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={`${name} logo`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-gray-400">
                        LOGO
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-4 pt-8">
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

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 group-hover:underline">
                      Переглянути →
                    </span>

  <FavouriteButton />


                  </div>
                </div>
              </Link>
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
  );
}
