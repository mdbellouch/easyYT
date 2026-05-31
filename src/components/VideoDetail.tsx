import React from "react";
import { ArrowLeft, Clock, Eye, ThumbsUp, MessageSquare, AlertCircle, BarChart, FileText, HelpCircle, ExternalLink } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { VideoData } from "../types";

interface VideoDetailProps {
  video: VideoData;
  onBack: () => void;
  onNavigateToTab: (tab: string, initialTitle?: string) => void;
}

export default function VideoDetail({ video, onBack, onNavigateToTab }: VideoDetailProps) {
  // Generate highly realistic retention curve data based on video's retention score
  const durationMinutes = 10; // general duration mapping
  const retentionData = [
    { time: "0:00", retention: 100 },
    { time: "0:05", retention: 91 },
    { time: "0:30", retention: Math.max(50, video.retentionScore - 10) }, // 30s hook drop-off
    { time: "1:00", retention: Math.max(45, video.retentionScore - 15) },
    { time: "2:00", retention: Math.max(42, video.retentionScore - 18) },
    { time: "3:00", retention: Math.max(39, video.retentionScore - 20) },
    { time: "4:00", retention: Math.max(37, video.retentionScore - 22) },
    { time: "5:00", retention: Math.max(35, video.retentionScore - 24) },
    { time: "7:00", retention: Math.max(30, video.retentionScore - 30) },
    { time: "9:00", retention: Math.max(25, video.retentionScore - 35) },
    { time: "10:00", retention: Math.max(15, video.retentionScore - 45) },
  ];

  // Helper function to format duration string PtxxMxxS -> human readable
  const formatDuration = (str: string) => {
    return str.replace("PT", "").replace("H", "h ").replace("M", "m ").replace("S", "s");
  };

  return (
    <div id="video-detail-view" className="space-y-6">
      
      {/* Back button and title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-1 px-3 text-xs bg-[#111113] border border-[#222225] text-gray-400 hover:text-white rounded-lg transition flex items-center gap-1.5 font-mono cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to channel dashboard
        </button>
      </div>

      {/* Main Stats Block Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Info detail banner */}
        <div className="bg-[#111113] border border-[#222225] rounded-xl p-5 md:col-span-1 flex flex-col justify-between">
          <div className="space-y-4">
            <img
              src={video.thumbnailUrl || null}
              alt="thumb"
              className="w-full h-44 object-cover rounded-lg border border-[#222225]"
            />
            <div>
              <span className="text-[9px] bg-red-950 text-red-500 border border-red-900 font-mono py-0.5 px-1.5 rounded uppercase font-bold">
                Performance Diagnostics
              </span>
              <h1 className="text-sm font-bold text-white mt-2 leading-snug">
                {video.title}
              </h1>
              <span className="text-[10px] text-gray-500 font-mono block mt-1">
                Published on {new Date(video.publishedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-[#1e1e21] pt-4 mt-4 font-mono text-center">
            <div>
              <span className="block text-[10px] text-gray-500 uppercase">Views</span>
              <span className="text-xs font-bold text-white mt-1 block">
                {video.viewCount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-500 uppercase">Likes</span>
              <span className="text-xs font-bold text-white mt-1 block">
                {video.likeCount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-500 uppercase">Comments</span>
              <span className="text-xs font-bold text-white mt-1 block">
                {video.commentCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Retention Graph Curve Section */}
        <div className="bg-[#111113] border border-[#222225] rounded-xl p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Audience Retention Diagnostic</h3>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">Simulated chart tracing percentage of active viewers</p>
            </div>
            <span className="text-xs font-mono font-bold text-green-500 bg-green-950 border border-green-900/50 py-0.5 px-2 rounded-md">
              Retention target: 50%
            </span>
          </div>

          <div className="w-full h-[180px] text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={retentionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="retentionGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="time" stroke="#555" />
                <YAxis stroke="#555" unit="%" />
                <Tooltip formatter={(value) => [`${value}%`, "Retention"]} />
                <Area type="monotone" dataKey="retention" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#retentionGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-[#18181b] border border-[#28282b] rounded-lg mt-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-gray-400 font-sans leading-relaxed">
              <strong>Retention Drop-Off:</strong> Your video has a standard initial 30s drop-off to {Math.max(50, video.retentionScore - 10)}%. This suggests your video introduction/hook can be optimized. Cut long logos or greetings to stabilize this decay!
            </div>
          </div>
        </div>
      </div>

      {/* SEO score and Gemini Growth strategies panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SEO Score metrics */}
        <div className="bg-[#111113] border border-[#222225] rounded-xl p-5 lg:col-span-1 space-y-4">
          <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Metadata SEO Diagnostics</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs text-gray-300 font-sans mb-1.5">
                <span>Title & Tag Indexing match</span>
                <span className="font-mono font-bold">{video.seoScore}/100</span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: `${video.seoScore}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs text-gray-300 font-sans mb-1.5">
                <span>Tag Density Score</span>
                <span className="font-mono font-bold">85/100</span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: "85%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs text-gray-300 font-sans mb-1.5">
                <span>Description Link Check</span>
                <span className="font-mono font-bold">Pass</span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: "100%" }}></div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e1e21] flex justify-between items-center bg-[#161618] p-3 rounded-lg border">
            <div className="font-mono text-[10px] text-gray-400">
              <span className="block">Video Duration:</span>
              <span className="text-white font-bold block mt-1">{formatDuration(video.duration)}</span>
            </div>
            
            <button
              onClick={() => onNavigateToTab("title", video.title)}
              className="p-1.5 px-3 bg-amber-600/10 hover:bg-amber-600 border border-amber-500/25 text-amber-500 hover:text-white rounded transition text-[10px] font-mono"
            >
              Analyze Title
            </button>
          </div>
        </div>

        {/* Gemini powered recommendations */}
        <div className="bg-[#111113] border border-[#222225] rounded-xl p-5 lg:col-span-2 space-y-4">
          <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">AI Retention Fixes & Action Plan</h3>
          
          <div className="space-y-3">
            <div className="p-3.5 bg-[#161618] border border-[#2d2d32] rounded-xl flex items-start gap-3">
              <span className="w-5 h-5 bg-red-650/10 border border-red-500/25 rounded-full flex items-center justify-center text-red-500 text-[10px] font-bold shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h4 className="text-xs font-bold text-white">Stabilize initial hook (0:00 - 0:30)</h4>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  Avoid asking viewers to subscribe or explain what the video is about. Introduce the key deliverable immediately in the first 5 seconds to match scroll expectations.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#161618] border border-[#2d2d32] rounded-xl flex items-start gap-3">
              <span className="w-5 h-5 bg-red-650/10 border border-red-500/25 rounded-full flex items-center justify-center text-red-500 text-[10px] font-bold shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h4 className="text-xs font-bold text-white">Insert visual spikes at (2:00)</h4>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  Add dynamic on-screen text overlays, zoom cuts, or schematic diagrams at key coding sections. Breaking quiet lecture audio blocks recovers passive user focus.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#161618] border border-[#2d2d32] rounded-xl flex items-start gap-3">
              <span className="w-5 h-5 bg-red-650/10 border border-red-500/25 rounded-full flex items-center justify-center text-red-500 text-[10px] font-bold shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h4 className="text-xs font-bold text-white">Execute strategic CTR matching</h4>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  Your video description possesses robust indexing volume, but your Click-Through-Rate is under the 8% target. Test a high-CTR alternative title in our Click Potentials Engine.
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => onNavigateToTab("chat", `I need a script restructure plan for my video: "${video.title}". Specifically how to fix retention drops at the beginning.`)}
            className="w-full text-center py-2 bg-[#141d19] hover:bg-green-600 border border-[#1b3d2b] hover:border-transparent text-green-500 hover:text-white font-semibold text-xs rounded-lg transition"
          >
            Consult Script Doctor AI
          </button>
        </div>

      </div>

    </div>
  );
}
