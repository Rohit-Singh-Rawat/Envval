'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
	File01Icon,
	Search01Icon,
	GitBranchIcon,
	Bug01Icon,
	PuzzleIcon,
	RefreshIcon,
} from 'hugeicons-react';
import { cn } from '@/lib/utils';

// ── Animation constants ──────────────────────────────────────────────
export const EASE_OUT = [0.32, 0.72, 0, 1] as const;
export const ILLUSTRATION_HEIGHT = 240;

// ── Shared position utility used by all step animations ──────────────
export function getPos(scope: HTMLElement, el: HTMLElement | null) {
	if (!el) return { x: 100, y: 50 };
	const scopeRect = scope.getBoundingClientRect();
	const elRect = el.getBoundingClientRect();
	return {
		x: elRect.left - scopeRect.left + elRect.width / 2 - 8,
		y: elRect.top - scopeRect.top + elRect.height / 2 - 4,
	};
}

// ── Cursor SVG (shared across all steps) ─────────────────────────────
export function AnimatedCursor() {
	return (
		<div
			className='cursor pointer-events-none absolute left-0 top-0 z-30'
			style={{ opacity: 0 }}
			aria-hidden='true'
		>
			<div className='cursor-ring absolute -left-2.5 -top-2.5 size-6 rounded-full border-2 border-primary/60' />
			<svg
				xmlns='http://www.w3.org/2000/svg'
				width='16'
				height='16'
				viewBox='0 0 28 28'
				className='drop-shadow-md'
			>
				<path
					fill='currentColor'
					d='M6 3.604c0-1.346 1.56-2.09 2.607-1.243l16.88 13.669c1.018.824.435 2.47-.875 2.47h-9.377a2.25 2.25 0 0 0-1.749.835l-4.962 6.134C7.682 26.51 6 25.915 6 24.576z'
				/>
			</svg>
		</div>
	);
}

// ── macOS traffic lights ─────────────────────────────────────────────
export function TrafficLights() {
	return (
		<div className='absolute left-3 flex items-center gap-[5px]'>
			<span className='size-[7px] rounded-full bg-muted-foreground/40 group-hover:bg-[#ff5f57] transition-colors duration-200 ease-in-out' />
			<span className='size-[7px] rounded-full bg-muted-foreground/40 group-hover:bg-[#febc2e] transition-colors duration-200 ease-in-out' />
			<span className='size-[7px] rounded-full bg-muted-foreground/40 group-hover:bg-[#28c840] transition-colors duration-200 ease-in-out' />
		</div>
	);
}

// ── Replay animation button ──────────────────────────────────────────
export function ReplayButton({ onClick, visible }: { onClick: () => void; visible: boolean }) {
	return (
		<motion.button
			type='button'
			aria-label='Replay animation'
			onClick={onClick}
			initial={{ opacity: 0, scale: 0.8 }}
			animate={
				visible
					? { opacity: 1, scale: 1 }
					: { opacity: 0, scale: 0.8, pointerEvents: 'none' as const }
			}
			transition={{ duration: 0.2 }}
			className='absolute cursor-pointer right-2 top-1/2 bg-foreground/5 rounded-full -translate-y-1/2 flex p-1 items-center justify-center text-foreground hover:bg-foreground/10 group/replay-button'
		>
			<RefreshIcon
				size={10}
				strokeWidth={1}
				className='group-hover/replay-button:text-foreground group-hover/replay-button:rotate-180 transition-transform duration-200 ease-in-out'
			/>
		</motion.button>
	);
}

// ── VS Code activity bar icon ────────────────────────────────────────
const ACTIVITY_ICONS: Record<string, (cls: string) => ReactNode> = {
	files: (cls) => (
		<File01Icon
			size={16}
			className={cls}
			strokeWidth={1.5}
		/>
	),
	search: (cls) => (
		<Search01Icon
			size={16}
			className={cls}
			strokeWidth={1.5}
		/>
	),
	scm: (cls) => (
		<GitBranchIcon
			size={16}
			className={cls}
			strokeWidth={1.5}
		/>
	),
	debug: (cls) => (
		<Bug01Icon
			size={16}
			className={cls}
			strokeWidth={1.5}
		/>
	),
	extensions: (cls) => (
		<PuzzleIcon
			size={16}
			className={cls}
			strokeWidth={1.5}
		/>
	),
};

export function ActivityIcon({ icon, active }: { icon: string; active?: boolean }) {
	const cls = active ? 'text-foreground' : 'text-muted-foreground/50';
	return (
		<div
			className={cn(
				'flex size-5 p-1 items-center justify-center rounded-sm transition-colors cursor-pointer',
				active ? 'bg-accent text-foreground' : 'hover:bg-muted/50'
			)}
		>
			{ACTIVITY_ICONS[icon]?.(cls)}
		</div>
	);
}

// ── Envval brand icon ──────────────────────────────────────────────
export function EnvvalIcon({ size = 24 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox='0 0 72 72'
			fill='none'
			aria-hidden='true'
		>
			<path
				d='M14.9203 57.8036C14.4189 56.5302 14.5703 55.1363 12.8873 51.0794C9.57782 53.9703 9.12415 55.297 8.11404 56.2342C7.43125 56.8369 6.80758 56.7497 6.4309 56.3229C6.05421 55.8962 6.01391 55.2484 6.6967 54.6457C7.78715 53.7136 9.15893 53.4442 12.5106 50.6526C8.73213 48.3847 7.3613 48.38 6.12992 47.6903C5.35153 47.2385 5.25902 46.652 5.54915 46.1378C5.82021 45.6707 6.4167 45.4176 7.1951 45.8693C8.4546 46.6253 9.12168 47.8283 12.8008 50.1384C13.6616 45.9012 13.2596 44.5857 13.5908 43.1545C13.8065 42.2808 14.403 42.0276 14.9273 42.157C15.4987 42.3055 15.8563 42.7795 15.6406 43.6532C15.2813 45.0181 14.3325 46.0075 13.3391 50.301C17.6754 49.8291 18.8222 49.0295 20.2502 48.8926C21.1581 48.8201 21.596 49.2991 21.6413 49.8665C21.6866 50.4339 21.3161 50.9431 20.4083 51.0156C19.0325 51.0912 17.7629 50.4959 13.3844 50.8684C15.1858 54.8359 16.3269 55.6813 16.8895 57.0068C17.2412 57.8352 16.8988 58.4108 16.4018 58.6218C15.8715 58.8468 15.2388 58.6461 14.9203 57.8036Z'
				fill='currentColor'
			/>
			<path
				d='M62.152 41.696C59.752 51.776 52.936 56.96 42.472 56.96C29.8 56.96 20.008 48.032 20.008 32.48C20.008 16.928 29.608 8 41.608 8C53.512 8 62.728 16.352 62.728 31.424H24.808V32.48C24.808 46.976 31.432 55.04 42.472 55.04C43.816 55.04 45.064 54.944 46.312 54.752C53.512 53.792 57.928 49.568 59.944 41.696H62.152ZM41.608 9.92C31.528 9.92 25.672 16.832 24.904 29.504H58.024C57.736 16.832 51.784 9.92 41.608 9.92Z'
				fill='currentColor'
			/>
		</svg>
	);
}
