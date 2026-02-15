import React from "react";

export default function BookingCustomerForm({
  form,
  setForm,
  onSubmit,
  submitDisabled,
  onBack,
}) {
  return (
    <>
      {/* overlay */}
      <div
        className="            fixed inset-0 z-50
            flex items-center justify-center
            px-4
            bg-black/40
            backdrop-blur-[2px]
            backdrop-saturate-150
            transition-all duration-200"
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
              <p className="text-sm text-gray-600">Вкажіть імʼя та телефон</p>
            </div>

            <button
              onClick={onBack}
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          {/* form */}
          <form onSubmit={onSubmit} className="p-4 space-y-4">
            <input
              placeholder="Імʼя"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />

            <input
              placeholder="Телефон"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />

            <div className="flex gap-2">
              <button
                className="flex-1 ui-button-one"
                disabled={submitDisabled}
              >
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
