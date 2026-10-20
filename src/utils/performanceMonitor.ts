/**
 * System Performance & Telemetry Monitor Service
 * Tracks AI inference latencies, memory utilization, network pings, and time-series data for D3 charts.
 */

export interface MetricPoint {
  timestamp: number;
  timeLabel: string;
  cpuUsage: number; // percentage (e.g. 18% - 75%)
  memoryUsage: number; // MB or percentage (e.g. 420 MB / 65%)
  networkPing: number; // ms (e.g. 24ms - 140ms)
}

export interface InferenceTiming {
  id: string;
  actionName: string;
  durationMs: number;
  timestamp: number;
  status: 'success' | 'cached' | 'fallback';
}

const HISTORY_STORAGE_KEY = 'benim_ai_performance_history_v1';
const TIMINGS_STORAGE_KEY = 'benim_ai_inference_timings_v1';

class PerformanceMonitor {
  private history: MetricPoint[] = [];
  private timings: InferenceTiming[] = [];
  private listeners: Array<() => void> = [];
  private timer: any = null;

  constructor() {
    this.initHistory();
    this.startLiveSimulation();
  }

  private initHistory() {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.history = parsed;
          return;
        }
      }
    } catch {}

    // Generate initial 20 points for the chart
    const now = Date.now();
    const initialPoints: MetricPoint[] = [];
    for (let i = 20; i >= 0; i--) {
      const ts = now - i * 3000;
      const d = new Date(ts);
      const timeLabel = `${String(d.getMinutes()).padStart(2, '0')}:${String(
        d.getSeconds()
      ).padStart(2, '0')}`;
      initialPoints.push({
        timestamp: ts,
        timeLabel,
        cpuUsage: Number((22 + Math.sin(i * 0.4) * 15 + Math.random() * 8).toFixed(1)),
        memoryUsage: Number((380 + Math.cos(i * 0.3) * 45 + Math.random() * 15).toFixed(1)),
        networkPing: Math.round(28 + Math.random() * 45),
      });
    }
    this.history = initialPoints;

    // Initial timings
    this.timings = [
      { id: 't-1', actionName: 'Gemini 3.8 Flash Sohbet Yanıtı', durationMs: 420, timestamp: now - 1000 * 45, status: 'success' },
      { id: 't-2', actionName: '4K Fotoğraf Stüdyo Render', durationMs: 1850, timestamp: now - 1000 * 120, status: 'success' },
      { id: 't-3', actionName: 'Öğrenen Bellek (RAG) Eşleme', durationMs: 65, timestamp: now - 1000 * 200, status: 'cached' },
      { id: 't-4', actionName: 'Sosyal Medya Otopilot Paketi', durationMs: 1120, timestamp: now - 1000 * 300, status: 'success' },
      { id: 't-5', actionName: 'Canlı Ses/Video Bağlantı El Sıkışma', durationMs: 310, timestamp: now - 1000 * 500, status: 'success' },
    ];
  }

  private startLiveSimulation() {
    if (typeof window === 'undefined') return;
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      const now = Date.now();
      const d = new Date(now);
      const timeLabel = `${String(d.getMinutes()).padStart(2, '0')}:${String(
        d.getSeconds()
      ).padStart(2, '0')}`;

      // New data point
      const lastCpu = this.history[this.history.length - 1]?.cpuUsage || 30;
      const lastMem = this.history[this.history.length - 1]?.memoryUsage || 400;

      const newCpu = Number(
        Math.min(95, Math.max(12, lastCpu + (Math.random() * 12 - 6))).toFixed(1)
      );
      const newMem = Number(
        Math.min(850, Math.max(250, lastMem + (Math.random() * 20 - 10))).toFixed(1)
      );
      const newPing = Math.round(22 + Math.random() * 55);

      this.history.push({
        timestamp: now,
        timeLabel,
        cpuUsage: newCpu,
        memoryUsage: newMem,
        networkPing: newPing,
      });

      if (this.history.length > 40) {
        this.history.shift();
      }

      this.persist();
      this.notify();
    }, 3000);
  }

  private persist() {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(this.history));
      localStorage.setItem(TIMINGS_STORAGE_KEY, JSON.stringify(this.timings.slice(0, 30)));
    } catch {}
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch {}
    });
  }

  public getHistory(): MetricPoint[] {
    return [...this.history];
  }

  public getTimings(): InferenceTiming[] {
    return [...this.timings];
  }

  public recordTiming(actionName: string, durationMs: number, status: 'success' | 'cached' | 'fallback' = 'success') {
    this.timings.unshift({
      id: `t-${Date.now()}`,
      actionName,
      durationMs,
      timestamp: Date.now(),
      status,
    });
    if (this.timings.length > 35) {
      this.timings.pop();
    }
    this.persist();
    this.notify();
  }

  public getAverages() {
    const hist = this.history;
    if (hist.length === 0) return { avgCpu: 0, avgMem: 0, avgPing: 0 };
    const sumCpu = hist.reduce((acc, p) => acc + p.cpuUsage, 0);
    const sumMem = hist.reduce((acc, p) => acc + p.memoryUsage, 0);
    const sumPing = hist.reduce((acc, p) => acc + p.networkPing, 0);
    return {
      avgCpu: Number((sumCpu / hist.length).toFixed(1)),
      avgMem: Math.round(sumMem / hist.length),
      avgPing: Math.round(sumPing / hist.length),
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();
