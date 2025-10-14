import { type ProjectInput, type ProjectOutput } from "@myorg/shared"; // Shared types/validation can be imported like this
import ReactLogo from "./assets/addImportedAssetsHere.svg";
import PlaceHolderInput from "./components/PlaceHolderInput";
import PlaceHolderOutput from "./components/PlaceHolderOutput";

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

  const placeHolderOutput: ProjectOutput = {
    success: {
      successProbability: 0.75,
      trafficLight: "yellow",
    },
    companyRisks: {
      "1234567-8": {
        financialRisk: "medium",
        businessFinlandFundingHistory: "none",
      },
      "2345678-9": {
        financialRisk: "low",
        businessFinlandFundingHistory: "low",
      },
      "3456789-0": {
        financialRisk: "high",
        businessFinlandFundingHistory: "high",
      },
    },
    llmFeedback: "This is some feedback from the LLM.",
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
        <PlaceHolderOutput output={placeHolderOutput} />
      </div>
    </>
  );
};

export default App;
