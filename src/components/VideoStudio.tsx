import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Play,
  Pause,
  Download,
  Volume2,
  VolumeX,
  Sparkles,
  Wand2,
  Mic,
  RotateCcw,
  Film,
  Camera,
  Music,
  Check,
  Maximize2,
  Layers,
  Clock
} from 'lucide-react';
import { GeneratedPhoto, GeneratedVideo, VideoMotionStyle, MusicType } from '../types.ts';
import { renderMultiSceneVideo } from '../utils/videoRenderer.ts';
import { audioEngine } from '../utils/audioEngine.ts';

interface VideoStudioProps {
  initialPhoto?: GeneratedPhoto | null;
  onClearInitialPhoto?: () => void;
  onVideoCreated?: (video: GeneratedVideo) => void;
}

const MOTION_STYLES: { id: VideoMotionStyle; label: string; desc: string; icon: string }[] = [
  { id: 'drone', label: '4K Drone Uçuşu', desc: 'Geniş açıdan akıcı ileri süzülüş', icon: '🚁' },
  { id: 'sinematik_zoom', label: 'Sinematik Odak & Zoom', desc: 'Derin odak ve merkez yaklaşımı', icon: '🎬' },
  { id: 'kaydirma', label: 'Yatay Takip Çekimi', desc: 'Soldan sağa panoramik kaydırma', icon: '↔️' },
  { id: 'yavas_cekim', label: 'Rüya Gibi Yavaş Çekim', desc: 'Işık hüzmeleri ve süzülen parçacıklar', icon: '⏳' },
  { id: 'aksiyon', label: 'Dinamik Aksiyon', desc: 'Hızlı ve canlı kamera ritmi', icon: '⚡' },
  { id: 'timelapse', label: 'Zaman Atlamalı (Timelapse)', desc: 'Hızlı atmosferik değişim', icon: '🌅' },
];

const MUSIC_OPTIONS: { id: MusicType; label: string; desc: string; icon: string }[] = [
  { id: 'sinematik', label: 'Epik Sinematik Müzik', desc: 'Görkemli sinema filmi padleri ve akorlar', icon: '🎻' },
  { id: 'felsefi_derin', label: 'Felsefi & Derin Melodi', desc: 'Meditatif, derin atmosferik sesler', icon: '🧘' },
  { id: 'doga_sakin', label: 'Sakin Doğa & Dalgalar', desc: 'Huzurlu organik okyanus ve rüzgar', icon: '🌊' },
  { id: 'futuristik', label: 'Siberpunk & Fütüristik Ritim', desc: 'Elektronik synth bas ve ritim', icon: '🚀' },
  { id: 'sessiz', label: 'Müziksiz (Sadece Seslendirme)', desc: 'Arka plan müziği olmadan', icon: '🔇' },
];

