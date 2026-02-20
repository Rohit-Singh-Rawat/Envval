import { StatusBarAlignment, StatusBarItem, window, ThemeColor, Disposable } from 'vscode';
import { Commands } from '../commands';

/**
 * Locally defined to avoid circular dependency.
 */
type ConnectionState = 'online' | 'offline' | 'reconnecting';

/**
 * Configuration for a status bar state
 */
interface StatusBarStateConfig {
	readonly icon: string;
	readonly tooltip: string;
	readonly color?: ThemeColor;
}

/**
 * Available states for the Envval status bar item.
 */
export type StatusBarState =
	| 'Unauthenticated'
	| 'Loading'
	| 'Authenticated'
	| 'Synced'
	| 'Syncing'
	| 'Error'
	| 'Offline'
	| 'Reconnecting';

const StatusBarStates: Record<StatusBarState, StatusBarStateConfig> = {
	Unauthenticated: {
		icon: '$(circle-slash)',
		tooltip: 'Not authenticated - Click to sign in',
	},
	Loading: {
		icon: '$(loading~spin)',
		tooltip: 'Extension is initializing...',
	},
	Authenticated: {
		icon: '$(account)',
		tooltip: 'Authenticated - Ready to sync',
	},
	Synced: {
		icon: '$(check)',
		tooltip: 'All environment files are synced',
		color: new ThemeColor('charts.green'),
	},
	Syncing: {
		icon: '$(sync~spin)',
		tooltip: 'Syncing environment files...',
	},
	Error: {
		icon: '$(warning)',
		tooltip: 'Error occurred - Click for details',
		color: new ThemeColor('statusBarItem.errorForeground'),
	},
	Offline: {
		icon: '$(cloud-offline)',
		tooltip: 'Offline - Click to retry connection',
		color: new ThemeColor('statusBarItem.warningForeground'),
	},
	Reconnecting: {
		icon: '$(sync~spin)',
		tooltip: 'Attempting to reconnect...',
		color: new ThemeColor('statusBarItem.warningForeground'),
	},
};

/**
 * Singleton class that manages the VS Code status bar item for Envval.
 * Implements a counter-based state machine to handle concurrent operations.
 */
export class StatusBar implements Disposable {
	private static instance: StatusBar;
	private readonly statusBarItem: StatusBarItem;

	private activeOperationsCount: number = 0;
	private lastKnownAuthState: boolean = false;
	private isOffline = false;

	private constructor() {
		this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 10);
		this.statusBarItem.command = Commands.SHOW_QUICK_SYNC_ACTION;
		this.updateBaseState();
		this.statusBarItem.show();
	}

	public static getInstance(): StatusBar {
		if (!StatusBar.instance) {
			StatusBar.instance = new StatusBar();
		}
		return StatusBar.instance;
	}

	public updateState(state: StatusBarState, customTooltip?: string): void {
		const config = StatusBarStates[state];
		this.statusBarItem.text = `${config.icon} Envval`;
		this.statusBarItem.tooltip = customTooltip || `Envval: ${config.tooltip}`;
		this.statusBarItem.color = config.color;
	}

	public setAuthenticationState(authenticated: boolean): void {
		this.lastKnownAuthState = authenticated;
		this.statusBarItem.command = authenticated
			? Commands.SHOW_QUICK_SYNC_ACTION
			: Commands.SHOW_LOGIN;
		if (this.activeOperationsCount === 0) {
			this.updateBaseState();
		}
	}

	public setLoading(loading: boolean, message?: string): void {
		if (this.isOffline) {
			return;
		}
		if (loading) {
			this.activeOperationsCount++;
			this.updateState('Loading', message);
		} else {
			this.decrementOpCount();
		}
	}

	public setSyncState(syncing: boolean, lastSyncedAt?: Date): void {
		if (this.isOffline) {
			return;
		}
		if (syncing) {
			this.activeOperationsCount++;
			this.updateState('Syncing');
		} else {
			this.decrementOpCount(lastSyncedAt);
		}
	}

	public setSyncError(message?: string): void {
		this.updateState('Error', message);
	}

	public setConnectionState(connectionState: ConnectionState): void {
		if (connectionState === 'offline') {
			this.isOffline = true;
			this.updateState('Offline');
			this.statusBarItem.command = Commands.RETRY_CONNECTION;
		} else if (connectionState === 'reconnecting') {
			this.isOffline = true;
			this.updateState('Reconnecting');
			this.statusBarItem.command = Commands.RETRY_CONNECTION;
		} else {
			this.isOffline = false;
			this.statusBarItem.command = this.lastKnownAuthState
				? Commands.SHOW_QUICK_SYNC_ACTION
				: Commands.SHOW_LOGIN;
			if (this.activeOperationsCount === 0) {
				this.updateBaseState();
			}
		}
	}

	private decrementOpCount(lastSyncedAt?: Date): void {
		this.activeOperationsCount = Math.max(0, this.activeOperationsCount - 1);
		if (this.activeOperationsCount === 0) {
			if (lastSyncedAt) {
				this.updateState('Synced', `Envval: Last synced at ${lastSyncedAt.toLocaleTimeString()}`);
			} else {
				this.updateBaseState();
			}
		}
	}

	private updateBaseState(): void {
		const state = this.lastKnownAuthState ? 'Authenticated' : 'Unauthenticated';
		this.updateState(state);
	}

	public dispose(): void {
		this.statusBarItem.dispose();
	}

	public static getStatusBarItemReference(): StatusBarItem {
		return StatusBar.getInstance().statusBarItem;
	}
}
