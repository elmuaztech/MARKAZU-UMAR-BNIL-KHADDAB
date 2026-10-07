require('ts-node').register({
  compilerOptions: {
    module: 'commonjs',
    target: 'es2020',
  },
});

require('./quran-assessment-test-suite.ts');
