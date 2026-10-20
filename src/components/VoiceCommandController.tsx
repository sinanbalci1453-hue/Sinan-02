import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  X,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  CheckCircle2,
  Layers,
  Camera,
  Film,
  Instagram,
  Brain,
  Zap,
  PhoneCall
} from 'lucide-react';
import { voiceCommandService, VoiceState, VoiceCommandAction } from '../utils/voiceCommandService.ts';

interface VoiceCommandControllerProps {
  onExecuteCommand: (action: VoiceCommandAction) => void;
}

export const VoiceCommandController: React.FC<VoiceCommandControllerProps> = ({
  onExecuteCommand,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastAction, setLastAction] = useState<VoiceCommandAction | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    voiceCommandService.setCallbacks(
      (state) => {
        setVoiceState(state);
      },
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          setShowPulse(true);
          setTimeout(() => setShowPulse(false), 1500);
          setTimeout(() => setTranscript(''), 4000);
        }
      },
      (action) => {
        if (!isMuted) {
          setLastAction(action);
          onExecuteCommand(action);
          setShowPulse(true);
          setTimeout(() => setShowPulse(false), 1500);
          setTimeout(() => setLastAction(null), 5000);
        }
      }
    );
  }, [onExecuteCommand, isMuted]);

  const handleToggle = () => {
    if (isListening) {
      voiceCommandService.toggleListening();
    } else if (!isMuted) {
      voiceCommandService.toggleListening();
    }
  };

  const isListening = voiceState === 'listening' && !isMuted;

  return (
    <>
      <style>{`
        @keyframes pulse-success {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .animate-pulse-success {
          animation: pulse-success 1.5s infinite;
        }
      `}</style>

      {/* Floating HUD Controller Widget */}
      <div className="fixed top-20 right-3 sm:top-24 sm:right-6 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Expanded Transcript & Control Bubble */}
        {(isListening || transcript || lastAction || isExpanded) && (
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-slate-700/80 w-72 sm:w-80 animate-fadeIn space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  {isListening && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isListening ? 'bg-rose-500' : isMuted ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  ></span>
                </span>
                <span className="font-bold text-slate-200">
                  {isListening ? 'Dinleniyor...' : isMuted ? 'Sessize Alındı' : 'Sesli Komut Katmanı'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? 'Sesi Aç' : 'Sessize Al'}
                  className={`p-1 rounded-md transition ${isMuted ? 'text-amber-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  title="Komut Listesi"
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            {/* Live Transcript / Recognized words */}
            {transcript ? (
              <div className="p-2.5 bg-slate-800/80 rounded-xl text-xs text-amber-200 border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block mb-0.5">Algılanan Ses:</span>
                <p className="font-medium italic">"{transcript}"</p>
              </div>
            ) : isListening ? (
              <div className="py-2 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <span className="w-1 h-3 bg-rose-500 animate-pulse rounded-full"></span>
                <span className="w-1 h-5 bg-rose-400 animate-pulse delay-75 rounded-full"></span>
                <span className="w-1 h-2 bg-rose-500 animate-pulse delay-150 rounded-full"></span>
                <span className="w-1 h-4 bg-rose-400 animate-pulse delay-200 rounded-full"></span>
                <span className="ml-1 text-[11px]">Şimdi konuşabilirsiniz...</span>
              </div>
            ) : null}

            {/* Action Feedback Badge - Added animate-pulse-success class */}
            {lastAction && (
              <div
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-fadeIn ${showPulse ? 'animate-pulse-success' : ''} ${
                  lastAction.type !== 'unknown'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                }`}
              >
                {lastAction.type !== 'unknown' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-bold text-[11px] truncate">{lastAction.matchedPhrase}</div>
                  <div className="text-[10px] opacity-80">{lastAction.feedbackText}</div>
                </div>
              </div>
            )}

            {/* Quick Action Chips */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Hızlı Sesli Komutlar:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { text: 'Fotoğraf çek', icon: Camera, color: 'hover:border-blue-400' },
                  { text: 'Video üret', icon: Film, color: 'hover:border-purple-400' },
                  { text: 'Sohbete git', icon: Sparkles, color: 'hover:border-indigo-400' },
                  { text: 'Sosyal medya', icon: Instagram, color: 'hover:border-pink-400' },
                  { text: 'Hafıza ve anılar', icon: Brain, color: 'hover:border-emerald-400' },
                  { text: 'Sürüm yükselt', icon: Zap, color: 'hover:border-amber-400' },
                ].map((cmd, i) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setTranscript(cmd.text);
                        voiceCommandService.processVoiceCommand(cmd.text);
                      }}
                      className={`px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-[11px] font-medium text-slate-200 border border-slate-700 transition active:scale-95 flex items-center gap-1.5 ${cmd.color}`}
                    >
                      <Icon className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{cmd.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Help / Guide Box */}
            {showHelp && (
              <div className="p-2.5 bg-slate-800/90 rounded-xl text-[11px] text-slate-300 space-y-1 border border-slate-700 animate-fadeIn">
                <span className="font-bold text-white block">Desteklenen Komut Örnekleri:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                  <li><strong className="text-slate-200">"Fotoğraf stüdyosu"</strong>: Görsel moduna geçer</li>
                  <li><strong className="text-slate-200">"Video stüdyosu"</strong>: Reels & film moduna geçer</li>
                  <li><strong className="text-slate-200">"Instagram"</strong>: Sosyal medya merkezine gider</li>
                  <li><strong className="text-slate-200">"Öğrenen bellek"</strong>: Anı ve RAG panelini açar</li>
                  <li><strong className="text-slate-200">"Sürüm yükselt"</strong>: v5 Titanium sürümüne geçer</li>
                  <li><strong className="text-slate-200">"Soru sor: [metin]"</strong>: Yapay zekâya doğrudan soru yazar</li>
                </ul>
              </div>
            )}

            
            {/* Floating Voice Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 flex items-center justify-center shadow-md border border-slate-700 transition"
                title="Sesli Komut Menüsü"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>

              <button
                onClick={handleToggle}
                className={`relative flex items-center justify-center rounded-2xl p-3 sm:p-3.5 shadow-xl transition-all duration-300 active:scale-95 ${
                  isListening
                    ? 'bg-rose-600 text-white shadow-rose-600/40 ring-4 ring-rose-500/30'
                    : isMuted
                    ? 'bg-amber-600 text-white'
                    : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white shadow-indigo-600/30 hover:scale-105'
                }`}
                title={isListening ? 'Sesli Dinlemeyi Kapat' : isMuted ? 'Sesi Aç' : 'Sesli Komut ile Kontrol Et'}
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6" />
                ) : isListening ? (
                  <>
                    <Mic className="w-6 h-6 animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-400 rounded-full animate-ping"></span>
                  </>
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

