// Template for now from gpt

//import React, { useState } from "react";
//import { NavLink } from "react-router-dom";
import React from "react";
import "../../css/nav.css"; 
import { NavLink } from "react-router-dom";
import { useTranslation } from "../i18n/useTranslation";
//import ReactLogo from "../assets/react-logo.svg";


export const NavBar: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();

  /*const toggleNav = () => {
    setIsOpen((prev) => !prev);
  };*/

  return (
    <header>
  <button className="nav-toggle" onClick={() => setOpen(prev => !prev)}>{t("menu")}</button>
      <nav className={`nav-links ${open ? "open" : ""}`}>
        <NavLink to="/" end className="nav-link">{t("home")}</NavLink>
        <NavLink to="/settings" className="nav-link">{t("settings")}</NavLink>
        <NavLink to="/about" className="nav-link">{t("about")}</NavLink>
      </nav>
    </header>
  );
};
  