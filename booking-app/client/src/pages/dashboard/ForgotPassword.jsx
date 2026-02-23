import { Link } from "react-router-dom";
import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    // TODO: api call
    setSent(true);
  }

  return (
    <main className="min-h-[100dvh]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-md">
          <div className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-black text-white font-extrabold">
              P
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-gray-900">
              Відновлення пароля
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Вкажи email — ми надішлемо інструкцію для зміни пароля.
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            {sent ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                Якщо акаунт існує — ми надіслали лист на <b>{email}</b>.
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-900">
                    Email
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/30"
                  />
                </label>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-black px-5 py-3.5 text-sm font-extrabold text-white hover:bg-gray-900 transition"
                >
                  Надіслати інструкцію
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-gray-200 pt-5 text-center">
              <p className="text-sm text-gray-600">
                Повернутися до{" "}
                <Link to="/login" className="font-extrabold text-gray-900 hover:underline">
                  входу
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            Якщо листа немає — перевір “Спам” або зачекай 1–2 хвилини.
          </p>
        </div>
      </div>
    </main>
  );
}
