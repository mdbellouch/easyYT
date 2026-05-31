import { ChannelData, VideoData, TitleAnalysisResult, KeywordAnalysisResult } from "./types";

export const SANDBOX_CHANNEL: ChannelData = {
  id: "UCv_ForgeTech84.2K",
  title: "CreatorForge Tech & Code",
  description: "Deep dive coding tutorials, framework reviews, tech tool integrations, and AI product building. New videos every Wednesday at 5 PM EST!",
  customUrl: "@creatorforge_tech",
  publishedAt: "2023-01-15T08:12:00Z",
  thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80",
  viewCount: 4892410,
  subscriberCount: 84200,
  videoCount: 114,
  bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=300&q=80",
  country: "US"
};

export const SANDBOX_VIDEOS: VideoData[] = [
  {
    id: "vid-001",
    title: "Vibe-Coding a full SaaS in 45 Minutes with Gemini 3.5 Pro 🚀",
    description: "In this tutorial we show you how to vibe-code a full stack SaaS using standard Node.js, Express, Tailwind, and the new Gemini models. Learn standard practices on prompting, code integration, and deployment.",
    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=350&h=200&q=80",
    publishedAt: "2026-05-18T17:00:00Z",
    duration: "PT45M12S",
    viewCount: 28410,
    likeCount: 1942,
    commentCount: 218,
    tags: ["gemini-pro", "vibe-coding", "coding-agent", "saas-tutorial", "nextjs"],
    category: "Science & Technology",
    ctr: 8.9,
    averageViewDuration: 1318, // ~22 minutes -> 48% AVD
    retentionScore: 84,
    seoScore: 92
  },
  {
    id: "vid-002",
    title: "We Built an Autonomous Coding Agent in Standard React. (It's insane)",
    description: "We are building an agent from scratch without relying on complex, bloated frameworks. In-depth review of token buffers, systemic state, and prompt-injections.",
    thumbnailUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=350&h=200&q=80",
    publishedAt: "2026-05-11T16:45:00Z",
    duration: "PT28M15S",
    viewCount: 42190,
    likeCount: 3120,
    commentCount: 452,
    tags: ["autonomous-agent", "developer-agent", "ai-programmer", "javascript"],
    category: "Science & Technology",
    ctr: 11.2,
    averageViewDuration: 792, // ~13.2 minutes -> 47% AVD
    retentionScore: 78,
    seoScore: 88
  },
  {
    id: "vid-003",
    title: "TypeScript is DEAD? Why Standard JS with JSDoc is Taking Over.",
    description: "Why several major open-source libraries are moving away from build-step TypeScript compilation in favor of standard ES Modules documented with strict JSDoc comments.",
    thumbnailUrl: "https://images.unsplash.com/photo-1516116211223-4c359a36beec?auto=format&fit=crop&w=350&h=200&q=80",
    publishedAt: "2026-04-28T17:00:00Z",
    duration: "PT18M40S",
    viewCount: 112000,
    likeCount: 8900,
    commentCount: 1840,
    tags: ["typescript", "javascript", "jsdoc", "software-engineering", "webdev"],
    category: "Science & Technology",
    ctr: 14.1,
    averageViewDuration: 520, // ~8.6 minutes -> 46% AVD
    retentionScore: 95,
    seoScore: 82
  },
  {
    id: "vid-004",
    title: "How I Use Tailwind CSS v4 in Large Production Projects without Mess.",
    description: "Tailwind v4 is here! In this walk-through I share CSS variables tricks, standard responsive grids, theme customizations, and tips for keeping your HTML readable.",
    thumbnailUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=350&h=200&q=80",
    publishedAt: "2026-04-14T17:00:00Z",
    duration: "PT15M30S",
    viewCount: 19800,
    likeCount: 1450,
    commentCount: 104,
    tags: ["tailwindcss", "tailwind-v4", "design-system", "css-framework", "web-ui"],
    category: "Science & Technology",
    ctr: 5.6,
    averageViewDuration: 410, // ~6.8 minutes -> 44% AVD
    retentionScore: 65,
    seoScore: 95
  },
  {
    id: "vid-005",
    title: "Stop Using useEffect for Fetching Data. Do This Instead.",
    description: "Avoid infinite re-renders and memory leaks. In this video, we review standard fetching options in React, SWR, React Query, and how to cache queries efficiently.",
    thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=350&h=200&q=80",
    publishedAt: "2026-03-30T17:05:00Z",
    duration: "PT21M02S",
    viewCount: 65400,
    likeCount: 5100,
    commentCount: 780,
    tags: ["reactjs", "useeffect", "react-fetching", "swr", "frontend-performance"],
    category: "Science & Technology",
    ctr: 9.8,
    averageViewDuration: 620, // ~10.3 minutes -> 49% AVD
    retentionScore: 81,
    seoScore: 90
  },
  {
    id: "vid-006",
    title: "10 Coding Extensions You NEED in 2026 (Not copilot)",
    description: "A roundup of standard developer extensions that speed up typing, simplify Git review, inspect colors, format schemas, and solve code issues autonomously.",
    thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=350&h=200&q=80",
    publishedAt: "2026-03-10T16:00:00Z",
    duration: "PT12M10S",
    viewCount: 34100,
    likeCount: 2190,
    commentCount: 94,
    tags: ["vscode-extensions", "developer-tools", "coding-hacks", "productive-dev"],
    category: "Science & Technology",
    ctr: 7.2,
    averageViewDuration: 380, // ~6.3 minutes -> 52% AVD
    retentionScore: 70,
    seoScore: 75
  }
];

