"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("sqlbots_token") : null;

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl border border-white/10 rounded-3xl p-10 bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-black shadow-2xl"
      >
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
          className="text-3xl font-semibold tracking-tight"
        >
          Dashboard (stub)
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
          className="mt-3 text-zinc-400"
        >
          登录状态已确认（检测到 localStorage.sqlbots_token）。这里可以继续接 Supabase 数据或调用受保护 API。
        </motion.p>

        <div className="mt-8 flex gap-3 flex-wrap">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg border border-white/15 text-sm text-zinc-200 hover:bg-white/5 transition"
          >
            重新登录
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("sqlbots_token");
              router.replace("/login");
            }}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition"
          >
            退出登录
          </button>
        </div>
      </motion.div>
    </div>
  );
}
