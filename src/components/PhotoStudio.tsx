import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Video,
  Wand2,
  Copy,
  Check,
  Maximize2,
  X,
  RefreshCw,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';
import { GeneratedPhoto, ImageStyle } from '../types.ts';

interface PhotoStudioProps {
  onSendToVideoStudio: (photo: GeneratedPhoto) => void;
}

const STYLE_OPTIONS: { id: ImageStyle; label: string; icon: string; promptSuffix: string }[] = [
  { id: 'gercekci', label: 'Gerçekçi Fotoğraf', icon: '📸', promptSuffix: 'award-winning photography, photorealistic, 8k resolution, detailed texture, natural sunlight' },
  { id: 'sinematik', label: 'Sinematik Film', icon: '🎬', promptSuffix: 'cinematic still, 35mm photograph, anamorphic lens flare, moody color grading, dramatic atmosphere' },
  { id: '3d', label: '3D Render', icon: '🧊', promptSuffix: 'octane render, unreal engine 5, raytracing, 8k 3D digital art, ultra-detailed volumetric lighting' },
  { id: 'siberpunk', label: 'Siberpunk & Neon', icon: '🏙️', promptSuffix: 'cyberpunk aesthetic, neon city lights, futuristic atmosphere, reflections on wet pavement, vivid colors' },
  { id: 'anime', label: 'Anime & Çizim', icon: '✨', promptSuffix: 'high quality anime illustration, Makoto Shinkai style, vibrant colors, stunning sky detail' },
  { id: 'portre', label: 'Stüdyo Portresi', icon: '👤', promptSuffix: 'professional studio portrait, 85mm lens f/1.4, perfect rim lighting, sharp focus on eyes, smooth bokeh' },
  { id: 'yagliboya', label: 'Yağlı Boya Tablo', icon: '🎨', promptSuffix: 'masterpiece oil painting, impasto brush strokes, classical renaissance lighting, rich canvas texture' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Kare (Instagram)', width: 1024, height: 1024, icon: '⏹️' },
  { id: '16:9', label: '16:9 Geniş Ekran (YouTube)', width: 1280, height: 720, icon: '🖥️' },
  { id: '9:16', label: '9:16 Dikey (Reels / TikTok)', width: 720, height: 1280, icon: '📱' },
  { id: '4:3', label: '4:3 Klasik', width: 1024, height: 768, icon: '🖼️' },
];

const INSPIRATION_PROMPTS = [
  'Kapadokya semalarında gün doğumunda yükselen rengarenk sıcak hava balonları, peri bacaları',
  'Geleceğin 2099 yılındaki fütüristik İstanbul Boğazı, uçan arabalar ve siberpunk neon gökdelenler',
  'Karla kaplı çam ormanının ortasında dumanı tüten ahşap sıcak dağ evi, altın sarısı şömine ışığı',
  'Uzay giysisi giymiş sevimli yavru kedi, kaskının vizöründe yansıyan Samanyolu galaksisi',
  'Yağmurlu bir sonbahar akşamında loş sokak lambasının altındaki eski antika kitapçı',
  'Kusursuz dalgaların üzerinde sörf yapan su samuru, tropik turkuaz okyanus, 4K detay',
];

export const PhotoStudio: React.FC<PhotoStudioProps> = ({ onSendToVideoStudio }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('gercekci');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<GeneratedPhoto | null>(null);
  
  // New comparison state
  const [isComparing, setIsComparing] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<GeneratedPhoto[]>([]);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const [photos, setPhotos] = useState<GeneratedPhoto[]>(() => {
    try {
      const saved = localStorage.getItem('benim_studio_photos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const savePhotos = (newList: GeneratedPhoto[]) => {
    setPhotos(newList);
    try {
      localStorage.setItem('benim_studio_photos', JSON.stringify(newList));
    } catch (e) {
      console.warn('Could not save photos to storage:', e);
    }
  };

  // Enhance prompt with AI
  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);

    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style: selectedStyle, type: 'image' }),
      });
      const data = await res.json();
      if (data && data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      }
    } catch (err) {
      console.warn('Enhance error:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Generate Photo
  const handleGenerate = async (overridePrompt?: string) => {
    const activePrompt = overridePrompt || prompt;
    if (!activePrompt.trim() || isGenerating) return;

    setIsGenerating(true);

    try {
      const ratioObj = ASPECT_RATIOS.find((r) => r.id === selectedRatio) || ASPECT_RATIOS[0];
      const styleObj = STYLE_OPTIONS.find((s) => s.id === selectedStyle) || STYLE_OPTIONS[0];

      const fullPromptText = `${activePrompt.trim()}, ${styleObj.promptSuffix}`;
      const seed = Math.floor(Math.random() * 1000000);

      // High-quality Pollinations FLUX/Turbo URL
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPromptText)}?width=${ratioObj.width}&height=${ratioObj.height}&seed=${seed}&nologo=true&enhance=true`;

      // Pre-load image to ensure it is generated and cached
      const img = new Image();
      img.src = imageUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // proceed even on network quirks
      });

      const newPhoto: GeneratedPhoto = {
        id: `photo-${Date.now()}`,
        prompt: activePrompt,
        enhancedPrompt: fullPromptText,
        url: imageUrl,
        style: styleObj.label,
        aspectRatio: selectedRatio,
        width: ratioObj.width,
        height: ratioObj.height,
        createdAt: Date.now(),
      };

      const updated = [newPhoto, ...photos];
      savePhotos(updated);
    } catch (error) {
      console.error('Photo generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (photo: GeneratedPhoto) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `benim-yapay-zekam-foto-${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(photo.url, '_blank');
    }
  };

  const handleCopyPrompt = (p: GeneratedPhoto) => {
    navigator.clipboard.writeText(p.prompt);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-3 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar">
      {/* Studio Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-5 sm:p-8 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Ultra Kaliteli 4K Görsel Stüdyosu</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Hayal Ettiğiniz Her Şeyi Kusursuz Fotoğrafa Dönüştürün
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            Türkçe veya İngilizce tarif edin; yapay zekâ fırçasıyla yüksek çözünürlüklü, gerçekçi ve sanatsal görseller anında üretilsin.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
          <ImageIcon className="w-56 h-56" />
        </div>
      </div>

      {/* Main Creation Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
        {/* Prompt Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              Görsel Tarifiniz (Prompt)
            </label>
            <button
              onClick={handleEnhancePrompt}
              disabled={!prompt.trim() || isEnhancing || isGenerating}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition active:scale-95 disabled:opacity-40"
              title="Yapay zekâ ile promptu detaylandırıp güzelleştir"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
              <span>{isEnhancing ? 'Zenginleştiriliyor...' : '✨ Promptu Zenginleştir'}</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Örnek: Gün batımında deniz kenarında kahve içen bilge yaşlı bir adam, 4K detaylı, altın saat ışığı..."
              className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 placeholder-slate-400 transition leading-relaxed"
            />
          </div>
        </div>

        {/* Style Selection */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            Sanat & Çekim Tarzı
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {STYLE_OPTIONS.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 flex flex-col items-center justify-center text-center gap-1 ${
                  selectedStyle === style.id
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-xl">{style.icon}</span>
                <span className="text-[11px] leading-tight">{style.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio Selection */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
            Boyut & En-Boy Oranı
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => setSelectedRatio(ratio.id)}
                className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 flex items-center gap-2 ${
                  selectedRatio === ratio.id
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-lg">{ratio.icon}</span>
                <div>
                  <div className="text-xs font-medium">{ratio.id}</div>
                  <div className="text-[10px] text-slate-400">{ratio.label.split(' ')[1]}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => handleGenerate()}
            disabled={!prompt.trim() || isGenerating}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Fotoğraf Hazırlanıyor...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Kaliteli Fotoğraf Üret</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prompt Inspiration Chips */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          İlham Verici Hazır Fikirler:
        </h4>
        <div className="flex flex-wrap gap-2">
          {INSPIRATION_PROMPTS.map((insp, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(insp);
                handleGenerate(insp);
              }}
              className="text-xs bg-white border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 px-3 py-1.5 rounded-xl transition active:scale-95 text-left"
            >
              💡 {insp}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Photos Gallery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <span>Üretilen Fotoğraflar Galerisi</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {photos.length}
            </span>
          </h3>
          <div className="flex items-center gap-3">
            {isComparing && (
              <button
                onClick={() => {
                  setSelectedForComparison([]);
                  setIsComparing(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                İptal
              </button>
            )}
            <button
              onClick={() => {
                if (isComparing) {
                   if (selectedForComparison.length < 2) {
                     alert('Karşılaştırma için en az 2 fotoğraf seçmelisiniz.');
                   } else {
                     setShowComparisonModal(true);
                   }
                } else {
                  setIsComparing(true);
                  setSelectedForComparison([]);
                }
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
                isComparing 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isComparing 
                ? `Karşılaştır (${selectedForComparison.length})` 
                : 'Karşılaştırma Modu'}
            </button>
            {photos.length > 0 && !isComparing && (
              <button
                onClick={() => {
                  if (window.confirm('Tüm fotoğraf geçmişini temizlemek istiyor musunuz?')) {
                    savePhotos([]);
                  }
                }}
                className="text-xs text-rose-600 hover:underline font-medium"
              >
                Galeriyi Temizle
              </button>
            )}
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">Henüz bir fotoğraf üretmediniz.</p>
            <p className="text-xs text-slate-400 mt-0.5">Yukarıdaki tarif kutusuna yazıp "Kaliteli Fotoğraf Üret" butonuna basın!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => {
              const isSelected = selectedForComparison.find((p) => p.id === photo.id);
              return (
                <div
                  key={photo.id}
                  onClick={() => {
                    if (isComparing) {
                      if (isSelected) {
                        setSelectedForComparison(selectedForComparison.filter((p) => p.id !== photo.id));
                      } else {
                        setSelectedForComparison([...selectedForComparison, photo]);
                      }
                    }
                  }}
                  className={`bg-white rounded-2xl border ${
                    isSelected ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'
                  } overflow-hidden shadow-xs hover:shadow-md transition-shadow group flex flex-col ${
                    isComparing ? 'cursor-pointer' : ''
                  }`}
                >
                  {/* Image Container */}
                  <div className="relative overflow-hidden bg-slate-900 aspect-square">
                    <img
                      src={photo.url}
                      alt={photo.prompt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {isComparing && (
                      <div className={`absolute top-3 left-3 w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/50 border-white'}`}>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                    )}
                    
                    {!isComparing && (
                      /* Overlay buttons */
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setLightboxPhoto(photo)}
                            className="p-2 rounded-lg bg-white/20 hover:bg-white/40 backdrop-blur-md text-white transition active:scale-95"
                            title="Büyük Boyutta Gör"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleDownload(photo)}
                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition shadow-sm active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>İndir (HD)</span>
                          </button>

                          {/* Convert to Video */}
                          <button
                            onClick={() => onSendToVideoStudio(photo)}
                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transition shadow-sm active:scale-95"
                            title="Bu görseli Video Stüdyosu'nda sinematik videoya dönüştür"
                          >
                            <Video className="w-3.5 h-3.5 text-amber-300" />
                            <span>Videoya Dönüştür</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer details */}
                  <div className="p-3 text-xs flex-1 flex flex-col justify-between">
                    <p className="text-slate-800 line-clamp-2 font-medium mb-2 leading-relaxed">
                      {photo.prompt}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-400 text-[11px]">
                      <span className="font-semibold text-slate-600">{photo.style}</span>
                      <button
                        onClick={() => handleCopyPrompt(photo)}
                        className="flex items-center gap-1 hover:text-slate-700 transition"
                        title="Promptu Kopyala"
                      >
                        {copiedId === photo.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Kopyalandı</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Promptu Al</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-3 sm:p-6 flex flex-col items-center justify-center animate-fadeIn">
          <div className="w-full max-w-6xl flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-bold">Fotoğrafları Karşılaştır</h2>
            <button
              onClick={() => {
                setShowComparisonModal(false);
                setSelectedForComparison([]);
                setIsComparing(false);
                setFavoriteId(null);
              }}
              className="text-white hover:text-slate-300 p-2 rounded-full bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-6xl overflow-y-auto max-h-[70vh] custom-scrollbar p-2">
            {selectedForComparison.map((photo) => (
              <div 
                key={photo.id} 
                className={`rounded-2xl overflow-hidden border-4 cursor-pointer transition ${favoriteId === photo.id ? 'border-amber-400' : 'border-transparent'}`}
                onClick={() => setFavoriteId(photo.id)}
              >
                <img src={photo.url} alt={photo.prompt} className="w-full h-auto" />
                <div className="p-2 bg-slate-900 text-white text-center text-xs font-semibold">
                  {favoriteId === photo.id ? '⭐ Favori' : 'Seç'}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                if (!favoriteId) alert('Lütfen bir favori seçin!');
                else {
                  alert('Favori kaydedildi: ' + favoriteId);
                  setShowComparisonModal(false);
                }
              }}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-2xl transition"
            >
              Favoriyi Onayla
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-2 right-2 sm:-top-10 sm:-right-2 text-white hover:text-slate-300 p-2 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.prompt}
              className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl"
            />
            <div className="mt-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 w-full text-white text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="line-clamp-2 text-slate-300 max-w-xl">{lightboxPhoto.prompt}</p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(lightboxPhoto)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Fotoğrafı İndir</span>
                </button>
                <button
                  onClick={() => {
                    onSendToVideoStudio(lightboxPhoto);
                    setLightboxPhoto(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl font-semibold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Video className="w-4 h-4 text-amber-300" />
                  <span>Videoya Dönüştür</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
