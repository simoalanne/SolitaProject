// Moved from src/frontend/src/components/PlaceHolderInput.tsx
// It will be decided later whether InputPage and OutputPage remain in pages/ or move to components/

import { ProjectInputSchema, type ProjectOutput } from "@myorg/shared";
import React from "react";
import Loader from "../components/Loader";
import PlaceHolderOutput from "./OutputPage";
import "../../css/inputPage.css";


const PlaceHolderInput = () => {

  // For adding more user inputs
  /* NOTE 
   budget and grant are str so that placeholder can be seen 
   parse in submit!*/
  type Copy = {
    id: string;
    applicantID: string;
    memberID: string;
    budget: string;
    grant: string;
  };


  const [loading, setLoading] = React.useState(false);
  const [showOutput, setShowOutput] = React.useState(false);
  // input states
  const [applicantID, setApplicantID] = React.useState("");
  const [memberID, setMemberID] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [grant, setGrant] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [copies, setCopies] = React.useState<Copy[]>([]);


  // makeId needed for react only
  const idRef = React.useRef(1);
  const makeId = () => String(idRef.current++);

  // User can add more inputs
  const addInputCopy = () => {
    const newCopy: Copy = {
      id: makeId(),
      applicantID: "",
      memberID:"",
      budget: "",
      grant: "",
    };
    //returns new array, 
    setCopies(prev => [...prev, newCopy]); 
  };

  //find copy obj with id
  const updateCopyField = (id: string, field: keyof Omit<Copy, 'id'>, value: string) => {
    setCopies(prev => 
      prev.map(c =>
         c.id === id ? { ...c, [field]: value } : c));
  };

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

    //og input values
    const input = {
      consortium: {
        leadApplicantBusinessId: applicantID,
        memberBusinessIds: memberID.split(",").map(id => id.trim()),
      },
      project: {
        budget: Number(budget),
        requestedFunding: Number(grant),
        description: desc,
      }
    };

    // turn copies into form that backend expects
    const copyInput = copies.map(c => {
      return {
        consortium: {
          leadApplicantBusinessId: c.applicantID,
          memberBusinessIds: c.memberID ? c.memberID.split(",").map(id => id.trim()).filter(Boolean) : [],
        },
        project: {
          budget: Number(c.budget),
          requestedFunding: Number(c.grant),
          // is desc rly needed here? 
          description: ""
        }
      };
    });

    // Validate input using Zod schema
    const result = ProjectInputSchema.safeParse(input);
    console.log(result);
    const copiesValidation = ProjectInputSchema.safeParse(copyInput)
    console.log(copiesValidation)

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
              placeholder="Member Business ID" />
          </div>
          <div className="input-box">
            <input onChange={(e) => setBudget(e.target.value)} 
              id="budget-input"
              type="number"
              name="project-budget"
              value={budget}
              placeholder="Project Budget" />
          </div>
          <div className="input-box">
            <input onChange={(e) => setGrant(e.target.value)} 
              type="number"
              id="grant-input"
              name="requested-funding"
              value={grant}
              placeholder="Requested Funding" />
          </div>
          {copies.map((c) => (
            <React.Fragment key={c.id}>
              <div className="inputs-grid-copy">
                <div className="input-box">
                  <input
                    value={c.applicantID} onChange={(e) => updateCopyField(c.id, "applicantID", e.target.value)}
                    type="text"
                    id={`applicantID-${c.id}`}
                    name="applicant-business-id"
                    placeholder="Lead Applicant Business ID"/>
                </div>
                <div className="input-box">
                  <input value={c.memberID} onChange={(e) => updateCopyField(c.id, "memberID", e.target.value)}
                    type="text"
                    id={`memberID-${c.id}`}
                    name="member-business-id"
                    placeholder="Member Business ID" />
                </div>
                <div className="input-box">
                  <input value={c.budget} onChange={(e) => updateCopyField(c.id, "budget", e.target.value)}
                    type="number"
                    id={`budget-${c.id}`}
                    name="budget-id"
                    placeholder="Project Budget" />
                </div>
                <div className="input-box">
                  <input value={c.grant} onChange={(e) => updateCopyField(c.id, "grant", e.target.value)}
                    type="number"
                    id={`grant-${c.id}`}
                    name="grant-id"
                    placeholder="Requested Funding" />
                </div>
              </div>
            </React.Fragment>
          ))}
          <div className="input-box desc-box">
            <input onChange={(e) => setDesc(e.target.value)} 
              type="text"
              id="desc-input"
              name="project-desc"
              value={desc}
              placeholder="Project Description" />
          </div>
        </div>
        <div className="buttons">
          <button type="button" id="add-btn" onClick={addInputCopy}>+</button>
          <button id="submit-btn" type="submit">Submit</button>
        </div>
      </form>
    </div>
  );
};

export default PlaceHolderInput;
