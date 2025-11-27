"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Shuffle, Server, RefreshCw, Info, ChevronDown, UploadCloud, FileText, Check
} from 'lucide-react';

interface TaskBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
}

const MACHINES = [
  { id: '1', name: 'GPClient-v2-8gb-1', ip: '192.168.1.14' },
  { id: '2', name: 'GPClient-v2-16gb-1', ip: '192.168.1.15' },
  { id: '3', name: 'GPClient-v2-32gb-1', ip: '192.168.1.16' },
];

const THREADS_OPTIONS = [10, 25, 50, 100, 200, 500];
const TIMEOUT_OPTIONS = ['1s', '3s', '5s', '10s', '30s', '60s'];

const TASK_NAME_PREFIXES = ['Scan', 'Enum', 'Test', 'Check', 'Verify', 'Analyze'];
const TASK_NAME_SUFFIXES = ['Primary', 'Secondary', 'Full', 'Quick', 'Deep', 'Custom'];

export const TaskBuilderModal: React.FC<TaskBuilderModalProps> = ({ isOpen, onClose, onTaskCreated }) => {
  const [taskName, setTaskName] = useState('');
  const [listFile, setListFile] = useState<File | null>(null);
  const [proxiesFile, setProxiesFile] = useState<File | null>(null);
  const [selectedMachine, setSelectedMachine] = useState(MACHINES[0]);
  const [selectedThreads, setSelectedThreads] = useState(50);
  const [selectedTimeout, setSelectedTimeout] = useState('5s');
  const [startFrom, setStartFrom] = useState('');
  
  const [isMachineOpen, setIsMachineOpen] = useState(false);
  const [isThreadsOpen, setIsThreadsOpen] = useState(false);
  const [isTimeoutOpen, setIsTimeoutOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  const machineRef = useRef<HTMLDivElement>(null);
  const threadsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<HTMLDivElement>(null);
  
  // 检查下拉菜单是否应该向上展开，并获取位置
  // 下拉方向：统一向下展开，避免渲染时访问 ref 触发 lint 报错
  const shouldOpenUpward = () => false;

  // 关闭下拉菜单当点击外部
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (machineRef.current && !machineRef.current.contains(event.target as Node)) {
        setIsMachineOpen(false);
      }
      if (threadsRef.current && !threadsRef.current.contains(event.target as Node)) {
        setIsThreadsOpen(false);
      }
      if (timeoutRef.current && !timeoutRef.current.contains(event.target as Node)) {
        setIsTimeoutOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 生成随机任务名
  const handleShuffle = async () => {
    setIsShuffling(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const prefix = TASK_NAME_PREFIXES[Math.floor(Math.random() * TASK_NAME_PREFIXES.length)];
    const suffix = TASK_NAME_SUFFIXES[Math.floor(Math.random() * TASK_NAME_SUFFIXES.length)];
    const randomNum = Math.floor(Math.random() * 9999);
    setTaskName(`${prefix}-${suffix}-${randomNum}`);
    setIsShuffling(false);
  };

  // 刷新机器列表
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  // 处理文件上传
  const handleListFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setListFile(file);
    }
  };

  const handleProxiesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProxiesFile(file);
    }
  };

  // 创建任务
  const handleCreateTask = async () => {
    if (!taskName || !listFile) {
      alert("Please provide task name and list file");
      return;
    }

    try {
      const token = localStorage.getItem("sqlbots_token");
      if (!token) {
        alert("Please login first");
        return;
      }

      const formData = {
        taskName,
        listFile: {
          name: listFile.name,
        },
        proxiesFile: proxiesFile ? {
          name: proxiesFile.name,
        } : null,
        selectedMachine,
        selectedThreads,
        selectedTimeout,
        startFrom,
      };

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Failed to create task");
        return;
      }

      // 重置表单
      setTaskName("");
      setListFile(null);
      setProxiesFile(null);
      setStartFrom("");
      
      // 通知父组件刷新任务列表
      onTaskCreated?.();
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Modal Container */}
          <motion.div 
            role="dialog"
            aria-modal="true"
            initial={{ scale: 0.96, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl border border-white/10 bg-white/5 shadow-2xl flex flex-col overflow-visible"
          >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white tracking-tight">New Task</h2>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 overflow-visible">
            
            {/* Task Name Input */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Task name</label>
                <div className="relative group">
                    <input 
                        type="text" 
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        placeholder="Enter task name"
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
                    />
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleShuffle}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-400 hover:text-white transition-colors"
                    >
                        <motion.div
                            animate={{ rotate: isShuffling ? 360 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Shuffle size={16} />
                        </motion.div>
                    </motion.button>
                </div>
            </div>

            {/* List & Proxies Upload Row */}
            <div className="grid grid-cols-2 gap-6">
                {/* Upload List */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">List</label>
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative w-full h-32 border border-dashed border-zinc-700 hover:border-white/30 rounded-xl bg-zinc-900/30 hover:bg-zinc-900/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                        <motion.div 
                            animate={{ y: listFile ? 0 : [0, -4, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                            className="p-2 rounded-full bg-zinc-800/50 group-hover:bg-zinc-800 text-zinc-500 group-hover:text-white transition-colors"
                        >
                            <UploadCloud size={20} />
                        </motion.div>
                        <div className="text-center">
                            {listFile ? (
                                <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs font-medium text-emerald-400"
                                >
                                    {listFile.name}
                                </motion.p>
                            ) : (
                                <>
                                    <p className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">Click to upload</p>
                                    <p className="text-[10px] text-zinc-600 mt-1">.txt, .csv, .json</p>
                                </>
                            )}
                        </div>
                        <input 
                            type="file" 
                            accept=".txt,.csv,.json"
                            onChange={handleListFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                    </motion.div>
                </div>

                {/* Upload Proxies */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Proxies</label>
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative w-full h-32 border border-dashed border-zinc-700 hover:border-white/30 rounded-xl bg-zinc-900/30 hover:bg-zinc-900/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                        <motion.div 
                            animate={{ y: proxiesFile ? 0 : [0, -4, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                            className="p-2 rounded-full bg-zinc-800/50 group-hover:bg-zinc-800 text-zinc-500 group-hover:text-white transition-colors"
                        >
                            <FileText size={20} />
                        </motion.div>
                        <div className="text-center">
                            {proxiesFile ? (
                                <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs font-medium text-emerald-400"
                                >
                                    {proxiesFile.name}
                                </motion.p>
                            ) : (
                                <>
                                    <p className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">Click to upload</p>
                                    <p className="text-[10px] text-zinc-600 mt-1">Supported formats</p>
                                </>
                            )}
                        </div>
                        <input 
                            type="file" 
                            onChange={handleProxiesFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                    </motion.div>
                </div>
            </div>

            {/* Machine Selection */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-400">Machine</label>
                    <motion.button
                        whileHover={{ rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleRefresh}
                        className="text-zinc-600 cursor-pointer hover:text-white transition-colors"
                    >
                        <motion.div
                            animate={{ rotate: isRefreshing ? 360 : 0 }}
                            transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
                        >
                            <RefreshCw size={12} />
                        </motion.div>
                    </motion.button>
                </div>
                <div className="relative" ref={machineRef}>
                    <motion.div 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setIsMachineOpen(!isMachineOpen)}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white flex items-center justify-between cursor-pointer hover:bg-zinc-900 hover:border-white/20 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <Server size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
                            <span>{selectedMachine.name} • {selectedMachine.ip}</span>
                        </div>
                        <motion.div
                            animate={{ rotate: isMachineOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown size={16} className="text-zinc-600 group-hover:text-zinc-400" />
                        </motion.div>
                    </motion.div>
                    <AnimatePresence>
                        {isMachineOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: false ? 10 : -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: false ? 10 : -10 }}
                                transition={{ duration: 0.2 }}
                                className={`absolute w-full bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-[110] max-h-[132px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent ${
                                    false 
                                        ? 'bottom-full mb-2' 
                                        : 'top-full mt-2'
                                }`}
                                style={{ position: 'absolute' }}
                            >
                                {MACHINES.map((machine) => (
                                    <motion.div
                                        key={machine.id}
                                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                        onClick={() => {
                                            setSelectedMachine(machine);
                                            setIsMachineOpen(false);
                                        }}
                                        className={`px-4 py-3 cursor-pointer flex items-center justify-between ${
                                            selectedMachine.id === machine.id ? 'bg-white/5' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Server size={14} className="text-zinc-500" />
                                            <span className="text-sm text-white">{machine.name} • {machine.ip}</span>
                                        </div>
                                        {selectedMachine.id === machine.id && (
                                            <Check size={14} className="text-emerald-400" />
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Configuration Row */}
            <div className="grid grid-cols-3 gap-4">
                {/* Threads */}
                <div className="space-y-2 relative" ref={threadsRef}>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-zinc-400">Threads</label>
                        <div className="relative group">
                            <Info size={12} className="text-zinc-600 hover:text-zinc-400 transition-colors cursor-help" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[120]">
                                <div className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 whitespace-nowrap shadow-xl">
                                    Number of concurrent threads to use
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-800"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <motion.div 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setIsThreadsOpen(!isThreadsOpen)}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white flex items-center justify-between cursor-pointer hover:bg-zinc-900 hover:border-white/20 transition-colors"
                    >
                        <span>{selectedThreads}</span>
                        <motion.div
                            animate={{ rotate: isThreadsOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown size={16} className="text-zinc-600" />
                        </motion.div>
                    </motion.div>
                    <AnimatePresence>
                        {isThreadsOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: false ? 10 : -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: false ? 10 : -10 }}
                                transition={{ duration: 0.2 }}
                                className={`absolute w-full bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-[110] max-h-[132px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent ${
                                    false 
                                        ? 'bottom-full mb-2' 
                                        : 'top-full mt-2'
                                }`}
                            >
                                {THREADS_OPTIONS.map((threads) => (
                                    <motion.div
                                        key={threads}
                                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                        onClick={() => {
                                            setSelectedThreads(threads);
                                            setIsThreadsOpen(false);
                                        }}
                                        className={`px-4 py-2 cursor-pointer flex items-center justify-between ${
                                            selectedThreads === threads ? 'bg-white/5' : ''
                                        }`}
                                    >
                                        <span className="text-sm text-white">{threads}</span>
                                        {selectedThreads === threads && (
                                            <Check size={14} className="text-emerald-400" />
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Timeout */}
                <div className="space-y-2 relative" ref={timeoutRef}>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-zinc-400">Timeout</label>
                        <div className="relative group">
                            <Info size={12} className="text-zinc-600 hover:text-zinc-400 transition-colors cursor-help" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[120]">
                                <div className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 whitespace-nowrap shadow-xl">
                                    Request timeout duration
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-800"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <motion.div 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setIsTimeoutOpen(!isTimeoutOpen)}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white flex items-center justify-between cursor-pointer hover:bg-zinc-900 hover:border-white/20 transition-colors"
                    >
                        <span>{selectedTimeout}</span>
                        <motion.div
                            animate={{ rotate: isTimeoutOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown size={16} className="text-zinc-600" />
                        </motion.div>
                    </motion.div>
                    <AnimatePresence>
                        {isTimeoutOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: false ? 10 : -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: false ? 10 : -10 }}
                                transition={{ duration: 0.2 }}
                                className={`absolute w-full bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-[110] max-h-[132px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent ${
                                    false 
                                        ? 'bottom-full mb-2' 
                                        : 'top-full mt-2'
                                }`}
                            >
                                {TIMEOUT_OPTIONS.map((timeout) => (
                                    <motion.div
                                        key={timeout}
                                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                        onClick={() => {
                                            setSelectedTimeout(timeout);
                                            setIsTimeoutOpen(false);
                                        }}
                                        className={`px-4 py-2 cursor-pointer flex items-center justify-between ${
                                            selectedTimeout === timeout ? 'bg-white/5' : ''
                                        }`}
                                    >
                                        <span className="text-sm text-white">{timeout}</span>
                                        {selectedTimeout === timeout && (
                                            <Check size={14} className="text-emerald-400" />
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Start from */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-zinc-400">Start from</label>
                        <div className="relative group">
                            <Info size={12} className="text-zinc-600 hover:text-zinc-400 transition-colors cursor-help" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[120]">
                                <div className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 whitespace-nowrap shadow-xl">
                                    Optional starting point or index
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-800"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <input 
                        type="text" 
                        value={startFrom}
                        onChange={(e) => setStartFrom(e.target.value)}
                        placeholder="Optional"
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
                    />
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/5 flex items-center justify-end gap-3 bg-black/20">
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
                Cancel
            </motion.button>
            <motion.button 
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateTask}
                className="px-6 py-2.5 text-sm font-bold text-black bg-white hover:bg-zinc-200 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all"
            >
                Create task
            </motion.button>
        </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
