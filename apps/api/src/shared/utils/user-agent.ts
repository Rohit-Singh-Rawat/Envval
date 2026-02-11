/**
 * Parses a raw user-agent string into a human-readable device description.
 * e.g. "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ... Chrome/120.0" → "Chrome on Windows"
 *
 * Falls back to "Unknown Device" for unrecognised or missing UA strings.
 */
export function parseDeviceName(ua: string | null | undefined): string {
	if (!ua) return 'Unknown Device';

	const browser = detectBrowser(ua);
	const os = detectOS(ua);

	if (browser && os) return `${browser} on ${os}`;
	if (browser) return browser;
	if (os) return os;

	return 'Unknown Device';
}

const BROWSER_PATTERNS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
	{ name: 'Edge', pattern: /Edg(?:e|A|iOS)?\/[\d.]+/ },
	{ name: 'Chrome', pattern: /(?:Chrome|CriOS)\/[\d.]+/ },
	{ name: 'Firefox', pattern: /(?:Firefox|FxiOS)\/[\d.]+/ },
	{ name: 'Safari', pattern: /Safari\/[\d.]+/ },
	{ name: 'Opera', pattern: /(?:OPR|Opera)\/[\d.]+/ },
	{ name: 'Samsung Internet', pattern: /SamsungBrowser\/[\d.]+/ },
];

function detectBrowser(ua: string): string | null {
	for (const { name, pattern } of BROWSER_PATTERNS) {
		if (pattern.test(ua)) return name;
	}
	return null;
}

const OS_PATTERNS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
	{ name: 'Windows', pattern: /Windows NT/ },
	{ name: 'macOS', pattern: /Macintosh|Mac OS X/ },
	{ name: 'Linux', pattern: /Linux(?!.*Android)/ },
	{ name: 'Android', pattern: /Android/ },
	{ name: 'iOS', pattern: /iPhone|iPad|iPod/ },
	{ name: 'Chrome OS', pattern: /CrOS/ },
];

function detectOS(ua: string): string | null {
	for (const { name, pattern } of OS_PATTERNS) {
		if (pattern.test(ua)) return name;
	}
	return null;
}

/**
 * Formats a Date into a human-readable email timestamp.
 * e.g. "February 14, 2026, 10:30 AM UTC"
 */
export function formatEmailTimestamp(date: Date): string {
	return date.toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
		timeZone: 'UTC',
		timeZoneName: 'short',
	});
}
