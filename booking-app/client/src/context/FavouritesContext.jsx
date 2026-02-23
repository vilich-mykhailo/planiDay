import { useEffect, useState } from "react";
import { FavouritesContext } from "./favourites.context";

export function FavouritesProvider({ children }) {
  const [favourites, setFavourites] = useState(() => {
    const stored = localStorage.getItem("favouriteStudios");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("favouriteStudios", JSON.stringify(favourites));
  }, [favourites]);

const toggleFavourite = (studio) => {
  setFavourites((prev) => {
    const exists = prev.some((s) => s.slug === studio.slug);
    return exists
      ? prev.filter((s) => s.slug !== studio.slug)
      : [...prev, studio];
  });
};

const isFavourite = (slug) => favourites.some((s) => s.slug === slug);

  return (
    <FavouritesContext.Provider value={{ favourites, toggleFavourite, isFavourite }}>
      {children}
    </FavouritesContext.Provider>
  );
}