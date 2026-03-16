import { AssigneeStrategy } from '../enums/workflow.enums';

/**
 * Context passed to assignee resolvers.
 * Contains all information needed to resolve assignees dynamically.
 */
export interface AssigneeResolutionContext {
  companyId: string;
  initiatorId: string;
  subjectId?: string;
  resourceType: string;
  resourceId: string;
  /** Arbitrary context data from the trigger (employee info, resource data, etc.) */
  contextData?: Record<string, any>;
}

/**
 * Result of an assignee resolution.
 */
export interface ResolvedAssignee {
  userId: string;
  resolvedVia: string;
}

/**
 * Interface for a pluggable assignee resolver.
 * Implement this to add custom assignee resolution strategies.
 */
export interface IAssigneeResolver {
  /**
   * The strategy this resolver handles.
   */
  strategy: AssigneeStrategy;

  /**
   * Resolve assignees for a given step.
   * @param config - The assignee config from the step definition
   * @param context - Runtime context for resolution
   * @returns Array of resolved assignees
   */
  resolve(
    config: Record<string, any>,
    context: AssigneeResolutionContext,
  ): Promise<ResolvedAssignee[]>;
}

export const ASSIGNEE_RESOLVERS = 'ASSIGNEE_RESOLVERS';
