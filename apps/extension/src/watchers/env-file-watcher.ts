import path from "path";
import { EventEmitter, ExtensionContext, FileSystemWatcher, RelativePattern, Uri, workspace } from "vscode";
import { debounce } from "../utils/debounce";
import { IGNORED_ENV_FILES } from "../lib/constants";
import { toWorkspaceRelativePath } from "../utils/path-validator";
import { Logger } from "../utils/logger";

export interface EnvFileEvent {
  readonly uri: Uri;
  readonly fileName: string;
  readonly workspacePath: string;
}

export class EnvFileWatcher {
  private watchers: FileSystemWatcher[] = [];
  private static instance: EnvFileWatcher;
  private readonly changeEmitter = new EventEmitter<EnvFileEvent>();
  private readonly createEmitter = new EventEmitter<EnvFileEvent>();
  private readonly deleteEmitter = new EventEmitter<EnvFileEvent>();

  private readonly debouncedChange = debounce((uri: Uri) => {
    this.changeEmitter.fire(this.buildEvent(uri));
  }, 1000);

  private readonly debouncedCreate = debounce((uri: Uri) => {
    this.createEmitter.fire(this.buildEvent(uri));
  }, 1000);

  private readonly debouncedDelete = debounce((uri: Uri) => {
    this.deleteEmitter.fire(this.buildEvent(uri));
  }, 1000);

  public readonly onDidChange = this.changeEmitter.event;
  public readonly onDidCreate = this.createEmitter.event;
  public readonly onDidDelete = this.deleteEmitter.event;
  private readonly logger: Logger;

  private constructor(private context: ExtensionContext, logger: Logger) {
    this.logger = logger;
  }

  public static getInstance(context: ExtensionContext, logger: Logger): EnvFileWatcher {
    if (!EnvFileWatcher.instance) {
      EnvFileWatcher.instance = new EnvFileWatcher(context, logger);
    }
    return EnvFileWatcher.instance;
  }

  private buildEvent(uri: Uri): EnvFileEvent {
    return {
      uri,
      fileName: toWorkspaceRelativePath(uri),
      workspacePath: workspace.workspaceFolders?.[0]?.uri.fsPath ?? '',
    };
  }

  private isIgnored(uri: Uri): boolean {
    return IGNORED_ENV_FILES.includes(path.basename(uri.fsPath));
  }

  private handleChange(uri: Uri): void {
    if (this.isIgnored(uri)) { return; }
    this.logger.debug(`File change detected: ${uri.fsPath}`);
    this.debouncedChange(uri);
  }

  private handleCreate(uri: Uri): void {
    if (this.isIgnored(uri)) { return; }
    this.logger.debug(`File creation detected: ${uri.fsPath}`);
    this.debouncedCreate(uri);
  }

  private handleDelete(uri: Uri): void {
    if (this.isIgnored(uri)) { return; }
    this.logger.debug(`File deletion detected: ${uri.fsPath}`);
    this.debouncedDelete(uri);
  }

  public start(): void {
    if (this.watchers.length > 0) {
      this.logger.debug('EnvFileWatcher already started, skipping');
      return;
    }

    const rootUri = workspace.workspaceFolders?.[0]?.uri;
    if (!rootUri) {
      this.logger.warn('EnvFileWatcher: No workspace folder — cannot start');
      return;
    }

    const pattern = new RelativePattern(rootUri, '**/.env*');
    this.logger.debug(`Starting EnvFileWatcher with pattern: ${pattern.pattern}`);

    const watcher = workspace.createFileSystemWatcher(pattern);

    watcher.onDidCreate(uri => this.handleCreate(uri));
    watcher.onDidChange(uri => this.handleChange(uri));
    watcher.onDidDelete(uri => this.handleDelete(uri));

    this.watchers.push(watcher);
    this.context.subscriptions.push(watcher);
  }

  public stop(): void {
    this.logger.debug('Stopping EnvFileWatcher');
    this.debouncedChange.cancel();
    this.debouncedCreate.cancel();
    this.debouncedDelete.cancel();
    this.watchers.forEach(w => w.dispose());
    this.watchers = [];
  }

  public dispose(): void {
    this.stop();
    this.changeEmitter.dispose();
    this.createEmitter.dispose();
    this.deleteEmitter.dispose();
  }
}
