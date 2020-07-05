import Benchmark, { BenchmarkOptions } from './benchmark';
import Result from './result';
import { TargetFunc, TestCallbacks } from './callbacks';

namespace Suite {
  export type BeforeFunc = (
    /**
     * Callback function for setup before execute {@link Suite} or {@link Benchmark}.
     *
     * @return  Some Promise for awaiting, or undefined.
     */
    () => Promise<void> | void
  );

  export type BeforeEachFunc = (
    /**
     * Callback function for setup before each child {@link Benchmark} or {@link Suite}.
     *
     * @param count      Count of done benchmarks in this suite.
     * @param benchmark  A {@link Benchmark} instance that will execute.
     *
     * @return  Some Promise for awaiting, or undefined.
     */
    (count: number, benchmark: Benchmark | Suite) => Promise<void> | void
  );

  export type BeforeTestFunc = (
    /**
     * Callback function for setup before each execution target function.
     *
     * @param suiteCount  Count of done suite or benchmarks in this suite.
     * @param benchCount  Count of done execution in this benchmark.
     * @param benchmark   A {@link Benchmark} instance that will execute.
     *
     * @return  Some Promise for awaiting, or undefined.
     */
    (suiteCount: number, benchCount: number, benchmark: Benchmark) => Promise<void> | void
  );

  export type AfterTestFunc = (
    /**
     * Callback function for teardown after each execution target function.
     *
     * @param suiteCount  Count of done benchmarks in this suite.
     * @param benchCount  Count of done tests in this benchmark.
     * @param benchmark   A {@link Benchmark} instance that executed.
     * @param msec        A result of this test.
     *
     * @return  Some Promise for awaiting, or undefined.
     */
    (
      suiteCount: number,
      benchCount: number,
      benchmark: Benchmark,
      msec: number,
    ) => Promise<void> | void
  );

  export type AfterEachFunc = (
    /**
     * Callback function for setup before each child {@link Benchmark} or {@link Suite}.
     *
     * @param count      Count of done benchmarks in this suite.
     * @param benchmark  A {@link Benchmark} instance that executed.
     * @param result     A result of this benchmark.
     *
     * @return  Some Promise for awaiting, or undefined.
     */
    (count: number, benchmark: Benchmark, result: Result) => Promise<void> | void
  );

  export type AfterFunc = (
    /**
     * Callback function for teardown before execute {@link Suite} or {@link Benchmark}.
     *
     * @param results  a list of benchmark result.
     *
     * @return  Some Promise for awaiting, or undefined.
     */
    (results: Result[]) => Promise<void> | void
  );
}

/**
 * The options for {@link Suite}.
 */
export type SuiteOptions = {
  /**
   * Name of this suite.
   */
  name?: string;

  /**
   * Flag for executing each benchmark parallelly.
   */
  parallel?: boolean;

  /**
   * Setup function. see {@link Suite.before}.
   */
  before?: Suite.BeforeFunc;

  /**
   * Setup function. see {@link Suite.beforeEach}.
   */
  beforeEach?: Suite.BeforeEachFunc;

  /**
   * Setup function. see {@link Suite.beforeTest}.
   */
  beforeTest?: Suite.BeforeTestFunc;

  /**
   * Teardown function. see {@link Suite.afterTest}.
   */
  afterTest?: Suite.AfterTestFunc;

  /**
   * Teardown function. see {@link Suite.afterEach}.
   */
  afterEach?: Suite.AfterEachFunc;

  /**
   * Teardown function. see {@link Suite.after}.
   */
  after?: Suite.AfterFunc;

  /**
   * Default options for {@link Suite.add}.
   */
  benchmarkDefault?: BenchmarkOptions;
};

