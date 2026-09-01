"use client";

import React, { useState } from "react";
import { completeOnboardingAction } from "@/app/actions/profile";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { Sparkles, User, AlertCircle } from "lucide-react";

export default function OnboardingPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setErrorMessage(null);
    const result = await completeOnboardingAction(formData);
    if (result?.error) {
      setErrorMessage(result.error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)]">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Lengkapi Profil Anda
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Satu langkah lagi sebelum Anda dapat mulai melamar pekerjaan
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="card-3d rounded-2xl p-8 bg-white border border-slate-200/90 shadow-soft-3d">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs font-medium text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <Input
                  type="text"
                  name="full_name"
                  required
                  placeholder="Masukkan nama lengkap Anda"
                  className="pl-9"
                  autoFocus
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton
                loadingText="Menyimpan..."
                className="w-full h-10 text-sm font-semibold"
              >
                Simpan & Lanjutkan
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
