import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';
const EXCLUDED_PATHS = ['node_modules', 'components/ui', 'locales', '.test.', '.spec.'];

const SKIP_PATTERNS = [
  /^[0-9\s.,;:!?\-+=()\[\]{}*&^%$#@~`'"|\\/<>]+$/,
  /^[a-z0-9_\-\/]+$|^[a-zA-Z0-9_\-\/]+\.[a-zA-Z0-9]+$/,
  /^https?:\/\//,
  /^[A-Z0-9_]+$/,
];

function shouldTranslate(text) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) return false;
  if (!/[a-zA-ZÀ-ÿ]/.test(trimmed)) return false;
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
    } else if (/\.(tsx|jsx|ts|js)$/.test(entry.name)) {
      callback(fullPath);
    }
  }
}

const extractedTexts = new Set();

walkFiles(SRC_DIR, (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 1. Recherche des textes entre balises JSX (>Mon Texte<)
  const jsxTextMatches = content.match(/>([^<]+)</g);
  if (jsxTextMatches) {
    jsxTextMatches.forEach(match => {
      const text = match.slice(1, -1);
      if (shouldTranslate(text)) extractedTexts.add(text.trim());
    });
  }

  // 2. Recherche des chaînes dans t("...") ou t('...')
  const tMatches = content.match(/\bt\(\s*["']([^"']+)["']\s*\)/g);
  if (tMatches) {
    tMatches.forEach(match => {
      const inner = match.match(/["']([^"']+)["']/);
      if (inner && inner[1] && shouldTranslate(inner[1])) {
        extractedTexts.add(inner[1].trim());
      }
    });
  }
});

// Écriture dans un fichier texte brut
const sortedTexts = Array.from(extractedTexts).sort();
fs.writeFileSync('extracted_texts.txt', sortedTexts.join('\n\n---NEXT---\n\n'), 'utf-8');

console.log(`✅ ${sortedTexts.length} textes uniques extraits dans extracted_texts.txt !`);
