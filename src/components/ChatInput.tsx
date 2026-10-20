import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, SlidersHorizontal, Globe } from 'lucide-react';
import { Tone, ToneOption } from '../types.ts';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  tone: Tone;
  onToneChange: (tone: Tone) => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
  hasMessages: boolean;
  lastAssistantMessage?: string;
}

const TONE_OPTIONS: ToneOption[] = [
  { id: 'samimi', label: 'Samimi & Doğal', desc: 'Sıcak, arkadaş canlısı ve akıcı', icon: '🌟' },
  { id: 'resmi', label: 'Profesyonel & Resmi', desc: 'Kurumsal, net ve saygılı üslup', icon: '💼' },
  { id: 'yaratici', label: 'Yaratıcı & Eğlenceli', desc: 'Özgün benzetmeler ve zengin anlatım', icon: '🎨' },
  { id: 'kisa', label: 'Kısa & Öz', desc: 'Maddelerle ve doğrudan net yanıtlar', icon: '⚡' },
  { id: 'ogretici', label: 'Öğretici & Detaylı', desc: 'Adım adım, sabırlı ve açıklamalı', icon: '🎓' },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  tone,
  onToneChange,
  enableSearch,
  onToggleSearch,
  hasMessages,
  lastAssistantMessage,
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showToneMenu, setShowToneMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 160)}px`;
    }
  }, [text]);

  // Setup Speech Recognition if available
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'tr-TR';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Speech recognition setup failed:', err);
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Tarayıcınız sesli yazdırmayı (Speech-to-Text) desteklemiyor. Lütfen Chrome, Edge veya Safari kullanınız.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Recognition start error:', err);
        setIsListening(false);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickAction = (actionText: string) => {
    onSendMessage(actionText);
  };

  const activeToneObj = TONE_OPTIONS.find((t) => t.id === tone) || TONE_OPTIONS[0];

  const getContextAwareQuickReplies = (lastMsg?: string) => {
    if (!lastMsg) {
      return [
        { label: '🔍 Detaylandır', prompt: 'Daha detaylı ve örneklerle açıklar mısın?' },
        { label: '📌 3 Maddede Özetle', prompt: 'Bunu 3 ana madde halinde özetler misin?' },
        { label: '💡 Örnek Ver', prompt: 'Bu konuyla ilgili günlük hayattan pratik bir örnek verir misin?' },
      ];
    }

    const lower = lastMsg.toLowerCase();
    if (lower.includes('kod') || lower.includes('function') || lower.includes('script') || lower.includes('react') || lower.includes('html') || lower.includes('css') || lower.includes('python')) {
      return [
        { label: '⚡ Nasıl Çalıştırırım?', prompt: 'Bu kodu projemde nasıl çalıştırabilir ve test edebilirim?' },
        { label: '🛡️ Hata Yakalama', prompt: 'Bu kodda olası hatalar ve performans iyileştirmeleri nelerdir?' },
        { label: '🔄 Alternatif Yaklaşım', prompt: 'Bunu daha sade ve alternatif bir kod yapısıyla yazar mısın?' },
      ];
    }

    if (lower.includes('strateji') || lower.includes('plan') || lower.includes('öneri') || lower.includes('fikir') || lower.includes('proje')) {
      return [
        { label: '🎯 En Etkili Yöntem', prompt: 'Bu öneriler arasından en etkili ve hızlı uygulanabilir olanı hangisidir?' },
        { label: '📊 Riskler Neler?', prompt: 'Bu stratejinin olası riskleri ve dezavantajları nelerdir?' },
        { label: '📋 Eylem Adımları', prompt: 'Bunu adım adım günlük pratik bir eylem planına dönüştür.' },
      ];
    }

    return [
      { label: '🔍 Derinlemesine İncele', prompt: 'Bu konuyu daha derinlemesine, teknik detaylarıyla açıklar mısın?' },
      { label: '🌐 Güncel Trendler', prompt: 'Bu konuda son dönemdeki gelişmeler veya güncel yaklaşımlar nelerdir?' },
      { label: '✨ Farklı Bakış Açısı', prompt: 'Buna başka bir perspektiften veya yaratıcı bir açıdan bakar mısın?' },
    ];
  };

  const quickReplies = getContextAwareQuickReplies(lastAssistantMessage);

  return (
    <footer className="relative bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 sm:p-4 shrink-0 z-30">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Quick follow-up chips when conversation is active */}
        {hasMessages && !isLoading && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
            <span className="text-[11px] text-slate-400 font-medium shrink-0">Hızlı Yanıt:</span>
            {quickReplies.map((qr, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(qr.prompt)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 transition text-xs active:scale-95"
              >
                {qr.label}
              </button>
            ))}
          </div>
        )}

        {/* Input box */}
        <div className="relative bg-slate-50/90 rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-md transition-all duration-200 p-2">
          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Sizi dinliyorum, lütfen konuşun...' : 'Mesajınızı yazın... (Enter: Gönder)'}
            disabled={isLoading}
            className="w-full bg-transparent resize-none outline-none text-slate-800 placeholder-slate-400 text-sm max-h-40 px-2 py-1 leading-relaxed"
          />

          {/* Action Row inside Input */}
          <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-200/50">
            {/* Tone selector and controls */}
            <div className="flex items-center gap-1.5 text-xs">
              {/* Tone Popover Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowToneMenu(!showToneMenu)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition active:scale-95 text-xs font-medium"
                  title="Cevap Üslubunu Değiştir"
                >
                  <span className="text-sm">{activeToneObj.icon}</span>
                  <span className="hidden sm:inline">{activeToneObj.label}</span>
                  <SlidersHorizontal className="w-3 h-3 text-slate-400 ml-0.5" />
                </button>

                {/* Tone Dropdown Menu */}
                {showToneMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowToneMenu(false)} />
                    <div className="absolute bottom-full left-0 mb-2 w-56 sm:w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 animate-fadeIn">
                      <div className="text-[11px] font-semibold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                        Cevap Tarzı
                      </div>
                      {TONE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            onToneChange(opt.id);
                            setShowToneMenu(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg flex items-start gap-2 transition ${
                            tone === opt.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="text-base">{opt.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs leading-tight">{opt.label}</div>
                            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{opt.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Web Search Grounding Toggle */}
              <button
                type="button"
                onClick={onToggleSearch}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition active:scale-95 text-xs font-medium ${
                  enableSearch
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                }`}
                title="İnternet Araması ile Canlı Güncel Bilgi"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Web Araması</span>
              </button>
            </div>

            {/* Right side: Mic & Send Button */}
            <div className="flex items-center gap-1.5">
              {/* Mic Speech-to-Text */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2 rounded-xl transition active:scale-95 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                    : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title={isListening ? 'Dinlemeyi Durdur' : 'Sesle Yazdır (Mikrofon)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Submit button */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!text.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2 sm:px-3 sm:py-2 rounded-xl font-medium text-xs transition active:scale-95 flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
                title="Gönder"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Gönder</span>
              </button>
            </div>
          </div>
        </div>

        {/* Small footer reassurance */}
        <p className="text-[11px] text-center text-slate-400">
          Tak-Çalıştır Türkçe Asistan • Kişisel veri veya kart gerekmez • Yapay zekâ hata yapabilir.
        </p>
      </div>
    </footer>
  );
};
