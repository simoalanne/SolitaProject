import React, { createContext, useState, useEffect, type ReactNode } from "react";

// Define the shape of the context
interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

// Provide default values
export const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

// Define props for the provider
interface ThemeProviderProps {
  children: ReactNode;
}

export const GetCurrentTheme = (): "light" | "dark" => {
  return (localStorage.getItem("theme") as "light" | "dark") || "light";
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<"light" | "dark">(GetCurrentTheme());

  // Load theme from localStorage if available
  useEffect(() => {
    const savedTheme = GetCurrentTheme();
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
