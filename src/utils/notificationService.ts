import { AppNotification } from '../types.ts';

const NOTIF_STORAGE_KEY = 'benim_app_notifications_v1';

export const notificationService = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Tarayıcınız Web Push bildirimlerini desteklemiyor.');
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  getStoredNotifications: (): AppNotification[] => {
    try {
      const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default initial notifications if empty
    return [
      {
        id: 'notif-1',
        title: '👑 Sistem Sürümü Güncellendi',
        message: 'Titanium Pro Max v5.0.0 çekirdeği aktif edildi. Sınırsız bellek ve 60s video motoru hazır.',
        type: 'system',
        timestamp: Date.now() - 1000 * 60 * 30,
        read: false,
      },
      {
        id: 'notif-2',
        title: '🤖 Otopilot Sosyal Medya Paylaşımı',
        message: 'Instagram hesabınızda "Geleceğin Akıllı Şehirleri" başlıklı gönderi başarıyla yayınlandı.',
        type: 'social',
        timestamp: Date.now() - 1000 * 60 * 120,
        read: false,
      },
    ];
  },

  saveNotifications: (notifications: AppNotification[]) => {
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
    } catch {}
  },

  sendNotification: (title: string, message: string, type: AppNotification['type'] = 'system'): AppNotification => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
    };

    const current = notificationService.getStoredNotifications();
    const updated = [newNotif, ...current];
    notificationService.saveNotifications(updated);

    // Trigger Browser Push Notification if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/pwa-192x192.png',
        });
      } catch (e) {
        console.warn('Browser push error:', e);
      }
    }

    return newNotif;
  },
};
