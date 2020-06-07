/**
 * Get a timer value in milliseconds resolution with {@link Date} class.
 *
 * @return a timer value in milliseconds.
 *
 * @ignore
 * @since 0.2.5
 */
function now_date(): number {
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
function now_now(): number {
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
function now_hrtime(): number {
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
let now: (() => number) = now_date;
if (typeof process !== 'undefined' && process.hrtime) {
    now = now_hrtime;
} else if (typeof performance !== 'undefined' && performance.now) {
    now = now_now;
}


/**
 * Measure tiem to execute a function.
 *
 * wait for done if the target function returns a thenable object. so you can use async function.
 *
 * NOTE: this function will execute target function only once.
 *
 * @param fun - the target function.
 * @param [context] - the `this` for target function.
 * @param [args] - arguments to passing to target function.
 *
 * @return milliseconds taked executing.
 *
 * @example
 * const msec = await timeit(function() {
 *     # do something heavy.
 * });
 *
 * @example
 * console.log(await timeit(axios.get, args=['http://example.com']));
 *
 * @since 0.2.4
 */
async function timeit<T extends any[] = any[]>(fun: (() => Promise<void>), context: any = {}, args: T = [] as T): Promise<number> {
    const start = now();
    await fun.call(context, ...args);
    const end = now();

    return end - start;
}


export {timeit, now, now_date, now_now, now_hrtime};
