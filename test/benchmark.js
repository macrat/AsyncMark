import assert from 'power-assert';

import Benchmark, {Benchmark as Bench2, Result} from '../src';


/**
 * @test {Benchmark}
 */
describe('Benchmark', function() {
    it('module exports', function() {
        assert(Benchmark === Bench2);
    });

    /**
     * @test {Benchmark#constructor}
     */
    describe('#constructor', function() {
        it('default values', function() {
            const b = new Benchmark();

            assert(b.name === 'unnamed');
            assert(b.targetErrorRate === 0.1);
            assert(b.maxNumber === 10000);
            assert(b.minNumber === 30);
            assert(b.number === null);
        });

        it('function argument', function() {
            let called = false;
            const f = function() {
                called = true;
            }
            const b = new Benchmark(f);

            assert(b.fun === f);

            assert(called === false);
            b.fun();
            assert(called === true);
        });

        describe('object argument', function() {
            it('with auto number', function() {
                const conf = {
                    name: 'test name',
                    targetErrorRate: 0.2,
                    maxNumber: 100,
                    minNumber: 10,
                };
                const b = new Benchmark(conf);

                assert(b.name === conf.name);
                assert(b.targetErrorRate === conf.targetErrorRate);
                assert(b.maxNumber === conf.maxNumber);
                assert(b.minNumber === conf.minNumber);
            });

            it('with specify number', function() {
                const conf = {
                    name: 'test name',
                    number: 42,
                };
                const b = new Benchmark(conf);

                assert(b.name === conf.name);
                assert(b.number === conf.number);
            });

            it('functions', function() {
                const called = {
                    before: false,
                    beforeEach: false,
                    fun: false,
                    afterEach: false,
                    after: false,
                };
                const conf = {
                    name: 'test name',
                    number: 42,
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
                };
                const b = new Benchmark(conf);

                assert(b.name === conf.name);
                assert(b.number === conf.number);

                assert(called.before === false);
                b.before();
                assert(called.before === true);

                assert(called.beforeEach === false);
                b.beforeEach();
                assert(called.beforeEach === true);

                assert(called.fun === false);
                b.fun();
                assert(called.fun === true);

                assert(called.afterEach === false);
                b.afterEach();
                assert(called.afterEach === true);

                assert(called.after === false);
                b.after();
                assert(called.after === true);
            });
        });
    });

    /**
     * @test {Benchmark#fun}
     */
    describe('#fun', function() {
        it('default behavior', async function() {
            const b = new Benchmark();

            const err = await b.fun().then(() => null).catch(e => e);
            assert(err !== null, 'excepted error but not throwed');
            assert(err.message === 'target function is not defined');
        });
    });

    /**
     * @test {Benchmark#after}
     */
    describe('#after', function() {
        it('default behavior', async function() {
            const l = console.log;
            const messages = [];
            console.log = function() {
                messages.push([...arguments].map(x => String(x)).join(' '));
            }

            try {
                const b = new Benchmark();
                const r = new Result('after_test', [1, 2, 3])

                await b.after(r);

                assert.deepStrictEqual(messages, [r.toString()]);
            } finally {
                console.log = l;
            }
        });
    });

    /**
     * @test {Benchmark#run}
     */
    describe('#run', function() {
        it('call methods order', async function() {
            const callLog = [];

            const conf = {
                number: 2,
                before() { callLog.push('before'); },
                beforeEach() { callLog.push('beforeEach'); },
                fun() { callLog.push('fun'); },
                afterEach() { callLog.push('afterEach'); },
                after() { callLog.push('after'); },
            };
            const b = new Benchmark(conf);

            const l = console.log;
            const messages = [];
            console.log = function() {
                messages.push([...arguments].map(x => String(x)).join(' '));
            }

            try {
                await b.run();

                assert.deepStrictEqual(callLog, [
                    'before',
                    'beforeEach',
                    'fun',
                    'afterEach',
                    'beforeEach',
                    'fun',
                    'afterEach',
                    'after',
                ]);
                assert.deepStrictEqual(messages, []);
            } finally {
                console.log = l;
            }
        });

        it('call methods order (with callbacks)', async function() {
            const callLog = [];

            const conf = {
                number: 2,
                before() { callLog.push('before'); },
                beforeEach() { callLog.push('beforeEach'); },
                fun() { callLog.push('fun'); },
                afterEach() { callLog.push('afterEach'); },
                after() { callLog.push('after'); },
            };
            const b = new Benchmark(conf);

            const l = console.log;
            const messages = [];
            console.log = function() {
                messages.push([...arguments].map(x => String(x)).join(' '));
            }

            try {
                await b.run({}, {
                    beforeTest() { callLog.push('beforeTest'); },
                    afterTest() { callLog.push('afterTest'); },
                });

                assert.deepStrictEqual(callLog, [
                    'before',
                    'beforeTest',
                    'beforeEach',
                    'fun',
                    'afterEach',
                    'afterTest',
                    'beforeTest',
                    'beforeEach',
                    'fun',
                    'afterEach',
                    'afterTest',
                    'after',
                ]);
                assert.deepStrictEqual(messages, []);
            } finally {
                console.log = l;
            }
        });

        it('context handling', async function() {
            const conf = {
                number: 2,
                before() {
                    assert(this.inOuter === undefined);
                    assert(this.inInner === undefined);
                    assert(this.inFunc === undefined);
                    assert(this.outInner === undefined);
                    assert(this.outOuter === undefined);

                    this.inOuter = 123;
                },
                beforeEach() {
                    assert(this.inOuter === 123);
                    assert(this.inInner === undefined);
                    assert(this.inFunc === undefined);
                    assert(this.outInner === undefined);
                    assert(this.outOuter === undefined);

                    this.inInner = 'abc';
                },
                fun() {
                    assert(this.inOuter === 123);
                    assert(this.inInner === 'abc');
                    assert(this.inFunc === undefined);
                    assert(this.outInner === undefined);
                    assert(this.outOuter === undefined);

                    this.inFunc = true;
                },
                afterEach() {
                    assert(this.inOuter === 123);
                    assert(this.inInner === 'abc');
                    assert(this.inFunc === true);
                    assert(this.outInner === undefined);
                    assert(this.outOuter === undefined);

                    this.outInner = 'cba';
                },
                after() {
                    assert(this.inOuter === 123);
                    assert(this.inInner === undefined);
                    assert(this.inFunc === undefined);
                    assert(this.outInner === undefined);
                    assert(this.outOuter === undefined);

                    this.outOuter = 321;
                },
            };
            const b = new Benchmark(conf);

            const l = console.log;
            const messages = [];
            console.log = function() {
                messages.push([...arguments].map(x => String(x)).join(' '));
            }

            try {
                await b.run({}, {
                    beforeTest() {
                        assert(this.inOuter === 123);
                        assert(this.inInner === undefined);
                        assert(this.inFunc === undefined);
                        assert(this.outInner === undefined);
                        assert(this.outOuter === undefined);
                    },
                    afterTest() {
                        assert(this.inOuter === 123);
                        assert(this.inInner === 'abc');
                        assert(this.inFunc === true);
                        assert(this.outInner === 'cba');
                        assert(this.outOuter === undefined);
                    },
                });
                assert.deepStrictEqual(messages, []);
            } finally {
                console.log = l;
            }
        });

        it('arguments for methods', async function() {
            const beforeCounts = [];
            const afterCounts = [];

            const b = new Benchmark({
                number: 2,
                before() {
                    assert(arguments.length === 0);
                },
                beforeEach(count) {
                    assert(arguments.length === 1);

                    assert(typeof count === 'number');
                    beforeCounts.push(count);
                },
                fun() {
                    assert(arguments.length === 0);
                },
                afterEach(count, msec) {
                    assert(arguments.length === 2);

                    assert(typeof msec === 'number');
                    assert(msec < 1);

                    assert(typeof count === 'number');
                    afterCounts.push(count);
                },
                after(result) {
                    assert(arguments.length === 1);

                    assert(result instanceof Result);
                    assert(result.msecs.length === 2)
                },
            });

            const result = await b.run({}, {
                beforeTest(count, bench) {
                    assert(typeof count === 'number');
                    assert(bench instanceof Benchmark);
                },
                afterTest(count, bench, msec) {
                    assert(typeof count === 'number');
                    assert(bench instanceof Benchmark);
                    assert(typeof msec === 'number');
                    assert(msec < 1);
                },
            });
            assert(result instanceof Result);
            assert(result.msecs.length === 2);

            assert.deepStrictEqual(beforeCounts, [0, 1]);
            assert.deepStrictEqual(afterCounts, [0, 1]);
        });

        describe('loop and time', function() {
            it('static number', async function() {
                const r100 = await new Benchmark({
                    number: 3,
                    fun() {
                        return new Promise((resolve, reject) => setTimeout(resolve, 100));
                    },
                    after() {}
                }).run();
                assert(Math.abs(r100.average - 100) <= 3);

                const r42 = await new Benchmark({
                    number: 3,
                    fun() {
                        return new Promise((resolve, reject) => setTimeout(resolve, 42));
                    },
                    after() {}
                }).run();
                assert(Math.abs(r42.average - 42) <= 3);
            });

            it('auto / rate 20%', async function() {
                const r = await new Benchmark({
                    minNumber: 5,
                    maxNumber: 100,
                    targetErrorRate: 0.2,
                    fun() {
                        return new Promise((resolve, reject) => setTimeout(resolve, 49 + Math.random() * 2));
                    },
                    after() {},
                }).run();

                assert(r.msecs.length >= 5);
                assert(r.msecs.length <= 100);
                assert(r.errorRate <= 0.2);
            });

            it('auto / rate 40%', async function() {
                const r = await new Benchmark({
                    minNumber: 5,
                    maxNumber: 100,
                    targetErrorRate: 0.4,
                    fun() {
                        return new Promise((resolve, reject) => setTimeout(resolve, 49 + Math.random() * 2));
                    },
                    after() {},
                }).run();

                assert(r.msecs.length >= 5);
                assert(r.msecs.length <= 100);
                assert(r.errorRate <= 0.4);
            });
        });
    });
});
