import Result from './result';
import { timeit } from './timer';
import { TargetFunc, TestCallbacks } from './callbacks';

namespace Benchmark {
  export type BeforeFunc = (
    /**
     * Callback function for setup before execute {@link Benchmark}.
     *
     * @return  {@link Benchmark} will await if returns Promise.
     */
    () => Promise<void> | void
  );

  export type BeforeEachFunc = (
    /**
     * Callback function for setup before each execute.
     *
     * @param count  Count of done tests in this benchmark.
     *
     * @return  {@link Benchmark} will await if returns Promise.
     */
    (count: number) => Promise<void> | void
  );

  export type AfterEachFunc = (
    /**
     * Callback function for teardown each execute.
     *
     * @param count  Count of done tests in this benchmark.
     * @param msec   Duration of this execution.
     *
     * @return  {@link Benchmark} will await if returns Promise.
     */
    (count: number, msec: number) => Promise<void> | void
  );

  export type AfterFunc = (
    /**
     * Callback function for teardown after {@link Benchmark}
     *
     * @param result  Result of this benchmark.
     *
     * @return  {@link Benchmark} will await if returns Promise.
     */
    (result: Result) => Promise<void> | void
  );
}

/**
 * The options for {@link Benchmark}.
 */
export type BenchmarkOptions = {
  /**
   * @internal
   */
  __proto__?: BenchmarkOptions;

  /**
   * Name of this benchmark.
   */
  name?: string;

  /**
   * Wanted maximum error rate. See {@link Benchmark.targetErrorRate}.
   */
  targetErrorRate?: number;

  /**
   * Maximum number of executing test. See {@link Benchmark.maxNumber}.
   */
  maxNumber?: number;

  /**
   * Minimal number of executing test. See {@link Benchmark.minNumber}.
   */
  minNumber?: number;

  /**
   * the number of executing the test. see {@link Benchmark.number}.
   */
  number?: number;

  /**
   * Setup function. See {@link Benchmark.before}.
   */
  before?: Benchmark.BeforeFunc;

  /**
   * Setup function. See {@link Benchmark.beforeEach}.
   */
  beforeEach?: Benchmark.BeforeEachFunc;

  /**
   * Target function for benchmarking. See {@link Benchmark.fun}.
   */
  fun?: TargetFunc;

  /**
   * Teardown function. See {@link Benchmark.afterEach}.
   */
  afterEach?: Benchmark.AfterEachFunc;

  /**
   * Teardown function. See {@link Benchmark.after}.
   */
  after?: Benchmark.AfterFunc;
};

/**
 * Class for benchmarking.
 *
 * Benchmark will execute by flow like this.
 *
 *   - {@link Benchmark.before | before}
 *   - {@link Benchmark.beforeEach | beforeEach}
 *   - {@link Benchmark.fun | fun}
 *   - {@link Benchmark.afterEach | afterEach}
 *   - {@link Benchmark.after | after}
 *
 * Each function can override with options of the constructor.
 *
 *
 * ``` typescript
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
 * ```
 */
export default class Benchmark { // eslint-disable-line no-redeclare
  /**
   * Name of this benchmark.
   */
  readonly name: string;

  /**
   * Wanted maximum error rate.
   * This value will be ignore if set {@link Benchmark.number}.
   */
  readonly targetErrorRate: number;

  /**
   * Maximum number of executing test.
   * This value will be ignore if set {@link Benchmark.number}.
   */
  readonly maxNumber: number;

  /**
   * Minimal number of executing test.
   * This value will be ignore if set {@link Benchmark.number}.
   */
  readonly minNumber: number;

  /**
   * The number of executing the test.
   * Will decide automatically in between {@link Benchmark.minNumber} to {@link Benchmark.maxNumber}
   * if set null.
   */
  readonly number: number;

  /**
   * Setup before execute benchmark.
   *
   * At the time executing this method, `this` is the unique object for the benchmark.
   * So you can use `this` for storing testing data like a database.
   * Data of `this` that set in this method will discard after call {@link Benchmark.after}
   *
   * In default, do nothing.
   */
  before: Benchmark.BeforeFunc;

