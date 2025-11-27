"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
        <div className="max-w-4xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
                <p className="text-zinc-400">Here&apos;s an overview of your activity.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {[
                    { label: "Active Tasks", value: "12", color: "from-blue-500/20 to-blue-600/5" },
                    { label: "Machines Online", value: "4", color: "from-green-500/20 to-green-600/5" },
                    { label: "Total History", value: "1,240", color: "from-purple-500/20 to-purple-600/5" },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
                        className={`p-6 rounded-2xl border border-white/5 bg-gradient-to-br ${stat.color} backdrop-blur-sm`}
                    >
                        <h3 className="text-zinc-400 text-sm font-medium mb-1">{stat.label}</h3>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-8 p-8 rounded-2xl border border-white/5 bg-zinc-900/30 backdrop-blur-sm"
            >
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-mono">
                                    LOG
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">Task #{1000 + i} completed</p>
                                    <p className="text-xs text-zinc-500">2 minutes ago</p>
                                </div>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                Success
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
