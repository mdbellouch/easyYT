import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables if needed
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Request-scoped JSON interceptor for passing custom API error details to fallback responses
app.use((req: any, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    if (body && typeof body === "object" && body.isFallback && req.activeLLMError) {
      body.errorDetails = req.activeLLMError;
    }
    return originalJson.call(this, body);
  };
  next();
});

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = geminiApiKey 
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    })
  : null;

function hasLLM(req: express.Request): boolean {
  const customProvider = req.headers["x-provider"];
  const customKey = req.headers["x-api-key"];
  const isCustomActive = !!(customProvider && customKey);
  return !!ai || isCustomActive;
}

function isDemoMode(req: express.Request): boolean {
  const headerDemo = req.headers["x-demo-mode"];
  if (headerDemo === "true") return true;
  if (headerDemo === "false") return false;

  if (req.body && req.body.isDemo === true) return true;
  return false;
}

function cleanErrorMessage(error: any): string {
  const rawMsg = error?.message || String(error || "");
  if (!rawMsg) return "Unknown Connection Error";
  
  // Try to find and parse any JSON candidate string anywhere in the error message
  const firstBrace = rawMsg.indexOf("{");
  const lastBrace = rawMsg.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const jsonCandidate = rawMsg.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonCandidate);
      if (parsed.error) {
        if (typeof parsed.error === "object") {
          return parsed.error.message || parsed.error.code || parsed.error.status || rawMsg;
        }
        return String(parsed.error);
      }
      if (parsed.message) {
        return String(parsed.message);
      }
    } catch (e) {
      // If parsing fails, fall through to default checks
    }
  }

  let msg = rawMsg;
  if (msg.includes("HTTP Error:")) {
    const fb = msg.indexOf("{");
    if (fb !== -1) {
      try {
        const innerJson = JSON.parse(msg.substring(fb));
        if (innerJson?.error?.message) {
          return `${msg.substring(0, fb)} ${innerJson.error.message}`;
        }
      } catch (e) {}
    }
  }

  return msg;
}

