import { createContext, useContext, useState, type ReactNode } from 'react';
import { t, type Lang } from '../lib/i18n';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  tr: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('sh-lang') as Lang | null;
    return saved || 'en';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('sh-lang', l);
  };

  const tr = (key: string) => t(lang, key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
