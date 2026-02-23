import React, { useMemo, useState } from "react";

export default function BookingCustomerForm({
  form,
  setForm,
  onSubmit,
  onBack,
}) {
  const [triedSubmit, setTriedSubmit] = useState(false);

  const digits = form.phone.replace(/\D/g, "");

  const isValidPhone = useMemo(() => {
    return /^380\d{9}$/.test(digits);
  }, [digits]);

function formatPhone(value) {
  // дозволяємо тільки цифри і +
  let cleaned = value
    .replace(/[^\d+]/g, "")
    .replace(/(?!^)\+/g, ""); // + тільки на початку

  // якщо поле пусте — повертаємо пусте
  if (cleaned === "") return "";

  const hasPlus = cleaned.startsWith("+");
  const numbers = cleaned.replace(/\D/g, "").slice(0, 12);

  // якщо ще немає 380 — просто повертаємо як є
  if (!numbers.startsWith("380")) {
    return (hasPlus ? "+" : "") + numbers;
  }

  // форматування тільки якщо є 380
  let formatted = hasPlus ? "+380 " : "380 ";

  if (numbers.length > 3) formatted += numbers.slice(3, 5);
  if (numbers.length > 5) formatted += " " + numbers.slice(5, 8);
  if (numbers.length > 8) formatted += " " + numbers.slice(8, 10);
  if (numbers.length > 10) formatted += " " + numbers.slice(10, 12);

  return formatted;
}

  function handleSubmit(e) {
    e.preventDefault();
    setTriedSubmit(true);

    if (!isValidPhone) return;

    onSubmit(e);
  }

  return (
    <>
      {/* overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-[2px]"
        onClick={onBack}
      />

      {/* modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl border bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Ваші дані
              </h2>
              <p className="text-sm text-gray-600">
                Вкажіть імʼя та телефон
              </p>
            </div>

            <button
              onClick={onBack}
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <input
              placeholder="Імʼя"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />

            <div>
              <input
                placeholder="+380 XX XXX XX XX"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    phone: formatPhone(e.target.value),
                  }))
                }
                className={`w-full rounded-xl border p-3 text-sm focus:outline-none focus:ring-2 ${
                  triedSubmit && !isValidPhone
                    ? "border-red-400 focus:ring-red-200"
                    : "border-gray-200 focus:ring-gray-200"
                }`}
              />

              {triedSubmit && !isValidPhone && (
                <p className="mt-1 text-xs text-red-500">
                  Формат телефону +380 XX XXX XX XX
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button className="flex-1 ui-button-one">
                Записатись
              </button>

              <button
                type="button"
                onClick={onBack}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-3 font-semibold hover:bg-gray-50"
              >
                Назад
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}