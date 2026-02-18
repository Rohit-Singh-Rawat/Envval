import { Disposable, EventEmitter } from 'vscode';
import { Logger } from '../utils/logger';
import {
	CONNECTION_HEALTH_CHECK_INTERVAL_MS,
	CONNECTION_RECOVERY_CHECK_INTERVAL_MS,
	CONNECTION_STABILITY_MS,
	HEALTH_CHECK_TIMEOUT_MS,
	RECONNECTING_FAILURE_THRESHOLD,
} from '../lib/constants';
import { getApiBaseUrl } from '../lib/config';
import { formatError } from '../utils/format-error';

export type ConnectionState = 'online' | 'offline' | 'reconnecting';

export class ConnectionMonitor implements Disposable {
	private static instance: ConnectionMonitor;

	private readonly logger: Logger;
	private readonly disposables: Disposable[] = [];

	private _state: ConnectionState = 'online';
	private consecutiveFailures = 0;
	private checkTimer: NodeJS.Timeout | undefined;
	private debounceTimer: NodeJS.Timeout | undefined;

	private readonly _onDidChangeConnectionState = new EventEmitter<boolean>();
	public readonly onDidChangeConnectionState = this._onDidChangeConnectionState.event;

	private readonly _onDidChangeDetailedState = new EventEmitter<ConnectionState>();
	public readonly onDidChangeDetailedState = this._onDidChangeDetailedState.event;

	private constructor(logger: Logger) {
		this.logger = logger;
	}

	public static getInstance(logger?: Logger): ConnectionMonitor {
		if (!ConnectionMonitor.instance) {
			if (!logger) {
				throw new Error('ConnectionMonitor must be initialized with a logger before use');
			}
			ConnectionMonitor.instance = new ConnectionMonitor(logger);
		}
		return ConnectionMonitor.instance;
	}

	public get isOnline(): boolean {
		return this._state === 'online';
	}

	public get state(): ConnectionState {
		return this._state;
	}

	public start(): void {
		this.logger.info('ConnectionMonitor: Starting health checks');
		this.scheduleCheck();
		this.performCheck();
	}

	public stop(): void {
		this.logger.info('ConnectionMonitor: Stopping health checks');
		this.clearTimers();
	}

	public retryNow(): void {
		this.logger.debug('ConnectionMonitor: Manual retry requested');
		this.performCheck();
	}

	private scheduleCheck(): void {
		if (this.checkTimer) {
			clearInterval(this.checkTimer);
		}

		const interval = this._state === 'online'
			? CONNECTION_HEALTH_CHECK_INTERVAL_MS
			: CONNECTION_RECOVERY_CHECK_INTERVAL_MS;

		this.checkTimer = setInterval(() => this.performCheck(), interval);
	}

	private async performCheck(): Promise<void> {
		const healthy = await this.checkHealth();

		if (healthy) {
			this.consecutiveFailures = 0;
			if (this._state !== 'online') {
				this.transitionTo('online');
			}
		} else {
			this.consecutiveFailures++;
			if (this._state === 'online') {
				this.transitionTo('reconnecting');
			} else if (
				this._state === 'reconnecting' &&
				this.consecutiveFailures >= RECONNECTING_FAILURE_THRESHOLD
			) {
				this.transitionTo('offline');
			}
		}
	}

	// Uses raw fetch instead of EnvVaultApiClient to avoid circular dependencies
	// and to keep health checks independent of auth state.
	private async checkHealth(): Promise<boolean> {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

			try {
				const response = await fetch(`${getApiBaseUrl()}/health`, {
					signal: controller.signal,
				});
				return response.ok;
			} finally {
				clearTimeout(timeout);
			}
		} catch (error: unknown) {
			const message = formatError(error);

			// fetch may not be available in Node.js <18
			if (message.includes('fetch is not defined') || message.includes('fetch is not a function')) {
				this.logger.warn('ConnectionMonitor: fetch() unavailable in this Node.js version, assuming online');
				return true;
			}

			this.logger.debug(`ConnectionMonitor: Health check failed: ${message}`);
			return false;
		}
	}

	// Debounce state transitions by CONNECTION_STABILITY_MS to prevent flapping
	// when the network is intermittently dropping packets.
	private transitionTo(newState: ConnectionState): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.debounceTimer = setTimeout(() => {
			this.applyTransition(newState);
			this.debounceTimer = undefined;
		}, CONNECTION_STABILITY_MS);
	}

	private applyTransition(newState: ConnectionState): void {
		const previousState = this._state;
		if (previousState === newState) {
			return;
		}

		this._state = newState;
		this.logger.info(`ConnectionMonitor: ${previousState} → ${newState}`);
		this._onDidChangeDetailedState.fire(newState);

		const wasOnline = previousState === 'online';
		const isNowOnline = newState === 'online';

		if (wasOnline !== isNowOnline) {
			this._onDidChangeConnectionState.fire(isNowOnline);
		}

		// Switch check interval based on the new state
		this.scheduleCheck();
	}

	private clearTimers(): void {
		if (this.checkTimer) {
			clearInterval(this.checkTimer);
			this.checkTimer = undefined;
		}
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = undefined;
		}
	}

	public dispose(): void {
		this.clearTimers();
		this._onDidChangeConnectionState.dispose();
		this._onDidChangeDetailedState.dispose();
		this.disposables.forEach((d) => d.dispose());
	}
}
