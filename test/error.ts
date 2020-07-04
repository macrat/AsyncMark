import AsyncMarkAssertionError from '../src/error';
import AssertRule from '../src/assertion';
import { Result } from '../src';

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
      expect('throw error').toBe('not throwed');
    } catch (err) {
      expect(typeof err.stack).toBe('string');
      expect(err.stack).not.toBe('');

      const lines = err.stack.split('\n');

      expect(lines[0]).toBe('AsyncMarkAssertionError: benchmark "dummy": actual:200msec/op < expected:100msec/op');
      expect(lines[1]).toMatch(/at \/.+\/test\/error.ts:[0-9]+:[0-9]+$/);
    }
  });
});
