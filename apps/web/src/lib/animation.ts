export const EASE_OUT = [0.32, 0.72, 0, 1] as const;

export const EASE_IN_OUT = [0.45, 0, 0.55, 1] as const;

/** Fast acceleration → gentle settle; good for card enter transitions */
export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;

/** Smooth deceleration for hover swaps — fast entry, gradual settle */
export const EASE_OUT_SMOOTH = [0.22, 0.68, 0, 1] as const;
