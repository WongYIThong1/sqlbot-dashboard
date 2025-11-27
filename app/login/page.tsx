"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { showErrorToast, showSuccessToast } from "@/components/ui/app-toast";

const initialForm = {
    username: "",
    password: "",
};

export default function LoginPage() {
    const [formValues, setFormValues] = useState(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleChange =
        (field: keyof typeof formValues) =>
        (event: ChangeEvent<HTMLInputElement>) => {
            setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
        };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formValues),
            });

            let payload: { token?: string; message?: string } | null = null;
            try {
                payload = (await response.json()) as { token?: string; message?: string };
            } catch {
                payload = null;
            }

            if (!response.ok) {
                showErrorToast("Login failed", payload?.message ?? "Please try again later.");
                return;
            }

            if (payload?.token) {
                localStorage.setItem("sqlbots_token", payload.token);
            }

            showSuccessToast("Login successful", "Redirecting to dashboard...");
            setFormValues(initialForm);
            setTimeout(() => router.push("/dashboard"), 1500);
        } catch (err) {
            console.error(err);
            showErrorToast("Network error", "Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        // noop, kept to mirror previous behavior if future side-effects needed
    }, []);

    return (
        <div className="min-h-screen w-full bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[100px]"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[100px]"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md bg-black border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-sm"
            >
                <div className="mb-8 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="text-3xl font-bold tracking-tighter mb-2"
                    >
                        Welcome Back
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="text-zinc-400 text-sm"
                    >
                        Enter your credentials to access your account
                    </motion.p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="space-y-2"
                    >
                        <label htmlFor="username" className="text-sm font-medium text-zinc-300 block">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            placeholder="johndoe"
                            value={formValues.username ?? ""}
                            autoComplete="username"
                            onChange={handleChange("username")}
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200"
                            required
                            disabled={isSubmitting}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        className="space-y-2"
                    >
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="text-sm font-medium text-zinc-300 block">
                                Password
                            </label>
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="********"
                                autoComplete="current-password"
                                value={formValues.password}
                                onChange={handleChange("password")}
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200"
                                required
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                disabled={isSubmitting}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-white text-black font-bold rounded-lg px-4 py-3 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 cursor-pointer"
                    >
                        {isSubmitting ? "Signing In..." : "Sign In"}
                    </motion.button>
                </form>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="mt-8 text-center"
                >
                    <p className="text-zinc-500 text-sm">
                        Don&apos;t have an account?
                        <Link href="/signup" className="text-white font-medium hover:underline ml-1">
                            Sign up
                        </Link>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
