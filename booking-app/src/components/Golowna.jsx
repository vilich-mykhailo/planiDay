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
      <section className="card welcome">
        <h2>Вітаємо в кабінеті майстра 👋</h2>

        <p>Керуйте студією, послугами та записами в одному місці.</p>
      </section>

      {/* ===== Статистика ===== */}
      <section className="stats">
        {stats.map((item, index) => (
          <div className="stat-card" key={index}>
            
            {/* Назва статистики (наприклад "Записи сьогодні") */}
            <span className="stat-title">{item.title}</span>

            {/* Значення статистики (цифра) */}
            <span className="stat-value">{item.value}</span>
          </div>
        ))}
      </section>

      <section className="card">
        <h3>Швидкі дії</h3>

        <div className="actions">

          {/* 
            Кнопки дій (поки без onClick)
            У майбутньому тут можуть бути:
            - navigate('/dashboard/bookings/new')
            - navigate('/dashboard/services')
            - navigate('/dashboard/schedule')
            - navigate('/dashboard/studio')
          */}
          <button>➕ Додати запис</button>
          <button>🛠 Додати послугу</button>
          <button>📅 Графік</button>
          <button>🏠 Студія</button>
        </div>
      </section>

      <section className="card">
        <h3>Найближчі записи</h3>
        {appointments.length === 0 ? (
          // Повідомлення, якщо масив appointments порожній
          <p className="empty">Немає запланованих записів</p>
        ) : (
          // Список записів
          <ul className="appointments">
            {appointments.map((item, index) => (
              
              // Один запис у списку
              <li key={index}>
                {/* Час запису */}
                <span>{item.time}</span>
                {/* Назва послуги та імʼя клієнта */}
                {item.service} — {item.client}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ===== Порада дня ===== */}
      <section className="tip">
        💡 <strong>Порада дня:</strong> Заповнений графік на 2 тижні вперед підвищує довіру клієнтів.
      </section>

    </div>
  );
}
