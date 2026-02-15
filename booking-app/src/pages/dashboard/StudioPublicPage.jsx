import { useMemo, useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { studios } from '../../data/studios'
import StudioBookingWidget from '../../components/StudioBookingWidget'

function parsePortfolioUrls(value) {
  const raw = String(value || '').trim()
  if (!raw) return []
  return raw
    .split(/[\n,]/g)
    .map(s => s.trim())
    .filter(Boolean)
}

function safe(v) {
  return String(v || '').trim()
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      {/* dialog */}
      <div className="relative mx-auto flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border bg-white shadow-[0_40px_120px_-60px_rgba(0,0,0,0.65)]">
          {/* top bar */}
          <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Онлайн бронювання
              </p>
              <h3 className="mt-1 truncate text-xl font-semibold text-gray-900">
                {title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Заповніть дані та оберіть час — підтвердження миттєво
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-gray-200 bg-white p-2 hover:bg-gray-50 active:scale-[0.99] transition"
              aria-label="Close"
            >
              <span className="text-lg leading-none">✕</span>
            </button>
          </div>

          {/* body */}
          <div className="max-h-[calc(100vh-160px)] overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-800 backdrop-blur">
      {children}
    </span>
  )
}

function InfoRow({ icon, label, value }) {
  if (!value) return null
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
  )
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
  )
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
  )
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
  )
}

export default function StudioPublicPage() {
  const { slug } = useParams()
  const [openBooking, setOpenBooking] = useState(false)

  useEffect(() => {
    if (openBooking) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [openBooking])

const studio = useMemo(() => studios.find(s => s.slug === slug), [slug])


  if (!studio) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-[28px] border bg-white p-7 shadow-sm ">
          <h1 className="text-2xl font-bold text-gray-900 ">Студію не знайдено</h1>
          <Link
            to="/studios"
            className="mt-2 inline-flex text-sm font-semibold text-gray-700 underline underline-offset-4 hover:text-gray-900"
          >
            ← Повернутись до списку
          </Link>
        </div>
      </div>
    )
  }
  const serviceCategories = studio.serviceCategories || []
  const name = safe(studio.name) || 'Студія'
  const category = safe(studio.category) || 'Категорія'
  const city = safe(studio.city)
  const description = safe(studio.description)
  const coverUrl = safe(studio.coverUrl)
  const logoUrl = safe(studio.logoUrl)
  const instagram = safe(studio.instagram)
  const website = safe(studio.website)
  const street = safe(studio.street)
  const building = safe(studio.building)
  const apartment = safe(studio.apartment)
  const address = [street, building, apartment].filter(Boolean).join(', ')

  const portfolio = parsePortfolioUrls(studio.portfolioUrls)
  const priceFrom = studio.priceFrom

  return (
    <div className="min-h-screen ">
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

<Link
  to="/studios"
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
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="h-4 w-4"
  >
    <path
      d="M15 18l-6-6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>

  Назад
</Link>



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

        <p className="text-sm text-gray-600">
          {[city, address].filter(Boolean).join(", ")}
        </p>
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

    {/* Links */}
    <div className="mt-5 flex flex-wrap gap-2">
      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Instagram
        </a>
      )}
      {website && (
        <a
          href={website}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Сайт
        </a>
      )}
      {(!instagram && !website) && (
        <span className="text-sm text-gray-600">Посилання не додані.</span>
      )}
    </div>


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

{/* Services (categories accordion) */}
<section className="rounded-[28px] p-6 sm:p-7 ">
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 className="text-xl font-bold text-gray-900">Оберіть категорію та перегляньте доступні послуги</h2>
      {/* <p className="mt-1 text-sm text-gray-600">
        Оберіть категорію — перегляньте доступні послуги
      </p> */}
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
          className="group overflow-hidden rounded-2xl border bg-white"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 hover:bg-gray-50">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {(cat.services || []).length} послуг
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-400 group-open:rotate-180 transition">
                ▼
              </span>
            </div>
          </summary>

          <div className="border-t bg-white p-4">
            {(cat.services || []).length === 0 ? (
              <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
                У цій категорії поки немає послуг.
              </div>
            ) : (
              <div className="space-y-2">
                {(cat.services || []).map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-gray-50 p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {s.duration ? `${s.duration} хв` : null}
                        {s.duration && s.price ? " • " : null}
                        {s.price ? `${s.price} грн` : null}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenBooking(true)}
                      className="rounded-xl ui-button-one"
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

  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      <p className="text-xs font-medium text-emerald-800">
        Підтвердження запису буде надіслано на ваш номер телефону.
      </p>
    </div>
  </div>
</section>
        {/* Portfolio section redesigned */}
        <section className="rounded-[28px] border bg-white p-6 sm:p-7 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Портфоліо</h2>
              <p className="mt-1 text-sm text-gray-600">
                Приклади робіт та атмосфера студії
              </p>
            </div>

            <div className="rounded-full border bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700">
              {portfolio.length ? `${portfolio.length} фото` : 'немає фото'}
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
                  className="group overflow-hidden rounded-2xl border bg-gray-100"
                >
                  <div className="aspect-[4/3]">
                    <img
                      src={url}
                      alt={`portfolio ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      loading="lazy"
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Mobile bottom CTA bar */}
        {/* <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 px-2 py-0">
          <button
            type="button"
            onClick={() => setOpenBooking(true)}
            className="w-full rounded-2xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-black active:scale-[0.99] transition"
          >
            Записатись онлайн
          </button>
        </div> */}

        {/* Booking modal */}
        <Modal open={openBooking} title={name} onClose={() => setOpenBooking(false)}>
          <StudioBookingWidget studio={studio} />
        </Modal>

        {/* Spacer for mobile fixed bar */}
        <div className="sm:hidden h-16" />
      </div>
    </div>
  )
}
