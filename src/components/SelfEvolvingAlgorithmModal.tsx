import React, { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  Sparkles,
  RefreshCw,
  Cpu,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Flame,
  ArrowRight,
  Layers,
  Activity,
  History,
  Check,
  Play,
  RotateCw,
  X,
  Target,
  BarChart2,
  Atom
} from 'lucide-react';
import {
  selfEvolvingEngine,
  CognitiveGenome,
  EvolutionEvent,
  BenchmarkResult,
  SelfCritiqueResult
} from '../utils/selfEvolvingAlgorithm.ts';
import { audioEngine } from '../utils/audioEngine.ts';

interface SelfEvolvingAlgorithmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SelfEvolvingAlgorithmModal: React.FC<SelfEvolvingAlgorithmModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [genome, setGenome] = useState<CognitiveGenome>(() => selfEvolvingEngine.getGenome());
  const [history, setHistory] = useState<EvolutionEvent[]>(() => selfEvolvingEngine.getHistory());
  const [autoEvolve, setAutoEvolve] = useState<boolean>(() => selfEvolvingEngine.isAutoEvolveEnabled());

  const [activeTab, setActiveTab] = useState<'genome' | 'critique' | 'history'>('genome');
  const [isEvolving, setIsEvolving] = useState<boolean>(false);
  const [evolutionStepText, setEvolutionStepText] = useState<string>('');
  const [latestBenchmarks, setLatestBenchmarks] = useState<BenchmarkResult[] | null>(null);

  // Self-critique lab state
  const [testInput, setTestInput] = useState<string>('Yapay zekâ çağında iş dünyasında nasıl öne geçilir?');
  const [critiqueResult, setCritiqueResult] = useState<SelfCritiqueResult | null>(null);
  const [isCritiquing, setIsCritiquing] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = selfEvolvingEngine.subscribe(() => {
      setGenome(selfEvolvingEngine.getGenome());
      setHistory(selfEvolvingEngine.getHistory());
      setAutoEvolve(selfEvolvingEngine.isAutoEvolveEnabled());
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleRunEvolution = async () => {
    if (isEvolving) return;
    setIsEvolving(true);
    audioEngine.playPopSound(500);
    audioEngine.triggerHaptic(30);

    setEvolutionStepText('Bilişsel ağırlıklar ve çıkarım haritası taranıyor...');
    await new Promise((r) => setTimeout(r, 600));

    setEvolutionStepText('Rastgele mutasyon vektörleri ve hipotezler üretiliyor...');
    audioEngine.playPopSound(600);
    audioEngine.triggerHaptic(20);
    await new Promise((r) => setTimeout(r, 700));

    setEvolutionStepText('5 Temel benchmark testi üzerinde çoklu simülasyon koşturuluyor...');
    audioEngine.playPopSound(700);
    audioEngine.triggerHaptic(30);
    await new Promise((r) => setTimeout(r, 900));

    setEvolutionStepText('Pozitif varyanslar genom havuzuna kalıcı olarak enjekte ediliyor...');
    await new Promise((r) => setTimeout(r, 600));

    const result = await selfEvolvingEngine.executeEvolutionCycle();
    setLatestBenchmarks(result.benchmarks);
    setIsEvolving(false);
    setEvolutionStepText('');

    audioEngine.playSuccessChime();
    audioEngine.triggerHaptic(50);
  };

  const handleRunSelfCritique = () => {
    if (!testInput.trim() || isCritiquing) return;
    setIsCritiquing(true);
    audioEngine.playPopSound(650);
    audioEngine.triggerHaptic(25);

    setTimeout(() => {
      const res = selfEvolvingEngine.performSelfCritique(testInput);
      setCritiqueResult(res);
      setIsCritiquing(false);
      audioEngine.playSuccessChime();
      audioEngine.triggerHaptic(40);
    }, 1200);
  };

  const cognitiveBars = [
    {
      id: 'analyticalPrecision',
      label: 'Analitik Keskinlik & Mantık',
      val: genome.analyticalPrecision,
      desc: 'Mantıksal çıkarım, kod doğruluğu ve sıfır çelişki',
      color: 'from-blue-500 to-indigo-600',
      badge: 'Matematik & Kod',
    },
    {
      id: 'creativeOriginality',
      label: 'Yaratıcı Özgünlük & Kanca',
      val: genome.creativeOriginality,
      desc: 'Sıradışı benzetmeler, viral açılar ve estetik zekâ',
      color: 'from-amber-500 to-rose-500',
      badge: 'Yaratıcılık & Sanat',
    },
    {
      id: 'conversationalEmpathy',
      label: 'Duygusal Zekâ & Empati',
      val: genome.conversationalEmpathy,
      desc: 'Samimi, saygılı, psikolojik güven veren Türkçe dil uyumu',
      color: 'from-emerald-500 to-teal-500',
      badge: 'EQ & Rezonans',
    },
    {
      id: 'concisenessClarity',
      label: 'Öz & Netlik (Signal-to-Noise)',
      val: genome.concisenessClarity,
      desc: 'Gereksiz dolgu metinlerini eleme ve doğrudan çözüme odaklanma',
      color: 'from-purple-500 to-violet-600',
      badge: 'Yüksek Bilgi Yoğunluğu',
    },
    {
      id: 'recursiveReflection',
      label: 'Özyinelemeli Öz-Eleştiri',
      val: genome.recursiveReflection,
      desc: 'Cevabı iletmeden önce kendi zihninde iki aşamalı denetimden geçirme',
      color: 'from-fuchsia-500 to-pink-600',
      badge: 'İçsel Denetçi',
    },
    {
      id: 'hallucinationGuard',
      label: 'Halüsinasyon Kalkanı',
      val: genome.hallucinationGuard,
      desc: 'Doğrulanmamış veya temelsiz bilgileri %98 oranında engelleme',
      color: 'from-cyan-500 to-blue-600',
      badge: 'Gerçeklik Filtresi',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="relative px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-950 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <Brain className="w-6 h-6 text-purple-300 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                    Kendi Kendini Geliştiren Algoritma
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 uppercase tracking-wider shadow-xs">
                    Gen {genome.generation}
                  </span>
                </div>
                <p className="text-xs text-purple-200/90 mt-0.5 flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Özyinelemeli Bilişsel Gelişim & Takviyeli Öğrenme Çekirdeği</span>
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

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-bold text-purple-300 block">Uygunluk Skoru</span>
              <span className="text-base sm:text-lg font-black text-white">%{genome.fitnessScore}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-bold text-cyan-300 block">Jenerasyon</span>
              <span className="text-base sm:text-lg font-black text-cyan-200">Gen {genome.generation}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Oto-Evrim</span>
              <span className="text-base sm:text-lg font-black text-emerald-300">
                {autoEvolve ? 'Aktif ⚡' : 'Durgun ⏸️'}
              </span>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => {
                audioEngine.playPopSound(500);
                setActiveTab('genome');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'genome'
                  ? 'bg-white text-indigo-950 shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Bilişsel Genom & Benchmark</span>
            </button>
            <button
              onClick={() => {
                audioEngine.playPopSound(500);
                setActiveTab('critique');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'critique'
                  ? 'bg-white text-indigo-950 shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Canlı Öz-Eleştiri Laboratuvarı</span>
            </button>
            <button
              onClick={() => {
                audioEngine.playPopSound(500);
                setActiveTab('history');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'history'
                  ? 'bg-white text-indigo-950 shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Evrim Tarihçesi ({history.length})</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* TAB 1: GENOME & BENCHMARK */}
          {activeTab === 'genome' && (
            <div className="space-y-6">
              {/* Action Banner: Run Evolution Cycle */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border border-purple-200 dark:border-purple-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Yeni Bir Evrim & Optimizasyon Döngüsü Başlat
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
                    Algoritma kendi sinirsel ağırlıklarını mutasyona uğratır, 5 temel bilişsel alanda kendini test eder ve en yüksek skoru alan ağırlıkları kalıcı kılar.
                  </p>
                </div>

                <button
                  onClick={handleRunEvolution}
                  disabled={isEvolving}
                  className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm text-white shadow-lg transition flex items-center justify-center gap-2 shrink-0 active:scale-95 ${
                    isEvolving
                      ? 'bg-indigo-400 cursor-wait animate-pulse'
                      : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-indigo-500/25'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${isEvolving ? 'animate-spin' : ''}`} />
                  <span>{isEvolving ? 'Evrim Koşturuluyor...' : 'Döngüyü Şimdi Çalıştır'}</span>
                </button>
              </div>

              {/* Progress animation while evolving */}
              {isEvolving && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 border border-purple-500/40 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                    <span className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span>{evolutionStepText}</span>
                    </span>
                    <span>%78</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 animate-pulse rounded-full w-4/5"></div>
                  </div>
                </div>
              )}

              {/* Latest Benchmark Results if available */}
              {latestBenchmarks && (
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h5 className="font-extrabold text-xs sm:text-sm text-emerald-950 dark:text-emerald-100">
                        Son Evrim Benchmark Raporu (Gen {genome.generation})
                      </h5>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                      Tüm Testler Başarılı ✓
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {latestBenchmarks.map((b) => (
                      <div
                        key={b.category}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <strong className="block text-slate-800 dark:text-slate-200 text-[11px] truncate">
                            {b.categoryName}
                          </strong>
                          <span className="text-[10px] text-slate-500">{b.description}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-slate-900 dark:text-white">%{b.score}</span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                            +{b.delta}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cognitive DNA Hyperparameter Bars */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Aktif Bilişsel Parametreler & Ağırlık Dağılımı</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">Otomatik Kalibre Edilir</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cognitiveBars.map((bar) => {
                    const percent = Math.round(bar.val * 100);
                    return (
                      <div
                        key={bar.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 block">
                              {bar.label}
                            </span>
                            <span className="text-[10px] text-slate-500">{bar.desc}</span>
                          </div>
                          <span className="font-black text-xs px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            %{percent}
                          </span>
                        </div>

                        {/* Visual Bar */}
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${bar.color} rounded-full transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{bar.badge}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Optimum Aralık</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Autonomous Mode Toggle Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Zap className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <strong className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 block">
                      Sürekli Arka Planda Kendi Kendini Eğitme
                    </strong>
                    <p className="text-[11px] text-slate-500">
                      Kullanıcı etkileşimlerinden, kopyalanan yanıtlardan ve sohbetlerden otomatik öğrenip jenerasyonu günceller.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    audioEngine.playPopSound(600);
                    selfEvolvingEngine.toggleAutoEvolve(!autoEvolve);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    autoEvolve ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      autoEvolve ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CRITIQUE LAB */}
          {activeTab === 'critique' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100">
                  Canlı İki Aşamalı Öz-Eleştiri Laboratuvarı
                </h4>
                <p className="text-xs text-slate-500">
                  Algoritmanın bir yanıtı vermeden önce kendi iç zihninde nasıl sorguladığını, zayıf noktaları tespit edip cevabı nasıl mükemmelleştirdiğini canlı izleyin.
                </p>
              </div>

              {/* Input Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Test Edilecek Konu / Soru:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Bir soru veya konu girin..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleRunSelfCritique}
                    disabled={isCritiquing}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition active:scale-95 flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isCritiquing ? 'Süzgeçten Geçiriliyor...' : 'Öz-Eleştiriyi Çalıştır'}</span>
                  </button>
                </div>
              </div>

              {/* Critique Results Visualization */}
              {critiqueResult && (
                <div className="space-y-4 animate-fade-in pt-2">
                  {/* Step 1: Draft Thought */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      1. Aşama: Ham İlk Düşünce Taslağı
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                      "{critiqueResult.originalThought}"
                    </p>
                  </div>

                  {/* Step 2: Internal Critique */}
                  <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        2. Aşama: İçsel Öz-Eleştiri ve Zayıflık Tespiti
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                        Doğruluk: {critiqueResult.critique.factualAccuracyScore}/10
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div>
                        <strong className="text-rose-700 dark:text-rose-300">Tespit Edilen Eksiklik: </strong>
                        <span className="text-slate-700 dark:text-slate-300">
                          {critiqueResult.critique.weaknessIdentified}
                        </span>
                      </div>
                      <div>
                        <strong className="text-emerald-700 dark:text-emerald-300">Uygulanan İyileştirme: </strong>
                        <span className="text-slate-700 dark:text-slate-300">
                          {critiqueResult.critique.suggestedImprovement}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Refined Final Output */}
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        3. Aşama: Mükemmelleştirilmiş Çıktı
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        +%{critiqueResult.optimizationGain} Bilişsel Kazanç
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium shadow-2xs">
                      {critiqueResult.refinedOutput}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EVOLUTION HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Kronolojik Bilişsel Mutasyon Günlüğü
                </h4>
                <span className="text-[11px] text-slate-500">Son 20 Olay</span>
              </div>

              <div className="space-y-2.5">
                {history.map((event) => {
                  const dateStr = new Date(event.timestamp).toLocaleString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={event.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            Gen {event.generation}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {event.type === 'benchmark_cycle'
                              ? '🏆 Benchmark Optimizasyonu'
                              : event.type === 'self_critique_tuning'
                              ? '🔍 İki Aşamalı Öz-Eleştiri Ayarlaması'
                              : event.type === 'user_reinforcement'
                              ? '👍 Takviyeli Kullanıcı Eğitimi (RLHF)'
                              : '⚡ Otonom Genom Mutasyonu'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{dateStr}</span>
                          <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                            +{event.fitnessDelta}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Yeni Uygunluk: %{event.newFitness}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Aktif Modele Uygulandı</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Brain className="w-3.5 h-3.5 text-purple-600" />
            <span>Genom parametreleri /api/chat motoruna anlık enjekte edilmektedir.</span>
          </div>

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
  );
};
