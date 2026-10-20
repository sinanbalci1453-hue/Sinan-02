import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PWAInstallResult {
  status: 'already_installed' | 'prompt_shown' | 'accepted' | 'dismissed' | 'unsupported_or_waiting';
  message: string;
  reason?: string;
}

// Global module-level cache for beforeinstallprompt event so it is NEVER lost across component lifecycles
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptSubscribers = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();
const installSubscribers = new Set<(installed: boolean) => void>();

// Attach early global listener as soon as module is imported
if (typeof window !== 'undefined') {
  // Check if already captured earlier on window
  if ((window as any).__pwa_deferred_prompt) {
    globalDeferredPrompt = (window as any).__pwa_deferred_prompt;
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent ambient mini-infobar or browser default prompt
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    (window as any).__pwa_deferred_prompt = e;
    console.log('[PWA] Global beforeinstallprompt olayı yakalandı ve saklandı.');
    promptSubscribers.forEach((cb) => cb(globalDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    (window as any).__pwa_deferred_prompt = null;
    console.log('[PWA] Uygulama başarıyla yüklendi (appinstalled).');
    promptSubscribers.forEach((cb) => cb(null));
    installSubscribers.forEach((cb) => cb(true));
  });
}

/**
 * navigator.standalone, display-mode: standalone ve window.navigator.userAgent kontrollerini
 * birleştirerek uygulamanın zaten yüklü / bağımsız (standalone/TWA/PWA) modunda çalışıp
 * çalışmadığını daha kararlı ve hassas bir şekilde denetleyen fonksiyon.
 */
export function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // 1. Ekran Görüntüleme Modu (display-mode: standalone, fullscreen, minimal-ui)
    const matchesDisplayMode = Boolean(
      window.matchMedia &&
      (window.matchMedia('(display-mode: standalone)').matches ||
       window.matchMedia('(display-mode: fullscreen)').matches ||
       window.matchMedia('(display-mode: minimal-ui)').matches)
    );

    // 2. iOS Safari Standalone Modu
    const isIOSStandalone = Boolean(
      (window.navigator as unknown as { standalone?: boolean })?.standalone === true
    );

    // 3. Android TWA veya Play Store PWA Referrer Doğrulaması
    const isAndroidAppReferrer = Boolean(
      typeof document !== 'undefined' &&
      document.referrer &&
      document.referrer.includes('android-app://')
    );

    // 4. window.navigator.userAgent Kontrolü ile Güçlendirilmiş PWA & WebView Tespiti
    const ua = (window.navigator?.userAgent || '').toLowerCase();
    const isAndroidWebView = /;\s*wv\)/i.test(ua) || (ua.includes('android') && ua.includes('version/') && ua.includes('chrome/'));
    const isIOSStandaloneUA = /(iphone|ipod|ipad).*applewebkit(?!.*safari)/i.test(ua);
    const hasStandaloneUAToken = ua.includes('pwa') || ua.includes('standalone') || ua.includes('twa');

    const isUserAgentDetected = Boolean(isAndroidWebView || isIOSStandaloneUA || hasStandaloneUAToken);

    return matchesDisplayMode || isIOSStandalone || isAndroidAppReferrer || isUserAgentDetected;
  } catch (err) {
    console.warn('[PWA] Kurulum durumu denetlenirken hata oluştu:', err);
    return false;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkIsStandalone());
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isIframe, setIsIframe] = useState<boolean>(false);

  useEffect(() => {
    setIsInstalled(checkIsStandalone());

    const ua = (navigator.userAgent || '').toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/i.test(ua);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    try {
      setIsIframe(window.self !== window.top);
    } catch {
      setIsIframe(true);
    }

    const onPromptChange = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt);
    };

    const onInstallChange = (installed: boolean) => {
      setIsInstalled(installed);
    };

    promptSubscribers.add(onPromptChange);
    installSubscribers.add(onInstallChange);

    // Initial check in case it updated
    if (globalDeferredPrompt && !deferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    return () => {
      promptSubscribers.delete(onPromptChange);
      installSubscribers.delete(onInstallChange);
    };
  }, [deferredPrompt]);

  // Diagnostic reason explaining why beforeinstallprompt has not fired
  const getPromptPendingReason = (): string => {
    if (isInstalled) {
      return 'Uygulama zaten cihazınızda yüklü ve bağımsız (standalone) modda çalışıyor.';
    }
    if (isIframe) {
      return 'Uygulama şu anda geliştirici iframe önizleme penceresinde çalışmaktadır. Android Chrome güvenlik politikası gereği iframe içinden doğrudan sistem yükleme penceresi açılamaz. Gerçek Android yükleme penceresi için uygulamayı doğrudan tarayıcı sekmesinde açınız.';
    }
    if (isIOS) {
      return 'Apple iOS Safari doğrudan otomatik yükleme penceresi (beforeinstallprompt) standardını desteklememektedir. Safari alt çubuğundaki Paylaş (⬆️) simgesine dokunup "Ana Ekrana Ekle"yi seçiniz.';
    }
    if (isAndroid) {
      return 'Android Chrome otomatik yükleme penceresini henüz tetiklemedi. Tarayıcınızın sağ üst köşesindeki üç nokta (⋮) menüsüne dokunup "Uygulamayı Yükle" veya "Ana Ekrana Ekle" seçeneğini kullanabilirsiniz.';
    }
    return 'Tarayıcınız otomatik yükleme penceresini henüz tetiklemedi. Chrome/Edge adres çubuğundaki yükleme simgesinden (💻) veya menüden (⋮) "Uygulamayı Yükle" seçeneğini kullanabilirsiniz.';
  };

  // Trigger PWA installation
  const triggerInstall = async (): Promise<PWAInstallResult> => {
    // 1. Check if already installed
    if (isInstalled) {
      return {
        status: 'already_installed',
        message: 'Uygulama Zaten Yüklü',
        reason: 'Uygulama şu anda cihazınızda yüklü ve bağımsız (standalone) uygulama modunda çalışmaktadır. ✓',
      };
    }

    // 2. Check if beforeinstallprompt is captured and ready
    const promptEvent = deferredPrompt || globalDeferredPrompt;
    if (promptEvent) {
      try {
        console.log('[PWA] Saklanan beforeinstallprompt olayı prompt() ile çalıştırılıyor...');
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        console.log('[PWA] Kullanıcı tercihi:', choice);

        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          promptSubscribers.forEach((cb) => cb(null));
          installSubscribers.forEach((cb) => cb(true));
          return {
            status: 'accepted',
            message: 'Tebrikler! Uygulama ana ekranınıza başarıyla yüklendi. 🎉',
          };
        } else {
          return {
            status: 'dismissed',
            message: 'Yükleme İptal Edildi',
            reason: 'Yükleme penceresi kullanıcı tarafından kapatıldı veya onaylanmadı.',
          };
        }
      } catch (err: any) {
        console.warn('[PWA] Prompt çalıştırma hatası:', err);
        return {
          status: 'unsupported_or_waiting',
          message: 'Yükleme Penceresi Açılamadı',
          reason: err?.message || String(err),
        };
      }
    }

    // 3. beforeinstallprompt has not fired yet or unsupported environment
    const reason = getPromptPendingReason();
    return {
      status: 'unsupported_or_waiting',
      message: 'Otomatik Yükleme Penceresi Henüz Tetiklenmedi',
      reason,
    };
  };

  // Convenience install() wrapper returning boolean
  const install = async (): Promise<boolean> => {
    const res = await triggerInstall();
    return res.status === 'accepted';
  };

  const openDirectUrl = () => {
    try {
      window.open(window.location.href, '_blank');
    } catch {
      window.location.href = window.location.href;
    }
  };

  const triggerHaptic = (pattern: number | number[] = 15) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  return {
    isInstallable: !!(deferredPrompt || globalDeferredPrompt),
    hasDeferredPrompt: !!(deferredPrompt || globalDeferredPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    isIframe,
    getPromptPendingReason,
    triggerInstall,
    install,
    openDirectUrl,
    triggerHaptic,
  };
}
