module.exports = {
  contextSeparator: '_',
  createOldCatalogs: false,
  defaultNamespace: 'translation',
  indentation: 2,
  keepRemoved: true, // Conserve les clés existantes
  
  lexers: {
    tsx: ['JsxLexer', 'JavascriptLexer'],
    ts: ['JavascriptLexer'],
    jsx: ['JsxLexer', 'JavascriptLexer'],
    js: ['JavascriptLexer'],
  },

  locales: ['fr', 'en', 'ht', 'es'],
  output: 'src/locales/$LOCALE.json',
  input: ['src/**/*.{ts,tsx}'],

  sort: true,
  verbose: false,
};
