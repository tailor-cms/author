/**
 * Shared, reactive "is a Renoir (AI agent) run in flight" flag.
 *
 * Module-scoped so every caller reads the same ref. A consumer that mounts
 * mid-run - e.g. opening activity history while generation is already
 * underway - sees the current value immediately, which an event-bus
 * subscription would miss (it only catches emits after it subscribes).
 * The agent panel owns the write via setAgentRunning(); everyone else reads.
 */
const isAgentRunning = ref(false);

export function useAgentRunState() {
  const setAgentRunning = (value: boolean) => {
    isAgentRunning.value = value;
  };
  return { isAgentRunning: readonly(isAgentRunning), setAgentRunning };
}
