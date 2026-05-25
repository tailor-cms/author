import { computed, onUnmounted, ref } from 'vue';

const STATUS_VERBS = [
  'Thinking',
  'Pondering',
  'Musing',
  'Calling tools',
  'Drafting',
  'Synthesizing',
  'Almost there',
];

const ROTATE_MS = 4000;

/**
 * Rotating "Thinking…" verbs shown while the agent run is in flight.
 * Pure flavor - but a long wait with no other feedback feels much longer
 * than the same wait with a rotating verb.
 */
export function useAgentStatusRotation() {
  const index = ref(0);
  const activeStatus = computed(() => `${STATUS_VERBS[index.value]}…`);
  let timer: ReturnType<typeof setInterval> | null = null;

  function start() {
    index.value = 0;
    stop();
    timer = setInterval(() => {
      index.value = (index.value + 1) % STATUS_VERBS.length;
    }, ROTATE_MS);
  }

  function stop() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }

  onUnmounted(stop);

  return { activeStatus, start, stop };
}
