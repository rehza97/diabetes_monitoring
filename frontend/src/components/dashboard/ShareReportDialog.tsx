import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Check, Calendar, Lock, Globe } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ShareReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId?: string;
  reportName?: string;
  onShare?: (shareConfig: ShareConfig) => void;
}

export interface ShareConfig {
  link: string;
  isPublic: boolean;
  expiresAt?: Date;
  password?: string;
  permissions: {
    view: boolean;
    download: boolean;
    print: boolean;
  };
}

export function ShareReportDialog({
  open,
  onOpenChange,
  reportId,
  reportName = "Rapport",
  onShare,
}: ShareReportDialogProps) {
  const effectiveReportId = reportId ?? "preview";
  const { addNotification } = useNotification();
  const [shareConfig, setShareConfig] = useState<ShareConfig>({
    link: "",
    isPublic: false,
    expiresAt: addDays(new Date(), 7),
    permissions: {
      view: true,
      download: true,
      print: false,
    },
  });
  const [copied, setCopied] = useState(false);
  const [isExpiryOpen, setIsExpiryOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const baseUrl = window.location.origin;
      setShareConfig((prev) => ({
        ...prev,
        link: `${baseUrl}/shared/reports/${effectiveReportId}?token=${token}`,
      }));
    }
  }, [open, effectiveReportId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareConfig.link);
    setCopied(true);
    addNotification({
      type: "success",
      title: "Lien copié",
      message: "Le lien a été copié dans le presse-papier",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (onShare) {
      onShare(shareConfig);
    }
    addNotification({
      type: "success",
      title: "Rapport partagé",
      message: "Le lien de partage a été généré avec succès",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Partager le rapport
          </DialogTitle>
          <DialogDescription>
            Générez un lien de partage pour "{reportName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Lien généré */}
          <div className="space-y-2">
            <Label>Lien de partage</Label>
            <div className="flex gap-2">
              <Input value={shareConfig.link} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Partagez ce lien avec les personnes autorisées
            </p>
          </div>

          {/* Type de partage */}
          <div className="space-y-2">
            <Label>Type de partage</Label>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {shareConfig.isPublic ? (
                  <Globe className="h-5 w-5 text-primary" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <div className="font-medium">
                    {shareConfig.isPublic ? "Public" : "Privé"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {shareConfig.isPublic
                      ? "Accessible à tous avec le lien"
                      : "Nécessite une authentification"}
                  </div>
                </div>
              </div>
              <Switch
                checked={shareConfig.isPublic}
                onCheckedChange={(checked) =>
                  setShareConfig((prev) => ({ ...prev, isPublic: checked }))
                }
              />
            </div>
          </div>

          {/* Date d'expiration */}
          <div className="space-y-2">
            <Label>Date d'expiration (optionnel)</Label>
            <Popover open={isExpiryOpen} onOpenChange={setIsExpiryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !shareConfig.expiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {shareConfig.expiresAt
                    ? format(shareConfig.expiresAt, "dd/MM/yyyy", { locale: fr })
                    : "Aucune expiration"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={shareConfig.expiresAt}
                  onSelect={(date) => {
                    setShareConfig((prev) => ({ ...prev, expiresAt: date }));
                    setIsExpiryOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            {shareConfig.expiresAt && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setShareConfig((prev) => ({ ...prev, expiresAt: undefined }))}
              >
                Supprimer l'expiration
              </Button>
            )}
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Visualiser</div>
                  <div className="text-sm text-muted-foreground">
                    Permet de voir le rapport
                  </div>
                </div>
                <Switch
                  checked={shareConfig.permissions.view}
                  onCheckedChange={(checked) =>
                    setShareConfig((prev) => ({
                      ...prev,
                      permissions: { ...prev.permissions, view: checked },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Télécharger</div>
                  <div className="text-sm text-muted-foreground">
                    Permet de télécharger le rapport
                  </div>
                </div>
                <Switch
                  checked={shareConfig.permissions.download}
                  onCheckedChange={(checked) =>
                    setShareConfig((prev) => ({
                      ...prev,
                      permissions: { ...prev.permissions, download: checked },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Imprimer</div>
                  <div className="text-sm text-muted-foreground">
                    Permet d'imprimer le rapport
                  </div>
                </div>
                <Switch
                  checked={shareConfig.permissions.print}
                  onCheckedChange={(checked) =>
                    setShareConfig((prev) => ({
                      ...prev,
                      permissions: { ...prev.permissions, print: checked },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Badges d'info */}
          <div className="flex gap-2 flex-wrap">
            {shareConfig.isPublic && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Public
              </Badge>
            )}
            {shareConfig.expiresAt && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Expire le {format(shareConfig.expiresAt, "dd/MM/yyyy", { locale: fr })}
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Générer le lien
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
