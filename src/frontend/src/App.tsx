import { BrowserRouter } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { AppRoutes } from "./routes/AppRoutes";
// Theme is applied via CSS variables (index.css) which read the document data-theme attribute.
// App no longer needs to read ThemeContext for color; ThemeContext still controls the attribute.

//import PlaceHolderOutput from "./components/PlaceHolderOutput";
const App = () => {
  // colors are handled by CSS variables --bg-color and --text-color
  const backgroundColor = "var(--bg-color)";
  const color = "var(--text-color)";

  return (
    <BrowserRouter>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          width: "100%",
          backgroundColor,
          color,
        }}
      >

        {/* Navbar at top */}
        <NavBar />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <AppRoutes />
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;