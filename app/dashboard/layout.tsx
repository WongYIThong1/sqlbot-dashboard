"use client";

import { Home, CheckSquare, Server, History, Wrench } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { UserProfileChip } from "@/components/UserProfileChip";
import { SettingsModal } from "@/components/SettingsModal";

const navItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: CheckSquare, label: "Task", href: "/dashboard/task" },
  { icon: Server, label: "Machines", href: "/dashboard/machines" },
  { icon: History, label: "History", href: "/dashboard/history" },
  { icon: Wrench, label: "Utilities", href: "/dashboard/utilities" },
];

function decodeUserFromToken() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("sqlbots_token");
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload ?? ""));
    return { username: decoded?.username as string | undefined, email: decoded?.email as string | undefined };
  } catch {
    return null;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ username?: string; email?: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = useCallback(() => {
    localStorage.removeItem("sqlbots_token");
    document.cookie = "sqlbots_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("sqlbots_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    // 验证 token 并解码用户信息
    const userData = decodeUserFromToken();
    // 如果 token 无法解码或缺少必需字段（如 username），重定向到登录页
    if (!userData || !userData.username) {
      router.replace("/login");
      return;
    }
    // 更新用户状态
    setUser(userData);
  }, [router]);

  useEffect(() => {
    const onLogout = () => handleLogout();
    window.addEventListener("logout-requested", onLogout as EventListener);
    return () => window.removeEventListener("logout-requested", onLogout as EventListener);
  }, [handleLogout]);

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className="w-[15%] min-w-[220px] flex-shrink-0 border-r border-white/10 bg-[#0c0c0f] flex flex-col"
      >
        <div className="px-4 pt-6 pb-5">
          <UserProfileChip username={user?.username} variant="sidebar" onOpenSettings={() => setShowSettings(true)} />
        </div>

        <nav className="flex-1 px-3 pb-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon
                  size={18}
                  strokeWidth={isActive ? 2.6 : 2.2}
                  className={`${isActive ? "text-white" : "text-zinc-500 group-hover:text-white"}`}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && <span className="h-2 w-2 rounded-full bg-white" />}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-black flex flex-col">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/5 rounded-full blur-[120px] opacity-50" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-white/5 rounded-full blur-[120px] opacity-50" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col min-h-0">{children}</div>
      </main>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} user={user ?? undefined} onLogout={handleLogout} />
    </div>
  );
}
