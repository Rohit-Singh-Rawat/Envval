import * as vscode from 'vscode';
import { EnvvalMetadataStore, EnvMetadata } from '../services/metadata-store';
import { EnvFileWatcher } from '../watchers/env-file-watcher';
import { EnvStatusCalculator } from '../services/env-status-calculator';
import * as path from 'path';
import { Commands } from '../commands';
import { Logger } from '../utils/logger';
import { formatError } from '../utils/format-error';

/**
 * State of an environment file relative to the remote vault.
 */
export type EnvSyncStatus = 'synced' | 'modified' | 'conflict' | 'missing';


/**
 * Computes the shortest unique display labels for a set of folder paths.
 * Mirrors VS Code's own tab-disambiguation approach: start with just the
 * last segment of each path, then progressively add parent segments only
 * where collisions exist.
 *
 * Example:
 *   ["apps/api", "apps/web", "packages/shared/libs/config"]
 *   → Map { "apps/api" => "api", "apps/web" => "web", "packages/shared/libs/config" => "config" }
 *
 *   If two paths end with the same segment (e.g. "libs/utils/config" and "app/config"):
 *   → Map { "libs/utils/config" => "utils/config", "app/config" => "app/config" }
 *
 * Performance: O(n·d) where n = number of paths, d = max depth needed.
 * Termination: guaranteed because depth only increases when it is still below
 * the path's segment count, so expansion halts when no path can grow further.
 */
function computeShortLabels(fullPaths: string[]): Map<string, string> {
	if (fullPaths.length === 0) {
		return new Map();
	}

	const segmentsMap = new Map<string, string[]>(fullPaths.map((p) => [p, p.split('/')]));
	const depthMap = new Map<string, number>(fullPaths.map((p) => [p, 1]));

	for (;;) {
		const currentLabels = new Map<string, string>();
		for (const fullPath of fullPaths) {
			const segments = segmentsMap.get(fullPath)!;
			const depth = depthMap.get(fullPath)!;
			currentLabels.set(fullPath, segments.slice(-depth).join('/'));
		}

		const labelToFullPaths = new Map<string, string[]>();
		for (const [fullPath, label] of currentLabels) {
			const existing = labelToFullPaths.get(label);
			if (existing) {
				existing.push(fullPath);
			} else {
				labelToFullPaths.set(label, [fullPath]);
			}
		}

		let expanded = false;
		for (const [, paths] of labelToFullPaths) {
			if (paths.length > 1) {
				for (const p of paths) {
					const segments = segmentsMap.get(p)!;
					const currentDepth = depthMap.get(p)!;
					if (currentDepth < segments.length) {
						depthMap.set(p, currentDepth + 1);
						expanded = true;
					}
				}
			}
		}

		if (!expanded) {
			return currentLabels;
		}
	}
}


/**
 * Provides the environment list for the VS Code sidebar.
 * Supports hierarchical grouping by folder and real-time status tracking.
 */
export class TrackedEnvsProvider
	implements vscode.TreeDataProvider<EnvItem | FolderItem>, vscode.Disposable
{
	private readonly _onDidChangeTreeData = new vscode.EventEmitter<
		EnvItem | FolderItem | undefined | void
	>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
	private readonly disposables: vscode.Disposable[] = [];
	private readonly itemRegistry = new Map<string, EnvItem>();

	constructor(
		private readonly metadataStore: EnvvalMetadataStore,
		private readonly fileWatcher: EnvFileWatcher,
		private readonly statusCalculator: EnvStatusCalculator,
		private readonly logger: Logger,
		private readonly isAuthenticated: () => Promise<boolean>
	) {
		this.disposables.push(
			this.metadataStore.onDidChangeMetadata(() => {
				this.logger.debug('Metadata changed, refreshing tree view');
				this.refresh();
			})
		);

		this.disposables.push(
			this.fileWatcher.onDidChange((event) => {
				this.logger.debug(`File changed: ${event.fileName}, refreshing tree view`);
				this.statusCalculator.invalidateCache(event.fileName);
				const item = this.itemRegistry.get(event.fileName);
				if (item) {
					item.updateStatus();
					this._onDidChangeTreeData.fire(item);
				} else {
					this.refresh();
				}
			}),
			this.fileWatcher.onDidCreate((event) => {
				this.logger.debug(`File created: ${event.fileName}, refreshing tree view`);
				this.refresh();
			}),
			this.fileWatcher.onDidDelete((event) => {
				this.logger.debug(`File deleted: ${event.fileName}, refreshing tree view`);
				this.statusCalculator.invalidateCache(event.fileName);
				this.refresh();
			})
		);
	}

	dispose(): void {
		this.disposables.forEach((d) => d.dispose());
		this._onDidChangeTreeData.dispose();
		this.itemRegistry.clear();
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
			if (!(await this.isAuthenticated())) {
				return [];
			}

			const trackedEnvs = await this.metadataStore.getAllTrackedEnvs();

			if (!element) {
				return this.buildRootItems(trackedEnvs);
			}

			if (element instanceof FolderItem) {
				const children = element.envs.map((meta) => {
					const item = new EnvItem(meta, this.statusCalculator);
					this.itemRegistry.set(meta.fileName, item);
					return item;
				});
				return children;
			}

			return [];
		} catch (error) {
			this.logger.error(`Failed to build tree view: ${formatError(error)}`);
			return [];
		}
	}

	private buildRootItems(trackedEnvs: EnvMetadata[]): (EnvItem | FolderItem)[] {
		this.itemRegistry.clear();

		const rootItems: (EnvItem | FolderItem)[] = [];
		const folders = new Map<string, EnvMetadata[]>();

		for (const meta of trackedEnvs) {
			const dirPath = path.posix.dirname(meta.fileName);
			if (dirPath === '.') {
				const item = new EnvItem(meta, this.statusCalculator);
				this.itemRegistry.set(meta.fileName, item);
				rootItems.push(item);
			} else {
				const existing = folders.get(dirPath);
				if (existing) {
					existing.push(meta);
				} else {
					folders.set(dirPath, [meta]);
				}
			}
		}

		const shortLabels = computeShortLabels(Array.from(folders.keys()));

		for (const [folderPath, envs] of folders) {
			const displayLabel = shortLabels.get(folderPath) ?? folderPath;
			rootItems.push(new FolderItem(folderPath, displayLabel, envs));
		}

		return rootItems.sort((a, b) => {
			if (a instanceof FolderItem && !(b instanceof FolderItem)) {
				return -1;
			}
			if (!(a instanceof FolderItem) && b instanceof FolderItem) {
				return 1;
			}

			const aLabel = typeof a.label === 'string' ? a.label : (a.label?.label ?? '');
			const bLabel = typeof b.label === 'string' ? b.label : (b.label?.label ?? '');
			return aLabel.localeCompare(bLabel);
		});
	}
}


