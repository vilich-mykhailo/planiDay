import { NavLink, Outlet } from "react-router-dom";
import "./Dashboard.css";

const linkClass = ({ isActive }) =>
  `dash-link ${isActive ? "dash-link--active" : ""}`.trim();

export default function Dashboard() {
  return (
    <div className="dash">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-head">
          <div className="dash-badge">Кабінет</div>
          <h2 className="dash-title">Панель керування</h2>
        </div>

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
          <NavLink to="/dashboard/staff-schedule" className={linkClass}>
            Графік персоналу
          </NavLink>

          <NavLink to="/dashboard/bookings" className={linkClass}>
            Записи
          </NavLink>

          <NavLink to="/dashboard/masters" className={linkClass}>
            Майстри
          </NavLink>

          {/* Logout */}
          <div className="dash-logout">
            <button className="dash-logout-btn">Вихід</button>
          </div>
        </nav>
      </aside>

      {/* Content */}
      <section className="dash-content">
        <Outlet />
      </section>
    </div>
  );
}
