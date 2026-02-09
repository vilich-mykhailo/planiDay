import { useState } from 'react'
import { useStudio } from '../../context/studio/useStudio'

export default function Services() {
  const { studio, setServices } = useStudio()

  const [form, setForm] = useState({
    name: '',
    duration: 60,
    price: '',
      master: '',
  })

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  function addService(e) {
    e.preventDefault()
    if (!form.name || !form.price) return
function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // fallback якщо десь старий браузер
  return `id_${Math.random().toString(16).slice(2)}_${Math.random().toString(16).slice(2)}`
}

    const next = [
      ...(studio.services || []),
{
  id: makeId(),
  name: form.name,
  duration: Number(form.duration),
  price: Number(form.price),
  master: form.master,
}

    ]

    setServices(next)
    setForm({ name: '', duration: 60, price: '', master: '' })

  }

  function deleteService(id) {
    setServices((studio.services || []).filter(s => s.id !== id))
  }

  const services = studio.services || []
const [editService, setEditService] = useState(null)
const masters = studio.masters || []

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
            <label className="block text-sm font-medium mb-1">Назва послуги</label>
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
    <label className="block text-sm font-medium mb-1">Тривалість</label>
    <select
      name="duration"
      value={form.duration}
      onChange={handleChange}
      className="w-full rounded-xl border p-3 bg-white"
    >
      <option value={30}>30 хв</option>
      <option value={60}>60 хв</option>
      <option value={90}>90 хв</option>
    </select>
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">Ціна</label>
    <input
      name="price"
      type="number"
      placeholder="Ціна (грн)"
      value={form.price}
      onChange={handleChange}
      className="w-full rounded-xl border p-3"
    />
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">Майстер</label>
    <select
      name="master"
      value={form.master}
      onChange={handleChange}
      className="w-full rounded-xl border p-3 bg-white"
    >
      <option value="">Оберіть майстра</option>
      {masters.map(m => (
        <option key={m.id || m.name} value={m.name || m.id}>
          {m.name || m.id}
        </option>
      ))}
    </select>
  </div>
</div>


          <div className="flex items-center gap-3">
            <button className="services-buttom services-buttom-primary">
              Додати послугу
            </button>

            <p className="text-sm text-gray-600">
              Усього: <span className="font-medium">{services.length}</span>
            </p>
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
            {services.map(service => (
              <div
                key={service.id}
                className="flex items-center justify-between gap-4 rounded-xl border p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{service.name}</p>
<p className="text-sm text-gray-600">
  {service.duration} хв • {service.price} грн
  {service.master ? ` • ${service.master}` : ''}
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
        <h3 className="text-lg font-semibold">Редагування послуги</h3>
        <p className="text-sm text-gray-600">
          Зміни дані та збережи.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Назва</label>
          <input
            value={editService.name}
            onChange={e =>
              setEditService({ ...editService, name: e.target.value })
            }
            className="w-full rounded-xl border p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Тривалість</label>
          <select
            value={editService.duration}
            onChange={e =>
              setEditService({
                ...editService,
                duration: Number(e.target.value),
              })
            }
            className="w-full rounded-xl border p-3 bg-white"
          >
            <option value={30}>30 хв</option>
            <option value={60}>60 хв</option>
            <option value={90}>90 хв</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ціна</label>
          <input
            type="number"
            value={editService.price}
            onChange={e =>
              setEditService({
                ...editService,
                price: Number(e.target.value),
              })
            }
            className="w-full rounded-xl border p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Майстер</label>
          <input
            value={editService.master || ''}
            placeholder="Імʼя майстра"
            onChange={e =>
              setEditService({
                ...editService,
                master: e.target.value,
              })
            }
            className="w-full rounded-xl border p-3"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
                <button
          type="button"
          onClick={() => {
            setServices(
              services.map(s =>
                s.id === editService.id ? editService : s
              )
            )
            setEditService(null)
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
  )
}
