import assert from 'assert';

import Result from './result';


/**
 * Generate {@link AssertionError}
 *
 * @param rule - the rule that couses error.
 * @param result - the result for assert.
 * @param [stackStartFn] - provided function will remove from stack trace.
 *
 * @return generated error
 *
 * @ignore
 * @since 0.3.0
 */
function AssertionError(rule: AssertRule, result: Result, stackStartFn?: Function): assert.AssertionError {  // eslint-disable-line @typescript-eslint/ban-types
    return new assert.AssertionError({
        message: `benchmark "${result.name}": actual:${result.average}msec/op ${rule.operator} expected:${rule.expected}msec/op`,
        actual: `${result.average} msec/op`,
        expected: `${rule.expected} msec/op`,
        operator: rule.operator,
        stackStartFn: stackStartFn || rule.assert,
    });
}


/**
 * Generate alternate error with default {@link Error}
 *
 * @param rule - the rule that couses error.
 * @param result - the result for assert.
 * @param [stackStartFn] - provided function will remove from stack trace.
 *
 * @return generated error
 *
 * @ignore
 * @since 0.3.0
 */
function AlternateError(rule: AssertRule, result: Result, stackStartFn?: Function): Error {  // eslint-disable-line @typescript-eslint/ban-types
    const err = Object.assign(
        new Error(`benchmark "${result.name}": actual:${result.average}msec/op ${rule.operator} expected:${rule.expected}msec/op`),
        {
            actual: `${result.average} msec/op`,
            expected: `${rule.expected} msec/op`,
            operator: rule.operator,
        }
    );

    if (Error.captureStackTrace !== undefined && stackStartFn !== undefined) {
        Error.captureStackTrace(err, stackStartFn);
    }

    return err;
}


type UnitValue = 's' | 'sec' | '' | 'ms' | 'msec' | 'us' | 'usec' | 'ns' | 'nsec';


/**
 * Convert unit to number
 *
 * @example
 * assert(100 * unit('ms') == 0.1 * unit('sec'))
 *
 * @param u - unit name like 'ms', 'sec' or etc.
 *
 * @return number to convert milliseconds.
 *
 * @since 0.3.0
 * @ignore
 */
function unit(u: UnitValue): number {
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


type Operator = '<' | '<=' | '>' | '>=';


/**
 * The assertion rule
 *
 * @since 0.3.0
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
     * Error object generator.
     *
     * @ignore
     */
    readonly errorFn: (rule: AssertRule, result: Result, stackStartFn?: Function) => Error;  // eslint-disable-line @typescript-eslint/ban-types

    /**
     * Parse time rule for assertion.
     *
     * Rule format is `{operator}{number}{unit}`; use like `<=10msec`.
     * Operator and unit are can omit. If omitted, uses `<=` and `msec`.
     *
     * Supported operators
     * |`<42`|faster than 42 msec|
     * |`<=42` or omit|42 msec or faster|
     * |`>42`|slower than 42 msec|
     * |`>=42`|42 msec or slower|
     *
     * Supported units
     * |`42s` or `42sec`|seconds|
     * |`42ms` or `42msec`|milliseconds|
     * |`42us` or `42usec`|microseconds|
     * |`42ns` or `42nsec`|nanoseconds|
     *
     * @param rule - assert rule that milliseconds {@link Number} or {@link String} value like '<10ms' or '>=20s'.
     */
    constructor(rule: number | string) {
        const m = String(rule).match(/^(|[<>]=?)(\d+(?:\.\d+)?)(|s|ms|us|ns|sec|msec|usec|nsec)$/);
        if (m === null) {
            throw Error(`Invalid rule format: "${rule}"`);
        }

        this.operator = (m[1] ?? '<=') as Operator;
        this.expected = Number(m[2]) * unit(m[3] as UnitValue);
        this.errorFn = assert !== undefined ? AssertionError : AlternateError;
    }

    /**
     * Checking benchmark result.
     *
     * @param msec - target milliseconds.
     *
     * @return returns true if msec is acceptable.
     */
    check(msec: number): boolean {
        return {
            '<': ms => ms < this.expected,
            '<=': ms => ms <= this.expected,
            '>': ms => ms > this.expected,
            '>=': ms => ms >= this.expected,
        }[this.operator](msec);
    }

    /**
     * Assert with benchmark result.
     *
     * @param result - result of benchmark.
     * @param [stackStartFn] - provided function will remove from stack trace.
     *
     * @throws when result is unacceptable.
     *
     * @since 0.3.0
     */
    assert(result: Result, stackStartFn?: Function): void {  // eslint-disable-line @typescript-eslint/ban-types
        if (!this.check(result.average)) {
            throw this.errorFn(this, result, stackStartFn);
        }
    }
}


export {AssertRule as default, unit, AssertionError, AlternateError};
export type {Operator, UnitValue};
