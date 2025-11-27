"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckSquare,
  Clock,
  Database,
  FileText,
  Link,
  Monitor,
  Search,
  Server,
  ShieldAlert,
  Syringe,
} from "lucide-react";

type StatItem = {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  trendUp: boolean;
};

type ActivityItem = {
  id: string;
  title: string;
  subtext: string;
  time: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState("User");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 在客户端挂载后读取用户名，避免 hydration 错误
  useEffect(() => {
    const token = localStorage.getItem("sqlbots_token");
    
    // 认证检查：如果没有 token，重定向到登录页
    if (!token) {
      router.replace("/login");
      return;
    }

    // 验证 token 是否有效
    try {
      const [, payload] = token.split(".");
      const decoded = JSON.parse(atob(payload ?? ""));
      if (decoded?.username) {
        setUsername(decoded.username);
        setIsAuthenticated(true);
      } else {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const stats: StatItem[] = [
    { title: "Injected", value: "24", icon: Link, trend: "+12%", trendUp: true },
    { title: "Injectable Success Rate", value: "94%", icon: ShieldAlert, trend: "+5%", trendUp: true },
    { title: "Active Machines", value: "14/20", icon: Monitor, trend: "-2%", trendUp: false },
    { title: "Rows", value: "128k", icon: Database, trend: "+0.4%", trendUp: true },
  ];

  const announcements = [
    { id: 1, title: "System Maintenance", time: "Friday 10pm-12am", tag: "SCHEDULED", desc: "Routine patches for the ingestion pipeline." },
    { id: 2, title: "New Query Templates", time: "Just now", tag: "FEATURE", desc: "Added 5 new templates for finance dashboards." },
    { id: 3, title: "API Key Rotation", time: "2 days remaining", tag: "URGENT", desc: "Please rotate your keys before the end of the month." },
  ];

  const recentActivity: ActivityItem[] = [
    { id: "1", title: "Injection Success", subtext: "target-site-01.com", time: "2m ago", icon: Syringe, iconColor: "text-emerald-500", iconBg: "bg-emerald-500/10" },
    { id: "2", title: "New Vulnerability", subtext: "auth-service-v2", time: "14m ago", icon: ShieldAlert, iconColor: "text-rose-500", iconBg: "bg-rose-500/10" },
    { id: "3", title: "Dehash Completed", subtext: "hash_list_292.txt", time: "1h ago", icon: Search, iconColor: "text-blue-500", iconBg: "bg-blue-500/10" },
    { id: "4", title: "Server Restart", subtext: "worker-node-04", time: "3h ago", icon: Server, iconColor: "text-orange-500", iconBg: "bg-orange-500/10" },
    { id: "5", title: "File Uploaded", subtext: "config_backup.json", time: "5h ago", icon: FileText, iconColor: "text-zinc-400", iconBg: "bg-zinc-800/50" },
  ];

  // 如果未认证，不渲染内容（等待重定向）
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto text-zinc-100 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Hello, {username}</h1>
          <p className="text-zinc-500 text-sm">Welcome back. System is running optimally.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#18181b] hover:bg-[#27272a] text-zinc-300 text-sm font-medium rounded-lg border border-white/10 transition-colors">
            <Clock size={16} />
            <span>Last 24h</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-900/20 transition-all">
            <span>+ New Scan</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[520px]">
        {/* Announcements */}
        <div className="lg:col-span-2 bg-[#09090b] border border-white/5 rounded-xl p-6 relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-indigo-500" />
              <h3 className="text-sm font-semibold text-white">Announcements</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Live Updates
            </div>
          </div>

          <div className="flex-1 relative z-10 space-y-4">
            <div className="absolute inset-0 translate-y-20 opacity-20 pointer-events-none">
              <svg viewBox="0 0 100 20" className="w-full h-full fill-indigo-500/10 stroke-indigo-500/20 stroke-1">
                <path d="M0,15 Q10,5 20,15 T40,15 T60,5 T80,15 T100,10 V20 H0 Z" />
              </svg>
            </div>

            <div className="grid gap-3 relative">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between p-4 rounded-lg bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/80 hover:border-white/10 transition-all cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-zinc-200 group-hover:text-white">{item.title}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${
                          item.tag === "URGENT"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : item.tag === "FEATURE"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">{item.desc}</span>
                  </div>
                  <span className="text-xs text-zinc-600 font-mono">{item.time}</span>
                </div>
              ))}

              <div className="p-4 rounded-lg border border-dashed border-white/5 flex items-center justify-center text-zinc-700 text-xs">
                No more new announcements
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1 h-full">
          <RecentActivity activities={recentActivity} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp }: StatItem) {
  return (
    <div className="p-4 rounded-xl bg-[#0c0c0f] border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors">
      <div className="space-y-1">
        <p className="text-sm text-zinc-500">{title}</p>
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className={`text-xs font-semibold ${trendUp ? "text-emerald-400" : "text-rose-400"}`}>{trend}</p>
      </div>
      <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-white">
        <Icon size={20} />
      </div>
    </div>
  );
}

function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="h-full bg-[#0c0c0f] border border-white/5 rounded-xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare size={18} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        </div>
        <span className="text-xs text-zinc-500">Auto-refresh</span>
      </div>
      <div className="space-y-3 overflow-y-auto pr-1">
        {activities.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                <item.icon size={18} className={item.iconColor} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-zinc-500">{item.subtext}</p>
              </div>
            </div>
            <span className="text-[11px] text-zinc-500">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
