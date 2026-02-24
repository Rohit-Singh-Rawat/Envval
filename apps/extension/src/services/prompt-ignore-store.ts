import type { ExtensionContext } from "vscode";
import { PROMPT_IGNORE_STORAGE_KEY } from "../lib/constants";
import { normalizeEnvFilePath } from "../utils/env-file-name";

interface PromptIgnoreEntry {
  ignoredAt: string;
}

type PromptIgnoreStorage = Record<string, PromptIgnoreEntry>;

export class PromptIgnoreStore {
  private static instance: PromptIgnoreStore;
  private readonly ctx: ExtensionContext;
  private writeQueue: Promise<void> = Promise.resolve();

  private constructor(ctx: ExtensionContext) {
    this.ctx = ctx;
  }

  public static getInstance(ctx: ExtensionContext): PromptIgnoreStore {
    if (!PromptIgnoreStore.instance) {
      PromptIgnoreStore.instance = new PromptIgnoreStore(ctx);
    }
    return PromptIgnoreStore.instance;
  }

  private makeKey(repoId: string, fileName: string): string {
    return `${repoId}:${normalizeEnvFilePath(fileName)}`;
  }

  private getStorage(): PromptIgnoreStorage {
    return (
      this.ctx.workspaceState.get<PromptIgnoreStorage>(
        PROMPT_IGNORE_STORAGE_KEY,
      ) ?? {}
    );
  }

  private enqueueWrite(fn: () => Promise<void>): Promise<void> {
    this.writeQueue = this.writeQueue.then(fn, fn);
    return this.writeQueue;
  }

  public async markIgnored(repoId: string, fileName: string): Promise<void> {
    const key = this.makeKey(repoId, fileName);
    return this.enqueueWrite(async () => {
      const stored = this.getStorage();
      stored[key] = { ignoredAt: new Date().toISOString() };
      await this.ctx.workspaceState.update(PROMPT_IGNORE_STORAGE_KEY, stored);
    });
  }

  public async clearAll(): Promise<void> {
    return this.enqueueWrite(async () => {
      await this.ctx.workspaceState.update(PROMPT_IGNORE_STORAGE_KEY, {});
    });
  }

  public async clearIgnored(repoId: string, fileName: string): Promise<void> {
    const key = this.makeKey(repoId, fileName);
    return this.enqueueWrite(async () => {
      const stored = this.getStorage();
      if (!(key in stored)) {
        return;
      }
      delete stored[key];
      await this.ctx.workspaceState.update(PROMPT_IGNORE_STORAGE_KEY, stored);
    });
  }

  public async isIgnoredWithinInterval(
    repoId: string,
    fileName: string,
    intervalMs: number,
  ): Promise<boolean> {
    const key = this.makeKey(repoId, fileName);
    const stored = this.getStorage();
    const ignoredAt = stored[key]?.ignoredAt;
    if (!ignoredAt) {
      return false;
    }

    const ageMs = Date.now() - new Date(ignoredAt).getTime();
    if (ageMs < intervalMs) {
      return true;
    }

    // Opportunistic cleanup for expired entries.
    await this.clearIgnored(repoId, fileName);
    return false;
  }
}
