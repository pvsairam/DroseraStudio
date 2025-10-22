import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Download, Filter, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusPill from "./StatusPill";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  title?: string;
}

export default function DataTable({ columns, data, title }: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleExport = () => {
    // Convert data to CSV
    const headers = columns.map(col => col.label).join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // Escape commas and quotes in CSV
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    // Download CSV file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'data'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Filter data by search term
  const filteredData = searchTerm
    ? data.filter(row =>
        columns.some(col => {
          const value = row[col.key];
          return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      )
    : data;

  const sortedData = sortKey
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        const modifier = sortDirection === "asc" ? 1 : -1;
        return aVal > bVal ? modifier : -modifier;
      })
    : filteredData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className="bg-card border border-card-border rounded-lg overflow-hidden"
      data-testid="data-table"
    >
      {title && (
        <>
          <div className="p-4 border-b border-card-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFilterOpen(!filterOpen)}
                data-testid="button-filter-table"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {searchTerm && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                    1
                  </span>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleExport}
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          {filterOpen && (
            <div className="p-4 border-b border-card-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search all columns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                  data-testid="input-search"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    data-testid="button-clear-search"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 hover-elevate rounded px-2 py-1 -mx-2"
                      data-testid={`button-sort-${col.key}`}
                    >
                      {col.label}
                      {sortKey === col.key && (
                        <>
                          {sortDirection === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </>
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {sortedData.map((row, i) => (
              <tr key={i} className="hover-elevate" data-testid={`row-${i}`}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-foreground">
                    {col.key === "status" && typeof row[col.key] === "string" ? (
                      <StatusPill label={row[col.key]} status={row[col.key] as any} />
                    ) : col.key === "contract" && row.contractUrl ? (
                      <a
                        href={row.contractUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        data-testid={`link-contract-${i}`}
                      >
                        {row.contractDisplay || row[col.key]}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      row[col.key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
