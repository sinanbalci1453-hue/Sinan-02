import React from 'react';
import {
  MessageSquare,
  Sparkles,
  Image as ImageIcon,
  Film,
  Plus,
  HelpCircle,
  Bot,
  Share2,
  PhoneCall,
  HardDrive,
  Zap,
  Cpu,
  Palette,
  Layers,
  Brain,
  Smartphone,
  Activity,
  Bell
} from 'lucide-react';
import { StudioTab, AppTheme } from '../types.ts';
import { usePWAInstall } from '../utils/usePWAInstall.ts';
import { audioEngine } from '../utils/audioEngine.ts';

interface HeaderProps {
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  onNewChat: () => void;
  onExportChat: () => void;
  onOpenInfo: () => void;
  onStartLiveCall: () => void;
  onOpenEvolutionModal: () => void;
  onOpenMemoryModal: () => void;
  onOpenHomeScreenModal: () => void;
  onOpenPerformanceModal: () => void;
  onOpenNotificationsModal: () => void;
  unreadNotificationCount: number;
  onOpenAlgorithmModal?: () => void;
  algorithmGeneration?: number;
  learnedMemoryCount: number;
  messageCount: number;
  engineName?: string;
  totalStorageItems: number;
  currentTheme: AppTheme;
  systemVersion: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onNewChat,
  onExportChat,
  onOpenInfo,
  onStartLiveCall,
  onOpenEvolutionModal,
  onOpenMemoryModal,
  onOpenHomeScreenModal,
  onOpenPerformanceModal,
  onOpenNotificationsModal,
  unreadNotificationCount,
  learnedMemoryCount,
  messageCount,
  engineName,
  totalStorageItems,
  currentTheme,
  systemVersion,
  searchQuery,
  onSearchChange,
}) => {
  const [isQuickSwitchOpen, setIsQuickSwitchOpen] = React.useState(false);
  const { isInstalled, hasDeferredPrompt, triggerInstall } = usePWAInstall();
  const [headerInstallNotice, setHeaderInstallNotice] = React.useState<string | null>(null);

  const handleHeaderInstallClick = async () => {
    audioEngine.playPopSound(700);
    if (isInstalled) {
      setHeaderInstallNotice('✓ Uygulama Zaten Yüklü: Bağımsız modda çalışıyor.');
      setTimeout(() => setHeaderInstallNotice(null), 3500);
      return;
    }
    if (hasDeferredPrompt) {
      const res = await triggerInstall();
      if (res.status === 'accepted') {
        setHeaderInstallNotice('🎉 Yükleme Başarılı! Uygulama ana ekranınıza eklendi.');
      } else if (res.status === 'dismissed') {
        setHeaderInstallNotice('Yükleme isteği kapatıldı.');
      }
      setTimeout(() => setHeaderInstallNotice(null), 4000);
    } else {
      // If prompt not triggered yet, open HomeScreenAppModal for diagnostic reason and steps
      onOpenHomeScreenModal();
    }
  };

  const tabs = [
    { id: 'chat' as StudioTab, label: 'Sohbet & Bilgi', shortLabel: 'Sohbet', icon: MessageSquare, badge: 'Zeki' },
    { id: 'autopilot' as StudioTab, label: 'Otopilot Paylaşım', shortLabel: 'Otopilot', icon: Zap, badge: 'Otomatik' },
    { id: 'image' as StudioTab, label: 'Fotoğraf Üretimi', shortLabel: 'Fotoğraf', icon: ImageIcon, badge: '4K' },
    { id: 'video' as StudioTab, label: 'Video Stüdyosu', shortLabel: 'Video', icon: Film, badge: '60s & HD' },
    { id: 'social' as StudioTab, label: 'Sosyal Medya & WP', shortLabel: 'Sosyal', icon: Share2, badge: 'Canlı API' },
    { id: 'vault' as StudioTab, label: 'Medya Kasası', shortLabel: 'Kasa', icon: HardDrive, badge: `${totalStorageItems}` },
  ];

  const getThemeHeaderStyles = () => {
    if (currentTheme === 'cyberpunk-neon') {
      return 'bg-slate-950/95 text-slate-100 border-b border-purple-500/30';
    }
    if (currentTheme === 'android-material') {
      return 'bg-emerald-50/90 text-slate-800 border-b border-emerald-200';
    }
    if (currentTheme === 'minimal-titanium') {
      return 'bg-white text-slate-900 border-b border-slate-300';
    }
    // ios-glass default
    return 'bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800';
  };

  return (
    <header className={`${getThemeHeaderStyles()} sticky top-0 px-2 sm:px-5 py-2 shrink-0 shadow-xs z-30 flex flex-col gap-2 transition-colors duration-300`}>
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight tracking-tight">
                Benim Yapay Zekâm
              </h1>
              {/* OTA Version upgrade pill */}
              <button
                onClick={onOpenEvolutionModal}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-50 to-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100 transition active:scale-95 shadow-2xs"
                title="Sistem ve Sürüm Güncelleyici"
              >
                <Cpu className="w-2.5 h-2.5 text-indigo-600" />
                <span className="text-amber-600 font-black">👑 PRO</span>
                <span className="truncate max-w-[85px] sm:max-w-none">{systemVersion}</span>
              </button>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-700 font-semibold">Çevrim içi</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 truncate max-w-[120px] sm:max-w-none">
                {engineName || 'Tak-Çalıştır Modu'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        {activeTab === 'chat' && (
          <div className="hidden sm:flex items-center flex-1 max-w-sm mx-4">
            <input
              type="text"
              placeholder="Sohbette ara..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Live Video Call button */}
          <button
            onClick={onStartLiveCall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition active:scale-95 animate-pulse"
            title="Yapay zekâ ile canlı görüntülü ve sesli arama başlat"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Canlı Görüntülü Arama</span>
            <span className="sm:hidden">Canlı Ara</span>
          </button>

          {/* Self-Evolution & Theme button */}
          <button
            onClick={onOpenEvolutionModal}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-indigo-700 hover:bg-indigo-50 rounded-lg transition active:scale-95 flex items-center gap-1 text-xs font-bold border border-indigo-200"
            title="Platform Temasını & Sürümü Güncelle"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Sürüm & Tema</span>
          </button>

          {/* Learning Memory (RAG) button */}
          <button
            onClick={onOpenMemoryModal}
            className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition active:scale-95 shadow-2xs"
            title="Öğrenen Bellek & RAG Sistemi"
          >
            <Brain className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Öğrenen Bellek</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900 font-extrabold">
              {learnedMemoryCount}
            </span>
          </button>

          {/* Home Screen App & Installation button */}
          <button
            onClick={handleHeaderInstallClick}
            className={`flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold transition active:scale-95 shadow-2xs ${
              isInstalled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700'
                : hasDeferredPrompt
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-blue-500/25 animate-pulse'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border-blue-200'
            }`}
            title={isInstalled ? 'Uygulama zaten cihazınızda yüklü' : 'Uygulama Yükle (PWA)'}
          >
            <Smartphone className={`w-3.5 h-3.5 shrink-0 ${hasDeferredPrompt ? 'text-white' : 'text-blue-600'}`} />
            <span className="text-[11px] sm:text-xs leading-none">
              {isInstalled ? 'Yüklendi ✓' : 'Uygulama Yükle'}
            </span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded-sm font-black uppercase tracking-wider shrink-0 ${
                isInstalled
                  ? 'bg-emerald-600 text-white'
                  : hasDeferredPrompt
                  ? 'bg-amber-300 text-slate-900'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {isInstalled ? 'YÜKLÜ' : 'YÜKLE'}
            </span>
          </button>

          {/* Header Install Notice Toast */}
          {headerInstallNotice && (
            <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-indigo-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{headerInstallNotice}</span>
            </div>
          )}

          {/* System Performance Panel button */}
          <button
            onClick={onOpenPerformanceModal}
            className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition active:scale-95 shadow-2xs"
            title="Sistem Performans Paneli & Canlı D3 Grafik"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Performans</span>
          </button>

          {/* Notifications & Push Bell button */}
          <button
            onClick={onOpenNotificationsModal}
            className="relative flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition active:scale-95 shadow-2xs"
            title="Bildirim Geçmişi & Web Push"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Bildirimler</span>
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center border border-white">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Quick Switch Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsQuickSwitchOpen(!isQuickSwitchOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition active:scale-95"
              title="Aktif Stüdyolar Arası Hızlı Geçiş"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Hızlı Stüdyo ⚡</span>
            </button>

            {isQuickSwitchOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-1.5 animate-fadeIn space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Stüdyolar
                </div>
                <button
                  onClick={() => {
                    onTabChange('video');
                    setIsQuickSwitchOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <Film className="w-4 h-4 text-indigo-600" />
                  <span>Video Stüdyosu</span>
                </button>
                <button
                  onClick={() => {
                    onTabChange('image');
                    setIsQuickSwitchOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <ImageIcon className="w-4 h-4 text-pink-600" />
                  <span>Fotoğraf Üretimi</span>
                </button>
                <button
                  onClick={() => {
                    onTabChange('social');
                    setIsQuickSwitchOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>Sosyal Medya & WP</span>
                </button>
              </div>
            )}
          </div>

          {/* New chat button (only on chat tab) */}
          {activeTab === 'chat' && (
            <button
              onClick={onNewChat}
              title="Yeni Sohbet"
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg transition active:scale-95 border border-blue-200 hover:border-transparent shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Sohbet</span>
            </button>
          )}
        </div>
      </div>

      {/* Studio Navigation Tabs Bar */}
      <nav className="flex items-center gap-1 overflow-x-auto custom-scrollbar border-t border-slate-100 pt-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
