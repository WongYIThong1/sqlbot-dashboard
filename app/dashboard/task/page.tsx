"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { TaskBuilderModal } from "@/components/TaskBuilderModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import {
  Search,
  Plus,
  FileText,
  LayoutGrid,
  Play,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type TaskStatus = "Running" | "Completed" | "Failed" | "Paused" | "Deleted";

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

type TaskApi = {
  id: string | number;
  task_id?: string;
  title: string;
  machine_name?: string;
  status?: string;
  progress?: number;
  list_file?: string;
  created_at: string;
};

export default function TaskPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<TaskStatus | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isTaskBuilderOpen, setIsTaskBuilderOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<TaskItem | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pageSize = 6;

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("sqlbots_token");
      if (!token) return;

      const response = await fetch("/api/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.tasks) {
        // 转换数据库格式到前端格式
        const formattedTasks: TaskItem[] = data.tasks.map((task: TaskApi) => {
          // 计算时间差
          const createdAt = new Date(task.created_at);
          const now = new Date();
          const diffMs = now.getTime() - createdAt.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);
          
          let startedAt = "";
          if (diffMins < 60) {
            startedAt = `${diffMins}m ago`;
          } else if (diffHours < 24) {
            startedAt = `${diffHours}h ago`;
          } else {
            startedAt = `${diffDays}d ago`;
          }

          return {
            id: task.id.toString(),
            taskId: task.task_id || `T-${task.id}`,
            title: task.title,
            moduleName: task.machine_name || "Unknown",
            moduleIcon: LayoutGrid, // 默认图标
            status: (task.status || "Running") as TaskStatus,
            progress: task.progress || 0,
            listFile: task.list_file || "N/A",
            startedAt,
          };
        });
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载和刷新
  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskCreated = () => {
    fetchTasks();
  };

  const confirmDelete = async () => {
    if (!deleteConfirmTask) return;

    const taskToDelete = deleteConfirmTask;
    setDeleteConfirmTask(null);

    // 乐观更新：立即从本地状态删除
    setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskToDelete.id));

    try {
      const token = localStorage.getItem("sqlbots_token");
      if (!token) {
        // 如果失败，恢复任务列表
        fetchTasks();
        alert("Please login first");
        return;
      }

      const response = await fetch(`/api/tasks/${taskToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        // 如果失败，恢复任务列表
        fetchTasks();
        alert(data.message || "Failed to delete task");
        return;
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      // 如果失败，恢复任务列表
      fetchTasks();
      alert("Failed to delete task. Please try again.");
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openMenuId) {
        const menuElement = menuRefs.current[openMenuId];
        const buttonElement = buttonRefs.current[openMenuId];
        const target = e.target as Node;
        // 如果点击的不是菜单也不是按钮，则关闭菜单
        if (
          menuElement && 
          !menuElement.contains(target) && 
          buttonElement && 
          !buttonElement.contains(target)
        ) {
          setOpenMenuId(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const filteredTasks = useMemo(() => {
    const byStatus = activeFilter === "All" ? tasks : tasks.filter((t) => t.status === activeFilter);
    if (!searchTerm.trim()) return byStatus;
    const term = searchTerm.toLowerCase();
    return byStatus.filter((t) =>
      [t.title, t.taskId, t.listFile].some((field) => field.toLowerCase().includes(term)),
    );
  }, [activeFilter, searchTerm, tasks]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleTasks = filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const counts = useMemo(() => {
    const acc: Record<string, number> = { All: tasks.length };
    tasks.forEach((t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
    });
    return acc;
  }, [tasks]);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "Running":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "Completed":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Failed":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
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
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto text-zinc-100 h-full w-full flex flex-col space-y-4 sm:space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Tasks</h1>
          <div className="h-6 w-px bg-zinc-800 hidden md:block" />

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {(["All", "Running", "Completed", "Failed", "Paused"] as const).map((key) => {
              const isActive = activeFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveFilter(key);
                    setPage(1);
                  }}
                  className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-transparent transition-colors"
                >
                  {isActive && (
                    <motion.span
                      layoutId="filter-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                      className="absolute inset-0 rounded-lg bg-white/10 border border-white/15"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2 text-left">
                    {key === "All" && <LayoutGrid size={14} />}
                    {key === "Running" && <Play size={14} />}
                    {key === "Completed" && <CheckCircle2 size={14} />}
                    {key === "Failed" && <XCircle size={14} />}
                    {key === "Paused" && <PauseCircle size={14} />}
                    <span className={isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}>
                      {key}
                    </span>
                    <span className={`px-1.5 rounded text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-zinc-700/50 text-zinc-400"}`}>
                      {counts[key] ?? 0}
                    </span>
                  </span>
                </button>
              );
            })}
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
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(255, 255, 255, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsTaskBuilderOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-900 text-sm font-medium rounded-lg transition-all group"
          >
            <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
              <Plus size={16} />
            </motion.div>
            <span>Create task</span>
          </motion.button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#09090b] border border-white/5 rounded-xl flex-1 overflow-hidden flex flex-col mt-2 min-h-0 w-full">
        <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-1 w-full">
          <Table className="bg-[#09090b] w-full min-w-[800px]">
            <TableHeader className="sticky top-0 bg-[#09090b] z-10">
              <TableRow className="border-b border-white/5 bg-[#09090b] hover:bg-[#09090b]">
                <TableHead className="w-[30%] min-w-[200px] text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-wider bg-[#09090b]">Task</TableHead>
                <TableHead className="w-[20%] min-w-[120px] text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-wider bg-[#09090b]">List</TableHead>
                <TableHead className="w-[15%] min-w-[100px] text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-wider bg-[#09090b]">Status</TableHead>
                <TableHead className="w-[20%] min-w-[140px] text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-wider bg-[#09090b]">Progress</TableHead>
                <TableHead className="w-[15%] min-w-[80px] text-right text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-wider bg-[#09090b]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                    Loading tasks...
                  </TableCell>
                </TableRow>
              ) : visibleTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                    No tasks found. Create your first task to get started.
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence mode="popLayout">
              {visibleTasks.map((task, index) => {
                const isMenuOpen = openMenuId === task.id;
                const isFirstRow = index === 0;
                // 第一行（接近分页栏头部）向下展开，最后一行（接近分页栏底部）向上展开
                const shouldOpenDown = isFirstRow;

                const handleDelete = () => {
                  setOpenMenuId(null);
                  setDeleteConfirmTask(task);
                };

                const handlePauseResume = async () => {
                  setOpenMenuId(null);
                  
                  const newStatus = task.status === "Running" ? "Paused" : "Running";
                  const oldStatus = task.status;

                  // 乐观更新：立即更新本地状态
                  setTasks((prevTasks) =>
                    prevTasks.map((t) =>
                      t.id === task.id ? { ...t, status: newStatus as TaskStatus } : t
                    )
                  );

                  try {
                    const token = localStorage.getItem("sqlbots_token");
                    if (!token) {
                      // 如果失败，恢复状态
                      setTasks((prevTasks) =>
                        prevTasks.map((t) =>
                          t.id === task.id ? { ...t, status: oldStatus } : t
                        )
                      );
                      alert("Please login first");
                      return;
                    }

                    const response = await fetch(`/api/tasks/${task.id}`, {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ status: newStatus }),
                    });

                    const data = await response.json();

                    if (!data.success) {
                      // 如果失败，恢复状态
                      setTasks((prevTasks) =>
                        prevTasks.map((t) =>
                          t.id === task.id ? { ...t, status: oldStatus } : t
                        )
                      );
                      alert(data.message || "Failed to update task status");
                      return;
                    }
                  } catch (error) {
                    console.error("Error updating task status:", error);
                    // 如果失败，恢复状态
                    setTasks((prevTasks) =>
                      prevTasks.map((t) =>
                        t.id === task.id ? { ...t, status: oldStatus } : t
                      )
                    );
                    alert("Failed to update task status. Please try again.");
                  }
                };

                const toggleMenu = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  setOpenMenuId(isMenuOpen ? null : task.id);
                };

                return (
                  <motion.tr
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ 
                      duration: 0.2,
                      layout: { duration: 0.3 }
                    }}
                    className="border-b border-white/5 bg-[#09090b] hover:bg-white/[0.02] transition-colors group"
                  >
                    <TableCell className="w-[30%] min-w-[200px]">
                      <div className="font-medium text-xs sm:text-sm text-zinc-200 group-hover:text-white transition-colors">{task.title}</div>
                      <div className="text-[9px] sm:text-[10px] text-zinc-600 font-mono mt-0.5">{task.taskId}</div>
                    </TableCell>
                    <TableCell className="w-[20%] min-w-[120px]">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <FileText size={12} className="sm:w-[14px] sm:h-[14px] flex-shrink-0" />
                        <span className="text-[10px] sm:text-xs truncate" title={task.listFile}>
                          {task.listFile.substring(0, 12)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[15%] min-w-[100px]">
                      <motion.div
                        key={task.status}
                        initial={{ scale: 0.9, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium border ${getStatusColor(task.status)}`}
                      >
                        {getStatusIcon(task.status)}
                        <span className="whitespace-nowrap">{task.status}</span>
                      </motion.div>
                    </TableCell>
                    <TableCell className="w-[20%] min-w-[140px]">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${task.progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`h-full rounded-full ${getProgressColor(task.status)}`}
                          />
                        </div>
                        <motion.span
                          key={task.progress}
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className="text-[10px] sm:text-xs text-zinc-500 w-6 sm:w-8 text-right"
                        >
                          {task.progress}%
                        </motion.span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[15%] min-w-[80px] text-right">
                      <div className="relative inline-flex justify-end ml-auto">
                        <button
                          ref={(el) => {
                            buttonRefs.current[task.id] = el;
                          }}
                          onClick={toggleMenu}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                          title="Actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <AnimatePresence>
                          {isMenuOpen && (
                            <motion.div
                              ref={(el) => {
                                menuRefs.current[task.id] = el;
                              }}
                              initial={{ opacity: 0, scale: 0.95, y: shouldOpenDown ? 5 : -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: shouldOpenDown ? 5 : -5 }}
                              transition={{ duration: 0.15 }}
                              className={`absolute right-0 z-[100] min-w-[140px] bg-[#18181b] border border-white/10 rounded-lg shadow-xl overflow-hidden ${
                                shouldOpenDown ? 'top-full mt-2' : 'bottom-full mb-2'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                              style={{ position: 'absolute' }}
                            >
                              {(task.status === "Running" || task.status === "Paused") && (
                                <button
                                  onClick={handlePauseResume}
                                  className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                                >
                                  {task.status === "Running" ? (
                                    <>
                                      <PauseCircle size={14} />
                                      <span>Pause</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play size={14} />
                                      <span>Resume</span>
                                    </>
                                  )}
                                </button>
                              )}
                              <button
                                onClick={handleDelete}
                                className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-rose-500/10 hover:text-rose-400 transition-colors flex items-center gap-2"
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="px-6 py-3 border-t border-white/5 bg-[#09090b] flex items-center justify-between text-xs text-zinc-500">
          <div>
            Showing {filteredTasks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, filteredTasks.length)} of {filteredTasks.length} tasks
          </div>
          <div className="flex gap-2">
            <button
              className="px-2 py-1 hover:text-white transition-colors disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              if (pageNum > 3) return null;
              return (
                <button
                  key={pageNum}
                  className={`px-2 py-1 transition-colors ${pageNum === currentPage ? "text-white" : "hover:text-white"}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="px-2 py-1 hover:text-white transition-colors disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Task Builder Modal */}
      <TaskBuilderModal 
        isOpen={isTaskBuilderOpen} 
        onClose={() => setIsTaskBuilderOpen(false)}
        onTaskCreated={handleTaskCreated}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirmTask !== null}
        onClose={() => setDeleteConfirmTask(null)}
        onConfirm={confirmDelete}
        taskName={deleteConfirmTask?.title}
      />
    </div>
  );
}