export const VideoStudio: React.FC<VideoStudioProps> = ({
  initialPhoto,
  onClearInitialPhoto,
  onVideoCreated,
}) => {
  const [prompt, setPrompt] = useState(initialPhoto ? initialPhoto.prompt : '');
  const [selectedPhoto, setSelectedPhoto] = useState<GeneratedPhoto | null>(initialPhoto || null);
  const [motionStyle, setMotionStyle] = useState<VideoMotionStyle>('drone');
  const [musicType, setMusicType] = useState<MusicType>('sinematik');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(15); // Default to long 15s

  // Audio voiceover
  const [enableVoiceover, setEnableVoiceover] = useState(true);
  const [voiceoverText, setVoiceoverText] = useState('');
  const [voiceStyle, setVoiceStyle] = useState<'kadin' | 'erkek' | 'spiker'>('kadin');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Multi-scene Storyboard toggle
  const [isMultiScene, setIsMultiScene] = useState(true);

  // Video generation state
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [currentSceneNum, setCurrentSceneNum] = useState(1);
  const [statusMessage, setStatusMessage] = useState('');

  // Video playback
  const [activeVideo, setActiveVideo] = useState<GeneratedVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  const [videos, setVideos] = useState<GeneratedVideo[]>(() => {
    try {
      const saved = localStorage.getItem('benim_studio_videos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (initialPhoto) {
      setSelectedPhoto(initialPhoto);
      setPrompt(initialPhoto.prompt);
    }
  }, [initialPhoto]);

  const saveVideos = (list: GeneratedVideo[]) => {
    setVideos(list);
    try {
      localStorage.setItem('benim_studio_videos', JSON.stringify(list));
    } catch (e) {
      console.warn('Could not save videos:', e);
    }
  };

  // Auto-generate video voiceover script & storyboard
  const handleGenerateScript = async () => {
    const activePrompt = prompt || selectedPhoto?.prompt || 'Geleceğin dünyası';
    setIsGeneratingScript(true);
    try {
      const res = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: activePrompt, duration }),
      });
      const data = await res.json();
      if (data && data.fullVoiceover) {
        setVoiceoverText(data.fullVoiceover);
        setEnableVoiceover(true);
      }
    } catch (e) {
      console.warn('Script generation failed:', e);
      setVoiceoverText('Bu büyüleyici sahnede doğanın ve zamanın eşsiz uyumuna tanıklık ediyorsunuz.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Video generation pipeline with multi-scene support
  const handleCreateVideo = async () => {
    const activePrompt = prompt.trim() || selectedPhoto?.prompt || 'Görkemli sinematik manzara';
    setIsRendering(true);
    setRenderProgress(0);
    setCurrentSceneNum(1);
    setStatusMessage('1/3: Sahne kurgusu ve storyboard hazırlanıyor...');

    try {
      let width = 1280;
      let height = 720;
      if (aspectRatio === '9:16') {
        width = 720;
        height = 1280;
      } else if (aspectRatio === '1:1') {
        width = 1080;
        height = 1080;
      }

      // Generate scenes
      const scenesToRender: Array<{
        imageUrl: string;
        captionText: string;
        motionStyle: VideoMotionStyle;
        durationSeconds: number;
      }> = [];

      if (isMultiScene && duration >= 15) {
        // Multi-scene 3-part storyboard
        const sceneDuration = duration / 3;
        const seed1 = Math.floor(Math.random() * 100000);
        const seed2 = seed1 + 10;
        const seed3 = seed1 + 20;

        const img1 = selectedPhoto?.url || `https://image.pollinations.ai/prompt/${encodeURIComponent(activePrompt + ', epic cinematic establishing shot, 8k, photorealistic')}?width=${width}&height=${height}&seed=${seed1}&nologo=true`;
        const img2 = `https://image.pollinations.ai/prompt/${encodeURIComponent(activePrompt + ', dynamic cinematic middle shot, detailed lighting, masterpiece')}?width=${width}&height=${height}&seed=${seed2}&nologo=true`;
        const img3 = `https://image.pollinations.ai/prompt/${encodeURIComponent(activePrompt + ', glorious climax vista, sunset volumetric atmosphere')}?width=${width}&height=${height}&seed=${seed3}&nologo=true`;

        scenesToRender.push(
          {
            imageUrl: img1,
            captionText: `${activePrompt.slice(0, 38)}...`,
            motionStyle: 'drone',
            durationSeconds: sceneDuration,
          },
          {
            imageUrl: img2,
            captionText: 'Büyüleyici Bir Dünya Başlıyor ✨',
            motionStyle: 'sinematik_zoom',
            durationSeconds: sceneDuration,
          },
          {
            imageUrl: img3,
            captionText: 'Takip Etmeyi ve Paylaşmayı Unutmayın! 🚀',
            motionStyle: 'yavas_cekim',
            durationSeconds: sceneDuration,
          }
        );
      } else {
        // Single scene
        const seed = Math.floor(Math.random() * 100000);
        const imgUrl = selectedPhoto?.url || `https://image.pollinations.ai/prompt/${encodeURIComponent(activePrompt + ', cinematic 8k film still, professional cinematography, photorealistic, anamorphic lens, breathtaking lighting')}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

        scenesToRender.push({
          imageUrl: imgUrl,
          captionText: activePrompt.slice(0, 42),
          motionStyle,
          durationSeconds: duration,
        });
      }

      setStatusMessage('2/3: Yüksek çözünürlüklü kareler ve altyazılar işleniyor...');

      const generatedVideoBlobUrl = await renderMultiSceneVideo({
        scenes: scenesToRender,
        aspectRatio,
        onProgress: (p, sceneIdx) => {
          setRenderProgress(p);
          setCurrentSceneNum(sceneIdx);
        },
      });

      setStatusMessage('3/3: Ses tasarımı ve seslendirme senkronize ediliyor...');

      const newVideo: GeneratedVideo = {
        id: `vid-${Date.now()}`,
        prompt: activePrompt,
        videoUrl: generatedVideoBlobUrl,
        posterUrl: scenesToRender[0].imageUrl,
        voiceoverText: enableVoiceover ? voiceoverText : undefined,
        musicType,
        duration,
        aspectRatio,
        scenesCount: scenesToRender.length,
        createdAt: Date.now(),
      };

      const updated = [newVideo, ...videos];
      saveVideos(updated);
      setActiveVideo(newVideo);
      if (onVideoCreated) onVideoCreated(newVideo);
      setStatusMessage('Video başarıyla tamamlandı!');
    } catch (err) {
      console.error('Video creation failed:', err);
      alert('Video oluşturulurken bir aksaklık oldu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsRendering(false);
    }
  };

  // Play/Pause Video & Synchronized Audio
  const togglePlay = () => {
    if (!videoPlayerRef.current || !activeVideo) return;

    if (isPlaying) {
      videoPlayerRef.current.pause();
      audioEngine.stopAllMusic();
      audioEngine.stopVoiceover();
      setIsPlaying(false);
    } else {
      videoPlayerRef.current.play().then(() => {
        setIsPlaying(true);

        if (!isMuted) {
          if (activeVideo.musicType && activeVideo.musicType !== 'sessiz') {
            audioEngine.playAmbientMusic(activeVideo.musicType, 0.25);
          }
          if (activeVideo.voiceoverText) {
            audioEngine.speakVoiceover(
              activeVideo.voiceoverText,
              undefined,
              undefined,
              voiceStyle
            );
          }
        }
      });
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    audioEngine.stopAllMusic();
    audioEngine.stopVoiceover();
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (isPlaying && activeVideo?.musicType) {
        audioEngine.playAmbientMusic(activeVideo.musicType, 0.25);
      }
    } else {
      setIsMuted(true);
      audioEngine.stopAllMusic();
      audioEngine.stopVoiceover();
    }
  };

  const handleDownloadVideo = (v: GeneratedVideo) => {
    const a = document.createElement('a');
    a.href = v.videoUrl;
    a.download = `benim-yapay-zekam-uzun-video-${v.id}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-3 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar">
      {/* Studio Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-600 rounded-3xl p-5 sm:p-8 text-white shadow-lg shadow-purple-500/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/20 mb-3">
            <Film className="w-3.5 h-3.5 text-amber-300" />
            <span>Uzun Süreli Sinematik Video & Reels Stüdyosu</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight mb-2">
            15-60 Saniyelik Çok Sahneli Videolar ve Ses Üretimi
          </h2>
          <p className="text-xs sm:text-sm text-purple-100 leading-relaxed">
            Otomatik sahne geçişleri, altyazı şeritleri, Türkçe seslendirme ve arka plan sinematik müziği ile YouTube Shorts, Instagram Reels ve TikTok için tam hazır videolar oluşturun.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
          <Video className="w-56 h-56" />
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Selected Photo Card if coming from Photo Studio */}
          {selectedPhoto && (
            <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedPhoto.url}
                  alt="Seçili Görsel"
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-indigo-300 shadow-xs"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                    Başlangıç Karesi Seçildi
                  </span>
                  <p className="text-xs text-slate-800 font-medium truncate">
                    {selectedPhoto.prompt}
                  </p>
                  <p className="text-[11px] text-slate-500">Bu görsel sinematik videoya hareketlendirilecek</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedPhoto(null);
                  if (onClearInitialPhoto) onClearInitialPhoto();
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-100 transition shrink-0"
              >
                Kaldır
              </button>
            </div>
          )}

          {/* Prompt Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-purple-600" />
                Video Sahnesi & Hikaye Konusu
              </label>
              <button
                onClick={handleGenerateScript}
                disabled={isGeneratingScript || isRendering}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition active:scale-95 disabled:opacity-40"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isGeneratingScript ? 'animate-spin' : ''}`} />
                <span>{isGeneratingScript ? 'Kurgulanıyor...' : '✨ Otomatik Storyboard & Ses'}</span>
              </button>
            </div>

            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Örnek: Antik Roma gladyatör arenası, gün batımı ışıkları, toz bulutları ve kalabalığın tezahüratı..."
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm text-slate-800 placeholder-slate-400 transition leading-relaxed"
            />

            {/* Video Duration Selector (Longer durations) */}
            <div className="pt-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  Video Süresi (Uzun Süreli Mod)
                </span>
                <span className="text-purple-600 font-extrabold">{duration} Saniye</span>
              </label>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { sec: 10, label: '10s (Kısa)' },
                  { sec: 15, label: '15s (Reels)' },
                  { sec: 30, label: '30s (Hikaye)' },
                  { sec: 60, label: '60s (Tam Kurgu)' },
                ].map((item) => (
                  <button
                    key={item.sec}
                    type="button"
                    onClick={() => setDuration(item.sec)}
                    className={`py-2 px-1 rounded-xl border text-center transition active:scale-95 text-xs font-bold ${
                      duration === item.sec
                        ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-scene checkbox */}
            <div className="flex items-center justify-between bg-purple-50/60 p-3 rounded-xl border border-purple-200/70">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="text-xs font-bold text-purple-950">Çok Sahneli Kurgu & Altyazı Şeridi</div>
                  <div className="text-[10px] text-purple-700">Giriş, gelişme ve kapanış sahneleri otomatik bağlanır</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isMultiScene}
                onChange={(e) => setIsMultiScene(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
              />
            </div>

            {/* Aspect Ratio */}
            <div className="pt-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                En-Boy Oranı
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '16:9', label: '16:9 Yatay (YouTube/TV)' },
                  { id: '9:16', label: '9:16 Dikey (Reels/TikTok)' },
                  { id: '1:1', label: '1:1 Kare (Instagram Post)' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAspectRatio(r.id)}
                    className={`p-2 rounded-xl border text-xs font-semibold transition ${
                      aspectRatio === r.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audio & Voiceover Card ("Ses Ekle") */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-4 h-4 text-indigo-600" />
                Ses & Müzik Ayarları ("Ses Ekle")
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableVoice"
                  checked={enableVoiceover}
                  onChange={(e) => setEnableVoiceover(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="enableVoice" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Türkçe Seslendirme Ekle
                </label>
              </div>
            </div>

            {enableVoiceover && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5 text-purple-600" />
                    Seslendirme Metni (Voiceover Script):
                  </span>
                  <div className="flex items-center gap-1">
                    {['kadin', 'erkek', 'spiker'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setVoiceStyle(s as any)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                          voiceStyle === s ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={voiceoverText}
                  onChange={(e) => setVoiceoverText(e.target.value)}
                  placeholder="Videoda konuşulacak Türkçe seslendirme metni..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 bg-white outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>
            )}

            {/* Background Music Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                Arka Plan Sinematik Müziği
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MUSIC_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMusicType(m.id);
                      audioEngine.playAmbientMusic(m.id, 0.2);
                      setTimeout(() => audioEngine.stopAllMusic(), 2000);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all active:scale-95 flex items-center gap-2 ${
                      musicType === m.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-lg shrink-0">{m.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium">{m.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Create Video Button */}
            <div className="pt-2">
              <button
                onClick={handleCreateVideo}
                disabled={isRendering || (!prompt.trim() && !selectedPhoto)}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRendering ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>
                      Video İşleniyor ({renderProgress}%) • Sahne {currentSceneNum}...
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{duration}s Kaliteli Video ve Sesi Oluştur</span>
                  </>
                )}
              </button>

              {/* Progress message */}
              {isRendering && (
                <div className="mt-3 space-y-1.5">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-center text-slate-500 font-medium">
                    {statusMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-purple-600" />
                  Video Oynatıcı & Canlı Önizleme
                </h3>
                {activeVideo && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Hazır ({activeVideo.duration}s)
                  </span>
                )}
              </div>

              {activeVideo ? (
                <div className="space-y-3">
                  {/* Video Box */}
                  <div className="relative rounded-2xl overflow-hidden bg-black shadow-md aspect-video sm:aspect-auto sm:h-64 flex items-center justify-center">
                    <video
                      ref={videoPlayerRef}
                      src={activeVideo.videoUrl}
                      poster={activeVideo.posterUrl}
                      onEnded={handleVideoEnded}
                      loop={false}
                      playsInline
                      className="w-full h-full object-contain"
                    />

                    {!isPlaying && (
                      <button
                        onClick={togglePlay}
                        className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/50 text-white flex items-center justify-center shadow-lg transition active:scale-95"
                      >
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      </button>
                    )}
                  </div>

                  {/* Player Controls Bar */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlay}
                        className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition active:scale-95"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                      </button>

                      <button
                        onClick={toggleMute}
                        className={`p-2 rounded-lg border transition ${
                          isMuted
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                        title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      onClick={() => handleDownloadVideo(activeVideo)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold text-xs transition active:scale-95 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Videoyu İndir</span>
                    </button>
                  </div>

                  {activeVideo.voiceoverText && (
                    <div className="bg-purple-50/60 border border-purple-200/60 rounded-xl p-3 text-xs text-purple-950">
                      <span className="font-bold block mb-1 flex items-center gap-1">
                        <Mic className="w-3.5 h-3.5 text-purple-600" />
                        Senkronize Türkçe Seslendirme:
                      </span>
                      <p className="italic leading-relaxed">{activeVideo.voiceoverText}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 bg-slate-50/50">
                  <Film className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Önizleme Bekleniyor</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Süreyi (15s, 30s) ve konuyu seçip "Kaliteli Video ve Sesi Oluştur" butonuna bastığınızda videonuz burada canlanacaktır.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
              <p>💡 <strong>İpucu:</strong> Videonuz doğrudan 'Medya Kasası' deposuna kaydedilir ve asla kaybolmaz.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
