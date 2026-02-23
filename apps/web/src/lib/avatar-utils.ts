const AVATAR_STORAGE_KEY = "envval-avatar-seed";

export const DEFAULT_AVATAR_COLORS = [
	"#FF6B6B",
	"#4ECDC4",
	"#45B7D1",
	"#96CEB4",
	"#FFEAA7",
	"#DDA0DD",
	"#98D8C8",
	"#F7DC6F",
	"#BB8FCE",
	"#85C1E9",
	"#F8B500",
	"#FF6F61",
	"#6B5B95",
	"#88B04B",
	"#F7CAC9",
] as const;

export type AvatarColor = (typeof DEFAULT_AVATAR_COLORS)[number];

/** djb2 hash — produces a stable 32-bit integer from any string. */
export function hashCode(input: string): number {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = (hash << 5) - hash + input.charCodeAt(i);
		hash = hash | 0;
	}
	return Math.abs(hash);
}

export function getDigit(number: number, position: number): number {
	return Math.floor((number / 10 ** position) % 10);
}

export function getUnit(number: number, range: number, index?: number): number {
	const value = number % range;
	if (index && getDigit(number, index) % 2 === 0) {
		return -value;
	}
	return value;
}

export function getColorFromPalette(
	number: number,
	colors: readonly string[],
): string {
	return colors[number % colors.length];
}

function isLocalStorageAvailable(): boolean {
	if (typeof window === "undefined") return false;
	try {
		const testKey = "__storage_test__";
		window.localStorage.setItem(testKey, testKey);
		window.localStorage.removeItem(testKey);
		return true;
	} catch {
		return false;
	}
}

export function getStoredAvatarSeed(): string | null {
	if (!isLocalStorageAvailable()) return null;
	return localStorage.getItem(AVATAR_STORAGE_KEY);
}

export function setStoredAvatarSeed(seed: string): void {
	if (!isLocalStorageAvailable()) return;
	localStorage.setItem(AVATAR_STORAGE_KEY, seed);
}

export function getOrCreateAvatarSeed(userId: string, email: string): string {
	const storedSeed = getStoredAvatarSeed();
	if (storedSeed) return storedSeed;

	const newSeed = `${userId}-${email}`;
	setStoredAvatarSeed(newSeed);
	return newSeed;
}
