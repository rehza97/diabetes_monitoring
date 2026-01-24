import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";
import { commonShortcuts } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const formatKey = (shortcut: typeof commonShortcuts[0]) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.shift) parts.push("Shift");
    if (shortcut.alt) parts.push("Alt");
    parts.push(shortcut.key.toUpperCase());
    return parts.join(" + ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Raccourcis clavier
          </DialogTitle>
          <DialogDescription>
            Liste des raccourcis clavier disponibles dans le tableau de bord
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Navigation</h3>
            {commonShortcuts
              .filter((s) => s.key === "d" || s.key === "p" || s.key === "u")
              .map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="text-sm">{shortcut.description}</span>
                  <Badge variant="outline" className="font-mono">
                    {formatKey(shortcut)}
                  </Badge>
                </div>
              ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Actions</h3>
            {commonShortcuts
              .filter((s) => s.key === "n" || s.key === "r" || s.key === "s" || s.key === "k")
              .map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="text-sm">{shortcut.description}</span>
                  <Badge variant="outline" className="font-mono">
                    {formatKey(shortcut)}
                  </Badge>
                </div>
              ))}
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Les raccourcis clavier ne fonctionnent pas lorsque vous êtes
              en train de saisir du texte dans un champ de formulaire.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
