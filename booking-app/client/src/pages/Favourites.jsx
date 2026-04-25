// Favourites.jsx
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Heart, MapPin } from "lucide-react";
import { useFavourites } from "../context/favourites.context";

const R2_PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return R2_PUBLIC ? `${R2_PUBLIC}/${s}` : s;
}

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

function getCategoryLabel(value) {
  const key = String(value || "").trim();
  return CATEGORY_LABELS[key] || key;
}

function safeText(v) {
  return String(v ?? "").trim();
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SkeletonPulse({ className = "" }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[var(--color-cream)]",
        className,
      )}
    />
  );
}

function FavouriteCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--color-mist)] bg-white shadow-[var(--shadow-soft)] sm:rounded-[30px]">
      <div className="relative h-40 overflow-hidden bg-[var(--color-cream)]">
        <SkeletonPulse className="h-full w-full rounded-none" />

        <div className="absolute bottom-4 left-4 z-30">
          <SkeletonPulse className="h-14 w-14 rounded-2xl bg-white/70" />
        </div>

        <div className="absolute left-4 top-4 z-20">
          <SkeletonPulse className="h-8 w-28 rounded-full bg-white/60" />
        </div>

        <div className="absolute right-4 top-4 z-20">
          <SkeletonPulse className="h-10 w-10 rounded-full bg-white/80" />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 p-4">
          <div className="pl-[72px]">
            <SkeletonPulse className="h-6 w-40 rounded-xl bg-white/70" />
            <SkeletonPulse className="mt-2 h-4 w-48 rounded-xl bg-white/50" />
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col p-5">
        <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-mist)] to-transparent" />
        <div className="mt-auto">
          <SkeletonPulse className="h-12 w-full rounded-[18px]" />
        </div>
      </div>
    </div>
  );
}

