import Bench2, { Benchmark, Result } from '../src';

/* eslint-disable no-console */

/**
 * @test {Benchmark}
 */
describe('Benchmark', () => {
  test('module exports', () => {
    expect(Benchmark === Bench2).toBe(true);
  });

  /**
   * @test {Benchmark#constructor}
   */
  describe('#constructor', () => {
    test('default values', () => {
      const b = new Benchmark({});

      expect(b.name).toBe('unnamed');
      expect(b.targetErrorRate).toBe(0.1);
      expect(b.maxNumber).toBe(10000);
      expect(b.minNumber).toBe(30);
      expect(b.number).toBe(null);
    });

    test('function argument', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      const b = new Benchmark(f);

      expect(b.fun === f).toBe(true);

      expect(called).toBe(false);
      b.fun();
      expect(called).toBe(true);
    });

    describe('object argument', () => {
      test('with auto number', () => {
        const conf = {
          name: 'test name',
          targetErrorRate: 0.2,
          maxNumber: 100,
          minNumber: 10,
        };
        const b = new Benchmark(conf);

        expect(b.name).toBe(conf.name);
        expect(b.targetErrorRate).toBe(conf.targetErrorRate);
        expect(b.maxNumber).toBe(conf.maxNumber);
        expect(b.minNumber).toBe(conf.minNumber);
      });

      test('with specify number', () => {
        const conf = {
          name: 'test name',
          number: 42,
        };
        const b = new Benchmark(conf);

        expect(b.name).toBe(conf.name);
        expect(b.number).toBe(conf.number);
      });

      test('with falsy number', () => {
        const conf = {
          name: 'test name',
          number: 0,
        };
        const b = new Benchmark(conf);

        expect(b.name).toBe(conf.name);
        expect(b.number).toBe(conf.number);
      });

      test('functions', () => {
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

        expect(b.name).toBe(conf.name);
        expect(b.number).toBe(conf.number);

        expect(called.before).toBe(false);
        b.before();
        expect(called.before).toBe(true);

        expect(called.beforeEach).toBe(false);
        b.beforeEach(0);
        expect(called.beforeEach).toBe(true);

        expect(called.fun).toBe(false);
        b.fun();
        expect(called.fun).toBe(true);

        expect(called.afterEach).toBe(false);
        b.afterEach(0, 1);
        expect(called.afterEach).toBe(true);

        expect(called.after).toBe(false);
        b.after(new Result('dummy', [1, 2, 3]));
        expect(called.after).toBe(true);
      });
    });
  });

  /**
   * @test {Benchmark#fun}
   */
  describe('#fun', () => {
    test('default behavior', async () => {
      const b = new Benchmark({});

      await expect(async () => {
        await b.fun();
      }).rejects.toThrowError('target function is not defined');
    });
  });

  /**
   * @test {Benchmark#after}
   */
  describe('#after', () => {
    test('default behavior', async () => {
      const l = console.log;
      const messages = [];
      // eslint-disable-next-line require-atomic-updates
      console.log = (...xs: any[]) => {
        messages.push([...xs].map((x) => String(x)).join(' '));
      };

      try {
        const b = new Benchmark({});
        const r = new Result('after_test', [1, 2, 3, 4, 5, 100]);

        await b.after(r);

        expect(messages).toEqual([
          new Result('after_test', [1, 2, 3, 4, 5]).toString(),
        ]);
      } finally {
        // eslint-disable-next-line require-atomic-updates
        console.log = l;
      }
    });
  });

  /**
   * @test {Benchmark#run}
   */
  describe('#run', () => {
    test('call methods order', async () => {
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
      // eslint-disable-next-line require-atomic-updates
      console.log = (...xs: any[]) => {
        messages.push([...xs].map((x) => String(x)).join(' '));
      };

      try {
        await b.run();

        expect(callLog).toEqual([
          'before',
          'beforeEach',
          'fun',
          'afterEach',
          'beforeEach',
          'fun',
          'afterEach',
          'after',
        ]);
        expect(messages).toEqual([]);
      } finally {
        // eslint-disable-next-line require-atomic-updates
        console.log = l;
      }
    });

    test('call methods order (with callbacks)', async () => {
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
      // eslint-disable-next-line require-atomic-updates
      console.log = (...xs: any[]) => {
        messages.push([...xs].map((x) => String(x)).join(' '));
      };

      try {
        await b.run({}, {
          beforeTest() { callLog.push('beforeTest'); },
          afterTest() { callLog.push('afterTest'); },
        });

        expect(callLog).toEqual([
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
        expect(messages).toEqual([]);
      } finally {
        // eslint-disable-next-line require-atomic-updates
        console.log = l;
      }
    });

    test('context handling', async () => {
      const conf = {
        number: 2,
        before() {
          expect(this.inOuter).toBe(undefined);
          expect(this.inInner).toBe(undefined);
          expect(this.inFunc).toBe(undefined);
          expect(this.outInner).toBe(undefined);
          expect(this.outOuter).toBe(undefined);

          this.inOuter = 123;
        },
        beforeEach() {
          expect(this.inOuter).toBe(123);
          expect(this.inInner).toBe(undefined);
          expect(this.inFunc).toBe(undefined);
          expect(this.outInner).toBe(undefined);
          expect(this.outOuter).toBe(undefined);

          this.inInner = 'abc';
        },
        fun() {
          expect(this.inOuter).toBe(123);
          expect(this.inInner).toBe('abc');
          expect(this.inFunc).toBe(undefined);
          expect(this.outInner).toBe(undefined);
          expect(this.outOuter).toBe(undefined);

          this.inFunc = true;
        },
        afterEach() {
          expect(this.inOuter).toBe(123);
          expect(this.inInner).toBe('abc');
          expect(this.inFunc).toBe(true);
          expect(this.outInner).toBe(undefined);
          expect(this.outOuter).toBe(undefined);

          this.outInner = 'cba';
        },
        after() {
          expect(this.inOuter).toBe(123);
          expect(this.inInner).toBe(undefined);
          expect(this.inFunc).toBe(undefined);
          expect(this.outInner).toBe(undefined);
          expect(this.outOuter).toBe(undefined);

          this.outOuter = 321;
        },
      };
      const b = new Benchmark(conf);

      const l = console.log;
      const messages = [];
      // eslint-disable-next-line require-atomic-updates
      console.log = (...xs: any[]) => {
        messages.push([...xs].map((x) => String(x)).join(' '));
      };

      try {
        await b.run({}, {
          beforeTest() {
            expect(this.inOuter).toBe(123);
            expect(this.inInner).toBe(undefined);
            expect(this.inFunc).toBe(undefined);
            expect(this.outInner).toBe(undefined);
            expect(this.outOuter).toBe(undefined);
          },
          afterTest() {
            expect(this.inOuter).toBe(123);
            expect(this.inInner).toBe('abc');
            expect(this.inFunc).toBe(true);
            expect(this.outInner).toBe('cba');
            expect(this.outOuter).toBe(undefined);
          },
        });
        expect(messages).toEqual([]);
      } finally {
        // eslint-disable-next-line require-atomic-updates
        console.log = l;
      }
    });

    test('context sandboxing', async () => {
      const b = new Benchmark({
        number: 2,
        fun() {
          expect(this.x).toBe(undefined);
          this.x = 'foobar';
          expect(this.x).toBe('foobar');
        },
        after() {},
      });

      b.run();
      b.run();
    });

    test('arguments for methods', async () => {
      const beforeCounts = [];
      const afterCounts = [];

      const b = new Benchmark({
        number: 2,
        beforeEach(count) {
          beforeCounts.push(count);
        },
        fun() {
        },
        afterEach(count, msec) {
          expect(msec < 1);

          afterCounts.push(count);
        },
        after(result) {
          expect(result.msecs.length).toBe(2);
        },
      });

      const result = await b.run({}, {
        afterTest(count, bench, msec) {
          expect(msec < 1);
        },
      });
      expect(result instanceof Result).toBe(true);
      expect(result.msecs.length).toBe(2);

      expect(beforeCounts).toEqual([0, 1]);
      expect(afterCounts).toEqual([0, 1]);
    });

    describe('loop and time', () => {
      test('static number', async () => {
        const r100 = await new Benchmark({
          number: 3,
          fun() {
            return new Promise((resolve) => setTimeout(resolve, 100));
          },
          after() {},
        }).run();
        expect(Math.abs(r100.average - 100)).toBeLessThanOrEqual(3);

        const r42 = await new Benchmark({
          number: 3,
          fun() {
            return new Promise((resolve) => setTimeout(resolve, 42));
          },
          after() {},
        }).run();
        expect(Math.abs(r42.average - 42)).toBeLessThanOrEqual(3);
      });

      test('auto / rate 20%', async () => {
        const r = await new Benchmark({
          minNumber: 5,
          maxNumber: 100,
          targetErrorRate: 0.2,
          fun() {
            return new Promise((resolve) => setTimeout(resolve, 49 + Math.random() * 2));
          },
          after() {},
        }).run();

        expect(r.msecs.length).toBeGreaterThanOrEqual(5);
        expect(r.msecs.length).toBeLessThanOrEqual(100);
        expect(r.errorRate).toBeLessThanOrEqual(0.2);
      });

      test('auto / rate 40%', async () => {
        const r = await new Benchmark({
          minNumber: 5,
          maxNumber: 100,
          targetErrorRate: 0.4,
          fun() {
            return new Promise((resolve) => setTimeout(resolve, 49 + Math.random() * 2));
          },
          after() {},
        }).run();

        expect(r.msecs.length).toBeGreaterThanOrEqual(5);
        expect(r.msecs.length).toBeLessThanOrEqual(100);
        expect(r.errorRate).toBeLessThanOrEqual(0.4);
      });

      test('auto / minimum loop', async () => {
        const r = await new Benchmark({
          minNumber: 5,
          maxNumber: 10,
          targetErrorRate: 1,
          fun() {
            return Promise.resolve();
          },
          after() {},
        }).run();

        expect(r.msecs.length).toBe(5);
      });

      test('auto / maximum loop', async () => {
        const r = await new Benchmark({
          minNumber: 5,
          maxNumber: 10,
          targetErrorRate: 0,
          fun() {
            return new Promise((resolve) => setTimeout(resolve, Math.random()));
          },
          after() {},
        }).run();

        expect(r.msecs.length).toBe(10);
      });
    });
  });
});
