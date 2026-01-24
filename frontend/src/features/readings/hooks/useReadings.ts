import { useState, useEffect } from "react";
import { readingsService } from "../services/readingsService";
import type { Reading, QueryParams } from "@/types";

export function useReadings(params?: QueryParams) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        setLoading(true);
        const response = await readingsService.list(params);
        setReadings(response.data);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement des lectures");
      } finally {
        setLoading(false);
      }
    };

    fetchReadings();
  }, [params]);

  return { readings, loading, error, refetch: () => readingsService.list(params) };
}
