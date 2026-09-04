"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateWhatsAppPhone } from "@/lib/phone-utils";

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/jobs";

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Check if profile exists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      redirect("/onboarding");
    }

    if (profile.role === "admin" && redirectTo === "/jobs") {
      redirect("/admin/dashboard");
    }
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;

  if (!email || !password || !fullName || !phone) {
    return { error: "Semua kolom (Nama Lengkap, Nomor WhatsApp, Email, Password) wajib diisi." };
  }

  const phoneValidation = validateWhatsAppPhone(phone);
  if (!phoneValidation.isValid) {
    return {
      error:
        phoneValidation.error ||
        "Format nomor WhatsApp tidak valid. Masukkan nomor yang benar (contoh: 0812-3456-7890 atau +6281234567890).",
    };
  }

  const normalizedPhone = phoneValidation.normalized;

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        phone: normalizedPhone,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    // Insert into profiles table with phone
    const profilePayload: Record<string, any> = {
      user_id: authData.user.id,
      full_name: fullName.trim(),
      role: "candidate",
      phone: normalizedPhone,
    };

    const { error: profileError } = await supabase.from("profiles").insert(profilePayload);
    if (profileError && profileError.message?.includes("phone")) {
      delete profilePayload.phone;
      const { error: fallbackError } = await supabase.from("profiles").insert(profilePayload);
      if (fallbackError) {
        console.error("Profile insert fallback error:", fallbackError);
      }
    } else if (profileError) {
      console.error("Profile insert error:", profileError);
    }
  }

  revalidatePath("/", "layout");
  redirect("/jobs");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
