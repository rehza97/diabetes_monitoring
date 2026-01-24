import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getSettingsByCategory, updateSetting, createSetting } from "@/lib/firestore-helpers";
import type { FirestoreSetting } from "@/types/firestore";

interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: string;
  from_email: string;
  from_name: string;
  email_signature: string;
  test_email: string;
}

export function EmailSettingsForm() {
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
  } = useForm<EmailSettings>({
    defaultValues: {
      smtp_host: "",
      smtp_port: 587,
      smtp_username: "",
      smtp_password: "",
      smtp_encryption: "tls",
      from_email: "",
      from_name: "",
      email_signature: "",
      test_email: "",
    },
  });

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const emailSettings = await getSettingsByCategory("email");
        setSettings(emailSettings);
        
        const settingsMap = new Map(emailSettings.map(s => [s.key, s.value]));
        reset({
          smtp_host: settingsMap.get("email.smtp_host") ?? "",
          smtp_port: settingsMap.get("email.smtp_port") ?? 587,
          smtp_username: settingsMap.get("email.smtp_username") ?? "",
          smtp_password: settingsMap.get("email.smtp_password") ?? "",
          smtp_encryption: settingsMap.get("email.smtp_encryption") ?? "tls",
          from_email: settingsMap.get("email.from_email") ?? "",
          from_name: settingsMap.get("email.from_name") ?? "",
          email_signature: settingsMap.get("email.email_signature") ?? "",
          test_email: "",
        });
      } catch (error) {
        console.error("Error loading email settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [reset]);

  const onSubmit = async (data: EmailSettings) => {
    if (!currentUser?.uid) {
      addNotification({
        type: "error",
        title: "Erreur",
        message: "Vous devez être connecté pour sauvegarder les paramètres.",
      });
      return;
    }
    
    try {
      const settingsMap = new Map(settings.map(s => [s.key, s]));
      const keyValueMap: Record<string, any> = {
        "email.smtp_host": data.smtp_host,
        "email.smtp_port": data.smtp_port,
        "email.smtp_username": data.smtp_username,
        "email.smtp_password": data.smtp_password,
        "email.smtp_encryption": data.smtp_encryption,
        "email.from_email": data.from_email,
        "email.from_name": data.from_name,
        "email.email_signature": data.email_signature,
      };
      
      await Promise.all(
        Object.entries(keyValueMap).map(async ([key, value]) => {
          const existingSetting = settingsMap.get(key);
          if (existingSetting) {
            await updateSetting(existingSetting.id, value, currentUser.uid);
          } else {
            await createSetting({ key, value, category: "email" }, currentUser.uid);
          }
        })
      );
      
      addNotification({
        type: "success",
        title: "Paramètres sauvegardés",
        message: "Les paramètres email ont été sauvegardés avec succès.",
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

  const handleTestEmail = () => {
    // TODO: Envoyer email de test
    console.log("Test email to:", watch("test_email"));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="smtp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="smtp">Configuration SMTP</TabsTrigger>
          <TabsTrigger value="templates">Modèles d'email</TabsTrigger>
          <TabsTrigger value="signature">Signature</TabsTrigger>
        </TabsList>

        <TabsContent value="smtp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paramètres SMTP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">
                    Serveur SMTP <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="smtp_host"
                    placeholder="smtp.example.com"
                    {...register("smtp_host", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">
                    Port <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    {...register("smtp_port", { valueAsNumber: true, required: true })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp_username">Nom d'utilisateur</Label>
                  <Input
                    id="smtp_username"
                    {...register("smtp_username")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">Mot de passe</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    {...register("smtp_password")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_encryption">Chiffrement</Label>
                <select
                  id="smtp_encryption"
                  {...register("smtp_encryption")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="none">Aucun</option>
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from_email">
                    Email expéditeur <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="from_email"
                    type="email"
                    placeholder="noreply@example.com"
                    {...register("from_email", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_name">Nom expéditeur</Label>
                  <Input
                    id="from_name"
                    placeholder="Système de Monitoring"
                    {...register("from_name")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_email">Email de test</Label>
                <div className="flex gap-2">
                  <Input
                    id="test_email"
                    type="email"
                    placeholder="test@example.com"
                    {...register("test_email")}
                  />
                  <Button type="button" variant="outline" onClick={handleTestEmail}>
                    Envoyer test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Modèles d'email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Modèle de notification</Label>
                <Textarea
                  rows={10}
                  defaultValue={`Bonjour,

Une nouvelle notification a été générée dans le système.

Détails:
- Type: {type}
- Message: {message}
- Date: {date}

Cordialement,
Système de Monitoring du Diabète`}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Modèle d'alerte critique</Label>
                <Textarea
                  rows={10}
                  defaultValue={`ALERTE CRITIQUE

Un cas critique nécessite votre attention immédiate.

Patient: {patient_name}
Valeur: {value} mg/dL
Date: {date}

Veuillez prendre les mesures nécessaires.

Système de Monitoring du Diabète`}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signature" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signature email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email_signature">Signature par défaut</Label>
                <Textarea
                  id="email_signature"
                  rows={6}
                  placeholder="Cordialement,&#10;L'équipe du Système de Monitoring du Diabète"
                  {...register("email_signature")}
                />
                <p className="text-sm text-muted-foreground">
                  Cette signature sera ajoutée à tous les emails envoyés par le système
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
