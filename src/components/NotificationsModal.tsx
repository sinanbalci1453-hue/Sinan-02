import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Sparkles,
  ShieldCheck,
  Instagram,
  MessageSquare,
  Zap,
  Brain,
  Info
} from 'lucide-react';
import { AppNotification } from '../types.ts';
import { notificationService } from '../utils/notificationService.ts';
import { audioEngine } from '../utils/audioEngine.ts';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onUpdateNotifications: (updated: AppNotification[]) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onUpdateNotifications,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'social'>('all');
  const [pushEnabled, setPushEnabled] = useState<boolean>(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    audioEngine.playPopSound(700);
    const success = await notificationService.requestPermission();
    setPushEnabled(success);
    if (success) {
      notificationService.sendNotification(
        '🔔 Web Push Bildirimleri Aktif!',
        'Asistanınızın önemli güncellemeleri ve sosyal medya etkileşimleri artık cihazınıza anında iletilecek.',
        'system'
      );
    }
  };

  const handleMarkAllRead = () => {
    audioEngine.playPopSound(600);
    const updated = notifications.map((n) => ({ ...n, read: true }));
    onUpdateNotifications(updated);
    notificationService.saveNotifications(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Tüm bildirim geçmişini temizlemek istiyor musunuz?')) {
      audioEngine.playPopSound(400);
      onUpdateNotifications([]);
      notificationService.saveNotifications([]);
    }
  };

  const handleToggleRead = (id: string) => {
    audioEngine.playPopSound(500);
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n));
    onUpdateNotifications(updated);
    notificationService.saveNotifications(updated);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'system') return n.type === 'system';
    if (filter === 'social') return n.type === 'social' || n.type === 'autopilot';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'social':
      case 'autopilot':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'memory':
        return <Brain className="w-4 h-4 text-purple-600" />;
      case 'system':
      default:
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center relative">
              <Bell className="w-6 h-6 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] font-extrabold flex items-center justify-center border-2 border-slate-900">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Bildirim Geçmişi & Web Push
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Asistan güncellemeleri, otopilot ve sosyal medya etkinlikleri.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Web Push Permission Banner */}
        {!pushEnabled && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Tarayıcı Bildirimlerini Açın
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                  Asistanınız arka planda çalışırken anında bildirim alın.
                </p>
              </div>
            </div>
            <button
              onClick={handleEnablePush}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition active:scale-95 shrink-0"
            >
              Bildirimleri Etkinleştir 🔔
            </button>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {(['all', 'unread', 'system', 'social'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filter === f
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                {f === 'all'
                  ? 'Tümü'
                  : f === 'unread'
                  ? `Okunmamış (${unreadCount})`
                  : f === 'system'
                  ? 'Sistem'
                  : 'Sosyal'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 transition"
              title="Tümünü Okundu İşaretle"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Okundu İşaretle</span>
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 transition"
              title="Geçmişi Temizle"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Temizle</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Görüntülenecek bildirim bulunmuyor.
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Asistanınız yeni bir güncelleme yaptığında veya sosyal medya paylaşımı tamamlandığında burada görünecektir.
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition flex items-start gap-3.5 ${
                  n.read
                    ? 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80'
                    : 'bg-blue-50/50 dark:bg-slate-800 border-blue-200 dark:border-indigo-900/50 shadow-xs'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                  {getTypeIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate">
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {new Date(n.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {n.message}
                  </p>
                </div>

                <button
                  onClick={() => handleToggleRead(n.id)}
                  className={`p-2 rounded-xl transition shrink-0 ${
                    n.read
                      ? 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      : 'text-blue-600 bg-white dark:bg-slate-900 shadow-2xs'
                  }`}
                  title={n.read ? 'Okunmadı olarak işaretle' : 'Okundu olarak işaretle'}
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
