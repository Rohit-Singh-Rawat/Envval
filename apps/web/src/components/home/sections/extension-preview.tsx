import { useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls, useInView } from 'motion/react';
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
import { EXTENSION_URL } from '@/lib/constants';
import {
	useExtensionPreview,
	type FileKey,
	type EnvFileKey,
	type SyncStatus,
} from '@/hooks/use-extension-preview';
import type { SVGProps } from 'react';
import EnvvalLogo from '@/components/logo/envval';
import { EASE_OUT } from '@/lib/animation';

/* ─── Icons ─── */

function CloudAlertIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			width='1em'
			height='1em'
			viewBox='0 0 24 24'
			{...props}
		>
			{/* Icon from Material Symbols Light by Google */}
			<path
				fill='currentColor'
				d='M6.5 19q-1.871 0-3.185-1.301Q2 16.397 2 14.516q0-1.71 1.175-3.047t2.921-1.435q.337-2.185 2.01-3.61T12 5q2.507 0 4.254 1.747Q18 8.493 18 11v1h.616q1.436.046 2.41 1.055T22 15.5q0 1.471-1.014 2.486Q19.97 19 18.5 19zm0-1h12q1.05 0 1.775-.725T21 15.5t-.725-1.775T18.5 13H17v-2q0-2.075-1.463-3.538T12 6T8.463 7.463T7 11h-.5q-1.45 0-2.475 1.025T3 14.5t1.025 2.475T6.5 18m5.5-3.02q.214 0 .357-.143q.143-.144.143-.357t-.144-.356t-.357-.143t-.356.144t-.143.357t.144.356t.357.143m0-2.5q.213 0 .356-.144t.143-.356V9q0-.213-.144-.356t-.357-.144t-.356.144T11.5 9v2.98q0 .213.144.357t.357.144'
			/>
		</svg>
	);
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			width='1em'
			height='1em'
			viewBox='0 0 24 24'
			{...props}
		>
			<path
				fill='none'
				stroke='currentColor'
				strokeLinecap='round'
				strokeWidth='2'
				d='M12 5v14m-7-7h14'
			/>
		</svg>
	);
}

function MinusIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			width='1em'
			height='1em'
			viewBox='0 0 24 24'
			{...props}
		>
			<path
				fill='none'
				stroke='currentColor'
				strokeLinecap='round'
				strokeWidth='2'
				d='M5 12h14'
			/>
		</svg>
	);
}

function DownloadIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			width='1em'
			height='1em'
			viewBox='0 0 24 24'
			{...props}
		>
			<path
				fill='none'
				stroke='currentColor'
				strokeLinecap='round'
				strokeLinejoin='round'
				strokeWidth='2'
				d='M12 4v12m0 0l-4-4m4 4l4-4M4 18h16'
			/>
		</svg>
	);
}

/* ─── Syntax Highlighting Data for index.ts ─── */

interface CodeToken {
	text: string;
	cls: string;
}

interface CodeLine {
	tokens: CodeToken[];
	/** Index into ENV_HOVER_DATA for interactive hover */
	envHoverKey?: string;
}

const ENV_HOVER_DATA = {
	DATABASE_URL: {
		file: '.env (Local)',
		value: '"postgresql://localhost:5432/myapp"',
	},
} as const;

