import * as vscode from "vscode";
import * as path from "path";
import { EnvvalVsCodeSecrets } from "../utils/secrets";
import { handleQuickSyncAction } from "./quick-sync";
import { AuthenticationProvider } from "../providers/auth-provider";
import { SyncManager } from "../watchers/env-sync-manager";
import { RepoIdentityCommands } from "./repo-identity";
import { Logger } from "../utils/logger";
import { EnvInitService } from "../services/env-init";
import { LoginWindow } from "../ui/login-window";
import { ConnectionMonitor } from "../services/connection-monitor";
import {
  METADATA_STORAGE_KEY,
  OPERATION_QUEUE_STORAGE_KEY,
  REPO_IDENTITIES_STORAGE_KEY,
} from "../lib/constants";

/**
 * Singleton class that manages all VS Code commands for the Envval extension.
 * Command identifiers follow the pattern 'envval.<action>' and are used throughout
 * the extension for status bar interactions, quick picks, and keyboard shortcuts.
 */
export class Commands {
  public static readonly SHOW_QUICK_SYNC_ACTION = "envval.showQuickSyncAction";
  public static readonly FORCE_SYNC = "envval.forceSync";
  public static readonly SHOW_LOGS = "envval.showLogs";
  public static readonly LOGOUT = "envval.logout";

  // Repository Identity Commands
  public static readonly VIEW_REPO_IDENTITY = "envval.viewRepoIdentity";
  public static readonly SET_MANUAL_REPO_IDENTITY =
    "envval.setManualRepoIdentity";
  public static readonly SET_SUB_PROJECT_PATH = "envval.setSubProjectPath";
  public static readonly RESET_REPO_IDENTITY = "envval.resetRepoIdentity";
  public static readonly MIGRATE_REPO_IDENTITY = "envval.migrateRepoIdentity";
  public static readonly DIAGNOSE_REPO_DETECTION =
    "envval.diagnoseRepoDetection";

  // Sync Commands
  public static readonly PUSH_ENV = "envval.pushEnv";
  public static readonly REFRESH_TRACKED_ENVS = "envval.refreshTrackedEnvs";
  public static readonly OPEN_FILE = "envval.openFile";
  public static readonly RETRY_CONNECTION = "envval.retryConnection";

  // UI/Welcome View Commands
  public static readonly SHOW_LOGIN = "envval.showLogin";
  public static readonly SHOW_INIT_PROMPT = "envval.showInitPrompt";

  // Dev-only — never registered in production
  public static readonly DEV_CLEAR_ALL_STATE = "envval.devClearAllState";

  private static instance: Commands;
  private registered = false;

  private constructor() {}

  public static getInstance(): Commands {
    if (!Commands.instance) {
      Commands.instance = new Commands();
    }
    return Commands.instance;
  }

  /**
   * Registers command handlers with VS Code. Only registers once per session
   * to avoid duplicate command registration errors.
   */
  public registerCommands(context: vscode.ExtensionContext) {
    // Legacy method kept for compatibility if needed, but logic is moved to registerHandlers
  }

