import { commands, window, QuickPickItem } from 'vscode';
import Commands from './index';

interface ActionItem extends QuickPickItem {
	readonly commandId: string;
}

// Built lazily inside handleQuickSyncAction to avoid the circular import
// between this file and commands/index.ts — at module-load time, the
// Commands class has not finished initializing its static properties.
function getActions(): ActionItem[] {
	return [
		{ label: '$(sync) Force Sync', description: 'Force sync your environment variables', commandId: Commands.FORCE_SYNC },
		{ label: '$(plug) Retry Connection', description: 'Test server connectivity', commandId: Commands.RETRY_CONNECTION },
		{ label: '$(output) Show Logs', description: 'Open the extension output log', commandId: Commands.SHOW_LOGS },
		{ label: '$(sign-out) Logout', description: 'Clear credentials and sign out', commandId: Commands.LOGOUT },
	];
}

export async function handleQuickSyncAction(): Promise<void> {
	const quickPick = window.createQuickPick<ActionItem>();
	quickPick.items = getActions();
	quickPick.placeholder = 'EnvVault Actions';

	quickPick.onDidAccept(() => {
		const selected = quickPick.selectedItems[0];
		if (selected) {
			commands.executeCommand(selected.commandId);
		}
		quickPick.dispose();
	});

	quickPick.onDidHide(() => quickPick.dispose());
	quickPick.show();
}
