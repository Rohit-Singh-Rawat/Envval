import { useState } from 'react';
import {
	ViewIcon,
	ViewOffSlashIcon,
	Copy01Icon,
	CheckmarkCircle02Icon,
	LockKeyIcon,
	Alert02Icon,
} from 'hugeicons-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@envval/ui/components/tooltip';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useEnvDecrypt } from '@/hooks/envs/use-env-decrypt';

const easeOut = [0.32, 0.72, 0, 1] as const;
const easeOutQuint = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.05,
			delayChildren: 0.08,
		},
	},
	exit: {
		opacity: 0,
		transition: {
			staggerChildren: 0.02,
			staggerDirection: -1,
			duration: 0.15,
		},
	},
};

const itemVariants = {
	hidden: {
		opacity: 0,
		y: 10,
	},
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.25,
			ease: easeOut,
		},
	},
	exit: {
		opacity: 0,
		y: -4,
		transition: {
			duration: 0.12,
			ease: easeOut,
		},
	},
};

const stateVariants = {
	initial: {
		opacity: 0,
		scale: 0.96,
		y: 8,
	},
	animate: {
		opacity: 1,
		scale: 1,
		y: 0,
		transition: {
			duration: 0.25,
			ease: easeOutQuint,
		},
	},
	exit: {
		opacity: 0,
		scale: 0.98,
		y: -6,
		transition: {
			duration: 0.15,
			ease: easeOut,
		},
	},
};

interface Environment {
	id: string;
	fileName: string;
	envCount: number;
	updatedAt: string;
	content?: string;
}

interface EnvFileCardProps {
	env: Environment;
	repoId: string;
}

/**
 * Parses env file content into key-value pairs.
 * Handles comments, empty lines, and quoted values.
 */
function parseEnvContent(content: string): Array<{ key: string; value: string }> {
	if (!content) return [];

	return content
		.split('\n')
		.filter((line) => {
			const trimmed = line.trim();
			return trimmed && !trimmed.startsWith('#');
		})
		.map((line) => {
			const eqIndex = line.indexOf('=');
			if (eqIndex === -1) return null;

			const key = line.slice(0, eqIndex).trim();
			let value = line.slice(eqIndex + 1).trim();

			// Remove surrounding quotes if present
			if ((value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))) {
				value = value.slice(1, -1);
			}

			return { key, value };
		})
		.filter(Boolean) as Array<{ key: string; value: string }>;
}

function EnvVariableRow({ envKey, value }: { envKey: string; value: string }) {
	const [isVisible, setIsVisible] = useState(false);
	const [copied, setCopied] = useState(false);
	const shouldReduceMotion = useReducedMotion();

	const handleCopy = async () => {
		await navigator.clipboard.writeText(`${envKey}=${value}`);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const maskedValue = isVisible ? value : '*'.repeat(Math.min(value.length, 24));

	const valueTransition = shouldReduceMotion
		? { duration: 0.15 }
		: { duration: 0.18, ease: easeOut };

	const iconTransition = shouldReduceMotion
		? { duration: 0.1 }
		: { duration: 0.12, ease: easeOut };

	return (
		<motion.li
			variants={itemVariants}
			className='group flex relative items-center justify-between py-2 px-3 rounded-md hover:bg-muted/30 transition-colors font-mono text-sm after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-muted last:after:hidden'
		>
			<div className='flex items-center gap-2 min-w-0'>
				<span className='text-primary/80 font-medium shrink-0'>{envKey}</span>
				<span className='text-muted-foreground'>=</span>
				<AnimatePresence mode='wait'>
					<motion.span
						key={isVisible ? 'visible' : 'hidden'}
						initial={{ opacity: 0, filter: shouldReduceMotion ? 'none' : 'blur(2px)' }}
						animate={{ opacity: 1, filter: 'blur(0px)' }}
						exit={{ opacity: 0, filter: shouldReduceMotion ? 'none' : 'blur(2px)' }}
						transition={valueTransition}
						className={cn(
							'truncate font-zodiak',
							isVisible ? 'text-foreground' : 'text-muted-foreground select-none'
						)}
						aria-label={isVisible ? value : 'Hidden value'}
					>
						{maskedValue}
					</motion.span>
				</AnimatePresence>
			</div>
			<div className='flex items-center gap-1 shrink-0 ml-4'>
				<Tooltip>
					<TooltipTrigger asChild>
						<motion.button
							type='button'
							onClick={() => setIsVisible(!isVisible)}
							className='p-1 px-2 rounded hover:bg-accent transition-all text-muted-foreground hover:text-foreground'
							aria-label={isVisible ? 'Hide value' : 'Show value'}
							whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
						>
							<AnimatePresence mode='wait'>
								{isVisible ? (
									<motion.span
										key='hide'
										initial={{ opacity: 0, rotate: shouldReduceMotion ? 0 : -45 }}
										animate={{ opacity: 1, rotate: 0 }}
										exit={{ opacity: 0, rotate: shouldReduceMotion ? 0 : 45 }}
										transition={iconTransition}
									>
										<ViewOffSlashIcon className='size-3.5' aria-hidden='true' />
									</motion.span>
								) : (
									<motion.span
										key='show'
										initial={{ opacity: 0, rotate: shouldReduceMotion ? 0 : 45 }}
										animate={{ opacity: 1, rotate: 0 }}
										exit={{ opacity: 0, rotate: shouldReduceMotion ? 0 : -45 }}
										transition={iconTransition}
									>
										<ViewIcon className='size-3.5' aria-hidden='true' />
									</motion.span>
								)}
							</AnimatePresence>
						</motion.button>
					</TooltipTrigger>
					<TooltipContent side='top'>
						<p>{isVisible ? 'Hide value' : 'Reveal value'}</p>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<motion.button
							type='button'
							onClick={handleCopy}
							className='p-1 px-2 rounded hover:bg-accent transition-all text-muted-foreground hover:text-foreground'
							aria-label={`Copy ${envKey}`}
							whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
						>
							<AnimatePresence mode='wait'>
								{copied ? (
									<motion.span
										key='copied'
										initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
										transition={{ duration: 0.15, ease: easeOut }}
									>
										<CheckmarkCircle02Icon className='size-3.5 text-emerald-500' aria-hidden='true' />
									</motion.span>
								) : (
									<motion.span
										key='copy'
										initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
										transition={{ duration: 0.15, ease: easeOut }}
									>
										<Copy01Icon className='size-3.5' aria-hidden='true' />
									</motion.span>
								)}
							</AnimatePresence>
						</motion.button>
					</TooltipTrigger>
					<TooltipContent side='top'>
						<p>{copied ? 'Copied!' : 'Copy variable'}</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</motion.li>
	);
}

function DecryptingState({ reducedMotion }: { reducedMotion: boolean | null }) {
	return (
		<motion.div
			key='decrypting'
			variants={stateVariants}
			initial='initial'
			animate='animate'
			exit='exit'
			className='flex flex-col items-center justify-center gap-3 py-8'
		>
			<motion.div
				className='relative'
				animate={reducedMotion ? undefined : { rotate: [0, -8, 8, -8, 0] }}
				transition={{
					duration: 0.5,
					repeat: Number.POSITIVE_INFINITY,
					repeatDelay: 1,
					ease: easeOut,
				}}
			>
				<LockKeyIcon className='size-6 text-primary/70' />
				<motion.div
					className='absolute inset-0 rounded-full bg-primary/20'
					animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
					transition={{
						duration: 1.2,
						repeat: Number.POSITIVE_INFINITY,
						ease: 'easeInOut',
					}}
				/>
			</motion.div>
			<motion.span
				className='text-sm text-muted-foreground'
				animate={{ opacity: [0.6, 1, 0.6] }}
				transition={{
					duration: 1.2,
					repeat: Number.POSITIVE_INFINITY,
					ease: 'easeInOut',
				}}
			>
				Decrypting secrets…
			</motion.span>
		</motion.div>
	);
}

function ErrorState({ message, reducedMotion }: { message: string; reducedMotion: boolean | null }) {
	return (
		<motion.div
			key='error'
			variants={stateVariants}
			initial='initial'
			animate='animate'
			exit='exit'
			className='flex flex-col items-center justify-center gap-2 py-8'
		>
			<motion.div
				initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.2, ease: easeOut }}
			>
				<Alert02Icon className='size-6 text-destructive' />
			</motion.div>
			<span className='text-sm font-medium text-destructive'>Decryption Failed</span>
			<span className='text-xs text-muted-foreground max-w-xs text-center px-4'>
				{message || 'Unable to load environment content'}
			</span>
		</motion.div>
	);
}

