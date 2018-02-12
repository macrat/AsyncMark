(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.PromiseBench = {})));
}(this, (function (exports) { 'use strict';

/**
 * milliseconds timer
 *
 * @return {Number} high resolution current time in milliseconds.
 *
 * @ignore
 */
const now = typeof performance !== 'undefined' && performance.now ? function () {
  return performance.now();
} : function () {
  const hr = process.hrtime();
  return (hr[0] * 1e9 + hr[1]) / 1e6;
};

/**
 * The result of benchmark.
 */
class Result {
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
   * Convert to string for printing.
   *
   * @return {String} human redable string
   */
  toString() {
    const avg = Math.round(this.average * 10000) / 10000;
    const ops = Math.round(this.opsPerSec * 1000) / 1000;
    const range = Math.round(this.errorRange * 10000) / 10000;
    const rate = Math.round(this.errorRate * 10000) / 100;
    return `${this.name}: ${ops}ops/sec ${avg}msec/op +-${range}msec/op (${rate}%) / ${this.msecs.length} times tried`;
  }
}

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
 * import Benchmark from 'promise-bench';
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
class Benchmark {
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
    console.log(String(result));
  }

  /**
   * Execute benchmark.
   *
   * @param {Object} [context={}] - the `this` for each benchmarking functions. `__proto__` will override with this instance.
   *
   * @return {?Promise<Result>} A result of benchmark.
   */
  async run(context = {}) {
    context = Object.assign({}, context);
    context.__proto__ = this;

    await this.before.call(context);

    const loopNum = this.number || this.maxNumber;

    const msecs = [];
    for (let i = 0; i < loopNum; i++) {
      const ctx = Object.assign({}, context);

      await this.beforeEach.call(ctx, i);

      const start = now();
      await this.fun.call(ctx);
      const end = now();

      await this.afterEach.call(ctx, i, end - start);
      msecs.push(end - start);

      if (!this.number && i + 1 >= this.minNumber && new Result(this.name, msecs).errorRate <= this.targetErrorRate) {
        break;
      }
    }

    const result = new Result(this.name, msecs);
    await this.after.call(context, result);
    return result;
  }
}

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
 * import {Suite} from 'promise-bench';
 * 
 * 
 * new Suite({
 *     beforeEach() {
 *         this.text = 'hello world';
 *     },
 *     parallel: true,
 * })
 * .add(function() {
 *     /o/.test(this.text);
 * })
 * .add({
 *     name: 'String#indexOf'
 *     before() {
 *         console.log('starting String#indexOf...');
 *     },
 *     fun() {
 *         this.text.indexOf('o') > -1;
 *     },
 * })
 * .add({
 *     name: 'String#match'
 *     fun() {
 *         !!this.text.match(/o/);
 *     },
 *     after(result) {
 *         console.log('String#match is done! ' + result);
 *     },
 * })
 * .run()
 */
class Suite {
  /**
   * @param {Object} [options={}] - options for this suite.
   * @param {Number} [options.name='unnamed'] - name of this suite.
   * @param {Boolean} [options.parallel=false] - flag for executing each benchmark parallelly.
   * @param {function(): ?Promise} [options.before] - setup function. see {@link Suite#before}.
   * @param {function(count: Number, benchmark: Benchmark): ?Promise} [options.beforeEach] - setup function. see {@link Suite#before}.
   * @param {function(count: Number, benchmark: Benchmark): ?Promise} [options.afterEach] - setup function. see {@link Suite#after}.
   * @param {function(results: Result[]): ?Promise} [options.after] - setup function. see {@link Suite#after}.
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
   * @param {Benchmark|Suite|Object|function} [child={}] - {@link Benchmark}, {@link Suite}, or arguments for {@link Benchmark#constructor}.
   *
   * @return {Suite} returns this suite for method chain.
   */
  add(child = {}) {
    if (child instanceof Benchmark) {
      this.addBenchmark(child);
    } else if (child instanceof Suite) {
      this.addSuite(child);
    } else if (typeof child === 'function') {
      const options = { fun: child };
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
    for (let i = 0; i < this.benchmarks.length; i++) {
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

exports.Result = Result;
exports.default = Benchmark;
exports.Benchmark = Benchmark;
exports.Suite = Suite;

Object.defineProperty(exports, '__esModule', { value: true });

})));
