// Moved from src/frontend/src/components/PlaceHolderInput.tsx
// It will be decided later whether InputPage and OutputPage remain in pages/ or move to components/

import {type ProjectOutput, type ProjectInput, ProjectInputSchema, validateInput, type Company } from "@myorg/shared";
import React from "react";
import Loader from "../components/Loader";
import PlaceHolderOutput from "./OutputPage";
import "../../css/inputPage.css";
import { buildConsortium2} from "../utils/BuildInput";
import parseKauppalehtiData from "../utils/kauppalehtiParser";


const PlaceHolderInput = () => {

  // For adding more user inputs
  /* NOTE 
   budget and grant are str so that placeholder can be seen 
   parse in submit!*/
  type Copy = {
    id: string;
    businessID: string;
    budget: string;
    grant: string;
    desc: string;
    financialData: string;
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
  const [leadDesc, setLeadDesc] = React.useState("");
  const [copies, setCopies] = React.useState<Copy[]>([]);
  const [output, setOutput] = React.useState<ProjectOutput | null>(null);
  const [financialData, setFinancialData] = React.useState<string>("");
  const [financialFormOpen, setFinancialFormOpen] = React.useState(false);


  // makeId needed for react only
  const idRef = React.useRef(1);
  const makeId = () => String(idRef.current++);

  // User can add more inputs
  const addInputCopy = () => {
    const newCopy: Copy = {
      id: makeId(),
      businessID: "",
      budget: "",
      grant: "",
      desc: "",
      financialData: ""
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

  /**
   * Will be used to send input to backend API in the future
   * Currently simulates loading state and then shows placeholder output
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse the financial data field by using the kauppalehti parser utility function
    const leadParsedFinancialData = parseKauppalehtiData(financialData);
    const memberParsedFinancialData = copies.map(c => ({
      id: c.id,
      financials: parseKauppalehtiData(c.financialData)
    }));
    console.log("Lead Applicant Parsed Financial Data:", leadParsedFinancialData);
    console.log("Member Companies Parsed Financial Data:", memberParsedFinancialData);


    // Build lead applicant data object
    const leadApplicantData: Company = {
      businessId: applicantID,
      budget: Number(budget),
      requestedFunding: Number(grant),
      projectRoleDescription: leadDesc,
      financialData: leadParsedFinancialData

    };

    // Map the copies to Company objects
    const memberCompanies: Company[] = copies.map((c) => ({
      businessId: c.businessID,
      budget: Number(c.budget),
      requestedFunding: Number(c.grant),
      projectRoleDescription: c.desc,
      financialData: memberParsedFinancialData.find(m => m.id === c.id)?.financials || { revenues: [], profits: [] }
    }));

    console.log("Lead Applicant Data:", leadApplicantData);

    // Build the actual input object to send to backend here
    const input: ProjectInput = {
      consortium: buildConsortium2(memberCompanies, leadApplicantData),
      generalDescription: projectDesc
    };

    // Validate the input against the schema before sending
    console.log("Constructed ProjectInput:", input);
    const validationErrors = validateInput(input, ProjectInputSchema);

    if (validationErrors.errors && validationErrors.errors.length > 0) {
      console.error("Validation errors found:", validationErrors.errors);
      setLoading(false);
      return;
    }
    // If no validation errors, proceed to send input to backend
    console.log("Input is valid. Proceeding to send to backend...");
    setLoading(true);

    // Start the api call
    try {
      const response = await fetch("/api/assess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data: ProjectOutput = await response.json();
      // Then set the output state with received data
      setOutput(data);
      console.log("API response data:", data);
    } catch (error) {
      console.error("Error during API call:", error);
      setLoading(false);
      return;
    }
    setLoading(false);
    setShowOutput(true);
  };

  if (loading) {
    return <Loader message="Processing your input..." />;
  }
  if (showOutput) {
    if (output === null) {
      return <div>Error: No output data available.</div>;
    }
    return <PlaceHolderOutput output={output} />;
  }

  if (financialFormOpen) {
    return (
      <div><h2>Financial Statement Form</h2>
        <button onClick={() => setFinancialFormOpen(false)}>Back to Input Form</button>
        {/* Financial form fields go here */}
        
      </div>
    );
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
            <textarea onChange={(e) => setLeadDesc(e.target.value)}
              id="lead-desc-input"
              name="lead-desc"
              value={leadDesc}
              placeholder="Lead Applicant Description"
              className="desc-textarea" />
          </div>
          {/* A button to open a financial form where user can paste the info from kauppalehti*/}
          <div className="input-box desc-box">
            <textarea onChange={(e) => setFinancialData(e.target.value)}
              id="financial-input"
              name="financial-data"
              value={financialData}
              placeholder="Paste financial data from Kauppalehti Taloustiedot table"
              className="desc-textarea" />
          </div>
          <div className="kauppalehti-container">
            <button className="kauppalehti-button">
              <a
                className="kauppalehti-link"
                href={`https://www.kauppalehti.fi/yritykset/yritys/${applicantID.replace(/-/g, "")}#taloustiedot`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open kauppalehti
              </a>
            </button>
            <p className="para">Please enter your business id before <strong>opening Kauppalehti</strong></p>
          </div>
        </div>
        <br />
        <div className="inputs-grid/copies-container">
          {/* Fragment with a key -> React can track each mapped group without adding an extra DOM node.
           (Move the key to the ".inputs-grid-copy" div to keep DOM simpler?)*/}
          {copies.map((c) => (
            <React.Fragment key={c.id}>
              <div className="inputs-grid">
                <div className="input-box memberID">
                  <input value={c.businessID} onChange={(e) => updateField(c.id, "businessID", e.target.value)}
                    type="text"
                    id={`businessID-${c.id}`}
                    name="business-id"
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
                <div className="input-box desc-box">
                  <textarea value={c.desc} onChange={(e) => updateField(c.id, "desc", e.target.value)}
                    id={`desc-${c.id}`}
                    name="desc-id"
                    placeholder="description"
                    className="desc-textarea"/>
                </div>
                <div className="input-box desc-box">
                  <textarea value={c.financialData} onChange={(e) => updateField(c.id, "financialData", e.target.value)}
                    id={`financial-${c.id}`}
                    name="financial-id"
                    placeholder="Paste financial data from Kauppalehti taloustiedot table"
                    className="desc-textarea"/>
                </div>
                <div className="kauppalehti-container">
                  <button className="kauppalehti-button">
                    <a
                      className="kauppalehti-link"
                      href={`https://www.kauppalehti.fi/yritykset/yritys/${c.businessID.replace(/-/g, "")}#taloustiedot`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open kauppalehti
                    </a>
                  </button>
                  <p className="para">Please enter the business id before <strong>opening Kauppalehti</strong></p>
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
