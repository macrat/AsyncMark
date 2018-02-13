import Benchmark from './benchmark';


/**
 * A set of {@link Benchmark}s for executing those sequential or parallel.
 *
 * Suite will execute by flow like this.
 *
 *   - {@link Suite#before}
 *   - {@link Suite#beforeEach}
 *   - {@link Benchmark#before}
 *   - {@link Benchmark#beforeEach}
 *   - {@link Benchmark#fun}
 *   - {@link Benchmark#afterEach}
 *   - {@link Benchmark#after}
 *   - {@link Suite#afterEach}
 *   - {@link Suite#after}
 *
 * Each function can override with options of the constructor.
 *
 *
 * @example
 * import {Suite} from 'asyncmark';
 *
 *
 * const suite = new Suite({
 *     name: 'ways to find a character',
 *     beforeEach() {
 *         this.text = 'hello world';
 *     },
 *     parallel: true,
 * });
 *
 * suite.add(function() {
 *     /o/.test(this.text);
 * });
 *
 * suite.add({
 *     name: 'String#indexOf',
 *     before() {
 *         console.log('starting String#indexOf...');
 *     },
 *     fun() {
 *         this.text.indexOf('o') > -1;
 *     },
 * });
 *
 * suite.add(new Benchmark({
 *     name: 'String#match',
 *     fun() {
 *         Boolean(this.text.match(/o/));
 *     },
 *     after(result) {
 *         console.log('String#match is done! ' + result);
 *     },
 * }));
 *
 * suite.run()
 *     .then(results => {
 *         let min = results[0];
 *         results.forEach(x => {
 *             if (min.average > x.average) {
 *                 min = x;
 *             }
 *         });
 *         console.log(min.name + ' is best way!');
 *     }).
 *     catch(err => console.error(err));
 */
export default class Suite {
    /**
     * @param {Object} [options={}] - options for this suite.
     * @param {Number} [options.name='unnamed'] - name of this suite.
     * @param {Boolean} [options.parallel=false] - flag for executing each benchmark parallelly.
     * @param {function(): ?Promise} [options.before] - setup function. see {@link Suite#before}.
     * @param {function(count: Number, benchmark: Benchmark): ?Promise} [options.beforeEach] - setup function. see {@link Suite#beforeEach}.
     * @param {function(count: Number, benchmark: Benchmark): ?Promise} [options.afterEach] - teardown function. see {@link Suite#afterEach}.
     * @param {function(results: Result[]): ?Promise} [options.after] - teardown function. see {@link Suite#after}.
     * @param {Object} [options.benchmarkDefault={}] - default options for {@link Suite#add}.
     */
    constructor(options = {}) {
        /**
         * Name of this suite.
         *
         * @type {String}
         */
        this.name = options.name || 'unnamed';

        /**
         * Default options for benchmarks in this suite.
         *
         * @type {Object}
         */
        this.benchmarkDefault = options.benchmarkDefault || {};

        /**
         * A list of {@link Benchmark}.
         *
         * @type {Benchmark[]}
         */
        this.benchmarks = [];

        /**
         * Flag for executing each benchmark parallelly.
         *
         * @type {Boolean}
         */
        this.parallel = options.parallel || false;

        this.before = options.before || this.before;
        this.beforeEach = options.beforeEach || this.beforeEach;
        this.afterEach = options.afterEach || this.afterEach;
        this.after = options.after || this.after;
    }

    /**
     * Setup before execute all benchmarks.
     *
     * At the time executing this method, `this` is the unique object for the suite.
     * So you can use `this` for storing testing data like a database.
     * Data of `this` that set in this method will discard after call {@link Suite#after}
     *
     * In default, do nothing.
     *
     * @return {?Promise} {@link Suite} will await if returns {@link Promise}. Resolved value never evaluation.
     */
    async before() {}

    /**
     * Setup before execute each benchmark.
     *
     * At the time executing this method, `this` is the unique object for the test.
     * So you can use `this` for storing testing data like a database.
     * Data of `this` that set in this method will discard after call {@link Suite#afterEach}
     *
     * In default, do nothing.
     *
     * @param {Number} count - count of done benchmarks in this benchmark.
     * @param {Benchmark} benchmark - a {@link Benchmark} instance that will execute.
     *
     * @return {?Promise} {@link Suite} will await if returns {@link Promise}. Resolved value never evaluation.
     */
    async beforeEach(count, benchmark) {}

