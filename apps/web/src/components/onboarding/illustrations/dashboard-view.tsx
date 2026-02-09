'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, useAnimate } from 'motion/react';
import {
	DashboardSquare01Icon,
	Link01Icon,
	DeviceAccessIcon,
	Settings02Icon,
	Tick01Icon,
	RefreshIcon,
	ViewIcon,
	ViewOffSlashIcon,
	Copy01Icon,
	LockIcon,
	Key01Icon,
	Clock01Icon,
} from 'hugeicons-react';
import { cn } from '@/lib/utils';

const easeOut = [0.32, 0.72, 0, 1] as const;

const ENV_VARS = [
	{ key: 'DATABASE_URL', masked: '••••••••••••••••••', value: 'postgresql://user:pass@db.io' },
	{ key: 'API_SECRET', masked: '••••••••••••', value: 'sk_live_7f3a9b2c8d' },
	{ key: 'NEXT_PUBLIC_URL', masked: '••••••••••••••••••••', value: 'https://app.envvault.dev' },
	{ key: 'STRIPE_KEY', masked: '••••••••••••', value: 'pk_live_51HG8k2e' },
];

const SIDEBAR_ITEMS = [
	{ icon: 'dashboard', label: 'Dashboard', active: true },
	{ icon: 'integrations', label: 'Integrations' },
	{ icon: 'devices', label: 'Devices' },
	{ icon: 'settings', label: 'Settings' },
];

