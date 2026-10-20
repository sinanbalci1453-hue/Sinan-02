/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { ExportModal } from './components/ExportModal.tsx';
import jsPDF from 'jspdf';
import { WelcomeScreen } from './components/WelcomeScreen.tsx';
import { ChatMessage } from './components/ChatMessage.tsx';
import { ChatInput } from './components/ChatInput.tsx';
import { PhotoStudio } from './components/PhotoStudio.tsx';
import { VideoStudio } from './components/VideoStudio.tsx';
import { SocialHub } from './components/SocialHub.tsx';
import { AutopilotStudio } from './components/AutopilotStudio.tsx';
import { MediaVault } from './components/MediaVault.tsx';
import { LiveCall } from './components/LiveCall.tsx';
import { SelfEvolutionModal } from './components/SelfEvolutionModal.tsx';
import { LearningMemoryModal } from './components/LearningMemoryModal.tsx';
import { InfoModal } from './components/InfoModal.tsx';
import { VoiceCommandController } from './components/VoiceCommandController.tsx';
import { QuickActionDock } from './components/QuickActionDock.tsx';
import { NetworkStatusBanner } from './components/NetworkStatusBanner.tsx';
import { HomeScreenAppModal } from './components/HomeScreenAppModal.tsx';
import { SystemPerformanceModal } from './components/SystemPerformanceModal.tsx';
import { NotificationsModal } from './components/NotificationsModal.tsx';
import { Message, Tone, StudioTab, GeneratedPhoto, GeneratedVideo, AppTheme, SystemVersion, MemoryItem, MemoryCategory, AppNotification } from './types.ts';
import { VoiceCommandAction } from './utils/voiceCommandService.ts';
import { Bot, Brain, Sparkles, Zap, Award } from 'lucide-react';
import { audioEngine } from './utils/audioEngine.ts';
import { ragEngine } from './utils/ragEngine.ts';
import { networkService } from './utils/networkService.ts';
import { notificationService } from './utils/notificationService.ts';

const STORAGE_KEY = 'benim_ai_messages_v4';
const TONE_STORAGE_KEY = 'benim_ai_tone_v4';
const THEME_STORAGE_KEY = 'benim_app_theme_v1';
const PHOTOS_STORAGE_KEY = 'benim_studio_photos';
const VIDEOS_STORAGE_KEY = 'benim_studio_videos';
const AUTO_LEARNING_STORAGE_KEY = 'benim_ai_auto_learning';
const SYSTEM_VERSION_KEY = 'benim_system_version_v5';

/**
 * navigator.standalone veya display-mode: standalone ortam sorgusunun yanına
 * window.navigator.userAgent kontrolü ile güçlendirerek daha kararlı bir PWA yüklü tespiti yapan yardımcı fonksiyon
 */
