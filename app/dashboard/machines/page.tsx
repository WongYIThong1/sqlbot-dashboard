"use client";

import { useState, useEffect } from "react";
import { MachineCard } from "@/components/MachineCard";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { Machine, MachineStatus } from "@/types";
import { Server, Download, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirmMachine, setDeleteConfirmMachine] = useState<Machine | null>(null);

  // 模拟数据 - 后续可以替换为 API 调用
  const fetchMachines = async () => {
    setIsRefreshing(true);
    // 模拟 API 延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟机器数据
    const mockMachines: Machine[] = [
      {
        id: '1',
        name: 'GPClient-v2-8gb-1',
        ip: '192.168.1.14',
        status: MachineStatus.ONLINE,
        ram: { total: 8 },
        cpu: { cores: 4 },
      },
      {
        id: '2',
        name: 'GPClient-v2-16gb-1',
        ip: '192.168.1.15',
        status: MachineStatus.ONLINE,
        ram: { total: 16 },
        cpu: { cores: 8 },
      },
      {
        id: '3',
        name: 'GPClient-v2-32gb-1',
        ip: '192.168.1.16',
        status: MachineStatus.OFFLINE,
        ram: { total: 32 },
        cpu: { cores: 16 },
      },
    ];
    
    setMachines(mockMachines);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleRefresh = () => {
    fetchMachines();
  };

  const handleDelete = (machineId: string) => {
    const machineToDelete = machines.find(m => m.id === machineId);
    if (machineToDelete) {
      setDeleteConfirmMachine(machineToDelete);
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirmMachine) return;

    const machineToDelete = deleteConfirmMachine;
    setDeleteConfirmMachine(null);

    // 乐观更新：立即从本地状态删除
    setMachines((prevMachines) => prevMachines.filter((m) => m.id !== machineToDelete.id));

    // TODO: 这里可以添加实际的 API 调用来删除机器
    // try {
    //   const token = localStorage.getItem("sqlbots_token");
    //   const response = await fetch(`/api/machines/${machineToDelete.id}`, {
    //     method: "DELETE",
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //   });
    //   // 处理响应...
    // } catch (error) {
    //   // 如果失败，恢复机器列表
    //   fetchMachines();
    // }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto text-zinc-100 h-full w-full flex flex-col space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Machines</h1>
          <div className="h-6 w-px bg-zinc-800 hidden md:block" />
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Server size={16} />
            <span>{machines.length} machines</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#18181b] hover:bg-[#27272a] text-zinc-300 text-sm font-medium rounded-lg border border-white/10 transition-colors disabled:opacity-50"
          >
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
            >
              <RefreshCw size={16} />
            </motion.div>
            <span>Refresh</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(255, 255, 255, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-900 text-sm font-medium rounded-lg transition-all"
          >
            <Download size={16} />
            <span>Download Machine</span>
          </motion.button>
        </div>
      </div>

      {/* Machines Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">Loading machines...</div>
        </div>
      ) : machines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Server size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No machines found</p>
          <p className="text-sm">Add your first machine to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {machines.map((machine, index) => (
            <motion.div
              key={machine.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <MachineCard machine={machine} onDelete={handleDelete} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirmMachine !== null}
        onClose={() => setDeleteConfirmMachine(null)}
        onConfirm={confirmDelete}
        title="Delete Device"
        message="Are you sure you want to delete this device?"
        taskName={deleteConfirmMachine?.name}
      />
    </div>
  );
}

