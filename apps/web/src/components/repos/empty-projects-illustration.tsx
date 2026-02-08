'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Key01Icon, Clock01Icon } from 'hugeicons-react';

const EASE_OUT = [0.32, 0.72, 0, 1] as const;

const GHOST_ROWS = [
	{ nameWidth: 'w-24', urlWidth: 'w-32' },
	{ nameWidth: 'w-16', urlWidth: 'w-28' },
	{ nameWidth: 'w-28', urlWidth: 'w-36' },
	{ nameWidth: 'w-20', urlWidth: 'w-24' },
];

export function EmptyProjectsIllustration() {
	const [marqueeActive, setMarqueeActive] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setMarqueeActive(true), 1000);
		return () => clearTimeout(timer);
	}, []);

	const allRows = [...GHOST_ROWS, ...GHOST_ROWS];

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, ease: EASE_OUT }}
			className='relative w-full max-w-xs mx-auto'
			aria-hidden='true'
		>
			<div
				className='overflow-hidden opacity-80'
				style={{
					height: 140,
					maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 80%, transparent)',
					WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 80%, transparent)',
				}}
			>
				<motion.div
					className='flex flex-col gap-1'
					animate={marqueeActive ? { y: ['0%', '-50%'] } : { y: '0%' }}
					transition={
						marqueeActive
							? { y: { duration: 16, ease: 'linear', repeat: Infinity } }
							: {}
					}
				>
					{allRows.map((row, i) => {
						const isFirstSet = i < GHOST_ROWS.length;
						return (
							<motion.div
								key={i}
								initial={isFirstSet ? { opacity: 0, y: 8 } : false}
								animate={isFirstSet ? { opacity: 1, y: 0 } : undefined}
								transition={
									isFirstSet
										? { duration: 0.4, ease: EASE_OUT, delay: 0.1 + i * 0.08 }
										: undefined
								}
								className='flex items-center justify-between p-2 px-3 rounded-lg squircle border border-border/70 gap-3'
							>
								<div className='flex flex-col gap-1.5 min-w-0 flex-1'>
									<div className={`h-2.5 ${row.nameWidth} rounded bg-muted-foreground/35`} />
									<div className={`h-2 ${row.urlWidth} rounded bg-muted-foreground/20`} />
								</div>

								<div className='flex items-center gap-4 shrink-0'>
									<div className='flex items-center gap-1'>
										<Key01Icon className='size-3.5 text-primary/50' />
										<div className='h-2 w-2.5 rounded bg-muted-foreground/30' />
									</div>
									<div className='flex items-center gap-1'>
										<Clock01Icon className='size-3.5 text-muted-foreground/50' />
										<div className='h-2 w-6 rounded bg-muted-foreground/25' />
									</div>
								</div>
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		</motion.div>
	);
}
