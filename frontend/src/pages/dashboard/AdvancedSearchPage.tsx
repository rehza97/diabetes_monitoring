import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { query, where, orderBy, Timestamp } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PatientsTable } from "@/components/dashboard/tables/PatientsTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Search, Download, Save, X } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import { usePatients, useUsers } from "@/hooks/useFirestore";
import { patientsCollection, usersCollection } from "@/lib/firestore-helpers";
import { exportPatientsToExcel, exportPatientsToCSV } from "@/utils/export";
import type { FirestorePatient, FirestoreUser } from "@/types/firestore";

interface SearchCriteria {
  name: string;
  fileNumber: string;
  phone: string;
  ageMin: string;
  ageMax: string;
  diabetesType: string;
  status: string;
  lastReadingDateFrom: string;
  lastReadingDateTo: string;
  readingValueMin: string;
  readingValueMax: string;
  nurseId: string;
  registrationDateFrom: string;
  registrationDateTo: string;
}

export function AdvancedSearchPage() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [criteria, setCriteria] = useState<SearchCriteria>({
    name: "",
    fileNumber: "",
    phone: "",
    ageMin: "",
    ageMax: "",
    diabetesType: "all",
    status: "all",
    lastReadingDateFrom: "",
    lastReadingDateTo: "",
    readingValueMin: "",
    readingValueMax: "",
    nurseId: "all",
    registrationDateFrom: "",
    registrationDateTo: "",
  });

  // Fetch all patients and users for filtering
  const patientsQuery = useMemo(() => query(patientsCollection, where("isActive", "==", true)), []);
  const usersQuery = useMemo(() => query(usersCollection, where("isActive", "==", true)), []);
  const { data: allPatients, loading: patientsLoading, error: patientsError } = usePatients(patientsQuery);
  const { data: users } = useUsers(usersQuery);

  // Create user map
  const usersMap = useMemo(() => {
    const map = new Map<string, FirestoreUser>();
    users?.forEach(user => {
      if (user.id) map.set(user.id, user);
    });
    return map;
  }, [users]);

  // Filter patients based on search criteria
  const filteredPatients = useMemo(() => {
    if (!allPatients) return [];

    const now = new Date();

    return allPatients
      .filter((patient) => {
        // Name filter
        if (criteria.name) {
          const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.toLowerCase();
          if (!fullName.includes(criteria.name.toLowerCase())) return false;
        }

        // File number filter
        if (criteria.fileNumber && patient.fileNumber) {
          if (!patient.fileNumber.toLowerCase().includes(criteria.fileNumber.toLowerCase())) {
            return false;
          }
        }

        // Phone filter
        if (criteria.phone && patient.phone) {
          if (!patient.phone.includes(criteria.phone)) return false;
        }

        // Age filter
        if (criteria.ageMin || criteria.ageMax) {
          if (patient.dateOfBirth) {
            const age = Math.floor(
              (now.getTime() - patient.dateOfBirth.toDate().getTime()) /
                (1000 * 60 * 60 * 24 * 365.25)
            );
            if (criteria.ageMin && age < Number(criteria.ageMin)) return false;
            if (criteria.ageMax && age > Number(criteria.ageMax)) return false;
          } else {
            return false;
          }
        }

        // Diabetes type filter
        if (criteria.diabetesType !== "all" && patient.diabetesType !== criteria.diabetesType) {
          return false;
        }

        // Status filter
        if (criteria.status !== "all" && patient.lastReadingStatus !== criteria.status) {
          return false;
        }

        // Last reading date filter
        if (criteria.lastReadingDateFrom || criteria.lastReadingDateTo) {
          if (!patient.lastReadingDate) return false;
          const readingDate = patient.lastReadingDate.toDate();
          if (criteria.lastReadingDateFrom) {
            const fromDate = new Date(criteria.lastReadingDateFrom);
            if (readingDate < fromDate) return false;
          }
          if (criteria.lastReadingDateTo) {
            const toDate = new Date(criteria.lastReadingDateTo);
            toDate.setHours(23, 59, 59);
            if (readingDate > toDate) return false;
          }
        }

        // Reading value filter
        if (criteria.readingValueMin || criteria.readingValueMax) {
          if (patient.lastReadingValue === undefined || patient.lastReadingValue === null) {
            return false;
          }
          if (criteria.readingValueMin && patient.lastReadingValue < Number(criteria.readingValueMin)) {
            return false;
          }
          if (criteria.readingValueMax && patient.lastReadingValue > Number(criteria.readingValueMax)) {
            return false;
          }
        }

        // Nurse filter
        if (criteria.nurseId !== "all" && patient.nurseId !== criteria.nurseId) {
          return false;
        }

        // Registration date filter
        if (criteria.registrationDateFrom || criteria.registrationDateTo) {
          if (!patient.createdAt) return false;
          const regDate = patient.createdAt.toDate();
          if (criteria.registrationDateFrom) {
            const fromDate = new Date(criteria.registrationDateFrom);
            if (regDate < fromDate) return false;
          }
          if (criteria.registrationDateTo) {
            const toDate = new Date(criteria.registrationDateTo);
            toDate.setHours(23, 59, 59);
            if (regDate > toDate) return false;
          }
        }

        return true;
      })
      .map((patient) => ({
        id: patient.id,
        file_number: patient.fileNumber || "",
        first_name: patient.firstName || "",
        last_name: patient.lastName || "",
        date_of_birth: patient.dateOfBirth?.toDate().toISOString().split("T")[0] || "",
        diabetes_type: patient.diabetesType,
        doctor_name: patient.doctorId ? usersMap.get(patient.doctorId)?.firstName + " " + usersMap.get(patient.doctorId)?.lastName : undefined,
        nurse_name: patient.nurseId ? usersMap.get(patient.nurseId)?.firstName + " " + usersMap.get(patient.nurseId)?.lastName : undefined,
        last_reading: patient.lastReadingValue && patient.lastReadingDate
          ? {
              value: patient.lastReadingValue,
              date: patient.lastReadingDate.toDate().toISOString().split("T")[0],
            }
          : undefined,
        status: patient.lastReadingStatus || "normal",
        avatar: patient.avatar,
      }));
  }, [allPatients, criteria, usersMap]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(criteria).some(
      (value) => value !== "" && value !== "all"
    );
  }, [criteria]);

  const clearFilters = () => {
    setCriteria({
      name: "",
      fileNumber: "",
      phone: "",
      ageMin: "",
      ageMax: "",
      diabetesType: "all",
      status: "all",
      lastReadingDateFrom: "",
      lastReadingDateTo: "",
      readingValueMin: "",
      readingValueMax: "",
      nurseId: "all",
      registrationDateFrom: "",
      registrationDateTo: "",
    });
  };

  const handleExport = (format: "excel" | "csv" = "excel") => {
    try {
      const patientsToExport = filteredPatients
        .map(p => allPatients?.find(pat => pat.id === p.id))
        .filter((p): p is FirestorePatient => p !== null);

      if (format === "excel") {
        exportPatientsToExcel(patientsToExport);
      } else {
        exportPatientsToCSV(patientsToExport);
      }
      addNotification({
        type: "success",
        title: "Export réussi",
        message: `${filteredPatients.length} patient(s) exporté(s) en format ${format.toUpperCase()}.`,
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "Erreur d'export",
        message: `Impossible d'exporter les données: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  if (patientsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (patientsError) {
    return (
      <DashboardLayout>
        <ErrorMessage message={`Erreur lors du chargement: ${patientsError.message}`} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recherche avancée</h1>
            <p className="text-muted-foreground mt-1">
              Recherchez des patients avec des critères multiples et précis
            </p>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Critères de recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  placeholder="Nom complet"
                  value={criteria.name}
                  onChange={(e) => setCriteria({ ...criteria, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileNumber">N° Dossier</Label>
                <Input
                  id="fileNumber"
                  placeholder="PAT-001"
                  value={criteria.fileNumber}
                  onChange={(e) => setCriteria({ ...criteria, fileNumber: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  placeholder="+33 6 12 34 56 78"
                  value={criteria.phone}
                  onChange={(e) => setCriteria({ ...criteria, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageMin">Âge minimum</Label>
                <Input
                  id="ageMin"
                  type="number"
                  placeholder="18"
                  value={criteria.ageMin}
                  onChange={(e) => setCriteria({ ...criteria, ageMin: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageMax">Âge maximum</Label>
                <Input
                  id="ageMax"
                  type="number"
                  placeholder="80"
                  value={criteria.ageMax}
                  onChange={(e) => setCriteria({ ...criteria, ageMax: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diabetesType">Type de diabète</Label>
                <Select
                  value={criteria.diabetesType}
                  onValueChange={(value) => setCriteria({ ...criteria, diabetesType: value })}
                >
                  <SelectTrigger id="diabetesType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="type1">Type 1</SelectItem>
                    <SelectItem value="type2">Type 2</SelectItem>
                    <SelectItem value="gestational">Gestationnel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">État</Label>
                <Select
                  value={criteria.status}
                  onValueChange={(value) => setCriteria({ ...criteria, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="warning">Avertissement</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nurseId">Infirmière</Label>
                <Select
                  value={criteria.nurseId}
                  onValueChange={(value) => setCriteria({ ...criteria, nurseId: value })}
                >
                  <SelectTrigger id="nurseId">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {users?.filter(u => u.role === "nurse").map((nurse) => (
                      <SelectItem key={nurse.id} value={nurse.id}>
                        {nurse.firstName} {nurse.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastReadingDateFrom">Dernière mesure (du)</Label>
                <Input
                  id="lastReadingDateFrom"
                  type="date"
                  value={criteria.lastReadingDateFrom}
                  onChange={(e) => setCriteria({ ...criteria, lastReadingDateFrom: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastReadingDateTo">Dernière mesure (au)</Label>
                <Input
                  id="lastReadingDateTo"
                  type="date"
                  value={criteria.lastReadingDateTo}
                  onChange={(e) => setCriteria({ ...criteria, lastReadingDateTo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="readingValueMin">Valeur mesure (min)</Label>
                <Input
                  id="readingValueMin"
                  type="number"
                  placeholder="70"
                  value={criteria.readingValueMin}
                  onChange={(e) => setCriteria({ ...criteria, readingValueMin: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="readingValueMax">Valeur mesure (max)</Label>
                <Input
                  id="readingValueMax"
                  type="number"
                  placeholder="180"
                  value={criteria.readingValueMax}
                  onChange={(e) => setCriteria({ ...criteria, readingValueMax: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDateFrom">Date inscription (du)</Label>
                <Input
                  id="registrationDateFrom"
                  type="date"
                  value={criteria.registrationDateFrom}
                  onChange={(e) => setCriteria({ ...criteria, registrationDateFrom: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDateTo">Date inscription (au)</Label>
                <Input
                  id="registrationDateTo"
                  type="date"
                  value={criteria.registrationDateTo}
                  onChange={(e) => setCriteria({ ...criteria, registrationDateTo: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {filteredPatients.length} patient(s) trouvé(s)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport("excel")}>
              <Download className="mr-2 h-4 w-4" />
              Exporter Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport("csv")}>
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
          </div>
        </div>

        <PatientsTable
          patients={filteredPatients}
          onView={(patient) => navigate(`/dashboard/patients/${patient.id}`)}
          onEdit={(patient) => navigate(`/dashboard/patients?edit=${patient.id}`)}
        />
      </div>
    </DashboardLayout>
  );
}
