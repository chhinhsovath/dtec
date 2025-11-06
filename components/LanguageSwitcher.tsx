'use client';

import { useState, useEffect } from 'react';
import { getCurrentLanguage, setLanguage, getLanguageName, Language } from '@/lib/i18n/i18n';

export default function LanguageSwitcher() {
  const [language, setCurrentLanguage] = useState<Language>('en');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCurrentLanguage(getCurrentLanguage());
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setCurrentLanguage(lang);
    setIsOpen(false);
    // Trigger page reload or state update for translations
    window.location.reload();
  };

  const languages: Language[] = ['en', 'km'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        <span className="text-lg">🌐</span>
        <span className="font-semibold text-gray-700">{getLanguageName(language)}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition ${
                language === lang ? 'bg-blue-50 border-l-4 border-blue-600 font-semibold' : ''
              } ${lang === 'en' ? 'border-t border-gray-200' : ''}`}
            >
              <span className="mr-2">{lang === 'en' ? '🇬🇧' : '🇰🇭'}</span>
              {getLanguageName(lang as Language)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
