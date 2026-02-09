import { useMemo, useState } from 'react'
import TimeSelect from '../../components/TimeSelect'
import { useStudio } from '../../context/studio/useStudio'
import './Schedule.css'

const DAYS = [
  { key: 'mon', label: 'Пн' },
  { key: 'tue', label: 'Вт' },
  { key: 'wed', label: 'Ср' },
  { key: 'thu', label: 'Чт' },
  { key: 'fri', label: 'Пт' },
  { key: 'sat', label: 'Сб' },
  { key: 'sun', label: 'Нд' },
]

const defaultDay = (enabled = true) => ({
  enabled,
  start: '10:00',
  end: '18:00',
})

function timeToMinutes(t) {
  const [hh, mm] = t.split(':').map(Number)
  return hh * 60 + mm
}

function minutesToTime(total) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function getDefaultSchedule() {
  return {
    mon: defaultDay(),
    tue: defaultDay(),
    wed: defaultDay(),
    thu: defaultDay(),
    fri: defaultDay(),
    sat: defaultDay(false),
    sun: defaultDay(false),
  }
}

function normalizeSchedule(incoming) {
  const base = getDefaultSchedule()
  if (!incoming) return base

  const next = { ...base }
  for (const d of DAYS) {
    if (incoming[d.key]) {
      next[d.key] = {
        ...base[d.key],
        ...incoming[d.key],
      }
    }
  }
  return next
}

export default function Schedule() {
  const { studio, setSchedule, updateStudio } = useStudio()

  const storedSchedule = useMemo(
    () => normalizeSchedule(studio?.schedule),
    [studio?.schedule]
  )

  const storedSlotDuration = useMemo(() => {
    const v = studio?.slotDuration
    return typeof v === 'number' ? v : 15
  }, [studio?.slotDuration])

  const [schedule, setScheduleDraft] = useState(storedSchedule)
  const [slotDuration, setSlotDuration] = useState(storedSlotDuration)

  const [preview, setPreview] = useState({})
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  function toggleDay(day) {
    setScheduleDraft(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }))
  }

  function updateTime(day, field, value) {
    setScheduleDraft(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  function generateSlots() {
    const result = {}

    for (const day of DAYS) {
      const config = schedule[day.key]
      if (!config.enabled) continue

      const start = timeToMinutes(config.start)
      const end = timeToMinutes(config.end)

      if (end <= start) continue

      const slots = []
      let minutes = start

      while (minutes + slotDuration <= end) {
        slots.push(minutesToTime(minutes))
        minutes += slotDuration
      }

      result[day.key] = slots
    }

    setPreview(result)
  }

  function saveAll() {
    console.log('SAVE CLICKED')

    try {
      setSaveError('')

      console.log('studio from context:', studio)
      console.log('typeof setSchedule:', typeof setSchedule)
      console.log('typeof updateStudio:', typeof updateStudio)

      if (typeof setSchedule !== 'function') {
        throw new Error('setSchedule is not a function (check StudioProvider/useStudio imports)')
      }
      if (typeof updateStudio !== 'function') {
        throw new Error('updateStudio is not a function (check StudioProvider)')
      }

      setSchedule(schedule)
      updateStudio({ slotDuration })

      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)

      console.log('SAVE DONE ✅')
    } catch (err) {
      console.error('SAVE FAILED ❌', err)
      setSaveError(err?.message || 'Помилка збереження')
    }
  }

  function cancelChanges() {
    setScheduleDraft(storedSchedule)
    setSlotDuration(storedSlotDuration)
    setPreview({})
  }

  return (
    <div className="space-y-6">
      {saved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-lg text-sm text-gray-900">
            ✅ Збережено
          </div>
        </div>
      )}

      {saveError && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-red-600">
          ❌ {saveError}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Графік роботи</h1>
      </div>

      <div className="space-y-4">
        {DAYS.map(day => {
          const config = schedule[day.key]

          return (
            <div
              key={day.key}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3"
            >
              {/* Day toggle */}
<button
  type="button"
  onClick={() => toggleDay(day.key)}
  className={`schedule-day ${config.enabled ? 'schedule-day--active' : ''}`}
>
  {day.label}
</button>


              {/* Time range */}
              {config.enabled ? (
                <div className="ui-button ui-button-secondary ui-button-selected">
                  <TimeSelect
                    value={config.start}
                    onChange={value => updateTime(day.key, 'start', value)}
                  />

                  <span className="text-gray-400 font-medium">—</span>

                  <TimeSelect
                    value={config.end}
                    onChange={value => updateTime(day.key, 'end', value)}
                  />
                </div>
              ) : (
                <div className="flex-1 text-right text-sm text-gray-500">
                  Вихідний
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Тривалість слота для запису
        </label>

        <select
          value={slotDuration}
          onChange={e => setSlotDuration(Number(e.target.value))}
          className="w-fit rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <option value={10}>10 хв</option>
          <option value={15}>15 хв</option>
          <option value={30}>30 хв</option>
          <option value={60}>60 хв</option>
        </select>
      </div>

      <button
        type="button"
        onClick={generateSlots}
        className="w-fit rounded-xl border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:border-gray-300 transition"
      >
        Згенерувати слоти
      </button>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={saveAll}
          className="ui-button ui-button-primary"
        >
          Зберегти
        </button>

        <button
          type="button"
          onClick={cancelChanges}
          className="ui-button ui-button-secondary"
        >
          Скасувати
        </button>
      </div>

      {Object.keys(preview).length > 0 && (
        <div className="space-y-4 shedule-grafic">
          <h2 className="font-semibold text-gray-900">Перевірка графіка</h2>

          {DAYS.map(day => (
            preview[day.key] ? (
              <div key={day.key}>
                <p className="font-medium text-gray-900">{day.label}</p>

<div className="schedule-slots">
  {preview[day.key].map(time => (
    <span key={time} className="schedule-slot">
      {time}
    </span>
  ))}
</div>

              </div>
            ) : null
          ))}
        </div>
      )}
    </div>
  )
}
