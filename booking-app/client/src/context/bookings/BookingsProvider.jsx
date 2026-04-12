// BookingsProvider.jsx
import { useMemo, useCallback, useEffect, useRef } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { BookingsContext } from "./BookingsContext";
import { useStudio } from "../studio/useStudio";
import { socket } from "../../lib/socket";

// ================= API =================

async function fetchBookings(studioId) {
  if (!studioId) return [];

  const token = localStorage.getItem("token");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/bookings/studio/${studioId}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || `Load bookings failed (${res.status})`);
  }

  return Array.isArray(data?.bookings) ? data.bookings : [];
}

async function confirmBookingRequest(studioId, id) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/bookings/studio/${studioId}/${id}/confirm`,
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

  return data;
}

async function cancelBookingRequest(studioId, id) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/bookings/studio/${studioId}/${id}/cancel`,
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

  return data;
}

async function deleteBookingRequest(studioId, id) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/bookings/studio/${studioId}/${id}`,
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

  return data;
}

// ================= PROVIDER =================

export default function BookingsProvider({ children }) {
  const { studio } = useStudio();
  const studioId = studio?.id ?? null;
  const queryClient = useQueryClient();
  const joinedStudioRef = useRef(null);

  // ================= QUERY =================

  const bookingsQuery = useQuery({
    queryKey: ["bookings", studioId],
    queryFn: () => fetchBookings(studioId),
    enabled: Boolean(studioId),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 5000,
  });

  // ================= SOCKET JOIN =================

useEffect(() => {
  if (!studioId) return;

  const joinStudioRoom = () => {
    console.log("OWNER auth:join", {
      studioId,
      connected: socket.connected,
    });

    socket.emit("auth:join", {
  studioId,
  role: "owner",
});
    joinedStudioRef.current = studioId;
  };

  if (socket.connected) {
    joinStudioRoom();
  }

  socket.on("connect", joinStudioRoom);

  return () => {
    socket.off("connect", joinStudioRoom);
  };
}, [studioId]);

  // ================= SOCKET LISTENER =================
useEffect(() => {
  if (!studioId) return;

  const handler = async (payload) => {
    console.log("OWNER got booking:updated", payload);

    if (!payload) return;

    if (
      payload.studioId &&
      String(payload.studioId) !== String(studioId)
    ) {
      return;
    }

    const bookingId = payload.bookingId || payload.id;
    const { status, deleted, hiddenForOwner, canceledBy } = payload;

    if ((deleted || hiddenForOwner) && bookingId) {
      queryClient.setQueryData(["bookings", studioId], (old = []) =>
        old.filter((b) => b.id !== bookingId),
      );
    } else if (bookingId && status) {
      queryClient.setQueryData(["bookings", studioId], (old = []) =>
        old.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status,
                canceledBy: canceledBy || b.canceledBy || null,
              }
            : b,
        ),
      );
    }

    await queryClient.refetchQueries({
      queryKey: ["bookings", studioId],
      exact: true,
    });
  };

  socket.on("booking:updated", handler);

  return () => {
    socket.off("booking:updated", handler);
  };
}, [studioId, queryClient]);

  // ================= MUTATIONS =================

  const confirmMutation = useMutation({
    mutationFn: (id) => confirmBookingRequest(studioId, id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["bookings", studioId] });

      const previous =
        queryClient.getQueryData(["bookings", studioId]) || [];

queryClient.setQueryData(["bookings", studioId], (old = []) =>
  old.map((b) =>
    b.id === id
      ? { ...b, status: "canceled", canceledBy: "owner" }
      : b,
  ),
);

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["bookings", studioId], ctx.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookings", studioId],
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => cancelBookingRequest(studioId, id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["bookings", studioId] });

      const previous =
        queryClient.getQueryData(["bookings", studioId]) || [];

      queryClient.setQueryData(["bookings", studioId], (old = []) =>
        old.map((b) => (b.id === id ? { ...b, status: "canceled" } : b)),
      );

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["bookings", studioId], ctx.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookings", studioId],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBookingRequest(studioId, id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["bookings", studioId] });

      const previous =
        queryClient.getQueryData(["bookings", studioId]) || [];

      queryClient.setQueryData(["bookings", studioId], (old = []) =>
        old.filter((b) => b.id !== id),
      );

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["bookings", studioId], ctx.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookings", studioId],
      });
    },
  });

  // ================= ACTIONS =================

  const confirmBooking = useCallback(
    (id) => confirmMutation.mutateAsync(id),
    [confirmMutation],
  );

  const cancelBooking = useCallback(
    (id) => cancelMutation.mutateAsync(id),
    [cancelMutation],
  );

  const deleteBooking = useCallback(
    (id) => deleteMutation.mutateAsync(id),
    [deleteMutation],
  );

  // ================= VALUE =================
const newBookingsCount = useMemo(() => {
  const items = bookingsQuery.data || [];
  return items.filter((b) => !b.status || b.status === "new").length;
}, [bookingsQuery.data]);

const value = useMemo(
  () => ({
    bookings: bookingsQuery.data || [],
    newBookingsCount,
    loading: bookingsQuery.isLoading,
    confirmBooking,
    cancelBooking,
    deleteBooking,
    loadBookings: () =>
      queryClient.invalidateQueries({
        queryKey: ["bookings", studioId],
      }),
  }),
  [
    bookingsQuery.data,
    newBookingsCount,
    bookingsQuery.isLoading,
    confirmBooking,
    cancelBooking,
    deleteBooking,
    queryClient,
    studioId,
  ],
);

  return (
    <BookingsContext.Provider value={value}>
      {children}
    </BookingsContext.Provider>
  );
}