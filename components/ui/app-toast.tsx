"use client";

import { CheckCircleIcon, ExclamationTriangleIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import clsx from "clsx";

type ToastType = "success" | "error" | "info";

type Action = {
  label: string;
  onClick?: () => void;
};

type ToastProps = {
  id?: string | number;
  type?: ToastType;
  title?: string;
  description?: string;
  actions?: Action[];
};

type ToneEntry = {
  icon: JSX.Element;
  accent: string;
  container: string;
};

const tone: Record<ToastType, ToneEntry> = {
  success: {
    icon: <CheckCircleIcon className="w-6 h-6 text-emerald-300" />,
    accent: "text-slate-50",
    container: "bg-[#1A1A1A]/95 border border-white/12 shadow-[0_20px_45px_rgba(0,0,0,0.38)]",
  },
  error: {
    icon: <ExclamationTriangleIcon className="w-6 h-6 text-white" />,
    accent: "text-white",
    container: "bg-[#1A1A1A]/95 border border-white/12 shadow-[0_20px_45px_rgba(0,0,0,0.38)]",
  },
  info: {
    icon: <SparklesIcon className="w-6 h-6 text-cyan-200" />,
    accent: "text-slate-50",
    container: "bg-[#1A1A1A]/95 border border-white/12 shadow-[0_20px_45px_rgba(0,0,0,0.38)]",
  },
};

function ToastCard({ id, type = "success", title, description, actions }: ToastProps) {
  const { icon, accent, container } = tone[type];

  return (
    <div
      className={`relative max-w-md w-[360px] text-white rounded-2xl backdrop-blur-xl p-4 shadow-xl ${container}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex items-center justify-center translate-y-[1px]">{icon}</div>
          <div className="flex flex-col justify-center">
            <div className={clsx("text-sm font-semibold leading-5", accent)}>{title ?? "Notification"}</div>
            {description && (
              <p className="mt-0.5 text-xs text-gray-200/80 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => toast.dismiss(id)}
          className="p-1 rounded-full text-gray-400 hover:text-white transition"
          aria-label="Close notification"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      {actions && actions.length > 0 && (
        <div className="mt-3 flex gap-4 flex-wrap">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => {
                action.onClick?.();
                toast.dismiss(id);
              }}
              className="text-xs font-medium text-white hover:text-gray-200 transition"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function showToast({ type = "success", title, description, actions }: ToastProps) {
  return toast.custom((id) => (
    <ToastCard id={id} type={type} title={title} description={description} actions={actions} />
  ));
}

export function showSuccessToast(title: string, description?: string, actions?: Action[]) {
  return showToast({ type: "success", title, description, actions });
}

export function showErrorToast(title: string, description?: string, actions?: Action[]) {
  return showToast({ type: "error", title, description, actions });
}

export function showInfoToast(title: string, description?: string, actions?: Action[]) {
  return showToast({ type: "info", title, description, actions });
}
