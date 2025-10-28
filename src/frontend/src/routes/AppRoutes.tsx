import { Routes, Route } from "react-router-dom";
import InputPage from "../pages/InputPage";
import { SettingsPage } from "../pages/settingsPage";
import { AboutPage } from "../pages/aboutPage";


export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<InputPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/about" element={<AboutPage />} />
        </Routes>
    );
};