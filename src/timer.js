/**
 * milliseconds timer
 *
 * @return {Number} high resolution current time in milliseconds.
 *
 * @ignore
 */
let now = function() {
    return Number(new Date());
};

if (typeof performance !== 'undefined' && performance.now) {
    now = function() {
        return performance.now();
    };
} else {
    try {
        const microtime = require('microtime');
        now = function() {
            return microtime.nowDouble() * 1000;
        };
    } catch(e) {
        if (typeof process !== 'undefined' && process.hrtime) {
            now = function() {
                const hr = process.hrtime();
                return (hr[0] * 1e9 + hr[1]) / 1e6;
            };
        }
    }
}


/**
 * Measure tiem to execute a function.
 *
 * wait for done if the target function returns a thenable object. so you can use async function.
 *
 * @param {function} fun - the target function.
 * @param {Object} [context={}] - the `this` for target function.
 *
 * @return {Promise<Number>} milliseconds taked executing.
 *
 * @example
 * const msec = await timeit(function() {
 *     # do something heavy.
 * });
 */
async function timeit(fun, context={}) {
    const start = now();
    await fun.call(context);
    const end = now();

    return end - start;
}


export {now, timeit};
