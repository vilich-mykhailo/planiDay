import { useEffect, useMemo, useRef, useState } from "react";
import { useStudio } from "../../context/studio/useStudio";

export default function Services() {
  const { studio, setServices } = useStudio();
  const [editService, setEditService] = useState(null);
  const masters = studio.masters || [];
  const services = studio.services || [];

  const durationOptions = [
    { value: 30, label: "30 хв" },
    { value: 60, label: "60 хв" },
    { value: 90, label: "90 хв" },
  ];

  const masterOptions = [
    { value: "", label: "Оберіть майстра" },
    ...masters.map((m) => ({
      value: m.name || m.id,
      label: m.name || m.id,
    })),
  ];

  const [form, setForm] = useState({
    name: "",
    duration: 60,
    price: "",
    master: "",
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function addService(e) {
    e.preventDefault();
    if (!form.name || !form.price) return;
    function makeId() {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // fallback якщо десь старий браузер
      return `id_${Math.random().toString(16).slice(2)}_${Math.random().toString(16).slice(2)}`;
    }

    const next = [
      ...(studio.services || []),
      {
        id: makeId(),
        name: form.name,
        duration: Number(form.duration),
        price: Number(form.price),
        master: form.master,
      },
    ];

    setServices(next);
    setForm({ name: "", duration: 60, price: "", master: "" });
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
      [options, value],
    );

    useEffect(() => {
      const onDown = (e) => {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener("mousedown", onDown);
      return () => document.removeEventListener("mousedown", onDown);
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

    // При відкритті — підсвітити поточне значення
    useEffect(() => {
      if (!open) return;
      const idx = options.findIndex((o) => String(o.value) === String(value));
      setActiveIndex(idx >= 0 ? idx : 0);
    }, [open, options, value]);

    return (
      <div ref={ref} className="relative">
        {label && (
          <label className="block text-sm font-medium mb-1">{label}</label>
        )}

        <button
          ref={btnRef}
          type="button"
          name={name}
          onClick={() => setOpen((v) => !v)}
          className="
          w-full rounded-xl border p-3 bg-white
          flex items-center justify-between gap-3
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-black/10
        "
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={selected ? "text-black" : "text-gray-400"}>
            {selected?.label ?? placeholder}
          </span>

          <svg
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
          rounded-xl border bg-white shadow-lg overflow-hidden
          origin-top transition-all duration-200
          ${open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-1 scale-95 pointer-events-none"}
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
                transition-colors
                ${isActive ? "bg-black/5" : "bg-white"}
                hover:bg-black/5
              `}
              >
                <span className={isSelected ? "font-medium" : ""}>
                  {opt.label}
                </span>
                {isSelected && (
                  <svg
                    className="h-4 w-4"
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Послуги</h1>
        <p className="mt-1 text-sm text-gray-600">
          Додай послуги, щоб клієнти могли бронювати правильний варіант.
        </p>
      </div>

      {/* ✅ Додавання послуги */}
      <section className="rounded-2xl border bg-white p-5 max-w-3xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Нова послуга</h2>
          <p className="text-sm text-gray-600">
            Вкажи назву, тривалість та ціну.
          </p>
        </div>

        <form onSubmit={addService} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Назва послуги
            </label>
            <input
              name="name"
              placeholder="Напр. Стрижка чоловіча"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
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
              <label className="block text-sm font-medium mb-1">Ціна</label>
              <input
                name="price"
                type="number"
                placeholder="Ціна (грн)"
                value={form.price}
                onChange={handleChange}
                className="
      w-full rounded-xl border p-3
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

            <div>
              <AnimatedSelect
                label="Майстер"
                name="master"
                value={form.master}
                onChange={(val) =>
                  setForm((prev) => ({ ...prev, master: val }))
                }
                options={masterOptions}
                placeholder="Оберіть майстра"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="services-buttom services-buttom-primary">
              Додати послугу
            </button>

            {/* <p className="text-sm text-gray-600">
              К-ть створених послуг: <span className="font-medium">{services.length}</span>
            </p> */}
          </div>
        </form>
      </section>

      {/* ✅ Список послуг */}
      <section className="rounded-2xl border bg-white p-5 max-w-3xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Список послуг</h2>
            <p className="text-sm text-gray-600">
              Тут відображаються всі послуги, доступні для запису.
            </p>
          </div>
        </div>

        {services.length === 0 ? (
          <div className="rounded-xl border bg-gray-50 p-4 text-gray-600">
            Поки що немає послуг. Додай першу послугу вище.
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between gap-4 rounded-xl border p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{service.name}</p>
                  <p className="text-sm text-gray-600">
                    {service.duration} хв • {service.price} грн
                    {service.master ? ` • ${service.master}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditService(service)}
                    className="services-buttom services-buttom-secondary"
                  >
                    Редагувати
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteService(service.id)}
                    className="services-buttom services-buttom-danger"
                  >
                    Видалити
                  </button>
                </div>
                {editService && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold">
                          Редагування послуги
                        </h3>
                        <p className="text-sm text-gray-600">
                          Зміни дані та збережи.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Назва
                          </label>
                          <input
                            value={editService.name}
                            onChange={(e) =>
                              setEditService({
                                ...editService,
                                name: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border p-3"
                          />
                        </div>

                        <div>
                          <AnimatedSelect
                            label="Тривалість"
                            name="duration"
                            value={editService.duration}
                            onChange={(val) =>
                              setEditService((prev) => ({
                                ...prev,
                                duration: Number(val),
                              }))
                            }
                            options={[
                              { value: 30, label: "30 хв" },
                              { value: 60, label: "60 хв" },
                              { value: 90, label: "90 хв" },
                            ]}
                            placeholder="Оберіть тривалість"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Ціна
                          </label>
                          <input
                            type="number"
                            value={editService.price}
                            onChange={(e) =>
                              setEditService((prev) => ({
                                ...prev,
                                price: Number(e.target.value),
                              }))
                            }
                            className="
      w-full rounded-xl border p-3
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

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Майстер
                          </label>

                          <AnimatedSelect
                            name="master"
                            value={editService.master || ""}
                            onChange={(val) =>
                              setEditService((prev) => ({
                                ...prev,
                                master: val,
                              }))
                            }
                            options={masterOptions}
                            placeholder="Оберіть майстра"
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setServices(
                              services.map((s) =>
                                s.id === editService.id ? editService : s,
                              ),
                            );
                            setEditService(null);
                          }}
                          className="services-buttom services-buttom-primary"
                        >
                          Зберегти
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditService(null)}
                          className="services-buttom services-buttom-secondary"
                        >
                          Скасувати
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
