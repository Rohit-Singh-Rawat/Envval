import * as vscode from "vscode";
import * as path from "path";
import { isPathSafe, type PathSafetyResult } from "../utils/path-safety";
import type { Logger } from "../utils/logger";

export interface ValidationResult {
  /** True when the path is objectively safe (not Desktop, C:\, etc.). */
  readonly isValid: boolean;
  /** True when the scan may proceed. Can be true even if `isValid` is false when the user explicitly overrides a warning. */
  readonly canProceed: boolean;
  readonly warnings: readonly string[];
  readonly workspacePath: string;
  readonly validationTimeMs: number;
}

/** Maps a safety reason code to a human-readable label. */
const REASON_TEXT: Record<string, string> = {
  root_drive: "entire drive",
  user_home_top: "home directory",
  user_home_subdir: "user folder",
  system_directory: "system directory",
};

/**
 * One-time startup gate that checks whether the open workspace is safe to scan.
 *
 * Runs once per session — the workspace folder cannot change without a VS Code restart.
 * Concurrent callers share a single in-flight Promise to prevent duplicate modals.
 * Re-validation is only available via the explicit `envval.validateWorkspace` command.
 */
export class WorkspaceValidator {
  private static instance: WorkspaceValidator;
  private readonly logger: Logger;
  private sessionResult: ValidationResult | undefined;
  private validationInFlight: Promise<ValidationResult> | undefined;
  private statusBarItem: vscode.StatusBarItem | undefined;

  private constructor(logger: Logger) {
    this.logger = logger;
  }

  public static getInstance(logger: Logger): WorkspaceValidator {
    if (!WorkspaceValidator.instance) {
      WorkspaceValidator.instance = new WorkspaceValidator(logger);
    }
    return WorkspaceValidator.instance;
  }

  /**
   * Validates the workspace path. Returns the stored session result on subsequent calls.
   * Pass `force: true` only from the explicit `envval.validateWorkspace` command.
   */
  public validateWorkspace(
    workspacePath: string,
    options: { showPrompts?: boolean; force?: boolean } = {},
  ): Promise<ValidationResult> {
    const { showPrompts = true, force = false } = options;

    if (this.sessionResult && !force) {
      this.logger.debug("Workspace already validated this session — skipping.");
      return Promise.resolve(this.sessionResult);
    }

    // Return the in-flight promise so concurrent callers share one result and one modal.
    if (this.validationInFlight) {
      return this.validationInFlight;
    }

    this.validationInFlight = this.runValidation(
      workspacePath,
      showPrompts,
    ).finally(() => {
      this.validationInFlight = undefined;
    });

    return this.validationInFlight;
  }

  /** Returns true if the scan can proceed. Used by env-init and repo-detection. */
  public async validateAndPromptIfNeeded(
    workspacePath: string,
  ): Promise<boolean> {
    const result = await this.validateWorkspace(workspacePath, {
      showPrompts: true,
    });
    return result.canProceed;
  }