const INDEX_TS_LINES: CodeLine[] = [
	{
		tokens: [
			{ text: 'import', cls: 'text-purple-500' },
			{ text: ' { ', cls: 'text-foreground/80' },
			{ text: 'createServer', cls: 'text-foreground/80' },
			{ text: ' } ', cls: 'text-foreground/80' },
			{ text: 'from', cls: 'text-purple-500' },
			{ text: " 'http'", cls: 'text-amber-500' },
			{ text: ';', cls: 'text-muted-foreground/60' },
		],
	},
	{
		tokens: [
			{ text: 'import', cls: 'text-purple-500' },
			{ text: ' { ', cls: 'text-foreground/80' },
			{ text: 'config', cls: 'text-foreground/80' },
			{ text: ' } ', cls: 'text-foreground/80' },
			{ text: 'from', cls: 'text-purple-500' },
			{ text: " 'dotenv'", cls: 'text-amber-500' },
			{ text: ';', cls: 'text-muted-foreground/60' },
		],
	},
	{
		tokens: [
			{ text: 'import', cls: 'text-purple-500' },
			{ text: ' { ', cls: 'text-foreground/80' },
			{ text: 'connect', cls: 'text-foreground/80' },
			{ text: ' } ', cls: 'text-foreground/80' },
			{ text: 'from', cls: 'text-purple-500' },
			{ text: " './db'", cls: 'text-amber-500' },
			{ text: ';', cls: 'text-muted-foreground/60' },
		],
	},
	{ tokens: [] },
	{
		tokens: [
			{ text: 'config', cls: 'text-blue-500' },
			{ text: '();', cls: 'text-muted-foreground/60' },
		],
	},
	{ tokens: [] },
	{
		tokens: [
			{ text: 'const', cls: 'text-purple-500' },
			{ text: ' db', cls: 'text-blue-500' },
			{ text: ' = ', cls: 'text-muted-foreground/60' },
			{ text: 'connect', cls: 'text-blue-500' },
			{ text: '(', cls: 'text-muted-foreground/60' },
		],
	},
	{
		tokens: [
			{ text: '  process', cls: 'text-foreground/80' },
			{ text: '.', cls: 'text-muted-foreground/60' },
			{ text: 'env', cls: 'text-foreground/80' },
			{ text: '.', cls: 'text-muted-foreground/60' },
		],
		envHoverKey: 'DATABASE_URL',
	},
	{
		tokens: [
			{ text: ')', cls: 'text-muted-foreground/60' },
			{ text: ';', cls: 'text-muted-foreground/60' },
		],
	},
	{ tokens: [] },
	{
		tokens: [
			{ text: 'const', cls: 'text-purple-500' },
			{ text: ' server', cls: 'text-blue-500' },
			{ text: ' = ', cls: 'text-muted-foreground/60' },
			{ text: 'createServer', cls: 'text-blue-500' },
			{ text: '((', cls: 'text-muted-foreground/60' },
			{ text: 'req', cls: 'text-foreground/80' },
			{ text: ', ', cls: 'text-muted-foreground/60' },
			{ text: 'res', cls: 'text-foreground/80' },
			{ text: ') ', cls: 'text-muted-foreground/60' },
			{ text: '=>', cls: 'text-purple-500' },
			{ text: ' {', cls: 'text-muted-foreground/60' },
		],
	},
	{
		tokens: [
			{ text: '  res', cls: 'text-foreground/80' },
			{ text: '.', cls: 'text-muted-foreground/60' },
			{ text: 'end', cls: 'text-blue-500' },
			{ text: '(', cls: 'text-muted-foreground/60' },
			{ text: "'ok'", cls: 'text-amber-500' },
			{ text: ');', cls: 'text-muted-foreground/60' },
		],
	},
	{
		tokens: [{ text: '});', cls: 'text-muted-foreground/60' }],
	},
	{ tokens: [] },
	{
		tokens: [
			{ text: 'server', cls: 'text-foreground/80' },
			{ text: '.', cls: 'text-muted-foreground/60' },
			{ text: 'listen', cls: 'text-blue-500' },
			{ text: '(', cls: 'text-muted-foreground/60' },
			{ text: '3000', cls: 'text-amber-500' },
			{ text: ', () ', cls: 'text-muted-foreground/60' },
			{ text: '=>', cls: 'text-purple-500' },
			{ text: ' {', cls: 'text-muted-foreground/60' },
		],
	},
	{
		tokens: [
			{ text: '  console', cls: 'text-foreground/80' },
			{ text: '.', cls: 'text-muted-foreground/60' },
			{ text: 'log', cls: 'text-blue-500' },
			{ text: '(', cls: 'text-muted-foreground/60' },
			{ text: "'Server running'", cls: 'text-amber-500' },
			{ text: ');', cls: 'text-muted-foreground/60' },
		],
	},
	{
		tokens: [{ text: '});', cls: 'text-muted-foreground/60' }],
	},
];

/* ─── File metadata ─── */

interface FileInfo {
	name: string;
	icon: typeof File01Icon | typeof FileCode;
	envType?: string;
	color?: string;
}

