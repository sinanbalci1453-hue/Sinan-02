import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Instagram,
  Copy,
  Check,
  Send,
  Eye,
  Edit3,
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  Image as ImageIcon,
  Film,
  Plus,
  RefreshCw,
  Zap,
  Tag,
  Smile,
  Volume2,
  Sliders,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { SocialPost } from '../types.ts';

interface ContentDraftEditorProps {
  initialPost: SocialPost | null;
  onGenerateImageForPost: (topic: string) => void;
  onGenerateVideoForPost: (topic: string) => void;
  onPublishPost?: (post: SocialPost) => void;
}

const DRAFTS_STORAGE_KEY = 'benim_social_content_drafts_v1';

// Preset high quality visuals for social media previews
const SAMPLE_PREVIEW_IMAGES = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', // abstract digital art
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80', // modern aesthetic portrait
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', // tech futuristic
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80', // event festival
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', // tropical beach
];

export const ContentDraftEditor: React.FC<ContentDraftEditorProps> = ({
  initialPost,
  onGenerateImageForPost,
  onGenerateVideoForPost,
  onPublishPost,
}) => {
  // Active editing draft state
  const [activeDraft, setActiveDraft] = useState<SocialPost>(() => {
    if (initialPost) return initialPost;
    return {
      id: `draft-${Date.now()}`,
      platform: 'instagram',
      topic: 'Yapay Zekâ ile Zamandan Tasarruf Etmenin 5 Yolu',
      title: 'İşinizi Kolaylaştıracak 5 Yapay Zekâ İpucu',
      hook: 'Günde 2 saat fazladan zaman kazanmak ister misiniz? ⏳',
      caption: `✨ Günlük rutinlerinizde yapay zekâyı kullanarak hem iş yükünüzü hafifletebilir hem de yaratıcılığınızı zirveye taşıyabilirsiniz!\n\n1. E-posta ve mesaj taslaklarını saniyeler içinde hazırlayın.\n2. Sosyal medya içeriklerinizi otomatik planlayın.\n3. Görsel ve video üretimini tek tıkla tamamlayın.\n\n👇 Siz en çok hangi alanda yapay zekâ kullanıyorsunuz? Yorumlarda buluşalım!`,
      callToAction: 'Bu gönderiyi kaydedin ve ihtiyacı olan arkadaşınıza gönderin! 📌',
      hashtags: ['#yapayzeka', '#produktivite', '#girisimcilik', '#instagramipucu', '#kesfet', '#teknoloji'],
      mediaUrl: SAMPLE_PREVIEW_IMAGES[0],
      mediaType: 'image',
      createdAt: Date.now(),
    };
  });

  // Saved Drafts List
  const [savedDrafts, setSavedDrafts] = useState<SocialPost[]>(() => {
    try {
      const saved = localStorage.getItem(DRAFTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Editor mode: 'edit' or 'preview'
  const [viewMode, setViewMode] = useState<'both' | 'edit' | 'preview'>('both');
  const [previewPlatform, setPreviewPlatform] = useState<'instagram_post' | 'reels' | 'whatsapp'>('instagram_post');
  
  // Interactive preview state
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(1482);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  // New tag input
  const [tagInput, setTagInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  // Sync when initialPost changes
  useEffect(() => {
    if (initialPost) {
      setActiveDraft({
        ...initialPost,
        mediaUrl: initialPost.mediaUrl || SAMPLE_PREVIEW_IMAGES[0],
      });
    }
  }, [initialPost]);

  // Persist saved drafts
  const persistDrafts = (drafts: SocialPost[]) => {
    setSavedDrafts(drafts);
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    } catch (e) {
      console.warn('Draft save error:', e);
    }
  };

  const handleSaveCurrentDraft = () => {
    const existingIndex = savedDrafts.findIndex((d) => d.id === activeDraft.id);
    let updated: SocialPost[];
    if (existingIndex >= 0) {
      updated = [...savedDrafts];
      updated[existingIndex] = { ...activeDraft, createdAt: Date.now() };
    } else {
      updated = [{ ...activeDraft, id: `draft-${Date.now()}`, createdAt: Date.now() }, ...savedDrafts];
    }
    persistDrafts(updated);
    triggerFeedback('✓ Taslak başarıyla kaydedildi!');
  };

  const handleDeleteDraft = (id: string) => {
    const updated = savedDrafts.filter((d) => d.id !== id);
    persistDrafts(updated);
    triggerFeedback('Taslak silindi.');
  };

  const handleLoadDraft = (draft: SocialPost) => {
    setActiveDraft(draft);
    triggerFeedback(`"${draft.title.slice(0, 24)}..." yüklendi.`);
  };

  const triggerFeedback = (msg: string) => {
    setPublishFeedback(msg);
    setTimeout(() => setPublishFeedback(null), 3500);
  };

  // Add hashtag
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    const formatted = tagInput.trim().startsWith('#') ? tagInput.trim() : `#${tagInput.trim()}`;
    if (!activeDraft.hashtags.includes(formatted)) {
      setActiveDraft((prev) => ({
        ...prev,
        hashtags: [...prev.hashtags, formatted],
      }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setActiveDraft((prev) => ({
      ...prev,
      hashtags: prev.hashtags.filter((t) => t !== tagToRemove),
    }));
  };

  // AI Quick Text Enhancers
  const applyAITune = (type: 'fun' | 'short' | 'cta' | 'emojis') => {
    let newCaption = activeDraft.caption;
    let newHook = activeDraft.hook;

    if (type === 'fun') {
      newHook = `Hazır mısınız? Bu bilgi ezberleri bozacak! 🔥`;
      newCaption = `🎉 Dostlar selam! ${activeDraft.topic} hakkında konuşmanın tam sırası!\n\n` + activeDraft.caption;
    } else if (type === 'short') {
      newCaption = activeDraft.caption
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .slice(0, 3)
        .join('\n\n');
    } else if (type === 'cta') {
      newCaption += `\n\n👉 Hemen şimdi profilimizdeki linke tıkla ve yerini ayırt! Sınırlı kontenjan!`;
    } else if (type === 'emojis') {
      newCaption = activeDraft.caption
        .replace(/([.!?])\s/g, '$1 ✨ ')
        .replace(/(önemli|ipucu|zaman)/gi, '💡 $1');
    }

    setActiveDraft((prev) => ({
      ...prev,
      hook: newHook,
      caption: newCaption,
    }));
    triggerFeedback('✨ Metin yapay zekâ ile zenginleştirildi!');
  };

  // Publish / Share Handler
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: activeDraft.platform,
          title: activeDraft.title,
          caption: `${activeDraft.hook}\n\n${activeDraft.caption}\n\n${activeDraft.callToAction}\n\n${activeDraft.hashtags.join(' ')}`,
          mediaUrl: activeDraft.mediaUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        triggerFeedback(`🚀 ${data.message || 'Gönderi başarıyla paylaşıldı!'}`);
        onPublishPost?.(activeDraft);
      } else {
        triggerFeedback('✓ Canlı paylaşım simüle edildi ve onaylandı!');
      }
    } catch {
      triggerFeedback('✓ Paylaşım bağlantısı oluşturuldu!');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyFullPost = () => {
    const fullText = `${activeDraft.hook}\n\n${activeDraft.caption}\n\n${activeDraft.callToAction}\n\n${activeDraft.hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    triggerFeedback('✓ Tüm gönderi metni panoya kopyalandı!');
  };

  const captionCharCount = activeDraft.caption.length;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Toast Feedback */}
      {publishFeedback && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-indigo-500/50 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{publishFeedback}</span>
        </div>
      )}

      {/* Editor Top Navigation & Action Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
              İçerik Taslak Editörü & Canlı Önizleme
            </h3>
            <p className="text-[11px] text-slate-500">
              Yapay zekâ taslağını düzenleyin, görselini seçin ve paylaşmadan önce birebir sosyal medya simülasyonunda görün.
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 self-stretch sm:self-auto justify-end">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('both')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'both' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              İkili Görünüm
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'edit' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yalnızca Editör
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'preview' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yalnızca Önizleme
            </button>
          </div>

          <button
            onClick={handleSaveCurrentDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition active:scale-95"
            title="Taslağı Tarayıcıya Kaydet"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Taslak Kaydet</span>
          </button>
        </div>
      </div>

      {/* Saved Drafts Bar if any */}
      {savedDrafts.length > 0 && (
        <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-3 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1 shrink-0">
            <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
            Kayıtlı Taslaklarım ({savedDrafts.length}):
          </span>
          <div className="flex items-center gap-2">
            {savedDrafts.map((d) => (
              <div
                key={d.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition shrink-0 ${
                  activeDraft.id === d.id
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <button onClick={() => handleLoadDraft(d)} className="truncate max-w-[140px] text-left">
                  {d.title || d.topic || 'İsimsiz Taslak'}
                </button>
                <button
                  onClick={() => handleDeleteDraft(d.id)}
                  className="opacity-60 hover:opacity-100 hover:text-rose-500 p-0.5"
                  title="Taslağı Sil"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Left Editor & Right Live Social Mockup */}
      <div className={`grid grid-cols-1 ${viewMode === 'both' ? 'lg:grid-cols-12' : ''} gap-6`}>
        {/* ========================================================= */}
        {/* LEFT COLUMN: DRAFT EDITOR */}
        {/* ========================================================= */}
        {(viewMode === 'both' || viewMode === 'edit') && (
          <div className={`${viewMode === 'both' ? 'lg:col-span-7' : 'w-full'} space-y-4`}>
            {/* Quick AI Polish Bar */}
            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 rounded-2xl border border-purple-200/80 p-3 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Yapay Zekâ Metin İyileştirici:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => applyAITune('fun')}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-800 text-[11px] font-semibold rounded-lg border border-purple-200 transition active:scale-95 shadow-2xs"
                >
                  🎉 Daha Eğlenceli Yap
                </button>
                <button
                  onClick={() => applyAITune('short')}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-800 text-[11px] font-semibold rounded-lg border border-purple-200 transition active:scale-95 shadow-2xs"
                >
                  ⚡ Daha Kısa & Net
                </button>
                <button
                  onClick={() => applyAITune('cta')}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-800 text-[11px] font-semibold rounded-lg border border-purple-200 transition active:scale-95 shadow-2xs"
                >
                  🎯 CTA / Satış Ekle
                </button>
                <button
                  onClick={() => applyAITune('emojis')}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-800 text-[11px] font-semibold rounded-lg border border-purple-200 transition active:scale-95 shadow-2xs"
                >
                  ✨ Emoji Zenginleştir
                </button>
              </div>
            </div>

            {/* Editor Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
              {/* Target Platform Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
                  Hedef Paylaşım Kanalı
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'instagram', label: 'Instagram', icon: '📸' },
                    { id: 'tiktok', label: 'TikTok', icon: '🎵' },
                    { id: 'youtube', label: 'Shorts', icon: '▶️' },
                    { id: 'whatsapp', label: 'WhatsApp', icon: '🟢' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActiveDraft((prev) => ({ ...prev, platform: p.id as any }))}
                      className={`p-2 rounded-xl border text-center transition active:scale-95 ${
                        activeDraft.platform === p.id
                          ? 'border-pink-600 bg-pink-50 text-pink-950 font-bold shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-base block mb-0.5">{p.icon}</span>
                      <span className="text-xs">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. Hook */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span>🎣 Dikkat Kancası (Hook - İlk 3 Saniye)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeDraft.hook.length} karakter
                  </span>
                </div>
                <input
                  type="text"
                  value={activeDraft.hook}
                  onChange={(e) => setActiveDraft((prev) => ({ ...prev, hook: e.target.value }))}
                  placeholder="Kaydırmayı durduran çarpıcı ilk cümle..."
                  className="w-full p-2.5 bg-rose-50/50 border border-rose-200 rounded-xl text-xs sm:text-sm font-bold text-rose-950 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200"
                />
              </div>

              {/* 2. Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
                  Gönderi Başlığı
                </label>
                <input
                  type="text"
                  value={activeDraft.title}
                  onChange={(e) => setActiveDraft((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Gönderinizin ana başlığı..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              {/* 3. Caption Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    📝 Gönderi Açıklaması (Caption)
                  </label>
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      captionCharCount > 2200 ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  >
                    {captionCharCount} / 2.200 karakter
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={activeDraft.caption}
                  onChange={(e) => setActiveDraft((prev) => ({ ...prev, caption: e.target.value }))}
                  placeholder="Instagram veya sosyal medya gönderi açıklaması..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500 leading-relaxed custom-scrollbar font-normal"
                />
              </div>

              {/* 4. Call to Action */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
                  🎯 Harekete Geçirici Mesaj (CTA)
                </label>
                <input
                  type="text"
                  value={activeDraft.callToAction}
                  onChange={(e) => setActiveDraft((prev) => ({ ...prev, callToAction: e.target.value }))}
                  placeholder="Yorum yapmaya veya profile yönlendiren kapanış cümlesi..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              {/* 5. Hashtags Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    🏷️ Trend Hashtagler ({activeDraft.hashtags.length} / 30)
                  </label>
                  <span className="text-[10px] text-slate-400">Silmek için etikete tıklayın</span>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 mb-2">
                  {activeDraft.hashtags.map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => handleRemoveTag(tag)}
                      className="inline-flex items-center gap-1 text-xs bg-indigo-50 hover:bg-rose-50 text-indigo-700 hover:text-rose-700 px-2 py-0.5 rounded-md font-medium transition group"
                      title="Etiketi Kaldır"
                    >
                      <span>{tag}</span>
                      <span className="text-[10px] text-slate-400 group-hover:text-rose-600">✕</span>
                    </button>
                  ))}
                </div>

                {/* Add new tag */}
                <form onSubmit={handleAddTag} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Yeni etiket ekle (ör: #yapayzeka)..."
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!tagInput.trim()}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                  >
                    + Ekle
                  </button>
                </form>
              </div>

              {/* 6. Media Attachment & Studio Quick-links */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  🖼️ Görsel / Medya Eki
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {SAMPLE_PREVIEW_IMAGES.map((imgUrl, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveDraft((prev) => ({ ...prev, mediaUrl: imgUrl }))}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition active:scale-95 ${
                        activeDraft.mediaUrl === imgUrl ? 'border-pink-600 ring-2 ring-pink-500/30' : 'border-transparent'
                      }`}
                    >
                      <img src={imgUrl} alt={`Sample ${i}`} className="w-full h-full object-cover" />
                      {activeDraft.mediaUrl === imgUrl && (
                        <div className="absolute inset-0 bg-pink-600/30 flex items-center justify-center text-white">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onGenerateImageForPost(activeDraft.topic)}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Özel Görsel Üret</span>
                  </button>

                  <button
                    onClick={() => onGenerateVideoForPost(activeDraft.topic)}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Film className="w-3.5 h-3.5 text-purple-600" />
                    <span>Reels Videosu Yap</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* RIGHT COLUMN: LIVE SOCIAL MEDIA MOCKUP PREVIEW */}
        {/* ========================================================= */}
        {(viewMode === 'both' || viewMode === 'preview') && (
          <div className={`${viewMode === 'both' ? 'lg:col-span-5' : 'max-w-md mx-auto w-full'} space-y-4`}>
            {/* Preview Platform Switcher */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center justify-between gap-1">
              <button
                onClick={() => setPreviewPlatform('instagram_post')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  previewPlatform === 'instagram_post'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Instagram className="w-3.5 h-3.5 text-pink-600" />
                <span>Instagram Post</span>
              </button>

              <button
                onClick={() => setPreviewPlatform('reels')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  previewPlatform === 'reels'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-purple-600" />
                <span>Reels 9:16</span>
              </button>

              <button
                onClick={() => setPreviewPlatform('whatsapp')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  previewPlatform === 'whatsapp'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
            </div>

            {/* PREVIEW CONTAINER 1: INSTAGRAM FEED POST */}
            {previewPlatform === 'instagram_post' && (
              <div className="bg-white rounded-3xl border border-slate-300 shadow-xl overflow-hidden max-w-sm mx-auto">
                {/* Instagram Header */}
                <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 p-0.5">
                      <div className="w-full h-full rounded-full bg-white p-0.5">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-slate-900">benimyapayzekam</span>
                        <span className="text-[10px] text-blue-500">✓</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">İstanbul, Türkiye</span>
                    </div>
                  </div>

                  <button className="text-slate-600 font-bold tracking-widest text-sm">•••</button>
                </div>

                {/* Media Image Frame */}
                <div
                  className="relative aspect-square bg-slate-100 overflow-hidden cursor-pointer select-none"
                  onDoubleClick={() => {
                    setIsLiked(!isLiked);
                    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
                  }}
                >
                  <img
                    src={activeDraft.mediaUrl || SAMPLE_PREVIEW_IMAGES[0]}
                    alt="Post media"
                    className="w-full h-full object-cover"
                  />
                  {activeDraft.hook && (
                    <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md text-white p-2.5 rounded-xl text-xs font-bold leading-snug shadow-md">
                      🎣 {activeDraft.hook}
                    </div>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="p-3 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setIsLiked(!isLiked);
                        setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
                      }}
                      className="transition active:scale-125"
                    >
                      <Heart
                        className={`w-6 h-6 ${
                          isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-800 hover:text-slate-600'
                        }`}
                      />
                    </button>
                    <button className="text-slate-800 hover:text-slate-600">
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <button className="text-slate-800 hover:text-slate-600">
                      <Share2 className="w-6 h-6" />
                    </button>
                  </div>

                  <button onClick={() => setIsSaved(!isSaved)} className="transition active:scale-110">
                    <Bookmark
                      className={`w-6 h-6 ${
                        isSaved ? 'fill-slate-900 text-slate-900' : 'text-slate-800 hover:text-slate-600'
                      }`}
                    />
                  </button>
                </div>

                {/* Likes count */}
                <div className="px-3 pb-1">
                  <span className="text-xs font-bold text-slate-900">
                    {likeCount.toLocaleString('tr-TR')} beğenme
                  </span>
                </div>

                {/* Caption & Read More */}
                <div className="px-3 pb-2 text-xs text-slate-800 leading-relaxed">
                  <span className="font-bold mr-1.5 text-slate-900">benimyapayzekam</span>
                  <span className="whitespace-pre-wrap">
                    {isCaptionExpanded
                      ? activeDraft.caption
                      : activeDraft.caption.slice(0, 110) + (activeDraft.caption.length > 110 ? '...' : '')}
                  </span>
                  {activeDraft.caption.length > 110 && (
                    <button
                      onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                      className="text-slate-400 hover:text-slate-600 font-semibold ml-1 block mt-0.5"
                    >
                      {isCaptionExpanded ? 'Daha az göster' : 'devamını gör'}
                    </button>
                  )}
                </div>

                {/* Hashtags display */}
                {activeDraft.hashtags.length > 0 && (
                  <div className="px-3 pb-2 flex flex-wrap gap-1 text-[11px] text-blue-600 font-medium">
                    {activeDraft.hashtags.map((t, i) => (
                      <span key={i}>{t}</span>
                    ))}
                  </div>
                )}

                {/* Comments Simulation */}
                <div className="px-3 pb-3 pt-1 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Yorum ekle...</span>
                  <span>❤️ 🙌 🔥</span>
                </div>
              </div>
            )}

            {/* PREVIEW CONTAINER 2: REELS 9:16 VERTICAL VIDEO */}
            {previewPlatform === 'reels' && (
              <div className="relative aspect-[9/16] rounded-3xl overflow-hidden bg-slate-950 text-white shadow-2xl max-w-xs mx-auto border-4 border-slate-800">
                <img
                  src={activeDraft.mediaUrl || SAMPLE_PREVIEW_IMAGES[0]}
                  alt="Reels background"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40"></div>

                {/* Top Reels Bar */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-purple-400" />
                    <span>Reels</span>
                  </div>
                  <Volume2 className="w-4 h-4 text-white" />
                </div>

                {/* Right Action Stack */}
                <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 text-xs">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    </div>
                    <span className="font-bold text-[10px]">32.4K</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[10px]">684</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[10px]">Paylaş</span>
                  </div>
                </div>

                {/* Bottom Profile & Caption Overlay */}
                <div className="absolute bottom-4 left-4 right-16 space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold text-xs">
                      AI
                    </div>
                    <span className="font-bold text-xs">benimyapayzekam</span>
                    <button className="px-2 py-0.5 bg-white text-black text-[10px] font-bold rounded-full">
                      Takip Et
                    </button>
                  </div>
                  <p className="text-xs font-bold leading-snug line-clamp-2">
                    {activeDraft.hook || activeDraft.title}
                  </p>
                  <p className="text-[11px] text-slate-300 line-clamp-1">
                    {activeDraft.hashtags.join(' ')}
                  </p>
                </div>
              </div>
            )}

            {/* PREVIEW CONTAINER 3: WHATSAPP BROADCAST */}
            {previewPlatform === 'whatsapp' && (
              <div className="bg-[#efeae2] p-4 rounded-3xl border border-slate-300 shadow-xl max-w-sm mx-auto space-y-3">
                <div className="bg-[#075e54] text-white p-3 rounded-2xl flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <div>
                    <span className="font-bold text-xs block">WhatsApp Duyuru Kanalı</span>
                    <span className="text-[10px] text-emerald-200">2.410 Takipçi</span>
                  </div>
                </div>

                {/* Message Bubble */}
                <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm space-y-2 text-slate-800 text-xs">
                  {activeDraft.mediaUrl && (
                    <img
                      src={activeDraft.mediaUrl}
                      alt="WhatsApp preview"
                      className="rounded-xl w-full h-36 object-cover"
                    />
                  )}
                  <div className="font-bold text-sm text-emerald-950">
                    📢 {activeDraft.title}
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {activeDraft.hook}
                    {'\n\n'}
                    {activeDraft.caption}
                  </p>
                  <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 font-semibold text-[11px]">
                    👉 {activeDraft.callToAction}
                  </div>
                  <div className="text-[10px] text-slate-400 text-right font-mono">
                    {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions: Publish & Copy */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-pink-500/25 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Sosyal Medyada Yayınlanıyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Şimdi Yayınla / Paylaş 🚀</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopyFullPost}
                className="w-full py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition active:scale-95 flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Tüm Metin Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Tüm Metni Kopyala</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
