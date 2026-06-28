"use client";

import { useEffect, useState, useTransition } from "react";
import { 
  Search, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
  const [isPending, startTransition] = useTransition();

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

  // Fetch paginated logs whenever dependencies change
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

  useEffect(() => {
    fetchLogs();
  }, [currentPage, selectedAction, selectedEntityType]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  }

  function handleReset() {
    setSearchQuery("");
    setSelectedAction("all-actions");
    setSelectedEntityType("all-entities");
    setCurrentPage(1);
    toast.success("Filters reset");
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

  function getActionBadgeVariant(action: string) {
    if (action.includes("CREATE")) return "default";
    if (action.includes("DELETE") || action.includes("UNENROLL")) return "destructive";
    return "secondary";
  }

  function getActionBadgeStyle(action: string) {
    if (action.includes("CREATE")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50";
    }
    if (action.includes("DELETE") || action.includes("UNENROLL")) {
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50";
    }
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50";
  }

  return (
    <main className="p-6 sm:p-8 lg:p-10 text-zinc-950 dark:text-zinc-50 min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800 pb-5 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-500" />
            <span>System Audit Trail</span>
          </h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1.5">
            Browse and export system activity logs, security audits, and course updates.
          </p>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200 shadow-sm flex items-center gap-2 self-start md:self-center"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Export Logs CSV</span>
        </button>
      </header>

      {/* Filters Area */}
      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 shadow-sm mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search by log description or entity ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-sm text-zinc-850 dark:text-zinc-150 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Action Select */}
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-700 dark:text-zinc-300 outline-none"
            >
              <option value="all-actions">All Actions</option>
              {filterMeta.actions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>

            {/* Entity Select */}
            <select
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-700 dark:text-zinc-300 outline-none"
            >
              <option value="all-entities">All Entity Types</option>
              {filterMeta.entityTypes.map(entity => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 h-10 bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Logs Table Area */}
      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden mb-6">
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
    </main>
  );
}