    /**
     * Teardown after execute each benchmark.
     *
     * At the time executing this method, `this` is the unique object for the test.
     * So you can use `this` for storing testing data like a database.
     * Data of `this` that set in this method will discard after call this method.
     *
     * In default, do nothing.
     *
     * @param {Number} count - count of done benchmarks in this benchmark.
     * @param {Benchmark} benchmark - a {@link Benchmark} instance that executed.
     * @param {Result} result - a result of this benchmark.
     *
     * @return {?Promise} {@link Suite} will await if returns {@link Promise}. Resolved value never evaluation.
     */
    async afterEach(count, benchmark, result) {}

    /**
     * Teardown after execute all benchmarks.
     *
     * At the time executing this method, `this` is the unique object for the suite.
     * So you can use `this` for storing testing data like a database.
     * Data of `this` that set in this method will discard after call this method.
     *
     * In default, do nothing.
     *
     * @param {Result[]} results - a list of benchmark result.
     *
     * @return {?Promise} {@link Suite} will await if returns {@link Promise}. Resolved value never evaluation.
     */
    async after(results) {}

    /**
     * Adding {@link Benchmark} instance into this {@link Suite}.
     *
     * @param {Benchmark} benchmark - the benchmark instance for adding.
     *
     * @return {Suite} returns this suite for method chain.
     */
    addBenchmark(benchmark) {
        this.benchmarks.push(benchmark);
        return this;
    }

    /**
     * Adding child {@link Suite} instance into this {@link Suite}.
     *
     * @param {Suite} suite - the suite instance for adding.
     *
     * @return {Suite} returns this suite for method chain.
     */
    addSuite(suite) {
        this.benchmarks.push(suite);
        return this;
    }

    /**
     * Make new benchmark or suite and adding into this {@link Suite}.
     *
     * @param {Benchmark|Suite|Object|function} child - {@link Benchmark}, {@link Suite}, or arguments for {@link Benchmark#constructor}.
     *
     * @return {Suite} returns this suite for method chain.
     */
    add(child) {
        if (child instanceof Benchmark) {
            this.addBenchmark(child);
        } else if (child instanceof Suite) {
            this.addSuite(child);
        } else if (typeof child === 'function') {
            const options = {fun: child};
            options.__proto__ = this.benchmarkDefault;
            this.addBenchmark(new Benchmark(options));
        } else {
            const options = Object.assign({}, child);
            options.__proto__ = this.benchmarkDefault;
            this.addBenchmark(new Benchmark(options));
        }
        return this;
    }

    /**
     * Execute benchmarks parallelly.
     *
     * @param {object} context - the context for execute.
     *
     * @return {Promise<Result[]>} result of benchmarks.
     *
     * @ignore
     */
    async _runParallel(context) {
        await this.before.call(context);

        const results = await Promise.all(this.benchmarks.map(async (x, i) => {
            const ctx = Object.assign({}, context);
            await this.beforeEach.call(ctx, i, x);
            const result = await x.run(ctx);
            await this.afterEach.call(ctx, i, x, result);
            return result;
        }));

        await this.after.call(context, results);

        return results;
    }

    /**
     * Execute benchmarks sequential.
     *
     * @param {object} context - the context for execute.
     *
     * @return {Promise<Result[]>} result of benchmarks.
     *
     * @ignore
     */
    async _runSequential(context) {
        await this.before.call(context);

        const results = [];
        for (let i=0; i<this.benchmarks.length; i++) {
            const b = this.benchmarks[i];
            const ctx = Object.assign({}, context);
            await this.beforeEach.call(ctx, i, b);
            const result = await b.run(ctx);
            results.push(result);
            await this.afterEach.call(ctx, i, b, result);
        }

        await this.after.call(context, results);

        return results;
    }

    /**
     * Execute benchmarks in this suite.
     *
     * All benchmarks will execute parallel if enabled {@link Suite#parallel} option.
     * Else do execute sequentially by added order.
     *
     * @param {Object} [context={}] - the `this` for each benchmarking functions. `__proto__` will override with this instance.
     *
     * @return {Promise<Result[]>} An array of {@link Result}s.
     */
    async run(context = {}) {
        context = Object.assign({}, context);
        context.__proto__ = this;

        if (this.parallel) {
            return await this._runParallel(context);
        } else {
            return await this._runSequential(context);
        }
    }
}
