import './Golowna.css';

const stats = [
  { title: 'Записи сьогодні', value: 5 },
  { title: 'На тиждень', value: 28 },
  { title: 'Послуг', value: 12 },
  { title: 'Клієнтів', value: 146 },
];

const appointments = [
  { time: '12:00', service: 'Манікюр', client: 'Анна' },
  { time: '14:30', service: 'Стрижка', client: 'Олена' },
  { time: '17:00', service: 'Фарбування', client: 'Марія' },
];

export default function Golowna() {
  return (
    <div className="dashboard">

      {/* Welcome */}
      <section className="card welcome">
        <h2>Вітаємо в кабінеті майстра 👋</h2>
        <p>Керуйте студією, послугами та записами в одному місці.</p>
      </section>

      {/* Stats */}
      <section className="stats">
        {stats.map((item, index) => (
          <div className="stat-card" key={index}>
            <span className="stat-title">{item.title}</span>
            <span className="stat-value">{item.value}</span>
          </div>
        ))}
      </section>

      {/* Quick actions */}
      <section className="card">
        <h3>Швидкі дії</h3>
        <div className="actions">
          <button>➕ Додати запис</button>
          <button>🛠 Додати послугу</button>
          <button>📅 Графік</button>
          <button>🏠 Студія</button>
        </div>
      </section>

      {/* Appointments */}
      <section className="card">
        <h3>Найближчі записи</h3>

        {appointments.length === 0 ? (
          <p className="empty">Немає запланованих записів</p>
        ) : (
          <ul className="appointments">
            {appointments.map((item, index) => (
              <li key={index}>
                <span>{item.time}</span>
                {item.service} — {item.client}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tip */}
      <section className="tip">
        💡 <strong>Порада дня:</strong> Заповнений графік на 2 тижні вперед підвищує довіру клієнтів.
      </section>

    </div>
  );
}
