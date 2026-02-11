import { useCallback, useEffect, useRef } from 'react';
import { useAnimate, useInView } from 'motion/react';
import { cn } from '@/lib/utils';
import { EASE_OUT, EASE_IN_OUT } from '@/lib/animation';

const ENV_LINES = [
	{
		key: 'DATABASE_URL',
		peekValue: 'postgresql://user:pass@db.io:5432/myapp',
		peekFile: '.env.local',
	},
	{
		key: 'API_SECRET',
		peekValue: 'sk_live_7f3a9b2c8d4e5f',
		peekFile: '.env.local',
	},
] as const;

const CODE_LINES = [
	{
		line: 1,
		tokens: [
			{ text: 'import', cls: 'text-purple-500' },
			{ text: ' { config }', cls: 'text-foreground/80' },
			{ text: ' from', cls: 'text-purple-500' },
			{ text: " 'dotenv'", cls: 'text-amber-500' },
		],
	},
	{ line: 2, tokens: [] },
	{
		line: 3,
		tokens: [
			{ text: 'const', cls: 'text-purple-500' },
			{ text: ' db', cls: 'text-foreground/80' },
			{ text: ' = ', cls: 'text-muted-foreground/60' },
			{ text: 'connect', cls: 'text-blue-500' },
			{ text: '(', cls: 'text-muted-foreground/60' },
		],
	},
	{
		line: 4,
		tokens: [
			{ text: '  process', cls: 'text-foreground/80' },
			{ text: '.', cls: 'text-muted-foreground/60' },
			{ text: 'env', cls: 'text-foreground/80' },
			{ text: '.', cls: 'text-muted-foreground/60' },
		],
		envIndex: 0,
	},
	{
		line: 5,
		tokens: [{ text: ')', cls: 'text-muted-foreground/60' }],
	},
	{ line: 6, tokens: [] },
	{
		line: 7,
		tokens: [
			{ text: 'const', cls: 'text-purple-500' },
			{ text: ' secret', cls: 'text-foreground/80' },
			{ text: ' = ', cls: 'text-muted-foreground/60' },
			{ text: 'process', cls: 'text-foreground/80' },
			{ text: '.', cls: 'text-muted-foreground/60' },
			{ text: 'env', cls: 'text-foreground/80' },
			{ text: '.', cls: 'text-muted-foreground/60' },
		],
		envIndex: 1,
	},
	{
		line: 8,
		tokens: [
			{ text: 'const', cls: 'text-purple-500' },
			{ text: ' port', cls: 'text-foreground/80' },
			{ text: ' = ', cls: 'text-muted-foreground/60' },
			{ text: '3000', cls: 'text-amber-500' },
		],
	},
] as const;

type AnimateFn = ReturnType<typeof useAnimate>[1];
type CancelledFn = () => boolean;

function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

async function runPeekSequence(animate: AnimateFn, cancelled: CancelledFn) {
	await animate('.cursor', { opacity: 0 }, { duration: 0 });
	await animate('.peek-tooltip-0', { opacity: 0, y: 4, scale: 0.98, filter: 'blur(4px)' }, { duration: 0 });
	await animate('.peek-tooltip-1', { opacity: 0, y: 4, scale: 0.98, filter: 'blur(4px)' }, { duration: 0 });
	await animate('.env-underline-0', { scaleX: 0 }, { duration: 0 });
	await animate('.env-underline-1', { scaleX: 0 }, { duration: 0 });
	await animate('.cursor-ring', { scale: 0, opacity: 0 }, { duration: 0 });

	if (cancelled()) return;

	await animate('.cursor', { opacity: 1 }, { duration: 0.28, ease: EASE_OUT });
	await sleep(500);
	if (cancelled()) return;

	while (!cancelled()) {
		for (let i = 0; i < ENV_LINES.length; i++) {
			if (cancelled()) return;

			const tooltip = `.peek-tooltip-${i}`;
			const underline = `.env-underline-${i}`;

			await animate('.cursor', { x: `var(--env-x-${i})`, y: `var(--env-y-${i})` }, { duration: 0.5, ease: EASE_IN_OUT });
			if (cancelled()) return;

			await sleep(150);
			if (cancelled()) return;

			await animate('.cursor', { scale: 0.97 }, { duration: 0.05 });
			await animate('.cursor-ring', { scale: 1, opacity: 0.4 }, { duration: 0.06 });
			await animate('.cursor', { scale: 1 }, { duration: 0.15, ease: EASE_OUT });
			await animate('.cursor-ring', { scale: 1.8, opacity: 0 }, { duration: 0.28, ease: EASE_OUT });
			if (cancelled()) return;

			await animate(underline, { scaleX: 1 }, { duration: 0.28, ease: EASE_OUT });
			await animate(tooltip, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }, { duration: 0.5, ease: EASE_OUT });
			if (cancelled()) return;

			await sleep(1800);
			if (cancelled()) return;

			await Promise.all([
				animate(tooltip, { opacity: 0, y: 4, scale: 0.98, filter: 'blur(4px)' }, { duration: 0.8, ease: EASE_OUT }),
				animate(underline, { scaleX: 0 }, { duration: 0.25, ease: EASE_OUT }),
			]);
			if (cancelled()) return;

			await sleep(600);
		}

		await sleep(800);
	}
}

