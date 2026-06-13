import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import pt_landingPage from "./pt/tr_LandingPage.json";
import en_landingPage from "./en/tr_LandingPage.json";
import es_landingPage from "./es/tr_LandingPage.json";

import pt_entrar from "./pt/tr_Entrar.json";
import en_entrar from "./en/tr_Entrar.json";
import es_entrar from "./es/tr_Entrar.json";

import pt_criar from "./pt/tr_Criar.json";
import en_criar from "./en/tr_Criar.json";
import es_criar from "./es/tr_Criar.json";

import pt_appArea from "./pt/tr_AppArea.json";
import en_appArea from "./en/tr_AppArea.json";
import es_appArea from "./es/tr_AppArea.json";

import pt_profile from "./pt/tr_Profile.json";
import en_profile from "./en/tr_Profile.json";
import es_profile from "./es/tr_Profile.json";


const STORAGE_KEY = "preferredLanguage";
const SUPPORTED_LANGUAGES = ["pt", "en", "es"];

const normalizeLanguage = (language) => {
  if (!language) {
    return "pt";
  }

  const normalized = language.toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(normalized)) {
    return normalized;
  }

  const baseLanguage = normalized.split("-")[0];
  return SUPPORTED_LANGUAGES.includes(baseLanguage) ? baseLanguage : "pt";
};

const getInitialLanguage = () => {
  if (typeof window === "undefined") {
    return "pt";
  }

  try {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    return normalizeLanguage(savedLanguage);
  } catch {
    return "pt";
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: { 
        translation: { ...pt_landingPage, ...pt_entrar, ...pt_criar, ...pt_appArea, ...pt_profile }
      },
      en: { 
        translation: { ...en_landingPage, ...en_entrar, ...en_criar, ...en_appArea, ...en_profile }
      },
      es: { 
        translation: { ...es_landingPage, ...es_entrar, ...es_criar, ...es_appArea, ...es_profile }
      }
    },
    lng: getInitialLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  }
);

if (typeof window !== "undefined") {
  i18n.on("languageChanged", (language) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, normalizeLanguage(language));
    } catch {
      // Ignore storage errors (private mode, blocked storage, etc.)
    }
  });
}

export default i18n;