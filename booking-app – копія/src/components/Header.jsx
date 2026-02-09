import { Link } from 'react-router-dom'
import './Header.css'

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-4 flex justify-between">
        <Link to="/" className="font-bold">
          PlaniDay
        </Link>

        <nav className="flex gap-4">
          <Link to="/studios">Студії</Link>
          <Link to="/auth">Для майстрів</Link>
        </nav>
      </div>
    </header>
  )
}
