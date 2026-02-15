import { useEffect, useMemo, useRef, useState } from "react";
import { useStudio } from "../../context/studio/useStudio";

export default function Services() {
  const { studio, setServices } = useStudio();
  const [editService] = useState(null);

  const masters = studio.masters || [];

  const durationOptions = [
    { value: 30, label: "30 хв" },
    { value: 60, label: "60 хв" },
    { value: 90, label: "90 хв" },
  ];


const [form, setForm] = useState({
  name: "",
  duration: 60,
  price: "",
  allMasters: true,   // ✅ нове
  masters: [],        // ✅ масив майстрів
});

const [editId, setEditId] = useState(null);
const [draft, setDraft] = useState(null);

const services = useMemo(() => studio.services ?? [], [studio.services]);
useEffect(() => {
  if (!editId) {
    setDraft(null);
    return;
  }

  const original = services.find((s) => s.id === editId);

  if (original) {
    setDraft({
      ...original,
      masters: original.masters ? [...original.masters] : [],
    });
  }
}, [editId, services]);
useEffect(() => {
  if (!editId) {
    setDraft(null);
    return;
  }

  const original = services.find((s) => s.id === editId);

  if (original) {
    setDraft({
      ...original,
      masters: original.masters ? [...original.masters] : [],
    });
  }
}, [editId, services]);

useEffect(() => {
  if (editId) document.body.classList.add("modal-open");
  else document.body.classList.remove("modal-open");

  return () => document.body.classList.remove("modal-open");
}, [editId]);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }
  function getMastersWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return "майстер";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "майстри";
  return "майстрів";
}

  function addService(e) {
    e.preventDefault();
    if (!form.name || !form.price) return;
if (!form.allMasters && form.masters.length === 0) return;

    function makeId() {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return `id_${Math.random().toString(16).slice(2)}_${Math.random()
        .toString(16)
        .slice(2)}`;
    }

const id = makeId();

const next = [
  ...(studio.services || []),
  {
    id,
    name: form.name,
    duration: Number(form.duration),
    price: Number(form.price),
    allMasters: form.allMasters,
    masters: form.allMasters ? [] : form.masters, // ✅
  },
];


    setServices(next);
    setForm({ name: "", duration: 60, price: "", allMasters: true, masters: [] });

  }

  function deleteService(id) {
    setServices((studio.services || []).filter((s) => s.id !== id));
  }

  function AnimatedSelect({
    label,
    value,
    onChange,
    options,
    placeholder = "Оберіть…",
    name,
  }) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const ref = useRef(null);
    const btnRef = useRef(null);

    const selected = useMemo(
      () => options.find((o) => String(o.value) === String(value)),
      [options, value]
    );

    useEffect(() => {
      const onDown = (e) => {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener("mousedown", onDown);
      return () => document.removeEventListener("mousedown", onDown);
    }, []);

useEffect(() => {
  if (editService) document.body.classList.add("modal-open");
  else document.body.classList.remove("modal-open");

  return () => document.body.classList.remove("modal-open");
}, []);



    useEffect(() => {
      if (!open) return;

      const onKeyDown = (e) => {
        if (e.key === "Escape") {
          setOpen(false);
          btnRef.current?.focus();
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
        }
        if (e.key === "Enter") {
          if (activeIndex >= 0 && options[activeIndex]) {
            onChange(options[activeIndex].value);
            setOpen(false);
            btnRef.current?.focus();
          }
        }
      };

      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, activeIndex, options, onChange]);

    useEffect(() => {
      if (!open) return;
      const idx = options.findIndex((o) => String(o.value) === String(value));
      setActiveIndex(idx >= 0 ? idx : 0);
    }, [open, options, value]);

    return (
      <div ref={ref} className="relative">
        {label && (
          <label className="block text-sm font-medium text-gray-900 mb-1">
            {label}
          </label>
        )}

        <button
          ref={btnRef}
          type="button"
          name={name}
          onClick={() => setOpen((v) => !v)}
          className="
            w-full rounded-xl border border-gray-200 bg-white px-3 py-3
            flex items-center justify-between gap-3
            text-sm
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-black/10
          "
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={selected ? "text-gray-900" : "text-gray-400"}>
            {selected?.label ?? placeholder}
          </span>

          <svg
            className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M6 9l6 6 6-6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          className={`
            absolute left-0 right-0 z-20 mt-2
            rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden
            origin-top transition-all duration-200
            ${
              open
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-1 scale-95 pointer-events-none"
            }
          `}
          role="listbox"
        >
          {options.map((opt, idx) => {
            const isSelected = String(opt.value) === String(value);
            const isActive = idx === activeIndex;

            return (
              <button
                key={`${opt.value}-${opt.label}`}
                type="button"
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  btnRef.current?.focus();
                }}
                className={`
                  w-full px-4 py-3 text-left flex items-center justify-between
                  text-sm
                  transition-colors
                  ${isActive ? "bg-black/5" : "bg-white"}
                  hover:bg-black/5
                `}
              >
                <span className={isSelected ? "font-semibold" : ""}>
                  {opt.label}
                </span>
                {isSelected && (
                  <svg
                    className="h-4 w-4 text-gray-900"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const canSubmit = Boolean(form.name?.trim()) && Boolean(String(form.price).trim());
function MasterChip({ master, checked }) {
  const id = master.id ?? master.name;
  const name = master.name ?? String(id);

  // ✅ підстав правильне поле з твоїх даних:
  const avatar = master.photoUrl || master.avatarUrl || master.image || "";

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-9 w-9 rounded-full overflow-hidden border bg-white flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-xs font-semibold text-gray-600 bg-gray-100">
            {initials || "M"}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
        {checked ? (
          <p className="text-xs text-emerald-700">Обрано</p>
        ) : (
          <p className="text-xs text-gray-500">Доступний</p>
        )}
      </div>
    </div>
  );
}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Послуги
            </h1>
            <p className="mt-2 text-sm text-gray-600 max-w-2xl">
              Додайте послуги, щоб клієнти могли швидко обрати потрібний варіант і записатись онлайн.
            </p>
          </div>

<div className="flex items-center gap-2">
  <span className="
    whitespace-nowrap
    rounded-full border border-gray-200 bg-gray-50
    px-3 py-1
    text-xs font-semibold text-gray-700
  ">
    Всього: {services.length}
  </span>

  <span className="
    whitespace-nowrap
    rounded-full border border-emerald-200 bg-emerald-50
    px-3 py-1
    text-xs font-semibold text-emerald-800
  ">
    Майстрів: {masters.length}
  </span>
</div>

        </div>
      </div>
      {/* Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add service card */}
        <section className="rounded-[28px] border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Додати нову послугу
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Вкажіть назву, тривалість, ціну та за потреби — майстра.
            </p>
          </div>

          <form onSubmit={addService} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Назва послуги
              </label>
              <input
                name="name"
                placeholder="Напр. Стрижка чоловіча"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Тривалість
                </label>
                <AnimatedSelect
                  name="duration"
                  value={form.duration}
                  onChange={(val) =>
                    setForm((prev) => ({ ...prev, duration: Number(val) }))
                  }
                  options={durationOptions}
                  placeholder="Оберіть тривалість"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Ціна
                </label>
                <input
                  name="price"
                  type="number"
                  placeholder="грн"
                  value={form.price}
                  onChange={handleChange}
                  className="
                    w-full rounded-xl border border-gray-200 bg-white p-3 text-sm
                    appearance-none
                    [&::-webkit-inner-spin-button]:appearance-none
                    [&::-webkit-outer-spin-button]:appearance-none
                    [appearance:textfield]
                    focus:outline-none
                    focus:ring-2 focus:ring-black/10
                    transition-all
                  "
                />
              </div>

            </div>
<div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
  <p className="text-sm font-semibold text-gray-900">Виконавці</p>
  <p className="mt-1 text-xs text-gray-600">
    За замовчуванням послуга доступна всім майстрам. <br />Якщо потрібно — оберіть конкретних.
  </p>

  <div className="mt-3 flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() =>
        setForm((prev) => ({ ...prev, allMasters: true, masters: [] }))
      }
      className={`rounded-xl px-4 py-2 text-sm font-semibold border transition ${
        form.allMasters
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
      }`}
    >
      Для всіх майстрів
    </button>

    <button
      type="button"
      onClick={() => setForm((prev) => ({ ...prev, allMasters: false }))}
      className={`rounded-xl px-4 py-2 text-sm font-semibold border transition ${
        !form.allMasters
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
      }`}
    >
      Обрати майстрів
    </button>
  </div>

  {!form.allMasters && (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
      {masters.length === 0 ? (
        <div className="rounded-xl border bg-white p-3 text-sm text-gray-600">
          Спочатку додайте майстрів.
        </div>
      ) : (
        masters.map((m) => {
          const id = m.id ?? m.name;
          const checked = form.masters.includes(String(id));

          return (
            <label
              key={String(id)}
              className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition
  ${checked ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}

            >


              <span className="text-sm font-semibold text-gray-900">
               <label
  key={String(id)}
  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 cursor-pointer hover:bg-gray-50"
>
  <input
    type="checkbox"
    checked={checked}
    onChange={(e) => {
      const next = e.target.checked
        ? [...form.masters, String(id)]
        : form.masters.filter((x) => x !== String(id));

      setForm((prev) => ({ ...prev, masters: next }));
    }}
    className="h-4 w-4 accent-emerald-300 cursor-pointer"
  />

  <MasterChip master={m} checked={checked} />
</label>

              </span>
            </label>
          );
        })
      )}
    </div>
  )}

  {!form.allMasters && (
    <p className="mt-2 text-xs text-gray-500">
      Обрано: <span className="font-semibold">{form.masters.length}</span>
    </p>
  )}
</div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={!canSubmit}
                className={`
                  inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold
                  transition active:scale-[0.99]
                  ${
                    canSubmit
                      ? "ui-button-one"
                      : "ui-button-one"
                  }
                `}
              >
                Додати послугу
              </button>

            </div>
          </form>
        </section>

        {/* Services list */}
        <section className="rounded-[28px] border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Список послуг
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Усі послуги, доступні клієнтам під час запису.
              </p>
            </div>
          </div>

          {services.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
              Поки що немає послуг. Додайте першу послугу зліва.
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50/60 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {service.name}
                      </p>

<p className="mt-1 text-sm text-gray-600">
  {service.duration} хв • {service.price} грн
{service.allMasters
  ? " • всі майстри"
  : service.masters?.length === 1
    ? ` • ${
        masters.find(
          m => String(m.id ?? m.name) === String(service.masters[0])
        )?.name || service.masters[0]
      }`
    : service.masters?.length > 1
      ? ` • ${service.masters.length} ${getMastersWord(service.masters.length)}`
      : ""}



</p>

                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEditId(service.id)}

                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-[0.99] transition"
                      >
                        Редагувати
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteService(service.id)}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 active:scale-[0.99] transition"
                      >
                        Видалити
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Edit modal (ONE instance) */}
{editId && draft && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-[2px] backdrop-saturate-150"
    onClick={() => setEditId(null)}
  >
    <div
      className="w-full max-w-md overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Редагування
        </p>
        <h3 className="mt-1 text-lg font-semibold text-gray-900">
          {draft.name}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Оновіть дані та збережіть зміни.
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Назва */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Назва
          </label>
          <input
            value={draft.name}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>

        {/* Виконавці */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">Виконавці</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({ ...prev, allMasters: true, masters: [] }))
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold border transition ${
                draft.allMasters
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Для всіх майстрів
            </button>

            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  allMasters: false,
                  masters: prev.masters || [],
                }))
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold border transition ${
                !draft.allMasters
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Обрати майстрів
            </button>
          </div>

          {!draft.allMasters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {masters.map((m) => {
                const id = m.id ?? m.name;
                const label = m.name ?? String(id);
                const selected = (draft.masters || []).includes(String(id));

                return (
                  <label
                    key={String(id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${
                      selected
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => {
                        const current = draft.masters || [];
                        const next = e.target.checked
                          ? [...current, String(id)]
                          : current.filter((x) => x !== String(id));

                        setDraft((prev) => ({ ...prev, masters: next }));
                      }}
                      className="h-4 w-4 accent-emerald-300 cursor-pointer"
                    />

                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Ціна */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Ціна
          </label>
          <input
            type="number"
            value={draft.price}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, price: Number(e.target.value) }))
            }
            className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
        <button
          type="button"
          onClick={() => {
            setServices(services.map((s) => (s.id === editId ? draft : s)));
            setEditId(null);
          }}
          className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black active:scale-[0.99] transition"
        >
          Зберегти
        </button>

        <button
          type="button"
          onClick={() => setEditId(null)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-[0.99] transition"
        >
          Скасувати
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
}
