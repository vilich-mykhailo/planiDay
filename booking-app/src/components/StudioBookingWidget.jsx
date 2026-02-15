/* eslint-disable react-hooks/rules-of-hooks */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBookings } from '../context/bookings/useBookings'
import Calendar from '../components/Calendar'
import BookingCustomerForm from '../components/BookingCustomerForm'
import '../pages/StudioDetails.css'

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
  const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return map[date.getDay()]
}

export default function StudioBookingWidget({ studio }) {
  const navigate = useNavigate()
  const { addBooking, bookings } = useBookings()

  if (!studio) return <p className="text-sm text-gray-600">Студію не знайдено</p>

  // крок слотів
  const slotDuration =
    typeof studio?.slotDuration === 'number' ? studio.slotDuration : 15

  // ✅ дата (реальний Date обʼєкт)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  // ✅ кроки UI (логіку бронювання не чіпаємо)
  // pick => вибір (послуга/дата/час)
  // details => форма "Ваші дані"
  const [step, setStep] = useState('pick')

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

      if (d < today) return true
      if (enabledKeys.size === 0) return true

      const key = getDayKeyFromDateObj(d)
      return !enabledKeys.has(key)
    }
  }, [studio])

  // сервіси
  const services = useMemo(() => {
    return Array.isArray(studio?.services) ? studio.services : []
  }, [studio?.services])

  const [selectedServiceId, setSelectedServiceId] = useState(() => {
    return services?.[0]?.id ?? null
  })

  const [selectedTime, setSelectedTime] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '' })

  const selectedService = useMemo(() => {
    return services.find(s => s.id === selectedServiceId) || null
  }, [services, selectedServiceId])

const studioAddress = [studio?.city, studio?.street, studio?.building]
  .filter(Boolean)
  .join(', ')


  function handleSubmit(e) {
    e.preventDefault()

    if (!studio || !selectedDateStr || !dayKey || !isDayEnabled) return
    if (!selectedTime) return
    if (!form.name || !form.phone) return

    const service = selectedService || services?.[0] || null

    addBooking({
      studioSlug: studio.slug,
      studioName: studio.name,
      serviceId: service?.id ?? null,
      serviceName: service?.name ?? 'Без назви',
      duration: slotDuration,
      price: service?.price ?? 0,

      date: selectedDateStr,
      day: dayKey,
      time: selectedTime,

      clientName: form.name,
      clientPhone: form.phone,
    })

navigate('/booking/success', {
  state: {
    studioName: studio.name,
    serviceName: service?.name ?? 'Без назви',
    date: selectedDateStr,
    time: selectedTime,
    address: studioAddress,
    phone: form.phone,
  },
})


  }

  const canGoNext =
    Boolean(selectedServiceId) && Boolean(selectedDateStr) && isDayEnabled && Boolean(selectedTime)

  const submitDisabled =
    !selectedDateStr || !isDayEnabled || !selectedTime || !form.name || !form.phone

  return (
    <div className="space-y-6">
      {/* Services */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Послуга</h2>
          <p className="text-sm text-gray-600">Оберіть послугу для запису.</p>
        </div>

        {services.length === 0 ? (
          <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-600">
            Поки що немає доданих послуг.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map(service => {
              const active = service.id === selectedServiceId
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setSelectedServiceId(service.id)
                    setSelectedTime(null)
                    setStep('pick')
                  }}
                  className={[
                    'text-left rounded-2xl border p-4 bg-white transition',
                    active
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-gray-200 hover:bg-gray-50',
                  ].join(' ')}
                >
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {service.duration} хв • {service.price} грн
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Calendar */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Дата</h2>
          <p className="text-sm text-gray-600">Оберіть дату для запису</p>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <Calendar
            selected={selectedDate}
            onSelect={(d) => {
              if (!d) return
              d.setHours(0, 0, 0, 0)
              setSelectedDate(d)
              setSelectedTime(null)
              setStep('pick')
            }}
            disabled={disabledDays}
          />
        </div>

        {!isDayEnabled && (
          <p className="text-sm text-red-600">У цей день студія не працює</p>
        )}
      </section>

      {/* Time slots */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Час</h2>
          <p className="text-sm text-gray-600">Оберіть вільну годину</p>
        </div>

        {!isDayEnabled ? (
          <p className="text-sm text-gray-600">Оберіть іншу дату</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-gray-600">Немає слотів у цей день</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map(time => {
              const busy = busyTimes.has(time)
              const active = selectedTime === time

              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => {
                    if (busy) return
                    setSelectedTime(time)
                    setStep('pick')
                  }}
                  disabled={busy}
                  className={[
                    'rounded-xl border px-4 py-2 text-sm font-medium transition',
                    active
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50',
                    busy ? 'opacity-40 cursor-not-allowed line-through hover:bg-white' : '',
                  ].join(' ')}
                  title={busy ? 'Цей час уже зайнятий' : ''}
                >
                  {time}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Next button */}
      {step === 'pick' && (
        <button
          type="button"
          className="ui-button-one w-full"
          disabled={!canGoNext}
          onClick={() => setStep('details')}
        >
          Далі
        </button>
      )}

      {/* Booking form (separate file) */}
      {step === 'details' && (
        <BookingCustomerForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          submitDisabled={submitDisabled}
          onBack={() => setStep('pick')}
        />
      )}
    </div>
  )
}
