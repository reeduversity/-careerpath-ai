import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 px-8 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-sky-500/30 active:scale-95 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
      <span className="relative z-10 drop-shadow-md">{props.children}</span>
    </button>
  );
}