  /** Resets the session result. Call only from the `envval.validateWorkspace` command. */
  public resetValidation(): void {
    this.sessionResult = undefined;
    this.logger.debug(
      "Session validation reset — will re-validate on next call.",
    );
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async runValidation(
    workspacePath: string,
    showPrompts: boolean,
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    this.logger.info(`Validating workspace path: ${workspacePath}`);

    const safetyResult = isPathSafe(workspacePath, {}, this.logger);

    if (!safetyResult.isSafe) {
      this.logger.warn(
        `Unsafe path detected: ${workspacePath} (${safetyResult.reason})`,
      );

      let canProceed = false;
      if (showPrompts) {
        canProceed = await this.promptForUnsafePath(
          workspacePath,
          safetyResult,
        );
      }

      const result: ValidationResult = {
        isValid: false,
        canProceed,
        warnings: [`Unsafe workspace path: ${safetyResult.suggestedAction}`],
        workspacePath,
        validationTimeMs: Date.now() - startTime,
      };

      this.sessionResult = result;
      this.updateStatusBar(result);
      return result;
    }

    const result: ValidationResult = {
      isValid: true,
      canProceed: true,
      warnings: [],
      workspacePath,
      validationTimeMs: Date.now() - startTime,
    };

    this.logger.info(`Workspace validated in ${result.validationTimeMs}ms`);
    this.sessionResult = result;
    this.updateStatusBar(result);
    return result;
  }

  /** Routes to the correct modal based on path severity. */
  private promptForUnsafePath(
    workspacePath: string,
    safetyResult: PathSafetyResult,
  ): Promise<boolean> {
    const isCritical =
      safetyResult.reason === "root_drive" ||
      safetyResult.reason === "system_directory";

    return isCritical
      ? this.showCriticalBlockingError(workspacePath, safetyResult)
      : this.showSoftWarning(workspacePath, safetyResult);
  }

  /** Hard block for root drives and system directories — user cannot override. */
  private async showCriticalBlockingError(
    workspacePath: string,
    safetyResult: PathSafetyResult,
  ): Promise<false> {
    const folderName = path.basename(workspacePath);
    const reasonText =
      REASON_TEXT[safetyResult.reason ?? ""] ?? "unsafe location";

    const choice = await vscode.window.showErrorMessage(
      `Envval: Cannot Use ${reasonText}`,
      {
        modal: true,
        detail: `You've opened "${folderName}" as a workspace.\n\nEnvval cannot scan ${reasonText} for security and performance reasons.\n\nPlease open a specific project folder instead.\nExample: "C:\\Projects\\MyApp" instead of "C:\\"`,
      },
      "Open Project Folder",
      "Close",
    );

    if (choice === "Open Project Folder") {
      await vscode.commands.executeCommand("vscode.openFolder");
    }

    return false;
  }

  /** Soft warning for broad user folders (Desktop, Documents, etc.). User can override. */
  private async showSoftWarning(
    workspacePath: string,
    safetyResult: PathSafetyResult,
  ): Promise<boolean> {
    const folderName = path.basename(workspacePath);
    const reasonText =
      REASON_TEXT[safetyResult.reason ?? ""] ?? "unsafe location";

    const choice = await vscode.window.showWarningMessage(
      "Envval: Unsafe Workspace Location",
      {
        modal: true,
        detail: `You've opened "${folderName}" (${reasonText}) as a workspace.\n\nEnvval works best with specific project folders.\n\nScanning "${folderName}" may:\n• Take 30–60 seconds on startup\n• Slow down VS Code\n• Find unrelated .env files\n• Drain laptop battery\n\nRecommend opening your project folder directly.`,
      },
      "Open Project Folder",
      "Scan Anyway (Not Recommended)",
      "Cancel",
    );

    if (choice === "Open Project Folder") {
      await vscode.commands.executeCommand("vscode.openFolder");
      return false;
    }

    return choice === "Scan Anyway (Not Recommended)";
  }

  private updateStatusBar(result: ValidationResult): void {
    if (!this.statusBarItem) {
      this.statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100,
      );
    }

    const folderName = path.basename(result.workspacePath);

    if (!result.canProceed) {
      this.statusBarItem.text = "$(warning) Envval: Unsafe workspace";
      this.statusBarItem.tooltip = `Workspace "${folderName}" is not recommended for Envval.\nClick to re-validate.`;
      this.statusBarItem.command = "envval.validateWorkspace";
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground",
      );
      this.statusBarItem.show();
    } else {
      this.statusBarItem.text = "$(check) Envval: Ready";
      this.statusBarItem.tooltip = "Workspace validated successfully";
      this.statusBarItem.backgroundColor = undefined;
      this.statusBarItem.show();
      setTimeout(() => this.statusBarItem?.hide(), 2000);
    }
  }
}
