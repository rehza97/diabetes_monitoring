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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReadingRanges {
  normal_min: number;
  normal_max: number;
  warning_min: number;
  warning_max: number;
  critical_min: number;
  critical_max: number;
  default_unit: "mg/dL" | "mmol/L";
}

export function ReadingRangesForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
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

  const onSubmit = async (data: ReadingRanges) => {
    // TODO: Appel API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Ranges saved:", data);
  };

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
                {...register("normal_min", { valueAsNumber: true, required: true })}
              />
            </div>
            <div>
              <Label htmlFor="normal_max">Maximum (mg/dL)</Label>
              <Input
                id="normal_max"
                type="number"
                {...register("normal_max", { valueAsNumber: true, required: true })}
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
                {...register("warning_min", { valueAsNumber: true, required: true })}
              />
            </div>
            <div>
              <Label htmlFor="warning_max">Maximum (mg/dL)</Label>
              <Input
                id="warning_max"
                type="number"
                {...register("warning_max", { valueAsNumber: true, required: true })}
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
