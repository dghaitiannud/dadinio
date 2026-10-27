module.exports = {
  contextSeparator: '_',
  createOldCatalogs: false,
  defaultNamespace: 'translation',
  indentation: 2,
  keepRemoved: false,
  lexers: {
    js: ['JavascriptLexer'],
    jsx: ['JsxLexer'],
    ts: ['JavascriptLexer'],
    tsx: ['JsxLexer'],
  },
  locales: ['fr', 'en', 'ht', 'es'],
  output: 'src/locales/$LOCALE.json',
  input: ['src/**/*.{ts,tsx,js,jsx}'],
  sort: true,
  verbose: true,
};