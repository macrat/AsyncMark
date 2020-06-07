const rollup = require('rollup');
const typescript = require('@rollup/plugin-typescript');
const {terser} = require('rollup-plugin-terser');


rollup
    .rollup({
        input: 'src/index.ts',
        plugins: [typescript()],
    })
    .then(bundle => Promise.all([
        bundle.write({format: 'es',  exports: 'named', file: 'dist/asyncmark.mjs'}),
        bundle.write({format: 'umd', exports: 'named', file: 'dist/asyncmark.js', name: 'AsyncMark'}),
    ]))
    .catch(console.error);


rollup
    .rollup({
        input: 'src/index.ts',
        plugins: [typescript(), terser()],
    })
    .then(bundle => Promise.all([
        bundle.write({format: 'es',  exports: 'named', file: 'dist/asyncmark.min.mjs'}),
        bundle.write({format: 'umd', exports: 'named', file: 'dist/asyncmark.min.js', name: 'AsyncMark'}),
    ]))
    .catch(console.error);
