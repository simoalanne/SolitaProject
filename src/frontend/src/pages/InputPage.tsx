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
    memberID: string;
    budget: string;
    grant: string;
    desc: string;
  };


  const [loading, setLoading] = React.useState(false);
  const [showOutput, setShowOutput] = React.useState(false);
  // input states
  //delete memberID when ensured it is not needed
  const [applicantID, setApplicantID] = React.useState("");
  //const [memberID, setMemberID] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [grant, setGrant] = React.useState("");
  const [projectDesc, setProjectDesc] = React.useState("")
  const [desc, setDesc] = React.useState("");
  const [copies, setCopies] = React.useState<Copy[]>([]);


  // makeId needed for react only
  const idRef = React.useRef(1);
  const makeId = () => String(idRef.current++);

  // User can add more inputs
  const addInputCopy = () => {
    const newCopy: Copy = {
      id: makeId(),
      memberID:"",
      budget: "",
      grant: "",
      desc: ""
    };
    //returns new array
    setCopies(prev => [...prev, newCopy]); 
  };

  //delete inputs
  const deleteInputCopy = (id: string) => {
    //create new array with copies whose id is NOT here
    setCopies(prev => prev.filter(c => c.id !== id));
  }

  // Update one field of a copy (found by id)
  // Creates a new copies array where only the matching copy is replaced.
  const updateField = (id: string, field: keyof Omit<Copy, 'id'>, value: string) => {
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
    feedbackFi: "",
  },
  overallTrafficLight: "yellow",
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
        //memberBusinessIds: memberID.split(",").map(id => id.trim()),
      },
      project: {
        budget: Number(budget),
        requestedFunding: Number(grant),
        description: desc,
      }
    };

    // turn copies into form that backend expects, 
    // remember to check schema
    // EDIT FREELY: left this just as guideline

    // const copyInput = copies.map(c => {
    //   return {
    //     consortium: {
    //       //ternary: if empty input, returns empty array --> bolean remoes empty spaces in memberID
    //       memberBusinessIds: c.memberID ? c.memberID.split(",").map(id => id.trim()).filter(Boolean) : [],
    //     },
    //     project: {
    //       //parseNum instead in Number?
    //       budget: Number(c.budget),
    //       requestedFunding: Number(c.grant),
    //       description: c.desc
    //     }
    //   };
    // });

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
          <div className="input-box desc-box">
            <textarea onChange={(e) => setProjectDesc(e.target.value)}
              id="desc-input"
              name="project-desc"
              value={projectDesc}
              placeholder="Project Description" 
              className="desc-textarea"/>
          </div>
          <div className="input-box applicantID">
            <input onChange={(e) => setApplicantID(e.target.value)}
              type="text"
              id="applicantID-input"
              name="applicant-business-id"
              value={applicantID}
              placeholder="Lead Applicant Business ID" />
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
          <div className="input-box desc-box">
            <textarea onChange={(e) => setDesc(e.target.value)}
              id="lead-desc-input"
              name="lead-desc"
              value={desc}
              placeholder="Lead Applicant Description"
              className="desc-textarea" />
          </div>
          {/* Fragment with a key -> React can track each mapped group without adding an extra DOM node.
           (Move the key to the ".inputs-grid-copy" div to keep DOM simpler?)*/}
          {copies.map((c) => (
            <React.Fragment key={c.id}>
              <div className="inputs-grid-copy">
                <div className="input-box memberID">
                  <input value={c.memberID} onChange={(e) => updateField(c.id, "memberID", e.target.value)}
                    type="text"
                    id={`memberID-${c.id}`}
                    name="member-business-id"
                    placeholder="Member Business ID" />
                </div>
                <div className="input-box">
                  <input value={c.budget} onChange={(e) => updateField(c.id, "budget", e.target.value)}
                    type="number"
                    id={`budget-${c.id}`}
                    name="budget-id"
                    placeholder="Project Budget" />
                </div>
                <div className="input-box">
                  <input value={c.grant} onChange={(e) => updateField(c.id, "grant", e.target.value)}
                    type="number"
                    id={`grant-${c.id}`}
                    name="grant-id"
                    placeholder="Requested Funding" />
                </div>
                <div className="input-box member-desc">
                  <textarea value={c.desc} onChange={(e) => updateField(c.id, "desc", e.target.value)}
                    id={`desc-${c.id}`}
                    name="desc-id"
                    placeholder="description"
                    className="desc-textarea"/>
                </div>
                <button id="del-btn" type="button"
                  onClick={() => deleteInputCopy(c.id)}
                >-</button>
              </div>
            </React.Fragment>
          ))}
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
