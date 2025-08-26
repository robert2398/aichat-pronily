import { useEffect, useState } from "react";

// A small router helper that supports both pathname (history API) and hash routes.
// - If the current URL pathname is not just `/`, it will be used as the route.
// - Otherwise hash (e.g. `#signin`) is used for backward compatibility.
function getCurrentRoute() {
  const p = location.pathname || "/";
  // If pathname is meaningful (not root), use it without leading slash
  if (p && p !== "/" && p !== "/index.html") {
    return decodeURI(p).replace(/^\//, "").replace(/\/$/, "");
  }
  // Fallback to hash route (no leading #)
  if (location.hash) return location.hash.replace(/^#\/?/, "");
  return "";
}

export function useHashRoute() {
  const [route, setRoute] = useState(getCurrentRoute());
  useEffect(() => {
    const onChange = () => setRoute(getCurrentRoute());
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, []);
  return route;
}

// Navigate helper: if route starts with `/` we'll use history.pushState so the URL becomes a real path.
// Otherwise we use hash navigation to preserve existing behavior.
export function navigate(route) {
  if (typeof route !== "string") return;
  if (route.startsWith("/")) {
    // push new path and notify listeners
    history.pushState({}, "", route);
    window.dispatchEvent(new PopStateEvent("popstate"));
    return;
  }
  // allow both with or without leading #
  if (route.startsWith("#")) location.hash = route;
  else location.hash = route;
}