  public registerHandlers(
    context: vscode.ExtensionContext,
    authProvider: AuthenticationProvider,
    syncManager: SyncManager,
    repoIdentityCommands: RepoIdentityCommands,
    envInitService: EnvInitService,
    logger: Logger,
  ): void {
    if (this.registered) {
      return;
    }

    context.subscriptions.push(
      // Quick Sync
      vscode.commands.registerCommand(Commands.SHOW_QUICK_SYNC_ACTION, () =>
        handleQuickSyncAction(
          context.extensionMode === vscode.ExtensionMode.Development,
        ),
      ),

      // Force Sync
      vscode.commands.registerCommand(Commands.FORCE_SYNC, async () => {
        await syncManager.pollRemoteChanges();
        vscode.window.showInformationMessage("Envval: Sync started...");
      }),

      // Show Logs
      vscode.commands.registerCommand(Commands.SHOW_LOGS, () => {
        logger.show();
      }),

      // Logout
      vscode.commands.registerCommand(Commands.LOGOUT, async () => {
        await EnvvalVsCodeSecrets.getInstance().clearAll();
        vscode.commands.executeCommand("workbench.action.reloadWindow");
      }),

      // Repo Identity Commands
      vscode.commands.registerCommand(Commands.VIEW_REPO_IDENTITY, () =>
        repoIdentityCommands.viewRepoIdentity(),
      ),
      vscode.commands.registerCommand(Commands.SET_MANUAL_REPO_IDENTITY, () =>
        repoIdentityCommands.setManualRepoIdentity(),
      ),
      vscode.commands.registerCommand(Commands.SET_SUB_PROJECT_PATH, () =>
        repoIdentityCommands.setSubProjectPath(),
      ),
      vscode.commands.registerCommand(Commands.RESET_REPO_IDENTITY, () =>
        repoIdentityCommands.resetRepoIdentity(),
      ),
      vscode.commands.registerCommand(Commands.MIGRATE_REPO_IDENTITY, () =>
        repoIdentityCommands.migrateRepoIdentity(),
      ),
      vscode.commands.registerCommand(Commands.DIAGNOSE_REPO_DETECTION, () =>
        repoIdentityCommands.diagnoseRepoDetection(),
      ),

      // Sync Commands from Tree View or Palette
      vscode.commands.registerCommand(
        Commands.PUSH_ENV,
        async (itemOrEnvId?: string | { metadata: { envId: string } }) => {
          let envId: string | undefined;

          if (typeof itemOrEnvId === "string") {
            envId = itemOrEnvId;
          } else if (
            itemOrEnvId &&
            typeof itemOrEnvId === "object" &&
            itemOrEnvId.metadata
          ) {
            // Triggered from Tree Item
            envId = itemOrEnvId.metadata.envId;
          }

          if (envId) {
            await syncManager.pushEnv(envId);
          } else {
            // If no ID, could show a quickpick of tracked envs
            vscode.window.showErrorMessage(
              "Envval: No environment specified for sync.",
            );
          }
        },
      ),

      vscode.commands.registerCommand(
        Commands.OPEN_FILE,
        async (itemOrUri?: vscode.Uri | { metadata: { fileName: string } }) => {
          let uri: vscode.Uri | undefined;

          if (itemOrUri instanceof vscode.Uri) {
            uri = itemOrUri;
          } else if (
            itemOrUri &&
            typeof itemOrUri === "object" &&
            "metadata" in itemOrUri
          ) {
            // Triggered from Tree Item
            const fileName = itemOrUri.metadata.fileName;
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders?.length) {
              uri = vscode.Uri.file(
                path.join(workspaceFolders[0].uri.fsPath, fileName),
              );
            }
          }

          if (uri) {
            await vscode.commands.executeCommand("vscode.open", uri);
          }
        },
      ),

      // Welcome View Trigger Handlers
      vscode.commands.registerCommand(Commands.SHOW_LOGIN, async () => {
        LoginWindow.getInstance(context, authProvider, logger).show();
      }),

      vscode.commands.registerCommand(Commands.SHOW_INIT_PROMPT, async () => {
        // force=true bypasses the workspace-level registration skip so the user
        // can explicitly register after having previously clicked "Skip".
        await envInitService.performInitialCheck(0, true);
      }),

      // Connection
      vscode.commands.registerCommand(Commands.RETRY_CONNECTION, () => {
        ConnectionMonitor.getInstance().retryNow();
      }),
    );

    // Dev-only: nuclear clear — wipes all persisted state that survives logout
    if (context.extensionMode === vscode.ExtensionMode.Development) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          Commands.DEV_CLEAR_ALL_STATE,
          async () => {
            await Promise.all([
              context.globalState.update(
                REPO_IDENTITIES_STORAGE_KEY,
                undefined,
              ),
              context.workspaceState.update(METADATA_STORAGE_KEY, undefined),
              context.workspaceState.update(
                OPERATION_QUEUE_STORAGE_KEY,
                undefined,
              ),
              EnvvalVsCodeSecrets.getInstance().clearAll(),
            ]);
            vscode.window.showInformationMessage(
              "[Dev] All state cleared. Reloading...",
            );
            vscode.commands.executeCommand("workbench.action.reloadWindow");
          },
        ),
      );
    }

    this.registered = true;
  }

  public static getCommands(): string[] {
    return [Commands.FORCE_SYNC, Commands.SHOW_LOGS, Commands.LOGOUT];
  }
}

export default Commands;
