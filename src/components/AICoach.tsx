import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, HelpCircle, Bot, User, Trash2, ArrowDown, Clipboard, Check, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage, ChannelData } from "../types";
import { apiFetch } from "../utils/api";
import { getChannelNiche, NicheCategory, NICHE_LABELS } from "../utils/niche";

interface AICoachProps {
  channel: ChannelData | null;
  initialPrompt?: string;
  onClearPrompt?: () => void;
}

// Conversation starter suggestions across standard channel niches
const NICHE_STARTER_PROMPTS: Record<NicheCategory, Array<{ label: string; prompt: string; vibe: string }>> = {
  gaming: [
    {
      label: "3 Gaming Concepts",
      prompt: "Generate 3 highly viral gaming video concepts (such as challenges, speedruns, or mod showcase) with enticing titles and custom thumbnail scenes.",
      vibe: "Ideation"
    },
    {
      label: "Let's Play 30s Hook",
      prompt: "Draft an intense, high-retention 30-second introduction hook for a challenging gameplay walk-through. Keep the pacing extremely fast.",
      vibe: "Retention"
    },
    {
      label: "Gaming CTR Optimization",
      prompt: "Suggest 5 design optimization tips for gaming thumbnails, focusing on zoom, face expressions, high contrast, and epic game background framing.",
      vibe: "Design CTR"
    },
    {
      label: "Gaming Tags & SEO Profile",
      prompt: "Generate an SEO keyword profile, description snippets, and smart tags for a popular modern game walkthrough to rank on top search results.",
      vibe: "SEO Metadata"
    }
  ],
  cooking: [
    {
      label: "3 Recipe Ideas",
      prompt: "Provide 3 appetizing, viral recipe video concepts focusing on quick cooking hacks or mouth-watering close-up aesthetics.",
      vibe: "Ideation"
    },
    {
      label: "Culinary Video Hook",
      prompt: "Draft a high-sensory 30-second video intro script for a recipe walkthrough, opening with sizzling sounds and delicious food visuals.",
      vibe: "Retention"
    },
    {
      label: "Food Thumbnail Appeal",
      prompt: "Advise on 5 advanced tactics to make food thumbnails look incredibly mouthwatering (steam, color saturation, macro lenses, splash effect).",
      vibe: "Design CTR"
    },
    {
      label: "Culinary Search SEO",
      prompt: "Provide a list of high-traffic cooking/recipe keywords and structured instructions on optimizing description blocks for search indexers.",
      vibe: "SEO Metadata"
    }
  ],
  finance: [
    {
      label: "3 Finance Concepts",
      prompt: "Brainstorm 3 high-impact passive-income or investing video concepts. Focus on breaking down complex trends into simple, thumb-stopping ideas.",
      vibe: "Ideation"
    },
    {
      label: "Finance Hook Screenplay",
      prompt: "Draft a 30-second intro hook about inflation, stocks, or wealth optimization that holds attention by addressing a specific pain-point instantly.",
      vibe: "Retention"
    },
    {
      label: "Finance Graphic CTR",
      prompt: "List 5 thumbnail design psychological parameters for financial videos (graphs, big red/green alerts, bold numbers, face of surprise).",
      vibe: "Design CTR"
    },
    {
      label: "Wealth & Finance SEO",
      prompt: "Devise a search-optimized description blueprint and metadata strategy that targets high-CPM investing and budgeting web traffic.",
      vibe: "SEO Metadata"
    }
  ],
  fitness: [
    {
      label: "3 Workout Campaigns",
      prompt: "Develop 3 engaging fitness challenge concepts or workout tutorial series. Emphasize physical transformation loops and workout motivation.",
      vibe: "Ideation"
    },
    {
      label: "Gym Tutorial Hook",
      prompt: "Write a high-energy, value-packed 30-second introduction script for a body fat reduction or muscle gain guide. Cut standard gym intro tropes.",
      vibe: "Retention"
    },
    {
      label: "Fitness Visual Authority",
      prompt: "Detail 5 aesthetic rules for fitness thumbnails, emphasizing before/after comparisons, anatomical graphics, and intense lighting contrast.",
      vibe: "Design CTR"
    },
    {
      label: "Fitness SEO Metrics",
      prompt: "Formulate search meta tags and description copy that optimizes index metrics on bodyweight home exercises and bodybuilding guides.",
      vibe: "SEO Metadata"
    }
  ],
  business: [
    {
      label: "3 Business/SaaS Concepts",
      prompt: "Generate 3 strategic business growth, startup ideas, or marketing funnel breakdown videos that attract young entrepreneurs.",
      vibe: "Ideation"
    },
    {
      label: "SaaS Case Study Hook",
      prompt: "Draft a persuasive 30-second case-study introduction detailing how a micro-SaaS scaled from zero to $10k MRR. Focus on quick hook metrics.",
      vibe: "Retention"
    },
    {
      label: "Industrial/B2B CTR Rules",
      prompt: "Suggest 5 psychological visual cues in startup/business thumbnails that drive high click rates, utilizing brand clean looks and stats.",
      vibe: "Design CTR"
    },
    {
      label: "Enterprise SEO Index",
      prompt: "Formulate a description and key tag framework aimed at professional services, marketing funnels, and modern startup SaaS audiences.",
      vibe: "SEO Metadata"
    }
  ],
  travel: [
    {
      label: "3 Nomadic Travel Logs",
      prompt: "Draft 3 cinematic, high-curiosity travel itinerary or minimalist nomadic living video topics that trigger intense wanderlust.",
      vibe: "Ideation"
    },
    {
      label: "Cinematic Travel Hook",
      prompt: "Give me a 30-second narrator hook script for a scenic exploration video. Create curiosity about hidden gems or beautiful travel guides.",
      vibe: "Retention"
    },
    {
      label: "Wanderlust Thumbnail CTR",
      prompt: "Explain 5 photographic framing, color grading, and textual backdrop rules to make generic landscapes look highly clickable on homepages.",
      vibe: "Design CTR"
    },
    {
      label: "Nomadic Travel SEO Tags",
      prompt: "Recommend a high-performing SEO tag collection and blog-like description optimization for budget backpackers and digital nomads.",
      vibe: "SEO Metadata"
    }
  ],
  science: [
    {
      label: "3 Documentary Concepts",
      prompt: "Outline 3 mind-bending scientific documentary concepts (e.g., space time, quantum paradoxes, or biological evolutions) built for mass appeal.",
      vibe: "Ideation"
    },
    {
      label: "Scientific Mystery Hook",
      prompt: "Write a 30-second science hook script that starts with a paradoxical question (e.g., 'What if gravity worked sideways?'), holding student focus.",
      vibe: "Retention"
    },
    {
      label: "Curiosity-Driven Thumbnails",
      prompt: "Suggest 5 visual contrast guidelines for science thumbnails (mysterious cosmos, dramatic custom vector icons, dark minimalist styles).",
      vibe: "Design CTR"
    },
    {
      label: "Educational SEO Setup",
      prompt: "Structure a tag library and academic indexing profile focused on raising visibility in educational and intellectual search metrics.",
      vibe: "SEO Metadata"
    }
  ],
  design: [
    {
      label: "3 UI/UX Design Ideas",
      prompt: "Propose 3 UI/UX Figma design redesign or styling feedback video ideas. Highlight clean visual aesthetics and micro-interaction trends.",
      vibe: "Ideation"
    },
    {
      label: "Aesthetic Figma Hook",
      prompt: "Draft a 30-second introduction hook explaining a fast, high-performance styling workflow in Figma. Start by showing the final stunning layout.",
      vibe: "Retention"
    },
    {
      label: "Figma/Design Visual CTR",
      prompt: "Analyze 5 layout compositions for design/portfolio custom thumbnails, detailing standard alignment grids, typographic lockups, and glowing accents.",
      vibe: "Design CTR"
    },
    {
      label: "Design Framework SEO",
      prompt: "Generate custom tags, search headlines, and description hierarchies targetting design systems, developer handoff, and UI assets.",
      vibe: "SEO Metadata"
    }
  ],
  tech: [
    {
      label: "3 Code/Tech Concepts",
      prompt: "Devise 3 viral, high-conversion tech tutorial or software engineering concepts based on modern coding patterns (React 19, TypeScript, Next.js).",
      vibe: "Ideation"
    },
    {
      label: "Software Project Hook",
      prompt: "Draft a high-retention 30-second script intro matching a standard tech coding build. Cut out all polite introductions and get straight to code.",
      vibe: "Retention"
    },
    {
      label: "Tech/Coding Icon CTR",
      prompt: "Brainstorm 5 detailed code preview and custom terminal visual aesthetics to double my click rate on technical tutorial uploads.",
      vibe: "Design CTR"
    },
    {
      label: "TypeScript/React SEO",
      prompt: "Write an SEO-optimized coding channel description block and deep-ranking tags that capture searches for framework integrations.",
      vibe: "SEO Metadata"
    }
  ],
  general: [
    {
      label: "3 Mainstream Concepts",
      prompt: "Draft 3 mainstream, high-curiosity video concepts. Maximize broad audience appeal, specifying the visual thumbnail hook and target market.",
      vibe: "Ideation"
    },
    {
      label: "High-Engagement 30s Hook",
      prompt: "Write an ultra-high retention 30-second video introduction hook script. Set up a clear question, dynamic stakes, and block all introductory fluff.",
      vibe: "Retention"
    },
    {
      label: "Universal CTR Optimizer",
      prompt: "Detail 5 essential graphic rules for optimized CTR performance (bold face, 3-color rules, high contrast values, dynamic rule of thirds).",
      vibe: "Design CTR"
    },
    {
      label: "Omnichannel SEO Model",
      prompt: "Suggest a broad, search-optimized description structure and meta tag configuration for maximum algorithm indexing reach.",
      vibe: "SEO Metadata"
    }
  ]
};

