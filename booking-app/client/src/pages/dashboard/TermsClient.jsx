// TermsClient.jsx
import { useNavigate, useLocation } from "react-router-dom";

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

export default function TermsClient() {
  const updated = "23.03.2026";
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <main className="min-h-[100dvh]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
              Умови користування для клієнтів
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Останнє оновлення:{" "}
              <span className="font-semibold">{updated}</span>
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
          <p className="text-sm leading-6 text-gray-700">
            Ці Умови користування (“Умови”) регулюють доступ і використання
            сервісу <span className="font-semibold">Aveliio</span> клієнтами.
            Використовуючи Сервіс, ви підтверджуєте, що прочитали та
            погоджуєтеся з цими Умовами.
          </p>

          <Section title="1. Опис сервісу">
            <p>
              Aveliio — це платформа для пошуку студій або майстрів та
              онлайн-запису на послуги через інтернет.
            </p>
          </Section>

          <Section title="2. Обліковий запис">
            <p>
              Для доступу до певних функцій сервісу може знадобитися реєстрація.
              Ви несете відповідальність за конфіденційність своїх даних входу
              та за всі дії, виконані у вашому акаунті.
            </p>
            <p>
              Ви зобов’язуєтесь надавати достовірну інформацію та оновлювати її
              у разі змін.
            </p>
          </Section>

          <Section title="3. Онлайн-запис">
            <p>
              Клієнт може використовувати Aveliio для бронювання послуг у
              студіях, салонах або у майстрів, представлених на платформі.
            </p>
            <p>
              Після створення запису ви несете відповідальність за коректність
              введених даних та за своєчасну появу на заброньовану послугу.
            </p>
          </Section>

          <Section title="4. Скасування та зміна записів">
            <p>
              Можливість скасування, перенесення або зміни запису залежить від
              правил конкретної студії, салону або майстра.
            </p>
            <p>
              Aveliio надає лише технічну можливість взаємодії, але не
              встановлює індивідуальні правила скасувань для кожного виконавця.
            </p>
          </Section>

          <Section title="5. Взаємодія зі студіями та майстрами">
            <p>
              Aveliio не є стороною договору між клієнтом і студією, салоном
              або майстром. Якість послуг, ціни, доступність, політика
              скасування, результати послуг та інші умови визначаються
              відповідним виконавцем.
            </p>
          </Section>

          <Section title="6. Правила користування">
            <p>
              Заборонено використовувати сервіс для незаконних дій, шахрайства,
              створення фальшивих записів, спроб втручання у роботу платформи
              або порушення прав інших осіб.
            </p>
            <p>
              Також заборонено публікувати чи передавати образливий,
              дискримінаційний, неправдивий або оманливий контент.
            </p>
          </Section>

          <Section title="7. Інтелектуальна власність">
            <p>
              Дизайн, бренд, код, функціональність та інші елементи сервісу
              належать Aveliio або його ліцензіарам і захищені законодавством.
            </p>
          </Section>

          <Section title="8. Обмеження відповідальності">
            <p>
              Сервіс надається “як є”. Ми не гарантуємо безперебійну роботу або
              повну відсутність технічних помилок, хоча докладаємо зусиль для
              стабільної роботи.
            </p>
            <p>
              Ми не несемо відповідальності за дії або бездіяльність студій,
              салонів, майстрів чи інших користувачів, а також за наслідки
              домовленостей між ними.
            </p>
          </Section>

          <Section title="9. Припинення доступу">
            <p>
              Ми можемо тимчасово або повністю обмежити доступ до сервісу, якщо
              є ознаки порушення цих Умов або чинного законодавства.
            </p>
          </Section>

          <Section title="10. Зміни умов">
            <p>
              Ми можемо оновлювати ці Умови. Актуальна версія завжди доступна на
              цій сторінці. Якщо зміни суттєві, ми можемо повідомити вас
              додатково.
            </p>
          </Section>

          <Section title="11. Контакти">
            <p>
              З питань щодо цих Умов ви можете звернутися через сторінку
              підтримки або контактний email, зазначений у проєкті.
            </p>
          </Section>

          <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
<button
  type="button"
  onClick={() => navigate(location.state?.from || -1)}
  className="
    inline-flex items-center justify-center
    rounded-2xl
    bg-[#202020]
    px-5 py-3
    text-sm font-black text-white
    shadow-[0_12px_26px_rgba(15,15,15,0.18)]
    transition-all duration-300
    hover:scale-[1.015]
    hover:bg-[#ff6200]
    hover:shadow-[0_14px_30px_rgba(255,98,0,0.24)]
    active:scale-[0.98]
  "
>
  Повернутися назад
</button>
          </div>
        </div>
      </div>
    </main>
  );
}