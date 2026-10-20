import React, { useState, useEffect } from 'react';
import {
  Share2,
  Instagram,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  Send,
  ExternalLink,
  Bot,
  Zap,
  Image as ImageIcon,
  Film,
  Clock,
  ShieldCheck,
  Link2,
  CheckCircle2,
  HelpCircle,
  Plus,
  Search,
  Edit3,
  RefreshCw,
  MessageCircle,
  ChevronDown
} from 'lucide-react';
import { SocialPost, SocialInboxMessage, SocialConnectionStatus } from '../types.ts';
import { ContentDraftEditor } from './ContentDraftEditor.tsx';

interface SocialHubProps {
  onGenerateImageForPost: (prompt: string) => void;
  onGenerateVideoForPost: (prompt: string) => void;
}

export const SocialHub: React.FC<SocialHubProps> = ({
  onGenerateImageForPost,
  onGenerateVideoForPost,
}) => {
  // Active sub-tab (Default to the new Instagram Inbox module)
  const [subTab, setSubTab] = useState<
    'instagram_inbox' | 'all_inbox' | 'content' | 'whatsapp_tools' | 'oauth_settings'
  >('instagram_inbox');

  // Connections state
  const [connections, setConnections] = useState<SocialConnectionStatus>({
    instagram: { connected: false, username: 'benimyapayzekam_official', autoReplyEnabled: true },
    whatsapp: { connected: false, phoneNumber: '+90 555 123 4567', autoReplyEnabled: true },
  });
  const [callbackUrl, setCallbackUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState<'instagram' | 'whatsapp' | null>(null);

  // Live Inbox state
  const [inbox, setInbox] = useState<SocialInboxMessage[]>([]);
  const [activeMessage, setActiveMessage] = useState<SocialInboxMessage | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [inboxFilter, setInboxFilter] = useState<'all' | 'instagram_dm' | 'instagram_comment' | 'whatsapp'>('all');

  // Instagram Inbox Module specific states
  const [instagramFilter, setInstagramFilter] = useState<'all' | 'dm' | 'comment' | 'pending' | 'replied'>('all');
  const [instagramSearch, setInstagramSearch] = useState('');
  const [sendingDraftKey, setSendingDraftKey] = useState<string | null>(null);
  const [regeneratingDraftsMsgId, setRegeneratingDraftsMsgId] = useState<string | null>(null);
  const [quickToast, setQuickToast] = useState<string | null>(null);
  
  // Inline edit state for drafts
  const [editingDraftInfo, setEditingDraftInfo] = useState<{
    messageId: string;
    text: string;
  } | null>(null);

  // Custom reply expandable per message
  const [customReplyExpandedId, setCustomReplyExpandedId] = useState<string | null>(null);
  const [customReplyText, setCustomReplyText] = useState('');

  // Simulated incoming message test
  const [simText, setSimText] = useState('Merhabalar, bu ürünün fiyatı ve teslimat süresi nedir?');
  const [simPlatform, setSimPlatform] = useState<'instagram_dm' | 'instagram_comment' | 'whatsapp'>('instagram_dm');
  const [isSimulating, setIsSimulating] = useState(false);

  // Content generator state
  const [topic, setTopic] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'tiktok' | 'youtube' | 'whatsapp'>('instagram');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<SocialPost | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // WhatsApp Linker state
  const [whatsappPhone, setWhatsappPhone] = useState('905xxxxxxxxx');
  const [whatsappMessage, setWhatsappMessage] = useState('Merhaba! Benim Yapay Zekâm üzerinden randevu almak ve bilgi edinmek istiyorum.');

  // Fetch connection status and inbox
  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/social/connections');
      if (res.ok) {
        const data = await res.json();
        setConnections({
          instagram: data.instagram,
          whatsapp: data.whatsapp,
        });
        if (data.callbackUrl) setCallbackUrl(data.callbackUrl);
        if (data.webhookUrl) setWebhookUrl(data.webhookUrl);
      }
    } catch (e) {
      console.warn('Failed to fetch connections:', e);
    }
  };

  const fetchInbox = async () => {
    try {
      const res = await fetch('/api/social/inbox');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setInbox(data.messages);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch inbox:', e);
    }
  };

  useEffect(() => {
    fetchConnections();
    fetchInbox();

    // Poll inbox every 4 seconds for live message listening
    const interval = setInterval(fetchInbox, 4000);
    return () => clearInterval(interval);
  }, []);

  // Listen for OAuth postMessage from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const platform = event.data?.platform;
        setIsConnecting(null);
        fetchConnections();
        fetchInbox();
        triggerToast(`✓ ${platform === 'whatsapp' ? 'WhatsApp Business' : 'Instagram'} hesabı bağlandı! Mesaj dinleme aktif.`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const triggerToast = (msg: string) => {
    setQuickToast(msg);
    setTimeout(() => setQuickToast(null), 3500);
  };

  // Start Popup OAuth Flow
  const handleConnectOAuth = async (platform: 'instagram' | 'whatsapp') => {
    setIsConnecting(platform);
    try {
      const res = await fetch(`/api/auth/${platform}/url`);
      if (!res.ok) throw new Error('Auth URL alınamadı');

      const { url } = await res.json();

      const authWindow = window.open(
        url,
        `${platform}_oauth_popup`,
        'width=600,height=720,scrollbars=yes,resizable=yes'
      );

      if (!authWindow) {
        alert('Lütfen hesabınızı bağlayabilmek için tarayıcınızın açılır pencere (popup) engelleyicisini kapatınız.');
        setIsConnecting(null);
      }
    } catch (err) {
      console.error('OAuth başlatma hatası:', err);
      setIsConnecting(null);
    }
  };

  // Disconnect platform
  const handleDisconnect = async (platform: 'instagram' | 'whatsapp') => {
    if (window.confirm(`${platform === 'whatsapp' ? 'WhatsApp' : 'Instagram'} bağlantısını kesmek istiyor musunuz?`)) {
      await fetch('/api/social/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      fetchConnections();
      triggerToast(`${platform === 'whatsapp' ? 'WhatsApp' : 'Instagram'} bağlantısı kesildi.`);
    }
  };

  // Toggle Auto-reply
  const handleToggleAutoReply = async (platform: 'instagram' | 'whatsapp', enabled: boolean) => {
    await fetch('/api/social/toggle-autoreply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, enabled }),
    });
    fetchConnections();
    triggerToast(
      enabled
        ? `✓ ${platform === 'instagram' ? 'Instagram' : 'WhatsApp'} AI Otomatik Yanıt etkinleştirildi.`
        : `${platform === 'instagram' ? 'Instagram' : 'WhatsApp'} AI Otomatik Yanıt kapatıldı.`
    );
  };

  // ONE-CLICK INSTANT REPLY WITH AI DRAFT
  const handleOneClickReply = async (messageId: string, replyText: string, draftIndex?: number) => {
    if (!replyText.trim()) return;
    const key = `${messageId}-${draftIndex !== undefined ? draftIndex : 'custom'}`;
    setSendingDraftKey(key);

    try {
      const res = await fetch('/api/social/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          replyText: replyText.trim(),
        }),
      });

      if (res.ok) {
        // Immediate optimistic update
        setInbox((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  status: 'replied',
                  replyText: replyText.trim(),
                  repliedAt: Date.now(),
                  autoReplied: false,
                }
              : m
          )
        );
        triggerToast('✓ Yapay zekâ yanıtı tek tuşla Instagram\'a iletildi!');
        setEditingDraftInfo(null);
        setCustomReplyExpandedId(null);
        setCustomReplyText('');
        fetchInbox();
      }
    } catch (e) {
      console.warn('Reply send error:', e);
      triggerToast('Yanıt gönderilirken hata oluştu.');
    } finally {
      setSendingDraftKey(null);
    }
  };

  // Regenerate 3 fresh AI drafts for a message
  const handleRegenerateDrafts = async (message: SocialInboxMessage) => {
    setRegeneratingDraftsMsgId(message.id);
    try {
      const res = await fetch('/api/social/generate-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id,
          text: message.text,
          platform: message.platform,
          senderName: message.senderName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.drafts)) {
          setInbox((prev) =>
            prev.map((m) =>
              m.id === message.id ? { ...m, suggestedDrafts: data.drafts } : m
            )
          );
          triggerToast('✓ 3 Yeni Yapay Zekâ Taslak Yanıtı Hazırlandı!');
        }
      }
    } catch (err) {
      console.warn('Regenerate drafts error:', err);
    } finally {
      setRegeneratingDraftsMsgId(null);
    }
  };

  // Quick simulate incoming message
  const handleQuickSimulate = async (type: 'dm' | 'comment' | 'wa') => {
    setIsSimulating(true);
    let sample: {
      platform: 'instagram_dm' | 'instagram_comment' | 'whatsapp';
      senderName: string;
      text: string;
    } = {
      platform: 'instagram_dm',
      senderName: 'Melis Aydın',
      text: 'Merhabalar! Tasarımlarınız harika. Toplu sipariş vermek istiyoruz, toptan fiyat listeniz var mı?',
    };

    if (type === 'comment') {
      const comments = [
        { senderName: 'Gizem Yılmaz', text: 'Fiyat nedir acaba? Farklı renk ve bedenleri mevcut mu? 😍' },
        { senderName: 'Onur Tan', text: 'Kumaş kalitesi harika duruyor! Yıkandığında çekme yapar mı? 🔥' },
        { senderName: 'Deniz Koç', text: 'Çok şık bir model! Web sitenizden sipariş verirken indirim kodu geçerli mi?' },
      ];
      const picked = comments[Math.floor(Math.random() * comments.length)];
      sample = {
        platform: 'instagram_comment',
        senderName: picked.senderName,
        text: picked.text,
      };
    } else if (type === 'dm') {
      const dms = [
        { senderName: 'Emirhan Kurt', text: 'Selamlar, dün verdiğim siparişi bugün kargoya verebilir misiniz? Acil davet için gerekiyor.' },
        { senderName: 'Büşra Çelik', text: 'Merhaba, bu ürünün hediye paketi ve özel not kartı seçeneği var mı?' },
        { senderName: 'Kaan Demir', text: 'Merhabalar, boy 1.82 kilo 78 için hangi bedeni önerirsiniz? Kalıplar dar mı?' },
      ];
      const picked = dms[Math.floor(Math.random() * dms.length)];
      sample = {
        platform: 'instagram_dm',
        senderName: picked.senderName,
        text: picked.text,
      };
    } else {
      sample = {
        platform: 'whatsapp',
        senderName: 'Ali Vural',
        text: 'İyi günler, siparişim kargoya verildi mi? Takip kodunu alabilir miyim?',
      };
    }

    try {
      await fetch('/api/social/simulate-incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sample),
      });
      fetchInbox();
      triggerToast(
        `✓ Yeni ${sample.platform === 'instagram_dm' ? 'Instagram DM\'si' : sample.platform === 'instagram_comment' ? 'Instagram Yorumu' : 'WhatsApp Mesajı'} eklendi ve AI taslakları üretildi!`
      );
    } catch (e) {
      console.warn('Simulation error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Generate Social Content Package
  const handleGenerateSocialPackage = async () => {
    if (!topic.trim() || isGeneratingContent) return;
    setIsGeneratingContent(true);

    try {
      const res = await fetch('/api/generate-social-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, platform: selectedPlatform }),
      });
      const data = await res.json();

      const newPost: SocialPost = {
        id: `post-${Date.now()}`,
        platform: selectedPlatform,
        topic,
        title: data.title || topic,
        hook: data.hook || 'Bu detayı mutlaka kaydedin!',
        caption: data.caption || '',
        hashtags: data.hashtags || ['#kesfet', '#trend'],
        callToAction: data.callToAction || 'Yorumlarda buluşalım!',
        mediaType: selectedPlatform === 'tiktok' || selectedPlatform === 'youtube' ? 'video' : 'image',
        createdAt: Date.now(),
      };
      setGeneratedPost(newPost);
    } catch (err) {
      console.warn('Social generation error:', err);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleCopy = (textToCopy: string, id: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Filtered Instagram Messages
  const instagramMessages = inbox.filter(
    (m) => m.platform === 'instagram_dm' || m.platform === 'instagram_comment'
  );

  const filteredInstagramMessages = instagramMessages.filter((msg) => {
    // Platform / Status Filter
    if (instagramFilter === 'dm' && msg.platform !== 'instagram_dm') return false;
    if (instagramFilter === 'comment' && msg.platform !== 'instagram_comment') return false;
    if (instagramFilter === 'pending' && msg.status === 'replied') return false;
    if (instagramFilter === 'replied' && msg.status !== 'replied') return false;

    // Search query
    if (instagramSearch.trim()) {
      const q = instagramSearch.toLowerCase();
      const matchName = msg.senderName.toLowerCase().includes(q);
      const matchHandle = (msg.senderHandle || '').toLowerCase().includes(q);
      const matchText = msg.text.toLowerCase().includes(q);
      return matchName || matchHandle || matchText;
    }
    return true;
  });

  const unreadInstagramCount = instagramMessages.filter((m) => m.status === 'unread').length;
  const repliedInstagramCount = instagramMessages.filter((m) => m.status === 'replied').length;

  // Generic filtered inbox for All Inbox view
  const filteredAllInbox = inbox.filter((m) =>
    inboxFilter === 'all' ? true : m.platform === inboxFilter
  );

  // Draft style labels & tone helpers
  const getDraftStyleInfo = (index: number) => {
    switch (index) {
      case 0:
        return {
          title: '💖 Samimi & Çözüm Odaklı',
          desc: 'Sıcak, nazik ve teşekkür eden dostane yanıt',
          badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
          btnBg: 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700',
        };
      case 1:
        return {
          title: '📌 Detaylı & Bilgilendirici',
          desc: 'Açıklayıcı, net ve tüm soruları yanıtlayan profesyonel ton',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          btnBg: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700',
        };
      case 2:
      default:
        return {
          title: '🚀 Hızlı Satış & Aksiyon (CTA)',
          desc: 'Profil bağlantısına veya siparişe yönlendiren dinamik ton',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          btnBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-3 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar relative">
      {/* Quick Floating Toast */}
      {quickToast && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{quickToast}</span>
        </div>
      )}

      {/* Social Hub Hero */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-700 rounded-3xl p-5 sm:p-7 text-white shadow-lg shadow-rose-500/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/20 mb-3">
            <Instagram className="w-3.5 h-3.5 text-pink-200" />
            <span>Instagram Gelen Kutusu & Yapay Zekâ Taslak Yanıt Motoru</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Instagram DM ve Yorumlarına Tek Tuşla Yapay Zekâ Yanıtı
          </h2>
          <p className="text-xs sm:text-sm text-pink-100 leading-relaxed">
            Müşterilerinizden gelen her Instagram mesajına yapay zekâ anında 3 özel taslak hazırlar.
            Beğendiğiniz taslağın yanındaki <strong>"Yanıtla"</strong> butonuna basarak tek tuşla anında gönderin!
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
          <Instagram className="w-56 h-56" />
        </div>
      </div>

      {/* Account Connection Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Instagram Account Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Instagram className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 truncate">Instagram</span>
                {connections.instagram.connected ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Bağlı & Canlı
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    ✓ Canlı Dinleme Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">
                {connections.instagram.connected
                  ? `@${connections.instagram.username}`
                  : '@benimyapayzekam_official'}
              </p>
            </div>
          </div>

          <div>
            {connections.instagram.connected ? (
              <button
                onClick={() => handleDisconnect('instagram')}
                className="text-xs text-slate-500 hover:text-rose-600 font-medium px-2.5 py-1 rounded-lg hover:bg-rose-50 transition"
              >
                Bağlantıyı Kes
              </button>
            ) : (
              <button
                onClick={() => handleConnectOAuth('instagram')}
                disabled={isConnecting === 'instagram'}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>{isConnecting === 'instagram' ? 'Bağlanıyor...' : 'Bağla (OAuth)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* WhatsApp Business Account Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 truncate">WhatsApp Business</span>
                {connections.whatsapp.connected ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Bağlı & Canlı
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    ✓ Mesaj Hattı Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">
                {connections.whatsapp.connected
                  ? connections.whatsapp.phoneNumber
                  : '+90 555 123 4567'}
              </p>
            </div>
          </div>

          <div>
            {connections.whatsapp.connected ? (
              <button
                onClick={() => handleDisconnect('whatsapp')}
                className="text-xs text-slate-500 hover:text-rose-600 font-medium px-2.5 py-1 rounded-lg hover:bg-rose-50 transition"
              >
                Bağlantıyı Kes
              </button>
            ) : (
              <button
                onClick={() => handleConnectOAuth('whatsapp')}
                disabled={isConnecting === 'whatsapp'}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>{isConnecting === 'whatsapp' ? 'Bağlanıyor...' : 'Bağla (OAuth)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
        {/* Flagship: Instagram Inbox & AI Draft Replies Module */}
        <button
          onClick={() => setSubTab('instagram_inbox')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 active:scale-95 ${
            subTab === 'instagram_inbox'
              ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white shadow-sm shadow-pink-500/30'
              : 'bg-white text-slate-700 hover:bg-pink-50 hover:text-pink-700 border border-slate-200'
          }`}
        >
          <Instagram className="w-4 h-4" />
          <span>Instagram Gelen Kutusu (Inbox)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white text-pink-700 font-bold shadow-2xs">
            {unreadInstagramCount} Yeni
          </span>
        </button>

        <button
          onClick={() => setSubTab('all_inbox')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 active:scale-95 ${
            subTab === 'all_inbox'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bot className="w-4 h-4 text-emerald-400" />
          <span>Tüm Canlı Mesajlar & Simülatör</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-bold">
            {inbox.filter((m) => m.status === 'unread').length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('content')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 active:scale-95 ${
            subTab === 'content'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Edit3 className="w-4 h-4 text-pink-500" />
          <span>İçerik Taslak Editörü & Viral Fabrika</span>
        </button>

        <button
          onClick={() => setSubTab('whatsapp_tools')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 active:scale-95 ${
            subTab === 'whatsapp_tools'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-500" />
          <span>Doğrudan WhatsApp İletişim</span>
        </button>

        <button
          onClick={() => setSubTab('oauth_settings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 active:scale-95 ${
            subTab === 'oauth_settings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>API & Webhook Ayarları</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. INSTAGRAM GELEN KUTUSU (INBOX) & AI TASLAK CEVAP MODÜLÜ */}
      {/* ========================================================= */}
      {subTab === 'instagram_inbox' && (
        <div className="space-y-4">
          {/* Top Control Bar: Search, Stats & Instant Simulator Buttons */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Stats badges */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pink-50 border border-pink-200 text-pink-900 text-xs font-bold">
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  <span>Instagram Kutusu: {instagramMessages.length}</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{unreadInstagramCount} Cevap Bekleyen</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{repliedInstagramCount} Yanıtlanan</span>
                </div>
              </div>

              {/* Instant Test Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickSimulate('dm')}
                  disabled={isSimulating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold transition active:scale-95 disabled:opacity-50"
                  title="Yeni bir Instagram DM mesajı al ve yapay zekâ taslaklarını gör"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Örnek DM Al</span>
                </button>

                <button
                  onClick={() => handleQuickSimulate('comment')}
                  disabled={isSimulating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition active:scale-95 disabled:opacity-50"
                  title="Yeni bir Instagram gönderi yorumu al ve yapay zekâ taslaklarını gör"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Örnek Yorum Al</span>
                </button>
              </div>
            </div>

            {/* Filter Pills & Search Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                {[
                  { id: 'all', label: `Tümü (${instagramMessages.length})` },
                  { id: 'pending', label: `Yanıt Bekleyenler (${unreadInstagramCount})` },
                  { id: 'dm', label: `DM'ler (${instagramMessages.filter((m) => m.platform === 'instagram_dm').length})` },
                  { id: 'comment', label: `Yorumlar (${instagramMessages.filter((m) => m.platform === 'instagram_comment').length})` },
                  { id: 'replied', label: `Yanıtlananlar (${repliedInstagramCount})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setInstagramFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition active:scale-95 ${
                      instagramFilter === f.id
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={instagramSearch}
                  onChange={(e) => setInstagramSearch(e.target.value)}
                  placeholder="Kullanıcı veya mesaj ara..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-pink-500 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* Instagram Messages Stream */}
          <div className="space-y-4">
            {filteredInstagramMessages.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Instagram className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">Filtreye Uygun Mesaj Bulunamadı</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Yukarıdaki <strong>"+ Örnek DM Al"</strong> veya <strong>"+ Örnek Yorum Al"</strong> butonlarına basarak hemen yeni bir Instagram mesajı ve yapay zekâ taslağı üretebilirsiniz.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => handleQuickSimulate('dm')}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Hemen Örnek DM Gönder
                  </button>
                </div>
              </div>
            ) : (
              filteredInstagramMessages.map((msg) => {
                const isReplied = msg.status === 'replied';
                const drafts = msg.suggestedDrafts && msg.suggestedDrafts.length > 0
                  ? msg.suggestedDrafts
                  : [
                      `Merhabalar! Mesajınız için çok teşekkür ederiz. Konuyla ilgili ekibimiz hemen sizinle ilgileniyor! ✨`,
                      `Merhabalar! Detaylı bilgi ve inceleme bağlantısı profilimizdeki linkte yer almaktadır. DM üzerinden de kataloğu iletiyoruz! 📩`,
                      `Harika bir seçim! Hemen profilimizdeki linkten hızlıca sipariş verebilir veya sorularınızı bize iletebilirsiniz 💫`,
                    ];

                return (
                  <div
                    key={msg.id}
                    className={`bg-white rounded-2xl border transition shadow-xs overflow-hidden ${
                      isReplied ? 'border-slate-200' : 'border-rose-200/80 ring-1 ring-rose-100'
                    }`}
                  >
                    {/* Message Header Strip */}
                    <div className="p-4 sm:p-5 pb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar with Instagram story gradient ring */}
                        <div className="relative">
                          <div className="w-11 h-11 rounded-2xl p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center shadow-xs">
                            <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-slate-800 font-bold text-sm">
                              {msg.senderName.slice(0, 2).toUpperCase()}
                            </div>
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center text-white text-[10px] shadow-xs ${
                              msg.platform === 'instagram_dm' ? 'bg-pink-600' : 'bg-purple-600'
                            }`}
                          >
                            {msg.platform === 'instagram_dm' ? (
                              <Instagram className="w-3 h-3" />
                            ) : (
                              <MessageCircle className="w-3 h-3" />
                            )}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 truncate">
                              {msg.senderName}
                            </span>
                            {msg.senderHandle && (
                              <span className="text-xs text-slate-400 font-mono truncate">
                                {msg.senderHandle}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                msg.platform === 'instagram_dm'
                                  ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}
                            >
                              {msg.platform === 'instagram_dm' ? 'Instagram Direkt Mesaj (DM)' : 'Gönderi Yorumu'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(msg.timestamp).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div>
                        {isReplied ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{msg.autoReplied ? 'AI Otomatik Yanıtladı' : 'Yapay Zekâ ile Yanıtlandı'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Taslak Yanıt Hazır • Onay Bekliyor</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Incoming customer message bubble */}
                    <div className="p-4 sm:p-5 pt-3 space-y-3">
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium relative">
                        <span className="text-slate-400 font-serif text-lg leading-none select-none mr-1">“</span>
                        {msg.text}
                        <span className="text-slate-400 font-serif text-lg leading-none select-none ml-1">”</span>
                      </div>

                      {/* IF ALREADY REPLIED: SHOW SENT REPLY */}
                      {isReplied && msg.replyText && (
                        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Gönderilen Resmi Yanıt:
                            </span>
                            {msg.repliedAt && (
                              <span className="text-[11px] text-emerald-700/80 font-mono">
                                İletildi: {new Date(msg.repliedAt).toLocaleTimeString('tr-TR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed italic bg-white/80 p-3 rounded-xl border border-emerald-100">
                            {msg.replyText}
                          </p>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => {
                                setEditingDraftInfo({ messageId: msg.id, text: msg.replyText || '' });
                              }}
                              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold px-2.5 py-1 rounded-lg hover:bg-emerald-100/60 transition"
                            >
                              Tekrar / Düzeltilmiş Yanıt Gönder
                            </button>
                          </div>
                        </div>
                      )}

                      {/* IF NOT REPLIED: SHOW AI SUGGESTED DRAFT RESPONSES */}
                      {!isReplied && (
                        <div className="bg-gradient-to-b from-rose-50/50 via-pink-50/30 to-indigo-50/40 border border-rose-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
                          {/* Drafts Section Header */}
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-rose-200/60">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-pink-600 to-rose-600 text-white flex items-center justify-center shadow-xs">
                                <Sparkles className="w-4 h-4 text-amber-300" />
                              </div>
                              <div>
                                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                                  Yapay Zekâ Tarafından Önerilen Taslak Cevaplar
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  Tek tuşla doğrudan Instagram'a yanıtlamak için dilediğiniz taslaktaki <strong>'Yanıtla'</strong> butonuna tıklayın.
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRegenerateDrafts(msg)}
                              disabled={regeneratingDraftsMsgId === msg.id}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition active:scale-95 disabled:opacity-50"
                              title="Yapay zekâdan bu mesaj için 3 yeni taslak üret"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 text-pink-600 ${
                                  regeneratingDraftsMsgId === msg.id ? 'animate-spin' : ''
                                }`}
                              />
                              <span className="hidden sm:inline">
                                {regeneratingDraftsMsgId === msg.id ? 'Üretiliyor...' : 'Yeni Taslaklar Üret'}
                              </span>
                            </button>
                          </div>

                          {/* 3 AI Suggested Drafts Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {drafts.slice(0, 3).map((draftText, idx) => {
                              const style = getDraftStyleInfo(idx);
                              const key = `${msg.id}-${idx}`;
                              const isSending = sendingDraftKey === key;

                              return (
                                <div
                                  key={idx}
                                  className="bg-white rounded-xl border border-slate-200/90 hover:border-pink-300 p-3.5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all group"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badgeColor}`}
                                      >
                                        {style.title}
                                      </span>
                                      <button
                                        onClick={() => handleCopy(draftText, key)}
                                        className="text-slate-400 hover:text-slate-600 text-xs transition"
                                        title="Metni Kopyala"
                                      >
                                        {copiedSection === key ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                    <p className="text-xs text-slate-800 leading-relaxed font-normal min-h-[58px]">
                                      {draftText}
                                    </p>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                                    {/* Primary 1-Click Yanıtla Button */}
                                    <button
                                      onClick={() => handleOneClickReply(msg.id, draftText, idx)}
                                      disabled={Boolean(sendingDraftKey)}
                                      className={`flex-1 py-2 px-3 rounded-xl text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 ${style.btnBg}`}
                                      title="Bu cevabı tek tuşla Instagram'a gönder"
                                    >
                                      {isSending ? (
                                        <>
                                          <Zap className="w-3.5 h-3.5 animate-spin" />
                                          <span>İletiliyor...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Send className="w-3.5 h-3.5" />
                                          <span>Yanıtla</span>
                                        </>
                                      )}
                                    </button>

                                    {/* Inline Edit Trigger */}
                                    <button
                                      onClick={() =>
                                        setEditingDraftInfo({ messageId: msg.id, text: draftText })
                                      }
                                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                                      title="Göndermeden önce bu taslağı düzenle"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Custom Reply Expander */}
                          <div className="pt-1">
                            {customReplyExpandedId === msg.id ? (
                              <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold text-slate-800">
                                    Kendi Özel Yanıtınızı Yazın:
                                  </label>
                                  <button
                                    onClick={() => setCustomReplyExpandedId(null)}
                                    className="text-xs text-slate-400 hover:text-slate-600"
                                  >
                                    ✕ Kapat
                                  </button>
                                </div>
                                <textarea
                                  rows={3}
                                  value={customReplyText}
                                  onChange={(e) => setCustomReplyText(e.target.value)}
                                  placeholder="Buraya özel cevabınızı yazın..."
                                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-pink-500 leading-relaxed"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleOneClickReply(msg.id, customReplyText)}
                                    disabled={!customReplyText.trim() || Boolean(sendingDraftKey)}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Özel Yanıtı Gönder</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setCustomReplyExpandedId(msg.id);
                                  setCustomReplyText('');
                                }}
                                className="text-xs font-semibold text-slate-600 hover:text-pink-600 transition flex items-center gap-1"
                              >
                                <span>✍️ Veya kendi özel yanıtınızı yazmak için tıklayın</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Edit Draft Modal */}
          {editingDraftInfo && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-pink-600" />
                    Taslak Yanıtı Düzenle ve Gönder
                  </h3>
                  <button
                    onClick={() => setEditingDraftInfo(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                    Düzenlenen Instagram Yanıt Metni
                  </label>
                  <textarea
                    rows={5}
                    value={editingDraftInfo.text}
                    onChange={(e) =>
                      setEditingDraftInfo({ ...editingDraftInfo, text: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 outline-none focus:border-pink-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingDraftInfo(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={() =>
                      handleOneClickReply(editingDraftInfo.messageId, editingDraftInfo.text)
                    }
                    disabled={!editingDraftInfo.text.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Onayla ve Instagram'a Yanıtla</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TÜM CANLI MESAJLAR & SİMÜLATÖR (All Live Messages Feed) */}
      {/* ========================================================= */}
      {subTab === 'all_inbox' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'Tümü' },
                { id: 'instagram_dm', label: 'Instagram DM' },
                { id: 'instagram_comment', label: 'Yorumlar' },
                { id: 'whatsapp', label: 'WhatsApp' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setInboxFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    inboxFilter === f.id
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Auto Reply Switches */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={connections.instagram.autoReplyEnabled}
                  onChange={(e) => handleToggleAutoReply('instagram', e.target.checked)}
                  className="rounded text-pink-600 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Instagram AI Otomatik Yanıt</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={connections.whatsapp.autoReplyEnabled}
                  onChange={(e) => handleToggleAutoReply('whatsapp', e.target.checked)}
                  className="rounded text-emerald-600 w-3.5 h-3.5 cursor-pointer"
                />
                <span>WhatsApp AI Otomatik Yanıt</span>
              </label>
            </div>
          </div>

          {/* Test Simulator Bar */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-950">Canlı Mesaj Testi:</span>
              <select
                value={simPlatform}
                onChange={(e) => setSimPlatform(e.target.value as any)}
                className="bg-white border border-indigo-300 rounded-lg text-xs py-1 px-2 font-medium text-indigo-900 outline-none"
              >
                <option value="instagram_dm">Instagram DM</option>
                <option value="instagram_comment">Instagram Yorumu</option>
                <option value="whatsapp">WhatsApp Mesajı</option>
              </select>
            </div>

            <div className="flex-1 w-full flex items-center gap-2">
              <input
                type="text"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Örnek gelen soru yazın..."
                className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => {
                  if (simPlatform === 'instagram_dm') handleQuickSimulate('dm');
                  else if (simPlatform === 'instagram_comment') handleQuickSimulate('comment');
                  else handleQuickSimulate('wa');
                }}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 transition active:scale-95 disabled:opacity-50"
              >
                {isSimulating ? 'Gönderiliyor...' : 'Gelen Mesajı Simüle Et'}
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="space-y-3">
            {filteredAllInbox.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                <Bot className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">Gelen Mesaj veya Yorum Yok</p>
                <p className="text-xs text-slate-400 mt-1">
                  Yukarıdaki "Canlı Mesaj Testi" kutusundan hemen bir Instagram DM'si veya WhatsApp mesajı simüle edebilirsiniz.
                </p>
              </div>
            ) : (
              filteredAllInbox.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                          msg.platform === 'whatsapp'
                            ? 'bg-emerald-600'
                            : msg.platform === 'instagram_dm'
                            ? 'bg-pink-600'
                            : 'bg-purple-600'
                        }`}
                      >
                        {msg.platform === 'whatsapp' ? (
                          <MessageSquare className="w-4 h-4" />
                        ) : msg.platform === 'instagram_dm' ? (
                          <Instagram className="w-4 h-4" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">{msg.senderName}</span>
                          {msg.senderHandle && (
                            <span className="text-[11px] text-slate-400">{msg.senderHandle}</span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600 uppercase">
                            {msg.platform === 'whatsapp'
                              ? 'WhatsApp'
                              : msg.platform === 'instagram_dm'
                              ? 'Instagram DM'
                              : 'Gönderi Yorumu'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <div>
                      {msg.status === 'replied' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          {msg.autoReplied ? 'AI Otomatik Yanıtladı' : 'Cevaplandı'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Cevap Bekliyor
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Incoming text */}
                  <div className="p-3 bg-slate-50 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    "{msg.text}"
                  </div>

                  {/* Reply bubble if replied */}
                  {msg.replyText && (
                    <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs sm:text-sm text-indigo-950 leading-relaxed">
                      <div className="flex items-center justify-between mb-1 text-[11px] font-bold text-indigo-700">
                        <span className="flex items-center gap-1">
                          <Bot className="w-3.5 h-3.5" />
                          Gönderilen Yanıt:
                        </span>
                        {msg.repliedAt && (
                          <span className="font-mono text-[10px] text-indigo-400">
                            {new Date(msg.repliedAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="italic">{msg.replyText}</p>
                    </div>
                  )}

                  {/* Reply Action */}
                  {msg.status !== 'replied' && (
                    <div className="pt-2 flex items-center justify-end">
                      <button
                        onClick={() => {
                          setActiveMessage(msg);
                          setReplyInput(
                            'Merhabalar! Mesajınız için çok teşekkür ederiz. Konuyla ilgili size memnuniyetle yardımcı olmak isteriz. Detayları buradan iletebilirsiniz! ✨'
                          );
                        }}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition active:scale-95"
                      >
                        <Send className="w-3 h-3" />
                        <span>Yanıt Yaz / AI Yanıtı Gönder</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Active Reply Modal */}
          {activeMessage && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-blue-600" />
                    {activeMessage.senderName} kişisine Yanıt Gönder
                  </h3>
                  <button
                    onClick={() => setActiveMessage(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-700">
                  <span className="font-semibold block mb-0.5 text-slate-900">Gelen Mesaj:</span>
                  "{activeMessage.text}"
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                    Gönderilecek Yanıt Metni
                  </label>
                  <textarea
                    rows={4}
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setActiveMessage(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() => handleOneClickReply(activeMessage.id, replyInput)}
                    disabled={!replyInput.trim() || isSendingReply}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50"
                  >
                    {isSendingReply ? 'Gönderiliyor...' : 'Yanıtı İlet (API)'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. İÇERİK TASLAK EDİTÖRÜ & CANLI SOSYAL MEDYA ÖNİZLEME */}
      {/* ========================================================= */}
      {subTab === 'content' && (
        <div className="space-y-6">
          {/* Quick AI Content Generation Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Yapay Zekâ ile Sıfırdan Yeni İçerik Paketi Üret
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Instagram, TikTok, YouTube Shorts ve WhatsApp uyumlu
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-8 flex items-center gap-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="İçerik konusunu yazın (ör: 'İstanbul kahve mekanları önerisi', 'Online satış artırma taktikleri')..."
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 focus:border-rose-500 text-xs sm:text-sm text-slate-800 outline-none"
                />
              </div>

              <div className="md:col-span-4 flex items-center gap-2">
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="instagram">📸 Instagram Post</option>
                  <option value="tiktok">🎵 TikTok Video</option>
                  <option value="youtube">▶️ YouTube Shorts</option>
                  <option value="whatsapp">🟢 WhatsApp Duyuru</option>
                </select>

                <button
                  onClick={handleGenerateSocialPackage}
                  disabled={!topic.trim() || isGeneratingContent}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-rose-500/25 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                >
                  {isGeneratingContent ? (
                    <>
                      <Zap className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Üretiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Paket Üret</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated Content Draft Editor & Live Preview */}
          <ContentDraftEditor
            initialPost={generatedPost}
            onGenerateImageForPost={onGenerateImageForPost}
            onGenerateVideoForPost={onGenerateVideoForPost}
            onPublishPost={(post) => {
              triggerToast(`✓ "${post.title.slice(0, 25)}..." yayına iletildi!`);
            }}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. WHATSAPP DOĞRUDAN İLETİŞİM */}
      {/* ========================================================= */}
      {subTab === 'whatsapp_tools' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                WhatsApp İletişim & Hızlı Erişim Paneli
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Müşterilerinize doğrudan WhatsApp üzerinden mesaj göndermek veya tek tıkla mesaj hattı açmak için bağlantı oluşturun.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
                  Telefon Numarası (Ülke Koduyla, örn: 905xxxxxxxxx)
                </label>
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
                  Hazırlanan WhatsApp Mesajı
                </label>
                <textarea
                  rows={4}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <button
                onClick={() => {
                  const cleanPhone = whatsappPhone.replace(/[^0-9]/g, '');
                  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;
                  window.open(waUrl, '_blank');
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>WhatsApp'ta Doğrudan Aç & Gönder</span>
              </button>
            </div>

            <div className="space-y-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Hazır Şablonlar:
              </h4>

              <div className="space-y-2">
                {[
                  {
                    title: '📦 Sipariş Teyit Mesajı',
                    msg: 'Merhaba! Siparişinizi aldık, kargonuz en kısa sürede yola çıkacaktır. Takip numaranız hazır olduğunda ileteceğiz. Teşekkür ederiz! ✨',
                  },
                  {
                    title: '📅 Randevu Hatırlatması',
                    msg: 'Sayın danışanımız, yarın saat 14:00 için randevunuz bulunmaktadır. Değişiklik gerekirse lütfen bize bildiriniz. İyi günler dileriz!',
                  },
                  {
                    title: '💡 Özel Kampanya & İndirim',
                    msg: 'Harika bir haberimiz var! Bu haftaya özel tüm ürünlerde %20 indirim kuponunuz tanımlandı. Fırsatı kaçırmamak için web sitemizi ziyaret edin!',
                  },
                ].map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => setWhatsappMessage(tpl.msg)}
                    className="w-full p-2.5 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 text-left transition active:scale-98 shadow-2xs"
                  >
                    <div className="text-xs font-bold text-emerald-900">{tpl.title}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">{tpl.msg}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. OAUTH & WEBHOOK TEKNİK AYARLAR */}
      {/* ========================================================= */}
      {subTab === 'oauth_settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Meta (Instagram & WhatsApp) Resmi API & Webhook Yapılandırması
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kendi Meta for Developers uygulamanızı bağlayarak resmi Instagram Graph API ve WhatsApp Cloud API üzerinden canlı mesajları dinleyebilirsiniz.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                1. OAuth Callback URL (Yönlendirme Adresi)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Meta Developer portalında <strong>Facebook Login for Business &gt; Ayarlar &gt; Geçerli OAuth Yönlendirme URI'leri</strong> alanına bu adresi ekleyin:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={callbackUrl || `${window.location.origin}/auth/callback`}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700"
                />
                <button
                  onClick={() => handleCopy(callbackUrl || `${window.location.origin}/auth/callback`, 'cb_url')}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition active:scale-95 shrink-0"
                >
                  {copiedSection === 'cb_url' ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                2. Webhook URL (Canlı Mesaj Dinleme Adresi)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instagram ve WhatsApp Webhook yapılandırmasında <strong>Geri Arama URL'si</strong> olarak bunu, <strong>Doğrulama Belirteci (Verify Token)</strong> olarak ise <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-blue-600">benim_ai_secret_verify_token</code> girin:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl || `${window.location.origin}/api/webhook`}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700"
                />
                <button
                  onClick={() => handleCopy(webhookUrl || `${window.location.origin}/api/webhook`, 'wh_url')}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition active:scale-95 shrink-0"
                >
                  {copiedSection === 'wh_url' ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-950 space-y-1.5">
              <h5 className="font-bold flex items-center gap-1 text-blue-900">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Hızlı Test & Simülasyon Modu
              </h5>
              <p className="leading-relaxed">
                Henüz Meta Developer hesabınız veya onaylanmış uygulamanız yoksa bile endişelenmeyin! Üst kısımdaki <strong>"Bağla (OAuth)"</strong> butonuna tıkladığınızda sistem anında test bağlantısını açar ve <strong>Instagram Gelen Kutusu</strong> sekmesi üzerinden gelen tüm Instagram DM ve yorumlarını yapay zekâ taslaklarıyla birlikte tek tuşla test edebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
