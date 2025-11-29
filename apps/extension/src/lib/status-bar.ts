import { StatusBarAlignment, StatusBarItem, window } from "vscode";
import Commands from "./commands";
  
export enum StatusBarState {
  Unauthenticated = "🔴",
  Authenticated = "🟡",
  Synced = "🟢",
  Syncing = "🔁",
  Error = "⚠️",
}

export class StatusBar {
  private static instance: StatusBar;
  private statusBarItem: StatusBarItem;

  private constructor() {
    this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 10);

    this.statusBarItem.text = `${StatusBarState.Unauthenticated} EnvVault`;
    this.statusBarItem.tooltip = "EnvVault: Not authenticated";
    this.statusBarItem.command = Commands.SHOW_QUICK_SYNC_ACTION;
    this.statusBarItem.show();
  }

  public updateState(state: StatusBarState): void {
    this.statusBarItem.text = `${state} EnvVault`;
    this.statusBarItem.tooltip = `EnvVault: ${state}`;
  }

  public setAuthenticationState(authenticated: boolean): void {
    this.updateState(authenticated ? StatusBarState.Authenticated : StatusBarState.Unauthenticated);
  }

  public setSyncState(synced: boolean, lastSyncedAt?: Date): void {
    this.updateState(synced ? StatusBarState.Synced : StatusBarState.Syncing);
    if (lastSyncedAt) {
      this.statusBarItem.tooltip = `EnvVault: Synced at ${lastSyncedAt.toLocaleTimeString()}`;
    } else {
      this.statusBarItem.tooltip = "EnvVault: Syncing...";
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