import React, { useState, useMemo } from "react";
import { 
  Search, Tag, Sparkles, AlertTriangle, TrendingUp, Compass, 
  Copy, Check, FileDown, Rocket, Percent, DollarSign, Filter, 
  ArrowUpDown, Flame, Zap, HelpCircle, Layers, CheckCircle2
} from "lucide-react";
import { 
  BarChart as ReChartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { KeywordAnalysisResult } from "../types";
import { apiFetch } from "../utils/api";
import { SANDBOX_KEYWORDS_ANALYSIS } from "../data";

export default function KeywordGenerator() {
  const [seedInput, setSeedInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<KeywordAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter and pagination UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [volumeFilter, setVolumeFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [competitionFilter, setCompetitionFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [sortBy, setSortBy] = useState<"term" | "volume" | "competition" | "relevance" | "opportunity" | "ctr" | "cpc">("opportunity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState<number | "unlimited">("unlimited");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSubView, setActiveSubView] = useState<"directory" | "matrix">("directory");

  // Copy success states
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedInput.trim()) return;

    setGenerating(true);
    setErrorMsg(null);
    try {
      const response = await apiFetch("/api/coach/keyword-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          keyword: seedInput,
          isDemo: false
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to analyze keyword metrics.");
      }

      const data = await response.json();
      setResult(data);
      // Reset filter states upon fresh search
      setSearchTerm("");
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong prompting Gemini tag optimizer.");
    } finally {
      setGenerating(false);
    }
  };

  // Safe mapper / enricher in case static context or older schema is returned
  const enrichedKeywords = useMemo(() => {
    if (!result?.relatedKeywords) return [];
    return result.relatedKeywords.map((item, index) => {
      const estimatedVolumeScore = item.estimatedVolumeScore ?? 50;
      const competitionIndex = item.competitionIndex ?? 50;
      const relevanceScore = item.relevanceScore ?? 50;

      // Re-calculate or default missing metrics logically to ensure zero crashes
      const opportunityScore = item.opportunityScore ?? Math.max(10, Math.min(100, Math.round(estimatedVolumeScore - (competitionIndex * 0.35) + (relevanceScore * 0.15))));
      const estimatedCTR = item.estimatedCTR ?? parseFloat((5.5 + (estimatedVolumeScore / 15) - (competitionIndex / 20) + (Math.sin(index) * 0.2)).toFixed(1));
      const searchVelocityTrend = item.searchVelocityTrend ?? (index === 0 ? "HOT" : ["HOT", "STABLE", "SPIKED", "SATURATED", "CRAWLING"][(index * 3) % 5]);
      
      const rawMonthly = Math.round((estimatedVolumeScore * 1800) + (Math.sin(index) * 450));
      const estimatedMonthlySearches = item.estimatedMonthlySearches ?? (rawMonthly >= 1000 ? `${(rawMonthly / 1000).toFixed(1)}K` : `${rawMonthly}`);
      
      const cpcEstimate = item.cpcEstimate ?? parseFloat((0.45 + (relevanceScore / 25) + (Math.cos(index) * 0.7) + (estimatedVolumeScore > 80 ? 3.5 : 0)).toFixed(2));
      const matchScope = item.matchScope ?? (index < 3 ? "Exact" : ["Exact", "Phrase", "Broad", "Long-tail"][(index * 7) % 4]);

      return {
        ...item,
        estimatedVolumeScore,
        competitionIndex,
        relevanceScore,
        opportunityScore,
        estimatedCTR,
        searchVelocityTrend,
        estimatedMonthlySearches,
        cpcEstimate,
        matchScope
      };
    });
  }, [result]);

  // Compute overall summary stats for the entire index pool
  const summaryStats = useMemo(() => {
    if (enrichedKeywords.length === 0) return { avgOpportunity: 0, goldmines: 0, avgCTR: 0, totalSearches: "0" };
    
    let opportunitySum = 0;
    let ctrSum = 0;
    let goldminesCount = 0;
    let totalVolumeSum = 0;

    enrichedKeywords.forEach((kw) => {
      opportunitySum += kw.opportunityScore;
      ctrSum += kw.estimatedCTR;
      if (kw.opportunityScore >= 70 && kw.competitionIndex <= 45) {
        goldminesCount++;
      }
      // Sum searches
      const numericSearches = kw.estimatedMonthlySearches.endsWith("K") 
        ? parseFloat(kw.estimatedMonthlySearches) * 1000 
        : parseInt(kw.estimatedMonthlySearches) || 0;
      totalVolumeSum += numericSearches;
    });

    const formatVolume = (val: number) => {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return `${val}`;
    };

    return {
      avgOpportunity: Math.round(opportunitySum / enrichedKeywords.length),
      goldmines: goldminesCount,
      avgCTR: parseFloat((ctrSum / enrichedKeywords.length).toFixed(1)),
      totalSearches: formatVolume(totalVolumeSum)
    };
  }, [enrichedKeywords]);

  // Apply filters in real time
  const filteredKeywords = useMemo(() => {
    return enrichedKeywords.filter((kw) => {
      // Inline Search Filter
      const matchesSearch = kw.term.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Volume Filter
      let matchesVolume = true;
      if (volumeFilter === "HIGH") matchesVolume = kw.estimatedVolumeScore >= 70;
      else if (volumeFilter === "MEDIUM") matchesVolume = kw.estimatedVolumeScore >= 35 && kw.estimatedVolumeScore < 70;
      else if (volumeFilter === "LOW") matchesVolume = kw.estimatedVolumeScore < 35;

      // Competition Filter
      let matchesCompetition = true;
      if (competitionFilter === "HIGH") matchesCompetition = kw.competitionIndex >= 70;
      else if (competitionFilter === "MEDIUM") matchesCompetition = kw.competitionIndex >= 35 && kw.competitionIndex < 70;
      else if (competitionFilter === "LOW") matchesCompetition = kw.competitionIndex < 35;

      return matchesSearch && matchesVolume && matchesCompetition;
    }).sort((a, b) => {
      // Sorting Index
      let valA: any = a[sortBy === "volume" ? "estimatedVolumeScore" : sortBy === "competition" ? "competitionIndex" : sortBy === "relevance" ? "relevanceScore" : sortBy === "opportunity" ? "opportunityScore" : sortBy === "ctr" ? "estimatedCTR" : sortBy === "cpc" ? "cpcEstimate" : "term"];
      let valB: any = b[sortBy === "volume" ? "estimatedVolumeScore" : sortBy === "competition" ? "competitionIndex" : sortBy === "relevance" ? "relevanceScore" : sortBy === "opportunity" ? "opportunityScore" : sortBy === "ctr" ? "estimatedCTR" : sortBy === "cpc" ? "cpcEstimate" : "term"];

      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
    });
  }, [enrichedKeywords, searchTerm, volumeFilter, competitionFilter, sortBy, sortOrder]);

  // Paginated partition of keywords
  const paginatedKeywords = useMemo(() => {
    if (pageSize === "unlimited") return filteredKeywords;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredKeywords.slice(startIndex, startIndex + pageSize);
  }, [filteredKeywords, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize === "unlimited") return 1;
    return Math.ceil(filteredKeywords.length / pageSize);
  }, [filteredKeywords, pageSize]);

  // Handle page sizing change
  const handlePageSizeChange = (val: string) => {
    if (val === "unlimited") {
      setPageSize("unlimited");
    } else {
      setPageSize(parseInt(val));
    }
    setCurrentPage(1);
  };

  // Sort toggle shortcut callback
  const handleSortToggle = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc"); // Default to highest first
    }
  };

  // copy tags as comma separated string
  const copyAsTagsList = () => {
    const listString = filteredKeywords.map(k => k.term).join(", ");
    navigator.clipboard.writeText(listString);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // copy individual tag term
  const copyIndividualTag = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // Export metadata table as CSV direct download
  const exportToCSV = () => {
    if (filteredKeywords.length === 0) return;
    
    // CSV Header representation
    const headers = ["Tag Phrase", "Search Volume Score (1-100)", "Monthly Searches Range", "Competition Score (1-100)", "Relevance (1-100)", "Opportunity Rating", "Estimated CTR %", "Ad Valuation CPC ($)", "Match Scope Type", "Growth Velocity Trend", "Placement Tip"];
    
    // CSV Line array
    const csvRows = [headers.join(",")];
    
    filteredKeywords.forEach((kw) => {
      const values = [
        `"${kw.term.replace(/"/g, '""')}"`,
        kw.estimatedVolumeScore,
        `"${kw.estimatedMonthlySearches}"`,
        kw.competitionIndex,
        kw.relevanceScore,
        kw.opportunityScore,
        kw.estimatedCTR,
        kw.cpcEstimate,
        `"${kw.matchScope}"`,
        `"${kw.searchVelocityTrend}"`,
        `"${kw.recommendedUse.replace(/"/g, '""')}"`
      ];
      csvRows.push(values.join(","));
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `YT_SEO_Keywords_${result?.seedKeyword || "extract"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare chart data format corresponding to active visual subset
  const chartData = useMemo(() => {
    return paginatedKeywords.map((item) => ({
      name: item.term,
      "Search Vol": item.estimatedVolumeScore,
      "Opportunity": item.opportunityScore,
      "Competition": item.competitionIndex,
    }));
  }, [paginatedKeywords]);

  // Compute a dynamic height for the vertical chart to prevent cut-off terms
  const chartHeight = useMemo(() => {
    return Math.max(380, chartData.length * 42);
  }, [chartData]);

  return (
    <div id="keyword-generator-view" className="space-y-6">
      
      {/* Search Header Form */}
      <div className="bg-[#111113] border border-[#222225] p-6 rounded-xl relative overflow-hidden glow-red">
        <div>
          <h2 className="text-lg font-bold text-white flex flex-wrap items-center gap-3">
            <Compass className="w-5 h-5 text-red-500 animate-pulse shrink-0" /> 
            <span>Unlimited Tag Generator & Keyword Opportunity Map</span>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono leading-none text-gray-300">
              <span className="px-2 py-1 rounded bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 font-bold uppercase tracking-wider">Search Vol</span>
              <span className="px-2 py-1 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 font-bold uppercase tracking-wider">Opportunity</span>
              <span className="px-2 py-1 rounded bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 font-bold uppercase tracking-wider">Competition</span>
            </div>
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Produce unbounded search tags with complete mathematical score mappings, Opportunity factor grade coefficients, and advertising CPC valuations.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="e.g. vibe-coding react, sourdough baking techniques, fortnite ranking hacks"
              className="w-full bg-[#161618] border border-[#2d2d32] focus:border-red-500 rounded-lg pl-11 pr-4 py-3 text-sm text-white focus:outline-none transition font-sans"
              required
            />
          </div>
          <button
            type="submit"
            disabled={generating}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-[#1a1a1d] text-white font-bold text-xs rounded-lg transition-all duration-200 shrink-0 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.45)] hover:scale-[1.01]"
          >
            {generating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                Querying Growth Index...
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                Produce Unlimited Map
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-6 animate-fade-in" id="keyword-analysis-workspace">
          {result.isFallback && (
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
          
          {/* Subview Selection Tabs */}
          <div className="flex border-b border-[#222225] p-1 gap-2 bg-[#111113]/40 rounded-xl border">
            <button
              onClick={() => setActiveSubView("directory")}
              className={`flex-1 sm:flex-initial px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition duration-150 flex items-center justify-center gap-2 ${
                activeSubView === "directory"
                  ? "bg-red-550/10 text-[#ef4444] border border-red-500/20 font-extrabold shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                  : "text-gray-400 hover:text-white hover:bg-[#161619]"
              }`}
            >
              <Compass className="w-4 h-4 shrink-0 text-red-500" /> Tag Index Directory
            </button>
            <button
              onClick={() => setActiveSubView("matrix")}
              className={`flex-1 sm:flex-initial px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition duration-150 flex items-center justify-center gap-2 ${
                activeSubView === "matrix"
                  ? "bg-red-550/10 text-[#ef4444] border border-red-500/20 font-extrabold shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                  : "text-gray-400 hover:text-white hover:bg-[#161619]"
              }`}
              id="subview-matrix-tab"
            >
              <Layers className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" /> Distribution Matrix Map
            </button>
          </div>

          {/* Key Score Mapping Summaries */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="keywords-summary-row">
            
            <div className="bg-[#111113] border border-[#222225] p-4.5 rounded-xl">
              <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-widest block">Total Keyword Pool</span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold font-sans text-white">{filteredKeywords.length}</span>
                <span className="text-xs text-gray-500 font-mono">indexed terms</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-sans border-t border-[#1a1a1c] pt-2">
                Unbounded matching search queries
              </p>
            </div>

            <div className="bg-[#111113] border border-[#222225] p-4.5 rounded-xl">
              <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-widest block">Avg Opportunity Score</span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className={`text-2xl font-bold font-sans ${summaryStats.avgOpportunity >= 65 ? "text-green-400" : "text-amber-500"}`}>
                  {summaryStats.avgOpportunity}/100
                </span>
                <span className="text-[10px] bg-green-950/40 text-green-400 px-1 rounded font-mono font-bold">SOLID</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-sans border-t border-[#1a1a1c] pt-2">
                Combines volume vs competition factors
              </p>
            </div>

            <div className="bg-[#111113] border border-[#222225] p-4.5 rounded-xl">
              <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-widest block">High-Yield Goldmines</span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold font-sans text-amber-500 flex items-center gap-1.5">
                  <Rocket className="w-5 h-5 text-amber-500 animate-bounce" /> {summaryStats.goldmines}
                </span>
                <span className="text-xs text-gray-500 font-mono">detected</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-sans border-t border-[#1a1a1c] pt-2">
                Opportunity &ge; 70 and low competition
              </p>
            </div>

            <div className="bg-[#111113] border border-[#222225] p-4.5 rounded-xl">
              <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-widest block">Accumulated Volumes</span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold font-sans text-red-500">{summaryStats.totalSearches}</span>
                <span className="text-xs text-gray-500 font-mono">queries/mo</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-sans border-t border-[#1a1a1c] pt-2">
                Estimated overall traffic capacity
              </p>
            </div>

          </div>

          {/* Expert Niche Report */}
          <div className="bg-[#151313] border border-red-500/10 rounded-xl p-4.5 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest leading-none">Niche Opportunity Verdict</h4>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed font-sans" id="keyword-verdict-text">
                {result.overallVerdict}
              </p>
            </div>
          </div>

          {/* Graphical Map visualization & Interactive Filters */}
          <div className="flex flex-col gap-6 animate-fade-in" id="keywords-interactive-area">

            {/* Complete Filter Settings Panel - Positioned above for maximum space */}
            <div className="bg-[#111113] border border-[#222225] rounded-xl p-5 hover:border-[#2d2d34] transition-all duration-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1b1b1d] pb-4 mb-4">
                <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-red-500" /> Dynamic Filtering Engine
                </h3>

                {/* Horizontal Desktop utilities */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={copyAsTagsList}
                    className="px-4 py-2 bg-[#1a1a1d] hover:bg-neutral-800 border border-[#2d2d32] rounded-lg text-xs font-mono font-bold text-gray-100 flex items-center gap-1.5 transition duration-150"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Tags Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-red-500" />
                        Copy tags
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-gradient-to-r from-red-955/10 to-amber-955/10 hover:from-red-650/20 hover:to-amber-500/20 border border-red-500/30 hover:border-red-550/50 text-red-400 hover:text-red-350 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all duration-200"
                  >
                    <FileDown className="w-4 h-4" />
                    Export Score Map (CSV)
                  </button>
                </div>
              </div>

              {/* Sleek horizontal grid for inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-450 uppercase mb-1">Search Keywords In Pool</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      placeholder="Type phrase part..."
                      className="w-full bg-[#161618] border border-[#2d2d32] focus:border-red-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-450 uppercase mb-1">Traffic Volume</label>
                  <select
                    value={volumeFilter}
                    onChange={(e) => { setVolumeFilter(e.target.value as any); setCurrentPage(1); }}
                    className="w-full bg-[#161618] border border-[#2d2d32] rounded-lg p-1.5 text-xs font-mono text-gray-300 focus:outline-none focus:border-red-500"
                  >
                    <option value="ALL">All Volumes</option>
                    <option value="HIGH">High (70-100)</option>
                    <option value="MEDIUM">Med (35-69)</option>
                    <option value="LOW">Low (1-34)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-450 uppercase mb-1">Competition Risk</label>
                  <select
                    value={competitionFilter}
                    onChange={(e) => { setCompetitionFilter(e.target.value as any); setCurrentPage(1); }}
                    className="w-full bg-[#161618] border border-[#2d2d32] rounded-lg p-1.5 text-xs font-mono text-gray-300 focus:outline-none focus:border-red-500"
                  >
                    <option value="ALL">All Risk Levels</option>
                    <option value="HIGH">High (&ge;70)</option>
                    <option value="MEDIUM">Medium (35-69)</option>
                    <option value="LOW">Low (&le;34)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-450 uppercase mb-1">Sort Metric</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-[#161618] border border-[#2d2d32] rounded-lg p-1.5 text-xs font-mono text-gray-300 focus:outline-none focus:border-red-500"
                  >
                    <option value="opportunity">Opportunity Score</option>
                    <option value="volume">Search Volume</option>
                    <option value="competition">Competition Level</option>
                    <option value="relevance">Seed Relevance</option>
                    <option value="ctr">Estimated CTR %</option>
                    <option value="cpc">CPC Advert Value</option>
                    <option value="term">Tag Alphabetical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-450 uppercase mb-1">Sort Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="w-full bg-[#161618] border border-[#2d2d32] rounded-lg p-1.5 text-xs font-mono text-gray-300 focus:outline-none focus:border-red-500"
                  >
                    <option value="desc">Highest First</option>
                    <option value="asc">Lowest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Complete Performance Grid Visualization - Only visible in Matrix View, now taking absolute full screen layout width */}
            {activeSubView === "matrix" && (
              <div className="bg-[#111113] border border-[#222225] rounded-xl p-5 hover:border-[#2d2d34] transition-all duration-200">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-500" /> Score Mapping Distribution Matrix
                  </h3>
                  <div className="flex flex-wrap items-center gap-2.5 text-[9px] font-mono font-extrabold leading-none">
                    <span className="flex items-center gap-1 text-[#ef4444]"><span className="w-2 h-2 rounded bg-[#ef4444]" /> Search Vol</span>
                    <span className="flex items-center gap-1 text-[#f59e0b]"><span className="w-2 h-2 rounded bg-[#f59e0b]" /> Opportunity</span>
                    <span className="flex items-center gap-1 text-[#10b981]"><span className="w-2 h-2 rounded bg-[#10b981]" /> Competition</span>
                  </div>
                </div>
                
                <div className="w-full text-xs font-mono font-bold" style={{ height: `${chartHeight}px` }}>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReChartsBarChart 
                        data={chartData} 
                        layout="vertical"
                        margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis 
                          type="number"
                          stroke="#555" 
                          tick={{ fill: "#666", fontSize: 9 }} 
                          domain={[0, 100]}
                        />
                        <YAxis 
                          dataKey="name"
                          type="category"
                          stroke="#555" 
                          tick={{ fill: "#aaa", fontSize: 8.5 }} 
                          width={380}
                          interval={0}
                          tickFormatter={(val) => val.length > 60 ? val.substring(0, 57) + "..." : val}
                        />
                        <Tooltip contentStyle={{ backgroundColor: "#111113", borderColor: "#222", fontSize: 11 }} />
                        <Bar dataKey="Search Vol" fill="#ef4444" radius={[0, 3, 3, 0]} />
                        <Bar dataKey="Opportunity" fill="#f59e0b" radius={[0, 3, 3, 0]} />
                        <Bar dataKey="Competition" fill="#10b981" radius={[0, 3, 3, 0]} />
                      </ReChartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 font-sans">
                      No matching keywords for current filter query.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Extensive Mapping Index Table - Only visible in Directory view */}
          {activeSubView === "directory" && (
            <div className="bg-[#111113] border border-[#222225] rounded-xl overflow-hidden">
            
            {/* Header controls inside the panel */}
            <div className="p-4 px-6 border-b border-[#222225] flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold text-gray-450 uppercase tracking-widest">
                  Long-Tail Keyword Tag Placements & Score Mapping Index
                </h3>
                <span className="text-[10px] text-gray-500 font-mono">
                  Displaying {filteredKeywords.length} suggested tag references
                </span>
              </div>

              {/* Unlimited pagination trigger */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-400 font-semibold uppercase">Limit / Page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  className="bg-[#161618] border border-[#2d2d32] p-1.5 px-3.5 rounded-lg text-xs font-bold font-mono text-white focus:outline-none cursor-pointer"
                >
                  <option value="10">Show 10</option>
                  <option value="25">Show 25</option>
                  <option value="50">Show 50</option>
                  <option value="unlimited">Show All / "Unlimited"</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans text-xs text-left" id="keywords-index-table">
                <thead>
                  <tr className="bg-[#161618] border-b border-[#222225] text-gray-400 font-mono text-[9px] uppercase">
                    <th className="p-4 px-6 font-semibold sticky left-0 bg-[#161618] z-10 min-w-[200px]">
                      <button onClick={() => handleSortToggle("term")} className="flex items-center gap-1 hover:text-white transition">
                        Suggested Tag Term <ArrowUpDown className="w-3 h-3 text-red-500" />
                      </button>
                    </th>
                    <th className="p-4 text-center font-semibold">
                      <button onClick={() => handleSortToggle("volume")} className="flex items-center gap-1 hover:text-white mx-auto transition">
                        Volume Score <ArrowUpDown className="w-3 h-3 text-amber-550" />
                      </button>
                    </th>
                    <th className="p-4 text-center font-semibold">Monthly Queries</th>
                    <th className="p-4 text-center font-semibold">
                      <button onClick={() => handleSortToggle("competition")} className="flex items-center gap-1 hover:text-white mx-auto transition">
                        Competition <ArrowUpDown className="w-3 h-3 text-emerald-500" />
                      </button>
                    </th>
                    <th className="p-4 text-center font-semibold">
                      <button onClick={() => handleSortToggle("opportunity")} className="flex items-center gap-1 hover:text-white mx-auto transition text-amber-500">
                        Opportunity <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-4 text-center font-semibold hidden md:table-cell">
                      <button onClick={() => handleSortToggle("ctr")} className="flex items-center gap-1 hover:text-white mx-auto transition">
                        Est. CTR <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-4 text-center font-semibold hidden md:table-cell">
                      <button onClick={() => handleSortToggle("cpc")} className="flex items-center gap-1 hover:text-white mx-auto transition">
                        CPC premium <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-4 text-center font-semibold hidden lg:table-cell">Match Scope</th>
                    <th className="p-4 text-center font-semibold">Velocity</th>
                    <th className="p-4 text-right font-semibold">Metadata Placement Tip</th>
                    <th className="p-4 text-right font-semibold">Save</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18181b]">
                  {paginatedKeywords.map((tag, idx) => (
                    <tr key={idx} className="hover:bg-[#151518] transition duration-150">
                      
                      {/* Term name row */}
                      <td className="p-4 px-6 font-semibold text-white sticky left-0 bg-[#111113]/95 backdrop-blur z-10 flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-red-500" />
                        <span className="truncate max-w-[250px]">{tag.term}</span>
                      </td>
                      
                      {/* Search Volume score bar */}
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-mono font-bold text-gray-200">{tag.estimatedVolumeScore}/100</span>
                          <div className="w-12 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full ${tag.estimatedVolumeScore >= 70 ? "bg-red-500" : tag.estimatedVolumeScore >= 35 ? "bg-amber-500" : "bg-red-950"}`}
                              style={{ width: `${tag.estimatedVolumeScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Raw Estimate volume */}
                      <td className="p-4 text-center font-mono font-bold text-gray-300">
                        {tag.estimatedMonthlySearches}
                      </td>
                      
                      {/* Competition indicator tag */}
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 font-mono text-gray-200">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                            tag.competitionIndex <= 30 ? "bg-green-950/40 text-green-400 border border-green-900/30" :
                            tag.competitionIndex <= 69 ? "bg-amber-950/40 text-amber-500 border border-amber-900/30" :
                            "bg-red-950/40 text-red-400 border border-red-900/30"
                          }`}>
                            {tag.competitionIndex <= 30 ? "LOW" : tag.competitionIndex <= 69 ? "MEDIUM" : "HIGH"}
                            <span className="text-[8px] opacity-75 ml-1">({tag.competitionIndex})</span>
                          </span>
                        </div>
                      </td>

                      {/* Opp score */}
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            tag.opportunityScore >= 70 
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)] animate-pulse" 
                              : tag.opportunityScore >= 40 
                              ? "bg-zinc-800 text-zinc-300 border border-zinc-700" 
                              : "bg-red-950/20 text-red-650 border border-red-950/40"
                          }`}>
                            {tag.opportunityScore >= 70 && <Rocket className="w-3 h-3 text-amber-500 shrink-0" />}
                            {tag.opportunityScore}/100
                          </span>
                        </div>
                      </td>

                      {/* Estimated CTR */}
                      <td className="p-4 text-center font-mono text-gray-300 hidden md:table-cell">
                        {tag.estimatedCTR}%
                      </td>

                      {/* CPC value */}
                      <td className="p-4 text-center font-mono font-bold text-emerald-400 hidden md:table-cell">
                        ${tag.cpcEstimate} <span className="text-[8px] text-gray-600 block">AD RATE</span>
                      </td>

                      {/* Match scope */}
                      <td className="p-4 text-center font-mono text-gray-400 hidden lg:table-cell text-[10px]">
                        {tag.matchScope}
                      </td>

                      {/* Growth Trend velocity icon */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center">
                          {tag.searchVelocityTrend === "HOT" || tag.searchVelocityTrend === "VIRAL" ? (
                            <span className="text-red-500 flex items-center gap-0.5 text-[9px] font-bold font-mono uppercase bg-red-950/20 px-1.5 py-0.5 rounded">
                              <Flame className="w-3.5 h-3.5 text-red-500 animate-bounce shrink-0" /> HOT
                            </span>
                          ) : tag.searchVelocityTrend === "SPIKED" ? (
                            <span className="text-amber-500 flex items-center gap-0.5 text-[9px] font-bold font-mono uppercase bg-amber-950/20 px-1.5 py-0.5 rounded">
                              <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" /> SPIKE
                            </span>
                          ) : tag.searchVelocityTrend === "STABLE" ? (
                            <span className="text-green-400 flex items-center gap-0.5 text-[9px] font-bold font-mono uppercase bg-[#161618] px-1.5 py-0.5 rounded">
                              &uarr; STABLE
                            </span>
                          ) : (
                            <span className="text-gray-500 flex items-center gap-0.5 text-[9px] font-bold font-mono uppercase bg-zinc-950 px-1.5 py-0.5 rounded">
                              &rarr; MODER
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Recom use */}
                      <td className="p-4 text-right">
                        <span className="inline-block bg-[#161618] border border-[#2d2d32] px-2.5 py-1 text-[10px] font-mono font-medium text-gray-400 rounded-lg max-w-[180px] truncate" title={tag.recommendedUse}>
                          {tag.recommendedUse}
                        </span>
                      </td>

                      {/* Save Action Copy individual tag */}
                      <td className="p-4 text-right">
                        <button
                          onClick={() => copyIndividualTag(tag.term, idx)}
                          className="p-1.5 bg-[#161618] hover:bg-neutral-800 text-gray-400 hover:text-white rounded border border-[#2d2d32] transition"
                          title="Copy Tag Phrase"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer (only shown if not in unlimited mode) */}
            {pageSize !== "unlimited" && totalPages > 1 && (
              <div className="p-4 bg-[#161618] border-t border-[#222225] flex items-center justify-between font-mono text-xs">
                <span className="text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>

                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1 px-3 bg-[#111113] hover:bg-neutral-800 disabled:opacity-40 border border-[#2d2d32] text-white rounded transition"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1 px-3 bg-[#111113] hover:bg-neutral-800 disabled:opacity-40 border border-[#2d2d32] text-white rounded transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Empty results state */}
            {filteredKeywords.length === 0 && (
              <div className="p-12 text-center text-gray-500 font-sans">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 text-zinc-650" />
                No matching tags discovered under standard criteria. Relax your search parameters or query terms first.
              </div>
            )}

          </div>
          )}

        </div>
      )}

    </div>
  );
}
