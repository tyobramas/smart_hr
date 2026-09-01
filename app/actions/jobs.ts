"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function createJobAction(formData: FormData) {
  const { profile } = await requireAdmin();

  const title = formData.get("title") as string;
  let slug = (formData.get("slug") as string)?.trim();
  const location = formData.get("location") as string;
  const employmentType = formData.get("employment_type") as string;
  const description = formData.get("description") as string;
  const requirements = formData.get("requirements") as string;
  const minScoreThreshold = parseFloat((formData.get("min_score_threshold") as string) || "0");
  const isActive = formData.get("is_active") === "on" || formData.get("is_active") === "true";

  if (!title || !location || !employmentType || !description || !requirements) {
    return { error: "Semua kolom wajib diisi." };
  }

  if (!slug) {
    slug = slugify(title);
  } else {
    slug = slugify(slug);
  }

  const supabase = await createClient();

  const { error } = await supabase.from("jobs").insert({
    title,
    slug,
    location,
    employment_type: employmentType,
    description,
    requirements,
    min_score_threshold: minScoreThreshold,
    is_active: isActive,
    created_by: profile.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Slug pekerjaan sudah digunakan. Gunakan judul atau slug yang berbeda." };
    }
    return { error: error.message };
  }

  revalidatePath("/jobs");
  revalidatePath("/admin/jobs");
  revalidatePath("/admin/dashboard");
  redirect("/admin/jobs");
}

export async function toggleJobActiveAction(jobId: string, currentStatus: boolean) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ is_active: !currentStatus })
    .eq("id", jobId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/jobs");
  revalidatePath("/admin/jobs");
  revalidatePath("/admin/dashboard");
  return { success: true };
}
