import AssertRule, { Operator } from './assertion';
import Result from './result';

/**
 * Error class for benchmark result assertion.
 *
 * @since 1.0.0
 */
class AsyncMarkAssertionError extends Error {
  /**
   * @internal
   */
  readonly name = 'AsyncMarkAssertionError';

  /**
   * The actual value of msecs per operation.
   */
  readonly actual: number;

  /**
   * The expected msecs per operation.
   */
  readonly expected: number;

  /**
   * The operator type for this assertion like `<` or `>=`.
   */
  readonly operator: Operator;

  /**
   * @param rule          The rule that couses error.
   * @param result        The result for assert.
   * @param stackStartFn  Provided function will remove from stack trace.
   *
   * @internal
   */
  constructor(rule: AssertRule, result: Result, stackStartFn?: Function) {
    super(`benchmark "${result.name}": actual:${result.average}msec/op ${rule.operator} expected:${rule.expected}msec/op`);

    this.actual = result.average;
    this.expected = rule.expected;
    this.operator = rule.operator;

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace !== undefined && stackStartFn !== undefined) {
      Error.captureStackTrace(this, stackStartFn);
    }
  }
}

export { AsyncMarkAssertionError as default };