// Sandbox Gaming Channel Data Setup
export const SANDBOX_CHANNEL_GAMING: ChannelData = {
  id: "UC_LevelUpGaming",
  title: "LevelUp Gaming Guides",
  description: "Your supreme hub for RPG breakdowns, FPS movement strategies, game design critiques, and hidden speedrun mechanics. New guides and reviews weekly!",
  customUrl: "@levelup_gaming",
  publishedAt: "2024-03-10T14:22:00Z",
  thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&h=150&q=80",
  viewCount: 12550300,
  subscriberCount: 245000,
  videoCount: 184,
  bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&h=300&q=80",
  country: "US"
};

export const SANDBOX_VIDEOS_GAMING: VideoData[] = [
  {
    id: "gvid-001",
    title: "How I Hit Unreal Rank in Fortnite (Without Using Macros) 🏆",
    description: "Full breakdown of standard crosshair placement, keyboard keybind optimization, and high-ground rotations in Fortnite Ranked. Complete tactical movement overview.",
    thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=350&h=200&q=80",
    publishedAt: "2026-05-20T17:00:00Z",
    duration: "PT15M42S",
    viewCount: 88400,
    likeCount: 6500,
    commentCount: 912,
    tags: ["fortnite", "unreal-rank", "gaming-guide", "movement-tutorial", "fortnite-ranked"],
    category: "Gaming",
    ctr: 12.8,
    averageViewDuration: 520,
    retentionScore: 82,
    seoScore: 94
  },
  {
    id: "gvid-002",
    title: "10 Mind-Blowing World Records Broken by Game Bugs and Glitches",
    description: "We analyze the programming bugs and code flaws that speedrunners utilize to skip entire acts in masterpieces like Elden Ring, Zelda, and Portal.",
    thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=350&h=200&q=80",
    publishedAt: "2026-05-12T16:00:00Z",
    duration: "PT24M10S",
    viewCount: 145000,
    likeCount: 12100,
    commentCount: 1420,
    tags: ["speedrun", "gaming-glitches", "elden-ring", "zelda", "game-design"],
    category: "Gaming",
    ctr: 14.5,
    averageViewDuration: 850,
    retentionScore: 88,
    seoScore: 89
  },
  {
    id: "gvid-003",
    title: "Why RPGs Feel Boring Now. (The Dev Math Behind Quests)",
    description: "An investigative design critique on how open-world RPG scaling mechanics, filler fetch-quests, and standardized looting formulas have watered down dopamine responses.",
    thumbnailUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=350&h=200&q=80",
    publishedAt: "2026-04-29T17:00:00Z",
    duration: "PT19M15S",
    viewCount: 220000,
    likeCount: 18400,
    commentCount: 3104,
    tags: ["rpg-design", "game-theory", "open-world", "video-game-mechanics", "review"],
    category: "Gaming",
    ctr: 15.2,
    averageViewDuration: 710,
    retentionScore: 92,
    seoScore: 85
  },
  {
    id: "gvid-004",
    title: "I Tried Speedrunning Minecraft for 100 Hours Straight. (Pain.)",
    description: "The complete psychological logs of a gamer trying to break the 15-minute barrier on standard random seed generation in Minecraft. Hacks, failures, and minor triumphs.",
    thumbnailUrl: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=350&h=200&q=80",
    publishedAt: "2026-04-10T15:00:00Z",
    duration: "PT30M00S",
    viewCount: 74200,
    likeCount: 4900,
    commentCount: 520,
    tags: ["minecraft", "speedrun-minecraft", "personal-challenge", "gaming-marathon"],
    category: "Gaming",
    ctr: 6.4,
    averageViewDuration: 620,
    retentionScore: 50,
    seoScore: 78
  }
];

