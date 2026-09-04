export type UserRole = 'admin' | 'candidate';

export type ApplicationStatus =
  | 'pending'
  | 'screened'
  | 'rejected'
  | 'invited_interview'
  | 'interview_in_progress'
  | 'interview_completed'
  | 'withdrawn_expired';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string;
  location: string;
  employment_type: string;
  min_score_threshold: number;
  interview_blueprints_json?: InterviewScriptItem[] | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  creator?: Profile;
}

export interface InterviewScriptItem {
  tag: string;
  title: string;
  required_topics: string[];
  question_text: string;
  scenario_context: string;
  what_good_looks_like: string[];
  prepared_probe: string;
}

export interface DeepSeekPsychometricAnalysis {
  siapa_kandidat_ini: string; // Executive narrative: karakter asli, watak, kepribadian nyata
  validasi_kejujuran_dan_konsistensi: {
    skor_konsistensi: number; // 0 - 100%
    status: "Sangat Jujur & Konsisten" | "Cukup Konsisten" | "Terindikasi Faking Good / Inkonsisten";
    penjelasan: string;
  };
  pola_kerja_dan_respon_tekanan: string; // Cara kerja under pressure, deadline, konflik
  gaya_komunikasi_dan_dinamika_tim: string; // Komunikasi sosial, interpersonal
  kecocokan_dengan_posisi: {
    skor_cultural_fit: number; // 0 - 100%
    prediksi_performa: string;
    alasan: string;
  };
  kekuatan_kunci: string[];
  area_pengembangan_blindspot: string[];
  panduan_supervisi_manajer: string; // Tips atasan memimpin & mendelegasikan tugas
  rekomendasi_pertanyaan_wawancara_psikologis: string[]; // Deep behavioral questions
}

export type HermesPsychometricAnalysis = DeepSeekPsychometricAnalysis;

export interface PersonalityTestResult {
  completed_at: string;
  primary_trait: string;
  trait_description: string;
  mbti_type: string;
  mbti_label: string;
  work_style: string;
  strengths: string[];
  growth_areas: string[];
  raw_answers?: Record<string, any>;
  ai_deepseek_analysis?: DeepSeekPsychometricAnalysis | null;
  scores: {
    // DISC (0 - 100%)
    dominance: number;
    influence: number;
    steadiness: number;
    conscientiousness: number;
    // Big Five OCEAN (0 - 100%)
    big_five_openness: number;
    big_five_conscientiousness: number;
    big_five_extraversion: number;
    big_five_agreeableness: number;
    big_five_emotional_stability: number;
    // PAPI Kostick Drives (0 - 100%)
    papi_leadership: number;
    papi_achievement: number;
    papi_rule_compliance: number;
    papi_sociability: number;
    // Work Ethic (0 - 100%)
    work_ethic?: number;
  };
}

// AI Interview Types
export interface AIInterviewQuestionCore {
  question_type: "core";
  question_text: string;
  competency_tag: string;
  target_topics: string[];
  reason: string;
}

export interface AIInterviewQuestionFollowUp {
  question_type: "follow_up";
  need_follow_up: boolean;
  follow_up_question: string;
  competency_tag: string;
  gap_targeted: string;
  reason: string;
}

export interface InterviewMessage {
  id: string;
  sender: "ai" | "candidate";
  text: string;
  timestamp: string;
  competency_tag?: string;
  question_type?: "core" | "follow_up";
  gap_targeted?: string;
  reason?: string;
  quoted_span?: string;
  question_source?: "hermes" | "prepared_probe" | "script";
}

export interface ConfidenceEvaluation {
  skor_confidence: number; // 0 - 100%
  level: "Sangat Yakin & Asertif" | "Percaya Diri" | "Cukup Yakin" | "Kurang Percaya Diri / Ragu-ragu";
  analisis_linguistik: string; // Penjelasan objektif berbasis linguistik & alur argumen
  faktor_penentu: {
    asertivitas_linguistik: number; // 0 - 100
    kejelasan_struktur_argumen: number; // 0 - 100
    ketegasan_solusi_pribadi: number; // 0 - 100
  };
}

export interface InterviewCompetencyScore {
  tag: string;
  skor: number;
  catatan: string;
}

export interface InterviewEvaluation {
  skor_kompetensi: number; // 0 - 100
  ringkasan_performa: string;
  rekomendasi_keputusan: "Recommended" | "Consider" | "Not Recommended";
  kekuatan_teramati: string[];
  catatan_evaluasi: string[];
  skor_per_kompetensi?: InterviewCompetencyScore[];
  confidence_scoring?: ConfidenceEvaluation;
  engine?: string;
  source?: string;
  evaluated_at?: string;
}

export interface InterviewSessionTranscript {
  session_id: string;
  started_at: string;
  completed_at?: string;
  duration_seconds: number;
  competencies_tested: string[];
  blueprints?: InterviewScriptItem[];
  messages: InterviewMessage[];
  evaluation_status?: "completed" | "pending";
  overall_evaluation?: InterviewEvaluation;
}

export interface Application {
  id: string;
  candidate_id: string;
  job_id: string;
  cv_storage_path: string;
  cv_parsed_name: string | null;
  status: ApplicationStatus;
  cv_score: number | null;
  cv_analysis_json: Record<string, unknown> | null;
  personality_result_json?: PersonalityTestResult | Record<string, unknown> | null;
  personality_completed_at?: string | null;
  interview_deadline?: string | null;
  interview_started_at?: string | null;
  interview_completed_at?: string | null;
  interview_duration_seconds?: number | null;
  interview_transcript_json?: InterviewSessionTranscript | Record<string, unknown> | null;
  created_at: string;
  job?: Job;
  candidate?: Profile;
}

export type CommunicationEventType =
  | 'application_received'
  | 'screening_passed'
  | 'screening_rejected'
  | 'screening_review'
  | 'personality_reminder'
  | 'personality_completed'
  | 'interview_invitation'
  | 'interview_reminder_48h'
  | 'interview_reminder_24h'
  | 'interview_completed'
  | 'interview_expired'
  | 'final_rejection';

export type CommunicationStatus = 'queued' | 'sent' | 'failed' | 'bounced' | 'opened';

export type CommunicationChannel = 'email' | 'whatsapp';

export interface CommunicationContext {
  candidateName: string;
  candidateFirstName?: string;
  jobTitle: string;
  jobLocation?: string;
  companyName?: string;
  applicationId?: string;
  applicationDate?: string;
  interviewDeadline?: string;
  appBaseUrl?: string;
  actionUrl?: string;
}

export interface CommunicationLog {
  id: string;
  application_id: string;
  candidate_id: string;
  job_id: string;
  event_type: CommunicationEventType;
  channel: CommunicationChannel;
  email_to: string;
  phone_to: string | null;
  email_subject: string;
  email_body_html: string;
  email_body_text: string | null;
  status: CommunicationStatus;
  hermes_model: string | null;
  hermes_duration_ms: number | null;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

