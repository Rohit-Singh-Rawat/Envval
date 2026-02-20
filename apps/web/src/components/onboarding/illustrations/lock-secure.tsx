'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, useAnimate } from 'motion/react';
import {
	File01Icon,
	Search01Icon,
	GitBranchIcon,
	Bug01Icon,
	PuzzleIcon,
	Tick01Icon,
	RefreshIcon,
	CommandIcon,
} from 'hugeicons-react';
import { cn } from '@/lib/utils';

const easeOut = [0.32, 0.72, 0, 1] as const;

const ENV_LINES = [
	{ key: 'DATABASE_URL', value: 'postgresql://user:pass@db.io', encrypted: 'a7f2•••e91b' },
	{ key: 'API_SECRET', value: 'sk_live_7f3a9b2c8d', encrypted: '3bc8•••d4a2' },
	{ key: 'JWT_SECRET', value: 'eyJhbGciOiJIUzI1NiJ9', encrypted: 'f91e•••7c3d' },
	{ key: 'STRIPE_KEY', value: 'pk_live_51HG8k2e', encrypted: '82d4•••1fa6' },
];

const PALETTE_ITEMS = ['Envval: Push', 'Envval: Pull', 'Envval: Compare'];

export function LockSecureIllustration() {
	const [scope, animate] = useAnimate();
	const [animationDone, setAnimationDone] = useState(false);

	const runAnimation = useCallback(async () => {
		setAnimationDone(false);
		await new Promise((r) => setTimeout(r, 100));

		const getPos = (el: HTMLElement | null) => {
			if (!el || !scope.current) return { x: 100, y: 50 };
			const scopeRect = scope.current.getBoundingClientRect();
			const elRect = el.getBoundingClientRect();
			return {
				x: elRect.left - scopeRect.left + elRect.width / 2 - 8,
				y: elRect.top - scopeRect.top + elRect.height / 2 - 4,
			};
		};

		const editorArea = getPos(scope.current?.querySelector('.editor-area') as HTMLElement);
		const pushItem = getPos(scope.current?.querySelector('.palette-push-item') as HTMLElement);
		const away = { x: pushItem.x + 140, y: pushItem.y + 80 };

		// Initial states
		await animate('.command-palette', { opacity: 0, y: -8, scale: 0.96 }, { duration: 0 });
		await animate('.palette-char', { opacity: 0 }, { duration: 0 });
		await animate('.palette-item', { opacity: 0, x: -4 }, { duration: 0 });
		await animate('.palette-highlight', { opacity: 0 }, { duration: 0 });
		await animate('.env-val-plain', { opacity: 1 }, { duration: 0 });
		await animate('.env-val-enc', { opacity: 0 }, { duration: 0 });
		await animate('.encrypting-indicator', { opacity: 0, y: 4 }, { duration: 0 });
		await animate('.toast-notification', { opacity: 0, y: 8, x: 8 }, { duration: 0 });
		await animate(
			'.cursor',
			{ x: editorArea.x, y: editorArea.y, opacity: 0, scale: 1 },
			{ duration: 0 }
		);
		await animate('.cursor-ring', { scale: 0, opacity: 0 }, { duration: 0 });
		await animate('.success-flash', { opacity: 0 }, { duration: 0 });
		await animate('.lock-check', { opacity: 0, scale: 0.5 }, { duration: 0 });

		// 1. Cursor appears in editor
		await animate('.cursor', { opacity: 1 }, { duration: 0.25 });
		await new Promise((r) => setTimeout(r, 400));

		// 2. Command palette opens
		await animate(
			'.command-palette',
			{ opacity: 1, y: 0, scale: 1 },
			{ duration: 0.2, ease: easeOut }
		);
		await new Promise((r) => setTimeout(r, 200));

		// 3. Type "> Envval: Push"
		await animate(
			'.palette-char',
			{ opacity: 1 },
			{ duration: 0.06, delay: (i: number) => i * 0.04, ease: easeOut }
		);
		await new Promise((r) => setTimeout(r, 200));

		// 4. Palette items appear
		await animate(
			'.palette-item',
			{ opacity: 1, x: 0 },
			{ duration: 0.25, ease: easeOut, delay: (i: number) => i * 0.04 }
		);
		await new Promise((r) => setTimeout(r, 200));

		// 5. Cursor moves to "Envval: Push"
		await animate('.cursor', { x: pushItem.x, y: pushItem.y }, { duration: 0.4, ease: easeOut });

		// 6. Highlight
		await animate('.palette-highlight', { opacity: 1 }, { duration: 0.1 });
		await new Promise((r) => setTimeout(r, 150));

		// 7. Click
		await animate('.cursor', { scale: 0.85 }, { duration: 0.06 });
		await animate('.cursor-ring', { scale: 1, opacity: 0.6 }, { duration: 0.08 });
		await animate('.cursor', { scale: 1 }, { duration: 0.1 });
		await animate('.cursor-ring', { scale: 1.6, opacity: 0 }, { duration: 0.25 });

		// 8. Palette closes
		await animate(
			'.command-palette',
			{ opacity: 0, y: -4, scale: 0.98 },
			{ duration: 0.15, ease: easeOut }
		);

		// 9. Cursor moves away
		await animate(
			'.cursor',
			{ x: away.x, y: away.y, opacity: 0 },
			{ duration: 0.4, ease: easeOut }
		);

		// 10. Show encrypting indicator
		await animate('.encrypting-indicator', { opacity: 1, y: 0 }, { duration: 0.2, ease: easeOut });

		// 11. Values encrypt one by one
		for (let i = 0; i < ENV_LINES.length; i++) {
			await new Promise((r) => setTimeout(r, 200));
			await Promise.all([
				animate(`.env-plain-${i}`, { opacity: 0 }, { duration: 0.15 }),
				animate(`.env-enc-${i}`, { opacity: 1 }, { duration: 0.2, ease: easeOut }),
				animate(`.lock-check-${i}`, { opacity: 1, scale: 1 }, { duration: 0.2, ease: easeOut }),
			]);
		}

		// 12. Hide encrypting indicator
		await animate('.encrypting-indicator', { opacity: 0, y: -4 }, { duration: 0.15 });

		// 13. Toast notification slides in
		await animate(
			'.toast-notification',
			{ opacity: 1, y: 0, x: 0 },
			{ duration: 0.3, ease: easeOut }
		);

		// 14. Success flash
		await animate('.success-flash', { opacity: [0, 0.4, 0] }, { duration: 0.5 });
		setAnimationDone(true);
	}, [animate]);

	useEffect(() => {
		runAnimation();
	}, [runAnimation]);

	return (
		<div className='relative w-full flex justify-center group'>
			<div
				ref={scope}
				className='relative w-full max-w-[560px]'
			>
				<div className='relative overflow-hidden rounded-md bg-[hsl(var(--card))] border border-border w-full'>
					{/* Title Bar */}
					<div className='relative flex h-6 items-center justify-center border-b border-border bg-muted/60 px-3'>
						<div className='absolute left-3 flex items-center gap-[5px]'>
							<span className='size-[7px] rounded-full bg-muted-foreground/40 group-hover:bg-[#ff5f57] transition-colors duration-200 ease-in-out' />
							<span className='size-[7px] rounded-full bg-muted-foreground/40 group-hover:bg-[#febc2e] transition-colors duration-200 ease-in-out' />
							<span className='size-[7px] rounded-full bg-muted-foreground/40 group-hover:bg-[#28c840] transition-colors duration-200 ease-in-out' />
						</div>

						<span className='text-[10px] text-muted-foreground/50 hidden sm:block'>
							.env — my-saas-app
						</span>

						<motion.button
							type='button'
							aria-label='Replay animation'
							onClick={runAnimation}
							initial={{ opacity: 0, scale: 0.8 }}
							animate={
								animationDone
									? { opacity: 1, scale: 1 }
									: { opacity: 0, scale: 0.8, pointerEvents: 'none' }
							}
							transition={{ duration: 0.2 }}
							className='absolute right-2 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center'
						>
							<RefreshIcon
								size={12}
								strokeWidth={2}
							/>
						</motion.button>
					</div>

					{/* Main Layout */}
					<div
						className='flex relative'
						style={{ height: 240 }}
					>
						{/* Activity Bar */}
						<div className='flex w-9 flex-col items-center gap-0.5 border-r border-border bg-muted/40 pt-2 pb-1'>
							<ActivityIcon
								icon='files'
								active
							/>
							<ActivityIcon icon='search' />
							<ActivityIcon icon='scm' />
							<ActivityIcon icon='debug' />
							<ActivityIcon icon='extensions' />
							<div className='flex-1' />
						</div>

						{/* Explorer Sidebar */}
						<div className='w-[100px] border-r border-border bg-muted/20 flex flex-col'>
							<div className='border-b border-border px-2 py-1'>
								<span className='text-[8px] font-semibold uppercase tracking text-muted-foreground/60'>
									Explorer
								</span>
							</div>
							<div className='px-1 pt-0.5 space-y-px'>
								<FileTreeItem
									name='my-saas-app'
									isFolder
									level={0}
									expanded
								/>
								<FileTreeItem
									name='src'
									isFolder
									level={1}
								/>
								<FileTreeItem
									name='package.json'
									level={1}
								/>
								<FileTreeItem
									name='.env'
									level={1}
									active
								/>
								<FileTreeItem
									name='.gitignore'
									level={1}
								/>
								<FileTreeItem
									name='tsconfig.json'
									level={1}
								/>
							</div>
						</div>

						{/* Editor Area */}
						<div className='editor-area flex-1 bg-background overflow-hidden flex flex-col relative'>
							{/* Tab Bar */}
							<div className='flex border-b border-border'>
								<div className='flex items-center gap-1.5 border-r border-border bg-background px-2.5 py-1'>
									<div className='size-2.5 rounded-sm bg-amber-400/60' />
									<span className='text-[9px] text-foreground'>.env</span>
								</div>
								<div className='flex items-center gap-1.5 px-2.5 py-1 bg-muted/30'>
									<div className='size-2.5 rounded-sm bg-blue-400/60' />
									<span className='text-[9px] text-muted-foreground/60'>index.ts</span>
								</div>
							</div>
							{/* Editor Content */}
							<div className='flex-1 p-2 font-mono text-[9px] leading-relaxed overflow-hidden'>
								<div className='flex gap-3'>
									{/* Line Numbers */}
									<div className='flex flex-col text-muted-foreground/30 select-none text-right w-4 shrink-0'>
										{ENV_LINES.map((_, i) => (
											<span key={i}>{i + 1}</span>
										))}
									</div>

									{/* Code Lines */}
									<div className='flex-1 space-y-0'>
										{ENV_LINES.map((line, i) => (
											<div
												key={line.key}
												className='flex items-center'
											>
												<span className='text-emerald-600 dark:text-emerald-400 shrink-0'>
													{line.key}
												</span>
												<span className='text-muted-foreground/60 shrink-0'>=</span>
												{/* Value container — relative so plain & encrypted stack */}
												<div className='relative min-w-0 flex-1'>
													<span
														className={`env-val-plain env-plain-${i} text-amber-600 dark:text-amber-400 block truncate`}
													>
														{line.value}
													</span>
													<span
														className={`env-val-enc env-enc-${i} text-muted-foreground/50 absolute inset-0 truncate`}
													>
														{line.encrypted}
													</span>
												</div>
												<span className={`lock-check lock-check-${i} ml-1 shrink-0`}>
													<Tick01Icon
														size={8}
														className='text-emerald-500'
														strokeWidth={2.5}
													/>
												</span>
											</div>
										))}
									</div>
								</div>
							</div>
							{/* Command Palette Overlay */}
							<div className='command-palette absolute top-0 left-1/2 -translate-x-1/2 w-[75%] mt-1 rounded-md border border-border bg-card shadow-xl overflow-hidden z-10'>
								<div className='flex items-center gap-1.5 border-b border-border px-2 py-1.5'>
									<CommandIcon
										size={10}
										className='text-muted-foreground/50 shrink-0'
										strokeWidth={2}
									/>
									<span className='text-[9px] text-foreground/80 flex'>
										{[
											'>',
											' ',
											'E',
											'n',
											'v',
											'V',
											'a',
											'u',
											'l',
											't',
											':',
											' ',
											'P',
											'u',
											's',
											'h',
										].map((char, i) => (
											<span
												key={i}
												className='palette-char'
												style={{ opacity: 0 }}
											>
												{char === ' ' ? '\u00A0' : char}
											</span>
										))}
									</span>
								</div>
								<div className='py-0.5'>
									{PALETTE_ITEMS.map((item, i) => (
										<div
											key={item}
											className={cn(
												'palette-item flex items-center gap-2 px-2 py-1 text-[9px] relative',
												i === 0 ? 'palette-push-item' : ''
											)}
										>
											{i === 0 && (
												<div className='palette-highlight absolute inset-x-0.5 inset-y-0 rounded-sm bg-accent' />
											)}
											<span
												className={cn(
													'relative z-10',
													i === 0 ? 'text-foreground' : 'text-muted-foreground'
												)}
											>
												{item}
											</span>
										</div>
									))}
								</div>
							</div>{' '}
							{/* Encrypting Indicator */}
							<div className='encrypting-indicator absolute bottom-2 right-2 flex items-center gap-1.5 rounded-md bg-card border border-border px-2.5 py-1.5 shadow-sm'>
								<motion.div
									className='size-2.5 rounded-full border-[1.5px] border-primary/30 border-t-primary'
									animate={{ rotate: 360 }}
									transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
								/>
								<span className='text-[8px] text-muted-foreground'>Encrypting variables...</span>
							</div>
							{/* Toast Notification */}
							<div className='toast-notification absolute bottom-2 right-2 flex items-center gap-1.5 rounded-md bg-card border border-border px-2 py-1.5 shadow-lg z-10'>
								<span className='flex size-3.5 items-center justify-center rounded-full bg-emerald-500/15'>
									<Tick01Icon
										size={8}
										className='text-emerald-500'
										strokeWidth={2.5}
									/>
								</span>
								<span className='text-[8px] font-medium text-foreground'>Pushed 4 variables</span>
							</div>
						</div>
					</div>
				</div>

				{/* Cursor */}
				<div
					className='cursor pointer-events-none absolute left-0 top-0 z-30'
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
			</div>
		</div>
	);
}

