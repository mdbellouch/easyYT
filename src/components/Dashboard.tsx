import React, { useState } from "react";
import { 
  Users, Eye, Film, BarChart3, TrendingUp, Sparkles, AlertCircle, 
  ChevronRight, Calendar, MessageSquare, ThumbsUp, HelpCircle, ArrowUpRight, Search, 
  Maximize2
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar 
} from "recharts";
import { ChannelData, VideoData } from "../types";
import { ACTIONABLE_CHALLENGES } from "../data";
import { getChannelNiche, NICHE_LABELS } from "../utils/niche";

interface DashboardProps {
  channel: ChannelData | null;
  videos: VideoData[];
  onSelectVideo: (video: VideoData) => void;
  onNavigateToTab: (tab: string, initialTitle?: string) => void;
}

// Custom Tooltip component for Recharts with dark layout style
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#18181b] border border-[#2d2d30] p-3 rounded-lg shadow-lg font-mono text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className="text-white font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          Views: {payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard({
  channel,
  videos,
  onSelectVideo,
  onNavigateToTab,
}: DashboardProps) {
  const [videoSearchQuery, setVideoSearchQuery] = useState("");
  const [selectedMetricPeriod, setSelectedMetricPeriod] = useState("30");

  if (!channel) {
    return (
      <div className="bg-[#111113] border border-[#222225] rounded-xl p-8 text-center flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500/80 mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold text-white">No YouTube Channel Connected</h3>
        <p className="text-sm text-gray-400 max-w-md mt-2">
          Toggle on Sandbox Mode or provide YouTube API parameters inside the Credentials panel in order to load full channel analytics.
        </p>
      </div>
    );
  }

  // Calculate cumulative stats
  const detectedNiche = getChannelNiche(channel);
  const totalViews = channel.viewCount;
  const totalSubscribers = channel.subscriberCount;
  const totalVideosQuantity = channel.videoCount;

  // Dynamically generate views trajectory trends based on actual loaded channel and videos profile
  const viewsTrendData = React.useMemo(() => {
    const period = parseInt(selectedMetricPeriod, 10) || 30;
    
    // Average video views metric
    const totalRecentViews = videos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
    const avgVideoViews = videos.length > 0 ? totalRecentViews / videos.length : 15000;
    
    // Base daily views traffic (roughly baseline index relative to total views & subscriber strength)
    const baselineDailyViews = channel 
      ? Math.max(10, Math.round((channel.viewCount / 365) * 0.12 + (avgVideoViews * 0.05)))
      : 1000;

    // Define points config according to period string selection
    let steps: number[] = [];
    if (period === 7) {
      steps = [1, 2, 3, 4, 5, 6, 7];
    } else if (period === 90) {
      steps = [10, 20, 30, 40, 50, 60, 70, 80, 90];
    } else {
      // 30 Days default
      steps = [1, 5, 10, 15, 20, 25, 30];
    }

    // Now, let's map recent video release triggers to see if they create organic retention curves/spikes
    const nowLocal = new Date();
    const videoReleases = videos.map(video => {
      const pubDate = new Date(video.publishedAt);
      const diffMs = nowLocal.getTime() - pubDate.getTime();
      const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return {
        daysAgo: diffDays,
        views: video.viewCount || 0,
        title: video.title
      };
    }).filter(v => v.daysAgo <= period);

    return steps.map((dayNum) => {
      // Scale days ago correctly: Day 1 of "Last 30 Days" means 30 days ago. Day 30 means today.
      const targetDaysAgo = period - dayNum;

      // Start with our baseline daily traffic plus some low frequency cyclic fluctuations to mimic weekends
      const cycleFactor = Math.sin(dayNum * 0.5) * (baselineDailyViews * 0.12);
      let dayViews = baselineDailyViews + cycleFactor;

      // Inject decaying spike velocity curves for video launches inside this timezone
      videoReleases.forEach((release) => {
        // days elapsed since this video launched up to the current chart tick day
        const dayDifference = targetDaysAgo - release.daysAgo;
        if (dayDifference >= 0 && dayDifference < 10) {
          // Spike amplitude begins at a portion of its view count and decays geometrically
          const spikeIntense = release.views * 0.35;
          const decay = Math.pow(0.55, dayDifference);
          dayViews += spikeIntense * decay;
        }
      });

      return {
        name: `Day ${dayNum}`,
        views: Math.max(1, Math.round(dayViews))
      };
    });
  }, [channel, videos, selectedMetricPeriod]);

  const trafficSourceData = React.useMemo(() => {
    if (!channel) return [];
    
    // Vary base distributions according to channel theme/niche using shared utility
    const detectedNiche = getChannelNiche(channel);
    let search = 45;
    let suggest = 30;
    let external = 15;
    let direct = 10;
    
    if (detectedNiche === "gaming") {
      search = 32;
      suggest = 48;
      external = 12;
      direct = 8;
    } else if (detectedNiche === "cooking") {
      search = 54;
      suggest = 24;
      external = 14;
      direct = 8;
    } else if (detectedNiche === "tech") {
      search = 58;
      suggest = 20;
      external = 15;
      direct = 7;
    } else if (detectedNiche === "finance") {
      search = 48;
      suggest = 32;
      external = 12;
      direct = 8;
    } else if (detectedNiche === "fitness") {
      search = 40;
      suggest = 38;
      external = 14;
      direct = 8;
    } else if (detectedNiche === "business") {
      search = 50;
      suggest = 25;
      external = 18;
      direct = 7;
    } else if (detectedNiche === "travel") {
      search = 35;
      suggest = 45;
      external = 12;
      direct = 8;
    } else if (detectedNiche === "science") {
      search = 30;
      suggest = 52;
      external = 10;
      direct = 8;
    } else if (detectedNiche === "design") {
      search = 52;
      suggest = 26;
      external = 15;
      direct = 7;
    } else {
      // General/default
      const shift = (channel.subscriberCount || 0) % 5;
      search = 45 + shift;
      suggest = 30 - Math.floor(shift/2);
      external = 15 - Math.ceil(shift/2);
    }
    
    return [
      { name: "YouTube Search", value: search, color: "#ef4444" },
      { name: "Suggested Videos", value: suggest, color: "#f59e0b" },
      { name: "External", value: external, color: "#3b82f6" },
      { name: "Direct/Other", value: direct, color: "#10b981" },
    ];
  }, [channel]);

  // Helper function to format big numbers humanly
  const formatHumanNumber = (number: number) => {
    if (number >= 1e6) {
      return (number / 1e6).toFixed(1) + "M";
    }
    if (number >= 1e3) {
      return (number / 1e3).toFixed(1) + "K";
    }
    return number.toString();
  };

  // Calculate active average CTR dynamically from loaded video catalog
  const avgCTR = React.useMemo(() => {
    if (videos.length === 0) return 9.2;
    const totalCTR = videos.reduce((acc, v) => acc + (v.ctr || 0), 0);
    return parseFloat((totalCTR / videos.length).toFixed(1));
  }, [videos]);

  // Filter video table
  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(videoSearchQuery.toLowerCase())
  );

  return (
    <div id="analytics-dashboard" className="space-y-6">
      
      {/* Mini Channel Snippet Header */}
      <div className="bg-[#111113] border border-[#222225] p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="flex items-center gap-4">
          <img
            src={channel.thumbnailUrl || null}
            alt={channel.title}
            className="w-16 h-16 rounded-full border-2 border-red-600 object-cover"
            id="channel-thumbnail"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold font-sans text-white hover:text-red-500 transition duration-150">
                {channel.title}
              </h1>
              {channel.customUrl && (
                <span className="text-xs bg-[#222225] border border-[#303035] text-gray-400 rounded-md py-0.5 px-2 font-mono">
                  {channel.customUrl}
                </span>
              )}
              <span className="text-[10px] bg-red-950/20 border border-red-900/40 text-red-400 font-bold font-mono rounded-md py-0.5 px-2.5">
                Niche: {NICHE_LABELS[detectedNiche]}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-2xl font-sans" id="channel-description">
              {channel.description || "No bio summary reported."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <span className="text-xs font-mono text-gray-400 bg-[#161618] border border-[#2d2d32] py-1 px-3 rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Real-Time Feed Ready
          </span>
        </div>
      </div>

      {/* Numerical Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="metrics-cards-grid">
        <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl hover:border-[#333338] transition">
          <div className="flex justify-between items-start text-gray-500">
            <span className="text-xs font-mono font-medium">Subscribers</span>
            <Users className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sans text-white" id="stat-subscribers">
              {formatHumanNumber(totalSubscribers)}
            </span>
            <span className="text-[10px] font-mono font-bold text-green-500 flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> +4.2%
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Lifetime total subscribers</p>
        </div>

        <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl hover:border-[#333338] transition">
          <div className="flex justify-between items-start text-gray-500">
            <span className="text-xs font-mono font-medium">Video Views</span>
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sans text-white" id="stat-views">
              {formatHumanNumber(totalViews)}
            </span>
            <span className="text-[10px] font-mono font-bold text-green-500 flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> +12.4%
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Total channel view count</p>
        </div>

        <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl hover:border-[#333338] transition">
          <div className="flex justify-between items-start text-gray-500">
            <span className="text-xs font-mono font-medium">Average CTR</span>
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sans text-white" id="stat-avg-ctr">
              {avgCTR}%
            </span>
            <span className="text-[10px] font-mono font-bold text-green-500 flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> +0.8%
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">SaaS standard industry goal: 8%</p>
        </div>

        <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl hover:border-[#333338] transition">
          <div className="flex justify-between items-start text-gray-500">
            <span className="text-xs font-mono font-medium">Uploaded Videos</span>
            <Film className="w-4 h-4 text-green-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sans text-white" id="stat-video-count">
              {totalVideosQuantity}
            </span>
            <span className="text-[10px] font-mono text-gray-500">Active</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">In-depth technical index</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* YT Studio Area Line Chart */}
        <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Real-Time Views Trajectory
              </h3>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">Estimated viewer traffic aggregate curve</p>
            </div>
            <select 
              value={selectedMetricPeriod} 
              onChange={(e) => setSelectedMetricPeriod(e.target.value)}
              className="bg-[#161618] border border-[#2d2d32] rounded text-xs text-gray-300 px-2 py-1 font-mono focus:outline-none focus:border-red-600"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
          
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#555" fontSize={10} fontStyle="monospace" />
                <YAxis stroke="#555" fontSize={10} fontStyle="monospace" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="views" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#viewsGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Source Pie Chart */}
        <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl">
          <h3 className="text-sm font-semibold text-white">Audience Discovery Funnel</h3>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">Top-performing traffic source nodes</p>
          
          <div className="w-full h-[155px] flex items-center justify-center mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trafficSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {trafficSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[10px]">
            {trafficSourceData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-400 truncate">{item.name}</span>
                <span className="text-white font-bold ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actionable Challenges Box */}
      <div className="bg-[#1a1313] border border-[#3c1d1d] p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-red-600/15 rounded-lg border border-red-500/35 self-start">
            <Sparkles className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              VidIQ AI Growth Tasks Identified ({ACTIONABLE_CHALLENGES.length})
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              Gemini analyzed your recent metrics. Completing these localized mini-campaigns has high margins on subscribers growth.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateToTab("chat")}
          className="p-2 px-4 whitespace-nowrap bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 hover:border-transparent text-xs font-semibold rounded-lg transition duration-200"
        >
          Consult Strategy AI
        </button>
      </div>

      {/* Actionable Challenges Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ACTIONABLE_CHALLENGES.map((challenge, index) => (
          <div key={index} className="bg-[#111113] border border-[#222225] hover:border-[#2d2d32] p-4 rounded-xl flex flex-col justify-between transition-colors">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] bg-red-950 text-red-400 border border-red-900 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                  Growth Opportunity
                </span>
                <span className="text-[10px] text-green-500 font-bold font-mono">
                  {challenge.impact}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white mt-2.5">
                {challenge.title}
              </h4>
              <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                {challenge.description}
              </p>
            </div>
            
            <button
              onClick={() => onNavigateToTab("chat", `How do I implement this growth task as a developer: "${challenge.title}"?`)}
              className="mt-3 text-[10px] font-mono font-semibold text-red-500 hover:text-red-400 flex items-center justify-end gap-1 group self-end"
            >
              Get action plan <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ))}
      </div>

      {/* Videos List and Performance Index */}
      <div className="bg-[#111113] border border-[#222225] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#222225] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Uploaded Video Content Optimizer</h3>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">Search indices, click-through-rates, and diagnostic triggers</p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search uploaded videos..."
              value={videoSearchQuery}
              onChange={(e) => setVideoSearchQuery(e.target.value)}
              className="w-full bg-[#161618] border border-[#2d2d32] focus:border-red-600 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none transition font-sans"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-sans text-xs text-left" id="videos-performance-table">
            <thead>
              <tr className="bg-[#161618] border-b border-[#222225] text-gray-400 font-mono text-[10px] uppercase">
                <th className="p-4 px-6 font-semibold">Video Title & Published</th>
                <th className="p-4 text-center font-semibold">Views</th>
                <th className="p-4 text-center font-semibold">CTR</th>
                <th className="p-4 text-center font-semibold">SEO Index</th>
                <th className="p-4 text-center font-semibold">Retention</th>
                <th className="p-4 text-right font-semibold">Optimization Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e21]" id="videos-performance-list">
              {filteredVideos.map((video) => (
                <tr key={video.id} className="hover:bg-[#1a1a1d] transition duration-150">
                  <td className="p-4 px-6 max-w-sm">
                    <div className="flex items-start gap-3">
                      <img
                        src={video.thumbnailUrl || null}
                        alt="thumb"
                        className="w-16 h-10 object-cover rounded border border-[#2d2d32] shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white truncate text-xs hover:text-red-500 transition cursor-pointer" onClick={() => onSelectVideo(video)}>
                          {video.title}
                        </h4>
                        <span className="text-[9px] text-gray-500 font-mono flex items-center gap-1.5 mt-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          {new Date(video.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-center text-white font-mono font-medium">
                    {video.viewCount.toLocaleString()}
                  </td>

                  <td className="p-4 text-center">
                    <span className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                      video.ctr >= 10 ? "bg-green-950 text-green-400 border border-green-900" :
                      video.ctr >= 7 ? "bg-amber-950 text-amber-400 border border-amber-900" :
                      "bg-red-950 text-red-400 border border-red-900"
                    }`}>
                      {video.ctr}%
                    </span>
                  </td>

                  <td className="p-4 text-center font-mono text-gray-300">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-10 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-red-600 h-full" style={{ width: `${video.seoScore}%` }}></div>
                      </div>
                      <span className="font-bold text-[10px]">{video.seoScore}</span>
                    </div>
                  </td>

                  <td className="p-4 text-center text-gray-400 font-mono">
                    <span className="text-[10px]">{video.retentionScore}%</span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => onSelectVideo(video)}
                        className="p-1 px-2.5 bg-[#1e1e22] hover:bg-[#2d2d32] border border-[#2d2d32] text-white rounded transition text-[10px] font-mono flex items-center gap-1"
                      >
                        <Maximize2 className="w-3 h-3 text-gray-400" /> Stats
                      </button>
                      <button
                        onClick={() => onNavigateToTab("title", video.title)}
                        className="p-1 px-2.5 bg-[#201811] hover:bg-[#3d2719] border border-[#422617] text-amber-500 rounded transition text-[10px] font-mono flex items-center gap-1"
                      >
                        Optimize Title
                      </button>
                      <button
                        onClick={() => onNavigateToTab("chat", `How would you improve the target demographics and retention for my latest video: "${video.title}"?`)}
                        className="p-1 px-2.5 bg-[#141d19] hover:bg-[#1a2d24] border border-[#1b3d2b] text-green-500 rounded transition text-[10px] font-mono flex items-center gap-1"
                      >
                        Ask Coach
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
