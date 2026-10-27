// scripts/add-usetranslation.js
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

function walkFiles(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (EXCLUDED_PATHS.some(ex => fullPath.includes(ex))) continue;
    if (entry.isDirectory()) walkFiles(fullPath, callback);
    else if (/\.(tsx|jsx)$/.test(entry.name)) callback(fullPath);
  }
}

function processFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  let ast;
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  } catch (e) {
    console.error(`❌ Parse error ${filePath}: ${e.message}`);
    return;
  }

  let usesT = false;
  let usesGlobalT = false;
  let hasUseTranslationImport = false;
  let hasTopLevelT = false;
  let alreadyHasHookInComponent = false;

  traverse(ast, {
    ImportDeclaration(p) {
      if (p.node.source.value === 'react-i18next') {
        p.node.specifiers.forEach(spec => {
          if (b.isImportSpecifier(spec) && spec.imported.name === 'useTranslation') {
            hasUseTranslationImport = true;
          }
        });
      }
    },
    CallExpression(p) {
      if (b.isIdentifier(p.node.callee) && p.node.callee.name === 't') usesT = true;
      // Détecte si useTranslation() est déjà appelé
      if (b.isIdentifier(p.node.callee) && p.node.callee.name === 'useTranslation') {
        alreadyHasHookInComponent = true;
      }
    },
    AssignmentExpression(p) {
      if (b.isMemberExpression(p.node.left) && b.isIdentifier(p.node.left.property, { name: 't' })) {
        usesGlobalT = true;
      }
    },
    VariableDeclarator(p) {
      if (b.isIdentifier(p.node.id) && p.node.id.name === 't') {
        if (b.isArrowFunctionExpression(p.node.init) || b.isFunctionExpression(p.node.init)) {
          try {
            const fnParent = p.scope?.getFunctionParent?.();
            if (!fnParent) hasTopLevelT = true;
          } catch {}
        }
      }
    },
  });

  // === SKIP cases ===
  if (!usesT) return;
  if (hasTopLevelT || usesGlobalT) {
    console.log(`⏭️  ${filePath.replace('./src/', '')} → t global (skip)`);
    return;
  }
  // ✅ NEW : skip si useTranslation() est déjà appelé quelque part
  if (alreadyHasHookInComponent) {
    return;
  }

  let modified = false;

  // 1. Ajouter l'import s'il manque
  if (!hasUseTranslationImport) {
    const importDecl = b.importDeclaration(
      [b.importSpecifier(b.identifier('useTranslation'), b.identifier('useTranslation'))],
      b.stringLiteral('react-i18next')
    );
    let lastImportIndex = -1;
    ast.program.body.forEach((node, i) => {
      if (b.isImportDeclaration(node)) lastImportIndex = i;
    });
    if (lastImportIndex >= 0) {
      ast.program.body.splice(lastImportIndex + 1, 0, importDecl);
    } else {
      ast.program.body.unshift(importDecl);
    }
    modified = true;
  }

  // 2. Ajouter `const { t } = useTranslation();`
  let inserted = false;

  const declarationToInsert = b.variableDeclaration('const', [
    b.variableDeclarator(
      b.objectPattern([b.objectProperty(b.identifier('t'), b.identifier('t'), false, true)]),
      b.callExpression(b.identifier('useTranslation'), [])
    ),
  ]);

  traverse(ast, {
    FunctionDeclaration(p) {
      if (inserted) return;
      const name = p.node.id?.name;
      if (name && /^[A-Z]/.test(name)) {
        // ✅ NEW : Vérifie si la fonction a déjà un useTranslation() dans son corps
        const hasHookAlready = p.node.body.body.some(stmt =>
          b.isVariableDeclaration(stmt) &&
          stmt.declarations.some(d =>
            d.init && b.isCallExpression(d.init) &&
            b.isIdentifier(d.init.callee, { name: 'useTranslation' })
          )
        );
        if (hasHookAlready) return;

        p.node.body.body.unshift(declarationToInsert);
        inserted = true;
      }
    },
    VariableDeclarator(p) {
      if (inserted) return;
      const id = p.node.id;
      const init = p.node.init;
      if (
        b.isIdentifier(id) && /^[A-Z]/.test(id.name) &&
        (b.isArrowFunctionExpression(init) || b.isFunctionExpression(init))
      ) {
        if (b.isBlockStatement(init.body)) {
          const hasHookAlready = init.body.body.some(stmt =>
            b.isVariableDeclaration(stmt) &&
            stmt.declarations.some(d =>
              d.init && b.isCallExpression(d.init) &&
              b.isIdentifier(d.init.callee, { name: 'useTranslation' })
            )
          );
          if (hasHookAlready) return;

          init.body.body.unshift(declarationToInsert);
          inserted = true;
        }
      }
    },
  });

  if (modified || inserted) {
    const output = generate(ast, { retainLines: true, jsescOption: { minimal: true } }, code);
    fs.writeFileSync(filePath, output.code);
    console.log(`✅ ${filePath.replace('./src/', '')} → useTranslation ajouté`);
  }
}

console.log('🚀 Analyse des fichiers...\n');
walkFiles(SRC_DIR, processFile);
console.log('\n✨ Terminé !');