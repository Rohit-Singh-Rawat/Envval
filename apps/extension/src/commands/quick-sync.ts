import { commands, window } from 'vscode';
import Commands from './index';

function showQuickSyncAction() {
	const quickSyncAction = window.createQuickPick();
	quickSyncAction.items = [
		{ label: 'Force Sync', description: 'Force sync your environment variables' },
		{ label: 'Show Logs', description: 'Show the logs of your environment variables' },
		{ label: 'Logout', description: 'Clear credentials and sign out' },
	];

	return quickSyncAction;
}

export async function handleQuickSyncAction() {
	const quickPick = showQuickSyncAction();

	quickPick.onDidAccept(() => {
		const selection = quickPick.selectedItems[0];
		if (selection) {
			switch (selection.label) {
				case 'Force Sync':
					commands.executeCommand(Commands.FORCE_SYNC);
					break;
				case 'Show Logs':
					commands.executeCommand(Commands.SHOW_LOGS);
					break;
				case 'Logout':
					commands.executeCommand(Commands.LOGOUT);
					break;
			}
		}
		quickPick.dispose();
	});

	quickPick.onDidHide(() => quickPick.dispose());
	quickPick.show();
}
