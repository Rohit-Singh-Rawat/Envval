import { StatusBarAlignment, StatusBarItem, window, ThemeColor, Disposable } from "vscode";
import { Commands } from "../commands";

/**
 * Configuration for a status bar state
 */
interface StatusBarStateConfig {
  readonly icon: string;
  readonly tooltip: string;
  readonly color?: ThemeColor;
}

/**
 * Available states for the EnvVault status bar item.
 */
export type StatusBarState = 
  | "Unauthenticated" 
  | "Loading" 
  | "Authenticated" 
  | "Synced" 
  | "Syncing" 
  | "Error";

const StatusBarStates: Record<StatusBarState, StatusBarStateConfig> = {
  Unauthenticated: {
    icon: "$(circle-slash)",
    tooltip: "Not authenticated - Click to sign in",
  },
  Loading: {
    icon: "$(loading~spin)",
    tooltip: "Extension is initializing...",
  },
  Authenticated: {
    icon: "$(account)",
    tooltip: "Authenticated - Ready to sync",
  },
  Synced: {
    icon: "$(check)",
    tooltip: "All environment files are synced",
    color: new ThemeColor('charts.green'),
  },
  Syncing: {
    icon: "$(sync~spin)",
    tooltip: "Syncing environment files...",
  },
  Error: {
    icon: "$(warning)",
    tooltip: "Error occurred - Click for details",
    color: new ThemeColor('statusBarItem.errorForeground'),
  },
};

/**
 * Singleton class that manages the VS Code status bar item for EnvVault.
 * Implements a counter-based state machine to handle concurrent operations.
 */
export class StatusBar implements Disposable {
  private static instance: StatusBar;
  private readonly statusBarItem: StatusBarItem;
  
  private activeOperationsCount: number = 0;
  private lastKnownAuthState: boolean = false;

  private constructor() {
    this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 10);
    this.statusBarItem.command = Commands.SHOW_QUICK_SYNC_ACTION;
    this.updateBaseState();
    this.statusBarItem.show();
  }

  public static getInstance(): StatusBar {
    if (!StatusBar.instance) {
      StatusBar.instance = new StatusBar();
    }
    return StatusBar.instance;
  }

  public updateState(state: StatusBarState, customTooltip?: string): void {
    const config = StatusBarStates[state];
    this.statusBarItem.text = `${config.icon} EnvVault`;
    this.statusBarItem.tooltip = customTooltip || `EnvVault: ${config.tooltip}`;
    this.statusBarItem.color = config.color;
  }

  public setAuthenticationState(authenticated: boolean): void {
    this.lastKnownAuthState = authenticated;
    if (this.activeOperationsCount === 0) {
      this.updateBaseState();
    }
  }

  public setLoading(loading: boolean, message?: string): void {
    if (loading) {
      this.activeOperationsCount++;
      this.updateState("Loading", message);
    } else {
      this.decrementOpCount();
    }
  }

  public setSyncState(syncing: boolean, lastSyncedAt?: Date): void {
    if (syncing) {
      this.activeOperationsCount++;
      this.updateState("Syncing");
    } else {
      this.decrementOpCount(lastSyncedAt);
    }
  }

  public setSyncError(message?: string): void {
    this.updateState("Error", message);
  }

  private decrementOpCount(lastSyncedAt?: Date): void {
    this.activeOperationsCount = Math.max(0, this.activeOperationsCount - 1);
    if (this.activeOperationsCount === 0) {
      if (lastSyncedAt) {
        this.updateState("Synced", `EnvVault: Last synced at ${lastSyncedAt.toLocaleTimeString()}`);
      } else {
        this.updateBaseState();
      }
    }
  }

  private updateBaseState(): void {
    const state = this.lastKnownAuthState ? "Authenticated" : "Unauthenticated";
    this.updateState(state);
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }

  public static getStatusBarItemReference(): StatusBarItem {
    return StatusBar.getInstance().statusBarItem;
  }
}
