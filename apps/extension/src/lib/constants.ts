export const DEFAULT_POLL_INTERVAL_SECONDS = 60;
export const DEFAULT_LOGGING_VERBOSE = false;
export const VSCODE_CONFIG_SECTION = "envval";

export type ExtensionEnvironment = "development" | "production";

export const DEFAULT_ENVIRONMENT: ExtensionEnvironment =
  process.env.NODE_ENV === "production" ? "production" : "development";

export interface RuntimeEndpoints {
  readonly apiBaseUrl: string;
  readonly deviceVerificationUrl: string;
}

export const RUNTIME_ENDPOINTS: Readonly<
  Record<ExtensionEnvironment, RuntimeEndpoints>
> = {
  development: {
    apiBaseUrl: "http://localhost:8080",
    deviceVerificationUrl: "http://localhost:3001/device",
  },
  production: {
    apiBaseUrl: "https://api.envval.com",
    deviceVerificationUrl: "https://envval.com/device",
  },
};

export const METADATA_STORAGE_KEY = "envval.metadata";
export const PROMPT_IGNORE_STORAGE_KEY = "envval.promptIgnore";
export const REPO_IDENTITIES_STORAGE_KEY = "envval.repoIdentities";
export const REPO_REGISTRATION_SKIPPED_KEY = "envval.repoRegistrationSkipped";
export const IGNORED_ENV_FILES: readonly string[] = [
  ".env.example",
  ".env.sample",
  ".env.template",
  ".env.dist",
  ".env.test",
  ".env.testing",
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
export const OPERATION_QUEUE_STORAGE_KEY = "envval.operationQueue";
export const OPERATION_QUEUE_MAX_SIZE = 100;

// Session refresh
export const SESSION_REFRESH_PATH =
  "/api/auth/extension/device/refresh-session";

// Notification throttling
export const NOTIFICATION_DEBOUNCE_MS = 5_000;

// Hover feature defaults
export const DEFAULT_HOVER_ENABLED = true;
export const DEFAULT_HOVER_SHOW_VALUES = true;
export const DEFAULT_HOVER_MASK_SENSITIVE = true;
export const DEFAULT_HOVER_SHOW_UNDEFINED = true;

// File size ceiling — reject env files above this before reading/encrypting
export const MAX_ENV_FILE_SIZE_BYTES = 256_000; // 256 KB raw (encrypts to ~340 KB base64)
