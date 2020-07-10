const AsyncMark = require('../dist/index.js');

new AsyncMark.Benchmark((() => new Promise((resolve) => {
  setTimeout(resolve, 100);
}))).run().catch(console.error);
