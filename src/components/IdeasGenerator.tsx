import React, { useState, useEffect } from "react";
import { 
  Lightbulb, Sparkles, AlertTriangle, Compass, Bot, Flame, Zap, 
  TrendingUp, Copy, Check, Bookmark, BookmarkCheck, ArrowRight, 
  ListOrdered, Shuffle, Filter, Sliders, ChevronRight, RefreshCw, Eye,
  Edit, Save, X, Edit3, Settings
} from "lucide-react";
import { ChannelData } from "../types";
import { apiFetch } from "../utils/api";

interface VideoIdea {
  title: string;
  ctrAngle: string;
  vibe: string;
  hookStrategy: string;
  thumbnailConcept: string;
  seoKeyword: string;
  priorityRating: "BREAKTHROUGH" | "HIGH POTENTIAL" | "STEADY FEED" | string;
}

interface VideoIdea {
  title: string;
  ctrAngle: string;
  vibe: string;
  hookStrategy: string;
  thumbnailConcept: string;
  seoKeyword: string;
  priorityRating: "BREAKTHROUGH" | "HIGH POTENTIAL" | "STEADY FEED" | string;
}

interface IdeasGeneratorProps {
  channel: ChannelData | null;
  onNavigateToTab: (tabId: string, customTitle?: string) => void;
}

const NICHE_PRESETS = [
  { label: "Tech & Coding", value: "Next.js 19 React full-stack SaaS & modern AI workflow agents" },
  { label: "Gaming Guides", value: "Gaming Guides & Walkthrough strategies" },
  { label: "Baking & Cooking", value: "Artisan sourdough yeast loaves & comfortable kitchen recipes" },
  { label: "Finance & Crypto", value: "Passive Income Growth, Stock Investing Guides, and Crypto Breakdown" },
  { label: "Fitness & Wellness", value: "HIIT Protocols, Gym Workouts, and Evidence-Based Nutrition" },
  { label: "Business & Sales", value: "Zero-to-Hero SaaS Agency, Cold Email Outreach, and Viral Short Funnels" },
  { label: "Lifestyle & Travel", value: "Minimalist Digital Nomad Vlogs, Solo Travel Hacks, and Daily Routines" },
  { label: "Science & Education", value: "Quantum Physics Breakdown, Deep Tech Documentaries, and Educational How-To" },
  { label: "Design & Creative Art", value: "Aesthetic UI/UX Design Tutorials, Figma Masterclasses, and Visual Art" }
];

const autoDetectNiche = (title: string, description: string): string => {
  const combined = `${title} ${description}`.toLowerCase();
  
  if (combined.includes("gaming") || combined.includes("walkthrough") || combined.includes("esport") || combined.includes("gameplay") || combined.includes("speedrun") || combined.includes("twitch") || combined.includes("minecraft")) {
    return "Gaming Guides & Walkthrough strategies";
  }
  if (combined.includes("kitchen") || combined.includes("recipe") || combined.includes("cook") || combined.includes("culinary") || combined.includes("mamma") || combined.includes("bake") || combined.includes("baking") || combined.includes("sourdough") || combined.includes("food")) {
    return "Artisan sourdough yeast loaves & comfortable kitchen recipes";
  }
  if (combined.includes("finance") || combined.includes("crypto") || combined.includes("investing") || combined.includes("stock") || combined.includes("wealth") || combined.includes("dividend") || combined.includes("passive income") || combined.includes("money") || combined.includes("wallet")) {
    return "Passive Income Growth, Stock Investing Guides, and Crypto Breakdown";
  }
  if (combined.includes("fitness") || combined.includes("workout") || combined.includes("gym") || combined.includes("health") || combined.includes("diet") || combined.includes("muscle") || combined.includes("exercise") || combined.includes("nutrition")) {
    return "HIIT Protocols, Gym Workouts, and Evidence-Based Nutrition";
  }
  if (combined.includes("business") || combined.includes("marketing") || combined.includes("startup") || combined.includes("agency") || combined.includes("sales") || combined.includes("funnel") || combined.includes("entrepreneur") || combined.includes("ecommerce")) {
    return "Zero-to-Hero SaaS Agency, Cold Email Outreach, and Viral Short Funnels";
  }
  if (combined.includes("travel") || combined.includes("vlog") || combined.includes("lifestyle") || combined.includes("adventure") || combined.includes("nomad") || combined.includes("vlogger")) {
    return "Minimalist Digital Nomad Vlogs, Solo Travel Hacks, and Daily Routines";
  }
  if (combined.includes("science") || combined.includes("education") || combined.includes("learn") || combined.includes("physics") || combined.includes("math") || combined.includes("history") || combined.includes("documentary") || combined.includes("teach")) {
    return "Quantum Physics Breakdown, Deep Tech Documentaries, and Educational How-To";
  }
  if (combined.includes("design") || combined.includes("creative") || combined.includes("art") || combined.includes("figma") || combined.includes("ui") || combined.includes("ux")) {
    return "Aesthetic UI/UX Design Tutorials, Figma Masterclasses, and Visual Art";
  }
  if (combined.includes("tech") || combined.includes("code") || combined.includes("coding") || combined.includes("software") || combined.includes("react") || combined.includes("saas") || combined.includes("developer") || combined.includes("ai")) {
    return "Next.js 19 React full-stack SaaS & modern AI workflow agents";
  }
  
  return "General Content Strategy & High-CTR Video Production";
};

