'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Suite = exports.Result = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _performanceNow = require('performance-now');

var _performanceNow2 = _interopRequireDefault(_performanceNow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * The result of benchmark.
 */
var Result = exports.Result = function () {
	/**
  * @param {String} name - name of benchmark.
  * @param {Number[]} msecs - times of benchmark result.
  *
  * @ignore
  */
	function Result(name, msecs) {
		_classCallCheck(this, Result);

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


	_createClass(Result, [{
		key: 'toString',


		/**
   * Convert to string for printing.
   *
   * @return {String}
   */
		value: function toString() {
			var avg = Math.round(this.average * 10000) / 10000;
			var error = Math.round(this.error * 10000) / 10000;
			var rate = Math.round(this.errorRate * 10000) / 100;
			return this.name + ': ' + avg + 'msec +-' + error + 'msec (' + rate + '%) / ' + this.msecs.length + ' times tried';
		}
	}, {
		key: 'total',
		get: function get() {
			return this.msecs.reduce(function (x, y) {
				return x + y;
			});
		}

		/**
   * Average time of this benchmark in milliseconds.
   *
   * @type {Number}
   */

	}, {
		key: 'average',
		get: function get() {
			return this.total / this.msecs.length;
		}

		/**
   * Time variance of times.
   *
   * @type {Number}
   */

	}, {
		key: 'variance',
		get: function get() {
			var avg = this.average;
			return this.msecs.map(function (x) {
				return Math.pow(x - avg, 2);
			}).reduce(function (x, y) {
				return x + y;
			}) / this.msecs.length;
		}

		/**
   * Standard division of times.
   *
   * @type {Number}
   */

	}, {
		key: 'std',
		get: function get() {
			return Math.sqrt(this.variance);
		}

		/**
   * Standard error of the mean of times.
   *
   * @type {Number}
   */

	}, {
		key: 'sem',
		get: function get() {
			return this.std / Math.sqrt(this.msecs.length);
		}

		/**
   * Guessed error range of this benchmark.
   *
   * @type {Number}
   */

	}, {
		key: 'error',
		get: function get() {
			return this.sem * 1.96;
		}

		/**
   * Error range per average time.
   *
   * @type {Number}
   */

	}, {
		key: 'errorRate',
		get: function get() {
			return this.error / this.average;
		}
	}]);

	return Result;
}();

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


var Benchmark = function () {
	/**
  * @param {Object|function} [options] - options for this benchmark or benchmarking function.
  * @param {Number} [options.name='unnamed'] - name of this benchmark.
  * @param {Number} [options.targetErrorRate=0.1] - wanted maximum error rate. see {@link Benchmark#targetErrorRate}.
  * @param {Number} [options.maxNumber=10000] - maximum number of executing test. see {@link Benchmark#maxNumber}.
  * @param {Number} [options.minNumber=30] - minimal number of executing test. see {@link Benchmark#minNumber}.
  * @param {?Number} [options.number] - the number of executing the test. see {@link Benchmark#number}.
  * @param {function} [options.before] - setup function. see {@link Benchmark#before}.
  * @param {function} [options.beforeEach] - setup function. see {@link Benchmark#beforeEach}.
  * @param {function} [options.fun] - target function for benchmarking. see {@link Benchmark#fun}.
  * @param {function} [options.afterEach] - teardown function. see {@link Benchmark#afterEach}.
  * @param {function} [options.after] - teardown function. see {@link Benchmark#after}.
  */
	function Benchmark() {
		var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		_classCallCheck(this, Benchmark);

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
			options.__proto__ = Benchmark.prototype;

			/** @ignore */
			this.__proto__ = options;
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
  * @return {?Promise}
  */


	_createClass(Benchmark, [{
		key: 'before',
		value: async function before() {}

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
   * @return {?Promise}
   */

	}, {
		key: 'beforeEach',
		value: async function beforeEach(count) {}

		/**
   * Setup before each tests.
   *
   * At the time executing this method, `this` is the unique object for the test.
   * So you can use `this` for storing testing data.
   * Data of `this` that set in this method will discard after call {@link Benchmark#afterEach}
   *
   * In default, couses error that `'target function is not defined'`.
   *
   * @abstract 
   *
   * @return {?Promise}
   */

	}, {
		key: 'fun',
		value: async function fun() {
			throw 'target function is not defined';
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
   *
   * @return {?Promise}
   */

	}, {
		key: 'afterEach',
		value: function afterEach(count) {}

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
   * @return {?Promise}
   */

	}, {
		key: 'after',
		value: function after(result) {
			console.log(String(result));
		}

		/**
   * Execute benchmark.
   *
   * @param {Object} [context] - the `this` for each benchmarking functions.
   *
   * @return {Promise<Result>}
   */

	}, {
		key: 'run',
		value: async function run() {
			var context = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

			if (!context) {
				context = { __proto__: this };
			}

			await this.before.call(context);

			var loopNum = this.number || this.maxNumber;

			var msecs = [];
			for (var i = 0; i < loopNum; i++) {
				var ctx = { __proto__: context };

				await this.beforeEach.call(ctx, i);

				var start = (0, _performanceNow2.default)();
				await this.fun.call(ctx);
				var end = (0, _performanceNow2.default)();

				await this.afterEach.call(ctx, i);
				msecs.push(end - start);

				if (!this.number && i + 1 >= this.minNumber) {
					var _result = new Result(this.name, msecs);
					if (_result.errorRate <= this.targetErrorRate) {
						break;
					}
				}
			}

			var result = new Result(this.name, msecs);
			await this.after.call(context, result);
			return result;
		}
	}]);

	return Benchmark;
}();

/**
 * A set of {@link Benchmark}s for executing those sequential or parallel.
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
 *     async: true,
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


exports.default = Benchmark;

var Suite = exports.Suite = function () {
	/**
  * @param {Object} [options={}] - default options for benchmarks in this suite.
  * @param {Boolean} [options.async=false] - flag for executing each benchmark asynchronously.
  * @param {function} [options.beforeSuite] - setup function. see {@link Suite#beforeSuite}.
  * @param {function} [options.afterSuite] - setup function. see {@link Suite#afterSuite}.
  */
	function Suite() {
		var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		_classCallCheck(this, Suite);

		/**
   * Default options for benchmarks in this suite.
   *
   * @type {Object}
   */
		this.options = options;

		/**
   * A list of {@link Benchmark}.
   *
   * @type {Benchmark[]}
   */
		this.benchmarks = [];

		/**
   * Flag for executing each benchmark asynchronously.
   *
   * @type {Boolean}
   */
		this.async = options.async || false;

		if (options.beforeSuite) {
			this.beforeSuite = options.beforeSuite;
		}

		if (options.afterSuite) {
			this.afterSuite = options.afterSuite;
		}
	}

	/**
  * Setup before execute all benchmarks.
  *
  * At the time executing this method, `this` is the unique object for the suite.
  * So you can use `this` for storing testing data like a database.
  * Data of `this` that set in this method will discard after call {@link Suite#afterSuite}
  *
  * In default, do nothing.
  *
  * @return {?Promise}
  */


	_createClass(Suite, [{
		key: 'beforeSuite',
		value: async function beforeSuite() {}

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
   * @return {?Promise}
   */

	}, {
		key: 'afterSuite',
		value: async function afterSuite(results) {}

		/**
   * Adding {@link Benchmark} instance into this {@link Suite}.
   *
   * @param {Benchmark} benchmark - the benchmark instance for adding.
   *
   * @return {Suite} returns this suite for method chain.
   */

	}, {
		key: 'addBenchmark',
		value: function addBenchmark(benchmark) {
			this.benchmarks.push(benchmark);
			return this;
		}

		/**
   * Make new benchmark and adding into this {@link Suite}.
   *
   * @param {Object|function} [options={}] - arguments for {@link Benchmark#constructor}.
   *
   * @return {Suite} returns this suite for method chain.
   */

	}, {
		key: 'add',
		value: function add() {
			var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

			if (typeof options === 'function') {
				this.addBenchmark(new Benchmark(Object.assign({ fun: options }, this.options)));
			} else {
				this.addBenchmark(new Benchmark(Object.assign(Object.assign({}, options), this.options)));
			}
			return this;
		}

		/**
   * Execute benchmarks in this suite.
   *
   * All benchmarks will execute parallel if enabled {@link Suite#async} option.
   * Else do execute sequentially by added order.
   *
   * @param {Object} [context] - the `this` for each benchmarking functions.
   *
   * @return {Promise<Result[]>}
   */

	}, {
		key: 'run',
		value: async function run() {
			var _this = this;

			var context = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

			if (!context) {
				context = { __proto__: this };
			}

			await this.beforeSuite.call(context);

			if (this.async) {
				return await Promise.all(this.benchmarks.map(function (x) {
					return x.run(context);
				})).then(async function (result) {
					await _this.afterSuite.call(context, result);
					return result;
				});
			}

			var result = [];
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = this.benchmarks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var b = _step.value;

					result.push((await b.run(context)));
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			await this.afterSuite.call(context, result);

			return result;
		}
	}]);

	return Suite;
}();