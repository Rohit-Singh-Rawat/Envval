import { commands, ExtensionContext } from 'vscode';
import { EnvVaultVsCodeSecrets } from '../utils/secrets';
import { handleQuickSyncAction } from './quick-sync';

export class Commands {
	public static readonly SHOW_QUICK_SYNC_ACTION = 'envval.showQuickSyncAction';
	public static readonly OPEN_STATUS = 'envval.openStatus';
	public static readonly REAUTHENTICATE = 'envval.reauthenticate';
	public static readonly FORCE_SYNC = 'envval.forceSync';
	public static readonly SHOW_LOGS = 'envval.showLogs';
	public static readonly LOGOUT = 'envval.logout';

	private static instance: Commands;
	private registered = false;

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

		context.subscriptions.push(
			commands.registerCommand(Commands.SHOW_QUICK_SYNC_ACTION, handleQuickSyncAction),
			commands.registerCommand(Commands.LOGOUT, async () => {
				await EnvVaultVsCodeSecrets.getInstance().clearAll();
				commands.executeCommand('workbench.action.reloadWindow');
			})
		);

		this.registered = true;
	}

	public static getCommands(): string[] {
		return [
			Commands.OPEN_STATUS,
			Commands.REAUTHENTICATE,
			Commands.FORCE_SYNC,
			Commands.SHOW_LOGS,
			Commands.LOGOUT,
		];
	}
}

export default Commands;
