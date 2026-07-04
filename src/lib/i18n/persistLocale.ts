import AsyncStorage from "@react-native-async-storage/async-storage";

import { locales, type Locale } from "./config";
import i18n from "./index";

const STORAGE_KEY = "zaylo_locale_v1";

export async function applyPersistedLocale() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && (locales as readonly string[]).includes(saved) && saved !== i18n.language) {
      await i18n.changeLanguage(saved);
    }
  } catch (error) {
    console.error("Error reading persisted locale:", error);
  }
}

export async function setPersistedLocale(locale: Locale) {
  await i18n.changeLanguage(locale);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, locale);
  } catch (error) {
    console.error("Error persisting locale:", error);
  }
}
