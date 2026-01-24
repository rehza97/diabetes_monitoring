import { useState, useMemo, useEffect, useCallback, memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { Inbox, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column {
  header: string;
  accessor: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  pageSize?: number;
  onSort?: (column: string, direction: "asc" | "desc") => void;
}

export function DataTable({
  columns,
  data,
  pageSize = 10,
  onSort,
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const dataLength = data.length;
  const totalPages = Math.ceil(dataLength / pageSize);
  
  // Reset to page 1 when data changes and current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [dataLength, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);
  
  // Memoize pagination buttons to prevent ref callback issues
  // Use a stable key based on page numbers to prevent unnecessary re-renders
  const paginationButtons = useMemo(() => {
    if (totalPages === 0) return [];
    
    const buttonCount = Math.min(5, totalPages);
    const buttons: number[] = [];
    
    for (let i = 0; i < buttonCount; i++) {
      let pageNum;
      if (totalPages <= 5) {
        pageNum = i + 1;
      } else if (currentPage <= 3) {
        pageNum = i + 1;
      } else if (currentPage >= totalPages - 2) {
        pageNum = totalPages - 4 + i;
      } else {
        pageNum = currentPage - 2 + i;
      }
      buttons.push(pageNum);
    }
    
    return buttons;
  }, [totalPages, currentPage]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      const newDirection = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(newDirection);
      if (onSort) {
        onSort(column, newDirection);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
      if (onSort) {
        onSort(column, "asc");
      }
    }
  };

  // Memoize page click handlers to prevent ref callback issues
  const handlePageClick = useCallback((pageNum: number) => {
    setCurrentPage(pageNum);
  }, []);

  // Use native buttons for pagination to avoid Radix UI Slot ref issues
  const paginationButtonElements = useMemo(() => {
    return paginationButtons.map((pageNum) => {
      const isActive = currentPage === pageNum;
      return (
        <button
          key={pageNum}
          onClick={() => handlePageClick(pageNum)}
          className={`w-8 h-8 rounded-md text-sm font-medium transition-all ${
            isActive
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground"
          } disabled:pointer-events-none disabled:opacity-50`}
        >
          {pageNum}
        </button>
      );
    });
  }, [paginationButtons, currentPage, handlePageClick]);

  if (dataLength === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aucune donnée"
        description="Il n'y a pas encore de données à afficher."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.accessor}
                  className={cn(
                    column.sortable && "cursor-pointer hover:bg-accent/50",
                    sortColumn === column.accessor && "bg-accent"
                  )}
                  onClick={() => column.sortable && handleSort(column.accessor)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    )}
                    {sortColumn === column.accessor && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.accessor}>
                    {column.render
                      ? column.render(row[column.accessor], row)
                      : typeof row[column.accessor] === "object" &&
                        row[column.accessor] !== null
                      ? String(row[column.accessor])
                      : row[column.accessor] || "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Affichage de {startIndex + 1} à {Math.min(endIndex, dataLength)} sur{" "}
            {dataLength} résultat{dataLength > 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-8 px-3 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>
            <div className="flex items-center gap-1">
              {paginationButtonElements}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-8 px-3 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
