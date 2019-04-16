/**
 * Get a timer value in milliseconds resolution with {@link Date} class.
 *
 * @return {Number} a timer value in milliseconds.
 *
 * @ignore
 * @since 0.2.5
 */
function now_date() {
    return Number(new Date());
}


/**
 * Get a timer value in microseconds resolution with {@link Performance.now} function.
 *
 * @return {Number} a timer value in milliseconds. (microseconds resolution)
 *
 * @ignore
 * @since 0.2.5
 */
function now_now() {
    return performance.now();
}


/**
 * Get a timer value in nanoseconds resolution with {@link Process.hrtime} function.
 *
 * @return {Number} a timer value in milliseconds. (nanoseconds resolution)
 *
 * @ignore
 * @since 0.2.5
 */
function now_hrtime() {
    const hr = process.hrtime();
    return (hr[0] * 1e9 + hr[1]) / 1e6;
}


/**
 * Get the current time as high resolution as possible in the current platform.
 *
 * @return {Number} a timer value in milliseconds.
 *
 * @ignore
 */
let now = now_date;
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
 * @param {function(): ?Promise} fun - the target function.
 * @param {Object} [context={}] - the `this` for target function.
 * @param {Object[]} [args=[]] - arguments to passing to target function.
 *
 * @return {Promise<Number>} milliseconds taked executing.
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
async function timeit(fun, context={}, args=[]) {
    const start = now();
    await fun.call(context, ...args);
    const end = now();

    return end - start;
}


export {timeit, now, now_date, now_now, now_hrtime};
