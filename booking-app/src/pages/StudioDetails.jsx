/* eslint-disable react-hooks/rules-of-hooks */



import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudio } from '../context/studio/useStudio'
import { useBookings } from '../context/bookings/useBookings'
import Calendar from '../components/Calendar'
import './StudioDetails.css'

function timeToMinutes(t) {
  const [hh, mm] = t.split(':').map(Number)
  return hh * 60 + mm
}

function minutesToTime(total) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ✅ ЛОГІКА СЛОТІВ НЕ ЗМІНЕНА
function buildSlots(start, end, stepMinutes) {
  const startM = timeToMinutes(start)
  const endM = timeToMinutes(end)
  if (endM <= startM) return []

  const slots = []
  let minutes = startM
  while (minutes + stepMinutes <= endM) {
    slots.push(minutesToTime(minutes))
    minutes += stepMinutes
  }
  return slots
}

function formatDateLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}


function getDayKeyFromDateObj(date) {
  // JS: 0..6 = sun..sat
  const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return map[date.getDay()]
}

export default function StudioDetails() {
  const navigate = useNavigate()

  const { studio } = useStudio()
  const { addBooking, bookings } = useBookings()

  if (!studio) return <p>Студію не знайдено</p>

  // крок слотів
  const slotDuration =
    typeof studio?.slotDuration === 'number' ? studio.slotDuration : 15

  // ✅ дата (реальний Date обʼєкт)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

const selectedDateStr = useMemo(() => {
  return selectedDate ? formatDateLocal(selectedDate) : null
}, [selectedDate])


  const dayKey = useMemo(() => {
    if (!selectedDate) return null
    return getDayKeyFromDateObj(selectedDate)
  }, [selectedDate])

  const isDayEnabled = useMemo(() => {
    if (!studio?.schedule || !dayKey) return false
    return Boolean(studio.schedule?.[dayKey]?.enabled)
  }, [studio, dayKey])

  const dayConfig = useMemo(() => {
    if (!studio || !dayKey || !isDayEnabled) return null
    return studio.schedule?.[dayKey] ?? null
  }, [studio, dayKey, isDayEnabled])

  const slots = useMemo(() => {
    if (!dayConfig) return []
    return buildSlots(dayConfig.start, dayConfig.end, slotDuration)
  }, [dayConfig, slotDuration])

  // ✅ зайняті слоти ПО КОНКРЕТНІЙ ДАТІ
  const busyTimes = useMemo(() => {
    if (!studio || !selectedDateStr) return new Set()

    const used = (bookings || [])
      .filter(
        b =>
          b.status !== 'canceled' &&
          b.studioSlug === studio.slug &&
          b.date === selectedDateStr
      )
      .map(b => b.time)

    return new Set(used)
  }, [bookings, studio, selectedDateStr])

  // ✅ disabled для календаря: минулі дні + дні, коли студія не працює
  const disabledDays = useMemo(() => {
    const schedule = studio?.schedule || {}
    const enabledKeys = new Set(
      Object.keys(schedule).filter(k => schedule[k]?.enabled)
    )

    return (date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // минулі дні — блок
      if (d < today) return true

      // якщо графіка нема — все блокуємо
      if (enabledKeys.size === 0) return true

      // дні без роботи — блок
      const key = getDayKeyFromDateObj(d)
      return !enabledKeys.has(key)
    }
  }, [studio])
  // сервіси
const services = useMemo(() => {
  return Array.isArray(studio?.services)
    ? studio.services
    : []
}, [studio?.services])

  const [selectedServiceId, setSelectedServiceId] = useState(() => {
    return services?.[0]?.id ?? null
  })
  const [selectedTime, setSelectedTime] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '' })

  const selectedService = useMemo(() => {
    return services.find(s => s.id === selectedServiceId) || null
  }, [services, selectedServiceId])

  function handleSubmit(e) {
    e.preventDefault()

    if (!studio || !selectedDateStr || !dayKey || !isDayEnabled) return
    if (!selectedTime) return
    if (!form.name || !form.phone) return

    const service = selectedService || services?.[0] || null

    addBooking({
      // status/id/createdAt додаються в BookingsProvider
      studioSlug: studio.slug,
      studioName: studio.name,
      serviceId: service?.id ?? null,
      serviceName: service?.name ?? 'Без назви',
      duration: slotDuration,
      price: service?.price ?? 0,

      // 🔥 головне: дата + day
      date: selectedDateStr,
      day: dayKey,
      time: selectedTime,

      clientName: form.name,
      clientPhone: form.phone,
    })

    navigate('/booking/success')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{studio.name}</h1>
        <p className="text-gray-600">
          {studio.category} • {studio.city}, вул. {studio.street} {studio.building}/{studio.apartment}
        </p>
      </div>

      {/* Services */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Послуги</h2>

        <div className="grid gap-3 md:grid-cols-2">
          {services.map(service => {
            const active = service.id === selectedServiceId
            return (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedServiceId(service.id)
                  setSelectedTime(null)
                }}
                className={`text-left rounded-xl border p-4 bg-white ${active ? 'border-black' : ''}`}
              >
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-gray-600">
                  {service.duration} хв • {service.price} грн
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {/* Calendar */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Дата</h2>

        <Calendar
          selected={selectedDate}
          onSelect={(d) => {
            if (!d) return
            d.setHours(0, 0, 0, 0)
            setSelectedDate(d)
            setSelectedTime(null)
          }}
          disabled={disabledDays}
        />

        {!isDayEnabled && (
          <p className="text-sm text-red-600">У цей день студія не працює</p>
        )}
      </section>

      {/* Time slots */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Час</h2>

        {!isDayEnabled ? (
          <p className="text-gray-600">Оберіть іншу дату</p>
        ) : slots.length === 0 ? (
          <p className="text-gray-600">Немає слотів у цей день</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map(time => {
              const busy = busyTimes.has(time)
              return (
                <button
                  key={time}
                  onClick={() => !busy && setSelectedTime(time)}
                  disabled={busy}
                  className={`rounded-lg px-4 py-2 border
                    ${selectedTime === time ? 'bg-black text-white' : 'bg-white'}
                    ${busy ? 'opacity-40 cursor-not-allowed line-through' : ''}
                  `}
                  title={busy ? 'Цей час уже зайнятий' : ''}
                >
                  {time}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Booking form */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Ваші дані</h2>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-white p-4 space-y-4 max-w-xl"
        >
          <input
            placeholder="Імʼя"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full rounded border p-3"
          />

          <input
            placeholder="Телефон"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded border p-3"
          />

          <button
            className="rounded-lg bg-black px-6 py-3 text-white disabled:opacity-50"
            disabled={!selectedDateStr || !isDayEnabled || !selectedTime || !form.name || !form.phone}
          >
            Записатись
          </button>
        </form>
      </section>
    </div>
  )
}