async function runLLMRequest(
  req: express.Request,
  options: {
    contents: any;
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
    responseSchema?: any;
  }
): Promise<{ text: string }> {
  try {
    const provider = req.headers["x-provider"] as string; // 'gemini-key' or 'openrouter' or 'custom'
    const apiKey = req.headers["x-api-key"] as string;
    let model = req.headers["x-model"] as string;
    if (model && model.endsWith(":free")) {
      model = model.substring(0, model.length - 5);
    }
    const baseUrl = req.headers["x-base-url"] as string;

    if (provider === "openrouter" || provider === "custom" || (provider === "gemini-key" && baseUrl)) {
      try {
        const finalApiKey = apiKey || (provider === "openrouter" ? process.env.OPENROUTER_API_KEY : "");
        if (!finalApiKey) {
          throw new Error(`API key is required for ${provider} provider.`);
        }

        const finalBaseUrl = baseUrl || (provider === "openrouter" ? "https://openrouter.ai/api/v1" : "");
        const finalModel = model || (provider === "openrouter" ? "google/gemini-2.5-flash" : "gemini-3.5-flash");

        // Convert contents to OpenAI messages format
        let messages: any[] = [];
        if (options.systemInstruction) {
          messages.push({ role: "system", content: options.systemInstruction });
        }

        if (typeof options.contents === "string") {
          messages.push({ role: "user", content: options.contents });
        } else if (Array.isArray(options.contents)) {
          options.contents.forEach((item: any) => {
            const role = item.role === "model" ? "assistant" : "user";
            const content = item.parts && item.parts[0] ? item.parts[0].text : "";
            messages.push({ role, content });
          });
        }

        const payload: any = {
          model: finalModel,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: 2000, // Safe default to avoid credit limit 402 checks on OpenRouter
        };

        if (options.responseMimeType === "application/json") {
          payload.response_format = { type: "json_object" };
        }

        const res = await fetch(`${finalBaseUrl.replace(/\/+$/, "")}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${finalApiKey}`,
            "HTTP-Referer": "https://ai.studio/build",
            "X-Title": "CreatorForge AI Coach",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Alternate Provider [${provider}] HTTP Error: ${res.status} - ${errText}`);
        }

        const json = await res.json();
        const text = json.choices?.[0]?.message?.content || "";
        return { text };
      } catch (fallbackErr: any) {
        console.warn(`Custom provider [${provider}] warning: ${cleanErrorMessage(fallbackErr)}. Trying standard server-side Gemini fallback...`);
        if (ai) {
          try {
            const response = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: options.contents,
              config: {
                systemInstruction: options.systemInstruction,
                temperature: options.temperature,
                responseMimeType: options.responseMimeType as any,
                responseSchema: options.responseSchema,
              }
            });
            return { text: response.text || "" };
          } catch (standardGeminiErr: any) {
            console.error("Standard Gemini fallback notice:", cleanErrorMessage(standardGeminiErr));
            throw fallbackErr;
          }
        } else {
          throw fallbackErr;
        }
      }
    }

    if (provider === "gemini-key" && apiKey) {
      try {
        const customAi = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build-custom-key',
            }
          }
        });

        const response = await customAi.models.generateContent({
          model: model || "gemini-3.5-flash",
          contents: options.contents,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature,
            responseMimeType: options.responseMimeType as any,
            responseSchema: options.responseSchema,
          }
        });

        return { text: response.text || "" };
      } catch (fallbackErr: any) {
        console.warn(`Custom Gemini Key notice: ${cleanErrorMessage(fallbackErr)}. Trying standard server-side Gemini fallback...`);
        if (ai) {
          try {
            const response = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: options.contents,
              config: {
                systemInstruction: options.systemInstruction,
                temperature: options.temperature,
                responseMimeType: options.responseMimeType as any,
                responseSchema: options.responseSchema,
              }
            });
            return { text: response.text || "" };
          } catch (standardGeminiErr: any) {
            console.error("Standard Gemini fallback notice:", cleanErrorMessage(standardGeminiErr));
            throw fallbackErr;
          }
        } else {
          throw fallbackErr;
        }
      }
    }

    if (!ai) {
      throw new Error("Standard server-side API Key (GEMINI_API_KEY) not found, and no custom Provider was selected.");
    }

    const response = await ai.models.generateContent({
      model: model || "gemini-3.5-flash",
      contents: options.contents,
      config: {
        systemInstruction: options.systemInstruction,
        temperature: options.temperature,
        responseMimeType: options.responseMimeType as any,
        responseSchema: options.responseSchema,
      }
    });

    return { text: response.text || "" };
  } catch (error: any) {
    (req as any).activeLLMError = cleanErrorMessage(error);
    throw error;
  }
}

// Helper: Detect if an error is due to a Gemini API key, Quota, or Service Availability issue
function isGeminiException(error: any): boolean {
  // To ensure 100% robust/graceful uptime, any exceptions during Gemini LLM processing
  // (quota, key omission, network drops, rate limit 429 errors) will systematically
  // trigger our ultra-rich local heuristics offline engine seamlessly.
  return true;
}

// Unified, clean logger that replaces heavy JSON streams with friendly single-line notices
function logGeminiException(context: string, error: any) {
  const errMsg = String((error && error.message) || error || "");
  let simplifiedReason = "Core Platform Constraint";
  if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429") || errMsg.includes("quota")) {
    simplifiedReason = "Free Sandbox Daily Quota Exceeded (429 Rate Limit)";
  } else if (errMsg.includes("key") || errMsg.includes("credentials") || errMsg.includes("API_KEY")) {
    simplifiedReason = "API Key Not Found / Setup Required";
  } else if (errMsg.length > 0) {
    simplifiedReason = errMsg.length > 110 ? errMsg.substring(0, 105) + "..." : errMsg;
  }
  console.log(`[Gemini Active Recovery] ${context} - Seamless offline rules engine engaged. (Reason: ${simplifiedReason})`);
}

// Local Fallback: YouTube Growth Coach Dialogues
function getLocalCoachReply(messages: any[], context: any) {
  const lastUserMessage = messages && messages.length > 0 
    ? messages[messages.length - 1].content.toLowerCase() 
    : "";
  
  if (lastUserMessage.includes("hello") || lastUserMessage.includes("hi") || lastUserMessage.includes("hey")) {
    return `**Hey there! 👋 I'm your GrowthCoach AI YouTube Strategist.** 

Even though my remote high-fidelity brainstorm servers are resting right now (quota/connection limits), my offline tactical growth brain is fully active! 

How can I help you dominate the algorithm today? We can:
- **Analyze your title's CTR potential** in the title analyzer tab.
- **Generate 30+ highly-indexed SEO tags** in the SEO generator tab.
- Brainstorm thumbnail design patterns (visual rule of thirds).

What's on your mind? Tell me about your next upload!`;
  } else if (lastUserMessage.includes("title") || lastUserMessage.includes("name") || lastUserMessage.includes("click")) {
    return `**Let's talk YouTube Video Titles! 📈**

The title is the bridge between search impression and actual viewer capture. When you write titles, use my **Three Commandments of High CTR**:

1. **Keep it under 55 Characters:** This avoids mobile feed truncation.
2. **Front-load the Focus Phrase:** Always place your highest-search-volume keyword in the first 3-4 words (e.g., *'Sourdough Bread Recipe: Say Goodbye to Sinking'* is much better than *'My Grandma's Sinking Sourdough Bread recipe'*).
3. **Double Down on the Curiosity Gap:** Frame a question, target a common friction point (e.g. *'Don't do [x]'*), or offer extreme contrast.

*Pro tip: Head over to my **Title Analyzer & Optimizer** tab right now for a complete score breakdown and alternative titles!*`;
  } else if (lastUserMessage.includes("keyword") || lastUserMessage.includes("tag") || lastUserMessage.includes("search") || lastUserMessage.includes("seo")) {
    return `**Optimization is key! Let's talk SEO Tag & Keyword Strategy. 🚀**

YouTube uses tags and description keywords to place your video in initial index categories, and then relies on CTR to rank it. To maximize search discoverability:

- **Primary Search Tags:** Include exact-match phrases of your title in your first 3 tags.
- **Long-tail Variations:** Add secondary search questions (e.g. *'how to solve x'*, *'x for beginners'*) to steal traffic from larger channels.
- **Description Placement:** Write a conversational 2-sentence description body that naturally weaves in your main focus keywords.

*Pro tip: Try my **SEO Tag Generator** tab above to instantly get 30+ meticulously scored keywords, copyable delimiters, and downloadable CSV maps!*`;
  } else if (lastUserMessage.includes("thumbnail") || lastUserMessage.includes("visual") || lastUserMessage.includes("image")) {
    return `**Thumbnails are 60% of the Click-Through decision! 🎨**

To draft thumbnails that stop the scroll:

1. **Follow the Rule of Thirds:** Place human faces or the focal item in the left or right third, looking slightly inward.
2. **Limit Text to Under 4 Words:** Do NOT repeat the title of your video. Use supplementary context that raises a question (e.g. Title says *'How I Built a SaaS'*, Thumbnail says *'$10,000 in 1 Day?'*).
3. **Use Extreme Color Contrast:** Ensure elements have dark silhouettes, bright strokes, or high saturation ratios.

Is there a specific thumbnail scene or visual pattern you are brainstorming? Let's sketch it!`;
  } else if (lastUserMessage.includes("views") || lastUserMessage.includes("sub") || lastUserMessage.includes("grow") || lastUserMessage.includes("algorithm")) {
    return `**To scale your channel and unlock algorithmic velocity, focus on the two main levers: CTR & Retention.**

1. **CTR (Click-Through-Rate):** Your Thumbnail + Title tells a story. If your CTR is below 4%, revise your title to generate greater urgency, or swap your thumbnail for a clean high-contrast visual.
2. **Viewer Retention (AVD):** The first 30 seconds are critical! Do not drag out introductions or play channel logos. Deliver on your thumbnail promise immediately (the 'instant payoff' pattern).

Tell me more about your recent upload analytics! What is your average click-through-rate percentage right now?`;
  } else {
    return `**YouTube algorithm strategy mode is active! 🚀**

To maximize your organic reach, I highly recommend using the optimization tabs above:

- **SEO Tag & Keyword Generator:** Generate 30+ highly-indexed tags and download CSV maps.
- **Title Analyzer & Optimizer:** Get real-time SEO quality scores and CTR suggestions.

If you have other growth topics—like script hooks, audience demographics, viewer retention drops, or competitor analysis—describe them here and let's map out a winning framework!`;
  }
}

// Local Fallback: Programmatic Title Analyzer
function getLocalTitleAnalysis(title: string, descriptionKeywords: string = "") {
  const cleanTitle = title.trim();
  const len = cleanTitle.length;
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Length rules
  if (len <= 60 && len >= 30) {
    strengths.push("Excellent length (30-60 characters) ensuring maximum mobile feed visibility without trailing truncations.");
  } else if (len > 60) {
    weaknesses.push("With " + len + " characters, this title will likely get truncated (...) on mobile viewports. Try trimming it down to <55 characters.");
  } else {
    weaknesses.push("Slightly short title (" + len + " characters). It might not have enough space to index high-search-volume tags and secondary keywords.");
  }
  
  const hasNumbers = /\d+/.test(cleanTitle);
  const hasBrackets = /[\[\]\(\)]/.test(cleanTitle);
  
  if (hasNumbers) {
    strengths.push("Uses hard numbers or statistics, which significantly raises click velocity by promising specific value.");
  } else {
    weaknesses.push("Lacks numeric anchors. Integrating a specific stat, time limits (e.g. '45 Mins'), or lists increases average CTR.");
  }
  
  if (hasBrackets) {
    strengths.push("Uses bracket parentheses configurations, which creates strong cognitive focal points in busy browsing feeds.");
  } else {
    weaknesses.push("Consider framing secondary context using bracket hooks — e.g. [Step-by-Step] or (Foolproof).");
  }

  const emotionalTriggers = ["insane", "secret", "shocking", "reveal", "hack", "worst", "best", "stop", "fail", "wrong", "guarantee", "proof", "foolproof", "unbelievable", "crazy", "unreal"];
  const hasEmotionalTrigger = emotionalTriggers.some(trigger => cleanTitle.toLowerCase().includes(trigger));
  
  if (hasEmotionalTrigger) {
    strengths.push("Leverages powerful emotional triggers or friction modifiers to generate instant Curiosity Gaps.");
  } else {
    weaknesses.push("Title feels a bit academic or passive. Adding trigger verbs or stakes (e.g., 'Stop doing', 'Secret to') improves impressions-to-views ratio.");
  }
  
  if (strengths.length === 0) {
    strengths.push("Contains readable and clear phrasing outlining the video's core theme.");
  }
  
  // Calculate a realistic score
  let score = 75;
  score += strengths.length * 6;
  score -= weaknesses.length * 5;
  score = Math.max(45, Math.min(98, score));
  
  // Suggestions compilation
  const suggestions = [
    {
      suggestedTitle: `${cleanTitle} (Step-by-Step Tutorial) 🚀`,
      ctrAngle: "Provides clear, immediate instruction format, triggering high-intent search click-throughs.",
      vibe: "Ultimate How-To / Masterclass"
    },
    {
      suggestedTitle: `Stop Doing ${cleanTitle} the Wrong Way! (Do This Instead)`,
      ctrAngle: "Activates psychological loss aversion (FOMO) and friction triggers.",
      vibe: "Polarizing Friction"
    },
    {
      suggestedTitle: `I Tried ${cleanTitle} for 7 Days. (INSANE Results)`,
      ctrAngle: "Leverages storytelling and challenge constraints to hook passive scroll feeds.",
      vibe: "Curiosity Case Study"
    }
  ];
  
  return {
    score,
    feedback: `Offline optimization engine response. Your original title "${cleanTitle}" has some solid elements, but can still be tuned. For maximum index performance, target 40-55 characters and lead with your highest search-volume key phrase.`,
    strengths,
    weaknesses,
    suggestions
  };
}

// Local Fallback: Programmatic SEO Title Generator
function getLocalSEOTitles(keyword: string, nicheKeywords: string = "", vibe: string = "General") {
  const kw = keyword.trim();
  const lowerKw = kw.toLowerCase();

  // Detect niche pattern
  let generatedTitles: any[] = [];
  let seoAdvice = "";

  if (lowerKw.includes("bake") || lowerKw.includes("cook") || lowerKw.includes("sourdough") || lowerKw.includes("recipe") || lowerKw.includes("kitchen") || lowerKw.includes("food") || lowerKw.includes("cake")) {
    seoAdvice = `Search volumes for culinary tutorial phrases like 'Tutorial from Scratch' and 'Easy recipe' are peaking on Saturdays. Front-loading '${kw}' yields a 42% organic lift in mobile search positioning.`;
    generatedTitles = [
      {
        title: `The Absolute Best ${kw} from Scratch (Foolproof) 🍞`,
        seoScore: 97,
        frontLoaded: true,
        demographicAngle: "Beginner home cooks seeking structured visual recipes",
        vibe: "Ultimate How-To / Guide",
        seoWeightAnalysis: `Excellent. Front-loads high-search '${kw}' phrase. Placing parenthesis at the end increases click urgency and provides mobile safety.`
      },
      {
        title: `Stop Failing ${kw}! 5 Simple Hacks You Need to Try`,
        seoScore: 89,
        frontLoaded: false,
        demographicAngle: "Frustrated amateur bakers seeking quick technical adjustments",
        vibe: "Friction & FOMO",
        seoWeightAnalysis: `Highly clickable trigger ('Stop Failing'). Front-loading is compromised, but CTR metrics will spike due to high psychological tension.`
      },
      {
        title: `I Made the Easiest ${kw} in a Dorm Room! (No Stove)`,
        seoScore: 92,
        frontLoaded: false,
        demographicAngle: "Students, busy professionals, or minimal equipment cooks",
        vibe: "Storytelling Case Study",
        seoWeightAnalysis: `Strong situational hook ('Dorm Room'). Good keyword coverage of '${kw}' and leverages extreme constraint to draw passive viewer retention.`
      }
    ];
  } else if (lowerKw.includes("game") || lowerKw.includes("gaming") || lowerKw.includes("fortnite") || lowerKw.includes("rank") || lowerKw.includes("minecraft") || lowerKw.includes("speedrun") || lowerKw.includes("twitch")) {
    seoAdvice = `Gaming search indices are currently driven by tactical tutorial modifier keywords like 'Speedrun' and Rank progress queries. Front-loading '${kw}' prevents immediate scrolling attrition.`;
    generatedTitles = [
      {
        title: `How to Hit Unreal Rank in ${kw} (No Cheating) 🏆`,
        seoScore: 96,
        frontLoaded: false,
        demographicAngle: "Ranked competitive players trying to crawl out of low-tier brackets",
        vibe: "Ultimate How-To / Guide",
        seoWeightAnalysis: `Combines target search phrase '${kw}' with rank keyword parameters. Placement triggers fear of missing out and proves authenticity.`
      },
      {
        title: `I Spent 100 Hours Speedrunning ${kw}. (Complete Pain)`,
        seoScore: 91,
        frontLoaded: false,
        demographicAngle: "Passive gaming story-listeners and speedrun enthusiasts",
        vibe: "Storytelling Case Study",
        seoWeightAnalysis: `Extreme challenge storytelling ('Spent 100 Hours') drives massive initial retention curves. High organic search volume indexing.`
      },
      {
        title: `${kw} is officially broken. (Mind-Blowing Glitches)`,
        seoScore: 95,
        frontLoaded: true,
        demographicAngle: "Sub-culture enthusiasts wanting to learn mechanical bugs or game review watchers",
        vibe: "Extreme Curiosity",
        seoWeightAnalysis: `Excellent search indexing. Front-loads '${kw}' directly and combines it with polarization ('is officially broken') to peak organic feeds.`
      }
    ];
  } else {
    seoAdvice = `In general interest and creative categories, high-retention titles emphasize simplicity, direct outcomes, and proof. Front-loading '${kw}' yields a massive organic lift in mobile recommendations.`;
    generatedTitles = [
      {
        title: `The Ultimate ${kw} Guide (Step-by-Step for Beginners) 🚀`,
        seoScore: 98,
        frontLoaded: true,
        demographicAngle: "General viewers and enthusiasts looking for structured, clear guides",
        vibe: "Ultimate How-To / Guide",
        seoWeightAnalysis: `Masterful performance. Front-loads high-search '${kw}' phrase. Placing parenthesis at the end increases click urgency and provides mobile safety.`
      },
      {
        title: `Stop Doing ${kw} This Way! (How to Fix It)`,
        seoScore: 94,
        frontLoaded: false,
        demographicAngle: "Amateurs and practitioners looking to avoid common mistakes",
        vibe: "Friction & FOMO",
        seoWeightAnalysis: `Highly clickable trigger ('Stop Doing...'). Front-loading is compromised, but CTR metrics will spike due to high psychological tension.`
      },
      {
        title: `I Tried ${kw} for 30 Days. (Here's What Happened)`,
        seoScore: 91,
        frontLoaded: false,
        demographicAngle: "Passive story-listeners and enthusiasts of self-experimentation",
        vibe: "Storytelling Case Study",
        seoWeightAnalysis: `Extreme challenge storytelling drives massive initial retention curves. High organic search volume indexing.`
      }
    ];
  }

  if (vibe !== "General") {
    seoAdvice += ` (Customized exclusively for the '${vibe}' angle).`;
  }

  return {
    focusKeyword: kw,
    seoAdvice: `Offline Optimization: ${seoAdvice}`,
    generatedTitles
  };
}

// Local Fallback: Programmatic SEO Tag / Keyword Generator
function getLocalKeywords(keyword: string) {
  const cleanKeyword = keyword.trim();
  const phrases = [
    `what is ${cleanKeyword}`,
    `${cleanKeyword} tutorial`,
    `easy ${cleanKeyword} for beginners`,
    `advanced ${cleanKeyword} masterclass`,
    `${cleanKeyword} best practices 2026`,
    `doing more with ${cleanKeyword}`,
    `${cleanKeyword} complete course`,
    `top 10 ${cleanKeyword} tricks`,
    `how to optimize ${cleanKeyword}`,
    `the secret behind ${cleanKeyword}`,
    `${cleanKeyword} vs alternative methods`,
    `is ${cleanKeyword} worth learning?`,
    `step by step ${cleanKeyword} guide`,
    `solving common ${cleanKeyword} mistakes`,
    `ultimate ${cleanKeyword} reference guide`,
    `${cleanKeyword} resource list`,
    `doing ${cleanKeyword} in public`,
    `hands-on ${cleanKeyword} examples`,
    `why you need ${cleanKeyword} now`,
    `the complete ${cleanKeyword} framework`,
    `insane ${cleanKeyword} setup hacks`,
    `applying ${cleanKeyword} in real life`,
    `customizing ${cleanKeyword} results`,
    `mastering ${cleanKeyword}`,
    `integrating ${cleanKeyword} naturally`,
    `modern ${cleanKeyword} workflow`,
    `safe and easy ${cleanKeyword}`,
    `the math of ${cleanKeyword} ranking`,
    `scale ${cleanKeyword} with high speed`,
    `${cleanKeyword} for growth`
  ];

  const trends = ["HOT", "STABLE", "SPIKED", "SATURATED", "CRAWLING"];
  const matchScopes = ["Exact", "Phrase", "Broad", "Long-tail"];
  const placements = [
    "First 3 tags of metadata",
    "Title suffix / description starter",
    "Tag feed & playlist indexing",
    "Middle description body snippet",
    "Supporting tags list only"
  ];

  const relatedKeywords = phrases.map((term, index) => {
    const estimatedVolumeScore = Math.max(15, Math.min(99, Math.round(90 - index * 2.2 - (Math.sin(index) * 12))));
    const competitionIndex = Math.max(8, Math.min(95, Math.round(20 + index * 1.8 + (Math.cos(index) * 15))));
    const relevanceScore = Math.max(40, Math.min(100, Math.round(100 - index * 1.8)));
    const opportunityScore = Math.max(10, Math.min(100, Math.round(estimatedVolumeScore - (competitionIndex * 0.35) + (relevanceScore * 0.15))));
    const estimatedCTR = parseFloat((5.5 + (estimatedVolumeScore / 15) - (competitionIndex / 20) + (Math.sin(index) * 0.8)).toFixed(1));
    const searchVelocityTrend = index === 0 ? "HOT" : trends[(index * 3) % trends.length];
    
    const rawMonthly = Math.round((estimatedVolumeScore * 1800) + (Math.sin(index) * 450));
    const estimatedMonthlySearches = rawMonthly >= 1000 ? `${(rawMonthly / 1000).toFixed(1)}K` : `${rawMonthly}`;
    const cpcEstimate = parseFloat((0.45 + (relevanceScore / 25) + (Math.cos(index) * 0.7) + (estimatedVolumeScore > 80 ? 3.5 : 0)).toFixed(2));
    
    const matchScope = index < 3 ? "Exact" : matchScopes[(index * 7) % matchScopes.length];
    const recommendedUse = placements[index % placements.length];

    return {
      term,
      estimatedVolumeScore,
      competitionIndex,
      relevanceScore,
      recommendedUse,
      opportunityScore,
      estimatedCTR,
      searchVelocityTrend,
      estimatedMonthlySearches,
      cpcEstimate,
      matchScope
    };
  });

  const overallVerdict = `Offline Index Complete. The concept word '${cleanKeyword}' registers high search volume markers. Front-loading exact matches like '${phrases[0]}' can acquire initial high CTR indexes, while lower competition long-tail variations like '${phrases[4]}' are recommended to trigger crawl indexing.`;

  return {
    seedKeyword: cleanKeyword,
    overallVerdict,
    relatedKeywords
  };
}

// API Route: Check keys health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    currentTime: new Date().toISOString()
  });
});

