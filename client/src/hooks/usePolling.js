import { useEffect, useRef } from "react";

// Calls `fn` right away and then every `intervalMs`.
// Pauses while the browser tab is hidden so we don't hit the API for nothing.
export default function usePolling(fn, intervalMs = 5000, deps = []) {
  const saved = useRef(fn);
  saved.current = fn;

  useEffect(() => {
    saved.current();
    const timer = setInterval(() => {
      if (!document.hidden) saved.current();
    }, intervalMs);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);
}
