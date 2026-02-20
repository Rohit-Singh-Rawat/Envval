'use client';

import { useCallback, useEffect } from 'react';
import { motion, useAnimate } from 'motion/react';
import {
	DashboardSquare01Icon,
	Link01Icon,
	DeviceAccessIcon,
	Settings02Icon,
	Tick01Icon,
	ViewIcon,
	ViewOffSlashIcon,
	Copy01Icon,
	Key01Icon,
	Clock01Icon,
} from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { EASE_OUT, ILLUSTRATION_HEIGHT, getPos, AnimatedCursor, EnvvalIcon } from './shared';

// ── Data ─────────────────────────────────────────────────────────────

const ENV_VARS = [
	{ key: 'DATABASE_URL', masked: '••••••••••••••••••', value: 'postgresql://user:pass@db.io' },
	{ key: 'API_SECRET', masked: '••••••••••••', value: 'sk_live_7f3a9b2c8d' },
	{ key: 'NEXT_PUBLIC_URL', masked: '••••••••••••••••••••', value: 'https://app.envval.dev' },
	{ key: 'STRIPE_KEY', masked: '••••••••••••', value: 'pk_live_51HG8k2e' },
];

const SIDEBAR_ITEMS: readonly { icon: string; label: string; active?: boolean }[] = [
	{ icon: 'dashboard', label: 'Dashboard', active: true },
	{ icon: 'integrations', label: 'Integrations' },
	{ icon: 'devices', label: 'Devices' },
	{ icon: 'settings', label: 'Settings' },
];

/**
 * Inner content for Step 3 — Envval dashboard with decryption.
 * Renders the app header, sidebar nav, repo detail, and env variable reveal.
 * The parent shell provides the browser window frame and title bar.
 */
