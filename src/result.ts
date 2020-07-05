import AssertRule from './assertion';

/**
 * The result of benchmark.
 *
 * This value will included outlier. Please use {@link Result.dropOutlier} if you want drop they.
 */
export default class Result {
  /**
   * Name of this test.
   */
  readonly name: string;

  /**
   * Times of benchmark result in milliseconds.
   */
  readonly msecs: number[];

  /**
   * @param name   Name of benchmark.
   * @param msecs  Times of benchmark result.
   */
  constructor(name: string, msecs: number[]) {
    this.name = name;
    this.msecs = msecs;
  }

  /**
   * Total milliseconds of this benchmark.
   */
  get total(): number {
    return this.msecs.reduce((x, y) => x + y);
  }

  /**
   * The time of fastest test in milliseconds.
   */
  get fastest(): number {
    return this.msecs.reduce((x, y) => Math.min(x, y));
  }

  /**
   * The time of slowest test in milliseconds.
   */
  get slowest(): number {
    return this.msecs.reduce((x, y) => Math.max(x, y));
  }

  /**
   * Average time of this benchmark in milliseconds.
   */
  get average(): number {
    return this.total / this.msecs.length;
  }

  /**
   * Time unbiased sample variance of times.
   */
  get variance(): number {
    const avg = this.average;
    return this.msecs.reduce((total, x) => total + (x - avg) ** 2, 0) / (this.msecs.length - 1);
  }

  /**
   * Standard division of times.
   */
  get std(): number {
    return Math.sqrt(this.variance);
  }

  /**
   * Standard error of the mean of times.
   */
  get sem(): number {
    return this.std / Math.sqrt(this.msecs.length);
  }

  /**
   * Guessed error range of this benchmark.
   */
  get errorRange(): number {
    return this.sem * 1.96;
  }

  /**
   * Error range per average time.
   */
  get errorRate(): number {
    return this.errorRange / this.average;
  }

  /**
   * Operations per seconds.
   */
  get opsPerSec(): number {
    return 1000 / this.average;
  }

  /**
   * Make new Result that droped outlier.
   *
   * @param threshold  The threshold of outlier testing.
   *
   * @return  New {@link Result} instance.
   */
  dropOutlier(threshold = 2): Result {
    const avg = this.average;
    const { std } = this;
    return new Result(this.name, this.msecs.filter((x) => Math.abs((x - avg) / std) <= threshold));
  }

  /**
   * Convert to string for printing.
   *
   * @return  Human redable string
   */
  toString(): string {
    const avg = Math.round(this.average * 10000) / 10000;
    const ops = Math.round(this.opsPerSec * 1000) / 1000;
    const range = Math.round(this.errorRange * 10000) / 10000;
    const rate = Math.round(this.errorRate * 10000) / 100;

    return `${this.name}:\t${ops}ops/sec\t${avg}msec/op\t+-${range}msec/op (${rate}%)\t${this.msecs.length} times tried`;
  }

  /**
   * Assertion if it taked more (or less) time than expected.
   *
   * Expected rule format is `{operator}{number}{unit}`; use like `<=10msec`.
   * Operator and unit are can omit. If omitted, uses `<=` and `msec`.
   *
   * This function will throw {@link AsyncMarkAssertionError} if result is unaccepcable.
   *
   * ## Supported operators
   * |example       |means              |
   * |--------------|-------------------|
   * |"<42"         |faster than 42 msec|
   * |"<=42" or omit|42 msec or faster  |
   * |">42"         |slower than 42 msec|
   * |">=42"        |42 msec or slower  |
   *
   * ## Supported units
   * |example           |means       |
   * |------------------|------------|
   * |"42s" or "42sec"  |seconds     |
   * |"42ms" or "42msec"|milliseconds|
   * |"42us" or "42usec"|microseconds|
   * |"42ns" or "42nsec"|nanoseconds |
   *
   * ## Examples
   * ### Simple usage
   *
   * ``` typescript
   * const result = await Benchmark(function() {
   *     # do something that expect done in least 100msec
   * }).run();
   *
   * result.assert(100);
   * ```
   *
   * ### Combination rule
   *
   * ``` typescript
   * const result = await Benchmark(async function() {
   *     await sleep_function(100);
   * }).run();
   *
   * result.assert('>90ms', '<110ms');
   * ```
   *
   * @param expected  Expected time in milliseconds number or string value.
   *                  e.g. `<10ms` or `>=20s`.
   *
   * @since 0.3.0
   */
  assert(...expected: (number | string)[]): void {
    const rules = expected.map((x) => new AssertRule(x));

    rules.forEach((rule) => rule.assert(this, this.assert));
  }
}
