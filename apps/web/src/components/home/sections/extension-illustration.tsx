'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import {
	Refresh01Icon,
	ArrowRight01Icon,
	FileCode,
	File01Icon,
	Cancel01Icon,
	Loading03Icon,
	CloudIcon,
	MoreHorizontalIcon,
	Search01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';

import type { SVGProps } from 'react';

export function CloudAlertIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			width='1em'
			height='1em'
			viewBox='0 0 24 24'
			{...props}
		>
			{/* Icon from Material Symbols Light by Google - https://github.com/google/material-design-icons/blob/master/LICENSE */}
			<path
				fill='currentColor'
				d='M6.5 19q-1.871 0-3.185-1.301Q2 16.397 2 14.516q0-1.71 1.175-3.047t2.921-1.435q.337-2.185 2.01-3.61T12 5q2.507 0 4.254 1.747Q18 8.493 18 11v1h.616q1.436.046 2.41 1.055T22 15.5q0 1.471-1.014 2.486Q19.97 19 18.5 19zm0-1h12q1.05 0 1.775-.725T21 15.5t-.725-1.775T18.5 13H17v-2q0-2.075-1.463-3.538T12 6T8.463 7.463T7 11h-.5q-1.45 0-2.475 1.025T3 14.5t1.025 2.475T6.5 18m5.5-3.02q.214 0 .357-.143q.143-.144.143-.357t-.144-.356t-.357-.143t-.356.144t-.143.357t.144.356t.357.143m0-2.5q.213 0 .356-.144t.143-.356V9q0-.213-.144-.356t-.357-.144t-.356.144T11.5 9v2.98q0 .213.144.357t.357.144'
			/>
		</svg>
	);
}
/* ─── Mock Data ─── */

