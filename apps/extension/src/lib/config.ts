import { Disposable, workspace } from "vscode";
import {
  DEFAULT_ENVIRONMENT,
  DEFAULT_HOVER_ENABLED,
  DEFAULT_HOVER_MASK_SENSITIVE,
  DEFAULT_HOVER_SHOW_UNDEFINED,
  DEFAULT_HOVER_SHOW_VALUES,
  DEFAULT_LOGGING_VERBOSE,
  DEFAULT_POLL_INTERVAL_SECONDS,
  type ExtensionEnvironment,
  RUNTIME_ENDPOINTS,
  VSCODE_CONFIG_SECTION,
} from "./constants";

function isEnvironment(value: string): value is ExtensionEnvironment {
  return value === "development" || value === "production";
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getOptionalUrlOverride(configKey: string): string | undefined {
  const config = workspace.getConfiguration(VSCODE_CONFIG_SECTION);
  const rawValue = config.get<string>(configKey, "").trim();
  if (rawValue.length === 0) {
    return undefined;
  }

  const normalized = normalizeUrl(rawValue);
  return isValidHttpUrl(normalized) ? normalized : undefined;
}

export function getEnvironment(): ExtensionEnvironment {
  const config = workspace.getConfiguration(VSCODE_CONFIG_SECTION);
  const configured = config.get<string>("environment", DEFAULT_ENVIRONMENT);
  return isEnvironment(configured) ? configured : DEFAULT_ENVIRONMENT;
}

export function getApiBaseUrl(): string {
  const override = getOptionalUrlOverride("apiBaseUrlOverride");
  if (override) {
    return override;
  }
  return RUNTIME_ENDPOINTS[getEnvironment()].apiBaseUrl;
}

export function getDeviceVerificationUrl(): string {
  const override = getOptionalUrlOverride("deviceVerificationUrlOverride");
  if (override) {
    return override;
  }
  return RUNTIME_ENDPOINTS[getEnvironment()].deviceVerificationUrl;
}

export interface VSCodeConfig {
  readonly pollIntervalSeconds: number;
  readonly loggingVerbose: boolean;
}

export interface RuntimeConfig extends VSCodeConfig {
  readonly environment: ExtensionEnvironment;
}

export function getVSCodeConfig(): VSCodeConfig {
  const config = workspace.getConfiguration(VSCODE_CONFIG_SECTION);
  return {
    pollIntervalSeconds: config.get<number>(
      "pollIntervalSeconds",
      DEFAULT_POLL_INTERVAL_SECONDS,
    ),
    loggingVerbose: config.get<boolean>(
      "loggingVerbose",
      DEFAULT_LOGGING_VERBOSE,
    ),
  };
}

export function getRuntimeConfig(): RuntimeConfig {
  return {
    ...getVSCodeConfig(),
    environment: getEnvironment(),
  };
}

export function getLoggingVerbose(): boolean {
  return getVSCodeConfig().loggingVerbose;
}

export function onConfigChange(
  listener: (config: RuntimeConfig) => void,
): Disposable {
  return workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration(VSCODE_CONFIG_SECTION)) {
      listener(getRuntimeConfig());
    }
  });
}

export interface HoverConfig {
  readonly enabled: boolean;
  readonly showValues: boolean;
  readonly maskSensitive: boolean;
  readonly showUndefined: boolean;
}

export function getHoverConfig(): HoverConfig {
  const config = workspace.getConfiguration(VSCODE_CONFIG_SECTION);
  return {
    enabled: config.get<boolean>("hover.enabled", DEFAULT_HOVER_ENABLED),
    showValues: config.get<boolean>(
      "hover.showValues",
      DEFAULT_HOVER_SHOW_VALUES,
    ),
    maskSensitive: config.get<boolean>(
      "hover.maskSensitive",
      DEFAULT_HOVER_MASK_SENSITIVE,
    ),
    showUndefined: config.get<boolean>(
      "hover.showUndefined",
      DEFAULT_HOVER_SHOW_UNDEFINED,
    ),
  };
}
