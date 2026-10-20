import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Music,
  Sliders,
  Radio,
  FileText
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine.ts';

const SAMPLE_SCRIPTS = [
  {
    title: '🎙️ Profesyonel Belgesel / Haber',
    text: 'Evrenin derinliklerinde, milyarlarca ışık yılı uzakta parlayan yıldızlar, zamanın ve maddenin en saf halini bizlere fısıldıyor.',
  },
  {
    title: '✨ İlham & Motivasyon',
    text: 'Bugün attığın küçük bir adım, yarın ulaşacağın büyük zirvenin başlangıcıdır. Kendine ve potansiyeline güvenmekten asla vazgeçme.',
  },
  {
    title: '📖 Masal & Hikaye Anlatımı',
    text: 'Bir varmış, bir yokmuş. Masmavi gökyüzünün altında, bulutların arasında gizlenmiş efsanevi bir krallık yaşarmış.',
  },
  {
    title: '☕ Sıcak & Samimi Selamlama',
    text: 'Merhabalar! Umarım gününüz huzurlu ve keyifli geçiyordur. Sizinle sohbet etmek ve projelerinize eşlik etmek benim için bir zevk.',
  },
];

export const VoiceStudio: React.FC = () => {
  const [text, setText] = useState(SAMPLE_SCRIPTS[0].text);
  const [selectedVoice, setSelectedVoice] = useState<'kadin' | 'erkek' | 'spiker'>('kadin');
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Dictation (Speech to text)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Background Ambient Sound
  const [activeMusic, setActiveMusic] = useState<string>('sessiz');

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
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

        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech rec error:', e);
      }
    }

    return () => {
      audioEngine.stopAllMusic();
      audioEngine.stopVoiceover();
    };
  }, []);

  const handleSpeak = () => {
    if (!text.trim()) return;

    if (isSpeaking) {
      audioEngine.stopVoiceover();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    audioEngine.speakVoiceover(
      text,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      selectedVoice
    );
  };

  const handleStop = () => {
    audioEngine.stopVoiceover();
    setIsSpeaking(false);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Tarayıcınız sesli yazdırmayı desteklemiyor. Lütfen Chrome, Edge veya Safari kullanınız.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleToggleMusic = (musicKey: string) => {
    if (activeMusic === musicKey) {
      audioEngine.stopAllMusic();
      setActiveMusic('sessiz');
    } else {
      setActiveMusic(musicKey);
      audioEngine.playAmbientMusic(musicKey, 0.25);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-3 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-5 sm:p-8 text-white shadow-lg shadow-teal-500/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/20 mb-3">
            <Radio className="w-3.5 h-3.5 text-emerald-200" />
            <span>Türkçe Ses & Müzik Tasarımı Stüdyosu</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Metinlerinizi Doğal Türkçe Sese ve Müziğe Dönüştürün
          </h2>
          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
            Kadın, erkek ve spiker tonlarında seslendirme yapın, arka plan ambiyans melodileri ekleyin veya mikrofonunuzla sesli dikte yapın.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
          <Volume2 className="w-56 h-56" />
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Script Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Seslendirilecek Metin
              </label>

              {/* Mic Dictation Button */}
              <button
                onClick={toggleListening}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition active:scale-95 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-md'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                }`}
                title="Mikrofon ile konuşarak yazdır"
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isListening ? 'Dinleniyor (Durdur)' : '🎤 Sesle Yazdır'}</span>
              </button>
            </div>

            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Buraya seslendirmek istediğiniz Türkçe metni yazın veya hazır örneklerden birini seçin..."
              className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm text-slate-800 placeholder-slate-400 transition leading-relaxed"
            />

            {/* Quick Sample Scripts */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                Hazır Örnek Metinler:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_SCRIPTS.map((script, idx) => (
                  <button
                    key={idx}
                    onClick={() => setText(script.text)}
                    className="p-2 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-left transition text-xs text-slate-700 active:scale-95"
                  >
                    <div className="font-semibold text-slate-900 mb-0.5">{script.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{script.text}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Voice & Sound Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Ses Karakteri & Ayarlar
            </h3>

            {/* Voice Style Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                Seslendirici Karakteri
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'kadin', label: 'Doğal Kadın', icon: '👩' },
                  { id: 'erkek', label: 'Derin Erkek', icon: '👨' },
                  { id: 'spiker', label: 'Haber Spikeri', icon: '🎙️' },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition active:scale-95 ${
                      selectedVoice === v.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xl block mb-1">{v.icon}</span>
                    <span className="text-xs leading-tight">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Waveform Animation when playing */}
            {isSpeaking && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-center gap-1">
                {[12, 28, 16, 32, 24, 40, 18, 30, 14, 26, 38, 20].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-emerald-600 rounded-full animate-pulse"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                ))}
                <span className="text-xs font-semibold text-emerald-800 ml-2">Seslendiriliyor...</span>
              </div>
            )}

            {/* Playback action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSpeak}
                disabled={!text.trim()}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Durdur</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Metni Seslendir</span>
                  </>
                )}
              </button>

              {isSpeaking && (
                <button
                  onClick={handleStop}
                  className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95"
                  title="Tamamen Durdur"
                >
                  <Square className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Ambient Background Music Generator */}
            <div className="pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-indigo-600" />
                Arka Plan Ambiyans Müziği
              </label>

              <div className="space-y-1.5">
                {[
                  { id: 'sinematik', label: '🎻 Epik Sinematik Melodi' },
                  { id: 'doga_sakin', label: '🌊 Sakin Okyanus & Rüzgar' },
                  { id: 'futuristik', label: '🚀 Siberpunk Synth Ritim' },
                  { id: 'felsefi_derin', label: '🧘 Felsefi Derin Drone' },
                ].map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handleToggleMusic(track.id)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition active:scale-98 ${
                      activeMusic === track.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{track.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-white border border-slate-200">
                      {activeMusic === track.id ? 'Çalıyor ⏸️' : 'Başlat ▶️'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
