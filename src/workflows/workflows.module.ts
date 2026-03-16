import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// State machine module (provides StateMachineService + ConditionEvaluatorService)
import { StateMachineModule } from '../state-machine/state-machine.module';

// Entities
import {
  WorkflowDefinition,
  WorkflowDefinitionI18n,
  WorkflowDefinitionVersion,
  WorkflowStepDefinition,
  WorkflowStepI18n,
  WorkflowTransitionDefinition,
  WorkflowInstance,
  WorkflowStepInstance,
  WorkflowStepAssignee,
  WorkflowActionLog,
} from './entities';

// Services
import { WorkflowDefinitionService } from './services/workflow-definition.service';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { WorkflowAssigneeResolverService } from './services/workflow-assignee-resolver.service';

// Controllers
import { WorkflowDefinitionController } from './controllers/workflow-definition.controller';
import { WorkflowInstanceController } from './controllers/workflow-instance.controller';

// Resolvers
import { ASSIGNEE_RESOLVERS } from './resolvers/assignee-resolver.interface';
import {
  UserAssigneeResolver,
  InitiatorAssigneeResolver,
  SubjectAssigneeResolver,
  ManagerAssigneeResolver,
  RoleAssigneeResolver,
  PermissionGroupAssigneeResolver,
} from './resolvers/builtin-resolvers';

const builtinResolvers = [
  UserAssigneeResolver,
  InitiatorAssigneeResolver,
  SubjectAssigneeResolver,
  ManagerAssigneeResolver,
  RoleAssigneeResolver,
  PermissionGroupAssigneeResolver,
];

@Module({
  imports: [
    StateMachineModule,
    TypeOrmModule.forFeature([
      WorkflowDefinition,
      WorkflowDefinitionI18n,
      WorkflowDefinitionVersion,
      WorkflowStepDefinition,
      WorkflowStepI18n,
      WorkflowTransitionDefinition,
      WorkflowInstance,
      WorkflowStepInstance,
      WorkflowStepAssignee,
      WorkflowActionLog,
    ]),
  ],
  controllers: [WorkflowDefinitionController, WorkflowInstanceController],
  providers: [
    // Core services
    WorkflowDefinitionService,
    WorkflowEngineService,
    WorkflowAssigneeResolverService,

    // Built-in assignee resolvers
    ...builtinResolvers,

    // Aggregate all resolvers into a single injection token
    {
      provide: ASSIGNEE_RESOLVERS,
      useFactory: (...resolvers) => resolvers,
      inject: builtinResolvers,
    },
  ],
  exports: [WorkflowDefinitionService, WorkflowEngineService],
})
export class WorkflowsModule {}
