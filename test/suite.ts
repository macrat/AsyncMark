import { Benchmark, Suite, Result } from '../src';

/**
 * @test {Suite}
 */
describe('Suite', () => {
  describe('#constructor', () => {
    test('default values', () => {
      const s = new Suite();

      expect(s.name).toBe('unnamed');
      expect(s.parallel).toBe(false);
      expect(s.benchmarkDefault).toEqual({});
    });

    test('options', () => {
      const conf = {
        name: 'foo',
        parallel: true,
        benchmarkDefault: {
          name: 'bar',
        },
      };
      const s = new Suite(conf);

      expect(s.name).toBe('foo');
      expect(s.parallel).toBe(true);
      expect(s.benchmarkDefault).toEqual({ name: 'bar' });
    });

    test('functions', () => {
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
        afterEach() {
          called.afterEach = true;
        },
        after() {
          called.after = true;
        },
      });

      expect(called.before).toBe(false);
      s.before();
      expect(called.before).toBe(true);

      expect(called.beforeEach).toBe(false);
      s.beforeEach(0, new Benchmark({}));
      expect(called.beforeEach).toBe(true);

      expect(called.afterEach).toBe(false);
      s.afterEach(
        0,
        new Benchmark({}),
        new Result('dummy', [1, 2, 3]),
      );
      expect(called.afterEach).toBe(true);

      expect(called.after).toBe(false);
      s.after([new Result('dummy', [1, 2, 3])]);
      expect(called.after).toBe(true);
    });
  });

  /**
   * @test {Suite#addBenchmark}
   */
  test('#addBenchmark', () => {
    const s = new Suite();
    const b1 = new Benchmark({ name: 'a' });
    const b2 = new Benchmark({ name: 'b' });

    expect(s.benchmarks).toEqual([]);
    s.addBenchmark(b1);
    expect(s.benchmarks).toEqual([b1]);
    s.addBenchmark(b2);
    expect(s.benchmarks).toEqual([b1, b2]);

    expect(s.benchmarks[0].name).toBe('a');
    expect(s.benchmarks[1].name).toBe('b');
  });

  /**
   * @test {Suite#addSuite}
   */
  test('#addSuite', () => {
    const p = new Suite();
    const c1 = new Suite();
    const c2 = new Suite();

    expect(p).not.toBe(c1);
    expect(p).not.toBe(c2);
    expect(c1).not.toBe(c2);

    expect(p.benchmarks).toEqual([]);
    p.addSuite(c1);
    expect(p.benchmarks).toEqual([c1]);
    p.addSuite(c2);
    expect(p.benchmarks).toEqual([c1, c2]);
  });

  /**
   * @test {Suite#add}
   */
  describe('#add', () => {
    test('Benchmark', () => {
      const s = new Suite();
      const b = new Benchmark({ name: 'foobar' });

      expect(s.benchmarks).toEqual([]);
      s.add(b);

      expect(s.benchmarks).toEqual([b]);
      expect(s.benchmarks[0].name).toBe('foobar');
    });

    test('Suite', () => {
      const p = new Suite();
      const c = new Suite();

      expect(p).not.toBe(c);
      expect(p.benchmarks).toEqual([]);

      p.add(c);

      expect(p.benchmarks).toEqual([c]);
      expect(c.benchmarks).toEqual([]);
    });

    test('function', async () => {
      const called = {
        fun: false,
        after: false,
      };
      const fun = () => {
        called.fun = true;
      };
      const s = new Suite({
        benchmarkDefault: {
          after() {
            called.after = true;
          },
        },
      });

      expect(s.benchmarks).toEqual([]);
      s.add(fun);
      expect(s.benchmarks.length).toBe(1);

      expect(called.fun).toBe(false);
      await (s.benchmarks[0] as Benchmark).fun();
      expect(called.fun).toBe(true);

      expect(called.after).toBe(false);
      await (s.benchmarks[0] as Benchmark).after(new Result('dummy', [1, 2, 3]));
      expect(called.after).toBe(true);
    });

    test('function with override default', async () => {
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

      expect(s.benchmarks).toEqual([]);
      s.add(conf);
      expect(s.benchmarks.length).toBe(1);

      expect(called.original).toBe(false);
      expect(called.overrided).toBe(false);
      await (s.benchmarks[0] as Benchmark).fun();
      expect(called.original).toBe(false);
      expect(called.overrided).toBe(true);
    });

    test('object', async () => {
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

      expect(s.benchmarks).toEqual([]);
      s.add(conf);
      expect(s.benchmarks.length).toBe(1);

      expect(called.fun).toBe(false);
      await (s.benchmarks[0] as Benchmark).fun();
      expect(called.fun).toBe(true);

      expect(called.after).toBe(false);
      await (s.benchmarks[0] as Benchmark).after(new Result('dummy', [1, 2, 3]));
      expect(called.after).toBe(true);
    });

    test('object with override default', async () => {
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

      expect(s.benchmarks).toEqual([]);
      s.add(conf);
      expect(s.benchmarks.length).toBe(1);

      expect(called.original).toBe(false);
      expect(called.overrided).toBe(false);
      await (s.benchmarks[0] as Benchmark).after(new Result('dummy', [1, 2, 3]));
      expect(called.original).toBe(false);
      expect(called.overrided).toBe(true);
    });
  });

  /**
   * @test {Suite#run}
   */
  describe('#run', () => {
    describe('call methods order', () => {
      test('empty tests', async () => {
        const callLog = [];

        const s = new Suite({
          before() {
            callLog.push('before');
          },
          beforeEach() {
            callLog.push('beforeEach');
          },
          beforeTest() {
            callLog.push('beforeTest');
          },
          afterTest() {
            callLog.push('afterTest');
          },
          afterEach() {
            callLog.push('afterEach');
          },
          after() {
            callLog.push('after');
          },
        });

        expect(callLog).toEqual([]);

        await s.run();

        expect(callLog).toEqual([
          'before',
          'after',
        ]);
      });

      test('empty tests (enabled parallel)', async () => {
        const callLog = [];

        const s = new Suite({
          before() {
            callLog.push('before');
          },
          beforeEach() {
            callLog.push('beforeEach');
          },
          beforeTest() {
            callLog.push('beforeTest');
          },
          afterTest() {
            callLog.push('afterTest');
          },
          afterEach() {
            callLog.push('afterEach');
          },
          after() {
            callLog.push('after');
          },
          parallel: true,
        });

        expect(callLog).toEqual([]);

        await s.run();

        expect(callLog).toEqual([
          'before',
          'after',
        ]);
      });

      test('with test', async () => {
        const callLog = [];

        const s = new Suite({
          before() {
            callLog.push('before');
          },
          beforeEach() {
            callLog.push('beforeEach');
          },
          beforeTest() {
            callLog.push('beforeTest');
          },
          afterTest() {
            callLog.push('afterTest');
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

        expect(callLog).toEqual([]);

        await (new Suite({
          beforeTest() {
            callLog.push('beforeTest parent');
          },
          afterTest() {
            callLog.push('afterTest parent');
          },
        })).add(s).run();

        expect(callLog).toEqual([
          'before',

          'beforeEach',

          'beforeTest parent',
          'beforeTest',
          'bench1',
          'afterTest',
          'afterTest parent',

          'beforeTest parent',
          'beforeTest',
          'bench1',
          'afterTest',
          'afterTest parent',

          'afterEach',

          'beforeEach',

          'beforeTest parent',
          'beforeTest',
          'bench2',
          'afterTest',
          'afterTest parent',

          'beforeTest parent',
          'beforeTest',
          'bench2',
          'afterTest',
          'afterTest parent',

          'beforeTest parent',
          'beforeTest',
          'bench2',
          'afterTest',
          'afterTest parent',

          'afterEach',

          'after',
        ]);
      });

      test('with test (enabled parallel)', async () => {
        const callLog = [];

        const s = new Suite({
          before() {
            callLog.push('before');
          },
          beforeEach() {
            callLog.push('beforeEach');
          },
          beforeTest() {
            callLog.push('beforeTest');
          },
          afterTest() {
            callLog.push('afterTest');
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

        expect(callLog).toEqual([]);

        await s.run();

        expect(callLog.length).toBe(21);

        expect(callLog[0]).toBe('before');
        expect(callLog[1]).toBe('beforeEach');
        expect(callLog[callLog.length - 2]).toBe('afterEach');
        expect(callLog[callLog.length - 1]).toBe('after');

        expect(callLog.filter((x) => x === 'bench1').length).toBe(2);
        expect(callLog.filter((x) => x === 'bench2').length).toBe(3);
        expect(callLog.filter((x) => x === 'beforeEach').length).toBe(2);
        expect(callLog.filter((x) => x === 'afterEach').length).toBe(2);
        expect(callLog.filter((x) => x === 'beforeTest').length).toBe(5);
        expect(callLog.filter((x) => x === 'afterTest').length).toBe(5);
      });
    });

    const contextTest = async (options) => {
      /* eslint-disable-next-line no-proto, no-param-reassign */
      options.__proto__ = {
        before() {
          expect(this.inOuter).toBe(undefined);
          expect(this.inInner).toBe(undefined);
          expect(this.inBench).toBe(undefined);
          expect(this.outInner).toBe(undefined);
          expect(this.outOuter).toBe(undefined);

          this.inOuter = 123;
        },
        beforeEach() {
          expect(this.inOuter).toBe(123);
          expect(this.inInner).toBe(undefined);
          expect(this.inBench).toBe(undefined);
          expect(this.outInner).toBe(undefined);
          expect(this.outOuter).toBe(undefined);

          this.inInner = 'abc';
        },
        afterEach() {
          expect(this.inOuter).toBe(123);
          expect(this.inInner).toBe('abc');
          expect(this.inBench).toBe(undefined);
          expect(this.outInner).toBe(undefined);
          expect(this.outOuter).toBe(undefined);

          this.outInner = 'cba';
        },
        after() {
          expect(this.inOuter).toBe(123);
          expect(this.inInner).toBe(undefined);
          expect(this.inBench).toBe(undefined);
          expect(this.outInner).toBe(undefined);
          expect(this.outOuter).toBe(undefined);

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
          expect(this.inOuter).toBe(123);
          expect(this.inInner).toBe('abc');
          expect(this.inBench).toBe(undefined);
          expect(this.outInner).toBe(undefined);
          expect(this.outOuter).toBe(undefined);

          this.inBench = 42;
        },
        after() {
          expect(this.inOuter).toBe(123);
          expect(this.inInner).toBe('abc');
          expect(this.inBench).toBe(42);
          expect(this.outInner).toBe(undefined);
          expect(this.outOuter).toBe(undefined);
        },
      });

      s.add({
        number: 3,
        before() {
          expect(this.inOuter).toBe(123);
          expect(this.inInner).toBe('abc');
          expect(this.inBench).toBe(undefined);
          expect(this.outInner).toBe(undefined);
          expect(this.outOuter).toBe(undefined);

          this.inBench = 24;
        },
        after() {
          expect(this.inOuter).toBe(123);
          expect(this.inInner).toBe('abc');
          expect(this.inBench).toBe(24);
          expect(this.outInner).toBe(undefined);
          expect(this.outOuter).toBe(undefined);
        },
      });

      await s.run();
    };

    test('context handling', () => contextTest({ parallel: false }));

    test('context handling (enabled parallel)', () => contextTest({ parallel: true }));

    const argumentsTest = async (options) => {
      const beforeCounts = [];
      const afterCounts = [];
      const results = [];
      const beforeTestCounts = [];
      const afterTestCounts = [];

      /* eslint-disable-next-line no-proto, no-param-reassign */
      options.__proto__ = {
        beforeEach(count) {
          beforeCounts.push(count);
        },
        beforeTest(suiteCount, benchCount, benchmark) {
          beforeTestCounts.push([benchmark.name, suiteCount, benchCount]);
        },
        afterTest(suiteCount, benchCount, benchmark, msec) {
          afterTestCounts.push([benchmark.name, suiteCount, benchCount]);

          expect(msec).toBeLessThan(1);
        },
        afterEach(count, benchmark, result) {
          afterCounts.push(count);
          results.push(result);
        },
        after(rs) {
          expect(rs[0].msecs.length).toBe(2);
          expect(rs[1].msecs.length).toBe(3);

          rs.forEach((x, i) => {
            expect(results[i].msecs).toEqual(x.msecs);
          });
        },
        benchmarkDefault: {
          fun() {},
          after() {},
        },
      };

      const s = new Suite(options);

      s.add({ name: 'a', number: 2 });
      s.add({ name: 'b', number: 3 });

      const rs = await s.run();
      expect(rs[0].msecs.length).toBe(2);
      expect(rs[1].msecs.length).toBe(3);
      rs.forEach((x, i) => {
        expect(results[i].msecs).toEqual(x.msecs);
      });

      expect(beforeCounts).toEqual([0, 1]);
      expect(afterCounts).toEqual([0, 1]);

      beforeTestCounts.sort((x, y) => (x[1] - y[1]) * 10 + (x[2] - y[2]));
      afterTestCounts.sort((x, y) => (x[1] - y[1]) * 10 + (x[2] - y[2]));
      expect(beforeTestCounts).toEqual([['a', 0, 0], ['a', 0, 1], ['b', 1, 0], ['b', 1, 1], ['b', 1, 2]]);
      expect(afterTestCounts).toEqual([['a', 0, 0], ['a', 0, 1], ['b', 1, 0], ['b', 1, 1], ['b', 1, 2]]);
    };

    test('arguments for methods', () => argumentsTest({ parallel: false }));

    test('arguments for methods (enabled parallel)', () => argumentsTest({ parallel: true }));
  });
});
