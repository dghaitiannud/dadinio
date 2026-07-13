import fs from 'fs';
import path from 'path';

// Charge ton fichier de référence
const frJson = JSON.parse(fs.readFileSync('./src/locales/fr.json', 'utf8'));

// On crée une liste plate de correspondances : "Texte en dur" -> "clé.i18n"
const textMap = {};
function flattenJson(obj, prefix = '') {
  for (let key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object') {
      flattenJson(obj[key], fullKey);
    } else {
      // Nettoyage rapide pour la correspondance
      const cleanText = obj[key].trim().replace(/\s+/g, ' ');
      if (cleanText.length > 2) {
        textMap[cleanText] = fullKey;
      }
    }
  }
}
flattenJson(frJson);

// Trie les textes du plus long au plus court (évite de casser les expressions)
const sortedTexts = Object.keys(textMap).sort((a, b) => b.length - a.length);

const pagesDir = './src/pages';
const componentsDir = './src/components';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanged = false;

  sortedTexts.forEach(text => {
    // Échappe les caractères spéciaux regex
    const escapedText = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    // 1. Cherche le texte brut entre balises : >Texte<
    const htmlRegex = new RegExp(`>\\s*${escapedText}\\s*<`, 'g');
    if (htmlRegex.test(content)) {
      content = content.replace(htmlRegex, `>{t('${textMap[text]}')}<`);
      hasChanged = true;
    }

    // 2. Cherche le texte dans les placeholders ou attributs : placeholder="Texte"
    const attrRegex = new RegExp(`=\\s*["']\\s*${escapedText}\\s*["']`, 'g');
    if (attrRegex.test(content)) {
      content = content.replace(attrRegex, `={t('${textMap[text]}')}`);
      hasChanged = true;
    }
  });

  // Si le fichier a été modifié, on injecte l'import du hook en haut si absent
  if (hasChanged) {
    if (!content.includes('useTranslation')) {
      content = `import { useTranslation } from "react-i18next";\n` + content;
    }
    // Injecte la fonction t au début du composant fonctionnel principal
    content = content.replace(
      /(export\s+function\s+\w+\s*\(.*?\)\s*\{|const\s+\w+\s*=\s*\(.*?\)\s*=>\s*\{)/,
      `$1\n  const { t } = useTranslation();`
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Traduit automatiquement : ${filePath}`);
  }
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(fullPath);
    }
  });
}

console.log("Lancement du script de remplacement automatique...");
scanDir(pagesDir);
scanDir(componentsDir);
console.log(" Terminé ! Vérifie tes fichiers.");
