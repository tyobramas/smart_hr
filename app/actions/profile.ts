"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboardingAction(formData: FormData) {
  const fullName = formData.get("full_name") as string;

  if (!fullName || fullName.trim().length === 0) {
    return { error: "Nama lengkap wajib diisi." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    full_name: fullName.trim(),
    role: "candidate",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/jobs");
}
