import { Injectable } from '@nestjs/common';

/** Condition operators for guard evaluation */
export enum ConditionOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  IS_TRUE = 'is_true',
  IS_FALSE = 'is_false',
}

/** Logical combinator */
export enum ConditionLogic {
  AND = 'and',
  OR = 'or',
}

export interface ConditionRule {
  field: string;
  operator: ConditionOperator;
  value?: any;
}

export interface ConditionGroup {
  logic: ConditionLogic;
  rules?: ConditionRule[];
  groups?: ConditionGroup[];
}

/**
 * Generic condition evaluator used by the state machine for guard evaluation
 * and by the workflow module for entry conditions, auto-complete conditions, etc.
 *
 * Evaluates a JSON DSL condition tree against a flat or nested context object.
 */
@Injectable()
export class ConditionEvaluatorService {
  evaluate(condition: ConditionGroup | null | undefined, context: Record<string, any>): boolean {
    if (!condition) return true;
    if (!condition.rules?.length && !condition.groups?.length) return true;

    const results: boolean[] = [];

    if (condition.rules) {
      for (const rule of condition.rules) {
        results.push(this.evaluateRule(rule, context));
      }
    }

    if (condition.groups) {
      for (const group of condition.groups) {
        results.push(this.evaluate(group, context));
      }
    }

    return condition.logic === ConditionLogic.AND
      ? results.every((r) => r)
      : results.some((r) => r);
  }

  private evaluateRule(rule: ConditionRule, context: Record<string, any>): boolean {
    const fieldValue = this.resolveFieldValue(rule.field, context);

    switch (rule.operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === rule.value;
      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== rule.value;
      case ConditionOperator.GREATER_THAN:
        return fieldValue > rule.value;
      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return fieldValue >= rule.value;
      case ConditionOperator.LESS_THAN:
        return fieldValue < rule.value;
      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return fieldValue <= rule.value;
      case ConditionOperator.IN:
        return Array.isArray(rule.value) && rule.value.includes(fieldValue);
      case ConditionOperator.NOT_IN:
        return Array.isArray(rule.value) && !rule.value.includes(fieldValue);
      case ConditionOperator.CONTAINS:
        return typeof fieldValue === 'string' && fieldValue.includes(rule.value);
      case ConditionOperator.STARTS_WITH:
        return typeof fieldValue === 'string' && fieldValue.startsWith(rule.value);
      case ConditionOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined;
      case ConditionOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined;
      case ConditionOperator.IS_TRUE:
        return fieldValue === true;
      case ConditionOperator.IS_FALSE:
        return fieldValue === false;
      default:
        return false;
    }
  }

  private resolveFieldValue(field: string, context: Record<string, any>): any {
    if (field in context) return context[field];

    const parts = field.split('.');
    let current: any = context;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }
}
