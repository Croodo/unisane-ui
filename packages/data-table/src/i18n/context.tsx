"use client";

import React, { createContext, useContext, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import type { DataTableStrings, DataTableLocale, PartialDataTableLocale } from "./types";
import { enStrings } from "./locales/en";

// ─── DEFAULT LOCALE ─────────────────────────────────────────────────────────

const defaultLocale: DataTableLocale = {
  locale: "en",
  strings: enStrings,
};

// ─── CONTEXT ────────────────────────────────────────────────────────────────

interface I18nContextValue {
  /** Current locale identifier */
  locale: string;
  /** All translation strings */
  strings: DataTableStrings;
  /** Get a translated string with optional interpolation */
  t: (key: keyof DataTableStrings, params?: Record<string, string | number>) => string;
  /** Format a number using locale settings */
  formatNumber: (value: number) => string;
  /** Format a date using locale settings */
  formatDate: (value: Date) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ─── PROVIDER ───────────────────────────────────────────────────────────────

interface I18nProviderProps {
  children: ReactNode;
  /** Locale configuration (full or partial) */
  locale?: PartialDataTableLocale;
}

/**
 * Interpolate placeholders in a string
 * Supports {key} syntax for replacements
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * I18n Provider for DataTable
 *
 * Provides translation functions and locale-aware formatting.
 *
 * @example
 * ```tsx
 * // Using default English
 * <I18nProvider>
 *   <DataTable ... />
 * </I18nProvider>
 *
 * // With custom strings
 * <I18nProvider locale={{
 *   locale: "es",
 *   strings: {
 *     noResults: "Sin resultados",
 *     loading: "Cargando...",
 *   }
 * }}>
 *   <DataTable ... />
 * </I18nProvider>
 * ```
 */
export function I18nProvider({ children, locale: customLocale }: I18nProviderProps) {
  // Merge custom locale with defaults
  const mergedLocale = useMemo<DataTableLocale>(() => {
    if (!customLocale) return defaultLocale;

    return {
      locale: customLocale.locale ?? defaultLocale.locale,
      strings: {
        ...defaultLocale.strings,
        ...customLocale.strings,
      },
      numberFormat: customLocale.numberFormat ?? defaultLocale.numberFormat,
      dateFormat: customLocale.dateFormat ?? defaultLocale.dateFormat,
    };
  }, [customLocale]);

  // Translation function with interpolation
  const t = useCallback(
    (key: keyof DataTableStrings, params?: Record<string, string | number>): string => {
      const template = mergedLocale.strings[key];
      return interpolate(template, params);
    },
    [mergedLocale.strings]
  );

  // Number formatting
  const formatNumber = useCallback(
    (value: number): string => {
      return new Intl.NumberFormat(mergedLocale.locale, mergedLocale.numberFormat).format(value);
    },
    [mergedLocale.locale, mergedLocale.numberFormat]
  );

  // Date formatting
  const formatDate = useCallback(
    (value: Date): string => {
      return new Intl.DateTimeFormat(mergedLocale.locale, mergedLocale.dateFormat).format(value);
    },
    [mergedLocale.locale, mergedLocale.dateFormat]
  );

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale: mergedLocale.locale,
      strings: mergedLocale.strings,
      t,
      formatNumber,
      formatDate,
    }),
    [mergedLocale.locale, mergedLocale.strings, t, formatNumber, formatDate]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

// ─── HOOK ───────────────────────────────────────────────────────────────────

/**
 * Hook to access i18n context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t, formatNumber } = useI18n();
 *
 *   return (
 *     <div>
 *       <span>{t("noResults")}</span>
 *       <span>{t("selectedCount", { count: 5 })}</span>
 *       <span>{formatNumber(1234.56)}</span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  // If no provider, return default locale with functions
  // This allows components to work without explicit provider
  if (!context) {
    return {
      locale: defaultLocale.locale,
      strings: defaultLocale.strings,
      t: (key, params) => interpolate(defaultLocale.strings[key], params),
      formatNumber: (value) => new Intl.NumberFormat(defaultLocale.locale).format(value),
      formatDate: (value) => new Intl.DateTimeFormat(defaultLocale.locale).format(value),
    };
  }

  return context;
}

// ─── STANDALONE HELPER ──────────────────────────────────────────────────────

/**
 * Create a translation function for use outside React components
 * Useful for utility functions that need i18n
 */
export function createTranslator(strings: Partial<DataTableStrings> = {}) {
  const mergedStrings = { ...defaultLocale.strings, ...strings };

  return (key: keyof DataTableStrings, params?: Record<string, string | number>): string => {
    const template = mergedStrings[key];
    return interpolate(template, params);
  };
}

// ─── EXPORTS ────────────────────────────────────────────────────────────────

export { defaultLocale };
export type { I18nContextValue };
