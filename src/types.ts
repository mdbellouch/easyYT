export interface ChannelData {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
  subscriberCount: number;
  videoCount: number;
  bannerUrl?: string;
  country?: string;
}

export interface VideoData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string; // ISO 8601
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags?: string[];
  category?: string;
  // Simulated addition for high fidelity analytics dashboard
  ctr: number; // Click-through-rate in %
  averageViewDuration: number; // in seconds
  retentionScore: number; // 0 to 100
  seoScore: number; // 0 to 100
}

export interface CredentialData {
  youtubeApiKey: string;
  youtubeChannelId: string;
}

export interface SuggestedTitleAlternative {
  suggestedTitle: string;
  ctrAngle: string;
  vibe: string;
}

export interface TitleAnalysisResult {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: SuggestedTitleAlternative[];
  isFallback?: boolean;
  geminiLimitReached?: boolean;
  errorDetails?: string;
}

export interface RelatedKeywordItem {
  term: string;
  estimatedVolumeScore: number; // 1 to 100
  competitionIndex: number; // 1 to 100
  relevanceScore: number; // 1 to 100
  recommendedUse: string;
  opportunityScore?: number; // Calculated or returned opportunity value
  estimatedCTR?: number; // Projected CTR %
  searchVelocityTrend?: string; // Hot, Stable, Crawling, Spiked, Saturated
  estimatedMonthlySearches?: string; // Human-friendly search volume, e.g. "45.2K"
  cpcEstimate?: number; // Cost-per-click USD
  matchScope?: string; // Broad, Phrase, Exact, Long-tail
}

export interface KeywordAnalysisResult {
  seedKeyword: string;
  overallVerdict: string;
  relatedKeywords: RelatedKeywordItem[];
  isFallback?: boolean;
  geminiLimitReached?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}
