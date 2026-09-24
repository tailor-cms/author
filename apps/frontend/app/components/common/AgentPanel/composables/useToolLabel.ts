import type { TranscriptMessage, TranscriptToolCall } from './useAgentSession';
import { getToolLabel } from '../AgentToolCard/toolLabel';
import { useActivityStore } from '@/stores/activity';

/**
 * Readable tool-call labels, named after the activities they touch.
 */
export function useToolLabel() {
  const activityStore = useActivityStore();

  function findName(id: number): string | undefined {
    let activity = activityStore.findById(id);
    // If container
    while (activity && !activity.data?.name) {
      activity = activityStore.getParent(activity.id);
    }
    return activity?.data?.name;
  }

  function getLabel(call: TranscriptToolCall): string {
    return getToolLabel(call.name, call.input, {
      isDone: call.ok === true,
      findName,
    });
  }

  // The tool call still running in the latest reply, if any.
  function findRunningCall(
    messages: TranscriptMessage[],
  ): TranscriptToolCall | undefined {
    const reply = messages.findLast((it) => it.role === 'assistant');
    return reply?.toolCalls?.findLast((it) => it.ok === undefined);
  }

  return { getLabel, findRunningCall };
}
