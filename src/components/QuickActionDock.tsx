import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  Brain,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Layers,
  Sliders,
  Check,
  Send,
  Camera,
  Film,
  PhoneCall,
  HardDrive,
  Share2,
  TrendingUp,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import { StudioTab, MemoryCategory } from '../types.ts';
import { audioEngine } from '../utils/audioEngine.ts';

export type QuickActionType =
  | 'create_image'
  | 'quick_reply'
  | 'add_memory'
  | 'create_video'
  | 'live_call'
  | 'media_vault'
  | 'social_share'
  | 'install_app';

export interface ActionDockItemConfig {
  id: QuickActionType;
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  colorGradient: string;
  glowColor: string;
  accentBg: string;
}

const ALL_AVAILABLE_ACTIONS: Record<QuickActionType, ActionDockItemConfig> = {
  create_image: {
    id: 'create_image',
    title: 'Görsel Oluştur',
    subtitle: '4K AI Fotoğraf Stüdyosu',
    badge: 'Popüler',
    icon: ImageIcon,
    colorGradient: 'from-amber-500 via-rose-500 to-pink-600',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    accentBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  quick_reply: {
    id: 'quick_reply',
    title: 'Hızlı Yanıt',
    subtitle: 'Anında Akıllı Komutlar',
    badge: 'En Çok Kullanılan',
    icon: Zap,
    colorGradient: 'from-blue-500 via-cyan-500 to-teal-400',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    accentBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  add_memory: {
    id: 'add_memory',
    title: 'Anı Ekle',
    subtitle: 'Hafıza & RAG Kaydı',
    badge: 'Öğrenen AI',
    icon: Brain,
    colorGradient: 'from-purple-500 via-indigo-500 to-violet-600',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    accentBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  create_video: {
    id: 'create_video',
    title: 'Video Üret',
    subtitle: '60s Sinematik Video',
    badge: 'Yeni',
    icon: Film,
    colorGradient: 'from-red-500 via-orange-500 to-amber-500',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    accentBg: 'bg-red-500/15 text-red-300 border-red-500/30',
  },
  live_call: {
    id: 'live_call',
    title: 'Canlı Görüşme',
    subtitle: 'Gerçek Zamanlı AI Arama',
    badge: 'Ses & Video',
    icon: PhoneCall,
    colorGradient: 'from-emerald-500 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    accentBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  media_vault: {
    id: 'media_vault',
    title: 'Medya Kasası',
    subtitle: 'Tüm Galeri ve İndirmeler',
    badge: 'Depolama',
    icon: HardDrive,
    colorGradient: 'from-slate-600 to-slate-800',
    glowColor: 'rgba(100, 116, 139, 0.4)',
    accentBg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  },
  social_share: {
    id: 'social_share',
    title: 'Sosyal Paylaşım',
    subtitle: 'Instagram & WhatsApp Hub',
    badge: 'Otomasyon',
    icon: Share2,
    colorGradient: 'from-fuchsia-600 to-pink-500',
    glowColor: 'rgba(217, 70, 239, 0.4)',
    accentBg: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  },
  install_app: {
    id: 'install_app',
    title: 'Ana Ekrana Ekle',
    subtitle: 'Uygulama Kurulum & Önizleme',
    badge: 'PWA Uygulama',
    icon: Smartphone,
    colorGradient: 'from-blue-600 via-indigo-600 to-violet-600',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    accentBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
};

const DEFAULT_TOP_THREE: QuickActionType[] = ['create_image', 'quick_reply', 'add_memory'];
const DOCK_STORAGE_KEY = 'benim_action_dock_items_v1';
const DOCK_STATS_KEY = 'benim_action_dock_stats_v1';
const DOCK_COLLAPSED_KEY = 'benim_action_dock_collapsed_v1';

interface QuickActionDockProps {
  onTabChange: (tab: StudioTab) => void;
  onSendMessage: (text: string) => void;
  onOpenMemoryModal: () => void;
  onAddQuickMemory: (content: string, category: MemoryCategory) => void;
  onStartLiveCall: () => void;
  onOpenHomeScreenModal?: () => void;
}

export const QuickActionDock: React.FC<QuickActionDockProps> = ({
  onTabChange,
  onSendMessage,
  onOpenMemoryModal,
  onAddQuickMemory,
  onStartLiveCall,
  onOpenHomeScreenModal,
}) => {
  // Top 3 selected action IDs
  const [activeActionIds, setActiveActionIds] = useState<QuickActionType[]>(() => {
    try {
      const saved = localStorage.getItem(DOCK_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) return parsed;
      }
    } catch {}
    return DEFAULT_TOP_THREE;
  });

  // Action usage count statistics
  const [stats, setStats] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(DOCK_STATS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      create_image: 14,
      quick_reply: 29,
      add_memory: 12,
    };
  });

  // Dock state - default to collapsed on mobile to keep typing area completely unobstructed
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(DOCK_COLLAPSED_KEY);
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' ? window.innerWidth < 768 : true;
    } catch {
      return true;
    }
  });

  // Active popup sub-drawers
  const [activePopup, setActivePopup] = useState<'quick_reply' | 'add_memory' | 'customize' | null>(null);

  // Quick reply prompt input
  const [quickReplyText, setQuickReplyText] = useState('');
  // Quick memory fields
  const [memoryText, setMemoryText] = useState('');
  const [memoryCategory, setMemoryCategory] = useState<MemoryCategory>('preference');
  const [memorySuccessToast, setMemorySuccessToast] = useState(false);

  // Quick reply preset prompts
  const QUICK_PROMPTS = [
    { title: 'Günün Özeti & Planı', prompt: 'Bugün için yapılacaklar listemi düzenle ve beni motive edecek bir başlangıç planı sun.' },
    { title: 'Yaratıcı Viral Fikir', prompt: 'Sosyal medyada paylaşmak üzere yüksek etkileşimli, yaratıcı ve dikkat çekici bir post fikri üret.' },
    { title: 'Hızlı Analiz & Tavsiye', prompt: 'Son paylaşımlarımı ve konuşmalarımızı analiz ederek bana 3 pratik gelişim tavsiyesi ver.' },
    { title: 'Hedef & Motivasyon', prompt: 'Bugünkü hedeflerimi başarmam için bana güçlü bir motivasyon konuşması ve ipuçları ver.' },
  ];

  // Save collapsed preference
  const toggleCollapse = () => {
    audioEngine.playPopSound(500);
    audioEngine.triggerHaptic(15);
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(DOCK_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  const recordUsage = (actionId: QuickActionType) => {
    audioEngine.playPopSound(750);
    audioEngine.triggerHaptic(20);
    setStats((prev) => {
      const updated = { ...prev, [actionId]: (prev[actionId] || 0) + 1 };
      localStorage.setItem(DOCK_STATS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Handle Action Trigger
  const handleActionClick = (actionId: QuickActionType) => {
    recordUsage(actionId);

    switch (actionId) {
      case 'create_image':
        onTabChange('image');
        setActivePopup(null);
        break;
      case 'quick_reply':
        onTabChange('chat');
        setActivePopup((prev) => (prev === 'quick_reply' ? null : 'quick_reply'));
        break;
      case 'add_memory':
        setActivePopup((prev) => (prev === 'add_memory' ? null : 'add_memory'));
        break;
      case 'create_video':
        onTabChange('video');
        setActivePopup(null);
        break;
      case 'live_call':
        onStartLiveCall();
        setActivePopup(null);
        break;
      case 'media_vault':
        onTabChange('vault');
        setActivePopup(null);
        break;
      case 'social_share':
        onTabChange('social');
        setActivePopup(null);
        break;
      case 'install_app':
        onOpenHomeScreenModal?.();
        setActivePopup(null);
        break;
    }
  };

  // Submit quick prompt
  const handleSendPrompt = (prompt: string) => {
    if (!prompt.trim()) return;
    audioEngine.playPopSound(800);
    audioEngine.triggerHaptic(25);
    onTabChange('chat');
    onSendMessage(prompt);
    setActivePopup(null);
    setQuickReplyText('');
  };

  // Submit quick memory
  const handleSaveMemory = () => {
    if (!memoryText.trim()) return;
    audioEngine.playPopSound(900);
    audioEngine.triggerHaptic(30);
    onAddQuickMemory(memoryText.trim(), memoryCategory);
    setMemorySuccessToast(true);
    setMemoryText('');
    setTimeout(() => {
      setMemorySuccessToast(false);
      setActivePopup(null);
    }, 1400);
  };

  // Save customized action selection
  const handleToggleCustomizeAction = (id: QuickActionType) => {
    audioEngine.playPopSound(600);
    audioEngine.triggerHaptic(15);
    if (activeActionIds.includes(id)) {
      if (activeActionIds.length <= 1) return; // Keep at least one
      const updated = activeActionIds.filter((item) => item !== id);
      setActiveActionIds(updated);
      localStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(updated));
    } else {
      if (activeActionIds.length >= 3) {
        // Replace the last item
        const updated = [activeActionIds[0], activeActionIds[1], id];
        setActiveActionIds(updated);
        localStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(updated));
      } else {
        const updated = [...activeActionIds, id];
        setActiveActionIds(updated);
        localStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(updated));
      }
    }
  };

  return (
    <>
      {/* ======================================================== */}
      {/* FLOATING ACTION DOCK CONTAINER */}
      {/* Positioned safely near top below header so it never obscures the bottom typing area */}
      {/* ======================================================== */}
      <aside aria-label="Hızlı Eylem Çubuğu" className="fixed top-20 left-3 sm:top-24 sm:left-6 z-20 pointer-events-auto flex flex-col items-start gap-2 max-w-[calc(100vw-2rem)] sm:max-w-md">
        {/* ======================================================== */}
        {/* POPUP SUB-PANELS (QUICK REPLY, ADD MEMORY, CUSTOMIZE) */}
        {/* ======================================================== */}
        {activePopup === 'quick_reply' && (
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-white w-72 sm:w-80 animate-fadeIn space-y-3 mb-1">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-xs">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Hızlı Yanıt & Komut</h4>
                  <p className="text-[10px] text-cyan-300">Tek tıkla sohbete aktar</p>
                </div>
              </div>
              <button
                onClick={() => setActivePopup(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ready-to-go Prompt Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-300 block">Önerilen Komutlar:</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {QUICK_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendPrompt(item.prompt)}
                    className="w-full text-left p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 hover:border-cyan-500/50 transition-all text-xs group flex items-start gap-2 active:scale-98"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5 group-hover:scale-125 transition-transform" />
                    <div>
                      <div className="font-semibold text-slate-200 group-hover:text-cyan-200 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        {item.prompt}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Direct Input */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 bg-slate-800/90 rounded-xl px-2.5 py-1.5 border border-slate-700">
                <input
                  type="text"
                  value={quickReplyText}
                  onChange={(e) => setQuickReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendPrompt(quickReplyText);
                  }}
                  placeholder="Özel hızlı komut yazın..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-400 outline-none"
                />
                <button
                  onClick={() => handleSendPrompt(quickReplyText)}
                  disabled={!quickReplyText.trim()}
                  className="p-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-900 transition active:scale-95 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Memory Drawer */}
        {activePopup === 'add_memory' && (
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-white w-72 sm:w-84 animate-fadeIn space-y-3 mb-1">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-xs">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Anında Anı Ekle</h4>
                  <p className="text-[10px] text-purple-300">RAG Hafızasına doğrudan kaydet</p>
                </div>
              </div>
              <button
                onClick={() => setActivePopup(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {memorySuccessToast ? (
              <div className="py-4 text-center space-y-2 animate-scaleIn">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-emerald-300">
                  Anı başarıyla hafızaya kaydedildi!
                </div>
                <div className="text-[10px] text-slate-400">
                  Yapay zekâ artık tüm yanıtlarda bu bilgiyi dikkate alacak.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Memory Text input */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Hatırlanacak Bilgi, Tercih veya Kural:
                  </label>
                  <textarea
                    rows={3}
                    value={memoryText}
                    onChange={(e) => setMemoryText(e.target.value)}
                    placeholder="Örn: 'Sosyal medya gönderilerinde her zaman samimi emoji ve Türkçe başlık kullan.'"
                    className="w-full bg-slate-800/90 text-xs text-white placeholder-slate-400 rounded-xl p-2.5 border border-slate-700 focus:border-purple-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Category Selector */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Kategori:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    {[
                      { id: 'preference' as MemoryCategory, label: '🎯 Tercih' },
                      { id: 'fact' as MemoryCategory, label: '📌 Bilgi' },
                      { id: 'instruction' as MemoryCategory, label: '⚡ Talimat' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMemoryCategory(cat.id)}
                        className={`py-1.5 rounded-lg font-medium transition text-center border ${
                          memoryCategory === cat.id
                            ? 'bg-purple-600/30 text-purple-200 border-purple-500/60 font-bold'
                            : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-800'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveMemory}
                    disabled={!memoryText.trim()}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Hafızaya Kaydet</span>
                  </button>
                  <button
                    onClick={() => {
                      setActivePopup(null);
                      onOpenMemoryModal();
                    }}
                    title="Gelişmiş Anı Filtreleme Paneli"
                    className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition active:scale-95 border border-slate-700"
                  >
                    Tüm Anılar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customize Dock Items Drawer */}
        {activePopup === 'customize' && (
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-white w-72 sm:w-80 animate-fadeIn space-y-3 mb-1">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs sm:text-sm font-bold text-white">Eylem Çubuğunu Özelleştir</h4>
              </div>
              <button
                onClick={() => setActivePopup(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Ana ekranda görünmesini istediğin ilk 3 hızlı eylemi seç:
            </p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
              {Object.values(ALL_AVAILABLE_ACTIONS).map((action) => {
                const isSelected = activeActionIds.includes(action.id);
                const IconComponent = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleToggleCustomizeAction(action.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs transition active:scale-98 ${
                      isSelected
                        ? 'bg-slate-800 border-indigo-500/70 text-white'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${action.colorGradient} flex items-center justify-center text-white`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-200">{action.title}</div>
                        <div className="text-[10px] text-slate-400">{action.badge}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
              <span>Seçilen: {activeActionIds.length}/3</span>
              <button
                onClick={() => {
                  setActiveActionIds(DEFAULT_TOP_THREE);
                  localStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(DEFAULT_TOP_THREE));
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Varsayılana Dön
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MAIN DOCK BAR */}
        {/* ======================================================== */}
        {isCollapsed ? (
          /* Minimized Compact Floating Pill */
          <button
            onClick={toggleCollapse}
            title="Hızlı Eylem Çubuğunu Genişlet"
            className="group flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-xl border border-white/20 hover:border-indigo-400/60 rounded-full shadow-2xl transition-all duration-200 active:scale-95 text-white"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex items-center -space-x-1">
              {activeActionIds.map((actId) => {
                const act = ALL_AVAILABLE_ACTIONS[actId];
                if (!act) return null;
                const Icon = act.icon;
                return (
                  <div
                    key={actId}
                    className={`w-5 h-5 rounded-full bg-gradient-to-tr ${act.colorGradient} flex items-center justify-center text-white ring-2 ring-slate-900`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                  </div>
                );
              })}
            </div>
            <span className="text-xs font-bold tracking-wide text-slate-200 group-hover:text-white">
              Hızlı Eylemler
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform" />
          </button>
        ) : (
          /* Full Expanded Action Dock */
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/15 rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 shadow-2xl transition-all duration-300 flex items-center gap-1.5 sm:gap-2">
            {/* Action Buttons: The User's Top 3 Features */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {activeActionIds.map((actId, index) => {
                const act = ALL_AVAILABLE_ACTIONS[actId];
                if (!act) return null;
                const IconComponent = act.icon;
                const count = stats[actId] || 0;
                const isPopupOpen =
                  (actId === 'quick_reply' && activePopup === 'quick_reply') ||
                  (actId === 'add_memory' && activePopup === 'add_memory');

                return (
                  <button
                    key={actId}
                    onClick={() => handleActionClick(actId)}
                    title={`${act.title} - ${act.subtitle}`}
                    className={`group relative flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-2xl transition-all duration-200 active:scale-95 border ${
                      isPopupOpen
                        ? 'bg-slate-800/95 border-indigo-400/80 shadow-lg scale-102 ring-2 ring-indigo-500/20'
                        : 'bg-slate-800/60 hover:bg-slate-800/90 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    {/* Glowing Icon Avatar */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr ${act.colorGradient} flex items-center justify-center text-white shadow-md transition-transform duration-200 group-hover:scale-110 shrink-0`}
                      style={{
                        boxShadow: `0 4px 12px ${act.glowColor}`,
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Text Label & Badge */}
                    <div className="text-left hidden xs:block">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white tracking-tight group-hover:text-cyan-200 transition-colors">
                          {act.title}
                        </span>
                        {index === 0 && (
                          <span className="text-[9px] px-1 py-0.2 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                            ★ Top
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {count > 0 ? `${count} kez` : act.badge}
                      </div>
                    </div>

                    {/* Mobile icon only indicator badge */}
                    <div className="xs:hidden absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-600 text-[8px] text-slate-300 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dock Controls: Customize & Collapse */}
            <div className="flex items-center gap-0.5 pl-1 border-l border-slate-800 text-slate-400">
              <button
                onClick={() =>
                  setActivePopup((prev) => (prev === 'customize' ? null : 'customize'))
                }
                title="Eylem Çubuğunu Özelleştir"
                className={`p-1.5 sm:p-2 rounded-xl transition hover:text-white hover:bg-slate-800 ${
                  activePopup === 'customize' ? 'text-amber-400 bg-slate-800' : ''
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={toggleCollapse}
                title="Çubuğu Küçült"
                className="p-1.5 sm:p-2 rounded-xl transition hover:text-white hover:bg-slate-800"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
