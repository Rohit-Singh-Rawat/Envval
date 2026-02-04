import { workspace } from "vscode";
import {
  DEFAULT_LOGGING_VERBOSE,
  DEFAULT_POLL_INTERVAL_SECONDS,
  DEFAULT_HOVER_ENABLED,
  DEFAULT_HOVER_SHOW_VALUES,
  DEFAULT_HOVER_MASK_SENSITIVE,
  DEFAULT_HOVER_SHOW_UNDEFINED,
  VSCODE_CONFIG_SECTION,
} from "./constants";

interface EnvVaultConfig {
  apiBaseUrl: string;
}

export function getConfig(): EnvVaultConfig {
  return {
    apiBaseUrl:
      process.env.ENV_VAULT_API_BASE_URL || "http://localhost:3000",
  };
}

interface VSCodeConfig {
  pollIntervalSeconds: number;
  loggingVerbose: boolean;
}

export function getVSCodeConfig(): VSCodeConfig {
  const config = workspace.getConfiguration(VSCODE_CONFIG_SECTION);
  return {
    pollIntervalSeconds: parseInt(
      config.get("pollIntervalSeconds") ||
        DEFAULT_POLL_INTERVAL_SECONDS.toString()
    ),
    loggingVerbose:
      config.get("loggingVerbose") || DEFAULT_LOGGING_VERBOSE,
  };
}

export function getLoggingVerbose(): boolean {
  const config = getVSCodeConfig();
  return config.loggingVerbose;
}

export const onConfigChange = (listener: (config: VSCodeConfig) => void) => {
  const dispose = workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration(VSCODE_CONFIG_SECTION)) {
      listener(getVSCodeConfig());
    }
  });
  return dispose;
};

export interface HoverConfig {
  enabled: boolean;
  showValues: boolean;
  maskSensitive: boolean;
  showUndefined: boolean;
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
