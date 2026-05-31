import React, { useState, useMemo } from "react";
import { 
  Award, AlertTriangle, CheckCircle2, Bot, HelpCircle, ArrowUpRight, Check,
  Sparkles, FileSpreadsheet, Play, Activity, Star, Eye, ThumbsUp, MessageSquare, ListTodo, ShieldAlert
} from "lucide-react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { ChannelData, VideoData } from "../types";
import { getChannelNiche, NICHE_LABELS } from "../utils/niche";

interface ChannelAuditProps {
  channel: ChannelData | null;
  videos: VideoData[];
  onNavigateToTab: (tabId: string, customPrompt?: string) => void;
}

export default function ChannelAudit({ channel, videos, onNavigateToTab }: ChannelAuditProps) {
  const detectedNiche = getChannelNiche(channel);
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  if (!channel) {
    return (
      <div id="channel-audit-missing" className="bg-[#111113] border border-[#222225] rounded-xl p-8 text-center flex flex-col items-center justify-center">
        <AlertTriangle className="w-12 h-12 text-amber-500/85 mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold text-white">No YouTube Analytics Active</h3>
        <p className="text-sm text-gray-400 max-w-md mt-2">
          Toggle on Sandbox Mode or provide YouTube API parameters inside the Credentials panel in order to run a live Channel Audit.
        </p>
      </div>
    );
  }

  // Programmatic Calculations
  const auditMetrics = useMemo(() => {
    if (videos.length === 0) {
      return {
        avgCtr: 5.5,
        avgRetention: 42,
        avgSEO: 65,
        avgEngagementRatio: 2.1,
        grade: "B-",
        overallScore: 68,
        ratingWord: "Standard",
        totalLikes: 0,
        totalComments: 0
      };
    }

    const tCtr = videos.reduce((sum, v) => sum + (v.ctr || 5), 0);
    const tRetention = videos.reduce((sum, v) => sum + (v.retentionScore || 40), 0);
    const tSEO = videos.reduce((sum, v) => sum + (v.seoScore || 60), 0);
    const totalLikes = videos.reduce((sum, v) => sum + (v.likeCount || 0), 0);
    const totalComments = videos.reduce((sum, v) => sum + (v.commentCount || 0), 0);
    const totalViews = videos.reduce((sum, v) => sum + (v.viewCount || 1), 0);

    const avgCtr = parseFloat((tCtr / videos.length).toFixed(1));
    const avgRetention = Math.round(tRetention / videos.length);
    const avgSEO = Math.round(tSEO / videos.length);
    const avgEngagementRatio = parseFloat((((totalLikes + totalComments) / Math.max(1, totalViews)) * 100).toFixed(2));

    // Calculate overall score from 0 to 100
    // Weighted: CTR (35%), Retention (35%), SEO Score (20%), Engagement (10%)
    const ctrScoreFactor = Math.min(100, (avgCtr / 12) * 100); // 12% CTR is considered 100% factor
    const retentionScoreFactor = avgRetention; // out of 100
    const seoScoreFactor = avgSEO; // out of 100
    const engagementScoreFactor = Math.min(100, (avgEngagementRatio / 8) * 100); // 8% engagement ratio is supreme

    const overallScore = Math.round(
      ctrScoreFactor * 0.35 +
      retentionScoreFactor * 0.35 +
      seoScoreFactor * 0.20 +
      engagementScoreFactor * 0.10
    );

    let grade = "C";
    let ratingWord = "Developing";
    if (overallScore >= 90) {
      grade = "A+";
      ratingWord = "Excellent / High Velocity";
    } else if (overallScore >= 80) {
      grade = "A-";
      ratingWord = "Strong Growth Potential";
    } else if (overallScore >= 70) {
      grade = "B+";
      ratingWord = "Healthy / Optimizing";
    } else if (overallScore >= 60) {
      grade = "B";
      ratingWord = "Moderate Reach";
    } else if (overallScore >= 50) {
      grade = "C+";
      ratingWord = "Inconsistent Metrics";
    }

    return {
      avgCtr,
      avgRetention,
      avgSEO,
      avgEngagementRatio,
      grade,
      overallScore,
      ratingWord,
      totalLikes,
      totalComments
    };
  }, [videos]);

  // Video CTR warnings (under 4.5% requires immediate optimization)
  const ctrIssuesList = useMemo(() => {
    return videos
      .filter(v => v.ctr < 4.5)
      .map(v => ({
        id: v.id,
        title: v.title,
        ctr: v.ctr,
        views: v.viewCount,
        likes: v.likeCount,
        seoScore: v.seoScore
      }))
      .slice(0, 5);
  }, [videos]);

  // SEO warnings (SEO Score below 70 means missing description/tags)
  const seoIssuesList = useMemo(() => {
    return videos
      .filter(v => v.seoScore < 70)
      .map(v => ({
        id: v.id,
        title: v.title,
        ctr: v.ctr,
        views: v.viewCount,
        seoScore: v.seoScore
      }))
      .slice(0, 5);
  }, [videos]);

  // Radar chart data for channel strength dimensions
  const radarChartData = [
    { subject: 'Thumbnail CTR', A: Math.round(Math.min(100, (auditMetrics.avgCtr / 10) * 100)), fullMark: 100 },
    { subject: 'Viewer Retention', A: auditMetrics.avgRetention, fullMark: 100 },
    { subject: 'Meta Search SEO', A: auditMetrics.avgSEO, fullMark: 100 },
    { subject: 'Comment Velocity', A: Math.round(Math.min(100, (auditMetrics.avgEngagementRatio / 6) * 100)), fullMark: 100 },
    { subject: 'Upload Continuity', A: Math.min(100, (channel.videoCount / 80) * 100), fullMark: 100 },
  ];

  const handleToggleCheck = (key: string) => {
    setCompletedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const auditGradeStyles = (grade: string) => {
    if (grade.startsWith("A")) return "bg-red-950/40 text-red-450 border border-red-900/40";
    if (grade.startsWith("B")) return "bg-amber-950/40 text-amber-450 border border-amber-900/40";
    return "bg-[#1c1c1f] text-gray-400 border border-[#2d2d30]";
  };

  const handleLaunchConsult = () => {
    const diagnosticText = `Hi Coach! I just ran my Channel Audit Dashboard. Here indices for "${channel.title}":
- Overall Score: ${auditMetrics.overallScore}/100 (Grade: ${auditMetrics.grade})
- Average Click-Through Rate (CTR): ${auditMetrics.avgCtr}%
- Average Audience Retention Duration: ${auditMetrics.avgRetention}% 
- Metadata SEO Score alignment: ${auditMetrics.avgSEO}/100
- Engagement Velocity: ${auditMetrics.avgEngagementRatio}%
Tell me standard action steps to fix low CTR videos and level up my growth plan!`;
    
    onNavigateToTab("chat", diagnosticText);
  };

  return (
    <div id="channel-audit-wrapper" className="space-y-6">
      
      {/* Dynamic Header */}
      <div className="bg-[#111113] border border-[#222225] p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-650/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider bg-red-950/30 text-red-500 border border-red-900/40 px-2 py-0.5 rounded-full font-mono font-bold">
              Channel Health Auditor
            </span>
            <span className="text-[9px] uppercase tracking-wider bg-[#222225] text-gray-400 border border-[#333338] px-2 py-0.5 rounded-full font-mono font-bold">
              Verified Niche: {NICHE_LABELS[detectedNiche]}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
            <Award className="w-5 h-5 text-red-500 animate-pulse" /> Comprehensive Channel Audit Dashboard
          </h2>
          <p className="text-xs text-gray-400 max-w-xl font-sans">
            Deep scan click distributions, search optimizations, tag metadata density, and retention scores across 
            <span className="text-red-400 font-semibold font-mono"> {videos.length} uploaded videos</span> to maximize reach.
          </p>
        </div>

        <button
          onClick={handleLaunchConsult}
          className="p-2.5 px-4 bg-gradient-to-r from-red-650 to-red-600 hover:from-red-700 text-white text-xs font-bold font-mono rounded-lg transition shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]"
        >
          <Bot className="w-4 h-4 text-white animate-pulse" />
          Consult Growth Coach
        </button>
      </div>

      {/* Main Core Matrix Overview Grid (Bento Formats) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column - Diagnostic Score and Audit Summary (col-span-4) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          
          {/* Dynamic Grading Panel */}
          <div className="bg-[#111113] border border-[#222225] p-6 rounded-xl text-center space-y-4 flex-1 flex flex-col justify-center">
            <div>
              <span className="text-[10px] text-gray-500 font-mono block uppercase">ALGORITHMIC HEALTH GRADE</span>
              <div className="my-4 flex justify-center items-center">
                <span className={`text-6xl font-black font-sans px-8 py-4 rounded-2xl ${auditGradeStyles(auditMetrics.grade)}`}>
                  {auditMetrics.grade}
                </span>
              </div>
              <h3 className="text-md font-bold text-white mt-1 font-sans">{auditMetrics.ratingWord}</h3>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto font-sans leading-relaxed">
                Based on continuous analysis of your channel's traffic distributions, user likes and comments velocity, and impressions index.
              </p>
            </div>

            <div className="border-t border-[#1e1e21] pt-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-400 font-mono mb-1">
                  <span>Overall Health Rating</span>
                  <span className="text-white font-bold">{auditMetrics.overallScore}%</span>
                </div>
                <div className="w-full bg-[#161619] rounded-full h-2 overflow-hidden border border-[#2d2d32]">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-red-500 h-full transition-all duration-500" 
                    style={{ width: `${auditMetrics.overallScore}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left pt-1">
                <div className="bg-[#161619] p-2.5 rounded-lg border border-[#222225]">
                  <span className="text-[9px] text-[#666] font-mono uppercase block">Total Likes</span>
                  <span className="text-white font-mono font-bold text-xs">{auditMetrics.totalLikes.toLocaleString()}</span>
                </div>
                <div className="bg-[#161619] p-2.5 rounded-lg border border-[#222225]">
                  <span className="text-[9px] text-[#666] font-mono uppercase block">Comments</span>
                  <span className="text-white font-mono font-bold text-xs">{auditMetrics.totalComments.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Multi-Dimension radar Chart */}
          <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl space-y-3">
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Metrics Dimension Mapping</h3>
              <p className="text-[10px] text-gray-500 font-mono">Compares channel profile ratios against standard target bounds</p>
            </div>
            
            <div className="w-full h-[180px] flex items-center justify-center font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                  <PolarGrid stroke="#222" />
                  <PolarAngleAxis dataKey="subject" stroke="#666" fontSize={8} />
                  <PolarRadiusAxis stroke="#222" angle={30} domain={[0, 100]} tick={false} />
                  <Radar name="Channel Profile" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                  <Tooltip contentStyle={{ backgroundColor: "#111", borderColor: "#333", fontSize: "10px" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column - Audit Matrices Panels detail analysis (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Diagnostic Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#111113] border border-[#222225] p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-gray-500 font-mono uppercase block">Average CTR</span>
              <span className="text-xl font-bold font-mono text-red-400">{auditMetrics.avgCtr}%</span>
              <span className="text-[9px] text-gray-500 font-sans block leading-none">Target: 6.0% - 10.0%</span>
            </div>

            <div className="bg-[#111113] border border-[#222225] p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-gray-500 font-mono uppercase block">Viewer Retention</span>
              <span className="text-xl font-bold font-mono text-amber-400">{auditMetrics.avgRetention}%</span>
              <span className="text-[9px] text-gray-500 font-sans block leading-none">Target: &gt; 45% standard</span>
            </div>

            <div className="bg-[#111113] border border-[#222225] p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-gray-500 font-mono uppercase block">SEO Metadata</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{auditMetrics.avgSEO}/100</span>
              <span className="text-[9px] text-gray-500 font-sans block leading-none">Target: &gt; 75 search score</span>
            </div>

            <div className="bg-[#111113] border border-[#222225] p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-gray-500 font-mono uppercase block">Engagement Rate</span>
              <span className="text-xl font-bold font-mono text-blue-400">{auditMetrics.avgEngagementRatio}%</span>
              <span className="text-[9px] text-gray-500 font-sans block leading-none">Likes + Comments / Views</span>
            </div>
          </div>

          {/* Underperforming Assets Diagnostic Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* CTR Underperforming List */}
            <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                  Low-CTR Warning Stack
                </h3>
                <span className="text-[8px] font-mono text-red-400 bg-red-950/25 px-1.5 py-0.5 rounded border border-red-900/40 font-bold uppercase">Thumbnail Faults</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-snug">
                These videos receive search impressions but fail to convert viewers. Consider revising the thumbnail contrast levels or shortening titles.
              </p>

              <div className="space-y-2 pt-1 font-sans">
                {ctrIssuesList.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 font-mono text-[11px] bg-[#161619] rounded-lg">
                    ✨ No direct low CTR warnings flagged! Stellar work.
                  </div>
                ) : (
                  ctrIssuesList.map(v => (
                    <div key={v.id} className="p-2.5 bg-[#161619] hover:bg-[#1a1a1e] rounded-lg border border-[#222225] flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="block text-white font-medium truncate">{v.title}</span>
                        <span className="text-[9px] text-[#666] font-mono block mt-0.5">Views: {v.views.toLocaleString()}</span>
                      </div>
                      <span className="text-red-400 font-mono font-bold shrink-0 bg-red-950/20 px-1.5 py-0.5 rounded border border-red-900/40 text-[10px]">
                        {v.ctr}% CTR
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SEO Optimization List */}
            <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                  Low SEO Index Warning
                </h3>
                <span className="text-[8px] font-mono text-amber-400 bg-amber-950/25 px-1.5 py-0.5 rounded border border-amber-900/40 font-bold uppercase">Search Flags</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-snug">
                These videos lack rich metadata or description keyword mapping. Update descriptions to rank on target search keywords.
              </p>

              <div className="space-y-2 pt-1 font-sans">
                {seoIssuesList.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 font-mono text-[11px] bg-[#161619] rounded-lg">
                    ✨ All uploads satisfy standard search scoring metrics!
                  </div>
                ) : (
                  seoIssuesList.map(v => (
                    <div key={v.id} className="p-2.5 bg-[#161619] hover:bg-[#1a1a1e] rounded-lg border border-[#222225] flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="block text-white font-medium truncate">{v.title}</span>
                        <span className="text-[9px] text-[#666] font-mono block mt-0.5">CTR: {v.ctr}%</span>
                      </div>
                      <span className="text-amber-400 font-mono font-bold shrink-0 bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-900/40 text-[10px]">
                        {v.seoScore}/100
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Action-Item Strategy Checklist */}
          <div className="bg-[#111113] border border-[#222225] p-6 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-red-500" /> Custom Strategic Actions Checklist
              </h3>
              <p className="text-[10px] text-gray-500 font-mono mt-1 leading-snug">
                Follow these recommendations to improve organic click retention and push the algorithm limits.
              </p>
            </div>

            <div className="divide-y divide-[#1e1e21] text-xs font-sans">
              {[
                {
                  id: "fix-ctr",
                  title: "Rewrite titles for low-CTR flagging stack",
                  help: `Apply the 'three commandments' via the Title Optimizer tool on videos under 4.5% CTR.`,
                  toolTab: "title"
                },
                {
                  id: "fix-seo",
                  title: "Inject highly opportunities SEO keywords",
                  help: "Copy high-density tags from the Tag Keyword Indexer to boost indexing weight on search algorithms.",
                  toolTab: "keyword"
                },
                {
                  id: "add-retention",
                  title: "Create immediate pay-offs in video intros",
                  help: "Explanations at the start of videos boost engagement levels inside critical first-30-seconds benchmark periods.",
                  toolTab: "chat"
                }
              ].map((task) => {
                const isChecked = !!completedItems[task.id];
                return (
                  <div key={task.id} className="py-3 flex items-start gap-3 select-none justify-between">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCheck(task.id)}
                        className="mt-0.5 accent-red-650 cursor-pointer h-3.5 w-3.5 rounded border-gray-300 focus:ring-red-500"
                        id={`check-${task.id}`}
                      />
                      <label 
                        htmlFor={`check-${task.id}`} 
                        className={`cursor-pointer leading-dense ${isChecked ? "line-through text-gray-600 font-medium" : "text-gray-300"}`}
                      >
                        <span className="block font-semibold">{task.title}</span>
                        <span className="block text-[10px] text-gray-500 mt-0.5">{task.help}</span>
                      </label>
                    </div>

                    <button
                      onClick={() => onNavigateToTab(task.toolTab)}
                      className="p-1 px-2.5 bg-[#161619] hover:bg-neutral-900 border border-[#2d2d32] text-gray-300 hover:text-white rounded transition text-[10px] font-mono shrink-0 font-bold"
                    >
                      Use Tool
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
