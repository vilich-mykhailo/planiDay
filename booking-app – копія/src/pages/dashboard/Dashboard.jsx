import { NavLink, Outlet } from 'react-router-dom'
import './Dashboard.css'

const linkClass = ({ isActive }) =>
  ['dash-link', isActive ? 'dash-link--active' : ''].join(' ')

export default function Dashboard() {
  return (
    <div className="dash">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <h2 className="dash-title">Кабінет</h2>

        <nav className="dash-nav">
          <NavLink to="/dashboard" end className={linkClass}>
            Головна
          </NavLink>

          <NavLink to="/dashboard/studio" className={linkClass}>
            Студія
          </NavLink>

          <NavLink to="/dashboard/services" className={linkClass}>
            Послуги
          </NavLink>

          <NavLink to="/dashboard/schedule" className={linkClass}>
            Графік
          </NavLink>

          <NavLink to="/dashboard/bookings" className={linkClass}>
            Записи
          </NavLink>

          <NavLink to="/dashboard/masters" className={linkClass}>
            Майстри
          </NavLink>
        </nav>
      </aside>

      {/* Content */}
      <section className="dash-content">
        <Outlet />
      </section>
    </div>
  )
}
