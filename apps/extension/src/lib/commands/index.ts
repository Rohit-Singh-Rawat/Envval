import { commands, ExtensionContext } from "vscode";
import { handleQuickSyncAction } from "./syncManager";

export class Commands {
  public static readonly SHOW_QUICK_SYNC_ACTION = "envvault.showQuickSyncAction";
  public static readonly OPEN_STATUS = "envvault.openStatus";
  public static readonly REAUTHENTICATE = "envvault.reauthenticate";
  public static readonly FORCE_SYNC = "envvault.forceSync";
  public static readonly SHOW_LOGS = "envvault.showLogs";
  private static instance: Commands;
  private registered: boolean = false;

  private constructor() {}

  public static getInstance(): Commands {
    if (!Commands.instance) {
      Commands.instance = new Commands();
    }
    return Commands.instance;
  }

  public registerCommands(context: ExtensionContext) {
    if (this.registered) {
      return;
    }
    context.subscriptions.push(commands.registerCommand(Commands.SHOW_QUICK_SYNC_ACTION, handleQuickSyncAction));
    this.registered = true;
    
  }

  public static getCommands(): string[] {
    return [
      Commands.OPEN_STATUS,
      Commands.REAUTHENTICATE,
      Commands.FORCE_SYNC,
      Commands.SHOW_LOGS
    ];
  }
}

export default Commands;