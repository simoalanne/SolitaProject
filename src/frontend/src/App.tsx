import { BrowserRouter } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { AppRoutes } from "./routes/AppRoutes";

//import PlaceHolderOutput from "./components/PlaceHolderOutput";
const App = () => {
  return (
    <BrowserRouter>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#333",
        color: "#f1f1f1",
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