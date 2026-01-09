// ─── I18N PUBLIC API ────────────────────────────────────────────────────────
// Exports for internationalization support

// Types
export type {
  DataTableStrings,
  DataTableLocale,
  PartialDataTableLocale,
} from "./types";

// Context and hooks
export {
  I18nProvider,
  useI18n,
  createTranslator,
  defaultLocale,
  type I18nContextValue,
} from "./context";

// Locale files and registry
export { enStrings, hiStrings, locales, getLocaleStrings } from "./locales/index";
