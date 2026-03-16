import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  StateMachineDefinition,
  StateMachineDefinitionI18n,
  StateMachineState,
  StateMachineStateI18n,
  StateMachineTransition,
  StateMachineTransitionI18n,
  StateMachineInstance,
  StateMachineTransitionHistory,
} from './entities';
import { StateMachineService } from './services/state-machine.service';
import { ConditionEvaluatorService } from './services/condition-evaluator.service';
import { StateMachineController } from './controllers/state-machine.controller';
import { DomainEventPublisher } from '../shared/events';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StateMachineDefinition,
      StateMachineDefinitionI18n,
      StateMachineState,
      StateMachineStateI18n,
      StateMachineTransition,
      StateMachineTransitionI18n,
      StateMachineInstance,
      StateMachineTransitionHistory,
    ]),
  ],
  controllers: [StateMachineController],
  providers: [
    StateMachineService,
    ConditionEvaluatorService,
    DomainEventPublisher,
  ],
  exports: [
    StateMachineService,
    ConditionEvaluatorService,
    DomainEventPublisher,
  ],
})
export class StateMachineModule {}
