import assert from 'power-assert';

import AssertRule, {unit, AssertionError, AlternateError} from '../src/assertion.js';
import {Result} from '../src';


describe('assertion', function() {
    /**
     * @test {unit}
     */
    it('unit converter', function() {
        assert(unit('s') === 1000);
        assert(unit('sec') === 1000);

        assert(unit('') === 1);
        assert(unit('ms') === 1);
        assert(unit('msec') === 1);

        assert(unit('us') === 0.001);
        assert(unit('usec') === 0.001);

        assert(unit('ns') === 0.000001);
        assert(unit('nsec') === 0.000001);

        assert.throws(() => unit('foobar'), Error, 'unknown unit name: "foobar"');
    });

    describe('error generator', function() {
        [['AssertionError [ERR_ASSERTION]', AssertionError], ['Error', AlternateError]].map(([name, fn]) => {
            /**
             * @test {AssertionError}
             * @test {AlternateError}
             */
            it(fn.name, function() {
                assert.throws(
                    () => {
                        throw fn(new AssertRule('100'), new Result('hoge', [100.1]));
                    }, {
                        name: name,
                        message: 'benchmark "hoge": actual:100.1msec/op <= expected:100msec/op',
                        actual: '100.1 msec/op',
                        expected: '100 msec/op',
                        operator: '<=',
                    },
                );

                assert.throws(
                    () => {
                        throw fn(new AssertRule('>0.1s'), new Result('fuga', [10]));
                    }, {
                        name: name,
                        message: 'benchmark "fuga": actual:10msec/op > expected:100msec/op',
                        actual: '10 msec/op',
                        expected: '100 msec/op',
                        operator: '>',
                    },
                );
            });
        });
    });

    /**
     * @test {AssertRule}
     */
    describe('AssertRule', function() {
        /**
         * @test {AssertRule#constructor}
         */
        it('#constructor', function() {
            function parseTest(expr, expect, unit_) {
                const x = new AssertRule(`${expr}${expect}${unit_}`)

                assert(x.operator === (expr || '<='));
                assert(x.expected === expect * unit(unit_));
            }

            assert.throws(function() { new AssertRule('=100') }, Error, 'Invalid rule format: "=100"');
            assert.throws(function() { new AssertRule('>1h') }, Error, 'Invalid rule format: ">1h"');

            parseTest('', 100, '');

            parseTest('>', 12.3, '');
            parseTest('>=', 12.3, '');
            parseTest('<', 12.3, '');
            parseTest('<=', 12.3, '');

            parseTest('', 1234, 'us');
            parseTest('', 1.234, 's');
        });

        /**
         * @test {AssertRule#check}
         */
        it('#check', function() {
            assert(new AssertRule('<100').check(99.9) === true);
            assert(new AssertRule('<100').check(100.0) === false);

            assert(new AssertRule('<=100').check(100.0) === true);
            assert(new AssertRule('<=100').check(100.1) === false);

            assert(new AssertRule('>100').check(100.1) === true);
            assert(new AssertRule('>100').check(100.0) === false);

            assert(new AssertRule('>=100').check(100.0) === true);
            assert(new AssertRule('>=100').check(99.9) === false);
        });

        /**
         * @test {AssertRule#assert}
         */
        describe('#assert', function() {
            const rule = new AssertRule('100');

            assert.doesNotThrow(() => rule.assert(new Result('hoge', [100])));

            assert.throws(
                () => rule.assert(new Result('hoge', [100.1])),
                {
                    name: 'AssertionError [ERR_ASSERTION]',
                    message: 'benchmark "hoge": actual:100.1msec/op <= expected:100msec/op',
                    actual: '100.1 msec/op',
                    expected: '100 msec/op',
                    operator: '<=',
                },
            );
        });
    });
});
