import en from './translations/en.json';
import km from './translations/km.json';

export type Language = 'en' | 'km';

const translations: Record<Language, typeof en> = {
  en,
  km,
};

/**
 * Get current language from localStorage or browser preference
 */
export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'km'; // Server-side default - KHMER FIRST
  }

  // Check localStorage first
  const stored = localStorage.getItem('language');
  if (stored === 'en' || stored === 'km') {
    return stored;
  }

  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'km') {
    return 'km';
  }

  return 'km'; // Default fallback - KHMER FIRST
}

/**
 * Set language and save to localStorage
 */
export function setLanguage(language: Language) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', language);
  }
}

/**
 * Navigate nested translation object using dot notation
 * Example: t('dashboard.student') -> "Student Dashboard"
 */
function getNestedTranslation(obj: any, path: string, defaultValue: string = ''): string {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue || path;
    }
  }

  return typeof current === 'string' ? current : defaultValue || path;
}

/**
 * Main translation function
 * Usage: t('dashboard.student')
 */
export function t(key: string, language?: Language): string {
  const lang = language || getCurrentLanguage();
  const translation = translations[lang] || translations['km']; // Khmer fallback
  return getNestedTranslation(translation, key, key);
}

/**
 * Format date to locale string
 */
export function formatDate(date: Date | string, language?: Language): string {
  const lang = language || getCurrentLanguage();
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleDateString(lang === 'km' ? 'km-KH' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time ago (relative time)
 */
export function formatTimeAgo(date: Date | string, language?: Language): string {
  const lang = language || getCurrentLanguage();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return t('time.justNow', lang);
  }
  if (minutes < 60) {
    return `${minutes}${t('time.minutesAgo', lang)}`;
  }
  if (hours < 24) {
    return `${hours}${t('time.hoursAgo', lang)}`;
  }
  if (days < 7) {
    return `${days}${t('time.daysAgo', lang)}`;
  }

  return formatDate(dateObj, lang);
}

/**
 * Format number as Khmer or English numerals
 */
export function formatNumber(num: number, language?: Language): string {
  const lang = language || getCurrentLanguage();

  if (lang === 'km') {
    const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return num
      .toString()
      .split('')
      .map((digit) => {
        const d = parseInt(digit);
        return isNaN(d) ? digit : khmerDigits[d];
      })
      .join('');
  }

  return num.toString();
}

/**
 * Get month name
 */
export function getMonthName(
  monthIndex: number,
  format: 'long' | 'short' = 'long',
  language?: Language
): string {
  const lang = language || getCurrentLanguage();
  const key = format === 'long' ? 'date.monthsLong' : 'date.monthsShort';
  const months = getNestedTranslation(translations[lang], key, '').split(',');

  return months[monthIndex] || '';
}

/**
 * Get day name
 */
export function getDayName(dayIndex: number, format: 'long' | 'short' = 'long', language?: Language): string {
  const lang = language || getCurrentLanguage();
  const key = format === 'long' ? 'date.daysLong' : 'date.daysShort';

  const translation = translations[lang];
  if (key === 'date.daysLong') {
    return (translation.date.daysLong as any)[dayIndex] || '';
  } else {
    return (translation.date.daysShort as any)[dayIndex] || '';
  }
}

/**
 * Check if language is RTL (right-to-left)
 * FIXED: Khmer is LTR, NOT RTL
 */
export function isRTL(language?: Language): boolean {
  return false; // Both English and Khmer are left-to-right
}

/**
 * Get HTML dir attribute
 * FIXED: Khmer is LTR, NOT RTL
 */
export function getDir(language?: Language): 'ltr' | 'rtl' {
  return 'ltr'; // Both English and Khmer are left-to-right
}

/**
 * Get language name in that language
 */
export function getLanguageName(language: Language): string {
  const names: Record<Language, string> = {
    en: 'English',
    km: 'ខ្មែរ',
  };
  return names[language];
}

export default {
  t,
  getCurrentLanguage,
  setLanguage,
  formatDate,
  formatTimeAgo,
  formatNumber,
  getMonthName,
  getDayName,
  isRTL,
  getDir,
  getLanguageName,
};
