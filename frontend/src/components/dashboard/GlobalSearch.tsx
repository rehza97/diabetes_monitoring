import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User, UserCircle, ClipboardList, FileText, Loader2 } from "lucide-react";
import { usePatients, useUsers } from "@/hooks/useFirestore";
import { queryAllReadings, getReadings, queryPatients } from "@/lib/firestore-helpers";
import { query, where, limit } from "firebase/firestore";
import { patientsCollection, usersCollection } from "@/lib/firestore-helpers";
import { useAuth } from "@/context/AuthContext";
import { formatFullName } from "@/utils/helpers";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SearchResult = {
  id: string;
  type: "patient" | "user" | "reading" | "report";
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
};

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  // Fetch all data for search
  const patientsQuery = useMemo(() => query(patientsCollection, where("isActive", "==", true), limit(1000)), []);
  const usersQuery = useMemo(() => query(usersCollection, where("isActive", "==", true), limit(1000)), []);
  const { data: allPatients } = usePatients(patientsQuery);
  const { data: allUsers } = useUsers(usersQuery);
  const [allReadings, setAllReadings] = useState<any[]>([]);
  const [readingsLoading, setReadingsLoading] = useState(false);

  useEffect(() => {
    const loadReadings = async () => {
      if (!currentUser) {
        console.log("GlobalSearch: No current user, skipping readings load");
        setAllReadings([]);
        return;
      }

      setReadingsLoading(true);
      
      // Log query context for debugging
      console.log("GlobalSearch: Loading readings for search:", {
        currentUser: {
          id: currentUser.id,
          role: currentUser.role,
          email: currentUser.email,
        },
        queryStrategy: currentUser.role === "admin" 
          ? "queryAllReadings (admin)" 
          : "getReadings from assigned patients (non-admin)",
      });
      
      try {
        let readings: Array<any & { patientId?: string }> = [];

        // Check if user is admin - admins can query all readings
        if (currentUser.role === "admin") {
          console.log("GlobalSearch: Executing admin query: queryAllReadings with limit(500)");
          readings = await queryAllReadings([limit(500)]);
          console.log("GlobalSearch: Successfully fetched", readings.length, "readings (admin query)");
        } else {
          // For non-admin users, query only readings from assigned patients
          const userId = currentUser.id;
          let assignedPatients: any[] = [];

          // Query assigned patients based on role
          if (currentUser.role === "doctor") {
            console.log("GlobalSearch: Querying assigned patients for doctor:", userId);
            assignedPatients = await queryPatients([
              where("doctorId", "==", userId),
              where("isActive", "==", true),
            ]);
          } else if (currentUser.role === "nurse") {
            console.log("GlobalSearch: Querying assigned patients for nurse:", userId);
            assignedPatients = await queryPatients([
              where("nurseId", "==", userId),
              where("isActive", "==", true),
            ]);
          }

          console.log("GlobalSearch: Found", assignedPatients.length, "assigned patients");

          // Fetch readings from each assigned patient
          const readingsPromises = assignedPatients.map(async (patient) => {
            try {
              console.log("GlobalSearch: Fetching readings for patient:", patient.id, "patient name:", `${patient.firstName || ""} ${patient.lastName || ""}`);
              const patientReadings = await getReadings(patient.id, [limit(500)]);
              console.log("GlobalSearch: Successfully fetched", patientReadings.length, "readings for patient:", patient.id);
              // Add patientId to each reading for consistency with queryAllReadings format
              return patientReadings.map((reading) => ({
                ...reading,
                patientId: patient.id,
              }));
            } catch (patientError) {
              console.error("GlobalSearch: Error fetching readings for patient:", {
                patientId: patient.id,
                patientName: `${patient.firstName || ""} ${patient.lastName || ""}`,
                error: patientError,
                currentUser: {
                  id: currentUser.id,
                  role: currentUser.role,
                },
              });
              // Return empty array for this patient to continue with others
              return [];
            }
          });

          const readingsArrays = await Promise.all(readingsPromises);
          readings = readingsArrays.flat();
          console.log("GlobalSearch: Total readings from assigned patients:", readings.length);

          // Sort by date descending and limit to 500
          readings.sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : (a.date ? new Date(a.date) : new Date(0));
            const dateB = b.date?.toDate ? b.date.toDate() : (b.date ? new Date(b.date) : new Date(0));
            return dateB.getTime() - dateA.getTime();
          });
          readings = readings.slice(0, 500);
          console.log("GlobalSearch: Final readings count after sort and limit:", readings.length);
        }

        setAllReadings(readings);
      } catch (error) {
        // Log detailed error information for debugging Firestore rules
        const errorObj = error instanceof Error ? error : new Error("Failed to load readings");
        const isPermissionError = errorObj.message.includes("permission") || 
                                  errorObj.message.includes("Missing or insufficient");
        
        console.error("GlobalSearch: Error loading readings:", {
          error: errorObj.message,
          errorStack: errorObj.stack,
          fullError: error,
          currentUser: currentUser ? {
            id: currentUser.id,
            role: currentUser.role,
            email: currentUser.email,
          } : null,
          queryType: currentUser?.role === "admin" 
            ? "queryAllReadings with limit(500)" 
            : "getReadings from assigned patients",
          timestamp: new Date().toISOString(),
        });
        
        // Gracefully handle permissions errors by setting empty array
        if (isPermissionError) {
          console.warn("GlobalSearch: User doesn't have permission to view readings:", errorObj.message);
        }
        setAllReadings([]);
      } finally {
        setReadingsLoading(false);
      }
    };
    if (open) {
      loadReadings();
    }
  }, [open, currentUser]);

  // Perform search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const queryLower = searchQuery.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    // Search patients
    if (allPatients) {
      allPatients
        .filter((patient) => {
          const name = `${patient.firstName || ""} ${patient.lastName || ""}`.toLowerCase();
          const fileNumber = (patient.fileNumber || "").toLowerCase();
          const phone = (patient.phone || "").toLowerCase();
          return (
            name.includes(queryLower) ||
            fileNumber.includes(queryLower) ||
            phone.includes(queryLower)
          );
        })
        .slice(0, 5)
        .forEach((patient) => {
          searchResults.push({
            id: patient.id,
            type: "patient",
            title: formatFullName(patient.firstName || "", patient.lastName || ""),
            subtitle: `Dossier: ${patient.fileNumber || "N/A"}`,
            icon: <UserCircle className="h-4 w-4" />,
            onClick: () => {
              navigate(`/dashboard/patients/${patient.id}`);
              onOpenChange(false);
            },
          });
        });
    }

    // Search users
    if (allUsers) {
      allUsers
        .filter((user) => {
          const name = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
          const email = (user.email || "").toLowerCase();
          return name.includes(queryLower) || email.includes(queryLower);
        })
        .slice(0, 5)
        .forEach((user) => {
          searchResults.push({
            id: user.id,
            type: "user",
            title: formatFullName(user.firstName || "", user.lastName || ""),
            subtitle: user.email || "",
            icon: <User className="h-4 w-4" />,
            onClick: () => {
              navigate(`/dashboard/users/${user.id}`);
              onOpenChange(false);
            },
          });
        });
    }

    // Search readings (by patient name or value)
    allReadings
      .filter((reading) => {
        const value = reading.value?.toString() || "";
        return value.includes(queryLower);
      })
      .slice(0, 5)
      .forEach((reading) => {
        const patient = allPatients?.find((p) => p.id === reading.patientId);
        searchResults.push({
          id: reading.id,
          type: "reading",
          title: `${reading.value} ${reading.unit || "mg/dL"}`,
          subtitle: patient
            ? `Patient: ${formatFullName(patient.firstName || "", patient.lastName || "")}`
            : "Patient inconnu",
          icon: <ClipboardList className="h-4 w-4" />,
          onClick: () => {
            if (reading.patientId) {
              navigate(`/dashboard/patients/${reading.patientId}`);
            }
            onOpenChange(false);
          },
        });
      });

    setResults(searchResults);
    setIsSearching(false);
  }, [searchQuery, allPatients, allUsers, allReadings, navigate, onOpenChange]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {
      patients: [],
      users: [],
      readings: [],
      reports: [],
    };

    results.forEach((result) => {
      if (result.type === "patient") groups.patients.push(result);
      else if (result.type === "user") groups.users.push(result);
      else if (result.type === "reading") groups.readings.push(result);
      else if (result.type === "report") groups.reports.push(result);
    });

    return groups;
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Recherche globale</DialogTitle>
          <DialogDescription>
            Recherchez des patients, utilisateurs, mesures et rapports
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tapez pour rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="max-h-[60vh] px-6">
          {isSearching || readingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : searchQuery.trim() && results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Aucun résultat trouvé pour "{searchQuery}"
              </p>
            </div>
          ) : !searchQuery.trim() ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Commencez à taper pour rechercher...
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-6">
              {groupedResults.patients.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    Patients ({groupedResults.patients.length})
                  </h3>
                  <div className="space-y-1">
                    {groupedResults.patients.map((result) => (
                      <button
                        key={result.id}
                        onClick={result.onClick}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        {result.icon}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Patient
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {groupedResults.users.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    Utilisateurs ({groupedResults.users.length})
                  </h3>
                  <div className="space-y-1">
                    {groupedResults.users.map((result) => (
                      <button
                        key={result.id}
                        onClick={result.onClick}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        {result.icon}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Utilisateur
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {groupedResults.readings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    Mesures ({groupedResults.readings.length})
                  </h3>
                  <div className="space-y-1">
                    {groupedResults.readings.map((result) => (
                      <button
                        key={result.id}
                        onClick={result.onClick}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        {result.icon}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Mesure
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        <div className="px-6 pb-6 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Appuyez sur Esc pour fermer</span>
            <span>Utilisez ↑↓ pour naviguer, Entrée pour sélectionner</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
