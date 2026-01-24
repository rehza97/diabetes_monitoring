import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { AlertCircle } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";

interface TwoFactorFormProps {
  onVerify: (code: string) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function TwoFactorForm({ onVerify, onCancel, loading = false }: TwoFactorFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const { addNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code || code.length !== 6) {
      setError("Le code de vérification doit contenir 6 chiffres");
      return;
    }

    try {
      await onVerify(code);
      setCode("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Code de vérification invalide";
      setError(errorMessage);
      addNotification({
        type: "error",
        title: "Erreur de vérification",
        message: errorMessage,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="twoFactorCode">Code de vérification 2FA</Label>
        <Input
          id="twoFactorCode"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            setCode(value);
            setError("");
          }}
          className="text-center text-2xl tracking-widest font-mono"
          disabled={loading}
          autoFocus
        />
        <p className="text-sm text-muted-foreground">
          Entrez le code à 6 chiffres généré par votre application d'authentification
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={loading || code.length !== 6} className="flex-1">
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Vérification...
            </>
          ) : (
            "Vérifier"
          )}
        </Button>
      </div>
    </form>
  );
}
