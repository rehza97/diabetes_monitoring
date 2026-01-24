import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getSettingsByCategory, updateSetting, createSetting } from "@/lib/firestore-helpers";
import type { FirestoreSetting } from "@/types/firestore";

interface NotificationSettings {
  enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  app_enabled: boolean;
  critical_alerts: boolean;
  warning_alerts: boolean;
  system_notifications: boolean;
  reminder_time: string;
  email_template: string;
}

export function NotificationSettingsForm() {
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<FirestoreSetting[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<NotificationSettings>({
    defaultValues: {
      enabled: true,
      email_enabled: true,
      sms_enabled: false,
      app_enabled: true,
      critical_alerts: true,
      warning_alerts: true,
      system_notifications: true,
      reminder_time: "09:00",
      email_template: "default",
    },
  });

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const notificationSettings = await getSettingsByCategory("notifications");
        setSettings(notificationSettings);
        
        // Map settings to form values
        const settingsMap = new Map(notificationSettings.map(s => [s.key, s.value]));
        reset({
          enabled: settingsMap.get("notifications.enabled") ?? true,
          email_enabled: settingsMap.get("notifications.email_enabled") ?? true,
          sms_enabled: settingsMap.get("notifications.sms_enabled") ?? false,
          app_enabled: settingsMap.get("notifications.app_enabled") ?? true,
          critical_alerts: settingsMap.get("notifications.critical_alerts") ?? true,
          warning_alerts: settingsMap.get("notifications.warning_alerts") ?? true,
          system_notifications: settingsMap.get("notifications.system_notifications") ?? true,
          reminder_time: settingsMap.get("notifications.reminder_time") ?? "09:00",
          email_template: settingsMap.get("notifications.email_template") ?? "default",
        });
      } catch (error) {
        console.error("Error loading notification settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [reset]);

  const onSubmit = async (data: NotificationSettings) => {
    if (!currentUser?.uid) {
      addNotification({
        type: "error",
        title: "Erreur",
        message: "Vous devez être connecté pour sauvegarder les paramètres.",
      });
      return;
    }
    
    try {
      // Save each setting
      const settingKeys = [
        "notifications.enabled",
        "notifications.email_enabled",
        "notifications.sms_enabled",
        "notifications.app_enabled",
        "notifications.critical_alerts",
        "notifications.warning_alerts",
        "notifications.system_notifications",
        "notifications.reminder_time",
        "notifications.email_template",
      ];
      
      const settingsMap = new Map(settings.map(s => [s.key, s]));
      
      const keyValueMap: Record<string, any> = {
        "notifications.enabled": data.enabled,
        "notifications.email_enabled": data.email_enabled,
        "notifications.sms_enabled": data.sms_enabled,
        "notifications.app_enabled": data.app_enabled,
        "notifications.critical_alerts": data.critical_alerts,
        "notifications.warning_alerts": data.warning_alerts,
        "notifications.system_notifications": data.system_notifications,
        "notifications.reminder_time": data.reminder_time,
        "notifications.email_template": data.email_template,
      };
      
      await Promise.all(
        Object.entries(keyValueMap).map(async ([key, value]) => {
          const existingSetting = settingsMap.get(key);
          
          if (existingSetting) {
            await updateSetting(existingSetting.id, value, currentUser.uid);
          } else {
            await createSetting({
              key,
              value,
              category: "notifications",
            }, currentUser.uid);
          }
        })
      );
      
      addNotification({
        type: "success",
        title: "Paramètres sauvegardés",
        message: "Les paramètres de notifications ont été sauvegardés avec succès.",
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activation des notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Notifications activées</Label>
              <p className="text-sm text-muted-foreground">
                Activez ou désactivez toutes les notifications
              </p>
            </div>
            <Switch
              id="enabled"
              checked={watch("enabled")}
              onCheckedChange={(checked) => setValue("enabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Canaux de notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_enabled">Notifications par email</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir les notifications par email
              </p>
            </div>
            <Switch
              id="email_enabled"
              checked={watch("email_enabled")}
              onCheckedChange={(checked) => setValue("email_enabled", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms_enabled">Notifications par SMS</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir les notifications par SMS
              </p>
            </div>
            <Switch
              id="sms_enabled"
              checked={watch("sms_enabled")}
              onCheckedChange={(checked) => setValue("sms_enabled", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="app_enabled">Notifications dans l'application</Label>
              <p className="text-sm text-muted-foreground">
                Afficher les notifications dans l'application
              </p>
            </div>
            <Switch
              id="app_enabled"
              checked={watch("app_enabled")}
              onCheckedChange={(checked) => setValue("app_enabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Types de notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="critical_alerts">Alertes critiques</Label>
              <p className="text-sm text-muted-foreground">
                Notifications pour les cas critiques
              </p>
            </div>
            <Switch
              id="critical_alerts"
              checked={watch("critical_alerts")}
              onCheckedChange={(checked) => setValue("critical_alerts", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="warning_alerts">Alertes d'avertissement</Label>
              <p className="text-sm text-muted-foreground">
                Notifications pour les avertissements
              </p>
            </div>
            <Switch
              id="warning_alerts"
              checked={watch("warning_alerts")}
              onCheckedChange={(checked) => setValue("warning_alerts", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="system_notifications">Notifications système</Label>
              <p className="text-sm text-muted-foreground">
                Notifications système et mises à jour
              </p>
            </div>
            <Switch
              id="system_notifications"
              checked={watch("system_notifications")}
              onCheckedChange={(checked) => setValue("system_notifications", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paramètres de timing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminder_time">Heure de rappel quotidien</Label>
            <Input
              id="reminder_time"
              type="time"
              {...register("reminder_time")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email_template">Modèle d'email par défaut</Label>
            <Select
              value={watch("email_template")}
              onValueChange={(value) => setValue("email_template", value)}
            >
              <SelectTrigger id="email_template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Par défaut</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="detailed">Détaillé</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
