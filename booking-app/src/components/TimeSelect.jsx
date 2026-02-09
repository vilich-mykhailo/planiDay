import { useState } from 'react'
import './TimeSelect.css'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

const MINUTES_5 = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

export default function TimeSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)

  const [hour, minute] = value.split(':')

  function selectHour(h) {
    onChange(`${h}:${minute}`)
  }

  function selectMinute(m) {
    onChange(`${hour}:${m}`)
    setOpen(false)
  }

  return (
    <div className="relative inline-block">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="time-select-trigger"
      >
        {value}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="time-select-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Picker */}
      {open && (
        <div className="time-select-panel">
          {/* Hours */}
          <div>
            <p className="time-select-title">Години</p>
            <div className="time-select-grid">
              {HOURS.map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => selectHour(h)}
                  className={`time-select-cell ${h === hour ? 'time-select-cell--active' : ''}`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Minutes */}
          <div>
            <p className="time-select-title">Хвилини</p>

            {/* щоб хвилини теж були рівні — робимо ту ж grid-розкладку */}
            <div className="time-select-grid">
              {MINUTES_5.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectMinute(m)}
                  className={`time-select-cell ${m === minute ? 'time-select-cell--active' : ''}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
