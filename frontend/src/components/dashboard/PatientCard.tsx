import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Patient } from "@/types";
import { formatFullName, getInitials, getStatusColor } from "@/utils/helpers";

interface PatientCardProps {
  patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarFallback>
              {getInitials(patient.first_name, patient.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle>{formatFullName(patient.first_name, patient.last_name)}</CardTitle>
            <p className="text-sm text-muted-foreground">N° {patient.file_number}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type de diabète</span>
            <Badge>{patient.diabetes_type}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Statut</span>
            <Badge className={getStatusColor(patient.is_active ? "active" : "inactive")}>
              {patient.is_active ? "Actif" : "Inactif"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
