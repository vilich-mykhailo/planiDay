import { Link, useNavigate } from "react-router-dom";

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

export default function Terms() {
  const updated = "19.02.2026";
const navigate = useNavigate();

  return (
    <main className="min-h-[100dvh]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Умови користування
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Останнє оновлення: <span className="font-semibold">{updated}</span>
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
          <p className="text-sm leading-6 text-gray-700">
            Ці Умови користування (“Умови”) регулюють доступ і використання сервісу
            <span className="font-semibold"> PlaniDay</span> (“Сервіс”). Використовуючи Сервіс,
            ви підтверджуєте, що прочитали та погоджуєтеся з цими Умовами.
          </p>

          <Section title="1. Опис сервісу">
            <p>
              PlaniDay — це платформа для онлайн-запису до студій/майстрів та для
              створення профілю салону/студії з метою прийому записів від клієнтів.
            </p>
          </Section>

          <Section title="2. Обліковий запис">
            <p>
              Для доступу до певних функцій може знадобитися реєстрація. Ви несете
              відповідальність за конфіденційність своїх даних входу та за всі дії,
              виконані у вашому акаунті.
            </p>
            <p>
              Ви зобов’язуєтесь надавати достовірну інформацію та оновлювати її у разі змін.
            </p>
          </Section>

          <Section title="3. Правила користування">
            <p>
              Заборонено використовувати Сервіс для незаконних дій, шахрайства,
              розповсюдження шкідливого ПЗ або порушення прав інших осіб.
            </p>
            <p>
              Заборонено додавати образливий, дискримінаційний, неправдивий чи такий,
              що вводить в оману, контент.
            </p>
          </Section>

          <Section title="4. Записи та взаємодія зі студіями">
            <p>
              PlaniDay надає інструменти для бронювання, але не є стороною договору
              між клієнтом і студією/майстром. Якість послуг, ціни, політика скасувань
              та інші умови визначаються студією/майстром.
            </p>
          </Section>

          <Section title="5. Контент користувачів">
            <p>
              Ви зберігаєте права на ваш контент (фото, описи), який завантажуєте у Сервіс,
              але надаєте нам невиключну ліцензію використовувати його для роботи Сервісу
              (відображення в профілях, пошуку тощо).
            </p>
          </Section>

          <Section title="6. Інтелектуальна власність">
            <p>
              Дизайн, бренд, код та інші елементи Сервісу належать PlaniDay або його
              ліцензіарам і захищені законодавством.
            </p>
          </Section>

          <Section title="7. Обмеження відповідальності">
            <p>
              Сервіс надається “як є”. Ми не гарантуємо безперебійну роботу та відсутність
              помилок, але докладаємо зусиль для стабільної роботи.
            </p>
            <p>
              Ми не несемо відповідальності за дії/бездіяльність студій, майстрів або користувачів,
              а також за наслідки домовленостей між ними.
            </p>
          </Section>

          <Section title="8. Припинення доступу">
            <p>
              Ми можемо тимчасово або повністю обмежити доступ до Сервісу, якщо є ознаки
              порушення цих Умов або законодавства.
            </p>
          </Section>

          <Section title="9. Зміни умов">
            <p>
              Ми можемо оновлювати ці Умови. Актуальна версія завжди доступна на цій сторінці.
              Якщо зміни суттєві — ми можемо повідомити вас додатково.
            </p>
          </Section>

          <Section title="10. Контакти">
            <p>
              З питань щодо Умов можна звернутися через сторінку підтримки або контактний email,
              який ви вкажете у налаштуваннях проєкту.
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
          Цей текст є шаблоном для MVP. Для юридично точного документу краще узгодити з юристом.
        </p>
      </div>
    </main>
  );
}
