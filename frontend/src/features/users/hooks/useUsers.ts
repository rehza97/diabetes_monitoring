import { useState, useEffect } from "react";
import { usersService } from "../services/usersService";
import type { User, QueryParams } from "@/types";

export function useUsers(params?: QueryParams) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await usersService.list(params);
        setUsers(response.data);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement des utilisateurs");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [params]);

  return { users, loading, error, refetch: () => usersService.list(params) };
}
