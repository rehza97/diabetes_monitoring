import { usePatients } from "../hooks/usePatients";
import { PatientCard } from "@/components/dashboard/PatientCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users } from "lucide-react";

export function PatientList() {
  const { patients, loading, error } = usePatients();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-destructive">Erreur: {error}</div>;
  }

  if (patients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucun patient"
        description="Il n'y a pas encore de patients dans le système."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {patients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  );
}
