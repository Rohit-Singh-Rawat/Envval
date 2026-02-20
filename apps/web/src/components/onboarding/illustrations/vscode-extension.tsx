'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { motion, useAnimate } from 'motion/react';
import {
	File01Icon,
	Search01Icon,
	GitBranchIcon,
	Bug01Icon,
	PuzzleIcon,
	Tick01Icon,
	StarIcon,
	Settings02Icon,
	RefreshIcon,
	Download01Icon,
} from 'hugeicons-react';
import { cn } from '@/lib/utils';

const easeOut = [0.32, 0.72, 0, 1] as const;

export function VSCodeExtensionIllustration() {
	const [scope, animate] = useAnimate();
	const [animationDone, setAnimationDone] = useState(false);
	const maskId = useId();

	const runAnimation = useCallback(async () => {
		setAnimationDone(false);
		await new Promise((r) => setTimeout(r, 100));
		const getPos = (el: HTMLElement | null) => {
			if (!el || !scope.current) return { x: 100, y: 50 };
			const scopeRect = scope.current.getBoundingClientRect();
			const elRect = el.getBoundingClientRect();
			const centerX = elRect.left - scopeRect.left + elRect.width / 2;
			const centerY = elRect.top - scopeRect.top + elRect.height / 2;
			return {
				x: centerX - 8,
				y: centerY - 4,
			};
		};

		const search = getPos(scope.current?.querySelector('.search-input-container') as HTMLElement);
		const envvalItem = getPos(scope.current?.querySelector('.envval-list-item') as HTMLElement);
		const installBtn = getPos(scope.current?.querySelector('.install-btn') as HTMLElement);
		const away = { x: installBtn.x + 120, y: installBtn.y + 50 };

		// Initial states
		await animate('.search-char', { opacity: 0 }, { duration: 0 });
		await animate('.extension-item', { opacity: 0, x: -6 }, { duration: 0 });
		await animate('.detail-panel', { opacity: 0 }, { duration: 0 });
		await animate('.detail-panel-placeholder', { opacity: 0.25 }, { duration: 0 });
		await animate('.cursor', { x: search.x, y: search.y, opacity: 0, scale: 1 }, { duration: 0 });
		await animate('.cursor-ring', { scale: 0, opacity: 0 }, { duration: 0 });
		await animate('.install-btn', { backgroundColor: 'var(--primary)' }, { duration: 0 });
		await animate('.btn-text-install', { opacity: 1 }, { duration: 0 });
		await animate('.btn-text-installing', { opacity: 0 }, { duration: 0 });
		await animate('.btn-text-installed', { opacity: 0 }, { duration: 0 });
		await animate('.success-flash', { opacity: 0 }, { duration: 0 });

		// 1. Cursor appears at search bar
		await animate('.cursor', { opacity: 1 }, { duration: 0.25 });
		await new Promise((r) => setTimeout(r, 200));

		// 2. Type "envval" in search bar
		await animate(
			'.search-char',
			{ opacity: 1 },
			{ duration: 0.08, delay: (i: number) => i * 0.06, ease: easeOut }
		);
		await new Promise((r) => setTimeout(r, 300));

		// 3. Envval extension items appear
		await animate(
			'.extension-item',
			{ opacity: 1, x: 0 },
			{ duration: 0.35, ease: easeOut, delay: (i: number) => i * 0.06 }
		);
		await new Promise((r) => setTimeout(r, 400));

		// 4. Cursor moves to Envval list item, clicks
		await animate(
			'.cursor',
			{ x: envvalItem.x, y: envvalItem.y },
			{ duration: 0.45, ease: easeOut }
		);
		await animate('.cursor', { scale: 0.85 }, { duration: 0.06 });
		await animate('.cursor-ring', { scale: 1, opacity: 0.6 }, { duration: 0.08 });
		await animate('.envval-list-item', { scale: 0.98 }, { duration: 0.06 });
		await animate('.cursor', { scale: 1 }, { duration: 0.1 });
		await animate('.cursor-ring', { scale: 1.6, opacity: 0 }, { duration: 0.25 });
		await animate('.envval-list-item', { scale: 1 }, { duration: 0.1 });

		// 5. Detail panel opens, placeholder fades out
		await Promise.all([
			animate('.detail-panel', { opacity: 1 }, { duration: 0.35, ease: easeOut }),
			animate('.detail-panel-placeholder', { opacity: 0 }, { duration: 0.3, ease: easeOut }),
		]);
		await new Promise((r) => setTimeout(r, 300));

		// 6. Cursor moves to Install button
		await animate(
			'.cursor',
			{ x: installBtn.x, y: installBtn.y },
			{ duration: 0.5, ease: easeOut }
		);

		// 7. Hover & click Install
		await animate('.install-btn', { scale: 1.04 }, { duration: 0.1 });
		await animate('.cursor', { scale: 0.85 }, { duration: 0.06 });
		await animate('.cursor-ring', { scale: 1, opacity: 0.6 }, { duration: 0.08 });
		await animate('.install-btn', { scale: 0.96 }, { duration: 0.06 });
		await animate('.cursor', { scale: 1 }, { duration: 0.1 });
		await animate('.cursor-ring', { scale: 1.8, opacity: 0 }, { duration: 0.25 });
		await animate('.install-btn', { scale: 1 }, { duration: 0.12 });

		// 8. Installing state
		await animate('.btn-text-install', { opacity: 0 }, { duration: 0.08 });
		await animate('.btn-text-installing', { opacity: 1 }, { duration: 0.12 });

		// 9. Cursor moves away and fades
		await animate(
			'.cursor',
			{ x: away.x, y: away.y, opacity: 0 },
			{ duration: 0.45, ease: easeOut }
		);

		// 10. Wait for install
		await new Promise((r) => setTimeout(r, 1100));

		// 11. Installed state
		await animate('.btn-text-installing', { opacity: 0 }, { duration: 0.08 });
		await animate('.install-btn', { backgroundColor: '#16a34a' }, { duration: 0.2 });
		await animate('.btn-text-installed', { opacity: 1, scale: [0.85, 1] }, { duration: 0.22 });

		// 12. Success flash
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
				{/* IDE Window Container */}
				<div className='relative overflow-hidden rounded-md bg-[hsl(var(--card))] border border-border w-full'>
					{/* ===== Title Bar ===== */}
					<div className='relative flex h-6 items-center justify-center border-b border-border bg-muted/60 px-3'>
						{/* Traffic lights */}
						<div className='absolute left-3 flex items-center gap-[5px]'>
							<span className='size-[7px] rounded-full bg-muted-foreground/40 group-hover:bg-[#ff5f57] transition-colors duration-200 ease-in-out' />
							<span className='size-[7px] rounded-full bg-muted-foreground/40 group-hover:bg-[#febc2e] transition-colors duration-200 ease-in-out' />
							<span className='size-[7px] rounded-full bg-muted-foreground/40 group-hover:bg-[#28c840] transition-colors duration-200 ease-in-out' />
						</div>

						{/* Window title */}
						<span className='text-[10px] text-muted-foreground/50 hidden sm:block'>
							Envval — Visual Studio Code
						</span>

						{/* Redo animation button */}
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
							className='absolute right-2 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center '
						>
							<RefreshIcon
								size={12}
								strokeWidth={2}
							/>
						</motion.button>
					</div>

					{/* ===== Main Layout ===== */}
					<div
						className='flex'
						style={{ height: 240 }}
					>
						{/* Activity Bar */}
						<div className='flex w-9 flex-col items-center gap-0.5 border-r border-border bg-muted/40 pt-2 pb-1'>
							<ActivityIcon icon='files' />
							<ActivityIcon icon='search' />
							<ActivityIcon icon='scm' />
							<ActivityIcon icon='debug' />
							<ActivityIcon
								icon='extensions'
								active
							/>
							<div className='flex-1' />
						</div>

						{/* Sidebar — Extension List */}
						<div className='w-[100px] border-r border-border bg-muted/20 flex flex-col'>
							{/* Search input */}
							<div className='search-input-container border-b border-border p-1'>
								<div className='flex items-center gap-1.5 rounded-sm border border-border bg-background px-2 py-[3px]'>
									<Search01Icon
										size={10}
										className='text-muted-foreground/50 shrink-0'
										strokeWidth={2}
									/>
									<span className='search-typed-text text-[10px] text-foreground/80 truncate flex min-w-0'>
										{['e', 'n', 'v', 'v', 'a', 'u', 'l', 't'].map((char, i) => (
											<span
												key={i}
												className='search-char'
												style={{ opacity: 0 }}
											>
												{char}
											</span>
										))}
									</span>
								</div>
							</div>

							{/* List header */}
							<div className='px-2 h-fit py-0'>
								<span className='text-[8px] font-semibold uppercase tracking text-muted-foreground/60'>
									Marketplace
								</span>
							</div>

							{/* Extension items */}
							<div className='px-1 space-y-0.5 flex-1 overflow-hidden'>
								<ExtensionListItem
									name='Envval'
									publisher='Envval'
									downloads='156k'
									active
									className='envval-list-item'
								/>
								<ExtensionListItem
									name='.ENV'
									publisher='mikestead'
									downloads='12M'
								/>
								<ExtensionListItem
									name='Env Switcher'
									publisher='edonet'
									downloads='34k'
								/>
							</div>
						</div>

						{/* Detail Panel */}
						<div className='detail-panel-area flex-1 relative bg-background overflow-hidden'>
							{/* Faded VS Code placeholder until detail panel is visible */}
							<div className='detail-panel-placeholder absolute inset-0 flex items-center justify-center pointer-events-none'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									width='48'
									height='48'
									viewBox='0 0 100 100'
									fill='none'
									className='opacity-25'
								>
									<mask
										id={maskId}
										maskUnits='userSpaceOnUse'
										x='0'
										y='0'
										width='100'
										height='100'
									>
										<path
											fillRule='evenodd'
											clipRule='evenodd'
											d='M70.9119 99.3171C72.4869 99.9307 74.2828 99.8914 75.8725 99.1264L96.4608 89.2197C98.6242 88.1787 100 85.9892 100 83.5872V16.4133C100 14.0113 98.6243 11.8218 96.4609 10.7808L75.8725 0.873756C73.7862 -0.130129 71.3446 0.11576 69.5135 1.44695C69.252 1.63711 69.0028 1.84943 68.769 2.08341L29.3551 38.0415L12.1872 25.0096C10.589 23.7965 8.35363 23.8959 6.86933 25.2461L1.36303 30.2549C-0.452552 31.9064 -0.454633 34.7627 1.35853 36.417L16.2471 50.0001L1.35853 63.5832C-0.454633 65.2374 -0.452552 68.0938 1.36303 69.7453L6.86933 74.7541C8.35363 76.1043 10.589 76.2037 12.1872 74.9905L29.3551 61.9587L68.769 97.9167C69.3925 98.5406 70.1246 99.0104 70.9119 99.3171ZM75.0152 27.2989L45.1091 50.0001L75.0152 72.7012V27.2989Z'
											fill='white'
										/>
									</mask>
									<g mask={`url(#${maskId})`}>
										<path
											d='M96.4614 10.7962L75.8569 0.875542C73.4719 -0.272773 70.6217 0.211611 68.75 2.08333L1.29858 63.5832C-0.515693 65.2373 -0.513607 68.0937 1.30308 69.7452L6.81272 74.754C8.29793 76.1042 10.5347 76.2036 12.1338 74.9905L93.3609 13.3699C96.086 11.3026 100 13.2462 100 16.6667V16.4275C100 14.0265 98.6246 11.8378 96.4614 10.7962Z'
											fill='#0065A9'
										/>
										<path
											d='M96.4614 89.2038L75.8569 99.1245C73.4719 100.273 70.6217 99.7884 68.75 97.9167L1.29858 36.4169C-0.515693 34.7627 -0.513607 31.9063 1.30308 30.2548L6.81272 25.246C8.29793 23.8958 10.5347 23.7964 12.1338 25.0095L93.3609 86.6301C96.086 88.6974 100 86.7538 100 83.3334V83.5726C100 85.9735 98.6246 88.1622 96.4614 89.2038Z'
											fill='#007ACC'
										/>
										<path
											d='M75.8578 99.1263C73.4721 100.274 70.6219 99.7885 68.75 97.9166C71.0564 100.223 75 98.5895 75 95.3278V4.67213C75 1.41039 71.0564 -0.223106 68.75 2.08329C70.6219 0.211402 73.4721 -0.273666 75.8578 0.873633L96.4587 10.7807C98.6234 11.8217 100 14.0112 100 16.4132V83.5871C100 85.9891 98.6234 88.1786 96.4586 89.2196L75.8578 99.1263Z'
											fill='#1F9CF0'
										/>
									</g>
								</svg>
							</div>
							<div className='detail-panel flex-1 bg-background overflow-hidden flex flex-col relative'>
								{/* Extension Header */}
								<div className='flex items-start gap-2 border-b border-border p-2 py-3'>
									{/* Icon */}
									<div className='relative shrink-0'>
										<div className='flex size-7 items-center justify-center rounded-lg  text-foreground'>
											<EnvvalIcon size={18} />
										</div>
									</div>

									{/* Meta info */}
									<div className='flex-1 min-w-0 '>
										<div className='flex items-center gap-1.5'>
											<h3 className='text-xs font-semibold text-foreground'>Envval</h3>
											<span className='rounded bg-muted px-1 py-px text-[8px] font-medium text-muted-foreground'>
												v2.4.1
											</span>
										</div>
										<p className='mt-px text-[9px] text-muted-foreground'>
											Secure .env management & team sharing
										</p>

										<div className='mt-1.5 flex items-center gap-2'>
											<Stars
												count={5}
												size={6}
											/>
											<span className='text-[9px] text-muted-foreground/70'>156,234</span>
											<span className='text-[9px] text-muted-foreground/40'>|</span>
											<span className='text-[9px] text-muted-foreground/70'>Envval Inc.</span>
										</div>

										{/* Install Button */}
										<div className='mt-1.5 flex items-center gap-1'>
											<button className='install-btn relative flex h-4.5 w-14 items-center justify-center rounded-sm text-[9px] font-medium text-primary-foreground bg-primary'>
												<span className='btn-text-install absolute flex items-center gap-0.5'>
													<Download01Icon
														size={8}
														strokeWidth={2.5}
														className='shrink-0'
													/>
													Install
												</span>
												<span className='btn-text-installing absolute flex items-center gap-0.5'>
													<motion.div
														className='size-2 rounded-full border-[1.5px] border-primary-foreground/30 border-t-primary-foreground'
														animate={{ rotate: 360 }}
														transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
													/>
													<span className='text-[8px]'>Installing</span>
												</span>
												<span className='btn-text-installed absolute flex items-center gap-0.5'>
													<Tick01Icon
														size={6}
														className='shrink-0'
														strokeWidth={2.5}
													/>
													<span className='text-[8px]'>Installed</span>
												</span>
											</button>
											<button className='flex h-4.5 items-center justify-center rounded-sm border border-border bg-background px-1.5 text-[8px] text-muted-foreground'>
												Disable
											</button>
											<button className='flex h-4.5 items-center justify-center rounded-sm border border-border bg-background px-1.5 text-[8px] text-muted-foreground'>
												Uninstall
											</button>
										</div>
									</div>
								</div>

								{/* Tab Bar */}
								<div className='flex border-b border-border px-2'>
									<div className='border-b-2 border-primary px-2 py-1 text-[9px] font-medium text-foreground'>
										Details
									</div>
									<div className='px-2 py-1 text-[9px] text-muted-foreground/60'>
										Feature Contributions
									</div>
									<div className='px-2 py-1 text-[9px] text-muted-foreground/60'>Changelog</div>
								</div>

								{/* Features content */}
								<div className='p-2 flex-1 overflow-hidden'>
									<div className='space-y-1.5 text-[9px] text-muted-foreground'>
										<p className='flex items-center gap-2'>
											<span className='flex size-3.5 items-center justify-center rounded-sm bg-emerald-500/10'>
												<Tick01Icon
													size={6}
													className='text-emerald-500'
													strokeWidth={2.5}
												/>
											</span>
											End-to-end encrypted .env sync
										</p>
										<p className='flex items-center gap-2'>
											<span className='flex size-3.5 items-center justify-center rounded-sm bg-emerald-500/10'>
												<Tick01Icon
													size={6}
													className='text-emerald-500'
													strokeWidth={2.5}
												/>
											</span>
											Team sharing & granular access control
										</p>
										<p className='flex items-center gap-2'>
											<span className='flex size-3.5 items-center justify-center rounded-sm bg-emerald-500/10'>
												<Tick01Icon
													size={6}
													className='text-emerald-500'
													strokeWidth={2.5}
												/>
											</span>
											Auto-detect .env files in workspace
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Success flash overlay */}
					<div
						className='success-flash absolute inset-0 pointer-events-none rounded-md'
						style={{
							background:
								'radial-gradient(circle at 65% 40%, rgba(34, 197, 94, 0.15), transparent 50%)',
						}}
					/>
				</div>

				{/* Cursor with click ring - left/top 0 anchors to illustration scope */}
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

function EnvvalIcon({ size = 24 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox='0 0 72 72'
			fill='none'
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
		settings: (
			<Settings02Icon
				size={16}
				className='text-muted-foreground/50'
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

function ExtensionListItem({
	name,
	publisher,
	active,
	className,
}: {
	name: string;
	publisher: string;
	downloads?: string;
	active?: boolean;
	className?: string;
}) {
	const isEnvval = name === 'Envval';

	return (
		<div
			className={cn(
				'extension-item flex items-center gap-1 rounded-sm p-1 cursor-pointer transition-colors',
				active ? 'bg-accent' : 'hover:bg-accent/50',
				className
			)}
		>
			{isEnvval ? (
				<div className='flex size-5 shrink-0 items-center justify-center rounded-[3px]'>
					<svg
						width='10'
						height='10'
						viewBox='0 0 72 72'
						fill='none'
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
				</div>
			) : (
				<div className='flex size-5 shrink-0 items-center justify-center rounded-[3px] bg-muted'>
					<span className='text-[7px] font-bold text-muted-foreground'>
						{name === '.ENV' ? '.E' : name[0]}
					</span>
				</div>
			)}
			<div className='min-w-0 flex-1'>
				<div
					className={cn(
						'truncate text-[8px] font-medium leading-tight',
						active ? 'text-foreground' : 'text-muted-foreground'
					)}
				>
					{name}
				</div>
				<div className='truncate text-[7px] text-muted-foreground/60 leading-tight'>
					{publisher}
				</div>
			</div>
		</div>
	);
}

function Stars({ count, size = 8 }: { count: number; size?: number }) {
	return (
		<div className='flex items-center gap-px'>
			{[1, 2, 3, 4, 5].map((i) => (
				<StarIcon
					key={i}
					size={size}
					className={i <= count ? 'text-amber-400 fill-amber-400' : 'text-muted fill-muted'}
				/>
			))}
		</div>
	);
}
