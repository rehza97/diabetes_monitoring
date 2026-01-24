import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ReportPreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aperçu du rapport</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Aperçu du rapport à implémenter</p>
      </CardContent>
    </Card>
  );
}
