import { Button } from "@/components/ui/button";
import { Download, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionsProps {
  selectedCount: number;
  onExport?: () => void;
  onDelete?: () => void;
  onClear?: () => void;
  exportLabel?: string;
  deleteLabel?: string;
  className?: string;
}

export function BulkActions({
  selectedCount,
  onExport,
  onDelete,
  onClear,
  exportLabel = "Exporter",
  deleteLabel = "Supprimer",
  className,
}: BulkActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {selectedCount} élément{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
        </span>
        {onClear && (
          <Button variant="ghost" size="sm" onClick={onClear} aria-label="Désélectionner tout">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            {exportLabel}
          </Button>
        )}
        {onDelete && (
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
