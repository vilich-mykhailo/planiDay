const PENDING_AUTH_ACTION_KEY = "aveliio:pending-auth-action";

export function savePendingAuthAction(action) {
  try {
    sessionStorage.setItem(
      PENDING_AUTH_ACTION_KEY,
      JSON.stringify({
        ...action,
        createdAt: Date.now(),
      }),
    );
  } catch (error) {
    console.error("Save pending auth action failed:", error);
  }
}

export function readPendingAuthAction() {
  try {
    const raw = sessionStorage.getItem(PENDING_AUTH_ACTION_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Незавершена дія зберігається максимум 30 хвилин
    if (
      !parsed?.createdAt ||
      Date.now() - parsed.createdAt > 30 * 60 * 1000
    ) {
      sessionStorage.removeItem(PENDING_AUTH_ACTION_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingAuthAction() {
  sessionStorage.removeItem(PENDING_AUTH_ACTION_KEY);
}

export function continuePendingAuthAction(navigate) {
  const action = readPendingAuthAction();

  if (!action) {
    navigate("/");
    return;
  }

  clearPendingAuthAction();

  const returnTo = action.returnTo || "/";

  if (action.type === "booking") {
    navigate(returnTo, {
      replace: true,
      state: {
        openBooking: true,
        preselectedService: action.serviceId
          ? {
              serviceId: action.serviceId,
            }
          : null,
      },
    });

    return;
  }

  if (action.type === "favourite") {
    navigate(returnTo, {
      replace: true,
      state: {
        continueFavouriteStudioId: action.studioId,
      },
    });

    return;
  }

  navigate(returnTo, {
    replace: true,
  });
}