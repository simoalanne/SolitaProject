import { type ProjectInput} from "@myorg/shared"; // Shared types/validation can be imported like this
import ReactLogo from "./assets/addImportedAssetsHere.svg";
import PlaceHolderInput from "./pages/InputPage";

//import PlaceHolderOutput from "./components/PlaceHolderOutput";

// Replace this with actual frontend code
const App = () => {
  
  const placeHolderInput: ProjectInput = {
    consortium: {
      leadApplicantBusinessId: "0108023-3",
      memberBusinessIds: [],
    },
    project: {
      budget: 1000000,
      requestedGrant: 50000,
      description: "Description of the project",
    },
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100%",
          textAlign: "center",
          backgroundColor: "#333",
          color: "#f1f1f1",
        }}
      >
        <img src={ReactLogo} className="logo react" alt="React logo" />
        <h1>Placeholder for Frontend</h1>
        <PlaceHolderInput input={placeHolderInput} />
      </div>
    </>
  );
};

export default App;
