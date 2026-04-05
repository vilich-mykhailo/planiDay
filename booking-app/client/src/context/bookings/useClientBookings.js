// useClientBookings.js
import { useCallback, useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { socket } from "../../lib/socket";

async function fetchClientBookings() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "client") {
    return [];
  }

  const res = await fetch(`${import.meta.env.VITE_API_URL}/client/bookings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.message || `Load client bookings failed (${res.status})`,
    );
  }

  return Array.isArray(data?.bookings) ? data.bookings : [];
}

async function cancelClientBookingRequest(bookingId) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/client/bookings/${bookingId}/cancel`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || `Cancel booking failed (${res.status})`);
  }

  return data;
}

function getUserIdFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.sub || null;
  } catch {
    return null;
  }
}

export function useClientBookings() {
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ["client-bookings"],
    queryFn: fetchClientBookings,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

useEffect(() => {
  const role = localStorage.getItem("role");
  const userId =
    localStorage.getItem("userId") || getUserIdFromToken();

  console.log("CLIENT socket init", {
    role,
    userId,
    connected: socket.connected,
  });

  if (role !== "client" || !userId) return;

  const joinRoom = () => {
    console.log("CLIENT auth:join", { userId, connected: socket.connected });
    socket.emit("auth:join", { userId });
  };

  if (socket.connected) {
    joinRoom();
  }

  socket.on("connect", joinRoom);

  const handleBookingUpdated = (payload) => {
    console.log("CLIENT got booking:updated", payload);

    if (!payload) return;

    if (payload.clientId && String(payload.clientId) !== String(userId)) {
      return;
    }

    const incomingId = payload?.bookingId;
    const incomingStatus = payload?.status;

    if (!incomingId) return;

    queryClient.setQueryData(["client-bookings"], (old = []) =>
      old.map((b) =>
        b.id === incomingId
          ? {
              ...b,
              status: incomingStatus || b.status,
            }
          : b,
      ),
    );

    queryClient.invalidateQueries({
      queryKey: ["client-bookings"],
    });
  };

  socket.on("booking:updated", handleBookingUpdated);

  return () => {
    socket.off("connect", joinRoom);
    socket.off("booking:updated", handleBookingUpdated);
  };
}, [queryClient]);

  const cancelMutation = useMutation({
    mutationFn: cancelClientBookingRequest,

    onMutate: async (bookingId) => {
      await queryClient.cancelQueries({ queryKey: ["client-bookings"] });

      const previousBookings =
        queryClient.getQueryData(["client-bookings"]) || [];

      queryClient.setQueryData(["client-bookings"], (old = []) =>
        old.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: "canceled",
              }
            : b,
        ),
      );

      return { previousBookings };
    },

    onError: (_error, _bookingId, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(
          ["client-bookings"],
          context.previousBookings,
        );
      }
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["client-bookings"] });
    },
  });

  const loadBookings = useCallback(async () => {
    return queryClient.fetchQuery({
      queryKey: ["client-bookings"],
      queryFn: fetchClientBookings,
    });
  }, [queryClient]);

  const cancelBooking = useCallback(
    async (bookingId) => {
      if (!bookingId) return;
      return cancelMutation.mutateAsync(bookingId);
    },
    [cancelMutation],
  );

  return {
    bookings: bookingsQuery.data || [],
    loading: bookingsQuery.isLoading,
    fetching: bookingsQuery.isFetching,
    loadBookings,
    cancelBooking,
  };
}