export class FolderItem extends vscode.TreeItem {
	constructor(
		public readonly folderPath: string,
		displayLabel: string,
		public readonly envs: EnvMetadata[]
	) {
		super(displayLabel, vscode.TreeItemCollapsibleState.Expanded);
		this.iconPath = new vscode.ThemeIcon(
			'folder-opened',
			new vscode.ThemeColor('symbolIcon.folderForeground')
		);
		this.contextValue = 'folderItem';
		this.description = displayLabel !== folderPath ? folderPath : undefined;
		this.tooltip = `${folderPath} (${envs.length} environment${envs.length !== 1 ? 's' : ''})`;
	}
}

export class EnvItem extends vscode.TreeItem {
	constructor(
		public readonly metadata: EnvMetadata,
		private readonly statusCalculator: EnvStatusCalculator
	) {
		super(path.basename(metadata.fileName), vscode.TreeItemCollapsibleState.None);
		this.applyStatus();
		this.command = {
			command: Commands.OPEN_FILE,
			title: 'Open File',
			arguments: [this],
		};
	}

	/**
	 * Recalculates and updates visual properties in-place.
	 * Called for targeted refreshes to avoid a full tree reload.
	 */
	updateStatus(): void {
		this.applyStatus();
	}

	private applyStatus(): void {
		const status = this.statusCalculator.calculateStatus(this.metadata);
		const lastSynced = new Date(this.metadata.lastSyncedAt);
		const relativeTime = this.getRelativeTime(lastSynced);

		this.tooltip = this.createTooltip(status, lastSynced, relativeTime);
		this.description = `(${this.metadata.envCount} vars) • ${relativeTime}`;
		this.iconPath = this.getIcon(status);
		this.contextValue = `envItem:${status}`;

		this.accessibilityInformation = {
			label: `${this.metadata.fileName}, status: ${status}, ${this.metadata.envCount} variables, last synced ${relativeTime}`,
			role: 'link',
		};
	}

	private getIcon(status: EnvSyncStatus): vscode.ThemeIcon {
		switch (status) {
			case 'synced':
				return new vscode.ThemeIcon('shield-check', new vscode.ThemeColor('charts.green'));
			case 'modified':
				return new vscode.ThemeIcon('pencil', new vscode.ThemeColor('charts.blue'));
			case 'conflict':
				return new vscode.ThemeIcon('warning', new vscode.ThemeColor('statusBarItem.errorForeground'));
			case 'missing':
				return new vscode.ThemeIcon('error', new vscode.ThemeColor('list.errorForeground'));
		}
	}

	private createTooltip(
		status: EnvSyncStatus,
		lastSynced: Date,
		relativeTime: string
	): vscode.MarkdownString {
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

		if (diffInSeconds < 60) {
			return 'just now';
		}
		if (diffInSeconds < 3600) {
			return `${Math.floor(diffInSeconds / 60)}m ago`;
		}
		if (diffInSeconds < 86400) {
			return `${Math.floor(diffInSeconds / 3600)}h ago`;
		}
		return `${Math.floor(diffInSeconds / 86400)}d ago`;
	}
}
