import AssertRule, {unit, AsyncMarkAssertionError, UnitValue} from '../src/assertion';
import {Result} from '../src';


describe('assertion',() => {
    /**
     * @test {unit}
     */
    test('unit converter', () => {
        expect(unit('s')).toBe(1000);
        expect(unit('sec')).toBe(1000);

        expect(unit('')).toBe(1);
        expect(unit('ms')).toBe(1);
        expect(unit('msec')).toBe(1);

        expect(unit('us')).toBe(0.001);
        expect(unit('usec')).toBe(0.001);

        expect(unit('ns')).toBe(0.000001);
        expect(unit('nsec')).toBe(0.000001);

        expect(() => unit('foobar' as UnitValue)).toThrowError(new Error('unknown unit name: "foobar"'));
    });

    /**
     * @test {AsyncMarkAssertionError}
     */
    describe('AsyncMarkAssertionError', () => {
        test('properties', () => {
            const a = new AsyncMarkAssertionError(new AssertRule('100'), new Result('hoge', [100.1]));
            expect(a.name).toBe('AsyncMarkAssertionError');
            expect(a.message).toBe('benchmark "hoge": actual:100.1msec/op <= expected:100msec/op');
            expect(a.actual).toBe('100.1 msec/op');
            expect(a.expected).toBe('100 msec/op');
            expect(a.operator).toBe('<=');

            const b = new AsyncMarkAssertionError(new AssertRule('>0.1s'), new Result('fuga', [10]));
            expect(b.name).toBe('AsyncMarkAssertionError');
            expect(b.message).toBe('benchmark "fuga": actual:10msec/op > expected:100msec/op');
            expect(b.actual).toBe('10 msec/op');
            expect(b.expected).toBe('100 msec/op');
            expect(b.operator).toBe('>');
        });

        test('stack trace', async () => {
            try {
                new Result('dummy', [200]).assert('<100ms');
                expect('throw error').toBe('not throwed')
            } catch(err) {
                expect(typeof err.stack).toBe('string');
                expect(err.stack).not.toBe('');

                const lines = err.stack.split('\n');

                expect(lines[0]).toBe('AsyncMarkAssertionError: benchmark "dummy": actual:200msec/op < expected:100msec/op');
                expect(lines[1]).toMatch(/at \/.+\/test\/assertion.ts:[0-9]+:[0-9]+$/);
            }
        });
    });

    /**
     * @test {AssertRule}
     */
    describe('AssertRule', () => {
        /**
         * @test {AssertRule#constructor}
         */
        test('#constructor', () => {
            const parseTest = (expr, expected, unit_) => {
                const x = new AssertRule(`${expr}${expected}${unit_}`)

                expect(x.operator).toBe(expr || '<=');
                expect(x.expected).toBe(expected * unit(unit_));
            }

            expect(() => new AssertRule('=100')).toThrowError('Invalid rule format: "=100"');
            expect(() => new AssertRule('>1h')).toThrowError('Invalid rule format: ">1h"');

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
        test('#check', () => {
            expect(new AssertRule('<100').check(99.9)).toBe(true);
            expect(new AssertRule('<100').check(100.0)).toBe(false);

            expect(new AssertRule('<=100').check(100.0)).toBe(true);
            expect(new AssertRule('<=100').check(100.1)).toBe(false);

            expect(new AssertRule('>100').check(100.1)).toBe(true);
            expect(new AssertRule('>100').check(100.0)).toBe(false);

            expect(new AssertRule('>=100').check(100.0)).toBe(true);
            expect(new AssertRule('>=100').check(99.9)).toBe(false);
        });

        /**
         * @test {AssertRule#assert}
         */
        describe('#assert', function() {
            const rule = new AssertRule('100');

            expect(() => rule.assert(new Result('hoge', [100]))).not.toThrow();

            expect(
                () => rule.assert(new Result('hoge', [100.1]))
            ).toThrowError(
                new AsyncMarkAssertionError(new AssertRule('<=100ms'), new Result('hoge', [100.1]))
            );
        });
    });
});
