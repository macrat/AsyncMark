const rollup = require('rollup');
const babel = require('rollup-plugin-babel');


rollup
	.rollup({
		input: 'src/index.js',
		plugins: [babel()],
	})
	.then(bundle => Promise.all([
		bundle.write({format: 'es',  exports: 'named', file: 'dist/promise-bench.mjs'}),
		bundle.write({format: 'cjs', exports: 'named', file: 'dist/promise-bench.js'}),
		bundle.write({format: 'umd', exports: 'named', file: 'dist/promise-bench.web.js', name: 'PromiseBench'}),
	]))
	.catch(console.error);
