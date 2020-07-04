import { Result } from '../src';

/**
 * @test {Result}
 */
describe('Result', () => {
  /**
   * @test {Result#total}
   */
  test('#total', () => {
    expect(new Result('test', [10, 20, 30]).total).toBe(60);
    expect(new Result('test', [11, 22, 33]).total).toBe(66);
  });

  /**
   * @test {Result#fastest}
   */
  test('#fastest', () => {
    expect(new Result('test', [10, 20, 30]).fastest).toBe(10);
    expect(new Result('test', [33, 22, 11]).fastest).toBe(11);
  });

  /**
   * @test {Result#slowest}
   */
  test('#slowest', () => {
    expect(new Result('test', [10, 20, 30]).slowest).toBe(30);
    expect(new Result('test', [33, 22, 11]).slowest).toBe(33);
  });

  /**
   * @test {Result#average}
   */
  test('#average', () => {
    expect(new Result('test', [10, 20, 30]).average).toBe(20);
    expect(new Result('test', [11, 22, 33]).average).toBe(22);
  });

  /**
   * @test {Result#variance}
   */
  test('#variance', () => {
    expect(new Result('test', [10, 20, 30]).variance).toBe(100);
    expect(new Result('test', [11, 22, 33]).variance).toBe(121);
  });

  /**
   * @test {Result#std}
   */
  test('#std', () => {
    expect(new Result('test', [10, 20, 30]).std).toBe(10);
    expect(new Result('test', [11, 22, 33]).std).toBe(11);
  });

  /**
   * @test {Result#std}
   */
  test('#sem', () => {
    expect(new Result('test', [10, 20, 30]).sem).toBeCloseTo(5.7735);
    expect(new Result('test', [11, 22, 33]).sem).toBeCloseTo(6.3509);
  });

  /**
   * @test {Result#errorRange}
   */
  test('#errorRange', () => {
    expect(new Result('test', [10, 20, 30]).errorRange).toBeCloseTo(11.3161);
    expect(new Result('test', [11, 22, 33]).errorRange).toBeCloseTo(12.4477);
  });

  /**
   * @test {Result#errorRate}
   */
  test('#errorRate', () => {
    expect(new Result('test', [10, 20, 30]).errorRate).toBeCloseTo(0.5658);
    expect(new Result('test', [11, 22, 33]).errorRate).toBeCloseTo(0.5658);
  });

  /**
   * @test {Result#opsPerSec}
   */
  test('#opsPerSec', () => {
    expect(new Result('test', [1]).opsPerSec).toBe(1000);
    expect(new Result('test', [200]).opsPerSec).toBe(5);
  });

  /**
   * @test {Result#dropOutlier}
   */
  test('#opsPerSec', () => {
    expect(new Result('test', [10, 20, 30]).dropOutlier().msecs).toEqual([10, 20, 30]);
    expect(new Result('test', [10, 11, 12, 13, 14, 15, 100]).dropOutlier().msecs).toEqual([10, 11, 12, 13, 14, 15]);
    expect(new Result('test', [10, 11, 12, 13, 14, 15, 100]).dropOutlier(3).msecs).toEqual([10, 11, 12, 13, 14, 15, 100]);
  });

  /**
   * @test {Result#toString}
   */
  test('#toString', () => {
    expect(String(new Result('test', [10, 20, 30]))).toBe('test:\t50ops/sec\t20msec/op\t+-11.3161msec/op (56.58%)\t3 times tried');
    expect(String(new Result('test', [1.234567, 2.345678]))).toBe('test:\t558.621ops/sec\t1.7901msec/op\t+-1.0889msec/op (60.83%)\t2 times tried');
  });

  /**
   * @test {Result#assert}
   */
  test('#assert', () => {
    const result = new Result('test', [100]);

    expect(() => {
      result.assert('>=100ms', '<=100ms');
    }).not.toThrow();

    expect(() => {
      result.assert('>100ms', '<=100ms');
    }).toThrowError('benchmark "test": actual:100msec/op > expected:100msec/op');

    expect(() => {
      result.assert('>=100ms', '<100ms');
    }).toThrowError('benchmark "test": actual:100msec/op < expected:100msec/op');
  });
});
