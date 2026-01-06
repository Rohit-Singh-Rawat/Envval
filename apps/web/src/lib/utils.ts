import { createIsomorphicFn } from '@tanstack/react-start';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
const GRADIENT_COLORS = [
	'#FF6B6B',
	'#4ECDC4',
	'#45B7D1',
	'#96CEB4',
	'#FFEAA7',
	'#DDA0DD',
	'#98D8C8',
	'#F7DC6F',
	'#BB8FCE',
	'#85C1E9',
	'#F8B500',
	'#FF6F61',
	'#6B5B95',
	'#88B04B',
	'#F7CAC9',
] as const;

const getRandomColor = () => GRADIENT_COLORS[Math.floor(Math.random() * GRADIENT_COLORS.length)];

export const generateRandomGradient = () => {
	const isRadial = Math.random() > 0.5;

	if (isRadial) {
		return `radial-gradient(circle, ${getRandomColor()}, ${getRandomColor()})`;
	}

	const angle = Math.floor(Math.random() * 360);
	return `linear-gradient(${angle}deg, ${getRandomColor()}, ${getRandomColor()})`;
};

export const logMessage = createIsomorphicFn()
	.server((...msgs: unknown[]) => console.log(`[SERVER]:`, ...msgs))
	.client((...msgs: unknown[]) => console.log(`[CLIENT]:`, ...msgs));