function EmptyState() {
	return (
		<motion.div
			key='empty'
			variants={stateVariants}
			initial='initial'
			animate='animate'
			exit='exit'
			className='flex flex-col items-center justify-center gap-2 py-8'
		>
			<LockKeyIcon className='size-5 text-muted-foreground/50' />
			<span className='text-sm text-muted-foreground'>No variables found</span>
		</motion.div>
	);
}

function VariablesList({ variables }: { variables: Array<{ key: string; value: string }> }) {
	return (
		<motion.ul
			key='variables'
			variants={containerVariants}
			initial='hidden'
			animate='visible'
			exit='exit'
			role='list'
			aria-label='Environment variables'
		>
			{variables.map(({ key, value }) => (
				<EnvVariableRow key={key} envKey={key} value={value} />

			))}
		</motion.ul>
	);
}

export function EnvFileCard({ env }: EnvFileCardProps) {
	const shouldReduceMotion = useReducedMotion();
	const { decryptedContent, isDecrypting, error: decryptError } = useEnvDecrypt({
		encryptedContent: env.content,
		enabled: true,
	});

	const parsedVariables = decryptedContent ? parseEnvContent(decryptedContent) : [];

	return (
		<motion.article
			initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, ease: easeOutQuint }}
			className='w-full p-1 rounded-xl bg-muted/50 transition-colors hover:bg-muted/70'
			aria-labelledby={`env-file-${env.id}`}
		>
			<div className='flex items-center justify-between p-2 px-4'>
				<div className='flex flex-col min-w-0'>
					<h3 id={`env-file-${env.id}`} className='font-normal text-foreground flex items-center gap-2'>
						{env.fileName}
						<motion.span
							initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.08, duration: 0.2, ease: easeOut }}
							className='text-[10px] font-mono font-normal text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded border'
						>
							{env.id.slice(0, 12)}…
						</motion.span>
					</h3>
					<span className='text-xs text-muted-foreground'>
						{env.envCount} variable{env.envCount !== 1 ? 's' : ''} • {formatRelativeTime(env.updatedAt)}
					</span>
				</div>
			</div>

			<div className='rounded-lg bg-background border overflow-hidden'>
				<div className='px-1 py-1 '>
					<AnimatePresence mode='wait'>
						{isDecrypting ? (
							<DecryptingState reducedMotion={shouldReduceMotion} />
						) : decryptError ? (
							<ErrorState message={decryptError.message} reducedMotion={shouldReduceMotion} />
						) : parsedVariables.length === 0 ? (
							<EmptyState />
						) : (
							<VariablesList variables={parsedVariables} />
						)}
					</AnimatePresence>
				</div>
			</div>
		</motion.article>
	);
}
