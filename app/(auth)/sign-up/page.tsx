"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signUpAction } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { Sparkles, User, Mail, Lock, AlertCircle } from "lucide-react";

export default function SignUpPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setErrorMessage(null);
    const result = await signUpAction(formData);
    if (result?.error) {
      setErrorMessage(result.error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)]">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Buat Akun Kandidat
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Daftar sekarang untuk melamar lowongan kerja di SmartHR
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
                  placeholder="Contoh: Budi Santoso"
                  className="pl-9"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Input
                  type="email"
                  name="email"
                  required
                  placeholder="budi@example.com"
                  className="pl-9"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  className="pl-9"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton
                loadingText="Mendaftarkan..."
                className="w-full h-10 text-sm font-semibold"
              >
                Daftar Akun Sekarang
              </SubmitButton>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Sudah memiliki akun?{" "}
              <Link
                href="/sign-in"
                className="font-semibold text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
