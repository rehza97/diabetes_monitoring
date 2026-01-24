import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function UserForm() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="first_name">Prénom</Label>
        <Input id="first_name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="last_name">Nom</Label>
        <Input id="last_name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Rôle</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrateur</SelectItem>
            <SelectItem value="doctor">Médecin</SelectItem>
            <SelectItem value="nurse">Infirmière</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">
        Enregistrer
      </Button>
    </form>
  );
}
