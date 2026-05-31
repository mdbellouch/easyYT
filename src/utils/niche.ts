export type NicheCategory = 
  | "gaming" 
  | "cooking" 
  | "tech" 
  | "finance" 
  | "fitness" 
  | "business" 
  | "travel" 
  | "science" 
  | "design" 
  | "general";

export const detectNicheCategory = (title: string, description: string = ""): NicheCategory => {
  const combined = `${title} ${description}`.toLowerCase();
  
  if (combined.includes("gaming") || combined.includes("walkthrough") || combined.includes("esport") || combined.includes("gameplay") || combined.includes("speedrun") || combined.includes("twitch") || combined.includes("minecraft")) {
    return "gaming";
  }
  if (combined.includes("kitchen") || combined.includes("recipe") || combined.includes("cook") || combined.includes("culinary") || combined.includes("mamma") || combined.includes("bake") || combined.includes("baking") || combined.includes("sourdough") || combined.includes("food")) {
    return "cooking";
  }
  if (combined.includes("finance") || combined.includes("crypto") || combined.includes("investing") || combined.includes("stock") || combined.includes("wealth") || combined.includes("dividend") || combined.includes("passive") || combined.includes("money") || combined.includes("wallet")) {
    return "finance";
  }
  if (combined.includes("fitness") || combined.includes("workout") || combined.includes("gym") || combined.includes("health") || combined.includes("diet") || combined.includes("muscle") || combined.includes("exercise") || combined.includes("nutrition")) {
    return "fitness";
  }
  if (combined.includes("business") || combined.includes("marketing") || combined.includes("startup") || combined.includes("agency") || combined.includes("sales") || combined.includes("funnel") || combined.includes("entrepreneur") || combined.includes("ecommerce")) {
    return "business";
  }
  if (combined.includes("travel") || combined.includes("vlog") || combined.includes("lifestyle") || combined.includes("adventure") || combined.includes("nomad") || combined.includes("vlogger")) {
    return "travel";
  }
  if (combined.includes("science") || combined.includes("education") || combined.includes("learn") || combined.includes("physics") || combined.includes("math") || combined.includes("history") || combined.includes("documentary") || combined.includes("teach")) {
    return "science";
  }
  if (combined.includes("design") || combined.includes("creative") || combined.includes("art") || combined.includes("figma") || combined.includes("ui") || combined.includes("ux")) {
    return "design";
  }
  if (combined.includes("tech") || combined.includes("code") || combined.includes("coding") || combined.includes("software") || combined.includes("react") || combined.includes("saas") || combined.includes("developer") || combined.includes("ai")) {
    return "tech";
  }
  
  return "general";
};

export const getChannelNiche = (channel: { id?: string; title: string; description?: string } | null | undefined): NicheCategory => {
  if (!channel) return "general";
  const customNicheStr = localStorage.getItem(`yt_custom_niche_${channel.id || channel.title}`);
  if (customNicheStr) {
    return detectNicheCategory(customNicheStr, "");
  }
  return detectNicheCategory(channel.title, channel.description || "");
};

export const NICHE_LABELS: Record<NicheCategory, string> = {
  gaming: "Gaming Walkthrough",
  cooking: "Artisan Culinary",
  finance: "Wealth & Finance",
  fitness: "Fitness & Gym",
  business: "SaaS & Business",
  travel: "Travel & Nomadic",
  science: "Science & Education",
  design: "UI/UX & Creative",
  tech: "Tech & Coding",
  general: "General Growth"
};