export function DashboardViewIllustration() {
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

		const eyeBtn = getPos(scope.current?.querySelector('.eye-toggle-0') as HTMLElement);
		const away = { x: eyeBtn.x + 140, y: eyeBtn.y + 60 };

		// Initial states
		await animate('.sidebar-item', { opacity: 0, x: -6 }, { duration: 0 });
		await animate('.env-var-row', { opacity: 0, y: 4 }, { duration: 0 });
		await animate('.env-masked', { opacity: 1 }, { duration: 0 });
		await animate('.env-revealed', { opacity: 0 }, { duration: 0 });
		await animate('.env-card-header', { opacity: 0 }, { duration: 0 });
		await animate('.repo-heading', { opacity: 0 }, { duration: 0 });
		await animate('.decrypt-badge', { opacity: 0, scale: 0.8 }, { duration: 0 });
		await animate('.cursor', { x: eyeBtn.x - 80, y: eyeBtn.y - 30, opacity: 0, scale: 1 }, { duration: 0 });
		await animate('.cursor-ring', { scale: 0, opacity: 0 }, { duration: 0 });
		await animate('.success-flash', { opacity: 0 }, { duration: 0 });
		await animate('.reveal-check', { opacity: 0, scale: 0.5 }, { duration: 0 });
		await animate('.eye-icon-on', { opacity: 0 }, { duration: 0 });
		await animate('.eye-icon-off', { opacity: 1 }, { duration: 0 });

		// 1. Sidebar items slide in
		await animate(
			'.sidebar-item',
			{ opacity: 1, x: 0 },
			{ duration: 0.3, ease: easeOut, delay: (i: number) => i * 0.05 }
		);

		// 2. Repo heading appears
		await animate('.repo-heading', { opacity: 1 }, { duration: 0.25, ease: easeOut });

		// 3. Env card header appears
		await animate('.env-card-header', { opacity: 1 }, { duration: 0.2, ease: easeOut });

		// 4. Env rows slide in (masked)
		await animate(
			'.env-var-row',
			{ opacity: 1, y: 0 },
			{ duration: 0.3, ease: easeOut, delay: (i: number) => i * 0.06 }
		);
		await new Promise((r) => setTimeout(r, 400));

		// 5. Cursor appears and moves to first eye toggle
		await animate('.cursor', { opacity: 1 }, { duration: 0.2 });
		await animate(
			'.cursor',
			{ x: eyeBtn.x, y: eyeBtn.y },
			{ duration: 0.45, ease: easeOut }
		);

		// 6. Click the eye toggle
		await animate('.cursor', { scale: 0.85 }, { duration: 0.06 });
		await animate('.cursor-ring', { scale: 1, opacity: 0.6 }, { duration: 0.08 });
		await animate('.cursor', { scale: 1 }, { duration: 0.1 });
		await animate('.cursor-ring', { scale: 1.8, opacity: 0 }, { duration: 0.25 });

		// 7. Toggle eye icons
		await Promise.all([
			animate('.eye-icon-off', { opacity: 0 }, { duration: 0.1 }),
			animate('.eye-icon-on', { opacity: 1 }, { duration: 0.15 }),
		]);

		// 8. Cursor moves away
		await animate(
			'.cursor',
			{ x: away.x, y: away.y, opacity: 0 },
			{ duration: 0.4, ease: easeOut }
		);

		// 9. Values reveal one by one with check marks
		for (let i = 0; i < ENV_VARS.length; i++) {
			await new Promise((r) => setTimeout(r, 150));
			await Promise.all([
				animate(`.env-masked-${i}`, { opacity: 0 }, { duration: 0.12 }),
				animate(`.env-revealed-${i}`, { opacity: 1 }, { duration: 0.2, ease: easeOut }),
				animate(`.reveal-check-${i}`, { opacity: 1, scale: 1 }, { duration: 0.2, ease: easeOut }),
			]);
		}

		// 10. Decrypt badge appears
		await animate(
			'.decrypt-badge',
			{ opacity: 1, scale: 1 },
			{ type: 'spring', stiffness: 400, damping: 20 }
		);

		// 11. Success flash
		await animate('.success-flash', { opacity: [0, 0.3, 0] }, { duration: 0.5 });
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
					{/* Browser Title Bar */}
					<div className='relative flex h-6 items-center justify-center border-b border-border bg-muted/60 px-3'>
						<div className='absolute left-3 flex items-center gap-[5px]'>
							<span className='size-[7px] rounded-full bg-muted-foreground/40 group-hover:bg-[#ff5f57] transition-colors duration-200 ease-in-out' />
							<span className='size-[7px] rounded-full bg-muted-foreground/40 group-hover:bg-[#febc2e] transition-colors duration-200 ease-in-out' />
							<span className='size-[7px] rounded-full bg-muted-foreground/40 group-hover:bg-[#28c840] transition-colors duration-200 ease-in-out' />
						</div>

						<div className='flex items-center gap-1.5 rounded-sm border border-border bg-background px-2 py-[2px] max-w-[220px]'>
							<LockIcon
								size={8}
								className='text-emerald-500 shrink-0'
								strokeWidth={2.5}
							/>
							<span className='text-[9px] text-muted-foreground/70 truncate'>app.envvault.dev/repos/my-saas-app</span>
						</div>

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

					{/* App Header Bar */}
					<div className='flex items-center justify-between border-b border-border bg-background px-3 py-1'>
						<div className='flex items-center gap-1.5'>
							<EnvVaultIcon size={14} />
							<span className='text-[9px] font-semibold text-foreground'>EnvVault</span>
						</div>
						<div className='flex items-center gap-2'>
							<div className='decrypt-badge flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5'>
								<motion.div
									className='size-1.5 rounded-full bg-emerald-500'
									animate={{ opacity: [1, 0.4, 1] }}
									transition={{ duration: 1.5, repeat: Infinity }}
								/>
								<span className='text-[7px] font-medium text-emerald-600 dark:text-emerald-400'>
									Decrypted in browser
								</span>
							</div>
							<div className='size-4 rounded-full bg-linear-to-br from-primary/60 to-primary/30 border border-border' />
						</div>
					</div>

					{/* Main Layout */}
					<div
						className='flex'
						style={{ height: 220 }}
					>
						{/* App Sidebar */}
						<div className='w-[90px] border-r border-border bg-background flex flex-col'>
							<div className='px-1.5 pt-1.5 space-y-0.5'>
								{SIDEBAR_ITEMS.map((item) => (
									<div
										key={item.label}
										className={cn(
											'sidebar-item flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[8px] cursor-pointer transition-colors',
											item.active
												? 'text-primary font-medium'
												: 'text-muted-foreground hover:text-foreground'
										)}
									>
										<SidebarNavIcon
											type={item.icon}
											active={item.active}
										/>
										<span>{item.label}</span>
									</div>
								))}
							</div>
						</div>

						{/* Main Content — Repo Detail */}
						<div className='flex-1 bg-muted/20 overflow-hidden flex flex-col px-3 py-2'>
							{/* Repo Heading */}
							<div className='repo-heading flex items-center gap-2 mb-2'>
								<span className='text-[10px] font-semibold text-foreground'>my-saas-app</span>
								<span className='text-[8px] text-muted-foreground/60'>github.com/user/my-saas-app</span>
							</div>

							{/* Env File Card */}
							<div className='flex-1 overflow-hidden rounded-lg bg-muted/50 p-1'>
								{/* Card Header */}
								<div className='env-card-header flex items-center justify-between px-2 py-1'>
									<div className='flex items-center gap-1.5'>
										<span className='text-[9px] font-medium text-foreground'>.env.local</span>
										<span className='text-[7px] font-mono bg-background/50 px-1 py-px rounded border border-border/50 text-muted-foreground/60'>
											a7f2e3b1
										</span>
									</div>
									<div className='flex items-center gap-2 text-[7px] text-muted-foreground/50'>
										<span className='flex items-center gap-0.5'>
											<Key01Icon size={7} strokeWidth={2} />
											4 vars
										</span>
										<span className='flex items-center gap-0.5'>
											<Clock01Icon size={7} strokeWidth={2} />
											2m ago
										</span>
									</div>
								</div>

								{/* Variables List */}
								<div className='rounded-md bg-background border border-border/50 overflow-hidden'>
									{ENV_VARS.map((env, i) => (
										<div
											key={env.key}
											className={cn(
												'env-var-row flex items-center px-2 py-1.5 font-mono text-[8px]',
												i < ENV_VARS.length - 1 && 'border-b border-border/30'
											)}
										>
											<span className='text-primary/80 font-medium shrink-0'>{env.key}</span>
											<span className='text-muted-foreground/40 mx-0.5'>=</span>
											<div className='flex-1 relative overflow-hidden min-w-0'>
												<span className={`env-masked env-masked-${i} text-muted-foreground/30 absolute truncate`}>
													{env.masked}
												</span>
												<span className={`env-revealed env-revealed-${i} text-muted-foreground truncate block`}>
													{env.value}
												</span>
											</div>
											<div className='flex items-center gap-1 ml-1.5 shrink-0'>
												<span className={`reveal-check reveal-check-${i}`}>
													<Tick01Icon
														size={7}
														className='text-emerald-500'
														strokeWidth={2.5}
													/>
												</span>
												<div className='eye-toggle-0 relative size-3 flex items-center justify-center text-muted-foreground/40 cursor-pointer'>
													{i === 0 && (
														<>
															<span className='eye-icon-off absolute inset-0 flex items-center justify-center'>
																<ViewOffSlashIcon size={8} strokeWidth={2} />
															</span>
															<span className='eye-icon-on absolute inset-0 flex items-center justify-center'>
																<ViewIcon size={8} strokeWidth={2} />
															</span>
														</>
													)}
													{i !== 0 && <ViewOffSlashIcon size={8} strokeWidth={2} />}
												</div>
												<div className='size-3 flex items-center justify-center text-muted-foreground/40'>
													<Copy01Icon size={8} strokeWidth={2} />
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>

					{/* Success flash overlay */}
					<div
						className='success-flash absolute inset-0 pointer-events-none rounded-md'
						style={{
							background:
								'radial-gradient(circle at 65% 50%, rgba(34, 197, 94, 0.12), transparent 50%)',
						}}
					/>
				</div>

				{/* Cursor */}
				<div className='cursor pointer-events-none absolute left-0 top-0 z-30' aria-hidden='true'>
					<div className='cursor-ring absolute -left-2.5 -top-2.5 size-6 rounded-full border-2 border-primary/60' />
					<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 28 28' className='drop-shadow-md'>
						<path fill='currentColor' d='M6 3.604c0-1.346 1.56-2.09 2.607-1.243l16.88 13.669c1.018.824.435 2.47-.875 2.47h-9.377a2.25 2.25 0 0 0-1.749.835l-4.962 6.134C7.682 26.51 6 25.915 6 24.576z' />
					</svg>
				</div>
			</div>
		</div>
	);
}

// ── Sub-components ──────────────────────────────────

function EnvVaultIcon({ size = 24 }: { size?: number }) {
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

function SidebarNavIcon({ type, active }: { type: string; active?: boolean }) {
	const cls = active ? 'text-primary' : 'text-muted-foreground';
	const iconMap: Record<string, React.ReactNode> = {
		dashboard: <DashboardSquare01Icon size={10} className={cls} strokeWidth={1.5} />,
		integrations: <Link01Icon size={10} className={cls} strokeWidth={1.5} />,
		devices: <DeviceAccessIcon size={10} className={cls} strokeWidth={1.5} />,
		settings: <Settings02Icon size={10} className={cls} strokeWidth={1.5} />,
	};
	return iconMap[type] || null;
}
