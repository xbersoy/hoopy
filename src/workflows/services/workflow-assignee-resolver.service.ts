import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AssigneeStrategy } from '../enums/workflow.enums';
import {
  IAssigneeResolver,
  AssigneeResolutionContext,
  ResolvedAssignee,
  ASSIGNEE_RESOLVERS,
} from '../resolvers/assignee-resolver.interface';

/**
 * Central service for resolving assignees for workflow steps.
 * Delegates to registered strategy-specific resolvers.
 * New strategies can be added by implementing IAssigneeResolver and registering with the module.
 */
@Injectable()
export class WorkflowAssigneeResolverService {
  private resolverMap: Map<AssigneeStrategy, IAssigneeResolver>;

  constructor(@Inject(ASSIGNEE_RESOLVERS) resolvers: IAssigneeResolver[]) {
    this.resolverMap = new Map();
    for (const resolver of resolvers) {
      this.resolverMap.set(resolver.strategy, resolver);
    }
  }

  async resolve(
    strategy: AssigneeStrategy,
    config: Record<string, any>,
    context: AssigneeResolutionContext,
  ): Promise<ResolvedAssignee[]> {
    const resolver = this.resolverMap.get(strategy);
    if (!resolver) {
      throw new BadRequestException(
        `No assignee resolver registered for strategy: ${strategy}`,
      );
    }

    const assignees = await resolver.resolve(config, context);
    if (!assignees.length) {
      throw new NotFoundException(
        `No assignees could be resolved for strategy "${strategy}". Check your configuration and context.`,
      );
    }

    return assignees;
  }

  /**
   * Check if a resolver is registered for the given strategy.
   */
  hasResolver(strategy: AssigneeStrategy): boolean {
    return this.resolverMap.has(strategy);
  }

  /**
   * Get all registered strategy names.
   */
  getRegisteredStrategies(): AssigneeStrategy[] {
    return Array.from(this.resolverMap.keys());
  }
}
