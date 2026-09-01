import React from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Application, Job, Profile } from "@/types/database";
import { AdminDossierClient } from "@/components/admin-dossier-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminApplicationDossierPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: application, error } = await supabase
    .from("applications")
    .select(`
      *,
      job:jobs (*),
      candidate:profiles (*)
    `)
    .eq("id", id)
    .single();

  if (error || !application) {
    notFound();
  }

  const app = application as Application & { job: Job; candidate: Profile };

  return <AdminDossierClient app={app} />;
}
