/**
 * Network Connection Monitor & Offline Service
 * Monitors online/offline status, network quality, and provides reconnect events.
 */

export interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string; // '4g', '3g', '2g', 'slow-2g'
  downlink?: number; // Mb/s
  rtt?: number; // ms
  lastOfflineAt?: number;
  lastOnlineAt?: number;
  offlineDurationSeconds: number;
}

type NetworkChangeCallback = (status: NetworkStatus) => void;

class NetworkService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<NetworkChangeCallback> = new Set();
  private offlineStartTime: number | null = null;
  private durationInterval: number | null = null;
  private simulatedOffline: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Listen to connection changes if supported
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        connection.addEventListener('change', this.notifyListeners);
      }
    }
  }

  private handleOnline = () => {
    if (this.simulatedOffline) return;
    this.isOnline = true;
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
    this.notifyListeners();
  };

  private handleOffline = () => {
    if (this.simulatedOffline) return;
    this.isOnline = false;
    this.offlineStartTime = Date.now();
    this.startOfflineTimer();
    this.notifyListeners();
  };

  private startOfflineTimer() {
    if (this.durationInterval) clearInterval(this.durationInterval);
    this.durationInterval = window.setInterval(() => {
      if (!this.isOnline) {
        this.notifyListeners();
      }
    }, 1000);
  }

  public getStatus(): NetworkStatus {
    const effectiveOnline = this.simulatedOffline ? false : this.isOnline;
    const connection = typeof navigator !== 'undefined'
      ? (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      : null;

    const offlineDuration = !effectiveOnline && this.offlineStartTime
      ? Math.floor((Date.now() - this.offlineStartTime) / 1000)
      : 0;

    return {
      isOnline: effectiveOnline,
      effectiveType: connection?.effectiveType || '4g',
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      lastOfflineAt: this.offlineStartTime || undefined,
      offlineDurationSeconds: offlineDuration,
    };
  }

  public subscribe(callback: NetworkChangeCallback): () => void {
    this.listeners.add(callback);
    callback(this.getStatus());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners = () => {
    const status = this.getStatus();
    this.listeners.forEach((cb) => {
      try {
        cb(status);
      } catch (err) {
        console.error('Error in network listener:', err);
      }
    });
  };

  // Perform a quick real HTTP ping check to verify true internet access
  public async checkConnection(): Promise<boolean> {
    if (this.simulatedOffline) return false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('/api/system/version', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const ok = res.ok;
      this.isOnline = ok;
      this.notifyListeners();
      return ok;
    } catch {
      this.isOnline = false;
      if (!this.offlineStartTime) this.offlineStartTime = Date.now();
      this.startOfflineTimer();
      this.notifyListeners();
      return false;
    }
  }

  // Allow toggling simulated offline mode for testing
  public toggleSimulation(simulateOffline?: boolean) {
    this.simulatedOffline = simulateOffline !== undefined ? simulateOffline : !this.simulatedOffline;
    if (this.simulatedOffline) {
      this.offlineStartTime = Date.now();
      this.startOfflineTimer();
    } else {
      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = null;
      }
      this.offlineStartTime = null;
    }
    this.notifyListeners();
    return this.simulatedOffline;
  }

  public isSimulating(): boolean {
    return this.simulatedOffline;
  }
}

export const networkService = new NetworkService();
