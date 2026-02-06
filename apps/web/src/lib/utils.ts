import { createIsomorphicFn } from '@tanstack/react-start';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const logMessage = createIsomorphicFn()
	.server((...msgs: unknown[]) => console.log(`[SERVER]:`, ...msgs))
	.client((...msgs: unknown[]) => console.log(`[CLIENT]:`, ...msgs));

/**
 * Formats a date string to a human-readable relative time.
 * Returns "Never" for null/undefined values.
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
	if (!dateString) return 'Never';

	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
}
