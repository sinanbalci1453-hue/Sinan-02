import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Zap,
  Clock,
  CheckCircle2,
  X,
  TrendingUp,
  RefreshCw,
  Server,
  Layers,
  Sparkles,
  ShieldCheck,
  Download
} from 'lucide-react';
import * as d3 from 'd3';
import { performanceMonitor, MetricPoint, InferenceTiming } from '../utils/performanceMonitor.ts';
import { audioEngine } from '../utils/audioEngine.ts';

interface SystemPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemPerformanceModal: React.FC<SystemPerformanceModalProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<MetricPoint[]>(() => performanceMonitor.getHistory());
  const [timings, setTimings] = useState<InferenceTiming[]>(() => performanceMonitor.getTimings());
  const [activeMetricView, setActiveMetricView] = useState<'both' | 'cpu' | 'memory' | 'ping'>('both');
  const [hoveredPoint, setHoveredPoint] = useState<MetricPoint | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(() => {
      setHistory(performanceMonitor.getHistory());
      setTimings(performanceMonitor.getTimings());
    });
    return () => unsubscribe();
  }, []);

  // Render D3 Line Chart when history or activeMetricView changes
  useEffect(() => {
    if (!isOpen || !chartRef.current) return;

    const container = chartRef.current;
    container.innerHTML = ''; // clear previous SVG

    const width = container.clientWidth || 600;
    const height = 240;
    const margin = { top: 20, right: 20, bottom: 30, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Time / index or timestamp)
    const xScale = d3
      .scalePoint()
      .domain(history.map((d) => d.timeLabel))
      .range([0, innerWidth]);

    // Y Scale (CPU: 0 - 100, Memory: 200 - 900, Ping: 0 - 200)
    const maxY =
      activeMetricView === 'cpu'
        ? 100
        : activeMetricView === 'memory'
        ? 900
        : activeMetricView === 'ping'
        ? 200
        : 900; // 'both' max bounds

    const yScale = d3
      .scaleLinear()
      .domain([0, maxY])
      .range([innerHeight, 0])
      .nice();

    // Grid lines Y
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.15)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      );

    // Axes
    const xAxis = d3.axisBottom(xScale).tickValues(
      xScale.domain().filter((_, i) => i % Math.max(1, Math.floor(history.length / 6)) === 0)
    );

    svg
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#94a3b8');

    const yAxis = d3.axisLeft(yScale).ticks(5);
    svg
      .append('g')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#94a3b8');

    // Line Generators
    const cpuLine = d3
      .line<MetricPoint>()
      .x((d) => xScale(d.timeLabel) || 0)
      .y((d) => yScale(d.cpuUsage))
      .curve(d3.curveMonotoneX);

    const memoryLine = d3
      .line<MetricPoint>()
      .x((d) => xScale(d.timeLabel) || 0)
      .y((d) => yScale(d.memoryUsage))
      .curve(d3.curveMonotoneX);

    const pingLine = d3
      .line<MetricPoint>()
      .x((d) => xScale(d.timeLabel) || 0)
      .y((d) => yScale(d.networkPing))
      .curve(d3.curveMonotoneX);

    // Draw CPU Line & Area if applicable
    if (activeMetricView === 'both' || activeMetricView === 'cpu') {
      const cpuArea = d3
        .area<MetricPoint>()
        .x((d) => xScale(d.timeLabel) || 0)
        .y0(innerHeight)
        .y1((d) => yScale(d.cpuUsage))
        .curve(d3.curveMonotoneX);

      svg
        .append('path')
        .datum(history)
        .attr('fill', 'rgba(99, 102, 241, 0.12)')
        .attr('d', cpuArea);

      svg
        .append('path')
        .datum(history)
        .attr('fill', 'none')
        .attr('stroke', '#6366f1')
        .attr('stroke-width', 2.5)
        .attr('d', cpuLine);
    }

    // Draw Memory Line if applicable
    if (activeMetricView === 'both' || activeMetricView === 'memory') {
      svg
        .append('path')
        .datum(history)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2.5)
        .attr('d', memoryLine);
    }

    // Draw Ping Line if applicable
    if (activeMetricView === 'ping') {
      svg
        .append('path')
        .datum(history)
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2.5)
        .attr('d', pingLine);
    }

    // Interactive hover circles
    svg
      .selectAll('.dot')
      .data(history)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => xScale(d.timeLabel) || 0)
      .attr('cy', (d) => yScale(d.cpuUsage))
      .attr('r', 3.5)
      .attr('fill', '#6366f1')
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseenter', (_, d) => {
        setHoveredPoint(d);
      })
      .on('mouseleave', () => {
        setHoveredPoint(null);
      });

  }, [history, activeMetricView, isOpen]);

  const handleDownloadJson = () => {
    audioEngine.playPopSound(700);
    audioEngine.triggerHaptic(20);

    const exportData = {
      app: 'Benim Yapay Zekâm - System Performance Telemetry',
      exportedAt: new Date().toISOString(),
      averages: performanceMonitor.getAverages(),
      metricsHistory: history,
      inferenceTimings: timings,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `system-performance-report-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  const averages = performanceMonitor.getAverages();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="relative px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                    Sistem Performans Paneli & Telemetri
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white uppercase tracking-wider shadow-2xs">
                    Canlı Akış
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Yapay zekâ çıkarım süreleri, bellek tüketimi ve ağ ping değerlerinin anlık D3.js grafikleri.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                audioEngine.playPopSound(400);
                onClose();
              }}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition active:scale-95"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Summary Cards */}
          <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3 border-t border-white/10">
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Ort. İşlemci (CPU)</span>
                <span className="text-sm sm:text-base font-black text-indigo-300">%{averages.avgCpu}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Ort. Bellek (RAM)</span>
                <span className="text-sm sm:text-base font-black text-emerald-300">{averages.avgMem} MB</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Ağ Ping Gecikmesi</span>
                <span className="text-sm sm:text-base font-black text-amber-300">{averages.avgPing} ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* D3.js Chart Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>CPU & Bellek Kullanım Zaman Çizelgesi (D3.js)</span>
              </h4>

              {/* Chart Metric Selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => setActiveMetricView('both')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    activeMetricView === 'both'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Tümü (CPU + RAM)
                </button>
                <button
                  onClick={() => setActiveMetricView('cpu')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    activeMetricView === 'cpu'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  CPU (%)
                </button>
                <button
                  onClick={() => setActiveMetricView('memory')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    activeMetricView === 'memory'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Bellek (MB)
                </button>
                <button
                  onClick={() => setActiveMetricView('ping')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    activeMetricView === 'ping'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Ping (ms)
                </button>
              </div>
            </div>

            {/* D3 SVG Container Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-inner relative overflow-hidden">
              {/* Legend */}
              <div className="flex items-center gap-4 text-[11px] font-semibold mb-2 px-2">
                {(activeMetricView === 'both' || activeMetricView === 'cpu') && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-indigo-500 rounded-full"></span>
                    <span className="text-indigo-300">İşlemci Yükü (CPU %)</span>
                  </div>
                )}
                {(activeMetricView === 'both' || activeMetricView === 'memory') && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-emerald-500 rounded-full"></span>
                    <span className="text-emerald-300">Bellek Tüketimi (RAM MB)</span>
                  </div>
                )}
                {activeMetricView === 'ping' && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-amber-500 rounded-full"></span>
                    <span className="text-amber-300">Ağ Gecikmesi (ms)</span>
                  </div>
                )}

                {hoveredPoint && (
                  <span className="ml-auto text-[10px] text-cyan-300 font-mono">
                    Saat: {hoveredPoint.timeLabel} | CPU: %{hoveredPoint.cpuUsage} | RAM: {hoveredPoint.memoryUsage}MB | Ping: {hoveredPoint.networkPing}ms
                  </span>
                )}
              </div>

              {/* D3 Mount Ref */}
              <div ref={chartRef} className="w-full overflow-x-auto"></div>
            </div>
          </div>

          {/* AI Inference Timings Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Yapay Zekâ İşlem Süreleri & Yanıt Gecikmeleri</span>
              </h4>
              <span className="text-[11px] text-slate-500">Son İşlemler</span>
            </div>

            <div className="space-y-2">
              {timings.slice(0, 6).map((item) => {
                const timeStr = new Date(item.timestamp).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          item.status === 'success'
                            ? 'bg-emerald-500'
                            : item.status === 'cached'
                            ? 'bg-cyan-500'
                            : 'bg-amber-500'
                        }`}
                      ></div>
                      <div className="min-w-0">
                        <strong className="text-slate-800 dark:text-slate-200 font-bold block truncate">
                          {item.actionName}
                        </strong>
                        <span className="text-[10px] text-slate-400">{timeStr}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          item.durationMs < 500
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.durationMs < 1500
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}
                      >
                        {item.durationMs} ms
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Server className="w-3.5 h-3.5 text-indigo-500" />
            <span>Google Cloud & Pollinations Düğüm Noktaları Aktif</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition active:scale-95"
              title="CPU ve Bellek Geçmişini JSON Olarak İndir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Performans Raporunu İndir (JSON)</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playPopSound(450);
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition active:scale-95"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
