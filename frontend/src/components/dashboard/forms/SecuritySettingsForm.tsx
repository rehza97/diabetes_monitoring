import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { getSettingsByCategory, updateSetting, createSetting } from "@/lib/firestore-helpers";
import type { FirestoreSetting } from "@/types/firestore";

interface SecuritySettings {
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_special: boolean;
  session_timeout: number;
  two_factor_enabled: boolean;
  auto_logout: boolean;
  ip_whitelist_enabled: boolean;
  ip_addresses: string;
}

export function SecuritySettingsForm() {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? auth.currentUser?.uid ?? null;
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
  } = useForm<SecuritySettings>({
    defaultValues: {
      password_min_length: 8,
      password_require_uppercase: true,
      password_require_lowercase: true,
      password_require_numbers: true,
      password_require_special: false,
      session_timeout: 30,
      two_factor_enabled: false,
      auto_logout: true,
      ip_whitelist_enabled: false,
      ip_addresses: "",
    },
  });

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const securitySettings = await getSettingsByCategory("security");
        setSettings(securitySettings);
        
        const settingsMap = new Map(securitySettings.map(s => [s.key, s.value]));
        reset({
          password_min_length: settingsMap.get("security.password_min_length") ?? 8,
          password_require_uppercase: settingsMap.get("security.password_require_uppercase") ?? true,
          password_require_lowercase: settingsMap.get("security.password_require_lowercase") ?? true,
          password_require_numbers: settingsMap.get("security.password_require_numbers") ?? true,
          password_require_special: settingsMap.get("security.password_require_special") ?? false,
          session_timeout: settingsMap.get("security.session_timeout") ?? 30,
          two_factor_enabled: settingsMap.get("security.two_factor_enabled") ?? false,
          auto_logout: settingsMap.get("security.auto_logout") ?? true,
          ip_whitelist_enabled: settingsMap.get("security.ip_whitelist_enabled") ?? false,
          ip_addresses: settingsMap.get("security.ip_addresses") ?? "",
        });
      } catch (error) {
        console.error("Error loading security settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [reset]);

  const onSubmit = async (data: SecuritySettings) => {
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
        "security.password_min_length": data.password_min_length,
        "security.password_require_uppercase": data.password_require_uppercase,
        "security.password_require_lowercase": data.password_require_lowercase,
        "security.password_require_numbers": data.password_require_numbers,
        "security.password_require_special": data.password_require_special,
        "security.session_timeout": data.session_timeout,
        "security.two_factor_enabled": data.two_factor_enabled,
        "security.auto_logout": data.auto_logout,
        "security.ip_whitelist_enabled": data.ip_whitelist_enabled,
        "security.ip_addresses": data.ip_addresses,
      };
      await Promise.all(
        Object.entries(keyValueMap).map(async ([key, value]) => {
          const existing = settingsMap.get(key);
          if (existing) {
            await updateSetting(existing.id, value, currentUserId);
          } else {
            await createSetting({ key, value, category: "security" }, currentUserId);
          }
        })
      );
      
      addNotification({
        type: "success",
        title: "Paramètres sauvegardés",
        message: "Les paramètres de sécurité ont été sauvegardés avec succès.",
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
          <CardTitle className="text-base">Politique de mots de passe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password_min_length">Longueur minimale</Label>
            <Input
              id="password_min_length"
              type="number"
              min={6}
              max={32}
              {...register("password_min_length", { valueAsNumber: true })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="password_require_uppercase">Exiger majuscules</Label>
              <p className="text-sm text-muted-foreground">
                Le mot de passe doit contenir au moins une majuscule
              </p>
            </div>
            <Switch
              id="password_require_uppercase"
              checked={watch("password_require_uppercase")}
              onCheckedChange={(checked) => setValue("password_require_uppercase", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="password_require_lowercase">Exiger minuscules</Label>
              <p className="text-sm text-muted-foreground">
                Le mot de passe doit contenir au moins une minuscule
              </p>
            </div>
            <Switch
              id="password_require_lowercase"
              checked={watch("password_require_lowercase")}
              onCheckedChange={(checked) => setValue("password_require_lowercase", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="password_require_numbers">Exiger chiffres</Label>
              <p className="text-sm text-muted-foreground">
                Le mot de passe doit contenir au moins un chiffre
              </p>
            </div>
            <Switch
              id="password_require_numbers"
              checked={watch("password_require_numbers")}
              onCheckedChange={(checked) => setValue("password_require_numbers", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="password_require_special">Exiger caractères spéciaux</Label>
              <p className="text-sm text-muted-foreground">
                Le mot de passe doit contenir au moins un caractère spécial
              </p>
            </div>
            <Switch
              id="password_require_special"
              checked={watch("password_require_special")}
              onCheckedChange={(checked) => setValue("password_require_special", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gestion des sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session_timeout">Durée de session (minutes)</Label>
            <Select
              value={watch("session_timeout").toString()}
              onValueChange={(value) => setValue("session_timeout", Number(value))}
            >
              <SelectTrigger id="session_timeout">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 heure</SelectItem>
                <SelectItem value="120">2 heures</SelectItem>
                <SelectItem value="480">8 heures</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto_logout">Déconnexion automatique</Label>
              <p className="text-sm text-muted-foreground">
                Déconnecter automatiquement après inactivité
              </p>
            </div>
            <Switch
              id="auto_logout"
              checked={watch("auto_logout")}
              onCheckedChange={(checked) => setValue("auto_logout", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Authentification à deux facteurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="two_factor_enabled">Activer 2FA</Label>
              <p className="text-sm text-muted-foreground">
                Exiger l'authentification à deux facteurs pour tous les utilisateurs
              </p>
            </div>
            <Switch
              id="two_factor_enabled"
              checked={watch("two_factor_enabled")}
              onCheckedChange={(checked) => setValue("two_factor_enabled", checked)}
            />
          </div>
          {watch("two_factor_enabled") && (
            <div className="space-y-4 p-4 bg-muted rounded-lg border">
              <div className="space-y-2">
                <Label>Configuration 2FA</Label>
                <p className="text-sm text-muted-foreground">
                  Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)
                </p>
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <div className="w-48 h-48 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg">
                    <p className="text-xs text-muted-foreground text-center">
                      QR Code à générer<br />
                      via l'API backend
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Codes de récupération</Label>
                <p className="text-sm text-muted-foreground">
                  Conservez ces codes en lieu sûr. Ils vous permettront de récupérer l'accès si vous perdez votre appareil.
                </p>
                <div className="grid grid-cols-2 gap-2 p-3 bg-background rounded-lg border">
                  {["ABC1-DEF2", "GHI3-JKL4", "MNO5-PQR6", "STU7-VWX8"].map((code, idx) => (
                    <code key={idx} className="text-xs font-mono text-center p-2 bg-muted rounded">
                      {code}
                    </code>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Générer de nouveaux codes
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Appareils de confiance</Label>
                <p className="text-sm text-muted-foreground">
                  Appareils où vous n'aurez pas besoin de saisir le code 2FA pendant 30 jours
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Chrome sur Windows</p>
                      <p className="text-xs text-muted-foreground">192.168.1.100 • Ajouté le 15/01/2024</p>
                    </div>
                    <Button variant="ghost" size="sm">Révoquer</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liste blanche d'adresses IP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ip_whitelist_enabled">Activer la liste blanche</Label>
              <p className="text-sm text-muted-foreground">
                Restreindre l'accès aux adresses IP autorisées
              </p>
            </div>
            <Switch
              id="ip_whitelist_enabled"
              checked={watch("ip_whitelist_enabled")}
              onCheckedChange={(checked) => setValue("ip_whitelist_enabled", checked)}
            />
          </div>
          {watch("ip_whitelist_enabled") && (
            <div className="space-y-2">
              <Label htmlFor="ip_addresses">Adresses IP autorisées (une par ligne)</Label>
              <textarea
                id="ip_addresses"
                {...register("ip_addresses")}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="192.168.1.1&#10;10.0.0.1"
              />
            </div>
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