export default function IdeasGenerator({ channel, onNavigateToTab }: IdeasGeneratorProps) {
  const [quantity, setQuantity] = useState<number>(10);
  const [angle, setAngle] = useState<string>("Evergreen Authority");
  const [customKeyword, setCustomKeyword] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"generate" | "saved">("generate");
  const [selectedIdea, setSelectedIdea] = useState<VideoIdea | null>(null);

  // Custom persistent niche & editing controls
  const [customNiche, setCustomNiche] = useState<string>("");
  const [isEditingNiche, setIsEditingNiche] = useState<boolean>(false);
  const [nicheInput, setNicheInput] = useState<string>("");

  // Sync and auto-detect exact target niche
  useEffect(() => {
    if (channel) {
      const savedNiche = localStorage.getItem(`yt_custom_niche_${channel.id || channel.title}`);
      if (savedNiche) {
        setCustomNiche(savedNiche);
        setNicheInput(savedNiche);
      } else {
        const detected = autoDetectNiche(channel.title, channel.description || "");
        setCustomNiche(detected);
        setNicheInput(detected);
      }
    } else {
      const fallback = "Next.js 19 React full-stack SaaS & modern AI workflow agents";
      setCustomNiche(fallback);
      setNicheInput(fallback);
    }
  }, [channel]);

  // Favorites state persisted locally
  const [favorites, setFavorites] = useState<VideoIdea[]>(() => {
    try {
      const saved = localStorage.getItem("yt_saved_ideas");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load default initial ideas for sandbox niches
  useEffect(() => {
    if (localStorage.getItem("yt_demo_mode") === "true" && customNiche && ideas.length === 0 && !generating) {
      triggerDefaultIdeas(customNiche);
    }
  }, [channel, customNiche]);

  // Sync favorites
  useEffect(() => {
    localStorage.setItem("yt_saved_ideas", JSON.stringify(favorites));
  }, [favorites]);

  const triggerDefaultIdeas = async (nicheToUse?: string) => {
    setGenerating(true);
    setErrorMsg(null);
    try {
      const isDemoMode = false;
      const actualNiche = nicheToUse || customNiche || (channel ? autoDetectNiche(channel.title, channel.description || "") : "Next.js 19 React full-stack SaaS & modern AI workflow agents");
      
      const payload = {
        channelTitle: channel?.title || "CreatorForge Tech & Code",
        channelDescription: channel?.description || "High deep dives into software engineering projects",
        quantity: quantity,
        angle: angle,
        customNiche: actualNiche,
        isDemo: isDemoMode
      };

      const response = await apiFetch("/api/coach/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to pre-fetch daily suggestions feed.");
      }

      const data = await response.json();
      setIdeas(data.ideas || []);
      setIsFallback(!!data.isFallback);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to initialize daily ideas board.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setErrorMsg(null);
    setSelectedIdea(null);
    try {
      const isDemoMode = false;
      let desc = channel?.description || "High deep dives into software engineering projects";
      if (customKeyword.trim()) {
        desc += ` (Focus on: ${customKeyword.trim()})`;
      }

      const response = await apiFetch("/api/coach/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelTitle: channel?.title || "CreatorForge Tech & Code",
          channelDescription: desc,
          quantity: quantity,
          angle: angle,
          customNiche: customNiche,
          isDemo: isDemoMode
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to synthesize daily video ideas.");
      }

      const data = await response.json();
      setIdeas(data.ideas || []);
      setIsFallback(!!data.isFallback);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred with Gemini ideas service.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveCustomNiche = (newNiche: string) => {
    const updatedNiche = newNiche.trim() || (channel ? autoDetectNiche(channel.title, channel.description || "") : "Next.js 19 React full-stack SaaS & modern AI workflow agents");
    setCustomNiche(updatedNiche);
    setNicheInput(updatedNiche);
    if (channel) {
      localStorage.setItem(`yt_custom_niche_${channel.id || channel.title}`, updatedNiche);
    }
    setIsEditingNiche(false);
    triggerDefaultIdeas(updatedNiche);
    // Reload dynamically so all other modules (Competitors, AI Coach, Dashboard) align to the calibrated override instantly!
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  const toggleFavorite = (idea: VideoIdea) => {
    const exists = favorites.some((f) => f.title === idea.title);
    if (exists) {
      setFavorites(favorites.filter((f) => f.title !== idea.title));
    } else {
      setFavorites([...favorites, idea]);
    }
  };

  const isFavorite = (idea: VideoIdea) => {
    return favorites.some((f) => f.title === idea.title);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const getPriorityBadge = (priority: string) => {
    const clean = String(priority).toUpperCase();
    if (clean === "BREAKTHROUGH") {
      return (
        <span className="flex items-center gap-1 text-[9px] bg-red-950/40 text-red-400 border border-red-900/40 font-bold font-mono py-0.5 px-1.5 rounded uppercase tracking-wide">
          <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          Breakthrough Trend
        </span>
      );
    } else if (clean === "HIGH POTENTIAL") {
      return (
        <span className="flex items-center gap-1 text-[9px] bg-amber-950/40 text-amber-400 border border-amber-900/40 font-bold font-mono py-0.5 px-1.5 rounded uppercase tracking-wide">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          High Potential
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 font-bold font-mono py-0.5 px-1.5 rounded uppercase tracking-wide">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          Steady Feed
        </span>
      );
    }
  };

  const activeChannelNicheDesc = () => {
    return customNiche || "Next.js 19 React full-stack SaaS & modern AI workflow agents";
  };

  return (
    <div id="ideas-generator-view" className="space-y-6">
      
      {/* Sub-Tab coordinates */}
      <div className="flex border-b border-[#2d2d32] p-0.5 space-x-1" id="ideas-subtabs">
        <button
          onClick={() => setActiveSubTab("generate")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeSubTab === "generate"
              ? "bg-[#111113] text-red-500 border-t-2 border-red-500 font-sans"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Lightbulb className="w-4 h-4 text-red-500" />
          Daily Ideas Generator
        </button>
        <button
          onClick={() => setActiveSubTab("saved")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeSubTab === "saved"
              ? "bg-[#111113] text-amber-500 border-t-2 border-amber-500 font-sans"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Bookmark className="w-4 h-4 text-amber-500" />
          Saved Ideas Board ({favorites.length})
        </button>
      </div>

      {activeSubTab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: STRATEGIC CONTROLS SIDEBAR */}
          <div className="lg:col-span-4 bg-[#111113] border border-[#222225] rounded-xl p-5 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Lightbulb className="w-24 h-24 text-red-500" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 font-sans">
                <Sliders className="w-4 h-4 text-red-500" /> Algorithm Idea Settings
              </h3>
              <p className="text-[10px] text-gray-500 font-mono mt-1 leading-snug">
                Detects <span className="text-red-400 font-bold">{channel?.title || "Your Channel"}</span>'s niche, query tags, and CTR patterns to engineer custom video campaigns.
              </p>
            </div>

            {/* ENHANCED TARGET NICHE EDIT PANEL */}
            <div className="p-3 bg-[#161619] border border-[#222225] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-gray-500 font-bold block uppercase tracking-wider">
                  {channel && localStorage.getItem(`yt_custom_niche_${channel.id || channel.title}`) ? "Customized Target Niche" : "Auto-Detected Real Niche"}
                </span>
                {!isEditingNiche && (
                  <button
                    type="button"
                    onClick={() => {
                      setNicheInput(customNiche);
                      setIsEditingNiche(true);
                    }}
                    className="text-[9px] font-mono text-red-500 hover:text-red-400 font-bold flex items-center gap-1 transition uppercase tracking-wider cursor-pointer"
                  >
                    <Edit className="w-2.5 h-2.5" /> Change Niche
                  </button>
                )}
              </div>

              {isEditingNiche ? (
                <div className="space-y-3 pt-1 border-t border-[#222225] text-left">
                  <p className="text-[9px] text-gray-400 leading-snug">
                    Select a multi-niche playground core or write your exact custom focal audience rules below:
                  </p>
                  
                  {/* Preset Tags */}
                  <div className="flex flex-wrap gap-1">
                    {NICHE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setNicheInput(preset.value)}
                        className={`text-[9vw] lg:text-[9px] font-mono py-1 px-1.5 rounded-md border transition cursor-pointer my-0.5 ${
                          nicheInput === preset.value
                            ? "bg-red-950/25 text-red-500 border-red-500/50"
                            : "bg-[#1d1d21] border-[#222225] text-gray-400 hover:text-white"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Manual input box */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-gray-500 font-bold">Refine Custom Focus Description</span>
                    <textarea
                      value={nicheInput}
                      onChange={(e) => setNicheInput(e.target.value)}
                      rows={3}
                      placeholder="e.g. Mechanical keyboard assembly & ASMR switches typing comparisons"
                      className="w-full bg-[#1c1c1f] border border-[#2d2d32] focus:border-red-500 rounded px-2 py-1.5 text-[11px] text-white focus:outline-none transition font-sans resize-none"
                    />
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSaveCustomNiche(nicheInput)}
                      className="flex-1 py-1 px-2 bg-red-650 hover:bg-red-750 text-white text-[10px] font-mono font-bold rounded flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Save className="w-3 h-3" /> Save & Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingNiche(false);
                        setNicheInput(customNiche);
                      }}
                      className="py-1 px-2 bg-[#1d1d21] hover:bg-[#28282c] text-gray-400 text-[10px] font-mono font-bold rounded flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-gray-300 font-medium block leading-relaxed">{activeChannelNicheDesc()}</span>
              )}
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Slider for Quantity */}
              <div>
                <label className="block text-xs font-mono font-semibold text-gray-400 mb-2 flex justify-between">
                  <span>Target Quantity</span>
                  <span className="text-red-500 font-bold">{quantity} Ideas</span>
                </label>
                
                {/* Visual grid selectors for standard requested options */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[10, 20, 30, 40, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(num)}
                      className={`py-1.5 px-1 text-[11px] rounded-lg font-mono font-bold border transition ${
                        quantity === num
                          ? "bg-red-950/20 text-red-500 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                          : "bg-[#161619] border-[#222225] text-gray-400 hover:text-white"
                      }`}
                    >
                      {num === 50 ? "50+" : num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Psychology Angle Preset */}
              <div>
                <label className="block text-xs font-mono font-semibold text-gray-400 mb-1.5">
                  Audience Psychology Angle
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: "Evergreen Authority", name: "Evergreen Authority", desc: "Detailed ultimate guides & tech reference cards" },
                    { id: "Trend-Jacking", name: "Trend-Jacking Speed", desc: "Immediate visual trends or 2026 META hacks" },
                    { id: "Audience Questions", name: "Audience Friction Solver", desc: "Solving direct questions or beginner mistakes" },
                    { id: "Underdog Swarm", name: "Underdog Longtail", desc: "Extremely low competition keyword targets" }
                  ].map((ang) => (
                    <button
                      key={ang.id}
                      type="button"
                      onClick={() => setAngle(ang.id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition flex flex-col justify-center ${
                        angle === ang.id
                          ? "bg-amber-950/10 text-amber-500 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.08)]"
                          : "bg-[#161619] border-[#222225] text-gray-400 hover:text-white"
                      }`}
                    >
                      <span className="text-xs font-bold font-sans">{ang.name}</span>
                      <span className="text-[9px] text-gray-500 font-mono mt-0.5 leading-none">{ang.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Focus Override Input */}
              <div>
                <label className="block text-xs font-mono font-semibold text-gray-400 mb-1.5 flex items-center justify-between">
                  <span>Custom theme focus override</span>
                  <span className="text-[9px] text-gray-600 font-bold uppercase font-mono">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={customKeyword}
                  onChange={(e) => setCustomKeyword(e.target.value)}
                  placeholder="e.g. Next.js 19 Server Actions, aim tips"
                  className="w-full bg-[#161619] border border-[#2d2d32] focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-2.5 bg-gradient-to-r from-red-650 via-amber-600 to-red-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Generating {quantity} Custom Ideas...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    Generate daily ideas campaign
                  </>
                )}
              </button>
            </form>

            {errorMsg && (
              <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg text-[10px] flex items-center gap-2 font-mono leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                {errorMsg}
              </div>
            )}
          </div>

          {/* RIGHT: DYNAMIC IDEAS FEED BOARD */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-550 animate-pulse"></span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Daily Campaign Feed ({ideas.length} ideas)
                </h2>
              </div>
              <span className="text-[10px] bg-red-950/30 text-red-400 border border-red-900/40 font-mono py-0.5 px-2 rounded-full font-bold">
                {angle} Angle Active
              </span>
            </div>

            {isFallback && (
              <div className="bg-[#1e130c]/45 border border-amber-500/15 rounded-xl p-4 flex items-start gap-3.5 animate-fade-in text-left">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">Smart Local Heuristics Engaged</h4>
                  <p className="text-[11px] text-amber-200/60 mt-1 leading-relaxed">
                    DeepMind Gemini API is currently experiencing a temporary demand surge. We have seamlessly engaged our high-performance offline rules engine to return realistic metrics instantly. No wait times, 100% active!
                  </p>
                </div>
              </div>
            )}

            {ideas.length === 0 && !generating ? (
              <div className="h-64 flex flex-col items-center justify-center text-center bg-[#111113] border border-[#222225] rounded-xl p-6">
                <Lightbulb className="w-10 h-10 text-gray-600 animate-pulse mb-3" />
                <p className="text-xs text-gray-400 font-semibold leading-relaxed">No campaign ideas populated yet.</p>
                <p className="text-[10px] text-gray-500 font-mono mt-1 leading-snug">Choose strategy parameters and spin up your daily brainstorm generators!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ideas.map((item, idx) => {
                  const saved = isFavorite(item);
                  return (
                    <div 
                      key={idx} 
                      className="bg-[#111113] border border-[#222225] hover:border-red-550/30 p-4.5 rounded-xl transition-all duration-200 flex flex-col justify-between group relative overflow-hidden shadow-md"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          {getPriorityBadge(item.priorityRating)}
                          
                          <button
                            onClick={() => toggleFavorite(item)}
                            className="text-gray-500 hover:text-amber-500 transition-colors p-1 rounded-md"
                            title={saved ? "Remove from Board" : "Bookmark Idea"}
                          >
                            {saved ? (
                              <BookmarkCheck className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Bookmark className="w-4 h-4 hover:scale-110 transition shrink-0" />
                            )}
                          </button>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white leading-snug group-hover:text-red-400 transition-colors">
                            "{item.title}"
                          </h4>
                          <span className="text-[9px] text-gray-500 font-mono block mt-1.5">
                            Target focus keyword: <span className="text-red-400/90 font-bold">{item.seoKeyword}</span>
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                          {item.ctrAngle}
                        </p>
                      </div>

                      <div className="border-t border-[#222225] my-3.5"></div>

                      <div className="flex items-center gap-1.5 justify-between">
                        <button
                          onClick={() => setSelectedIdea(item)}
                          className="px-2.5 py-1.5 bg-[#161619] hover:bg-[#222225] border border-[#2d2d32] rounded-lg text-[9px] font-mono font-bold text-gray-300 hover:text-white flex items-center justify-center gap-1 transition"
                        >
                          <Eye className="w-3 h-3 text-red-500 shrink-0" />
                          View Script & Thumb
                        </button>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => copyToClipboard(item.title, idx)}
                            className="bg-[#1a1a1d] hover:bg-[#222225] border border-[#2d2d32] hover:border-red-500/30 rounded-lg p-1.5 text-gray-400 hover:text-white transition"
                            title="Copy Title"
                          >
                            {copiedIndex === idx ? (
                              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 shrink-0" />
                            )}
                          </button>

                          <button
                            onClick={() => onNavigateToTab("title", item.title)}
                            className="bg-[#1a1a1d] hover:bg-[#222225] border border-[#2d2d32] hover:border-red-500/30 rounded-lg text-[9px] font-mono font-bold text-red-400 hover:text-white px-2 py-1.5 flex items-center gap-0.5 transition"
                            title="Analyze CTR click-potential"
                          >
                            CTR Audit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      )}

      {activeSubTab === "saved" && (
        <div className="bg-[#111113] border border-[#222225] rounded-xl p-6 glow-amber">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-amber-500 animate-pulse" /> Saved Video Strategy Board
              </h3>
              <p className="text-xs text-gray-500 font-mono mt-1">
                Pin highly valuable generated content briefs to your campaign blackboard to refer while drafting titles.
              </p>
            </div>
            {favorites.length > 0 && (
              <button
                onClick={() => setFavorites([])}
                className="py-1.5 px-3 bg-red-950/20 text-red-500 border border-red-900/35 hover:bg-red-650 hover:text-white text-[10px] font-mono font-bold rounded-lg transition"
              >
                Clear all favorites
              </button>
            )}
          </div>

          {favorites.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <Bookmark className="w-8 h-8 text-gray-700 mb-2" />
              <p className="text-xs text-gray-400 font-semibold font-sans">No saved drafts yet.</p>
              <p className="text-[10px] text-gray-500 font-mono mt-1">Bookmark high-retention video suggestions from the Daily Generator feed!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {favorites.map((item, idx) => (
                <div key={idx} className="bg-[#161619] border border-[#222225] hover:border-amber-500/30 p-5 rounded-xl relative flex flex-col justify-between transition-all duration-200">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      {getPriorityBadge(item.priorityRating)}
                      <button
                        onClick={() => toggleFavorite(item)}
                        className="text-amber-500 hover:text-gray-500 transition-colors"
                      >
                        <BookmarkCheck className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white leading-snug">
                        "{item.title}"
                      </h4>
                      <p className="text-[10px] text-gray-400 font-sans leading-relaxed mt-2">
                        {item.ctrAngle}
                      </p>
                    </div>

                    <div className="p-2 bg-[#1c1c1f] rounded-lg">
                      <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest block">First 30 seconds hook</span>
                      <p className="text-[10px] text-gray-400 leading-relaxed font-sans mt-0.5">{item.hookStrategy}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 justify-between border-t border-[#222225] pt-4 mt-5">
                    <button
                      onClick={() => onNavigateToTab("title", item.title)}
                      className="py-1.5 px-2 bg-amber-950/10 hover:bg-amber-600 border border-amber-500/25 hover:border-transparent text-[9px] font-mono font-bold text-amber-500 hover:text-white rounded-lg flex items-center gap-1 transition"
                    >
                      Audit potential CTR
                    </button>
                    
                    <button
                      onClick={() => onNavigateToTab("chat", `Help me write an outline and script tags for the video title: "${item.title}". Context is a ${activeChannelNicheDesc()} niche channel.`)}
                      className="py-1.5 px-2 bg-[#222225] hover:bg-emerald-650 text-gray-300 hover:text-white text-[9px] font-mono font-bold rounded-lg flex items-center gap-1 transition"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      Strategic Outline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OVERLAY POPUP: FULL EXPANSION DRAWER TO READ SCRIPTS & STORYBOARDS */}
      {selectedIdea && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0f0f11] border border-[#2d2d32] w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedIdea(null)}
              className="absolute top-4 right-4 p-1 rounded-lg bg-[#161619] border border-[#2d2d32] text-gray-400 hover:text-white hover:scale-105 transition"
            >
              &times; Close
            </button>

            <div className="space-y-2 pt-2">
              <span className="text-[9px] uppercase tracking-wider font-mono bg-red-950/20 text-red-500 border border-red-900/40 px-2 py-0.5 rounded-full font-bold">
                Daily Idea Briefing Card
              </span>
              <h3 className="text-base font-bold text-white mt-1 leading-snug">
                "{selectedIdea.title}"
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#161619] border border-[#222225] p-3.5 rounded-xl space-y-1.5 focus:outline-none">
                <span className="text-[9px] font-mono font-bold text-red-400 uppercase tracking-widest block flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" /> 30s Retention Hook Script
                </span>
                <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                  {selectedIdea.hookStrategy}
                </p>
                <div className="text-[9px] text-gray-500 font-mono bg-[#111113] p-1.5 rounded border border-[#222225] mt-2 leading-relaxed">
                  <strong>PRO-STRAT:</strong> Do NOT play intro templates or say "Hi, welcome". Solve the curiosity gap in the thumbnail within the first 10 frames.
                </div>
              </div>

              <div className="bg-[#161619] border border-[#222225] p-3.5 rounded-xl space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest block flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Thumbnail Art Storyboard
                </span>
                <p className="text-[11px] text-gray-300 leading-relaxed font-sans font-medium">
                  {selectedIdea.thumbnailConcept}
                </p>
                <div className="text-[9px] text-gray-500 font-mono bg-[#111113] p-1.5 rounded border border-[#222225] mt-2 leading-relaxed">
                  <strong>SATURATION SKEW:</strong> Aim for contrast values of 85% with stroke silhouettes around key assets or faces. Keep typography under 3 phrases.
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#111113] border border-[#222225] rounded-xl flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-gray-500 uppercase font-black tracking-widest">Metadata scoring index</span>
                <span className="text-gray-300 font-sans block mt-1">SEO Tag: <span className="text-red-400 font-bold font-mono">{selectedIdea.seoKeyword}</span></span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-mono text-gray-500 uppercase font-black tracking-widest">Algorithm Priority</span>
                <span className="text-white font-mono font-bold block mt-1">{selectedIdea.priorityRating}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  onNavigateToTab("title", selectedIdea.title);
                  setSelectedIdea(null);
                }}
                className="w-full py-2 bg-[#1a1a1d] hover:bg-[#222225] border border-[#2d2d32] text-[10px] font-mono font-bold text-gray-300 hover:text-white rounded-lg flex items-center justify-center gap-1 transition"
              >
                Send to CTR Title Optimizer
              </button>
              <button
                onClick={() => {
                  onNavigateToTab("chat", `Let's deep-dive into this video outline: Title: "${selectedIdea.title}". Thumbnail strategy: "${selectedIdea.thumbnailConcept}". Give me the ultimate storyboard!`);
                  setSelectedIdea(null);
                }}
                className="w-full py-2 bg-gradient-to-r from-red-650 to-red-600 hover:from-red-700 hover:to-red-700 text-white text-[10px] font-mono font-bold rounded-lg flex items-center justify-center gap-1 transition"
              >
                Strategize scripts with AI Coach
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