/**
 * A set of {@link Benchmark}s for executing those sequential or parallel.
 *
 * Suite will execute by flow like this.
 *
 *   - {@link Suite.before}
 *   - {@link Suite.beforeEach}
 *   - {@link Benchmark.before}
 *   - {@link Suite.beforeTest}
 *   - {@link Benchmark.beforeEach}
 *   - {@link Benchmark.fun}
 *   - {@link Benchmark.afterEach}
 *   - {@link Suite.afterTest}
 *   - {@link Benchmark.after}
 *   - {@link Suite.afterEach}
 *   - {@link Suite.after}
 *
 * Each function can override with options of the constructor.
 *
 *
 * ``` typescript
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
 * ```
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
   * A list of {@link Benchmark} or {@link Suite}.
   */
  benchmarks: (Benchmark | Suite)[];

  /**
   * Setup before execute all benchmarks.
   *
   * At the time executing this method, `this` is the unique object for the suite.
   * So you can use `this` for storing testing data like a database.
   * Data of `this` that set in this method will discard after call {@link Suite.after}.
   *
   * In default, do nothing.
   */
  before: Suite.BeforeFunc;

  /**
   * Setup before execute each child {@link Benchmark} or {@link Suite}.
   *
   * At the time executing this method, `this` is the unique object for the benchmark.
   * So you can use `this` for storing testing data like a database.
   * Data of `this` that set in this method will discard after call {@link Suite.afterEach}.
   *
   * In default, do nothing.
   */
  beforeEach: Suite.BeforeEachFunc;

  /**
   * Setup before execute each test of benchmarks.
   *
   * At the time executing this method, `this` is the unique object for the test.
   * So you can use `this` for storing testing data like a database.
   * Data of `this` that set in this method will discard after call {@link Suite.afterTest}.
   *
   * In default, do nothing.
   */
  beforeTest: Suite.BeforeTestFunc;

  /**
   * Teardown after execute each test of benchmarks.
   *
   * At the time executing this method, `this` is the unique object for the test.
   * So you can use `this` for storing testing data like a database.
   * Data of `this` that set in this method will discard after call this method
   *
   * In default, do nothing.
   */
  afterTest: Suite.AfterTestFunc;

  /**
   * Teardown after execute each benchmark.
   *
   * At the time executing this method, `this` is the unique object for the benchmark.
   * So you can use `this` for storing testing data like a database.
   * Data of `this` that set in this method will discard after call this method.
   *
   * In default, do nothing.
   */
  afterEach: Suite.AfterEachFunc;

  /**
   * Teardown after execute all benchmarks.
   *
   * At the time executing this method, `this` is the unique object for the suite.
   * So you can use `this` for storing testing data like a database.
   * Data of `this` that set in this method will discard after call this method.
   *
   * In default, do nothing.
   */
  after: Suite.AfterFunc;

  /**
   * @param options  Options for this suite.
   */
  constructor(options: SuiteOptions = {}) {
    this.name = options.name || 'unnamed';
    this.benchmarkDefault = options.benchmarkDefault || {};
    this.parallel = options.parallel || false;

    this.benchmarks = [];

    this.before = options.before || (() => undefined);
    this.beforeEach = options.beforeEach || (() => undefined);
    this.beforeTest = options.beforeTest || (() => undefined);
    this.afterTest = options.afterTest || (() => undefined);
    this.afterEach = options.afterEach || (() => undefined);
    this.after = options.after || (() => undefined);
  }

  /**
   * Adding {@link Benchmark} instance into this {@link Suite}.
   *
   * @param benchmark  The benchmark instance for adding.
   *
   * @return  Returns this suite for method chain.
   */
  addBenchmark(benchmark: Benchmark): Suite {
    this.benchmarks.push(benchmark);
    return this;
  }

  /**
   * Adding child {@link Suite} instance into this {@link Suite}.
   *
   * @param suite  The suite instance for adding.
   *
   * @return  Returns this suite for method chain.
   */
  addSuite(suite: Suite): Suite {
    this.benchmarks.push(suite);
    return this;
  }

  /**
   * Make new benchmark or suite and adding into this {@link Suite}.
   *
   * @param child  {@link Benchmark}, {@link Suite} or arguments for {@link Benchmark.constructor}.
   *
   * @return  Returns this suite for method chain.
   */
  add(child: Benchmark | Suite | BenchmarkOptions | TargetFunc): Suite {
    if (child instanceof Benchmark) {
      this.addBenchmark(child);
    } else if (child instanceof Suite) {
      this.addSuite(child);
    } else if (typeof child === 'function') {
      const options: BenchmarkOptions = { fun: child };
      options.__proto__ = this.benchmarkDefault;
      this.addBenchmark(new Benchmark(options));
    } else {
      const options: BenchmarkOptions = { ...child };
      options.__proto__ = this.benchmarkDefault;
      this.addBenchmark(new Benchmark(options));
    }
    return this;
  }

  /**
   * Make callbacks for {@link Benchmark.run}.
   *
   * @param count            Count of benchmark in this suite.
   * @param parentCallbacks  Callback functions of parent suite.
   *                         Same as callbacks of {@link Suite.run}.
   *
   * @return  Callbacks.
   */
  private _makeCallbacks(count: number, parentCallbacks: TestCallbacks): TestCallbacks {
    const { beforeTest, afterTest } = this;

    return {
      async beforeTest(c: number, b: Benchmark | Suite) {
        if (parentCallbacks.beforeTest) {
          await parentCallbacks.beforeTest.call(this, c, b);
        }
        await beforeTest.call(this, count, c, b);
      },
      async afterTest(c: number, b: Benchmark | Suite, r: number) {
        await afterTest.call(this, count, c, b, r);
        if (parentCallbacks.afterTest) {
          await parentCallbacks.afterTest.call(this, c, b, r);
        }
      },
    };
  }

  /**
   * Execute benchmarks parallelly.
   *
   * @param context    The context for execute.
   * @param callbacks  Callback functions. same as callbacks of {@link Suite.run}.
   *
   * @return  Result of benchmarks.
   */
  private async _runParallel(context: any, callbacks: TestCallbacks): Promise<Result[]> {
    await this.before.call(context);

    const results = [].concat(...await Promise.all(this.benchmarks.map(async (x, i) => {
      const ctx = { ...context };

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
   * @param context    The context for execute.
   * @param callbacks  Callback functions. same as callbacks of {@link Suite.run}.
   *
   * @return  Result of benchmarks.
   */
  private async _runSequential(context: any, callbacks: TestCallbacks): Promise<Result[]> {
    await this.before.call(context);

    /* eslint-disable no-await-in-loop */

    const results = [];
    for (let i = 0; i < this.benchmarks.length; i += 1) {
      const b = this.benchmarks[i];
      const ctx = { ...context };
      await this.beforeEach.call(ctx, i, b);
      const result = await b.run(ctx, this._makeCallbacks(i, callbacks));
      results.push(result);
      await this.afterEach.call(ctx, i, b, result);
    }

    /* eslint-enable no-await-in-loop */

    await this.after.call(context, results);

    return results;
  }

  /**
   * Execute benchmarks in this suite.
   *
   * All benchmarks will execute parallel if enabled {@link Suite.parallel} option.
   * Else do execute sequentially by added order.
   *
   * @param context    The `this` for each benchmarking functions.
   *                   `__proto__` will override with this instance.
   * @param callbacks  Callback functions.
   *
   * @return  An array of {@link Result}s.
   */
  async run(context: any = {}, callbacks: TestCallbacks = {}): Promise<Result[]> {
    const ctx = { ...context };
    ctx.__proto__ = this;

    if (this.parallel) {
      return this._runParallel(ctx, callbacks);
    }
    return this._runSequential(ctx, callbacks);
  }
}
