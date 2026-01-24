import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { query, where, orderBy } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/components/dashboard/tables/UsersTable";
import { UserFilters, type UserFiltersState } from "@/components/dashboard/filters/UserFilters";
import { UserForm } from "@/components/dashboard/forms/UserForm";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Plus, Download, Trash2 } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import { useUsers } from "@/hooks/useFirestore";
import { usersCollection } from "@/lib/firestore-helpers";
import { updateUser, deleteUser, createUserWithAuth } from "@/lib/firestore-helpers";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { FirestoreUser } from "@/types/firestore";
import { exportUsersToExcel, exportUsersToCSV } from "@/utils/export";

// Logging utility
const logError = (context: string, error: unknown, details?: Record<string, unknown>) => {
  console.error(`[UsersManagementPage] Error in ${context}:`, error, details);
};

const logWarning = (context: string, message: string, details?: Record<string, unknown>) => {
  console.warn(`[UsersManagementPage] Warning in ${context}:`, message, details);
};

const logInfo = (context: string, message: string, details?: Record<string, unknown>) => {
  console.log(`[UsersManagementPage] Info in ${context}:`, message, details);
};

export function UsersManagementPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  // UserForm expects snake_case format, so we store the transformed user
  const [editingUser, setEditingUser] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: "admin" | "doctor" | "nurse";
    specialization?: string;
    license_number?: string;
    is_active: boolean;
    avatar?: string;
  } | undefined>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<UserFiltersState>({
    search: "",
    role: "all",
    status: "all",
  });
  const { addNotification } = useNotification();

  // Component lifecycle logging
  useEffect(() => {
    logInfo("componentMount", "UsersManagementPage mounted");
    return () => {
      logInfo("componentUnmount", "UsersManagementPage unmounting", {});
    };
  }, []);

  // Create query based on filters
  const usersQuery = useMemo(() => {
    try {
      const constraints: any[] = [orderBy("createdAt", "desc")];
      
      if (filters.role !== "all") {
        constraints.push(where("role", "==", filters.role));
      }
      
      if (filters.status !== "all") {
        constraints.push(where("isActive", "==", filters.status === "active"));
      }
      
      const q = query(usersCollection, ...constraints);
      logInfo("usersQuery", "Query created successfully", { filters });
      return q;
    } catch (error) {
      logError("usersQuery", error, { filters });
      throw error;
    }
  }, [filters.role, filters.status]);

  // Fetch users
  const { data: users, loading, error } = useUsers(usersQuery);

  // Handle edit query parameter from URL
  useEffect(() => {
    const editUserId = searchParams.get("edit");
    if (editUserId && users && users.length > 0 && !isFormOpen) {
      const userToEdit = users.find((u) => u.id === editUserId);
      if (userToEdit) {
        logInfo("editFromQuery", "Opening edit form from URL parameter", { userId: editUserId });
        // Transform FirestoreUser (camelCase) to UserForm format (snake_case)
        const formUser = {
          id: userToEdit.id,
          first_name: userToEdit.firstName || "",
          last_name: userToEdit.lastName || "",
          email: userToEdit.email,
          phone: userToEdit.phone || "",
          role: userToEdit.role,
          specialization: userToEdit.specialization || "",
          license_number: userToEdit.licenseNumber || "",
          is_active: userToEdit.isActive ?? true,
          avatar: userToEdit.avatar,
        };
        setEditingUser(formUser);
        setIsFormOpen(true);
        // Remove the edit parameter from URL to prevent reopening on re-render
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.delete("edit");
          return newParams;
        });
      } else {
        logWarning("editFromQuery", "User not found for edit parameter", { userId: editUserId });
      }
    }
  }, [users, searchParams, isFormOpen, setSearchParams]);

  // Log raw user data structure from database
  useEffect(() => {
    if (users && users.length > 0) {
      const firstUser = users[0];
      
      // Log to console with clear formatting
      console.group("🔍 [UsersManagementPage] Raw User Data from Firestore");
      console.log("User ID:", firstUser.id);
      console.log("All field names:", Object.keys(firstUser));
      console.log("Full user object:", firstUser);
      console.log("Phone value:", firstUser.phone, "(type:", typeof firstUser.phone, ")");
      console.log("LicenseNumber value:", firstUser.licenseNumber, "(type:", typeof firstUser.licenseNumber, ")");
      console.log("Specialization value:", firstUser.specialization, "(type:", typeof firstUser.specialization, ")");
      console.table({
        field: ["phone", "licenseNumber", "specialization"],
        value: [firstUser.phone, firstUser.licenseNumber, firstUser.specialization],
        type: [typeof firstUser.phone, typeof firstUser.licenseNumber, typeof firstUser.specialization],
        exists: [
          firstUser.phone !== undefined,
          firstUser.licenseNumber !== undefined,
          firstUser.specialization !== undefined,
        ],
      });
      console.groupEnd();
      
      logInfo("rawUserData", "Raw user data structure from Firestore", {
        userId: firstUser.id,
        allFields: Object.keys(firstUser),
        phone: firstUser.phone,
        licenseNumber: firstUser.licenseNumber,
        specialization: firstUser.specialization,
        sampleUser: firstUser,
      });
    }
  }, [users]);

  // Log data fetching status
  useEffect(() => {
    logInfo("dataFetching", "Data fetching status", {
      loading,
      count: users?.length ?? 0,
      error: error?.message,
    });
  }, [loading, users?.length, error]);

  // Log errors when they occur
  useEffect(() => {
    if (error) {
      const errorDetails: Record<string, unknown> = { 
        query: "usersQuery",
        message: error.message,
        name: error.name,
      };
      if ('code' in error) {
        errorDetails.code = (error as any).code;
      }
      logError("usersFetch", error, errorDetails);
    }
  }, [error]);

  // Filter and transform users to match table format
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users
      .filter((user) => {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesSearch =
            user.firstName?.toLowerCase().includes(searchLower) ||
            user.lastName?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }
        return true;
      })
      .map((user) => ({
        id: user.id,
        first_name: user.firstName || "",
        last_name: user.lastName || "",
        email: user.email || "",
        role: user.role,
        is_active: user.isActive ?? true,
        avatar: user.avatar,
        created_at: user.createdAt?.toDate().toISOString() || new Date().toISOString(),
        last_login: user.lastLogin?.toDate().toISOString(),
        // Store original FirestoreUser for edit/delete operations
        _originalUser: user,
      }));
  }, [users, filters.search]);

  const handleAddUser = () => {
    setEditingUser(undefined);
    setIsFormOpen(true);
  };

  const handleViewUser = (user: FirestoreUser) => {
    navigate(`/dashboard/users/${user.id}`);
  };

  const handleEditUser = (user: FirestoreUser) => {
    console.log("🔍 [handleEditUser] Raw user from Firestore:", user);
    console.log("  firstName:", user.firstName);
    console.log("  lastName:", user.lastName);
    console.log("  phone:", user.phone);
    console.log("  licenseNumber:", user.licenseNumber);
    
    // Transform FirestoreUser (camelCase) to UserForm format (snake_case)
    const formUser = {
      id: user.id,
      first_name: user.firstName || "",
      last_name: user.lastName || "",
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      specialization: user.specialization || "",
      license_number: user.licenseNumber || "",
      is_active: user.isActive ?? true,
      avatar: user.avatar,
    };
    
    console.log("🔍 [handleEditUser] Transformed formUser:", formUser);
    console.log("  first_name:", formUser.first_name);
    console.log("  last_name:", formUser.last_name);
    console.log("  phone:", formUser.phone);
    console.log("  license_number:", formUser.license_number);
    
    setEditingUser(formUser);
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (user: FirestoreUser) => {
    const fullName = `${user.firstName} ${user.lastName}`.trim() || "Utilisateur";
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${fullName} ?`)) {
      return;
    }
    
    try {
      logInfo("deleteUser", "Deleting user", { userId: user.id, userName: fullName });
      await deleteUser(user.id);
      logInfo("deleteUser", "User deleted successfully", { userId: user.id });
      addNotification({
        type: "success",
        title: "Utilisateur supprimé",
        message: `${fullName} a été supprimé.`,
      });
    } catch (error) {
      logError("deleteUser", error, { userId: user.id });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de supprimer l'utilisateur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  const handleToggleActive = async (user: FirestoreUser) => {
    try {
      const fullName = `${user.firstName} ${user.lastName}`.trim() || "Utilisateur";
      
      logInfo("toggleActive", "Toggling user active status", { userId: user.id, currentStatus: user.isActive });
      await updateUser(user.id, { isActive: !user.isActive });
      logInfo("toggleActive", "User status updated successfully", { userId: user.id, newStatus: !user.isActive });
      addNotification({
        type: "success",
        title: user.isActive ? "Utilisateur désactivé" : "Utilisateur activé",
        message: `${fullName} a été ${user.isActive ? "désactivé" : "activé"}.`,
      });
    } catch (error) {
      logError("toggleActive", error, { userId: user.id });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de modifier l'utilisateur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingUser) {
        // Update existing user
        // Map form data (snake_case) to API format (camelCase)
        const firstName = data.first_name || data.firstName;
        const lastName = data.last_name || data.lastName;
        const email = data.email;
        const phone = data.phone;
        const role = data.role;
        const specialization = data.specialization;
        const licenseNumber = data.license_number || data.licenseNumber;
        const isActive = data.is_active !== undefined ? data.is_active : (data.isActive ?? editingUser?.is_active ?? true);

        logInfo("updateUser", "Updating user", { userId: editingUser.id });
        
        // Build update object, only including defined values
        const updateData: Partial<FirestoreUser> = {
          firstName,
          lastName,
          email,
          phone,
          role,
          isActive,
        };
        
        // Only include optional fields if they have values
        if (specialization) {
          updateData.specialization = specialization;
        }
        if (licenseNumber) {
          updateData.licenseNumber = licenseNumber;
        }
        
        await updateUser(editingUser.id, updateData);
        logInfo("updateUser", "User updated successfully", { userId: editingUser.id });
        addNotification({
          type: "success",
          title: "Utilisateur modifié",
          message: `${firstName} ${lastName} a été modifié avec succès.`,
        });
      } else {
        // Create new user using Cloud Function
        if (!data.password) {
          logError("createUser", new Error("Password is required"), { email: data.email });
          addNotification({
            type: "error",
            title: "Erreur",
            message: "Le mot de passe est requis pour créer un utilisateur.",
          });
          return;
        }

        // Map form data (snake_case) to API format (camelCase)
        const firstName = data.first_name || data.firstName;
        const lastName = data.last_name || data.lastName;
        const email = data.email;
        const phone = data.phone;
        const role = data.role;
        const specialization = data.specialization;
        const licenseNumber = data.license_number || data.licenseNumber;
        const isActive = data.is_active !== undefined ? data.is_active : (data.isActive ?? true);

        logInfo("createUser", "Creating user with Firebase Auth", { email, role });
        const result = await createUserWithAuth({
          email,
          password: data.password,
          firstName,
          lastName,
          phone,
          role,
          specialization,
          licenseNumber,
          isActive,
        });
        logInfo("createUser", "User created successfully", { userId: result.userId, email: result.email });
        addNotification({
          type: "success",
          title: "Utilisateur créé",
          message: `${firstName} ${lastName} a été créé avec succès.`,
        });
      }
      setIsFormOpen(false);
      setEditingUser(undefined);
    } catch (error) {
      logError("formSubmit", error, { isEdit: !!editingUser, userId: editingUser?.id });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de ${editingUser ? "modifier" : "créer"} l'utilisateur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  const handleExport = (format: "excel" | "csv" = "excel") => {
    try {
      logInfo("exportUsers", "Exporting users", { format, count: filteredUsers.length });
      if (format === "excel") {
        exportUsersToExcel(filteredUsers.map(u => ({
          id: u.id,
          firstName: u.first_name,
          lastName: u.last_name,
          email: u.email,
          role: u.role,
          phone: "",
          isActive: u.is_active,
          createdAt: undefined,
          lastLogin: undefined,
        })));
      } else {
        exportUsersToCSV(filteredUsers.map(u => ({
          id: u.id,
          firstName: u.first_name,
          lastName: u.last_name,
          email: u.email,
          role: u.role,
          phone: "",
          isActive: u.is_active,
          createdAt: undefined,
          lastLogin: undefined,
        })));
      }
      logInfo("exportUsers", "Export completed successfully", { format });
      addNotification({
        type: "success",
        title: "Export réussi",
        message: `Les utilisateurs ont été exportés en format ${format.toUpperCase()}.`,
      });
    } catch (error) {
      logError("exportUsers", error, { format });
      addNotification({
        type: "error",
        title: "Erreur d'export",
        message: `Impossible d'exporter les données: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} utilisateur(s) ?`)) {
      return;
    }
    
    try {
      logInfo("bulkDelete", "Bulk deleting users", { count: selectedIds.length, userIds: selectedIds });
      await Promise.all(selectedIds.map(id => deleteUser(id)));
      logInfo("bulkDelete", "Bulk delete completed successfully", { count: selectedIds.length });
      addNotification({
        type: "success",
        title: "Utilisateurs supprimés",
        message: `${selectedIds.length} utilisateur(s) ont été supprimés.`,
      });
      setSelectedIds([]);
    } catch (error) {
      logError("bulkDelete", error, { count: selectedIds.length });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de supprimer les utilisateurs: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  if (loading) {
    logInfo("pageRender", "Page is loading");
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    logError("pageRender", "Rendering error state", { errorMessage: error.message });
    return (
      <DashboardLayout>
        <ErrorMessage message={`Erreur lors du chargement des utilisateurs: ${error.message}`} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des utilisateurs</h1>
            <p className="text-muted-foreground mt-1">
              Gérez les médecins, infirmières et administrateurs du système
            </p>
          </div>
          <Button onClick={handleAddUser} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un utilisateur
          </Button>
        </div>

        <UserFilters onFilterChange={setFilters} />

        {selectedIds.length > 0 && (
          <BulkActions
            selectedCount={selectedIds.length}
            onExport={handleExport}
            onDelete={handleBulkDelete}
            exportLabel="Exporter les utilisateurs sélectionnés"
            deleteLabel="Supprimer les utilisateurs sélectionnés"
          />
        )}

        <UsersTable
          users={filteredUsers}
          onView={(user) => {
            // Get original FirestoreUser from the table user object
            const originalUser = (user as any)._originalUser;
            if (originalUser) handleViewUser(originalUser);
          }}
          onEdit={(user) => {
            // Get original FirestoreUser from the table user object
            const originalUser = (user as any)._originalUser;
            if (originalUser) handleEditUser(originalUser);
          }}
          onDelete={(user) => {
            // Get original FirestoreUser from the table user object
            const originalUser = (user as any)._originalUser;
            if (originalUser) handleDeleteUser(originalUser);
          }}
          onToggleActive={(user) => {
            // Get original FirestoreUser from the table user object
            const originalUser = (user as any)._originalUser;
            if (originalUser) handleToggleActive(originalUser);
          }}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />

        <UserForm
          user={editingUser}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingUser(undefined);
          }}
          onSubmit={handleFormSubmit}
        />
      </div>
    </DashboardLayout>
  );
}
