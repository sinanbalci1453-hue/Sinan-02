import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Sparkles,
  Maximize2,
  Minimize2,
  MessageCircle,
  Radio
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine.ts';
import { ragEngine } from '../utils/ragEngine.ts';

interface LiveCallProps {
  onEndCall: () => void;
}

export const LiveCall: React.FC<LiveCallProps> = ({ onEndCall }) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'listening' | 'thinking' | 'speaking'>('listening');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [aiSpeechText, setAiSpeechText] = useState(
    'Merhaba! Seni görmek ve sesini duymak harika. Bugün nasılsın, aklında ne var?'
  );

  const [conversation, setConversation] = useState<Array<{ role: string; content: string }>>([
    { role: 'assistant', content: 'Merhaba! Seni görmek ve sesini duymak harika. Bugün nasılsın?' },
  ]);

  const userVideoRef = useRef<HTMLVideoElement>(null);
  const userStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format call duration MM:SS
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start User Camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: false })
      .then((s) => {
        stream = s;
        userStreamRef.current = s;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        console.warn('Camera access denied or unavailable:', err);
        setIsCameraOn(false);
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Initial welcome greeting speech
  useEffect(() => {
    speakAiTurn('Merhaba! Seni görmek ve sesini duymak harika. Bugün nasılsın, neler yapıyorsun?');
  }, []);

  // Continuous speech recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'tr-TR';

        recognition.onresult = (e: any) => {
          if (isSpeakingRef.current) return; // don't listen to AI's own voice

          let interim = '';
          let finalTranscript = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) {
              finalTranscript += e.results[i][0].transcript;
            } else {
              interim += e.results[i][0].transcript;
            }
          }

          if (interim) {
            setLiveTranscript(interim);
          }

          if (finalTranscript.trim()) {
            setLiveTranscript('');
            handleUserSpoke(finalTranscript.trim());
          }
        };

        recognition.onend = () => {
          if (isMicOn && !isSpeakingRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('Speech rec error in live call:', err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      audioEngine.stopVoiceover();
    };
  }, [isMicOn]);

  const speakAiTurn = (textToSpeak: string) => {
    setCallStatus('speaking');
    isSpeakingRef.current = true;
    setAiSpeechText(textToSpeak);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    audioEngine.speakVoiceover(
      textToSpeak,
      () => {
        setCallStatus('speaking');
        isSpeakingRef.current = true;
      },
      () => {
        setCallStatus('listening');
        isSpeakingRef.current = false;
        if (isMicOn && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {}
        }
      },
      'kadin'
    );
  };

  const handleUserSpoke = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    setCallStatus('thinking');
    const updatedConv = [...conversation, { role: 'user', content: spokenText }];
    setConversation(updatedConv);

    try {
      const res = await fetch('/api/live-call-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSpeech: spokenText,
          conversationHistory: updatedConv.slice(-6),
        }),
      });
      const data = await res.json();
      const reply = data.reply || 'Seni çok iyi anlıyorum, harika bir bakış açısı!';
      setConversation([...updatedConv, { role: 'assistant', content: reply }]);
      speakAiTurn(reply);
    } catch {
      speakAiTurn('Seni net bir şekilde duyuyorum! Devam et, seni dinliyorum.');
    }
  };

  const toggleMic = () => {
    if (isMicOn) {
      setIsMicOn(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    } else {
      setIsMicOn(true);
      if (recognitionRef.current && !isSpeakingRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    }
  };

  const toggleCamera = () => {
    if (userStreamRef.current) {
      userStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOn;
      });
      setIsCameraOn(!isCameraOn);
    }
  };

  const summarizeConversation = async (conv: Array<{ role: string; content: string }>) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Lütfen bu canlı görüşme dökümünü kısa, özlü ve maddeler halinde özetle. Görüşmenin ana hatlarını ve belirlenen eylem adımlarını çıkar.' },
            ...conv.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
          ],
          tone: 'kisa',
          enableSearch: false,
        }),
      });
      const data = await res.json();
      return data.reply || 'Görüşme özeti alınamadı.';
    } catch {
      return 'Canlı görüşme özeti.';
    }
  };

  const endCall = async () => {
    const callSummary = await summarizeConversation(conversation);
    ragEngine.addCustomMemory(`Canlı Görüşme Özeti: ${callSummary}`, 'interaction');
    
    audioEngine.stopVoiceover();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    onEndCall();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-hidden animate-fadeIn">
      {/* Top Header / Call info */}
      <div className="px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                Benim Yapay Zekâm
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                Canlı Görüntülü Arama
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono">{formatDuration(callDuration)}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold">
          {callStatus === 'speaking' && (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span className="text-blue-300">Konuşuyor</span>
            </>
          )}
          {callStatus === 'thinking' && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin"></span>
              <span className="text-amber-300">Düşünüyor...</span>
            </>
          )}
          {callStatus === 'listening' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-300">Sizi Dinliyor</span>
            </>
          )}
        </div>
      </div>

      {/* Main Avatar Stage */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
        {/* Ambient Glow */}
        <div
          className={`absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full blur-3xl opacity-30 transition-all duration-700 pointer-events-none ${
            callStatus === 'speaking'
              ? 'bg-blue-600 scale-110'
              : callStatus === 'thinking'
              ? 'bg-amber-600 scale-95'
              : 'bg-emerald-600 scale-100'
          }`}
        />

        {/* 3D Animated AI Companion Avatar */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Avatar Face Frame */}
          <div
            className={`relative w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 shadow-2xl overflow-hidden transition-all duration-500 flex items-center justify-center ${
              callStatus === 'speaking'
                ? 'border-blue-400 shadow-blue-500/50 scale-105'
                : callStatus === 'thinking'
                ? 'border-amber-400 shadow-amber-500/40'
                : 'border-emerald-400/80 shadow-emerald-500/30'
            }`}
          >
            {/* Photorealistic stylized avatar portrait */}
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
              alt="Yapay Zekâ Canlı Portre"
              className={`w-full h-full object-cover transition-transform duration-700 ${
                callStatus === 'speaking' ? 'scale-108' : 'scale-100'
              }`}
            />

            {/* Speaking lip-sync animation overlay */}
            {callStatus === 'speaking' && (
              <div className="absolute inset-0 bg-blue-500/10 pointer-events-none flex items-end justify-center pb-8">
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-blue-400/50">
                  {[10, 24, 16, 28, 14, 26, 12].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-blue-400 rounded-full animate-pulse"
                      style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Live Subtitle Speech Bubble */}
          <div className="mt-5 max-w-xl w-full text-center px-4">
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 shadow-xl">
              <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
                "{aiSpeechText}"
              </p>
            </div>

            {/* User live dictation preview */}
            {liveTranscript && (
              <div className="mt-2 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 rounded-xl px-3 py-1.5 inline-block animate-pulse">
                Siz konuşuyorsunuz: "{liveTranscript}"
              </div>
            )}
          </div>
        </div>

        {/* User Camera Picture-in-Picture (PIP) Window */}
        <div className="absolute bottom-24 right-4 sm:bottom-28 sm:right-8 w-28 sm:w-40 aspect-3/4 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-slate-900 z-30 transition-all hover:scale-105">
          {isCameraOn ? (
            <video
              ref={userVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-xs">
              <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
              <span>Kamera Kapalı</span>
            </div>
          )}
          <span className="absolute bottom-1.5 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
            Siz
          </span>
        </div>
      </div>

      {/* Suggested Quick Talking Points */}
      <div className="px-4 pb-2 flex items-center justify-center gap-2 overflow-x-auto custom-scrollbar z-20">
        {[
          'Bugün çok yoğun geçti, biraz dertleşelim.',
          'Bana 3 dakikalık motive edici bir konuşma yap!',
          'Sosyal medya için yeni bir video fikri bulalım.',
          'Geleceğin teknolojileri hakkında ne düşünüyorsun?',
        ].map((topic, idx) => (
          <button
            key={idx}
            onClick={() => handleUserSpoke(topic)}
            className="text-xs bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-full text-slate-200 shrink-0 transition active:scale-95"
          >
            💬 {topic}
          </button>
        ))}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="p-4 bg-gradient-to-t from-black via-black/70 to-transparent flex items-center justify-center gap-4 z-20">
        {/* Toggle Mic */}
        <button
          onClick={toggleMic}
          className={`p-3.5 sm:p-4 rounded-full transition active:scale-95 shadow-lg ${
            isMicOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              : 'bg-rose-600 text-white animate-pulse'
          }`}
          title={isMicOn ? 'Mikrofonu Kapat' : 'Mikrofonu Aç'}
        >
          {isMicOn ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        {/* Toggle Camera */}
        <button
          onClick={toggleCamera}
          className={`p-3.5 sm:p-4 rounded-full transition active:scale-95 shadow-lg ${
            isCameraOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              : 'bg-slate-700 text-slate-400'
          }`}
          title={isCameraOn ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
        >
          {isCameraOn ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={endCall}
          className="p-3.5 sm:p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition active:scale-95 shadow-xl shadow-rose-600/30 flex items-center gap-2 px-6 font-bold text-sm"
        >
          <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>Görüşmeyi Bitir ve Özetle</span>
        </button>
      </div>
    </div>
  );
};


