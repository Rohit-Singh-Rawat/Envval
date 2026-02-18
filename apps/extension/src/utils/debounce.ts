export interface DebouncedFunction<T extends (...args: never[]) => void> {
  (...args: Parameters<T>): void;
  /** Cancels any pending invocation so it never fires. */
  cancel(): void;
}

/**
 * Creates a debounced wrapper that delays invoking `func` until `wait` ms
 * have elapsed since the last call. Exposes `.cancel()` for cleanup on dispose.
 */
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout | undefined;

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = undefined;
    }, wait);
  } as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return debounced;
}
