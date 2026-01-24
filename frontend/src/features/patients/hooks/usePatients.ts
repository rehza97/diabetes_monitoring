import { useState, useEffect } from "react";
import { patientsService } from "../services/patientsService";
import type { Patient, QueryParams } from "@/types";

export function usePatients(params?: QueryParams) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await patientsService.list(params);
        setPatients(response.data);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement des patients");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [params]);

  return { patients, loading, error, refetch: () => patientsService.list(params) };
}