export default function AICoach({
  channel,
  initialPrompt,
  onClearPrompt
}: AICoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      role: "model",
      content: `⚡ **Welcome to VidIQ AI Coach!** 

I am your growth strategist and creator consultation engine. I've aggregated CTR structures from creator playbooks (like MrBeast) alongside VidIQ's SEO tag matrices to help you scale your channel.

**How can I help you optimize your channel today?** Select one of the strategy chips below or write a custom question.`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Detect active niche category based on channel meta or persistent custom niche
  const activeNiche: NicheCategory = React.useMemo(() => {
    return getChannelNiche(channel);
  }, [channel]);

  const [selectedStarter, setSelectedStarter] = useState<{ label: string; prompt: string; vibe: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle triggered prompts from dashboard actions
  useEffect(() => {
    if (initialPrompt) {
      handleSendPrompt(initialPrompt);
      if (onClearPrompt) onClearPrompt();
    }
  }, [initialPrompt]);

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-msg-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      role: "user",
      content: promptText,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Create chat context summary
      const context = channel 
        ? {
            channelTitle: channel.title,
            description: channel.description,
            subscribers: channel.subscriberCount,
            totalViews: channel.viewCount,
            totalVideos: channel.videoCount
          }
        : null;

      const response = await apiFetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
          context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to contact Gemini coach server.");
      }

      const data = await response.json();
      
      let content = data.text || "No insights reported. Please verify Gemini API key variables.";
      if (data.isFallback) {
        if (data.errorDetails) {
          content = `⚠️ **Custom AI Connection Error (Offline Fallback active):**\n` +
                    `> *${data.errorDetails}*\n` +
                    `> \n` +
                    `> To resolve this, check your custom token balance or endpoint status, or switch your provider back to "Server Standard" inside the **Keys Configuration** panel 🔑 (top right of the dashboard).\n\n` +
                    content;
        } else {
          content = `*(Smart Offline Heuristics Activated due to temporary Gemini API demand surge)*\n\n` + content;
        }
      }
      
      const coachMsg: ChatMessage = {
        id: `coach-msg-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        role: "model",
        content,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, coachMsg]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          role: "model",
          content: `⚠️ **Analytics System Error:** ${error.message || "Failed to establish AI link. Please double check standard environment settings and reload."}`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome-msg",
        role: "model",
        content: `⚡ **Chat initialized.** Ready for new strategic channel optimizations. Select a preset below to start.`,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const copyTextToClipboard = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(msgId);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div id="ai-coach-view" className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] min-h-[500px]">
      
      {/* Sidebar: Recommended Prompts / Presets */}
      <div className="bg-[#111113] border border-[#222225] rounded-xl p-5 flex flex-col justify-between lg:col-span-1">
        <div className="space-y-4">
          <div>
            <span className="text-[10px] bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded font-mono font-bold uppercase">
              Micro-Campaigns
            </span>
            <h3 className="text-sm font-bold text-white mt-3">Contextual Starters</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">Customized for your niche</p>
            <div className="mt-2.5 flex items-center gap-1.5 bg-[#17171a] border border-[#232326] px-2.5 py-1.5 rounded-lg text-amber-500 border-amber-900/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[8px] text-gray-500 font-mono uppercase tracking-wider font-semibold">Active channel focus</span>
                <span className="text-[11px] font-sans font-bold text-white leading-normal">{NICHE_LABELS[activeNiche]}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            {(NICHE_STARTER_PROMPTS[activeNiche] || NICHE_STARTER_PROMPTS.general).map((starter, index) => {
              const isActive = selectedStarter?.label === starter.label;
              return (
                <button
                  key={index}
                  onClick={() => {
                    setInput(starter.prompt);
                    setSelectedStarter(starter);
                    textareaRef.current?.focus();
                    setSuccessMsg(`"${starter.label}" template loaded to editor! Action options are now available above the input.`);
                    setTimeout(() => setSuccessMsg(null), 3500);
                  }}
                  disabled={loading}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition flex flex-col gap-1 group cursor-pointer ${
                    isActive
                      ? "bg-[#271515] border-red-500/80 hover:bg-[#2d1818] text-white"
                      : "bg-[#161618] hover:bg-[#1f1f23] border-[#2d2d32] hover:border-red-650/40 text-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-widest leading-none ${
                      isActive ? "text-red-400 font-extrabold" : "text-red-500"
                    }`}>
                      {starter.vibe}
                    </span>
                    <ChevronRight className={`w-3 h-3 transition ${
                      isActive ? "text-red-400 translate-x-0.5" : "text-gray-500 group-hover:text-red-500 group-hover:translate-x-0.5"
                    }`} />
                  </div>
                  <span className={`font-semibold leading-snug mt-1 transition duration-150 ${
                    isActive ? "text-red-400 font-bold" : "text-white group-hover:text-red-400"
                  }`}>
                    {starter.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="mt-6 flex items-center justify-center gap-2 p-2 w-full text-xs font-mono font-semibold text-gray-400 hover:text-white bg-[#1a1a1d] hover:bg-red-950/20 hover:text-red-400 border border-[#2d2d32] hover:border-red-900/40 rounded-lg transition"
        >
          <Trash2 className="w-3.5 h-3.5" /> Reset Chat Logs
        </button>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-[#111113] border border-[#222225] rounded-xl flex flex-col justify-between overflow-hidden lg:col-span-3 h-full relative">
        
        {/* Floating Success Toaster */}
        {successMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-950/95 border border-emerald-800/80 px-4.5 py-2.5 rounded-xl flex items-center gap-2 text-[11px] font-semibold text-emerald-400 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 z-50 whitespace-nowrap">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[calc(100vh-270px)] min-h-[300px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-4xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Avatar Icon */}
              <div className={`p-2 rounded-lg shrink-0 h-9 w-9 flex items-center justify-center ${
                msg.role === "user" ? "bg-red-600/10 border border-red-500/25 text-red-400" : "bg-emerald-600/10 border border-emerald-500/25 text-emerald-400"
              }`}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Payload */}
              <div className={`p-4 rounded-xl border relative group ${
                msg.role === "user" 
                  ? "bg-[#1d1616] border-[#381e1e] text-white" 
                  : "bg-[#121215] border-[#222226] text-gray-200"
              }`}>
                {/* Copy Button (only for model responses) */}
                {msg.role === "model" && (
                  <button
                    onClick={() => copyTextToClipboard(msg.content, msg.id)}
                    className="absolute right-3 top-3 p-1 rounded bg-[#1e1e21] border border-[#2d2d30] text-gray-400 hover:text-white transition opacity-0 group-hover:opacity-100 duration-150 animate-in fade-in cursor-pointer"
                    title="Copy response"
                  >
                    {copiedIndex === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Clipboard className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {/* Body Content Markdown */}
                <div className="markdown-body font-sans text-xs leading-relaxed space-y-2">
                  <ReactMarkdown
                    components={{
                      code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return match ? (
                          <pre className="overflow-x-auto bg-[#18181b] border border-[#2a2a2e] p-3 rounded-lg my-2 font-mono text-[11px] text-green-400 select-all">
                            <code {...props}>{String(children).replace(/\n$/, "")}</code>
                          </pre>
                        ) : (
                          <code className="bg-[#1c1c1f] px-1.5 py-0.5 rounded font-mono text-[10px] text-red-400 border border-[#2d2d32]" {...props}>
                            {children}
                          </code>
                        );
                      },
                      ul({ children }) {
                        return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>;
                      },
                      ol({ children }) {
                        return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>;
                      },
                      li({ children }) {
                        return <li className="leading-relaxed">{children}</li>;
                      },
                      p({ children }) {
                        return <p className="mb-2 last:mb-0 text-gray-300 leading-relaxed">{children}</p>;
                      },
                      h4({ children }) {
                        return <h4 className="font-bold text-white text-xs mt-3 mb-1">{children}</h4>;
                      },
                      hr() {
                        return <hr className="border-[#222225] my-4" />;
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                <span className="block text-[9px] font-mono text-gray-500 text-right mt-2 select-none">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="p-2 bg-emerald-600/10 border border-emerald-500/25 text-emerald-400 rounded-lg animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-xl border bg-[#121215] border-[#222226] text-gray-400 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-emerald-500" />
                Coach is referencing metrics & generating viral strategy formats...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Template Actions HUD */}
        {selectedStarter && (
          <div className="mx-4 p-3 bg-[#151518] border border-[#2b2b30] border-b-0 rounded-t-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono font-extrabold bg-[#311c1c] text-red-400 border border-red-900/60 px-2 py-0.5 rounded uppercase select-none tracking-widest leading-none">
                {selectedStarter.vibe}
              </span>
              <span className="text-xs font-semibold text-white line-clamp-1 leading-none">
                Preset "{selectedStarter.label}" loaded
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Copy prompt button */}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(input);
                  setSuccessMsg("Copied template text to clipboard!");
                  setTimeout(() => setSuccessMsg(null), 2000);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-[#1f1f23] hover:bg-[#28282d] border border-[#303036] text-[11px] font-semibold text-gray-200 px-2.5 py-1.5 rounded-lg transition hover:text-white cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5 text-amber-500" /> Copy Theme
              </button>

              {/* Focus/Edit button */}
              <button
                type="button"
                onClick={() => {
                  textareaRef.current?.focus();
                  setSuccessMsg("Refine your custom prompt in the input box below!");
                  setTimeout(() => setSuccessMsg(null), 2500);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-[#1f1f23] hover:bg-[#28282d] border border-[#303036] text-[11px] font-semibold text-gray-200 px-2.5 py-1.5 rounded-lg transition hover:text-white cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-blue-400 rotate-12" /> Edit Box
              </button>

              {/* Send Instantly */}
              <button
                type="button"
                onClick={() => {
                  handleSendPrompt(input);
                  setSelectedStarter(null);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 border border-transparent hover:border-red-400 text-[11px] font-bold text-white px-3 py-1.5 rounded-lg transition cursor-pointer hover:scale-105"
              >
                <Send className="w-3.5 h-3.5 text-white" /> Send Now
              </button>

              {/* Clear button */}
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  setSelectedStarter(null);
                }}
                className="flex items-center justify-center bg-transparent hover:bg-[#1f1f23] text-gray-500 hover:text-white p-1 rounded-lg transition cursor-pointer"
                title="Clear loaded template"
              >
                <Trash2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Text Input Draft Area */}
        <div className="p-4 border-t border-[#222225] bg-[#161619]/50 flex items-center gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt(input);
                setSelectedStarter(null);
              }
            }}
            placeholder={loading ? "Coach is thinking..." : "Ask your YouTube strategist... (Shift + Enter for new lines)"}
            className="flex-1 bg-[#161618] border border-[#2d2d32] focus:border-red-650 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition resize-none h-11 max-h-24 font-sans leading-relaxed"
            disabled={loading}
          />
          <button
            onClick={() => {
              handleSendPrompt(input);
              setSelectedStarter(null);
            }}
            disabled={!input.trim() || loading}
            className="p-3 bg-red-600 hover:bg-red-500 disabled:bg-[#1a1a1d] disabled:border-[#2d2d32] disabled:text-gray-600 text-white rounded-lg transition-all duration-200 h-11 w-11 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:shadow-[0_0_20px_rgba(239,68,68,0.45)] border border-transparent disabled:border hover:scale-105 disabled:hover:scale-100 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
