// Moved from src/frontend/src/components/PlaceHolderInput.tsx
// It will be decided later whether InputPage and OutputPage remain in pages/ or move to components/

import { type ProjectInput, ProjectInputSchema, type ProjectOutput } from "@myorg/shared";
import React from "react";
import Loader from "../components/Loader";
import PlaceHolderOutput from "./OutputPage";
import '../inputPage.css';

const PlaceHolderInput = ({ input }: { input: ProjectInput }) => {
  const [loading, setLoading] = React.useState(false);
  const [showOutput, setShowOutput] = React.useState(false);
  //input states, create handlechange?
  const [applicantID, setApplicantID] = React.useState("");
  const [memberID, setMemberID] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [grant, setGrant] = React.useState("");
  const [desc, setDesc] = React.useState("");


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
    <div className="form">
      <form onSubmit={handleSubmit}>
        <h2>Project Input</h2>
        <div className="inputs-grid">
          <div className="input-box">
            <input onChange={(e) => setApplicantID(e.target.value)}
              type="text"
              id="applicantID-input"
              name="applicant-business-id"
            //value = {input.consortium.leadApplicantBusinessId}
            //input is in form 010823-3
              value={applicantID}
              placeholder="Lead Applicant Business ID" />
          </div>
          <div className="input-box">
            <input onChange={(e) => setMemberID(e.target.value)} 
              type="text"
              id="memberID-input"
              name="member-business-id"
            //value = {input.consortium.memberBusinessIds.join(", ")}
              value={memberID}
              placeholder="Member Business IDs" />
          </div>
          <div className="input-box">
            <input onChange={(e) => setBudget(e.target.value)} 
              id="budget-input"
              type="text"
              name="project-budget"
            // value = {input.project.budget}
              value={budget}
              placeholder="Project Budget" />
          </div>
          <div className="input-box">
            <input onChange={(e) => setGrant(e.target.value)} 
              type="text"
              id="grant-input"
              name="requested-grant"
            // value = {input.project.requestedGrant}
              value={grant}
              placeholder="Requested Grant" />
          </div>
          <div className="input-box">
            <input onChange={(e) => setDesc(e.target.value)} 
              type="text"
              id="desc-input"
              name="project-desc"
            //value = {input.project.description}
              value={desc}
              placeholder="Project Description" />
          </div>
        </div>
        <h3>Is input data valid?</h3>
        <p>{ProjectInputSchema.safeParse(input).success.toString()}</p>

      <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default PlaceHolderInput;
