"use client";

import { Toaster as SonnerToaster } from "sonner";

export function ToasterProvider() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className: "border border-slate-200 shadow-soft-3d text-slate-900 bg-white font-sans",
      }}
    />
  );
}
