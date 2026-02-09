import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="text-center space-y-8">
      <h1 className="text-4xl font-bold">
        Онлайн-запис до майстрів
      </h1>

      <p className="text-gray-600">
        Знайди студію та запишись за 1 хвилину
      </p>

      <Link
        to="/studios"
        className="inline-block rounded-xl bg-black px-6 py-3 text-white"
      >
        Знайти майстра
      </Link>
    </div>
  )
}
