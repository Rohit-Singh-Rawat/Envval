import { useState, useRef, useEffect } from 'react';

/* ─── Types ─── */

export type EnvFileKey = 'env' | 'staging' | 'production';
export type FileKey = EnvFileKey | 'ts';
export type SyncStatus = 'synced' | 'modified' | 'syncing';

export interface EnvLine {
	id: string;
	raw: string;
}

export interface ExtensionPreviewState {
	activeTab: FileKey | null;
	openTabs: FileKey[];
	envFiles: Record<EnvFileKey, EnvLine[]>;
	syncStatus: Record<EnvFileKey, SyncStatus>;
	showDownloadCTA: boolean;
	hoveredEnv: string | null;
}

export interface ExtensionPreviewActions {
	openFile: (key: FileKey) => void;
	closeFile: (key: FileKey) => void;
	setActiveTab: (key: FileKey | null) => void;
	updateEnvLine: (fileKey: EnvFileKey, lineId: string, raw: string) => void;
	addEnvLine: (fileKey: EnvFileKey) => void;
	deleteEnvLine: (fileKey: EnvFileKey, lineId: string) => void;
	triggerSync: (fileKey: EnvFileKey) => void;
	syncAll: () => void;
	setHoveredEnv: (key: string | null) => void;
}

/* ─── Constants ─── */

const ENV_LINE_MIN = 5;
const ENV_LINE_MAX = 8;
const AUTO_SYNC_DELAY = 2000;
const SYNC_DURATION = 1500;

let lineIdCounter = 0;
function createLineId(): string {
	return `line-${++lineIdCounter}`;
}

function createEnvLine(raw: string): EnvLine {
	return { id: createLineId(), raw };
}

/**
 * .env starts without DATABASE_URL — the intro animation
 * types it in to demonstrate the extension workflow.
 */
const INITIAL_ENV_FILES: Record<EnvFileKey, EnvLine[]> = {
	env: [
		createEnvLine('# Local Environment'),
		createEnvLine(''),
		createEnvLine('# Secrets'),
		createEnvLine('JWT_SECRET="dev_secret"'),
	],
	staging: [
		createEnvLine('# Staging Environment'),
		createEnvLine('DATABASE_URL="postgresql://staging-db.io:5432/myapp"'),
		createEnvLine(''),
		createEnvLine('# Secrets'),
		createEnvLine('JWT_SECRET="staging_secret_8293"'),
	],
	production: [
		createEnvLine('# Production Environment'),
		createEnvLine('DATABASE_URL="postgresql://prod-db.io:5432/myapp"'),
		createEnvLine(''),
		createEnvLine('# Secrets'),
		createEnvLine('JWT_SECRET="prod_secret_9981"'),
	],
};

const INITIAL_SYNC_STATUS: Record<EnvFileKey, SyncStatus> = {
	env: 'synced',
	staging: 'synced',
	production: 'synced',
};