// API Route: YouTube Channel Proxies
app.post("/api/youtube/channel", async (req, res) => {
  try {
    const { apiKey, channelId } = req.body;
    
    const actualKey = apiKey || process.env.YOUTUBE_API_KEY;
    const actualChannel = channelId || process.env.YOUTUBE_CHANNEL_ID;

    if (!actualKey) {
      return res.status(400).json({ error: "YouTube API key is required." });
    }
    if (!actualChannel) {
      return res.status(400).json({ error: "YouTube Channel ID is required." });
    }

    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${encodeURIComponent(actualChannel)}&key=${encodeURIComponent(actualKey)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `YouTube Data API Error: ${errText}` });
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      return res.status(404).json({ error: "Channel not found with specified ID." });
    }

    res.json(data.items[0]);
  } catch (error: any) {
    console.error("YouTube Channel fetch failed:", error);
    res.status(500).json({ error: error.message || "Failed to fetch YouTube Channel data." });
  }
});

// API Route: YouTube Videos Proxies
app.post("/api/youtube/videos", async (req, res) => {
  try {
    const { apiKey, channelId, maxResults = 10 } = req.body;

    const actualKey = apiKey || process.env.YOUTUBE_API_KEY;
    const actualChannel = channelId || process.env.YOUTUBE_CHANNEL_ID;

    if (!actualKey) {
      return res.status(400).json({ error: "YouTube API key is required." });
    }
    if (!actualChannel) {
      return res.status(400).json({ error: "YouTube Channel ID is required." });
    }

    // Step 1: Search for recent videos from the channel
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(actualChannel)}&maxResults=${maxResults}&order=date&type=video&key=${encodeURIComponent(actualKey)}`;
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      const errText = await searchResponse.text();
      return res.status(searchResponse.status).json({ error: `Failed to search videos: ${errText}` });
    }

    const searchData = await searchResponse.json();
    if (!searchData.items || searchData.items.length === 0) {
      return res.json([]);
    }

    // Get all video IDs
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(",");

    // Step 2: Fetch detailed stats for these videos
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,topicDetails&id=${videoIds}&key=${encodeURIComponent(actualKey)}`;
    const videosResponse = await fetch(videosUrl);

    if (!videosResponse.ok) {
      const errText = await videosResponse.text();
      return res.status(videosResponse.status).json({ error: `Failed to fetch video statistics: ${errText}` });
    }

    const videosData = await videosResponse.json();
    res.json(videosData.items || []);
  } catch (error: any) {
    console.error("YouTube Videos fetch failed:", error);
    res.status(500).json({ error: error.message || "Failed to fetch YouTube Videos statistics." });
  }
});

// API Route: AI Coach Chat & Actions
app.post("/api/coach/chat", async (req, res) => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    if (!hasLLM(req)) {
      if (isDemoMode(req)) {
        const fallbackReply = getLocalCoachReply(messages, context);
        return res.json({ text: fallbackReply, isFallback: true });
      } else {
        return res.status(401).json({ error: "Gemini API key is required to run AI Growth Coach." });
      }
    }

    // Format chat messages
    const formattedContents = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = `You are VidIQ Coach (aka GrowthCoach), the world's most elite, data-driven YouTube growth strategist, audience retention expert, and click-through-rate (CTR) specialist. Your expertise mirrors top-tier creators like MrBeast and SEO tools like VidIQ.

Target Channel Context:
${context ? JSON.stringify(context, null, 2) : "No channel metadata provided yet."}

Keep your responses:
- Extremely practical, technical, and actionable.
- Focused on thumbnails styling, psychology, title curiosity gaps, standard SEO hooks, search trends, and viewer retention drop-off fixes.
- Direct, friendly, data-focused, structure-heavy (using bullet points, bold sections), and free of generic suggestions.
- Avoid using flowery language. Use realistic numbers, psychological hooks, and real examples.`;

    const response = await runLLMRequest(req, {
      contents: formattedContents,
      systemInstruction,
      temperature: 0.75,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    if (isGeminiException(error) && isDemoMode(req)) {
      logGeminiException("Coach Chat", error);
      const fallbackReply = getLocalCoachReply(req.body.messages, req.body.context);
      return res.json({ text: fallbackReply, isFallback: true });
    }
    console.error("Coach Chat request failed fundamentally:", error);
    res.status(500).json({ error: error.message || "Something went wrong in the AI Growth Coach." });
  }
});

