export const DEFAULT_POLL_INTERVAL_SECONDS = 60;
export const DEFAULT_LOGGING_VERBOSE = false;
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
