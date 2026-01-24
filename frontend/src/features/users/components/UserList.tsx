import { useUsers } from "../hooks/useUsers";
import { DataTable } from "@/components/dashboard/DataTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export function UserList() {
  const { users, loading, error } = useUsers();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-destructive">Erreur: {error}</div>;
  }

  return (
    <DataTable
      columns={[
        { header: "Nom", accessor: "name" },
        { header: "Email", accessor: "email" },
        { header: "Rôle", accessor: "role" },
        { header: "Statut", accessor: "is_active" },
      ]}
      data={users}
    />
  );
}
