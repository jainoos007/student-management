"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import type { AuditLog } from "@/lib/db/queries/audit";

export default function DashboardAuditFeed() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchLogs() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/audit");
      if (response.ok) {
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : (data.logs || []));
      }
    } catch (err) {
      console.error("Could not fetch audit logs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  function getBadgeStyles(action: string) {
    if (action.startsWith("CREATE")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
    }
    if (action.startsWith("UPDATE")) {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
    }
    if (action.startsWith("DELETE") || action.startsWith("UNENROLL")) {
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50";
    }
    return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800";
  }

  function formatActionName(action: string) {
    return action.replace("_", " ");
  }

  function formatTime(isoString: string) {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "";
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">System Audit Trail</h2>
        </div>
        <button
          onClick={fetchLogs}
          disabled={refreshing}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          title="Refresh Feed"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center text-zinc-400 text-xs italic">
            Retrieving logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-400 text-xs italic">
            No system actions recorded yet.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 text-xs border-b border-zinc-50 dark:border-zinc-850/50 pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${getBadgeStyles(
                      log.action
                    )}`}
                  >
                    {formatActionName(log.action)}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {formatTime(log.created_at)}
                  </span>
                </div>
                <p className="text-zinc-650 dark:text-zinc-350 leading-relaxed">
                  {log.details}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-zinc-100 dark:border-zinc-850 px-5 py-3 bg-zinc-50/50 dark:bg-zinc-950/20 text-[10px] text-zinc-400 text-center">
        Auto-refreshes every 15 seconds
      </div>
    </div>
  );
}
