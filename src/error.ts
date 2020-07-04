import AssertRule from './assertion';
import Result from './result';

/**
 * Error class for benchmark result assertion.
 *
 * @since 1.0.0
 */
class AsyncMarkAssertionError extends Error {
  readonly name = 'AsyncMarkAssertionError';

  readonly actual: string;

  readonly expected: string;

  readonly operator: string;

  /**
   * @param rule - the rule that couses error.
   * @param result - the result for assert.
   * @param [stackStartFn] - provided function will remove from stack trace.
   */
  constructor(rule: AssertRule, result: Result, stackStartFn?: Function) {
    super(`benchmark "${result.name}": actual:${result.average}msec/op ${rule.operator} expected:${rule.expected}msec/op`);

    this.actual = `${result.average} msec/op`;
    this.expected = `${rule.expected} msec/op`;
    this.operator = rule.operator;

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace !== undefined && stackStartFn !== undefined) {
      Error.captureStackTrace(this, stackStartFn);
    }
  }
}

export { AsyncMarkAssertionError as default };
