/**
 * Shared types for the agent tool registry.
 *
 * Each tool is a server-side function exposed to the
 * LLM via the OpenAI Responses API. Tools are atomic,
 * validated server-side, and authorized through the
 * existing repository ACL via ctx.repository.
 */
import { AgentMode } from '@tailor-cms/interfaces/agent.ts';

/**
 * JSON Schema property descriptor. Matches the subset
 * of JSON Schema we use for OpenAI function parameters.
 * Nested recursively via `items` and `properties`.
 */
export interface SchemaProperty {
  /**
   * JSON Schema type - "string", "integer", "object",
   * "array", "boolean", or union ["string", "null"]
   */
  type: string | string[];
  /**
   * Human-readable description shown to the LLM.
   * Use oneLine from common-tags for multi-word values.
   */
  description?: string;
  // Restrict to specific values
  enum?: (string | null)[];
  // For array types - schema of each item
  items?: SchemaProperty | SchemaObject;
  // For object types - nested property definitions
  properties?: Record<string, SchemaProperty>;
  // Which properties are required
  required?: string[];
  // Whether unlisted properties are allowed
  additionalProperties?: boolean;
  // Array length constraints
  minItems?: number;
  maxItems?: number;
}

/**
 * Top-level JSON Schema for a tool's input parameters.
 */
export interface SchemaObject {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties: boolean;
}

/**
 * Runtime context passed to every tool's execute
 * function. Scoped to a single repository and user.
 * The repository instance is the auth/ACL boundary -
 * tools can only access data within it.
 */
export interface ToolContext {
  // Authenticated user performing the action
  userId: number;
  /**
   * Sequelize Repository instance - the scope boundary.
   * All DB queries filter by this repository.
   */
  repository: any;
  /**
   * Per-run operation log. Each successful write tool
   * pushes an entry so the dock can offer undo and
   * the session can show a change summary.
   */
  transactionLog: OperationEntry[];
}

/**
 * A single recorded operation in the transaction log.
 * Captures what tool was called, what it did, and how
 * to reverse it. Used by the dock's "Undo run" feature.
 */
export interface OperationEntry {
  // 1-based sequence number within the run
  seq: number;
  // Tool name that was called (e.g. 'create_activity')
  tool: string;
  // The input the LLM passed to the tool
  input: any;
  // The result the tool returned
  result: any;
  /**
   * The tool call that would reverse this operation.
   * E.g. create_activity's inverse is delete_activity.
   */
  inverse?: { tool: string; input: any };
  // When the operation completed
  timestamp: number;
}

/**
 * Tool permission scope. Documents tool intent and feeds the
 * transactionLog (inverse ops, audit). Mode-gating uses only
 * `read` vs not-`read`:
 * - read: always allowed (no side effects)
 * - write / generate / destructive: allowed in EDIT, blocked in INSPECT
 */
export type ToolScope =
  | 'read'
  | 'write'
  | 'destructive'
  | 'generate';

/**
 * Server-side scope-vs-mode gate. Enforced by AgentRunner before
 * dispatching each tool call. Mirrors the rules surfaced to the model
 * in systemPrompt.ts so the contract is enforced regardless of model behavior.
 */
export function isToolAllowed(scope: ToolScope, mode: AgentMode): boolean {
  if (scope === 'read') return true;
  return mode === AgentMode.Edit;
}

/**
 * Definition of a single tool exposed to the LLM.
 * Each tool file exports one ToolDef composed from
 * separate description, parameters, and execute
 * variables.
 */
export interface ToolDef {
  // Unique tool name - used in function_call.name
  name: string;
  /**
   * Human-readable description sent to the LLM.
   * Should explain when/why to use the tool and
   * what it returns. Use stripIndent for multi-line.
   */
  description: string;
  // Permission scope for approval gating
  scope: ToolScope;
  /**
   * JSON Schema for the tool's input parameters.
   * Defines what the LLM can pass to execute().
   */
  parameters: SchemaObject | Record<string, any>;
  /**
   * The server-side function that runs when the LLM calls this tool.
   * Receives parsed input and the repository-scoped context.
   *
   * Write tools should include `_invalidates` in the result - an array
   * of store keys the frontend should refetch after the mutation.
   * The runner strips this field before forwarding to the LLM.
   * Common keys: 'outline', 'assets', 'activity:{id}', 'element:{id}'.
   */
  execute: (
    input: any,
    ctx: ToolContext,
  ) => Promise<any>;
}
