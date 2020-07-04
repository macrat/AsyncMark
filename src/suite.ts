import Benchmark, {BenchmarkOptions, TestCallbacks} from './benchmark';
import Result from './result';


/**
 * The options for {@link Suite}.
 */
export type SuiteOptions = {
    /**
     * name of this suite.
     */
    name?: string;

    /**
     * flag for executing each benchmark parallelly.
     */
    parallel?: boolean;

    /**
     * setup function. see {@link Suite#before}.
     */
    before?: (() => Promise<void>) | (() => void);

    /**
     * setup function. see {@link Suite#beforeEach}.
     */
    beforeEach?: ((count: number, benchmark: Benchmark) => Promise<void>) | ((count: number, benchmark: Benchmark) => void);

    /**
     * setup function. see {@link Suite#beforeTest}.
     */
    beforeTest?: ((suiteCount: number, benchCount: number, benchmark: Benchmark) => Promise<void>) | ((suiteCount: number, benchCount: number, benchmark: Benchmark) => void);

    /**
     * teardown function. see {@link Suite#afterTest}.
     */
    afterTest?: ((suiteCount: number, benchCount: number, benchmark: Benchmark, msec: number) => Promise<void>) | ((suiteCount: number, benchCount: number, benchmark: Benchmark, msec: number) => void);

    /**
     * teardown function. see {@link Suite#afterEach}.
     */
    afterEach?: ((count: number, benchmark: Benchmark, result: Result) => Promise<void>) | ((count: number, benchmark: Benchmark, result: Result) => void);

    /**
     * teardown function. see {@link Suite#after}.
     */
    after?: ((results: Result[]) => Promise<void>) | ((results: Result[]) => void);

    /**
     * default options for {@link Suite#add}.
     */
    benchmarkDefault?: BenchmarkOptions;
}


