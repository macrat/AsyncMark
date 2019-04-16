import assert from 'power-assert';

import {timeit} from '../src';
import {now, now_date, now_now, now_hrtime} from '../src/timer.js';


describe('timer', function() {
    /**
     * @test {timeit}
     */
    describe('timeit', function() {
        it('measure', async function() {
            let sum = 0;
            for (let i=0; i<5; i++) {
                sum += await timeit(function() {
                    return new Promise((resolve, reject) => setTimeout(resolve, 42));
                });
            }
            assert(Math.abs(sum/5 - 42) <= 3);
        });
        it('use context', async function() {
            const ctx = {
                count: 0,
            };
            for (let i=0; i<5; i++) {
                await timeit(function() {
                    this.count++;
                    this.count2 = i;
                }, ctx);
                assert(ctx.count === i+1);
                assert(ctx.count2 === i);
            }
        });
        it('context sandboxing', async function() {
            function f() {
                assert(this.x === undefined);
                this.x = 'foobar';
                assert(this.x === 'foobar');
            }

            await timeit(f);
            await timeit(f);
        });
        it('arguments', async function() {
            const ctx = {};
            function f(x, y) {
                this.result = x + y;
            }

            await timeit(f, ctx, [11, 22])
            assert(ctx.result === 33);

            await timeit(f, ctx, [42, 84])
            assert(ctx.result === 126);
        });
    });

    /**
     * @ignore
     */
    describe('timer function', function() {
        const global = new Function('return this')();

        function checkTimer(func, resolution) {
            return function() {
                assert(typeof func() === 'number');

                const a = func();
                const b = func();
                assert(a <= b);
                assert(b - a <= resolution);
            };
        }

        /**
         * @test {now}
         */
        it('now', checkTimer(now, 1e-2));

        /**
         * @test {now_date}
         */
        it('now_date', checkTimer(now_date, 1e-2));

        /**
         * @test {now_now}
         */
        describe('now_now', function() {
            (typeof performance !== 'undefined' && performance.now ? it : it.skip)('simple execute', checkTimer(now_now, 1e-2));

            it('with dummy function', function() {
                const backup = global.performance;
                try {
                    global.performance = {now: () => 123.456};
                    assert(now_now() === 123.456);
                } finally {
                    global.performance = backup;
                }
            });
        });

        /**
         * @test {now_hrtime}
         */
        describe('now_hrtime', function() {
            (typeof process !== 'undefined' && process.hrtime ? it : it.skip)('simple execute', checkTimer(now_hrtime, 1e-2));

            it('with dummy function', function() {
                const backup = global.process;
                try {
                    global.process = {hrtime: () => [123, 456]};
                    assert(now_hrtime() === 123e3 + 456e-6);
                } finally {
                    global.process = backup;
                }
            });
        });
    });
});
