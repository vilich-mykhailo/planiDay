import { useState } from "react";

export default function FavouriteButton() {
  const [liked, setLiked] = useState(false);

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    setLiked((prev) => !prev);
  }

  return (
<button
  type="button"
  onClick={handleClick}
  className="
    flex items-center justify-center
    h-10 w-10
    rounded-full
    border border-gray-200
    bg-white
    overflow-hidden
    transition-all duration-200
    hover:bg-rose-50 hover:border-rose-200
    active:scale-95
    cursor-pointer
  "
>

      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 transition-all duration-200"
        fill={liked ? "#ef4444" : "none"}
        stroke={liked ? "#ef4444" : "#6b7280"}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20.5L4.8 13.3C2.9 11.4 2.9 8.3 4.8 6.4C6.7 4.5 9.8 4.5 11.7 6.4L12 6.7L12.3 6.4C14.2 4.5 17.3 4.5 19.2 6.4C21.1 8.3 21.1 11.4 19.2 13.3L12 20.5Z" />
      </svg>
    </button>
  );
}
