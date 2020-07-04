import AssertRule, { unit, UnitValue } from '../src/assertion';
import AsyncMarkAssertionError from '../src/error';
import { Result } from '../src';

describe('assertion', () => {
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
   * @test {AssertRule}
   */
  describe('AssertRule', () => {
    /**
     * @test {AssertRule#constructor}
     */
    test('#constructor', () => {
      const parseTest = (expr, expected, unit_) => {
        const x = new AssertRule(`${expr}${expected}${unit_}`);

        expect(x.operator).toBe(expr || '<=');
        expect(x.expected).toBe(expected * unit(unit_));
      };

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
    describe('#assert', () => {
      const rule = new AssertRule('100');

      expect(() => rule.assert(new Result('hoge', [100]))).not.toThrow();

      expect(
        () => rule.assert(new Result('hoge', [100.1])),
      ).toThrowError(
        new AsyncMarkAssertionError(new AssertRule('<=100ms'), new Result('hoge', [100.1])),
      );
    });
  });
});
