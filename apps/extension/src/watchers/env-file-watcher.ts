import path from "path";
import { EventEmitter, ExtensionContext, FileSystemWatcher, RelativePattern, Uri, workspace } from "vscode";
import { IGNORED_ENV_FILES } from "../lib/constants";
import { toWorkspaceRelativePath } from "../utils/path-validator";
import { Logger } from "../utils/logger";

export interface EnvFileEvent {
  readonly uri: Uri;
  readonly fileName: string;
  readonly workspacePath: string;
}

const DEBOUNCE_MS = 1000;

export class EnvFileWatcher {
  private watchers: FileSystemWatcher[] = [];
  private static instance: EnvFileWatcher;

  private readonly changeEmitter = new EventEmitter<EnvFileEvent>();
  private readonly createEmitter = new EventEmitter<EnvFileEvent>();
  private readonly deleteEmitter = new EventEmitter<EnvFileEvent>();

  // Per-URI timer maps so that events for different files never cancel each other.
  // A single shared debounce would drop the earlier file's event whenever a second
  // file changes within the debounce window.
  private readonly changeTimers = new Map<string, NodeJS.Timeout>();
  private readonly createTimers = new Map<string, NodeJS.Timeout>();
  private readonly deleteTimers = new Map<string, NodeJS.Timeout>();

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

  private debouncePerUri(
    timers: Map<string, NodeJS.Timeout>,
    emitter: EventEmitter<EnvFileEvent>,
    uri: Uri
  ): void {
    const key = uri.fsPath;
    const existing = timers.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      timers.delete(key);
      emitter.fire(this.buildEvent(uri));
    }, DEBOUNCE_MS);
    timers.set(key, timer);
  }

  private handleChange(uri: Uri): void {
    if (this.isIgnored(uri)) { return; }
    this.logger.debug(`File change detected: ${uri.fsPath}`);
    this.debouncePerUri(this.changeTimers, this.changeEmitter, uri);
  }

  private handleCreate(uri: Uri): void {
    if (this.isIgnored(uri)) { return; }
    this.logger.debug(`File creation detected: ${uri.fsPath}`);
    this.debouncePerUri(this.createTimers, this.createEmitter, uri);
  }

  private handleDelete(uri: Uri): void {
    if (this.isIgnored(uri)) { return; }
    this.logger.debug(`File deletion detected: ${uri.fsPath}`);
    this.debouncePerUri(this.deleteTimers, this.deleteEmitter, uri);
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

  private clearAllTimers(): void {
    for (const timer of this.changeTimers.values()) { clearTimeout(timer); }
    for (const timer of this.createTimers.values()) { clearTimeout(timer); }
    for (const timer of this.deleteTimers.values()) { clearTimeout(timer); }
    this.changeTimers.clear();
    this.createTimers.clear();
    this.deleteTimers.clear();
  }

  public stop(): void {
    this.logger.debug('Stopping EnvFileWatcher');
    this.clearAllTimers();
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
