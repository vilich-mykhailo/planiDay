// BookingsProvider.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { BookingsContext } from "./BookingsContext";
import { useStudio } from "../studio/useStudio";

export default function BookingsProvider({ children }) {
  const { studio } = useStudio();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    if (!studio?.id) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/studio/${studio.id}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || `Load bookings failed (${res.status})`,
        );
      }

      setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
    } catch (err) {
      console.error("Failed to load bookings", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [studio?.id]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const confirmBooking = useCallback(
    async (id) => {
      if (!studio?.id || !id) return;

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/studio/${studio.id}/${id}/confirm`,
        {
          method: "PATCH",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || `Confirm failed (${res.status})`);
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "confirmed" } : b)),
      );
    },
    [studio?.id],
  );

  const cancelBooking = useCallback(
    async (id) => {
      if (!studio?.id || !id) return;

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/studio/${studio.id}/${id}/cancel`,
        {
          method: "PATCH",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || `Cancel failed (${res.status})`);
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "canceled" } : b)),
      );
    },
    [studio?.id],
  );

  const deleteBooking = useCallback(
    async (id) => {
      if (!studio?.id || !id) return;

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/studio/${studio.id}/${id}`,
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || `Delete failed (${res.status})`);
      }

      setBookings((prev) => prev.filter((b) => b.id !== id));
    },
    [studio?.id],
  );

  const value = useMemo(
    () => ({
      bookings,
      loading,
      loadBookings,
      confirmBooking,
      cancelBooking,
      deleteBooking,
    }),
    [
      bookings,
      loading,
      loadBookings,
      confirmBooking,
      cancelBooking,
      deleteBooking,
    ],
  );

  return (
    <BookingsContext.Provider value={value}>
      {children}
    </BookingsContext.Provider>
  );
}