// rollup.config.js
import typescript from 'rollup-plugin-typescript';
import json from 'rollup-plugin-json';
import commonjs from 'rollup-plugin-commonjs';
import node from 'rollup-plugin-node-resolve';

export default [{
  input: './src/serviceworker.ts',
  output: {
    file: './dist/bundle.js',
    format: 'cjs'
  },
  plugins: [
    node(),
    commonjs(),
    typescript(),
    json(),
  ]
},{
  input: './src/app.ts',
  output: {
    file: './dist/app.js',
    format: 'esm'
  },
  plugins: [
    node(),
    commonjs(),
    typescript(),
    json(),
  ]
}]