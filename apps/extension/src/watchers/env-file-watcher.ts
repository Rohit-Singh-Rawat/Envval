import path from "path";
import { EventEmitter, ExtensionContext, FileSystemWatcher, RelativePattern, Uri, workspace } from "vscode";
import { debounce } from "../utils/debounce";
import { IGNORED_ENV_FILES } from "../lib/constants";


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
    this.changeEmitter.fire({
      uri,
      fileName: path.basename(uri.fsPath),
      workspacePath: workspace.workspaceFolders?.[0]?.uri.fsPath || '',
    });
  }, 1000);

  private debouncedCreate = debounce((uri: Uri) => {
    this.createEmitter.fire({
      uri,
      fileName: path.basename(uri.fsPath),
      workspacePath: workspace.workspaceFolders?.[0]?.uri.fsPath || '',
    });
  }, 1000);

  private debouncedDelete = debounce((uri: Uri) => {
    this.deleteEmitter.fire({
      uri,
      fileName: path.basename(uri.fsPath),
      workspacePath: workspace.workspaceFolders?.[0]?.uri.fsPath || '',
    });
  }, 1000);
  
  public readonly onDidChange = this.changeEmitter.event;
  public readonly onDidCreate = this.createEmitter.event;
  public readonly onDidDelete = this.deleteEmitter.event;

  constructor(private context: ExtensionContext) {
    if (EnvFileWatcher.instance) {
      throw new Error('EnvFileWatcher can only be instantiated once');
    }
    EnvFileWatcher.instance = this;
  }
  public static getInstance(context: ExtensionContext): EnvFileWatcher {
    if (!EnvFileWatcher.instance) {
      EnvFileWatcher.instance = new EnvFileWatcher(context);
    }
    return EnvFileWatcher.instance;
  }

  private handleChange(uri: Uri): void {
    this.debouncedChange(uri);
  }

  private handleCreate(uri: Uri): void {
    this.debouncedCreate(uri);
  }

  private handleDelete(uri: Uri): void {
    this.debouncedDelete(uri);
  }

  public start(): void {
    // Don't start if already started
    if (this.watchers.length > 0) {
      return;
    }
    
    const pattern = new RelativePattern(
      workspace.workspaceFolders?.[0]?.uri.fsPath || '',
      `**/.env*{${IGNORED_ENV_FILES.map(f => `!${f}`).join(',')}}`
    );
    
    const watcher = workspace.createFileSystemWatcher(pattern);
    
    watcher.onDidCreate(uri => this.handleCreate(uri));
    watcher.onDidChange(uri => this.handleChange(uri));
    watcher.onDidDelete(uri => this.handleDelete(uri));
    
    this.watchers.push(watcher);
    this.context.subscriptions.push(watcher);
  }

  public stop(): void {
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