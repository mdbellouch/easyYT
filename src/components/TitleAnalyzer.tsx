import React, { useState } from "react";
import { 
  Sparkles, BarChart, ThumbsUp, AlertTriangle, HelpCircle, Check, 
  Copy, CheckCircle2, Wand2, ArrowRight, Lightbulb, Search, BookOpen, Layers
} from "lucide-react";
import { TitleAnalysisResult } from "../types";
import { apiFetch } from "../utils/api";
import { SANDBOX_TITLE_ANALYSIS } from "../data";

interface TitleAnalyzerProps {
  initialTitle?: string;
}

interface SEOGeneratedTitle {
  title: string;
  seoScore: number;
  frontLoaded: boolean;
  demographicAngle: string;
  vibe: string;
  seoWeightAnalysis: string;
}

interface SEOGeneratorResult {
  focusKeyword: string;
  seoAdvice: string;
  generatedTitles: SEOGeneratedTitle[];
  isFallback?: boolean;
  geminiLimitReached?: boolean;
  errorDetails?: string;
}

const DEFAULT_SEO_RESULT: SEOGeneratorResult = {
  focusKeyword: "Vibe-Coding",
  seoAdvice: "Highly recommended to place 'Vibe-Coding' within the first 3 words. Placing structural parentheses (e.g., '(45 Mins)', '(AI SaaS)') acts as an emotional magnifier for developers, lifting click-through-ratio by over 38%.",
  generatedTitles: [
    {
      title: "How I Vibe-Coded a Full React SaaS in 45 Mins (AI Coach) 🚀",
      seoScore: 98,
      frontLoaded: false,
      demographicAngle: "Developer enthusiasts, indie hackers & tech builders",
      vibe: "Storytelling Case Study",
      seoWeightAnalysis: "Primary keyword phrase 'Vibe-Coded' is highly searchable. The parenthesis format isolates the timeline metric, creating extreme urgency."
    },
    {
      title: "Vibe-Coding Tutorial: Build Complex Apps with Gemini!",
      seoScore: 96,
      frontLoaded: true,
      demographicAngle: "Junior developers looking for clean procedural walk-throughs",
      vibe: "Ultimate How-To / Guide",
      seoWeightAnalysis: "Excellent front-loading. Instantly alerts indexers to the target phrase and guarantees mobile viewport compatibility."
    },
    {
      title: "Why Traditional Coding is Dead. Enter Vibe-Coding.",
      seoScore: 91,
      frontLoaded: false,
      demographicAngle: "Software engineers & future of tech forecasters",
      vibe: "Friction & FOMO",
      seoWeightAnalysis: "Features high narrative tension combined with trending term 'Vibe-Coding' at the end. High average view duration projection."
    }
  ]
};