/** Formats a timestamp into a human-readable relative string (e.g. "just now", "2m ago") */
function formatRelativeTime(timestamp: number, now: number): string {
	const diffMs = now - timestamp;
	const seconds = Math.floor(diffMs / 1000);

	if (seconds < 5) return 'just now';
	if (seconds < 60) return `${seconds}s ago`;

	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;

	return `${Math.floor(minutes / 60)}h ago`;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Counts actual key=value pairs (ignoring comments and blank lines) */
function countEnvVars(lines: EnvLine[]): number {
	return lines.filter((line) => {
		const trimmed = line.raw.trim();
		return trimmed.length > 0 && !trimmed.startsWith('#') && trimmed.includes('=');
	}).length;
}

/* ─── Hook ─── */

/**
 * Manages the full state of the extension preview mini-app.
 * Handles tab management, editable .env files with auto-sync after 2s
 * of inactivity, manual sync triggers, and download CTA visibility.
 */
export function useExtensionPreview() {
	const [activeTab, setActiveTab] = useState<FileKey | null>('ts');
	const [openTabs, setOpenTabs] = useState<FileKey[]>(['ts']);
	const [envFiles, setEnvFiles] = useState<Record<EnvFileKey, EnvLine[]>>(
		() => structuredClone(INITIAL_ENV_FILES)
	);
	const [syncStatus, setSyncStatus] = useState<Record<EnvFileKey, SyncStatus>>(
		() => ({ ...INITIAL_SYNC_STATUS })
	);
	const [showDownloadCTA, setShowDownloadCTA] = useState(false);
	const [hoveredEnv, setHoveredEnv] = useState<string | null>(null);

	// Tracks when each env file was last synced (epoch ms)
	const [lastSyncedAt, setLastSyncedAt] = useState<Record<EnvFileKey, number>>(() => {
		const now = Date.now();
		return { env: now, staging: now, production: now };
	});

	// Ticks every 5s to update relative timestamps without excessive re-renders
	const [now, setNow] = useState(Date.now);
	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), 5000);
		return () => clearInterval(interval);
	}, []);

	// Debounce timers for auto-sync per env file
	const autoSyncTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
	// Sync completion timers
	const syncTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

	/* ── Tab management ── */

	const openFile = (key: FileKey) => {
		setOpenTabs((tabs) => (tabs.includes(key) ? tabs : [...tabs, key]));
		setActiveTab(key);
	};

	const closeFile = (key: FileKey) => {
		setOpenTabs((tabs) => {
			const next = tabs.filter((t) => t !== key);
			setActiveTab((current) =>
				current === key ? (next.length > 0 ? next[next.length - 1] : null) : current
			);
			return next;
		});
	};

	/* ── Sync logic ── */

	const executeSyncTransition = (fileKey: EnvFileKey) => {
		setSyncStatus((prev) => ({ ...prev, [fileKey]: 'syncing' }));

		// Clear any existing sync completion timer
		if (syncTimers.current[fileKey]) {
			clearTimeout(syncTimers.current[fileKey]);
		}

		syncTimers.current[fileKey] = setTimeout(() => {
			setSyncStatus((prev) => ({ ...prev, [fileKey]: 'synced' }));
			setLastSyncedAt((prev) => ({ ...prev, [fileKey]: Date.now() }));
		}, SYNC_DURATION);
	};

	/**
	 * Schedules auto-sync 2s after the last edit.
	 * Clears previous timer on each call (debounce pattern).
	 */
	const scheduleAutoSync = (fileKey: EnvFileKey) => {
		if (autoSyncTimers.current[fileKey]) {
			clearTimeout(autoSyncTimers.current[fileKey]);
		}

		autoSyncTimers.current[fileKey] = setTimeout(() => {
			executeSyncTransition(fileKey);
		}, AUTO_SYNC_DELAY);
	};

	const markModified = (fileKey: EnvFileKey) => {
		setSyncStatus((prev) => ({ ...prev, [fileKey]: 'modified' }));
		setShowDownloadCTA(true);
		scheduleAutoSync(fileKey);
	};

	const triggerSync = (fileKey: EnvFileKey) => {
		// Cancel pending auto-sync
		if (autoSyncTimers.current[fileKey]) {
			clearTimeout(autoSyncTimers.current[fileKey]);
		}
		executeSyncTransition(fileKey);
	};

	const syncAll = () => {
		const envKeys: EnvFileKey[] = ['env', 'staging', 'production'];
		for (const key of envKeys) {
			triggerSync(key);
		}
	};

	/* ── Env editing (only .env is editable) ── */

	const updateEnvLine = (fileKey: EnvFileKey, lineId: string, raw: string) => {
		setEnvFiles((prev) => ({
			...prev,
			[fileKey]: prev[fileKey].map((line) =>
				line.id === lineId ? { ...line, raw } : line
			),
		}));
		markModified(fileKey);
	};

	const addEnvLine = (fileKey: EnvFileKey) => {
		setEnvFiles((prev) => {
			if (prev[fileKey].length >= ENV_LINE_MAX) return prev;
			return {
				...prev,
				[fileKey]: [...prev[fileKey], createEnvLine('NEW_VAR="value"')],
			};
		});
		markModified(fileKey);
	};

	const deleteEnvLine = (fileKey: EnvFileKey, lineId: string) => {
		setEnvFiles((prev) => {
			if (prev[fileKey].length <= ENV_LINE_MIN) return prev;
			return {
				...prev,
				[fileKey]: prev[fileKey].filter((line) => line.id !== lineId),
			};
		});
		markModified(fileKey);
	};

	/* ── Intro animation sequence ── */

	/**
	 * Orchestrates the intro demo: opens .env, types DATABASE_URL char-by-char,
	 * waits for auto-sync, switches to index.ts, and flashes the sneak peek tooltip.
	 * Cancellable via the `cancelled` callback (generation-based pattern).
	 */
	const runIntroSequence = async (cancelled: () => boolean) => {
		const DATABASE_URL_LINE = 'DATABASE_URL="postgresql://localhost:5432/myapp"';
		const TYPING_SPEED_MS = 35;

		// Step 1: Open .env
		await sleep(600);
		if (cancelled()) return;
		openFile('env');

		// Step 2: Insert blank line at index 1 and type DATABASE_URL char by char
		await sleep(800);
		if (cancelled()) return;

		const typingLineId = createLineId();
		setEnvFiles((prev) => {
			const newLines = [...prev.env];
			newLines.splice(1, 0, { id: typingLineId, raw: '' });
			return { ...prev, env: newLines };
		});

		for (let i = 1; i <= DATABASE_URL_LINE.length; i++) {
			if (cancelled()) return;
			const partial = DATABASE_URL_LINE.slice(0, i);
			setEnvFiles((prev) => ({
				...prev,
				env: prev.env.map((l) => (l.id === typingLineId ? { ...l, raw: partial } : l)),
			}));
			await sleep(TYPING_SPEED_MS);
		}

		// Step 3: Mark modified → auto-sync fires after 2s debounce + 1.5s transition
		if (cancelled()) return;
		markModified('env');
		await sleep(AUTO_SYNC_DELAY + SYNC_DURATION + 500);
		if (cancelled()) return;

		// Step 4: Switch to index.ts
		openFile('ts');
		await sleep(800);
		if (cancelled()) return;

		// Step 5: Show sneak peek tooltip on DATABASE_URL for 2s
		setHoveredEnv('DATABASE_URL');
		await sleep(2000);
		if (cancelled()) return;

		// Step 6: Hide tooltip — intro complete
		setHoveredEnv(null);
	};

	/* ── Computed helpers ── */

	const canAddLine = (fileKey: EnvFileKey): boolean => envFiles[fileKey].length < ENV_LINE_MAX;
	const canDeleteLine = (fileKey: EnvFileKey): boolean => envFiles[fileKey].length > ENV_LINE_MIN;
	const getEnvVarCount = (fileKey: EnvFileKey): number => countEnvVars(envFiles[fileKey]);
	const getRelativeTime = (fileKey: EnvFileKey): string => formatRelativeTime(lastSyncedAt[fileKey], now);

	return {
		state: {
			activeTab,
			openTabs,
			envFiles,
			syncStatus,
			showDownloadCTA,
			hoveredEnv,
		},
		actions: {
			openFile,
			closeFile,
			setActiveTab,
			updateEnvLine,
			addEnvLine,
			deleteEnvLine,
			triggerSync,
			syncAll,
			setHoveredEnv,
			runIntroSequence,
		},
		computed: {
			canAddLine,
			canDeleteLine,
			getEnvVarCount,
			getRelativeTime,
		},
	} as const;
}
