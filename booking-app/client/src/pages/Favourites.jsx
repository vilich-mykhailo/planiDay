import { Link } from "react-router-dom";
import { useFavourites } from "../context/favourites.context";

function safeText(v) {
  return String(v ?? "").trim();
}

export default function Favourites() {
  const { favourites, toggleFavourite, } = useFavourites();

  if (!favourites || favourites.length === 0) {
    return (
          <div className="pt-6 px-4 sm:pt-8 sm:px-6 lg:pt-6 lg:px-8 space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
              <path
                d="M12 21s-7-4.35-9.33-8.28C1.1 9.9 2.07 6.9 4.7 5.5 7.33 4.1 10 5.7 12 8c2-2.3 4.67-3.9 7.3-2.5 2.63 1.4 3.6 4.4 2.03 7.22C19 16.65 12 21 12 21Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold text-gray-900">Обране</h1>
          <p className="mt-2 text-sm text-gray-600">
            Тут з’являться салони, які ти збережеш. Додай пару студій — і повертайся сюди,
            щоб швидко записуватись.
          </p>

          <Link
            to="/studios"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-extrabold text-white hover:bg-gray-900 transition"
          >
            Перейти до салонів →
          </Link>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="pt-6 px-4 sm:pt-8 sm:px-6 lg:pt-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
<div className="text-center sm:text-left">
  <h1 className="text-2xl font-extrabold text-gray-900">
    Улюблені
  </h1>

</div>

          <Link
            to="/studios"
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-extrabold text-gray-900 hover:bg-gray-50 transition"
          >
            Додати ще салони
          </Link>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {favourites.map((s) => {
          const name = safeText(s.name) || "Студія";
          const city = safeText(s.city);
          const category = safeText(s.category);
          const coverUrl = safeText(s.coverUrl);
          const priceFrom = s.priceFrom;



          return (
            <Link
              key={s.slug}
              to={`/studios/${s.slug}`}
              className="
                group relative overflow-hidden
                rounded-2xl border border-gray-200 bg-white
                transition-all duration-300
                hover:-translate-y-[2px] hover:shadow-md hover:border-gray-300
                active:scale-[0.99]
              "
            >
              {/* cover */}
              <div className="relative h-28 bg-gray-100">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={`${name} cover`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                    Без обкладинки
                  </div>
                )}


              </div>

              {/* body */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-gray-900">
                      {name}
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {category || "Категорія"}
                      {city ? ` • ${city}` : ""}
                    </p>
                  </div>

                  {priceFrom != null && (
                    <div className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-900">
                      від {priceFrom} грн
                    </div>
                  )}
                </div>

<div className="mt-4 flex items-center justify-between">
  <span className="text-sm font-semibold text-gray-900 group-hover:underline">
    Переглянути →
  </span>

  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavourite(s);
    }}
    className="
      flex items-center justify-center
      h-10 w-10
      rounded-full
      border border-gray-200
      bg-white
      transition-all duration-200
      hover:bg-rose-50 hover:border-rose-200
      active:scale-95
      cursor-pointer
    "
    aria-label="Прибрати з обраного"
  >
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="#ef4444"
      stroke="#ef4444"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20.5L4.8 13.3C2.9 11.4 2.9 8.3 4.8 6.4C6.7 4.5 9.8 4.5 11.7 6.4L12 6.7L12.3 6.4C14.2 4.5 17.3 4.5 19.2 6.4C21.1 8.3 21.1 11.4 19.2 13.3L12 20.5Z" />
    </svg>
  </button>
</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}