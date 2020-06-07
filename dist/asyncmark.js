(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('assert')) :
    typeof define === 'function' && define.amd ? define(['exports', 'assert'], factory) :
    (global = global || self, factory(global.AsyncMark = {}, global.assert));
}(this, (function (exports, assert) { 'use strict';

    assert = assert && Object.prototype.hasOwnProperty.call(assert, 'default') ? assert['default'] : assert;

    /**
     * Generate {@link AssertionError}
     *
     * @param rule - the rule that couses error.
     * @param result - the result for assert.
     * @param [stackStartFn] - provided function will remove from stack trace.
     *
     * @return generated error
     *
     * @ignore
     * @since 0.3.0
     */
    function AssertionError(rule, result, stackStartFn) {
        return new assert.AssertionError({
            message: "benchmark \"" + result.name + "\": actual:" + result.average + "msec/op " + rule.operator + " expected:" + rule.expected + "msec/op",
            actual: result.average + " msec/op",
            expected: rule.expected + " msec/op",
            operator: rule.operator,
            stackStartFn: stackStartFn || rule.assert,
        });
    }
    /**
     * Generate alternate error with default {@link Error}
     *
     * @param rule - the rule that couses error.
     * @param result - the result for assert.
     * @param [stackStartFn] - provided function will remove from stack trace.
     *
     * @return generated error
     *
     * @ignore
     * @since 0.3.0
     */
    function AlternateError(rule, result, stackStartFn) {
        return Object.assign(new Error("benchmark \"" + result.name + "\": actual:" + result.average + "msec/op " + rule.operator + " expected:" + rule.expected + "msec/op"), {
            actual: result.average + " msec/op",
            expected: rule.expected + " msec/op",
            operator: rule.operator,
        });
    }
    /**
     * Convert unit to number
     *
     * @example
     * assert(100 * unit('ms') == 0.1 * unit('sec'))
     *
     * @param u - unit name like 'ms', 'sec' or etc.
     *
     * @return number to convert milliseconds.
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
                throw Error("unknown unit name: \"" + u + "\"");
        }
    }
    /**
     * The assertion rule
     *
     * @since 0.3.0
     */
    var AssertRule = /** @class */ (function () {
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
         * @param rule - assert rule that milliseconds {@link Number} or {@link String} value like '<10ms' or '>=20s'.
         */
        function AssertRule(rule) {
            var _a;
            var m = String(rule).match(/^(|[<>]=?)(\d+(?:\.\d+)?)(|s|ms|us|ns|sec|msec|usec|nsec)$/);
            if (m === null) {
                throw Error("Invalid rule format: \"" + rule + "\"");
            }
            this.operator = ((_a = m[1]) !== null && _a !== void 0 ? _a : '<=');
            this.expected = Number(m[2]) * unit(m[3]);
            this.errorFn = assert !== undefined ? AssertionError : AlternateError;
        }
        /**
         * Checking benchmark result.
         *
         * @param msec - target milliseconds.
         *
         * @return returns true if msec is acceptable.
         */
        AssertRule.prototype.check = function (msec) {
            var _this = this;
            return {
                '<': function (ms) { return ms < _this.expected; },
                '<=': function (ms) { return ms <= _this.expected; },
                '>': function (ms) { return ms > _this.expected; },
                '>=': function (ms) { return ms >= _this.expected; },
            }[this.operator](msec);
        };
        /**
         * Assert with benchmark result.
         *
         * @param result - result of benchmark.
         * @param [stackStartFn] - provided function will remove from stack trace.
         *
         * @throws when result is unacceptable.
         *
         * @since 0.3.0
         */
        AssertRule.prototype.assert = function (result, stackStartFn) {
            if (!this.check(result.average)) {
                throw this.errorFn(this, result, stackStartFn);
            }
        };
        return AssertRule;
    }());

    /**
     * The result of benchmark.
     *
     * This value will included outlier. Please use {@link Result#dropOutlier} if you want drop they.
     */
    var Result = /** @class */ (function () {
        /**
         * @param {String} name - name of benchmark.
         * @param {Number[]} msecs - times of benchmark result.
         *
         * @ignore
         */
        function Result(name, msecs) {
            this.name = name;
            this.msecs = msecs;
        }
        Object.defineProperty(Result.prototype, "total", {
            /**
             * Total milliseconds of this benchmark.
             *
             * @type {Number}
             */
            get: function () {
                return this.msecs.reduce(function (x, y) { return x + y; });
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Result.prototype, "fastest", {
            /**
             * The time of fastest test in milliseconds.
             *
             * @type {Number}
             */
            get: function () {
                return this.msecs.reduce(function (x, y) { return Math.min(x, y); });
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Result.prototype, "slowest", {
            /**
             * The time of slowest test in milliseconds.
             *
             * @type {Number}
             */
            get: function () {
                return this.msecs.reduce(function (x, y) { return Math.max(x, y); });
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Result.prototype, "average", {
            /**
             * Average time of this benchmark in milliseconds.
             *
             * @type {Number}
             */
            get: function () {
                return this.total / this.msecs.length;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Result.prototype, "variance", {
            /**
             * Time unbiased sample variance of times.
             *
             * @type {Number}
             */
            get: function () {
                var avg = this.average;
                return this.msecs.map(function (x) { return Math.pow(x - avg, 2); }).reduce(function (x, y) { return x + y; }) / (this.msecs.length - 1);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Result.prototype, "std", {
            /**
             * Standard division of times.
             *
             * @type {Number}
             */
            get: function () {
                return Math.sqrt(this.variance);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Result.prototype, "sem", {
            /**
             * Standard error of the mean of times.
             *
             * @type {Number}
             */
            get: function () {
                return this.std / Math.sqrt(this.msecs.length);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Result.prototype, "errorRange", {
            /**
             * Guessed error range of this benchmark.
             *
             * @type {Number}
             */
            get: function () {
                return this.sem * 1.96;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Result.prototype, "errorRate", {
            /**
             * Error range per average time.
             *
             * @type {Number}
             */
            get: function () {
                return this.errorRange / this.average;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Result.prototype, "opsPerSec", {
            /**
             * Operations per seconds.
             *
             * @type {Number}
             */
            get: function () {
                return 1000 / this.average;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Make new Result that droped outlier.
         *
         * @param {Number} [threshold=2] the threshold of outlier testing.
         *
         * @return {Result} new {@link Result} instance.
         */
        Result.prototype.dropOutlier = function (threshold) {
            if (threshold === void 0) { threshold = 2; }
            var avg = this.average;
            var std = this.std;
            return new Result(this.name, this.msecs.filter(function (x) { return Math.abs((x - avg) / std) <= threshold; }));
        };
        /**
         * Convert to string for printing.
         *
         * @return {String} human redable string
         */
        Result.prototype.toString = function () {
            var avg = Math.round(this.average * 10000) / 10000;
            var ops = Math.round(this.opsPerSec * 1000) / 1000;
            var range = Math.round(this.errorRange * 10000) / 10000;
            var rate = Math.round(this.errorRate * 10000) / 100;
            return this.name + ":\t" + ops + "ops/sec\t" + avg + "msec/op\t+-" + range + "msec/op (" + rate + "%)\t" + this.msecs.length + " times tried";
        };
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
        Result.prototype.assert = function () {
            var _this = this;
            var expected = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                expected[_i] = arguments[_i];
            }
            var rules = expected.map(function (x) { return new AssertRule(x); });
            rules.forEach(function (rule) { return rule.assert(_this, _this.assert); });
        };
        return Result;
    }());

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    /**
     * Get a timer value in milliseconds resolution with {@link Date} class.
     *
     * @return a timer value in milliseconds.
     *
     * @ignore
     * @since 0.2.5
     */
    function now_date() {
        return Number(new Date());
    }
    /**
     * Get a timer value in microseconds resolution with {@link Performance.now} function.
     *
     * @return a timer value in milliseconds. (microseconds resolution)
     *
     * @ignore
     * @since 0.2.5
     */
    function now_now() {
        return performance.now();
    }
    /**
     * Get a timer value in nanoseconds resolution with {@link Process.hrtime} function.
     *
     * @return a timer value in milliseconds. (nanoseconds resolution)
     *
     * @ignore
     * @since 0.2.5
     */
    function now_hrtime() {
        var hr = process.hrtime();
        return (hr[0] * 1e9 + hr[1]) / 1e6;
    }
    /**
     * Get the current time as high resolution as possible in the current platform.
     *
     * @return a timer value in milliseconds.
     *
     * @ignore
     */
    var now = now_date;
    if (typeof process !== 'undefined' && process.hrtime) {
        now = now_hrtime;
    }
    else if (typeof performance !== 'undefined' && performance.now) {
        now = now_now;
    }
    /**
     * Measure tiem to execute a function.
     *
     * wait for done if the target function returns a thenable object. so you can use async function.
     *
     * NOTE: this function will execute target function only once.
     *
     * @param fun - the target function.
     * @param [context] - the `this` for target function.
     * @param [args] - arguments to passing to target function.
     *
     * @return milliseconds taked executing.
     *
     * @example
     * const msec = await timeit(function() {
     *     # do something heavy.
     * });
     *
     * @example
     * console.log(await timeit(axios.get, args=['http://example.com']));
     *
     * @since 0.2.4
     */
    function timeit(fun, context, args) {
        if (context === void 0) { context = {}; }
        if (args === void 0) { args = []; }
        return __awaiter(this, void 0, void 0, function () {
            var start, end;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        start = now();
                        return [4 /*yield*/, fun.call.apply(fun, __spreadArrays([context], args))];
                    case 1:
                        _a.sent();
                        end = now();
                        return [2 /*return*/, end - start];
                }
            });
        });
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
    var Benchmark = /** @class */ (function () {
        /**
         * @param options - The options for this benchmark or benchmarking function.
         */
        function Benchmark(options) {
            if (typeof options === 'function') {
                this.name = 'unnamed';
                this.targetErrorRate = 0.1;
                this.maxNumber = 10000;
                this.minNumber = 30;
                this.number = null;
                this.fun = options;
            }
            else {
                this.name = options.name || 'unnamed';
                this.targetErrorRate = options.targetErrorRate || 0.1;
                this.maxNumber = options.maxNumber || 10000;
                this.minNumber = options.minNumber || 30;
                this.number = options.number || null;
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
         * @return  {@link Benchmark} will await if returns {@link Promise}. Resolved value never evaluation.
         */
        Benchmark.prototype.before = function () {
            return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); });
        };
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
         * @return {@link Benchmark} will await if returns {@link Promise}. Resolved value never evaluation.
         */
        Benchmark.prototype.beforeEach = function (count) {
            return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); });
        };
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
         * @return If returns {@link Promise}, {@link Benchmark} will measure the time it takes for the Promise to resolve. Otherwise will measure the time it to method return.
         */
        Benchmark.prototype.fun = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    throw new Error('target function is not defined');
                });
            });
        };
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
         * @return {@link Benchmark} will await if returns {@link Promise}. Resolved value never evaluation.
         */
        Benchmark.prototype.afterEach = function (count, msec) {
            return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); });
        };
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
         * @return {@link Benchmark} will await if returns {@link Promise}. Resolved value never evaluation.
         */
        Benchmark.prototype.after = function (result) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    console.log(String(result.dropOutlier()));
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Execute benchmark.
         *
         * @param [context] - the `this` for each benchmarking functions. `__proto__` will override with this instance.
         * @param [callbacks] - callback functions.
         *
         * @return A result of benchmark.
         */
        Benchmark.prototype.run = function (context, callbacks) {
            if (context === void 0) { context = {}; }
            if (callbacks === void 0) { callbacks = {}; }
            return __awaiter(this, void 0, void 0, function () {
                var loopNum, msecs, i, ctx, msec, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            context = Object.assign({}, context);
                            context.__proto__ = this;
                            return [4 /*yield*/, this.before.call(context)];
                        case 1:
                            _a.sent();
                            loopNum = this.number || this.maxNumber;
                            msecs = [];
                            i = 0;
                            _a.label = 2;
                        case 2:
                            if (!(i < loopNum)) return [3 /*break*/, 11];
                            ctx = Object.assign({}, context);
                            if (!callbacks.beforeTest) return [3 /*break*/, 4];
                            return [4 /*yield*/, callbacks.beforeTest.call(ctx, i, this)];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4: return [4 /*yield*/, this.beforeEach.call(ctx, i)];
                        case 5:
                            _a.sent();
                            return [4 /*yield*/, timeit(this.fun, ctx)];
                        case 6:
                            msec = _a.sent();
                            msecs.push(msec);
                            return [4 /*yield*/, this.afterEach.call(ctx, i, msec)];
                        case 7:
                            _a.sent();
                            if (!callbacks.afterTest) return [3 /*break*/, 9];
                            return [4 /*yield*/, callbacks.afterTest.call(ctx, i, this, msec)];
                        case 8:
                            _a.sent();
                            _a.label = 9;
                        case 9:
                            if (!this.number && i + 1 >= this.minNumber && (new Result(this.name, msecs)).errorRate <= this.targetErrorRate) {
                                return [3 /*break*/, 11];
                            }
                            _a.label = 10;
                        case 10:
                            i++;
                            return [3 /*break*/, 2];
                        case 11:
                            result = new Result(this.name, msecs);
                            return [4 /*yield*/, this.after.call(context, result)];
                        case 12:
                            _a.sent();
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        return Benchmark;
    }());

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
    var Suite = /** @class */ (function () {
        /**
         * @param [options] - options for this suite.
         */
        function Suite(options) {
            if (options === void 0) { options = {}; }
            this.name = options.name || 'unnamed';
            this.benchmarkDefault = options.benchmarkDefault || {};
            this.parallel = options.parallel || false;
            this.benchmarks = [];
            this.before = options.before || this.before;
            this.beforeEach = options.beforeEach || this.beforeEach;
            this.beforeTest = options.beforeTest || this.beforeTest;
            this.afterTest = options.afterTest || this.afterTest;
            this.afterEach = options.afterEach || this.afterEach;
            this.after = options.after || this.after;
        }
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
        Suite.prototype.before = function () {
            return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); });
        };
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
        Suite.prototype.beforeEach = function (count, benchmark) {
            return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); });
        };
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
        Suite.prototype.beforeTest = function (suiteCount, benchCount, benchmark) {
            return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); });
        };
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
        Suite.prototype.afterTest = function (suiteCount, benchCount, benchmark, msec) {
            return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); });
        };
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
        Suite.prototype.afterEach = function (count, benchmark, result) {
            return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); });
        };
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
        Suite.prototype.after = function (resultso) {
            return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); });
        };
        /**
         * Adding {@link Benchmark} instance into this {@link Suite}.
         *
         * @param benchmark - the benchmark instance for adding.
         *
         * @return returns this suite for method chain.
         */
        Suite.prototype.addBenchmark = function (benchmark) {
            this.benchmarks.push(benchmark);
            return this;
        };
        /**
         * Adding child {@link Suite} instance into this {@link Suite}.
         *
         * @param suite - the suite instance for adding.
         *
         * @return returns this suite for method chain.
         */
        Suite.prototype.addSuite = function (suite) {
            this.benchmarks.push(suite);
            return this;
        };
        /**
         * Make new benchmark or suite and adding into this {@link Suite}.
         *
         * @param child - {@link Benchmark}, {@link Suite}, or arguments for {@link Benchmark#constructor}.
         *
         * @return returns this suite for method chain.
         */
        Suite.prototype.add = function (child) {
            if (child instanceof Benchmark) {
                this.addBenchmark(child);
            }
            else if (child instanceof Suite) {
                this.addSuite(child);
            }
            else if (typeof child === 'function') {
                var options = { fun: child };
                options.__proto__ = this.benchmarkDefault;
                this.addBenchmark(new Benchmark(options));
            }
            else {
                var options = Object.assign({}, child);
                options.__proto__ = this.benchmarkDefault;
                this.addBenchmark(new Benchmark(options));
            }
            return this;
        };
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
        Suite.prototype._makeCallbacks = function (count, parentCallbacks) {
            var that = this;
            return {
                beforeTest: function (c, b) {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (parentCallbacks.beforeTest) {
                                parentCallbacks.beforeTest.call(this, c, b);
                            }
                            that.beforeTest.call(this, count, c, b);
                            return [2 /*return*/];
                        });
                    });
                },
                afterTest: function (c, b, r) {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            that.afterTest.call(this, count, c, b, r);
                            if (parentCallbacks.afterTest) {
                                parentCallbacks.afterTest.call(this, c, b, r);
                            }
                            return [2 /*return*/];
                        });
                    });
                },
            };
        };
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
        Suite.prototype._runParallel = function (context, callbacks) {
            return __awaiter(this, void 0, void 0, function () {
                var results, _a, _b, _c;
                var _this = this;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.before.call(context)];
                        case 1:
                            _d.sent();
                            _b = (_a = [].concat).apply;
                            _c = [[]];
                            return [4 /*yield*/, Promise.all(this.benchmarks.map(function (x, i) { return __awaiter(_this, void 0, void 0, function () {
                                    var ctx, result;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                ctx = Object.assign({}, context);
                                                return [4 /*yield*/, this.beforeEach.call(ctx, i, x)];
                                            case 1:
                                                _a.sent();
                                                return [4 /*yield*/, x.run(ctx, this._makeCallbacks(i, callbacks))];
                                            case 2:
                                                result = _a.sent();
                                                return [4 /*yield*/, this.afterEach.call(ctx, i, x, result)];
                                            case 3:
                                                _a.sent();
                                                return [2 /*return*/, result];
                                        }
                                    });
                                }); }))];
                        case 2:
                            results = _b.apply(_a, _c.concat([_d.sent()]));
                            return [4 /*yield*/, this.after.call(context, results)];
                        case 3:
                            _d.sent();
                            return [2 /*return*/, results];
                    }
                });
            });
        };
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
        Suite.prototype._runSequential = function (context, callbacks) {
            return __awaiter(this, void 0, void 0, function () {
                var results, i, b, ctx, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.before.call(context)];
                        case 1:
                            _a.sent();
                            results = [];
                            i = 0;
                            _a.label = 2;
                        case 2:
                            if (!(i < this.benchmarks.length)) return [3 /*break*/, 7];
                            b = this.benchmarks[i];
                            ctx = Object.assign({}, context);
                            return [4 /*yield*/, this.beforeEach.call(ctx, i, b)];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, b.run(ctx, this._makeCallbacks(i, callbacks))];
                        case 4:
                            result = _a.sent();
                            results.push(result);
                            return [4 /*yield*/, this.afterEach.call(ctx, i, b, result)];
                        case 5:
                            _a.sent();
                            _a.label = 6;
                        case 6:
                            i++;
                            return [3 /*break*/, 2];
                        case 7: return [4 /*yield*/, this.after.call(context, results)];
                        case 8:
                            _a.sent();
                            return [2 /*return*/, results];
                    }
                });
            });
        };
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
        Suite.prototype.run = function (context, callbacks) {
            if (context === void 0) { context = {}; }
            if (callbacks === void 0) { callbacks = {}; }
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            context = Object.assign({}, context);
                            context.__proto__ = this;
                            if (!this.parallel) return [3 /*break*/, 2];
                            return [4 /*yield*/, this._runParallel(context, callbacks)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2: return [4 /*yield*/, this._runSequential(context, callbacks)];
                        case 3: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        return Suite;
    }());

    exports.Benchmark = Benchmark;
    exports.Result = Result;
    exports.Suite = Suite;
    exports.default = Benchmark;
    exports.timeit = timeit;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
