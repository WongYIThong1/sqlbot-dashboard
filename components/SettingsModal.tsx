import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy } from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/components/ui/app-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  user?: { username?: string; email?: string };
  onLogout?: () => void;
};

export function SettingsModal({ open, onClose, user, onLogout }: Props) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [discordNotification, setDiscordNotification] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<{ expiresAt: string | null; planType: string | null } | null>(null);
  const [extendLicenseKey, setExtendLicenseKey] = useState("");
  const [isExtendingLicense, setIsExtendingLicense] = useState(false);

  // 加载 API key、许可证信息和 Discord 设置
  useEffect(() => {
    if (open) {
      loadApiKey();
      loadLicenseInfo();
      loadDiscordSettings();
    }
  }, [open]);

  const loadApiKey = async () => {
    setIsLoadingApiKey(true);
    try {
      const response = await fetch("/api/api-key");
      const data = await response.json();
      if (data.success && data.apiKey) {
        setApiKey(data.apiKey);
      } else {
        setApiKey(null);
      }
    } catch (error) {
      console.error("Failed to load API key:", error);
      setApiKey(null);
    } finally {
      setIsLoadingApiKey(false);
    }
  };

  const loadLicenseInfo = async () => {
    try {
      const response = await fetch("/api/license-info");
      const data = await response.json();
      if (data.success && data.license) {
        setLicenseInfo(data.license);
      } else {
        setLicenseInfo(null);
      }
    } catch (error) {
      console.error("Failed to load license info:", error);
      setLicenseInfo(null);
    }
  };

  const loadDiscordSettings = async () => {
    try {
      const response = await fetch("/api/discord-settings");
      const data = await response.json();
      if (data.success) {
        setDiscordWebhook(data.webhookUrl || "");
        setDiscordNotification(data.notificationsEnabled || false);
      }
    } catch (error) {
      console.error("Failed to load Discord settings:", error);
    }
  };

  const handleSaveDiscordSettings = async () => {
    if (discordNotification && !discordWebhook.trim()) {
      showErrorToast("Webhook URL required", "Please enter a Discord webhook URL to enable notifications.");
      return;
    }

    try {
      const response = await fetch("/api/discord-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: discordWebhook,
          notificationsEnabled: discordNotification,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showErrorToast("Save failed", data.message || "Please try again.");
        return;
      }

      showSuccessToast("Settings saved", "Discord settings have been saved successfully.");
    } catch (error) {
      console.error(error);
      showErrorToast("Network error", "Please try again later.");
    }
  };

  const getDaysRemaining = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleExtendLicense = async () => {
    if (!extendLicenseKey.trim()) {
      showErrorToast("License key required", "Please enter a license key.");
      return;
    }

    setIsExtendingLicense(true);
    try {
      const response = await fetch("/api/extend-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: extendLicenseKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        showErrorToast("Extend failed", data.message || "Please check your license key.");
        return;
      }

      showSuccessToast("License extended", data.message || "Your license has been extended successfully.");
      setExtendLicenseKey("");
      // 重新加载许可证信息
      await loadLicenseInfo();
    } catch (error) {
      console.error(error);
      showErrorToast("Network error", "Please try again later.");
    } finally {
      setIsExtendingLicense(false);
    }
  };

  const userDisplay = useMemo(
    () => ({
      username: user?.username || "SQLBots User",
      email: user?.email || "user@example.com",
    }),
    [user?.username, user?.email],
  );

  const handleCopy = async () => {
    if (!apiKey) {
      showErrorToast("No API key", "Please generate an API key first.");
      return;
    }
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(apiKey);
      showSuccessToast("API key copied");
    } catch {
      showErrorToast("Copy failed", "Try again or copy manually.");
    } finally {
      setIsCopying(false);
    }
  };

  const handleDoubleClick = () => {
    if (apiKey) {
      handleCopy();
    }
  };


  const handleTestWebhook = async () => {
    if (!discordWebhook.trim()) {
      showErrorToast("Webhook URL required", "Please enter a Discord webhook URL first.");
      return;
    }

    setIsTestingWebhook(true);
    try {
      const response = await fetch("/api/test-discord-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: discordWebhook }),
      });

      const data = await response.json();

      if (!response.ok) {
        showErrorToast("Webhook test failed", data.message || "Please check your webhook URL.");
        return;
      }

      showSuccessToast("Webhook test successful", "Test message sent to Discord successfully!");
    } catch (error) {
      console.error(error);
      showErrorToast("Network error", "Please try again later.");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingPassword(true);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showErrorToast("Password update failed", data.message || "Please try again.");
        return;
      }

      showSuccessToast("Password updated", "Your password has been changed successfully.");
      // 重置表单
      e.currentTarget.reset();
    } catch (error) {
      console.error(error);
      showErrorToast("Network error", "Please try again later.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ scale: 0.96, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-white/10 bg-white/5 shadow-2xl p-6 text-white space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Settings</p>
                <h2 className="text-2xl font-semibold">Account Information</h2>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                aria-label="Close settings"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Basics</p>
                <div>
                  <p className="text-sm text-zinc-500">Username</p>
                  <p className="text-base font-semibold text-white">{userDisplay.username}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Email</p>
                  <p className="text-base font-semibold text-white">{userDisplay.email}</p>
                </div>
                {licenseInfo && licenseInfo.expiresAt && (
                  <div>
                    <p className="text-sm text-zinc-500">License Expires</p>
                    <p className="text-base font-semibold text-white">
                      {(() => {
                        const daysRemaining = getDaysRemaining(licenseInfo.expiresAt);
                        if (daysRemaining === null) return "N/A";
                        if (daysRemaining < 0) return "Expired";
                        if (daysRemaining === 0) return "Expires today";
                        return `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`;
                      })()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-zinc-500 mb-2">Extend License</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter license key"
                      value={extendLicenseKey}
                      onChange={(e) => setExtendLicenseKey(e.target.value)}
                      disabled={isExtendingLicense}
                      className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-white/30 disabled:opacity-60"
                    />
                    <button
                      onClick={handleExtendLicense}
                      disabled={isExtendingLicense || !extendLicenseKey.trim()}
                      className="px-4 py-2 rounded-lg text-sm bg-emerald-500/15 text-emerald-100 border border-emerald-500/25 hover:bg-emerald-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {isExtendingLicense ? "Extending..." : "Extend"}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onLogout}
                    className="px-3 py-2 text-sm rounded-lg bg-red-500/15 text-red-200 border border-red-500/25 hover:bg-red-500/25 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>

              <form
                onSubmit={handlePasswordSave}
                className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Security</p>
                    <p className="text-base font-semibold text-white">Change Password</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <input
                    type="password"
                    name="currentPassword"
                    placeholder="Current password"
                    required
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                  />
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="New password"
                    required
                    minLength={8}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-200 disabled:opacity-60 transition-colors"
                >
                  {isSavingPassword ? "Saving..." : "Save Password"}
                </button>
              </form>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">API Access</p>
                  <p className="text-base font-semibold text-white">API Key</p>
                </div>
                  {apiKey && (
                  <button
                    onClick={handleCopy}
                    disabled={isCopying}
                      className="p-2 rounded-lg bg-white/10 text-white border border-white/15 hover:bg-white/15 disabled:opacity-60 transition-colors"
                      aria-label="Copy API key"
                    >
                      <Copy size={18} />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div 
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-3 font-mono text-sm text-emerald-100 overflow-hidden min-h-[48px] flex items-center cursor-pointer group/copy"
                    onDoubleClick={handleDoubleClick}
                  >
                  {isLoadingApiKey ? (
                    <span className="text-zinc-500">Loading...</span>
                  ) : apiKey ? (
                    <div className="relative group w-full">
                      <span className="break-all flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none group-hover:select-text">
                        {apiKey}
                      </span>
                      <div className="absolute inset-0 flex items-center group-hover:opacity-0 transition-opacity duration-200 pointer-events-none">
                        <span className="text-emerald-100/70 select-none tracking-wider font-mono flex items-center gap-0.5">
                          {apiKey.split("").map((char, i) => (
                            <span key={i} className="inline-block w-2.5 h-3.5 bg-emerald-100/50 rounded-[2px]" />
                          ))}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-zinc-500">No API key generated yet</span>
                  )}
                  </div>
                  <div className="absolute -bottom-6 left-0 right-0 flex justify-center opacity-0 group-hover/copy:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <span className="text-xs text-zinc-500 bg-black/80 px-2 py-1 rounded border border-white/10 backdrop-blur-sm">
                      Double click to copy
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Discord</p>
                    <p className="text-base font-semibold text-white">Webhook & Notifications</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-zinc-500 mb-2 block">Discord Webhook URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://discord.com/api/webhooks/..."
                        value={discordWebhook}
                        onChange={(e) => setDiscordWebhook(e.target.value)}
                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                      />
                      <button
                        onClick={handleTestWebhook}
                        disabled={isTestingWebhook || !discordWebhook.trim()}
                        className="px-4 py-2 rounded-lg text-sm bg-blue-500/15 text-blue-200 border border-blue-500/25 hover:bg-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                        {isTestingWebhook ? "Testing..." : "Test Webhook"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-500">Discord Notifications</p>
                      <p className="text-xs text-zinc-600 mt-0.5">Enable notifications via Discord webhook</p>
                    </div>
                    <button
                      onClick={() => setDiscordNotification(!discordNotification)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        discordNotification ? "bg-emerald-500" : "bg-zinc-700"
                      }`}
                      role="switch"
                      aria-checked={discordNotification}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          discordNotification ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                  </button>
                  </div>
                  <button
                    onClick={handleSaveDiscordSettings}
                    className="w-full py-2 rounded-lg bg-emerald-500/15 text-emerald-100 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors text-sm font-semibold"
                  >
                    Save Discord Settings
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
