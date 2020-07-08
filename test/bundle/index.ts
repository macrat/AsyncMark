/* eslint-disable-next-line import/extensions */
import { Benchmark, Suite, AsyncMarkAssertionError } from '../../dist';

function timer(time: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), time);
  });
}

describe('after bundle test', () => {
  test('simple benchmark', async () => {
    const result = await new Benchmark({
      number: 100,
      fun: () => Promise.resolve(),
      after: () => undefined,
    }).run();

    expect(() => result.assert('<10ms', '>0ms')).not.toThrowError();
    expect(() => result.assert('>100ms')).toThrowError(AsyncMarkAssertionError);
  });

  test('simple suite', async () => {
    const results = await new Suite({
      benchmarkDefault: {
      },
    }).add({
      number: 10,
      fun: () => timer(100),
      after: () => undefined,
    }).add(new Benchmark({
      number: 10,
      fun: () => timer(200),
      after: () => undefined,
    })).run();

    expect(results.length).toBe(2);
    expect(results[0].average).toBeCloseTo(100, -1);
    expect(results[1].average).toBeCloseTo(200, -1);
  });
});
