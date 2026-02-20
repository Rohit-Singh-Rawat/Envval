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
export type EnvSyncStatus = 'synced' | 'modified' | 'conflict' | 'ignored';

// ── Display helpers ──────────────────────────────────────────────────

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

	// Pre-split into segments once — O(1) lookup by path key instead of indexOf
	const segmentsMap = new Map<string, string[]>(fullPaths.map((p) => [p, p.split('/')]));
	const depthMap = new Map<string, number>(fullPaths.map((p) => [p, 1]));

	for (;;) {
		// Build candidate labels from the trailing `depth` segments of each path
		const currentLabels = new Map<string, string>();
		for (const fullPath of fullPaths) {
			const segments = segmentsMap.get(fullPath)!;
			const depth = depthMap.get(fullPath)!;
			currentLabels.set(fullPath, segments.slice(-depth).join('/'));
		}

		// Group paths by their current label to detect collisions
		const labelToFullPaths = new Map<string, string[]>();
		for (const [fullPath, label] of currentLabels) {
			const existing = labelToFullPaths.get(label);
			if (existing) {
				existing.push(fullPath);
			} else {
				labelToFullPaths.set(label, [fullPath]);
			}
		}

		// Expand depth only for colliding paths that still have room to grow.
		// If no path was expanded the labels are as unique as possible — done.
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

// ── Tree data provider ───────────────────────────────────────────────

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

	constructor(
		private readonly metadataStore: EnvvalMetadataStore,
		private readonly fileWatcher: EnvFileWatcher,
		private readonly statusCalculator: EnvStatusCalculator,
		private readonly logger: Logger
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
				this.refresh();
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
				return this.buildRootItems(trackedEnvs);
			}

			if (element instanceof FolderItem) {
				return element.envs.map((meta) => new EnvItem(meta, this.statusCalculator));
			}

			return [];
		} catch (error) {
			this.logger.error(`Failed to build tree view: ${formatError(error)}`);
			return [];
		}
	}

	private buildRootItems(trackedEnvs: EnvMetadata[]): (EnvItem | FolderItem)[] {
		const rootItems: (EnvItem | FolderItem)[] = [];
		const folders = new Map<string, EnvMetadata[]>();

		for (const meta of trackedEnvs) {
			const dirPath = path.posix.dirname(meta.fileName);
			if (dirPath === '.') {
				rootItems.push(new EnvItem(meta, this.statusCalculator));
			} else {
				const existing = folders.get(dirPath);
				if (existing) {
					existing.push(meta);
				} else {
					folders.set(dirPath, [meta]);
				}
			}
		}

		// Compute short display labels for all folder paths at once
		const shortLabels = computeShortLabels(Array.from(folders.keys()));

		for (const [folderPath, envs] of folders) {
			const displayLabel = shortLabels.get(folderPath) ?? folderPath;
			rootItems.push(new FolderItem(folderPath, displayLabel, envs));
		}

		return rootItems.sort((a, b) => {
			// Folders first, then alphabetical
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

// ── Tree items ───────────────────────────────────────────────────────

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

		const status = this.statusCalculator.calculateStatus(metadata);
		const lastSynced = new Date(metadata.lastSyncedAt);
		const relativeTime = this.getRelativeTime(lastSynced);

		this.tooltip = this.createTooltip(status, lastSynced, relativeTime);
		this.description = `(${metadata.envCount} vars) • ${relativeTime}`;
		this.iconPath = this.getIcon(status);
		this.contextValue = `envItem:${status}`;

		this.accessibilityInformation = {
			label: `${metadata.fileName}, status: ${status}, ${metadata.envCount} variables, last synced ${relativeTime}`,
			role: 'link',
		};

		this.command = {
			command: Commands.OPEN_FILE,
			title: 'Open File',
			arguments: [this],
		};
	}

	private getIcon(status: EnvSyncStatus): vscode.ThemeIcon {
		switch (status) {
			case 'synced':
				return new vscode.ThemeIcon('shield-check', new vscode.ThemeColor('charts.green'));
			case 'modified':
				return new vscode.ThemeIcon('pencil', new vscode.ThemeColor('charts.blue'));
			case 'ignored':
				return new vscode.ThemeIcon(
					'circle-slash',
					new vscode.ThemeColor('problemsWarningIcon.foreground')
				);
			case 'conflict':
				return new vscode.ThemeIcon(
					'warning',
					new vscode.ThemeColor('statusBarItem.errorForeground')
				);
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
