import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importation directe des fichiers JSON pour que Vercel les intègre proprement au build
import translationFR from './locales/fr.json';
import translationHT from './locales/ht.json';
import translationEN from './locales/en.json';
import translationES from './locales/es.json';

const resources = {
  fr: { translation: translationFR },
  ht: { translation: translationHT },
  en: { translation: translationEN },
  es: { translation: translationES }
};

i18n
  // Détecte automatiquement la langue du navigateur de l'utilisateur
  .use(LanguageDetector)
  // Connecte i18next à React
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr', // Langue par défaut si celle de l'utilisateur n'est pas dispo
    interpolation: {
      escapeValue: false // React protège déjà déjà contre les attaques XSS
    },
    detection: {
      order: ['localStorage', 'navigator'], // Regarde d'abord si l'utilisateur a choisi une langue, sinon prend celle du téléphone
      caches: ['localStorage'] // Sauvegarde le choix pour les prochaines visites
    }
  });

export default i18n;
