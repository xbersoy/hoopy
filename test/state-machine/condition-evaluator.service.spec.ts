import {
  ConditionEvaluatorService,
  ConditionOperator,
  ConditionLogic,
  ConditionGroup,
} from '@/state-machine/services/condition-evaluator.service';

describe('ConditionEvaluatorService', () => {
  let service: ConditionEvaluatorService;

  beforeEach(() => {
    service = new ConditionEvaluatorService();
  });

  // ─── Null / empty conditions ───

  it('returns true for null condition', () => {
    expect(service.evaluate(null, {})).toBe(true);
  });

  it('returns true for undefined condition', () => {
    expect(service.evaluate(undefined, {})).toBe(true);
  });

  it('returns true for empty rules and groups', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [],
      groups: [],
    };
    expect(service.evaluate(condition, {})).toBe(true);
  });

  it('returns true when rules and groups are absent', () => {
    const condition: ConditionGroup = { logic: ConditionLogic.AND };
    expect(service.evaluate(condition, {})).toBe(true);
  });

  // ─── EQUALS ───

  it('EQUALS returns true on match', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        {
          field: 'status',
          operator: ConditionOperator.EQUALS,
          value: 'active',
        },
      ],
    };
    expect(service.evaluate(condition, { status: 'active' })).toBe(true);
  });

  it('EQUALS returns false on mismatch', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        {
          field: 'status',
          operator: ConditionOperator.EQUALS,
          value: 'active',
        },
      ],
    };
    expect(service.evaluate(condition, { status: 'inactive' })).toBe(false);
  });

  // ─── NOT_EQUALS ───

  it('NOT_EQUALS returns true when values differ', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        {
          field: 'role',
          operator: ConditionOperator.NOT_EQUALS,
          value: 'admin',
        },
      ],
    };
    expect(service.evaluate(condition, { role: 'user' })).toBe(true);
  });

  it('NOT_EQUALS returns false when values match', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        {
          field: 'role',
          operator: ConditionOperator.NOT_EQUALS,
          value: 'admin',
        },
      ],
    };
    expect(service.evaluate(condition, { role: 'admin' })).toBe(false);
  });

  // ─── Comparison operators ───

  it('GREATER_THAN returns true when field > value', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        { field: 'age', operator: ConditionOperator.GREATER_THAN, value: 18 },
      ],
    };
    expect(service.evaluate(condition, { age: 25 })).toBe(true);
    expect(service.evaluate(condition, { age: 18 })).toBe(false);
  });

  it('GREATER_THAN_OR_EQUAL returns true when field >= value', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        {
          field: 'age',
          operator: ConditionOperator.GREATER_THAN_OR_EQUAL,
          value: 18,
        },
      ],
    };
    expect(service.evaluate(condition, { age: 18 })).toBe(true);
    expect(service.evaluate(condition, { age: 17 })).toBe(false);
  });

  it('LESS_THAN returns true when field < value', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        { field: 'score', operator: ConditionOperator.LESS_THAN, value: 50 },
      ],
    };
    expect(service.evaluate(condition, { score: 30 })).toBe(true);
    expect(service.evaluate(condition, { score: 50 })).toBe(false);
  });

  it('LESS_THAN_OR_EQUAL returns true when field <= value', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        {
          field: 'score',
          operator: ConditionOperator.LESS_THAN_OR_EQUAL,
          value: 50,
        },
      ],
    };
    expect(service.evaluate(condition, { score: 50 })).toBe(true);
    expect(service.evaluate(condition, { score: 51 })).toBe(false);
  });

  // ─── IN / NOT_IN ───

  it('IN returns true when field value is in the array', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        {
          field: 'dept',
          operator: ConditionOperator.IN,
          value: ['hr', 'eng', 'sales'],
        },
      ],
    };
    expect(service.evaluate(condition, { dept: 'eng' })).toBe(true);
  });

  it('IN returns false when field value is not in the array', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        { field: 'dept', operator: ConditionOperator.IN, value: ['hr', 'eng'] },
      ],
    };
    expect(service.evaluate(condition, { dept: 'finance' })).toBe(false);
  });

  it('NOT_IN returns true when field value is not in the array', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        {
          field: 'dept',
          operator: ConditionOperator.NOT_IN,
          value: ['hr', 'eng'],
        },
      ],
    };
    expect(service.evaluate(condition, { dept: 'finance' })).toBe(true);
  });

  it('NOT_IN returns false when field value is in the array', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        {
          field: 'dept',
          operator: ConditionOperator.NOT_IN,
          value: ['hr', 'eng'],
        },
      ],
    };
    expect(service.evaluate(condition, { dept: 'hr' })).toBe(false);
  });

  // ─── CONTAINS ───

  it('CONTAINS returns true when string field contains value', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        { field: 'name', operator: ConditionOperator.CONTAINS, value: 'ohn' },
      ],
    };
    expect(service.evaluate(condition, { name: 'John Doe' })).toBe(true);
  });

  it('CONTAINS returns false when string does not contain value', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        { field: 'name', operator: ConditionOperator.CONTAINS, value: 'xyz' },
      ],
    };
    expect(service.evaluate(condition, { name: 'John Doe' })).toBe(false);
  });

  it('CONTAINS returns false for non-string fields', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        { field: 'count', operator: ConditionOperator.CONTAINS, value: '1' },
      ],
    };
    expect(service.evaluate(condition, { count: 123 })).toBe(false);
  });

  // ─── STARTS_WITH ───

  it('STARTS_WITH returns true when string starts with value', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        {
          field: 'email',
          operator: ConditionOperator.STARTS_WITH,
          value: 'admin',
        },
      ],
    };
    expect(service.evaluate(condition, { email: 'admin@example.com' })).toBe(
      true,
    );
  });

  it('STARTS_WITH returns false when string does not start with value', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        {
          field: 'email',
          operator: ConditionOperator.STARTS_WITH,
          value: 'admin',
        },
      ],
    };
    expect(service.evaluate(condition, { email: 'user@example.com' })).toBe(
      false,
    );
  });

  // ─── IS_NULL / IS_NOT_NULL ───

  it('IS_NULL returns true for null value', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [{ field: 'middle', operator: ConditionOperator.IS_NULL }],
    };
    expect(service.evaluate(condition, { middle: null })).toBe(true);
  });

  it('IS_NULL returns true for undefined value', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [{ field: 'missing', operator: ConditionOperator.IS_NULL }],
    };
    expect(service.evaluate(condition, {})).toBe(true);
  });

  it('IS_NULL returns false for present value', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [{ field: 'name', operator: ConditionOperator.IS_NULL }],
    };
    expect(service.evaluate(condition, { name: 'John' })).toBe(false);
  });

  it('IS_NOT_NULL returns true for present value', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [{ field: 'name', operator: ConditionOperator.IS_NOT_NULL }],
    };
    expect(service.evaluate(condition, { name: 'John' })).toBe(true);
  });

  it('IS_NOT_NULL returns false for null value', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [{ field: 'name', operator: ConditionOperator.IS_NOT_NULL }],
    };
    expect(service.evaluate(condition, { name: null })).toBe(false);
  });

  // ─── IS_TRUE / IS_FALSE ───

  it('IS_TRUE returns true when field is true', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [{ field: 'active', operator: ConditionOperator.IS_TRUE }],
    };
    expect(service.evaluate(condition, { active: true })).toBe(true);
    expect(service.evaluate(condition, { active: false })).toBe(false);
  });

  it('IS_FALSE returns true when field is false', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [{ field: 'deleted', operator: ConditionOperator.IS_FALSE }],
    };
    expect(service.evaluate(condition, { deleted: false })).toBe(true);
    expect(service.evaluate(condition, { deleted: true })).toBe(false);
  });

  // ─── AND logic ───

  it('AND: passes when all rules pass', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        { field: 'age', operator: ConditionOperator.GREATER_THAN, value: 18 },
        { field: 'active', operator: ConditionOperator.IS_TRUE },
      ],
    };
    expect(service.evaluate(condition, { age: 25, active: true })).toBe(true);
  });

  it('AND: fails when one rule fails', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        { field: 'age', operator: ConditionOperator.GREATER_THAN, value: 18 },
        { field: 'active', operator: ConditionOperator.IS_TRUE },
      ],
    };
    expect(service.evaluate(condition, { age: 25, active: false })).toBe(false);
  });

  // ─── OR logic ───

  it('OR: passes when at least one rule passes', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.OR,
      rules: [
        { field: 'role', operator: ConditionOperator.EQUALS, value: 'admin' },
        {
          field: 'role',
          operator: ConditionOperator.EQUALS,
          value: 'superadmin',
        },
      ],
    };
    expect(service.evaluate(condition, { role: 'admin' })).toBe(true);
  });

  it('OR: fails when all rules fail', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.OR,
      rules: [
        { field: 'role', operator: ConditionOperator.EQUALS, value: 'admin' },
        {
          field: 'role',
          operator: ConditionOperator.EQUALS,
          value: 'superadmin',
        },
      ],
    };
    expect(service.evaluate(condition, { role: 'user' })).toBe(false);
  });

  // ─── Nested groups ───

  it('nested groups: AND containing OR group', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [{ field: 'active', operator: ConditionOperator.IS_TRUE }],
      groups: [
        {
          logic: ConditionLogic.OR,
          rules: [
            { field: 'dept', operator: ConditionOperator.EQUALS, value: 'hr' },
            { field: 'dept', operator: ConditionOperator.EQUALS, value: 'eng' },
          ],
        },
      ],
    };
    expect(service.evaluate(condition, { active: true, dept: 'eng' })).toBe(
      true,
    );
    expect(service.evaluate(condition, { active: true, dept: 'finance' })).toBe(
      false,
    );
    expect(service.evaluate(condition, { active: false, dept: 'eng' })).toBe(
      false,
    );
  });

  // ─── Dot-path field resolution ───

  it('resolves dot-path fields (e.g. employee.department)', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        {
          field: 'employee.department',
          operator: ConditionOperator.EQUALS,
          value: 'eng',
        },
      ],
    };
    expect(
      service.evaluate(condition, { employee: { department: 'eng' } }),
    ).toBe(true);
    expect(
      service.evaluate(condition, { employee: { department: 'hr' } }),
    ).toBe(false);
  });

  it('resolves deeply nested dot-path fields', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [
        { field: 'a.b.c', operator: ConditionOperator.EQUALS, value: 42 },
      ],
    };
    expect(service.evaluate(condition, { a: { b: { c: 42 } } })).toBe(true);
  });

  // ─── Missing field ───

  it('returns undefined for missing field', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [{ field: 'nonexistent', operator: ConditionOperator.IS_NULL }],
    };
    expect(service.evaluate(condition, {})).toBe(true);
  });

  it('missing dot-path field returns undefined', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [{ field: 'a.b.c', operator: ConditionOperator.IS_NULL }],
    };
    expect(service.evaluate(condition, {})).toBe(true);
  });

  // ─── Unknown operator ───

  it('unknown operator returns false', () => {
    const condition: ConditionGroup = {
      logic: ConditionLogic.AND,
      rules: [{ field: 'x', operator: 'bogus' as any, value: 1 }],
    };
    expect(service.evaluate(condition, { x: 1 })).toBe(false);
  });
});
