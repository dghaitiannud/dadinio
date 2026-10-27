// scripts/wrap-texts.js
import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as b from '@babel/types';

const traverse = traverseModule.default || traverseModule;
const generate = generateModule.default || generateModule;

const SRC_DIR = './src';

// Dossiers/fichiers à ignorer
const EXCLUDED_PATHS = [
  'node_modules',
  'components/ui',
  'locales',
  '.test.',
  '.spec.',
];

// Attributs JSX à traduire automatiquement
const TRANSLATE_ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];

// Textes à NE PAS traduire (classes, URLs, symboles, etc.)
const SKIP_PATTERNS = [
  /^[0-9\s.,;:!?\-+=()\[\]{}*&^%$#@~`'"|\\/<>]+$/, // Uniquement symboles/chiffres
  /^[a-z0-9_\-\/]+$/i,                              // Identifiant/slug (ex: "kompa", "rasin")
  /^https?:\/\//,                                   // URL
  /^[A-Z0-9_]+$/,                                   // CONSTANTE (ex: "VIP")
  /^[a-zA-Z]+\.[a-zA-Z]+$/,                         // Fichier (ex: "logo.jpg")
];

function shouldTranslate(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.length < 2) return false;
  if (!/[a-zA-ZÀ-ÿ]/.test(trimmed)) return false; // Doit contenir des lettres
  for (const re of SKIP_PATTERNS) {
    if (re.test(trimmed)) return false;
  }
  return true;
}

function walkFiles(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (EXCLUDED_PATHS.some(ex => fullPath.includes(ex))) continue;
    if (entry.isDirectory()) {
      walkFiles(fullPath, callback);
    } else if (/\.(tsx|jsx)$/.test(entry.name)) {
      callback(fullPath);
    }
  }
}

function processFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  let ast;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch (e) {
    console.error(`❌ Parse error in ${filePath}:`, e.message);
    return;
  }

  let changeCount = 0;

  traverse(ast, {
    // 1. Textes entre les balises JSX : <h1>Titre</h1>
    JSXText(path) {
      const value = path.node.value;
      if (!shouldTranslate(value)) return;

      const trimmed = value.trim();
      const callExpr = b.callExpression(b.identifier('t'), [b.stringLiteral(trimmed)]);
      const jsxExpr = b.jsxExpressionContainer(callExpr);

      // On préserve les espaces autour
      const leading = value.match(/^\s*/)[0];
      const trailing = value.match(/\s*$/)[0];

      const replacement = [];
      if (leading) replacement.push(b.jsxText(leading));
      replacement.push(jsxExpr);
      if (trailing) replacement.push(b.jsxText(trailing));

      path.replaceWithMultiple(replacement);
      changeCount++;
    },

    // 2. Attributs JSX : placeholder="Texte"
    JSXAttribute(path) {
      const name = path.node.name.name;
      if (!TRANSLATE_ATTRS.includes(name)) return;

      const value = path.node.value;
      if (!value || !b.isStringLiteral(value)) return;
      if (!shouldTranslate(value.value)) return;

      const callExpr = b.callExpression(b.identifier('t'), [b.stringLiteral(value.value)]);
      path.node.value = b.jsxExpressionContainer(callExpr);
      changeCount++;
    },
  });

  if (changeCount > 0) {
    const output = generate(ast, { retainLines: true, jsescOption: { minimal: true } }, code);
    fs.writeFileSync(filePath, output.code);
    console.log(`✅ ${filePath.replace('./src/', '')} → ${changeCount} texte(s)`);
  }
}

console.log('🚀 Scan des fichiers...\n');
walkFiles(SRC_DIR, processFile);
console.log('\n✨ Terminé ! Lance maintenant : npm run extract-i18n');