/**
 * A set of {@link Benchmark}s for executing those sequential or parallel.
 *
 * Suite will execute by flow like this.
 *
 *   - {@link Suite#before}
 *   - {@link Suite#beforeEach}
 *   - {@link Benchmark#before}
 *   - {@link Suite#beforeTest}
 *   - {@link Benchmark#beforeEach}
 *   - {@link Benchmark#fun}
 *   - {@link Benchmark#afterEach}
 *   - {@link Suite#afterTest}
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
     * Name of this suite.
     */
    name: string;

    /**
     * Default options for benchmarks in this suite.
     */
    benchmarkDefault: BenchmarkOptions;

    /**
     * Flag for executing each benchmark parallelly.
     */
    parallel: boolean;

    /**
     * A list of {@link Benchmark}.
     */
    benchmarks: (Benchmark | Suite)[];

    /**
     * Setup before execute all benchmarks.
     *
     * At the time executing this method, `this` is the unique object for the suite.
     * So you can use `this` for storing testing data like a database.
     * Data of `this` that set in this method will discard after call {@link Suite#after}.
     *
     * In default, do nothing.
     *
     * @return {@link Suite} will await if returns {@link Promise}. Resolved value never evaluation.
     */
    before: (() => Promise<void>) | (() => void);

    /**
     * Setup before execute each benchmark.
     *
     * At the time executing this method, `this` is the unique object for the benchmark.
     * So you can use `this` for storing testing data like a database.
     * Data of `this` that set in this method will discard after call {@link Suite#afterEach}.
     *
     * In default, do nothing.
     *
     * @param count - count of done benchmarks in this suite.
     * @param benchmark - a {@link Benchmark} instance that will execute.
     *
     * @return {@link Suite} will await if returns {@link Promise}. Resolved value never evaluation.
     */
    beforeEach: ((count: number, benchmark: Benchmark) => Promise<void>) | ((count: number, benchmark: Benchmark) => void);

    /**
     * Setup before execute each test of benchmarks.
     *
     * At the time executing this method, `this` is the unique object for the test.
     * So you can use `this` for storing testing data like a database.
     * Data of `this` that set in this method will discard after call {@link Suite#afterTest}.
     *
     * In default, do nothing.
     *
     * @param suiteCount - count of done benchmarks in this suite.
     * @param benchCount - count of done tests in this benchmark.
     * @param benchmark - a {@link Benchmark} instance that will execute.
     *
     * @return {@link Suite} will await if returns {@link Promise}. Resolved value never evaluation.
     */
    beforeTest: ((suiteCount: number, benchCount: number, benchmark: Benchmark) => Promise<void>) | ((suiteCount: number, benchCount: number, benchmark: Benchmark) => void);

    /**
     * Teardown after execute each test of benchmarks.
     *
     * At the time executing this method, `this` is the unique object for the test.
     * So you can use `this` for storing testing data like a database.
     * Data of `this` that set in this method will discard after call this method
     *
     * In default, do nothing.
     *
     * @param suiteCount - count of done benchmarks in this suite.
     * @param benchCount - count of done tests in this benchmark.
     * @param benchmark - a {@link Benchmark} instance that executed.
     * @param msec - a result of this test.
     *
     * @return {@link Suite} will await if returns {@link Promise}. Resolved value never evaluation.
     */
    afterTest: ((suiteCount: number, benchCount: number, benchmark: Benchmark, msec: number) => Promise<void>) | ((suiteCount: number, benchCount: number, benchmark: Benchmark, msec: number) => void);

    /**
     * Teardown after execute each benchmark.
     *
     * At the time executing this method, `this` is the unique object for the benchmark.
     * So you can use `this` for storing testing data like a database.
     * Data of `this` that set in this method will discard after call this method.
     *
     * In default, do nothing.
     *
     * @param count - count of done benchmarks in this suite.
     * @param benchmark - a {@link Benchmark} instance that executed.
     * @param result - a result of this benchmark.
     *
     * @return {@link Suite} will await if returns {@link Promise}. Resolved value never evaluation.
     */
    afterEach: ((count: number, benchmark: Benchmark, result: Result) => Promise<void>) | ((count: number, benchmark: Benchmark, result: Result) => void);

    /**
     * Teardown after execute all benchmarks.
     *
     * At the time executing this method, `this` is the unique object for the suite.
     * So you can use `this` for storing testing data like a database.
     * Data of `this` that set in this method will discard after call this method.
     *
     * In default, do nothing.
     *
     * @param results - a list of benchmark result.
     *
     * @return {@link Suite} will await if returns {@link Promise}. Resolved value never evaluation.
     */
    after: ((results: Result[]) => Promise<void>) | ((results: Result[]) => void);

    /**
     * @param [options] - options for this suite.
     */
    constructor(options: SuiteOptions = {}) {
        this.name = options.name || 'unnamed';
        this.benchmarkDefault = options.benchmarkDefault || {};
        this.parallel = options.parallel || false;

        this.benchmarks = [];

        this.before = options.before || (() => {});
        this.beforeEach = options.beforeEach || (() => {});
        this.beforeTest = options.beforeTest || (() => {});
        this.afterTest = options.afterTest || (() => {});
        this.afterEach = options.afterEach || (() => {});
        this.after = options.after || (() => {});
    }

    /**
     * Adding {@link Benchmark} instance into this {@link Suite}.
     *
     * @param benchmark - the benchmark instance for adding.
     *
     * @return returns this suite for method chain.
     */
    addBenchmark(benchmark: Benchmark): Suite {
        this.benchmarks.push(benchmark);
        return this;
    }

    /**
     * Adding child {@link Suite} instance into this {@link Suite}.
     *
     * @param suite - the suite instance for adding.
     *
     * @return returns this suite for method chain.
     */
    addSuite(suite: Suite): Suite {
        this.benchmarks.push(suite);
        return this;
    }

    /**
     * Make new benchmark or suite and adding into this {@link Suite}.
     *
     * @param child - {@link Benchmark}, {@link Suite}, or arguments for {@link Benchmark#constructor}.
     *
     * @return returns this suite for method chain.
     */
    add(child: Benchmark | Suite | BenchmarkOptions | (() => Promise<void>) | (() => void)): Suite {
        if (child instanceof Benchmark) {
            this.addBenchmark(child);
        } else if (child instanceof Suite) {
            this.addSuite(child);
        } else if (typeof child === 'function') {
            const options: BenchmarkOptions = {fun: child};
            options.__proto__ = this.benchmarkDefault;
            this.addBenchmark(new Benchmark(options));
        } else {
            const options: BenchmarkOptions = Object.assign({}, child);
            options.__proto__ = this.benchmarkDefault;
            this.addBenchmark(new Benchmark(options));
        }
        return this;
    }

    /**
     * Make callbacks for {@link Benchmark#run}.
     *
     * @param count - count of benchmark in this suite.
     * @param parentCallbacks - callback functions of parent suite. same as callbacks of {@link Suite#run}.
     *
     * @return callbacks.
     *
     * @ignore
     */
    _makeCallbacks(count: number, parentCallbacks: TestCallbacks): TestCallbacks {
        const that = this;

        return {
            async beforeTest(c, b) {
                if (parentCallbacks.beforeTest) {
                    parentCallbacks.beforeTest.call(this, c, b);
                }
                that.beforeTest.call(this, count, c, b);
            },
            async afterTest(c, b, r) {
                that.afterTest.call(this, count, c, b, r);
                if (parentCallbacks.afterTest) {
                    parentCallbacks.afterTest.call(this, c, b, r);
                }
            },
        };
    }

    /**
     * Execute benchmarks parallelly.
     *
     * @param context - the context for execute.
     * @param callbacks - callback functions. same as callbacks of {@link Suite#run}.
     *
     * @return result of benchmarks.
     *
     * @ignore
     */
    async _runParallel(context: any, callbacks: TestCallbacks): Promise<Result[]> {
        await this.before.call(context);

        const results = [].concat(...await Promise.all(this.benchmarks.map(async (x, i) => {
            const ctx = Object.assign({}, context);

            await this.beforeEach.call(ctx, i, x);
            const result = await x.run(ctx, this._makeCallbacks(i, callbacks));
            await this.afterEach.call(ctx, i, x, result);
            return result;
        })));

        await this.after.call(context, results);

        return results;
    }

    /**
     * Execute benchmarks sequential.
     *
     * @param context - the context for execute.
     * @param callbacks - callback functions. same as callbacks of {@link Suite#run}.
     *
     * @return result of benchmarks.
     *
     * @ignore
     */
    async _runSequential(context: any, callbacks: TestCallbacks): Promise<Result[]> {
        await this.before.call(context);

        const results = [];
        for (let i=0; i<this.benchmarks.length; i++) {
            const b = this.benchmarks[i];
            const ctx = Object.assign({}, context);
            await this.beforeEach.call(ctx, i, b);
            const result = await b.run(ctx, this._makeCallbacks(i, callbacks));
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
     * @param [context] - the `this` for each benchmarking functions. `__proto__` will override with this instance.
     * @param [callbacks] - callback functions.
     *
     * @return {Promise<Result[]>} An array of {@link Result}s.
     */
    async run(context: any = {}, callbacks: TestCallbacks = {}): Promise<Result[]> {
        context = Object.assign({}, context);
        context.__proto__ = this;

        if (this.parallel) {
            return await this._runParallel(context, callbacks);
        } else {
            return await this._runSequential(context, callbacks);
        }
    }
}
