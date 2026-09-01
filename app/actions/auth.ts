"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  if (!email || !password || !fullName) {
    return { error: "Semua kolom (Nama, Email, Password) wajib diisi." };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    // Insert into profiles table
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: authData.user.id,
      full_name: fullName,
      role: "candidate",
    });

    if (profileError) {
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