const SneakPeekIllustration = () => {
	const [scope, animate] = useAnimate();
	const isInView = useInView(scope, { once: false, margin: '-80px' });
	const generationRef = useRef(0);

	const startAnimation = useCallback(async () => {
		const gen = ++generationRef.current;
		const cancelled = () => generationRef.current !== gen;

		if (!scope.current) return;

		const scopeEl = scope.current as HTMLElement;
		const envTargets = scopeEl.querySelectorAll('[data-env-target]') as NodeListOf<HTMLElement>;
		const scopeRect = scopeEl.getBoundingClientRect();

		envTargets.forEach((el: HTMLElement) => {
			const rect = el.getBoundingClientRect();
			const x = rect.left - scopeRect.left + rect.width / 2 - 8;
			const y = rect.top - scopeRect.top + rect.height / 2 - 25;
			const idx = el.dataset.envTarget;
			scopeEl.style.setProperty(`--env-x-${idx}`, `${x}px`);
			scopeEl.style.setProperty(`--env-y-${idx}`, `${y}px`);
		});

		await runPeekSequence(animate, cancelled);
	}, [animate, scope]);

	useEffect(() => {
		if (isInView) {
			startAnimation();
		} else {
			generationRef.current++;
		}
	}, [isInView, startAnimation]);

	return (
		<div className='flex flex-col flex-1 h-full border-r border-b border-muted rounded-br-2xl overflow-hidden'>
			<div
				ref={scope}
				className='relative ml-4 sm:ml-6 rounded-tl-lg border-l border-t overflow-hidden bg-card shadow-[inset_1px_1px_0_0_rgba(255,255,255,0.1),-4px_-4px_12px_-4px_rgba(255,255,255,0.08)] flex-1 flex flex-col'
				role='img'
				aria-label='Sneak peek feature: hover over environment variables in your code to see their values instantly'
			>
				<div className='flex items-center justify-between h-6 border-b border-border bg-muted/40 px-3'>
					<div className='flex items-center gap-[5px]'>
						<span className='size-[6px] rounded-full bg-muted-foreground/30' />
						<span className='size-[6px] rounded-full bg-muted-foreground/30' />
						<span className='size-[6px] rounded-full bg-muted-foreground/30' />
					</div>
					<span className='text-[9px] text-muted-foreground/40'>server.ts</span>
					<div className='w-10' />
				</div>

				<div className='p-3 pb-4 bg-background relative flex-1'>
					<div className='flex gap-3'>
						<div className='flex flex-col text-muted-foreground/20 select-none text-right shrink-0' style={{ width: 18 }}>
							{CODE_LINES.map((line) => (
								<span key={line.line} className='text-[11px] leading-[22px] font-mono text-muted-foreground/50'>
									{line.line}
								</span>
							))}
						</div>

						<div className='flex-1 min-w-0'>
							{CODE_LINES.map((line) => (
								<div key={line.line} className='h-[22px] flex items-center relative'>
									{line.tokens.map((token, i) => (
										<span key={i} className={cn('text-[11px] font-mono whitespace-pre leading-[22px]', token.cls)}>
											{token.text}
										</span>
									))}
									{'envIndex' in line && typeof line.envIndex === 'number' && (
										<EnvVariable
											envKey={ENV_LINES[line.envIndex].key}
											peekValue={ENV_LINES[line.envIndex].peekValue}
											peekFile={ENV_LINES[line.envIndex].peekFile}
											index={line.envIndex}
										/>
									)}
								</div>
							))}
						</div>
					</div>

					<div
						className='cursor pointer-events-none absolute left-0 top-0 z-30'
						style={{ opacity: 0 }}
						aria-hidden='true'
					>
						<div className='cursor-ring absolute -left-2.5 -top-2.5 size-6 rounded-full border-2 border-primary/60' />
						<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 28 28' className='drop-shadow-md'>
							<path fill='currentColor' d='M6 3.604c0-1.346 1.56-2.09 2.607-1.243l16.88 13.669c1.018.824.435 2.47-.875 2.47h-9.377a2.25 2.25 0 0 0-1.749.835l-4.962 6.134C7.682 26.51 6 25.915 6 24.576z' />
						</svg>
					</div>
				</div>
			</div>
		</div>
	);
};

function EnvVariable({ envKey, peekValue, peekFile, index }: { envKey: string; peekValue: string; peekFile: string; index: number }) {
	return (
		<span className='relative inline-flex items-center' data-env-target={index}>
			<span className={`env-target-${index} text-[11px] font-mono text-emerald-500 leading-[22px]`}>
				{envKey}
			</span>
			<span
				className={`env-underline-${index} absolute bottom-0.5 left-0 right-0 h-px bg-primary origin-left`}
				style={{ transform: 'scaleX(0)' }}
			/>
			<div
				className={`peek-tooltip-${index} absolute left-0 bottom-full mb-1 z-30 rounded-md border border-border bg-card shadow-sm overflow-hidden`}
				style={{ opacity: 0, minWidth: 200, filter: 'blur(4px)', transform: 'translateY(4px) scale(0.98)' }}
			>
				<div className='flex items-center gap-1.5 px-2.5 py-1 border-b border-border bg-muted/40 h-3 box-content'>
					<span className='text-[9px] text-muted-foreground/50 font-medium leading-[18px]'>{peekFile}</span>
				</div>
				<div className='px-2.5 py-1.5 flex items-baseline gap-0.5'>
					<span className='text-[10px] font-mono text-foreground/70 font-medium'>{peekValue}</span>
				</div>
			</div>
		</span>
	);
}

export default SneakPeekIllustration;
