/**
 * Get a timer value in milliseconds resolution with {@link Date} class.
 *
 * @return a timer value in milliseconds.
 *
 * @ignore
 * @since 0.2.5
 */
function nowDate(): number {
  return Number(new Date());
}

/**
 * Get a timer value in microseconds resolution with {@link Performance.now} function.
 *
 * @return a timer value in milliseconds. (microseconds resolution)
 *
 * @ignore
 * @since 0.2.5
 */
function nowNow(): number {
  return performance.now();
}

/**
 * Get a timer value in nanoseconds resolution with {@link Process.hrtime} function.
 *
 * @return a timer value in milliseconds. (nanoseconds resolution)
 *
 * @ignore
 * @since 0.2.5
 */
function nowHrtime(): number {
  const hr = process.hrtime();
  return (hr[0] * 1e9 + hr[1]) / 1e6;
}

/**
 * Get the current time as high resolution as possible in the current platform.
 *
 * @return a timer value in milliseconds.
 *
 * @ignore
 */
const now = (() => {
  if (typeof process !== 'undefined' && process.hrtime) {
    return nowHrtime;
  }
  if (typeof performance !== 'undefined' && performance.now) {
    return nowNow;
  }
  return nowDate;
})();

/**
 * Measure tiem to execute a function.
 *
 * wait for done if the target function returns a thenable object. so you can use async function.
 *
 * NOTE: this function will execute target function only once.
 *
 * @param fun - the target function.
 * @param [args] - arguments to passing to target function.
 * @param [context] - the `this` for target function.
 *
 * @return milliseconds taked executing.
 *
 * @example
 * const msec = await timeit(function() {
 *     # do something heavy.
 * });
 *
 * @example
 * console.log(await timeit(axios.get, ['http://example.com']));
 *
 * @since 1.0.0
 */
async function timeit<T extends unknown[], U extends Record<string, unknown>>(
  fun: ((...args: T) => Promise<void> | void),
  args: T = [] as unknown as T,
  context: U = {} as U,
): Promise<number> {
  const start = now();
  await fun.call(context, ...args);
  const end = now();

  return end - start;
}

export {
  timeit, now, nowDate, nowNow, nowHrtime,
};
