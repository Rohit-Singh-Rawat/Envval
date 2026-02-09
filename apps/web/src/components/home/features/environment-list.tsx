'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAnimate, useInView } from 'motion/react';

const EASE_OUT = [0.32, 0.72, 0, 1] as const;

const ENVIRONMENTS = [
	{
		name: 'Production',
		branch: 'main',
		vars: 12,
		status: 'synced' as const,
		statusColor: 'bg-emerald-500',
	},
	{
		name: 'Staging',
		branch: 'develop',
		vars: 10,
		status: 'synced' as const,
		statusColor: 'bg-emerald-500',
	},
	{
		name: 'Development',
		branch: 'feature/auth',
		vars: 14,
		status: 'pending' as const,
		statusColor: 'bg-amber-500',
	},
	{
		name: 'Preview',
		branch: 'pr-42',
		vars: 8,
		status: 'synced' as const,
		statusColor: 'bg-emerald-500',
	},
] as const;

type AnimateFn = ReturnType<typeof useAnimate>[1];
type CancelledFn = () => boolean;

function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

/**
 * Orchestrates a staggered reveal of environment rows followed by
 * a highlight sweep that draws attention to the pending environment.
 * Uses useAnimate for precise imperative timeline control.
 */
async function runListSequence(
	animate: AnimateFn,
	cancelled: CancelledFn
) {
	// Reset all rows
	for (let i = 0; i < ENVIRONMENTS.length; i++) {
		await animate(
			`[data-env-row="${i}"]`,
			{ opacity: 0, x: -8, filter: 'blur(4px)' },
			{ duration: 0 }
		);
	}
	await animate('[data-env-highlight]', { opacity: 0 }, { duration: 0 });

	await sleep(300);
	if (cancelled()) return;

	// Stagger-reveal rows (Emil: polish-stagger-children, 50ms between)
	for (let i = 0; i < ENVIRONMENTS.length; i++) {
		if (cancelled()) return;
		await animate(
			`[data-env-row="${i}"]`,
			{ opacity: 1, x: 0, filter: 'blur(0px)' },
			{ duration: 0.28, ease: EASE_OUT }
		);
		// 50ms stagger gap between rows
		await sleep(50);
	}
	if (cancelled()) return;

	await sleep(800);
	if (cancelled()) return;

	// Highlight the "pending" row to draw attention
	const pendingIndex = ENVIRONMENTS.findIndex((e) => e.status === 'pending');
	if (pendingIndex >= 0) {
		await animate(
			'[data-env-highlight]',
			{ opacity: 1 },
			{ duration: 0.3, ease: EASE_OUT }
		);
		await sleep(1500);
		if (cancelled()) return;

		await animate(
			'[data-env-highlight]',
			{ opacity: 0 },
			{ duration: 0.3, ease: EASE_OUT }
		);
	}

	await sleep(2000);
}

function EnvironmentRow({
	env,
	index,
}: {
	env: (typeof ENVIRONMENTS)[number];
	index: number;
}) {
	const isPending = env.status === 'pending';

	return (
		<div
			data-env-row={index}
			className='relative flex items-center justify-between px-2.5 py-1.5 group/row'
			style={{ opacity: 0 }}
		>
			{isPending && (
				<div
					data-env-highlight
					className='absolute inset-0 bg-amber-500/5 rounded-md'
					style={{ opacity: 0 }}
				/>
			)}

			<div className='flex items-center gap-2 min-w-0'>
				<span className={`size-1.5 rounded-full ${env.statusColor} shrink-0`} />
				<div className='flex flex-col min-w-0'>
					<span className='text-[10px] font-medium text-foreground/80 leading-tight'>
						{env.name}
					</span>
					<span className='text-[8px] text-muted-foreground/40 font-mono leading-tight truncate'>
						{env.branch}
					</span>
				</div>
			</div>

			<div className='flex items-center gap-2'>
				<span className='text-[8px] text-muted-foreground/50 tabular-nums'>
					{env.vars} vars
				</span>
				<span
					className={`text-[7px] px-1.5 py-0.5 rounded-full font-medium ${
						isPending
							? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
							: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
					}`}
				>
					{env.status}
				</span>
			</div>
		</div>
	);
}

const EnvironmentListIllustration = () => {
	const [scope, animate] = useAnimate<HTMLDivElement>();
	const isInView = useInView(scope, { once: false, margin: '-80px' });
	const generationRef = useRef(0);

	const startAnimation = useCallback(async () => {
		const gen = ++generationRef.current;
		const cancelled = () => generationRef.current !== gen;

		while (!cancelled()) {
			await runListSequence(animate, cancelled);
		}
	}, [animate]);

	useEffect(() => {
		if (isInView) {
			startAnimation();
		} else {
			generationRef.current++;
		}
	}, [isInView, startAnimation]);

	return (
		<div
			ref={scope}
			className='relative mx-3 mb-3 rounded-lg border border-border overflow-hidden bg-card'
			role='img'
			aria-label='Environment list: view all environments and their sync status in one place'
		>
			{/* Header bar */}
			<div className='flex items-center justify-between h-5 border-b border-border bg-muted/40 px-2.5'>
				<span className='text-[8px] text-muted-foreground/50 font-medium'>Environments</span>
				<span className='text-[7px] text-muted-foreground/30 tabular-nums'>
					{ENVIRONMENTS.length} total
				</span>
			</div>

			{/* Environment rows */}
			<div className='p-1.5 bg-background divide-y divide-border/50'>
				{ENVIRONMENTS.map((env, i) => (
					<EnvironmentRow key={env.name} env={env} index={i} />
				))}
			</div>

			{/* Footer */}
			<div className='flex items-center justify-between h-5 border-t border-border bg-muted/40 px-2.5'>
				<span className='text-[7px] text-muted-foreground/40'>3 synced</span>
				<span className='text-[7px] text-amber-500/60'>1 pending</span>
			</div>
		</div>
	);
};

export default EnvironmentListIllustration;
