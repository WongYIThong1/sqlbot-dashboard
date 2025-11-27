import { Bell, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Props = {
  username?: string;
  variant?: "sidebar" | "header";
  onOpenSettings?: () => void;
};

export function UserProfileChip({ username, variant = "header", onOpenSettings }: Props) {
  const displayUsername = username || "SQLBots User";
  const initial = (displayUsername[0] || "U").toUpperCase();
  const isSidebar = variant === "sidebar";

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRef.current || !triggerRef.current) return;
      const target = e.target as Node;
      if (!menuRef.current.contains(target) && !triggerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`relative flex items-center justify-between ${
        isSidebar ? "w-full px-3 py-3 rounded-xl bg-[#18181b] border border-zinc-800/60" : "gap-4"
      } text-zinc-200`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-300">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate max-w-[140px]">{displayUsername}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-[10px] text-zinc-500 font-medium tracking-[0.22em] uppercase">Profile</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <motion.button
          whileHover={{ scale: 1.05, rotate: [0, -6, 6, -6, 0] }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={2} />
        </motion.button>
        <motion.button
          ref={triggerRef}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.18 }}
          onMouseEnter={() => {
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
            setOpen(true);
          }}
          onMouseLeave={() => {
            hoverTimeout.current = setTimeout(() => setOpen(false), 160);
          }}
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Open profile menu"
        >
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown size={16} strokeWidth={2} />
          </motion.div>
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            onMouseEnter={() => {
              if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
            }}
            onMouseLeave={() => {
              hoverTimeout.current = setTimeout(() => setOpen(false), 160);
            }}
            className="absolute right-0 top-14 w-44 rounded-lg border border-white/10 bg-[#0b0b0f]/95 backdrop-blur-md shadow-xl py-1 text-sm"
          >
            <button
              className="block w-full text-left px-3 py-2 text-zinc-200 hover:bg-white/5 transition-colors"
              onClick={() => {
                onOpenSettings?.();
                setOpen(false);
              }}
            >
              Settings
            </button>
            <button
              className="w-full text-left px-3 py-2 text-red-300 hover:bg-red-500/10 transition-colors"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("logout-requested"));
                setOpen(false);
              }}
            >
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
