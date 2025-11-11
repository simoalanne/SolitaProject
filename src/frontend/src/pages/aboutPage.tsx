import React from "react";
import { useTranslation } from "../i18n/useTranslation";

export const AboutPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div>
            <h1>{t("about")}</h1>
            <p>{t("about_description")}</p>
        </div>
    );
};