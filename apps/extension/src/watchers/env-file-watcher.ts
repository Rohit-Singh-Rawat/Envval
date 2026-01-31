import path from "path";
import { EventEmitter, ExtensionContext, FileSystemWatcher, RelativePattern, Uri, workspace } from "vscode";
import { debounce } from "../utils/debounce";
import { IGNORED_ENV_FILES } from "../lib/constants";
import { Logger } from "../utils/logger";


export interface EnvFileEvent{
  uri: Uri;
  fileName: string;
  workspacePath: string;
}

export class EnvFileWatcher {
  private watchers: FileSystemWatcher[] = [];
  private static instance: EnvFileWatcher;
  private changeEmitter = new EventEmitter<EnvFileEvent>();
  private createEmitter = new EventEmitter<EnvFileEvent>();
  private deleteEmitter = new EventEmitter<EnvFileEvent>();

  // Debounced emitters so we don't spam on rapid saves/changes
  private debouncedChange = debounce((uri: Uri) => {
    this.logger.debug(`Firing change event for: ${uri.fsPath}`);
    this.changeEmitter.fire({
      uri,
      fileName: path.basename(uri.fsPath),
      workspacePath: workspace.workspaceFolders?.[0]?.uri.fsPath || '',
    });
  }, 1000);

  private debouncedCreate = debounce((uri: Uri) => {
    this.logger.debug(`Firing create event for: ${uri.fsPath}`);
    this.createEmitter.fire({
      uri,
      fileName: path.basename(uri.fsPath),
      workspacePath: workspace.workspaceFolders?.[0]?.uri.fsPath || '',
    });
  }, 1000);

  private debouncedDelete = debounce((uri: Uri) => {
    this.logger.debug(`Firing delete event for: ${uri.fsPath}`);
    this.deleteEmitter.fire({
      uri,
      fileName: path.basename(uri.fsPath),
      workspacePath: workspace.workspaceFolders?.[0]?.uri.fsPath || '',
    });
  }, 1000);
  
  public readonly onDidChange = this.changeEmitter.event;
  public readonly onDidCreate = this.createEmitter.event;
  public readonly onDidDelete = this.deleteEmitter.event;
  private logger: Logger;

  constructor(private context: ExtensionContext, logger: Logger) {
    if (EnvFileWatcher.instance) {
      throw new Error('EnvFileWatcher can only be instantiated once');
    }
    this.logger = logger;
    EnvFileWatcher.instance = this;
  }
  public static getInstance(context: ExtensionContext, logger: Logger): EnvFileWatcher {
    if (!EnvFileWatcher.instance) {
      EnvFileWatcher.instance = new EnvFileWatcher(context, logger);
    }
    return EnvFileWatcher.instance;
  }

  private isIgnored(uri: Uri): boolean {
    const fileName = path.basename(uri.fsPath);
    return IGNORED_ENV_FILES.includes(fileName);
  }

  private handleChange(uri: Uri): void {
    if (this.isIgnored(uri)) {
      return;
    }
    this.logger.debug(`File change detected by VS Code: ${uri.fsPath}`);
    this.debouncedChange(uri);
  }

  private handleCreate(uri: Uri): void {
    if (this.isIgnored(uri)) {
      return;
    }
    this.logger.debug(`File creation detected by VS Code: ${uri.fsPath}`);
    this.debouncedCreate(uri);
  }

  private handleDelete(uri: Uri): void {
    if (this.isIgnored(uri)) {
      return;
    }
    this.logger.debug(`File deletion detected by VS Code: ${uri.fsPath}`);
    this.debouncedDelete(uri);
  }

  public start(): void {
    // Don't start if already started
    if (this.watchers.length > 0) {
      this.logger.debug('EnvFileWatcher already started, skipping');
      return;
    }
    
    const pattern = new RelativePattern(
      workspace.workspaceFolders?.[0]?.uri || '',
      '**/.env*'
    );
    
    this.logger.debug(`Starting EnvFileWatcher with pattern: ${pattern.pattern} in base: ${pattern.base}`);
    
    const watcher = workspace.createFileSystemWatcher(pattern);
    
    watcher.onDidCreate(uri => this.handleCreate(uri));
    watcher.onDidChange(uri => this.handleChange(uri));
    watcher.onDidDelete(uri => this.handleDelete(uri));
    
    this.watchers.push(watcher);
    this.context.subscriptions.push(watcher);
  }

  public stop(): void {
    this.logger.debug('Stopping EnvFileWatcher');
    // Stop watchers but keep emitters so we can restart
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