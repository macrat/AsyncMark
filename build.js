const rollup = require('rollup');
const typescript = require('@rollup/plugin-typescript');
const { terser } = require('rollup-plugin-terser');


rollup
  .rollup({
    input: 'src/index.ts',
    plugins: [typescript({ outDir: 'dist/esm', declaration: true })],
  })
  .then(bundle => Promise.all([
    bundle.write({ format: 'es', exports: 'named', dir: 'dist/esm' }),
  ]))
  .catch(console.error);


rollup
  .rollup({
    input: 'src/index.ts',
    plugins: [typescript()],
  })
  .then(bundle => Promise.all([
    bundle.write({ format: 'umd', exports: 'named', file: 'dist/index.js', name: 'AsyncMark' }),
  ]))
  .catch(console.error);


rollup
  .rollup({
    input: 'src/index.ts',
    plugins: [typescript(), terser()],
  })
  .then(bundle => Promise.all([
    bundle.write({ format: 'umd', exports: 'named', file: 'dist/index.min.js', name: 'AsyncMark' }),
  ]))
  .catch(console.error);
