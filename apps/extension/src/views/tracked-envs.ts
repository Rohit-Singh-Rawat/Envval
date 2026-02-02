import * as vscode from 'vscode';
import { EnvVaultMetadataStore, EnvMetadata } from '../services/metadata-store';
import * as path from 'path';
import { Commands } from '../commands';

import { hashEnv } from '../utils/crypto';
import * as fs from 'fs';

/**
 * State of an environment file relative to the remote vault.
 */
export type EnvSyncStatus = 'synced' | 'modified' | 'conflict' | 'ignored';

/**
 * Provides the environment list for the VS Code sidebar.
 * Supports hierarchical grouping by folder and real-time status tracking.
 */
export class TrackedEnvsProvider implements vscode.TreeDataProvider<EnvItem | FolderItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<EnvItem | FolderItem | undefined | void> = new vscode.EventEmitter<EnvItem | FolderItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<EnvItem | FolderItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private readonly metadataStore: EnvVaultMetadataStore) {
		this.metadataStore.onDidChangeMetadata(() => {
			this.refresh();
		});
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
		this.updateWelcomeContext();
	}

	private async updateWelcomeContext(): Promise<void> {
		const envs = await this.metadataStore.getAllTrackedEnvs();
		vscode.commands.executeCommand('setContext', 'envval:empty', envs.length === 0);
	}

	getTreeItem(element: EnvItem | FolderItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: EnvItem | FolderItem): Promise<(EnvItem | FolderItem)[]> {
		try {
			const trackedEnvs = await this.metadataStore.getAllTrackedEnvs();
			
			if (!element) {
				// Root level - build folder structure
				const rootItems: (EnvItem | FolderItem)[] = [];
				const folders = new Map<string, EnvMetadata[]>();
				
				for (const meta of trackedEnvs) {
					const parts = meta.fileName.split(/[/\\]/);
					if (parts.length > 1) {
						const folderPath = parts.slice(0, -1).join('/');
						if (!folders.has(folderPath)) folders.set(folderPath, []);
						folders.get(folderPath)!.push(meta);
					} else {
						rootItems.push(new EnvItem(meta));
					}
				}
				
				// Add folders as top-level items
				for (const [folderPath, envs] of folders.entries()) {
					rootItems.push(new FolderItem(folderPath, envs));
				}
				
				return rootItems.sort((a, b) => {
					// Folders first
					if (a instanceof FolderItem && !(b instanceof FolderItem)) return -1;
					if (!(a instanceof FolderItem) && b instanceof FolderItem) return 1;
					
					const aLabel = typeof a.label === 'string' ? a.label : a.label?.label || '';
					const bLabel = typeof b.label === 'string' ? b.label : b.label?.label || '';
					return aLabel.localeCompare(bLabel);
				});
			}

			if (element instanceof FolderItem) {
				return element.envs.map(meta => new EnvItem(meta));
			}

			return [];
		} catch (error) {
			return [];
		}
	}
}

export class FolderItem extends vscode.TreeItem {
	constructor(public readonly folderPath: string, public readonly envs: EnvMetadata[]) {
		super(folderPath, vscode.TreeItemCollapsibleState.Expanded);
		this.iconPath = new vscode.ThemeIcon('folder-opened', new vscode.ThemeColor('symbolIcon.folderForeground'));
		this.contextValue = 'folderItem';
		this.description = `(${envs.length} environments)`;
	}
}

export class EnvItem extends vscode.TreeItem {
	constructor(public readonly metadata: EnvMetadata) {
		const basename = path.basename(metadata.fileName);
		super(basename, vscode.TreeItemCollapsibleState.None);

		const status = this.calculateStatus();
		const lastSynced = new Date(metadata.lastSyncedAt);
		const relativeTime = this.getRelativeTime(lastSynced);

		this.tooltip = this.createTooltip(status, lastSynced, relativeTime);
		this.description = `(${metadata.envCount} vars) • ${relativeTime}`;
		this.iconPath = this.getIcon(status);
		this.contextValue = `envItem:${status}`;
		
		this.accessibilityInformation = {
			label: `${metadata.fileName}, status: ${status}, ${metadata.envCount} variables, last synced ${relativeTime}`,
			role: 'link'
		};

		this.command = {
			command: Commands.OPEN_FILE,
			title: 'Open File',
			arguments: [this],
		};
	}

	private calculateStatus(): EnvSyncStatus {
		if (this.metadata.ignoredAt) return 'ignored';
		
		const uri = this.getFileUri(this.metadata.fileName);
		if (!fs.existsSync(uri.fsPath)) return 'synced'; // Or missing? Synced for now if it's not local

		try {
			const content = fs.readFileSync(uri.fsPath, 'utf8');
			const localHash = hashEnv(content);
			return localHash === this.metadata.lastSyncedHash ? 'synced' : 'modified';
		} catch (error) {
			return 'synced'; 
		}
	}

	private getIcon(status: EnvSyncStatus): vscode.ThemeIcon {
		switch (status) {
			case 'synced':
				return new vscode.ThemeIcon('shield-check', new vscode.ThemeColor('charts.green'));
			case 'modified':
				return new vscode.ThemeIcon('pencil', new vscode.ThemeColor('charts.blue'));
			case 'ignored':
				return new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('problemsWarningIcon.foreground'));
			case 'conflict':
				return new vscode.ThemeIcon('warning', new vscode.ThemeColor('statusBarItem.errorForeground'));
		}
	}

	private createTooltip(status: EnvSyncStatus, lastSynced: Date, relativeTime: string): vscode.MarkdownString {
		const md = new vscode.MarkdownString();
		md.appendMarkdown(`**Environment:** ${this.metadata.fileName}  \n`);
		md.appendMarkdown(`**Status:** ${status.charAt(0).toUpperCase() + status.slice(1)}  \n`);
		md.appendMarkdown(`**Variables:** ${this.metadata.envCount}  \n`);
		md.appendMarkdown(`**Last Sync:** ${lastSynced.toLocaleString()} (${relativeTime})  \n`);
		md.appendMarkdown(`\n---\n\n`);
		md.appendMarkdown(`*ID: \`${this.metadata.envId}\`*`);
		return md;
	}

	private getRelativeTime(date: Date): string {
		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (diffInSeconds < 60) return 'just now';
		if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
		if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
		return `${Math.floor(diffInSeconds / 86400)}d ago`;
	}

	private getFileUri(fileName: string): vscode.Uri {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			const rootPath = workspaceFolders[0].uri.fsPath;
			return vscode.Uri.file(path.join(rootPath, fileName));
		}
		return vscode.Uri.file(fileName);
	}
}
