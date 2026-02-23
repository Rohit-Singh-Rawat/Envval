import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@envval/ui/components/tooltip";
import {
	Alert02Icon,
	CheckmarkCircle02Icon,
	Copy01Icon,
	LockKeyIcon,
	ViewIcon,
	ViewOffSlashIcon,
} from "hugeicons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useEnvDecrypt } from "@/hooks/envs/use-env-decrypt";
import {
	EASE_OUT as easeOut,
	EASE_OUT_QUINT as easeOutQuint,
} from "@/lib/animation";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Environment } from "./types";

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

interface EnvFileCardProps {
	env: Environment;
	repoId: string;
}

function parseEnvContent(
	content: string,
): Array<{ key: string; value: string }> {
	if (!content) return [];

	return content
		.split("\n")
		.filter((line) => {
			const trimmed = line.trim();
			return trimmed && !trimmed.startsWith("#");
		})
		.map((line) => {
			const eqIndex = line.indexOf("=");
			if (eqIndex === -1) return null;

			const key = line.slice(0, eqIndex).trim();
			let value = line.slice(eqIndex + 1).trim();

			// Remove surrounding quotes if present
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
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

	const maskedValue = isVisible
		? value
		: "*".repeat(Math.min(value.length, 24));

	const valueTransition = shouldReduceMotion
		? { duration: 0.15 }
		: { duration: 0.18, ease: easeOut };

	const iconTransition = shouldReduceMotion
		? { duration: 0.1 }
		: { duration: 0.12, ease: easeOut };

	return (
		<motion.li
			variants={itemVariants}
			className="group flex relative items-center justify-between py-2 px-3 rounded-md hover:bg-muted/30 transition-colors font-mono text-sm after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-muted last:after:hidden"
		>
			<div className="flex items-center gap-2 min-w-0">
				<span className="text-primary/80 font-medium shrink-0">{envKey}</span>
				<span className="text-muted-foreground">=</span>
				<AnimatePresence mode="wait">
					<motion.span
						key={isVisible ? "visible" : "hidden"}
						initial={{
							opacity: 0,
							filter: shouldReduceMotion ? "none" : "blur(2px)",
						}}
						animate={{ opacity: 1, filter: "blur(0px)" }}
						exit={{
							opacity: 0,
							filter: shouldReduceMotion ? "none" : "blur(2px)",
						}}
						transition={valueTransition}
						className={cn(
							"truncate font-zodiak",
							isVisible
								? "text-foreground"
								: "text-muted-foreground select-none",
						)}
						aria-label={isVisible ? value : "Hidden value"}
					>
						{maskedValue}
					</motion.span>
				</AnimatePresence>
			</div>
			<div className="flex items-center gap-1 shrink-0 ml-4">
				<Tooltip>
					<TooltipTrigger asChild>
						<motion.button
							type="button"
							onClick={() => setIsVisible(!isVisible)}
							className="p-1 px-2 rounded hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
							aria-label={isVisible ? "Hide value" : "Show value"}
							whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
						>
							<AnimatePresence mode="wait">
								{isVisible ? (
									<motion.span
										key="hide"
										initial={{
											opacity: 0,
											rotate: shouldReduceMotion ? 0 : -45,
										}}
										animate={{ opacity: 1, rotate: 0 }}
										exit={{ opacity: 0, rotate: shouldReduceMotion ? 0 : 45 }}
										transition={iconTransition}
									>
										<ViewOffSlashIcon className="size-3.5" aria-hidden="true" />
									</motion.span>
								) : (
									<motion.span
										key="show"
										initial={{
											opacity: 0,
											rotate: shouldReduceMotion ? 0 : 45,
										}}
										animate={{ opacity: 1, rotate: 0 }}
										exit={{ opacity: 0, rotate: shouldReduceMotion ? 0 : -45 }}
										transition={iconTransition}
									>
										<ViewIcon className="size-3.5" aria-hidden="true" />
									</motion.span>
								)}
							</AnimatePresence>
						</motion.button>
					</TooltipTrigger>
					<TooltipContent side="top">
						<p>{isVisible ? "Hide value" : "Reveal value"}</p>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<motion.button
							type="button"
							onClick={handleCopy}
							className="p-1 px-2 rounded hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
							aria-label={`Copy ${envKey}`}
							whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
						>
							<AnimatePresence mode="wait">
								{copied ? (
									<motion.span
										key="copied"
										initial={{
											opacity: 0,
											scale: shouldReduceMotion ? 1 : 0.95,
										}}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
										transition={{ duration: 0.15, ease: easeOut }}
									>
										<CheckmarkCircle02Icon
											className="size-3.5 text-emerald-500"
											aria-hidden="true"
										/>
									</motion.span>
								) : (
									<motion.span
										key="copy"
										initial={{
											opacity: 0,
											scale: shouldReduceMotion ? 1 : 0.95,
										}}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
										transition={{ duration: 0.15, ease: easeOut }}
									>
										<Copy01Icon className="size-3.5" aria-hidden="true" />
									</motion.span>
								)}
							</AnimatePresence>
						</motion.button>
					</TooltipTrigger>
					<TooltipContent side="top">
						<p>{copied ? "Copied!" : "Copy variable"}</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</motion.li>
	);
}

function DecryptingState({ reducedMotion }: { reducedMotion: boolean | null }) {
	return (
		<motion.div
			key="decrypting"
			variants={stateVariants}
			initial="initial"
			animate="animate"
			exit="exit"
			className="flex flex-col items-center justify-center gap-3 py-8"
		>
			<motion.div
				className="relative"
				animate={reducedMotion ? undefined : { rotate: [0, -8, 8, -8, 0] }}
				transition={{
					duration: 0.5,
					repeat: Number.POSITIVE_INFINITY,
					repeatDelay: 1,
					ease: easeOut,
				}}
			>
				<LockKeyIcon className="size-6 text-primary/70" />
				<motion.div
					className="absolute inset-0 rounded-full bg-primary/20"
					animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
					transition={{
						duration: 1.2,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				/>
			</motion.div>
			<motion.span
				className="text-sm text-muted-foreground"
				animate={{ opacity: [0.6, 1, 0.6] }}
				transition={{
					duration: 1.2,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut",
				}}
			>
				Decrypting secrets…
			</motion.span>
		</motion.div>
	);
}

function ErrorState({
	message,
	reducedMotion,
}: {
	message: string;
	reducedMotion: boolean | null;
}) {
	return (
		<motion.div
			key="error"
			variants={stateVariants}
			initial="initial"
			animate="animate"
			exit="exit"
			className="flex flex-col items-center justify-center gap-2 py-8"
		>
			<motion.div
				initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.2, ease: easeOut }}
			>
				<Alert02Icon className="size-6 text-destructive" />
			</motion.div>
			<span className="text-sm font-medium text-destructive">
				Decryption Failed
			</span>
			<span className="text-xs text-muted-foreground max-w-xs text-center px-4">
				{message || "Unable to load environment content"}
			</span>
		</motion.div>
	);
}

function EmptyState() {
	const shouldReduceMotion = useReducedMotion();

	const svgVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				duration: 0.3,
				ease: easeOut,
			},
		},
	};

	const pathVariants = {
		hidden: {
			pathLength: 0,
			opacity: 0,
		},
		visible: (i: number) => ({
			pathLength: 1,
			opacity: 1,
			transition: {
				pathLength: {
					delay: i * 0.15,
					duration: 0.8,
					ease: easeOutQuint,
				},
				opacity: {
					delay: i * 0.15,
					duration: 0.3,
				},
			},
		}),
	};

	const textVariants = {
		hidden: {
			opacity: 0,
			y: 6,
		},
		visible: (i: number) => ({
			opacity: 1,
			y: 0,
			transition: {
				delay: 0.9 + i * 0.15,
				duration: 0.3,
				ease: easeOut,
			},
		}),
	};

	return (
		<motion.div
			key="empty"
			variants={stateVariants}
			initial="initial"
			animate="animate"
			exit="exit"
			className="flex flex-col items-center justify-center gap-3 py-4"
		>
			<motion.svg
				width="48"
				height="48"
				viewBox="0 0 104 81"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				strokeWidth="1.5px"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="w-12 h-12 text-muted-foreground/60"
				aria-hidden="true"
				variants={shouldReduceMotion ? undefined : svgVariants}
			>
				<motion.path
					d="M91.6942 7.91211C85.0142 4.05211 77.0242 2.12205 67.7042 2.10205C58.3942 2.10205 50.4142 3.99227 43.7842 7.82227C38.6742 10.7723 35.5342 14.2821 34.3542 18.3521C34.0642 19.3621 33.9042 20.3621 33.8842 21.3521V22.1621C34.0242 24.8721 35.1641 27.5022 37.3141 30.0522L35.9242 30.8621H33.8842L25.5442 30.842C24.7442 30.842 24.0342 30.922 23.4042 31.092C22.7642 31.262 22.1842 31.5023 21.6542 31.8123C21.1242 32.1223 20.7142 32.4523 20.4142 32.8223C20.1142 33.1823 19.9742 33.5922 19.9742 34.0522L20.0042 40.0522L7.53418 40.8921C6.80418 40.9321 6.10415 41.0422 5.44415 41.2322C4.77415 41.4222 4.2142 41.6922 3.7442 42.0322C3.2842 42.3822 2.95415 42.7421 2.75415 43.1321C2.62415 43.3721 2.55418 43.6321 2.53418 43.8921V44.0022C2.53418 44.1122 2.54415 44.232 2.56415 44.342L3.92419 55.4622C3.98419 55.8822 4.17418 56.2821 4.47418 56.6421C4.77418 57.0121 5.19418 57.3521 5.72418 57.6521C6.26418 57.9621 6.84418 58.1823 7.47418 58.3223C8.11418 58.4523 8.76419 58.5222 9.42419 58.5222L17.6142 58.5422C18.4042 58.5422 19.1542 58.4622 19.8542 58.2822C19.9042 58.2722 19.9542 58.2622 19.9942 58.2422C20.6342 58.0822 21.2042 57.8523 21.6942 57.5723L33.3242 50.8521L36.4942 49.0222L50.9142 40.6921L53.3342 39.3022C59.4642 41.0022 66.0742 41.5822 73.1542 41.0422C77.0642 40.7422 80.7142 40.0522 84.1042 38.9622C86.8542 38.0922 89.4342 36.9623 91.8442 35.5723C93.8942 34.3923 95.6242 33.1322 97.0342 31.8022C100.174 28.8422 101.744 25.512 101.744 21.832V21.7622C101.714 16.3822 98.3642 11.7621 91.6942 7.91211ZM84.1042 24.5422C83.3442 26.0622 81.9142 27.4221 79.8242 28.6321C76.5142 30.5521 72.5242 31.5022 67.8642 31.4922C63.2042 31.4822 59.2141 30.512 55.8741 28.592C53.7441 27.362 52.2842 25.9721 51.5142 24.4221C51.0742 23.5521 50.8542 22.6321 50.8442 21.6621C50.8342 18.9721 52.4842 16.6722 55.7942 14.7622C59.1142 12.8422 63.1042 11.8921 67.7542 11.9021C72.4142 11.9121 76.4142 12.8722 79.7542 14.8022C83.0842 16.7322 84.7642 19.0422 84.7742 21.7222C84.7842 22.7122 84.5642 23.6522 84.1042 24.5422Z"
					stroke="currentColor"
					strokeLinejoin="round"
					variants={shouldReduceMotion ? undefined : pathVariants}
					custom={0}
				/>
				<motion.path
					d="M84.7738 21.7222C84.7838 22.7122 84.5638 23.6523 84.1038 24.5423C83.3438 26.0623 81.9138 27.4222 79.8238 28.6322C76.5138 30.5522 72.5238 31.5023 67.8638 31.4923C63.2038 31.4823 59.2138 30.5121 55.8738 28.5921C53.7438 27.3621 52.2838 25.9722 51.5138 24.4222C51.0738 23.5522 50.8538 22.6322 50.8438 21.6622C50.8338 18.9722 52.4838 16.6723 55.7938 14.7623C59.1138 12.8423 63.1038 11.8922 67.7538 11.9022C72.4138 11.9122 76.4138 12.8723 79.7538 14.8023C83.0838 16.7323 84.7638 19.0422 84.7738 21.7222Z"
					stroke="currentColor"
					strokeLinejoin="round"
					variants={shouldReduceMotion ? undefined : pathVariants}
					custom={1}
				/>
				<motion.path
					d="M53.3342 39.3022V59.3022L21.6942 77.5723C21.1642 77.8723 20.5542 78.1122 19.8542 78.2822C19.1542 78.4622 18.4042 78.5422 17.6142 78.5422L9.42419 78.5222C8.76419 78.5222 8.11418 78.4523 7.47418 78.3223C6.84418 78.1823 6.26418 77.9621 5.72418 77.6521C5.19418 77.3521 4.77418 77.0121 4.47418 76.6421C4.17418 76.2821 3.98419 75.8822 3.92419 75.4622L2.56415 64.342C2.54415 64.242 2.53418 64.1222 2.53418 64.0222V44.0022C2.53418 44.1122 2.54415 44.232 2.56415 44.342L3.92419 55.4622C3.98419 55.8822 4.17418 56.2821 4.47418 56.6421C4.77418 57.0121 5.19418 57.3521 5.72418 57.6521C6.26418 57.9621 6.84418 58.1823 7.47418 58.3223C8.11418 58.4523 8.76419 58.5222 9.42419 58.5222L17.6142 58.5422C18.4042 58.5422 19.1542 58.4622 19.8542 58.2822C19.9042 58.2722 19.9542 58.2622 19.9942 58.2422C20.6342 58.0822 21.2042 57.8523 21.6942 57.5723L33.3242 50.8521L36.4942 49.0222L50.9142 40.6921L53.3342 39.3022Z"
					stroke="currentColor"
					strokeLinejoin="round"
					variants={shouldReduceMotion ? undefined : pathVariants}
					custom={2}
				/>
				<motion.path
					d="M101.744 21.832V41.7622C101.774 47.1322 98.474 51.7423 91.844 55.5723C86.464 58.6723 80.244 60.4922 73.154 61.0422C66.074 61.5822 59.464 61.0022 53.334 59.3022V39.3022C59.464 41.0022 66.074 41.5822 73.154 41.0422C77.064 40.7422 80.714 40.0522 84.104 38.9622C86.854 38.0922 89.434 36.9623 91.844 35.5723C93.894 34.3923 95.624 33.1322 97.034 31.8022C100.174 28.8422 101.744 25.512 101.744 21.832Z"
					stroke="currentColor"
					strokeLinejoin="round"
					variants={shouldReduceMotion ? undefined : pathVariants}
					custom={3}
				/>
				<motion.path
					d="M37.3138 30.0522L35.9238 30.8621H33.8838V22.1621C34.0238 24.8721 35.1638 27.5022 37.3138 30.0522Z"
					stroke="currentColor"
					strokeLinejoin="round"
					variants={shouldReduceMotion ? undefined : pathVariants}
					custom={4}
				/>
				<motion.path
					d="M33.8838 21.3521V20.9822"
					stroke="currentColor"
					strokeLinejoin="round"
					variants={shouldReduceMotion ? undefined : pathVariants}
					custom={5}
				/>
			</motion.svg>
			<motion.span
				className="text-sm text-muted-foreground"
				variants={shouldReduceMotion ? undefined : textVariants}
				custom={0}
			>
				No variables found
			</motion.span>
			<motion.span
				className="text-xs text-muted-foreground/70 max-w-[240px] text-center"
				variants={shouldReduceMotion ? undefined : textVariants}
				custom={1}
			>
				Add environment variables to this file to get started
			</motion.span>
		</motion.div>
	);
}

