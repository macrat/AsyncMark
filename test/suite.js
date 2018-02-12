import assert from 'power-assert';

import Benchmark, {Suite, Result} from '../src';


/**
 * @test {Suite}
 */
describe('Suite', function() {
    describe('#constructor', function() {
        it('default values', function() {
            const s = new Suite();

            assert(s.name === 'unnamed');
            assert(s.parallel === false);
            assert.deepStrictEqual(s.benchmarkDefault, {});
        });

        it('options', function() {
            const conf = {
                name: 'foo',
                parallel: true,
                benchmarkDefault: {
                    name: 'bar',
                },
            };
            const s = new Suite(conf);

            assert(s.name === 'foo');
            assert(s.parallel === true);
            assert.deepStrictEqual(s.benchmarkDefault, {name: 'bar'});
        });

        it('functions', function() {
            const called = {
                before: false,
                beforeEach: false,
                afterEach: false,
                after: false,
            };
            const s = new Suite({
                before() {
                    called.before = true;
                },
                beforeEach() {
                    called.beforeEach = true;
                },
                fun() {
                    called.fun = true;
                },
                afterEach() {
                    called.afterEach = true;
                },
                after() {
                    called.after = true;
                },
            });

            assert(called.before === false);
            s.before();
            assert(called.before === true);

            assert(called.beforeEach === false);
            s.beforeEach();
            assert(called.beforeEach === true);

            assert(called.afterEach === false);
            s.afterEach();
            assert(called.afterEach === true);

            assert(called.after === false);
            s.after();
            assert(called.after === true);
        });
    });

    /**
     * @test {Suite#addBenchmark}
     */
    it('#addBenchmark', function() {
        const s = new Suite();
        const b1 = new Benchmark({name: 'a'});
        const b2 = new Benchmark({name: 'b'});

        assert.deepStrictEqual(s.benchmarks, []);
        s.addBenchmark(b1);
        assert.deepStrictEqual(s.benchmarks, [b1]);
        s.addBenchmark(b2);
        assert.deepStrictEqual(s.benchmarks, [b1, b2]);

        assert(s.benchmarks[0].name === 'a');
        assert(s.benchmarks[1].name === 'b');
    });

    /**
     * @test {Suite#addSuite}
     */
    it('#addSuite', function() {
        const p = new Suite();
        const c1 = new Suite();
        const c2 = new Suite();

        assert(p !== c1);
        assert(p !== c2);
        assert(c1 !== c2);

        assert.deepStrictEqual(p.benchmarks, []);
        p.addBenchmark(c1);
        assert.deepStrictEqual(p.benchmarks, [c1]);
        p.addBenchmark(c2);
        assert.deepStrictEqual(p.benchmarks, [c1, c2]);
    });

    /**
     * @test {Suite#add}
     */
    describe('#add', function() {
        it('Benchmark', function() {
            const s = new Suite();
            const b = new Benchmark({name: 'foobar'});

            assert.deepStrictEqual(s.benchmarks, []);
            s.add(b);

            assert.deepStrictEqual(s.benchmarks, [b]);
            assert(s.benchmarks[0].name === 'foobar');
        });

        it('Suite', function() {
            const p = new Suite();
            const c = new Suite();

            assert(p !== c);
            assert.deepStrictEqual(p.benchmarks, []);

            p.add(c);

            assert.deepStrictEqual(p.benchmarks, [c]);
            assert.deepStrictEqual(c.benchmarks, []);
        });

        it('function', async function() {
            const called = {
                fun: false,
                after: false,
            };
            const fun = function() {
                called.fun = true;
            };
            const s = new Suite({
                benchmarkDefault: {
                    after() {
                        called.after = true;
                    },
                },
            });

            assert.deepStrictEqual(s.benchmarks, []);
            s.add(fun);
            assert(s.benchmarks.length === 1);

            assert(called.fun === false);
            await s.benchmarks[0].fun();
            assert(called.fun === true);

            assert(called.after === false);
            await s.benchmarks[0].after();
            assert(called.after === true);
        });

        it('function with override default', async function() {
            const called = {
                original: false,
                overrided: false,
            };
            const s = new Suite({
                benchmarkDefault: {
                    fun() {
                        called.original = true;
                    },
                },
            });

            const conf = {
                fun() {
                    called.overrided = true;
                },
            };

            assert.deepStrictEqual(s.benchmarks, []);
            s.add(conf);
            assert(s.benchmarks.length === 1);

            assert(called.original === false);
            assert(called.overrided === false);
            await s.benchmarks[0].fun();
            assert(called.original === false);
            assert(called.overrided === true);
        });

        it('object', async function() {
            const called = {
                fun: false,
                after: false,
            };
            const s = new Suite({
                benchmarkDefault: {
                    after() {
                        called.after = true;
                    },
                },
            });

            const conf = {
                fun() {
                    called.fun = true;
                },
            };

            assert.deepStrictEqual(s.benchmarks, []);
            s.add(conf);
            assert(s.benchmarks.length === 1);

            assert(called.fun === false);
            await s.benchmarks[0].fun();
            assert(called.fun === true);

            assert(called.after === false);
            await s.benchmarks[0].after();
            assert(called.after === true);
        });

        it('object with override default', async function() {
            const called = {
                original: false,
                overrided: false,
            };
            const s = new Suite({
                benchmarkDefault: {
                    after() {
                        called.original = true;
                    },
                },
            });

            const conf = {
                after() {
                    called.overrided = true;
                },
            };

            assert.deepStrictEqual(s.benchmarks, []);
            s.add(conf);
            assert(s.benchmarks.length === 1);

            assert(called.original === false);
            assert(called.overrided === false);
            await s.benchmarks[0].after();
            assert(called.original === false);
            assert(called.overrided === true);
        });
    });

    /**
     * @test {Suite#run}
     */
    describe('#run', function() {
        describe('call methods order', function() {
            it('empty tests', async function() {
                const callLog = [];

                const s = new Suite({
                    before() {
                        callLog.push('before');
                    },
                    beforeEach() {
                        callLog.push('beforeEach');
                    },
                    afterEach() {
                        callLog.push('afterEach');
                    },
                    after() {
                        callLog.push('after');
                    },
                });

                assert.deepStrictEqual(callLog, []);

                await s.run();

                assert.deepStrictEqual(callLog, [
                    'before',
                    'after',
                ]);
            });

            it('empty tests (enabled parallel)', async function() {
                const callLog = [];

                const s = new Suite({
                    before() {
                        callLog.push('before');
                    },
                    beforeEach() {
                        callLog.push('beforeEach');
                    },
                    afterEach() {
                        callLog.push('afterEach');
                    },
                    after() {
                        callLog.push('after');
                    },
                    parallel: true,
                });

                assert.deepStrictEqual(callLog, []);

                await s.run();

                assert.deepStrictEqual(callLog, [
                    'before',
                    'after',
                ]);
            });

            it('with test', async function() {
                const callLog = [];

                const s = new Suite({
                    before() {
                        callLog.push('before');
                    },
                    beforeEach() {
                        callLog.push('beforeEach');
                    },
                    afterEach() {
                        callLog.push('afterEach');
                    },
                    after() {
                        callLog.push('after');
                    },
                    benchmarkDefault: {
                        after() {},
                    },
                });

                s.add({
                    number: 2,
                    fun() {
                        callLog.push('bench1');
                    },
                });

                s.add({
                    number: 3,
                    fun() {
                        callLog.push('bench2');
                    },
                });

                assert.deepStrictEqual(callLog, []);

                await s.run();

                assert.deepStrictEqual(callLog, [
                    'before',
                    'beforeEach',
                    'bench1',
                    'bench1',
                    'afterEach',
                    'beforeEach',
                    'bench2',
                    'bench2',
                    'bench2',
                    'afterEach',
                    'after',
                ]);
            });

            it('with test (enabled parallel)', async function() {
                const callLog = [];

                const s = new Suite({
                    before() {
                        callLog.push('before');
                    },
                    beforeEach() {
                        callLog.push('beforeEach');
                    },
                    afterEach() {
                        callLog.push('afterEach');
                    },
                    after() {
                        callLog.push('after');
                    },
                    benchmarkDefault: {
                        after() {},
                    },
                    parallel: true,
                });

                s.add({
                    number: 2,
                    fun() {
                        callLog.push('bench1');
                    },
                });

                s.add({
                    number: 3,
                    fun() {
                        callLog.push('bench2');
                    },
                });

                assert.deepStrictEqual(callLog, []);

                await s.run();

                assert(callLog.length === 11);

                assert(callLog[0] === 'before');
                assert(callLog[1] === 'beforeEach');
                assert(callLog[callLog.length - 2] === 'afterEach');
                assert(callLog[callLog.length - 1] === 'after');

                assert(callLog.filter(x => x === 'bench1').length === 2);
                assert(callLog.filter(x => x === 'bench2').length === 3);
                assert(callLog.filter(x => x === 'beforeEach').length === 2);
                assert(callLog.filter(x => x === 'afterEach').length === 2);
            });
        });

        const contextTest = async function(options) {
            options.__proto__ = {
                before() {
                    assert(this.inOuter === undefined);
                    assert(this.inInner === undefined);
                    assert(this.inBench === undefined);
                    assert(this.outInner === undefined);
                    assert(this.outOuter === undefined);

                    this.inOuter = 123;
                },
                beforeEach() {
                    assert(this.inOuter === 123);
                    assert(this.inInner === undefined);
                    assert(this.inBench === undefined);
                    assert(this.outInner === undefined);
                    assert(this.outOuter === undefined);

                    this.inInner = 'abc';
                },
                afterEach() {
                    assert(this.inOuter === 123);
                    assert(this.inInner === 'abc');
                    assert(this.inBench === undefined);
                    assert(this.outInner === undefined);
                    assert(this.outOuter === undefined);

                    this.outInner = 'cba';
                },
                after() {
                    assert(this.inOuter === 123);
                    assert(this.inInner === undefined);
                    assert(this.inBench === undefined);
                    assert(this.outInner === undefined);
                    assert(this.outOuter === undefined);

                    this.outOuter = 321;
                },
                benchmarkDefault: {
                    fun() {},
                },
            };

            const s = new Suite(options);

            s.add({
                number: 2,
                before() {
                    assert(this.inOuter === 123);
                    assert(this.inInner === 'abc');
                    assert(this.inBench === undefined);
                    assert(this.outInner === undefined);
                    assert(this.outOuter === undefined);

                    this.inBench = 42;
                },
                after() {
                    assert(this.inOuter === 123);
                    assert(this.inInner === 'abc');
                    assert(this.inBench === 42);
                    assert(this.outInner === undefined);
                    assert(this.outOuter === undefined);
                },
            });

            s.add({
                number: 3,
                before() {
                    assert(this.inOuter === 123);
                    assert(this.inInner === 'abc');
                    assert(this.inBench === undefined);
                    assert(this.outInner === undefined);
                    assert(this.outOuter === undefined);

                    this.inBench = 24;
                },
                after() {
                    assert(this.inOuter === 123);
                    assert(this.inInner === 'abc');
                    assert(this.inBench === 24);
                    assert(this.outInner === undefined);
                    assert(this.outOuter === undefined);
                },
            });

            await s.run();
        };

        it('context handling', function() {
            return contextTest({parallel: false});
        });

        it('context handling (enabled parallel)', function() {
            return contextTest({parallel: true});
        });

        const argumentsTest = async function(options) {
            const beforeCounts = [];
            const afterCounts = [];

            options.__proto__ = {
                before() {
                    assert(arguments.length === 0);
                },
                beforeEach(count, benchmark) {
                    assert(arguments.length === 2);

                    assert(typeof count === 'number');
                    beforeCounts.push(count);

                    assert(benchmark instanceof Benchmark);
                },
                fun() {
                    assert(arguments.length === 0);
                },
                afterEach(count, benchmark, result) {
                    assert(arguments.length === 3);

                    assert(typeof count === 'number');
                    afterCounts.push(count);

                    assert(benchmark instanceof Benchmark);
                    assert(result instanceof Result);
                    assert(result.msecs.length === 3);
                },
                after(results) {
                    assert(arguments.length === 1);

                    results.forEach(x => {
                        assert(x instanceof Result);
                        assert(x.msecs.length === 3);
                    });
                },
                benchmarkDefault: {
                    number: 3,
                    fun() {},
                    after() {},
                },
            };

            const s = new Suite(options);

            s.add({});
            s.add({});

            const results = await s.run();
            results.forEach(x => {
                assert(x instanceof Result);
                assert(x.msecs.length === 3);
            });

            assert.deepStrictEqual(beforeCounts, [0, 1]);
            assert.deepStrictEqual(afterCounts, [0, 1]);
        };

        it('arguments for methods', function() {
            return argumentsTest({parallel: false});
        });

        it('arguments for methods (enabled parallel)', function() {
            return argumentsTest({parallel: true});
        });
    });
});
