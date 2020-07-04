import Result from './result';
import { timeit } from './timer';

interface Context extends Record<string, unknown> {
  __proto__?: Benchmark;
}

type BeforeTestFunc = (
  ((count: number, benchmark: Benchmark) => Promise<void>)
  | ((count: number, benchmark: Benchmark) => void)
);

type BeforeFunc = (() => Promise<void>) | (() => void);

type BeforeEachFunc = ((count: number) => Promise<void>) | ((count: number) => void);

type TargetFunc = (() => Promise<void>) | (() => void);

type AfterEachFunc = (
  ((count: number, msec: number) => Promise<void>)
  | ((count: number, msec: number) => void)
);

type AfterFunc = ((result: Result) => Promise<void>) | ((result: Result) => void);

type AfterTestFunc = (
  ((count: number, benchmark: Benchmark, msec: number) => Promise<void>)
  | ((count: number, benchmark: Benchmark, msec: number) => void)
);

/**
 * The options for this benchmark.
 */
export type BenchmarkOptions = {
  /**
   * @ignore
   */
  __proto__?: BenchmarkOptions;

  /**
   * name of this benchmark.
   */
  name?: string;

  /**
   * wanted maximum error rate. see {@link Benchmark#targetErrorRate}.
   */
  targetErrorRate?: number;

  /**
   * maximum number of executing test. see {@link Benchmark#maxNumber}.
   */
  maxNumber?: number;

  /**
   * minimal number of executing test. see {@link Benchmark#minNumber}.
   */
  minNumber?: number;

  /**
   * the number of executing the test. see {@link Benchmark#number}.
   */
  number?: number;

  /**
   * setup function. see {@link Benchmark#before}.
   */
  before?: BeforeFunc;

  /**
   * setup function. see {@link Benchmark#beforeEach}.
   */
  beforeEach?: BeforeEachFunc;

  /**
   * target function for benchmarking. see {@link Benchmark#fun}.
   */
  fun?: TargetFunc;

  /**
   * teardown function. see {@link Benchmark#afterEach}.
   */
  afterEach?: AfterEachFunc;

  /**
   * teardown function. see {@link Benchmark#after}.
   */
  after?: AfterFunc;
};

/**
 * callback functions.
 */
export type TestCallbacks = {
  /**
   * callback function that will be called when before executing each test.
   */
  beforeTest?: BeforeTestFunc;

  /**
   * callback function that will be called when after executing each test.
   */
  afterTest?: AfterTestFunc;
};

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
   * Name of this benchmark.
   */
  readonly name: string;

  /**
   * Wanted maximum error rate.
   * This value will be ignore if set {@link Benchmark#number}.
   */
  readonly targetErrorRate: number;

  /**
   * Maximum number of executing test.
   * This value will be ignore if set {@link Benchmark#number}.
   */
  readonly maxNumber: number;

  /**
   * Minimal number of executing test.
   * This value will be ignore if set {@link Benchmark#number}.
   */
  readonly minNumber: number;

  /**
   * The number of executing the test.
   * Will decide automatically in between {@link Benchmark#minNumber} to {@link Benchmark#maxNumber}
   * if set null.
   */
  readonly number: number;

  /**
   * Setup before execute benchmark.
   *
   * At the time executing this method, `this` is the unique object for the benchmark.
   * So you can use `this` for storing testing data like a database.
   * Data of `this` that set in this method will discard after call {@link Benchmark#after}
   *
   * In default, do nothing.
   *
   * @return  {@link Benchmark} will await if returns {@link Promise}.
   */
  before: BeforeFunc;

  /**
   * Setup before each tests.
   *
   * At the time executing this method, `this` is the unique object for the test.
   * So you can use `this` for storing testing data.
   * Data of `this` that set in this method will discard after call {@link Benchmark#afterEach}
   *
   * In default, do nothing.
   *
   * @param count - count of done tests in this benchmark.
   *
   * @return {@link Benchmark} will await if returns {@link Promise}.
   */
  beforeEach: BeforeEachFunc;

  /**
   * The target function for benchmarking.
   *
   * At the time executing this method, `this` is the unique object for the test.
   * So you can use `this` for storing testing data.
   * Data of `this` that set in this method will discard after call {@link Benchmark#afterEach}
   *
   * In default, couses error that `Error('target function is not defined')`.
   *
   * @return  If returns {@link Promise}, {@link Benchmark} will measure the time it takes for the
   *          Promise to resolve. Otherwise will measure the time it to method return.
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
   *
   * @param count - count of done tests in this benchmark.
   * @param msec - duration of this execution.
   *
   * @return {@link Benchmark} will await if returns {@link Promise}.
   */
  afterEach: AfterEachFunc;

  /**
   * Teardown after execute benchmark.
   *
   * At the time executing this method, `this` is the unique object for the benchmark.
   * So you can use `this` for storing testing data like a database.
   * Data of `this` that set in this method will discard after call this method.
   *
   * In default, shows test result.
   *
   * @param result - result of this benchmark.
   *
   * @return {@link Benchmark} will await if returns {@link Promise}.
   */
  after: AfterFunc;

  /**
   * @param options - The options for this benchmark or benchmarking function.
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
   * @param [context] - the `this` for each benchmarking functions.
   *                    `__proto__` will override with this instance.
   * @param [callbacks] - callback functions.
   *
   * @return A result of benchmark.
   */
  async run<T extends Context>(
    context: T = {} as T,
    callbacks: TestCallbacks = {},
  ): Promise<Result> {
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
