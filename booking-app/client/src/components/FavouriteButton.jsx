// FavouriteButton.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";

import { useFavourites } from "../context/favourites.context.js";
import { savePendingAuthAction } from "../utils/pendingAuthAction.js";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function FavouriteButton({ studio }) {
  const navigate = useNavigate();

  const {
    toggleFavourite,
    isFavourite,
    loading,
  } = useFavourites();

  const [saving, setSaving] = useState(false);

  const studioId = studio?.id;
  const studioSlug = studio?.slug || studioId;

  const liked = studioId
    ? isFavourite(studioId)
    : false;

  const payload = useMemo(() => {
    if (!studio?.id) return null;

    return {
      id: studio.id,
      slug: studio.slug || studio.id,
      name: studio.name || "",
      city: studio.city || "",
      category: studio.category || "",
      coverUrl: studio.coverUrl || "",
      logoUrl: studio.logoUrl || "",
      priceFrom: studio.priceFrom ?? null,
      street: studio.street || "",
      building: studio.building || "",
      apartment: studio.apartment || "",
      phone: studio.phone || "",
      premium: Boolean(studio.premium),
      schedule: studio.schedule || {},
      scheduleExceptions: Array.isArray(
        studio.scheduleExceptions,
      )
        ? studio.scheduleExceptions
        : [],
    };
  }, [studio]);

  async function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!payload || saving || loading) return;

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Користувач не авторизований як клієнт
    if (!token || role !== "client") {
      savePendingAuthAction({
        type: "favourite",
        studioId,
        studioSlug,

        // Після входу користувач повернеться
        // на сторінку цієї студії
        returnTo: `/${studioSlug}`,
      });

      navigate("/login");
      return;
    }

    try {
      setSaving(true);

      const result = await toggleFavourite(payload);

      if (result?.success === false) {
        console.error(
          "Favourite action failed:",
          result.reason,
        );
      }
    } catch (error) {
      console.error(
        "Favourite action failed:",
        error,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving || loading}
      aria-pressed={liked}
      aria-label={
        liked
          ? "Видалити з улюблених"
          : "Додати в улюблені"
      }
      title={
        liked
          ? "Видалити з улюблених"
          : "Додати в улюблені"
      }
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:bg-rose-50 active:scale-90",
        (saving || loading) &&
          "cursor-wait opacity-60",
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-all duration-200",
          liked
            ? "scale-110 fill-rose-500 text-rose-500 drop-shadow-[0_2px_6px_rgba(244,63,94,0.4)]"
            : "text-stone-400 hover:text-rose-500",
        )}
      />
    </button>
  );
}