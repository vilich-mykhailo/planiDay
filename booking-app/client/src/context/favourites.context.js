import { createContext, useContext } from "react";

export const FavouritesContext = createContext(null);

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites must be used within FavouritesProvider");
  return ctx;
}