// ── Sub-components ──────────────────────────────────

function ActivityIcon({ icon, active }: { icon: string; active?: boolean }) {
	const iconCls = active ? 'text-foreground' : 'text-muted-foreground/50';
	const iconMap: Record<string, React.ReactNode> = {
		files: (
			<File01Icon
				size={16}
				className={iconCls}
				strokeWidth={1.5}
			/>
		),
		search: (
			<Search01Icon
				size={16}
				className={iconCls}
				strokeWidth={1.5}
			/>
		),
		scm: (
			<GitBranchIcon
				size={16}
				className={iconCls}
				strokeWidth={1.5}
			/>
		),
		debug: (
			<Bug01Icon
				size={16}
				className={iconCls}
				strokeWidth={1.5}
			/>
		),
		extensions: (
			<PuzzleIcon
				size={16}
				className={iconCls}
				strokeWidth={1.5}
			/>
		),
	};

	return (
		<div
			className={cn(
				'flex size-5 p-1 items-center justify-center rounded-sm transition-colors cursor-pointer',
				active ? 'bg-accent text-foreground' : 'hover:bg-muted/50'
			)}
		>
			{iconMap[icon]}
		</div>
	);
}

function FileTreeItem({
	name,
	isFolder,
	level = 0,
	active,
	expanded,
}: {
	name: string;
	isFolder?: boolean;
	level?: number;
	active?: boolean;
	expanded?: boolean;
}) {
	return (
		<div
			className={cn(
				'flex items-center gap-1 rounded-sm px-1 py-[1px] text-[8px] cursor-pointer transition-colors',
				active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50'
			)}
			style={{ paddingLeft: `${4 + level * 8}px` }}
		>
			{isFolder && (
				<svg
					width='6'
					height='6'
					viewBox='0 0 6 6'
					fill='none'
					className={cn('shrink-0', expanded ? 'rotate-90' : '')}
				>
					<path
						d='M2 1L4.5 3L2 5'
						stroke='currentColor'
						strokeWidth='1'
						strokeLinecap='round'
						strokeLinejoin='round'
					/>
				</svg>
			)}
			{!isFolder && <span className='w-[6px]' />}
			<span className='truncate'>{name}</span>
		</div>
	);
}
