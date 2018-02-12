import assert from 'power-assert';

import {Result} from '../src';


/**
 * @test {Result}
 */
describe('Result', function() {
    /**
     * @test {Result#total}
     */
    it('#total', function() {
        assert(new Result('test', [10, 20, 30]).total === 60);
        assert(new Result('test', [11, 22, 33]).total === 66);
    });

    /**
     * @test {Result#average}
     */
    it('#average', function() {
        assert(new Result('test', [10, 20, 30]).average === 20);
        assert(new Result('test', [11, 22, 33]).average === 22);
    });

    /**
     * @test {Result#variance}
     */
    it('#variance', function() {
        assert(new Result('test', [10, 20, 30]).variance === 100);
        assert(new Result('test', [11, 22, 33]).variance === 121);
    });

    /**
     * @test {Result#std}
     */
    it('#std', function() {
        assert(new Result('test', [10, 20, 30]).std === 10);
        assert(new Result('test', [11, 22, 33]).std === 11);
    });

    /**
     * @test {Result#std}
     */
    it('#sem', function() {
        assert(Math.abs(new Result('test', [10, 20, 30]).sem - 5.7735) < 0.001);
        assert(Math.abs(new Result('test', [11, 22, 33]).sem - 6.3509) < 0.001);
    });

    /**
     * @test {Result#errorRange}
     */
    it('#errorRange', function() {
        assert(Math.abs(new Result('test', [10, 20, 30]).errorRange - 11.3161) < 0.001);
        assert(Math.abs(new Result('test', [11, 22, 33]).errorRange - 12.4477) < 0.001);
    });

    /**
     * @test {Result#errorRate}
     */
    it('#errorRate', function() {
        assert(Math.abs(new Result('test', [10, 20, 30]).errorRate - 0.5658) < 0.001);
        assert(Math.abs(new Result('test', [11, 22, 33]).errorRate - 0.5658) < 0.001);
    });

    /**
     * @test {Result#opsPerSec}
     */
    it('#opsPerSec', function() {
        assert(new Result('test', [1]).opsPerSec === 1000);
        assert(new Result('test', [200]).opsPerSec === 5);
    });

    /**
     * @test {Result#toString}
     */
    it('#toString', function() {
        assert(String(new Result('test', [10, 20, 30])) === 'test: 50ops/sec 20msec/op +-11.3161msec/op (56.58%) / 3 times tried');
        assert(String(new Result('test', [1.234567, 2.345678])) === 'test: 558.621ops/sec 1.7901msec/op +-1.0889msec/op (60.83%) / 2 times tried');
    });
});
