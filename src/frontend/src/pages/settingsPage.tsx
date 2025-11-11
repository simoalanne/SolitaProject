import React, { useContext } from "react";
import { ThemeContext } from "../ThemeContext.tsx";
import { LanguageContext } from "../LanguageContext";
import { useTranslation } from "../i18n/useTranslation";
import "../../css/settingsPage.css";

export const SettingsPage: React.FC = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { language, setLanguage } = useContext(LanguageContext);
    const { t } = useTranslation();

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value as "fi" | "en";
        setLanguage(val);
    };

    return (
        <div className="settings-page">
            <h1>{t("settings")}</h1>
            <p>{t("settings_description")}</p>

            <section className="settings-section">
                <label className="toggle-label">
                    <input
                        type="checkbox"
                        className="toggle-checkbox"
                        checked={theme === "dark"}
                        onChange={() => toggleTheme()}
                        aria-label="Toggle dark mode"
                    />
                    <span>{t("dark_mode")}</span>
                </label>
            </section>

            <section className="settings-section">
                <label className="select-label">{t("language")}</label>
                <select
                    className="language-select"
                    value={language}
                    onChange={handleLanguageChange}
                    aria-label="Select language"
                >
                    <option value="fi">{t("finnish")}</option>
                    <option value="en">{t("english")}</option>
                </select>
            </section>
        </div>
    );
};

export default SettingsPage;