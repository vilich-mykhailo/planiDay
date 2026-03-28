// PrivacyClient.jsx
import { useNavigate } from "react-router-dom";

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

export default function PrivacyClient() {
  const updated = "28.03.2026";
  const navigate = useNavigate();

  return (
    <main className="min-h-[100dvh]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
              Політика конфіденційності для клієнтів
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Останнє оновлення: <span className="font-semibold">{updated}</span>
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
          <p className="text-sm leading-6 text-gray-700">
            Ця Політика конфіденційності пояснює, які дані ми збираємо від
            клієнтів, як їх використовуємо та які у вас є права. Використовуючи{" "}
            <span className="font-semibold">PlaniDay</span>, ви погоджуєтеся з
            цією Політикою.
          </p>

          <Section title="1. Які дані ми можемо збирати">
            <ul className="list-disc space-y-2 pl-5">
              <li>Контактні дані: ім’я, email, номер телефону.</li>
              <li>Дані акаунту: інформація, вказана під час реєстрації.</li>
              <li>
                Дані про бронювання: обрана студія, послуга, майстер, дата та
                час запису.
              </li>
              <li>
                Історія взаємодії із сервісом: створення, зміна або скасування
                записів.
              </li>
              <li>
                Технічні дані: IP-адреса, тип пристрою, браузер, журнали
                помилок.
              </li>
            </ul>
          </Section>

          <Section title="2. Як ми використовуємо дані">
            <ul className="list-disc space-y-2 pl-5">
              <li>Для створення та обслуговування акаунту.</li>
              <li>Для оформлення та керування онлайн-записами.</li>
              <li>Для зв’язку з вами щодо записів та підтримки.</li>
              <li>Для покращення якості, безпеки та стабільності сервісу.</li>
            </ul>
          </Section>

          <Section title="3. Передача даних третім сторонам">
            <p>
              Ми не продаємо ваші персональні дані. Для роботи функції запису ми
              можемо передавати необхідні дані салону або студії, у яких ви
              бронюєте послугу, а також технічним постачальникам сервісів лише в
              межах, необхідних для роботи платформи.
            </p>
          </Section>

          <Section title="4. Cookies та аналітика">
            <p>
              Ми можемо використовувати cookies або локальне сховище для
              авторизації, збереження налаштувань, сесії та покращення
              користувацького досвіду. Ви можете змінити ці налаштування у
              своєму браузері.
            </p>
          </Section>

          <Section title="5. Зберігання та захист">
            <p>
              Ми застосовуємо технічні та організаційні заходи для захисту
              даних. Однак жоден спосіб передачі або зберігання даних не є
              абсолютно безпечним.
            </p>
          </Section>

          <Section title="6. Ваші права">
            <ul className="list-disc space-y-2 pl-5">
              <li>Отримати доступ до ваших персональних даних.</li>
              <li>Виправити або оновити свої дані.</li>
              <li>Подати запит на видалення акаунту.</li>
              <li>Відкликати згоду на обробку даних, якщо це застосовно.</li>
            </ul>
          </Section>

          <Section title="7. Дані дітей">
            <p>
              Сервіс не призначений для осіб молодше 16 років без згоди батьків
              або законних представників.
            </p>
          </Section>

          <Section title="8. Зміни політики">
            <p>
              Ми можемо періодично оновлювати цю Політику. Актуальна версія
              завжди доступна на цій сторінці.
            </p>
          </Section>

          <Section title="9. Контакти">
            <p>
              Якщо у вас є питання щодо конфіденційності, звертайтеся через
              сторінку підтримки або контактний email, який буде вказаний у
              проєкті.
            </p>
          </Section>

          <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-extrabold text-white transition hover:bg-gray-900"
            >
              Повернутися назад
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}