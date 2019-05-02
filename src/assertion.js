import assert from 'assert';


/**
 * Convert unit to number
 *
 * @example
 * assert(100 * unit('ms') == 0.1 * unit('sec'))
 *
 * @param {Number} u - unit name like 'ms', 'sec' or etc.
 *
 * @return {Number} number to convert milliseconds.
 *
 * @since 0.3.0
 * @ignore
 */
function unit(u) {
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
 * The assertion rule
 *
 * @since 0.3.0
 */
class AssertRule {
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
     * @param {Number|String} rule - assert rule that milliseconds {@link Number} or {@String} value like '<10ms' or '>=20s'.
     */
    constructor(rule) {
        const m = String(rule).match(/^(|[<>]=?)(\d+(?:\.\d+)?)(|s|ms|us|ns|sec|msec|usec|nsec)$/);
        if (m === null) {
            throw Error(`Invalid rule format: "${rule}"`);
        }

        this.operator = m[1] || '<=';
        this.expected = Number(m[2]) * unit(m[3]);
    }

    /**
     * Checking benchmark result.
     *
     * @param {Number} msec - target milliseconds.
     *
     * @return {Boolean} returns true if msec is acceptable.
     */
    check(msec) {
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
     * @param {Result} result - result of benchmark.
     * @param {function} [stackStartFn] - provided function will remove from stack trace.
     *
     * @throw {assert.AssertionError} when result is unacceptable.
     * @return {undefined}
     *
     * @since 0.3.0
     */
    assert(result, stackStartFn=null) {
        if (!this.check(result.average)) {
            if (assert === undefined) {
                throw new Error(`benchmark "${result.name}": actual:${result.average}msec/op ${this.operator} expected:${this.expected}msec/op`);
            } else {
                throw new assert.AssertionError({
                    message: `benchmark "${result.name}": actual:${result.average}msec/op ${this.operator} expected:${this.expected}msec/op`,
                    actual: `${result.average} msec/op`,
                    expected: `${this.expected} msec/op`,
                    operator: this.operator,
                    stackStartFn: stackStartFn || this.assert,
                });
            }
        }
    }
}


export {AssertRule as default, unit};
