import { ExtensionContext, OutputChannel, window } from 'vscode';
import { VSCODE_CONFIG_SECTION } from '../lib/constants';
import { getRuntimeConfig, type RuntimeConfig } from '../lib/config';

export class Logger {
	private static instance: Logger;
	private readonly channel: OutputChannel;
	private runtimeConfig: RuntimeConfig;

	private constructor(ctx: ExtensionContext, runtimeConfig: RuntimeConfig) {
		this.channel = window.createOutputChannel(VSCODE_CONFIG_SECTION);
		this.runtimeConfig = runtimeConfig;
		ctx.subscriptions.push(this.channel);
	}

	public static getInstance(ctx: ExtensionContext, runtimeConfig?: RuntimeConfig): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger(ctx, runtimeConfig ?? getRuntimeConfig());
		}
		return Logger.instance;
	}

	private write(level: string, message: string): void {
		const timestamp = new Date().toISOString();
		this.channel.appendLine(`${timestamp} [${level}] ${message}`);
	}

	private shouldWrite(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'): boolean {
		// Production logging policy is intentionally strict to avoid noisy output channels.
		if (this.runtimeConfig.environment === 'production') {
			return level === 'INFO' || level === 'ERROR';
		}

		if (level === 'DEBUG') {
			return this.runtimeConfig.loggingVerbose;
		}
		return true;
	}

	public log(message: string): void {
		if (this.runtimeConfig.loggingVerbose) {
			this.write('LOG', message);
		}
	}

	public debug(message: string): void {
		if (this.shouldWrite('DEBUG')) {
			this.write('DEBUG', message);
		}
	}

	public info(message: string): void {
		if (this.shouldWrite('INFO')) {
			this.write('INFO', message);
		}
	}

	public warn(message: string): void {
		if (this.shouldWrite('WARN')) {
			this.write('WARN', message);
		}
	}

	public error(message: string): void {
		if (this.shouldWrite('ERROR')) {
			this.write('ERROR', message);
		}
	}

	public show(): void {
		this.channel.show();
	}

	public setRuntimeConfig(runtimeConfig: RuntimeConfig): void {
		this.runtimeConfig = runtimeConfig;
	}
}

export function createLogger(
	ctx: ExtensionContext,
	runtimeConfig?: RuntimeConfig
): Logger {
	return Logger.getInstance(ctx, runtimeConfig);
}
