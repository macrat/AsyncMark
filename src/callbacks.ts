import Benchmark from './benchmark';

export type TargetFunc = (
  /**
   * The target function for benchmarking.
   *
   * @return  If returns Promise, {@link Benchmark} will measure the time it takes for the
   *          Promise to resolve. Otherwise will measure the time it to method return.
   *
   * @since 1.0.0
   */
  () => Promise<void> | void
);

/**
 * Callback functions set.
 *
 * @since 0.3.4
 */
export type TestCallbacks = {
  beforeTest?: (
    /**
     * Callback function that will be called when before executing each test.
     *
     * @param count      Count of done tests in this benchmark.
     * @param benchmark  This {@link Benchmark}.
     *
     * @return  Promise for awaiting, or undefined.
     */
    (count: number, benchmark: Benchmark) => Promise<void> | void
  );

  afterTest?: (
    /**
     * Callback function that will be called when after executing each test.
     *
     * @param count      Count of done tests in this benchmark.
     * @param benchmark  This {@link Benchmark}.
     * @param msec       Duration of this execution.
     *
     * @return  Promise for awaiting, or undefined.
     */
    (count: number, benchmark: Benchmark, msec: number) => Promise<void> | void
  );
};