export function StepDashboardInner({ onComplete }: { onComplete?: () => void }) {
	const [scope, animate] = useAnimate();

	const runAnimation = useCallback(async () => {
		await new Promise((r) => setTimeout(r, 100));
		if (!scope.current) return;

		const pos = (sel: string) =>
			getPos(scope.current!, scope.current!.querySelector(sel) as HTMLElement);
		const eyeBtn = pos('.eye-toggle-0');
		const away = { x: eyeBtn.x + 140, y: eyeBtn.y + 60 };

		// Reset
		await animate('.sidebar-item', { opacity: 0, x: -6 }, { duration: 0 });
		await animate('.env-var-row', { opacity: 0, y: 4 }, { duration: 0 });
		await animate('.env-masked', { opacity: 1 }, { duration: 0 });
		await animate('.env-revealed', { opacity: 0 }, { duration: 0 });
		await animate('.env-card-header', { opacity: 0 }, { duration: 0 });
		await animate('.repo-heading', { opacity: 0 }, { duration: 0 });
		await animate('.decrypt-badge', { opacity: 0, scale: 0.8 }, { duration: 0 });
		await animate(
			'.cursor',
			{ x: eyeBtn.x - 80, y: eyeBtn.y - 30, opacity: 0, scale: 1 },
			{ duration: 0 }
		);
		await animate('.cursor-ring', { scale: 0, opacity: 0 }, { duration: 0 });
		await animate('.success-flash', { opacity: 0 }, { duration: 0 });
		await animate('.reveal-check', { opacity: 0, scale: 0.5 }, { duration: 0 });
		await animate('.eye-icon-on', { opacity: 0 }, { duration: 0 });
		await animate('.eye-icon-off', { opacity: 1 }, { duration: 0 });

		await animate(
			'.sidebar-item',
			{ opacity: 1, x: 0 },
			{ duration: 0.3, ease: EASE_OUT, delay: (i: number) => i * 0.05 }
		);
		await animate('.repo-heading', { opacity: 1 }, { duration: 0.25, ease: EASE_OUT });
		await animate('.env-card-header', { opacity: 1 }, { duration: 0.2, ease: EASE_OUT });
		await animate(
			'.env-var-row',
			{ opacity: 1, y: 0 },
			{ duration: 0.3, ease: EASE_OUT, delay: (i: number) => i * 0.06 }
		);
		await new Promise((r) => setTimeout(r, 400));

		await animate('.cursor', { opacity: 1 }, { duration: 0.2 });
		await animate('.cursor', { x: eyeBtn.x, y: eyeBtn.y }, { duration: 0.45, ease: EASE_OUT });

		await animate('.cursor', { scale: 0.85 }, { duration: 0.06 });
		await animate('.cursor-ring', { scale: 1, opacity: 0.6 }, { duration: 0.08 });
		await animate('.cursor', { scale: 1 }, { duration: 0.1 });
		await animate('.cursor-ring', { scale: 1.8, opacity: 0 }, { duration: 0.25 });

		await Promise.all([
			animate('.eye-icon-off', { opacity: 0 }, { duration: 0.1 }),
			animate('.eye-icon-on', { opacity: 1 }, { duration: 0.15 }),
		]);

		await animate(
			'.cursor',
			{ x: away.x, y: away.y, opacity: 0 },
			{ duration: 0.4, ease: EASE_OUT }
		);

		for (let i = 0; i < ENV_VARS.length; i++) {
			await new Promise((r) => setTimeout(r, 150));
			await Promise.all([
				animate(`.env-masked-${i}`, { opacity: 0 }, { duration: 0.12 }),
				animate(`.env-revealed-${i}`, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }),
				animate(`.reveal-check-${i}`, { opacity: 1, scale: 1 }, { duration: 0.2, ease: EASE_OUT }),
			]);
		}

		await animate(
			'.decrypt-badge',
			{ opacity: 1, scale: 1 },
			{ type: 'spring', stiffness: 400, damping: 20 }
		);
		await animate('.success-flash', { opacity: [0, 0.3, 0] }, { duration: 0.5 });

		onComplete?.();
	}, [animate, onComplete]);

	useEffect(() => {
		runAnimation();
	}, [runAnimation]);

	return (
		<div
			ref={scope}
			className='relative'
		>
			{/* App Header Bar */}
			<div className='flex items-center justify-between border-b border-border bg-background px-3 py-1'>
				<div className='flex items-center gap-1.5'>
					<EnvvalIcon size={14} />
					<span className='text-[9px] font-semibold text-foreground'>Envval</span>
				</div>
				<div className='flex items-center gap-2'>
					<div
						className='decrypt-badge flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5'
						style={{ opacity: 0 }}
					>
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

			{/* Main Layout — height adjusted for app header to keep total consistent */}
			<div
				className='flex'
				style={{ height: ILLUSTRATION_HEIGHT - 20 }}
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
								style={{ opacity: 0 }}
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
					<div
						className='repo-heading flex items-center gap-2 mb-2'
						style={{ opacity: 0 }}
					>
						<span className='text-[10px] font-semibold text-foreground'>my-saas-app</span>
						<span className='text-[8px] text-muted-foreground/60'>github.com/user/my-saas-app</span>
					</div>

					<div className='flex-1 overflow-hidden rounded-lg bg-muted/50 p-1'>
						<div
							className='env-card-header flex items-center justify-between px-2 py-1'
							style={{ opacity: 0 }}
						>
							<div className='flex items-center gap-1.5'>
								<span className='text-[9px] font-medium text-foreground'>.env.local</span>
								<span className='text-[7px] font-mono bg-background/50 px-1 py-px rounded border border-border/50 text-muted-foreground/60'>
									a7f2e3b1
								</span>
							</div>
							<div className='flex items-center gap-2 text-[7px] text-muted-foreground/50'>
								<span className='flex items-center gap-0.5'>
									<Key01Icon
										size={7}
										strokeWidth={2}
									/>
									4 vars
								</span>
								<span className='flex items-center gap-0.5'>
									<Clock01Icon
										size={7}
										strokeWidth={2}
									/>
									2m ago
								</span>
							</div>
						</div>

						<div className='rounded-md bg-background border border-border/50 overflow-hidden'>
							{ENV_VARS.map((env, i) => (
								<div
									key={env.key}
									className={cn(
										'env-var-row flex items-center px-2 py-1.5 font-mono text-[8px]',
										i < ENV_VARS.length - 1 && 'border-b border-border/30'
									)}
									style={{ opacity: 0 }}
								>
									<span className='text-primary/80 font-medium shrink-0'>{env.key}</span>
									<span className='text-muted-foreground/40 mx-0.5'>=</span>
									<div className='flex-1 relative overflow-hidden min-w-0'>
										<span
											className={`env-masked env-masked-${i} text-muted-foreground/30 absolute truncate`}
										>
											{env.masked}
										</span>
										<span
											className={`env-revealed env-revealed-${i} text-muted-foreground truncate block`}
											style={{ opacity: 0 }}
										>
											{env.value}
										</span>
									</div>
									<div className='flex items-center gap-1 ml-1.5 shrink-0'>
										<span
											className={`reveal-check reveal-check-${i}`}
											style={{ opacity: 0 }}
										>
											<Tick01Icon
												size={7}
												className='text-emerald-500'
												strokeWidth={2.5}
											/>
										</span>
										<div className='eye-toggle-0 relative size-3 flex items-center justify-center text-muted-foreground/40 cursor-pointer'>
											{i === 0 ? (
												<>
													<span className='eye-icon-off absolute inset-0 flex items-center justify-center'>
														<ViewOffSlashIcon
															size={8}
															strokeWidth={2}
														/>
													</span>
													<span
														className='eye-icon-on absolute inset-0 flex items-center justify-center'
														style={{ opacity: 0 }}
													>
														<ViewIcon
															size={8}
															strokeWidth={2}
														/>
													</span>
												</>
											) : (
												<ViewOffSlashIcon
													size={8}
													strokeWidth={2}
												/>
											)}
										</div>
										<div className='size-3 flex items-center justify-center text-muted-foreground/40'>
											<Copy01Icon
												size={8}
												strokeWidth={2}
											/>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<div
				className='success-flash absolute inset-0 pointer-events-none'
				style={{
					background:
						'radial-gradient(circle at 65% 50%, rgba(34, 197, 94, 0.12), transparent 50%)',
					opacity: 0,
				}}
			/>

			<AnimatedCursor />
		</div>
	);
}

// ── Sub-components ───────────────────────────────────────────────────

const SIDEBAR_ICON_MAP: Record<string, (cls: string) => React.ReactNode> = {
	dashboard: (cls) => (
		<DashboardSquare01Icon
			size={10}
			className={cls}
			strokeWidth={1.5}
		/>
	),
	integrations: (cls) => (
		<Link01Icon
			size={10}
			className={cls}
			strokeWidth={1.5}
		/>
	),
	devices: (cls) => (
		<DeviceAccessIcon
			size={10}
			className={cls}
			strokeWidth={1.5}
		/>
	),
	settings: (cls) => (
		<Settings02Icon
			size={10}
			className={cls}
			strokeWidth={1.5}
		/>
	),
};

function SidebarNavIcon({ type, active }: { type: string; active?: boolean }) {
	const cls = active ? 'text-primary' : 'text-muted-foreground';
	return SIDEBAR_ICON_MAP[type]?.(cls) ?? null;
}
