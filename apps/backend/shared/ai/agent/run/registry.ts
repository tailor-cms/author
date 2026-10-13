import type { AgentRun } from './AgentRun.ts';

// How long a finished run stays around for clients to collect it.
const RETAIN_MS = 15 * 60 * 1000;

/**
 * Runs live in memory like export jobs.
 */
class RunRegistry {
  private readonly runs = new Map<string, AgentRun>();

  add(run: AgentRun): void {
    this.runs.set(run.id, run);
  }

  get(id: string): AgentRun | undefined {
    return this.runs.get(id);
  }

  findActive(sessionId: string): AgentRun | undefined {
    return [...this.runs.values()].find(
      (run) => run.sessionId === sessionId && run.isRunning,
    );
  }

  // Forget a finished run after a retention period (for clients to pick it up)
  release(run: AgentRun): void {
    setTimeout(() => this.runs.delete(run.id), RETAIN_MS).unref();
  }
}

export const runRegistry = new RunRegistry();
