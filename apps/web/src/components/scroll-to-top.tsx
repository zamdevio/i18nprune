import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Scrolls to top on in-app navigations that push/replace a new history entry.
 * Leaves browser back/forward (`POP`) scroll restoration to the user agent.
 */
export function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname, navigationType]);

  return null;
}
