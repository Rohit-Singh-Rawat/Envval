import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useAnimate, useInView, AnimatePresence } from 'motion/react';
import type { HugeiconsProps } from 'hugeicons-react';
import {
	ComputerIcon,
	SmartPhone01Icon,
	Globe02Icon,
	LaptopIcon,
	Tablet01Icon,
} from 'hugeicons-react';
import { EASE_OUT, EASE_IN_OUT } from '@/lib/animation';

type IconComponent = React.FC<Omit<HugeiconsProps, 'ref'>>;

type DeviceData = {
	name: string;
	type: string;
	icon: IconComponent;
	active: boolean;
	color: string;
	colorLight: string;
	textColor: string;
};

type EnvVariable = { key: string; val: string; visible: boolean };

type EnvFileData = {
	name: string;
	id: string;
	vars: number;
	updated: string;
	variables: EnvVariable[];
};

const BASE_LOCAL_VARS: EnvVariable[] = [
	{ key: 'DATABASE_URL', val: 'pg://admin:***@db.io', visible: true },
	{ key: 'API_SECRET', val: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', visible: false },
	{ key: 'STRIPE_KEY', val: 'pk_live_51HG...', visible: true },
];

const REDIS_VAR: EnvVariable = { key: 'REDIS_URL', val: 'redis://cache:6379', visible: true };

const ENV_FILES: EnvFileData[] = [
	{ name: '.env.local', id: 'env_a3f8c2', vars: 12, updated: '2m ago', variables: BASE_LOCAL_VARS },
	{
		name: '.env.production',
		id: 'env_7b2d91',
		vars: 8,
		updated: '1h ago',
		variables: [
			{ key: 'NODE_ENV', val: 'production', visible: true },
			{ key: 'JWT_SECRET', val: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', visible: false },
		],
	},
];

const FOREGROUND_DEVICES: DeviceData[] = [
	{ name: 'MacBook Pro', type: 'VS Code', icon: ComputerIcon, active: true, color: 'bg-violet-500', colorLight: 'bg-violet-500/10', textColor: 'text-violet-600' },
	{ name: 'iPhone 15', type: 'Safari', icon: SmartPhone01Icon, active: true, color: 'bg-blue-500', colorLight: 'bg-blue-500/10', textColor: 'text-blue-600' },
	{ name: 'Work Desktop', type: 'Chrome', icon: Globe02Icon, active: false, color: 'bg-amber-500', colorLight: 'bg-amber-500/10', textColor: 'text-amber-600' },
	{ name: 'iPad Pro', type: 'App', icon: Tablet01Icon, active: true, color: 'bg-emerald-500', colorLight: 'bg-emerald-500/10', textColor: 'text-emerald-600' },
];

const BACKGROUND_DEVICES: DeviceData[] = [
	{ name: 'Linux Server', type: 'SSH', icon: LaptopIcon, active: true, color: 'bg-rose-500', colorLight: 'bg-rose-500/10', textColor: 'text-rose-600' },
	{ name: 'Staging VM', type: 'Docker', icon: Globe02Icon, active: true, color: 'bg-cyan-500', colorLight: 'bg-cyan-500/10', textColor: 'text-cyan-600' },
];

const DEVICE_POSITIONS: React.CSSProperties[] = [
	{ left: 0, top: 80 },
	{ left: 0, bottom: 16 },
	{ right: 0, top: 90 },
	{ right: 0, bottom: 16 },
];

const BG_DEVICE_POSITIONS: React.CSSProperties[] = [
	{ left: 6, top: 24 },
	{ right: 6, top: 40 },
];

const FG_HOVER_TRANSFORMS = [
	{ rotateX: -3, rotateY: 5, z: 40 },
	{ rotateX: 4, rotateY: 4, z: 35 },
	{ rotateX: -3, rotateY: -5, z: 40 },
	{ rotateX: -4, rotateY: -6, z: 45 },
] as const;

function DeviceCard({ device, activeOverride }: { device: DeviceData; activeOverride?: boolean }) {
	const isActive = activeOverride ?? device.active;
	const Icon = device.icon;
	const statusClasses = isActive
		? `${device.colorLight} ${device.textColor}`
		: 'bg-muted-foreground/5 text-muted-foreground/40';

	return (
		<div className='rounded-lg border border-border bg-card p-1.5 flex items-center gap-2 h-[42px]'>
			<div className='size-7 rounded-sm bg-muted/50 flex items-center justify-center shrink-0'>
				<Icon size={16} className={device.textColor} strokeWidth={1.8} />
			</div>
			<div className='flex flex-col min-w-0 flex-1 leading-tight'>
				<div className='text-[11px] font-medium text-foreground/85 leading-tight truncate gap-1 flex items-center'>
					{device.name}
					<AnimatePresence mode='wait' initial={false}>
						<motion.span
							key={isActive ? 'active' : 'offline'}
							className={`inline-flex items-center h-full text-[8px] font-medium px-1.5 py-px rounded-full shrink-0 leading-tight ${statusClasses}`}
							initial={{ opacity: 0, filter: 'blur(4px)' }}
							animate={{ opacity: 1, filter: 'blur(0px)' }}
							exit={{ opacity: 0, filter: 'blur(4px)' }}
							transition={{ duration: 0.25, ease: EASE_OUT }}
						>
							{isActive ? 'active' : 'offline'}
						</motion.span>
					</AnimatePresence>
				</div>
				<span className='text-[9px] text-muted-foreground/50 leading-tight'>{device.type}</span>
			</div>
		</div>
	);
}

function EnvVariableRow({ variable }: { variable: EnvVariable }) {
	return (
		<div className='flex items-center py-[5px] px-3 font-mono'>
			<span className='text-[10px] font-medium text-primary/80'>{variable.key}</span>
			<span className='text-[10px] text-muted-foreground/30'>=</span>
			<span className={`text-[9px] truncate ${variable.visible ? 'text-foreground/55' : 'text-muted-foreground/35'}`}>
				{variable.val}
			</span>
		</div>
	);
}

function EnvFileCard({ file, variables }: { file: EnvFileData; variables: EnvVariable[] }) {
	return (
		<div className='rounded-xl bg-muted/50 p-1'>
			<div className='flex items-center justify-between p-2 px-3'>
				<div className='flex items-center gap-2'>
					<span className='text-[11px] font-medium text-foreground/85'>{file.name}</span>
					<span className='text-[8px] font-mono text-muted-foreground/45 bg-background/50 border border-border/50 px-1.5 py-px rounded hidden sm:inline'>
						{file.id}
					</span>
				</div>
				<span className='text-[8px] text-muted-foreground/40'>
					{file.vars} vars &middot; {file.updated}
				</span>
			</div>
			<div className='rounded-lg bg-background border border-border overflow-hidden'>
				<div className='px-1 py-0.5'>
					<AnimatePresence initial={false}>
						{variables.map((v, i) => (
							<motion.div
								key={v.key}
								initial={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
								animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
								exit={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
								transition={{ duration: 0.7, ease: EASE_IN_OUT }}
								style={i > 0 ? { borderTop: '0.5px solid var(--color-border)' } : undefined}
							>
								<EnvVariableRow variable={v} />
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}

function WindowChrome({ title, children }: { title: string; children?: React.ReactNode }) {
	return (
		<div className='flex items-center justify-between h-7 border-b border-border bg-muted/50 px-4'>
			<div className='flex items-center gap-1.5' aria-hidden='true'>
				<span className='size-[7px] rounded-full bg-muted-foreground/20' />
				<span className='size-[7px] rounded-full bg-muted-foreground/20' />
				<span className='size-[7px] rounded-full bg-muted-foreground/20' />
			</div>
			<span className='text-[10px] text-muted-foreground/50 font-medium'>{title}</span>
			{children ?? <div className='w-14' />}
		</div>
	);
}

function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

type AnimateFn = ReturnType<typeof useAnimate>[1];
type CancelledFn = () => boolean;

async function runSequence(
	animate: AnimateFn,
	cancelled: CancelledFn,
	setLocalVars: React.Dispatch<React.SetStateAction<EnvVariable[]>>,
	setDeviceOverrides: React.Dispatch<React.SetStateAction<Record<number, boolean>>>,
) {
	await sleep(1800);
	if (cancelled()) return;

	while (!cancelled()) {
		setDeviceOverrides((prev) => ({ ...prev, 2: true }));
		await animate('.fg-device-2', { opacity: 1, scale: 1, filter: 'blur(0px)' }, { duration: 0.7, ease: EASE_OUT });
		await sleep(1200);
		if (cancelled()) return;

		setLocalVars((prev) => [...prev, REDIS_VAR]);
		await sleep(2000);
		if (cancelled()) return;

		setDeviceOverrides((prev) => ({ ...prev, 1: false }));
		await animate('.fg-device-1', { opacity: 0, scale: 0.96, filter: 'blur(6px)' }, { duration: 0.85, ease: EASE_IN_OUT });
		await sleep(1000);
		if (cancelled()) return;

		setLocalVars((prev) => prev.filter((v) => v.key !== 'STRIPE_KEY' && v.key !== 'REDIS_URL'));
		await sleep(1500);
		if (cancelled()) return;

		setDeviceOverrides((prev) => ({ ...prev, 1: true }));
		await animate('.fg-device-1', { opacity: 1, scale: 1, filter: 'blur(0px)' }, { duration: 0.7, ease: EASE_OUT });
		await sleep(1200);
		if (cancelled()) return;

		setLocalVars((prev) => [...prev, BASE_LOCAL_VARS[2]]);
		await sleep(1500);
		if (cancelled()) return;

		setDeviceOverrides((prev) => ({ ...prev, 2: false, 3: false }));
		await Promise.all([
			animate('.fg-device-2', { opacity: 0, scale: 0.96, filter: 'blur(6px)' }, { duration: 0.85, ease: EASE_IN_OUT }),
			animate('.fg-device-3', { opacity: 0, scale: 0.96, filter: 'blur(6px)' }, { duration: 0.85, ease: EASE_IN_OUT }),
		]);
		await sleep(1500);
		if (cancelled()) return;

		setDeviceOverrides((prev) => ({ ...prev, 3: true }));
		await animate('.fg-device-3', { opacity: 1, scale: 1, filter: 'blur(0px)' }, { duration: 0.7, ease: EASE_OUT });
		await sleep(1200);
		if (cancelled()) return;

		setDeviceOverrides({});
		setLocalVars([...BASE_LOCAL_VARS]);
		await animate('.fg-device-2', { opacity: 1, scale: 1, filter: 'blur(0px)' }, { duration: 0 });
		await sleep(800);
	}
}

const CommandCenterIllustration = () => {
	const [scope, animate] = useAnimate();
	const isInView = useInView(scope, { once: true, margin: '-60px' });
	const [phase, setPhase] = useState(0);
	const [hovered, setHovered] = useState(false);
	const [localVars, setLocalVars] = useState<EnvVariable[]>([...BASE_LOCAL_VARS]);
	const [deviceOverrides, setDeviceOverrides] = useState<Record<number, boolean>>({});
	const generationRef = useRef(0);
	const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

	useEffect(() => {
		if (!isInView) return;
		timers.current.push(setTimeout(() => setPhase(1), 200));
		timers.current.push(setTimeout(() => setPhase(2), 600));
		return () => timers.current.forEach(clearTimeout);
	}, [isInView]);

	const startLoop = useCallback(async () => {
		const gen = ++generationRef.current;
		const cancelled = () => generationRef.current !== gen;
		await runSequence(animate, cancelled, setLocalVars, setDeviceOverrides);
	}, [animate]);

	useEffect(() => {
		if (isInView) {
			startLoop();
		} else {
			generationRef.current++;
		}
	}, [isInView, startLoop]);

	return (
		<div
			ref={scope}
			className='relative mx-3 overflow-hidden'
			style={{ height: 250, perspective: 800 }}
			role='img'
			aria-label='Command center showing environment files, connected devices, and project statistics'
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			{/* Background devices — hidden on small screens to prevent overflow */}
			{BACKGROUND_DEVICES.map((device, i) => (
				<motion.div
					key={device.name}
					className='absolute hidden sm:block'
					style={{ ...BG_DEVICE_POSITIONS[i], width: 155, filter: 'blur(1.5px)', zIndex: 0 }}
					initial={{ opacity: 0, y: 10 }}
					animate={isInView ? { opacity: 0.4, y: 0 } : {}}
					transition={{ duration: 0.65, delay: 0.1, ease: EASE_OUT }}
				>
					<DeviceCard device={device} />
				</motion.div>
			))}

			{/* Center window — uses percentage positioning to stay centered */}
			<motion.div
				className='absolute rounded-xl border border-border bg-card overflow-hidden left-1/2 -translate-x-1/2'
				style={{ top: 8, width: 'min(400px, calc(100% - 16px))', zIndex: 1 }}
				initial={{ opacity: 0, y: 14 }}
				animate={isInView ? { opacity: 1, y: 0 } : {}}
				transition={{ duration: 0.65, ease: EASE_OUT }}
			>
				<WindowChrome title='envval-web'>
					<div className='flex items-center gap-1.5'>
						<span className='size-1.5 rounded-full bg-emerald-500' />
						<span className='text-[9px] text-emerald-600/70 font-medium'>Synced</span>
					</div>
				</WindowChrome>

				<div className='p-3.5 bg-background'>
					<div className='flex items-center justify-between mb-3 px-0.5'>
						<span className='text-[12px] font-medium text-foreground/80'>Environment Files</span>
						<span className='text-[9px] text-muted-foreground/40'>{ENV_FILES.length} files</span>
					</div>
					<div className='space-y-2.5'>
						<EnvFileCard file={ENV_FILES[0]} variables={localVars} />
						{ENV_FILES.slice(1).map((file) => (
							<EnvFileCard key={file.name} file={file} variables={file.variables} />
						))}
					</div>
				</div>
			</motion.div>

			{/* Foreground device cards — hidden on small screens */}
			{FOREGROUND_DEVICES.map((device, i) => {
				const h = FG_HOVER_TRANSFORMS[i];
				return (
					<motion.div
						key={device.name}
						className={`absolute fg-device-${i} hidden sm:block`}
						style={{ ...DEVICE_POSITIONS[i], width: 155, zIndex: 2, transformStyle: 'preserve-3d' }}
						initial={{ opacity: 0, y: 16, x: i < 2 ? -10 : 10 }}
						animate={
							phase >= 2
								? {
										opacity: 1,
										y: 0,
										x: 0,
										rotateX: hovered ? h.rotateX : 0,
										rotateY: hovered ? h.rotateY : 0,
										z: hovered ? h.z : 0,
									}
								: {}
						}
						transition={{ duration: 0.6, delay: hovered ? 0 : 0.06 + i * 0.1, ease: EASE_OUT }}
					>
						<DeviceCard device={device} activeOverride={deviceOverrides[i]} />
					</motion.div>
				);
			})}
		</div>
	);
};

export default CommandCenterIllustration;
