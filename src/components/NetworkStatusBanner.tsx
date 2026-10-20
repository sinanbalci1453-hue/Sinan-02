import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Brain,
  FileText,
  X,
  Activity,
  Zap
} from 'lucide-react';
import { networkService, NetworkStatus } from '../utils/networkService.ts';
import { audioEngine } from '../utils/audioEngine.ts';

interface NetworkStatusBannerProps {
  onRetryConnection?: () => void;
}

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({
  onRetryConnection,
}) => {
  const [status, setStatus] = useState<NetworkStatus>(() => networkService.getStatus());
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    let prevOnline = status.isOnline;

    const unsubscribe = networkService.subscribe((newStatus) => {
      // Transition from offline to online
      if (!prevOnline && newStatus.isOnline) {
        audioEngine.playPopSound(880);
        audioEngine.triggerHaptic(30);
        setShowReconnectedToast(true);
        setIsBannerDismissed(false);
        const timer = setTimeout(() => {
          setShowReconnectedToast(false);
        }, 5000);
        return () => clearTimeout(timer);
      }

      // Transition from online to offline
      if (prevOnline && !newStatus.isOnline) {
        audioEngine.playPopSound(350);
        audioEngine.triggerHaptic(50);
        setIsBannerDismissed(false);
      }

      prevOnline = newStatus.isOnline;
      setStatus(newStatus);
    });

    return () => unsubscribe();
  }, []);

  const handleManualCheck = async () => {
    setIsChecking(true);
    audioEngine.playPopSound(600);
    audioEngine.triggerHaptic(20);
    await networkService.checkConnection();
    if (onRetryConnection) onRetryConnection();
    setTimeout(() => {
      setIsChecking(false);
    }, 800);
  };

  const handleToggleSimulation = () => {
    networkService.toggleSimulation();
    audioEngine.playPopSound(700);
    audioEngine.triggerHaptic(25);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} saniye`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} dk ${secs} sn`;
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. RECONNECTED CELEBRATION TOAST */}
      {/* ======================================================== */}
      {showReconnectedToast && (
        <div className="fixed top-18 sm:top-20 left-1/2 -translate-x-1/2 z-50 w-[92%] sm:w-auto min-w-[320px] max-w-md animate-fadeIn">
          <div className="bg-emerald-950/95 backdrop-blur-xl border border-emerald-500/50 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Wifi className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-emerald-200">
                  Bağlantı Yeniden Kuruldu!
                </h4>
                <p className="text-[11px] text-emerald-300/80">
                  Tüm AI servisleri ve senkronizasyon yeniden çevrimiçi.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowReconnectedToast(false)}
              className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/60 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PERSISTENT OFFLINE MODE BANNER */}
      {/* ======================================================== */}
      {!status.isOnline && !isBannerDismissed && (
        <div className="sticky top-0 z-40 w-full animate-slideDown shadow-xl">
          <div className="bg-gradient-to-r from-amber-950/95 via-rose-950/95 to-slate-950/95 backdrop-blur-xl border-b border-amber-500/40 text-white px-3 sm:px-6 py-2.5 sm:py-3">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
              {/* Left Info */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex items-center justify-center">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-amber-200">
                      Çevrimdışı Mod Aktif
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] text-amber-300 font-semibold">
                      {formatDuration(status.offlineDurationSeconds)}
                    </span>
                    {networkService.isSimulating() && (
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold">
                        Simülasyon
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 hidden sm:block">
                    İnternet bağlantısı kesildi. Yerel medya kasası, kayıtlı RAG anıları ve taslaklar kullanılabilir.
                  </p>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition active:scale-95 flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isDetailsOpen ? 'Detayları Gizle' : 'Kullanılabilir Özellikler'}</span>
                </button>

                <button
                  onClick={handleManualCheck}
                  disabled={isChecking}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Kontrol...' : 'Yeniden Dene'}</span>
                </button>

                <button
                  onClick={() => setIsBannerDismissed(true)}
                  title="Bildirimi Kapat"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expandable Offline Details Drawer */}
            {isDetailsOpen && (
              <div className="mt-3 pt-3 border-t border-amber-500/20 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-fadeIn text-xs">
                <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 flex items-start gap-2.5">
                  <HardDrive className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-slate-200">Medya Kasası Hazır</h5>
                    <p className="text-[10px] text-slate-400">
                      Önceden üretilmiş ve kaydedilmiş tüm fotoğraflar ve videolar yerel depolamadan görüntülenebilir.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 flex items-start gap-2.5">
                  <Brain className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-slate-200">RAG Anı Arama & Filtre</h5>
                    <p className="text-[10px] text-slate-400">
                      Öğrenilen tüm anılar, tercihler ve kurallar çevrimdışı taranabilir ve düzenlenebilir.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-slate-200">İçerik Taslakları</h5>
                    <p className="text-[10px] text-slate-400">
                      Sosyal medya taslakları cihazınıza kaydedilebilir; bağlantı kurulduğunda tek dokunuşla paylaşılır.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Offline Pill if banner was closed */}
      {!status.isOnline && isBannerDismissed && (
        <button
          onClick={() => setIsBannerDismissed(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-600/90 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-xl backdrop-blur-md border border-amber-300/40 animate-pulse active:scale-95"
        >
          <WifiOff className="w-3.5 h-3.5" />
          <span>Çevrimdışı Mod</span>
        </button>
      )}
    </>
  );
};
