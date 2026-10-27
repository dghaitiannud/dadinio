// scripts/wrap-interpolations.js
import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as b from '@babel/types';

const traverse = traverseModule.default || traverseModule;
const generate = generateModule.default || generateModule;

const SRC_DIR = './src';
const EXCLUDED_PATHS = ['node_modules', 'components/ui', 'locales', '.test.', '.spec.'];

const SKIP_PATTERNS = [
  /^[0-9\s.,;:!?\-+=()\[\]{}*&^%$#@~`'"|\\/<>]+$/,
  /^[a-z0-9_\-\/]+$/i,
  /^https?:\/\//,
  /^[A-Z0-9_]+$/,
  /^[a-zA-Z]+\.[a-zA-Z]+$/,
];

function shouldTranslate(text) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) return false;
  if (!/[a-zA-ZÀ-ÿ]/.test(trimmed)) return false;
  for (const re of SKIP_PATTERNS) if (re.test(trimmed)) return false;
  return true;
}

function walkFiles(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (EXCLUDED_PATHS.some(ex => fullPath.includes(ex))) continue;
    if (entry.isDirectory()) walkFiles(fullPath, cb);
    else if (/\.(tsx|jsx)$/.test(entry.name)) cb(fullPath);
  }
}

// Extrait "user.name" ou "count" d'une expression
function getVarName(node) {
  if (b.isIdentifier(node)) return node.name;
  if (b.isMemberExpression(node) && b.isIdentifier(node.property)) return node.property.name;
  return null;
}

function processFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  let ast;
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  } catch (e) {
    console.error(`❌ ${filePath}: ${e.message}`);
    return;
  }

  let count = 0;
  const skipped = [];

  // === Cas 1 : JSXElement avec texte + variables simples ===
  traverse(ast, {
    JSXElement(p) {
      const children = p.node.children;
      if (!children || children.length < 2) return;

      // Skip si élément JSX imbriqué
      if (children.some(c => b.isJSXElement(c))) {
        skipped.push("JSXElement imbriqué");
        return;
      }

      // Skip si pas de texte traduisible
      const hasTranslatableText = children.some(
        c => b.isJSXText(c) && shouldTranslate(c.value)
      );
      if (!hasTranslatableText) return;

      const parts = [];        // Pour construire la clé
      const interpProps = [];  // Pour l'objet { name, count }

      for (const child of children) {
        if (b.isJSXText(child)) {
          const t = child.value.trim();
          if (t) parts.push({ type: 'text', value: t });
        } else if (b.isJSXExpressionContainer(child)) {
          const expr = child.expression;
          const varName = getVarName(expr);
          if (!varName) {
            // Expression complexe → on skip le fichier entier
            skipped.push("expression complexe");
            p.node.children = children; // reset
            return;
          }
          parts.push({ type: 'var', value: varName });
          interpProps.push(b.objectProperty(b.identifier(varName), expr));
        }
      }

      if (parts.length < 2) return;

      // Clé : "Bonjour {{name}}, tu as {{count}} vidéos"
      const key = parts.map(p =>
        p.type === 'text' ? p.value : `{{${p.value}}}`
      ).join(' ');

      const tArgs = [b.stringLiteral(key)];
      if (interpProps.length > 0) tArgs.push(b.objectExpression(interpProps));

      p.node.children = [b.jsxExpressionContainer(b.callExpression(b.identifier('t'), tArgs))];
      count++;
    },
  });

  // === Cas 2 : Ternaire {cond ? "A" : "B"} ===
  traverse(ast, {
    JSXExpressionContainer(p) {
      const expr = p.node.expression;
      if (!b.isConditionalExpression(expr)) return;
      if (!b.isStringLiteral(expr.consequent) || !b.isStringLiteral(expr.alternate)) return;
      if (!shouldTranslate(expr.consequent.value) && !shouldTranslate(expr.alternate.value)) return;

      const wrap = (s) =>
        shouldTranslate(s.value) ? b.callExpression(b.identifier('t'), [b.stringLiteral(s.value)]) : s;

      p.node.expression = b.conditionalExpression(expr.test, wrap(expr.consequent), wrap(expr.alternate));
      count++;
    },
  });

  // === Cas 3 : {cond && "Texte"} ===
  traverse(ast, {
    JSXExpressionContainer(p) {
      const expr = p.node.expression;
      if (!b.isLogicalExpression(expr) || expr.operator !== '&&') return;
      if (!b.isStringLiteral(expr.right) || !shouldTranslate(expr.right.value)) return;

      p.node.expression = b.logicalExpression(
        '&&', expr.left, b.callExpression(b.identifier('t'), [b.stringLiteral(expr.right.value)])
      );
      count++;
    },
  });

  // === Cas 4 : Template literal {`${count} vues`} ===
  traverse(ast, {
    JSXExpressionContainer(p) {
      const expr = p.node.expression;
      if (!b.isTemplateLiteral(expr) || expr.expressions.length === 0) return;

      const varNames = expr.expressions.map(getVarName);
      if (varNames.some(v => !v)) return; // Expression complexe

      // Construire la clé : "{{count}} vues"
      let key = '';
      expr.quasis.forEach((q, i) => {
        key += q.value.cooked || '';
        if (i < varNames.length && varNames[i]) key += `{{${varNames[i]}}}`;
      });
      key = key.trim();

      if (!shouldTranslate(key.replace(/\{\{[^}]+\}\}/g, ''))) return;

      const interpProps = expr.expressions.map((e, i) =>
        b.objectProperty(b.identifier(varNames[i]), e)
      );

      p.node.expression = b.callExpression(b.identifier('t'), [
        b.stringLiteral(key),
        b.objectExpression(interpProps),
      ]);
      count++;
    },
  });

  if (count > 0) {
    fs.writeFileSync(filePath, generate(ast, { retainLines: true, jsescOption: { minimal: true } }, code).code);
    console.log(`✅ ${filePath.replace('./src/', '')} → ${count} interpolation(s)`);
  }
  if (skipped.length > 0) {
    console.log(`⚠️  ${filePath.replace('./src/', '')} → ${skipped.length} cas ignoré(s)`);
  }
}

console.log('🚀 Analyse des interpolations...\n');
walkFiles(SRC_DIR, processFile);
console.log('\n✨ Terminé ! Lance npm run extract-i18n');