const PromiseBench = require('../dist/promise-bench.js');


new PromiseBench.Benchmark(function() {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, 100)
    });
}).run().catch(console.error);
