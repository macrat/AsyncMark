import { timeit } from '../src';
import {
  now, nowDate, nowNow, nowHrtime,
} from '../src/timer';

describe('timer', () => {
  /**
   * @test {timeit}
   */
  describe('timeit', () => {
    test('measure', async () => {
      const times = [];
      for (let i = 0; i < 5; i += 1) {
        times.push(timeit(() => new Promise((resolve) => setTimeout(resolve, 42))));
      }

      const avg = (await Promise.all(times)).reduce((x, y) => x + y) / times.length;

      expect(avg - 42).toBeLessThan(3);
    });

    test('use context', async () => {
      const ctx = {
        count: 0,
        count2: 0,
      };
      for (let i = 0; i < 5; i += 1) {
        /* eslint-disable-next-line no-await-in-loop */
        await timeit(function f() {
          this.count += 1;
          this.count2 = i;
        }, [], ctx);

        expect(ctx.count).toEqual(i + 1);
        expect(ctx.count2).toEqual(i);
      }
    });

    test('context sandboxing', async () => {
      function f() {
        expect(this.x).toBe(undefined);
        this.x = 'foobar';
        expect(this.x).toBe('foobar');
      }

      await timeit(f);
      await timeit(f);
    });

    test('arguments', async () => {
      const ctx: {result?: number} = {};
      function f(x, y) {
        this.result = x + y;
      }

      await timeit(f, [11, 22], ctx);
      expect(ctx.result).toBe(33);

      await timeit(f, [42, 84], ctx);
      expect(ctx.result).toBe(126);
    });
  });

  /**
   * @ignore
   */
  describe('timer function', () => {
    const checkTimer = (func, resolution) => () => {
      expect(typeof func()).toBe('number');

      const a = func();
      const b = func();
      expect(a).toBeLessThanOrEqual(b);
      expect(a).toBeCloseTo(b, resolution);
    };

    /**
     * @test {now}
     */
    test('now', checkTimer(now, 1e-2));

    /**
     * @test {nowDate}
     */
    test('nowDate', checkTimer(nowDate, 1e-2));

    /**
     * @test {nowNow}
     */
    (typeof performance !== 'undefined' && performance.now ? test : test.skip)('nowNow', checkTimer(nowNow, 1e-2));

    /**
     * @test {nowHrtime}
     */
    (typeof process !== 'undefined' && process.hrtime ? test : test.skip)('nowHrtime', checkTimer(nowHrtime, 1e-2));
  });
});
