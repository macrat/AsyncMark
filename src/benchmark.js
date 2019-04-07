import Result from './result';
import {timeit} from './timer';


/**
 * Class for benchmarking.
 *
 * Benchmark will execute by flow like this.
 *
 *   - before
 *   - beforeEach
 *   - fun
 *   - afterEach
 *   - after
 *
 * Each function can override with options of the constructor.
 *
 *
 * @example
 * import Benchmark from 'asyncmark';
 *
 *
 * new Benchmark({
 *     name: 'timeout',
 *     fun() {
 *         return new Promise((resolve, reject) => {
 *             setTimeout(resolve, 100);
 *         });
 *     },
 * }).run().catch(console.error);
 */
export default class Benchmark {
    /**
     * @param {Object|function} [options] - options for this benchmark or benchmarking function.
     * @param {Number} [options.name='unnamed'] - name of this benchmark.
     * @param {Number} [options.targetErrorRate=0.1] - wanted maximum error rate. see {@link Benchmark#targetErrorRate}.
     * @param {Number} [options.maxNumber=10000] - maximum number of executing test. see {@link Benchmark#maxNumber}.
     * @param {Number} [options.minNumber=30] - minimal number of executing test. see {@link Benchmark#minNumber}.
     * @param {Number} [options.number] - the number of executing the test. see {@link Benchmark#number}.
     * @param {function(): ?Promise} [options.before] - setup function. see {@link Benchmark#before}.
     * @param {function(count: Number): ?Promise} [options.beforeEach] - setup function. see {@link Benchmark#beforeEach}.
     * @param {function(): ?Promise} [options.fun] - target function for benchmarking. see {@link Benchmark#fun}.
     * @param {function(count: Number, msec: Number): ?Promise} [options.afterEach] - teardown function. see {@link Benchmark#afterEach}.
     * @param {function(result: Result): ?Promise} [options.after] - teardown function. see {@link Benchmark#after}.
     */
    constructor(options = {}) {
        /**
         * Name of this benchmark.
         *
         * @type {String}
         */
        this.name = options.name || 'unnamed';

        /**
         * Wanted maximum error rate.
         * This value will be ignore if set {@link Benchmark#number}.
         *
         * @type {Number}
         */
        this.targetErrorRate = options.targetErrorRate || 0.1;

        /**
         * Maximum number of executing test.
         * This value will be ignore if set {@link Benchmark#number}.
         *
         * @type {Number}
         */
        this.maxNumber = options.maxNumber || 10000;

        /**
         * Minimal number of executing test.
         * This value will be ignore if set {@link Benchmark#number}.
         *
         * @type {Number}
         */
        this.minNumber = options.minNumber || 30;

        /**
         * The number of executing the test.
         * Will decide automatically in between {@link Benchmark#minNumber} to {@link Benchmark#maxNumber} if set null.
         *
         * @type {Number|null}
         */
        this.number = options.number || null;

        if (typeof options === 'function') {
            this.fun = options;
        } else {
            this.before = options.before || this.before;
            this.beforeEach = options.beforeEach || this.beforeEach;
            this.fun = options.fun || this.fun;
            this.afterEach = options.afterEach || this.afterEach;
            this.after = options.after || this.after;
        }
    }

    /**
     * Setup before execute benchmark.
     *
     * At the time executing this method, `this` is the unique object for the benchmark.
     * So you can use `this` for storing testing data like a database.
     * Data of `this` that set in this method will discard after call {@link Benchmark#after}
     *
     * In default, do nothing.
     *
     * @return {?Promise} {@link Benchmark} will await if returns {@link Promise}. Resolved value never evaluation.
     */
    async before() {}

    /**
     * Setup before each tests.
     *
     * At the time executing this method, `this` is the unique object for the test.
     * So you can use `this` for storing testing data.
     * Data of `this` that set in this method will discard after call {@link Benchmark#afterEach}
     *
     * In default, do nothing.
     *
     * @param {Number} count - count of done tests in this benchmark.
     *
     * @return {?Promise} {@link Benchmark} will await if returns {@link Promise}. Resolved value never evaluation.
     */
    async beforeEach(count) {}

    /**
     * The target function for benchmarking.
     *
     * At the time executing this method, `this` is the unique object for the test.
     * So you can use `this` for storing testing data.
     * Data of `this` that set in this method will discard after call {@link Benchmark#afterEach}
     *
     * In default, couses error that `Error('target function is not defined')`.
     *
     * @abstract
     *
     * @return {?Promise} If returns {@link Promise}, {@link Benchmark} will measure the time it takes for the Promise to resolve. Otherwise will measure the time it to method return.
     */
    async fun() {
        throw new Error('target function is not defined');
    }

    /**
     * Teardown after each tests.
     *
     * At the time executing this method, `this` is the unique object for the test.
     * So you can use `this` for storing testing data.
     * Data of `this` that set in this method will discard after call this method.
     *
     * In default, do nothing.
     *
     * @param {Number} count - count of done tests in this benchmark.
     * @param {Number} msec - duration of this execution.
     *
     * @return {?Promise} {@link Benchmark} will await if returns {@link Promise}. Resolved value never evaluation.
     */
    async afterEach(count, msec) {}

    /**
     * Teardown after execute benchmark.
     *
     * At the time executing this method, `this` is the unique object for the benchmark.
     * So you can use `this` for storing testing data like a database.
     * Data of `this` that set in this method will discard after call this method.
     *
     * In default, shows test result.
     *
     * @param {Result} result - result of this benchmark.
     *
     * @return {?Promise} {@link Benchmark} will await if returns {@link Promise}. Resolved value never evaluation.
     */
    async after(result) {
        console.log(String(result.dropOutlier()));
    }

    /**
     * Execute benchmark.
     *
     * @param {Object} [context={}] - the `this` for each benchmarking functions. `__proto__` will override with this instance.
     * @param {Object} [callbacks={}] - callback functions.
     * @param {function(count: Number, benchmark: Benchmark): ?Promise} [callbacks.beforeTest] - callback function that will be called when before executing each test.
     * @param {function(count: Number, benchmark: Benchmark, msec: Number)} [callbacks.afterTest] - callback function that will be called when after executing each test.
     *
     * @return {Promise<Result>} A result of benchmark.
     */
    async run(context = {}, callbacks = {}) {
        context = Object.assign({}, context);
        context.__proto__ = this;

        await this.before.call(context);

        const loopNum = this.number || this.maxNumber;

        const msecs = [];
        for (let i = 0; i < loopNum; i++) {
            const ctx = Object.assign({}, context);

            if (callbacks.beforeTest) {
                await callbacks.beforeTest.call(ctx, i, this);
            }

            await this.beforeEach.call(ctx, i);

            const msec = await timeit(this.fun, ctx)
            msecs.push(msec);

            await this.afterEach.call(ctx, i, msec);

            if (callbacks.afterTest) {
                await callbacks.afterTest.call(ctx, i, this, msec);
            }

            if (!this.number && i + 1 >= this.minNumber && (new Result(this.name, msecs)).errorRate <= this.targetErrorRate) {
                break;
            }
        }

        const result = new Result(this.name, msecs);
        await this.after.call(context, result);
        return result;
    }
}
