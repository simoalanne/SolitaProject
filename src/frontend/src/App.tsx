import ReactLogo from "./assets/addImportedAssetsHere.svg";
import { AppRoutes } from "./routes/AppRoutes";

//import PlaceHolderOutput from "./components/PlaceHolderOutput";

const App = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100%",
        textAlign: "center",
        backgroundColor: "#333",
        color: "#f1f1f1",
      }}
    >
      <img src={ReactLogo} className="logo react" alt="React logo" />
      <AppRoutes />
    </div>
  );
};

export default App;