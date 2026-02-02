import { useMemo, useEffect, useState, useCallback, useRef, memo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { query, where, orderBy, limit, getDocs, type Timestamp } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  ArrowLeft, Edit, Mail, Phone, Calendar, UserCheck, UserX,
  Activity, Users, ClipboardList,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/utils/formatters";
import { getInitials, formatFullName } from "@/utils/helpers";
import { EmptyState } from "@/components/shared/EmptyState";
import { Inbox } from "lucide-react";
import { useUser, usePatients } from "@/hooks/useFirestore";
import { useRecentItems } from "@/hooks/useRecentItems";
import { useRealtimeAuditLogs } from "@/hooks/useRealtime";
import { patientsCollection, auditLogsCollection, queryAllReadings, getReadings, queryPatients } from "@/lib/firestore-helpers";
import { useAuth } from "@/context/AuthContext";
import type { FirestoreUser, FirestorePatient, FirestoreReading, FirestoreAuditLog } from "@/types/firestore";

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const ROLE_CONFIG = {
  admin: { label: "Administrateur", color: "bg-destructive/10 text-destructive" },
  doctor: { label: "Médecin", color: "bg-primary/10 text-primary" },
  nurse: { label: "Infirmière", color: "bg-success/10 text-success" },
} as const;

const ACTION_LABELS = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  login: "Connexion",
  view: "Consultation",
} as const;

interface EnrichedReading extends FirestoreReading {
  patientId: string;
  patientName: string;
}

