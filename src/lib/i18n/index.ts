import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { defaultLocale, locales, type Locale } from "./config";

import enAuthPage from "./locales/en/AuthPage.json";
import enCommon from "./locales/en/Common.json";
import enForgotPassword from "./locales/en/ForgotPassword.json";
import enResetPassword from "./locales/en/ResetPassword.json";
import esAuthPage from "./locales/es/AuthPage.json";
import esCommon from "./locales/es/Common.json";
import esForgotPassword from "./locales/es/ForgotPassword.json";
import esResetPassword from "./locales/es/ResetPassword.json";

const resources = {
  en: {
    Common: enCommon,
    AuthPage: enAuthPage,
    ForgotPassword: enForgotPassword,
    ResetPassword: enResetPassword,
  },
  es: {
    Common: esCommon,
    AuthPage: esAuthPage,
    ForgotPassword: esForgotPassword,
    ResetPassword: esResetPassword,
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
  ns: ["Common", "AuthPage", "ForgotPassword", "ResetPassword"],
  defaultNS: "Common",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

export default i18n;
