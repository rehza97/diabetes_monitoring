import { useReadings } from "../hooks/useReadings";
import { DataTable } from "@/components/dashboard/DataTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export function ReadingList() {
  const { readings, loading, error } = useReadings();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-destructive">Erreur: {error}</div>;
  }

  return (
    <DataTable
      columns={[
        { header: "Patient", accessor: "patient" },
        { header: "Valeur", accessor: "value" },
        { header: "Type", accessor: "reading_type" },
        { header: "Date", accessor: "date" },
      ]}
      data={readings}
    />
  );
}
