const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const {terser} = require('rollup-plugin-terser');


rollup
    .rollup({
        input: 'src/index.js',
        plugins: [babel()],
    })
    .then(bundle => Promise.all([
        bundle.write({format: 'es',  exports: 'named', file: 'dist/asyncmark.mjs'}),
        bundle.write({format: 'umd', exports: 'named', file: 'dist/asyncmark.js', name: 'AsyncMark'}),
    ]))
    .catch(console.error);


rollup
    .rollup({
        input: 'src/index.js',
        plugins: [babel(), terser()],
    })
    .then(bundle => Promise.all([
        bundle.write({format: 'es',  exports: 'named', file: 'dist/asyncmark.min.mjs'}),
        bundle.write({format: 'umd', exports: 'named', file: 'dist/asyncmark.min.js', name: 'AsyncMark'}),
    ]))
    .catch(console.error);
