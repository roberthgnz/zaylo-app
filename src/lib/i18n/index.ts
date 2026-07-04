import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { defaultLocale, locales, type Locale } from "./config";

import enAuthPage from "./locales/en/AuthPage.json";
import enBagPage from "./locales/en/BagPage.json";
import enCommon from "./locales/en/Common.json";
import enForgotPassword from "./locales/en/ForgotPassword.json";
import enLanguageSelector from "./locales/en/LanguageSelector.json";
import enOnboardingRole from "./locales/en/OnboardingRole.json";
import enOnboardingStep1 from "./locales/en/OnboardingStep1.json";
import enOnboardingStep2 from "./locales/en/OnboardingStep2.json";
import enResetPassword from "./locales/en/ResetPassword.json";
import enStoreBagPage from "./locales/en/StoreBagPage.json";
import esAuthPage from "./locales/es/AuthPage.json";
import esBagPage from "./locales/es/BagPage.json";
import esCommon from "./locales/es/Common.json";
import esForgotPassword from "./locales/es/ForgotPassword.json";
import esLanguageSelector from "./locales/es/LanguageSelector.json";
import esOnboardingRole from "./locales/es/OnboardingRole.json";
import esOnboardingStep1 from "./locales/es/OnboardingStep1.json";
import esOnboardingStep2 from "./locales/es/OnboardingStep2.json";
import esResetPassword from "./locales/es/ResetPassword.json";
import esStoreBagPage from "./locales/es/StoreBagPage.json";

const resources = {
  en: {
    Common: enCommon,
    AuthPage: enAuthPage,
    ForgotPassword: enForgotPassword,
    ResetPassword: enResetPassword,
    OnboardingRole: enOnboardingRole,
    OnboardingStep1: enOnboardingStep1,
    OnboardingStep2: enOnboardingStep2,
    LanguageSelector: enLanguageSelector,
    BagPage: enBagPage,
    StoreBagPage: enStoreBagPage,
  },
  es: {
    Common: esCommon,
    AuthPage: esAuthPage,
    ForgotPassword: esForgotPassword,
    ResetPassword: esResetPassword,
    OnboardingRole: esOnboardingRole,
    OnboardingStep1: esOnboardingStep1,
    OnboardingStep2: esOnboardingStep2,
    LanguageSelector: esLanguageSelector,
    BagPage: esBagPage,
    StoreBagPage: esStoreBagPage,
  },
} as const;

function detectDeviceLocale(): Locale {
  const deviceLanguage = Localization.getLocales()[0]?.languageCode;
  return (locales as readonly string[]).includes(deviceLanguage ?? "")
    ? (deviceLanguage as Locale)
    : defaultLocale;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectDeviceLocale(),
  fallbackLng: defaultLocale,
  ns: [
    "Common",
    "AuthPage",
    "ForgotPassword",
    "ResetPassword",
    "OnboardingRole",
    "OnboardingStep1",
    "OnboardingStep2",
    "LanguageSelector",
    "BagPage",
    "StoreBagPage",
  ],
  defaultNS: "Common",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

export default i18n;
