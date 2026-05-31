import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, Eye, Film, BarChart3, TrendingUp, Sparkles, AlertCircle, Plus, 
  Trash2, Search, ArrowUpRight, Award, RefreshCw, Zap, Lightbulb, Bot, Check, ShieldAlert
} from "lucide-react";
import { 
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, 
  ZAxis, Tooltip, Legend, BarChart, Bar, CartesianGrid
} from "recharts";
import { ChannelData } from "../types";

interface CompetitorChannel {
  id: string;
  title: string;
  customUrl: string;
  thumbnailUrl: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  avgViewsPerVideo: number;
  primaryTags: string[];
  recentVideoTitle: string;
  recentVideoViews: number;
  marketSharePct: number;
}

interface CompetitorTrackerProps {
  channel: ChannelData | null;
  onNavigateToTab: (tabId: string, customPrompt?: string) => void;
}

import { getChannelNiche, NicheCategory, NICHE_LABELS } from "../utils/niche";

// Pre-seeded lists across supported niches for instant high-fidelity feedback (6 to 20)
const TECH_COMPETITORS: CompetitorChannel[] = [
  { id: "comp-t1", title: "TechCraft Pro", customUrl: "@tech_craft_pro", thumbnailUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=80&q=80", subscriberCount: 165000, viewCount: 9400000, videoCount: 210, avgViewsPerVideo: 45000, primaryTags: ["Next.js", "React Hooks", "SaaS"], recentVideoTitle: "Next.js 15 Server Components: Performance Shock!", recentVideoViews: 38400, marketSharePct: 18.5 },
  { id: "comp-t2", title: "SaaS Academy", customUrl: "@saas_academy", thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=80&q=80", subscriberCount: 92000, viewCount: 5200000, videoCount: 145, avgViewsPerVideo: 35000, primaryTags: ["Supabase", "Stripe", "SaaS Builder"], recentVideoTitle: "I built standard SaaS in 10 minutes (Zero-Code Prompting)", recentVideoViews: 14800, marketSharePct: 10.4 },
  { id: "comp-t3", title: "ByteSize Code", customUrl: "@bytesize_code", thumbnailUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=80&q=80", subscriberCount: 74000, viewCount: 3900000, videoCount: 185, avgViewsPerVideo: 21000, primaryTags: ["TypeScript", "JSDoc", "ES Modules"], recentVideoTitle: "Stop using TypeScript compilation: JSDoc tips guide", recentVideoViews: 29000, marketSharePct: 8.3 },
  { id: "comp-t4", title: "WebDev Frontiers", customUrl: "@webdev_frontiers", thumbnailUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=80&q=80", subscriberCount: 121000, viewCount: 6800000, videoCount: 220, avgViewsPerVideo: 31000, primaryTags: ["TailwindCSS v4", "Vite JS", "Web UI"], recentVideoTitle: "CSS Variables standard setup Secrets in Tailwind v4", recentVideoViews: 12500, marketSharePct: 13.6 },
  { id: "comp-t5", title: "The Pragmatic Agent", customUrl: "@pragmatic_agent", thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80", subscriberCount: 81200, viewCount: 4100000, videoCount: 89, avgViewsPerVideo: 46000, primaryTags: ["Gemini Pro", "AI Agent", "Automated Agents"], recentVideoTitle: "Vibe-coding robust browser integrations with cursor composer", recentVideoViews: 24000, marketSharePct: 9.1 },
  { id: "comp-t6", title: "React Wizard", customUrl: "@react_wizard", thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=80&q=80", subscriberCount: 52000, viewCount: 2400000, videoCount: 104, avgViewsPerVideo: 23000, primaryTags: ["React 19", "useEffect Hooks", "SWR caching"], recentVideoTitle: "Why your components re-render infinitely (and how to fix)", recentVideoViews: 18200, marketSharePct: 5.8 },
  { id: "comp-t7", title: "FullStack Mastery", customUrl: "@fullstack_mastery", thumbnailUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=80&q=80", subscriberCount: 230000, viewCount: 18200000, videoCount: 420, avgViewsPerVideo: 43000, primaryTags: ["Express Backend", "Node.js ESM", "Docker"], recentVideoTitle: "Deploying production pipelines with custom scripts and CJS", recentVideoViews: 51200, marketSharePct: 25.8 },
  { id: "comp-t8", title: "Prompt Pioneers", customUrl: "@prompt_pioneers", thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=80&q=80", subscriberCount: 48000, viewCount: 1900000, videoCount: 62, avgViewsPerVideo: 30000, primaryTags: ["Gemini 3.5 Flash", "Prompt engineering"], recentVideoTitle: "Gemini Structured systemInstruction schemas ultimate guide", recentVideoViews: 11000, marketSharePct: 5.4 }
];

const GAMING_COMPETITORS: CompetitorChannel[] = [
  { id: "comp-g1", title: "Pixel Speedrun Esports", customUrl: "@pixel_speedrun", thumbnailUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=80&q=80", subscriberCount: 240000, viewCount: 15400000, videoCount: 380, avgViewsPerVideo: 40000, primaryTags: ["Elden Ring", "Speedruns", "Ranked"], recentVideoTitle: "Elden Ring DLC expansion: Standard Level 1 speedrun guides", recentVideoViews: 65000, marketSharePct: 22.4 },
  { id: "comp-g2", title: "Ranked Legends Lobby", customUrl: "@ranked_legends", thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=80&q=80", subscriberCount: 110050, viewCount: 6100000, videoCount: 194, avgViewsPerVideo: 31000, primaryTags: ["Valorant Lobby", "Apex Legends", "Flickaim tips"], recentVideoTitle: "Why global players ban Movement Dash glitches in esports", recentVideoViews: 28000, marketSharePct: 10.2 },
  { id: "comp-g3", title: "Minecraft Guild Builders", customUrl: "@minecraft_guild_builders", thumbnailUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=80&q=80", subscriberCount: 315000, viewCount: 22400000, videoCount: 410, avgViewsPerVideo: 54000, primaryTags: ["Minecraft 1.21", "Glitch setups", "Redstone hacks"], recentVideoTitle: "10 Mind-blowing Redstone trick setups you've never used", recentVideoViews: 81200, marketSharePct: 29.4 },
  { id: "comp-g4", title: "Boss Slayer Clinic", customUrl: "@boss_slayer_clinic", thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=80&q=80", subscriberCount: 88000, viewCount: 3200000, videoCount: 98, avgViewsPerVideo: 32000, primaryTags: ["Malenia Slayer", "Dark Souls Co-op", "Ranked Tier"], recentVideoTitle: "Defeating the final level trial without using physical health flasks", recentVideoViews: 19400, marketSharePct: 8.2 },
  { id: "comp-g5", title: "FlickAim master", customUrl: "@flickaim_master", thumbnailUrl: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=80&q=80", subscriberCount: 65400, viewCount: 2100000, videoCount: 112, avgViewsPerVideo: 18000, primaryTags: ["Aim secrets", "Aimbot style tracking", "Sensitivity tips"], recentVideoTitle: "High performance mouse control setting hacks for elite players", recentVideoViews: 14500, marketSharePct: 6.1 },
  { id: "comp-g6", title: "Retro Glitcher Hub", customUrl: "@retro_glitcher_hub", thumbnailUrl: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=80&q=80", subscriberCount: 145000, viewCount: 8900000, videoCount: 290, avgViewsPerVideo: 30000, primaryTags: ["Retro glitches", "Zero-Gravity tricks", "Apex Meta"], recentVideoTitle: "This broken backward bunnyhop mechanism is officially dead!", recentVideoViews: 32400, marketSharePct: 13.5 },
  { id: "comp-g7", title: "Chronos speedrunners", customUrl: "@chronos_speedrunners", thumbnailUrl: "https://images.unsplash.com/photo-1548685913-fe6578583bad?auto=format&fit=crop&w=80&q=80", subscriberCount: 54000, viewCount: 1850000, videoCount: 74, avgViewsPerVideo: 25000, primaryTags: ["Elden Ring DLC", "Co-op speedruns", "Challenging boss"], recentVideoTitle: "Malenia target checklist speedrun inside 9 minutes standard", recentVideoViews: 11200, marketSharePct: 5.0 },
  { id: "comp-g8", title: "Weaponry Database", customUrl: "@weaponry_db", thumbnailUrl: "https://images.unsplash.com/photo-1553481187-be93c21490a9?auto=format&fit=crop&w=80&q=80", subscriberCount: 59000, viewCount: 1900000, videoCount: 140, avgViewsPerVideo: 13000, primaryTags: ["Minecraft Guide", "Bleed meta", "Game patches"], recentVideoTitle: "Why the esports pros are secretly banning this sniper build", recentVideoViews: 10400, marketSharePct: 5.2 }
];

const CULINARY_COMPETITORS: CompetitorChannel[] = [
  { id: "comp-c1", title: "Sourdough Secrets Masterclass", customUrl: "@sourdough_secrets", thumbnailUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=80&q=80", subscriberCount: 142000, viewCount: 7100000, videoCount: 134, avgViewsPerVideo: 53000, primaryTags: ["Sourdough slices", "Wild yeast starters", "Flaky crust"], recentVideoTitle: "Foolproof Artisan Sourdough bread recipe: Perfect wild yeast starter!", recentVideoViews: 45000, marketSharePct: 18.2 },
  { id: "comp-c2", title: "The Yeast Connection", customUrl: "@yeast_connection", thumbnailUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=80&q=80", subscriberCount: 88000, viewCount: 4200000, videoCount: 110, avgViewsPerVideo: 38000, primaryTags: ["No-knead sourdough", "Yeast poolish", "Croissant block"], recentVideoTitle: "Why sourdough is actually healthy for your stomach chemistry!", recentVideoViews: 19200, marketSharePct: 11.3 },
  { id: "comp-c3", title: "Artisan Kneads Home Cooking", customUrl: "@artisan_kneads", thumbnailUrl: "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=80&q=80", subscriberCount: 195000, viewCount: 11400000, videoCount: 220, avgViewsPerVideo: 51000, primaryTags: ["Crust crispy secret", "French pastries", "Apple pies"], recentVideoTitle: "Grandma's secret ingredient for fluffy pastry crust", recentVideoViews: 54000, marketSharePct: 25.0 },
  { id: "comp-c4", title: "Grandma's Flour Sack", customUrl: "@grandmas_flour_sack", thumbnailUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=80&q=80", subscriberCount: 54000, viewCount: 1900000, videoCount: 84, avgViewsPerVideo: 22000, primaryTags: ["Baking cinnamon", "Kitchen recipes", "Molten cakes"], recentVideoTitle: "Baking perfect Cocoa Fudge Cake without standard ovens", recentVideoViews: 12100, marketSharePct: 6.9 },
  { id: "comp-c5", title: "Sweet Butter Baking", customUrl: "@sweet_butter_baking", thumbnailUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=80&q=80", subscriberCount: 71000, viewCount: 2800000, videoCount: 102, avgViewsPerVideo: 27000, primaryTags: ["Buttery croissants", "Casseroles", "Baking hooks"], recentVideoTitle: "This 3-ingredient dessert pie is taking over social feeds", recentVideoViews: 18400, marketSharePct: 9.1 },
  { id: "comp-c6", title: "The Crispy Dutch", customUrl: "@crispy_dutch", thumbnailUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=80&q=80", subscriberCount: 120000, viewCount: 5900000, videoCount: 160, avgViewsPerVideo: 36000, primaryTags: ["Pan loaves", "Long rise fermentation", "Toaster ovens"], recentVideoTitle: "Why we fermented wild yeast sourdough standard starter for 12 hours", recentVideoViews: 28900, marketSharePct: 15.4 },
  { id: "comp-c7", title: "Pastry Guild Bakeries", customUrl: "@pastry_guild", thumbnailUrl: "https://images.unsplash.com/photo-1513262621280-9302e1a597e1?auto=format&fit=crop&w=80&q=80", subscriberCount: 62000, viewCount: 2200000, videoCount: 92, avgViewsPerVideo: 23000, primaryTags: ["French cinnamon pastry", "Artisan biscuits", "Yeast poolish"], recentVideoTitle: "Yeast tutorial: Sourdough pastry block beginner masterclass", recentVideoViews: 10200, marketSharePct: 7.9 },
  { id: "comp-c8", title: "Rustic Starter Clinic", customUrl: "@rustic_starter_clinic", thumbnailUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=80&q=80", subscriberCount: 48000, viewCount: 1500000, videoCount: 52, avgViewsPerVideo: 28000, primaryTags: ["Sourdough slices", "Starter revival", "No dutch oven"], recentVideoTitle: "Why sourdough yeast helper starters sink or fail (And simple hacks)", recentVideoViews: 8900, marketSharePct: 6.0 }
];

const FINANCE_COMPETITORS: CompetitorChannel[] = [
  { id: "comp-f1", title: "Wealth Compounders", customUrl: "@wealth_compounders", thumbnailUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=80&q=80", subscriberCount: 145000, viewCount: 6100000, videoCount: 176, avgViewsPerVideo: 34700, primaryTags: ["Dividends", "ETFs", "Stocks"], recentVideoTitle: "Top 3 Dividend Stocks to buy and hold forever", recentVideoViews: 31000, marketSharePct: 15.1 },
  { id: "comp-f2", title: "Crypto Pulse", customUrl: "@crypto_pulse", thumbnailUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=80&q=80", subscriberCount: 220000, viewCount: 12300000, videoCount: 310, avgViewsPerVideo: 42000, primaryTags: ["Bitcoin", "Ethereum", "Crypto"], recentVideoTitle: "The Crypto Bull Run has officially begun: What to buy now", recentVideoViews: 41200, marketSharePct: 22.8 },
  { id: "comp-f3", title: "The Passive Blueprint", customUrl: "@passive_blueprint", thumbnailUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=80&q=80", subscriberCount: 84000, viewCount: 3400000, videoCount: 88, avgViewsPerVideo: 38000, primaryTags: ["Passive Income", "Side Hustles"], recentVideoTitle: "5 Lazy Side Hustles that make $100/day in 2026", recentVideoViews: 28400, marketSharePct: 9.4 },
  { id: "comp-f4", title: "Dividend Horizon", customUrl: "@dividend_horizon", thumbnailUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=80&q=80", subscriberCount: 110000, viewCount: 5200000, videoCount: 154, avgViewsPerVideo: 31050, primaryTags: ["SCHD", "High Yield"], recentVideoTitle: "SCHD vs JEPI: The Ultimate Passive Income Showdown", recentVideoViews: 24300, marketSharePct: 11.2 },
  { id: "comp-f5", title: "Value Investor Hub", customUrl: "@value_investor_hub", thumbnailUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=80&q=80", subscriberCount: 95000, viewCount: 4100000, videoCount: 112, avgViewsPerVideo: 36000, primaryTags: ["Stock Valuation", "Intrinsic Value"], recentVideoTitle: "How to value any stock in 5 minutes (Buffett formula)", recentVideoViews: 19500, marketSharePct: 8.5 },
  { id: "comp-f6", title: "Wallet Hacks", customUrl: "@wallet_hacks", thumbnailUrl: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=80&q=80", subscriberCount: 62000, viewCount: 1900000, videoCount: 94, avgViewsPerVideo: 20000, primaryTags: ["Budgeting", "Credit Cards"], recentVideoTitle: "How I use credit cards to travel for completely free", recentVideoViews: 11400, marketSharePct: 4.8 },
  { id: "comp-f7", title: "FIRE Starter", customUrl: "@fire_starter", thumbnailUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=80&q=80", subscriberCount: 125000, viewCount: 6800000, videoCount: 140, avgViewsPerVideo: 48000, primaryTags: ["Retire Early", "Index Funds"], recentVideoTitle: "My plan to retire at age 35 with $1.2M index funds", recentVideoViews: 38250, marketSharePct: 14.2 },
  { id: "comp-f8", title: "Macro Analysis", customUrl: "@macro_analysis", thumbnailUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=80&q=80", subscriberCount: 165000, viewCount: 9400000, videoCount: 210, avgViewsPerVideo: 44700, primaryTags: ["Inflation", "Macro Economy"], recentVideoTitle: "The Federal Reserve's warning for the 2026 crash", recentVideoViews: 41200, marketSharePct: 13.5 }
];

const FITNESS_COMPETITORS: CompetitorChannel[] = [
  { id: "comp-ft1", title: "Hypertrophy Science", customUrl: "@hypertrophy_science", thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=80&q=80", subscriberCount: 175000, viewCount: 8400000, videoCount: 232, avgViewsPerVideo: 36200, primaryTags: ["Bodybuilding", "Muscle Gain"], recentVideoTitle: "Scientifically proven way to trigger muscle growth faster", recentVideoViews: 29500, marketSharePct: 16.5 },
  { id: "comp-ft2", title: "Calisthenics Master", customUrl: "@calisthenics_master", thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=80&q=80", subscriberCount: 130000, viewCount: 6400000, videoCount: 160, avgViewsPerVideo: 40000, primaryTags: ["Bodyweight", "Handstands"], recentVideoTitle: "Learn to do 10 handstand pushups in 30 days (No Gym)", recentVideoViews: 34100, marketSharePct: 12.8 },
  { id: "comp-ft3", title: "Shredded Kitchen", customUrl: "@shredded_kitchen", thumbnailUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=80&q=80", subscriberCount: 91000, viewCount: 3900000, videoCount: 110, avgViewsPerVideo: 35000, primaryTags: ["Clean Eating", "Low Calorie"], recentVideoTitle: "My 400 Calorie high protein meal preps that taste amazing", recentVideoViews: 22000, marketSharePct: 9.1 },
  { id: "comp-ft4", title: "Powerlifting Pro", customUrl: "@powerlifting_pro", thumbnailUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=80&q=80", subscriberCount: 115000, viewCount: 5800000, videoCount: 142, avgViewsPerVideo: 41000, primaryTags: ["Deadlift", "Squat Form"], recentVideoTitle: "How to fix your deadlift form instantly (Avoid back pain)", recentVideoViews: 31200, marketSharePct: 11.5 },
  { id: "comp-ft5", title: "HIIT Burn Zone", customUrl: "@hiit_burn", thumbnailUrl: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=80&q=80", subscriberCount: 240000, viewCount: 15200000, videoCount: 280, avgViewsPerVideo: 54000, primaryTags: ["Fat Loss", "Home Workout"], recentVideoTitle: "15 Minute killer home workout (Burn fat, sweat crazy)", recentVideoViews: 48900, marketSharePct: 22.4 },
  { id: "comp-ft6", title: "Mobility Rehab", customUrl: "@mobility_rehab", thumbnailUrl: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=80&q=80", subscriberCount: 68000, viewCount: 2100000, videoCount: 88, avgViewsPerVideo: 23000, primaryTags: ["Posture Fix", "Stretching"], recentVideoTitle: "Do these 3 stretches every morning to fix rounded shoulders", recentVideoViews: 14800, marketSharePct: 5.5 },
  { id: "comp-ft7", title: "Run Horizon", customUrl: "@run_horizon", thumbnailUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=80&q=80", subscriberCount: 54000, viewCount: 1800050, videoCount: 75, avgViewsPerVideo: 24000, primaryTags: ["Marathon Prep", "Shoe Reviews"], recentVideoTitle: "Best running shoes of 2026: Half marathon comparison", recentVideoViews: 16500, marketSharePct: 4.8 },
  { id: "comp-ft8", title: "Yoga Flow Wellness", customUrl: "@yoga_flow", thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=80&q=80", subscriberCount: 195000, viewCount: 11400000, videoCount: 220, avgViewsPerVideo: 51800, primaryTags: ["Vinyasa", "Flexibility"], recentVideoTitle: "20 Minute deep stretch yoga flow for complete beginners", recentVideoViews: 44100, marketSharePct: 14.2 }
];

const BUSINESS_COMPETITORS: CompetitorChannel[] = [
  { id: "comp-b1", title: "Founder Playbook", customUrl: "@founder_playbook", thumbnailUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=80&q=80", subscriberCount: 135000, viewCount: 7100000, videoCount: 218, avgViewsPerVideo: 32500, primaryTags: ["SaaS Ventures", "Startups"], recentVideoTitle: "How we scaled this SaaS to $40K/month MRR in 6 months", recentVideoViews: 26000, marketSharePct: 14.1 },
  { id: "comp-b2", title: "Funnel Architect", customUrl: "@funnel_architect", thumbnailUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=80&q=80", subscriberCount: 96000, viewCount: 4200000, videoCount: 114, avgViewsPerVideo: 36800, primaryTags: ["Landing Pages", "Email Funnels"], recentVideoTitle: "The high-converting sales funnel template of 2026", recentVideoViews: 24200, marketSharePct: 9.8 },
  { id: "comp-b3", title: "Agency Scale Pro", customUrl: "@agency_scale", thumbnailUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=80&q=80", subscriberCount: 80000, viewCount: 3800000, videoCount: 92, avgViewsPerVideo: 41000, primaryTags: ["SMMA Agency", "Cold Calling"], recentVideoTitle: "How to sign high-ticket clients without selling on phone", recentVideoViews: 29500, marketSharePct: 11.5 },
  { id: "comp-b4", title: "E-commerce Blueprint", customUrl: "@ecommerce_blueprint", thumbnailUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=80&q=80", subscriberCount: 185000, viewCount: 10950000, videoCount: 210, avgViewsPerVideo: 52000, primaryTags: ["Shopify Store", "Dropshipping"], recentVideoTitle: "The 3 viral TikTok products that made $100K Shopify sales", recentVideoViews: 41200, marketSharePct: 19.5 },
  { id: "comp-b5", title: "Copywriting Secrets", customUrl: "@copywriting_secrets", thumbnailUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=80&q=80", subscriberCount: 72000, viewCount: 2800000, videoCount: 102, avgViewsPerVideo: 27400, primaryTags: ["Copywriting", "Sales Letters"], recentVideoTitle: "5 Copywriting hooks that instantly double your sales conversion", recentVideoViews: 19400, marketSharePct: 7.2 },
  { id: "comp-b6", title: "B2B Growth Engine", customUrl: "@b2b_growth", thumbnailUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=80&q=80", subscriberCount: 59000, viewCount: 1900000, videoCount: 140, avgViewsPerVideo: 13500, primaryTags: ["LinkedIn Lead", "Enterprise Sale"], recentVideoTitle: "My standard B2B email sequence that booked $80K deals", recentVideoViews: 8900, marketSharePct: 4.8 },
  { id: "comp-b7", title: "Solomon Consulting", customUrl: "@solomon_consulting", thumbnailUrl: "https://images.unsplash.com/photo-1542744094-2ab25be78b90?auto=format&fit=crop&w=80&q=80", subscriberCount: 110050, viewCount: 6100000, videoCount: 194, avgViewsPerVideo: 31400, primaryTags: ["High Ticket", "Consulting Form"], recentVideoTitle: "The step-by-step roadmap to launch a $10K consulting agency", recentVideoViews: 21000, marketSharePct: 10.2 },
  { id: "comp-b8", title: "The Lean Solopreneur", customUrl: "@solopreneur_pro", thumbnailUrl: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=80&q=80", subscriberCount: 121000, viewCount: 6800000, videoCount: 220, avgViewsPerVideo: 31000, primaryTags: ["Solo SaaS", "Stripe Integration"], recentVideoTitle: "How I runs a $15K/month micro-business alone from my laptop", recentVideoViews: 24700, marketSharePct: 12.1 }
];

const TRAVEL_COMPETITORS: CompetitorChannel[] = [
  { id: "comp-tr1", title: "Lost Nomad Diaries", customUrl: "@lost_nomad", thumbnailUrl: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=80&q=80", subscriberCount: 185000, viewCount: 9200000, videoCount: 215, avgViewsPerVideo: 42700, primaryTags: ["Budget Escape", "Solo Nomad"], recentVideoTitle: "What $1,000 gets you in Bali, Indonesia in 2026", recentVideoViews: 38200, marketSharePct: 16.5 },
  { id: "comp-tr2", title: "Luxury Escapes", customUrl: "@luxury_escapes", thumbnailUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=80&q=80", subscriberCount: 320000, viewCount: 22400000, videoCount: 380, avgViewsPerVideo: 58900, primaryTags: ["Maldives Resorts", "Luxury Tours"], recentVideoTitle: "Sleeping in an ultra $15,000/night underwater villa!", recentVideoViews: 81200, marketSharePct: 28.5 },
  { id: "comp-tr3", title: "Flight Hacks", customUrl: "@flight_hacks", thumbnailUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=80&q=80", subscriberCount: 145000, viewCount: 8900000, videoCount: 290, avgViewsPerVideo: 30600, primaryTags: ["Credit Card Points", "Seat Upgrades"], recentVideoTitle: "How I upgraded to standard First Class Emirates flight for $80", recentVideoViews: 26500, marketSharePct: 11.2 },
  { id: "comp-tr4", title: "Vanlife Roadtrip", customUrl: "@vanlife_roadtrip", thumbnailUrl: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=80&q=80", subscriberCount: 120000, viewCount: 5950000, videoCount: 160, avgViewsPerVideo: 37100, primaryTags: ["Sprinter Conversion", "Off-Grid Build"], recentVideoTitle: "Sprinter van transformation tour: Tiny home on wheels!", recentVideoViews: 32100, marketSharePct: 10.9 },
  { id: "comp-tr5", title: "Backpacking Asia", customUrl: "@backpacking_asia", thumbnailUrl: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=80&q=80", subscriberCount: 88000, viewCount: 3200000, videoCount: 145, avgViewsPerVideo: 22000, primaryTags: ["Street Food", "Thailand Guide"], recentVideoTitle: "Backpacking Bangkok on a strict $20 a day budget", recentVideoViews: 14100, marketSharePct: 6.8 },
  { id: "comp-tr6", title: "Island Wanderer", customUrl: "@island_wanderer", thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=80&q=80", subscriberCount: 65400, viewCount: 2100000, videoCount: 112, avgViewsPerVideo: 18700, primaryTags: ["Philippines Tour", "Snorkeling"], recentVideoTitle: "Exploring the hidden lagoons of El Nido, Palawan", recentVideoViews: 11500, marketSharePct: 4.8 },
  { id: "comp-tr7", title: "Hidden Europe", customUrl: "@hidden_europe", thumbnailUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=80&q=80", subscriberCount: 74000, viewCount: 3900000, videoCount: 185, avgViewsPerVideo: 21000, primaryTags: ["Train Travel", "Prague Guides"], recentVideoTitle: "10 European towns that feel like a fairytale (and are cheap!)", recentVideoViews: 16800, marketSharePct: 5.5 },
  { id: "comp-tr8", title: "Adventure Bound", customUrl: "@adventure_bound", thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=80&q=80", subscriberCount: 92000, viewCount: 5200000, videoCount: 145, avgViewsPerVideo: 35800, primaryTags: ["Hiking Trails", "Mountain Climb"], recentVideoTitle: "Challenging the Swiss Alps: Winter backpacking guide", recentVideoViews: 22000, marketSharePct: 9.2 }
];

const SCIENCE_COMPETITORS: CompetitorChannel[] = [
  { id: "comp-sc1", title: "Physics Explained", customUrl: "@physics_explained", thumbnailUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=80&q=80", subscriberCount: 315000, viewCount: 22400000, videoCount: 410, avgViewsPerVideo: 54600, primaryTags: ["Quantum Theory", "Relativity"], recentVideoTitle: "The Quantum Double-Slit experiment simplified for anyone", recentVideoViews: 92400, marketSharePct: 29.4 },
  { id: "comp-sc2", title: "Space Horizon", customUrl: "@space_horizon", thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=80&q=80", subscriberCount: 240000, viewCount: 15400000, videoCount: 380, avgViewsPerVideo: 40500, primaryTags: ["Black Holes", "JWST Discoveries"], recentVideoTitle: "James Webb just discovered something terrifying at the edge of the universe", recentVideoViews: 81200, marketSharePct: 22.4 },
  { id: "comp-sc3", title: "Mental Math Mastery", customUrl: "@math_mastery", thumbnailUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=80&q=80", subscriberCount: 142000, viewCount: 7100000, videoCount: 134, avgViewsPerVideo: 53000, primaryTags: ["Calculus", "Mental Math"], recentVideoTitle: "Mental Math Hacks: How to multiply big numbers in seconds", recentVideoViews: 45000, marketSharePct: 14.1 },
  { id: "comp-sc4", title: "History Documentaries", customUrl: "@history_docs", thumbnailUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=80&q=80", subscriberCount: 195000, viewCount: 11400000, videoCount: 220, avgViewsPerVideo: 51800, primaryTags: ["Roman Battle", "Ancient Warfare"], recentVideoTitle: "The Battle of Cannae: Hannibal's Masterpiece tactics breakdown", recentVideoViews: 61000, marketSharePct: 18.2 },
  { id: "comp-sc5", title: "Biology Visuals", customUrl: "@biology_visuals", thumbnailUrl: "https://images.unsplash.com/photo-1530026405186-ed1eaae6ec7a?auto=format&fit=crop&w=80&q=80", subscriberCount: 110050, viewCount: 6100000, videoCount: 194, avgViewsPerVideo: 31400, primaryTags: ["DNA Sequence", "Cells"], recentVideoTitle: "How your body actually fights off a viral attack", recentVideoViews: 28000, marketSharePct: 10.2 },
  { id: "comp-sc6", title: "Deep Tech Labs", customUrl: "@deep_tech_labs", thumbnailUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=80&q=80", subscriberCount: 81200, viewCount: 4100000, videoCount: 89, avgViewsPerVideo: 46000, primaryTags: ["Fusion Energy", "Nuclear Physics"], recentVideoTitle: "Are we close to commercial nuclear fusion? A realistic analysis", recentVideoViews: 29000, marketSharePct: 8.3 },
  { id: "comp-sc7", title: "Earth Evolution", customUrl: "@earth_evolution", thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=80&q=80", subscriberCount: 71000, viewCount: 2800000, videoCount: 102, avgViewsPerVideo: 27400, primaryTags: ["Volcanoes", "Continental Drift"], recentVideoTitle: "What happens when our tectonic plates shift tomorrow?", recentVideoViews: 18450, marketSharePct: 6.0 },
  { id: "comp-sc8", title: "Science Sandbox", customUrl: "@science_sandbox", thumbnailUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=80&q=80", subscriberCount: 54005, viewCount: 1850000, videoCount: 74, avgViewsPerVideo: 25000, primaryTags: ["Fluid Dynamics", "Chemical Reactions"], recentVideoTitle: "Why dry ice and bubble soap create insane bouncy cloud spheres", recentVideoViews: 11200, marketSharePct: 5.0 }
];

const DESIGN_COMPETITORS: CompetitorChannel[] = [
  { id: "comp-d1", title: "Figma Components Guide", customUrl: "@figma_components", thumbnailUrl: "https://images.unsplash.com/photo-1541462608141-ad4979e408c9?auto=format&fit=crop&w=80&q=80", subscriberCount: 95000, viewCount: 4100000, videoCount: 112, avgViewsPerVideo: 36600, primaryTags: ["Auto-Layout", "Figma Design"], recentVideoTitle: "Figma Auto-Layout Masterclass: Solve tricky responsive sidebars", recentVideoViews: 28400, marketSharePct: 10.4 },
  { id: "comp-d2", title: "UX Design Pro", customUrl: "@ux_design_pro", thumbnailUrl: "https://images.unsplash.com/photo-1541462608141-ad4979e408c9?auto=format&fit=crop&w=80&q=80", subscriberCount: 121000, viewCount: 6800000, videoCount: 220, avgViewsPerVideo: 31000, primaryTags: ["UX Case study", "Wireframes"], recentVideoTitle: "Why your UI design feels layout dead (and how to fix contrast)", recentVideoViews: 22500, marketSharePct: 13.6 },
  { id: "comp-d3", title: "Typography Mastery", customUrl: "@typography_mastery", thumbnailUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=80&q=80", subscriberCount: 54000, viewCount: 1900000, videoCount: 84, avgViewsPerVideo: 22600, primaryTags: ["Fonts pairing", "Editorial look"], recentVideoTitle: "Stop using boring fonts! Top 5 elegant font pairings for web apps", recentVideoViews: 14100, marketSharePct: 6.9 },
  { id: "comp-d4", title: "Color Palette Secrets", customUrl: "@color_secrets", thumbnailUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=80&q=80", subscriberCount: 74000, viewCount: 3900000, videoCount: 185, avgViewsPerVideo: 21000, primaryTags: ["Contrast ratios", "Color Theory"], recentVideoTitle: "How to build beautiful high contrast dark modes step by step", recentVideoViews: 19505, marketSharePct: 8.3 },
  { id: "comp-d5", title: "Dark Theme Rules", customUrl: "@dark_theme_rules", thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80", subscriberCount: 81200, viewCount: 4100000, videoCount: 89, avgViewsPerVideo: 46000, primaryTags: ["Deep slate theme", "Visual rules"], recentVideoTitle: "The dark mode design strategy used by Apple and Stripe", recentVideoViews: 29000, marketSharePct: 9.1 },
  { id: "comp-d6", title: "Portfolio Critique Clinic", customUrl: "@portfolio_critique", thumbnailUrl: "https://images.unsplash.com/photo-1581291518655-9523c932dedf?auto=format&fit=crop&w=80&q=80", subscriberCount: 62000, viewCount: 2200000, videoCount: 92, avgViewsPerVideo: 23900, primaryTags: ["Portfolio tips", "Dribbble templates"], recentVideoTitle: "Re-designing a viewer's terrible UI portfolio: Instant Level Up!", recentVideoViews: 18450, marketSharePct: 7.9 },
  { id: "comp-d7", title: "Creative Logo Design", customUrl: "@logo_master", thumbnailUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=80&q=80", subscriberCount: 142000, viewCount: 7100000, videoCount: 134, avgViewsPerVideo: 53000, primaryTags: ["Vector logos", "Illustrator tips"], recentVideoTitle: "Designing a minimalist vector brand identity from scratch", recentVideoViews: 45000, marketSharePct: 18.2 },
  { id: "comp-d8", title: "Webflow Architect", customUrl: "@webflow_architect", thumbnailUrl: "https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=80&q=80", subscriberCount: 48000, viewCount: 1500000, videoCount: 52, avgViewsPerVideo: 28800, primaryTags: ["No-Code build", "Animations"], recentVideoTitle: "Building a complex premium landing page in Webflow in two hours", recentVideoViews: 18900, marketSharePct: 6.0 }
];

const GENERAL_COMPETITORS: CompetitorChannel[] = [
  { id: "comp-gn1", title: "Video Essay Labs", customUrl: "@essay_labs", thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=80&q=80", subscriberCount: 165000, viewCount: 9400000, videoCount: 210, avgViewsPerVideo: 45000, primaryTags: ["Nostalgia Essay", "Storytelling"], recentVideoTitle: "Why we miss the golden age of YouTube vlogging style", recentVideoViews: 38400, marketSharePct: 18.5 },
  { id: "comp-gn2", title: "Storyteller Architect", customUrl: "@story_architect", thumbnailUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=80&q=80", subscriberCount: 92000, viewCount: 5200000, videoCount: 145, avgViewsPerVideo: 35000, primaryTags: ["Hooks writing", "Pacing"], recentVideoTitle: "How to tell a compelling story that keeps viewers hooked", recentVideoViews: 14800, marketSharePct: 10.4 },
  { id: "comp-gn3", title: "Daily Routine Architect", customUrl: "@routine_pro", thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=80&q=80", subscriberCount: 74000, viewCount: 3900000, videoCount: 185, avgViewsPerVideo: 21000, primaryTags: ["Productivity", "Mindfulness"], recentVideoTitle: "My high-performance morning routine for stressless coding", recentVideoViews: 29000, marketSharePct: 8.3 },
  { id: "comp-gn4", title: "Aesthetic Room Design", customUrl: "@aesthetic_design", thumbnailUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=80&q=80", subscriberCount: 121000, viewCount: 6800000, videoCount: 220, avgViewsPerVideo: 31000, primaryTags: ["Desk tour", "RGB lights setup"], recentVideoTitle: "Re-building my minimalist workstation for complete focus", recentVideoViews: 12500, marketSharePct: 13.6 },
  { id: "comp-gn5", title: "The Productivity Catalyst", customUrl: "@productivity_catalyst", thumbnailUrl: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=80&q=80", subscriberCount: 81200, viewCount: 4100000, videoCount: 89, avgViewsPerVideo: 46000, primaryTags: ["Atomic Habits", "Notion Setup"], recentVideoTitle: "The Notion dashboard model that completely systematized my life", recentVideoViews: 24000, marketSharePct: 9.1 },
  { id: "comp-gn6", title: "Sound Design Sandbox", customUrl: "@sound_sandbox", thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=80&q=80", subscriberCount: 52000, viewCount: 2400000, videoCount: 104, avgViewsPerVideo: 23000, primaryTags: ["Ambient music", "Microphone EQ"], recentVideoTitle: "The secret EQ settings for crisp clear professional video vocals", recentVideoViews: 18200, marketSharePct: 5.8 },
  { id: "comp-gn7", title: "Simple Lifestyle Vlog", customUrl: "@lifestyle_vlogs", thumbnailUrl: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=80&q=80", subscriberCount: 230000, viewCount: 18200000, videoCount: 420, avgViewsPerVideo: 43000, primaryTags: ["Daily vlog", "Slow Living"], recentVideoTitle: "Spend a freezing snowy Sunday alone painting in my cabin", recentVideoViews: 51200, marketSharePct: 25.8 },
  { id: "comp-gn8", title: "Standard Creator Guides", customUrl: "@creator_guides", thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=80&q=80", subscriberCount: 48000, viewCount: 1900000, videoCount: 62, avgViewsPerVideo: 30000, primaryTags: ["Thumbnail guide", "CTR hacks"], recentVideoTitle: "How to master high-CTR titles without clickbait penalty", recentVideoViews: 11000, marketSharePct: 5.4 }
];

const NICHE_COMPETITORS_MAP: Record<NicheCategory, CompetitorChannel[]> = {
  tech: TECH_COMPETITORS,
  gaming: GAMING_COMPETITORS,
  cooking: CULINARY_COMPETITORS,
  finance: FINANCE_COMPETITORS,
  fitness: FITNESS_COMPETITORS,
  business: BUSINESS_COMPETITORS,
  travel: TRAVEL_COMPETITORS,
  science: SCIENCE_COMPETITORS,
  design: DESIGN_COMPETITORS,
  general: GENERAL_COMPETITORS
};

export default function CompetitorTracker({ channel, onNavigateToTab }: CompetitorTrackerProps) {
  const detectedNiche = getChannelNiche(channel);
  const [competitors, setCompetitors] = useState<CompetitorChannel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Custom competitor inputs
  const [newTitle, setNewTitle] = useState("");
  const [newSubs, setNewSubs] = useState<number>(100000);
  const [newViews, setNewViews] = useState<number>(5000000);
  const [newVideos, setNewVideos] = useState<number>(120);

  // Load niche base competitors dynamically when channel changes or mounts
  useEffect(() => {
    try {
      const saved = localStorage.getItem("yt_competitor_channels");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length >= 6) {
          setCompetitors(parsed);
          return;
        }
      }
    } catch {}

    // No local storage, load niche-specific defaults (6 to 20 competitors) using centralized mapping
    const detectedNiche = getChannelNiche(channel);
    const defaults = NICHE_COMPETITORS_MAP[detectedNiche] || GENERAL_COMPETITORS;
    setCompetitors(defaults);
  }, [channel]);

  // Sync to local storage
  useEffect(() => {
    if (competitors.length > 0) {
      localStorage.setItem("yt_competitor_channels", JSON.stringify(competitors));
    }
  }, [competitors]);

  const resetToNicheDefault = () => {
    const detectedNiche = getChannelNiche(channel);
    const defaults = NICHE_COMPETITORS_MAP[detectedNiche] || GENERAL_COMPETITORS;
    setCompetitors(defaults);
    setSuccessMsg(`Reset tracker board to default ${NICHE_LABELS[detectedNiche]} competitor profile pack (8 channels).`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (competitors.length >= 20) {
      alert("You have reached the maximum of 20 tracked competitor channels. Remove an existing competitor to insert another.");
      return;
    }

    const customId = `comp-custom-${Date.now()}`;
    const cleanUrl = `@${newTitle.toLowerCase().replace(/\s+/g, "_")}`;
    const cleanAvg = Math.round(newViews / Math.max(1, newVideos));

    const brandNew: CompetitorChannel = {
      id: customId,
      title: newTitle.trim(),
      customUrl: cleanUrl,
      thumbnailUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80&q=80`,
      subscriberCount: Number(newSubs),
      viewCount: Number(newViews),
      videoCount: Number(newVideos),
      avgViewsPerVideo: cleanAvg,
      primaryTags: ["Video Analysis", "Algorithm Hack"],
      recentVideoTitle: `How to win at YouTube: Standard ${newTitle} secrets video.`,
      recentVideoViews: Math.round(cleanAvg * 0.8),
      marketSharePct: 4.5
    };

    const nextList = [...competitors, brandNew];
    setCompetitors(nextList);
    setNewTitle("");
    setNewSubs(100000);
    setNewViews(5000000);
    setNewVideos(120);

    setSuccessMsg(`Successfully added competitor "${brandNew.title}" to tracking list.`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleRemoveCompetitor = (id: string, name: string) => {
    if (competitors.length <= 6) {
      alert("System constraint reached: In order to maintain rich comparative intelligence arrays, a minimum of 6 competitor channels is standard.");
      return;
    }
    const filtered = competitors.filter(c => c.id !== id);
    setCompetitors(filtered);
    setSuccessMsg(`Removed competitor "${name}". Current active competitors list counts ${filtered.length}.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const filteredCompetitors = useMemo(() => {
    return competitors.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [competitors, searchTerm]);

  // Benchmarking aggregate comparisons
  const benchmarkingAggregates = useMemo(() => {
    if (competitors.length === 0) return { avgSubs: 0, avgViews: 0, avgVideos: 0 };
    const sums = competitors.reduce((acc, current) => {
      acc.subs += current.subscriberCount;
      acc.views += current.viewCount;
      acc.videos += current.videoCount;
      return acc;
    }, { subs: 0, views: 0, videos: 0 });

    return {
      avgSubs: Math.round(sums.subs / competitors.length),
      avgViews: Math.round(sums.views / competitors.length),
      avgVideos: Math.round(sums.videos / competitors.length),
    };
  }, [competitors]);

  const scatterChartData = useMemo(() => {
    return competitors.map(c => ({
      name: c.title,
      subscribers: c.subscriberCount,
      videoCount: c.videoCount,
      avgViews: c.avgViewsPerVideo,
    }));
  }, [competitors]);

  const barChartCompareData = useMemo(() => {
    const list = competitors.map(c => ({
      name: c.title.substring(0, 12) + (c.title.length > 12 ? ".." : ""),
      Subscribers: c.subscriberCount,
      Videos: c.videoCount,
    }));

    // Add user's own channel as comparative bar element
    if (channel) {
      list.unshift({
        name: "YOU (Target)",
        Subscribers: channel.subscriberCount,
        Videos: channel.videoCount,
      });
    }
    return list;
  }, [competitors, channel]);

  const getSubscriberLevelStrength = (subs: number) => {
    if (subs >= 200000) return "bg-red-950/40 text-red-400 border border-red-900/40 font-bold";
    if (subs >= 100000) return "bg-amber-950/40 text-amber-400 border border-amber-900/40 font-bold";
    return "bg-[#1c1c1f] text-gray-400 border border-[#2d2d30]";
  };

  const formattedValue = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
    if (val >= 1000) return (val / 1000).toFixed(1) + "K";
    return val;
  };

  return (
    <div id="competitor-tracker-view" className="space-y-6">
      
      {/* Overview Card */}
      <div className="bg-[#111113] border border-[#222225] p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-650/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider bg-red-950/30 text-red-500 border border-red-900/40 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
              Competitor Intelligence Hub
            </span>
            <span className="text-[9px] uppercase tracking-wider bg-[#222225] text-gray-400 border border-[#333338] px-2 py-0.5 rounded-full font-mono font-bold">
              Active: {NICHE_LABELS[detectedNiche]} Portfolio
            </span>
          </div>
          <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
            <Award className="w-5 h-5 text-red-500 animate-pulse" /> Competitor Analytics Tracker (Range: 6 - 20 Channels)
          </h2>
          <p className="text-xs text-gray-400 max-w-xl font-sans">
            Compare content patterns, average view metrics, upload index scores, and position mapping for 
            <span className="text-red-400 font-semibold"> {competitors.length} competitor channels</span>. Stay between the constraint limits of 6 to 20 tracks.
          </p>
        </div>

        <button
          onClick={resetToNicheDefault}
          className="p-2 px-4 bg-gradient-to-r from-red-650 to-red-600 hover:from-red-700 text-white text-xs font-bold font-mono rounded-lg transition shrink-0 flex items-center gap-1.5 shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          Load Standard Pack
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/10 border border-emerald-900/40 text-emerald-400 rounded-lg text-xs leading-none font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Aggregate benchmarking statistics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="competitor-bento-aggregates">
        <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl flex items-center gap-4 hover:border-red-500/25 transition">
          <div className="p-3 bg-red-650/15 rounded-lg border border-red-500/20 text-red-500 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-mono block">AVERAGE COMPETITOR SUBS</span>
            <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">{formattedValue(benchmarkingAggregates.avgSubs)}</span>
            <span className="text-[9px] text-[#555] font-mono block mt-0.5">Your channel: {formattedValue(channel?.subscriberCount || 0)}</span>
          </div>
        </div>

        <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl flex items-center gap-4 hover:border-amber-500/25 transition">
          <div className="p-3 bg-amber-650/15 rounded-lg border border-amber-500/20 text-amber-500 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-mono block">AVERAGE VIEWS AGGREGATE</span>
            <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">{formattedValue(benchmarkingAggregates.avgViews)}</span>
            <span className="text-[9px] text-[#555] font-mono block mt-0.5">Your channel: {formattedValue(channel?.viewCount || 0)}</span>
          </div>
        </div>

        <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl flex items-center gap-4 hover:border-emerald-500/25 transition">
          <div className="p-3 bg-emerald-650/15 rounded-lg border border-emerald-500/20 text-emerald-500 shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-mono block">AVERAGE UPLOAD COUNT</span>
            <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">{formattedValue(benchmarkingAggregates.avgVideos)} Videos</span>
            <span className="text-[9px] text-[#555] font-mono block mt-0.5">Your channel: {formattedValue(channel?.videoCount || 0)} uploads</span>
          </div>
        </div>
      </div>

      {/* Main Competitive Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: STRATEGIC INSIGHTS AND CONTROLS (col-span-5) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Add Competitor Input Form */}
          <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-red-500" /> Track New Competitor
              </h3>
              <p className="text-[10px] text-gray-500 font-mono leading-relaxed mt-1">
                Add an active channel in the same niche to map its click parameters and sub metrics (Limits: 6 to 20).
                Current Count: <span className="text-red-500 font-bold">{competitors.length}</span>
              </p>
            </div>

            <form onSubmit={handleAddCompetitor} className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Competitor Channel Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Next.js Wizard, Sourdough Secrets"
                  className="w-full bg-[#161619] border border-[#2d2d32] focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition font-sans"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Subscribers</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newSubs}
                    onChange={(e) => setNewSubs(Number(e.target.value))}
                    className="w-full bg-[#161619] border border-[#2d2d32] focus:border-red-500 rounded-lg p-2 text-xs text-white focus:outline-none transition font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Video Views</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newViews}
                    onChange={(e) => setNewViews(Number(e.target.value))}
                    className="w-full bg-[#161619] border border-[#2d2d32] focus:border-red-500 rounded-lg p-2 text-xs text-white focus:outline-none transition font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Uploads count</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newVideos}
                    onChange={(e) => setNewVideos(Number(e.target.value))}
                    className="w-full bg-[#161619] border border-[#2d2d32] focus:border-red-500 rounded-lg p-2 text-xs text-white focus:outline-none transition font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={competitors.length >= 20}
                className="w-full py-2 bg-gradient-to-r from-red-650 to-red-600 hover:from-red-700 text-white font-bold text-xs rounded-lg transition-all duration-200 flex items-center justify-center gap-1 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Track Channel Profile ({competitors.length}/20)
              </button>
            </form>
          </div>

          {/* AI Strategic Intelligence Report */}
          <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-amber-500 animate-pulse" /> AI Competitor Intelligence
              </h3>
              <p className="text-[10px] text-gray-500 font-mono leading-relaxed mt-1">
                Synthesized competitive benchmarks of the primary niche indexers.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#111113] border-l-2 border-red-500/80 bg-[#17171a] rounded-r-lg space-y-1">
                <span className="font-bold text-white flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-red-500 shrink-0" /> Spotting high-impact gaps
                </span>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Competitors in your niche averages <span className="text-white font-medium">{formattedValue(benchmarkingAggregates.avgViews)} views</span>, with a focus on core tutorials and guides. Target titles focusing on beginner traps and simple templates to steal audience attention curves.
                </p>
              </div>

              <div className="p-3 bg-[#111113] border-l-2 border-amber-500/80 bg-[#17171a] rounded-r-lg space-y-1">
                <span className="font-bold text-white flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Leverage short high-density tags
                </span>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  The top competitor channels are ranking high on tags such as <span className="text-amber-400 font-semibold font-mono">Next.js, Elden Ring, or Sourdough slices</span>. Target these keywords in the Tag Keyword tab to generate similar traffic flow.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab("chat", `Compare standard channel competitor insights for me. Seed key parameters: ${competitors.map(c => `"${c.title}" with ${c.subscriberCount} subs`).join(", ")}`)}
              className="w-full py-2 bg-[#1c1c1f] hover:bg-[#2d2d32] border border-[#2d2d32] text-xs font-bold font-mono text-gray-300 hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition"
            >
              Get Full AI Niche Playbook
            </button>
          </div>

        </div>

        {/* RIGHT: COMPARATIVE CHARTS & TABULAR LIST (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Comparative Bar Chart Visualization */}
          <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Audience Strength Map vs competitors
              </h3>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                Displays subscriber strength comparison (with your own channel framed first in orange)
              </p>
            </div>

            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartCompareData}>
                  <defs>
                    <linearGradient id="primarySubGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#555" fontSize={9} fontStyle="monospace" tickLine={false} />
                  <YAxis stroke="#555" fontSize={9} fontStyle="monospace" tickLine={false} />
                  <Tooltip formatter={(value) => [Number(value).toLocaleString(), "Subscribers"]} contentStyle={{ backgroundColor: "#111", borderColor: "#303035" }} />
                  <Bar dataKey="Subscribers" fill="url(#primarySubGlow)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table of tracked competitors */}
          <div className="bg-[#111113] border border-[#222225] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#222225] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Tracked Competitor Portfolios ({competitors.length})</h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">Detailed view indices, sub parameters, and active releases</p>
              </div>

              {/* Simple filter bar */}
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Quick search list..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#161618] border border-[#2d2d32] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none transition font-sans"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans text-xs text-left">
                <thead>
                  <tr className="bg-[#161618] border-b border-[#222225] text-gray-400 font-mono text-[10px] uppercase">
                    <th className="p-4 px-6 font-semibold">Competitor Channel</th>
                    <th className="p-4 text-center font-semibold">Subscribers</th>
                    <th className="p-4 text-center font-semibold">Total Views</th>
                    <th className="p-4 text-center font-semibold">Videos</th>
                    <th className="p-4 text-center font-semibold">Avg Views/Vid</th>
                    <th className="p-4 text-right font-semibold">Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e21]">
                  {filteredCompetitors.map((item) => (
                    <tr key={item.id} className="hover:bg-[#1a1a1d] transition duration-150">
                      <td className="p-4 px-6 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#201c1c] border border-red-950 flex items-center justify-center font-black text-xs text-red-500 font-mono shrink-0 uppercase">
                            {item.title.substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-white truncate text-xs">
                              {item.title}
                            </h4>
                            <span className="text-[9px] text-gray-500 font-mono block mt-0.5">
                              {item.customUrl}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] ${getSubscriberLevelStrength(item.subscriberCount)}`}>
                          {formattedValue(item.subscriberCount)}
                        </span>
                      </td>

                      <td className="p-4 text-center text-white font-mono font-medium">
                        {formattedValue(item.viewCount)}
                      </td>

                      <td className="p-4 text-center text-gray-400 font-mono">
                        {item.videoCount}
                      </td>

                      <td className="p-4 text-center text-red-400 font-mono font-bold">
                        {formattedValue(item.avgViewsPerVideo)}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleRemoveCompetitor(item.id, item.title)}
                          className="p-1 px-2.5 bg-red-950/20 hover:bg-red-650 border border-red-900/35 hover:border-transparent text-red-400 hover:text-white rounded transition text-[10px] font-mono flex items-center justify-end gap-1 ml-auto"
                          title="Stop tracking this competitor"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCompetitors.length === 0 && (
                <div className="p-8 text-center text-gray-500 font-mono text-xs">
                  No competitors match the search term filter query.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
