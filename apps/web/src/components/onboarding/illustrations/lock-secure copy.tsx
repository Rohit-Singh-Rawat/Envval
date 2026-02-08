'use client';

import { useEffect } from 'react';
import { motion, useAnimate } from 'motion/react';

const easeOut = [0.32, 0.72, 0, 1] as const;

export function LockSecureIllustration() {
	const [scope, animate] = useAnimate();

	useEffect(() => {
		const runAnimation = async () => {
			// Initial state
			await animate('.window', { opacity: 0, y: 20 }, { duration: 0 });
			await animate('.env-line', { opacity: 0, x: -10 }, { duration: 0 });
			await animate('.lock-overlay', { opacity: 0, scale: 0.8 }, { duration: 0 });
			await animate('.shield-icon', { scale: 0 }, { duration: 0 });
			await animate('.encrypted-badge', { opacity: 0, y: 10 }, { duration: 0 });

			// 1. Window appears
			await animate('.window', { opacity: 1, y: 0 }, { duration: 0.5, ease: easeOut });

			// 2. Env lines appear
			await animate(
				'.env-line',
				{ opacity: 1, x: 0 },
				{
					duration: 0.3,
					ease: easeOut,
					delay: (i: number) => 0.2 + i * 0.1,
				}
			);

			// 3. Lock overlay animates in
			await new Promise((r) => setTimeout(r, 400));
			await animate(
				'.lock-overlay',
				{ opacity: 1, scale: 1 },
				{
					type: 'spring',
					stiffness: 300,
					damping: 20,
				}
			);

			// 4. Shield pops
			await animate(
				'.shield-icon',
				{ scale: 1 },
				{
					type: 'spring',
					stiffness: 500,
					damping: 15,
				}
			);

			// 5. Encrypted badge slides up
			await animate('.encrypted-badge', { opacity: 1, y: 0 }, { duration: 0.3, ease: easeOut });

			// 6. Pulse effect on shield
			await animate('.shield-icon', { scale: [1, 1.1, 1] }, { duration: 0.4 });
		};

		runAnimation();
	}, [animate]);

	return (
		<div
			ref={scope}
			className='relative w-full flex justify-center'
		>
			{/* Terminal/Editor Window - Using theme colors */}
			<div className='window relative overflow-hidden rounded-xl bg-card border border-border shadow-xl w-full max-w-[400px]'>
				{/* Title Bar */}
				<div className='flex h-8 items-center justify-between border-b border-border bg-muted/50 px-3'>
					<div className='flex items-center gap-1.5'>
						<span className='size-3 rounded-full bg-destructive/60' />
						<span className='size-3 rounded-full bg-amber-400/60' />
						<span className='size-3 rounded-full bg-emerald-400/60' />
					</div>
					<div className='flex items-center gap-2'>
						<span className='text-[10px] text-muted-foreground'>.env.local</span>
						<div className='encrypted-badge flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5'>
							<svg
								width='10'
								height='10'
								viewBox='0 0 16 16'
								fill='none'
								className='text-emerald-500'
							>
								<path
									d='M8 1L13 3.5V7C13 10.5 10.8 13.5 8 14.5C5.2 13.5 3 10.5 3 7V3.5L8 1Z'
									fill='currentColor'
								/>
								<path
									d='M6 8L7.5 9.5L10 6.5'
									stroke='white'
									strokeWidth='1.5'
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
							</svg>
							<span className='text-[8px] font-medium text-emerald-600 dark:text-emerald-400'>
								Encrypted
							</span>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className='relative p-4 font-mono text-[11px] h-[160px]'>
					{/* Env content */}
					<div className='space-y-2'>
						{[
							{ key: 'DATABASE_URL', value: 'postgresql://...' },
							{ key: 'API_SECRET', value: 'sk_live_...' },
							{ key: 'JWT_SECRET', value: 'eyJhbGciOiJ...' },
							{ key: 'STRIPE_KEY', value: 'pk_live_...' },
						].map((env, i) => (
							<div
								key={env.key}
								className='env-line flex items-center'
							>
								<span className='text-emerald-600 dark:text-emerald-400'>{env.key}</span>
								<span className='text-muted-foreground mx-1'>=</span>
								<span className='text-blue-600 dark:text-blue-400'>{env.value}</span>
							</div>
						))}
					</div>

					{/* Lock overlay */}
					<div className='lock-overlay absolute inset-0 flex items-center justify-center bg-card/90 backdrop-blur-sm'>
						<div className='flex flex-col items-center gap-3'>
							{/* Shield with lock */}
							<div className='shield-icon relative'>
								<div className='flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25'>
									<svg
										width='32'
										height='32'
										viewBox='0 0 24 24'
										fill='none'
									>
										{/* Shield */}
										<path
											d='M12 2L20 6V12C20 16.4 16.4 20.2 12 21.4C7.6 20.2 4 16.4 4 12V6L12 2Z'
											fill='white'
											fillOpacity='0.15'
											stroke='white'
											strokeWidth='1.5'
										/>
										{/* Lock */}
										<rect
											x='9'
											y='11'
											width='6'
											height='5'
											rx='1'
											fill='white'
										/>
										<path
											d='M10 11V9C10 7.9 10.9 7 12 7C13.1 7 14 7.9 14 9V11'
											stroke='white'
											strokeWidth='1.5'
											strokeLinecap='round'
										/>
										<circle
											cx='12'
											cy='13.5'
											r='0.75'
											fill='hsl(var(--primary))'
										/>
									</svg>
								</div>

								{/* Glow ring */}
								<motion.div
									className='absolute inset-0 rounded-2xl'
									animate={{
										boxShadow: [
											'0 0 0 0 hsl(var(--primary) / 0)',
											'0 0 0 8px hsl(var(--primary) / 0.15)',
											'0 0 0 0 hsl(var(--primary) / 0)',
										],
									}}
									transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
								/>
							</div>

							<div className='text-center'>
								<p className='text-xs font-medium text-foreground'>End-to-end encrypted</p>
								<p className='mt-0.5 text-[9px] text-muted-foreground'>Only you can decrypt</p>
							</div>
						</div>
					</div>
				</div>

				{/* Status Bar */}
				<div className='flex items-center justify-between border-t border-border bg-muted/30 px-3 py-1.5'>
					<div className='flex items-center gap-2'>
						<div className='flex items-center gap-1'>
							<div className='size-2 rounded-full bg-emerald-500' />
							<span className='text-[9px] text-muted-foreground'>Synced</span>
						</div>
					</div>
					<div className='flex items-center gap-1.5 text-[9px] text-muted-foreground'>
						<span>4 variables</span>
						<span>·</span>
						<span>AES-256</span>
					</div>
				</div>
			</div>
		</div>
	);
}
