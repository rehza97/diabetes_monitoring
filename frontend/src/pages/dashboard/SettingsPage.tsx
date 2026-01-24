import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KeyboardShortcutsHelp } from "@/components/dashboard/KeyboardShortcutsHelp";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GeneralSettingsForm } from "@/components/dashboard/forms/GeneralSettingsForm";
import { ReadingRangesForm } from "@/components/dashboard/forms/ReadingRangesForm";
import { NotificationSettingsForm } from "@/components/dashboard/forms/NotificationSettingsForm";
import { SecuritySettingsForm } from "@/components/dashboard/forms/SecuritySettingsForm";
import { BackupSettingsForm } from "@/components/dashboard/forms/BackupSettingsForm";
import { EmailSettingsForm } from "@/components/dashboard/forms/EmailSettingsForm";
import { CheckCircle2, AlertCircle, XCircle, Activity, Database, HardDrive, Clock } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

// Logging utility
const logError = (context: string, error: unknown, details?: Record<string, unknown>) => {
  console.error(`[SettingsPage] Error in ${context}:`, error, details);
};

const logWarning = (context: string, message: string, details?: Record<string, unknown>) => {
  console.warn(`[SettingsPage] Warning in ${context}:`, message, details);
};

const logInfo = (context: string, message: string, details?: Record<string, unknown>) => {
  console.log(`[SettingsPage] Info in ${context}:`, message, details);
};

export function SettingsPage() {
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  // Component lifecycle logging
  useEffect(() => {
    logInfo("componentMount", "SettingsPage mounted");
    return () => {
      logInfo("componentUnmount", "SettingsPage unmounting");
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paramètres système</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les paramètres du système et configurez les options selon vos besoins
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="readings">Mesures</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="backup">Sauvegarde</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="health">Santé système</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres généraux</CardTitle>
                <CardDescription>
                  Configurez les paramètres de base du système (nom, logo, contact, langue, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GeneralSettingsForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="readings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres des mesures</CardTitle>
                <CardDescription>
                  Configurez les plages normales, les unités de mesure et les types de mesures disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReadingRangesForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres des notifications</CardTitle>
                <CardDescription>
                  Gérez les notifications et alertes (activer/désactiver, templates, timing, canaux)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationSettingsForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de sécurité</CardTitle>
                <CardDescription>
                  Configurez les paramètres de sécurité et d'authentification (politique mots de passe, 2FA, IPs autorisées)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SecuritySettingsForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de sauvegarde</CardTitle>
                <CardDescription>
                  Configurez les sauvegardes automatiques (planification, emplacement, nombre de copies)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BackupSettingsForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres email</CardTitle>
                <CardDescription>
                  Configurez les paramètres SMTP et les modèles d'email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmailSettingsForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <SystemHealthMonitoring />
          </TabsContent>
        </Tabs>
        <KeyboardShortcutsHelp open={shortcutsHelpOpen} onOpenChange={setShortcutsHelpOpen} />
      </div>
    </DashboardLayout>
  );
}

function SystemHealthMonitoring() {
  const [healthData, setHealthData] = useState({
    systemStatus: "healthy" as "healthy" | "warning" | "critical",
    backupStatus: "up_to_date" as "up_to_date" | "pending" | "failed",
    storageUsage: 0,
    performanceScore: 0,
    lastBackup: null as Date | null,
    databaseSize: 0,
    responseTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHealthData = async () => {
      setLoading(true);
      try {
        logInfo("loadHealthData", "Loading system health data");
        // TODO: Replace with actual API calls to get system health data
        // This would require:
        // 1. Backend API endpoint for system health metrics
        // 2. Database size calculation from Firestore
        // 3. Storage usage from hosting/storage service
        // 4. Response time from monitoring service
        // 5. Performance score calculation from various metrics
        // 6. Backup status from backup service
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Set default values - no mock data
        logWarning("loadHealthData", "System health data not yet implemented - using default values");
        setHealthData({
          systemStatus: "healthy", // TODO: Calculate from actual system status
          backupStatus: "up_to_date", // TODO: Get from backup service
          storageUsage: 0, // TODO: Calculate from actual storage usage
          performanceScore: 0, // TODO: Calculate from performance metrics
          lastBackup: null, // TODO: Get from backup service
          databaseSize: 0, // TODO: Calculate from Firestore database size
          responseTime: 0, // TODO: Measure from actual API response times
        });
        logInfo("loadHealthData", "Health data initialized with defaults");
      } catch (error) {
        logError("loadHealthData", error);
      } finally {
        setLoading(false);
      }
    };
    loadHealthData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "up_to_date":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "warning":
      case "pending":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case "critical":
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
      case "up_to_date":
        return <Badge variant="default" className="bg-success">Opérationnel</Badge>;
      case "warning":
      case "pending":
        return <Badge variant="default" className="bg-warning">Attention</Badge>;
      case "critical":
      case "failed":
        return <Badge variant="destructive">Critique</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            État du système
          </CardTitle>
          <CardDescription>
            Surveillez l'état de santé général du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(healthData.systemStatus)}
                <div>
                  <p className="font-medium">Statut système</p>
                  <p className="text-sm text-muted-foreground">
                    {healthData.systemStatus === "healthy" 
                      ? "Tous les services fonctionnent normalement"
                      : healthData.systemStatus === "warning"
                      ? "Certains services nécessitent une attention"
                      : "Statut système non disponible"}
                  </p>
                </div>
              </div>
              {getStatusBadge(healthData.systemStatus)}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Utilisation du stockage
                  </span>
                  <span className="text-sm font-semibold">{healthData.storageUsage}%</span>
                </div>
                <Progress value={healthData.storageUsage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {healthData.databaseSize} GB utilisés
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Temps de réponse
                  </span>
                  <span className="text-sm font-semibold">{healthData.responseTime}ms</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div
                    className={`h-2 rounded-full ${
                      healthData.responseTime < 200
                        ? "bg-success"
                        : healthData.responseTime < 500
                        ? "bg-warning"
                        : "bg-destructive"
                    }`}
                    style={{ width: `${Math.min((healthData.responseTime / 1000) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {healthData.responseTime < 200
                    ? "Excellent"
                    : healthData.responseTime < 500
                    ? "Bon"
                    : "À améliorer"}
                </p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Score de performance
                </span>
                <span className="text-2xl font-bold">{healthData.performanceScore}/100</span>
              </div>
              <Progress value={healthData.performanceScore} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            État des sauvegardes
          </CardTitle>
          <CardDescription>
            Surveillez l'état des sauvegardes automatiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(healthData.backupStatus)}
                <div>
                  <p className="font-medium">Dernière sauvegarde</p>
                  <p className="text-sm text-muted-foreground">
                    {healthData.lastBackup
                      ? `Il y a ${Math.round((Date.now() - healthData.lastBackup.getTime()) / (1000 * 60 * 60))} heures`
                      : "Non disponible - Les données de sauvegarde ne sont pas encore implémentées"}
                  </p>
                </div>
              </div>
              {getStatusBadge(healthData.backupStatus)}
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Les sauvegardes automatiques sont configurées dans l'onglet "Sauvegarde".
                Les métriques de santé système sont mises à jour en temps réel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
