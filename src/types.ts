export type Role = 'user' | 'assistant' | 'system';

export type Tone = 'samimi' | 'resmi' | 'yaratici' | 'kisa' | 'ogretici';

export type StudioTab = 'chat' | 'image' | 'video' | 'social' | 'live' | 'vault' | 'autopilot';

export type AppTheme = 'ios-glass' | 'cyberpunk-neon' | 'minimal-titanium' | 'android-material';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  engine?: string;
  error?: boolean;
  recalledMemories?: string[];
}

export type MemoryCategory = 'preference' | 'fact' | 'instruction' | 'interaction';

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  content: string;
  source: 'auto_learned' | 'user_defined';
  timestamp: number;
  recallCount: number;
  lastRecalledAt?: number;
  relevanceKeywords: string[];
}

export interface RAGRetrievalResult {
  retrievedMemories: MemoryItem[];
  contextString: string;
}

export interface ToneOption {
  id: Tone;
  label: string;
  desc: string;
  icon: string;
}

export interface GeneratedPhoto {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  url: string;
  style: string;
  aspectRatio: string;
  width: number;
  height: number;
  createdAt: number;
}

export interface VideoScene {
  id: string;
  prompt: string;
  imageUrl?: string;
  duration: number;
  captionText: string;
  motionStyle: VideoMotionStyle;
}

export interface GeneratedVideo {
  id: string;
  prompt: string;
  videoUrl: string;
  posterUrl: string;
  voiceoverText?: string;
  musicType?: string;
  duration: number;
  aspectRatio: string;
  scenesCount?: number;
  createdAt: number;
}

export type ImageStyle =
  | 'gercekci'
  | 'sinematik'
  | '3d'
  | 'anime'
  | 'siberpunk'
  | 'yagliboya'
  | 'portre';

export type VideoMotionStyle =
  | 'drone'
  | 'sinematik_zoom'
  | 'kaydirma'
  | 'yavas_cekim'
  | 'aksiyon'
  | 'timelapse';

export type MusicType =
  | 'sinematik'
  | 'felsefi_derin'
  | 'doga_sakin'
  | 'futuristik'
  | 'sessiz';

export interface SocialPost {
  id: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'whatsapp';
  topic: string;
  title: string;
  caption: string;
  hashtags: string[];
  hook: string;
  callToAction: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video';
  createdAt: number;
}

export interface PublishedPost {
  id: string;
  platform: 'instagram' | 'whatsapp';
  title: string;
  caption: string;
  mediaUrl?: string;
  publishedAt: number;
  likes: number;
  reach: number;
  liveUrl: string;
  status: 'published' | 'scheduled';
}

export interface AutopilotConfig {
  enabled: boolean;
  frequency: 'daily_2' | 'daily_1' | 'hourly';
  brandName: string;
  brandIndustry: string;
  targetAudience: string;
  autoPublishInstagram: boolean;
  autoPublishWhatsApp: boolean;
}

export interface SystemVersion {
  currentVersion: string;
  latestVersion: string;
  releaseDate: string;
  autoUpdateEnabled: boolean;
  features: string[];
  changelog: string[];
}

export interface SocialInboxMessage {
  id: string;
  platform: 'instagram_dm' | 'instagram_comment' | 'whatsapp';
  senderName: string;
  senderHandle?: string;
  text: string;
  timestamp: number;
  status: 'unread' | 'read' | 'replied';
  replyText?: string;
  repliedAt?: number;
  autoReplied?: boolean;
  suggestedDrafts?: string[];
  selectedDraft?: string;
}

export interface SocialConnectionStatus {
  instagram: {
    connected: boolean;
    username?: string;
    pageName?: string;
    connectedAt?: number;
    autoReplyEnabled: boolean;
  };
  whatsapp: {
    connected: boolean;
    phoneNumber?: string;
    businessName?: string;
    connectedAt?: number;
    autoReplyEnabled: boolean;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'social' | 'memory' | 'autopilot';
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

