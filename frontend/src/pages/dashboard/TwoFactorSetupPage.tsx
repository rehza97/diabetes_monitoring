import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ArrowLeft, CheckCircle2, AlertCircle, Copy, Download } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function TwoFactorSetupPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [step, setStep] = useState<"setup" | "verify" | "complete">("setup");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Placeholder data - would come from backend API
  const [secret, setSecret] = useState("JBSWY3DPEHPK3PXP");
  const [qrCodeUrl, setQrCodeUrl] = useState("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RUiBDb2RlIFBsYWNlaG9sZGVyPC90ZXh0Pjwvc3ZnPg==");
  const [backupCodes] = useState([
    "1234-5678",
    "2345-6789",
    "3456-7890",
    "4567-8901",
    "5678-9012",
    "6789-0123",
    "7890-1234",
    "8901-2345",
  ]);

  const handleSetup2FA = async () => {
    setLoading(true);
    setError("");
    
    try {
      // TODO: Call backend API to generate 2FA secret and QR code
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // In real implementation, this would come from the API
      setStep("verify");
      addNotification({
        type: "info",
        title: "2FA Configuration",
        message: "Scannez le code QR avec votre application d'authentification",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la configuration 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Le code de vérification doit contenir 6 chiffres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // TODO: Call backend API to verify the code
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setStep("complete");
      addNotification({
        type: "success",
        title: "2FA Activé",
        message: "L'authentification à deux facteurs a été activée avec succès.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code de vérification invalide");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    addNotification({
      type: "success",
      title: "Code copié",
      message: "Le code secret a été copié dans le presse-papiers",
    });
  };

  const handleDownloadBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "backup-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    addNotification({
      type: "success",
      title: "Code copié",
      message: "Le code de sauvegarde a été copié",
    });
  };

  if (step === "setup") {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/settings")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Configuration 2FA</h1>
              <p className="text-muted-foreground mt-1">
                Activez l'authentification à deux facteurs pour sécuriser votre compte
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Étape 1: Préparation</CardTitle>
              <CardDescription>
                Pour activer 2FA, vous aurez besoin d'une application d'authentification comme Google Authenticator, Authy ou Microsoft Authenticator.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Assurez-vous d'avoir installé une application d'authentification sur votre téléphone avant de continuer.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h3 className="font-semibold">Instructions:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Installez une application d'authentification sur votre téléphone</li>
                  <li>Cliquez sur "Générer le code QR" ci-dessous</li>
                  <li>Scannez le code QR avec votre application</li>
                  <li>Entrez le code de vérification généré par l'application</li>
                </ol>
              </div>

              <Button onClick={handleSetup2FA} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Génération en cours...
                  </>
                ) : (
                  "Générer le code QR"
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (step === "verify") {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setStep("setup")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Vérification 2FA</h1>
              <p className="text-muted-foreground mt-1">
                Scannez le code QR et entrez le code de vérification
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Étape 2: Scanner le code QR</CardTitle>
              <CardDescription>
                Ouvrez votre application d'authentification et scannez ce code QR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="border-2 border-border rounded-lg p-4 bg-background">
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                </div>
                
                <div className="w-full space-y-2">
                  <Label htmlFor="secret">Code secret (si vous ne pouvez pas scanner)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secret"
                      value={secret}
                      readOnly
                      className="font-mono"
                    />
                    <Button variant="outline" onClick={handleCopySecret}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verificationCode">Code de vérification</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setVerificationCode(value);
                    setError("");
                  }}
                  className="text-center text-2xl tracking-widest font-mono"
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
                <Button variant="outline" onClick={() => setStep("setup")} className="flex-1">
                  Retour
                </Button>
                <Button onClick={handleVerify} disabled={loading || verificationCode.length !== 6} className="flex-1">
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Vérification...
                    </>
                  ) : (
                    "Vérifier et activer"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Step: complete
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/settings")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">2FA Activé</h1>
            <p className="text-muted-foreground mt-1">
              L'authentification à deux facteurs a été activée avec succès
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Configuration terminée
            </CardTitle>
            <CardDescription>
              Votre compte est maintenant protégé par l'authentification à deux facteurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Conservez ces codes de sauvegarde en lieu sûr. Vous en aurez besoin si vous perdez l'accès à votre application d'authentification.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Codes de sauvegarde</Label>
                <Button variant="outline" size="sm" onClick={handleDownloadBackupCodes}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg bg-muted/50">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-background rounded border"
                  >
                    <code className="text-sm font-mono">{code}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopyBackupCode(code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/dashboard/settings")} className="flex-1">
                Retour aux paramètres
              </Button>
              <Button onClick={() => navigate("/dashboard")} className="flex-1">
                Aller au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
