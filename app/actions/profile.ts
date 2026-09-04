"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateWhatsAppPhone } from "@/lib/phone-utils";

export async function completeOnboardingAction(formData: FormData) {
  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;

  if (!fullName || fullName.trim().length === 0) {
    return { error: "Nama lengkap wajib diisi." };
  }

  if (!phone || phone.trim().length === 0) {
    return { error: "Nomor WhatsApp wajib diisi untuk notifikasi seleksi." };
  }

  const phoneValidation = validateWhatsAppPhone(phone);
  if (!phoneValidation.isValid) {
    return {
      error:
        phoneValidation.error ||
        "Format nomor WhatsApp tidak valid. Gunakan format contoh: 0812-3456-7890.",
    };
  }

  const normalizedPhone = phoneValidation.normalized;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Update user metadata in Supabase Auth
  try {
    await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        phone: normalizedPhone,
      },
    });
  } catch (err) {
    console.warn("Could not update auth user metadata:", err);
  }

  const profilePayload: Record<string, any> = {
    user_id: user.id,
    full_name: fullName.trim(),
    role: "candidate",
    phone: normalizedPhone,
  };

  const { error } = await supabase.from("profiles").insert(profilePayload);
  if (error && error.message?.includes("phone")) {
    delete profilePayload.phone;
    const { error: fallbackError } = await supabase.from("profiles").insert(profilePayload);
    if (fallbackError) {
      return { error: fallbackError.message };
    }
  } else if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/jobs");
}
