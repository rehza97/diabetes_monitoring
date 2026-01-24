import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export function FilterPanel() {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-muted/50 p-4">
      <div className="space-y-2">
        <Label>Patient</Label>
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tous les patients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les patients</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Période</Label>
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Toutes les périodes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les périodes</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="icon">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
