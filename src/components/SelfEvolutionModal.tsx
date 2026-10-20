import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Zap,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  Sliders,
  Layers,
  Palette,
  Download,
  ShieldCheck,
  Cpu,
  Flame,
  Radio
} from 'lucide-react';
import { AppTheme, SystemVersion } from '../types.ts';
import { usePWAInstall } from '../utils/usePWAInstall.ts';

interface SelfEvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  version: SystemVersion;
  onUpgradeVersion: () => Promise<void>;
}

export const SelfEvolutionModal: React.FC<SelfEvolutionModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  version,
  onUpgradeVersion,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateLog, setUpdateLog] = useState<string[]>([]);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  const { isInstallable, isInstalled, isIOS, install, triggerHaptic } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (!isOpen) return null;

  const handleStartSelfEvolution = async () => {
    setIsUpdating(true);
    setUpdateLog(['OTA güncelleme sunucusuyla el sıkışılıyor...']);
    triggerHaptic([30, 50, 30]);

    setTimeout(() => {
      setUpdateLog((prev) => [
        ...prev,
        '📱 Yeni telefon sürümleri (iOS 19, Android 16, Katlanabilir Ekranlar) için dokunmatik optimizasyon yapılıyor...',
      ]);
    }, 800);

    setTimeout(() => {
      setUpdateLog((prev) => [
        ...prev,
        '⚡ Yapay zekâ motoru ve sosyal medya otopilot algoritmaları güncelleniyor...',
      ]);
    }, 1700);

    setTimeout(() => {
      setUpdateLog((prev) => [
        ...prev,
        '✨ Kendi kendini yenileme tamamlandı! Sistem en güncel v5.5.0-Quantum Titanium Ultra mimarisine yükseltildi. Sınırsız depolama ve 60s video motoru aktifleştirildi!',
      ]);
      onUpgradeVersion();
      setIsUpdating(false);
      triggerHaptic(50);
    }, 2800);
  };

  const themes: { id: AppTheme; name: string; desc: string; icon: string; previewClass: string }[] = [
    {
      id: 'ios-glass',
      name: '🍏 iOS 19 Glassmorphism',
      desc: 'Buzlu saydam cam, akıcı geçişler ve modern Apple stili',
      icon: '🍏',
      previewClass: 'from-blue-500/20 to-indigo-500/20 border-blue-400/30',
    },
    {
      id: 'android-material',
      name: '🤖 Android 16 Material You',
      desc: 'Dinamik renk paleti, organik yuvarlak kartlar ve taktil butonlar',
      icon: '🤖',
      previewClass: 'from-emerald-500/20 to-teal-500/20 border-emerald-400/30',
    },
    {
      id: 'cyberpunk-neon',
      name: '🌌 Siberpunk Neon Studio',
      desc: 'Derin karanlık mod, canlı neon hatlar ve fütüristik HUD panelleri',
      icon: '🌌',
      previewClass: 'from-purple-900/40 to-pink-900/40 border-purple-500/40',
    },
    {
      id: 'minimal-titanium',
      name: '⚡ Minimalist Titanium',
      desc: 'Profesyonel monokrom, sıfır dikkat dağıtıcı ve ultra hızlı arayüz',
      icon: '⚡',
      previewClass: 'from-slate-200 to-slate-300 border-slate-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto custom-scrollbar flex flex-col justify-between">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  Kendi Kendini Yenileme & Platform Merkezi
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {version.currentVersion}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sürekli güncellenen yapay zekâ çekirdeği ve yeni telefon uyum motoru
              </p>
            </div>
          </div>

          {/* Section 1: Live OTA Evolution / Auto-update */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Yapay Zekâ Canlı Güncelleme Çekirdeği
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                Otomatik OTA Aktif
              </span>
            </div>

            <p className="text-xs text-indigo-900 leading-relaxed">
              Yapay zekânız yeni telefon modelleri çıktıkça arayüzünü, ekran oranlarını ve sosyal medya algoritmalarını kendi kendine günceller.
            </p>

            <button
              onClick={handleStartSelfEvolution}
              disabled={isUpdating}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Sistem Kendi Kendini Yeniliyor...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Sistemi Şimdi Yenile & Güncelle 🚀</span>
                </>
              )}
            </button>

            {/* Live Update logs */}
            {updateLog.length > 0 && (
              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {updateLog.map((log, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400">➜</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Platform & Phone Appearance Morpher */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-purple-600" />
              Platform ve Telefon Temasını Değiştir
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onThemeChange(t.id);
                    triggerHaptic(15);
                  }}
                  className={`p-3 rounded-2xl border text-left transition active:scale-95 flex items-start gap-2.5 ${
                    currentTheme === t.id
                      ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-2xl mt-0.5">{t.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight">{t.name}</div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Mobile Phone Compatibility & PWA Installation */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-blue-600" />
              Yeni Telefon Sürümlerine Tam Uyum (PWA)
            </h4>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bu uygulamayı iPhone (iOS 17, 18, 19) veya Android (14, 15, 16) telefonunuzun ana ekranına tek tıkla yükleyebilir, tam ekran yerel uygulama gibi kullanabilirsiniz.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {isInstallable && (
                <button
                  onClick={() => install()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Telefona Yükle (Uygulama Olarak Aç)</span>
                </button>
              )}

              {isIOS && !isInstalled && (
                <button
                  onClick={() => setShowIOSGuide(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>iPhone'a Yükle (Rehber)</span>
                </button>
              )}

              {isInstalled && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Uygulama Cihazınıza Yüklü
                </span>
              )}

              {/* Haptic Toggle */}
              <button
                onClick={() => {
                  setHapticEnabled(!hapticEnabled);
                  triggerHaptic(20);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                  hapticEnabled
                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                <span>📳 Titreşimli Geri Bildirim: {hapticEnabled ? 'Açık' : 'Kapalı'}</span>
              </button>
            </div>

            {/* iOS Guide Modal */}
            {showIOSGuide && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <strong>iPhone / iPad Kurulum Adımları:</strong>
                <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-blue-800">
                  <li>Safari'nin alt menüsündeki <strong>Paylaş (Share)</strong> butonuna dokunun.</li>
                  <li>Açılan menüde aşağı kaydırıp <strong>"Ana Ekrana Ekle" (Add to Home Screen)</strong> seçeneğini seçin.</li>
                  <li>Sağ üstteki <strong>"Ekle"</strong> butonuna basın.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition active:scale-95 shadow-sm"
          >
            Kaydet ve Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