export default function TitleAnalyzer({ initialTitle = "" }: TitleAnalyzerProps) {
  // Dual-Tab selector: "analyze" (existing) vs "generate" (new!)
  const [activeSubTab, setActiveSubTab] = useState<"analyze" | "generate">("generate");

  // State for Title Analyzer (Tab 1)
  const [draftTitle, setDraftTitle] = useState(initialTitle || "");
  const [keywords, setKeywords] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<TitleAnalysisResult | null>(null);
  const [analyzerErrorMsg, setAnalyzerErrorMsg] = useState<string | null>(null);
  const [copiedIndexAnalyzer, setCopiedIndexAnalyzer] = useState<number | null>(null);
  const [adoptedIndex, setAdoptedIndex] = useState<number | null>(null);

  // State for SEO Title Generator (Tab 2)
  const [seoKeyword, setSeoKeyword] = useState("");
  const [seoNicheKeywords, setSeoNicheKeywords] = useState("");
  const [seoVibe, setSeoVibe] = useState("General");
  const [generatingSEO, setGeneratingSEO] = useState(false);
  const [seoResult, setSeoResult] = useState<SEOGeneratorResult | null>(null);
  const [seoErrorMsg, setSeoErrorMsg] = useState<string | null>(null);
  const [copiedIndexSEO, setCopiedIndexSEO] = useState<number | null>(null);

  // Analyze Single Title Action
  const handleAnalyze = async (e?: React.FormEvent, forcedTitle?: string) => {
    if (e) e.preventDefault();
    const titleToAnalyze = forcedTitle !== undefined ? forcedTitle : draftTitle;
    if (!titleToAnalyze.trim()) return;

    setAnalyzing(true);
    setAnalyzerErrorMsg(null);
    try {
      const response = await apiFetch("/api/coach/analyze-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleToAnalyze,
          descriptionKeywords: keywords,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to analyze title.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setAnalyzerErrorMsg(err.message || "An error occurred with Gemini analyzer service.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAdoptTitle = (title: string, index: number) => {
    setDraftTitle(title);
    setAdoptedIndex(index);
    setTimeout(() => setAdoptedIndex(null), 2000);

    // Smoothly scroll to the top of the analyzer view
    const element = document.getElementById("title-analyzer-view");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Automatically trigger analysis with the new title
    handleAnalyze(undefined, title);
  };

  // Generate SEO Titles Action
  const handleGenerateSEOTitles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seoKeyword.trim()) return;

    setGeneratingSEO(true);
    setSeoErrorMsg(null);
    try {
      const response = await apiFetch("/api/coach/generate-titles-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: seoKeyword,
          nicheKeywords: seoNicheKeywords,
          vibe: seoVibe,
          isDemo: false,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate SEO titles.");
      }

      const data = await response.json();
      setSeoResult(data);
    } catch (err: any) {
      console.error(err);
      setSeoErrorMsg(err.message || "An error occurred with Gemini generator service.");
    } finally {
      setGeneratingSEO(false);
    }
  };

  const copyToClipboardAnalyzer = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndexAnalyzer(index);
    setTimeout(() => setCopiedIndexAnalyzer(null), 1500);
  };

  const copyToClipboardSEO = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndexSEO(index);
    setTimeout(() => setCopiedIndexSEO(null), 1500);
  };

  // Shortcut to load generated title into analyzer
  const handleTestInAnalyzer = (selectedTitle: string) => {
    setDraftTitle(selectedTitle);
    setActiveSubTab("analyze");
    // Optionally auto-run analysis
    setResult(null);
  };

  return (
    <div id="title-analyzer-view" className="space-y-6">
      
      {/* Tab Control Headers */}
      <div className="flex border-b border-[#2d2d32] p-0.5 space-x-1" id="title-subtabs">
        <button
          onClick={() => setActiveSubTab("generate")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeSubTab === "generate"
              ? "bg-[#111113] text-amber-500 border-t-2 border-amber-500 font-sans"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Wand2 className="w-4 h-4 text-amber-500 animate-pulse" />
          AI SEO Title Generator
        </button>
        <button
          onClick={() => setActiveSubTab("analyze")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeSubTab === "analyze"
              ? "bg-[#111113] text-red-500 border-t-2 border-red-500 font-sans"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <BarChart className="w-4 h-4 text-red-500" />
          Cognitive CTR Audit
        </button>
      </div>

      {/* RENDER TAB 1: SEO TITLE GENERATOR */}
      {activeSubTab === "generate" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Main Input Form */}
          <div className="bg-[#111113] border border-[#222225] rounded-xl p-6 glow-amber">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-amber-500 animate-bounce" /> Focus Keyword Title Synthesizer
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-1">
                Autonomously weave target search strings into front-loaded, high-CTR display headings optimized for mobile view truncation.
              </p>
            </div>

            <form onSubmit={handleGenerateSEOTitles} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                    Primary Focus SEO Keyword (high traffic)
                  </label>
                  <input
                    type="text"
                    value={seoKeyword}
                    onChange={(e) => setSeoKeyword(e.target.value)}
                    placeholder="e.g. Sourdough bread, build saas with ai, rank in valorant"
                    className="w-full bg-[#161618] border border-[#2d2d32] focus:border-amber-500 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-gray-400 mb-1.5">
                    Secondary SEO keywords / context (optional)
                  </label>
                  <input
                    type="text"
                    value={seoNicheKeywords}
                    onChange={(e) => setSeoNicheKeywords(e.target.value)}
                    placeholder="e.g. baking hacks, for beginners, react tutorial"
                    className="w-full bg-[#161618] border border-[#2d2d32] focus:border-amber-500 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-gray-400 mb-1.5">
                  Audience Psychology Angle / Tone Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    "General",
                    "Ultimate How-To / Guide",
                    "Storytelling Case Study",
                    "Friction & FOMO",
                    "Extreme Curiosity"
                  ].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSeoVibe(v)}
                      className={`py-2 px-2 text-[10px] rounded-lg font-mono font-bold border transition ${
                        seoVibe === v
                          ? "bg-amber-950/30 text-amber-500 border-amber-500/70 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                          : "bg-[#161618] border-[#222225] text-gray-400 hover:text-white"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={generatingSEO}
                className="w-full py-2.5 bg-gradient-to-r from-amber-550 via-red-600 to-amber-600 hover:from-amber-650 hover:to-red-650 text-white font-bold text-xs rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(239,68,68,0.45)] hover:scale-[1.01] active:scale-[0.99]"
              >
                {generatingSEO ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    Generating Search-Optimized Titles...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-white" />
                    Synthesize SEO titles
                  </>
                )}
              </button>
            </form>

            {seoErrorMsg && (
              <div className="mt-4 p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {seoErrorMsg}
              </div>
            )}
          </div>

          {/* RENDER GENERATOR RESULT */}
          {seoResult && (
            <div className="space-y-6">
              {seoResult.isFallback && (
                <div className="bg-[#1e130c]/45 border border-amber-500/15 rounded-xl p-4 flex items-start gap-3.5 mb-2 animate-fade-in text-left">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
                      {seoResult.errorDetails ? "Custom AI Connection Issue" : "Smart Local Heuristics Engaged"}
                    </h4>
                    <p className="text-[11px] text-amber-200/60 mt-1 leading-relaxed font-sans">
                      {seoResult.errorDetails ? (
                        <>
                          Your configured custom AI provider failed with error: <code className="text-red-400 font-mono text-[10px] bg-red-950/40 px-1 py-0.5 rounded">{seoResult.errorDetails}</code>. We've temporarily activated our offline growth rules engine so you don't lose progress. Verify your custom key settings or switch back to Server Standard in keys drawer.
                        </>
                      ) : (
                        "DeepMind Gemini API is currently experiencing a temporary demand surge. We have seamlessly engaged our high-performance offline rules engine to return realistic metrics instantly. No wait times, 100% active!"
                      )}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Strategic SEO Counsel Alert */}
              <div className="bg-[#151311] border border-amber-500/10 rounded-xl p-4 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest leading-none">AI Strategic SEO Counsel</h4>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed font-sans">
                    {seoResult.seoAdvice}
                  </p>
                </div>
              </div>

              {/* Grid representation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {seoResult.generatedTitles.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="bg-[#111113] border border-[#222225] hover:border-amber-500/30 p-5 rounded-xl transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
                  >
                    
                    {/* Corner rank potential badge */}
                    <div className="absolute top-0 right-0 py-1.5 px-3 bg-gradient-to-l from-amber-500/10 to-transparent text-amber-500 text-[10px] font-mono font-bold border-l border-b border-[#222225]">
                      SEO SCORE: {item.seoScore}
                    </div>

                    <div className="space-y-4">
                      {/* Vibe and Indicators */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        <span className="text-[9px] bg-amber-950/30 text-amber-400 border border-amber-900/30 font-bold font-mono py-0.5 px-1.5 rounded uppercase tracking-wide">
                          {item.vibe}
                        </span>
                        {item.frontLoaded ? (
                          <span className="text-[8px] bg-green-950/30 text-green-400 border border-green-900/40 font-mono py-0.5 px-1 rounded font-bold">
                            🔍 FRONT-LOADED KEYWORD
                          </span>
                        ) : (
                          <span className="text-[8px] bg-blue-950/30 text-blue-400 border border-blue-900/40 font-mono py-0.5 px-1 rounded font-bold">
                            🛡️ HIGHER CTR SKEW
                          </span>
                        )}
                      </div>

                      {/* Generated Heading */}
                      <div>
                        <h4 className="text-sm font-bold text-white leading-snug group-hover:text-amber-500 transition-colors">
                          "{item.title}"
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono mt-1">
                          <BookOpen className="w-3 h-3 text-gray-600" />
                          <span>{item.title.length} characters</span>
                          <span className="text-gray-700">|</span>
                          <span className={item.title.length <= 60 ? "text-green-500" : "text-amber-500"}>
                            {item.title.length <= 60 ? "Mobile Safe" : "Risk of Truncation"}
                          </span>
                        </div>
                      </div>

                      {/* Target group */}
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold block">Target Demographic</span>
                        <span className="text-xs text-gray-300 font-sans block mt-0.5">{item.demographicAngle}</span>
                      </div>

                      {/* SEO Weight breakdown */}
                      <div className="p-2.5 bg-[#161618] border border-[#222225] rounded-lg">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-amber-600 font-bold block">Google/YT SEO Math</span>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-sans mt-0.5">{item.seoWeightAnalysis}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-5">
                      <button
                        onClick={() => copyToClipboardSEO(item.title, idx)}
                        className="py-2 bg-[#1a1a1d] hover:bg-[#222225] border border-[#2d2d32] hover:border-amber-500/30 rounded-lg text-[10px] font-mono font-bold text-gray-300 hover:text-white flex items-center justify-center gap-1 transition"
                      >
                        {copiedIndexSEO === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            Copy title
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleTestInAnalyzer(item.title)}
                        className="py-2 bg-gradient-to-r from-red-950/20 to-amber-950/20 hover:from-amber-600 hover:to-red-600 border border-amber-500/30 hover:border-transparent rounded-lg text-[10px] font-mono font-bold text-amber-500 hover:text-white flex items-center justify-center gap-1 transition-all duration-200"
                      >
                        <Search className="w-3.5 h-3.5 text-red-500 group-hover:text-white shrink-0" />
                        Test click feedback
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      )}

      {/* RENDER TAB 2: COGNITIVE CTR AUDIT */}
      {activeSubTab === "analyze" && (
        <div className="space-y-6 animate-fade-in">

          {/* Existing Title optimizer form */}
          <div className="bg-[#111113] border border-[#222225] rounded-xl p-6 glow-amber">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> YouTube Click-Through Grade (CTR Optimizer)
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-1">
                Critique your existing drafts on curiosity gaps, cognitive load, character caps, and visual weight triggers via Gemini.
              </p>
            </div>

            <form onSubmit={handleAnalyze} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                  Draft Video Title To Grade ({draftTitle.length} / 60 char recommended)
                </label>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="e.g. How to Build A SaaS App With AI Coach"
                  className="w-full bg-[#161618] border border-[#2d2d32] focus:border-amber-500 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                  Target SEO Concepts & Keywords (leads search categorization)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. developer productivity, standard coding agents, express backend"
                  className="w-full bg-[#161618] border border-[#2d2d32] focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none transition font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={analyzing}
                className="w-full py-2.5 bg-gradient-to-r from-amber-550 via-red-600 to-amber-600 hover:from-amber-650 hover:to-red-650 text-white font-bold text-xs rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(239,68,68,0.45)] hover:scale-[1.01] active:scale-[0.99]"
              >
                {analyzing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    Calculating Click Psychology Metrics...
                  </>
                ) : (
                  <>
                    <BarChart className="w-4 h-4 text-white" />
                    Perform cognitive CTR analysis
                  </>
                )}
              </button>
            </form>

            {analyzerErrorMsg && (
              <div className="mt-4 p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {analyzerErrorMsg}
              </div>
            )}
          </div>

          {/* Results Display */}
          {result && (
            <div className="space-y-4">
              {result.isFallback && (
                <div className="bg-[#1e130c]/45 border border-amber-500/15 rounded-xl p-4 flex items-start gap-3.5 mb-2 animate-fade-in text-left">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
                      {result.errorDetails ? "Custom AI Connection Issue" : "Smart Local Heuristics Engaged"}
                    </h4>
                    <p className="text-[11px] text-amber-200/60 mt-1 leading-relaxed font-sans">
                      {result.errorDetails ? (
                        <>
                          Your configured custom AI provider failed with error: <code className="text-red-400 font-mono text-[10px] bg-red-950/40 px-1 py-0.5 rounded">{result.errorDetails}</code>. We've temporarily activated our offline growth rules engine so you don't lose progress. Verify your custom key settings or switch back to Server Standard in keys drawer.
                        </>
                      ) : (
                        "DeepMind Gemini API is currently experiencing a temporary demand surge. We have seamlessly engaged our high-performance offline rules engine to return realistic metrics instantly. No wait times, 100% active!"
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="analysis-results">
              
              {/* Score Gauge card */}
              <div className="bg-[#111113] border border-[#222225] rounded-xl p-5 flex flex-col items-center justify-center text-center">
                <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-4">CTR Potential Grade</h3>
                
                {/* Gauge circle drawing */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="64" stroke="#1a1a1d" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="72"
                      cy="72"
                      r="64"
                      stroke={result.score >= 80 ? "#10b981" : result.score >= 60 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={402}
                      strokeDashoffset={402 - (402 * result.score) / 100}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col">
                    <span className="text-3xl font-bold font-sans text-white">{result.score}</span>
                    <span className="text-[10px] font-mono text-gray-500 mt-0.5 font-bold">CTR SCORE</span>
                  </div>
                </div>

                <p className="text-xs text-gray-300 mt-6 leading-relaxed bg-[#161618] border border-[#2d2d32] p-3 rounded-lg text-left w-full" id="analyzed-feedback">
                  {result.feedback}
                </p>
              </div>

              {/* Strength and Weakness Auditing card */}
              <div className="bg-[#111113] border border-[#222225] rounded-xl p-5 lg:col-span-2 space-y-4">
                <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider">Linguistic Evaluation</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="space-y-2 border border-green-950/20 bg-green-950/5 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Strengths
                    </h4>
                    <ul className="space-y-2 text-xs text-gray-400 mt-2 list-disc pl-4" id="strengths-list">
                      {result.strengths.map((str, idx) => (
                        <li key={idx} className="leading-relaxed">{str}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="space-y-2 border border-red-950/20 bg-red-950/5 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-500" /> Areas of Attrition
                    </h4>
                    <ul className="space-y-2 text-xs text-gray-400 mt-2 list-disc pl-4" id="weaknesses-list">
                      {result.weaknesses.map((weak, idx) => (
                        <li key={idx} className="leading-relaxed">{weak}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Length character warning indicators */}
                <div className="p-3 bg-[#161618] border border-[#2d2d32] rounded-lg flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-sans flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
                    Mobile search viewports safely render up to 60 characters. Keeping text concise spikesCTR.
                  </span>
                  <span className="text-xs font-mono text-gray-400 font-bold shrink-0 bg-[#2d2d32] py-1 px-3 rounded-md">
                    {draftTitle.length} CHARS
                  </span>
                </div>
              </div>

              {/* Click alternative suggestions panel */}
              <div className="bg-[#111113] border border-[#222225] rounded-xl p-5 lg:col-span-3">
                <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Click-Trigger Alternative Sinks
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="alternatives-suggestions-grid">
                  {result.suggestions.map((item, idx) => (
                    <div key={idx} className="bg-[#161618] border border-[#2d2d32] hover:border-amber-900/40 p-4 rounded-xl flex flex-col justify-between transition group">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900/50 py-0.5 px-2 rounded font-mono font-bold">
                            {item.vibe}
                          </span>
                          <button
                            onClick={() => copyToClipboardAnalyzer(item.suggestedTitle, idx)}
                            className="text-gray-500 hover:text-white transition"
                            title="Copy to clipboard"
                          >
                            {copiedIndexAnalyzer === idx ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <h4 className="text-xs font-bold text-white leading-snug mt-3 group-hover:text-amber-500 transition">
                          "{item.suggestedTitle}"
                        </h4>

                        <p className="text-[11px] text-gray-400 leading-relaxed mt-2 italic">
                          {item.ctrAngle}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAdoptTitle(item.suggestedTitle, idx)}
                        className={`mt-4 w-full text-center py-1.5 font-bold text-[10px] rounded transition-all duration-150 flex items-center justify-center gap-1.5 ${
                          adoptedIndex === idx
                            ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                            : "bg-gradient-to-r from-amber-600/10 to-red-600/10 hover:from-amber-600 hover:to-red-600 border border-amber-500/25 group-hover:border-transparent text-amber-500 hover:text-white shadow-[0_0_10px_rgba(245,158,11,0.05)] hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                        }`}
                      >
                        {adoptedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Draft Adopted!
                          </>
                        ) : (
                          "Adopt as active draft"
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
          )}

        </div>
      )}

    </div>
  );
}
