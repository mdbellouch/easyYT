import React, { useState, useEffect } from "react";
import { Key, Video, HelpCircle, CheckCircle, AlertTriangle, RefreshCw, KeyRound, Plus, Trash2, Tv, Brain, Globe, Cpu, Eye, EyeOff, Sparkles } from "lucide-react";
import { apiFetch } from "../utils/api";

interface SavedChannelProfile {
  id: string;
  title?: string;
}

interface CredentialsPanelProps {
  apiKey: string;
  savedLiveChannels: SavedChannelProfile[];
  activeChannelId: string;
  onSave: (apiKey: string, savedLiveChannels: SavedChannelProfile[], activeChannelValue: string) => void;
}

export default function CredentialsPanel({
  apiKey,
  savedLiveChannels,
  activeChannelId,
  onSave,
}: CredentialsPanelProps) {
  const [localKey, setLocalKey] = useState(apiKey);

  // Custom LLM / AI Configuration State
  const [provider, setProvider] = useState<string>(() => localStorage.getItem("yt_llm_provider") || "default");
  const [llmKey, setLlmKey] = useState<string>(() => localStorage.getItem("yt_llm_key") || "");
  const [llmModel, setLlmModel] = useState<string>(() => {
    const saved = localStorage.getItem("yt_llm_model");
    if (saved === "google/gemini-2.5-flash:free") {
      return "google/gemini-2.5-flash";
    }
    return saved || "gemini-3.5-flash";
  });
  const [llmBaseUrl, setLlmBaseUrl] = useState<string>(() => localStorage.getItem("yt_llm_base_url") || "");
  const [showLlmKey, setShowLlmKey] = useState<boolean>(false);

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    if (newProvider === "default") {
      setLlmBaseUrl("");
      setLlmModel("gemini-3.5-flash");
    } else if (newProvider === "gemini-key") {
      setLlmBaseUrl("");
      setLlmModel("gemini-2.5-flash");
    } else if (newProvider === "openrouter") {
      setLlmBaseUrl("https://openrouter.ai/api/v1");
      setLlmModel("google/gemini-2.5-flash");
    } else if (newProvider === "custom") {
      setLlmBaseUrl("");
      setLlmModel("");
    }
  };
  const [channels, setChannels] = useState<SavedChannelProfile[]>(savedLiveChannels);
  const [newChannelId, setNewChannelId] = useState("");
  const [activeId, setActiveId] = useState(activeChannelId);

  const [serverHealth, setServerHealth] = useState<{
    ok: boolean;
    hasGeminiKey: boolean;
    checking: boolean;
  }>({ ok: false, hasGeminiKey: false, checking: true });

  const checkHealth = async () => {
    setServerHealth((prev) => ({ ...prev, checking: true }));
    try {
      const response = await apiFetch("/api/health");
      if (response.ok) {
        const data = await response.json();
        setServerHealth({
          ok: true,
          hasGeminiKey: data.hasGeminiKey,
          checking: false,
        });
      } else {
        setServerHealth({ ok: false, hasGeminiKey: false, checking: false });
      }
    } catch {
      setServerHealth({ ok: false, hasGeminiKey: false, checking: false });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleAddChannel = () => {
    const trimmed = newChannelId.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("UC")) {
      alert("YouTube channel IDs must begin with standard prefix 'UC'. Please verify.");
      return;
    }
    if (channels.some((c) => c.id === trimmed)) {
      alert("This channel is already registered.");
      return;
    }
    const updated = [...channels, { id: trimmed, title: "Pending activation: " + trimmed.substring(2, 6) }];
    setChannels(updated);
    setActiveId(trimmed);
    setNewChannelId("");
  };

  const handleDeleteChannel = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = channels.filter((c) => c.id !== idToDelete);
    setChannels(updated);
    if (activeId === idToDelete) {
      if (updated.length > 0) {
        setActiveId(updated[0].id);
      } else {
        setActiveId("");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (provider !== "default") {
      localStorage.setItem("yt_llm_provider", provider);
      localStorage.setItem("yt_llm_key", llmKey.trim());
      localStorage.setItem("yt_llm_model", llmModel.trim());
      localStorage.setItem("yt_llm_base_url", llmBaseUrl.trim());
    } else {
      localStorage.removeItem("yt_llm_provider");
      localStorage.removeItem("yt_llm_key");
      localStorage.removeItem("yt_llm_model");
      localStorage.removeItem("yt_llm_base_url");
    }
    onSave(localKey.trim(), channels, activeId);
  };

  return (
    <div id="credentials-panel" className="bg-[#111113] border border-[#222225] rounded-xl p-6 glow-red space-y-6">
      
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-sans font-semibold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-red-500" /> System Credentials & Multi-Channel Manager
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">
            Register multiple YouTube Channels and toggle between them seamlessly.
          </p>
        </div>
        <button
          type="button"
          onClick={checkHealth}
          className="p-1 px-3 text-xs font-mono text-gray-300 hover:text-white bg-[#1a1a1d] hover:bg-[#222225] border border-[#2d2d32] hover:border-red-500/40 rounded-md transition duration-200 flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.05)] hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${serverHealth.checking ? "animate-spin text-red-500" : ""}`} />
          {serverHealth.checking ? "Checking..." : "Verify System"}
        </button>
      </div>

      {/* Backend Statuses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg border ${serverHealth.ok ? "bg-[#14231b]/30 border-green-900/40 text-green-200" : "bg-[#2d1919]/30 border-red-900/40 text-red-200"} flex items-start gap-3`}>
          {serverHealth.ok ? (
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="text-sm font-semibold text-white">Express Backend Service</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              {serverHealth.ok 
                ? "Active on port 3000. Express is caching API proxies and static routing correctly." 
                : "Failed to establish handshake. Verify standard connection on development container."}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${serverHealth.hasGeminiKey ? "bg-[#14231b]/30 border-green-900/40 text-green-200" : "bg-[#2d1e14]/30 border-amber-900/40 text-amber-200"} flex items-start gap-3`}>
          {serverHealth.hasGeminiKey ? (
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="text-sm font-semibold text-white">Gemini 3.5 Flash Coach</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              {serverHealth.hasGeminiKey 
                ? "Active. Google Generative AI key detected in standard server-side environment secrets." 
                : "Missing server-side GEMINI_API_KEY. Configure key via 'Secrets' panel in standard AI Studio UI to enable organic AI strategic tools."}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Global Live Credentials Parameters */}
        <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-mono font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-red-500" /> YouTube API v3 Token
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                className="w-full bg-[#161618] border border-[#2d2d32] focus:border-red-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition font-mono"
              />
              <p className="text-[10px] text-gray-500 mt-1 flex items-start gap-1">
                <HelpCircle className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                This shared developer credential is used to verify permissions and execute proxy fetches for all live channels below.
              </p>
            </div>

            {/* Channels List Manager */}
            <div className="border-t border-[#1e1e21] pt-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Your Registered YouTube Channels</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">Add channels using their unique channel ID (e.g. UCxxXXxxXXxx).</p>
              </div>

              {/* Add New Channel form */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Video className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Enter YouTube Channel ID (starts with UC...)"
                    value={newChannelId}
                    onChange={(e) => setNewChannelId(e.target.value)}
                    className="w-full bg-[#161618] border border-[#2d2d32] focus:border-red-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none transition font-sans"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddChannel}
                  className="px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-all duration-200 flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:shadow-[0_0_20px_rgba(239,68,68,0.35)] hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4" /> Add Channel
                </button>
              </div>

              {/* Channels Grid display */}
              {channels.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[#161619] border border-[#232326] text-gray-500 text-xs">
                  No live channels added yet. Write a channel ID above to register your first channel profile.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {channels.map((ch) => {
                    const isActive = activeId === ch.id;
                    return (
                      <div
                        key={ch.id}
                        onClick={() => setActiveId(ch.id)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex justify-between items-center ${
                          isActive 
                            ? "bg-[#181111] border-red-950 text-white shadow" 
                            : "bg-[#141416] border-[#222225] hover:border-[#2d2d32] text-gray-300"
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${isActive ? "bg-red-500/10 text-red-500 border border-red-500/25" : "bg-gray-800/10 text-gray-400 border border-gray-800"}`}>
                            <Tv className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block font-semibold text-xs truncate">
                              {ch.title || "Custom Channel"}
                            </span>
                            <span className="block text-[10px] font-mono text-gray-500 truncate mt-0.5">
                              {ch.id}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isActive && (
                            <span className="text-[9px] font-mono font-bold bg-green-950 border border-green-900/50 text-green-400 px-2 py-0.5 rounded uppercase">
                              Active Focus
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteChannel(ch.id, e)}
                            className="p-1.5 rounded-lg bg-[#222225] hover:bg-red-950/20 text-gray-400 hover:text-red-400 border border-[#2d2d32] hover:border-red-900/40 transition shrink-0"
                            title="Unregister channel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        {/* Custom AI Config Section */}
        <div className="border-t border-[#1e1e21] pt-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-red-500" /> AI Coach & Language Model Configuration
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Override standard backend credentials. Paste any custom Google Gemini key, OpenRouter token, or custom API endpoints.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: "default", name: "Server Standard", desc: "Environment key", icon: Cpu },
              { id: "gemini-key", name: "Direct Gemini Key", desc: "gemini-2.5-flash", icon: Sparkles },
              { id: "openrouter", name: "OpenRouter Platform", desc: "google/gemini", icon: Globe },
              { id: "custom", name: "Custom Endpoint", desc: "OpenAI-compatible", icon: KeyRound },
            ].map((p) => {
              const Icon = p.icon;
              const isSelected = provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderChange(p.id)}
                  className={`p-3 text-left rounded-xl border transition flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#181111] border-red-900/60 text-white shadow-[0_0_12px_rgba(239,68,68,0.1)]"
                      : "bg-[#141416] border-[#222225] hover:border-[#2d2d32] text-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-red-500" : "text-gray-500"}`} />
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="block text-xs font-semibold">{p.name}</span>
                    <span className="block text-[9px] font-mono text-gray-500 mt-0.5">{p.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {provider === "default" ? (
            <div className="p-4 rounded-lg bg-[#141416]/50 border border-[#222225] text-xs text-gray-400 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <div>
                <span className="block font-semibold text-gray-300">Default AI Model Connection Active</span>
                <span className="block mt-0.5">Using standard, server-side system credentials. Model processes run efficiently on <strong>Gemini 3.5 Flash</strong> proxy configurations.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-5 bg-[#141416]/50 border border-[#222225] rounded-xl">
              
              {/* API KEY */}
              <div>
                <label className="block text-xs font-mono font-semibold text-gray-400 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-red-500" /> Custom API Token / Secret
                  </span>
                  <span className="text-[10px] text-gray-500">Securely stored inside browser state</span>
                </label>
                <div className="relative">
                  <input
                    type={showLlmKey ? "text" : "password"}
                    placeholder={
                      provider === "openrouter" 
                        ? "sk-or-v1-..." 
                        : provider === "gemini-key" 
                        ? "AIzaSy..." 
                        : "Enter custom endpoint API key..."
                    }
                    value={llmKey}
                    onChange={(e) => setLlmKey(e.target.value)}
                    className="w-full bg-[#111113] border border-[#2d2d32] focus:border-red-600 rounded-lg pl-3 pr-10 py-2 text-sm text-white focus:outline-none transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLlmKey(!showLlmKey)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition"
                  >
                    {showLlmKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* BASE URL (only for openrouter & custom) */}
              {(provider === "openrouter" || provider === "custom") && (
                <div>
                  <label className="block text-xs font-mono font-semibold text-gray-400 mb-1.5">
                    API Endpoint / Base URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://openrouter.ai/api/v1"
                    value={llmBaseUrl}
                    onChange={(e) => setLlmBaseUrl(e.target.value)}
                    className="w-full bg-[#111113] border border-[#2d2d32] focus:border-red-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition font-sans"
                  />
                </div>
              )}

              {/* MODEL IDENTIFIER & SUGGESTION PILLS */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-mono font-semibold text-gray-400">
                    Model Identifier ID
                  </label>
                  <span className="text-[10px] text-gray-500 font-mono">Case-sensitive</span>
                </div>
                 <input
                  type="text"
                  placeholder={
                    provider === "openrouter" 
                      ? "google/gemini-2.5-flash" 
                      : provider === "gemini-key" 
                      ? "gemini-2.5-flash" 
                      : "gpt-4o-mini"
                  }
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  className="w-full bg-[#111113] border border-[#2d2d32] focus:border-red-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition font-mono"
                />

                {/* Pill Suggestions */}
                <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-mono text-gray-500 mr-1">Quick Select:</span>
                  {(provider === "gemini-key" 
                    ? ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-pro"]
                    : provider === "openrouter"
                    ? ["google/gemini-2.5-flash", "google/gemini-2.5-pro", "deepseek/deepseek-chat"]
                    : ["meta-llama/llama-3-8b-instruct", "google/gemini-2.5-flash"]
                  ).map((m) => {
                    const isActive = llmModel === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setLlmModel(m)}
                        className={`px-2 py-0.5 text-[9px] font-mono font-semibold rounded-md border transition ${
                          isActive
                            ? "bg-red-950/30 border-red-900/50 text-red-400"
                            : "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46] text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Global Save Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1d]">
          <p className="text-[10px] text-gray-500 max-w-xl font-sans leading-relaxed">
            🔒 <strong>Authentication Sandbox:</strong> Channels and credentials are cached locally in security partitions of your container storage. They are never sent/shared outside this sandboxed sandbox.
          </p>
          <button
            type="submit"
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:shadow-[0_0_25px_rgba(239,68,68,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shrink-0"
          >
            Apply Active Profiles
          </button>
        </div>

      </form>

    </div>
  );
}
