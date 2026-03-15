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
    if (pathname !== "/") return;

    const skipOnce = sessionStorage.getItem("skip-home-scroll-once") === "1";

    if (skipOnce) {
      sessionStorage.removeItem("skip-home-scroll-once");
      return;
    }

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}