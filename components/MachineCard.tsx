import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Machine, MachineStatus } from '../types';

import { 
  Monitor, 
  MoreVertical, 
  RotateCw,
  AlertCircle,
  Trash2
} from 'lucide-react';

interface MachineCardProps {
  machine: Machine;
  onTogglePower?: (id: string) => void;
  onOpenTerminal?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const StatusBadge: React.FC<{ status: MachineStatus }> = ({ status }) => {
  const isOnline = status === MachineStatus.ONLINE;
  
  // Styles based on screenshot: Outline style with icon
  const baseClass = "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border";
  
  if (isOnline) {
    return (
      <div className={`${baseClass} border-emerald-500/30 text-emerald-500`}>
        <RotateCw size={12} className="animate-spin" style={{ animationDuration: '3s' }} /> 
        <span>Online</span>
      </div>
    );
  }

  // Offline / Other
  return (
    <div className={`${baseClass} border-red-500/30 text-red-500`}>
      <AlertCircle size={12} />
      <span>Offline</span>
    </div>
  );
};

export const MachineCard: React.FC<MachineCardProps> = ({ machine, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 关闭菜单当点击外部
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(e.target as Node) && 
        buttonRef.current && 
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDelete?.(machine.id);
  };

  return (
    <div className="bg-[#09090b] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors w-full max-w-md relative">
      
      {/* Top Row: IP (Blurred look) & Status */}
      <div className="flex justify-between items-start mb-4">
        {/* IP Badge - using a blurry look to match screenshot privacy effect */}
        <div className="bg-white/5 px-2 py-1 rounded text-[10px] text-white/40 font-mono tracking-wider backdrop-blur-[2px]">
          {machine.ip}
        </div>
        <StatusBadge status={machine.status} />
      </div>

      {/* Middle Row: Icon, Name, Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="text-white/20">
            <Monitor size={20} />
          </div>
          <h3 className="font-medium text-slate-200 text-base">{machine.name}</h3>
        </div>
        
        <div className="relative flex items-center gap-2 text-slate-500">
          <button 
            ref={buttonRef}
            onClick={toggleMenu}
            className="hover:text-slate-300 transition-colors"
          >
            <MoreVertical size={18} />
          </button>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-[100] min-w-[160px] bg-[#18181b] border border-white/10 rounded-lg shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'absolute' }}
              >
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-rose-500/10 hover:text-rose-400 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  <span>Delete devices</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Row: Metrics (Pill style) */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-3 bg-transparent">
          <span className="text-slate-500 font-medium">RAM</span>
          <div className="bg-white/10 text-slate-300 px-3 py-1 rounded-md font-mono font-medium">
             {machine.ram.total} GB
          </div>
        </div>

        <div className="flex items-center gap-3 bg-transparent">
          <span className="text-slate-500 font-medium">Cores</span>
          <div className="bg-white/10 text-slate-300 px-3 py-1 rounded-md font-mono font-medium">
             {machine.cpu.cores}
          </div>
        </div>
      </div>

    </div>
  );
};

