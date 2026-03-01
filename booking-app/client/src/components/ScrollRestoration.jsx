import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollRestoration() {
  const { key, pathname, search, hash } = useLocation();

  const storageKey = `scroll:${pathname}${search}${hash}`;

  // один раз: вимикаємо native restoration
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // restore on route change
  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey);
    const y = raw ? Number(raw) : 0;

    requestAnimationFrame(() => {
      window.scrollTo({
        top: Number.isFinite(y) ? y : 0,
        left: 0,
        behavior: "auto",
      });
    });
  }, [key, storageKey]);

  // save on scroll (rebind on route change)
  useEffect(() => {
    const onScroll = () => {
      sessionStorage.setItem(storageKey, String(window.scrollY || 0));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [key, storageKey]);

  return null;
}