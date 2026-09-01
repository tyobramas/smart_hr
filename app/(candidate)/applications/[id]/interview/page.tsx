import React from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import { Application, Job, Profile } from "@/types/database";
import { AIInterviewSession } from "@/components/ai-interview-session";

interface InterviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CandidateInterviewPage({ params }: InterviewPageProps) {
  const { id } = await params;
  const { profile } = await requireProfile();
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

  // If candidate tries to access someone else's application
  if (profile.role !== "admin" && application.candidate_id !== profile.id) {
    redirect("/applications");
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <AIInterviewSession
        app={application as Application & { job: Job; candidate: Profile }}
      />
    </div>
  );
}
