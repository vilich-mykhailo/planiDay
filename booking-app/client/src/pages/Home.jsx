// Home.jsx
import { Link } from "react-router-dom";

function Feature({ title, text, icon }) {
  return (
    <div className="group rounded-3xl border border-gray-200 bg-white p-6 transition hover:border-gray-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-gray-200 bg-white">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-base font-extrabold text-gray-900 leading-6">
            {title}
          </p>
          <p className="mt-1 text-sm leading-6 text-gray-600">{text}</p>
        </div>
      </div>
    </div>
  );
}

function OptionCard({
  label,
  title,
  text,
  to,
  button,
  variant = "light", // light | dark
}) {
  const dark = variant === "dark";

  return (
    <div
      className={[
        "rounded-3xl border p-6 sm:p-7",
        dark
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-200 bg-white text-gray-900",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={[
              "text-xs font-bold uppercase tracking-wide",
              dark ? "text-white/60" : "text-gray-500",
            ].join(" ")}
          >
            {label}
          </p>

          <h2 className="mt-2 text-xl sm:text-2xl font-extrabold leading-tight">
            {title}
          </h2>
        </div>
      </div>

      <p
        className={[
          "mt-3 text-sm",
          dark ? "text-white/70" : "text-gray-600",
        ].join(" ")}
      >
        {text}
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        <Link
          to={to}
          className={[
            "rounded-xl px-5 py-3 text-sm font-bold text-center transition",
            dark
              ? "bg-white text-gray-900 hover:bg-gray-100"
              : "bg-black text-white hover:bg-gray-900",
          ].join(" ")}
        >
          {button}
        </Link>

        <Link
          to="/"
          className={[
            "rounded-xl border px-5 py-3 text-sm font-bold text-center transition",
            dark
              ? "border-white/20 hover:bg-white/10"
              : "border-gray-200 hover:bg-gray-50",
          ].join(" ")}
        >
          Переглянути студії
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-[100dvh]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        {/* HERO */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
            Онлайн-запис до майстрів
          </h1>

          <p className="mt-4 text-sm sm:text-lg text-gray-600">
            Знайди студію та запишись онлайн або створи профіль свого салону та
            приймай клієнтів.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              to="/"
              className="rounded-xl bg-black px-6 py-3.5 text-sm font-bold text-white hover:bg-gray-900 transition"
            >
              Знайти майстра
            </Link>

            <Link
              to="/auth"
              className="rounded-xl border border-gray-200 px-6 py-3.5 bg-white text-sm font-bold text-gray-900 hover:bg-gray-50 transition"
            >
              Створити салон
            </Link>
          </div>
        </div>

        {/* OPTIONS */}
        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <OptionCard
            label="Для клієнтів"
            title="Записатися до майстра"
            text="Переглядай студії, портфоліо і вільні години та записуйся онлайн."
            to="/auth?role=client"
            button="Увійти як клієнт"
            variant="light"
          />

          <OptionCard
            label="Для салонів"
            title="Створити профіль салону"
            text="Додай студію, фото робіт і приймай онлайн-записи від клієнтів."
            to="/auth?role=owner"
            button="Увійти як власник"
            variant="dark"
          />
        </div>

        {/* FEATURES */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            title="Швидкий запис"
            text="Вибір майстра, дати й часу — за хвилину. Без дзвінків і очікувань."
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v5l3 2"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  stroke="currentColor"
                  strokeWidth="2.4"
                />
              </svg>
            }
          />

          <Feature
            title="Портфоліо, яке продає"
            text="Фото робіт + опис студії підвищують довіру й конверсію в запис."
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16v12H4V7Z"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 7V5h8v2"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <path
                  d="M8.5 13.5l2.2-2.2a1 1 0 0 1 1.4 0l1.4 1.4 1-1a1 1 0 0 1 1.4 0l2.1 2.1"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />

          <Feature
            title="Зручно на будь-якому пристрої"
            text="Ідеально виглядає на телефоні, планшеті й комп’ютері."
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 4h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                  stroke="currentColor"
                  strokeWidth="2.4"
                />
                <path
                  d="M9 20h6"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <path
                  d="M12 16v4"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
        </div>

        {/* FOOTER */}
        <div className="mt-12 border-t border-gray-200 pt-6 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} PlaniDay - Онлайн-запис до майстрів
          </p>
        </div>
      </div>
    </main>
  );
}
