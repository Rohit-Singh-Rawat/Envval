'use client';

import * as React from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { cn } from '@envval/ui/lib/utils';
import { Spinner } from '@envval/ui/components/icons/spinner';
import { useIsMobile } from '@envval/ui/hooks/use-mobile';

const buttonVariants = cva(
	"inline-flex items-center justify-center cursor-pointer squircle  shadow-button-base-light gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive active:scale-[0.98] transition-all duration-200 ease-in-out",
	{
		variants: {
			variant: {
				default:
					'bg-primary shadow-button-default  text-primary-foreground hover:shadow-button-hover hover:bg-primary/90',
				destructive:
					'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20',
				outline: 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
				secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
				muted: 'bg-muted/80  hover:bg-muted',
			},
			size: {
				default: 'h-9 px-4 py-2 has-[>svg]:px-3',
				sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
				lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
				icon: 'size-9',
				'icon-sm': 'size-8',
				'icon-lg': 'size-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

type ButtonProps = ButtonPrimitive.Props &
	VariantProps<typeof buttonVariants> & {
		pending?: boolean;
		pendingText?: string;
		hoverAnimate?: boolean;
	};

function Button({
	className,
	variant = 'default',
	size = 'default',
	pending = false,
	pendingText,
	hoverAnimate = false,
	children,
	disabled,
	...props
}: ButtonProps) {
	const [hasAnimated, setHasAnimated] = React.useState(false);
	const isMobile = useIsMobile();
	const shouldReduceMotion = useReducedMotion();

	React.useEffect(() => {
		if (pending !== undefined) {
			setHasAnimated(true);
		}
	}, [pending]);

	const useSimpleAnimation = isMobile || shouldReduceMotion;
	const motionProps = useSimpleAnimation
		? {
				initial: hasAnimated ? { opacity: 0 } : false,
				animate: { opacity: 1 },
				exit: { opacity: 0 },
				transition: { duration: 0.15, ease: 'easeOut' as const },
			}
		: {
				initial: hasAnimated ? { y: 20, opacity: 0 } : false,
				animate: { y: 0, opacity: 1 },
				exit: { y: -20, opacity: 0 },
				transition: { duration: 0.2, ease: 'easeInOut' as const },
			};

	// #region agent log
	const isNarrow = typeof window !== 'undefined' && window.innerWidth < 768;
	React.useLayoutEffect(() => {
		const w = typeof window !== 'undefined' ? window.innerWidth : 0;
		fetch('http://127.0.0.1:7242/ingest/98ed4269-d2f9-46e6-b407-f649eea16e88', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'ec5fbd' },
			body: JSON.stringify({
				sessionId: 'ec5fbd',
				location: 'button.tsx',
				message: 'button mount/render',
				data: {
					innerWidth: w,
					isNarrow,
					shouldReduceMotion,
					useSimpleAnimation,
					pending,
					hasAnimated,
					hoverAnimate,
					branch: hoverAnimate && !pending ? 'hover' : 'animatePresence',
				},
				timestamp: Date.now(),
				hypothesisId: 'H1',
			}),
		}).catch(() => {});
	}, [pending, hasAnimated, hoverAnimate, isNarrow, shouldReduceMotion, useSimpleAnimation]);
	// #endregion

	return (
		<ButtonPrimitive
			data-slot='button'
			className={cn(
				buttonVariants({ variant, size, className }),
				'overflow-hidden',
				hoverAnimate && 'group'
			)}
			disabled={disabled || pending}
			{...props}
		>
			{hoverAnimate && !pending ? (
				<span className='inline-flex items-center gap-2 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] [text-shadow:0_-2lh_currentColor] group-hover:translate-y-[2lh]'>
					{children}
				</span>
			) : (
				<AnimatePresence
					mode={useSimpleAnimation ? 'wait' : 'popLayout'}
					initial={false}
				>
					{pending ? (
						<motion.span
							key='pending'
							{...motionProps}
							className='inline-flex items-center gap-2'
						>
							<Spinner className='size-4' />
							{pendingText && <span>{pendingText}</span>}
						</motion.span>
					) : (
						<motion.span
							key='children'
							{...motionProps}
							className='inline-flex items-center gap-2'
						>
							{children}
						</motion.span>
					)}
				</AnimatePresence>
			)}
		</ButtonPrimitive>
	);
}

export { Button, buttonVariants };
export type { ButtonProps };
