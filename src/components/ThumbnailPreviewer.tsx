import React, { useState, useRef, useMemo, useEffect } from "react";
import { 
  Eye, Image as ImageIcon, Sliders, Smartphone, Laptop, Sparkles,
  Upload, Check, Layers, Contrast, Info, RefreshCw
} from "lucide-react";
import { ChannelData } from "../types";
import { getChannelNiche, NicheCategory } from "../utils/niche";

interface ThumbnailPreviewerProps {
  channel: ChannelData | null;
  onNavigateToTab: (tabId: string, customPrompt?: string) => void;
}

interface NicheConfig {
  name: string;
  defaultTitle: string;
  presets: string[];
  competitors: Array<{
    id: string;
    title: string;
    channel: string;
    views: string;
    age: string;
    photoUrl: string;
  }>;
}

const NICHE_CONFIGS: Record<NicheCategory, NicheConfig> = {
  gaming: {
    name: "Gaming Guides & Walkthroughs",
    defaultTitle: "THIS UNPATCHED ELDEN RING BUG FEELS ENTIRELY ILLEGAL!",
    presets: [
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80", // Competitive esport setup
      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80", // Gaming controller setup
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80", // Keyboard and console keys
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80"  // Cyberpunk desktop
    ],
    competitors: [
      {
        id: "comp-gaming-1",
        title: "How to Hit Diamond Rank in Valorant (Pro Movement Guide)",
        channel: "Ranked Legends Lobby",
        views: "820K views",
        age: "12 days ago",
        photoUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-gaming-2",
        title: "This unpatched Elden Ring DLC boss glitch feels ILLEGAL",
        channel: "Pixel Speedrun Esports",
        views: "1.1M views",
        age: "2 weeks ago",
        photoUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-gaming-3",
        title: "I Survived 100 Days in Hardcore Minecraft Apocalypse",
        channel: "SteveCraft Overlord",
        views: "4.2M views",
        age: "1 month ago",
        photoUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  cooking: {
    name: "Artisan Baking & Cooking Recipes",
    defaultTitle: "THE 5 SECRETS TO PERFECT GOLDEN SOURDOUGH CRUST!",
    presets: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80", // Artisan Bread starter
      "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80", // Loaves of bread sliced
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80", // Cosy Baker kitchen utensils
      "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80"  // Gourmet chef board plating
    ],
    competitors: [
      {
        id: "comp-cooking-1",
        title: "Foolproof Artisan Sourdough slice: Perfect Wild Yeast starter",
        channel: "Sourdough Secrets Masterclass",
        views: "240K views",
        age: "3 days ago",
        photoUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-cooking-2",
        title: "I Fermented Bread Starter For 100 Hours (Perfect Golden Crust)",
        channel: "The Yeast Connection",
        views: "640K views",
        age: "9 days ago",
        photoUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-cooking-3",
        title: "3 Kitchen Tools Michelin Star Chefs CANNOT live without",
        channel: "Gourmet Plating Board",
        views: "1.8M views",
        age: "2 weeks ago",
        photoUrl: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  finance: {
    name: "Finance, Wealth & Crypto Passive Income",
    defaultTitle: "HOW I RETIRED EARLY WITH THESE 3 PASSIVE INCOME HACKS!",
    presets: [
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80", // Investment charts glow
      "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80", // Abstract Bitcoin growth curves
      "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80", // Modern budgeting spreadsheets
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80"  // Forex market candlesticks
    ],
    competitors: [
      {
        id: "comp-finance-1",
        title: "The absolute truth about Bitcoin and Crypto in 2026",
        channel: "Crypto Breakdowns",
        views: "320K views",
        age: "2 days ago",
        photoUrl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-finance-2",
        title: "This Dividend Investing strategy pays my rent every single month",
        channel: "Passive Wealth Lab",
        views: "510K views",
        age: "1 week ago",
        photoUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-finance-3",
        title: "How to safely grow passive income with a $5,000 budget",
        channel: "Stock Growth Mastery",
        views: "120K views",
        age: "4 days ago",
        photoUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  fitness: {
    name: "Fitness, Workouts & Evidence-Based Nutrition",
    defaultTitle: "THE 5-MINUTE DAILY PROTOCOLS THAT SHRED ENTIRE BODY FAT!",
    presets: [
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80", // Gym weights & barbell close up
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80", // Powerlifting athlete
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80", // Healthy nutrient meals
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80"  // HIIT training workout
    ],
    competitors: [
      {
        id: "comp-fitness-1",
        title: "Why traditional cardio is actually keeping you fat (Do this instead)",
        channel: "Evidence-Based Physiques",
        views: "450K views",
        age: "6 days ago",
        photoUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-fitness-2",
        title: "I did 100 HIIT burpees every morning for 30 days (Results)",
        channel: "Gym Protocol Coach",
        views: "2.3M views",
        age: "3 weeks ago",
        photoUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-fitness-3",
        title: "Meal Prep checklist: Build muscle fast with cheap foods",
        channel: "Nutrition Science Guides",
        views: "670K views",
        age: "10 days ago",
        photoUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  business: {
    name: "Business, Marketing & Startup SaaS Funnels",
    defaultTitle: "I LAUNCHED A $15,000/MONTH SAAS IN JUST 48 HOURS!",
    presets: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80", // Startup business whiteboard
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80", // Modern office skylines
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80", // Digital marketing dashboards
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80"  // Boardroom presentation
    ],
    competitors: [
      {
        id: "comp-business-1",
        title: "How to start a $10K/mo SaaS business with ZERO experience",
        channel: "SaaS Agency Incubator",
        views: "180K views",
        age: "4 days ago",
        photoUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-business-2",
        title: "Why 99% of passive dropshipping stores will fail in 2026",
        channel: "Viral Sales Funnels",
        views: "340K views",
        age: "1 week ago",
        photoUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-business-3",
        title: "The Cold Email script that signed a $12,000 client in 3 days",
        channel: "B2B Startup Strategy",
        views: "95K views",
        age: "2 weeks ago",
        photoUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  travel: {
    name: "Cozy Travel & Digital Nomad Adventure Vlogs",
    defaultTitle: "MY EXACT DAILY ROUTINE AS A COZY DIGITAL NOMAD!",
    presets: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80", // Sunny tropical nomad beach
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80", // Handheld travel map
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80", // Pure mountain scenery
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"  // Nomadic roadtrip vehicle
    ],
    competitors: [
      {
        id: "comp-travel-1",
        title: "The standard costs of living in Bali as a digital nomad in 2026",
        channel: "Minimalist Travels",
        views: "150K views",
        age: "5 days ago",
        photoUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-travel-2",
        title: "I traveled across solo Japan using only vending machines",
        channel: "Vlog Adventure Labs",
        views: "4.8M views",
        age: "3 weeks ago",
        photoUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-travel-3",
        title: "Top 10 hidden budget paradises you MUST visit next year",
        channel: "Nomadic World Trips",
        views: "2.1M views",
        age: "1 month ago",
        photoUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  science: {
    name: "Science, Documentaries & Deep Tech Breakdowns",
    defaultTitle: "WHY QUANTUM COMPUTERS WILL RENDER EVERYTHING USELESS!",
    presets: [
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80", // Space galaxy stars view
      "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80", // Mathematical study chalkboard
      "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&w=800&q=80", // Ancient scientific bookshelves
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80"  // Chemistry glassware laboratory
    ],
    competitors: [
      {
        id: "comp-science-1",
        title: "The shocking truth of quantum computing encryption safety",
        channel: "Deep Tech Explorers",
        views: "920K views",
        age: "1 week ago",
        photoUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-science-2",
        title: "Standard formulas that explain literally everything in existence",
        channel: "Quantum Physics Series",
        views: "1.4M views",
        age: "2 weeks ago",
        photoUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-science-3",
        title: "Inside the deep labs engineering nuclear fusion cells",
        channel: "Scientific Documentaries",
        views: "650K views",
        age: "12 days ago",
        photoUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  design: {
    name: "Aesthetic UI/UX Design & Creative Art Figma Tutorials",
    defaultTitle: "I DESIGNED THE PERFECT MOBILE APP UI FROM SCRATCH!",
    presets: [
      "https://images.unsplash.com/photo-1581291518655-9523c932dedf?auto=format&fit=crop&w=800&q=80", // UI designer editing in figma
      "https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=800&q=80", // Modern color gradients palette
      "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80", // Creative artist workspace board
      "https://images.unsplash.com/photo-1550141983-a9dbf5ae0fb8?auto=format&fit=crop&w=800&q=80"  // Clean UI prototyping layout
    ],
    competitors: [
      {
        id: "comp-design-1",
        title: "Figma UI/UX masterclass: Perfect aesthetic mobile apps",
        channel: "Aesthetic Interface Labs",
        views: "180K views",
        age: "3 days ago",
        photoUrl: "https://images.unsplash.com/photo-1581291518655-9523c932dedf?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-design-2",
        title: "How I designed the viral landing page that converted 45%",
        channel: "UI Design Series",
        views: "280K views",
        age: "10 days ago",
        photoUrl: "https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-design-3",
        title: "Why modern clean UI design actually feels so comforting",
        channel: "Figma Creative Tutorials",
        views: "140K views",
        age: "2 weeks ago",
        photoUrl: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  tech: {
    name: "Software Engineering & Modern AI Developer Labs",
    defaultTitle: "STOP MAKING THESE 5 FATAL REACT ERRORS IMMEDIATELY!",
    presets: [
      "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80", // Neon React code editor
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80", // Cyber dark code stream
      "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=800&q=80", // Programmers workstation laptop
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80"  // Complex browser interface
    ],
    competitors: [
      {
        id: "comp-tech-1",
        title: "Why Senior Developers NEVER Use standard React hooks in 2026",
        channel: "TechCraft Pro",
        views: "348K views",
        age: "5 days ago",
        photoUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-tech-2",
        title: "I Built a Full Next.js SaaS with cursor composer in 2 Hours",
        channel: "The Pragmatic Agent",
        views: "148K views",
        age: "1 week ago",
        photoUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-tech-3",
        title: "I used AI to build a multi-agent workflow in 20 minutes",
        channel: "Code Stream Modern",
        views: "420K views",
        age: "4 days ago",
        photoUrl: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  general: {
    name: "General Content Strategy & High-CTR Production",
    defaultTitle: "I ANALYZED THE STRONGEST ALGORITHMIC SECRETS ON YOUTUBE!",
    presets: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80", // Digital background neon
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80", // Workspace retro gadgets
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80", // Cozy kitchen shelf items
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80"  // Tech terminal server glow
    ],
    competitors: [
      {
        id: "comp-gen-1",
        title: "How to reliably make videos people actually want to watch",
        channel: "Creators Masterclass",
        views: "410K views",
        age: "6 days ago",
        photoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-gen-2",
        title: "The standard guide to YouTube CTR optimization under 5 minutes",
        channel: "CTR Optimizer Feed",
        views: "180K views",
        age: "1 week ago",
        photoUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "comp-gen-3",
        title: "Why small creators are out-indexing massive channels in 2026",
        channel: "Velocity Pulse Engine",
        views: "320K views",
        age: "10 days ago",
        photoUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80"
      }
    ]
  }
};

export default function ThumbnailPreviewer({ channel, onNavigateToTab }: ThumbnailPreviewerProps) {
  // Detect current channel niche category based on channel meta or custom persistent niche
  const initialNiche: NicheCategory = useMemo(() => {
    return getChannelNiche(channel);
  }, [channel]);

  const [selectedNiche, setSelectedNiche] = useState<NicheCategory>(initialNiche);

  // Keep selectedNiche in sync if channel changes
  useEffect(() => {
    setSelectedNiche(initialNiche);
  }, [initialNiche]);

  const nicheConfig = useMemo(() => {
    return NICHE_CONFIGS[selectedNiche];
  }, [selectedNiche]);

  const [selectedImage, setSelectedImage] = useState<string>(() => nicheConfig?.presets?.[0] || "");
  const [titleText, setTitleText] = useState<string>(() => nicheConfig?.defaultTitle || "");
  const [channelName, setChannelName] = useState<string>("My Target Channel");
  
  // Overlay Config coordinates
  const [duration, setDuration] = useState<string>("12:45");
  const [showDuration, setShowDuration] = useState<boolean>(true);
  const [progressPercent, setProgressPercent] = useState<number>(35);
  const [showProgressBar, setShowProgressBar] = useState<boolean>(true);
  
  // Analysis simulation configurations
  const [blurTest, setBlurTest] = useState<boolean>(false);
  const [grayscaleTest, setGrayscaleTest] = useState<boolean>(false);
  const [lowLightTest, setLowLightTest] = useState<boolean>(false);
  const [viewportLayout, setViewportLayout] = useState<"phone" | "desktop" | "sidebar">("desktop");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync settings when channel or nicheConfig changes
  useEffect(() => {
    if (nicheConfig) {
      setSelectedImage(nicheConfig.presets[0]);
      setTitleText(nicheConfig.defaultTitle);
    }
  }, [nicheConfig]);

  useEffect(() => {
    if (channel) {
      setChannelName(channel.title);
    } else {
      setChannelName("My Channel");
    }
  }, [channel]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSelectedImage(uploadEvent.target.result as string);
          setSuccessMsg("Optimized custom thumbnail image loaded successfully!");
          setTimeout(() => setSuccessMsg(null), 3000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSelectedImage(uploadEvent.target.result as string);
          setSuccessMsg("Optimized drag-and-drop thumbnail loaded successfully!");
          setTimeout(() => setSuccessMsg(null), 3000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Build classes for CSS filter simulation mapping (squies contrast and clarity limits)
  const imageFilterClasses = useMemo(() => {
    let classes = "";
    if (blurTest) classes += " blur-[4px]";
    if (grayscaleTest) classes += " grayscale";
    if (lowLightTest) classes += " brightness-[60%] contrast-125";
    return classes;
  }, [blurTest, grayscaleTest, lowLightTest]);

  const avatarUrl = channel?.thumbnailUrl || `https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=80&q=80`;

  return (
    <div id="thumbnail-previewer-workspace" className="space-y-6">
      
      {/* Overview Intro Card */}
      <div className="bg-[#111113] border border-[#222225] p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-650/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2.5 items-center">
            <span className="text-[9px] uppercase tracking-wider bg-red-950/30 text-red-500 border border-red-900/40 px-2 py-0.5 rounded-full font-mono font-bold">
              CTR Visual Studio
            </span>
            <div className="flex items-center gap-1.5 bg-[#161619] border border-[#2d2d32] px-2 py-0.5 rounded-md text-xs">
              <span className="text-[9px] text-gray-500 font-mono font-bold uppercase shrink-0">Calibrated Niche:</span>
              <select
                value={selectedNiche}
                onChange={(e) => {
                  const newNiche = e.target.value as NicheCategory;
                  setSelectedNiche(newNiche);
                  setSuccessMsg(`Calibrated simulation view to: ${NICHE_CONFIGS[newNiche].name}`);
                  setTimeout(() => setSuccessMsg(null), 2500);
                }}
                className="bg-transparent text-amber-500 hover:text-amber-400 font-bold font-mono focus:outline-none cursor-pointer text-[11px] py-0.5 border-none outline-none select-none"
              >
                <option value="gaming" className="bg-[#111113] text-white font-sans">Gaming Walkthroughs</option>
                <option value="cooking" className="bg-[#111113] text-white font-sans">Artisan Cooking</option>
                <option value="finance" className="bg-[#111113] text-white font-sans">Wealth & Finance</option>
                <option value="fitness" className="bg-[#111113] text-white font-sans">Fitness & Gym</option>
                <option value="business" className="bg-[#111113] text-white font-sans">SaaS & Business</option>
                <option value="travel" className="bg-[#111113] text-white font-sans">Travel & Nomadic</option>
                <option value="science" className="bg-[#111113] text-white font-sans">Science Documentary</option>
                <option value="design" className="bg-[#111113] text-white font-sans">UI/UX Figma Design</option>
                <option value="tech" className="bg-[#111113] text-white font-sans">Tech & Code</option>
                <option value="general" className="bg-[#111113] text-white font-sans">General CTR Optimizer</option>
              </select>
            </div>
          </div>
          <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-500 animate-pulse" /> Thumbnail Previewer & Target Simulator
          </h2>
          <p className="text-xs text-gray-400 max-w-xl font-sans">
            Draft, crop, and overlay simulated stats to verify title legibility and brand focus against trending search result targets tailor-loaded for the <span className="text-red-400 font-semibold">{nicheConfig.name}</span> niche.
          </p>
        </div>

        <button
          onClick={() => onNavigateToTab("title", titleText)}
          className="p-2 px-4 bg-[#1c1c1f] hover:bg-[#2d2d32] border border-[#2d2d32] text-white text-xs font-bold font-mono rounded-lg transition shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          Analyze Title Match
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/10 border border-emerald-900/40 text-emerald-400 rounded-lg text-xs leading-none font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: THUMBNAIL STUDIO BUILDER & DECORATOR CONTROLS (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* File Upload / Preset Selector */}
          <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-red-500" /> 1. Upload Custom Banner
              </h3>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5 leading-relaxed">
                Drag your own design files on board, or utilize high-fidelity preset inspiration related to your niche.
              </p>
            </div>

            {/* Drag & Drop Target Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="h-32 border-2 border-dashed border-[#2d2d32] hover:border-red-550/40 bg-[#161619] rounded-xl flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:bg-neutral-900/40 transition group"
            >
              <Upload className="w-8 h-8 text-gray-500 group-hover:text-red-500 group-hover:scale-105 transition mb-2" />
              <span className="text-xs font-sans font-bold text-gray-300">Choose file or drag here</span>
              <span className="text-[9px] text-[#555] font-mono mt-1 uppercase">Supports JPEG, PNG</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Preset shortcuts selector */}
            <div>
              <span className="text-[10px] text-gray-500 font-mono font-semibold block uppercase mb-1.5">
                Presets for {nicheConfig.name}
              </span>
              <div className="grid grid-cols-4 gap-2">
                {nicheConfig.presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(p)}
                    className={`h-11 rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === p 
                        ? "border-red-500 scale-95 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                        : "border-[#222225] opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={p} alt={`preset-${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Core Settings Overlay Configuration */}
          <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-red-500" /> 2. Interface Overlays
              </h3>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                Apply standard player overlays to test visual blocker zones.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Draft Companion Video Title */}
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Simulated Video Title</label>
                <textarea
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  placeholder="Insert target video title..."
                  rows={2}
                  className="w-full bg-[#161619] border border-[#2d2d32] focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition font-sans resize-none"
                />
                
                {/* Dynamic Suggested Niche Title Hooks */}
                <div className="mt-2 space-y-1">
                  <span className="text-[9px] text-gray-450 font-mono uppercase font-bold tracking-wider block">Suggested Niche Hooks (Click to apply):</span>
                  <div className="space-y-1 text-left">
                    {[
                      nicheConfig.defaultTitle,
                      ...(nicheConfig.competitors?.map(c => c.title) || [])
                    ].filter(Boolean).slice(0, 3).map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTitleText(t);
                          setSuccessMsg(`Applied high-CTR template: "${t}"`);
                          setTimeout(() => setSuccessMsg(null), 2500);
                        }}
                        className="w-full text-left bg-[#161619] border border-[#222225] hover:border-red-500 hover:bg-[#1a1a1f] p-1.5 rounded text-[10px] text-gray-400 hover:text-white transition line-clamp-1 block cursor-pointer font-sans"
                        title={t}
                      >
                        💡 {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verified pill overlay details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Time overlay</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-[#161619] border border-[#2d2d32] focus:border-red-500 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Your channel</label>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="w-full bg-[#161619] border border-[#2d2d32] focus:border-red-500 rounded-lg p-2 text-xs text-white focus:outline-none font-sans"
                  />
                </div>
              </div>

              {/* Progress Slider Overlay */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 mb-1">
                  <span>Watched progress indicator</span>
                  <span className="text-red-400 font-bold">{progressPercent}% watched</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />
              </div>

              {/* Toggle controls */}
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDuration}
                    onChange={(e) => setShowDuration(e.target.checked)}
                    className="accent-red-650 h-3.5 w-3.5 rounded"
                  />
                  Show timestamp pill
                </label>

                <label className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showProgressBar}
                    onChange={(e) => setShowProgressBar(e.target.checked)}
                    className="accent-red-650 h-3.5 w-3.5 rounded"
                  />
                  Show Red progress bar
                </label>
              </div>
            </div>
          </div>

          {/* Simulated Image Diagnostics Tests */}
          <div className="bg-[#111113] border border-[#222225] p-5 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Contrast className="w-4 h-4 text-red-500" /> 3. Clarity Diagnostics
              </h3>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                Apply algorithmic diagnostic filter lenses.
              </p>
            </div>

            <div className="space-y-2 font-mono text-xs text-gray-300">
              <button
                onClick={() => setBlurTest(!blurTest)}
                className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition ${
                  blurTest ? "bg-red-950/20 text-red-400 border-red-500/50" : "bg-[#161619] border-[#222225] hover:bg-neutral-900"
                }`}
              >
                <span>Squint &amp; Blur Test (Check hierarchy)</span>
                <span className="text-[9px] font-bold uppercase">{blurTest ? "Active" : "Off"}</span>
              </button>

              <button
                onClick={() => setGrayscaleTest(!grayscaleTest)}
                className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition ${
                  grayscaleTest ? "bg-[#1c1a26] text-amber-500 border-amber-500/50" : "bg-[#161619] border-[#222225] hover:bg-neutral-900"
                }`}
              >
                <span>Grayscale Test (Contrast &amp; Value)</span>
                <span className="text-[9px] font-bold uppercase">{grayscaleTest ? "Active" : "Off"}</span>
              </button>

              <button
                onClick={() => setLowLightTest(!lowLightTest)}
                className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition ${
                  lowLightTest ? "bg-sky-950/20 text-sky-400 border-sky-500/50" : "bg-[#161619] border-[#222225] hover:bg-neutral-900"
                }`}
              >
                <span>Dim Screen / Night-Mode Simulation</span>
                <span className="text-[9px] font-bold uppercase">{lowLightTest ? "Active" : "Off"}</span>
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT: PORTAL PREVIEWS & SEARCH TARGET SIMULATION OVERLAYS (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Preview Layout Selection Header */}
          <div className="flex bg-[#111113] p-1.5 border border-[#222225] rounded-xl space-x-1.5">
            {[
              { id: "desktop", name: "Desktop Search Results", icon: <Laptop className="w-4 h-4 shrink-0" /> },
              { id: "phone", name: "Mobile Phone Feed", icon: <Smartphone className="w-4 h-4 shrink-0" /> },
              { id: "sidebar", name: "Niche Sidebar Recommended", icon: <Eye className="w-4 h-4 shrink-0" /> },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setViewportLayout(v.id as any)}
                className={`flex-1 py-3 rounded-lg text-xs font-bold font-mono text-center flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  viewportLayout === v.id
                    ? "bg-red-950/20 text-white border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {v.icon}
                {v.name}
              </button>
            ))}
          </div>

          {/* VIEWPORT CANVAS TARGET PREVIEWS */}
          <div className="bg-[#111113] border border-[#222225] p-6 rounded-2xl shadow-inner min-h-[400px] flex flex-col justify-center items-center">
            
            {viewportLayout === "phone" && (
              <div className="w-[320px] bg-black border-[6px] border-[#222225] rounded-[32px] p-4.5 overflow-hidden shadow-2xl relative space-y-4">
                <span className="text-[8px] font-bold text-center block text-gray-500 tracking-widest font-mono uppercase">MOBILE PORTRAIT FEED (375px)</span>
                
                {/* Simulated Feed card container */}
                <div className="space-y-2 border-b border-[#1c1c1f] pb-3 last:border-0 font-sans text-left">
                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-neutral-900 border border-[#2d2d30]">
                    <img 
                      src={selectedImage || null} 
                      alt="Thumbnail Preview" 
                      className={`w-full h-full object-cover transition ${imageFilterClasses}`} 
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* overlays */}
                    {showDuration && (
                      <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[9px] font-mono font-bold px-1 rounded-sm tracking-tight z-10">
                        {duration}
                      </span>
                    )}

                    {showProgressBar && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#222225] z-10">
                        <div className="bg-red-650 h-full transition" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <img src={avatarUrl} className="w-9 h-9 rounded-full object-cover border border-[#2d2d30] shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                        {titleText || "Please fill layout description tags."}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-1 leading-none">{channelName} • 14K • 2 hours ago</p>
                    </div>
                  </div>
                </div>

                {/* Sub Competitor Feed element to test contrasting colors */}
                {nicheConfig.competitors.length > 0 && (
                  <div className="space-y-2 opacity-55 text-left">
                    <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-neutral-900 border border-[#202022]">
                      <img src={nicheConfig.competitors[0].photoUrl} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[9px] font-mono font-bold px-1 rounded-sm">
                        15:20
                      </span>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-red-950/20 border border-[#303035] shrink-0" />
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 leading-snug line-clamp-2">
                          {nicheConfig.competitors[0].title}
                        </h4>
                        <p className="text-[10px] text-gray-550 mt-0.5">{nicheConfig.competitors[0].channel}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {viewportLayout === "desktop" && (
              <div className="w-full space-y-5 text-left font-sans">
                <span className="text-[9px] font-mono text-gray-555 block uppercase font-bold tracking-widest border-b border-[#222225] pb-2">
                  SIMULATED SEARCH TARGETS (Desktop Layout Grid)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* USER COMPONENT FIRST */}
                  <div className="space-y-2 p-2 bg-[#17171a] border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.04)] rounded-xl relative group">
                    <span className="absolute top-1 left-1 bg-red-650 text-white font-mono font-black text-[8px] py-0.5 px-1.5 rounded uppercase tracking-wider z-20 shadow-md">
                      Your Thumbnail
                    </span>

                    <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-neutral-900 border border-[#333]">
                      <img 
                        src={selectedImage || null} 
                        alt="Preview" 
                        className={`w-full h-full object-cover transition duration-150 ${imageFilterClasses}`} 
                        referrerPolicy="no-referrer"
                      />
                      
                      {showDuration && (
                        <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[9px] font-mono font-bold px-1 rounded-sm">
                          {duration}
                        </span>
                      )}

                      {showProgressBar && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#222225]">
                          <div className="bg-red-650 h-full" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2.5 pt-1">
                      <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover border border-[#2d2d30] shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white leading-normal line-clamp-2">
                          {titleText || "Please specify simulated tags."}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-1">{channelName}</p>
                        <p className="text-[9px] text-[#555] font-mono mt-0.5">850 views • 30 mins ago</p>
                      </div>
                    </div>
                  </div>

                  {/* Competitor slots to compare against standard targets */}
                  {nicheConfig.competitors.map((comp) => (
                    <div key={comp.id} className="space-y-2 p-2 bg-[#121214] border border-[#1e1e21] rounded-xl opacity-80 hover:opacity-100 transition duration-150">
                      <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-neutral-900 border border-[#222]">
                        <img src={comp.photoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[9px] font-mono font-bold px-1 rounded-sm">
                          14:50
                        </span>
                      </div>

                      <div className="flex gap-2.5 pt-1">
                        <div className="w-8 h-8 rounded-full bg-[#1c1c20] border border-[#2d2d32] shrink-0 flex items-center justify-center font-bold text-xs text-gray-500 font-mono">
                          {comp.channel.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-neutral-300 leading-normal line-clamp-2">
                            {comp.title}
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-1">{comp.channel}</p>
                          <p className="text-[9px] text-gray-650 font-mono mt-0.5">{comp.views} • {comp.age}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            )}

            {viewportLayout === "sidebar" && (
              <div className="w-[380px] bg-[#111113] border border-[#222225] rounded-xl p-4.5 space-y-4 text-left font-sans shadow-lg">
                <span className="text-[9px] font-mono text-[#555] block uppercase font-bold tracking-wider mb-2">Simulated Niche Sidebar Feed</span>

                {/* USER THUMBNAIL PLACED SECOND (Typical high click slot) */}
                <div className="space-y-3">
                  
                  {/* First item pre seeded */}
                  {nicheConfig.competitors[1] && (
                    <div className="flex gap-2.5 items-start text-left opacity-60">
                      <div className="relative aspect-[16/9] w-28 rounded-lg overflow-hidden shrink-0 border border-[#222]">
                        <img src={nicheConfig.competitors[1].photoUrl} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 select-none">
                        <h4 className="text-[11px] font-bold text-white leading-tight line-clamp-2">
                          {nicheConfig.competitors[1].title}
                        </h4>
                        <p className="text-[9px] text-gray-500 mt-1">{nicheConfig.competitors[1].channel}</p>
                      </div>
                    </div>
                  )}

                  {/* USER SLOT (Highlighted in sidebar feed to judge contrast) */}
                  <div className="flex gap-2.5 items-start text-left border border-red-550/20 bg-red-950/5 p-1.5 rounded-lg font-sans">
                    <div className="relative aspect-[16/9] w-28 rounded-lg overflow-hidden shrink-0 border border-[#303035]">
                      <img 
                        src={selectedImage || null} 
                        alt="Preview" 
                        className={`w-full h-full object-cover transition ${imageFilterClasses}`} 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] bg-red-950/30 text-red-500 border border-red-900/40 px-1 font-mono font-bold rounded">Active Draft</span>
                      <h4 className="text-[11px] font-bold text-white leading-tight line-clamp-2 mt-1">
                        {titleText}
                      </h4>
                      <p className="text-[9px] text-gray-400 mt-0.5">{channelName}</p>
                    </div>
                  </div>

                  {/* Third item */}
                  {nicheConfig.competitors[2] && (
                    <div className="flex gap-2.5 items-start text-left opacity-60">
                      <div className="relative aspect-[16/9] w-28 rounded-lg overflow-hidden shrink-0 border border-[#222]">
                        <img src={nicheConfig.competitors[2].photoUrl} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 select-none">
                        <h4 className="text-[11px] font-bold text-white leading-tight line-clamp-2">
                          {nicheConfig.competitors[2].title}
                        </h4>
                        <p className="text-[9px] text-gray-500 mt-1">{nicheConfig.competitors[2].channel}</p>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}

          </div>

          {/* AI Strategic Assessment Box */}
          <div className="bg-[#111113] border border-[#222225] p-5 rounded-2xl relative overflow-hidden flex items-start gap-4 shadow-xl">
            <div className="p-3 bg-red-650/15 rounded-lg border border-red-500/20 text-red-500 shrink-0">
              <Eye className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1 text-left text-xs font-sans">
              <h4 className="font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                Algorithmic Niche Assessment <span className="text-[9px] text-amber-500 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-900/30 font-bold uppercase">{selectedImage.includes("unsplash") ? "Niche Calibrated" : "Uploaded"}</span>
              </h4>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                High-converting thumbnails in the <span className="text-red-400 font-bold font-mono">{nicheConfig.name}</span> niche utilize targeted layout palettes. We have calibrated <strong>4 design preset backdrops</strong> above specifically for this vertical. Turn on the <strong>Squint &amp; Blur Test</strong> diagnostic filter lens to verify if the focal anchors properly pop against key competitors in the search results list.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
