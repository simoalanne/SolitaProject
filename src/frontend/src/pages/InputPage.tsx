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
import { useDebouncedCallback } from "use-debounce";
import AutoCompleteInput from "../components/AutoCompleteInput";

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
  const [isFocused, setIsFocused] = useState<string | null>(null);

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

  type CompanySuggestions = { businessId: string; name: string }[];

  const [companySuggestions, setCompanySuggestions] =
    React.useState<CompanySuggestions>([]);

  const [validatedBusinessIds, setValidatedBusinessIds] = React.useState<
    { businessId: string; name: string }[]
  >([]);

  // DONT use directly
  const queryForCompanySuggestions = async (inputValue: string) => {
    const minLength = 3;
    const limit = 5;
    if (inputValue.length < minLength) return setCompanySuggestions([]);

    const inputIsBusinessId = !validateInput(inputValue, businessIdSchema)
      .errors;
    const base = "/api/companies";
    const fullUrl = inputIsBusinessId
      ? `${base}/by-business-id?businessId=${encodeURIComponent(inputValue)}`
      : `${base}/autocomplete?partialName=${encodeURIComponent(
          inputValue
        )}&limit=${limit}`;

    const response = await fetch(fullUrl);

    if (!response.ok) {
      console.error("Failed to fetch company suggestions");
      return setCompanySuggestions([]);
    }

    const data: CompanySuggestions = (await response.json()).companies;
    setCompanySuggestions(data);
  };

  // Wait this many ms after user stops typing before querying
  const debounceMs = 300;

  const debouncedQueryForCompanySuggestions = useDebouncedCallback(
    queryForCompanySuggestions,
    debounceMs
  );

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

  //Error function for input/textarea fields
  const hasError = (fieldPath: Path, specificErrorCode?: ErrorCode) => {
    const error = !!errors[fieldPath.join(".")];
    const specificError = specificErrorCode
      ? errors[fieldPath.join(".")] ===
        errorMessages[specificErrorCode as ErrorCode]
      : true;
    return error && specificError;
  };

  //Functions to help with error messages
  const fieldKey = (index: number, name: string) =>
    `consortium.${index}.${name}`;
  const getError = (index: number, name: string) =>
    errors[fieldKey(index, name) as keyof typeof errors];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Submitting form:", form);
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

  return (
    <div className="form-wrapper">
      <h2>Project Input</h2>
      <div className="form">
        <form onSubmit={handleSubmit}>
          <div className="scroll-container">
            <div className="inputs-grid scroll-container">
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
            <div className="inputs-grid-copies-container">
              {form.consortium.map((c, index) => (
                <React.Fragment key={index}>
                  <div className="inputs-grid">
                    <div className="input-box memberID">
                      <AutoCompleteInput
                        value={c.businessId}
                        onChange={(value) => {
                          updateForm(["consortium", index, "businessId"], value);
                          debouncedQueryForCompanySuggestions(value);
                        }}
                        onSuggestionClick={(suggestionIndex) => {
                          const selectedCompany =
                            companySuggestions[suggestionIndex];
                          updateForm(
                            ["consortium", index, "businessId"],
                            selectedCompany.businessId
                          );
                          setValidatedBusinessIds((prev) => [
                            ...prev,
                            selectedCompany,
                          ]);
                          setCompanySuggestions([]);
                        }}
                        suggestions={companySuggestions.map(
                          (cs) => `${cs.businessId} - ${cs.name}`
                        )}
                        placeholder="Business ID or Company Name"
                        valueValidated={validatedBusinessIds.some(
                          (v) => v.businessId === c.businessId
                        )}
                        companyNameSuffix={
                          validatedBusinessIds.find(
                            (v) => v.businessId === c.businessId
                          )?.name
                        }
                      />
                      {hasError(
                        ["consortium", index, "businessId"],
                        // this is the only useful error to show here because of the
                        // autocomplete input
                        "BUSINESS_IDS_NOT_UNIQUE"
                      ) && (
                          <p className="error-text">
                            {getError(index, "businessId")}
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
                          <p className="error-text">{getError(index, "budget")}</p>
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
                            {getError(index, "requestedFunding")}
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
                        // The field can only ever be undefined or contain valid data and be readOnly
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
              <button type="button" id="add-btn" onClick={addCompany}>
                +
              </button>
            </div>
          </div>
          <button id="submit-btn" type="submit">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlaceHolderInput;
