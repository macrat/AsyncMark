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
      exports: 'named',
      file: 'dist/index.js',
      name: 'AsyncMark',
    }],
  },
  {
    input: 'src/index.ts',
    plugins: [typescript(), terser()],
    output: [{
      format: 'umd',
      exports: 'named',
      file: 'dist/index.min.js',
      name: 'AsyncMark',
    }],
  },
];
