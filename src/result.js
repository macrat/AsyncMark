import AssertRule from './assertion';


/**
 * The result of benchmark.
 *
 * This value will included outlier. Please use {@link Result#dropOutlier} if you want drop they.
 */
export default class Result {
    /**
     * @param {String} name - name of benchmark.
     * @param {Number[]} msecs - times of benchmark result.
     *
     * @ignore
     */
    constructor(name, msecs) {
        /**
         * Name of this test.
         *
         * @type {String}
         */
        this.name = name;

        /**
         * Times of benchmark result in milliseconds.
         *
         * @type {Number[]}
         */
        this.msecs = msecs;
    }

    /**
     * Total milliseconds of this benchmark.
     *
     * @type {Number}
     */
    get total() {
        return this.msecs.reduce((x, y) => x + y);
    }

    /**
     * The time of fastest test in milliseconds.
     *
     * @type {Number}
     */
    get fastest() {
        return this.msecs.reduce((x, y) => Math.min(x, y));
    }

    /**
     * The time of slowest test in milliseconds.
     *
     * @type {Number}
     */
    get slowest() {
        return this.msecs.reduce((x, y) => Math.max(x, y));
    }

    /**
     * Average time of this benchmark in milliseconds.
     *
     * @type {Number}
     */
    get average() {
        return this.total / this.msecs.length;
    }

    /**
     * Time unbiased sample variance of times.
     *
     * @type {Number}
     */
    get variance() {
        const avg = this.average;
        return this.msecs.map(x => Math.pow(x - avg, 2)).reduce((x, y) => x + y) / (this.msecs.length - 1);
    }

    /**
     * Standard division of times.
     *
     * @type {Number}
     */
    get std() {
        return Math.sqrt(this.variance);
    }

    /**
     * Standard error of the mean of times.
     *
     * @type {Number}
     */
    get sem() {
        return this.std / Math.sqrt(this.msecs.length);
    }

    /**
     * Guessed error range of this benchmark.
     *
     * @type {Number}
     */
    get errorRange() {
        return this.sem * 1.96;
    }

    /**
     * Error range per average time.
     *
     * @type {Number}
     */
    get errorRate() {
        return this.errorRange / this.average;
    }

    /**
     * Operations per seconds.
     *
     * @type {Number}
     */
    get opsPerSec() {
        return 1000 / this.average;
    }

    /**
     * Make new Result that droped outlier.
     *
     * @param {Number} [threshold=2] the threshold of outlier testing.
     *
     * @return {Result} new {@link Result} instance.
     */
    dropOutlier(threshold=2) {
        const avg = this.average;
        const std = this.std;
        return new Result(this.name, this.msecs.filter(x => Math.abs((x - avg) / std) <= threshold));
    }

    /**
     * Convert to string for printing.
     *
     * @return {String} human redable string
     */
    toString() {
        const avg = Math.round(this.average * 10000) / 10000;
        const ops = Math.round(this.opsPerSec * 1000) / 1000;
        const range = Math.round(this.errorRange * 10000) / 10000;
        const rate = Math.round(this.errorRate * 10000) / 100;
        return `${this.name}:\t${ops}ops/sec\t${avg}msec/op\t+-${range}msec/op (${rate}%)\t${this.msecs.length} times tried`;
    }

    /**
     * Assertion if it taked more (or less) time than expected.
     *
     * Expected rule format is `{operator}{number}{unit}`; use like `<=10msec`.
     * Operator and unit are can omit. If omitted, uses `<=` and `msec`.
     *
     * ## Supported operators
     * |example       |means              |
     * |--------------|-------------------|
     * |"<42"         |faster than 42 msec|
     * |"<=42" or omit|42 msec or faster  |
     * |">42"         |slower than 42 msec|
     * |">=42"        |42 msec or slower  |
     *
     * ## Supported units
     * |example           |means       |
     * |------------------|------------|
     * |"42s" or "42sec"  |seconds     |
     * |"42ms" or "42msec"|milliseconds|
     * |"42us" or "42usec"|microseconds|
     * |"42ns" or "42nsec"|nanoseconds |
     *
     * @param {Number|String} expected - expected time in milliseconds {@link Number} or {@String} value like '<10ms' or '>=20s'.
     *
     * @throw {assert.AssertionError} when result is unacceptable.
     * @return {undefined}
     *
     * @example
     * const result = await Benchmark(function() {
     *     # do something that expect done in least 100msec
     * }).run();
     *
     * result.assert(100);
     *
     * @example
     * const result = await Benchmark(async function() {
     *     await sleep_function(100);
     * }).run();
     *
     * result.assert('>90ms', '<110ms');
     *
     * @since 0.3.0
     */
    assert(...expected) {
        const rules = expected.map(x => new AssertRule(x));

        rules.forEach(rule => rule.assert(this, this.assert));
    }
}
