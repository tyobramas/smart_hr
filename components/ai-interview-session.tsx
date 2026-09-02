"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Application, Job, Profile, InterviewMessage, InterviewSessionTranscript } from "@/types/database";
import { startInterviewAction, submitAnswerAndGetNextAction } from "@/app/actions/interview";
import { toast } from "sonner";
import {
  Sparkles,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Bot,
  User,
  ShieldAlert,
  Award,
  TrendingUp,
  BrainCircuit,
  MessageSquareQuote,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Radio,
  RefreshCw,
} from "lucide-react";

interface AIInterviewSessionProps {
  app: Application & { job: Job; candidate: Profile };
}

export function AIInterviewSession({ app }: AIInterviewSessionProps) {
  const router = useRouter();

  // Hydration safety flag
  const [isMounted, setIsMounted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [answerInput, setAnswerInput] = useState("");
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [isCompleted, setIsCompleted] = useState(app.status === "interview_completed");
  const [isExpired, setIsExpired] = useState(app.status === "withdrawn_expired");
  const [evaluation, setEvaluation] = useState<any>(
    (app.interview_transcript_json as any)?.overall_evaluation || null
  );

  // Stop watch / duration counter
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(
    app.interview_duration_seconds || 0
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Video & Audio States
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [thinkingTimer, setThinkingTimer] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentAnswerRef = useRef<string>("");
  const isSubmittingRef = useRef<boolean>(false);
  const isRecordingMicRef = useRef<boolean>(false);

  // Keep ref synchronized with state
  useEffect(() => {
    currentAnswerRef.current = answerInput;
    isRecordingMicRef.current = isRecordingMic;
  }, [answerInput, isRecordingMic]);

  // Mount guard
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Web Speech API initialization (Speech-to-Text) with 5-second Grace Period
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "id-ID";

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            // Normalize phonetic terms live
            const cleanedTranscript = transcript
              .replace(/\b(roh|ro|row)\s*sql\b/gi, "Raw SQL")
              .replace(/\bproof\s*(off?|of)\s*(konsep|concept)\b/gi, "Proof of Concept (PoC)")
              .replace(/\btrade\s*of\b/gi, "trade-off")
              .replace(/\b(kueri|query)\s*(bider|bild?er)\b/gi, "query builder")
              .replace(/\bintergritas\b/gi, "integritas")
              .replace(/\b(posgres|postgre|posgresql)\b/gi, "PostgreSQL")
              .replace(/\b(nek\s*je\s*es|next\s*js|nextjs)\b/gi, "Next.js")
              .replace(/\b(si\s*ai\s*si\s*di|ci\s*cd)\b/gi, "CI/CD")
              .replace(/\b(taim\s*out|time\s*out)\b/gi, "timeout")
              .replace(/\b(dibaging|di\s*baging|de\s*bugging)\b/gi, "debugging")
              .replace(/\b(rut\s*kos|root\s*kos|root\s*caus?e)\b/gi, "root cause")
              .replace(/\b(a\s*pe\s*i|a\s*pi|e\s*pi\s*ai)\b/gi, "API")
              .replace(/\b(kros|cross)\s*join\b/gi, "CROSS JOIN")
              .replace(/\bo\s*r\s*m\b/gi, "ORM");

            setAnswerInput(cleanedTranscript);
            currentAnswerRef.current = cleanedTranscript;

            // If user starts speaking while in thinking mode, exit thinking mode
            setIsThinkingMode(false);

            // Clear previous silence countdown
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

            // Start 5-second silence grace period
            let remaining = 5;
            setAutoSubmitCountdown(5);

            countdownIntervalRef.current = setInterval(() => {
              remaining -= 1;
              if (remaining > 0) {
                setAutoSubmitCountdown(remaining);
              } else {
                if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              }
            }, 1000);

            silenceTimerRef.current = setTimeout(() => {
              setAutoSubmitCountdown(null);
              triggerAutoSubmit();
            }, 5000);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error === "no-speech" && isRecordingMicRef.current) {
            // keep listening
          } else if (event.error !== "aborted") {
            // retry reconnect if still recording
            if (isRecordingMicRef.current) {
              setTimeout(() => {
                try {
                  recognition.start();
                } catch (e) {}
              }, 300);
            }
          }
        };

        recognition.onend = () => {
          // Continuous listening loop: restart if mic is active and not submitting
          if (isRecordingMicRef.current && !isSubmittingRef.current) {
            setTimeout(() => {
              try {
                recognition.start();
              } catch (e) {}
            }, 300);
          }
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Pause / Request Thinking Time (30 seconds)
  const requestThinkingTime = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setAutoSubmitCountdown(null);
    setIsThinkingMode(true);
    setThinkingTimer(30);

    toast.info("⏸️ Waktu berpikir 30 detik diaktifkan. Bicaralah kapan pun Anda siap.");

    const interval = setInterval(() => {
      setThinkingTimer((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setIsThinkingMode(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Auto-submit trigger
  const triggerAutoSubmit = () => {
    const textToSubmit = currentAnswerRef.current.trim();
    if (textToSubmit && !isSubmittingRef.current && !loading && !isCompleted && !isExpired) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsRecordingMic(false);
      processSubmit(textToSubmit);
    }
  };

  // Camera Video Stream setup
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startWebcam() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && isCameraActive) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: "user" },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn("Camera access not granted or unavailable:", err);
      }
    }

    if (isCameraActive && !isCompleted && !isExpired) {
      startWebcam();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraActive, isCompleted, isExpired]);

  // AI Text-to-Speech (Speaks question with natural voice, then automatically activates mic)
  const speakQuestion = (text: string) => {
    if (voiceMuted || typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();

      // Clean text for speech (remove markdown symbols, emojis, and bullet points)
      const cleanSpokenText = text
        .replace(/[*_#`~]/g, "")
        .replace(/^[•\-\d\.]+\s+/gm, "")
        .replace(/\n+/g, " ")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanSpokenText);
      utterance.lang = "id-ID";
      utterance.rate = 0.98; // Natural conversational tempo
      utterance.pitch = 1.05; // Clear, friendly, and resonant tone

      // Select highest quality Indonesian voice available in browser
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(
        (v) =>
          (v.lang === "id-ID" || v.lang.startsWith("id")) &&
          (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Damayanti") || v.name.includes("Gadis") || v.localService)
      ) || voices.find((v) => v.lang === "id-ID" || v.lang.startsWith("id"));

      if (idVoice) {
        utterance.voice = idVoice;
      }

      utterance.onend = () => {
        // Auto start mic when AI finishes speaking so user can respond naturally
        startMicListening();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  // Start Mic Listening
  const startMicListening = () => {
    if (recognitionRef.current && !isRecordingMic && !isCompleted && !isExpired && !loading) {
      try {
        recognitionRef.current.start();
        setIsRecordingMic(true);
      } catch (e) {}
    }
  };

  // Toggle Microphone recording
  const toggleMic = () => {
    if (!recognitionRef.current) {
      toast.error("Browser Anda tidak mendukung fitur Web Speech Recognition.");
      return;
    }

    if (isRecordingMic) {
      recognitionRef.current.stop();
      setIsRecordingMic(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setAutoSubmitCountdown(null);
      // If user manually turns off mic and there's text, process immediately
      if (currentAnswerRef.current.trim()) {
        triggerAutoSubmit();
      }
    } else {
      try {
        recognitionRef.current.start();
        setIsRecordingMic(true);
        toast.success("Mikrofon aktif! Silakan berbicara, jawaban akan dikirim otomatis saat Anda selesai.");
      } catch (err) {
        console.warn("Recognition start err:", err);
      }
    }
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Initial load / Resume
  useEffect(() => {
    async function initSession() {
      if (isCompleted || isExpired) return;

      setStarting(true);
      const res = await startInterviewAction(app.id);
      setStarting(false);

      if (!res.success) {
        if (res.isExpired) {
          setIsExpired(true);
          toast.error("Batas waktu wawancara telah berakhir.");
        } else {
          toast.error(res.error || "Gagal memulai sesi wawancara.");
        }
        return;
      }

      if (res.transcript?.messages) {
        setMessages(res.transcript.messages);
        if (res.transcript.duration_seconds) {
          setElapsedSeconds(res.transcript.duration_seconds);
        }

        // Speak question
        const lastMsg = res.transcript.messages[res.transcript.messages.length - 1];
        if (lastMsg && lastMsg.sender === "ai") {
          speakQuestion(lastMsg.text);
        }
      }

      if (res.isAlreadyCompleted) {
        setIsCompleted(true);
        setEvaluation(res.transcript?.overall_evaluation);
      }
    }

    initSession();
  }, [app.id, isCompleted, isExpired]);

  // Timer loop while active
  useEffect(() => {
    if (!isCompleted && !isExpired && !starting && messages.length > 0) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCompleted, isExpired, starting, messages.length]);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Main Submit Processing (Called by Enter key, Send button, or Auto-Speech detector)
  async function processSubmit(userText: string) {
    if (!userText || isSubmittingRef.current || loading || isCompleted || isExpired) return;

    isSubmittingRef.current = true;
    setLoading(true);
    setAnswerInput("");
    currentAnswerRef.current = "";
    setAutoSubmitCountdown(null);

    // Optimistic push user message
    const tempCandMsg: InterviewMessage = {
      id: `temp_${Date.now()}`,
      sender: "candidate",
      text: userText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempCandMsg]);

    const res = await submitAnswerAndGetNextAction(app.id, userText, elapsedSeconds);
    setLoading(false);
    isSubmittingRef.current = false;

    if (!res.success) {
      if (res.isExpired) {
        setIsExpired(true);
        toast.error("Batas waktu wawancara berakhir.");
      } else {
        toast.error(res.error || "Gagal mengirim jawaban.");
      }
      return;
    }

    if (res.transcript?.messages) {
      setMessages(res.transcript.messages);
      const nextAi = res.transcript.messages[res.transcript.messages.length - 1];
      if (nextAi && nextAi.sender === "ai") {
        speakQuestion(nextAi.text);
      }
    }

    if (res.isInterviewDone) {
      setIsCompleted(true);
      setEvaluation(res.evaluation);
      if (timerRef.current) clearInterval(timerRef.current);
      toast.success("Sesi wawancara AI telah selesai! Skor & evaluasi telah disimpan. 🎉");
    }
  }

  function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    triggerAutoSubmit();
  }

  // Prevent SSR Hydration Flash
  if (!isMounted) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs text-slate-500 mt-2">Menyiapkan ruang wawancara video AI...</p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: EXPIRED / WITHDRAWN
  // =========================================================================
  if (isExpired) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="card-3d bg-white rounded-3xl p-8 border border-rose-200 shadow-md space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Batas Waktu Wawancara Berakhir
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            Batas waktu pengerjaan sesi wawancara AI untuk posisi{" "}
            <strong>{app.job?.title}</strong> telah melewati tenggat waktu yang ditentukan.
            Status lamaran Anda otomatis ditandai sebagai <strong>Mengundurkan Diri</strong>.
          </p>
          <div className="pt-2">
            <Link
              href="/applications"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Daftar Lamaran</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: COMPLETED INTERVIEW (Candidate Confirmation - Scores Hidden)
  // =========================================================================
  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <div className="card-3d bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-soft-3d text-center space-y-6">
          {/* Animated Success Icon */}
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          {/* Title & Role Info */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100/80 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200">
              <span>✓ Wawancara Berhasil Diselesaikan</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Sesi Wawancara AI Telah Selesai
            </h2>
            <p className="text-sm font-bold text-blue-600">
              {app.job?.title}
            </p>
          </div>

          {/* Official HR Notice Box */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-200 pb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Informasi Tahap Selanjutnya:</span>
            </div>
            <p>
              Terima kasih atas partisipasi Anda. Seluruh jawaban dan transkrip wawancara Anda telah tersimpan secara aman dan sedang masuk dalam proses peninjauan oleh <strong>Tim HRD & Asesor Rekrutmen</strong>.
            </p>
            <p className="bg-white p-3 rounded-xl border border-slate-200 font-medium text-slate-800">
              📩 Hasil seleksi serta jadwal tahapan berikutnya akan dihubungi langsung oleh <strong>Tim HRD</strong> melalui WhatsApp / Email terdaftar Anda.
            </p>
          </div>

          {/* Metadata Duration & Status */}
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-100/70 px-4 py-2.5 rounded-xl border border-slate-200/60">
            <span>⏱️ Durasi Pengerjaan: <strong className="text-slate-800">{formatTime(elapsedSeconds)}</strong></span>
            <span className="text-emerald-700 font-bold">Status: Menunggu Review HRD</span>
          </div>

          {/* Back Button */}
          <div className="pt-2">
            <Link
              href="/applications"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Lamaran Saya</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: LIVE ACTIVE AI VIDEO & SPEECH INTERVIEW SESSION
  // =========================================================================
  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-4">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/applications"
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-xl border border-slate-200 transition-colors"
            title="Keluar"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-red-500 animate-pulse" />
              <span>SmartHR Live Video & Voice AI Interview</span>
            </div>
            <h1 className="text-sm font-black text-slate-900">{app.job?.title}</h1>
          </div>
        </div>

        {/* Live Timer & Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setVoiceMuted(!voiceMuted)}
            className={`p-2 rounded-xl border transition-colors ${
              voiceMuted ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-slate-50 text-slate-700 border-slate-200"
            }`}
            title={voiceMuted ? "Suara AI Dinonaktifkan" : "Suara AI Aktif (Membacakan Pertanyaan)"}
          >
            {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>⏱️ {formatTime(elapsedSeconds)}</span>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Video Face Cam + Live AI Dialog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Video Camera & Audio Status (4 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Webcam Card */}
          <div className="card-3d bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-md relative group">
            <div className="aspect-4/3 w-full bg-slate-900 relative flex items-center justify-center">
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="text-center space-y-2 text-slate-500">
                  <VideoOff className="w-10 h-10 mx-auto" />
                  <p className="text-xs">Kamera Dinonaktifkan</p>
                </div>
              )}

              {/* Top Badge: Candidate Name & Live indicator */}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{app.candidate?.full_name || "Kandidat"}</span>
              </div>

              {/* Mic Active Recording Waves overlay */}
              {isRecordingMic && (
                <div className="absolute bottom-3 left-3 right-3 bg-red-600/90 backdrop-blur-md text-white text-xs px-3.5 py-2 rounded-xl font-bold flex items-center justify-between border border-red-400/40 animate-pulse">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    <span>Mendengarkan Suara Anda...</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-4 bg-white animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Camera & Mic Action Bar */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  isCameraActive
                    ? "bg-slate-800 hover:bg-slate-700 text-white"
                    : "bg-rose-900/40 text-rose-300 border border-rose-700/50"
                }`}
              >
                {isCameraActive ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-rose-400" />}
                <span>{isCameraActive ? "Kamera On" : "Kamera Off"}</span>
              </button>

              <button
                type="button"
                onClick={toggleMic}
                disabled={loading || isCompleted || isExpired}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isRecordingMic
                    ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isRecordingMic ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecordingMic ? "Selesai Bicara" : "🎙️ Bicara Lewat Mic"}</span>
              </button>
            </div>
          </div>

          {/* AI Interviewer Avatar Card */}
          <div className="card-3d bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-slate-900 truncate">
                  SmartHR AI Lead Assessor
                </h4>
                <p className="text-[10px] text-slate-400">
                  Wawancara Adaptif Berbasis Kompetensi
                </p>
              </div>
              <div className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">
                Hermes AI
              </div>
            </div>

            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
              💡 <strong>Otomatis Tanpa Klik:</strong> Bicaralah dengan mic. Saat Anda selesai berbicara, sistem akan <strong>otomatis memproses jawaban Anda ke AI</strong>.
            </div>
          </div>
        </div>

        {/* Right Side: Interactive AI Dialog & Speech Response Form (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="card-3d bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-soft-3d min-h-[540px] flex flex-col justify-between">
            {/* Messages List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {starting ? (
                <div className="py-20 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    Sedang memuat konteks role {app.job?.title} dan merumuskan pertanyaan wawancara...
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <Bot className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-400">Belum ada pertanyaan.</p>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className={`flex gap-3 ${
                      m.sender === "candidate" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {m.sender === "ai" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-1.5 shadow-xs ${
                        m.sender === "candidate"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between text-[10px] font-bold pb-1 border-b ${
                          m.sender === "candidate"
                            ? "border-blue-500/40 text-blue-100"
                            : "border-slate-200 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>
                            {m.sender === "ai"
                              ? m.question_type === "follow_up"
                                ? "Pertanyaan Lanjutan (Follow-up)"
                                : "Pertanyaan Kompetensi Utama"
                              : "Jawaban Lisan / Teks Anda"}
                          </span>
                          {m.sender === "ai" && (
                            <button
                              type="button"
                              onClick={() => speakQuestion(m.text)}
                              title="Dengarkan Ulang Pertanyaan"
                              className="text-indigo-600 hover:text-indigo-800 p-0.5 cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <span>
                          {m.timestamp
                            ? new Date(m.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>

                      <p className="leading-relaxed whitespace-pre-wrap font-normal">
                        {m.text}
                      </p>
                    </div>

                    {m.sender === "candidate" && (
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {loading && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl rounded-tl-none text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>AI sedang menganalisis transkrip jawaban suara Anda dan merespon...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input / Voice-to-Text Area */}
            <form onSubmit={handleSubmitForm} className="pt-4 border-t border-slate-100 space-y-2.5">
              {/* Thinking Mode Banner */}
              {isThinkingMode && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>⏸️ Mode Berpikir Aktif ({thinkingTimer}s)... Silakan susun jawaban, lalu bicaralah.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsThinkingMode(false)}
                    className="text-[11px] font-bold text-amber-900 underline hover:text-amber-700 cursor-pointer"
                  >
                    Lanjut Bicara Sekarang
                  </button>
                </div>
              )}

              <div className="relative">
                <textarea
                  rows={3}
                  value={answerInput}
                  onChange={(e) => {
                    setAnswerInput(e.target.value);
                    currentAnswerRef.current = e.target.value;
                  }}
                  disabled={loading || isCompleted || isExpired || starting}
                  placeholder={
                    isRecordingMic
                      ? "🎤 Sedang mendengarkan suara Anda... Berbicaralah, saat Anda berhenti 5 detik sistem akan mengirim otomatis."
                      : "Klik tombol mic di bawah atau di samping untuk mulai berbicara..."
                  }
                  className={`w-full p-3.5 pr-28 rounded-2xl border text-xs text-slate-800 focus:outline-none transition-all resize-none ${
                    isRecordingMic
                      ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      triggerAutoSubmit();
                    }
                  }}
                />

                <div className="absolute right-3 bottom-3.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleMic}
                    disabled={loading || isCompleted || isExpired}
                    title={isRecordingMic ? "Hentikan Perekaman" : "Mulai Rekam Suara"}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      isRecordingMic
                        ? "bg-red-600 text-white border-red-600 animate-pulse"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                    }`}
                  >
                    {isRecordingMic ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="submit"
                    disabled={!answerInput.trim() || loading || isCompleted || isExpired || starting}
                    className="inline-flex items-center gap-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Kirim</span>
                        <Send className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Toolbar: Thinking Time & Instant Done */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 px-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={requestThinkingTime}
                    disabled={loading || isCompleted || isExpired || isThinkingMode}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>⏸️ Butuh Waktu Berpikir (30s)</span>
                  </button>

                  {answerInput.trim() && (
                    <button
                      type="button"
                      onClick={triggerAutoSubmit}
                      disabled={loading || isCompleted || isExpired}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>✅ Selesai Menjawab</span>
                    </button>
                  )}
                </div>

                <div>
                  {isRecordingMic ? (
                    autoSubmitCountdown !== null ? (
                      <span className="text-blue-600 font-bold animate-pulse">
                        ⏳ Jeda hening terdeteksi, mengirim dalam {autoSubmitCountdown}s... (Bicara untuk lanjut)
                      </span>
                    ) : (
                      <span className="text-red-600 font-bold animate-pulse">
                        ● Mendengarkan suara Anda...
                      </span>
                    )
                  ) : (
                    <span>⏱️ Durasi terekam ke DB</span>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
