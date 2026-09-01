import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variantStyles = {
      primary: "btn-primary-3d",
      secondary:
        "bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900",
      outline:
        "border border-slate-300 text-slate-700 bg-transparent hover:bg-slate-100",
      ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      danger:
        "bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus:ring-rose-500",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
      md: "text-sm px-4 py-2 gap-2 h-9",
      lg: "text-base px-5 py-2.5 gap-2.5 h-11",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
