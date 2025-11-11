import { useContext, useCallback } from "react";
import { LanguageContext } from "../LanguageContext";
import { translations, type TranslationKey } from "./translations";

// Simple interpolation helper: replace {var} placeholders with provided vars
const interpolate = (template: string, vars?: Record<string, string | number>) => {
  if (!vars) return template;
  return template.replace(/\{([^}]+)\}/g, (_, k) => {
    const val = vars[k];
    return val === undefined ? `{${k}}` : String(val);
  });
};

export const useTranslation = () => {
  const { language } = useContext(LanguageContext);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const lang = (language as keyof typeof translations) || "en";
      const val = translations[lang]?.[key] ?? translations["en"][key];
      if (!val) return key;
      return interpolate(val as string, vars);
    },
    [language]
  );

  return { t, language } as const;
};

export default useTranslation;
