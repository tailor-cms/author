import {
  type AgentMode,
  type FocusedTarget,
  type RunEvent,
  type RunResult,
  type RunSnapshot,
  RunStatus,
} from '@tailor-cms/interfaces/agent.ts';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

// A user message waiting for the run to pick it up.
export interface QueuedMessage {
  message: string;
  focus?: FocusedTarget[];
  mode?: AgentMode;
}

type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;

export type NewRunEvent = DistributiveOmit<RunEvent, 'seq'>;

/**
 * Background agent run. Collects progress for client updates
 * and holds messages the user sends while it works.
 */
export class AgentRun {
  readonly id = randomUUID();
  readonly sessionId: string;
  readonly repositoryId: number;
  readonly userId: number;
  // All progress so far
  private readonly events: RunEvent[] = [];
  private readonly queue: QueuedMessage[] = [];
  private readonly abortController = new AbortController();
  private readonly changes = new EventEmitter();
  status: RunStatus = RunStatus.Running;
  result: RunResult | null = null;
  error: string | null = null;

  constructor(sessionId: string, repositoryId: number, userId: number) {
    this.sessionId = sessionId;
    this.repositoryId = repositoryId;
    this.userId = userId;
  }

  get isRunning(): boolean {
    return this.status === RunStatus.Running;
  }

  get isCancelled(): boolean {
    return this.abortController.signal.aborted;
  }

  // Aborts the model call in flight when the run is cancelled.
  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  get hasQueued(): boolean {
    return this.queue.length > 0;
  }

  push(event: NewRunEvent): void {
    this.events.push({ ...event, seq: this.events.length + 1 } as RunEvent);
    this.changes.emit('change');
  }

  enqueue(message: QueuedMessage): void {
    this.queue.push(message);
  }

  takeQueued(): QueuedMessage[] {
    return this.queue.splice(0);
  }

  cancel(): void {
    this.abortController.abort();
  }

  finish(result: RunResult, error: string | null = null): void {
    this.result = result;
    this.error = error;
    this.status = error
      ? RunStatus.Failed
      : this.isCancelled ? RunStatus.Cancelled : RunStatus.Completed;
    this.changes.emit('change');
  }

  // Resolves on the next event or when the run ends, at most after `ms`.
  waitForChange(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer);
        this.changes.off('change', done);
        resolve();
      };
      const timer = setTimeout(done, ms);
      this.changes.once('change', done);
    });
  }

  hasEventsAfter(seq: number): boolean {
    return this.events.length > seq;
  }

  snapshot(after = 0): RunSnapshot {
    return {
      id: this.id,
      sessionId: this.sessionId,
      status: this.status,
      events: this.events.slice(after),
      result: this.result,
      error: this.error,
    };
  }
}
