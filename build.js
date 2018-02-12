const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const uglify = require('rollup-plugin-uglify');


rollup
    .rollup({
        input: 'src/index.js',
        plugins: [babel()],
    })
    .then(bundle => Promise.all([
        bundle.write({format: 'es',  exports: 'named', file: 'dist/promise-bench.mjs'}),
        bundle.write({format: 'umd', exports: 'named', file: 'dist/promise-bench.js', name: 'PromiseBench'}),
    ]))
    .catch(console.error);


rollup
    .rollup({
        input: 'src/index.js',
        plugins: [babel(), uglify()],
    })
    .then(bundle => Promise.all([
        bundle.write({format: 'es',  exports: 'named', file: 'dist/promise-bench.min.mjs'}),
        bundle.write({format: 'umd', exports: 'named', file: 'dist/promise-bench.min.js', name: 'PromiseBench'}),
    ]))
    .catch(console.error);
