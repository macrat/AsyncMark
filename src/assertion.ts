import Result from './result';
import AsyncMarkAssertionError from './error';

/**
 * Time duration unit string.
 *
 * @internal
 */
type Unit = 's' | 'sec' | '' | 'ms' | 'msec' | 'us' | 'usec' | 'ns' | 'nsec';

/**
 * Convert unit to number
 *
 * @param u  unit name like 'ms', 'sec' or etc.
 *
 * @return  number to convert milliseconds.
 *
 * ## Examples
 * ``` typescript
 * assert(100 * unit('ms') == 0.1 * unit('sec'))
 * ```
 *
 * @since 0.3.0
 * @internal
 */
function unit(u: Unit): number {
  switch (u) {
    case 's':
    case 'sec':
      return 1e3;

    case '':
    case 'ms':
    case 'msec':
      return 1;

    case 'us':
    case 'usec':
      return 1e-3;

    case 'ns':
    case 'nsec':
      return 1e-6;

    default:
      throw Error(`unknown unit name: "${u}"`);
  }
}

/**
 * Assertion operator type.
 */
type Operator = '<' | '<=' | '>' | '>=';

/**
 * The assertion rule
 *
 * @since 0.3.0
 * @internal
 */
class AssertRule {
  /**
   * Operator string that set in rule like '<' or '>='.
   */
  readonly operator: Operator;

  /**
   * The threshold time in milliseconds.
   */
  readonly expected: number;

  /**
   * Parse time rule for assertion.
   *
   * Rule format is `{operator}{number}{unit}`; use like `<=10msec`.
   * Operator and unit are can omit. If omitted, uses `<=` and `msec`.
   *
   * @param rule  Assert rule that milliseconds {@link Number} or {@link String} value
   *              like '<10ms' or '>=20s'.
   *
   * ## Supported operators
   * |example       |means              |
   * |--------------|-------------------|
   * |`<42`         |faster than 42 msec|
   * |`<=42` or omit|42 msec or faster  |
   * |`>42`         |slower than 42 msec|
   * |`>=42`        |42 msec or slower  |
   *
   * ## Supported units
   * |example           |means       |
   * |------------------|------------|
   * |`42s` or `42sec`  |seconds     |
   * |`42ms` or `42msec`|milliseconds|
   * |`42us` or `42usec`|microseconds|
   * |`42ns` or `42nsec`|nanoseconds |
   */
  constructor(rule: number | string) {
    const m = String(rule).match(/^(|[<>]=?)(\d+(?:\.\d+)?)(|s|ms|us|ns|sec|msec|usec|nsec)$/);
    if (m === null) {
      throw Error(`Invalid rule format: "${rule}"`);
    }

    this.operator = (m[1] || '<=') as Operator;
    this.expected = Number(m[2]) * unit(m[3] as Unit);
  }

  /**
   * Checking benchmark result.
   *
   * @param msec  Target milliseconds.
   *
   * @return  Returns true if msec is acceptable.
   */
  check(msec: number): boolean {
    return {
      '<': (ms) => ms < this.expected,
      '<=': (ms) => ms <= this.expected,
      '>': (ms) => ms > this.expected,
      '>=': (ms) => ms >= this.expected,
    }[this.operator](msec);
  }

  /**
   * Assert with benchmark result.
   *
   * @param result        Result of benchmark.
   * @param stackStartFn  Provided function will remove from stack trace.
   *
   * @throws  When result is unacceptable.
   *
   * @since 0.3.0
   */
  assert(result: Result, stackStartFn?: Function): void {
    if (!this.check(result.average)) {
      throw new AsyncMarkAssertionError(this, result, stackStartFn);
    }
  }
}

export { AssertRule as default, unit };
export type { Operator, Unit };
