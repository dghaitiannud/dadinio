import fs from 'fs';
const locales = ['fr', 'en', 'ht', 'es'];
const data = Object.fromEntries(locales.map(l => [l, JSON.parse(fs.readFileSync(`./src/locales/${l}.json`))]));
const keys = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
  typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
);
const frKeys = keys(data.fr);
console.log('🔍 Clés non traduites :\n');
locales.filter(l => l !== 'fr').forEach(locale => {
  const untranslated = frKeys.filter(k => {
    const val = k.split('.').reduce((o, p) => o?.[p], data[locale]);
    const frVal = k.split('.').reduce((o, p) => o?.[p], data.fr);
    return val === frVal; // Si la valeur est identique au FR → pas traduit
  });
  console.log(`\n${locale.toUpperCase()}: ${untranslated.length} clé(s) identique(s) au français`);
  untranslated.slice(0, 20).forEach(k => console.log(`  ❌ ${k}`));
});