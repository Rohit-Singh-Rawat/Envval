import { Disposable, EventEmitter, ExtensionContext } from "vscode";
import {
  OPERATION_QUEUE_STORAGE_KEY,
  OPERATION_QUEUE_MAX_SIZE,
} from "../lib/constants";
import { Logger } from "../utils/logger";

export type OperationType = "push" | "pull" | "metadata";

export interface QueuedOperation {
  readonly id: string;
  readonly type: OperationType;
  readonly envId: string;
  readonly fileName: string;
  readonly queuedAt: string;
  readonly priority: number;
}

const PRIORITY_MAP: Record<OperationType, number> = {
  push: 0,
  pull: 1,
  metadata: 2,
} as const;

export class OperationQueueService implements Disposable {
  private static instance: OperationQueueService;

  private readonly ctx: ExtensionContext;
  private readonly logger: Logger;
  private queue: QueuedOperation[];
  private isProcessing = false;

  private readonly _onDidChange = new EventEmitter<void>();
  public readonly onDidChange = this._onDidChange.event;

  private constructor(ctx: ExtensionContext, logger: Logger) {
    this.ctx = ctx;
    this.logger = logger;
    this.queue = ctx.workspaceState.get<QueuedOperation[]>(
      OPERATION_QUEUE_STORAGE_KEY,
      [],
    );
    this.logger.debug(
      `OperationQueueService: Loaded ${this.queue.length} queued operations`,
    );
  }

  public static getInstance(
    ctx?: ExtensionContext,
    logger?: Logger,
  ): OperationQueueService {
    if (!OperationQueueService.instance) {
      if (!ctx || !logger) {
        throw new Error(
          "OperationQueueService must be initialized with context and logger before use",
        );
      }
      OperationQueueService.instance = new OperationQueueService(ctx, logger);
    }
    return OperationQueueService.instance;
  }

  public get size(): number {
    return this.queue.length;
  }

  public get isEmpty(): boolean {
    return this.queue.length === 0;
  }

  public get pending(): readonly QueuedOperation[] {
    return this.queue;
  }

  public async enqueue(
    type: OperationType,
    envId: string,
    fileName: string,
  ): Promise<void> {
    // Deduplicate: remove existing entry with same (envId, type)
    this.queue = this.queue.filter(
      (op) => !(op.envId === envId && op.type === type),
    );

    // Evict oldest item with the lowest priority (highest priority number) if full
    if (this.queue.length >= OPERATION_QUEUE_MAX_SIZE) {
      let evictIndex = -1;
      let highestPriority = -1;
      let oldestTimestamp = "";

      for (let i = 0; i < this.queue.length; i++) {
        const op = this.queue[i];
        if (
          op.priority > highestPriority ||
          (op.priority === highestPriority &&
            (oldestTimestamp === "" || op.queuedAt < oldestTimestamp))
        ) {
          highestPriority = op.priority;
          oldestTimestamp = op.queuedAt;
          evictIndex = i;
        }
      }

      if (evictIndex !== -1) {
        const evicted = this.queue[evictIndex];
        this.queue.splice(evictIndex, 1);
        this.logger.debug(
          `OperationQueueService: Evicted ${evicted.id} to make room`,
        );
      }
    }

    const operation: QueuedOperation = {
      id: `${type}:${envId}`,
      type,
      envId,
      fileName,
      queuedAt: new Date().toISOString(),
      priority: PRIORITY_MAP[type],
    };

    this.queue.push(operation);
    this.queue.sort((a, b) => a.priority - b.priority);

    await this.persist();
    this._onDidChange.fire();

    this.logger.debug(`OperationQueueService: Enqueued ${operation.id}`);
  }

  public async processAll(
    processor: (op: QueuedOperation) => Promise<boolean>,
  ): Promise<{ succeeded: number; failed: number }> {
    if (this.isProcessing) {
      this.logger.warn("OperationQueueService: Already processing, skipping");
      return { succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;
    const snapshot = [...this.queue];
    let succeeded = 0;
    let failed = 0;

    this.logger.info(
      `OperationQueueService: Processing ${snapshot.length} operations`,
    );

    try {
      for (const op of snapshot) {
        try {
          const success = await processor(op);
          if (success) {
            this.queue = this.queue.filter((q) => q.id !== op.id);
            succeeded++;
          } else {
            failed++;
          }
        } catch (error) {
          this.logger.error(
            `OperationQueueService: Failed to process ${op.id}: ${error}`,
          );
          failed++;
        }
      }

      await this.persist();
      this._onDidChange.fire();
    } finally {
      this.isProcessing = false;
    }

    this.logger.info(
      `OperationQueueService: Completed — ${succeeded} succeeded, ${failed} failed`,
    );
    return { succeeded, failed };
  }

  public async clear(): Promise<void> {
    this.queue = [];
    await this.persist();
    this._onDidChange.fire();
    this.logger.info("OperationQueueService: Queue cleared");
  }

  private async persist(): Promise<void> {
    await this.ctx.workspaceState.update(
      OPERATION_QUEUE_STORAGE_KEY,
      this.queue,
    );
  }

  public dispose(): void {
    // Fire-and-forget: best-effort flush on extension deactivation.
    // VS Code may terminate the process immediately after, so we cannot await.
    void this.persist();
    this._onDidChange.dispose();
  }
}
