// PrivacyOwner.jsx
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

export default function PrivacyOwner() {
  const updated = "19.02.2026";
  const navigate = useNavigate();

  return (
    <main className="min-h-[100dvh]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
              Політика конфіденційності для власників салонів
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Останнє оновлення: <span className="font-semibold">{updated}</span>
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
          <p className="text-sm leading-6 text-gray-700">
            Ця Політика конфіденційності пояснює, які дані ми збираємо від
            власників салонів, студій або майстрів, як їх використовуємо та які
            у вас є права. Використовуючи{" "}
            <span className="font-semibold">PlaniDay</span>, ви погоджуєтеся з
            цією Політикою.
          </p>

          <Section title="1. Які дані ми можемо збирати">
            <ul className="list-disc space-y-2 pl-5">
              <li>Контактні дані: ім’я, email, номер телефону.</li>
              <li>
                Дані бізнесу: назва салону або студії, адреса, опис, категорія
                послуг.
              </li>
              <li>
                Дані профілю: логотип, фото, портфоліо, інформація про майстрів,
                графік роботи.
              </li>
              <li>
                Дані про бронювання: записи клієнтів, обрані послуги, дати, час
                та статуси записів.
              </li>
              <li>
                Технічні дані: IP-адреса, тип пристрою, браузер, журнали
                помилок.
              </li>
            </ul>
          </Section>

          <Section title="2. Як ми використовуємо дані">
            <ul className="list-disc space-y-2 pl-5">
              <li>Для створення та обслуговування акаунту власника.</li>
              <li>
                Для публікації та відображення профілю салону або студії на
                платформі.
              </li>
              <li>
                Для роботи онлайн-запису, керування розкладом і бронюваннями.
              </li>
              <li>Для зв’язку з вами щодо роботи сервісу або підтримки.</li>
              <li>Для покращення безпеки, стабільності та функціональності.</li>
            </ul>
          </Section>

          <Section title="3. Передача даних третім сторонам">
            <p>
              Ми не продаємо ваші персональні дані. Ми можемо передавати дані
              постачальникам інфраструктури, хостингу, email-сервісів,
              аналітики та інших технічних рішень лише в межах, необхідних для
              роботи сервісу та за умови належного захисту даних.
            </p>
          </Section>

          <Section title="4. Публічність даних профілю">
            <p>
              Частина інформації, яку ви додаєте до профілю салону або студії,
              може бути публічно доступною іншим користувачам платформи. Це може
              включати назву, адресу, опис, перелік послуг, фото, портфоліо,
              розклад та іншу інформацію, необхідну для функціонування
              онлайн-запису.
            </p>
          </Section>

          <Section title="5. Cookies та локальне сховище">
            <p>
              Ми можемо використовувати cookies або локальне сховище браузера
              для авторизації, збереження сесії, налаштувань інтерфейсу та
              покращення користувацького досвіду.
            </p>
          </Section>

          <Section title="6. Зберігання та захист даних">
            <p>
              Ми застосовуємо технічні та організаційні заходи для захисту ваших
              даних від несанкціонованого доступу, втрати або змінення. Водночас
              жоден спосіб передачі або зберігання даних не гарантує абсолютної
              безпеки.
            </p>
          </Section>

          <Section title="7. Ваші права">
            <ul className="list-disc space-y-2 pl-5">
              <li>Отримати доступ до своїх персональних даних.</li>
              <li>Оновити, виправити або видалити дані профілю.</li>
              <li>Подати запит на видалення акаунту.</li>
              <li>Відкликати згоду на обробку даних, якщо це застосовно.</li>
            </ul>
          </Section>

          <Section title="8. Зміни політики">
            <p>
              Ми можемо періодично оновлювати цю Політику. Актуальна версія
              завжди доступна на цій сторінці.
            </p>
          </Section>

          <Section title="9. Контакти">
            <p>
              Якщо у вас є питання щодо конфіденційності або обробки даних,
              звертайтеся через сторінку підтримки або контактний email,
              зазначений у проєкті.
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