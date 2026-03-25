import { useMemo } from "react";
import { Heart } from "lucide-react";
import { useFavourites } from "../context/favourites.context";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function FavouriteButton({ studio }) {
  const { toggleFavourite, isFavourite } = useFavourites();

  const key = studio?.slug;
  const liked = isFavourite(key);

  const payload = useMemo(() => {
    if (!studio) return null;

    return {
      slug: studio.slug,
      name: studio.name,
      city: studio.city,
      category: studio.category,
      coverUrl: studio.coverUrl,
      priceFrom: studio.priceFrom,
    };
  }, [studio]);

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!payload) return;

    toggleFavourite(payload);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={liked ? "Видалити з улюблених" : "Додати в улюблені"}
      className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:bg-rose-50 active:scale-90"
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-all duration-200",
          liked
            ? "fill-rose-500 text-rose-500 scale-110 drop-shadow-[0_2px_6px_rgba(244,63,94,0.4)]"
            : "text-stone-400 hover:text-rose-500",
        )}
      />
    </button>
  );
}