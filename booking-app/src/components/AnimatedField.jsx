import './AnimatedField.css'

export default function AnimatedField({
  label,
  value,
  onChange,
  placeholder = 'Оберіть...',
  type = 'text',
  as = 'input',
  options = [],
  disabled = false,
  inputMode,
}) {
  const filled = String(value ?? '').length > 0

  return (
    <div className={`af ${as === 'select' ? 'af--select' : ''}`}>
      {as === 'select' ? (
        <select
          className={`af__control ${filled ? 'af__control--filled' : ''}`}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
        >
          {/* ✅ важливо: порожня опція є, але її не видно в dropdown */}
          <option value="" disabled hidden>
            {placeholder}
          </option>

          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={`af__control ${filled ? 'af__control--filled' : ''}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder=" "
          type={type}
          disabled={disabled}
          inputMode={inputMode}
        />
      )}

      <label className={`af__label ${filled ? 'af__label--up' : ''}`}>
        {label}
      </label>
    </div>
  )
}