function VariablesList({
	variables,
}: {
	variables: Array<{ key: string; value: string }>;
}) {
	return (
		<motion.ul
			key="variables"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
			exit="exit"
			role="list"
			aria-label="Environment variables"
		>
			{variables.map(({ key, value }) => (
				<EnvVariableRow key={key} envKey={key} value={value} />
			))}
		</motion.ul>
	);
}

export function EnvFileCard({ env }: EnvFileCardProps) {
	const shouldReduceMotion = useReducedMotion();
	const {
		decryptedContent,
		isDecrypting,
		error: decryptError,
	} = useEnvDecrypt({
		encryptedContent: env.content,
		enabled: true,
	});

	const parsedVariables = decryptedContent
		? parseEnvContent(decryptedContent)
		: [];

	return (
		<motion.article
			initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, ease: easeOutQuint }}
			className="w-full p-1 rounded-xl bg-muted/50 transition-colors hover:bg-muted/70"
			aria-labelledby={`env-file-${env.id}`}
		>
			<div className="flex items-center justify-between p-2 px-4">
				<div className="flex flex-col min-w-0">
					<h3
						id={`env-file-${env.id}`}
						className="font-normal text-foreground flex items-center gap-2"
					>
						{env.fileName}
						<motion.span
							initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.08, duration: 0.2, ease: easeOut }}
							className="text-[10px] font-mono font-normal text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded border"
						>
							{env.id.slice(0, 12)}…
						</motion.span>
					</h3>
					<span className="text-xs text-muted-foreground">
						{env.envCount} variable{env.envCount !== 1 ? "s" : ""} •{" "}
						{formatRelativeTime(env.updatedAt)}
					</span>
				</div>
			</div>

			<div className="rounded-lg bg-background border overflow-hidden">
				<div className="px-1 py-1 ">
					<AnimatePresence mode="wait">
						{isDecrypting ? (
							<DecryptingState reducedMotion={shouldReduceMotion} />
						) : decryptError ? (
							<ErrorState
								message={decryptError.message}
								reducedMotion={shouldReduceMotion}
							/>
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
