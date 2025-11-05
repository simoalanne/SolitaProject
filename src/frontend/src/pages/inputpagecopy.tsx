// Moved from src/frontend/src/components/PlaceHolderInput.tsx
// It will be decided later whether InputPage and OutputPage remain in pages/ or move to components/

import {
  type ProjectOutput,
  type ProjectInput,
  ProjectInputSchema,
  validateInput,
  type Company,
  type ErrorCode,
} from "@myorg/shared";
import React from "react";
import Loader from "../components/Loader";
import PlaceHolderOutput from "./OutputPage";
import "../../css/inputPage.css";

const errorMessages: Record<ErrorCode, string> = {
  INVALID_BUSINESS_ID_FORMAT:
    "The business ID format is invalid.",
  INVALID_BUSINESS_ID_CHECK_DIGIT:
    "The business ID check digit is incorrect.",
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

  type ValidationErrors = Record<string, string>; // key is the array path as string, value is the error message

  // Use a single form state for all inputs. This makes it way easier to integrate validation errors
  const [form, setForm] = React.useState<ProjectInput>(initialForm);
  const [errors, setErrors] = React.useState<ValidationErrors>({});

  const [loading, setLoading] = React.useState(false);
  const [showOutput, setShowOutput] = React.useState(false);
  const [output, setOutput] = React.useState<ProjectOutput | null>(null);

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
    return errorMessage && <div className="error-message">{errorMessage}</div>;
  };

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

  // UI here is very basic, just for demonstration purposes
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
              placeholder="Project Description"
              className="desc-textarea"
            />
            <RenderError fieldPath={["generalDescription"]} />
          </div>
          {/* Fragment with a key -> React can track each mapped group without adding an extra DOM node.
           (Move the key to the ".inputs-grid-copy" div to keep DOM simpler?)*/}
          {form.consortium.map((c, idx) => (
            <React.Fragment key={idx}>
              <div className="inputs-grid-copy">
                <div className="input-box memberID">
                  <input
                    value={c.businessId}
                    onChange={(e) =>
                      updateForm(
                        ["consortium", idx, "businessId"],
                        e.target.value
                      )
                    }
                    type="text"
                    name="business-id"
                    placeholder={
                      idx === 0 ? "Lead Business ID" : "Member Business ID"
                    }
                  />
                  <RenderError fieldPath={["consortium", idx, "businessId"]} />
                </div>
                <div className="input-box">
                  <input
                    value={c.budget}
                    onChange={(e) =>
                      updateForm(
                        ["consortium", idx, "budget"],
                        Number(e.target.value)
                      )
                    }
                    type="number"
                    name="budget-id"
                    placeholder="Project Budget"
                  />
                  <RenderError fieldPath={["consortium", idx, "budget"]} />
                </div>
                <div className="input-box">
                  <input
                    value={c.requestedFunding}
                    onChange={(e) =>
                      updateForm(
                        ["consortium", idx, "requestedFunding"],
                        Number(e.target.value)
                      )
                    }
                    type="number"
                    name="grant-id"
                    placeholder="Requested Funding"
                  />
                  <RenderError
                    fieldPath={["consortium", idx, "requestedFunding"]}
                  />
                </div>
                <div className="input-box member-desc">
                  <textarea
                    value={c.projectRoleDescription}
                    onChange={(e) =>
                      updateForm(
                        ["consortium", idx, "projectRoleDescription"],
                        e.target.value
                      )
                    }
                    name="desc-id"
                    placeholder="description"
                    className="desc-textarea"
                  />
                  <RenderError
                    fieldPath={["consortium", idx, "projectRoleDescription"]}
                  />
                </div>
                {idx === 0 ? null : (
                  <button
                    id="del-btn"
                    type="button"
                    onClick={() => deleteCompany(idx)}
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
            <button
            id="submit-btn"
            type="submit"
            disabled={Object.keys(errors).length > 0}
            >
            Submit
            </button>
        </div>
      </form>
    </div>
  );
};

export default PlaceHolderInput;
