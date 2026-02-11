/** Shared animation easing curves based on Emil Kowalski's guidelines */

/** Default ease-out for UI transitions (custom cubic-bezier over built-in CSS) */
export const EASE_OUT = [0.32, 0.72, 0, 1] as const;

/** Ease-in-out for on-screen movement (cursor travel, repositioning) */
export const EASE_IN_OUT = [0.45, 0, 0.55, 1] as const;

/** Smooth deceleration for hover swaps — fast entry, gentle settle */
export const EASE_OUT_SMOOTH = [0.22, 0.68, 0, 1] as const;
