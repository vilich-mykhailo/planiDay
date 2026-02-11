import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import './Header.css'

export default function Header() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `header__link ${isActive ? 'header__link--active' : ''}`

  return (
    <header className="header">
      <div className="header__container">
<Link to="/" className="header__brand" onClick={() => setOpen(false)}>
  <span className="header__logo">P</span>
  <span className="header__name">
    Plani<span className="header__name--accent">Day</span>
  </span>
</Link>


        {/* Desktop nav */}
        <nav className="header__nav">
          <NavLink to="/studios" className={linkClass}>
            Студії
          </NavLink>

          <NavLink to="/auth" className={linkClass}>
            Вхід майстрів
          </NavLink>

          {/* <Link to="/studios" className="header__cta">
            Записатись онлайн
          </Link> */}
        </nav>

        {/* Mobile burger */}
        <button
          type="button"
          className="header__burger"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          <span className={`header__burgerLine ${open ? 'is-open' : ''}`} />
          <span className={`header__burgerLine ${open ? 'is-open' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="header__mobile">
          <NavLink to="/studios" className={linkClass} onClick={() => setOpen(false)}>
            Студії
          </NavLink>

          <NavLink to="/auth" className={linkClass} onClick={() => setOpen(false)}>
            Для майстрів
          </NavLink>

          {/* <Link to="/studios" className="header__cta header__cta--full" onClick={() => setOpen(false)}>
            Записатись онлайн
          </Link> */}
        </div>
      )}
    </header>
  )
}
