module.exports = {
  extends: [require.resolve('@space-app/eslint-config/nestjs')],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  root: true,
};
