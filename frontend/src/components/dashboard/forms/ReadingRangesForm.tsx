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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { getSettingsByCategory, updateSetting, createSetting } from "@/lib/firestore-helpers";
import type { FirestoreSetting } from "@/types/firestore";

interface ReadingRanges {
  normal_min: number;
  normal_max: number;
  warning_min: number;
  warning_max: number;
  critical_min: number;
  critical_max: number;
  default_unit: "mg/dL" | "mmol/L";
}

function num(v: unknown): number {
  const n = typeof v === "number" && !isNaN(v) ? v : Number(v);
  return typeof n === "number" && !isNaN(n) ? n : 0;
}

export function ReadingRangesForm() {
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
  } = useForm<ReadingRanges>({
    defaultValues: {
      normal_min: 70,
      normal_max: 140,
      warning_min: 140,
      warning_max: 180,
      critical_min: 0,
      critical_max: 0,
      default_unit: "mg/dL",
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const measurementSettings = await getSettingsByCategory("measurements");
        setSettings(measurementSettings);
        const m = new Map(measurementSettings.map((s) => [s.key, s.value]));
        reset({
          normal_min: num(m.get("measurements.normal_min")) || 70,
          normal_max: num(m.get("measurements.normal_max")) || 140,
          warning_min: num(m.get("measurements.warning_min")) || 140,
          warning_max: num(m.get("measurements.warning_max")) || 180,
          critical_min: num(m.get("measurements.critical_min")) || 0,
          critical_max: num(m.get("measurements.critical_max")) || 0,
          default_unit: (m.get("measurements.default_unit") as "mg/dL" | "mmol/L") || "mg/dL",
        });
      } catch {
        addNotification({
          type: "error",
          title: "Erreur",
          message: "Impossible de charger les paramètres des mesures.",
        });
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [reset, addNotification]);

  const onSubmit = async (data: ReadingRanges) => {
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
      const keyValueMap: Record<string, number | string> = {
        "measurements.normal_min": data.normal_min,
        "measurements.normal_max": data.normal_max,
        "measurements.warning_min": data.warning_min,
        "measurements.warning_max": data.warning_max,
        "measurements.critical_min": data.critical_min,
        "measurements.critical_max": data.critical_max,
        "measurements.default_unit": data.default_unit,
      };
      await Promise.all(
        Object.entries(keyValueMap).map(async ([key, value]) => {
          const existing = settingsMap.get(key);
          if (existing) {
            await updateSetting(existing.id, value, currentUserId);
          } else {
            await createSetting({ key, value, category: "measurements" }, currentUserId);
          }
        })
      );
      addNotification({
        type: "success",
        title: "Paramètres sauvegardés",
        message: "Les plages de mesures ont été sauvegardées avec succès.",
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="default_unit">Unité de mesure par défaut</Label>
        <Select
          value={watch("default_unit")}
          onValueChange={(value) => setValue("default_unit", value as "mg/dL" | "mmol/L")}
        >
          <SelectTrigger id="default_unit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mg/dL">mg/dL</SelectItem>
            <SelectItem value="mmol/L">mmol/L</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-success">Normal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label htmlFor="normal_min">Minimum (mg/dL)</Label>
              <Input
                id="normal_min"
                type="number"
                {...register("normal_min", { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="normal_max">Maximum (mg/dL)</Label>
              <Input
                id="normal_max"
                type="number"
                {...register("normal_max", { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-warning">Avertissement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label htmlFor="warning_min">Minimum (mg/dL)</Label>
              <Input
                id="warning_min"
                type="number"
                {...register("warning_min", { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="warning_max">Maximum (mg/dL)</Label>
              <Input
                id="warning_max"
                type="number"
                {...register("warning_max", { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">Critique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label htmlFor="critical_min">Minimum (mg/dL)</Label>
              <Input
                id="critical_min"
                type="number"
                {...register("critical_min", { valueAsNumber: true })}
                placeholder="< 70"
              />
            </div>
            <div>
              <Label htmlFor="critical_max">Maximum (mg/dL)</Label>
              <Input
                id="critical_max"
                type="number"
                {...register("critical_max", { valueAsNumber: true })}
                placeholder="> 180"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Enregistrement...
          </>
        ) : (
          "Enregistrer les plages"
        )}
      </Button>
    </form>
  );
}
