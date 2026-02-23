import { ExtensionContext, OutputChannel, window } from "vscode";
import { VSCODE_CONFIG_SECTION } from "../lib/constants";
import { getRuntimeConfig, type RuntimeConfig } from "../lib/config";

export class Logger {
  private static instance: Logger;
  private readonly channel: OutputChannel;
  private runtimeConfig: RuntimeConfig;

  private constructor(ctx: ExtensionContext, runtimeConfig: RuntimeConfig) {
    this.channel = window.createOutputChannel(VSCODE_CONFIG_SECTION);
    this.runtimeConfig = runtimeConfig;
    ctx.subscriptions.push(this.channel);
  }

  public static getInstance(
    ctx: ExtensionContext,
    runtimeConfig?: RuntimeConfig,
  ): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(ctx, runtimeConfig ?? getRuntimeConfig());
    }
    return Logger.instance;
  }

  private isVerbose(): boolean {
    return (
      this.runtimeConfig.environment === "development" ||
      this.runtimeConfig.loggingVerbose
    );
  }

  private write(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    this.channel.appendLine(`${timestamp} [${level}] ${message}`);
  }

  public debug(message: string): void {
    if (this.isVerbose()) {
      this.write("DEBUG", message);
    }
  }

  public info(message: string): void {
    this.write("INFO", message);
  }

  public warn(message: string): void {
    this.write("WARN", message);
  }

  public error(message: string): void {
    this.write("ERROR", message);
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
  runtimeConfig?: RuntimeConfig,
): Logger {
  return Logger.getInstance(ctx, runtimeConfig);
}
