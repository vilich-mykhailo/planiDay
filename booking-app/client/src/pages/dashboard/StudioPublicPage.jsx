import { useMemo, useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { studios } from "../../data/studios";
import StudioBookingWidget from "../../components/StudioBookingWidget";

function parsePortfolioUrls(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];
  return raw
    .split(/[\n,]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function safe(v) {
  return String(v || "").trim();
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
      />

      {/* Modal wrapper */}
      <div className="relative z-10 m-auto w-full max-w-4xl px-3 sm:px-6">
        <div
          className="
        flex flex-col
        max-h-[95vh]
        overflow-hidden
        rounded-[28px]
        border border-gray-200
        bg-white
        shadow-[0_40px_140px_-60px_rgba(0,0,0,0.75)]
      "
          role="dialog"
          aria-modal="true"
        >
          {/* 🔝 TOP (fixed) */}
          <div className="flex-shrink-0 border-b bg-white px-5 sm:px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Онлайн бронювання
                </p>
                <h3 className="mt-1 truncate text-lg sm:text-xl font-extrabold text-gray-900">
                  {title}
                </h3>
                <p className="hidden sm:block mt-1 text-sm text-gray-600">
                  Заповніть дані та оберіть час — підтвердження миттєво
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 🔄 MIDDLE (scroll only here) */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 pt-6 pb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-800 backdrop-blur">
      {children}
    </span>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
      <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl border border-gray-200 bg-white text-gray-900">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function IconClockMini() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 8v5l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconPinMini() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconMoneyMini() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M4 7h16v10H4V7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M7 10h0M17 14h0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function StudioPublicPage() {
  const { slug } = useParams();

  const navigate = useNavigate();
  const [openBooking, setOpenBooking] = useState(false);
  const onClose = () => setOpenBooking(false);
  const [copied, setCopied] = useState(false);
  const [preselectedService, setPreselectedService] = useState(null);
  useEffect(() => {
    if (openBooking) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openBooking]);

  const studio = useMemo(() => studios.find((s) => s.slug === slug), [slug]);

  if (!studio) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-[28px] border bg-white p-7 shadow-sm ">
          <h1 className="text-2xl font-bold text-gray-900 ">
            Студію не знайдено
          </h1>
          <Link
            to="/studios"
            className="mt-2 inline-flex text-sm font-semibold text-gray-700 underline underline-offset-4 hover:text-gray-900"
          >
            ← Повернутись до списку
          </Link>
        </div>
      </div>
    );
  }
  const serviceCategories = studio.serviceCategories || [];
  const name = safe(studio.name) || "Студія";
  const category = safe(studio.category) || "Категорія";
  const city = safe(studio.city);
  const description = safe(studio.description);
  const coverUrl = safe(studio.coverUrl);
  const logoUrl = safe(studio.logoUrl);
  const street = safe(studio.street);
  const building = safe(studio.building);
  const apartment = safe(studio.apartment);
  const address = [street, building, apartment].filter(Boolean).join(", ");

  const portfolio = parsePortfolioUrls(studio.portfolioUrls);
  const priceFrom = studio.priceFrom;

  return (
    <div className="min-h-[100dvh]">
      <div className="mx-auto w-full max-w-6xl px-0 sm:px-5 lg:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6">
        {/* Top nav */}
        {/* <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setOpenBooking(true)}
            className="hidden sm:inline-flex rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black active:scale-[0.99] transition"
          >
            Записатись онлайн
          </button>
        </div> */}

        {/* HERO: cover + info under photo */}
        <section className="rounded-[28px] border bg-white shadow-sm overflow-hidden">
          {/* Cover */}
          <div className="relative h-44 sm:h-52 md:h-64 lg:h-72 bg-gray-100 overflow-hidden">
            <button
              onClick={() => navigate(-1)}
              className="
    absolute top-3 left-3 z-10
    inline-flex items-center gap-1.5
    rounded-lg sm:rounded-xl
    bg-white/50 backdrop-blur-md
    px-2.5 py-2
    text-xs sm:text-sm font-semibold text-gray-900
    shadow-sm
    hover:bg-white
    active:scale-[0.97]
    transition
  "
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Назад
            </button>

            {coverUrl ? (
              <img
                src={coverUrl}
                alt={`${name} cover`}
                className="h-full w-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Обкладинка не додана
              </div>
            )}

            {/* soft overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />

            {/* category/city on photo */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/60 backdrop-blur-md border border-white/40 px-3 py-1 text-xs font-semibold text-gray-900 shadow-sm">
                {category}
              </span>

              {city && (
                <span className="rounded-full bg-white/60 backdrop-blur-md border border-white/40 px-3 py-1 text-xs font-semibold text-gray-900 shadow-sm">
                  {city}
                </span>
              )}

              {priceFrom != null && (
                <span className="rounded-full bg-white/60 backdrop-blur-md border border-white/40 px-3 py-1 text-xs font-semibold text-gray-900 shadow-sm">
                  від {priceFrom} грн
                </span>
              )}
            </div>
          </div>

          {/* Under photo: logo + name + address */}
          <div className="p-5 sm:p-7">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-2xl border bg-gray-50 flex-shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${name} logo`}
                    className="h-full w-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs font-semibold text-gray-400">
                    LOGO
                  </div>
                )}
              </div>

              {/* Title + address */}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 pb-1 sm:pb-1">
                  {name}
                </h1>

                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm text-gray-600">
                    {[city, address].filter(Boolean).join(", ")}
                  </p>

                  <button
                    type="button"
                    onClick={async () => {
                      const text = [city, address].filter(Boolean).join(", ");
                      if (!text) return;

                      try {
                        await navigator.clipboard.writeText(text);
                      } catch {
                        // fallback для старих браузерів / http
                        const el = document.createElement("textarea");
                        el.value = text;
                        el.setAttribute("readonly", "");
                        el.style.position = "fixed";
                        el.style.top = "-9999px";
                        document.body.appendChild(el);
                        el.select();
                        document.execCommand("copy");
                        document.body.removeChild(el);
                      }

                      setCopied(true);
                      window.clearTimeout(window.__copyAddrTimer);
                      window.__copyAddrTimer = window.setTimeout(
                        () => setCopied(false),
                        1400,
                      );
                    }}
                    className="group relative inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition"
                    aria-label="Скопіювати адресу"
                    title={copied ? "Скопійовано!" : "Скопіювати адресу"}
                  >
                    {/* Copy icon */}
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                      <path
                        d="M9 9h10v10H9V9Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Tooltip */}
                    <span
                      className={`
        pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2
        whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2 py-1
        text-[11px] font-semibold text-gray-800 shadow-sm
        opacity-0 translate-y-1 transition
        group-hover:opacity-100 group-hover:translate-y-0
        ${copied ? "opacity-100 translate-y-0" : ""}
      `}
                    >
                      {copied ? "Скопійовано!" : "Копіювати"}
                    </span>
                  </button>
                </div>
              </div>

              {/* CTA (desktop) */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenBooking(true)}
                  className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black active:scale-[0.99] transition"
                >
                  Записатись онлайн
                </button>
              </div>
            </div>

            {/* Description */}
            {description ? (
              <p className="mt-4 text-sm leading-6 text-gray-600">
                {description}
              </p>
            ) : (
              <p className="mt-4 text-sm text-gray-600">Опис ще не додано.</p>
            )}

            {/* CTA (mobile) */}
            <button
              type="button"
              onClick={() => setOpenBooking(true)}
              className="mt-5 sm:hidden w-full rounded-2xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-black active:scale-[0.99] transition"
            >
              Записатись онлайн
            </button>

            {/* Helper */}
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-medium text-emerald-800">
                  Підтвердження запису буде надіслано на ваш номер телефону.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="rounded-[28px] border bg-white p-6 sm:p-7 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Послуги</h2>
              <p className="mt-1 text-sm text-gray-600">
                Оберіть категорію та запишіться на конкретну послугу
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpenBooking(true)}
                className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black active:scale-[0.99] transition"
              >
                Відкрити форму запису
              </button>
            </div>
          </div>

          {serviceCategories.length === 0 ? (
            <div className="mt-5 rounded-2xl border bg-gray-50 p-5 text-sm text-gray-600">
              Послуги ще не додані.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {serviceCategories.map((cat) => (
                <details
                  key={cat.id}
                  className="group overflow-hidden rounded-3xl border bg-white"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5 hover:bg-gray-50">
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-bold text-gray-900">
                        {cat.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {(cat.services || []).length} послуг
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-2xl border border-gray-200 bg-white text-gray-500 group-open:rotate-180 transition">
                        ▼
                      </span>
                    </div>
                  </summary>

                  <div className="border-t bg-gradient-to-b from-white to-gray-50 p-4 sm:p-5">
                    {(cat.services || []).length === 0 ? (
                      <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-600">
                        У цій категорії поки немає послуг.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(cat.services || []).map((s) => (
                          <div
                            key={s.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border bg-white p-4 shadow-[0_10px_35px_-28px_rgba(0,0,0,0.30)]"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900">
                                {s.name}
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {s.duration ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                    <IconClockMini />
                                    {s.duration} хв
                                  </span>
                                ) : null}

                                {s.price ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                    <IconMoneyMini />
                                    {s.price} грн
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setPreselectedService({
                                  categoryId: cat.id,
                                  serviceId: s.id,
                                });
                                setOpenBooking(true);
                              }}
                              className="rounded-2xl ui-button-one"
                            >
                              Записатись
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>

        {/* PORTFOLIO */}
        <section className="rounded-[28px] border bg-white p-6 sm:p-7 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Портфоліо
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Приклади робіт та атмосфера студії
              </p>
            </div>
          </div>

          {portfolio.length === 0 ? (
            <div className="mt-5 rounded-2xl border bg-gray-50 p-5 text-sm text-gray-600">
              Поки що немає прикладів робіт.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {portfolio.slice(0, 12).map((url, idx) => (
                <div
                  key={url + idx}
                  className="group overflow-hidden rounded-3xl border bg-gray-100 shadow-[0_12px_45px_-40px_rgba(0,0,0,0.55)]"
                >
                  <div className="aspect-[4/3]">
                    <img
                      src={url}
                      alt={`portfolio ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                      loading="lazy"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Modal
          open={openBooking}
          title={name}
          onClose={() => {
            setOpenBooking(false);
            setPreselectedService(null);
          }}
        >
          <StudioBookingWidget
            studio={studio}
            preselectedService={preselectedService}
            onCancel={onClose}
          />
        </Modal>

        {/* Spacer for mobile fixed bar */}
        <div className="sm:hidden h-16" />
      </div>
    </div>
  );
}
