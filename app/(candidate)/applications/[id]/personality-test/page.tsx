import React from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import { Application, Job, Profile } from "@/types/database";
import { PersonalityTestForm } from "@/components/personality-test-form";

export default async function PersonalityTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireProfile();
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
    .eq("candidate_id", profile.id)
    .single();

  if (error || !application) {
    notFound();
  }

  const appData = application as Application & { job: Job; candidate: Profile };

  return <PersonalityTestForm app={appData} />;
}
