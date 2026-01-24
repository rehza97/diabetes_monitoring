import { useState, useEffect } from "react";
import { reportsService } from "../services/reportsService";
import type { Report, QueryParams } from "@/types";

export function useReports(params?: QueryParams) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await reportsService.list(params);
        setReports(response.data);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement des rapports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [params]);

  return { reports, loading, error, refetch: () => reportsService.list(params) };
}
