import { createFileRoute } from "@tanstack/react-router";
import { Link01Icon } from "hugeicons-react";
import { motion, stagger, useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_dashboard/integrations")({
	component: IntegrationsPage,
});

const EASE_OUT = [0.32, 0.72, 0, 1] as const;

const ORBITS = [
	{
		radius: 55,
		duration: 20,
		reverse: false,
		icons: [
			{ Icon: GithubIcon, angle: 0 },
			{ Icon: TerminalIcon, angle: 180 },
		],
	},
	{
		radius: 100,
		duration: 28,
		reverse: true,
		icons: [
			{ Icon: VercelIcon, angle: 60 },
			{ Icon: DatabaseIcon, angle: 180 },
			{ Icon: CloudIcon, angle: 300 },
		],
	},
	{
		radius: 145,
		duration: 38,
		reverse: false,
		icons: [
			{ Icon: SlackIcon, angle: 30 },
			{ Icon: KeyIcon, angle: 150 },
			{ Icon: LockIcon, angle: 270 },
		],
	},
] as const;

function IntegrationsPage() {
	const [scope, animate] = useAnimate();
	const shouldReduceMotion = useReducedMotion();
	const [animationComplete, setAnimationComplete] = useState(false);

	useEffect(() => {
		if (shouldReduceMotion) {
			setAnimationComplete(true);
			return;
		}

		const runAnimation = async () => {
			await animate(
				"[data-center]",
				{ opacity: 1, scale: 1 },
				{ duration: 0.4, ease: EASE_OUT },
			);

			animate(
				'[data-ring="0"]',
				{ opacity: 1, pathLength: 1 },
				{ duration: 0.5, ease: EASE_OUT },
			);
			animate(
				'[data-ring="1"]',
				{ opacity: 1, pathLength: 1 },
				{ duration: 0.6, ease: EASE_OUT, delay: 0.1 },
			);
			await animate(
				'[data-ring="2"]',
				{ opacity: 1, pathLength: 1 },
				{ duration: 0.7, ease: EASE_OUT, delay: 0.2 },
			);

			animate(
				'[data-orbit="0"]',
				{ opacity: 1 },
				{ duration: 0.3, ease: EASE_OUT, delay: stagger(0.1) },
			);
			animate(
				'[data-orbit="1"]',
				{ opacity: 1 },
				{ duration: 0.3, ease: EASE_OUT, delay: stagger(0.1) },
			);
			await animate(
				'[data-orbit="2"]',
				{ opacity: 1 },
				{ duration: 0.3, ease: EASE_OUT, delay: stagger(0.1) },
			);

			await animate(
				"[data-text]",
				{ opacity: 1, y: 0 },
				{ duration: 0.5, ease: EASE_OUT },
			);

			setAnimationComplete(true);
		};

		runAnimation();
	}, [animate, shouldReduceMotion]);

	return (
		<div
			ref={scope}
			className="relative flex  flex-col items-center justify-center overflow-hidden px-8 -space-y-15"
		>
			<div className="relative flex size-[360px]  items-center justify-center mask-radial-[100%_35%] mask-radial-from-40%  mask-radial-at-center">
				<svg
					className="pointer-events-none absolute inset-0 size-full"
					viewBox="0 0 360 360"
				>
					{ORBITS.map((orbit, i) => (
						<motion.circle
							key={i}
							data-ring={i}
							cx={180}
							cy={180}
							r={orbit.radius}
							fill="none"
							stroke="currentColor"
							className={`text-primary/20`}
							strokeWidth={1}
							initial={{ opacity: 0, pathLength: 0 }}
						/>
					))}
				</svg>

				<motion.div
					data-center
					className="relative z-10 flex size-10 items-center  justify-center rounded-md squircle bg-primary "
					style={{ opacity: 0, scale: 0.5 }}
				>
					<Link01Icon width={24} height={24} className="text-background" />
				</motion.div>

				{ORBITS.map((orbit, orbitIndex) =>
					orbit.icons.map(({ Icon, angle }, iconIndex) => (
						<OrbitingIcon
							key={`${orbitIndex}-${iconIndex}`}
							angle={angle}
							radius={orbit.radius}
							duration={orbit.duration}
							orbit={orbitIndex}
							shouldAnimate={animationComplete}
							reverse={orbit.reverse}
						>
							<Icon />
						</OrbitingIcon>
					)),
				)}
			</div>

			<div
				data-text
				className="relative z-10 flex flex-col items-center gap-3 text-center"
				style={{ opacity: 0, transform: "translateY(16px)" }}
			>
				<h1 className="text-2xl font-medium tracking-tight text-foreground">
					Coming Soon
				</h1>
				<p className="max-w-xs text-pretty text-sm text-muted-foreground">
					A CLI to interact with your environment variables simply.
				</p>
			</div>
		</div>
	);
}

function OrbitingIcon({
	children,
	angle,
	radius,
	duration,
	orbit,
	shouldAnimate,
	reverse,
}: {
	children: React.ReactNode;
	angle: number;
	radius: number;
	duration: number;
	orbit: number;
	shouldAnimate: boolean;
	reverse: boolean;
}) {
	return (
		<div
			data-orbit={orbit}
			className="absolute left-1/2 top-1/2 -ml-4 -mt-4"
			style={
				{
					opacity: 0,
					"--angle": angle,
					"--radius": `${radius}px`,
					"--duration": `${duration}s`,
				} as React.CSSProperties
			}
		>
			<div
				className="flex size-8 items-center justify-center rounded-[7px] squircle bg-background border border-primary/20 text-primary backdrop-blur-sm"
				style={{
					animation: shouldAnimate
						? `orbit var(--duration) linear infinite${reverse ? " reverse" : ""}`
						: "none",
					transform: !shouldAnimate
						? `rotate(${angle}deg) translateY(calc(var(--radius) * -1)) rotate(${-angle}deg)`
						: undefined,
				}}
			>
				{children}
			</div>
		</div>
	);
}

function GithubIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
		</svg>
	);
}

function VercelIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
			<path d="M24 22.525H0l12-21.05 12 21.05z" />
		</svg>
	);
}

function TerminalIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polyline points="4 17 10 11 4 5" />
			<line x1="12" y1="19" x2="20" y2="19" />
		</svg>
	);
}

function SlackIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
			<path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
		</svg>
	);
}

function DatabaseIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<ellipse cx="12" cy="5" rx="9" ry="3" />
			<path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
			<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
		</svg>
	);
}

function CloudIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
		</svg>
	);
}

function KeyIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
		</svg>
	);
}

function LockIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" />
		</svg>
	);
}
