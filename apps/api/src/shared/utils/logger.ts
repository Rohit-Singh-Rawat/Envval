type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
	module?: string;
	action?: string;
	error?: unknown;
	[key: string]: unknown;
}

const formatMessage = (level: LogLevel, message: string, context?: LogContext) => {
	const timestamp = new Date().toISOString();
	const contextStr = context ? ` ${JSON.stringify(context)}` : '';
	return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
};

export const logger = {
	info: (message: string, context?: LogContext) => {
		console.log(formatMessage('info', message, context));
	},

	warn: (message: string, context?: LogContext) => {
		console.warn(formatMessage('warn', message, context));
	},

	error: (message: string, context?: LogContext) => {
		console.error(formatMessage('error', message, context));
	},

	debug: (message: string, context?: LogContext) => {
		if (process.env.NODE_ENV !== 'production') {
			console.debug(formatMessage('debug', message, context));
		}
	},
};

