import { useForm } from "react-hook-form";
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
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

  const onSubmit = async (data: GeneralSettings) => {
    // TODO: Appel API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Settings saved:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hospital_name">Nom de l'hôpital/clinique</Label>
        <Input id="hospital_name" {...register("hospital_name", { required: true })} />
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
          <Input id="contact_email" type="email" {...register("contact_email", { required: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Téléphone de contact</Label>
          <Input id="contact_phone" {...register("contact_phone", { required: true })} />
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
          <Select
            value={watch("timezone")}
            onValueChange={(value) => setValue("timezone", value)}
          >
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
          <Select
            value={watch("currency")}
            onValueChange={(value) => setValue("currency", value)}
          >
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
