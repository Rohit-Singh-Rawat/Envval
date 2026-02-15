export const DEFAULT_POLL_INTERVAL_SECONDS = 60;
export const DEFAULT_LOGGING_VERBOSE = true;
export const VSCODE_CONFIG_SECTION = 'envval';
export const API_BASE_URL = 'http://localhost:8080';

// Device verification URL - where users enter the device code
export const DEVICE_VERIFICATION_URL = 'http://localhost:3001/device';

export const METADATA_STORAGE_KEY = 'envval.metadata';
export const IGNORED_ENV_FILES = [
	'.env.example',
	'.env.sample',
	'.env.template',
	'.env.dist',
	'.env.test',
	'.env.testing',
];

export const IGNORE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Connection monitoring
export const CONNECTION_HEALTH_CHECK_INTERVAL_MS = 30_000;
export const CONNECTION_RECOVERY_CHECK_INTERVAL_MS = 10_000;
export const CONNECTION_STABILITY_MS = 5_000;
export const HEALTH_CHECK_TIMEOUT_MS = 5_000;
export const RECONNECTING_FAILURE_THRESHOLD = 3;

// Circuit breaker
export const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5;
export const CIRCUIT_BREAKER_COOLDOWN_MS = 30_000;

// Operation queue
export const OPERATION_QUEUE_STORAGE_KEY = 'envval.operationQueue';
export const OPERATION_QUEUE_MAX_SIZE = 100;

// Notification throttling
export const NOTIFICATION_DEBOUNCE_MS = 5_000;

// Hover feature defaults
export const DEFAULT_HOVER_ENABLED = true;
export const DEFAULT_HOVER_SHOW_VALUES = true;
export const DEFAULT_HOVER_MASK_SENSITIVE = true;
export const DEFAULT_HOVER_SHOW_UNDEFINED = true;
