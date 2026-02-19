import { Link, useNavigate  } from "react-router-dom";

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-gray-700">
        {children}
      </div>
    </section>
  );
}

export default function Privacy() {
  const updated = "19.02.2026";
const navigate = useNavigate();

  return (
    <main className="min-h-[100dvh]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Політика конфіденційності
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Останнє оновлення: <span className="font-semibold">{updated}</span>
            </p>
          </div>

        </div>

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
          <p className="text-sm leading-6 text-gray-700">
            Ця Політика конфіденційності пояснює, які дані ми збираємо, як їх використовуємо та
            які у вас є права. Використовуючи <span className="font-semibold">PlaniDay</span>,
            ви погоджуєтеся з цією Політикою.
          </p>

          <Section title="1. Які дані ми можемо збирати">
            <ul className="list-disc pl-5 space-y-2">
              <li>Контактні дані: ім’я, email, номер телефону.</li>
              <li>Дані профілю студії: назва, адреса, опис, фото/портфоліо (для власників).</li>
              <li>Технічні дані: IP-адреса, тип пристрою/браузера, журнали помилок (для покращення сервісу).</li>
              <li>Дані про бронювання: вибрана студія/майстер, дата/час, статус запису.</li>
            </ul>
          </Section>

          <Section title="2. Як ми використовуємо дані">
            <ul className="list-disc pl-5 space-y-2">
              <li>Для створення та обслуговування акаунту.</li>
              <li>Для роботи функції онлайн-запису та відображення профілів студій.</li>
              <li>Для підтримки користувачів та відповіді на запити.</li>
              <li>Для покращення якості, безпеки та стабільності Сервісу.</li>
            </ul>
          </Section>

          <Section title="3. Передача даних третім сторонам">
            <p>
              Ми не продаємо ваші персональні дані. Ми можемо передавати дані
              постачальникам інфраструктури (хостинг, аналітика, email-сервіси) лише у межах,
              необхідних для роботи Сервісу, та за умови належного захисту.
            </p>
          </Section>

          <Section title="4. Cookies та аналітика">
            <p>
              Ми можемо використовувати cookies/локальне сховище для авторизації, збереження
              налаштувань і покращення користувацького досвіду. Ви можете обмежити cookies у
              налаштуваннях браузера.
            </p>
          </Section>

          <Section title="5. Зберігання та захист">
            <p>
              Ми застосовуємо технічні та організаційні заходи для захисту даних. Однак жоден
              спосіб передачі або зберігання не є на 100% безпечним.
            </p>
          </Section>

          <Section title="6. Ваші права">
            <ul className="list-disc pl-5 space-y-2">
              <li>Отримати доступ до ваших даних.</li>
              <li>Виправити або оновити дані.</li>
              <li>Видалити акаунт (за запитом).</li>
              <li>Відкликати згоду на обробку, якщо це застосовно.</li>
            </ul>
          </Section>

          <Section title="7. Дані дітей">
            <p>
              Сервіс не призначений для осіб молодше 16 років без згоди батьків/опікунів.
            </p>
          </Section>

          <Section title="8. Зміни політики">
            <p>
              Ми можемо періодично оновлювати цю Політику. Актуальна версія завжди доступна на цій сторінці.
            </p>
          </Section>

          <Section title="9. Контакти">
            <p>
              Якщо у вас є питання щодо конфіденційності — звертайтеся через сторінку підтримки
              або контактний email, який ви вкажете у проєкті.
            </p>
          </Section>

<div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center items-center">
  <button
    type="button"
    onClick={() => navigate(-1)}
    className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-extrabold text-white hover:bg-gray-900 transition"
  >
    Повернутися назад
  </button>
</div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Це шаблон для MVP. Для відповідності законодавству краще перевірити текст з юристом.
        </p>
      </div>
    </main>
  );
}
