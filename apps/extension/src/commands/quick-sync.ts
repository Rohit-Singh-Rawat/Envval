import { commands, window, QuickPickItem } from 'vscode';
import Commands from './index';

interface ActionItem extends QuickPickItem {
	readonly commandId: string;
}

// Built lazily inside handleQuickSyncAction to avoid the circular import
// between this file and commands/index.ts — at module-load time, the
// Commands class has not finished initializing its static properties.
function getActions(isDevMode: boolean): ActionItem[] {
	const items: ActionItem[] = [
		{ label: '$(sync) Force Sync', description: 'Force sync your environment variables', commandId: Commands.FORCE_SYNC },
		{ label: '$(plug) Retry Connection', description: 'Test server connectivity', commandId: Commands.RETRY_CONNECTION },
		{ label: '$(output) Show Logs', description: 'Open the extension output log', commandId: Commands.SHOW_LOGS },
		{ label: '$(sign-out) Logout', description: 'Clear credentials and sign out', commandId: Commands.LOGOUT },
	];

	if (isDevMode) {
		items.push({ label: '$(trash) [Dev] Clear All State', description: 'Wipe all persisted state and reload', commandId: Commands.DEV_CLEAR_ALL_STATE });
	}

	return items;
}

export async function handleQuickSyncAction(isDevMode = false): Promise<void> {
	const quickPick = window.createQuickPick<ActionItem>();
	quickPick.items = getActions(isDevMode);
	quickPick.placeholder = 'Envval Actions';

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
