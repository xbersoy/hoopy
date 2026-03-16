/**
 * Re-export from the state machine module for backward compatibility.
 * The condition evaluator has been promoted to a shared platform service.
 */
export {
  ConditionEvaluatorService as WorkflowConditionEvaluator,
  ConditionGroup,
  ConditionRule,
} from '../../state-machine/services/condition-evaluator.service';