export const checkIsAppInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    // 1. Standart W3C display-mode ortam sorguları (standalone, fullscreen, minimal-ui)
    const isStandaloneDisplay = Boolean(
      window.matchMedia &&
      (window.matchMedia('(display-mode: standalone)').matches ||
       window.matchMedia('(display-mode: fullscreen)').matches ||
       window.matchMedia('(display-mode: minimal-ui)').matches)
    );

    // 2. Apple iOS Safari navigator.standalone özelliği
    const isIOSStandalone = Boolean(
      (window.navigator as unknown as { standalone?: boolean })?.standalone === true
    );

    // 3. Android TWA (Trusted Web Activity) Referrer kontrolü
    const isAndroidAppReferrer = Boolean(
      typeof document !== 'undefined' &&
      document.referrer &&
      document.referrer.includes('android-app://')
    );

    // 4. window.navigator.userAgent ile Güçlendirilmiş PWA & Bağımsız Uygulama Kontrolü:
    // - Android WebView / TWA: '; wv' veya 'Version/... Chrome/...'
    // - iOS WebClip / Bağımsız Web Görünümü: Apple WebKit ancak Safari arayüzü yok
    // - Standalone / PWA özel tarayıcı kullanıcı ajan belirteçleri
    const ua = (window.navigator?.userAgent || '').toLowerCase();
    const isAndroidWebView = /;\s*wv\)/i.test(ua) || (ua.includes('android') && ua.includes('version/') && ua.includes('chrome/'));
    const isIOSStandaloneUA = /(iphone|ipod|ipad).*applewebkit(?!.*safari)/i.test(ua);
    const hasStandaloneUAToken = ua.includes('pwa') || ua.includes('standalone') || ua.includes('twa');

    const isUserAgentPWA = Boolean(isAndroidWebView || isIOSStandaloneUA || hasStandaloneUAToken);

    return Boolean(isStandaloneDisplay || isIOSStandalone || isAndroidAppReferrer || isUserAgentPWA);
  } catch (err) {
    console.warn('[PWA] Kurulum durumu kontrolü sırasında hata:', err);
    return false;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<StudioTab>('chat');
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => checkIsAppInstalled());
  const [isLiveCallActive, setIsLiveCallActive] = useState(false);
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isHomeScreenModalOpen, setIsHomeScreenModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => notificationService.getStoredNotifications());
  const [upgradeToast, setUpgradeToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Learning Memory (RAG system) state
  const [memories, setMemories] = useState<MemoryItem[]>(() => ragEngine.getStoredMemories());
  const [autoLearningEnabled, setAutoLearningEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTO_LEARNING_STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  });
  const [memoryToast, setMemoryToast] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenHomeScreen = () => setIsHomeScreenModalOpen(true);
    window.addEventListener('open-homescreen-modal', handleOpenHomeScreen);

    // Initial check
    setIsAppInstalled(checkIsAppInstalled());

    // display-mode media query listeners (standalone & fullscreen)
    let standaloneMedia: MediaQueryList | null = null;
    let fullscreenMedia: MediaQueryList | null = null;
    const handleMediaChange = () => {
      setIsAppInstalled(checkIsAppInstalled());
    };

    if (typeof window !== 'undefined' && window.matchMedia) {
      standaloneMedia = window.matchMedia('(display-mode: standalone)');
      fullscreenMedia = window.matchMedia('(display-mode: fullscreen)');

      if (standaloneMedia.addEventListener) {
        standaloneMedia.addEventListener('change', handleMediaChange);
        fullscreenMedia.addEventListener('change', handleMediaChange);
      } else {
        (standaloneMedia as any).addListener(handleMediaChange);
        (fullscreenMedia as any).addListener(handleMediaChange);
      }
    }

    // appinstalled event fired by browser
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Re-check when window is focused or tab becomes visible
    const handleWindowFocusOrVisible = () => {
      setIsAppInstalled(checkIsAppInstalled());
    };
    window.addEventListener('focus', handleWindowFocusOrVisible);
    document.addEventListener('visibilitychange', handleWindowFocusOrVisible);

    return () => {
      window.removeEventListener('open-homescreen-modal', handleOpenHomeScreen);
      if (standaloneMedia) {
        if (standaloneMedia.removeEventListener) {
          standaloneMedia.removeEventListener('change', handleMediaChange);
        } else {
          (standaloneMedia as any).removeListener(handleMediaChange);
        }
      }
      if (fullscreenMedia) {
        if (fullscreenMedia.removeEventListener) {
          fullscreenMedia.removeEventListener('change', handleMediaChange);
        } else {
          (fullscreenMedia as any).removeListener(handleMediaChange);
        }
      }
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('focus', handleWindowFocusOrVisible);
      document.removeEventListener('visibilitychange', handleWindowFocusOrVisible);
    };
  }, []);

  // Theme & Platform Morpher state
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return (saved as AppTheme) || 'ios-glass';
    } catch {
      return 'ios-glass';
    }
  });

  // OTA Version State (Default to upgraded v5.0.0-Titanium Pro Max)
  const [systemVersion, setSystemVersion] = useState<SystemVersion>(() => {
    try {
      const saved = localStorage.getItem(SYSTEM_VERSION_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      currentVersion: 'v5.0.0-Titanium Pro Max',
      latestVersion: 'v5.5.0-Quantum Titanium Ultra',
      releaseDate: 'Ekim 2026',
      autoUpdateEnabled: true,
      features: [
        '⚡ Titanium Pro Max Çekirdek Aktif',
        '📱 iOS 19 & Android 16 Katlanabilir Ekran Uyumu',
        '🤖 Sesli Komut & Eller Serbest Kontrol',
        '📸 İçerik Taslak Editörü & Canlı Instagram Simülasyonu',
        '🧠 Öğrenen Bellek & RAG Anı Arama Filtresi',
        '🚀 Sınırsız Medya Kasası & 60s Video',
      ],
      changelog: [
        'Genişletilmiş 60s video ve yüksek kapasiteli hafıza kilidi açıldı',
        'Sesli komut katmanı entegre edildi',
        'Anı filtreleme ve etiketleme arayüzü eklendi',
      ],
    };
  });

  // Messages
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Photos vault
  const [photos, setPhotos] = useState<GeneratedPhoto[]>(() => {
    try {
      const saved = localStorage.getItem(PHOTOS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Videos vault
  const [videos, setVideos] = useState<GeneratedVideo[]>(() => {
    try {
      const saved = localStorage.getItem(VIDEOS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tone, setTone] = useState<Tone>(() => {
    try {
      const savedTone = localStorage.getItem(TONE_STORAGE_KEY);
      return (savedTone as Tone) || 'samimi';
    } catch {
      return 'samimi';
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [enableSearch, setEnableSearch] = useState(false);
  const [engineName, setEngineName] = useState<string>('Süper Otopilot & Canlı Güncelleme');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Photo passed from PhotoStudio to VideoStudio
  const [videoStudioInitialPhoto, setVideoStudioInitialPhoto] = useState<GeneratedPhoto | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Sync to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    } catch (e) {
      console.warn('Theme save error:', e);
    }
  }, [currentTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(photos));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [photos]);

  useEffect(() => {
    try {
      localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(videos));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [videos]);

  // Fetch engine and version status
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.activeEngine) setEngineName(data.activeEngine);
      })
      .catch(() => setEngineName('Sıfır-Ayar Süper Motor'));

    fetch('/api/system/version')
      .then((res) => res.json())
      .then((data) => {
        if (data) setSystemVersion(data);
      })
      .catch(() => {});
  }, []);

  const handleUpgradeVersion = async () => {
    try {
      const res = await fetch('/api/system/upgrade', { method: 'POST' });
      const newVer = 'v5.5.0-Quantum Titanium Ultra';
      let serverVer = newVer;
      if (res.ok) {
        const data = await res.json();
        if (data.newVersion) serverVer = data.newVersion;
      }

      setSystemVersion((prev) => {
        const updated = {
          ...prev,
          currentVersion: serverVer,
          features: [
            '⚡ Quantum Titanium Ultra VIP Çekirdek Aktif',
            '📱 iOS 19 & Android 16 Katlanabilir Ekran Uyumu',
            '🤖 Sesli Komut & Eller Serbest Kontrol',
            '📸 İçerik Taslak Editörü & Canlı Instagram Simülasyonu',
            '🧠 Öğrenen Bellek & RAG Anı Arama Filtresi',
            '🚀 Sınırsız 1 TB Medya Kasası & 60s Video',
          ],
        };
        try {
          localStorage.setItem(SYSTEM_VERSION_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setUpgradeToast('🎉 Tebrikler! Sisteminiz en üst düzey v5.5.0-Quantum Titanium Ultra sürümüne başarıyla yükseltildi. Sınırsız depolama ve 60s video motoru aktifleştirildi!');
      setTimeout(() => setUpgradeToast(null), 6000);
    } catch (e) {
      console.warn('Upgrade call error:', e);
    }
  };

  // Voice command dispatcher
  const handleVoiceCommand = (action: VoiceCommandAction) => {
    switch (action.type) {
      case 'switch_tab':
        if (action.payload) {
          audioEngine.stopAllMusic();
          audioEngine.stopVoiceover();
          setActiveTab(action.payload);
        }
        break;
      case 'send_message':
        if (action.payload) {
          setActiveTab('chat');
          handleSendMessage(action.payload);
        }
        break;
      case 'start_live_call':
        setIsLiveCallActive(true);
        break;
      case 'open_memory':
        setIsMemoryModalOpen(true);
        break;
      case 'upgrade_system':
        handleUpgradeVersion();
        break;
      case 'open_evolution':
        setIsEvolutionModalOpen(true);
        break;
      case 'new_chat':
        handleNewChat();
        break;
      case 'open_homescreen':
        setIsHomeScreenModalOpen(true);
        break;
      default:
        break;
    }
  };

  // Quick memory creator from Action Dock
  const handleAddQuickMemory = (content: string, category: MemoryCategory) => {
    const newItem = ragEngine.addCustomMemory(content, category);
    setMemories((prev) => [newItem, ...prev]);
    setMemoryToast(`🧠 Anı Hafızaya Kaydedildi: "${content.slice(0, 36)}..."`);
    setTimeout(() => setMemoryToast(null), 4000);
  };

  // Scroll on new message
  useEffect(() => {
    if (activeTab === 'chat' && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading, activeTab]);

  // Text-to-Speech handler
  const handleToggleSpeech = (messageId: string, text: string) => {
    if (speakingMessageId === messageId) {
      audioEngine.stopVoiceover();
      setSpeakingMessageId(null);
      return;
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' [Burada bir kod bloğu yer alıyor] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#|>-]/g, ' ')
      .trim();

    audioEngine.speakVoiceover(
      cleanText,
      () => setSpeakingMessageId(messageId),
      () => setSpeakingMessageId(null)
    );
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // 1. RAG Retrieval: Retrieve most relevant learned memories for this query
    const { retrievedMemories, contextString } = ragEngine.retrieveRelevantMemories(
      text,
      memories,
      3
    );
    const recalledSummaries = retrievedMemories.map((m) => m.content);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          tone,
          enableSearch,
          ragContext: contextString,
        }),
      });

      if (!response.ok) throw new Error(`Sunucu hatası: ${response.status}`);

      const data = await response.json();
      const assistantMessage: Message = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Cevap üretilemedi.',
        engine: data.engine || 'Benim Yapay Zekâm',
        timestamp: data.timestamp || Date.now(),
        recalledMemories: recalledSummaries.length > 0 ? recalledSummaries : undefined,
      };

      setMessages([...newMessages, assistantMessage]);

      // 2. Auto-Learner: Extract new facts or preferences from this interaction
      if (autoLearningEnabled) {
        const newlyDiscovered = ragEngine.extractMemoriesFromInteraction(text, data.reply, memories);
        if (newlyDiscovered.length > 0) {
          const updated = [...newlyDiscovered, ...memories];
          setMemories(updated);
          ragEngine.saveMemories(updated);
          setMemoryToast(`🧠 "${newlyDiscovered[0].content.slice(0, 36)}..." belleğe öğrenildi!`);
          setTimeout(() => setMemoryToast(null), 3500);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const isOffline = !networkService.getStatus().isOnline;
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: isOffline
          ? '📡 Cihazınız şu an çevrimdışı modda. İnternet bağlantısı koptuğu için yapay zekâ sunucusuna ulaşılamadı. Bağlantı yeniden kurulduğunda "Tekrar" butonuna basarak cevabınızı alabilirsiniz.'
          : '⚠️ Bir bağlantı sorunu oluştu. Lütfen aşağıdaki "Tekrar" butonuna basarak cevabı yeniden isteyin!',
        engine: isOffline ? 'Çevrimdışı Koruma' : 'Hata Bildirimi',
        timestamp: Date.now(),
        error: true,
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (isLoading || messages.length === 0) return;

    let trimmed = [...messages];
    if (trimmed[trimmed.length - 1].role === 'assistant') trimmed.pop();
    if (trimmed.length === 0) return;

    const lastUserQuery = trimmed.filter((m) => m.role === 'user').pop()?.content || '';
    const { retrievedMemories, contextString } = ragEngine.retrieveRelevantMemories(
      lastUserQuery,
      memories,
      3
    );
    const recalledSummaries = retrievedMemories.map((m) => m.content);

    setMessages(trimmed);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
          tone,
          enableSearch,
          ragContext: contextString,
        }),
      });

      const data = await response.json();
      const assistantMessage: Message = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Cevap üretilemedi.',
        engine: data.engine || 'Benim Yapay Zekâm',
        timestamp: Date.now(),
        recalledMemories: recalledSummaries.length > 0 ? recalledSummaries : undefined,
      };

      setMessages([...trimmed, assistantMessage]);
    } catch (err) {
      console.error('Regenerate error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      if (window.confirm('Yeni bir sohbet başlatmak istiyor musunuz?')) {
        audioEngine.stopVoiceover();
        setSpeakingMessageId(null);
        setMessages([]);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
      }
    }
  };

  const handleExportChat = (format: 'txt' | 'json' | 'pdf') => {
    if (messages.length === 0) return;

    const dateStr = new Date().toLocaleString('tr-TR');
    const fileNameBase = `benim-yapay-zekam-${Date.now()}`;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${fileNameBase}.json`);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Benim Yapay Zekam - Sohbet Geçmişi', 10, 10);
      doc.setFontSize(10);
      doc.text(`Tarih: ${dateStr}`, 10, 20);
      
      let y = 30;
      messages.forEach((m) => {
        const role = m.role === 'user' ? 'Kullanıcı' : 'Yapay Zeka';
        doc.setFontSize(12);
        doc.text(`${role}:`, 10, y);
        y += 7;
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(m.content, 180);
        doc.text(lines, 10, y);
        y += (lines.length * 7) + 5;
        if (y > 280) { doc.addPage(); y = 10; }
      });
      doc.save(`${fileNameBase}.pdf`);
    } else {
      // Default to TXT
      let text = `=========================================\n`;
      text += ` Benim Yapay Zekâm - Sohbet Geçmişi\n`;
      text += ` Tarih: ${dateStr}\n`;
      text += `=========================================\n\n`;

      messages.forEach((m) => {
        const roleName = m.role === 'user' ? 'Kullanıcı' : 'Benim Yapay Zekâm';
        const time = new Date(m.timestamp).toLocaleTimeString('tr-TR');
        text += `[${time}] ${roleName}:\n${m.content}\n\n`;
      });

      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      downloadBlob(blob, `${fileNameBase}.txt`);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getThemeWrapperClass = () => {
    if (currentTheme === 'cyberpunk-neon') {
      return 'bg-slate-950 text-slate-100';
    }
    if (currentTheme === 'android-material') {
      return 'bg-stone-50 text-stone-900';
    }
    if (currentTheme === 'minimal-titanium') {
      return 'bg-neutral-100 text-neutral-900';
    }
    return 'bg-slate-50/70 text-slate-800';
  };

  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf('assistant');

  return (
    <div className={`flex flex-col h-[100dvh] antialiased overflow-hidden ${getThemeWrapperClass()} transition-colors duration-300`}>
      {/* Network Offline & Reconnect Status Banner */}
      <NetworkStatusBanner />

      {/* Top Header & Navigation Tabs */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          audioEngine.stopAllMusic();
          audioEngine.stopVoiceover();
          setActiveTab(tab);
        }}
        onNewChat={handleNewChat}
        onExportChat={() => setIsExportModalOpen(true)}
        onOpenInfo={() => setIsInfoOpen(true)}
...
      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={(format) => {
          handleExportChat(format);
          setIsExportModalOpen(false);
        }}
      />
        onStartLiveCall={() => setIsLiveCallActive(true)}
        onOpenEvolutionModal={() => setIsEvolutionModalOpen(true)}
        onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
        onOpenHomeScreenModal={() => setIsHomeScreenModalOpen(true)}
        onOpenPerformanceModal={() => setIsPerformanceModalOpen(true)}
        onOpenNotificationsModal={() => setIsNotificationsModalOpen(true)}
        unreadNotificationCount={notifications.filter((n) => !n.read).length}
        learnedMemoryCount={memories.length}
        messageCount={messages.length}
        engineName={engineName}
        totalStorageItems={photos.length + videos.length}
        currentTheme={currentTheme}
        systemVersion={systemVersion.currentVersion}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Tab Content */}
      {activeTab === 'chat' && (
        <>
          <main
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar flex flex-col"
          >
            {messages.length === 0 ? (
              <WelcomeScreen
                onSelectPrompt={(prompt) => handleSendMessage(prompt)}
                onOpenHomeScreen={() => setIsHomeScreenModalOpen(true)}
              />
            ) : (
              <div className="max-w-3xl w-full mx-auto space-y-4 my-auto">
                {messages.map((message, index) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isLastAssistant={index === lastAssistantIndex}
                      onRegenerate={handleRegenerate}
                      speakingMessageId={speakingMessageId}
                      onToggleSpeech={handleToggleSpeech}
                      onSendToImageStudio={() => setActiveTab('image')}
                      onSendToVideoStudio={() => setActiveTab('video')}
                      searchQuery={searchQuery}
                    />
                ))}

                {isLoading && (
                  <div className="flex items-start gap-2.5 sm:gap-3 max-w-[94%] sm:max-w-3xl animate-fadeIn">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-2 text-slate-500 text-xs">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce [animation-delay:0.4s]"></span>
                      <span className="ml-1 text-slate-400 font-medium">Yanıt düşünülüyor...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>

          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            tone={tone}
            onToneChange={setTone}
            enableSearch={enableSearch}
            onToggleSearch={() => setEnableSearch(!enableSearch)}
            hasMessages={messages.length > 0}
            lastAssistantMessage={messages.slice().reverse().find((m) => m.role === 'assistant')?.content}
          />
        </>
      )}

      {/* Autopilot Tab (1-Click Social Media Publisher & Scheduler) */}
      {activeTab === 'autopilot' && (
        <AutopilotStudio
          isInstagramConnected={true}
          isWhatsAppConnected={true}
          onConnectSocial={() => setActiveTab('social')}
          onNavigateToImage={() => setActiveTab('image')}
          onNavigateToVideo={() => setActiveTab('video')}
        />
      )}

      {/* Photo Studio Tab */}
      {activeTab === 'image' && (
        <PhotoStudio
          onSendToVideoStudio={(photo) => {
            setVideoStudioInitialPhoto(photo);
            setActiveTab('video');
          }}
        />
      )}

      {/* Video Studio Tab */}
      {activeTab === 'video' && (
        <VideoStudio
          initialPhoto={videoStudioInitialPhoto}
          onClearInitialPhoto={() => setVideoStudioInitialPhoto(null)}
          onVideoCreated={(newVid) => {
            setVideos((prev) => [newVid, ...prev]);
          }}
        />
      )}

      {/* Social Media & WhatsApp Hub Tab */}
      {activeTab === 'social' && (
        <SocialHub
          onGenerateImageForPost={() => setActiveTab('image')}
          onGenerateVideoForPost={() => setActiveTab('video')}
        />
      )}

      {/* Media Vault & Storage Tab */}
      {activeTab === 'vault' && (
        <MediaVault
          photos={photos}
          videos={videos}
          onDeletePhoto={(id) => setPhotos((prev) => prev.filter((p) => p.id !== id))}
          onDeleteVideo={(id) => setVideos((prev) => prev.filter((v) => v.id !== id))}
          onClearAll={() => {
            if (window.confirm('Tüm medya deposunu temizlemek istiyor musunuz?')) {
              setPhotos([]);
              setVideos([]);
            }
          }}
          onRestoreBackup={(data) => {
            if (Array.isArray(data.photos)) setPhotos(data.photos);
            if (Array.isArray(data.videos)) setVideos(data.videos);
          }}
          onUploadPhoto={(photo) => setPhotos((prev) => [photo, ...prev])}
        />
      )}

      {/* Live Video Call Fullscreen Overlay */}
      {isLiveCallActive && (
        <LiveCall onEndCall={() => setIsLiveCallActive(false)} />
      )}

      {/* Self-Evolution & Theme Morpher Modal */}
      <SelfEvolutionModal
        isOpen={isEvolutionModalOpen}
        onClose={() => setIsEvolutionModalOpen(false)}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        version={systemVersion}
        onUpgradeVersion={handleUpgradeVersion}
      />

      {/* Learning Memory (RAG system) Modal */}
      <LearningMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memories={memories}
        onUpdateMemories={(updated) => {
          setMemories(updated);
          ragEngine.saveMemories(updated);
        }}
        autoLearningEnabled={autoLearningEnabled}
        onToggleAutoLearning={(enabled) => {
          setAutoLearningEnabled(enabled);
          localStorage.setItem(AUTO_LEARNING_STORAGE_KEY, String(enabled));
        }}
      />

      {/* Mini Hızlı Eylem Çubuğu (Action Dock - En Çok Kullanılan 3 Eylem) */}
      <QuickActionDock
        onTabChange={setActiveTab}
        onSendMessage={handleSendMessage}
        onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
        onAddQuickMemory={handleAddQuickMemory}
        onStartLiveCall={() => setIsLiveCallActive(true)}
        onOpenHomeScreenModal={() => setIsHomeScreenModalOpen(true)}
      />

      {/* Voice Command Controller Layer */}
      <VoiceCommandController onExecuteCommand={handleVoiceCommand} />

      {/* Floating Memory Toast */}
      {memoryToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-purple-500/50 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-bounce">
          <Brain className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{memoryToast}</span>
        </div>
      )}

      {/* Upgrade Celebration Toast */}
      {upgradeToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/30 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fadeIn max-w-md text-center">
          <Award className="w-6 h-6 text-amber-200 shrink-0 animate-bounce" />
          <span>{upgradeToast}</span>
        </div>
      )}

      {/* Info Modal */}
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />

      {/* Home Screen App & PWA Installation Modal */}
      <HomeScreenAppModal
        isOpen={isHomeScreenModalOpen}
        onClose={() => setIsHomeScreenModalOpen(false)}
        isAppInstalled={isAppInstalled}
      />

      {/* System Performance Panel & D3 Live Chart Modal */}
      <SystemPerformanceModal
        isOpen={isPerformanceModalOpen}
        onClose={() => setIsPerformanceModalOpen(false)}
      />

      {/* Notifications Modal & Web Push History */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onUpdateNotifications={setNotifications}
      />
    </div>
  );
}