const FILES = {
	env: {
		name: '.env',
		icon: File01Icon,
		envType: 'Local',
		color: 'text-emerald-500',
		content: (
			<div className='font-mono text-xs sm:text-sm leading-6 select-text'>
				<div className='text-muted-foreground/50'># Local Environment</div>
				<div>
					<span className='text-purple-500'>DATABASE_URL</span>
					<span className='text-muted-foreground/60'>=</span>
					<span className='text-emerald-500'>"postgresql://localhost:5432/myapp"</span>
				</div>
				<div className='h-4' />
				<div className='text-muted-foreground/50'># Secrets</div>
				<div>
					<span className='text-purple-500'>JWT_SECRET</span>
					<span className='text-muted-foreground/60'>=</span>
					<span className='text-emerald-500'>"dev_secret"</span>
				</div>
			</div>
		),
	},
	staging: {
		name: '.env.staging',
		icon: File01Icon,
		envType: 'Staging',
		color: 'text-amber-500',
		content: (
			<div className='font-mono text-xs sm:text-sm leading-6 select-text'>
				<div className='text-muted-foreground/50'># Staging Environment</div>
				<div>
					<span className='text-purple-500'>DATABASE_URL</span>
					<span className='text-muted-foreground/60'>=</span>
					<span className='text-emerald-500'>"postgresql://staging-db.io:5432/myapp"</span>
				</div>
				<div className='h-4' />
				<div className='text-muted-foreground/50'># Secrets</div>
				<div>
					<span className='text-purple-500'>JWT_SECRET</span>
					<span className='text-muted-foreground/60'>=</span>
					<span className='text-emerald-500'>"staging_secret_8293"</span>
				</div>
			</div>
		),
	},
	production: {
		name: '.env.production',
		icon: File01Icon,
		envType: 'Production',
		color: 'text-rose-500',
		content: (
			<div className='font-mono text-xs sm:text-sm leading-6 select-text'>
				<div className='text-muted-foreground/50'># Production Environment</div>
				<div>
					<span className='text-purple-500'>DATABASE_URL</span>
					<span className='text-muted-foreground/60'>=</span>
					<span className='text-emerald-500'>"postgresql://prod-db.io:5432/myapp"</span>
				</div>
				<div className='h-4' />
				<div className='text-muted-foreground/50'># Secrets</div>
				<div>
					<span className='text-purple-500'>JWT_SECRET</span>
					<span className='text-muted-foreground/60'>=</span>
					<span className='text-emerald-500'>"prod_secret_9981"</span>
				</div>
			</div>
		),
	},
	ts: {
		name: 'index.ts',
		icon: FileCode,
		getContent: (hoveredEnv: string | null, setHoveredEnv: (key: string | null) => void) => (
			<div className='font-mono text-xs sm:text-sm leading-6 select-text'>
				<div>
					<span className='text-purple-500'>import</span>
					<span className='text-foreground/80'> </span>
					<span className='text-foreground/80'>{'{ env }'}</span>
					<span className='text-foreground/80'> </span>
					<span className='text-purple-500'>from</span>
					<span className='text-foreground/80'> </span>
					<span className='text-amber-500'>'./env'</span>
					<span className='text-muted-foreground/60'>;</span>
				</div>
				<div className='h-4' />
				<div>
					<span className='text-purple-500'>const</span>
					<span className='text-foreground/80'> </span>
					<span className='text-blue-500'>db</span>
					<span className='text-foreground/80'> </span>
					<span className='text-muted-foreground/60'>=</span>
					<span className='text-foreground/80'> </span>
					<span className='text-blue-500'>connect</span>
					<span className='text-muted-foreground/60'>(</span>

					{/* Interactive Env Var */}
					<span
						className='relative inline-flex items-center group cursor-help'
						onMouseEnter={() => setHoveredEnv('DATABASE_URL')}
						onMouseLeave={() => setHoveredEnv(null)}
					>
						<span className='text-foreground/80'>env</span>
						<span className='text-muted-foreground/60'>.</span>
						<span className='text-purple-500 border-b border-dashed border-muted-foreground/30'>
							DATABASE_URL
						</span>

						<AnimatePresence>
							{hoveredEnv === 'DATABASE_URL' && (
								<motion.div
									initial={{ opacity: 0, y: 4, scale: 0.98, filter: 'blur(4px)' }}
									animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
									exit={{ opacity: 0, y: 4, scale: 0.98, filter: 'blur(4px)' }}
									transition={{ duration: 0.2 }}
									className='absolute left-0 bottom-full mb-1 z-30 rounded-md border border-border bg-card shadow-xl overflow-hidden min-w-[240px]'
								>
									<div className='flex items-center gap-1.5 px-2.5 py-1 border-b border-border bg-muted/40 h-6 box-content'>
										<span className='text-[10px] text-muted-foreground font-medium'>
											.env (Local)
										</span>
									</div>
									<div className='px-2.5 py-2 flex items-baseline gap-0.5 bg-background'>
										<span className='text-[10px] font-mono text-emerald-500 font-medium'>
											"postgresql://localhost:5432/myapp"
										</span>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</span>

					<span className='text-muted-foreground/60'>)</span>
					<span className='text-muted-foreground/60'>;</span>
				</div>
			</div>
		),
	},
};

type FileKey = 'env' | 'staging' | 'production' | 'ts';

type FileInfo = {
	name: string;
	icon: typeof File01Icon | typeof FileCode;
	envType?: string;
	color?: string;
	content?: React.ReactNode;
	getContent?: (
		hoveredEnv: string | null,
		setHoveredEnv: (key: string | null) => void
	) => React.ReactNode;
};

/* ─── Components ─── */

const IconButton = ({
	icon,
	onClick,
	className,
	label,
}: {
	icon: typeof Refresh01Icon;
	onClick?: (e: React.MouseEvent) => void;
	className?: string;
	label?: string;
}) => (
	<button
		type='button'
		onClick={onClick}
		aria-label={label}
		className={cn(
			'p-1.5 hover:bg-muted/50 rounded-md transition-colors text-muted-foreground hover:text-foreground cursor-pointer shrink-0',
			className
		)}
	>
		<HugeiconsIcon
			icon={icon}
			className='size-3.5'
		/>
	</button>
);

/* ─── Main Component ─── */

const ExtensionIllustration = ({
	containerRef,
}: {
	containerRef?: React.RefObject<HTMLDivElement | null>;
}) => {
	// State
	const [activeTab, setActiveTab] = useState<FileKey | null>('ts');
	const [openTabs, setOpenTabs] = useState<FileKey[]>(['ts']);
	const [syncingEnvs, setSyncingEnvs] = useState<Record<string, boolean>>({});
	const [syncedEnvs, setSyncedEnvs] = useState<Record<string, boolean>>({
		env: true,
		staging: true,
		production: true,
	});
	const [hoveredEnv, setHoveredEnv] = useState<string | null>(null);

	// Drag controls
	const dragControls = useDragControls();

	// Handlers
	const toggleTab = (key: FileKey) => {
		if (!openTabs.includes(key)) {
			setOpenTabs([...openTabs, key]);
		}
		setActiveTab(key);
	};

	const closeTab = (e: React.MouseEvent, key: FileKey) => {
		e.stopPropagation();
		const newTabs = openTabs.filter((t) => t !== key);
		setOpenTabs(newTabs);
		if (activeTab === key) {
			setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
		}
	};

	const handleSync = (e: React.MouseEvent, key: string) => {
		e.stopPropagation();
		setSyncingEnvs((prev) => ({ ...prev, [key]: true }));
		setSyncedEnvs((prev) => ({ ...prev, [key]: false }));

		setTimeout(() => {
			setSyncingEnvs((prev) => ({ ...prev, [key]: false }));
			setSyncedEnvs((prev) => ({ ...prev, [key]: true }));
		}, 1500);
	};

	// Global refresh
	const handleRefreshAll = (e: React.MouseEvent) => {
		['env', 'staging', 'production'].forEach((key) => handleSync(e, key));
	};

	// Get content based on active tab
	const getTabContent = () => {
		if (!activeTab) return null;
		const file = FILES[activeTab] as FileInfo;
		if (activeTab === 'ts' && file.getContent) {
			return file.getContent(hoveredEnv, setHoveredEnv);
		}
		return file.content;
	};

	// Get file info
	const getFileInfo = (key: FileKey): FileInfo => {
		return FILES[key] as FileInfo;
	};

	return (
		<motion.div
			drag
			dragListener={false}
			dragControls={dragControls}
			dragConstraints={containerRef}
			dragElastic={0.1}
			whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
			className='w-full max-w-4xl mx-auto h-[400px] md:h-[480px] rounded-xl overflow-hidden shadow-[inset_1px_1px_0_0_rgba(255,255,255,0.1),-4px_-4px_12px_-4px_rgba(255,255,255,0.08)] border border-input bg-card flex flex-col text-sm font-sans select-none'
		>
			{/* Window Header (Title Bar) */}
			<div
				onPointerDown={(e) => dragControls.start(e)}
				className='h-10 bg-muted/40 border-b border-border flex items-center px-4 relative justify-center shrink-0 cursor-grab active:cursor-grabbing touch-none'
			>
				<div className='absolute left-4 flex items-center gap-2'>
					<div className='size-3 rounded-full bg-muted-foreground/20' />
					<div className='size-3 rounded-full bg-muted-foreground/20' />
					<div className='size-3 rounded-full bg-muted-foreground/20' />
				</div>
				<div className='flex items-center gap-2 opacity-60'>
					<span className='text-xs font-medium text-muted-foreground'>EnvVal — Workspace</span>
				</div>
			</div>

			<div className='flex flex-1 min-h-0'>
				{/* Sidebar (Dedicated Env0 View) */}
				<div className='w-64 bg-muted/10 flex-col border-r border-border hidden md:flex shrink-0'>
					{/* Sidebar Header */}
					<div className='h-9 px-4 flex items-center justify-between text-[11px] font-bold tracking-wider text-muted-foreground'>
						<span>ENVIRONMENTS</span>
						<div className='flex gap-1'>
							<IconButton
								icon={Refresh01Icon}
								onClick={handleRefreshAll}
								label='Refresh All'
							/>
							<IconButton
								icon={MoreHorizontalIcon}
								label='More'
							/>
						</div>
					</div>

					{/* Env Projects List */}
					<div className='flex-1 p-2 overflow-y-auto'>
						{(['env', 'staging', 'production'] as const).map((key) => {
							const info = FILES[key];
							const isSyncing = syncingEnvs[key];
							const isSynced = syncedEnvs[key];

							return (
								<div
									key={key}
									onClick={() => toggleTab(key)}
									className='bg-muted/30 rounded-lg p-3 border border-border/50 hover:bg-muted/50 transition-colors group mb-2 cursor-pointer relative'
								>
									<div className='flex items-center gap-2 mb-2'>
										<HugeiconsIcon
											icon={File01Icon}
											className={cn('size-4', info.color)}
										/>
										<span className='text-sm font-medium text-foreground/90'>{info.name}</span>

										<div
											className='ml-auto'
											onClick={(e) => e.stopPropagation()}
										>
											<IconButton
												icon={isSyncing ? Loading03Icon : Refresh01Icon}
												onClick={(e) => handleSync(e, key)}
												className={cn(
													isSyncing && 'animate-spin text-blue-500',
													!isSyncing && 'opacity-0 group-hover:opacity-100'
												)}
												label={`Sync ${info.name}`}
											/>
										</div>
									</div>

									<div className='flex items-center gap-2 text-[10px] text-muted-foreground'>
										<span className='opacity-70'>Updated just now</span>
										<div className='ml-auto flex items-center gap-1.5'>
											{isSynced ? (
												<>
													<HugeiconsIcon
														icon={CloudIcon}
														className={cn('size-3', info.color)}
													/>
													<span>Synced</span>
												</>
											) : (
												<>
													<HugeiconsIcon
														icon={CloudAlertIcon}
														className='size-3'
													/>
													<span>Offline</span>
												</>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
				{/* Editor Panel */}
				<div className='flex-1 flex flex-col min-w-0 bg-background'>
					{/* Tabs Bar */}
					<div
						className='h-9 flex bg-muted/10 overflow-x-auto no-scrollbar border-b border-border'
						role='tablist'
					>
						{openTabs.map((key) => {
							// Match colors from sneak-peek where logical
							const iconColor = key === 'ts' ? 'text-blue-500' : 'text-muted-foreground';

							return (
								<button
									type='button'
									role='tab'
									aria-selected={activeTab === key}
									key={key}
									onClick={() => setActiveTab(key)}
									className={`
                                    group flex items-center gap-2 px-3 min-w-[120px] max-w-[200px] border-r border-border text-xs cursor-pointer select-none relative focus-visible:ring-1 focus-visible:ring-ring outline-none
                                    ${
																			activeTab === key
																				? 'bg-background text-foreground'
																				: 'bg-muted/10 text-muted-foreground hover:bg-muted/20'
																		}
                                `}
								>
									{/* Top Border Indicator */}
									{activeTab === key && (
										<div className='absolute top-0 left-0 right-0 h-[1px] bg-blue-500' />
									)}

									<HugeiconsIcon
										icon={getFileInfo(key).icon}
										className={`size-3.5 ${iconColor}`}
									/>
									<span className='truncate flex-1 text-left'>{getFileInfo(key).name}</span>
									<div
										role='button'
										aria-label={`Close ${getFileInfo(key).name}`}
										onClick={(e) => closeTab(e, key)}
										className={`opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-muted/20 cursor-pointer ${
											activeTab === key ? 'text-muted-foreground' : 'text-muted-foreground/60'
										}`}
									>
										<HugeiconsIcon
											icon={Cancel01Icon}
											className='size-3'
										/>
									</div>
								</button>
							);
						})}
					</div>

					{/* Editor Content */}
					<div className='flex-1 overflow-auto bg-background relative'>
						{activeTab ? (
							<>
								{/* Breadcrumbs */}
								<div className='flex items-center gap-2 text-xs text-muted-foreground px-4 py-2 sticky top-0 bg-background z-10'>
									<span>env0</span>
									<HugeiconsIcon
										icon={ArrowRight01Icon}
										className='size-3'
									/>
									{activeTab === 'ts' && (
										<>
											<span>src</span>
											<HugeiconsIcon
												icon={ArrowRight01Icon}
												className='size-3'
											/>
										</>
									)}
									<span className='text-foreground'>{getFileInfo(activeTab).name}</span>
								</div>

								<motion.div
									key={activeTab}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ duration: 0.15 }}
									className='px-4 pb-4'
								>
									{getTabContent()}
								</motion.div>
							</>
						) : (
							<div className='h-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-4 text-center'>
								<div className='size-16 rounded-full bg-muted/20 flex items-center justify-center mb-2'>
									<HugeiconsIcon
										icon={Search01Icon}
										className='size-8 opacity-20'
									/>
								</div>
								<p className='text-sm'>Select a file to view</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</motion.div>
	);
};

export default ExtensionIllustration;
