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

// Dossiers ignorés (le code UI shadcn ne doit pas être touché)
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

  // === Analyse du fichier ===
  let usesT = false;              // Le fichier utilise t('...')
  let usesGlobalT = false;        // Le fichier utilise (window as any).t
  let hasUseTranslationImport = false;
  let hasTDeclaration = false;    // const { t } = ... déjà quelque part
  let hasTopLevelT = false;       // const t = (key...) => ... (fonction globale)

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
    },
    AssignmentExpression(p) {
      // Détection de (window as any).t = ...
      if (b.isMemberExpression(p.node.left) && b.isIdentifier(p.node.left.property, { name: 't' })) {
        usesGlobalT = true;
      }
    },
    VariableDeclarator(p) {
      if (b.isIdentifier(p.node.id) && p.node.id.name === 't') {
        hasTDeclaration = true;
        // Détection de `const t = (key, opts) => ...`
        if (b.isArrowFunctionExpression(p.node.init) || b.isFunctionExpression(p.node.init)) {
          if (p.scope.parent === null || p.scope.parent.parent === null) hasTopLevelT = true;
        }
      }
    },
  });

  // Si le fichier n'utilise pas t() → on ne touche à rien
  if (!usesT) return;
  // Si le fichier a déjà un `const t = ...` global (comme App.tsx) → on ne touche pas
  if (hasTopLevelT) {
    console.log(`⏭️  ${filePath.replace('./src/', '')} → t global déjà défini`);
    return;
  }
  // Si hasTDeclaration est vrai mais pas topLevelT, c'est peut-être déjà un useTranslation
  if (hasTDeclaration && hasUseTranslationImport) {
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

  // 2. Ajouter `const { t } = useTranslation();` dans le 1er composant
  let inserted = false;

  const declarationToInsert = b.variableDeclaration('const', [
    b.variableDeclarator(
      b.objectPattern([b.objectProperty(b.identifier('t'), b.identifier('t'), false, true)]),
      b.callExpression(b.identifier('useTranslation'), [])
    ),
  ]);

  traverse(ast, {
    // Cas 1 : function MyComponent() { ... }
    FunctionDeclaration(p) {
      if (inserted) return;
      const name = p.node.id?.name;
      if (name && /^[A-Z]/.test(name)) {
        p.node.body.body.unshift(declarationToInsert);
        inserted = true;
      }
    },
    // Cas 2 : export function MyComponent() { ... } (couvert par FunctionDeclaration)
    // Cas 3 : const MyComponent = () => { ... }
    VariableDeclarator(p) {
      if (inserted) return;
      const id = p.node.id;
      const init = p.node.init;
      if (
        b.isIdentifier(id) && /^[A-Z]/.test(id.name) &&
        (b.isArrowFunctionExpression(init) || b.isFunctionExpression(init))
      ) {
        if (b.isBlockStatement(init.body)) {
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
  } else if (usesT && !inserted) {
    console.log(`⚠️  ${filePath.replace('./src/', '')} → utilise t() mais aucun composant trouvé`);
  }
}

console.log('🚀 Analyse des fichiers...\n');
walkFiles(SRC_DIR, processFile);
console.log('\n✨ Terminé !');