"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Filter,
  Plus,
  FileText,
  LayoutGrid,
  Syringe,
  Search as SearchIcon,
  AlertCircle,
  Server,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  PauseCircle,
  Trash2,
} from "lucide-react";

type TaskStatus = "Running" | "Completed" | "Failed" | "Queued" | "Paused" | "Deleted";

type TaskItem = {
  id: string;
  taskId: string;
  title: string;
  moduleName: string;
  moduleIcon: React.ElementType;
  status: TaskStatus;
  progress: number;
  listFile: string;
  startedAt: string;
};

const mockTasks: TaskItem[] = [
  {
    id: "1",
    taskId: "T-9283",
    title: "Primary Port Scan",
    moduleName: "Nmap Ultra",
    moduleIcon: LayoutGrid,
    status: "Running",
    progress: 45,
    listFile: "targets_eu_west.txt",
    startedAt: "2m ago",
  },
  {
    id: "2",
    taskId: "T-9282",
    title: "Subdomain Enumeration",
    moduleName: "Amass Pro",
    moduleIcon: LayoutGrid,
    status: "Completed",
    progress: 100,
    listFile: "finance_domains.list",
    startedAt: "15m ago",
  },
  {
    id: "3",
    taskId: "T-9281",
    title: "SQL Injection Test",
    moduleName: "SQLMap",
    moduleIcon: Syringe,
    status: "Failed",
    progress: 12,
    listFile: "login_params.json",
    startedAt: "1h ago",
  },
  {
    id: "4",
    taskId: "T-9280",
    title: "Directory Fuzzing",
    moduleName: "Gobuster",
    moduleIcon: SearchIcon,
    status: "Queued",
    progress: 0,
    listFile: "common_paths.wordlist",
    startedAt: "3h ago",
  },
  {
    id: "5",
    taskId: "T-9279",
    title: "Vulnerability Scan",
    moduleName: "Nuclei",
    moduleIcon: AlertCircle,
    status: "Completed",
    progress: 100,
    listFile: "internal_ips.txt",
    startedAt: "5h ago",
  },
  {
    id: "6",
    taskId: "T-9278",
    title: "SSH Brute Force",
    moduleName: "Hydra",
    moduleIcon: Server,
    status: "Paused",
    progress: 68,
    listFile: "ssh_users.txt",
    startedAt: "1d ago",
  },
];

export default function TaskPage() {
  const [activeFilter, setActiveFilter] = useState<TaskStatus | "All">("All");

  const filteredTasks = useMemo(() => {
    if (activeFilter === "All") return mockTasks;
    return mockTasks.filter((t) => t.status === activeFilter);
  }, [activeFilter]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = { All: mockTasks.length };
    mockTasks.forEach((t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
    });
    return acc;
  }, []);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "Running":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "Completed":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Failed":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "Queued":
        return "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
      case "Paused":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      default:
        return "text-zinc-400";
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "Running":
        return <Play size={12} className="fill-current" />;
      case "Completed":
        return <CheckCircle2 size={12} />;
      case "Failed":
        return <XCircle size={12} />;
      case "Queued":
        return <Clock size={12} />;
      case "Paused":
        return <PauseCircle size={12} />;
      default:
        return null;
    }
  };

  const getProgressColor = (status: TaskStatus) => {
    switch (status) {
      case "Running":
        return "bg-blue-500";
      case "Completed":
        return "bg-emerald-500";
      case "Failed":
        return "bg-rose-500";
      case "Paused":
        return "bg-orange-500";
      default:
        return "bg-zinc-700";
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto text-zinc-100 h-full flex flex-col space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Tasks</h1>
          <div className="h-6 w-px bg-zinc-800 hidden md:block" />

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {(["All", "Running", "Completed"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  activeFilter === key
                    ? "bg-zinc-800 text-white border-zinc-700"
                    : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                {key === "All" && <LayoutGrid size={14} />}
                {key === "Running" && <Play size={14} />}
                {key === "Completed" && <CheckCircle2 size={14} />}
                {key}
                <span className="bg-zinc-700/50 px-1.5 rounded text-[10px] text-zinc-400">{counts[key] ?? 0}</span>
              </button>
            ))}
            <button
              onClick={() => setActiveFilter("Deleted")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-rose-400 transition-colors"
            >
              <Trash2 size={14} />
              Deleted
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-initial">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full md:w-64 bg-[#09090b] border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium rounded-lg border border-zinc-800 transition-colors">
            <Filter size={14} />
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-900/20 transition-all">
            <Plus size={16} />
            <span>Create task</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#09090b] border border-white/5 rounded-xl flex-1 overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 bg-zinc-900/20 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          <div className="col-span-1 flex items-center justify-center">
            <div className="w-4 h-4 rounded border border-zinc-700" />
          </div>
          <div className="col-span-3">Task</div>
          <div className="col-span-2">Module</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Progress</div>
          <div className="col-span-1">List</div>
          <div className="col-span-1 text-right">Started</div>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors group cursor-pointer"
            >
              <div className="col-span-1 flex items-center justify-center">
                <div className="w-4 h-4 rounded border border-zinc-700 group-hover:border-zinc-500 transition-colors" />
              </div>

              <div className="col-span-3">
                <div className="font-medium text-sm text-zinc-200 group-hover:text-white transition-colors">{task.title}</div>
                <div className="text-[10px] text-zinc-600 font-mono mt-0.5">{task.taskId}</div>
              </div>

              <div className="col-span-2 flex items-center gap-2 text-zinc-400">
                <task.moduleIcon size={14} />
                <span className="text-xs">{task.moduleName}</span>
              </div>

              <div className="col-span-2">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                  {getStatusIcon(task.status)}
                  {task.status}
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${getProgressColor(task.status)}`} style={{ width: `${task.progress}%` }} />
                </div>
                <span className="text-xs text-zinc-500 w-8 text-right">{task.progress}%</span>
              </div>

              <div className="col-span-1 flex items-center gap-2 text-zinc-500">
                <FileText size={14} />
                <span className="text-xs truncate" title={task.listFile}>
                  {task.listFile.substring(0, 12)}...
                </span>
              </div>

              <div className="col-span-1 text-right text-xs text-zinc-600 font-mono">{task.startedAt}</div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-white/5 bg-zinc-900/20 flex items-center justify-between text-xs text-zinc-500">
          <div>Showing 1-{filteredTasks.length} of {mockTasks.length} tasks</div>
          <div className="flex gap-2">
            <button className="px-2 py-1 hover:text-white transition-colors disabled:opacity-50">Previous</button>
            <button className="px-2 py-1 text-white">1</button>
            <button className="px-2 py-1 hover:text-white transition-colors">2</button>
            <button className="px-2 py-1 hover:text-white transition-colors">3</button>
            <button className="px-2 py-1 hover:text-white transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