// API Route: Title Analyzer (Returns structured JSON suggestions)
app.post("/api/coach/analyze-title", async (req, res) => {
  try {
    const { title, descriptionKeywords = "" } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Video title is required for analysis." });
    }

    if (!hasLLM(req)) {
      if (isDemoMode(req)) {
        const fallbackData = getLocalTitleAnalysis(title, descriptionKeywords);
        return res.json({ ...fallbackData, isFallback: true });
      } else {
        return res.status(401).json({ error: "Gemini API key is required to analyze title." });
      }
    }

    const prompt = `Analyze this YouTube video title: "${title}".
Keywords / Context: ${descriptionKeywords}

Evaluate and return the score (0 to 100), key optimization feedback, and exact high-CTR alternatives.`;

    const response = await runLLMRequest(req, {
      contents: prompt,
      systemInstruction: "You are a professional YouTube CTR Optimization engine. Analyze the title for curiosity gap, length, keyword indexing, and emotional triggers.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["score", "feedback", "strengths", "weaknesses", "suggestions"],
        properties: {
          score: { 
            type: Type.INTEGER, 
            description: "SEO and CTR quality score from 0 to 100" 
          },
          feedback: { 
            type: Type.STRING, 
            description: "Overall high-level analysis of why the title scored this way" 
          },
          strengths: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of things the title does well" 
          },
          weaknesses: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of details that harm search discoverability or CTR" 
          },
          suggestions: {
            type: Type.ARRAY,
            description: "Highly optimized click-worthy alternative titles with specific angles",
            items: {
              type: Type.OBJECT,
              required: ["suggestedTitle", "ctrAngle", "vibe"],
              properties: {
                suggestedTitle: { type: Type.STRING, description: "Actionable, improved Title" },
                ctrAngle: { type: Type.STRING, description: "Why this title will draw a higher CTR (e.g. curiosity gap, SEO, simplicity)" },
                vibe: { type: Type.STRING, description: "The psychological vibe (e.g., Fear of Missing Out, Ultimate Guide, Extreme Contrast)" }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    if (isGeminiException(error) && isDemoMode(req)) {
      logGeminiException("Title Analyzer", error);
      const fallbackData = getLocalTitleAnalysis(req.body.title, req.body.descriptionKeywords);
      return res.json({ ...fallbackData, isFallback: true, geminiLimitReached: true });
    }
    console.error("Title analysis failed fundamentally:", error);
    res.status(500).json({ error: error.message || "Failed to analyze YouTube Title." });
  }
});

// API Route: SEO Title Generation Engine
app.post("/api/coach/generate-titles-seo", async (req, res) => {
  try {
    const { keyword, nicheKeywords = "", vibe = "General", isDemo = false } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: "Focus keyword is required for generating SEO titles." });
    }

    const cleanKeyword = keyword.trim();
    const cleanNiche = nicheKeywords.trim();

    // If Demo Mode or Gemini Key is missing, run our ultra-realistic dynamic local SEO generator
    if (isDemoMode(req) || !hasLLM(req)) {
      if (!hasLLM(req) && !isDemoMode(req)) {
        return res.status(401).json({ error: "Gemini API key is required to generate SEO titles." });
      }
      const fallbackData = getLocalSEOTitles(cleanKeyword, cleanNiche, vibe);
      return res.json({ ...fallbackData, isFallback: true });
    }

    // Otherwise, perform organic high-fidelity Gemini 3.5 Title Generation
    const prompt = `Generate 3 highly optimized, click-worthy, search-discoverable YouTube video titles using the primary focus keyword: "${cleanKeyword}".
Secondary SEO Keywords to thread in: "${cleanNiche}"
Target Vibe Tone: "${vibe}"

Strict constraints:
1. Every title MUST stay strictly under 60 characters to avoid mobile feed truncation.
2. At least two variants MUST front-load the primary focus keyword "${cleanKeyword}" inside the first 3-4 words.
3. Incorporate high-retention visual hooks (numbers, parentheses, brackets, or target emotional triggers).`;

    const response = await runLLMRequest(req, {
      contents: prompt,
      systemInstruction: "You are the world's leading search optimization engineer and YouTube SEO coach. You help channels acquire organic impressions by engineering titles with front-loaded search volume keywords, crisp emotional hooks, and absolute mobile viewport truncation safety.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["focusKeyword", "seoAdvice", "generatedTitles"],
        properties: {
          focusKeyword: { type: Type.STRING },
          seoAdvice: { type: Type.STRING, description: "Detailed strategy brief on search intent alignment, keyword placements, and audience click metrics" },
          generatedTitles: {
            type: Type.ARRAY,
            description: "The 3 generated high-SEO, high-CTR titles",
            items: {
              type: Type.OBJECT,
              required: ["title", "seoScore", "frontLoaded", "demographicAngle", "vibe", "seoWeightAnalysis"],
              properties: {
                title: { type: Type.STRING, description: "The optimized title, under 60 characters" },
                seoScore: { type: Type.INTEGER, description: "SEO optimization grade from 1 to 100" },
                frontLoaded: { type: Type.BOOLEAN, description: "True if the primary focus keyword is frontloaded" },
                demographicAngle: { type: Type.STRING, description: "The specific buyer/viewer persona targeted" },
                vibe: { type: Type.STRING, description: "The emotional/psychological angle used" },
                seoWeightAnalysis: { type: Type.STRING, description: "Detailed summary of how individual elements in this title score on search search indexers" }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    if (isGeminiException(error) && isDemoMode(req)) {
      logGeminiException("SEO Title Generator", error);
      const fallbackData = getLocalSEOTitles(
        (req.body.keyword || "").trim(),
        (req.body.nicheKeywords || "").trim(),
        req.body.vibe || "General"
      );
      return res.json({ ...fallbackData, isFallback: true, geminiLimitReached: true });
    }
    console.error("SEO Title generator failed fundamentally:", error);
    res.status(500).json({ error: error.message || "Failed to generate SEO-optimized titles." });
  }
});

// API Route: SEO Tag / Keyword Generator
app.post("/api/coach/keyword-generator", async (req, res) => {
  try {
    const { keyword, isDemo = false } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: "Keyword parameter is required." });
    }

    const cleanKeyword = keyword.trim();

    // Check if in Demo mode or Gemini Key is unconfigured
    if (isDemoMode(req) || !hasLLM(req)) {
      if (!hasLLM(req) && !isDemoMode(req)) {
        return res.status(401).json({ error: "Gemini API key is required to generate keywords." });
      }
      const fallbackData = getLocalKeywords(cleanKeyword);
      return res.json({ ...fallbackData, isFallback: true });
    }

    // Live AI Search with Google Gemini 3.5 Flash Model
    const prompt = `Generate an exhaustive list of highly relevant YouTube tags, long-tail search terms, search volumes, and traffic stats matching: "${cleanKeyword}".
Produce up to 35 highly accurate metadata terms.
For each item, perform a comprehensive score mapping, including opportunity rankings, match types, Cost-Per-Click averages, and search volumes.`;

    const response = await runLLMRequest(req, {
      contents: prompt,
      systemInstruction: "You are the world's most advanced search optimization engineer and metadata engine. You help channels index on Google and YouTube search by generating a highly specific grid of search tags, scoring each element on competitiveness, CPM monetization indexes, and click percentages.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["seedKeyword", "overallVerdict", "relatedKeywords"],
        properties: {
          seedKeyword: { type: Type.STRING },
          overallVerdict: { type: Type.STRING, description: "Professional advice on whether the niche has a healthy organic search margin vs competition profile" },
          relatedKeywords: {
            type: Type.ARRAY,
            description: "Related search queries and tags with extensive analytical mappings",
            items: {
              type: Type.OBJECT,
              required: [
                "term", 
                "estimatedVolumeScore", 
                "competitionIndex", 
                "relevanceScore", 
                "recommendedUse",
                "opportunityScore",
                "estimatedCTR",
                "searchVelocityTrend",
                "estimatedMonthlySearches",
                "cpcEstimate",
                "matchScope"
              ],
              properties: {
                term: { type: Type.STRING, description: "The keyword phrase or tag" },
                estimatedVolumeScore: { type: Type.INTEGER, description: "Estimated monthly search volume scale: 1 (very low) to 100 (extreme virality)" },
                competitionIndex: { type: Type.INTEGER, description: "Competition difficulty score from 1 (easy) to 100 (over-saturated)" },
                relevanceScore: { type: Type.INTEGER, description: "How close this aligns with the seed term from 1 to 100" },
                recommendedUse: { type: Type.STRING, description: "Where to place this (e.g., First tag, Description body, Title extension)" },
                opportunityScore: { type: Type.INTEGER, description: "Opportunity balance score combining search volume vs competitiveness, from 1 to 100" },
                estimatedCTR: { type: Type.NUMBER, description: "Estimated Average click percentage if ranking in top 5, e.g. 8.4" },
                searchVelocityTrend: { type: Type.STRING, description: "One of: HOT, STABLE, SPIKED, SATURATED, CRAWLING" },
                estimatedMonthlySearches: { type: Type.STRING, description: "Human friendly monthly search query count e.g. '42.5K' or '850'" },
                cpcEstimate: { type: Type.NUMBER, description: "Estimated cost-per-click advertiser premium in USD, e.g. 2.45" },
                matchScope: { type: Type.STRING, description: "One of: Exact, Phrase, Broad, Long-tail" }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    if (isGeminiException(error) && isDemoMode(req)) {
      logGeminiException("Keyword Generator", error);
      const fallbackData = getLocalKeywords((req.body.keyword || "").trim());
      return res.json({ ...fallbackData, isFallback: true, geminiLimitReached: true });
    }
    console.error("Keyword tag generator failed fundamentally:", error);
    res.status(500).json({ error: error.message || "Failed to generate keywords." });
  }
});


// Local Fallback: Programmatic Daily Ideas Generator
function getLocalIdeas(channelTitle: string, channelDescription: string, quantity: number, angle: string, customNiche: string = "") {
  const q = Math.max(10, Math.min(60, quantity || 10));
  const normalizedTitle = (channelTitle || "").toLowerCase();
  const normalizedNiche = (customNiche || "").toLowerCase();
  
  const textToScan = `${normalizedNiche} ${normalizedTitle} ${channelDescription}`.toLowerCase();
  
  let templates: string[] = [];
  let vibeList: string[] = [];
  let category = "General";

  if (textToScan.includes("tech") || textToScan.includes("code") || textToScan.includes("coding") || textToScan.includes("software") || textToScan.includes("react") || textToScan.includes("developer") || textToScan.includes("saas") || textToScan.includes("ai")) {
    category = "Tech / Coding";
    templates = [
      "I Built a Full {topic} with {tool} in 24 Hours.",
      "Why {stack} is Officially Dead in 2026.",
      "The Unfair {tool} Hack That Replaces My Whole Team.",
      "10 Senior Developer Rules You Must Break Immediately.",
      "Stop {task} the Hard Way: 5 Mind-Blowing Tricks.",
      "I spent 100 Hours building standard {app} from scratch.",
      "How I landed a $150K remote job using a {feature} project.",
      "Rebuilding {clone} in public is insanely easy.",
      "This {stack} feature feels illegal to know.",
      "Is {type} coding actually killing the software job market?",
      "The Secret Behind {tool} integration.",
      "I Vibe-Coded a complete {app} in 45 Mins.",
      "Say Goodbye to StackOverflow errors when building {app}.",
      "The ultimate {stack} cheat-sheet for high-speed loaders.",
      "Why standard developers are failing in the AI era.",
      "How to deploy {app} with zero cost in 2026.",
      "This standard {stack} pattern is costing you thousands.",
      "The hidden cost of building {app} with {tool}.",
      "Why I quit using {stack} for my SaaS projects.",
      "How to master {tool} in under 15 minutes."
    ];
    vibeList = ["Visual Metaphor", "Polarizing Debate", "Direct Demonstration", "Aversive Warning", "Curiosity Spark"];
  } else if (textToScan.includes("game") || textToScan.includes("gaming") || textToScan.includes("guides") || textToScan.includes("level") || textToScan.includes("esport")) {
    category = "Gaming Walkthrough";
    templates = [
      "How to Hit Max Rank in {game} (Step-by-Step Tutorial).",
      "Why the Pros are Secretly Banning {item} in Ranked.",
      "10 Game-Changing Hacks the Game Developers Hidden From You.",
      "I spent 70 Hours speedrunning {game} with {challenge}.",
      "This broken game mechanic of {game} is officially illegal.",
      "Stop making these 5 Beginner mistakes in {game} ranked mode.",
      "Why 99% of players fail {boss} (And how to fix it).",
      "The ultimate secret location in {game} revealed.",
      "I Tried speedrunning {game} on a steering wheel!",
      "{game} is officially dead. This new release is taking over.",
      "How to master {mechanic} in {game} in 10 minutes flat.",
      "The unluckiest player in {game} ranked history.",
      "Why {build} is actually the best setup in {game}.",
      "Is {game} still worth playing in 2026?",
      "The unfair advantages of {gear} setups in esport lobbies.",
      "The secret patch update in {game} that changes everything."
    ];
    vibeList = ["Inside Secret", "Challenge Constraint", "Vicious Critique", "Tension Trap", "Beginner Safe"];
  } else if (textToScan.includes("kitchen") || textToScan.includes("recipe") || textToScan.includes("cook") || textToScan.includes("culinary") || textToScan.includes("baking") || textToScan.includes("sourdough") || textToScan.includes("food")) {
    category = "Baking & Cooking";
    templates = [
      "The Absolute Best {recipe} from Scratch (Foolproof) 🍞",
      "Stop failing your {starter}! 5 Simple Baker Hacks.",
      "I baked the easiest {recipe} in a toaster oven.",
      "Why professional chefs hate pre-packaged {starter}.",
      "10 Yeast baking mistakes you are still making in 2026.",
      "How to get a perfect Golden Crust on your {recipe} every time.",
      "Grandma's secret ingredient for fluffy {recipe} revealed!",
      "I baked {recipe} using unfiltered beer instead of milk.",
      "The ultimate kitchen checklist for effortless weekend bakes.",
      "Why sourdough is actually healthy for your stomach chemistry.",
      "I spent 12 hours kneadless baking of artisan {recipe}.",
      "Sourdough tutorial: The final beginner masterclass you'll ever need.",
      "This 3-Ingredient {recipe} is taking over social feeds.",
      "Why your {recipe} is sinking or too dense (And how to fix it).",
      "The secret science of cold fermentation and long rising hours.",
      "Baking without stove dutch ovens for absolute beginners."
    ];
    vibeList = ["Sensation / Nostalgia", "Friction Solver", "Time-lapse Challenge", "Grandma's Heritage", "Extreme Simplicity"];
  } else if (textToScan.includes("finance") || textToScan.includes("crypto") || textToScan.includes("money") || textToScan.includes("investing") || textToScan.includes("stock") || textToScan.includes("wealth") || textToScan.includes("dividend") || textToScan.includes("wallet")) {
    category = "Finance & Crypto";
    templates = [
      "How to Invest your first $1,000 in {topic} for 2026.",
      "Why 90% of beginner investors lose money in {stack} stocks.",
      "The Secret {topic} Loophole to Build Passive Income.",
      "I tried building a portfolio using {tool} tips.",
      "The dangerous trap of high-yield {stack} dividends.",
      "How to retire 10 years early with standard {app} budgeting.",
      "The hidden tax loophole on {feature} investments in 2026.",
      "Is {type} investing actually dead in this market?",
      "How I turned a standard {task} setup into a cash-flow machine.",
      "Watch me build a $5k monthly dividend growth stock portfolio."
    ];
    vibeList = ["Aversive Warning", "Unfair Advantage", "Storytelling Case", "Fear of Missing Out", "Financial Freedom"];
  } else if (textToScan.includes("fitness") || textToScan.includes("workout") || textToScan.includes("gym") || textToScan.includes("health") || textToScan.includes("diet") || textToScan.includes("muscle") || textToScan.includes("fasting") || textToScan.includes("coaching")) {
    category = "Fitness & Wellness";
    templates = [
      "The Ultimate 15-Minute {topic} Workout for Busy People.",
      "Why you fail to lose body fat on {tool} diet rules.",
      "Mastering {topic} lifting form: 5 dangerous mistakes to avoid.",
      "I tried {stack} fasting for 30 days (My honest body scan).",
      "How to build muscle twice as fast using {app} methods.",
      "Uncover Grandma's secret {feature} juice recipe for high energy.",
      "The science-backed {type} routine that fixed my posture.",
      "Stop wasting hours on {task}: Do this 3-minute warm up instead.",
      "Mastering hypertrophy with this perfect {stack} split."
    ];
    vibeList = ["Physical Demonstration", "Friction Solver", "Instant Payoff", "Health Warning", "Science Backed"];
  } else if (textToScan.includes("business") || textToScan.includes("marketing") || textToScan.includes("startup") || textToScan.includes("agency") || textToScan.includes("sales") || textToScan.includes("outreach") || textToScan.includes("funnel") || textToScan.includes("lead")) {
    category = "Business & Marketing";
    templates = [
      "How I built a $10K/month agency using {tool} in 30 days.",
      "The unfair marketing strategy to scale {topic} in 2026.",
      "Mastering local SEO secrets for {topic} brands.",
      "I setup a high-paying cold email funnel for {app}.",
      "Why your current {stack} setup is costing you high-ticket deals.",
      "The secret sales pitch template that converted a $20,000 client.",
      "How I automated 90% of my {task} workflows using {tool}.",
      "This simple {type} hack doubled my newsletter CTR."
    ];
    vibeList = ["Extreme Leverage", "Beginner Proof", "Case Study Secrets", "Automation Hack", "High Ticket"];
  } else if (textToScan.includes("travel") || textToScan.includes("vlog") || textToScan.includes("lifestyle") || textToScan.includes("adventure") || textToScan.includes("nomad") || textToScan.includes("vlogger")) {
    category = "Lifestyle & Travel";
    templates = [
      "A Day in the Life of a {topic} Creator in {tool}.",
      "The raw truth about traveling full-time on {topic}.",
      "My honest morning routine to master {topic} focus.",
      "We spent 48 hours exploring {app} on a tiny budget.",
      "The ultimate minimalist packing setup using {stack} gear.",
      "Why I left my apartment to live in a {clone} setup.",
      "How to stay incredibly organized with this {task} habit model.",
      "Unlocking a high-performance lifestyle with simple {type} rules."
    ];
    vibeList = ["Aesthetic Travel", "Comfort Routine", "Vlogging Journey", "Minimalist Living", "Mindset Shift"];
  } else if (textToScan.includes("design") || textToScan.includes("creative") || textToScan.includes("art") || textToScan.includes("figma") || textToScan.includes("ui") || textToScan.includes("ux") || textToScan.includes("aesthetic") || textToScan.includes("designer")) {
    category = "Design & Art";
    templates = [
      "The Ultimate Figma Header Secrets for {topic} Pages.",
      "I redesigned the terrible {clone} app layout from scratch.",
      "Mastering visual grid spacing layout with this {tool} hack.",
      "Why 95% of websites fail modern {type} styling rules.",
      "Stop doing {task} manually: 5 Figma plugins that feel illegal.",
      "How to build high-end {app} components in under 5 minutes.",
      "Creating modern high-contrast aesthetic pairings using {stack} guides."
    ];
    vibeList = ["Aesthetic Precision", "Redesign Critique", "Figma Magic", "Visual Pairing", "Speed Design"];
  } else if (textToScan.includes("education") || textToScan.includes("science") || textToScan.includes("learn") || textToScan.includes("physics") || textToScan.includes("math") || textToScan.includes("documentary") || textToScan.includes("teach")) {
    category = "Science & Education";
    templates = [
      "The mind-blowing physics behind standard {topic} systems.",
      "Why standard education fails to explain {topic} mechanics.",
      "How {tool} actually works under the hood (Explained simply).",
      "The dark history of {clone} and how it took over the world.",
      "Testing the limits of {app} simulator setups in real life.",
      "How to learn {task} 5x faster using scientific recall cards.",
      "The absolute secret code of {stack} that nature uses."
    ];
    vibeList = ["Curiosity Explainer", "Visual Sandbox", "Science Secrets", "Deep Dive Theory", "Fast Learning"];
  } else {
    category = "General Content Strategy";
    templates = [
      "How to scale your channel with {topic} from scratch.",
      "Why traditional methods fail. Enter {topic} in 2026.",
      "I tried doing {topic} for 30 days and this happened.",
      "10 simple rules to double your output with {tool}.",
      "Stop doing {task} the wrong way: Do this instead.",
      "The Unfair Advantage: How {tool} changes the game.",
      "The secret behind highly viral {topic} videos.",
      "I spent 100 Hours mastering this standard workflow.",
      "Why most people fail at {task} (Step-by-Step solution).",
      "Rebuilding my strategy around {tool} in 2026."
    ];
    vibeList = ["Evergreen Guide", "Unfair Advantage", "Storytelling Case", "Fear of Missing Out", "Curiosity Gap"];
  }

  // Topic Lists
  const topicsTech = ["SaaS App", "Next.js 15 Hub", "React 19 Hooks", "Gemini 3.5 Flash Model", "Cursor AI Agent Router", "Tailwind v4 Setup", "Chrome Extension tool", "Express Backend proxy", "Vite JS Bundle", "TypeScript Custom types"];
  const toolsTech = ["AI Copilot suggestions", "Cursor Composer script", "esbuild compilation tools", "Standard Node CJS runtime", "Firebase Firestore Security rules", "Cloud Run Container setups", "Antigravity Agent workflow", "Vite HMR overrides"];
  const stackTech = ["React + Supabase DB", "Express + TypeScript server", "Vite SPA index route", "Node.js fullstack pipeline"];
  const clonesTech = ["Slack Team App", "VidIQ Pro Sidebar drawer", "TikTok Horizontal Scroll feed", "Stripe payment workflow"];

  const gamesList = ["Elden Ring DLC expansion", "Valorant Ranked tier lobbies", "Minecraft 1.21 update", "Apex Legends Season meta", "Dark Souls Co-op speedruns", "Cyberpunk 2077 neon hacks"];
  const itemsList = ["Movement Dash glitch", "Health Flask counters", "Broken Overpowered sniper", "Stealth Armor piercer perks", "Aimbot style tracking shortcuts"];
  const bossesList = ["Malenia, Blade of Miquella", "The Shadow King arena", "Diamond Rank Lobby gatekeepers", "The final speed-runner trials"];
  const buildsList = ["Bleed Bandit stat layout", "One-Shot Spell caster meta", "High-Sensitivity Flick aim layout", "Zero-Gravity Jump jump tricks"];

  const recipesList = ["Sourdough Bread sourdough slice", "Crispy Apple Dessert pie", "French Cinnamon Pastry shell", "Flaky Golden Artisan biscuit", "Classic Sourdough yeast starter", "Molten Fudge Cocoa cake"];
  const startersList = ["Sourdough wild yeast starter", "Yeast poolish dough master", "Croissant dough butter block", "No-knead sourdough pan"];

  // New Category Lists
  const topicsFinance = ["Crypto Spot", "S&P 500 ETF", "High-Yield dividends", "Bitcoin Halving", "AI Micro-SaaS holding", "Real Estate REITs"];
  const toolsFinance = ["TradingView charts", "Robinhood trackers", "Compound calculators", "Tax shelter codes"];
  
  const topicsFitness = ["Bodyweight Calisthenics", "Zone-2 Cardio cycles", "Muscle Hypertrophy", "Intermittent Fasting Fast", "Keto Prep diets"];
  const toolsFitness = ["Garmin Fitness tracking", "MyFitnessPal calculations", "Barbell bench setup", "Resistance loops"];

  const topicsBusiness = ["Organic TikTok marketing", "Cold email lead pools", "SaaS subscription funnels", "Consulting templates", "SEO search queries"];
  const toolsBusiness = ["Zapier workflows", "LinkedIn CRM routers", "High-ticket sales scripts", "Canva style mockups"];

  const topicsLifestyle = ["Minimalist morning loops", "Digital nomad carry gear", "Aesthetic standing setups", "Solo camper trips", "Deep focus habits"];
  const toolsLifestyle = ["Notion workspace templates", "Sony vlog gears", "iPad drawing sheets", "Peak Design backpacks"];

  const topicsDesign = ["Figma variable design", "Landing page conversions", "Dark mode glow accents", "High-contrast tracking select", "Interactive cards"];
  const toolsDesign = ["Figma component slots", "Spline 3D canvasses", "Tailwind color pallets", "Bezier shape tools"];

  const topicsScience = ["Quantum qubit states", "Dark matter speed theories", "Neuroplasticity retention hacks", "Neural network routers", "Black hole orbits"];
  const toolsScience = ["Wolfram Alpha solvers", "Wikipedia deep indices", "Anki flashcard decks", "PhET simulation states"];

  const angleModifier = angle || "Evergreen Authority";
  const ideas: any[] = [];
  
  for (let i = 0; i < q; i++) {
    const templateIndex = i % templates.length;
    let title = templates[templateIndex];
    let seoKeyword = "YouTube Strategy";

    if (category === "Tech / Coding") {
      const topic = topicsTech[(i + 1) % topicsTech.length];
      const tool = toolsTech[(i + 3) % toolsTech.length];
      const stack = stackTech[(i + 5) % stackTech.length];
      const clone = clonesTech[(i + 7) % clonesTech.length];
      const app = "SaaS Platform v2";
      const task = "debugging typescript errors";
      const feature = "GitHub public portfolio";
      const type = "No-Code prompt";

      title = title
        .replace("{topic}", topic)
        .replace("{tool}", tool)
        .replace("{stack}", stack)
        .replace("{clone}", clone)
        .replace("{app}", app)
        .replace("{task}", task)
        .replace("{feature}", feature)
        .replace("{type}", type);

      seoKeyword = `${topic} ${tool}`;
    } else if (category === "Gaming Walkthrough") {
      const game = gamesList[(i + 1) % gamesList.length];
      const item = itemsList[(i + 3) % itemsList.length];
      const boss = bossesList[(i + 5) % bossesList.length];
      const build = buildsList[(i + 7) % buildsList.length];
      const challenge = "only gray tier items";
      const gear = "high Sensitivity mouse keypads";
      const mechanic = "backward bunnyhop glide";

      title = title
        .replace("{game}", game)
        .replace("{item}", item)
        .replace("{boss}", boss)
        .replace("{build}", build)
        .replace("{challenge}", challenge)
        .replace("{gear}", gear)
        .replace("{mechanic}", mechanic);

      seoKeyword = `${game} ${item}`;
    } else if (category === "Baking & Cooking") {
      const recipe = recipesList[(i + 1) % recipesList.length];
      const starter = startersList[(i + 3) % startersList.length];

      title = title
        .replace("{recipe}", recipe)
        .replace("{starter}", starter);

      seoKeyword = `${recipe} yeast tutorial`;
    } else if (category === "Finance & Crypto") {
      const topic = topicsFinance[(i + 1) % topicsFinance.length];
      const tool = toolsFinance[(i + 3) % toolsFinance.length];
      const stack = "passive flow strategy";
      const clone = "WealthSimple portfolio";
      const app = "Investment Tracker";
      const task = "leveraging tax-free accounts";
      const feature = "long-term dividend growth";
      const type = "compound rate target";

      title = title
        .replace("{topic}", topic)
        .replace("{tool}", tool)
        .replace("{stack}", stack)
        .replace("{clone}", clone)
        .replace("{app}", app)
        .replace("{task}", task)
        .replace("{feature}", feature)
        .replace("{type}", type);

      seoKeyword = `${topic} ${tool}`;
    } else if (category === "Fitness & Wellness") {
      const topic = topicsFitness[(i + 1) % topicsFitness.length];
      const tool = toolsFitness[(i + 3) % toolsFitness.length];
      const stack = "intermittent fasting split";
      const clone = "MyFitnessPal diary";
      const app = "Macro Tracker Pro";
      const task = "perfecting deadlift postures";
      const feature = "organic ginger detox helper";
      const type = "hypertrophy growth split";

      title = title
        .replace("{topic}", topic)
        .replace("{tool}", tool)
        .replace("{stack}", stack)
        .replace("{clone}", clone)
        .replace("{app}", app)
        .replace("{task}", task)
        .replace("{feature}", feature)
        .replace("{type}", type);

      seoKeyword = `${topic} exercise`;
    } else if (category === "Business & Marketing") {
      const topic = topicsBusiness[(i + 1) % topicsBusiness.length];
      const tool = toolsBusiness[(i + 3) % toolsBusiness.length];
      const stack = "cold email script sequence";
      const clone = "HubSpot automation CRM";
      const app = "Stripe retainer layout";
      const task = "cold calling tech startups";
      const feature = "local SEO index score";
      const type = "newsletter headline layout";

      title = title
        .replace("{topic}", topic)
        .replace("{tool}", tool)
        .replace("{stack}", stack)
        .replace("{clone}", clone)
        .replace("{app}", app)
        .replace("{task}", task)
        .replace("{feature}", feature)
        .replace("{type}", type);

      seoKeyword = `${topic} strategy`;
    } else if (category === "Lifestyle & Travel") {
      const topic = topicsLifestyle[(i + 1) % topicsLifestyle.length];
      const tool = toolsLifestyle[(i + 3) % toolsLifestyle.length];
      const stack = "minimalist packing gear";
      const clone = "Nomad Rental setup";
      const app = "Notion bullet journal";
      const task = "focusing in coffee shops";
      const feature = "perfect deep sleep routine";
      const type = "aesthetic desk organizing";

      title = title
        .replace("{topic}", topic)
        .replace("{tool}", tool)
        .replace("{stack}", stack)
        .replace("{clone}", clone)
        .replace("{app}", app)
        .replace("{task}", task)
        .replace("{feature}", feature)
        .replace("{type}", type);

      seoKeyword = `${topic} lifestyle`;
    } else if (category === "Design & Art") {
      const topic = topicsDesign[(i + 1) % topicsDesign.length];
      const tool = toolsDesign[(i + 3) % toolsDesign.length];
      const stack = "clean typography pairings";
      const clone = "Stripe visual dashboard";
      const app = "Figma header library";
      const task = "editing vector custom shapes";
      const feature = "neon glow border styles";
      const type = "kinetic navigation animations";

      title = title
        .replace("{topic}", topic)
        .replace("{tool}", tool)
        .replace("{stack}", stack)
        .replace("{clone}", clone)
        .replace("{app}", app)
        .replace("{task}", task)
        .replace("{feature}", feature)
        .replace("{type}", type);

      seoKeyword = `${topic} design`;
    } else if (category === "Science & Education") {
      const topic = topicsScience[(i + 1) % topicsScience.length];
      const tool = toolsScience[(i + 3) % toolsScience.length];
      const stack = "fundamental space metrics";
      const clone = "Wikipedia rabbit hole";
      const app = "Quantum simulators";
      const task = "recalling complex formulas";
      const feature = "neuroplasticity learning pathways";
      const type = "differential speed constraints";

      title = title
        .replace("{topic}", topic)
        .replace("{tool}", tool)
        .replace("{stack}", stack)
        .replace("{clone}", clone)
        .replace("{app}", app)
        .replace("{task}", task)
        .replace("{feature}", feature)
        .replace("{type}", type);

      seoKeyword = `${topic} explainer`;
    } else {
      const topic = "YouTube Virality";
      const tool = "Creator Analytics";
      const task = "editing long video forms";
      title = title
        .replace("{topic}", topic)
        .replace("{tool}", tool)
        .replace("{task}", task);
      seoKeyword = `${topic} ${tool}`;
    }

    if (angleModifier === "Trend-Jacking") {
      title = `[2026 META] ${title} (Shocking Reveal)`;
    } else if (angleModifier === "Audience Questions") {
      title = `You Asked, I Answered: ${title}`;
    } else if (angleModifier === "Underdog Swarm") {
      title = `${title} [Zero-Equipment Tutorial]`;
    }

    // Trim title slightly to keep it mobile safe under 65 chars
    if (title.length > 65) {
      title = title.substring(0, 60) + "...";
    }

    const vibe = vibeList[i % vibeList.length];
    
    ideas.push({
      title,
      ctrAngle: `Leverages a powerful ${vibe.toLowerCase()} hook to generate high psychological click motivation on modern feeds.`,
      vibe,
      hookStrategy: "Instantly display the end-result within the first 3 seconds, then frame a high-stakes challenge using the 'Instant Payoff' intro pattern.",
      thumbnailConcept: "Splitscreen visual style. On the left: a close up of the active mechanism highlighted by a neon green stroke. On the right: a simple, highly-focused expression without background noise.",
      seoKeyword,
      priorityRating: i < 3 ? "BREAKTHROUGH" : i < 10 ? "HIGH POTENTIAL" : "STEADY FEED"
    });
  }

  return {
    ideas
  };
}

// API Route: Generate Video Ideas (10 to 50+ Ideas)
app.post("/api/coach/generate-ideas", async (req, res) => {
  try {
    const { channelTitle = "", channelDescription = "", quantity = 10, angle = "Evergreen Authority", customNiche = "" } = req.body;

    const q = Math.max(10, Math.min(60, parseInt(quantity, 10) || 10));

    // Fallback to programmatic generator when no live API key exists or demo mode is selected
    if (isDemoMode(req) || !hasLLM(req)) {
      if (!hasLLM(req) && !isDemoMode(req)) {
        return res.status(401).json({ error: "Gemini API key is required to generate daily ideas." });
      }
      const fallbackData = getLocalIdeas(channelTitle, channelDescription, q, angle, customNiche);
      return res.json({ ...fallbackData, isFallback: true });
    }

    // Query high-fidelity Gemini 3.5 Flash Model
    const prompt = `Generate exactly ${q} highly-optimized YouTube video ideas tailored for the active channel: "${channelTitle}".
Channel focus & description: "${channelDescription}"
User's Target Channel Niche Focus: "${customNiche || 'Detect automatically from description'}"
Strategic Angle Focus: "${angle}"

Strict guidelines:
1. Generate EXACTLY ${q} unique video ideas.
2. Provide a variety of engaging hooks, structured text titles under 60 characters, and target SEO parameters that align directly with the target niche: "${customNiche || 'auto'}"
3. Align directly with the requested strategy angle: "${angle}" (Trend-Jacking targets trends/hacks, Evergreen Authority focuses on high-search guides, Audience Questions addresses common pain points, Underdog Swarm uses low-competition long-tail keywords).`;

    const response = await runLLMRequest(req, {
      contents: prompt,
      systemInstruction: "You are the world's most elite YouTube Growth Consultant and CTR Engineer. Generate highly accurate collections of daily video concepts based on target niche metrics, prioritizing retention-safe patterns and click-worthy titles.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["ideas"],
        properties: {
          ideas: {
            type: Type.ARRAY,
            description: "List of generated custom video suggestions",
            items: {
              type: Type.OBJECT,
              required: ["title", "ctrAngle", "vibe", "hookStrategy", "thumbnailConcept", "seoKeyword", "priorityRating"],
              properties: {
                title: { type: Type.STRING, description: "A high-CTR title draft under 65 characters" },
                ctrAngle: { type: Type.STRING, description: "Why this title creates high click-through rate, psychological explanation" },
                vibe: { type: Type.STRING, description: "The styling mood of the concept" },
                hookStrategy: { type: Type.STRING, description: "A tactical strategy for capturing and retaining the viewer in the first 30 seconds" },
                thumbnailConcept: { type: Type.STRING, description: "Highly clickable visual suggestion for thumbnail art" },
                seoKeyword: { type: Type.STRING, description: "Target focus keyword search string" },
                priorityRating: { type: Type.STRING, description: "Must be one of: 'BREAKTHROUGH', 'HIGH POTENTIAL', 'STEADY FEED'" }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    if (isGeminiException(error) && isDemoMode(req)) {
      logGeminiException("Daily Ideas Generator", error);
      const fallbackData = getLocalIdeas(req.body.channelTitle, req.body.channelDescription, parseInt(req.body.quantity, 10) || 10, req.body.angle || "Evergreen Authority", req.body.customNiche || "");
      return res.json({ ...fallbackData, isFallback: true, geminiLimitReached: true });
    }
    console.error("Daily Ideas synthesis failed fundamentally:", error);
    res.status(500).json({ error: error.message || "Failed to synthesize daily video ideas." });
  }
});


// Local Fallback: Competitor Transcript Analysis
function getLocalTranscriptAnalysis(transcript: string) {
  const words = (transcript || "").trim().split(/\s+/);
  const wordCount = words.length;
  const wordSnippet = words.slice(0, 15).join(" ");

  const chapters = [
    {
      timestamp: "00:00 - 00:30",
      title: "The Attention Catalyst (The Hook)",
      summary: `Initial frame opener starting with "${wordSnippet}..." designed to arrest scroll dropoff and establish immediate stakes.`,
      pacing: "Rapid Fire Acceleration (2.8 words/sec)"
    },
    {
      timestamp: "00:30 - 02:45",
      title: "Core Thesis & Tension Accumulation",
      summary: "Identifies standard industry hurdles, presents a contrasting opinion, and formats the core problem statement.",
      pacing: "Moderate Explanatory Depth"
    },
    {
      timestamp: "02:45 - 05:00",
      title: "The Pivot & Practical Revelation",
      summary: "Reveals actionable tactics. Displays statistical evidence or case-by-case demonstrations to solidify value.",
      pacing: "High Density Demonstrations"
    }
  ];

  if (wordCount < 100) {
    chapters.splice(1, 2);
  }

  return {
    chapters,
    hookAnalysis: {
      score: 88,
      strategyUsed: "Intrusive Narrative Friction",
      auditoryTriggers: [
        "Eliminated standard dead-air or generic intros entirely in favor of starting mid-thought to trigger curiosity.",
        "Accents key high-value keywords within the first 6 seconds, validating search engine intent instantly.",
        "Employs vocal staccato changes where the end of sentences are delivered with rising pitch inflection."
      ],
      retentionHacks: [
        "Remove all background audio track bass frequencies at exactly 0:12 to elevate key assertions.",
        "Blend a subtle analog keystroke SFX trigger underneath listed pointers to stimulate sensory reinforcement."
      ]
    },
    textGraphics: [
      {
        timestampRange: "00:04 - 00:08",
        suggestedTemplate: "⚠️ RETENTION SAVER: Kinetic bold uppercase outline text overlay '97% FAIL HERE'",
        psychologicalTriggers: "Loss aversion bias and audience challenge triggers.",
        designGuidelines: "Bold uppercase geometric sans-serif font centered, featuring bright red stroke highlights."
      },
      {
        timestampRange: "00:15 - 00:22",
        suggestedTemplate: "📊 METRIC PLOT: Translucent floating line graph showing exponential traffic trajectory",
        psychologicalTriggers: "Visual proof mechanics to substantiate the auditory hook claim.",
        designGuidelines: "Clean neon green line plotted over dark glass frame, styled with smooth glide-in transitions."
      },
      {
        timestampRange: "00:45 - 00:52",
        suggestedTemplate: "🚀 COMPARTMENT KEY: Slide-in lower third 'STEP 1: THE DISCOVERY PROTOCOL'",
        psychologicalTriggers: "Structures narrative chunks to reduce scrolling attrition.",
        designGuidelines: "Minimalist tab styled with left red highlight borders to create premium editorial rhythm."
      }
    ],
    isFallback: true
  };
}

// API Route: Competitor Transcript Analysis Engine (Gemini 3.5)
app.post("/api/coach/analyze-transcript", async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: "Transcript content is required." });
    }

    if (!hasLLM(req)) {
      if (isDemoMode(req)) {
        const fallbackData = getLocalTranscriptAnalysis(transcript);
        return res.json({ ...fallbackData, isFallback: true });
      } else {
        return res.status(401).json({ error: "Gemini API key is required to analyze transcripts." });
      }
    }

    const prompt = `Analyze this competitor's YouTube video script / transcript:
${transcript}

Please run this precise execution blueprint:
1. Break this script down into Timestamped chapters with summary and pacing insights.
2. Analyze why the first 30 seconds worked as an auditory hook, giving scores and triggers.
3. Suggest exactly where to place high-retention visual text graphics to beat their retention.`;

    const response = await runLLMRequest(req, {
      contents: prompt,
      systemInstruction: "You are the world's most elite YouTube Script Doctor, Retention Consultant, and AVD Engineer. Your expertise lies in analyzing script rhythms, vocal pacing structures, auditory triggers, visual graphic placements, and chapter splits that maximize average view duration (AVD). Output detailed structured JSON aligned to the requested schema.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["chapters", "hookAnalysis", "textGraphics"],
        properties: {
          chapters: {
            type: Type.ARRAY,
            description: "The transcript broken down into strategic chapters",
            items: {
              type: Type.OBJECT,
              required: ["timestamp", "title", "summary", "pacing"],
              properties: {
                timestamp: { type: Type.STRING, description: "Logical estimated timestamp interval, e.g. '00:00 - 00:32'" },
                title: { type: Type.STRING, description: "Engaging, retention-safe chapter title" },
                summary: { type: Type.STRING, description: "Detailed strategic summary of what is happening or discussed here" },
                pacing: { type: Type.STRING, description: "The vocal rhythm or editing tempo required here (e.g. 'Staccato / High urgency', 'Explanatory Depth', 'B-Roll Dense transition')" }
              }
            }
          },
          hookAnalysis: {
            type: Type.OBJECT,
            required: ["score", "strategyUsed", "auditoryTriggers", "retentionHacks"],
            properties: {
              score: { type: Type.INTEGER, description: "Audit score for the hook from 0 to 100" },
              strategyUsed: { type: Type.STRING, description: "The psychological strategy category for the hook (e.g., 'Inherent Threat Pattern', 'Curiosity Gap Metaphor')" },
              auditoryTriggers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key reasons why the auditory opening elements (first 30 seconds) succeed"
              },
              retentionHacks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Actionable advice on auditory/sound design changes to maintain interest"
              }
            }
          },
          textGraphics: {
            type: Type.ARRAY,
            description: "Strategic visual text/graphic placement recommendations with timestamp ranges",
            items: {
              type: Type.OBJECT,
              required: ["timestampRange", "suggestedTemplate", "psychologicalTriggers", "designGuidelines"],
              properties: {
                timestampRange: { type: Type.STRING, description: "When the graphic should appear, e.g. '00:15 - 00:19'" },
                suggestedTemplate: { type: Type.STRING, description: "What text/visualization to render (e.g., Kinetic text overlaying standard keywords)" },
                psychologicalTriggers: { type: Type.STRING, description: "The mental trigger exploited (e.g., Fear of being left out, Visual validation)" },
                designGuidelines: { type: Type.STRING, description: "Specific style instruction (colors, fonts, entry transition speeds)" }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    if (isGeminiException(error) && isDemoMode(req)) {
      logGeminiException("Transcript Analyzer", error);
      const fallbackData = getLocalTranscriptAnalysis(req.body.transcript);
      return res.json({ ...fallbackData, isFallback: true, geminiLimitReached: true });
    }
    console.error("Transcript analysis failed fundamentally:", error);
    res.status(500).json({ error: error.message || "Failed to audit competitor transcript." });
  }
});


// Fallback Logic: Hook & Script Analyzer
function getLocalAnalyzeScript(transcript: string, niche: string) {
  const cleanNiche = (niche || "general topics").toLowerCase().trim();
  const theme = cleanNiche === "auto" || !cleanNiche ? "your core focus" : cleanNiche;
  const capitalizedTheme = theme.charAt(0).toUpperCase() + theme.slice(1);

  return {
    hookAnalysis: {
      grade: "A-",
      reason: `The script utilizes excellent narrative tension, introducing a real-world "${theme}" hook inside the first 8 seconds. This validates audience search intent immediately, although minor structural elements could elevate it further.`
    },
    structuralPacing: [
      { timestamp: "00:00 - 00:15", event: "The Pattern Break Out", details: `A rapid, highly engaging visual sequence hook explaining the core appeal about ${theme}.` },
      { timestamp: "00:15 - 01:10", event: "Core Concept Setup", details: `Presents primary ${theme} scenarios directly, establishing high stakes so the audience feels fully engaged.` },
      { timestamp: "01:10 - 03:25", event: "Walkthrough / Deep Dive", details: `Step-by-step demonstration of ${theme} concepts. Visually proves statements without dragging.` },
      { timestamp: "03:25 - 04:30", event: "Retention Bridge", details: `Injects visual shifts or high-value insights focusing specifically on what the viewer will gain.` },
      { timestamp: "04:30 - 05:00", event: "Logical Subscription CTA", details: "Clean, low-friction call to action perfectly matches viewer gains without breaking flow pace." }
    ],
    retentionTricks: [
      `Starting mid-sentence with a dramatic statement or question containing "${theme}" to trigger instant curiosity.`,
      `Framing insights as a helpful tutorial check: 'If you are ignoring this basic technique, you are missing out on serious growth.' This leverages high-value interest.`,
      `Injecting concrete real-life examples, side-by-side comparison graphics, or simple analogies within the first minute.`
    ],
    reEngineeredScript: `[00:00 - 00:20 Rewrite For High Retention - Niche: ${capitalizedTheme}]\n"Most people struggle with ${theme} and find themselves completely stuck. Today, we're sharing a simple shift that makes ${theme} incredibly easy. In under five minutes, you'll get the exact step-by-step guide. Let's get right into it."`
  };
}

// Fallback Logic: Predicted Retention Plotter
function getLocalPredictRetention(outline: string) {
  return {
    retentionPoints: [
      { time: "0:00", retention: 100 },
      { time: "1:15", retention: 78 },
      { time: "2:45", retention: 62 },
      { time: "4:00", retention: 44 },
      { time: "5:15", retention: 39 }
    ],
    alerts: [
      {
        time: "1:15",
        dropVal: 22,
        alertMessage: "Sharp initial drop-off of 22% detected right after the intro hook.",
        fixAction: "Tighten your explanation. Avoid flashing self-centered intro logos or credit screens. Move directly to the core promise."
      },
      {
        time: "4:00",
        dropVal: 18,
        alertMessage: "Drop-off of 18% during detail walkthrough.",
        fixAction: "Too academic/dry. Inject an engaging screen graphic demonstration or interactive visual comparison here to reset viewer attention spans."
      }
    ]
  };
}

// Fallback Logic: Anti-Clickbait Title Auditor
function getLocalTitleAuditor(title: string, outline: string, styleGoal: string) {
  const isBroad = styleGoal === "Hyper-Viral / Broad Audience";
  const trustScore = isBroad ? 68 : 94;
  const clickScore = isBroad ? 92 : 75;
  const cleanTitle = title || "My Core Concept Explained";

  return {
    trustScore,
    clickScore,
    isTooSensationalized: isBroad,
    balancedTitles: [
      `${cleanTitle}: The Secret Hook Everyone Forgets`,
      `How to Do ${cleanTitle} (Step-by-Step Guide)`,
      `I Tried ${cleanTitle} for 7 Days - Here's What Happened`
    ]
  };
}

// Fallback Logic: Shorts Funnel Campaign Generator
function getLocalGenerateShortsFunnel(scriptBreakdown: string) {
  const snippet = scriptBreakdown ? (scriptBreakdown.length > 50 ? scriptBreakdown.substring(0, 47) + "..." : scriptBreakdown) : "this concept";
  return {
    campaignSegments: [
      {
        timestampLocation: "00:05 - 00:25",
        shortHook: `[Self-Recording Custom Script]\n"If you're still doing ${snippet} the old way, you are wasting so much of your free time. In 15 seconds, I will show you why."`,
        theCliffhanger: "Cut vertical frame right as you reveal the primary secret metric point.",
        callToAction: "\"I show you how to solve this step-by-step in my main video. Click the channel link below!\""
      },
      {
        timestampLocation: "01:15 - 01:40",
        shortHook: `[Self-Recording Custom Script]\n"90% of creators completely skip this critical guideline when it comes to ${snippet}. Let's write the single rule of thumb that fixes it."`,
        theCliffhanger: "Cut the frame right before revealing the final result.",
        callToAction: "\"Copy our exact workspace rules from my full layout breakdown. Link is in the bio!\""
      },
      {
        timestampLocation: "02:45 - 03:10",
        shortHook: `[Self-Recording Custom Script]\n"How do pro creators scale their speed while maintaining quality? The secret is a lazy-loading approach to ${snippet}."`,
        theCliffhanger: "Cut just as you point cursor to your most important workspace setup.",
        callToAction: "\"Get the complete guide from my deep-dive video. Click the channel page to watch!\""
      }
    ]
  };
}

// Fallback Logic: Sponsorship & Monetization Calculator
function getLocalCalculateSponsorship(niche: string, averageViewCount: number, topGeographicLocation: string, sponsorshipType: string) {
  const views = Number(averageViewCount) || 12000;
  let cpm = 20; 
  const nicheLower = (niche || "").toLowerCase();
  
  if (nicheLower.includes("fin") || nicheLower.includes("biz") || nicheLower.includes("saas") || nicheLower.includes("crypt")) {
    cpm = 32;
  } else if (nicheLower.includes("gam") || nicheLower.includes("fict") || nicheLower.includes("vlog")) {
    cpm = 11;
  } else if (nicheLower.includes("tech") || nicheLower.includes("dev") || nicheLower.includes("cod")) {
    cpm = 26;
  } else if (nicheLower.includes("cook") || nicheLower.includes("food") || nicheLower.includes("bak")) {
    cpm = 17;
  }

  let geoMultiplier = 1.0;
  if (topGeographicLocation && (topGeographicLocation.includes("US") || topGeographicLocation.includes("UK") || topGeographicLocation.includes("CA") || topGeographicLocation.includes("United States"))) {
    geoMultiplier = 1.3;
  }

  const finalCpm = Number((cpm * geoMultiplier).toFixed(2));
  const viewsFactor = views / 1000;
  let multiplier = 1.0;
  if (sponsorshipType && sponsorshipType.toLowerCase().includes("dedic")) {
    multiplier = 2.4; 
  }

  const baseCalculatedValue = Math.round(viewsFactor * finalCpm * multiplier);
  const lowRange = Math.round(baseCalculatedValue * 0.85);
  const highRange = Math.round(baseCalculatedValue * 1.15);

  return {
    baselineSponsorshipValue: `$${lowRange} - $${highRange} USD (based on estimated $${finalCpm} CPM for this Creator Profile)`,
    pitchAngle: [
      `High Buying Intent: Highlight that audience members inside the ${niche || "target"} sector are high-quality, focused enthusiasts looking for direct, trusted suggestions related to ${niche || "this topic"}.`,
      `Audience Geo Value: Stress that your prominent retention within highly paying geographic locations like ${topGeographicLocation || "US/Europe"} guarantees higher conversion returns (ROI).`,
      `Procedural Product demo integration: Pitch that showing the sponsor's product directly integrated inside your engaging content is 300% more memorable than typical generic slides.`
    ],
    negotiationSafetyNet: `$${Math.round(baseCalculatedValue * 0.72)} Accept only if they commit to active recurring monthly deliverables.`
  };
}


// --- 1. API Endpoint: Hook & Script Analyzer ---
app.post("/api/analyze-script", async (req, res) => {
  try {
    const { transcript, niche } = req.body;
    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: "Transcript data is required." });
    }

    if (!hasLLM(req)) {
      if (isDemoMode(req)) {
        const data = getLocalAnalyzeScript(transcript, niche);
        return res.json({ ...data, isFallback: true });
      } else {
        return res.status(401).json({ error: "Gemini API key is required to analyze script hooks." });
      }
    }

    const response = await runLLMRequest(req, {
      contents: `Perform a deep YouTube hook & script audit.
Video Niche: ${niche || "General Creator"}
Script text to analyze:
${transcript}

Calculate:
1. hookAnalysis: Grade the first 30 seconds psychological hook from A-F (grade, e.g. "B+") and explain why.
2. structuralPacing: Return timestamp milestones of where the pattern breaks, B-rolls, transitions or points shift.
3. retentionTricks: List exactly 3 specific linguistic or visual tactics used.
4. reEngineeredScript: Create an optimized tailored high-retention alternative intro script for my channel starting strong.`,
      systemInstruction: "You are the world's most professional YouTube Script Doctor and Hook Specialist. Your goal is to maximize average view duration. Return highly structured and realistic analysis in structured JSON matching the requested schema.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["hookAnalysis", "structuralPacing", "retentionTricks", "reEngineeredScript"],
        properties: {
          hookAnalysis: {
            type: Type.OBJECT,
            required: ["grade", "reason"],
            properties: {
              grade: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          },
          structuralPacing: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["timestamp", "event", "details"],
              properties: {
                timestamp: { type: Type.STRING },
                event: { type: Type.STRING },
                details: { type: Type.STRING }
              }
            }
          },
          retentionTricks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Must contain exactly 3 strategies"
          },
          reEngineeredScript: { type: Type.STRING }
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    if (isGeminiException(error) && isDemoMode(req)) {
      logGeminiException("Script Analyzer", error);
      const fallbackData = getLocalAnalyzeScript(req.body.transcript, req.body.niche);
      return res.json({ ...fallbackData, isFallback: true, geminiLimitReached: true });
    }
    console.error("Transcript analysis failed:", error);
    res.status(500).json({ error: error.message || "Failed to analyze script transcript." });
  }
});


// --- 2. API Endpoint: Predicted Retention Plotter ---
app.post("/api/predict-retention", async (req, res) => {
  try {
    const { outline } = req.body;
    if (!outline || outline.trim().length === 0) {
      return res.status(400).json({ error: "outline outlines context is required." });
    }

    if (!hasLLM(req)) {
      if (isDemoMode(req)) {
        const data = getLocalPredictRetention(outline);
        return res.json({ ...data, isFallback: true });
      } else {
        return res.status(401).json({ error: "Gemini API key is required to predict retention." });
      }
    }

    const response = await runLLMRequest(req, {
      contents: `Simulate viewer behavioral data. Analyze this script section/video outline:
${outline}

Return simulated average view retention data points (5 marks mapping progress from 0:00 starting at 100 on the curve). If a drop-off of more than 10% happens between successive points, supply a targeted behavioral caution alert and a remediation fix (fixAction).`,
      systemInstruction: "You are the primary cognitive psychology director at a major video tech firm. Simulate realistic and statistically valid viewer drop-off analytics for tutorials or outlines. Return structured JSON.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["retentionPoints", "alerts"],
        properties: {
          retentionPoints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["time", "retention"],
              properties: {
                time: { type: Type.STRING },
                retention: { type: Type.INTEGER }
              }
            }
          },
          alerts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["time", "dropVal", "alertMessage", "fixAction"],
              properties: {
                time: { type: Type.STRING },
                dropVal: { type: Type.INTEGER },
                alertMessage: { type: Type.STRING },
                fixAction: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    if (isGeminiException(error) && isDemoMode(req)) {
      logGeminiException("Retention Predictor", error);
      const fallbackData = getLocalPredictRetention(req.body.outline);
      return res.json({ ...fallbackData, isFallback: true, geminiLimitReached: true });
    }
    console.error("Predict retention engine failed:", error);
    res.status(500).json({ error: error.message || "Failed to plot predicted retention." });
  }
});


// --- 3. API Endpoint: Anti-Clickbait Title Auditor ---
app.post("/api/title-auditor", async (req, res) => {
  try {
    const { title, outline, styleGoal } = req.body;
    if (!title || !outline) {
      return res.status(400).json({ error: "title and concept outlines are required." });
    }

    if (!hasLLM(req)) {
      if (isDemoMode(req)) {
        const data = getLocalTitleAuditor(title, outline, styleGoal);
        return res.json({ ...data, isFallback: true });
      } else {
        return res.status(401).json({ error: "Gemini API key is required to audit title clickbait." });
      }
    }

    const response = await runLLMRequest(req, {
      contents: `Audit this proposed title against the script outline:
Proposed Title: ${title}
Concept Outline / Script: ${outline}
Audience Style Goal: ${styleGoal || "Broad Hyper-Viral Mode"}

Assess:
1. trustScore: 1-100 rating based on clickbait truthfulness.
2. clickScore: 1-100 rating based on curiosity/interest triggers.
3. isTooSensationalized: Boolean value if the title is deceptive/exaggerated.
4. balancedTitles: Create exactly 3 clean, click-worthy titles balancing CTR with long-term brand trust.`,
      systemInstruction: "You are an elite Creator Ethics and Audience Trust and Loyalty Auditor for top-tier digital media creators. Output structured JSON.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["trustScore", "clickScore", "isTooSensationalized", "balancedTitles"],
        properties: {
          trustScore: { type: Type.INTEGER },
          clickScore: { type: Type.INTEGER },
          isTooSensationalized: { type: Type.BOOLEAN },
          balancedTitles: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Must contain exactly 3 balanced alternatives"
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    if (isGeminiException(error) && isDemoMode(req)) {
      logGeminiException("Title Auditor", error);
      const fallbackData = getLocalTitleAuditor(req.body.title, req.body.outline, req.body.styleGoal);
      return res.json({ ...fallbackData, isFallback: true, geminiLimitReached: true });
    }
    console.error("Audit Clickbait API failed:", error);
    res.status(500).json({ error: error.message || "Failed to execute Clickbait Trust audit." });
  }
});


// --- 4. API Endpoint: Shorts Funnel Campaign Generator ---
app.post("/api/generate-shorts-funnel", async (req, res) => {
  try {
    const { scriptBreakdown } = req.body;
    if (!scriptBreakdown || scriptBreakdown.trim().length === 0) {
      return res.status(400).json({ error: "Content script breakdown is required." });
    }

    if (!hasLLM(req)) {
      if (isDemoMode(req)) {
        const data = getLocalGenerateShortsFunnel(scriptBreakdown);
        return res.json({ ...data, isFallback: true });
      } else {
        return res.status(401).json({ error: "Gemini API key is required to generate shorts campaigns." });
      }
    }

    const response = await runLLMRequest(req, {
      contents: `Design a vertical video shorts campaign funnel strategy using this screenoutline content:
${scriptBreakdown}

Identify exactly 3 dynamic segments to serve as reels/shorts. For each segment, output: TimestampLocation, ShortHook, TheCliffhanger, and CallToAction.`,
      systemInstruction: "You are a master of multi-channel social media conversions and TikTok micro-retention structures. Output structured JSON mapping shorts strategy.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["campaignSegments"],
        properties: {
          campaignSegments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["timestampLocation", "shortHook", "theCliffhanger", "callToAction"],
              properties: {
                timestampLocation: { type: Type.STRING, description: "Logical timeline range, e.g. '01:10 - 01:30'" },
                shortHook: { type: Type.STRING, description: "A high curiosity custom recorded intro phrase script" },
                theCliffhanger: { type: Type.STRING, description: "The visual/auditory loop-break cutoff spot" },
                callToAction: { type: Type.STRING, description: "Specific CTA driving to long-form video click" }
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    if (isGeminiException(error) && isDemoMode(req)) {
      logGeminiException("Shorts Funnel Generator", error);
      const fallbackData = getLocalGenerateShortsFunnel(req.body.scriptBreakdown);
      return res.json({ ...fallbackData, isFallback: true, geminiLimitReached: true });
    }
    console.error("Shorts campaign generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate Shorts Campaigns funnel." });
  }
});


// --- 5. API Endpoint: Sponsorship & Monetization Calculator ---
app.post("/api/calculate-sponsorship", async (req, res) => {
  try {
    const { niche, averageViewCount, topGeographicLocation, sponsorshipType } = req.body;
    if (!niche || !averageViewCount) {
      return res.status(400).json({ error: "Sponsorship requires niche and average views metrics." });
    }

    if (!hasLLM(req)) {
      if (isDemoMode(req)) {
        const data = getLocalCalculateSponsorship(niche, Number(averageViewCount), topGeographicLocation, sponsorshipType);
        return res.json({ ...data, isFallback: true });
      } else {
        return res.status(401).json({ error: "Gemini API key is required to calculate sponsorships." });
      }
    }

    const response = await runLLMRequest(req, {
      contents: `Simulate high-yield advertising evaluations.
Niche: ${niche}
Average View Count: ${averageViewCount}
Geographic concentration: ${topGeographicLocation || "Global"}
Sponsorship Integration: ${sponsorshipType || "30-second mid-roll integration"}

Return:
1. baselineSponsorshipValue: suggested brand-deal fair pricing range.
2. pitchAngle: 3 custom sales pitching arguments justifying this rate based on audience.
3. negotiationSafetyNet: minimum acceptable payout.`,
      systemInstruction: "You are an elite YouTube sponsorships agent specializing in maximizing creator earnings. Output structured JSON.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["baselineSponsorshipValue", "pitchAngle", "negotiationSafetyNet"],
        properties: {
          baselineSponsorshipValue: { type: Type.STRING },
          pitchAngle: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Contains exactly 3 custom pitch angles" },
          negotiationSafetyNet: { type: Type.STRING }
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    if (isGeminiException(error) && isDemoMode(req)) {
      logGeminiException("Sponsorship Calculator", error);
      const fallbackData = getLocalCalculateSponsorship(req.body.niche, Number(req.body.averageViewCount), req.body.topGeographicLocation, req.body.sponsorshipType);
      return res.json({ ...fallbackData, isFallback: true, geminiLimitReached: true });
    }
    console.error("Monetization calculation failed:", error);
    res.status(500).json({ error: error.message || "Failed to calculate monetization metrics." });
  }
});


// Vite Dev Server Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`YouTube Analytics & AI Coach server running on http://localhost:${PORT}`);
  });
}

startServer();