interface ActivityStats {
  recentReadings: number;
  monthlyReadings: number;
  avgDailyReadings: string;
  activityRate: number;
  loginCount30Days: number;
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useUserData(userId: string | undefined) {
  const { user, loading: userLoading, error: userError } = useUser(userId || null);
  
  const assignedPatientsQuery = useMemo(() => {
    if (!user || !userId) return null;
    if (user.role === "doctor") {
      return query(patientsCollection, where("doctorId", "==", userId), where("isActive", "==", true));
    } else if (user.role === "nurse") {
      return query(patientsCollection, where("nurseId", "==", userId), where("isActive", "==", true));
    }
    return null;
  }, [user, userId]);
  
  const { data: assignedPatients, loading: patientsLoading } = usePatients(assignedPatientsQuery);
  
  const loginHistoryQuery = useMemo(() => {
    if (!userId) return null;
    return query(
      auditLogsCollection,
      where("userId", "==", userId),
      where("action", "==", "login"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [userId]);
  
  const { data: loginHistory, loading: loginHistoryLoading } = useRealtimeAuditLogs(loginHistoryQuery);
  
  return {
    user,
    assignedPatients,
    loginHistory,
    loading: userLoading || patientsLoading || loginHistoryLoading,
    error: userError,
  };
}

function useUserReadings(userId: string | undefined, patients: FirestorePatient[] | null) {
  const { user: currentUser } = useAuth();
  const [readings, setReadings] = useState<EnrichedReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    let mounted = true;
    
    const loadReadings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let allReadings: Array<FirestoreReading & { patientId: string }> = [];
        
        // Log query context for debugging
        console.log("Loading readings for user:", {
          viewedUserId: userId,
          currentUser: currentUser ? {
            id: currentUser.id,
            role: currentUser.role,
            email: currentUser.email,
          } : null,
          queryStrategy: currentUser?.role === "admin" 
            ? "queryAllReadings (admin)" 
            : currentUser 
            ? "getReadings from assigned patients (non-admin)"
            : "no query (no current user)",
        });
        
        // Check if current user is admin - admins can query all readings
        if (currentUser?.role === "admin") {
          console.log("Executing admin query: queryAllReadings with recordedById filter");
          allReadings = await queryAllReadings([where("recordedById", "==", userId)]);
        } else if (currentUser) {
          // For non-admin users, query only readings from assigned patients
          const currentUserId = currentUser.id;
          let assignedPatients: FirestorePatient[] = [];
          
          // Query assigned patients based on current user's role
          if (currentUser.role === "doctor") {
            console.log("Querying assigned patients for doctor:", currentUserId);
            assignedPatients = await queryPatients([
              where("doctorId", "==", currentUserId),
              where("isActive", "==", true),
            ]);
          } else if (currentUser.role === "nurse") {
            console.log("Querying assigned patients for nurse:", currentUserId);
            assignedPatients = await queryPatients([
              where("nurseId", "==", currentUserId),
              where("isActive", "==", true),
            ]);
          }
          
          console.log("Found assigned patients:", assignedPatients.length);
          
          // Fetch readings from each assigned patient
          const readingsPromises = assignedPatients.map(async (patient) => {
            try {
              console.log("Fetching readings for patient:", patient.id, "patient name:", `${patient.firstName || ""} ${patient.lastName || ""}`);
              const patientReadings = await getReadings(patient.id);
              console.log("Successfully fetched", patientReadings.length, "readings for patient:", patient.id);
              // Add patientId to each reading for consistency
              return patientReadings.map((reading) => ({
                ...reading,
                patientId: patient.id,
              }));
            } catch (patientError) {
              console.error("Error fetching readings for patient:", {
                patientId: patient.id,
                patientName: `${patient.firstName || ""} ${patient.lastName || ""}`,
                error: patientError,
                currentUser: currentUser ? {
                  id: currentUser.id,
                  role: currentUser.role,
                } : null,
              });
              // Return empty array for this patient to continue with others
              return [];
            }
          });
          
          const readingsArrays = await Promise.all(readingsPromises);
          const combinedReadings = readingsArrays.flat();
          console.log("Total readings from assigned patients:", combinedReadings.length);
          
          // Filter by recordedById in memory
          allReadings = combinedReadings.filter(
            (reading) => reading.recordedById === userId
          );
          console.log("Readings filtered by recordedById:", allReadings.length);
          
          // Sort by date descending
          allReadings.sort((a, b) => {
            const toDate = (d: unknown): Date =>
              d && typeof (d as { toDate?: () => Date }).toDate === "function"
                ? (d as { toDate: () => Date }).toDate()
                : d ? new Date(d as string | number) : new Date(0);
            const dateA = toDate(a.date);
            const dateB = toDate(b.date);
            return dateB.getTime() - dateA.getTime();
          });
        } else {
          // No current user, set empty array
          allReadings = [];
        }
        
        if (!mounted) return;
        
        const patientMap = new Map(
          patients?.map(p => [p.id, `${p.firstName || ""} ${p.lastName || ""}`.trim()]) || []
        );
        
        const enrichedReadings: EnrichedReading[] = allReadings.map(reading => ({
          ...reading,
          patientName: patientMap.get(reading.patientId) || "Patient inconnu",
        }));
        
        setReadings(enrichedReadings);
      } catch (err) {
        if (!mounted) return;
        
        // Handle permission errors gracefully - user may not have access to readings
        const error = err instanceof Error ? err : new Error("Failed to load readings");
        const isPermissionError = error.message.includes("permission") || 
                                  error.message.includes("Missing or insufficient");
        
        if (isPermissionError) {
          // Log detailed error information for debugging Firestore rules
          console.error("Permissions error loading readings:", {
            error: error.message,
            errorStack: error.stack,
            fullError: err,
            currentUser: currentUser ? {
              id: currentUser.id,
              role: currentUser.role,
              email: currentUser.email,
            } : null,
            viewedUserId: userId,
            queryType: currentUser?.role === "admin" 
              ? "queryAllReadings with recordedById filter" 
              : "getReadings from assigned patients filtered by recordedById",
            timestamp: new Date().toISOString(),
          });
          // Set empty array instead of error - user just doesn't have permission
          console.warn("User doesn't have permission to view readings:", error.message);
          setReadings([]);
        } else {
          console.error("Error loading readings:", {
            error: err,
            currentUser: currentUser ? {
              id: currentUser.id,
              role: currentUser.role,
            } : null,
            viewedUserId: userId,
          });
          setError(error);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    loadReadings();
    
    return () => { mounted = false; };
  }, [userId, patients, currentUser]);
  
  return { readings, loading, error };
}

function useUserActivity(userId: string | undefined) {
  const [activity, setActivity] = useState<FirestoreAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    let mounted = true;
    
    const loadActivity = async () => {
      setLoading(true);
      try {
        const activityQuery = query(
          auditLogsCollection,
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        const snapshot = await getDocs(activityQuery);
        
        if (mounted) {
          setActivity(snapshot.docs.map(doc => doc.data() as FirestoreAuditLog));
        }
      } catch (error) {
        console.error("Error loading activity:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    loadActivity();
    
    return () => { mounted = false; };
  }, [userId]);
  
  return { activity, loading };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateActivityStats(
  readings: EnrichedReading[],
  loginHistory: FirestoreAuditLog[] | null
): ActivityStats {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const getReadingDate = (reading: EnrichedReading): Date | null => {
    if (!reading.date) return null;
    if (reading.date && typeof (reading.date as Timestamp).toDate === 'function') {
      return (reading.date as Timestamp).toDate();
    }
    if (reading.date instanceof Date) {
      return reading.date;
    }
    return null;
  };
  
  const recentReadings = readings.filter(r => {
    const date = getReadingDate(r);
    return date && date >= sevenDaysAgo;
  }).length;
  
  const monthlyReadings = readings.filter(r => {
    const date = getReadingDate(r);
    return date && date >= currentMonthStart;
  }).length;
  
  const readingsLast30Days = readings.filter(r => {
    const date = getReadingDate(r);
    return date && date >= thirtyDaysAgo;
  }).length;
  
  const avgDailyReadings = readingsLast30Days > 0 
    ? (readingsLast30Days / 30).toFixed(1) 
    : "0";
  
  const loginCount30Days = loginHistory?.filter(l => {
    if (!l.createdAt) return false;
    const loginDate = l.createdAt.toDate ? l.createdAt.toDate() : null;
    return loginDate && loginDate >= thirtyDaysAgo;
  }).length || 0;
  
  const activityRate = loginCount30Days > 0 
    ? Math.min(Math.round((loginCount30Days / 30) * 100), 100) 
    : 0;
  
  return {
    recentReadings,
    monthlyReadings,
    avgDailyReadings,
    activityRate,
    loginCount30Days,
  };
}

// ============================================================================
// TABLE COLUMN DEFINITIONS
// ============================================================================

/**
 * Memoized action button component to prevent infinite re-renders
 * This component is stable across renders, preventing ref callback issues
 */
interface ActionButtonProps {
  patientId: string;
  onClick: (patientId: string) => void;
}

const ActionButton = memo(({ patientId, onClick }: ActionButtonProps) => {
  const handleClick = useCallback(() => {
    onClick(patientId);
  }, [patientId, onClick]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
    >
      Voir
    </Button>
  );
});

ActionButton.displayName = "ActionButton";

const useTableColumns = (navigate: ReturnType<typeof useNavigate>) => {
  const handlePatientClick = useCallback((patientId: string) => {
    navigate(`/dashboard/patients/${patientId}`);
  }, [navigate]);
  
  const patientsColumns = useMemo(() => [
    { header: "Nom", accessor: "name" as const },
    { header: "N° Dossier", accessor: "file_number" as const },
    { header: "Dernière mesure", accessor: "last_reading" as const },
    {
      header: "Actions",
      accessor: "patientId" as const,
      render: (value: string) => (
        <ActionButton patientId={value} onClick={handlePatientClick} />
      ),
    },
  ], [handlePatientClick]);
  
  const loginHistoryColumns = useMemo(() => [
    { header: "Date/Heure", accessor: "date" as const },
    { header: "Adresse IP", accessor: "ip_address" as const },
    { header: "User Agent", accessor: "user_agent" as const },
  ], []);
  
  const readingsColumns = useMemo(() => [
    { header: "Patient", accessor: "patient_name" as const },
    { header: "Valeur", accessor: "value" as const },
    { header: "Date/Heure", accessor: "date" as const },
    { header: "Type", accessor: "type" as const },
  ], []);
  
  return { patientsColumns, loginHistoryColumns, readingsColumns };
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface UserInfoCardProps {
  user: FirestoreUser;
}

function UserInfoCard({ user }: UserInfoCardProps) {
  const roleConfig = ROLE_CONFIG[user.role];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations personnelles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-2xl">
              {getInitials(user.firstName || "", user.lastName || "")}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 grid gap-4 md:grid-cols-2">
            <InfoField 
              label="Nom complet" 
              value={formatFullName(user.firstName || "", user.lastName || "")} 
            />
            <InfoField 
              label="Email" 
              value={user.email} 
              icon={<Mail className="h-4 w-4" />} 
            />
            <InfoField 
              label="Téléphone" 
              value={user.phone || "Non renseigné"} 
              icon={<Phone className="h-4 w-4" />} 
            />
            <div>
              <p className="text-sm text-muted-foreground">Rôle</p>
              <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
            </div>
            {user.specialization && (
              <InfoField label="Spécialisation" value={user.specialization} />
            )}
            {user.licenseNumber && (
              <InfoField 
                label="Numéro de licence" 
                value={user.licenseNumber} 
                className="font-mono" 
              />
            )}
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? (
                  <><UserCheck className="mr-1 h-3 w-3" />Actif</>
                ) : (
                  <><UserX className="mr-1 h-3 w-3" />Inactif</>
                )}
              </Badge>
            </div>
            <InfoField 
              label="Date de création" 
              value={user.createdAt ? formatDate(user.createdAt.toDate().toISOString()) : "N/A"}
              icon={<Calendar className="h-4 w-4" />} 
            />
            <InfoField 
              label="Dernière connexion" 
              value={user.lastLogin ? formatDateTime(user.lastLogin.toDate().toISOString()) : "Jamais"} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface InfoFieldProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  className?: string;
}

function InfoField({ label, value, icon, className }: InfoFieldProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className={`font-medium ${className || ""}`}>{value}</p>
      </div>
    </div>
  );
}

interface ActivityStatsCardsProps {
  stats: ActivityStats;
  totalPatients: number;
  totalReadings: number;
  userRole: string;
}

function ActivityStatsCards({ stats, totalPatients, totalReadings, userRole }: ActivityStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Users className="h-4 w-4" />}
        title="Patients assignés"
        value={totalPatients}
        subtitle={userRole === "doctor" ? "Sous sa responsabilité" : "Assignés"}
      />
      <StatCard
        icon={<ClipboardList className="h-4 w-4" />}
        title="Mesures enregistrées"
        value={totalReadings}
        subtitle={`${stats.recentReadings} cette semaine`}
      />
      <StatCard
        icon={<Activity className="h-4 w-4" />}
        title="Connexions (30j)"
        value={stats.loginCount30Days}
        subtitle={`Taux d'activité: ${stats.activityRate}%`}
      />
      <StatCard
        title="Moyenne quotidienne"
        value={stats.avgDailyReadings}
        subtitle={`${stats.monthlyReadings} ce mois`}
      />
    </div>
  );
}

interface StatCardProps {
  icon?: React.ReactNode;
  title: string;
  value: number | string;
  subtitle: string;
}

function StatCard({ icon, title, value, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UserDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addRecentItem } = useRecentItems();
  
  // Fetch all data using custom hooks
  const { user, assignedPatients, loginHistory, loading: dataLoading, error } = useUserData(id);
  const { readings, loading: readingsLoading } = useUserReadings(id, assignedPatients);
  const { activity, loading: activityLoading } = useUserActivity(id);
  
  // Table columns
  const { patientsColumns, loginHistoryColumns, readingsColumns } = useTableColumns(navigate);
  
  // Add to recent items - use ref to track last added item
  const lastAddedRef = useRef<{ id: string; title: string } | null>(null);
  useEffect(() => {
    if (user && id) {
      const title = formatFullName(user.firstName || "", user.lastName || "") || "Utilisateur";
      const currentItem = { id, title };
      
      // Only add if this is a different item than last time
      if (!lastAddedRef.current || 
          lastAddedRef.current.id !== currentItem.id || 
          lastAddedRef.current.title !== currentItem.title) {
        lastAddedRef.current = currentItem;
        addRecentItem({
          id,
          type: "user",
          title,
          path: `/dashboard/users/${id}`,
        });
      }
    }
  }, [user, id, addRecentItem]);
  
  // Memoize table data
  const tableData = useMemo(() => ({
    loginHistory: (loginHistory || []).map(login => ({
      date: formatDateTime(login.createdAt?.toDate().toISOString() || ""),
      ip_address: login.ipAddress || "N/A",
      user_agent: login.userAgent || "N/A",
    })),
    
    assignedPatients: (assignedPatients || []).map(patient => ({
      name: formatFullName(patient.firstName || "", patient.lastName || ""),
      file_number: patient.fileNumber || "",
      last_reading: patient.lastReadingDate 
        ? formatDate(patient.lastReadingDate.toDate().toISOString()) 
        : "Aucune",
      patientId: patient.id,
    })),
    
    readings: readings.map(reading => ({
      patient_name: reading.patientName,
      value: `${reading.value} ${reading.unit}`,
      date: formatDateTime(reading.date?.toDate().toISOString() || ""),
      type: reading.readingType,
    })),
  }), [loginHistory, assignedPatients, readings]);
  
  // Calculate stats
  const stats = useMemo(
    () => calculateActivityStats(readings, loginHistory),
    [readings, loginHistory]
  );
  
  // Loading state
  if (dataLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }
  
  // Error state
  if (error || !user) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={Inbox}
          title="Utilisateur non trouvé"
          description={error ? `Erreur: ${error.message}` : "L'utilisateur demandé n'existe pas."}
        />
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard/users">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {formatFullName(user.firstName || "", user.lastName || "")}
              </h1>
              <p className="text-muted-foreground mt-1">
                Détails de l'utilisateur et statistiques d'activité
              </p>
            </div>
          </div>
          <Button asChild>
            <Link to={`/dashboard/users?edit=${user.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
        </div>
        
        <UserInfoCard user={user} />
        
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activity">Statistiques activité</TabsTrigger>
            <TabsTrigger value="login-history">Historique connexions</TabsTrigger>
            {user.role !== "admin" && (
              <>
                <TabsTrigger value="patients">Patients assignés</TabsTrigger>
                <TabsTrigger value="readings">Mesures enregistrées</TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="activity" className="space-y-4">
            <ActivityStatsCards
              stats={stats}
              totalPatients={assignedPatients?.length || 0}
              totalReadings={readings.length}
              userRole={user.role}
            />
            
            <div className="grid gap-4 md:grid-cols-2">
              <ChartCard title="Activité mensuelle" type="bar" />
              <ChartCard title="Répartition par type" type="pie" />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Timeline d'activité récente</CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <LoadingSpinner size="sm" />
                ) : activity.length > 0 ? (
                  <div className="space-y-3">
                    {activity.slice(0, 10).map((act, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {ACTION_LABELS[act.action as keyof typeof ACTION_LABELS] || act.action}{" "}
                            {act.entityType}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {act.createdAt ? formatDateTime(act.createdAt.toDate().toISOString()) : "Date inconnue"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune activité récente
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="login-history">
            <Card>
              <CardHeader>
                <CardTitle>Historique des connexions</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable columns={loginHistoryColumns} data={tableData.loginHistory} />
              </CardContent>
            </Card>
          </TabsContent>
          
          {user.role !== "admin" && (
            <>
              <TabsContent value="patients">
                <Card>
                  <CardHeader>
                    <CardTitle>Patients assignés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable columns={patientsColumns} data={tableData.assignedPatients} />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="readings">
                <Card>
                  <CardHeader>
                    <CardTitle>Mesures enregistrées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {readingsLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <DataTable columns={readingsColumns} data={tableData.readings} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
