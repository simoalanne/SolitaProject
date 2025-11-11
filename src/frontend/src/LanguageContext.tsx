import React, { createContext, useState, type ReactNode } from "react";

type Language = "fi" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
});

interface LanguageProviderProps {
  children: ReactNode;
}

function readSavedLanguage(): Language {
  try {
    const saved = localStorage.getItem("language") as Language | null;
    return saved ?? "en";
  } catch (e) {
    return "en";
  }
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Synchronously initialize from localStorage to avoid initial render
  // in the wrong language (which caused untranslated validation errors).
  const [language, setLanguageState] = useState<Language>(() => readSavedLanguage());

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("language", lang);
    } catch (e) {
      // ignore localStorage write errors
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
