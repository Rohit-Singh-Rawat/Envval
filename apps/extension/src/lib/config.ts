import { Disposable, workspace } from "vscode";
import {
  DEFAULT_LOGGING_VERBOSE,
  DEFAULT_POLL_INTERVAL_SECONDS,
  DEFAULT_HOVER_ENABLED,
  DEFAULT_HOVER_SHOW_VALUES,
  DEFAULT_HOVER_MASK_SENSITIVE,
  DEFAULT_HOVER_SHOW_UNDEFINED,
  API_BASE_URL,
  DEVICE_VERIFICATION_URL,
  VSCODE_CONFIG_SECTION,
} from "./constants";

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getDeviceVerificationUrl(): string {
  return DEVICE_VERIFICATION_URL;
}

export interface VSCodeConfig {
  readonly pollIntervalSeconds: number;
  readonly loggingVerbose: boolean;
}

export function getVSCodeConfig(): VSCodeConfig {
  const config = workspace.getConfiguration(VSCODE_CONFIG_SECTION);
  return {
    pollIntervalSeconds: config.get<number>(
      "pollIntervalSeconds",
      DEFAULT_POLL_INTERVAL_SECONDS
    ),
    loggingVerbose: config.get<boolean>(
      "loggingVerbose",
      DEFAULT_LOGGING_VERBOSE
    ),
  };
}

export function getLoggingVerbose(): boolean {
  return getVSCodeConfig().loggingVerbose;
}

export function onConfigChange(
  listener: (config: VSCodeConfig) => void
): Disposable {
  return workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration(VSCODE_CONFIG_SECTION)) {
      listener(getVSCodeConfig());
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
    showValues: config.get<boolean>("hover.showValues", DEFAULT_HOVER_SHOW_VALUES),
    maskSensitive: config.get<boolean>("hover.maskSensitive", DEFAULT_HOVER_MASK_SENSITIVE),
    showUndefined: config.get<boolean>("hover.showUndefined", DEFAULT_HOVER_SHOW_UNDEFINED),
  };
}
