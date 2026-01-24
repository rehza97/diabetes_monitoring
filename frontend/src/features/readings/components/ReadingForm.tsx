import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ReadingForm() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="value">Valeur (mg/dL)</Label>
        <Input id="value" type="number" placeholder="120" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type de lecture</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fasting">À jeun</SelectItem>
            <SelectItem value="post_breakfast">Après le petit-déjeuner</SelectItem>
            <SelectItem value="pre_lunch">Avant le déjeuner</SelectItem>
            <SelectItem value="post_lunch">Après le déjeuner</SelectItem>
            <SelectItem value="pre_dinner">Avant le dîner</SelectItem>
            <SelectItem value="post_dinner">Après le dîner</SelectItem>
            <SelectItem value="bedtime">Avant de se coucher</SelectItem>
            <SelectItem value="random">Aléatoire</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Notes optionnelles..." />
      </div>
      <Button type="submit" className="w-full">
        Enregistrer la lecture
      </Button>
    </form>
  );
}