function FavouritesSkeleton() {
  return (
    <div className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+68px)] sm:pb-0">
      <div className="mx-auto max-w-6xl px-2.5 pb-4 pt-0 sm:px-4 sm:pb-8 sm:pt-14 lg:pt-16">
        <div className="space-y-3 px-0 pt-2 sm:space-y-5 sm:pt-8 lg:pt-6">
          <section className="overflow-hidden rounded-[24px] border border-[var(--color-mist)] bg-white shadow-[var(--shadow-soft)] sm:rounded-3xl">
            <div className="h-[2px] bg-[linear-gradient(90deg,var(--color-forest),var(--color-caramel),var(--color-ink))] opacity-40" />

            <div className="px-4 pb-7 pt-7 sm:px-6 sm:pb-4 sm:pt-5 lg:px-8 lg:pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-3 sm:space-y-2">
                  <SkeletonPulse className="hidden h-8 w-36 rounded-full sm:block" />
                  <SkeletonPulse className="h-10 w-[280px] max-w-full rounded-2xl sm:h-14 sm:w-[360px]" />
                  <SkeletonPulse className="h-4 w-[420px] max-w-full rounded-xl" />
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <FavouriteCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Favourites() {
  const { favourites, toggleFavourite, loading } = useFavourites();

  if (loading) {
    return <FavouritesSkeleton />;
  }

  if (!favourites || favourites.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-2.5 pb-4 pt-0 sm:px-4 sm:pb-8 sm:pt-14 lg:pt-16">
        <div className="space-y-3 px-0 pt-2 sm:space-y-5 sm:pt-8 lg:pt-6">
          <section className="overflow-hidden rounded-[24px] border border-[var(--color-mist)] bg-white shadow-[var(--shadow-soft)] sm:rounded-3xl">
            <div className="h-[2px] bg-[linear-gradient(90deg,var(--color-forest),var(--color-caramel),var(--color-ink))] opacity-70" />

            <div className="px-4 pb-7 pt-7 sm:px-6 sm:pb-4 sm:pt-5 lg:px-8 lg:pt-6">
              <div className="mb-5 space-y-3 sm:mb-4 sm:space-y-2 lg:mb-5">
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--color-pending-bg)] px-3 py-1 sm:px-4 sm:py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--color-forest)] sm:h-4 sm:w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-forest)] sm:text-xs sm:tracking-[0.22em]">
                    Збережені студії
                  </span>
                </div>

                <h1 className="max-w-full !text-[34px] font-black leading-tight tracking-[-0.03em] text-[var(--color-ink)] sm:max-w-none sm:!text-5xl lg:!text-5xl">
                  Ваші <span className="text-[var(--color-caramel)]">улюблені</span>
                </h1>

                <p className="max-w-2xl text-sm leading-6 text-[color:var(--color-caramel)]/85 sm:text-base sm:leading-7">
                  Тут з’являться студії, які ти додаси в обране. Зберігай цікаві
                  варіанти та повертайся до них у будь-який момент.
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--color-mist)] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
                <div className="mx-auto max-w-xl text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-[var(--color-mist)] bg-[var(--color-cream)]">
                    <Heart className="h-7 w-7 text-[var(--color-danger)]" />
                  </div>

                  <h2 className="mt-4 text-xl font-semibold tracking-tight text-[var(--color-ink)]">
                    Поки що обране порожнє
                  </h2>

                  <p className="mt-2 text-sm text-[color:var(--color-caramel)]/85">
                    Додай кілька студій до улюблених, щоб швидко знаходити їх і
                    записуватись без повторного пошуку.
                  </p>

                  <Link
                    to="/"
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-[18px] bg-[var(--color-forest)] px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-button)] transition-all duration-200 hover:bg-[var(--color-forest-dark)] hover:shadow-md active:scale-95"
                  >
                    Перейти до салонів
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+68px)] sm:pb-0">
      <div className="mx-auto max-w-6xl px-2.5 pb-4 pt-0 sm:px-4 sm:pb-8 sm:pt-14 lg:pt-16">
        <div className="space-y-3 px-0 pt-2 sm:space-y-5 sm:pt-8 lg:pt-6">
          <section className="overflow-hidden rounded-[24px] border border-[var(--color-mist)] bg-white shadow-[var(--shadow-soft)] sm:rounded-3xl">
            <div className="h-[2px] bg-[linear-gradient(90deg,var(--color-forest),var(--color-caramel),var(--color-ink))] opacity-70" />

            <div className="px-4 pb-7 pt-7 sm:px-6 sm:pb-4 sm:pt-5 lg:px-8 lg:pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-3 sm:space-y-2">
                  <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--color-pending-bg)] px-3 py-1 sm:px-4 sm:py-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--color-forest)] sm:h-4 sm:w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-forest)] sm:text-xs sm:tracking-[0.22em]">
                      Улюблені студії
                    </span>
                  </div>

                  <h1 className="max-w-full !text-[34px] font-black leading-tight tracking-[-0.03em] text-[var(--color-ink)] sm:max-w-none sm:!text-5xl lg:!text-5xl">
                    Ваші <span className="text-[var(--color-caramel)]">улюблені</span>
                  </h1>

                  <p className="max-w-2xl text-sm leading-6 text-[color:var(--color-caramel)]/85 sm:text-base sm:leading-7">
                    Усі студії, які ти зберіг, знаходяться тут. Можна швидко
                    переглянути деталі або прибрати зайве з обраного.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {favourites.map((s) => {
              const logoUrl = toPublicUrl(s.logoUrl);
              const name = safeText(s.name) || "Студія";
              const city = safeText(s.city);
              const category = safeText(s.category);
              const coverUrl = toPublicUrl(s.coverUrl);

              const address = [s?.street, s?.building, s?.apartment]
                .filter(Boolean)
                .join(", ");

              const fullAddress = [city, address].filter(Boolean).join(", ");

              return (
                <Link
                  key={s.slug}
                  to={`/${s.slug}`}
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden rounded-[24px] border bg-white transition-all duration-500 will-change-transform sm:rounded-[30px]",
                    "border-[var(--color-mist)] shadow-[var(--shadow-soft)] hover:-translate-y-1 hover:border-[var(--color-sand)] hover:shadow-[var(--shadow-soft-hover)] sm:hover:-translate-y-1.5",
                  )}
                >
                  <div className="relative h-40 overflow-hidden bg-[var(--color-cream)]">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={`${name} cover`}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                        loading="lazy"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--color-cream),var(--color-mist))] text-sm text-[var(--color-caramel)]">
                        Без обкладинки
                      </div>
                    )}

                    {logoUrl && (
                      <div className="absolute bottom-4 left-4 z-30">
                        <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/20 bg-[var(--color-ink)] shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
                          <img
                            src={logoUrl}
                            alt={`${name} logo`}
                            className="h-full w-full object-cover"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2">
                      {category ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                          <span className="h-2 w-2 rounded-full bg-[var(--color-confirmed-bg)] shadow-[0_0_8px_rgba(50,78,41,0.65)]" />
                          {getCategoryLabel(category)}
                        </div>
                      ) : null}
                    </div>

                    <div className="absolute right-4 top-4 z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavourite(s);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/90 text-[var(--color-danger)] shadow-[0_8px_22px_rgba(15,23,42,0.16)] backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-[var(--color-danger-bg)] active:scale-95"
                      >
                        <Heart className="h-5 w-5 fill-[var(--color-danger)] text-[var(--color-danger)]" />
                      </button>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 z-20 p-4">
                      <div className="min-w-0 pl-[72px]">
                        <h2 className="truncate text-xl font-black text-white">
                          {name}
                        </h2>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/90">
                          {fullAddress && (
                            <div className="flex max-w-full items-start gap-1">
                              <MapPin className="mt-[2px] h-4 w-4 shrink-0 text-[var(--color-sand)]" />
                              <span className="line-clamp-3 text-left">
                                {fullAddress}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex flex-1 flex-col p-5">
                    <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-mist)] to-transparent" />

                    <div className="mt-auto">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-[18px] border border-[var(--color-mist)] bg-white px-4 text-sm font-semibold tracking-[-0.01em] text-[var(--color-ink)] shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-sand)] hover:bg-[var(--color-cream)] hover:shadow-[var(--shadow-soft)] active:scale-[0.985]">
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

                          <span className="relative z-10 flex items-center gap-2.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-confirmed-bg)]">
                              <span className="h-2 w-2 rounded-full bg-[var(--color-forest)]" />
                            </span>

                            <span>Переглянути студію</span>

                            <ArrowRight className="h-4 w-4 text-[var(--color-caramel)] transition-transform duration-300 group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
