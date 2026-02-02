import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { getSettingsByCategory, updateSetting, createSetting } from "@/lib/firestore-helpers";
import type { FirestoreSetting } from "@/types/firestore";

interface BackupSettings {
  enabled: boolean;
  frequency: string;
  time: string;
  location: string;
  keep_copies: number;
  last_backup?: Date;
}

export function BackupSettingsForm() {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? auth.currentUser?.uid ?? null;
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<FirestoreSetting[]>([]);
  const [lastBackupDate, setLastBackupDate] = useState<Date | undefined>(new Date());

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<BackupSettings>({
    defaultValues: {
      enabled: true,
      frequency: "daily",
      time: "02:00",
      location: "local",
      keep_copies: 7,
    },
  });

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const backupSettings = await getSettingsByCategory("backup");
        setSettings(backupSettings);
        
        const settingsMap = new Map(backupSettings.map(s => [s.key, s.value]));
        reset({
          enabled: settingsMap.get("backup.enabled") ?? true,
          frequency: settingsMap.get("backup.frequency") ?? "daily",
          time: settingsMap.get("backup.time") ?? "02:00",
          location: settingsMap.get("backup.location") ?? "local",
          keep_copies: settingsMap.get("backup.keep_copies") ?? 7,
        });
        
        const lastBackup = settingsMap.get("backup.last_backup");
        if (lastBackup) {
          setLastBackupDate(new Date(lastBackup));
        }
      } catch (error) {
        console.error("Error loading backup settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [reset]);

  const onSubmit = async (data: BackupSettings) => {
    if (!currentUserId) {
      addNotification({
        type: "error",
        title: "Erreur",
        message: "Vous devez être connecté pour sauvegarder les paramètres.",
      });
      return;
    }
    try {
      const settingsMap = new Map(settings.map((s) => [s.key, s]));
      const keyValueMap: Record<string, any> = {
        "backup.enabled": data.enabled,
        "backup.frequency": data.frequency,
        "backup.time": data.time,
        "backup.location": data.location,
        "backup.keep_copies": data.keep_copies,
      };
      await Promise.all(
        Object.entries(keyValueMap).map(async ([key, value]) => {
          const existing = settingsMap.get(key);
          if (existing) {
            await updateSetting(existing.id, value, currentUserId);
          } else {
            await createSetting({ key, value, category: "backup" }, currentUserId);
          }
        })
      );
      
      addNotification({
        type: "success",
        title: "Paramètres sauvegardés",
        message: "Les paramètres de sauvegarde ont été sauvegardés avec succès.",
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de sauvegarder les paramètres: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }

  const handleRestore = () => {
    // TODO: Implémenter restauration
    console.log("Restore backup");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sauvegarde automatique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Activer la sauvegarde automatique</Label>
              <p className="text-sm text-muted-foreground">
                Effectuer des sauvegardes automatiques selon la planification
              </p>
            </div>
            <Switch
              id="enabled"
              checked={watch("enabled")}
              onCheckedChange={(checked) => setValue("enabled", checked)}
            />
          </div>
          {watch("enabled") && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Fréquence</Label>
                  <Select
                    value={watch("frequency")}
                    onValueChange={(value) => setValue("frequency", value)}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Heure</Label>
                  <Input
                    id="time"
                    type="time"
                    {...register("time")}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emplacement de stockage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Type de stockage</Label>
            <Select
              value={watch("location")}
              onValueChange={(value) => setValue("location", value)}
            >
              <SelectTrigger id="location">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="cloud">Cloud</SelectItem>
                <SelectItem value="external">Disque externe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="keep_copies">Nombre de copies à conserver</Label>
            <Input
              id="keep_copies"
              type="number"
              min={1}
              max={30}
              {...register("keep_copies", { valueAsNumber: true })}
            />
            <p className="text-sm text-muted-foreground">
              Les sauvegardes plus anciennes seront automatiquement supprimées
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dernière sauvegarde</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lastBackupDate ? (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Dernière sauvegarde effectuée le :
              </p>
              <p className="font-medium">
                {format(lastBackupDate, "dd/MM/yyyy à HH:mm", { locale: fr })}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune sauvegarde effectuée
            </p>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => console.log("Manual backup")}>
              Effectuer une sauvegarde maintenant
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restauration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Restaurez le système depuis une sauvegarde précédente
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" type="button">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Sélectionner une sauvegarde
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={lastBackupDate}
                onSelect={setLastBackupDate}
                locale={fr}
              />
            </PopoverContent>
          </Popover>
          {lastBackupDate && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleRestore}
              className="ml-2"
            >
              Restaurer depuis cette date
            </Button>
          )}
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Enregistrement...
          </>
        ) : (
          "Enregistrer les paramètres"
        )}
      </Button>
    </form>
  );
}
