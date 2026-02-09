import { useState } from 'react'
import { useStudio } from '../../context/studio/useStudio'

export default function StudioSettings() {
  const { studio, updateStudio } = useStudio()

  const [form, setForm] = useState({
    name: studio?.name || '',
    category: studio?.category || '',
    city: studio?.city || '',
    street: studio?.street || '',
    building: studio?.building || '',
    apartment: studio?.apartment || '',

    // ✅ нове (профі-секції)
    description: studio?.description || '',
    coverUrl: studio?.coverUrl || '', // обкладинка/банер
    logoUrl: studio?.logoUrl || '', // лого/аватар
    portfolioUrls: studio?.portfolioUrls || '', // рядок: URL через кому або з нового рядка
    instagram: studio?.instagram || '',
    website: studio?.website || '',
    workingHours: studio?.workingHours || '',
  })

  const [saved, setSaved] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  function save(e) {
    e.preventDefault()

    updateStudio({
      name: form.name,
      category: form.category,
      city: form.city,
      street: form.street,
      building: form.building,
      apartment: form.apartment,

      // ✅ нове
      description: form.description,
      coverUrl: form.coverUrl,
      logoUrl: form.logoUrl,
      portfolioUrls: form.portfolioUrls,
      instagram: form.instagram,
      website: form.website,
      workingHours: form.workingHours,
    })

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const hasCover = Boolean(form.coverUrl?.trim())
  const hasLogo = Boolean(form.logoUrl?.trim())
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
async function handlePickCover(e) {
  const file = e.target.files?.[0]
  if (!file) return

  const dataUrl = await fileToDataUrl(file)
  setForm(prev => ({ ...prev, coverUrl: dataUrl }))
  setSaved(false)

  // щоб можна було вибрати той самий файл ще раз
  e.target.value = ''
}

async function handlePickLogo(e) {
  const file = e.target.files?.[0]
  if (!file) return

  const dataUrl = await fileToDataUrl(file)
  setForm(prev => ({ ...prev, logoUrl: dataUrl }))
  setSaved(false)

  e.target.value = ''
}

function removeCover() {
  setForm(prev => ({ ...prev, coverUrl: '' }))
  setSaved(false)
}

function removeLogo() {
  setForm(prev => ({ ...prev, logoUrl: '' }))
  setSaved(false)
}

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Налаштування студії</h1>
          <p className="mt-1 text-sm text-gray-600">
            Заповни профіль — це відображатиметься на сторінці студії для клієнтів.
          </p>
        </div>

        {saved && (
          <div className="rounded-xl border bg-white px-4 py-2 text-green-700">
            Збережено ✓
          </div>
        )}
      </div>

      <form onSubmit={save} className="space-y-6 max-w-4xl">
        {/* ✅ Професійний блок: Превʼю / Обкладинка */}
        <section className="rounded-2xl border bg-white overflow-hidden">
          <div className="relative h-40 bg-gray-100">
            {hasCover ? (
              <img
                src={form.coverUrl}
                alt="Обкладинка студії"
                className="h-full w-full object-cover"
                onError={e => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">
                Додай обкладинку (URL), щоб студія виглядала професійно
              </div>
            )}

            <div className="absolute -bottom-10 left-6 flex items-end gap-3">
              <div className="h-20 w-20 rounded-2xl border bg-white overflow-hidden flex items-center justify-center">
                {hasLogo ? (
                  <img
                    src={form.logoUrl}
                    alt="Лого студії"
                    className="h-full w-full object-cover"
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="text-xs text-gray-500 px-2 text-center">
                    Лого
                  </div>
                )}
              </div>

              <div className="pb-2">
                <p className="text-sm text-gray-600">Профіль студії</p>
                <p className="font-semibold">
                  {form.name?.trim() ? form.name : 'Назва студії'}
                </p>
                <p className="text-sm text-gray-600">
                  {form.category?.trim() ? form.category : 'Категорія'} •{' '}
                  {form.city?.trim() ? form.city : 'Місто'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-14 p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* ✅ Обкладинка */}
  <div>
    <p className="block text-sm font-medium mb-2">Обкладинка</p>

    <div className="flex items-center gap-2">
      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium hover:bg-gray-50">
        Додати фото
        <input
          type="file"
          accept="image/*"
          onChange={handlePickCover}
          className="hidden"
        />
      </label>

      {hasCover && (
        <button
          type="button"
          onClick={removeCover}
          className="rounded-xl border px-4 py-3 text-sm text-red-600 hover:bg-gray-50"
        >
          Видалити
        </button>
      )}
    </div>

    <p className="mt-2 text-xs text-gray-500">
      PNG/JPG, бажано 1200×400+
    </p>
  </div>

  {/* ✅ Лого */}
  <div>
    <p className="block text-sm font-medium mb-2">Логотип</p>

    <div className="flex items-center gap-2">
      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium hover:bg-gray-50">
        Додати фото
        <input
          type="file"
          accept="image/*"
          onChange={handlePickLogo}
          className="hidden"
        />
      </label>

      {hasLogo && (
        <button
          type="button"
          onClick={removeLogo}
          className="rounded-xl border px-4 py-3 text-sm text-red-600 hover:bg-gray-50"
        >
          Видалити
        </button>
      )}
    </div>

    <p className="mt-2 text-xs text-gray-500">
      PNG/JPG, бажано 400×400+
    </p>
  </div>
</div>

        </section>

        {/* ✅ Основна інформація */}
        <section className="rounded-2xl border bg-white p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Основна інформація</h2>
            <p className="text-sm text-gray-600">
              Це допоможе клієнтам зрозуміти, хто ви і чим займаєтесь.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Назва студії</label>
              <input
                name="name"
                placeholder="Напр. Creative Studio"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Категорія</label>
              <input
                name="category"
                placeholder="Масаж, барбер, нігті..."
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Опис</label>
              <textarea
                name="description"
                placeholder="Коротко: ваш стиль, досвід, що отримує клієнт, чому вам довіряють..."
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border p-3 resize-none"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Рекомендовано 2–4 речення.</span>
                <span>{form.description.length}/400</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Години роботи</label>
              <input
                name="workingHours"
                placeholder="Напр. Пн–Пт 10:00–19:00"
                value={form.workingHours}
                onChange={handleChange}
                className="w-full rounded-xl border p-3"
              />
            </div>
          </div>
        </section>

        {/* ✅ Адреса */}
        <section className="rounded-2xl border bg-white p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Адреса</h2>
            <p className="text-sm text-gray-600">
              Потрібно для коректного відображення локації.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Місто</label>
              <input
                name="city"
                placeholder="Місто"
                value={form.city}
                onChange={handleChange}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Вулиця</label>
              <input
                name="street"
                placeholder="Вулиця"
                value={form.street}
                onChange={handleChange}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Будинок</label>
              <input
                name="building"
                placeholder="Будинок"
                value={form.building}
                onChange={handleChange}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Квартира</label>
              <input
                name="apartment"
                placeholder="Квартира"
                value={form.apartment}
                onChange={handleChange}
                className="w-full rounded-xl border p-3"
              />
            </div>
          </div>
        </section>

        {/* ✅ Портфоліо + посилання */}
        <section className="rounded-2xl border bg-white p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Портфоліо та посилання</h2>
            <p className="text-sm text-gray-600">
              Додай приклади робіт — це підвищує довіру та конверсію.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Портфоліо (URL)</label>
              <textarea
                name="portfolioUrls"
                placeholder="Встав URL через кому або кожен з нового рядка"
                value={form.portfolioUrls}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border p-3 resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Приклад: https://.../work1.jpg ↵ https://.../work2.jpg
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Instagram</label>
              <input
                name="instagram"
                placeholder="https://instagram.com/..."
                value={form.instagram}
                onChange={handleChange}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Сайт</label>
              <input
                name="website"
                placeholder="https://yourstudio.com"
                value={form.website}
                onChange={handleChange}
                className="w-full rounded-xl border p-3"
              />
            </div>
          </div>
        </section>

        {/* ✅ Footer actions */}
        <div className="flex flex-wrap items-center gap-3">
<button
  type="submit"
  disabled={saved}
  className={`rounded-xl px-6 py-3 text-white transition
    ${saved ? 'ui-button ui-button-saved ' : 'ui-button ui-button-primary-strong'}
  `}
>
  {saved ? 'Збережено ✓' : 'Зберегти зміни'}
</button>


          {!saved && (
            <span className="text-sm text-gray-600">
              Після редагування натисни “Зберегти зміни”.
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