// Sandbox Culinary Channel Data Setup
export const SANDBOX_CHANNEL_CULINARY: ChannelData = {
  id: "UC_MammasKitchen",
  title: "Mamma's Kitchen Recipes",
  description: "Comfort food made accessible. From foolproof yeast starters and flaky sourdough doughs to family dinners ready in under 20 minutes. Welcome to my dining table!",
  customUrl: "@mammas_kitchen",
  publishedAt: "2022-06-20T09:45:00Z",
  thumbnailUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=150&h=150&q=80",
  viewCount: 2195000,
  subscriberCount: 56900,
  videoCount: 82,
  bannerUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&h=300&q=80",
  country: "CA"
};

export const SANDBOX_VIDEOS_CULINARY: VideoData[] = [
  {
    id: "cvid-001",
    title: "The Absolute Best Sourdough Starter from Scratch (Foolproof) 🍞",
    description: "Step-by-step masterclass on biological yeast cultivation using standard unbleached flour and spring water. Stop failing sourdough starters once and for all.",
    thumbnailUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=350&h=200&q=80",
    publishedAt: "2026-05-19T14:00:00Z",
    duration: "PT18M12S",
    viewCount: 31000,
    likeCount: 2840,
    commentCount: 394,
    tags: ["sourdough", "sourdough-starter", "baking-tutorial", "artisanal-bread", "yeast-starter"],
    category: "Howto & Style",
    ctr: 10.4,
    averageViewDuration: 654,
    retentionScore: 85,
    seoScore: 91
  },
  {
    id: "cvid-002",
    title: "5 Knife Skills Every Single Home Cook Needs to Master Immediately",
    description: "A professional chef details the standard math of speed, safety, and leverage. Learn how to dice onions, chiffonade basil, and batonet carrots like a pro.",
    thumbnailUrl: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=350&h=200&q=80",
    publishedAt: "2026-05-08T15:30:00Z",
    duration: "PT11M45S",
    viewCount: 58000,
    likeCount: 4200,
    commentCount: 412,
    tags: ["knife-skills", "cooking-basics", "home-cooking", "kitchen-prep", "culinary-tutorial"],
    category: "Howto & Style",
    ctr: 8.1,
    averageViewDuration: 412,
    retentionScore: 79,
    seoScore: 82
  },
  {
    id: "cvid-003",
    title: "We Made a 3-Course Restaurant Dinner in a Tiny College Dorm Room",
    description: "No full kitchen? No stove? Watch us execute an upscale steak, handmade carbonara, and molten lava cakes utilizing only a microwave, toaster, and single hotplate.",
    thumbnailUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=350&h=200&q=80",
    publishedAt: "2026-04-20T17:00:00Z",
    duration: "PT25M00S",
    viewCount: 114000,
    likeCount: 9800,
    commentCount: 1120,
    tags: ["dorm-cooking", "microwave-steak", "carbonara", "cooking-hacks", "budget-meals"],
    category: "Entertainment",
    ctr: 13.9,
    averageViewDuration: 790,
    retentionScore: 80,
    seoScore: 87
  }
];

