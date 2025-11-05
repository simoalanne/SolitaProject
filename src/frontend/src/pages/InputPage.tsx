// Moved from src/frontend/src/components/PlaceHolderInput.tsx
// It will be decided later whether InputPage and OutputPage remain in pages/ or move to components/
import { useState } from "react";
import {
  type ProjectOutput,
  type ProjectInput,
  ProjectInputSchema,
  validateInput,
  type Company,
  type ErrorCode,
  FinancialDataSchema,
  businessIdSchema,
  fieldsMetadata,
} from "@myorg/shared";
import React from "react";
import Loader from "../components/Loader";
import PlaceHolderOutput from "./OutputPage";
import "../../css/inputPage.css";
import parseKauppalehtiData from "../utils/kauppalehtiParser";

const errorMessages: Record<ErrorCode, string> = {
  INVALID_BUSINESS_ID_FORMAT: "The business ID format is invalid.",
  INVALID_BUSINESS_ID_CHECK_DIGIT: "The business ID check digit is incorrect.",
  BUSINESS_IDS_NOT_UNIQUE:
    "Each business ID must be unique within the consortium.",
  REQUESTED_FUNDING_EXCEEDS_BUDGET:
    "Requested funding cannot exceed the project budget.",
  TOO_SMALL: "The entered value is too small.",
  TOO_BIG: "The entered value is too large.",
  TOO_SHORT: "The entered text is too short.",
  TOO_LONG: "The entered text is too long.",
  // These should not be needed with current form but are here for completeness
  INVALID_REVENUE_ENTRIES_COUNT:
    "Please provide the correct number of revenue entries.",
  INVALID_PROFIT_ENTRIES_COUNT:
    "Please provide the correct number of profit entries.",
  REQUIRED_FIELD_MISSING: "This field is required.",
  UNKNOWN_ERROR: "An unknown error occurred. Please check your input.",
};

