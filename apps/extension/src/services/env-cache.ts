import * as fs from "fs";
import * as path from "path";
import { Disposable, EventEmitter } from "vscode";
import { EnvFileWatcher } from "../watchers/env-file-watcher";
import { getAllEnvFiles, getWorkspacePath } from "../utils/repo-detection";
import { Logger } from "../utils/logger";

export interface EnvVariable {
  key: string;
  value: string;
  fileName: string;
  filePath: string;
  lineNumber: number;
}

type EnvFileCache = Map<string, EnvVariable>;
type EnvKeyIndex = Map<string, EnvVariable[]>;

/**
 * Centralized cache for environment variables parsed from workspace .env files.
 * Maintains an in-memory index for fast lookups and auto-updates when files change.
 */
export class EnvCacheService implements Disposable {
  private static instance: EnvCacheService;

  private readonly logger: Logger;
  private readonly fileWatcher: EnvFileWatcher;
  private readonly disposables: Disposable[] = [];

  private fileCache: Map<string, EnvFileCache> = new Map();
  private keyIndex: EnvKeyIndex = new Map();
  private initialized = false;

  private readonly _onDidUpdate = new EventEmitter<void>();
  public readonly onDidUpdate = this._onDidUpdate.event;

  private constructor(fileWatcher: EnvFileWatcher, logger: Logger) {
    this.fileWatcher = fileWatcher;
    this.logger = logger;
    this.subscribeToFileEvents();
  }

  public static getInstance(
    fileWatcher: EnvFileWatcher,
    logger: Logger,
  ): EnvCacheService {
    if (!EnvCacheService.instance) {
      EnvCacheService.instance = new EnvCacheService(fileWatcher, logger);
    }
    return EnvCacheService.instance;
  }

  private subscribeToFileEvents(): void {
    this.disposables.push(
      this.fileWatcher.onDidChange(async (event) => {
        await this.refreshFile(event.fileName);
      }),
      this.fileWatcher.onDidCreate(async (event) => {
        await this.refreshFile(event.fileName);
      }),
      this.fileWatcher.onDidDelete((event) => {
        this.removeFile(event.fileName);
      }),
    );
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.debug("EnvCacheService: Initializing cache");
    await this.refresh();
    this.initialized = true;
    this.logger.debug(
      `EnvCacheService: Initialized with ${this.keyIndex.size} unique keys`,
    );
  }

  public async refresh(): Promise<void> {
    const workspacePath = await getWorkspacePath();
    if (!workspacePath) {
      this.logger.debug("EnvCacheService: No workspace path, skipping refresh");
      return;
    }

    const envFiles = await getAllEnvFiles(this.logger);
    this.fileCache.clear();
    this.keyIndex.clear();

    for (const relativePath of envFiles) {
      const fullPath = path.join(workspacePath, relativePath);
      await this.parseAndCacheFile(relativePath, fullPath);
    }

    this._onDidUpdate.fire();
  }

  private async refreshFile(fileName: string): Promise<void> {
    const workspacePath = await getWorkspacePath();
    if (!workspacePath) {
      return;
    }

    // Remove stale key-index entries for this file before re-parsing,
    // then add fresh entries in one pass — avoids a full index rebuild.
    // (Don't fire _onDidUpdate yet — consumers would see half-updated state.)
    this.removeFileFromIndex(fileName);
    this.fileCache.delete(fileName);
    await this.parseAndCacheFile(fileName, path.join(workspacePath, fileName));

    // Single consolidated notification after all state is updated.
    this._onDidUpdate.fire();
    this.logger.debug(`EnvCacheService: Refreshed ${fileName}`);
  }

  private removeFile(fileName: string): void {
    if (!this.fileCache.has(fileName)) {
      return;
    }

    this.removeFileFromIndex(fileName);
    this.fileCache.delete(fileName);
    this._onDidUpdate.fire();

    this.logger.debug(`EnvCacheService: Removed ${fileName} from cache`);
  }

  private removeFileFromIndex(fileName: string): void {
    const fileVars = this.fileCache.get(fileName);
    if (!fileVars) return;
    for (const variable of fileVars.values()) {
      const entries = this.keyIndex.get(variable.key);
      if (!entries) continue;
      const updated = entries.filter((v) => v.fileName !== fileName);
      if (updated.length === 0) {
        this.keyIndex.delete(variable.key);
      } else {
        this.keyIndex.set(variable.key, updated);
      }
    }
  }

  private async parseAndCacheFile(
    relativePath: string,
    fullPath: string,
  ): Promise<void> {
    try {
      const content = await fs.promises.readFile(fullPath, "utf-8");
      const variables = this.parseEnvContent(content, relativePath, fullPath);
      this.fileCache.set(relativePath, variables);
      this.addToKeyIndex(variables);
    } catch (error) {
      this.logger.debug(
        `EnvCacheService: Failed to parse ${relativePath}: ${error}`,
      );
    }
  }

  private parseEnvContent(
    content: string,
    fileName: string,
    filePath: string,
  ): EnvFileCache {
    const variables: EnvFileCache = new Map();
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const parsed = this.parseLine(trimmed);
      if (parsed) {
        variables.set(parsed.key, {
          key: parsed.key,
          value: parsed.value,
          fileName,
          filePath,
          lineNumber: i + 1,
        });
      }
    }

    return variables;
  }

  /**
   * Parses a single line from an env file.
   * Handles: KEY=value, KEY="quoted value", KEY='single quoted', KEY=
   */
  private parseLine(line: string): { key: string; value: string } | null {
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      return null;
    }

    const key = line.slice(0, equalsIndex).trim();
    if (!this.isValidEnvKey(key)) {
      return null;
    }

    let value = line.slice(equalsIndex + 1);

    // Handle quoted values
    const trimmedValue = value.trim();
    if (
      (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
      (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
    ) {
      value = trimmedValue.slice(1, -1);
    } else {
      value = trimmedValue;
    }

    return { key, value };
  }

  private isValidEnvKey(key: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key);
  }

  private addToKeyIndex(variables: EnvFileCache): void {
    for (const variable of variables.values()) {
      const existing = this.keyIndex.get(variable.key) || [];
      existing.push(variable);
      this.keyIndex.set(variable.key, existing);
    }
  }

  private rebuildKeyIndex(): void {
    this.keyIndex.clear();
    for (const fileVars of this.fileCache.values()) {
      this.addToKeyIndex(fileVars);
    }
  }

  public async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  public getVariable(key: string): EnvVariable[] {
    return this.keyIndex.get(key) || [];
  }

  public hasVariable(key: string): boolean {
    return this.keyIndex.has(key);
  }

  public getAllKeys(): string[] {
    return Array.from(this.keyIndex.keys());
  }

  public getAllFiles(): string[] {
    return Array.from(this.fileCache.keys());
  }

  public getVariablesFromFile(relativePath: string): EnvVariable[] {
    const cache = this.fileCache.get(relativePath);
    return cache ? Array.from(cache.values()) : [];
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this._onDidUpdate.dispose();
    this.fileCache.clear();
    this.keyIndex.clear();
  }
}
