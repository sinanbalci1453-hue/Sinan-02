import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  Globe,
  Monitor,
  AlertCircle,
  Check,
  Info,
  RefreshCw,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine.ts';
import { usePWAInstall, BeforeInstallPromptEvent, checkIsStandalone } from '../utils/usePWAInstall.ts';

export type PWAButtonStatus = 'yüklenebilir' | 'yüklü' | 'desteklenmiyor';

interface HomeScreenAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAppInstalled?: boolean;
}

export const HomeScreenAppModal: React.FC<HomeScreenAppModalProps> = ({
  isOpen,
  onClose,
  isAppInstalled: propIsAppInstalled,
}) => {
  // Global PWA Hook
  const {
    isInstalled: pwaHookInstalled,
    hasDeferredPrompt: hookHasPrompt,
    isIOS: hookIsIOS,
    isAndroid: hookIsAndroid,
    isIframe: hookIsIframe,
    getPromptPendingReason,
    openDirectUrl,
    triggerHaptic,
  } = usePWAInstall();

  // Local state for dynamically tracking beforeinstallprompt event
  const [capturedPrompt, setCapturedPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined') {
      return (window as any).__pwa_deferred_prompt || null;
    }
    return null;
  });

  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    return Boolean(propIsAppInstalled || checkIsStandalone());
  });

  const [activePlatform, setActivePlatform] = useState<'ios' | 'android' | 'desktop'>('android');
  const [previewTab, setPreviewTab] = useState<'wizard' | 'simulator' | 'guide'>('wizard');
  const [simulatedLaunch, setSimulatedLaunch] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('09:41');
  const [installFeedback, setInstallFeedback] = useState<{
    title: string;
    message: string;
    type: 'success' | 'info' | 'warn';
  } | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  // Synchronize listeners for beforeinstallprompt and appinstalled
  useEffect(() => {
    const now = new Date();
    setCurrentTime(
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    );

    const ua = (navigator.userAgent || '').toLowerCase();
    if (/ipad|iphone|ipod/.test(ua)) {
      setActivePlatform('ios');
    } else if (/android/i.test(ua)) {
      setActivePlatform('android');
    } else {
      setActivePlatform('desktop');
    }

    const checkInstalledState = () => {
      const standalone = Boolean(propIsAppInstalled || checkIsStandalone());
      setIsAppInstalled(standalone);
    };

    checkInstalledState();

    // Check if global prompt is already registered on window
    if ((window as any).__pwa_deferred_prompt) {
      setCapturedPrompt((window as any).__pwa_deferred_prompt);
    }

    // Dynamic listener for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as any).__pwa_deferred_prompt = promptEvent;
      setCapturedPrompt(promptEvent);
      console.log('[HomeScreenAppModal] beforeinstallprompt olayı yakalandı ve buton durumu güncellendi.');
    };

    // Dynamic listener for appinstalled
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setCapturedPrompt(null);
      (window as any).__pwa_deferred_prompt = null;
      console.log('[HomeScreenAppModal] appinstalled olayı yakalandı (Uygulama Yüklendi).');
      setInstallFeedback({
        title: 'Kurulum Başarılı! 🎉',
        message: 'Uygulama başarıyla cihazınıza yüklendi. Artık ana ekranınızdaki simgeden doğrudan başlatabilirsiniz.',
        type: 'success',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [propIsAppInstalled]);

  // Sync with global hook state and prop state if updated outside
  useEffect(() => {
    if (hookHasPrompt && (window as any).__pwa_deferred_prompt && !capturedPrompt) {
      setCapturedPrompt((window as any).__pwa_deferred_prompt);
    }
    const currentInstalled = Boolean(pwaHookInstalled || propIsAppInstalled || checkIsStandalone());
    if (currentInstalled && !isAppInstalled) {
      setIsAppInstalled(true);
    }
  }, [hookHasPrompt, pwaHookInstalled, propIsAppInstalled, capturedPrompt, isAppInstalled]);

  // Determine current PWA button status: 'yüklü' | 'yüklenebilir' | 'desteklenmiyor'
  const isInstalled = Boolean(propIsAppInstalled || isAppInstalled || pwaHookInstalled || checkIsStandalone());
  const promptAvailable = capturedPrompt || (typeof window !== 'undefined' ? (window as any).__pwa_deferred_prompt : null);

  let buttonStatus: PWAButtonStatus = 'desteklenmiyor';
  if (isInstalled) {
    buttonStatus = 'yüklü';
  } else if (promptAvailable) {
    buttonStatus = 'yüklenebilir';
  } else {
    buttonStatus = 'desteklenmiyor';
  }

  const isIframe = hookIsIframe;
  const isIOS = hookIsIOS;

  const handleSimulateAppLaunch = () => {
    if (simulatedLaunch) return;
    audioEngine.playPopSound(800);
    setSimulatedLaunch(true);
    setTimeout(() => {
      setSimulatedLaunch(false);
    }, 2000);
  };

  const handleRefreshStatus = () => {
    audioEngine.playPopSound(600);
    triggerHaptic(10);
    const standalone = Boolean(propIsAppInstalled || checkIsStandalone());
    setIsAppInstalled(standalone);

    if ((window as any).__pwa_deferred_prompt) {
      setCapturedPrompt((window as any).__pwa_deferred_prompt);
    }
  };

  const handleExecuteInstall = async () => {
    audioEngine.playPopSound(700);
    triggerHaptic(20);

    // 1. Durum: Uygulama Zaten Yüklü
    if (buttonStatus === 'yüklü') {
      audioEngine.playSuccessChime();
      setInstallFeedback({
        title: 'Uygulama Zaten Yüklü ✓',
        message: 'Benim Yapay Zekâm şu anda cihazınızda yüklü ve bağımsız (standalone) tam ekran modunda çalışmaktadır. Ana ekranınızdaki simgeden açabilirsiniz.',
        type: 'success',
      });
      return;
    }

    // 2. Durum: Yüklenebilir (beforeinstallprompt yakalanmış ve hazır)
    if (buttonStatus === 'yüklenebilir' && promptAvailable) {
      setIsInstalling(true);
      setInstallFeedback(null);

      try {
        console.log('[HomeScreenAppModal] prompt() tetikleniyor...');
        await promptAvailable.prompt();
        const choice = await promptAvailable.userChoice;
        console.log('[HomeScreenAppModal] prompt sonucu:', choice);
        setIsInstalling(false);

        if (choice.outcome === 'accepted') {
          setIsAppInstalled(true);
          setCapturedPrompt(null);
          (window as any).__pwa_deferred_prompt = null;
          audioEngine.playSuccessChime();
          triggerHaptic([30, 50, 80]);
          setInstallFeedback({
            title: 'Tebrikler, Kurulum Başarılı! 🎉',
            message: 'Benim Yapay Zekâm ana ekranınıza başarıyla eklendi. Artık tam ekran, hızlı ve bağımsız olarak kullanabilirsiniz.',
            type: 'success',
          });
        } else {
          audioEngine.playPopSound(400);
          setInstallFeedback({
            title: 'Kurulum İptal Edildi',
            message: 'Yükleme penceresi kapatıldı veya onaylanmadı. İstediğiniz zaman bu butondan tekrar yükleyebilirsiniz.',
            type: 'warn',
          });
        }
      } catch (err: any) {
        setIsInstalling(false);
        console.warn('[HomeScreenAppModal] Prompt çalıştırma hatası:', err);
        setInstallFeedback({
          title: 'Yükleme Penceresi Açılamadı',
          message: err?.message || 'Tarayıcı yükleme isteğini tamamlayamadı. Lütfen tarayıcı menüsünü (⋮) kullanınız.',
          type: 'warn',
        });
      }
      return;
    }

    // 3. Durum: Desteklenmiyor (Safari, Iframe veya henüz tetiklenmemiş ortam)
    if (buttonStatus === 'desteklenmiyor') {
      audioEngine.playPopSound(500);

      if (isIframe) {
        setInstallFeedback({
          title: 'Geliştirici Önizleme Penceresi Kısıtlaması',
          message: 'Android Chrome ve modern tarayıcılar, güvenlik politikası nedeniyle iframe içinden doğrudan sistem yükleme penceresine izin vermez. Gerçek PWA kurulum penceresini görmek için uygulamayı doğrudan tarayıcı sekmesinde açınız.',
          type: 'info',
        });
      } else if (isIOS) {
        setPreviewTab('guide');
        setActivePlatform('ios');
        setInstallFeedback({
          title: 'iOS Safari İçin Manuel Kurulum',
          message: 'Apple iOS Safari doğrudan otomatik yükleme penceresi (beforeinstallprompt) standardını desteklememektedir. Safari alt çubuğundaki Paylaş (⬆️) simgesine dokunup "Ana Ekrana Ekle"yi seçiniz.',
          type: 'info',
        });
      } else {
        setPreviewTab('guide');
        setInstallFeedback({
          title: 'Manuel Kurulum Rehberi',
          message: 'Tarayıcınız otomatik yükleme penceresini tetiklemedi. Tarayıcınızın sağ üst köşesindeki üç nokta (⋮) menüsüne dokunup "Uygulamayı Yükle" veya "Ana Ekrana Ekle" seçeneğini kullanabilirsiniz.',
          type: 'info',
        });
      }
    }
  };

  // Place conditional return AFTER all hooks to adhere to React Rules of Hooks
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="relative px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                  Uygulamayı Cihazınıza Yükleyin
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Benim Yapay Zekâm'ı telefonda tam ekran, hızlı ve bağımsız kullanın.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition active:scale-95 cursor-pointer"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15">
            <button
              onClick={() => {
                audioEngine.playPopSound(500);
                setPreviewTab('wizard');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                previewTab === 'wizard'
                  ? 'bg-white text-blue-700 shadow-md'
                  : 'bg-white/10 text-white/90 hover:bg-white/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Sihirbaz & Yükleme</span>
            </button>
            <button
              onClick={() => {
                audioEngine.playPopSound(500);
                setPreviewTab('simulator');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                previewTab === 'simulator'
                  ? 'bg-white text-blue-700 shadow-md'
                  : 'bg-white/10 text-white/90 hover:bg-white/20'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Telefon Önizleme</span>
            </button>
            <button
              onClick={() => {
                audioEngine.playPopSound(500);
                setPreviewTab('guide');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                previewTab === 'guide'
                  ? 'bg-white text-blue-700 shadow-md'
                  : 'bg-white/10 text-white/90 hover:bg-white/20'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Adım Adım Rehber</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          {/* PRIMARY CALL-TO-ACTION: DYNAMIC PWA BUTTON & DIAGNOSTICS */}
          <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-800 dark:via-indigo-950/40 dark:to-slate-800 rounded-2xl border border-blue-200 dark:border-indigo-800/80 shadow-xs space-y-3">
            {/* Status indicator row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    buttonStatus === 'yüklenebilir'
                      ? 'bg-blue-500 animate-ping'
                      : buttonStatus === 'yüklü'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  PWA Kurulum Durumu:
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshStatus}
                  title="Durumu Yeniden Kontrol Et"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  aria-label="Yenile"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <span
                  className={`text-[11px] font-extrabold px-3 py-0.5 rounded-full border ${
                    buttonStatus === 'yüklenebilir'
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                      : buttonStatus === 'yüklü'
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                      : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                  }`}
                >
                  {buttonStatus === 'yüklenebilir' && 'Yüklenebilir (Pencere Hazır 🚀)'}
                  {buttonStatus === 'yüklü' && 'Yüklü (Bağımsız Mod ✓)'}
                  {buttonStatus === 'desteklenmiyor' && 'Desteklenmiyor / Manuel'}
                </span>
              </div>
            </div>

            {/* DYNAMIC PWA BUTTON: yüklenebilir, yüklü, desteklenmiyor */}
            {buttonStatus === 'yüklenebilir' && (
              <button
                onClick={handleExecuteInstall}
                disabled={isInstalling}
                className="w-full py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-98 cursor-pointer bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-indigo-500/30 ring-2 ring-indigo-400/40"
              >
                {isInstalling ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-white animate-spin" />
                    <span>Yükleme Penceresi Açılıyor...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 text-amber-300 animate-bounce" />
                    <span>Uygulamayı Cihazınıza Yükleyin (Hemen Kur)</span>
                  </>
                )}
              </button>
            )}

            {buttonStatus === 'yüklü' && (
              <button
                onClick={handleExecuteInstall}
                className="w-full py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-98 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 ring-2 ring-emerald-400/30"
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>Uygulama Cihazınızda Yüklü ✓</span>
              </button>
            )}

            {buttonStatus === 'desteklenmiyor' && (
              <button
                onClick={handleExecuteInstall}
                className="w-full py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-98 cursor-pointer bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-600 hover:from-indigo-700 hover:to-amber-700 text-white shadow-indigo-500/25"
              >
                {isIframe ? (
                  <>
                    <Globe className="w-5 h-5 text-amber-200" />
                    <span>Yeni Sekmede Aç (Doğrudan Yükleme İçin)</span>
                  </>
                ) : isIOS ? (
                  <>
                    <Share className="w-5 h-5 text-amber-200" />
                    <span>Safari ile Ana Ekrana Ekle (Rehberi Gör)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-200" />
                    <span>Manuel Kurulum Rehberini Aç</span>
                  </>
                )}
              </button>
            )}

            {/* LIVE FEEDBACK CARD: Net Kurulum Geri Bildirimi */}
            {installFeedback ? (
              <div
                className={`p-3.5 rounded-xl text-xs space-y-2 animate-fadeIn border ${
                  installFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-100 dark:border-emerald-700'
                    : installFeedback.type === 'warn'
                    ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-100 dark:border-amber-700'
                    : 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-100 dark:border-blue-700'
                }`}
              >
                <div className="font-black flex items-center gap-1.5">
                  {installFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : installFeedback.type === 'warn' ? (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  )}
                  <span>{installFeedback.title}</span>
                </div>
                <p className="leading-relaxed text-[11px] opacity-95">
                  {installFeedback.message}
                </p>
                {isIframe && (
                  <div className="pt-1.5">
                    <button
                      onClick={openDirectUrl}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Uygulamayı Doğrudan Tarayıcıda Aç (PWA Kurulumu İçin)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : buttonStatus === 'desteklenmiyor' ? (
              <div className="p-3.5 rounded-xl text-xs space-y-2 animate-fadeIn border bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-100 dark:border-blue-700">
                <div className="font-black flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Kurulum Durumu ve Bilgilendirme</span>
                </div>
                <p className="leading-relaxed text-[11px] opacity-95">
                  {getPromptPendingReason()}
                </p>
                {isIframe && (
                  <div className="pt-1.5">
                    <button
                      onClick={openDirectUrl}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Uygulamayı Doğrudan Tarayıcıda Aç (PWA Kurulumu İçin)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : buttonStatus === 'yüklenebilir' ? (
              <div className="p-3 rounded-xl text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-medium">
                  Tarayıcınız kurulumu destekliyor. Yukarıdaki butona basarak anında yükleyebilirsiniz.
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl text-xs bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Uygulama Cihazınızda Başarıyla Yüklü</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 pl-6 leading-relaxed">
                  (display-mode: standalone) ve User-Agent denetimleri doğrulandı. Uygulamanız tam ekran, çevrimdışı önbellekleme ve bağımsız uygulama deneyimiyle çalışmaktadır.
                </p>
              </div>
            )}
          </div>

          {/* TAB 1: SİHİRBAZ */}
          {previewTab === 'wizard' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Tespit Edilen Cihaz:</span>
                  <span className="font-extrabold text-indigo-600 uppercase">
                    {activePlatform === 'ios'
                      ? 'Apple iPhone / iPad (iOS)'
                      : activePlatform === 'android'
                      ? 'Android Telefon / Tablet'
                      : 'Bilgisayar (Masaüstü)'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Çalışma Modu:</span>
                  <span className={`font-extrabold flex items-center gap-1.5 ${isInstalled ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {isInstalled ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Bağımsız PWA (Yüklü)</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        <span>Web Tarayıcısı</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {activePlatform === 'android' && (
                  <>
                    <StepCard
                      number={1}
                      title="Google Chrome veya Samsung Internet ile Açın"
                      icon={Globe}
                      text="PWA kurulumunu başlatmak için sitenin Android Chrome veya uyumlu tarayıcıda açık olduğundan emin olun."
                    />
                    <StepCard
                      number={2}
                      title="Yukarıdaki 'Uygulamayı Yükle' Butonuna Basın"
                      icon={Download}
                      text="Tarayıcınızda yükleme penceresi destekleniyorsa doğrudan 'Uygulamayı Yükle' butonu sistem onay penceresini açacaktır."
                    />
                    <StepCard
                      number={3}
                      title="Alternatif: Üç Nokta (⋮) Menüsü"
                      icon={Layers}
                      text="Tarayıcı henüz otomatik pencereyi tetiklememişse; sağ üstteki (⋮) menüsüne dokunup 'Uygulamayı Yükle' veya 'Ana Ekrana Ekle'yi seçebilirsiniz."
                    />
                  </>
                )}

                {activePlatform === 'ios' && (
                  <>
                    <StepCard
                      number={1}
                      title="Safari Tarayıcısı ile Açın"
                      icon={Globe}
                      text="Apple iOS kısıtlamaları gereği web uygulamaları yalnızca Safari üzerinden ana ekrana eklenebilir."
                    />
                    <StepCard
                      number={2}
                      title="'Paylaş' Butonuna Dokunun"
                      icon={Share}
                      text="Safari alt çubuğunda ortada yer alan 'Paylaş' (⬆️) simgesine dokunun."
                    />
                    <StepCard
                      number={3}
                      title="'Ana Ekrana Ekle'yi Seçin"
                      icon={PlusSquare}
                      text="Aşağı kaydırıp 'Ana Ekrana Ekle'ye dokunun ve sağ üstteki 'Ekle'ye basın."
                    />
                  </>
                )}

                {activePlatform === 'desktop' && (
                  <>
                    <StepCard
                      number={1}
                      title="Adres Çubuğu Simgesi"
                      icon={Monitor}
                      text="Chrome veya Edge tarayıcınızın adres çubuğunun sağ tarafındaki 'Uygulamayı Yükle' (💻) simgesine tıklayın."
                    />
                    <StepCard
                      number={2}
                      title="Masaüstü Kısayolu"
                      icon={CheckCircle2}
                      text="Yüklemeyi onaylayarak uygulamayı bağımsız pencerede kullanmaya başlayın."
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TELEFON ÖNİZLEME */}
          {previewTab === 'simulator' && (
            <div className="space-y-4">
              <div className="relative mx-auto max-w-[280px] w-full rounded-[40px] p-3.5 bg-slate-900 shadow-2xl border-[6px] border-slate-800">
                <div className="relative rounded-[32px] overflow-hidden bg-indigo-950 aspect-[9/17.5] p-4 text-white">
                  {simulatedLaunch && (
                    <div className="absolute inset-0 z-30 bg-indigo-900 flex flex-col items-center justify-center animate-pulse">
                      <Sparkles className="w-12 h-12 text-white animate-bounce" />
                    </div>
                  )}
                  <div className="flex justify-between text-[10px] opacity-70">
                    <span>{currentTime}</span>
                    <span>📶 🔋</span>
                  </div>
                  <div className="mt-12 flex flex-col items-center gap-2">
                    <div
                      onClick={handleSimulateAppLaunch}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-pink-600 flex items-center justify-center cursor-pointer shadow-lg animate-pulse"
                    >
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-xs font-bold">Benim AI</span>
                    <span className="text-[10px] text-blue-200 text-center px-2">Dokunarak açılışı simüle edin</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADIM ADIM REHBER */}
          {previewTab === 'guide' && (
            <div className="space-y-4">
              {/* Platform Switcher */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(['android', 'ios', 'desktop'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setActivePlatform(p)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                      activePlatform === p
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    {p === 'android' ? 'Android' : p === 'ios' ? 'iPhone' : 'Bilgisayar'}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {activePlatform === 'android' && (
                  <>
                    <StepCard
                      number={1}
                      title="Chrome ile açın"
                      icon={Globe}
                      text="Uygulamayı Chrome tarayıcısında açtığınızdan emin olun."
                    />
                    <StepCard
                      number={2}
                      title="Menüye (⋮) dokunun"
                      icon={Layers}
                      text="Sağ üst köşedeki üç nokta (⋮) menü butonuna basın."
                    />
                    <StepCard
                      number={3}
                      title="'Uygulamayı Yükle'yi seçin"
                      icon={Download}
                      text="Listeden 'Uygulamayı Yükle' veya 'Ana Ekrana Ekle' seçeneğine dokunup onaylayın."
                    />
                  </>
                )}
                {activePlatform === 'ios' && (
                  <>
                    <StepCard
                      number={1}
                      title="Safari ile açın"
                      icon={Globe}
                      text="Bu işlem sadece Safari tarayıcısında çalışır. Lütfen siteyi Safari ile açın."
                    />
                    <StepCard
                      number={2}
                      title="'Paylaş' butonuna dokunun"
                      icon={Share}
                      text="Alt çubuktaki 'Paylaş' (⬆️) simgesine dokunun."
                    />
                    <StepCard
                      number={3}
                      title="'Ana Ekrana Ekle'yi seçin"
                      icon={PlusSquare}
                      text="Aşağıdan 'Ana Ekrana Ekle'ye dokunun ve sağ üstten 'Ekle'ye basın."
                    />
                  </>
                )}
                {activePlatform === 'desktop' && (
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-center text-xs text-slate-600 dark:text-slate-300">
                    Masaüstünde Chrome veya Edge adres çubuğunun sağ tarafındaki 'Yükle' (💻) simgesine tıklayarak uygulamayı PC/Mac'inize yükleyebilirsiniz.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StepCard: React.FC<{ number: number; title: string; icon: any; text: string }> = ({
  number,
  title,
  icon: Icon,
  text,
}) => (
  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
      {number}
    </div>
    <div>
      <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
        <Icon className="w-4 h-4 text-indigo-600" />
        {title}
      </h5>
      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{text}</p>
    </div>
  </div>
);
