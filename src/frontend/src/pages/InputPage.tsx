// Moved from src/frontend/src/components/PlaceHolderInput.tsx
// It will be decided later whether InputPage and OutputPage remain in pages/ or move to components/

import { type ProjectInput, ProjectInputSchema, type ProjectOutput } from "@myorg/shared";
import React from "react";
import Loader from "../components/Loader";
import PlaceHolderOutput from "./OutputPage";

const PlaceHolderInput = ({ input }: { input: ProjectInput }) => {
  const [loading, setLoading] = React.useState(false);
  const [showOutput, setShowOutput] = React.useState(false);

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


  /**
   * Will be used to send input to backend API in the future
   * Currently simulates loading state and then shows placeholder output
   */
  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
    setShowOutput(true);
  };

  if (loading) {
    return <Loader message="Processing your input..." />;
  }
  if (showOutput) {
    return <PlaceHolderOutput output={placeHolderOutput} />;
  }


  // UI here is very basic, just for demonstration purposes
  return (
    <div>
      <h2>Project Input</h2>
      <p>
        <strong>Lead Applicant Business ID:</strong>{" "}
        {input.consortium.leadApplicantBusinessId}
      </p>
      <p>
        <strong>Member Business IDs:</strong>{" "}
        {input.consortium.memberBusinessIds.join(", ")}
      </p>
      <p>
        <strong>Project Budget:</strong> {input.project.budget}
      </p>
      <p>
        <strong>Requested Grant:</strong> {input.project.requestedGrant}
      </p>
      <p>
        <strong>Project Description:</strong> {input.project.description}
      </p>
      <h3>Is input data valid?</h3>
      <p>{ProjectInputSchema.safeParse(input).success.toString()}</p>

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default PlaceHolderInput;
