const typescript = require('@rollup/plugin-typescript');
const { terser } = require('rollup-plugin-terser');

export default [
  {
    input: 'src/index.ts',
    plugins: [
      typescript({ outDir: 'dist/esm', declaration: true }),
    ],
    output: [{
      format: 'es',
      dir: 'dist/esm',
    }],
  },
  {
    input: 'src/index.ts',
    plugins: [typescript()],
    output: [{
      format: 'umd',
      file: 'dist/index.js',
      name: 'AsyncMark',
      sourcemap: true,
    }, {
      format: 'umd',
      plugins: [terser()],
      file: 'dist/index.min.js',
      name: 'AsyncMark',
      sourcemap: true,
    }],
  },
];
