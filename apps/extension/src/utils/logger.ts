import { ExtensionContext, OutputChannel, window } from "vscode";
import { VSCODE_CONFIG_SECTION } from "../lib/constants";
import { getLoggingVerbose } from "../lib/config";

export class Logger {
  private static instance: Logger;
  private readonly channel: OutputChannel;
  private verbose: boolean;

  private constructor(ctx: ExtensionContext, verbose: boolean) {
    this.channel = window.createOutputChannel(VSCODE_CONFIG_SECTION);
    this.verbose = verbose;
    ctx.subscriptions.push(this.channel);
  }

  public static getInstance(
    ctx: ExtensionContext,
    verbose?: boolean
  ): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(ctx, verbose ?? getLoggingVerbose());
    }
    return Logger.instance;
  }

  private write(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    this.channel.appendLine(`${timestamp} [${level}] ${message}`);
  }

  public log(message: string): void {
    if (this.verbose) {
      this.write("LOG", message);
    }
  }

  public debug(message: string): void {
    if (this.verbose) {
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

  public setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }
}

export function createLogger(
  ctx: ExtensionContext,
  verbose?: boolean
): Logger {
  return Logger.getInstance(ctx, verbose);
}
