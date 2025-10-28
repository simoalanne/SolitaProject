// Template for now from gpt

//import React, { useState } from "react";
//import { NavLink } from "react-router-dom";
import React from "react";
import "../../css/nav.css"; 
import { NavLink } from "react-router-dom";
//import ReactLogo from "../assets/react-logo.svg";


export const NavBar: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  /*const toggleNav = () => {
    setIsOpen((prev) => !prev);
  };*/

  return (
    <header>
      <button className="nav-toggle" onClick={() => setOpen(prev => !prev)}>Menu</button>
      <nav className={`nav-links ${open ? "open" : ""}`}>
        <NavLink to="/" end className="nav-link">Home</NavLink>
        <NavLink to="/settings" className="nav-link">Settings</NavLink>
        <NavLink to="/about" className="nav-link">About</NavLink>
      </nav>
    </header>
  );
};
  