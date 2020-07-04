const AsyncMark = require('../dist/asyncmark.js');


new AsyncMark.Benchmark(function() {
    return new Promise((resolve) => {
        setTimeout(resolve, 100);
    });
}).run().catch(console.error);
