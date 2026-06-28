"use client";

import { useEffect, useState, useTransition } from "react";
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  RefreshCw,
  AlertCircle,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AuditLog = {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string;
  created_at: string;
};

type FilterMetadata = {
  actions: string[];
  entityTypes: string[];
};

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(15);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("all-actions");
  const [selectedEntityType, setSelectedEntityType] = useState("all-entities");
  const [filterMeta, setFilterMeta] = useState<FilterMetadata>({ actions: [], entityTypes: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load distinct filters on mount
  useEffect(() => {
    async function loadFilters() {
      try {
        const res = await fetch("/api/audit/filters");
        if (res.ok) {
          const data = await res.json();
          setFilterMeta(data);
        }
      } catch (err) {
        console.error("Failed to load audit filters", err);
      }
    }
    loadFilters();
  }, []);

  // Fetch paginated logs
  async function fetchLogs() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
      if (selectedAction !== "all-actions") params.append("action", selectedAction);
      if (selectedEntityType !== "all-entities") params.append("entity_type", selectedEntityType);
      params.append("page", String(currentPage));
      params.append("limit", String(limit));

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Could not retrieve audit logs.");
      }
      const data = await res.json();
      setLogs(data.logs);
      setTotalCount(data.totalCount);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs.");
      toast.error(err.message || "Could not retrieve audit logs.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-fetch whenever page or dropdown filters change
  useEffect(() => {
    fetchLogs();
  }, [currentPage, selectedAction, selectedEntityType]);

  // Debounced search query fetching to avoid spamming the database on every keystroke
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      fetchLogs();
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Reset all filters
  function handleResetAll() {
    setSearchQuery("");
    setSelectedAction("all-actions");
    setSelectedEntityType("all-entities");
    setCurrentPage(1);
  }

  // Export current matching logs to CSV
  async function handleExportCSV() {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
      if (selectedAction !== "all-actions") params.append("action", selectedAction);
      if (selectedEntityType !== "all-entities") params.append("entity_type", selectedEntityType);
      params.append("page", "1");
      params.append("limit", "1000"); // Fetch all logs up to 1000 for export

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch logs for export");
      }
      const data = await res.json();
      const exportLogs: AuditLog[] = data.logs;

      if (exportLogs.length === 0) {
        toast.warning("No records found to export");
        return;
      }

      // Build CSV string
      const headers = ["Log ID", "Action", "Entity Type", "Entity ID", "Details", "Timestamp"];
      const rows = exportLogs.map(log => [
        log.id,
        log.action,
        log.entity_type,
        log.entity_id ?? "N/A",
        `"${log.details.replace(/"/g, '""')}"`, // escape quotes
        log.created_at
      ]);

      const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `audit_trail_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${exportLogs.length} logs to CSV`);
    } catch (err) {
      toast.error("Failed to generate CSV export");
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  function getActionBadgeStyle(action: string) {
    if (action.includes("CREATE")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40";
    }
    if (action.includes("DELETE") || action.includes("UNENROLL")) {
      return "bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40";
    }
    return "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40";
  }

  const hasActiveFilters = selectedAction !== "all-actions" || selectedEntityType !== "all-entities" || searchQuery.trim() !== "";

  return (
    <main className="p-6 sm:p-8 lg:p-10 text-zinc-950 dark:text-zinc-50 min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              System Operations
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              System Audit Trail
            </h1>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:min-w-80">
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Total Logs</p>
                <p className="mt-0.5 text-2xl font-bold text-zinc-900 dark:text-white leading-none">{totalCount}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Filtered</p>
                <p className="mt-0.5 text-2xl font-bold text-zinc-900 dark:text-white leading-none">{logs.length}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <RefreshCw className="h-4 w-4" />
              </div>
            </div>
          </div>
        </header>

        {/* Search and Filters horizontal bar (No Card wrapper) */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-2 border-b border-zinc-150/40 dark:border-zinc-800/20 pb-4">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center w-full">
            
            {/* Search Input Box */}
            <div className="relative flex-1 max-w-lg min-w-72">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input
                  className="pl-9 pr-3 h-10 w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                  placeholder="Search log details or entity ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Action Dropdown Filter */}
            <div className="sm:w-52 shrink-0">
              <Select 
                value={selectedAction} 
                onValueChange={(val) => {
                  setSelectedAction(val ?? "all-actions");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-10! border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                  <SelectValue placeholder="All Actions">
                    {selectedAction === "all-actions" ? "All Actions" : selectedAction.replace("_", " ")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} side="bottom" align="start" className="min-w-[--anchor-width]! w-max! max-h-48 overflow-y-auto">
                  <SelectItem value="all-actions">All Actions</SelectItem>
                  {filterMeta.actions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Entity Dropdown Filter */}
            <div className="sm:w-52 shrink-0">
              <Select 
                value={selectedEntityType} 
                onValueChange={(val) => {
                  setSelectedEntityType(val ?? "all-entities");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-10! border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                  <SelectValue placeholder="All Entity Types">
                    {selectedEntityType === "all-entities" ? "All Entity Types" : selectedEntityType}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} side="bottom" align="start" className="min-w-[--anchor-width]! w-max! max-h-48 overflow-y-auto">
                  <SelectItem value="all-entities">All Entity Types</SelectItem>
                  {filterMeta.entityTypes.map(entity => (
                    <SelectItem key={entity} value={entity}>
                      {entity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions button */}
            <div className="flex gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleExportCSV}
                disabled={logs.length === 0}
                className="h-10 px-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>

          {/* Quick Refresh Icon */}
          <div className="shrink-0 flex items-center justify-end">
            <Button
              variant="outline"
              onClick={fetchLogs}
              disabled={loading}
              className="h-10 w-10 p-0 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 flex items-center justify-center rounded-lg shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </section>

        {/* Filter Chips Display Area */}
        {hasActiveFilters && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 -mt-4 px-1.5">
            {/* Chips on the left */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Active filters:</span>
              
              {searchQuery.trim() !== "" && (
                <div className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs px-3 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-700/60">
                  <span className="font-semibold">Query:</span>
                  <span>"{searchQuery}"</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="hover:bg-zinc-200 dark:hover:bg-zinc-700 p-0.5 rounded-full text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-205 ml-1 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {selectedAction !== "all-actions" && (
                <div className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-xs px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/40">
                  <span className="font-semibold">Action:</span>
                  <span>{selectedAction.replace("_", " ")}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedAction("all-actions")}
                    className="hover:bg-indigo-100 dark:hover:bg-indigo-950/60 p-0.5 rounded-full text-indigo-500 hover:text-indigo-750 dark:hover:text-indigo-305 ml-1 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {selectedEntityType !== "all-entities" && (
                <div className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 text-xs px-3 py-1 rounded-full border border-purple-100 dark:border-purple-900/40">
                  <span className="font-semibold">Entity:</span>
                  <span>{selectedEntityType}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedEntityType("all-entities")}
                    className="hover:bg-purple-100 dark:hover:bg-purple-950/60 p-0.5 rounded-full text-purple-500 hover:text-purple-750 dark:hover:text-purple-305 ml-1 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleResetAll}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-semibold underline transition-colors ml-1"
              >
                Reset Filters
              </button>
            </div>

            {/* Total counts display */}
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 select-none">
              Found {totalCount} {totalCount === 1 ? "record" : "records"}
            </div>
          </div>
        )}

        {/* Logs Table Area */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-555 italic">Fetching audit trail history...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mb-3">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Query Failed</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-semibold text-zinc-450 dark:text-zinc-500 italic">No audit records found matching criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-950/30 text-xs text-zinc-400 dark:text-zinc-500 font-bold border-b border-zinc-200/50 dark:border-zinc-800">
                    <th className="px-6 py-4 text-left font-semibold">Timestamp</th>
                    <th className="px-6 py-4 text-left font-semibold">Action</th>
                    <th className="px-6 py-4 text-left font-semibold">Target Entity</th>
                    <th className="px-6 py-4 text-left font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/80">
                  {logs.map((log) => {
                    const dateFormatted = new Date(log.created_at).toLocaleString();
                    return (
                      <tr key={log.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 transition-colors text-sm">
                        {/* Timestamp */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                          {dateFormatted}
                        </td>
                        {/* Action Badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant="outline" 
                            className={`font-semibold border text-[10px] px-2 py-0.5 ${getActionBadgeStyle(log.action)}`}
                          >
                            {log.action}
                          </Badge>
                        </td>
                        {/* Target Entity */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-semibold text-zinc-650 dark:text-zinc-400 uppercase tracking-wide">{log.entity_type}</span>
                            {log.entity_id && (
                              <span className="font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                ID: {log.entity_id}
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Details description */}
                        <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300 font-medium max-w-sm xl:max-w-md truncate">
                          {log.details}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Pagination Controls */}
        {!loading && logs.length > 0 && (
          <section className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
              Showing <span className="text-zinc-700 dark:text-zinc-300">{(currentPage - 1) * limit + 1}</span> to{" "}
              <span className="text-zinc-700 dark:text-zinc-300">
                {Math.min(currentPage * limit, totalCount)}
              </span>{" "}
              of <span className="text-zinc-700 dark:text-zinc-300">{totalCount}</span> entries
            </div>

            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <button
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <span className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-100 dark:border-zinc-850 px-3 text-xs font-semibold text-zinc-400 dark:text-zinc-650 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900 flex items-center gap-1">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </span>
              )}

              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Page <strong className="text-zinc-900 dark:text-white font-bold">{currentPage}</strong> of <strong className="text-zinc-900 dark:text-white font-bold">{totalPages}</strong>
              </span>

              {currentPage < totalPages ? (
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-100 dark:border-zinc-850 px-3 text-xs font-semibold text-zinc-400 dark:text-zinc-650 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900 flex items-center gap-1">
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
