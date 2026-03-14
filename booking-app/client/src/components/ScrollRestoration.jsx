import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollRestoration() {
  const location = useLocation();
  const { pathname, search, hash, key, state } = location;

  const storageKey = `scroll:${pathname}${search}${hash}`;

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // зберігаємо скрол поточної сторінки
  useEffect(() => {
    const saveScroll = () => {
      sessionStorage.setItem(storageKey, String(window.scrollY || 0));
    };

    saveScroll();

    window.addEventListener("scroll", saveScroll, { passive: true });
    window.addEventListener("beforeunload", saveScroll);

    return () => {
      saveScroll();
      window.removeEventListener("scroll", saveScroll);
      window.removeEventListener("beforeunload", saveScroll);
    };
  }, [storageKey]);

  // відновлюємо скрол після переходу
  useEffect(() => {
    const explicitRestore = state?.restoreScroll;
    const explicitY = Number(state?.scrollY ?? 0);

    const savedY = Number(sessionStorage.getItem(storageKey) ?? 0);

    const y =
      explicitRestore && Number.isFinite(explicitY) ? explicitY : savedY;

    const restore = () => {
      window.scrollTo(0, Number.isFinite(y) ? y : 0);
    };

    requestAnimationFrame(() => {
      restore();
      setTimeout(restore, 0);
      setTimeout(restore, 80);
      setTimeout(restore, 180);
    });
  }, [key, storageKey, state]);

  return null;
}