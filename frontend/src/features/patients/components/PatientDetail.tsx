import { useParams } from "react-router-dom";
import { usePatients } from "../hooks/usePatients";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  // TODO: Implement patient detail fetching
  // const { patient, loading, error } = usePatient(id);

  return (
    <div>
      <p>Détails du patient {id}</p>
      {/* TODO: Implement patient detail view */}
    </div>
  );
}
