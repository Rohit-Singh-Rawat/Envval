import { createIsomorphicFn } from '@tanstack/react-start';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const logMessage = createIsomorphicFn()
	.server((...msgs: unknown[]) => console.log(`[SERVER]:`, ...msgs))
	.client((...msgs: unknown[]) => console.log(`[CLIENT]:`, ...msgs));
