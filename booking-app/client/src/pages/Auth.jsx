// Auth.jsx
export default function Auth() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Вхід для майстрів</h1>

      <input
        type="text"
        placeholder="Email або телефон"
        className="w-full rounded border p-3"
      />

      <input
        type="password"
        placeholder="Пароль"
        className="w-full rounded border p-3"
      />

      <button className="w-full rounded bg-black py-3 text-white">
        Увійти
      </button>
    </div>
  )
}
