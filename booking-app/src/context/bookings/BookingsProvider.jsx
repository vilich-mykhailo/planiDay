import { useEffect, useMemo, useState } from 'react'
import { BookingsContext } from './BookingsContext'

const STORAGE_KEY = 'booking_app_bookings_v1'

export default function BookingsProvider({ children }) {
  const [bookings, setBookings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch (err) {
      console.warn('Failed to read bookings from localStorage', err)
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
    } catch (err) {
      console.warn('Failed to save bookings to localStorage', err)
    }
  }, [bookings])

  function addBooking(booking) {
    setBookings(prev => [
      ...prev,
      {
        id: Date.now(),
        status: 'new',
        createdAt: new Date().toISOString(),
        ...booking,
      },
    ])
  }

  function cancelBooking(id) {
    setBookings(prev => prev.map(b => (b.id === id ? { ...b, status: 'canceled' } : b)))
  }

  function confirmBooking(id) {
    setBookings(prev => prev.map(b => (b.id === id ? { ...b, status: 'confirmed' } : b)))
  }
function deleteBooking(id) {
  setBookings(prev => prev.filter(b => b.id !== id))
}

const value = useMemo(
  () => ({ bookings, addBooking, cancelBooking, confirmBooking, deleteBooking }),
  [bookings]
)


  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>
}
