import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { parsePatientExcelFile, downloadPatientImportTemplate } from "@/utils/import/excel";
import { createPatient } from "@/lib/firestore-helpers";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (imported: number, errors: number) => void;
}

export function ImportDialog({ isOpen, onClose, onImportComplete }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleDownloadTemplate = () => {
    downloadPatientImportTemplate();
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setImportResult(null);

    try {
      const { data, errors } = await parsePatientExcelFile(file);

      let imported = 0;
      const importErrors: Array<{ row: number; error: string }> = [...errors];

      // Import each patient
      for (let i = 0; i < data.length; i++) {
        try {
          await createPatient(data[i]);
          imported++;
        } catch (error) {
          importErrors.push({
            row: i + 2,
            error: error instanceof Error ? error.message : "Erreur lors de la création",
          });
        }
      }

      setImportResult({
        imported,
        errors: importErrors,
      });

      if (onImportComplete) {
        onImportComplete(imported, importErrors.length);
      }
    } catch (error) {
      setImportResult({
        imported: 0,
        errors: [
          {
            row: 0,
            error: error instanceof Error ? error.message : "Erreur lors de l'import",
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des patients depuis Excel</DialogTitle>
          <DialogDescription>
            Téléchargez le modèle Excel, remplissez-le avec les données des patients, puis importez-le ici.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Modèle Excel</p>
              <p className="text-sm text-muted-foreground">
                Téléchargez le modèle pour voir le format requis
              </p>
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger le modèle
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Fichier Excel à importer</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Fichier sélectionné: {file.name}
              </p>
            )}
          </div>

          {importResult && (
            <Alert
              variant={importResult.errors.length === 0 ? "default" : "destructive"}
            >
              {importResult.errors.length === 0 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    {importResult.imported} patient(s) importé(s) avec succès.
                  </p>
                  {importResult.errors.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">
                        {importResult.errors.length} erreur(s) :
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {importResult.errors.slice(0, 10).map((err, idx) => (
                          <li key={idx}>
                            Ligne {err.row}: {err.error}
                          </li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li>... et {importResult.errors.length - 10} autre(s) erreur(s)</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleImport} disabled={!file || loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
