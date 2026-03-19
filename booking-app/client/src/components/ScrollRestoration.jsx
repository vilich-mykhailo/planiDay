// ScrollRestoration.jsx
import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollRestoration() {
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    const shouldRestoreStudios =
      pathname === "/" &&
      sessionStorage.getItem("restore-studios-scroll") === "1";

    if (shouldRestoreStudios) {
      return;
    }

    window.scrollTo(0, 0);
  }, [pathname, location.search, location.state]);

  return null;
}