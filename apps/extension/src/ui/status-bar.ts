import { StatusBarAlignment, StatusBarItem, window } from "vscode";
import { Commands } from "../commands";

/**
 * Configuration for a status bar state
 */
interface StatusBarStateConfig {
  icon: string;
  tooltip: string;
}

/**
 * Available states for the EnvVault status bar item.
 * Each state has an icon and tooltip to communicate the current sync/auth status to the user.
 */
export const StatusBarStates = {
  Unauthenticated: {
    icon: "$(circle-slash)",
    tooltip: "Not authenticated - Click to sign in",
  },
  Authenticated: {
    icon: "$(account)",
    tooltip: "Authenticated - Ready to sync",
  },
  Synced: {
    icon: "$(check)",
    tooltip: "All environment files are synced",
  },
  Syncing: {
    icon: "$(sync~spin)",
    tooltip: "Syncing environment files...",
  },
  Error: {
    icon: "$(warning)",
    tooltip: "Error occurred - Click for details",
  },
} as const satisfies Record<string, StatusBarStateConfig>;

export type StatusBarState = keyof typeof StatusBarStates;

/**
 * Singleton class that manages the VS Code status bar item for EnvVault.
 * Displays the current authentication and sync state to the user.
 */
export class StatusBar {
  private static instance: StatusBar;
  private statusBarItem: StatusBarItem;

  private constructor() {
    this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 10);

    this.updateState("Unauthenticated");
    this.statusBarItem.command = Commands.SHOW_QUICK_SYNC_ACTION;
    this.statusBarItem.show();
  }

  /**
   * Updates the status bar to reflect the given state
   */
  public updateState(state: StatusBarState, customTooltip?: string): void {
    const config = StatusBarStates[state];
    this.statusBarItem.text = `${config.icon} EnvVault`;
    this.statusBarItem.tooltip = customTooltip || `EnvVault: ${config.tooltip}`;
  }

  public setAuthenticationState(authenticated: boolean): void {
    this.updateState(authenticated ? "Authenticated" : "Unauthenticated");
  }

  public setSyncState(synced: boolean, lastSyncedAt?: Date): void {
    if (synced && lastSyncedAt) {
      this.updateState("Synced", `EnvVault: Synced at ${lastSyncedAt.toLocaleTimeString()}`);
    } else if (synced) {
      this.updateState("Synced");
    } else {
      this.updateState("Syncing");
    }
  }

  public static getInstance(): StatusBar {
    if (!StatusBar.instance) {
      StatusBar.instance = new StatusBar();
    }
    return StatusBar.instance;
  }

  public static getStatusBarItem(): StatusBarItem {
    return StatusBar.getInstance().statusBarItem;
  }
}
