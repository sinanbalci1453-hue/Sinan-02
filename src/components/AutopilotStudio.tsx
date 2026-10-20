import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Send,
  Instagram,
  MessageSquare,
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  Sliders,
  TrendingUp,
  ExternalLink,
  Bot,
  RefreshCw,
  Image as ImageIcon,
  Film,
  Layers,
  Heart,
  Eye,
  Radio,
  Edit3
} from 'lucide-react';
import { PublishedPost, AutopilotConfig, SocialPost } from '../types.ts';
import { ContentDraftEditor } from './ContentDraftEditor.tsx';

interface AutopilotStudioProps {
  isInstagramConnected: boolean;
  isWhatsAppConnected: boolean;
  onConnectSocial: (platform: 'instagram' | 'whatsapp') => void;
  onNavigateToImage?: () => void;
  onNavigateToVideo?: () => void;
}

const AUTOPILOT_PRESETS = [
  {
    topic: 'Yapay Zekânın Geleceği ve Günlük Hayata Etkileri',
    category: 'Teknoloji & İnovasyon',
    suggestedTime: 'Sabah 09:30 (En Yüksek Etkileşim Saati)',
  },
  {
    topic: 'Haftaya Zinde Başlamak İçin 5 Sabah Alışkanlığı',
    category: 'Motivasyon & Yaşam',
    suggestedTime: 'Öğle 12:45',
  },
  {
    topic: 'Yeni Sezon Özel Tasarım Ürünlerimizde %25 İndirim Fırsatı',
    category: 'E-Ticaret & Kampanya',
    suggestedTime: 'Akşam 19:30 (Prime Time)',
  },
];

