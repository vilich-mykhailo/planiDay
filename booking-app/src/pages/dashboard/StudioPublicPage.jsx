import { useMemo, useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { studios } from '../../data/studios'
import StudioBookingWidget from '../../components/StudioBookingWidget'

// ✅ ВАЖЛИВО: тут підключи свій існуючий компонент бронювання
// Напр: import BookingWidget from '../components/BookingWidget'
// або import Booking from '../components/Booking'
// Я залишив плейсхолдер нижче, щоб логіку не чіпати.

function parsePortfolioUrls(value) {
  const raw = String(value || '').trim()
  if (!raw) return []

  // підтримка: "url1, url2" або з нового рядка
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
    <div className="fixed inset-0 z-50 bg-black/40 px-4 py-6">
      <div className="mx-auto flex max-h-[calc(100vh-48px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header (завжди зверху) */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Онлайн запис
            </p>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ui-button ui-button-secondary"
          >
            Закрити
          </button>
        </div>

        {/* Body (скролиться) */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  )
}


export default function StudioPublicPage() {
  const { slug } = useParams()
  const [openBooking, setOpenBooking] = useState(false)

useEffect(() => {
  if (openBooking) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }

  return () => {
    document.body.style.overflow = ''
  }
}, [openBooking])

  const studio = useMemo(() => {
    return studios.find(s => s.slug === slug)
  }, [slug])

  if (!studio) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Студію не знайдено</h1>
        <Link to="/studios" className="text-sm font-medium text-gray-700 underline">
          ← Повернутись до списку
        </Link>
      </div>
    )
  }

  
  const name = safe(studio.name) || 'Студія'
  const category = safe(studio.category) || 'Категорія'
  const city = safe(studio.city)
  const description = safe(studio.description)
  const coverUrl = safe(studio.coverUrl)
  const logoUrl = safe(studio.logoUrl)
  const instagram = safe(studio.instagram)
  const website = safe(studio.website)
  const workingHours = safe(studio.workingHours)

  const street = safe(studio.street)
  const building = safe(studio.building)
  const apartment = safe(studio.apartment)
  const address = [street, building, apartment].filter(Boolean).join(', ')

  const portfolio = parsePortfolioUrls(studio.portfolioUrls)
  const priceFrom = studio.priceFrom

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <Link to="/studios" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          ← Всі студії
        </Link>

        <button
          type="button"
          onClick={() => setOpenBooking(true)}
          className="ui-button ui-button-primary-strong"
        >
          Записатись онлайн
        </button>
      </div>

      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="relative h-48 bg-gray-100">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`${name} cover`}
              className="h-full w-full object-cover"
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Обкладинка не додана
            </div>
          )}

          {/* Logo card */}
          <div className="absolute -bottom-8 left-6 flex items-end gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border bg-white shadow-sm">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${name} logo`}
                  className="h-full w-full object-cover"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-400">
                  LOGO
                </div>
              )}
            </div>

            <div className="pb-2">
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              <p className="mt-1 text-sm text-gray-600">
                {category}{city ? ` • ${city}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-12 p-6">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* Left */}
            <div className="space-y-4">
              {description ? (
                <div className="rounded-2xl border bg-white p-5">
                  <h2 className="text-lg font-semibold text-gray-900">Про студію</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {description}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border bg-gray-50 p-5 text-sm text-gray-600">
                  Опис ще не додано.
                </div>
              )}

              {/* Portfolio */}
              <div className="rounded-2xl border bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">Портфоліо</h2>
                  <span className="text-sm text-gray-500">
                    {portfolio.length ? `${portfolio.length} фото` : 'немає фото'}
                  </span>
                </div>

                {portfolio.length === 0 ? (
                  <div className="mt-3 rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
                    Поки що немає прикладів робіт.
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {portfolio.slice(0, 9).map((url, idx) => (
                      <div key={url + idx} className="aspect-[4/3] overflow-hidden rounded-xl border bg-gray-100">
                        <img
                          src={url}
                          alt={`portfolio ${idx + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={e => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right info card */}
            <div className="space-y-4">
              <div className="rounded-2xl border bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Інформація</h2>

                <div className="mt-3 space-y-2 text-sm">
                  {priceFrom != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Ціни</span>
                      <span className="font-semibold text-gray-900">від {priceFrom} грн</span>
                    </div>
                  )}

                  {workingHours && (
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-600">Години</span>
                      <span className="text-right font-medium text-gray-900">{workingHours}</span>
                    </div>
                  )}

                  {address && (
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-600">Адреса</span>
                      <span className="text-right font-medium text-gray-900">{address}</span>
                    </div>
                  )}
                </div>

                {(instagram || website) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {instagram && (
                      <a
                        href={instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Instagram
                      </a>
                    )}
                    {website && (
                      <a
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Сайт
                      </a>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setOpenBooking(true)}
                  className="mt-5 w-full ui-button ui-button-primary-strong"
                >
                  Записатись онлайн
                </button>

                <p className="mt-2 text-center text-xs text-gray-500">
                  Обери послугу, майстра і час — підтвердження за секунди.
                </p>
              </div>

              {/* Trust / perks */}
              <div className="rounded-2xl border bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900">Чому обирають нас</h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li>• Професійні майстри та сервіс</li>
                  <li>• Онлайн-запис без дзвінків</li>
                  <li>• Прозорі ціни та портфоліо</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking modal */}
<Modal open={openBooking} title={name} onClose={() => setOpenBooking(false)}>
  <StudioBookingWidget studio={studio} />
</Modal>

    </div>
  )
}
