import { useEffect, useState } from "react";

const DEFAULT_DELAY_MS = 300;

/**
 * Returns a debounced value that updates after `delay` ms of no changes.
 * Useful for search inputs to avoid firing API on every keystroke.
 */
export function useDebounce<T>(
  value: T,
  delayMs: number = DEFAULT_DELAY_MS,
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
