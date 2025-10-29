// Moved from src/frontend/src/components/PlaceHolderInput.tsx
// It will be decided later whether InputPage and OutputPage remain in pages/ or move to components/

import { ProjectInputSchema, type ProjectOutput } from "@myorg/shared";
import React from "react";
import Loader from "../components/Loader";
import PlaceHolderOutput from "./OutputPage";
import "../../css/inputPage.css";

const PlaceHolderInput = () => {
  const [loading, setLoading] = React.useState(false);
  const [showOutput, setShowOutput] = React.useState(false);
  //input states, create handlechange?
  const [applicantID, setApplicantID] = React.useState("");
  const [memberID, setMemberID] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [grant, setGrant] = React.useState("");
  const [desc, setDesc] = React.useState("");

  const placeHolderOutput: ProjectOutput = {
  companyEvaluations: [
    {
      businessId: "company-123",
      financialRisk: "medium",
      businessFinlandFundingHistory: "none",
      trafficLight: "yellow",
    },
    {
      businessId: "company-456",
      financialRisk: "low",
      businessFinlandFundingHistory: "high",
      trafficLight: "green",
    },
    {
      businessId: "company-789",
      financialRisk: "high",
      businessFinlandFundingHistory: "low",
      trafficLight: "red",
    },
  ],
  llmProjectAssessment: {
    innovationTrafficLight: "green",
    strategicFitTrafficLight: "yellow",
    feedback: "This is a placeholder feedback for the project.",
  },
};

  /**
   * Will be used to send input to backend API in the future
   * Currently simulates loading state and then shows placeholder output
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input = {
      consortium: {
        leadApplicantBusinessId: applicantID,
        memberBusinessIds: memberID.split(",").map(id => id.trim()),
      },
      project: {
        budget: Number(budget),
        requestedFunding: Number(grant),
        description: desc,
      },
    };

    // Validate input using Zod schema
    const result = ProjectInputSchema.safeParse(input);
    console.log(result);

    // TODO : Send input to backend API when available
    if (result.success) {
      alert("Input is valid!");
    } else {
      alert("Input is invalid. Check console for details.");
    }

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
              value={applicantID}
              placeholder="Lead Applicant Business ID" />
          </div>
          <div className="input-box">
            <input onChange={(e) => setMemberID(e.target.value)} 
              type="text"
              id="memberID-input"
              name="member-business-id"
              value={memberID}
              placeholder="Member Business IDs" />
          </div>
          <div className="input-box">
            <input onChange={(e) => setBudget(e.target.value)} 
              id="budget-input"
              type="text"
              name="project-budget"
              value={budget}
              placeholder="Project Budget" />
          </div>
          <div className="input-box">
            <input onChange={(e) => setGrant(e.target.value)} 
              type="text"
              id="grant-input"
              name="requested-funding"
              value={grant}
              placeholder="Requested Funding" />
          </div>
          <div className="input-box">
            <input onChange={(e) => setDesc(e.target.value)} 
              type="text"
              id="desc-input"
              name="project-desc"
              value={desc}
              placeholder="Project Description" />
          </div>
        </div>
      <button id="submit-btn" type="submit">Submit</button>
      </form>
    </div>
  );
};

export default PlaceHolderInput;
