const AsyncMark = require('../dist/index.js');


new AsyncMark.Benchmark(function() {
    return new Promise((resolve) => {
        setTimeout(resolve, 100);
    });
}).run().catch(console.error);
