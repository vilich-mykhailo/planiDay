import { useEffect, useMemo, useState } from "react";
import { BookingsContext } from "./BookingsContext";

const STORAGE_KEY = "booking_app_bookings_v1";

export default function BookingsProvider({ children }) {
  const [bookings, setBookings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Зчитуємо рядок із localStorage по ключу STORAGE_KEY
      return raw ? JSON.parse(raw) : [];
      // Якщо дані є (raw не null/не порожній), розпарсюємо JSON у масив
      // Якщо даних немає — повертаємо порожній масив (тобто "немає бронювань")
    } catch (err) {
      console.warn("Failed to read bookings from localStorage", err);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch (err) {
      console.warn("Failed to save bookings to localStorage", err);
    }
  }, [bookings]);

  function addBooking(booking) {
    setBookings((prev) => [
      ...prev,
      {
        id: Date.now(),
        status: "new",
        createdAt: new Date().toISOString(),
        ...booking,
      },
    ]);
  }

  function cancelBooking(id) {
    // Функція "скасувати запис" за id
    // id — ідентифікатор конкретного бронювання
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "canceled" } : b)),
    );
  }

  function confirmBooking(id) {
    // Функція "підтвердити запис" за id
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "confirmed" } : b)),
    );
  }

  function deleteBooking(id) {
    // Функція повного видалення бронювання з масиву (не просто зміна статусу)

    setBookings((prev) => prev.filter((b) => b.id !== id));
    // filter залишає тільки ті бронювання, у яких id НЕ дорівнює переданому
    // Результат — новий масив без видаленого елемента
  }

  const value = useMemo(
    () => ({
      bookings,
      addBooking,
      cancelBooking,
      confirmBooking,
      deleteBooking,
    }),
    [bookings],
  );

  return (
    <BookingsContext.Provider value={value}>
      {children}
    </BookingsContext.Provider>
  );
}