  /**
   * Setup before each tests.
   *
   * At the time executing this method, `this` is the unique object for the test.
   * So you can use `this` for storing testing data.
   * Data of `this` that set in this method will discard after call {@link Benchmark.afterEach}
   *
   * In default, do nothing.
   */
  beforeEach: Benchmark.BeforeEachFunc;

  /**
   * The target function for benchmarking.
   *
   * At the time executing this method, `this` is the unique object for the test.
   * So you can use `this` for storing testing data.
   * Data of `this` that set in this method will discard after call {@link Benchmark.afterEach}
   *
   * In default, couses error that `Error('target function is not defined')`.
   */
  fun: TargetFunc;

  /**
   * Teardown after each tests.
   *
   * At the time executing this method, `this` is the unique object for the test.
   * So you can use `this` for storing testing data.
   * Data of `this` that set in this method will discard after call this method.
   *
   * In default, do nothing.
   */
  afterEach: Benchmark.AfterEachFunc;

  /**
   * Teardown after execute benchmark.
   *
   * At the time executing this method, `this` is the unique object for the benchmark.
   * So you can use `this` for storing testing data like a database.
   * Data of `this` that set in this method will discard after call this method.
   *
   * In default, shows test result.
   */
  after: Benchmark.AfterFunc;

  /**
   * @param options  The options for this benchmark or benchmarking function.
   */
  constructor(options: BenchmarkOptions | TargetFunc) {
    this.name = 'unnamed';
    this.targetErrorRate = 0.1;
    this.maxNumber = 10000;
    this.minNumber = 30;
    this.number = null;

    this.before = () => undefined;
    this.beforeEach = () => undefined;
    this.fun = () => {
      throw new Error('target function is not defined');
    };
    this.afterEach = () => undefined;
    this.after = (result: Result) => {
      console.log(String(result.dropOutlier())); // eslint-disable-line no-console
    };

    if (typeof options === 'function') {
      this.fun = options;
    } else {
      if (options.name) this.name = options.name;
      if (options.targetErrorRate) this.targetErrorRate = options.targetErrorRate;
      if (options.maxNumber) this.maxNumber = options.maxNumber;
      if (options.minNumber) this.minNumber = options.minNumber;
      if (options.number) this.number = options.number;

      if (options.before) this.before = options.before;
      if (options.beforeEach) this.beforeEach = options.beforeEach;
      if (options.fun) this.fun = options.fun;
      if (options.afterEach) this.afterEach = options.afterEach;
      if (options.after) this.after = options.after;
    }
  }

  /**
   * Execute benchmark.
   *
   * @param context    The `this` for each benchmarking functions.
   *                   `__proto__` will override with this instance.
   * @param callbacks  Callback functions.
   *
   * @return A result of benchmark.
   */
  async run(context: any = {}, callbacks: TestCallbacks = {}): Promise<Result> {
    const ctxInTest = { ...context };
    ctxInTest.__proto__ = this;

    await this.before.call(ctxInTest);

    const loopNum = this.number || this.maxNumber;

    /* eslint-disable no-await-in-loop */

    const msecs = [];
    for (let i = 0; i < loopNum; i += 1) {
      const ctxInLoop = { ...ctxInTest };

      if (callbacks.beforeTest) {
        await callbacks.beforeTest.call(ctxInLoop, i, this);
      }

      await this.beforeEach.call(ctxInLoop, i);

      const msec = await timeit(this.fun, [], ctxInLoop);
      msecs.push(msec);

      await this.afterEach.call(ctxInLoop, i, msec);

      if (callbacks.afterTest) {
        await callbacks.afterTest.call(ctxInLoop, i, this, msec);
      }

      if (
        !this.number
        && i + 1 >= this.minNumber
        && new Result(this.name, msecs).errorRate <= this.targetErrorRate
      ) {
        break;
      }
    }

    /* eslint-enable no-await-in-loop */

    const result = new Result(this.name, msecs);
    await this.after.call(ctxInTest, result);
    return result;
  }
}