export const SANDBOX_TITLE_ANALYSIS: TitleAnalysisResult = {
  score: 64,
  feedback: "The current title has moderate search value but lacks strong visual friction or a curiosity gap. It communicates the technical content clearly, but won't entice passive scrollers.",
  strengths: [
    "Mentions 'Gemini 3.5 Pro' which is a highly searchable trending topic.",
    "Using rocket emoji provides minor search feed attention.",
    "Mentions 'SaaS' clearly targeting developer search queries."
  ],
  weaknesses: [
    "At 68 characters, it runs close to truncation thresholds on mobile displays (maximum 60 recommended).",
    "Missing highly emotional or urgent click triggers.",
    "Does not create immediate curiosity—it sounds like a standard lecture rather than an exciting breakthrough."
  ],
  suggestions: [
    {
      suggestedTitle: "I Vibe-Coded a Full SaaS in 45 Mins. (Here is what happened)",
      ctrAngle: "Introduces first-person storytelling and narrative intrigue ('what happened'), which spikes CTR drastically on YouTube.",
      vibe: "Intriguing & Experiential Storytelling"
    },
    {
      suggestedTitle: "Vibe-Coding is Wild. SaaS Built in 45 Minutes with Gemini!",
      ctrAngle: "Shorter display length. Leverages a strong starting hook ('is Wild') to immediately stop scroll inertia.",
      vibe: "Extreme Contrast & High Energy"
    },
    {
      suggestedTitle: "Coding is Dead? I Built a Full SaaS in 45 Mins with AI",
      ctrAngle: "Combines a polarizing, curiosity-inducing question ('Coding is Dead?') with rapid practical verification.",
      vibe: "Polarizing Curiosity Gap"
    }
  ]
};

export const SANDBOX_KEYWORDS_ANALYSIS: KeywordAnalysisResult = {
  seedKeyword: "vibe-coding",
  overallVerdict: "This keyword is experiencing a monumental trend upward in developer circles. It enjoys extreme search volume momentum but has low-to-medium competition because legacy SEO tag setups haven't fully indexed this terminology yet. It's an absolute goldmine for tech creators right now.",
  relatedKeywords: [
    {
      term: "what is vibe coding",
      estimatedVolumeScore: 88,
      competitionIndex: 12,
      relevanceScore: 98,
      recommendedUse: "Title extension or first line of description"
    },
    {
      term: "vibe coding tutorial",
      estimatedVolumeScore: 74,
      competitionIndex: 18,
      relevanceScore: 95,
      recommendedUse: "Add as video tag and playlist title"
    },
    {
      term: "coding with gemini 3.5",
      estimatedVolumeScore: 92,
      competitionIndex: 34,
      relevanceScore: 89,
      recommendedUse: "Primary video tag and description keywords"
    },
    {
      term: "ai coding agent react",
      estimatedVolumeScore: 65,
      competitionIndex: 28,
      relevanceScore: 78,
      recommendedUse: "Secondary video tag and metadata snippet"
    },
    {
      term: "auto developer agents tutorial",
      estimatedVolumeScore: 54,
      competitionIndex: 20,
      relevanceScore: 70,
      recommendedUse: "Tag list"
    }
  ]
};

// Growth ideas used for AI coach questions
export const ACTIONABLE_CHALLENGES = [
  {
    title: "Double the CTR on Your Latest Video",
    description: "Optimize title with a psychological curiosity gap or high-contrast thumb text.",
    impact: "CTR + 4% to 8%"
  },
  {
    title: "Fix the 30-Second Retention Drop-off",
    description: "Write an urgent 'No-Fluff' hook that cuts standard introductions down to under 5 seconds.",
    impact: "AVD +15%"
  },
  {
    title: "Monetize Developer Traffic Better",
    description: "Integrate a contextual SaaS sponsorship or standard open-source developer tool widget.",
    impact: "RPM +$12"
  }
];
