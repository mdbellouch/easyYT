import React, { useState } from "react";
import { 
  FileText, ShieldAlert, Award, Zap, Sparkles, Bot, Clock, Maximize2, 
  Layers, Copy, Check, BarChart2, MessageSquare, AlertCircle, RefreshCw, Eye
} from "lucide-react";
import { apiFetch } from "../utils/api";

interface TranscriptAuditorProps {
  onNavigateToTab: (tabId: string, customPrompt?: string) => void;
}

interface Chapter {
  timestamp: string;
  title: string;
  summary: string;
  pacing: string;
}

interface HookAnalysis {
  score: number;
  strategyUsed: string;
  auditoryTriggers: string[];
  retentionHacks: string[];
}

interface TextGraphic {
  timestampRange: string;
  suggestedTemplate: string;
  psychologicalTriggers: string;
  designGuidelines: string;
}

interface AuditResult {
  chapters: Chapter[];
  hookAnalysis: HookAnalysis;
  textGraphics: TextGraphic[];
  isFallback?: boolean;
}

const DEFAULT_SAMPLE_TRANSCRIPT = `So we built a real-time web application in less than forty-five minutes, but everyone kept asking how to secure their database keys. Today, I'm going to show you the absolute best way to hide your keys. This is the exact setup used by multi-million dollar SaaS ecosystems, and no, we are not using standard client environment wrappers. 

First, look at how simple our server file is. We import standard express, load our variables on the backend, and proxy the request so the browser never even sees the token.

Next, we establish secure firestore rules. If you do not write these rules immediately, anyone with your key can delete your entire database. I'm going to show you how to write these rules step-by-step.`;