const FILE_META: Record<FileKey, FileInfo> = {
	env: { name: '.env', icon: File01Icon, envType: 'Local', color: 'text-emerald-500' },
	staging: { name: '.env.staging', icon: File01Icon, envType: 'Staging', color: 'text-amber-500' },
	production: {
		name: '.env.production',
		icon: File01Icon,
		envType: 'Production',
		color: 'text-rose-500',
	},
	ts: { name: 'index.ts', icon: FileCode },
};

const ENV_KEYS: EnvFileKey[] = ['env', 'staging', 'production'];

/* ─── Sub-components ─── */

function IconButton({
	icon,
	onClick,
	className,
	label,
}: {
	icon: typeof Refresh01Icon;
	onClick?: (e: React.MouseEvent) => void;
	className?: string;
	label: string;
}) {
	return (
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
}

function SyncStatusBadge({ status, color }: { status: SyncStatus; color?: string }) {
	return (
		<div className='flex items-center gap-1.5'>
			{status === 'synced' && (
				<>
					<HugeiconsIcon
						icon={CloudIcon}
						className={cn('size-3', color)}
					/>
					<span>Synced</span>
				</>
			)}
			{status === 'modified' && (
				<>
					<CloudAlertIcon className={cn('size-3 text-amber-500')} />
					<span className='text-amber-500'>Modified</span>
				</>
			)}
			{status === 'syncing' && (
				<>
					<HugeiconsIcon
						icon={Loading03Icon}
						className='size-3 animate-spin text-blue-500'
					/>
					<span className='text-blue-500'>Syncing</span>
				</>
			)}
		</div>
	);
}

/** Line number gutter shared by code and env editors */
function LineGutter({ count }: { count: number }) {
	return (
		<div
			className='flex flex-col select-none shrink-0 pr-3 border-r border-border/30 mr-3'
			style={{ width: 32 }}
		>
			{Array.from({ length: count }, (_, i) => (
				<span
					key={i}
					className='text-[11px] leading-[22px] font-mono text-muted-foreground/30 text-right block'
				>
					{i + 1}
				</span>
			))}
		</div>
	);
}

/* ─── Code Editor (index.ts) ─── */

function CodeEditor({
	hoveredEnv,
	setHoveredEnv,
}: {
	hoveredEnv: string | null;
	setHoveredEnv: (key: string | null) => void;
}) {
	return (
		<div className='flex p-3'>
			<LineGutter count={INDEX_TS_LINES.length} />
			<div className='flex-1 min-w-0'>
				{INDEX_TS_LINES.map((line, i) => (
					<div
						key={i}
						className='h-[22px] flex items-center relative'
					>
						{line.tokens.map((token, j) => (
							<span
								key={j}
								className={cn('text-[11px] font-mono whitespace-pre leading-[22px]', token.cls)}
							>
								{token.text}
							</span>
						))}
						{line.envHoverKey && (
							<EnvHoverToken
								envKey={line.envHoverKey}
								hoveredEnv={hoveredEnv}
								setHoveredEnv={setHoveredEnv}
							/>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

function EnvHoverToken({
	envKey,
	hoveredEnv,
	setHoveredEnv,
}: {
	envKey: string;
	hoveredEnv: string | null;
	setHoveredEnv: (key: string | null) => void;
}) {
	const data = ENV_HOVER_DATA[envKey as keyof typeof ENV_HOVER_DATA];
	if (!data) return null;

	return (
		<span
			className='relative inline-flex items-center cursor-help'
			onMouseEnter={() => setHoveredEnv(envKey)}
			onMouseLeave={() => setHoveredEnv(null)}
		>
			<span className='text-[11px] font-mono text-purple-500 border-b border-dashed border-muted-foreground/30 leading-[22px]'>
				{envKey}
			</span>

			<AnimatePresence>
				{hoveredEnv === envKey && (
					<motion.div
						initial={{ opacity: 0, y: 4, scale: 0.98, filter: 'blur(4px)' }}
						animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
						exit={{ opacity: 0, y: 4, scale: 0.98, filter: 'blur(4px)' }}
						transition={{ duration: 0.2, ease: EASE_OUT }}
						className='absolute left-0 bottom-full mb-1 z-50 rounded-md border border-border bg-card shadow-xl overflow-hidden min-w-[240px]'
					>
						<div className='flex items-center gap-1.5 px-2.5 py-1 border-b border-border bg-muted/40 h-6 box-content'>
							<span className='text-[10px] text-muted-foreground font-medium'>{data.file}</span>
						</div>
						<div className='px-2.5 py-2 flex items-baseline gap-0.5 bg-background'>
							<span className='text-[10px] font-mono text-emerald-500 font-medium'>
								{data.value}
							</span>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</span>
	);
}

/* ─── Env Editor ─── */

function EnvEditor({
	fileKey,
	lines,
	isEditable,
	canAdd,
	canDelete,
	onUpdateLine,
	onAddLine,
	onDeleteLine,
}: {
	fileKey: EnvFileKey;
	lines: { id: string; raw: string }[];
	isEditable: boolean;
	canAdd: boolean;
	canDelete: boolean;
	onUpdateLine: (lineId: string, raw: string) => void;
	onAddLine: () => void;
	onDeleteLine: (lineId: string) => void;
}) {
	return (
		<div className='flex flex-col'>
			<div className='flex p-3'>
				<LineGutter count={lines.length} />
				<div className='flex-1 min-w-0'>
					{lines.map((line) => {
						const isComment = line.raw.startsWith('#');
						const isEmpty = line.raw.trim() === '';

						return (
							<div
								key={line.id}
								className='h-[22px] flex items-center group/line relative'
							>
								{isEditable ? (
									<input
										type='text'
										value={line.raw}
										onChange={(e) => onUpdateLine(line.id, e.target.value)}
										spellCheck={false}
										className={cn(
											'text-[11px] font-mono leading-[22px] bg-transparent outline-none w-full',
											isComment ? 'text-muted-foreground/50' : isEmpty ? '' : 'text-foreground/80'
										)}
										aria-label={`Environment variable line: ${line.raw || 'empty'}`}
									/>
								) : (
									<span
										className={cn(
											'text-[11px] font-mono leading-[22px] whitespace-pre select-text',
											isComment ? 'text-muted-foreground/50' : 'text-foreground/80'
										)}
									>
										{line.raw || '\u00A0'}
									</span>
								)}

								{/* Delete button on hover — only for editable files */}
								{isEditable && canDelete && !isEmpty && (
									<button
										type='button'
										onClick={() => onDeleteLine(line.id)}
										className='absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/line:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive cursor-pointer'
										aria-label={`Delete line: ${line.raw}`}
									>
										<MinusIcon className='size-3' />
									</button>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Add line button */}
			{isEditable && (
				<div className='px-3 pb-2'>
					<button
						type='button'
						onClick={onAddLine}
						disabled={!canAdd}
						className={cn(
							'flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer',
							!canAdd && 'opacity-30 cursor-not-allowed'
						)}
						aria-label='Add new environment variable'
					>
						<PlusIcon className='size-3' />
						<span>Add variable</span>
					</button>
				</div>
			)}
		</div>
	);
}

/* ─── Sidebar Card ─── */

function SidebarEnvCard({
	fileKey,
	syncStatus,
	envVarCount,
	relativeTime,
	onOpen,
	onSync,
}: {
	fileKey: EnvFileKey;
	syncStatus: SyncStatus;
	envVarCount: number;
	relativeTime: string;
	onOpen: () => void;
	onSync: (e: React.MouseEvent) => void;
}) {
	const info = FILE_META[fileKey];

	return (
		<div
			onClick={onOpen}
			onKeyDown={(e) => e.key === 'Enter' && onOpen()}
			role='button'
			tabIndex={0}
			className='bg-background/80 rounded-md p-2 border border-border/80 hover:bg-background transition-colors group mb-1.5 cursor-pointer relative'
			aria-label={`Open ${info.name} — ${envVarCount} variables`}
		>
			<div className='flex items-center gap-1.5 mb-1'>
				<HugeiconsIcon
					icon={File01Icon}
					className={cn('size-3', info.color)}
				/>
				<span className='text-xs font-medium text-foreground/90'>
					{info.name}
					<span className='text-muted-foreground/50 font-normal ml-1'>({envVarCount})</span>
				</span>
				<div
					className='ml-auto'
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					<IconButton
						icon={Refresh01Icon}
						onClick={onSync}
						className='opacity-0 group-hover:opacity-100 '
						label={`Sync ${info.name}`}
					/>
				</div>
			</div>
			<div className='flex items-center gap-1.5 text-[9px] text-muted-foreground'>
				<span className='opacity-70'>Updated {relativeTime}</span>
				<div className='ml-auto'>
					<SyncStatusBadge
						status={syncStatus}
						color={info.color}
					/>
				</div>
			</div>
		</div>
	);
}

/* ─── Download CTA ─── */

function DownloadCTA() {
	return (
		<motion.div
			initial={{ opacity: 0, filter: 'blur(4px)', y: 8 }}
			animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
			transition={{ duration: 0.25, ease: EASE_OUT }}
			className='absolute bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-t border-border/50 rounded-b-md'
		>
			<div className='flex items-center justify-between px-4 py-1.5'>
				<span className='text-[11px] text-muted-foreground'>Want the full experience?</span>
				<a
					href={EXTENSION_URL}
					className='flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer'
					aria-label='Download the extension'
				>
					<DownloadIcon className='size-3.5' />
					<span>Download Extension</span>
				</a>
			</div>
		</motion.div>
	);
}

/* ─── Main Component ─── */

function ExtensionPreview({
	containerRef,
}: {
	containerRef?: React.RefObject<HTMLDivElement | null>;
}) {
	const { state, actions, computed } = useExtensionPreview();
	const dragControls = useDragControls();

	// Intro animation — runs once when component enters viewport
	const previewRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(previewRef, { once: true, margin: '-80px' });
	const introGenRef = useRef(0);

	useEffect(() => {
		if (!isInView) return;

		const gen = ++introGenRef.current;
		const cancelled = () => introGenRef.current !== gen;

		actions.runIntroSequence(cancelled);
	}, [isInView]); // eslint-disable-line react-hooks/exhaustive-deps

	const getFileInfo = (key: FileKey): FileInfo => FILE_META[key];

	const renderEditorContent = () => {
		if (!state.activeTab) {
			return (
				<div className='h-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-4 text-center opacity-40'>
					{' '}
					<EnvvalLogo />
					<span className='text-sm'>Select a file to view</span>
				</div>
			);
		}

		if (state.activeTab === 'ts') {
			return (
				<CodeEditor
					hoveredEnv={state.hoveredEnv}
					setHoveredEnv={actions.setHoveredEnv}
				/>
			);
		}

		const envKey = state.activeTab as EnvFileKey;
		const isEditable = envKey === 'env';

		return (
			<EnvEditor
				fileKey={envKey}
				lines={state.envFiles[envKey]}
				isEditable={isEditable}
				canAdd={computed.canAddLine(envKey)}
				canDelete={computed.canDeleteLine(envKey)}
				onUpdateLine={(lineId, raw) => actions.updateEnvLine(envKey, lineId, raw)}
				onAddLine={() => actions.addEnvLine(envKey)}
				onDeleteLine={(lineId) => actions.deleteEnvLine(envKey, lineId)}
			/>
		);
	};

	return (
		<motion.div
			ref={previewRef}
			drag
			dragListener={false}
			dragControls={dragControls}
			dragConstraints={containerRef}
			dragElastic={0}
			dragTransition={{ power: 0.3, timeConstant: 120 }}
			className='w-full max-w-4xl mx-auto h-[400px] sm:h-[460px] md:h-[540px] rounded-md overflow-hidden shadow-[inset_1px_1px_0_0_rgba(255,255,255,0.1),-4px_-4px_12px_-4px_rgba(255,255,255,0.08),0_8px_32px_-8px_rgba(0,0,0,0.3)] border border-input bg-card flex flex-col text-sm font-sans select-none'
			role='region'
			aria-label='Extension preview - interactive demonstration'
		>
			{/* Title Bar — drag handle */}
			<div
				onPointerDown={(e) => dragControls.start(e)}
				className='h-6.5 bg-muted/70 border-b border-border flex items-center px-4 relative justify-center shrink-0  touch-none'
			>
				<div className='absolute left-4 flex items-center gap-2'>
					<div className='size-2 rounded-full bg-muted-foreground/20' />
					<div className='size-2 rounded-full bg-muted-foreground/20' />
					<div className='size-2 rounded-full bg-muted-foreground/20' />
				</div>
				<div className='flex items-center gap-2 opacity-60'>
					<span className='text-xs font-medium text-foreground'>EnvVal</span>
				</div>
			</div>

			<div className='flex flex-1 min-h-0'>
				{/* Sidebar */}
				<div className='w-64 bg-muted/70 flex-col border-r border-border hidden md:flex shrink-0'>
					<div className='h-9 px-4 flex items-center justify-between text-[11px] font-medium tracking-wider text-muted-foreground'>
						<span>ENVIRONMENTS</span>
						<div className='flex gap-1'>
							<IconButton
								icon={Refresh01Icon}
								onClick={() => actions.syncAll()}
								label='Sync all environments'
							/>
							<IconButton
								icon={MoreHorizontalIcon}
								label='More options'
							/>
						</div>
					</div>

					<div className='flex-1 p-2 overflow-y-auto'>
						{ENV_KEYS.map((key) => (
							<SidebarEnvCard
								key={key}
								fileKey={key}
								syncStatus={state.syncStatus[key]}
								envVarCount={computed.getEnvVarCount(key)}
								relativeTime={computed.getRelativeTime(key)}
								onOpen={() => actions.openFile(key)}
								onSync={(e) => {
									e.stopPropagation();
									actions.triggerSync(key);
								}}
							/>
						))}
					</div>
				</div>
				<div className='flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden'>
					{/* Tab bar — z-30 to sit above tooltip overflow */}

					{state.openTabs.length !== 0 && (
						<div
							className='h-7 flex bg-muted/30 overflow-x-auto no-scrollbar border-b border-border relative z-30'
							role='tablist'
						>
							{state.openTabs.map((key) => {
								const info = getFileInfo(key);
								const isActive = state.activeTab === key;
								const iconColor = key === 'ts' ? 'text-blue-500' : 'text-muted-foreground';

								return (
									<button
										type='button'
										role='tab'
										aria-selected={isActive}
										key={key}
										onClick={() => actions.setActiveTab(key)}
										className={cn(
											'group flex items-center gap-2 px-3 min-w-[120px] max-w-[200px] border-r border-border text-xs cursor-pointer select-none relative focus-visible:ring-1 focus-visible:ring-ring outline-none',
											isActive
												? 'bg-background text-foreground'
												: 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
										)}
									>
										{isActive && <div className='absolute top-0 left-0 right-0 h-px bg-primary' />}
										<HugeiconsIcon
											icon={info.icon}
											className={cn('size-3.5', iconColor)}
										/>
										<span className='truncate flex-1 text-left'>{info.name}</span>
										<div
											role='button'
											tabIndex={0}
											aria-label={`Close ${info.name}`}
											onClick={(e) => {
												e.stopPropagation();
												actions.closeFile(key);
											}}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.stopPropagation();
													actions.closeFile(key);
												}
											}}
											className={cn(
												'opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-muted/20 cursor-pointer',
												isActive ? 'text-muted-foreground' : 'text-muted-foreground/60'
											)}
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
					)}
					{/* Editor Content */}
					<div className='flex-1 overflow-auto bg-background relative'>
						<AnimatePresence mode='wait'>
							{state.activeTab ? (
								<motion.div
									key={state.activeTab}
									initial={{ opacity: 0, filter: 'blur(4px)' }}
									animate={{ opacity: 1, filter: 'blur(0px)' }}
									exit={{ opacity: 0, filter: 'blur(4px)' }}
									transition={{ duration: 0.2, ease: EASE_OUT }}
								>
									{/* Breadcrumbs — z-20 below tab bar */}
									<div className='flex items-center gap-2 text-xs text-muted-foreground px-4 py-2 sticky top-0 bg-background z-20'>
										<span>env0</span>
										<HugeiconsIcon
											icon={ArrowRight01Icon}
											className='size-3'
										/>
										{state.activeTab === 'ts' && (
											<>
												<span>src</span>
												<HugeiconsIcon
													icon={ArrowRight01Icon}
													className='size-3'
												/>
											</>
										)}
										<span className='text-foreground'>{getFileInfo(state.activeTab).name}</span>
									</div>
									{renderEditorContent()}
								</motion.div>
							) : (
								<motion.div
									key='empty'
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.15, ease: EASE_OUT }}
									className='h-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-4 text-center'
								>
									{renderEditorContent()}
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Download CTA — appears after first edit */}
					<AnimatePresence>{state.showDownloadCTA && <DownloadCTA />}</AnimatePresence>
				</div>
			</div>
		</motion.div>
	);
}

export default ExtensionPreview;
