import { useState } from 'react'
import { useStudio } from '../../context/studio/useStudio'

// ✅ helper: file -> dataURL (для превʼю і збереження як base64)
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Masters() {
  // ⚠️ очікую, що в контексті є masters + setMasters (як services + setServices)
const { studio, setMasters, updateStudio } = useStudio()

const masters = studio?.masters || []
const [editMaster, setEditMaster] = useState(null)

  const [form, setForm] = useState({
    name: '',
    bio: '',
    photoUrl: '', // dataURL/base64
  })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handlePickPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const dataUrl = await fileToDataUrl(file)
    setForm(prev => ({ ...prev, photoUrl: dataUrl }))
    e.target.value = ''
  }

  function removePhoto() {
    setForm(prev => ({ ...prev, photoUrl: '' }))
  }

  function addMaster(e) {
  e.preventDefault()
  if (!form.name.trim()) return
function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // fallback якщо десь старий браузер
  return `id_${Math.random().toString(16).slice(2)}_${Math.random().toString(16).slice(2)}`
}

  const next = [
    ...masters,
    {
      id: makeId(),
      name: form.name.trim(),
      bio: form.bio.trim(),
      photoUrl: form.photoUrl,
    },
  ]

  persistMasters(next)
  setForm({ name: '', bio: '', photoUrl: '' })
}


function deleteMaster(id) {
  persistMasters(masters.filter(m => m.id !== id))
}


function persistMasters(next) {
  // ✅ якщо в контексті є setMasters — супер
  if (typeof setMasters === 'function') {
    setMasters(next)
    return
  }

  // ✅ якщо setMasters нема — оновлюємо студію (як у StudioSettings)
  if (typeof updateStudio === 'function') {
    updateStudio({ masters: next })
    return
  }

  // якщо немає ні того ні того — тоді реально нема чим зберігати
  console.warn('Немає setMasters або updateStudio в useStudio()')
}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Майстри</h1>
        <p className="mt-1 text-sm text-gray-600">
          Додай майстрів, щоб потім привʼязувати їх до послуг і записів.
        </p>
      </div>

      {/* ✅ Додавання майстра */}
      <section className="rounded-2xl border bg-white p-5 max-w-3xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Новий майстер</h2>
          <p className="text-sm text-gray-600">
            Фото, імʼя та короткий опис — як у професійних профілях.
          </p>
        </div>

        <form onSubmit={addMaster} className="space-y-4">
          {/* Фото */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl border bg-gray-50 overflow-hidden flex items-center justify-center">
              {form.photoUrl ? (
                <img
                  src={form.photoUrl}
                  alt="Фото майстра"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-500">Фото</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="services-buttom services-buttom-secondary cursor-pointer">
                Додати фото
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePickPhoto}
                  className="hidden"
                />
              </label>

              {form.photoUrl && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="services-buttom services-buttom-danger"
                >
                  Видалити
                </button>
              )}
            </div>
          </div>

          {/* Імʼя */}
          <div>
            <label className="block text-sm font-medium mb-1">Імʼя</label>
            <input
              name="name"
              placeholder="Напр. Олена Коваль"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl border p-3"
            />
          </div>

          {/* Опис */}
          <div>
            <label className="block text-sm font-medium mb-1">Опис</label>
            <textarea
              name="bio"
              placeholder="Напр. 6 років досвіду, спеціалізація: фарбування, укладки..."
              value={form.bio}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl border p-3 resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Коротко і по суті (2–4 речення).
            </p>
          </div>

          <div className="flex items-center gap-3">
<button type="submit" className="services-buttom services-buttom-primary">
  Додати майстра
</button>

            <p className="text-sm text-gray-600">
              Усього: <span className="font-medium">{masters.length}</span>
            </p>
          </div>
        </form>
      </section>

      {/* ✅ Список майстрів */}
      <section className="rounded-2xl border bg-white p-5 max-w-3xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Список майстрів</h2>
          <p className="text-sm text-gray-600">
            Редагування можна додати наступним кроком, як у послугах.
          </p>
        </div>

        {masters.length === 0 ? (
          <div className="rounded-xl border bg-gray-50 p-4 text-gray-600">
            Поки що немає майстрів. Додай першого майстра вище.
          </div>
        ) : (
          <div className="space-y-3">
            {masters.map(master => (
              <div
                key={master.id}
                className="flex items-center justify-between gap-4 rounded-xl border p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 rounded-xl border bg-gray-50 overflow-hidden flex-shrink-0">
                    {master.photoUrl ? (
                      <img
                        src={master.photoUrl}
                        alt={master.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <p className="font-medium truncate">{master.name}</p>
                    {master.bio ? (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {master.bio}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">Без опису</p>
                    )}
                  </div>
                </div>

  <button
    type="button"
    onClick={() => setEditMaster(master)}
    className="services-buttom services-buttom-secondary"
  >
    Редагувати
  </button>

  <button
    type="button"
    onClick={() => deleteMaster(master.id)}
    className="services-buttom services-buttom-danger"
  >
    Видалити
  </button>
              </div>
            ))}
          </div>
        )}
      </section>
      {editMaster && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Редагування майстра</h3>
        <p className="text-sm text-gray-600">
          Онови фото, імʼя або опис і збережи зміни.
        </p>
      </div>

      <div className="space-y-4">
        {/* Фото */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl border bg-gray-50 overflow-hidden flex items-center justify-center">
            {editMaster.photoUrl ? (
              <img
                src={editMaster.photoUrl}
                alt="Фото майстра"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-500">Фото</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="services-buttom services-buttom-secondary cursor-pointer">
              Змінити фото
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const dataUrl = await fileToDataUrl(file)
                  setEditMaster(prev => ({ ...prev, photoUrl: dataUrl }))
                  e.target.value = ''
                }}
              />
            </label>

            {editMaster.photoUrl && (
              <button
                type="button"
                onClick={() => setEditMaster(prev => ({ ...prev, photoUrl: '' }))}
                className="services-buttom services-buttom-danger"
              >
                Прибрати
              </button>
            )}
          </div>
        </div>

        {/* Імʼя */}
        <div>
          <label className="block text-sm font-medium mb-1">Імʼя</label>
          <input
            value={editMaster.name || ''}
            onChange={e => setEditMaster(prev => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-xl border p-3"
          />
        </div>

        {/* Опис */}
        <div>
          <label className="block text-sm font-medium mb-1">Опис</label>
          <textarea
            value={editMaster.bio || ''}
            onChange={e => setEditMaster(prev => ({ ...prev, bio: e.target.value }))}
            rows={4}
            className="w-full rounded-xl border p-3 resize-none"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditMaster(null)}
          className="services-buttom services-buttom-secondary"
        >
          Скасувати
        </button>

        <button
          type="button"
          onClick={() => {
            // ✅ зберігаємо оновленого майстра в масив
            const next = masters.map(m => (m.id === editMaster.id ? editMaster : m))
            persistMasters(next)
            setEditMaster(null)
          }}
          className="services-buttom services-buttom-primary"
        >
          Зберегти
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  )
}
