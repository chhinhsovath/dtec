'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentLanguage,
  setLanguage,
  t as translate,
  Language,
  formatDate,
  formatNumber,
  formatTimeAgo,
  getLanguageName,
} from './i18n';

/**
 * React hook for using translations in client components
 *
 * Usage:
 * const { t, language, changeLanguage } = useTranslation();
 * <div>{t('dashboard.welcome')}</div>
 */
export function useTranslation() {
  const [language, setCurrentLanguage] = useState<Language>('km');
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize language from localStorage on client side only
  useEffect(() => {
    const lang = getCurrentLanguage();
    setCurrentLanguage(lang);
    setIsLoaded(true);
  }, []);

  // Translate function
  const t = useCallback(
    (key: string, fallback?: string): string => {
      return translate(key, language) || fallback || key;
    },
    [language]
  );

  // Change language and trigger reload to apply globally
  const changeLanguage = useCallback((newLanguage: Language) => {
    setLanguage(newLanguage);
    setCurrentLanguage(newLanguage);

    // Dispatch custom event for other listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('languageChange', { detail: { language: newLanguage } })
      );
    }

    // Reload page to apply translations everywhere
    window.location.reload();
  }, []);

  // Format functions with current language
  const format = useCallback(
    {
      date: (date: Date | string) => formatDate(date, language),
      number: (num: number) => formatNumber(num, language),
      timeAgo: (date: Date | string) => formatTimeAgo(date, language),
      languageName: (lang: Language) => getLanguageName(lang),
    },
    [language]
  );

  return {
    t,
    language,
    changeLanguage,
    isLoaded,
    format,
  };
}

/**
 * Type-safe translation hook variant for specific translation keys
 * Use this when you want better IDE autocomplete
 */
export function useTranslationTyped() {
  const { t, ...rest } = useTranslation();
  return {
    t: (key: string) => t(key),
    ...rest,
  };
}
