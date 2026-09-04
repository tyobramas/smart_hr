"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signUpAction } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { Sparkles, User, Mail, Lock, AlertCircle, Phone, MessageCircle, CheckCircle2 } from "lucide-react";
import { validateWhatsAppPhone } from "@/lib/phone-utils";

export default function SignUpPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

  const phoneValidation = validateWhatsAppPhone(phone);
  const isPhoneValid = phone.trim().length > 0 && phoneValidation.isValid;

  async function handleSubmit(formData: FormData) {
    setErrorMessage(null);
    setPhoneTouched(true);

    if (!phoneValidation.isValid) {
      setErrorMessage(phoneValidation.error || "Format nomor WhatsApp tidak valid. Gunakan format contoh: 0812-3456-7890.");
      return;
    }

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

            {/* Field Phone / WhatsApp Notification */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Nomor WhatsApp Terdaftar <span className="text-rose-500">*</span>
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                  <span>Notifikasi Seleksi</span>
                </span>
              </div>
              <div className="relative">
                <Input
                  type="tel"
                  name="phone"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (!phoneTouched) setPhoneTouched(true);
                  }}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder="Contoh: 0812-3456-7890"
                  className={`pl-9 pr-9 transition-colors ${
                    phoneTouched && phone.length > 0
                      ? isPhoneValid
                        ? "border-emerald-500 focus-visible:ring-emerald-500"
                        : "border-rose-400 focus-visible:ring-rose-400"
                      : ""
                  }`}
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                {phoneTouched && phone.length > 0 && (
                  isPhoneValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 absolute right-3 top-3" />
                  )
                )}
              </div>

              {/* Dynamic validation feedback */}
              {phoneTouched && phone.trim().length > 0 ? (
                isPhoneValid ? (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>Format valid: {phoneValidation.localDisplay} (WhatsApp Siap)</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">
                    {phoneValidation.error}
                  </p>
                )
              ) : (
                <p className="text-[10.5px] text-slate-500 mt-1">
                  Wajib nomor aktif di WhatsApp. Jadwal interview AI dan pengumuman seleksi akan dikirimkan ke nomor ini.
                </p>
              )}
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
