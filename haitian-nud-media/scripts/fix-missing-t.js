import fs from 'fs';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as b from '@babel/types';

const traverse = traverseModule.default || traverseModule;
const generate = generateModule.default || generateModule;

const FILES = [
  'src/components/LanguageSwitcher.tsx',
  'src/components/admin/stats-cards.tsx',
  'src/components/player/hybrid-video-player.tsx',
  'src/components/pwa-install.tsx',
  'src/pages/vip-catalog.tsx',
];

for (const filePath of FILES) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Fichier manquant : ${filePath}`);
    continue;
  }

  const code = fs.readFileSync(filePath, 'utf-8');
  let ast;
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  } catch (e) {
    console.error(`❌ ${filePath}: ${e.message}`);
    continue;
  }

  let hasImport = false;
  let importIndex = -1;

  traverse(ast, {
    ImportDeclaration(p) {
      if (p.node.source.value === 'react-i18next') {
        p.node.specifiers.forEach(spec => {
          if (b.isImportSpecifier(spec) && spec.imported.name === 'useTranslation') {
            hasImport = true;
          }
        });
      }
      importIndex = ast.program.body.indexOf(p.node);
    },
  });

  let modified = false;

  if (!hasImport) {
    const importDecl = b.importDeclaration(
      [b.importSpecifier(b.identifier('useTranslation'), b.identifier('useTranslation'))],
      b.stringLiteral('react-i18next')
    );
    if (importIndex >= 0) {
      ast.program.body.splice(importIndex + 1, 0, importDecl);
    } else {
      ast.program.body.unshift(importDecl);
    }
    modified = true;
  }

  const addedHooks = new Set();
  const isComponentName = (name) => name && /^[A-Z]/.test(name);

  const hasHookAlready = (body) => {
    return body.body.some(stmt =>
      b.isVariableDeclaration(stmt) &&
      stmt.declarations.some(d =>
        d.init && b.isCallExpression(d.init) &&
        b.isIdentifier(d.init.callee, { name: 'useTranslation' })
      )
    );
  };

  const declarationToInsert = () =>
    b.variableDeclaration('const', [
      b.variableDeclarator(
        b.objectPattern([b.objectProperty(b.identifier('t'), b.identifier('t'), false, true)]),
        b.callExpression(b.identifier('useTranslation'), [])
      ),
    ]);

  traverse(ast, {
    FunctionDeclaration(p) {
      if (!isComponentName(p.node.id?.name)) return;
      if (hasHookAlready(p.node.body)) return;
      p.node.body.body.unshift(declarationToInsert());
      addedHooks.add(p.node.id.name);
      modified = true;
    },

    VariableDeclarator(p) {
      if (!isComponentName(p.node.id?.name)) return;
      const init = p.node.init;
      if (!init) return;
      if (!b.isArrowFunctionExpression(init) && !b.isFunctionExpression(init)) return;
      if (!b.isBlockStatement(init.body)) return;
      if (hasHookAlready(init.body)) return;
      init.body.body.unshift(declarationToInsert());
      addedHooks.add(p.node.id.name);
      modified = true;
    },
  });

  if (modified) {
    const output = generate(ast, { retainLines: true, jsescOption: { minimal: true } }, code);
    fs.writeFileSync(filePath, output.code);
    console.log(`✅ ${filePath} → hooks ajoutés : ${[...addedHooks].join(', ') || 'import seulement'}`);
  } else {
    console.log(`⏭️  ${filePath} → déjà OK`);
  }
}

console.log('\n✨ Terminé ! Lance npm run typecheck');

