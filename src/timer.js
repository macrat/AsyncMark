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


export default now;
