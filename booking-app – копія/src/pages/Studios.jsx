import { Link } from 'react-router-dom'
import { studios } from '../data/studios'

export default function Studios() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Студії</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {studios.map(studio => (
          <Link
            key={studio.slug}
            to={`/studios/${studio.slug}`}
            className="rounded-xl border bg-white p-4 hover:shadow"
          >
            <h2 className="font-semibold">{studio.name}</h2>
            <p className="text-sm text-gray-600">
              {studio.category} • {studio.city}
            </p>
            <p className="mt-2 font-medium">
              від {studio.priceFrom} грн
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