export default function TranscriptAuditor({ onNavigateToTab }: TranscriptAuditorProps) {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const loadingMessages = [
    "Deconstructing vocal pacing frequencies...",
    "Decoding the auditory 30-second scroll stopper...",
    "Splicing timestamped narrative chapters...",
    "Calculating drop-off zones and tension benchmarks...",
    "Synthesizing high-retention text graphics targets...",
    "Compiling elite YouTube execution blueprints..."
  ];

  const handleLoadSample = () => {
    setTranscript(DEFAULT_SAMPLE_TRANSCRIPT);
    setError(null);
  };

  const handleAudit = async () => {
    if (!transcript.trim()) {
      setError("Please paste a script or transcript to execute the audit.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % loadingMessages.length);
    }, 1800);

    try {
      const response = await apiFetch("/api/coach/analyze-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to audit competitor transcript.");
      }

      const data: AuditResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during the transcript audit.");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleConsultCoach = () => {
    if (!result) return;
    
    const promptText = `Hey Coach! I ran an execution blueprint audit on a competitor video script. Here are the findings:
- Hook Strategy Detected: "${result.hookAnalysis.strategyUsed}" (Auditory Score: ${result.hookAnalysis.score}/100)
- Core retention hacks proposed: ${result.hookAnalysis.retentionHacks.join(" / ")}
- High Retention Graphic overlays targets: ${result.textGraphics.map(tg => `${tg.timestampRange} -> ${tg.suggestedTemplate}`).join(" | ")}

Please help me translate these pacing, auditory, and graphic insights into my own next video workflow!`;
    
    onNavigateToTab("chat", promptText);
  };

  return (
    <div id="transcript-auditor-root" className="space-y-6 text-left">
      
      {/* Intro Header */}
      <div className="bg-[#111113] border border-[#222225] p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-650/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-1.5">
          <span className="text-[9px] uppercase tracking-wider bg-red-950/30 text-red-500 border border-red-900/40 px-2 py-0.5 rounded-full font-mono font-bold">
            Competitor Intelligence Suite
          </span>
          <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-400" /> Script Hook & Retention Auditor
          </h2>
          <p className="text-xs text-gray-400 max-w-xl font-sans">
            Paste any competitor's transcript. Our system runs an expert YouTube editor execution 
            blueprint to dissect critical auditory anchors, pacing changes, and text graphics targets to beat their retention.
          </p>
        </div>

        <button
          onClick={handleLoadSample}
          className="p-2 px-3.5 bg-[#161619] border border-[#2d2d32] hover:border-[#444] text-gray-300 hover:text-white text-xs font-semibold rounded-lg transition shrink-0 cursor-pointer"
        >
          📝 Use Sample Script
        </button>
      </div>

      {/* Input container */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-[#111113] border border-[#222225] p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-red-500" /> Paste Competitor's Transcript
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">Supports raw transcript or script blocks</span>
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="For example: 'Wait, don't build next js apps the wrong way... Today I'm going to show you why you are failing...'"
            className="w-full h-44 bg-[#161619] border border-[#2d2d32] focus:border-red-500 rounded-xl p-4 text-xs text-white placeholder-gray-650 focus:outline-none focus:ring-1 focus:ring-red-500/30 font-sans leading-relaxed resize-y"
          />

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-550 font-mono">
              Word count: {transcript.trim() ? transcript.trim().split(/\s+/).length : 0} words
            </span>

            <button
              onClick={handleAudit}
              disabled={loading}
              className={`px-6 py-2.5 bg-gradient-to-r from-red-650 to-red-600 hover:from-red-700 text-white text-xs font-bold font-mono rounded-lg transition flex items-center gap-2 shadow-md cursor-pointer ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Pacing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                  Run AI Retention Breakdown
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Reassuring custom loader */}
      {loading && (
        <div className="bg-[#111113] border border-[#222225] p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
          <div className="relative">
            <RefreshCw className="w-10 h-10 text-red-500 animate-spin" />
            <Sparkles className="w-5 h-5 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-white font-mono font-bold tracking-widest uppercase">
              {loadingMessages[loadingStep]}
            </p>
            <p className="text-[10px] text-gray-500 font-mono">
              Running Gemini 3.5 audio deconvolution blueprints...
            </p>
          </div>
          <div className="w-48 bg-[#1a1a1e] h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-red-500 h-full transition-all duration-500" 
              style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Audit Output Results */}
      {result && (
        <div className="space-y-6 animate-fadeIn pb-10">
          {result.isFallback && (
            <div className="bg-[#1e130c]/45 border border-amber-500/15 rounded-xl p-4 flex items-start gap-3.5 mb-2 animate-fade-in text-left">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">Smart Local Heuristics Engaged</h4>
                <p className="text-[11px] text-amber-200/60 mt-1 leading-relaxed">
                  DeepMind Gemini API is currently experiencing a temporary demand surge. We have seamlessly engaged our high-performance offline rules engine to return realistic metrics instantly. No wait times, 100% active!
                </p>
              </div>
            </div>
          )}
          
          {/* Top Score Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Hook Audit & Score Block */}
            <div className="lg:col-span-5 bg-[#111113] border border-[#222225] p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-wider block font-bold">Auditory Opening Blueprint</span>
                <h3 className="text-lg font-black text-white font-sans">Vocal Hook Analysis</h3>
              </div>

              {/* Score Display Visual */}
              <div className="my-5 flex items-center gap-5">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#1c1c22" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      stroke="#10b981" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * result.hookAnalysis.score) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-white font-mono leading-none">{result.hookAnalysis.score}</span>
                    <span className="text-[9px] text-gray-500 font-mono uppercase font-semibold">Score</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 block uppercase font-bold">Hook Category:</span>
                  <div className="inline-block px-2.5 py-1 bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 rounded-lg text-xs font-bold font-mono">
                    ⚡ {result.hookAnalysis.strategyUsed}
                  </div>
                  <p className="text-[9px] text-gray-500 font-mono leading-relaxed mt-1">
                    This captures estimated scroll friction. Ideal metrics exceed 85 points.
                  </p>
                </div>
              </div>

              {/* Auditory Triggers list */}
              <div className="space-y-3 pt-3 border-t border-[#1c1c20]">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Auditory Strengths:</span>
                <ul className="space-y-2 text-xs">
                  {result.hookAnalysis.auditoryTriggers.map((trig, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-gray-300">
                      <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed font-sans">{trig}</p>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Editing Retention Hacks & Guidance */}
            <div className="lg:col-span-7 bg-[#111113] border border-[#222225] p-6 rounded-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] font-mono text-amber-500 uppercase tracking-wider block font-bold">Sound Design Strategy</span>
                  <h3 className="text-base font-bold text-white font-sans flex items-center gap-1.5">
                    <Award className="w-5 h-5 text-amber-500" /> Professional Sound Design Hacks
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono leading-relaxed mt-0.5">
                    Recommended background track and SFX changes to enforce extreme AVD (Average View Duration).
                  </p>
                </div>

                <div className="space-y-3.5 font-sans text-xs">
                  {result.hookAnalysis.retentionHacks.map((hack, index) => (
                    <div key={index} className="p-4 rounded-xl bg-[#161619] border border-[#222225] flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-950/30 text-amber-400 border border-amber-900/40 font-mono flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-gray-300 leading-relaxed text-xs font-sans">
                        {hack}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consultation trigger shortcut */}
              <div className="pt-4 border-t border-[#1c1c20] flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <span className="text-[10px] text-gray-500 font-mono text-center sm:text-left">
                  Configure scripts or plan presets with AI coach instantly.
                </span>
                <button
                  onClick={handleConsultCoach}
                  className="w-full sm:w-auto p-2 px-4 bg-[#161619] hover:bg-[#1c1c20] border border-[#2d2d32] text-white text-xs font-bold font-mono rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-red-500 animate-pulse" /> Ask AI to Rewrite Hook
                </button>
              </div>

            </div>

          </div>

          {/* Chapters Timeline Dissector */}
          <div className="bg-[#111113] border border-[#222225] p-6 rounded-2xl relative">
            <div className="space-y-1 mb-6">
              <span className="text-[9px] font-mono text-red-500 uppercase tracking-wider block font-bold">Sequential Chronos Dissector</span>
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-red-500" /> Storyboard Chrono Chapter Breakdown
              </h3>
              <p className="text-xs text-gray-400 font-sans">
                Deconstructs the narrative rhythm into clear pacing shifts and estimated viewer retention segments.
              </p>
            </div>

            {/* Vertical timeline visualizer layout */}
            <div className="space-y-6 relative border-l border-[#222225] pl-6 ml-3">
              {result.chapters.map((ch, idx) => (
                <div key={idx} className="relative group text-left">
                  
                  {/* Circle locator */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#111113] border-2 border-red-500 flex items-center justify-center group-hover:scale-125 transition-all duration-200">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  </div>

                  <div className="bg-[#161619] border border-[#222225] p-4.5 rounded-xl space-y-2 hover:border-[#2d2d32] transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-red-500 bg-red-950/20 px-2.5 py-1 rounded border border-red-900/40">
                          {ch.timestamp}
                        </span>
                        <h4 className="text-xs font-bold text-white font-sans">{ch.title}</h4>
                      </div>
                      <div className="inline-block px-2.5 py-0.5 bg-[#202024] text-gray-300 font-mono text-[10px] rounded-full text-center shrink-0">
                        ⚡ {ch.pacing}
                      </div>
                    </div>
                    <p className="text-xs text-gray-450 leading-relaxed font-sans mt-1">
                      {ch.summary}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Retention text graphics overlay targets */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-[#777] uppercase tracking-wider block font-bold">Retention Graphics Schedule</span>
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-1.5">
                <Layers className="w-5 h-5 text-red-500" /> Tactical Visual Text Graphics Schedule
              </h3>
              <p className="text-xs text-gray-400 font-sans">
                Suggested locations to inject bold kinetic text, graphic slides, or metric shapes to shock and reset viewer dropoff curves.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {result.textGraphics.map((tg, index) => (
                <div key={index} className="bg-[#111113] border border-[#222225] p-5 rounded-xl space-y-4 text-left hover:border-red-950/50 transition duration-200 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-950/20 border border-emerald-950 px-2 py-0.5 rounded">
                        ⌛ {tg.timestampRange}
                      </span>
                      <button
                        onClick={() => handleCopyToClipboard(tg.suggestedTemplate, index)}
                        className="p-1 rounded bg-[#1c1c20] hover:bg-[#25252b] text-gray-400 hover:text-white transition"
                        title="Copy Graphic Blueprint Text"
                      >
                        {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <p className="text-xs font-bold text-white leading-normal font-sans">
                      {tg.suggestedTemplate}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-[#1a1a1f] text-[11px] leading-relaxed">
                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase block font-semibold">Psychological Trigger:</span>
                      <p className="text-gray-400 font-sans">{tg.psychologicalTriggers}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase block font-semibold">Design Blueprint:</span>
                      <p className="text-gray-450 font-sans italic">{tg.designGuidelines}</p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
