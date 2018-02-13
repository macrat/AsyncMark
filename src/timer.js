/**
 * milliseconds timer
 *
 * @return {Number} high resolution current time in milliseconds.
 *
 * @ignore
 */
const now = typeof performance !== 'undefined' && performance.now ? function () {
    return performance.now();
} : function () {
    const hr = process.hrtime();
    return (hr[0] * 1e9 + hr[1]) / 1e6;
};


export default now;