const PlaceHolderInput = () => {
  const [isFocused, setIsFocused] = useState(null);

  const defaultCompany: Company = {
    businessId: "",
    budget: 0,
    requestedFunding: 0,
    projectRoleDescription: "",
  };

  const initialForm: ProjectInput = {
    consortium: [defaultCompany],
    generalDescription: "",
  };

  type Path = (string | number)[];

  // key is the field path array joined by '.', value is the error message
  type ValidationErrors = Record<string, string>;

  // Use a single form state for all inputs. This makes it way easier to integrate validation errors
  const [form, setForm] = React.useState<ProjectInput>(initialForm);
  const [errors, setErrors] = React.useState<ValidationErrors>({});

  const [loading, setLoading] = React.useState(false);
  const [showOutput, setShowOutput] = React.useState(false);
  const [output, setOutput] = React.useState<ProjectOutput | null>(null);
  const [financialFormOpen, setFinancialFormOpen] = React.useState(false);

  // Update validation errors whenever the form changes. Not the most optimal solution
  // performance-wise, but probably fine...
  React.useEffect(() => {
    const validationResult = validateInput(form, ProjectInputSchema);
    const newErrors: ValidationErrors =
      validationResult.errors?.reduce((acc, curr) => {
        const pathString = curr.path.join(".");
        // For now show just first error per field
        acc[pathString] =
          errorMessages[curr.errorCodes[0] as ErrorCode] ||
          errorMessages.UNKNOWN_ERROR;
        return acc;
      }, {} as ValidationErrors) || {};
    setErrors(newErrors);
  }, [form]);

  const updateForm = (fieldPath: Path, value: any) => {
    setForm((prev) => {
      const updatedForm = { ...prev };
      let target: any = updatedForm;

      // Example path: ['consortium', 0, 'budget']
      for (let i = 0; i < fieldPath.length; i++) {
        const key = fieldPath[i];

        // Goes to direct parent of the target field like updatedForm['consortium'][0]
        if (i !== fieldPath.length - 1) {
          target = target[key];
          // Sets the value of the target field -> updatedForm['consortium'][0]['budget'] = value
        } else {
          target[key] = value;
        }
      }
      return updatedForm;
    });
  };

  const addCompany = () =>
    setForm((prevForm) => ({
      ...prevForm,
      consortium: [...prevForm.consortium, defaultCompany],
    }));

  const deleteCompany = (index: number) =>
    setForm((prevForm) => ({
      ...prevForm,
      // Don't allow deleting the initial company at index 0
      consortium: prevForm.consortium.filter((_, i) => i !== index && i >= 0),
    }));

  const RenderError = ({ fieldPath }: { fieldPath: Path }) => {
    const pathString = fieldPath.join(".");
    const errorMessage = errors[pathString];
    return errorMessage && <p className="error-message">{errorMessage}</p>;
  };

  //Error function for input/textarea fields
  const hasError = (fieldPath: Path) => {
    return !!errors[fieldPath.join(".")];
  };
  //Functions to help with error messages
  const fieldKey = (index, name) => `consortium.${index}.${name}`;
  const getError = (errors, index, name) => errors[fieldKey(index, name)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateInput(form, ProjectInputSchema);

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
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
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
      <div>
        <h2>Financial Statement Form</h2>
        <button onClick={() => setFinancialFormOpen(false)}>
          Back to Input Form
        </button>
        {/* Financial form fields go here */}
      </div>
    );
  }

  return (
    <div className="form">
      <form onSubmit={handleSubmit}>
        <h2>Project Input</h2>
        <div className="inputs-grid">
          <div className="input-box desc-box">
            <textarea
              onChange={(e) =>
                updateForm(["generalDescription"], e.target.value)
              }
              id="desc-input"
              name="project-desc"
              value={form.generalDescription}
              placeholder={`Project Description (min ${fieldsMetadata.generalDescription.min} characters)`}
              className={
                hasError(["generalDescription"])
                  ? "desc-textarea input-error"
                  : "desc-textarea"
              }
              onFocus={() => setIsFocused("generalDescription")}
              onBlur={() => setIsFocused(null)}
            />
            {isFocused === "generalDescription" &&
              hasError(["generalDescription"]) && (
                <p className="error-text">{errors["generalDescription"]}</p>
              )}
          </div>
        </div>
        <div className="inputs-grid/copies-container">
          {form.consortium.map((c, index) => (
            <React.Fragment key={index}>
              <div className="inputs-grid">
                <div className="input-box memberID">
                  <input
                    className={
                      hasError(["consortium", index, "businessId"])
                        ? "input-error"
                        : ""
                    }
                    value={c.businessId}
                    onChange={(e) =>
                      updateForm(
                        ["consortium", index, "businessId"],
                        e.target.value
                      )
                    }
                    //onFocus/onBlur = when user un/selects field
                    onFocus={() => setIsFocused(fieldKey(index, "businessId"))}
                    onBlur={() => setIsFocused(null)}
                    type="text"
                    name="business-id"
                    placeholder={`${
                      index === 0 ? "Lead" : "Member"
                    } Business ID e.g. XXXXXXX-X`}
                  />
                  {isFocused === fieldKey(index, "businessId") &&
                    hasError(["consortium", index, "businessId"]) && (
                      <p className="error-text">
                        {getError(errors, index, "businessId")}
                      </p>
                    )}
                </div>

                <div className="input-box">
                  <input
                    className={
                      hasError(["consortium", index, "budget"])
                        ? "input-error"
                        : ""
                    }
                    value={c.budget === 0 ? "" : c.budget}
                    onChange={(e) =>
                      updateForm(
                        ["consortium", index, "budget"],
                        Number(e.target.value)
                      )
                    }
                    //onFocus/onBlur = when user un/selects field
                    onFocus={() => setIsFocused(fieldKey(index, "budget"))}
                    onBlur={() => setIsFocused(null)}
                    type="number"
                    name="budget-id"
                    placeholder={`Project Budget (min ${fieldsMetadata.budget.min} €)`}
                  />
                  {isFocused === fieldKey(index, "budget") &&
                    hasError(["consortium", index, "budget"]) && (
                      <p className="error-text">
                        {getError(errors, index, "budget")}
                      </p>
                    )}
                </div>

                <div className="input-box">
                  <input
                    className={
                      hasError(["consortium", index, "requestedFunding"])
                        ? "input-error"
                        : ""
                    }
                    value={c.requestedFunding === 0 ? "" : c.requestedFunding}
                    onChange={(e) =>
                      updateForm(
                        ["consortium", index, "requestedFunding"],
                        Number(e.target.value)
                      )
                    }
                    //onFocus/onBlur = when user un/selects field
                    onFocus={() =>
                      setIsFocused(fieldKey(index, "requestedFunding"))
                    }
                    onBlur={() => setIsFocused(null)}
                    type="number"
                    name="grant-id"
                    placeholder={`Requested Funding (min ${fieldsMetadata.requestedFunding.min} €)`}
                  />
                  {isFocused === fieldKey(index, "requestedFunding") &&
                    hasError(["consortium", index, "requestedFunding"]) && (
                      <p className="error-text">
                        {getError(errors, index, "requestedFunding")}
                      </p>
                    )}
                </div>

                <div className="input-box desc-box">
                  <textarea
                    value={c.projectRoleDescription}
                    onChange={(e) =>
                      updateForm(
                        ["consortium", index, "projectRoleDescription"],
                        e.target.value
                      )
                    }
                    onFocus={() =>
                      setIsFocused(`consortium.${index}.projectRoleDescription`)
                    }
                    onBlur={() => setIsFocused(null)}
                    name="desc-id"
                    placeholder={`Description (min ${fieldsMetadata.projectRoleDescription.min} characters)`}
                    className={
                      hasError(["consortium", index, "projectRoleDescription"])
                        ? "desc-textarea input-error"
                        : "desc-textarea"
                    }
                  />
                  {isFocused === `consortium.${index}.projectRoleDescription` &&
                    hasError([
                      "consortium",
                      index,
                      "projectRoleDescription",
                    ]) && (
                      <p className="error-text">
                        {errors[`consortium.${index}.projectRoleDescription`]}
                      </p>
                    )}
                </div>
                <div className="input-box desc-box">
                  <textarea
                    value={
                      c.financialData
                        ? `Revenues: ${c.financialData.revenues.join(
                            ", "
                          )}\nProfits: ${c.financialData.profits.join(", ")}`
                        : ""
                    }
                    readOnly={
                      !validateInput(c.financialData, FinancialDataSchema)
                        .errors
                    }
                    // The field can only ever be empty or contain valid data and be readOnly
                    onChange={(e) =>
                      updateForm(
                        ["consortium", index, "financialData"],
                        parseKauppalehtiData(e.target.value)
                      )
                    }
                    name="financial-id"
                    placeholder="Paste financial data from Kauppalehti taloustiedot table."
                    className="desc-textarea"
                  />
                </div>
                <div className="kauppalehti-container">
                  {/* Show the button only if the businessId can at least formatwise be valid */}
                  {!validateInput(c.businessId, businessIdSchema).errors &&
                    !c.financialData && (
                      <button className="kauppalehti-button">
                        <a
                          className="kauppalehti-link"
                          href={`https://www.kauppalehti.fi/yritykset/yritys/${c.businessId.replace(
                            /-/g,
                            ""
                          )}#taloustiedot`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open kauppalehti
                        </a>
                      </button>
                    )}
                  {!validateInput(c.financialData, FinancialDataSchema)
                    .errors && (
                    <button
                      className="clear-financial-button"
                      onClick={() =>
                        updateForm(
                          ["consortium", index, "financialData"],
                          undefined
                        )
                      }
                    >
                      Clear Financial Data
                    </button>
                  )}
                </div>
                {index === 0 ? null : (
                  <button
                    id="del-btn"
                    type="button"
                    onClick={() => deleteCompany(index)}
                  >
                    -
                  </button>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="buttons">
          <button type="button" id="add-btn" onClick={addCompany}>
            +
          </button>
          <button id="submit-btn" type="submit">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlaceHolderInput;
