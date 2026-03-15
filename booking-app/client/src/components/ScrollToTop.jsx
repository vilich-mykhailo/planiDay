// ScrollToTop.jsx
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const location = useLocation();

  useLayoutEffect(() => {
    if (location.state?.restoreScroll) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname, location.search, location.state]);

  return null;
}