'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

const EASE_OUT = [0.32, 0.72, 0, 1] as const;

type SectionHeadingProps = {
	label: string;
	heading: string;
	text: string;
	align?: 'center' | 'left';
	className?: string; // Add className prop
};

const SectionHeading = ({
	label,
	heading,
	text,
	align = 'center',
	className,
}: SectionHeadingProps) => (
	<motion.div
		className={cn(
			'flex flex-col max-w-2xl  mb-14 md:mb-20',
			align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left',
			className
		)}
		initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
		whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
		viewport={{ once: true, margin: '-100px' }}
		transition={{ duration: 0.5, ease: EASE_OUT }}
	>
		<span className='text-xs font-medium tracking-widest uppercase text-primary mb-3'>
			{label}
		</span>
		<h2 className='text-3xl md:text-4xl lg:text-5xl tracking-tight leading-[1.1] font-zodiak font-medium mb-4'>
			{heading}
		</h2>
		<p className='text-muted-foreground text-base md:text-lg leading-relaxed text-shadow-2xs text-shadow-muted-foreground/10'>
			{text}
		</p>
	</motion.div>
);

export default SectionHeading;
