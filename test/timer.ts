import {timeit} from '../src';
import {now, now_date, now_now, now_hrtime} from '../src/timer';


describe('timer', () => {
    /**
     * @test {timeit}
     */
    describe('timeit', () => {
        test('measure', async () => {
            const times = [];
            for (let i = 0; i < 5; i++) {
                times.push(timeit(() => {
                    return new Promise((resolve, reject) => setTimeout(resolve, 42));
                }));
            }
            const avg = (await Promise.all(times)).reduce((x, y) => x + y) / times.length;
            expect(avg - 42).toBeLessThan(3);
        });
        test('use context', async () => {
            const ctx = {
                count: 0,
                count2: 0,
            };
            for (let i = 0; i < 5; i++) {
                await timeit(function() {
                    this.count++;
                    this.count2 = i;
                }, [], ctx);

                expect(ctx.count).toEqual(i+1);
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
        const global = new Function('return this')();

        const checkTimer = (func, resolution) => {
            return () => {
                expect(typeof func()).toBe('number');

                const a = func();
                const b = func();
                expect(a).toBeLessThanOrEqual(b);
                expect(a).toBeCloseTo(b, resolution);
            };
        }

        /**
         * @test {now}
         */
        test('now', checkTimer(now, 1e-2));

        /**
         * @test {now_date}
         */
        test('now_date', checkTimer(now_date, 1e-2));

        /**
         * @test {now_now}
         */
        (typeof performance !== 'undefined' && performance.now ? test : test.skip)('now_now', checkTimer(now_now, 1e-2));

        /**
         * @test {now_hrtime}
         */
        (typeof process !== 'undefined' && process.hrtime ? test : test.skip)('now_hrtime', checkTimer(now_hrtime, 1e-2));
    });
});
