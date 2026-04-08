import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Upload } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { getSettingsByCategory, updateSetting, createSetting } from "@/lib/firestore-helpers";
import type { FirestoreSetting } from "@/types/firestore";

interface GeneralSettings {
  hospital_name: string;
  logo?: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  default_language: string;
  timezone: string;
  currency: string;
}

export function GeneralSettingsForm() {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? auth.currentUser?.uid ?? null;
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<FirestoreSetting[]>([]);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<GeneralSettings>({
    defaultValues: {
      hospital_name: "",
      contact_email: "",
      contact_phone: "",
      address: "",
      default_language: "fr",
      timezone: "Africa/Algiers",
      currency: "DZD",
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const generalSettings = await getSettingsByCategory("general");
        setSettings(generalSettings);
        const settingsMap = new Map(generalSettings.map((s) => [s.key, s.value]));
        reset({
          hospital_name: (settingsMap.get("general.hospital_name") as string) ?? "",
          contact_email: (settingsMap.get("general.contact_email") as string) ?? "",
          contact_phone: (settingsMap.get("general.contact_phone") as string) ?? "",
          address: (settingsMap.get("general.address") as string) ?? "",
          default_language: (settingsMap.get("general.default_language") as string) ?? "fr",
          timezone: (settingsMap.get("general.timezone") as string) ?? "Africa/Algiers",
          currency: (settingsMap.get("general.currency") as string) ?? "DZD",
        });
      } catch {
        addNotification({
          type: "error",
          title: "Erreur",
          message: "Impossible de charger les paramètres généraux.",
        });
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [reset, addNotification]);

  const onSubmit = async (data: GeneralSettings) => {
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
      const keyValueMap: Record<string, string> = {
        "general.hospital_name": data.hospital_name,
        "general.contact_email": data.contact_email,
        "general.contact_phone": data.contact_phone,
        "general.address": data.address,
        "general.default_language": data.default_language,
        "general.timezone": data.timezone,
        "general.currency": data.currency,
      };
      await Promise.all(
        Object.entries(keyValueMap).map(async ([key, value]) => {
          const existing = settingsMap.get(key);
          if (existing) {
            await updateSetting(existing.id, value, currentUserId);
          } else {
            await createSetting({ key, value, category: "general" }, currentUserId);
          }
        })
      );
      addNotification({
        type: "success",
        title: "Paramètres sauvegardés",
        message: "Les paramètres généraux ont été sauvegardés avec succès.",
      });
    } catch (err) {
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible de sauvegarder: ${err instanceof Error ? err.message : "Erreur inconnue"}`,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hospital_name">Nom de l'hôpital/clinique</Label>
        <Input id="hospital_name" {...register("hospital_name")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo">Logo</Label>
        <div className="flex items-center gap-2">
          <Input id="logo" type="file" accept="image/*" className="hidden" />
          <Button type="button" variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Choisir un logo
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact_email">Email de contact</Label>
          <Input id="contact_email" type="email" {...register("contact_email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Téléphone de contact</Label>
          <Input id="contact_phone" {...register("contact_phone")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" {...register("address")} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="default_language">Langue par défaut</Label>
          <Select
            value={watch("default_language")}
            onValueChange={(value) => setValue("default_language", value)}
          >
            <SelectTrigger id="default_language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Fuseau horaire</Label>
          <Select value={watch("timezone")} onValueChange={(value) => setValue("timezone", value)}>
            <SelectTrigger id="timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Africa/Algiers">Algérie (UTC+1)</SelectItem>
              <SelectItem value="Europe/Paris">France (UTC+1)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Devise</Label>
          <Select value={watch("currency")} onValueChange={(value) => setValue("currency", value)}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DZD">DZD (دج)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
