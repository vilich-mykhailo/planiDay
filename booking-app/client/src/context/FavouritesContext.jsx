// FavouritesContext.jsx
import { useCallback, useEffect, useState } from "react";
import { FavouritesContext } from "./favourites.context.js";

const API_URL = import.meta.env.VITE_API_URL;

function getStudioId(item) {
  return String(
    item?.studioId ??
      item?.studio?.id ??
      item?.id ??
      "",
  );
}

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
      : {
          "Content-Type": "application/json",
        };
  }, []);

  const loadFavourites = useCallback(async () => {
    setLoading(true);

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
        throw new Error(
          data?.message || "Load favourites failed",
        );
      }

      setFavourites(
        Array.isArray(data?.favourites)
          ? data.favourites
          : [],
      );
    } catch (error) {
      console.error("Load favourites failed:", error);
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
        return {
          success: false,
          reason: "AUTH_REQUIRED",
        };
      }

      const studioId = String(studio?.id || "");

      if (!studioId) {
        console.error("Favourite studio ID is missing");

        return {
          success: false,
          reason: "STUDIO_ID_MISSING",
        };
      }

      const exists = favourites.some(
        (item) => getStudioId(item) === studioId,
      );

      try {
        if (exists) {
          const res = await fetch(
            `${API_URL}/client/favourites/${studioId}`,
            {
              method: "DELETE",
              headers: getAuthHeaders(),
            },
          );

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            throw new Error(
              data?.message || "Remove favourite failed",
            );
          }

          setFavourites((prev) =>
            prev.filter(
              (item) => getStudioId(item) !== studioId,
            ),
          );

          return {
            success: true,
            added: false,
          };
        }

        const res = await fetch(
          `${API_URL}/client/favourites/${studioId}`,
          {
            method: "POST",
            headers: getAuthHeaders(),
          },
        );

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            data?.message || "Add favourite failed",
          );
        }

        setFavourites((prev) => {
          const alreadyExists = prev.some(
            (item) => getStudioId(item) === studioId,
          );

          if (alreadyExists) return prev;

          return [studio, ...prev];
        });

        return {
          success: true,
          added: true,
        };
      } catch (error) {
        console.error("Toggle favourite failed:", error);

        return {
          success: false,
          reason: "REQUEST_FAILED",
          error,
        };
      }
    },
    [favourites, getAuthHeaders],
  );

  const isFavourite = useCallback(
    (studioId) => {
      const normalizedStudioId = String(studioId || "");

      if (!normalizedStudioId) return false;

      return favourites.some(
        (item) =>
          getStudioId(item) === normalizedStudioId,
      );
    },
    [favourites],
  );

  useEffect(() => {
    function handleAuthChanged() {
      loadFavourites();
    }

    loadFavourites();

    window.addEventListener(
      "auth-changed",
      handleAuthChanged,
    );

    return () => {
      window.removeEventListener(
        "auth-changed",
        handleAuthChanged,
      );
    };
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