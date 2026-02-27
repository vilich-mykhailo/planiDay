import { useState } from 'react'
import './TimeSelect.css'

// Масив годин від 00 до 23
// Array.from створює масив довжиною 24
// (_, i) — i це індекс (0–23)
// String(i).padStart(2, '0') — перетворює число в рядок з двома цифрами (01, 02, 03...)
const HOURS = Array.from(
  { length: 24 },
  (_, i) => String(i).padStart(2, '0')
)

// Масив хвилин з кроком 5 хвилин
// Значення у вигляді рядків, щоб відповідати формату "HH:MM"
const MINUTES_5 = [
  '00', '05', '10', '15', '20', '25',
  '30', '35', '40', '45', '50', '55'
]

export default function TimeSelect({ value, onChange }) {

  // Локальний стан, який відповідає за відкриття/закриття випадаючої панелі
  // false — панель закрита
  // true — панель відкрита
  const [open, setOpen] = useState(false)

  // Розбиваємо рядок часу "HH:MM" на дві частини
  // hour — години
  // minute — хвилини
  const [hour, minute] = value.split(':')

  // Функція вибору години
  // h — нова година (наприклад "09")
  function selectHour(h) {
    // Викликаємо onChange з новим часом
    // Хвилини залишаємо без змін
    onChange(`${h}:${minute}`)
  }

  // Функція вибору хвилин
  // m — нові хвилини (наприклад "30")
  function selectMinute(m) {
    // Викликаємо onChange з новим часом
    // Години залишаємо без змін
    onChange(`${hour}:${m}`)

    // Після вибору хвилин закриваємо панель
    setOpen(false)
  }

  return (
    <div className="relative inline-block">
      {/* ===== Кнопка-тригер ===== */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="time-select-trigger"
      >
        {/* Відображаємо поточне значення часу */}
        {value}
      </button>

      {/* ===== Overlay (затемнення фону) ===== */}
      {open && (
        <div
          className="time-select-overlay "
          // Клік по overlay закриває панель
          onClick={() => setOpen(false)}
        />
      )}

      {/* ===== Панель вибору часу ===== */}
      {open && (
        <div className="time-select-panel ">
          {/* ===== Блок вибору годин ===== */}
          <div>
            <p className="time-select-title">Години</p>

            {/* Сітка кнопок з годинами */}
            <div className="time-select-grid">
              {HOURS.map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => selectHour(h)}
                  className={`time-select-cell ${
                    h === hour ? 'time-select-cell--active' : ''
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* ===== Блок вибору хвилин ===== */}
          <div>
            <p className="time-select-title">Хвилини</p>
            <div className="time-select-grid">
              {MINUTES_5.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectMinute(m)}
                  className={`time-select-cell ${
                    m === minute ? 'time-select-cell--active' : ''
                  }`}
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
