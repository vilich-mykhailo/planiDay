// useBookings.js
import { useContext } from 'react'
import { BookingsContext } from './BookingsContext'

export function useBookings() {
  const ctx = useContext(BookingsContext)
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider')
  return ctx
}