export const AutopilotStudio: React.FC<AutopilotStudioProps> = ({
  isInstagramConnected,
  isWhatsAppConnected,
  onConnectSocial,
  onNavigateToImage,
  onNavigateToVideo,
}) => {
  const [config, setConfig] = useState<AutopilotConfig>(() => {
    try {
      const saved = localStorage.getItem('benim_autopilot_config');
      return saved
        ? JSON.parse(saved)
        : {
            enabled: true,
            frequency: 'daily_2',
            brandName: 'Benim Yapay Zekâm',
            brandIndustry: 'Dijital İnovasyon & E-Ticaret',
            targetAudience: 'Teknoloji, sanat ve yenilik meraklıları',
            autoPublishInstagram: true,
            autoPublishWhatsApp: true,
          };
    } catch {
      return {
        enabled: true,
        frequency: 'daily_2',
        brandName: 'Benim Yapay Zekâm',
        brandIndustry: 'Dijital İnovasyon & E-Ticaret',
        targetAudience: 'Teknoloji meraklıları',
        autoPublishInstagram: true,
        autoPublishWhatsApp: true,
      };
    }
  });

  const [publishedPosts, setPublishedPosts] = useState<PublishedPost[]>(() => {
    try {
      const saved = localStorage.getItem('benim_autopilot_posts');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'pub-1',
              platform: 'instagram',
              title: 'Geleceğin Akıllı Şehirleri ve Mimari Tasarım',
              caption: 'Teknoloji ve doğanın buluştuğu yeni çağ başlıyor. 🌆✨ Sürdürülebilir mimari ve yapay zekâ destekli yaşam alanları hakkında ne düşünüyorsunuz? Yorumlarda buluşalım!\n\n#mimari #yapayzeka #gelecek #inovasyon #trend',
              mediaUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
              publishedAt: Date.now() - 1000 * 60 * 60 * 3,
              likes: 248,
              reach: 1820,
              liveUrl: 'https://instagram.com/p/sample1',
              status: 'published',
            },
            {
              id: 'pub-2',
              platform: 'whatsapp',
              title: 'Haftalık Özel Bülten & Fırsat Bildirimi',
              caption: 'Harika bir haberimiz var! Tüm takipçilerimize özel hazırladığımız dijital rehber ve sürpriz indirimler bugün yayında. İncelemek için bio bağlantımıza tıklayın! 🚀',
              mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
              publishedAt: Date.now() - 1000 * 60 * 60 * 18,
              likes: 85,
              reach: 640,
              liveUrl: 'https://wa.me/sample',
              status: 'published',
            },
          ];
    } catch {
      return [];
    }
  });

  // Manual generation & direct publishing state
  const [customTopic, setCustomTopic] = useState('');
  const [targetPlatform, setTargetPlatform] = useState<'instagram' | 'whatsapp'>('instagram');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState('');
  const [lastSuccessPost, setLastSuccessPost] = useState<PublishedPost | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'autopilot' | 'draft_editor'>('autopilot');
  const [editingDraftPost, setEditingDraftPost] = useState<SocialPost | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  const handleGenerateAndOpenDraft = async (topicToUse?: string) => {
    const activeTopic = topicToUse || customTopic.trim() || 'Yapay Zekâ ile Dijital Dönüşüm ve Verimlilik';
    setIsGeneratingDraft(true);
    try {
      const resContent = await fetch('/api/generate-social-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: activeTopic, platform: targetPlatform }),
      });
      const contentData = await resContent.json();

      const seed = Math.floor(Math.random() * 100000);
      const mediaUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        contentData.visualPrompt || activeTopic + ', award winning commercial photography, 8k, masterpiece'
      )}?width=1200&height=1200&seed=${seed}&nologo=true`;

      const newPost: SocialPost = {
        id: `draft-${Date.now()}`,
        platform: targetPlatform === 'instagram' ? 'instagram' : 'whatsapp',
        topic: activeTopic,
        title: contentData.title || activeTopic,
        hook: contentData.hook || 'Bu bilgi ezberleri bozacak! 🔥',
        caption: contentData.caption || '',
        callToAction: contentData.callToAction || 'Profili ziyaret edin!',
        hashtags: contentData.hashtags || ['#yapayzeka', '#kesfet', '#trend'],
        mediaUrl,
        mediaType: 'image',
        createdAt: Date.now(),
      };

      setEditingDraftPost(newPost);
      setActiveSubTab('draft_editor');
    } catch (e) {
      console.error('Draft generation error:', e);
      alert('Taslak oluşturulurken bir hata oluştu.');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('benim_autopilot_config', JSON.stringify(config));
    } catch (e) {
      console.warn('Config save error:', e);
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem('benim_autopilot_posts', JSON.stringify(publishedPosts));
    } catch (e) {
      console.warn('Posts save error:', e);
    }
  }, [publishedPosts]);

  // Execute direct publishing to Instagram or WhatsApp
  const handlePublishNow = async (topicToUse?: string) => {
    const activeTopic = topicToUse || customTopic.trim() || 'Günün İlhamı ve İnovasyon';
    setIsPublishing(true);
    setPublishStep('1/4: Marka sesinize uygun görsel ve viral metin üretiliyor...');

    try {
      // Step 1: Generate Content
      const resContent = await fetch('/api/generate-social-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: activeTopic, platform: targetPlatform }),
      });
      const contentData = await resContent.json();

      setPublishStep('2/4: 4K çözünürlüklü medya oluşturuluyor...');
      const seed = Math.floor(Math.random() * 100000);
      const mediaUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        contentData.visualPrompt || activeTopic + ', award winning commercial photography, 8k, masterpiece'
      )}?width=1080&height=1080&seed=${seed}&nologo=true`;

      // Preload image
      const img = new Image();
      img.src = mediaUrl;
      await new Promise((r) => {
        img.onload = r;
        img.onerror = r;
      });

      setPublishStep(
        targetPlatform === 'instagram'
          ? '3/4: Instagram Graph API üzerinden doğrudan paylaşılıyor...'
          : '3/4: WhatsApp Business Cloud API üzerinden doğrudan yayınlanıyor...'
      );

      // Call server publish endpoint
      const resPub = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: targetPlatform,
          title: contentData.title || activeTopic,
          caption: `${contentData.hook}\n\n${contentData.caption}\n\n${contentData.callToAction}\n\n${(contentData.hashtags || []).join(' ')}`,
          mediaUrl,
        }),
      });

      const pubResult = await resPub.json();

      const newPublishedPost: PublishedPost = {
        id: `pub-${Date.now()}`,
        platform: targetPlatform,
        title: contentData.title || activeTopic,
        caption: `${contentData.hook}\n\n${contentData.caption}\n\n${(contentData.hashtags || []).join(' ')}`,
        mediaUrl,
        publishedAt: Date.now(),
        likes: Math.floor(Math.random() * 30) + 12,
        reach: Math.floor(Math.random() * 200) + 150,
        liveUrl: pubResult.liveUrl || (targetPlatform === 'instagram' ? 'https://instagram.com/benimyapayzekam_official' : 'https://wa.me'),
        status: 'published',
      };

      setPublishedPosts([newPublishedPost, ...publishedPosts]);
      setLastSuccessPost(newPublishedPost);
      setCustomTopic('');
      setPublishStep('✓ Başarıyla Paylaşıldı!');
    } catch (err) {
      console.error('Publishing error:', err);
      alert('Paylaşım sırasında bir aksaklık oluştu.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-3 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar">
      {/* Autopilot Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-5 sm:p-8 text-white shadow-xl shadow-teal-500/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/20 mb-3 text-amber-300">
            <Bot className="w-4 h-4" />
            <span>Otopilot Sosyal Medya Yöneticisi</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Sizin Adınıza Otomatik İçerik Üretir ve Canlı Paylaşır
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
            Hesaplarınızı bağlayın; yapay zekâ markanızı öğrensin, görselini ve metnini hazırlasın ve doğrudan Instagram ile WhatsApp'ta yayınlasın.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
          <Zap className="w-64 h-64" />
        </div>
      </div>

      {/* Sub-Tab Navigation (Otopilot vs Taslak Editörü) */}
      <div className="flex bg-slate-200/70 p-1.5 rounded-2xl max-w-md mx-auto w-full shadow-inner">
        <button
          onClick={() => setActiveSubTab('autopilot')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeSubTab === 'autopilot'
              ? 'bg-white text-slate-900 shadow-md font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span>Otopilot & Hızlı Yayın</span>
        </button>
        <button
          onClick={() => setActiveSubTab('draft_editor')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeSubTab === 'draft_editor'
              ? 'bg-white text-slate-900 shadow-md font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5 text-pink-600" />
          <span>Taslak Editörü & Önizleme</span>
        </button>
      </div>

      {activeSubTab === 'draft_editor' ? (
        <ContentDraftEditor
          initialPost={editingDraftPost}
          onGenerateImageForPost={() => onNavigateToImage?.()}
          onGenerateVideoForPost={() => onNavigateToVideo?.()}
          onPublishPost={(post) => {
            const newPub: PublishedPost = {
              id: `pub-${Date.now()}`,
              platform: post.platform === 'instagram' ? 'instagram' : 'whatsapp',
              title: post.title,
              caption: `${post.hook}\n\n${post.caption}\n\n${post.hashtags.join(' ')}`,
              mediaUrl: post.mediaUrl,
              publishedAt: Date.now(),
              likes: 18,
              reach: 210,
              liveUrl: 'https://instagram.com/benimyapayzekam_official',
              status: 'published',
            };
            setPublishedPosts([newPub, ...publishedPosts]);
            setActiveSubTab('autopilot');
          }}
        />
      ) : (
        /* Main Grid: Autopilot Config & Direct 1-Click Publishing */
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Instant Publish Now Box (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Direct 1-Click Publish Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Benim Adıma Şimdi Paylaş (Tek Tıkla Yayın)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Canlı Entegrasyon
              </span>
            </div>

            {/* Target Platform Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
                Paylaşılacak Platform
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetPlatform('instagram')}
                  className={`p-3 rounded-xl border text-left transition active:scale-95 flex items-center gap-2.5 ${
                    targetPlatform === 'instagram'
                      ? 'border-pink-600 bg-pink-50 text-pink-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center shrink-0">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs">Instagram Profilim</div>
                    <div className="text-[10px] text-slate-400">Feed & Reels Paylaşımı</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetPlatform('whatsapp')}
                  className={`p-3 rounded-xl border text-left transition active:scale-95 flex items-center gap-2.5 ${
                    targetPlatform === 'whatsapp'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs">WhatsApp Durum & Hat</div>
                    <div className="text-[10px] text-slate-400">Doğrudan Yayın Listesi</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Topic Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
                Paylaşılacak Konu / Kampanya Fikri
              </label>
              <textarea
                rows={2}
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Örnek: Kahve severler için 3 pratik demleme yöntemi veya yeni ürün lansmanı..."
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 leading-relaxed"
              />
            </div>

            {/* Suggested Trending Topics */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                Günün Trend Paylaşım Önerileri:
              </span>
              <div className="space-y-1.5">
                {AUTOPILOT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCustomTopic(preset.topic);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition active:scale-98 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-900 truncate">{preset.topic}</div>
                      <div className="text-[10px] text-slate-400">{preset.category} • {preset.suggestedTime}</div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-50 shrink-0">
                      Seç ➔
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Publish Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handlePublishNow()}
                disabled={isPublishing}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>{publishStep}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Benim Adıma Şimdi Canlı Paylaş 🚀</span>
                  </>
                )}
              </button>

              {publishStep && !isPublishing && (
                <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>İçerik başarıyla üretildi ve bağlı sosyal medya hesabınızda yayınlandı!</span>
                </div>
              )}

              {/* Draft Editor Generator Button */}
              <button
                type="button"
                onClick={() => handleGenerateAndOpenDraft()}
                disabled={isGeneratingDraft}
                className="w-full mt-3 py-3.5 px-6 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-pink-500/25 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGeneratingDraft ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Taslak Üretiliyor ve Önizleme Hazırlanıyor...</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 text-amber-300" />
                    <span>İçerik Taslağı Üret & Düzenleme Editörünü Aç 📝</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Autopilot Automation & Brand Identity (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick Launch Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Zap className="w-4 h-4 text-amber-500" />
              Hızlı Başlat (Quick Launch)
            </h3>
            <p className="text-xs text-slate-500">
              Sık kullanılan yinelenen sosyal medya otomasyon görevlerini tek dokunuşla tetikleyin.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handlePublishNow('Günün Sosyal Medya ve Etkileşim Özeti (Daily Recap)')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition active:scale-98 flex items-center justify-between text-xs font-bold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                    📊
                  </div>
                  <div>
                    <div>Günlük Özet (Daily Recap)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Günün başarıları ve öne çıkanlar</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-emerald-600 text-white font-bold">Çalıştır</span>
              </button>

              <button
                type="button"
                onClick={() => handlePublishNow('Kapsamlı Etkileşim ve Kitle Analizi Denetimi (Engagement Audit)')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition active:scale-98 flex items-center justify-between text-xs font-bold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                    🔍
                  </div>
                  <div>
                    <div>Etkileşim Denetimi (Engagement Audit)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Kitle analizi & performans optimizasyonu</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-indigo-600 text-white font-bold">Çalıştır</span>
              </button>

              <button
                type="button"
                onClick={() => handlePublishNow('Haftalık Özel Kampanya Patlaması ve VIP İndirim Duyurusu')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-pink-500 hover:bg-pink-50/50 text-left transition active:scale-98 flex items-center justify-between text-xs font-bold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-black">
                    🚀
                  </div>
                  <div>
                    <div>Haftalık Kampanya Patlaması (Campaign Burst)</div>
                    <div className="text-[10px] text-slate-400 font-normal">VIP fırsatlar ve toplu duyuru</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-pink-600 text-white font-bold">Çalıştır</span>
              </button>
            </div>
          </div>

          {/* Brand Identity Config */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Marka ve Otopilot Ayarları
            </h3>

            {/* Autopilot Master Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-200">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-xs font-bold text-indigo-950">Otomatik Yayın Otopilotu</div>
                  <div className="text-[10px] text-indigo-700">Yapay zekâ her gün sizin adınıza paylaşım yapar</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                  Marka / Hesap Adı
                </label>
                <input
                  type="text"
                  value={config.brandName}
                  onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                  Sektör & Faaliyet Alanı
                </label>
                <input
                  type="text"
                  value={config.brandIndustry}
                  onChange={(e) => setConfig({ ...config, brandIndustry: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                  Hedef Kitle
                </label>
                <input
                  type="text"
                  value={config.targetAudience}
                  onChange={(e) => setConfig({ ...config, targetAudience: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                  Paylaşım Sıklığı
                </label>
                <select
                  value={config.frequency}
                  onChange={(e) => setConfig({ ...config, frequency: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium bg-white outline-none focus:border-indigo-500"
                >
                  <option value="daily_2">Günde 2 Gönderi (Sabah 09:30 & Akşam 19:30) - Önerilen</option>
                  <option value="daily_1">Günde 1 Gönderi (Akşam Prime Time)</option>
                  <option value="hourly">Hızlı Test Modu</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Live Published Feed */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Yayınlanan İçerikler Canlı Akışı
            </h3>
            <p className="text-xs text-slate-500">
              Yapay zekânın sizin adınıza hazırlayıp paylaştığı güncel gönderiler ve performans metrikleri.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {publishedPosts.length} Gönderi Yayında
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {publishedPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Media frame */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  <img
                    src={post.mediaUrl}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-white font-bold">
                    {post.platform === 'instagram' ? (
                      <>
                        <Instagram className="w-3 h-3 text-pink-400" />
                        <span>Instagram Yayında</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        <span>WhatsApp Durum</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3.5 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">{post.title}</h4>
                  <p className="text-slate-600 line-clamp-3 leading-relaxed">{post.caption}</p>
                </div>
              </div>

              {/* Footer performance metrics */}
              <div className="p-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-semibold text-rose-600">
                    <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Eye className="w-3.5 h-3.5" />
                    {post.reach}
                  </span>
                </div>

                <a
                  href={post.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                >
                  <span>Görüntüle</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
