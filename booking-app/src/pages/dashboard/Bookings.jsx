import { useMemo, useState } from 'react'
import { useBookings } from '../../context/bookings/useBookings'

const DAY_LABEL = {
  mon: 'Пн',
  tue: 'Вт',
  wed: 'Ср',
  thu: 'Чт',
  fri: 'Пт',
  sat: 'Сб',
  sun: 'Нд',
}

function formatDateUA(dateStr) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

function getDayKeyFromDate(dateStr) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return map[d.getDay()]
}

export default function Bookings() {
  const { bookings, confirmBooking, cancelBooking, deleteBooking } = useBookings()

  // модалка видалення
  const [confirmId, setConfirmId] = useState(null)

  // ✅ модалка деталей
  const [detailsId, setDetailsId] = useState(null)

  const grouped = useMemo(() => {
    const map = {}

    for (const b of bookings || []) {
      const key = b.date || b.day || 'other'
      if (!map[key]) map[key] = []
      map[key].push(b)
    }

    Object.keys(map).forEach(k => {
      map[k].sort((a, c) => (a.time || '').localeCompare(c.time || ''))
    })

    const keys = Object.keys(map).sort((a, b) => {
      const da = new Date(a)
      const db = new Date(b)
      const aOk = !Number.isNaN(da.getTime())
      const bOk = !Number.isNaN(db.getTime())
      if (aOk && bOk) return da - db
      return String(a).localeCompare(String(b))
    })

    return { map, keys }
  }, [bookings])

  const keys = grouped.keys

  function renderGroupTitle(key) {
    const formattedDate = formatDateUA(key)
    const dayKey = getDayKeyFromDate(key)

    if (formattedDate && dayKey) {
      return `${formattedDate} ${DAY_LABEL[dayKey] || ''}`.trim()
    }

    return DAY_LABEL[key] || key
  }

  const selectedBooking = useMemo(() => {
    if (detailsId == null) return null
    return (bookings || []).find(b => b.id === detailsId) || null
  }, [detailsId, bookings])

  function renderBookingDate(b) {
    const raw = b?.date || b?.day
    if (!raw) return '—'
    const formatted = formatDateUA(raw)
    const dayKey = getDayKeyFromDate(raw)

    if (formatted && dayKey) return `${formatted} (${DAY_LABEL[dayKey]})`
    return DAY_LABEL[raw] ? DAY_LABEL[raw] : raw
  }

  function renderStatusLabel(b) {
    if (b?.status === 'confirmed') return 'Підтверджено'
    if (b?.status === 'canceled') return 'Скасовано'
    return 'Новий'
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Записи</h1>

      {keys.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          Поки що немає записів
        </div>
      ) : (
        <div className="space-y-6">
          {keys.map(key => (
            <section key={key} className="space-y-3">
              <h2 className="text-lg font-semibold">{renderGroupTitle(key)}</h2>

              <div className="space-y-3">
                {grouped.map[key].map(b => {
                  const isCanceled = b.status === 'canceled'
                  const isConfirmed = b.status === 'confirmed'
                  const isNew = !b.status || b.status === 'new'

                  return (
                    <div
                      key={b.id}
                      className="rounded-xl border bg-white p-4 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {b.time} • {b.serviceName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {b.clientName} • {b.clientPhone}
                          </p>
                        </div>

                        <span
                          className={`text-sm rounded-full px-3 py-1 border w-fit
                            ${isConfirmed ? 'border-green-500 text-green-700' : ''}
                            ${isCanceled ? 'border-red-500 text-red-700' : ''}
                            ${isNew ? 'border-gray-300 text-gray-700' : ''}
                          `}
                        >
                          {isConfirmed ? 'Підтверджено' : isCanceled ? 'Скасовано' : 'Новий'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* ✅ Професійна кнопка деталей */}
                        <button
                          type="button"
                          onClick={() => setDetailsId(b.id)}
                          className="ui-button ui-button-outline"
                        >
                          Переглянути
                        </button>

                        <button
                          type="button"
                          onClick={() => confirmBooking(b.id)}
                          disabled={isConfirmed || isCanceled}
                          className="ui-button ui-button-primary"
                        >
                          Підтвердити
                        </button>

                        {!isCanceled ? (
                          <button
                            type="button"
                            onClick={() => cancelBooking(b.id)}
                            disabled={isCanceled}
                            className="ui-button ui-button-secondary"
                          >
                            Скасувати
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmId(b.id)}
                            className="ui-button ui-button-danger"
                          >
                            Видалити
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ✅ Modal confirm delete */}
      {confirmId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow">
            <h3 className="text-lg font-semibold">Видалити запис?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Цю дію неможливо скасувати.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  deleteBooking(confirmId)
                  setConfirmId(null)
                }}
                className="rounded-lg bg-black px-4 py-2 text-white"
              >
                Так, видалити
              </button>
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="rounded-lg border px-4 py-2"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal details */}
      {detailsId != null && selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setDetailsId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Деталі запису</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Статус: <span className="font-medium">{renderStatusLabel(selectedBooking)}</span>
                </p>
              </div>


            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border p-3">
                <p className="text-xs text-gray-500">Клієнт</p>
                <p className="font-medium">{selectedBooking.clientName || '—'}</p>
                <p className="text-sm text-gray-600">{selectedBooking.clientPhone || '—'}</p>
              </div>

              <div className="rounded-xl border p-3">
                <p className="text-xs text-gray-500">Послуга</p>
                <p className="font-medium">{selectedBooking.serviceName || '—'}</p>
              </div>

              <div className="rounded-xl border p-3">
                <p className="text-xs text-gray-500">Дата і час</p>
                <p className="font-medium">
                  {renderBookingDate(selectedBooking)} • {selectedBooking.time || '—'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              {/* <button
                type="button"
                onClick={() => setDetailsId(null)}
                className="rounded-lg bg-black px-4 py-2 text-white"
              >
                Готово
              </button> */}
                            <button
                type="button"
                onClick={() => setDetailsId(null)}
                className="ui-button ui-button-secondary"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
