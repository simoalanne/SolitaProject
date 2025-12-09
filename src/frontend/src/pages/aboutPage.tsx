import React from "react";
import { useTranslation } from "../i18n/useTranslation";
import "../../css/aboutPage.css";

export const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="about-page">
      <h1>{t("about_title")}</h1>

      <section>
        <h2>{t("about_overview_title")}</h2>
        <p>{t("about_overview")}</p>
        <p>{t("about_overview2")}</p>
      </section>

      <section>
        <h2>{t("about_criteria_title")}</h2>
        <p>{t("about_criteria")}</p>
        <div className="listContainer">
          <ul>
            <li>{t("about_criterialist_profit")}</li>
            <li>{t("about_criterialist_capital")}</li>
            <li>{t("about_criterialist_strategic")}</li>
            <li>{t("about_criterialist_skills")}</li>
          </ul>
        </div>
        <p>{t("about_submitting2")}</p>
      </section>

      <section>
        <h2>{t("about_usage_title")}</h2>
        <div className="listContainer">
          <ol>
            <li>{t("about_usagelist_projectdesc")}</li>
            <li>{t("about_usagelist_businessID")}</li>
            <li>{t("about_usagelist_budget")}</li>
            <li>{t("about_usagelist_companydesc")}</li>
            <li>{t("about_usagelist_kauppalehti")}</li>
            <li>{t("about_usagelist_startup_or_rd")}</li>
            <li>{t("about_usagelist_adding_new_companies")}</li>
          </ol>
        </div>
      </section>
      <section>
        <h2>{t("about_disclaimer")}</h2>
        <p>{t("about_no_affiliation")}</p>
        <p>{t("about_overview3")}</p>
      </section>
      <section>
        <h2>{t("about_other_info")}</h2>
        <p>
          {t("about_open_source")}
          <a
            href="https://github.com/simoalanne/SolitaProject"
            target="_blank"
            rel="noopener noreferrer"
            className="about-link"
          >
            {t("about_open_source_link")}
          </a>
        </p>
      </section>
    </div>
  );
};
