import { type ProjectInput, ProjectInputSchema } from "@myorg/shared";

const PlaceHolderInput = ({ input }: { input: ProjectInput }) => {
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
    </div>
  );
};

export default PlaceHolderInput;
