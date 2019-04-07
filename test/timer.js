import assert from 'power-assert';

import {timeit} from '../src';


describe('utility function', function() {
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
        it('context', async function() {
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
    });
});
