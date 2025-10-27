import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import InputPage from "../pages/InputPage";
import { SettingsPage } from "../pages/settingsPage";
import { AboutPage } from "../pages/aboutPage";


export const AppRoutes = () => {
    return (
    <Router>
        <Routes>
            {/* InputPage will be the default route */}
            <Route path="/" element={<InputPage />} />
            <Route path="/Settings" element={<SettingsPage />} />
            <Route path="/About" element={<AboutPage />} />
        </Routes>
    </Router>
    );
};