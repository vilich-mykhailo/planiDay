// FavouritesContext.jsx
import { useCallback, useEffect, useState } from "react";
import { FavouritesContext } from "./favourites.context.js";

const API_URL = import.meta.env.VITE_API_URL;

export function FavouritesProvider({ children }) {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");

    return token
      ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      : {};
  }, []);

  const loadFavourites = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || role !== "client") {
        setFavourites([]);
        return;
      }

      const res = await fetch(`${API_URL}/client/favourites`, {
        headers: getAuthHeaders(),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Load favourites failed");
      }

      setFavourites(Array.isArray(data?.favourites) ? data.favourites : []);
    } catch (e) {
      console.error(e);
      setFavourites([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const toggleFavourite = useCallback(
    async (studio) => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || role !== "client") {
        alert("Потрібно увійти як клієнт");
        return;
      }

      const studioId = studio?.id;
      if (!studioId) return;

      const exists = favourites.some((f) => f.id === studioId);

      try {
        if (exists) {
          const res = await fetch(`${API_URL}/client/favourites/${studioId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            throw new Error(data?.message || "Remove favourite failed");
          }

          setFavourites((prev) => prev.filter((f) => f.id !== studioId));
        } else {
          const res = await fetch(`${API_URL}/client/favourites/${studioId}`, {
            method: "POST",
            headers: getAuthHeaders(),
          });

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            throw new Error(data?.message || "Add favourite failed");
          }

          setFavourites((prev) => {
            if (prev.some((f) => f.id === studioId)) return prev;
            return [studio, ...prev];
          });
        }
      } catch (e) {
        console.error(e);
      }
    },
    [favourites, getAuthHeaders],
  );

  const isFavourite = useCallback(
    (studioId) => favourites.some((f) => f.id === studioId),
    [favourites],
  );

  useEffect(() => {
    loadFavourites();
  }, [loadFavourites]);

  return (
    <FavouritesContext.Provider
      value={{
        favourites,
        loading,
        toggleFavourite,
        isFavourite,
        reloadFavourites: loadFavourites,
      }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}