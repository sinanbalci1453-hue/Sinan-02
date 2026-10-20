import React, { useState } from 'react';
import {
  Database,
  HardDrive,
  Download,
  Upload,
  Trash2,
  Image as ImageIcon,
  Film,
  Share2,
  CheckCircle2,
  FolderArchive,
  Search,
  Sparkles
} from 'lucide-react';
import { GeneratedPhoto, GeneratedVideo } from '../types.ts';

interface MediaVaultProps {
  photos: GeneratedPhoto[];
  videos: GeneratedVideo[];
  onDeletePhoto: (id: string) => void;
  onDeleteVideo: (id: string) => void;
  onClearAll: () => void;
  onRestoreBackup: (data: any) => void;
  onUploadPhoto: (photo: GeneratedPhoto) => void;
}

export const MediaVault: React.FC<MediaVaultProps> = ({
  photos,
  videos,
  onDeletePhoto,
  onDeleteVideo,
  onClearAll,
  onRestoreBackup,
  onUploadPhoto,
}) => {
  const [filter, setFilter] = useState<'all' | 'photos' | 'videos'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const totalItems = photos.length + videos.length;
  // Estimated size simulation
  const estimatedMB = (photos.length * 2.4 + videos.length * 8.5).toFixed(1);

  const handleExportAll = () => {
    const backupData = {
      appName: 'Benim Yapay Zekâm',
      exportDate: new Date().toISOString(),
      photos,
      videos,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benim-yapay-zekam-medya-yedek-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onRestoreBackup(parsed);
        alert('Yedek başarıyla geri yüklendi!');
      } catch {
        alert('Geçersiz yedek dosyası.');
      }
    };
    reader.readAsText(file);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newPhoto: GeneratedPhoto = {
        id: `photo-${Date.now()}`,
        prompt: file.name,
        url: event.target?.result as string,
        style: 'Manuel Yükleme',
        aspectRatio: '1:1',
        width: 1024,
        height: 1024,
        createdAt: Date.now(),
      };
      onUploadPhoto(newPhoto);
    };
    reader.readAsDataURL(file);
  };

  const filteredPhotos = photos.filter((p) =>
    p.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredVideos = videos.filter((v) =>
    v.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-3 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar">
      {/* Vault Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 mb-3 text-cyan-300">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Yüksek Kapasiteli Bulut Depolama & Medya Kasası</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Tüm Fotoğraf, Video ve Projeleriniz Güvende
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Yüksek hafıza mimarisiyle projeleriniz kaybolmaz. İstediğiniz an tüm arşivi tek tıkla cihazınıza indirebilir veya geri yükleyebilirsiniz.
          </p>

          {/* Storage Capacity Bar */}
          <div className="mt-5 space-y-1.5 max-w-md">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>Kullanılan Alan: ~{estimatedMB} MB</span>
              <span className="text-cyan-400 font-bold">50 GB Genişletilmiş Kapasite</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full"
                style={{ width: `${Math.min(totalItems * 2 + 5, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
          <FolderArchive className="w-64 h-64" />
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kütüphanede ara (örnek: gün batımı, araba...)"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tümü ({totalItems})
          </button>
          <button
            onClick={() => setFilter('photos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'photos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Fotoğraflar ({photos.length})
          </button>
          <button
            onClick={() => setFilter('videos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'videos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Videolar ({videos.length})
          </button>
        </div>

        {/* Backup Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-semibold text-xs transition active:scale-95"
            title="Tüm medya kütüphanesini JSON yedek olarak indir"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tümünü Yedekle</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition active:scale-95 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Yedek Yükle</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
          
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs transition active:scale-95 cursor-pointer">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Fotoğraf Yükle</span>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Grid of Items */}
      <div className="space-y-4">
        {totalItems === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
            <Database className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Deponuzda Henüz Medya Yok</p>
            <p className="text-xs text-slate-400 mt-1">
              Fotoğraf Stüdyosu veya Video Stüdyosu'nda ürettiğiniz tüm içerikler otomatik olarak buraya kaydedilir.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Show Photos if applicable */}
            {(filter === 'all' || filter === 'photos') &&
              filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition group flex flex-col"
                >
                  <div className="relative aspect-square bg-slate-900">
                    <img src={photo.url} alt={photo.prompt} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                      <ImageIcon className="w-2.5 h-2.5 text-blue-400" />
                      4K Foto
                    </span>
                    <button
                      onClick={() => onDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5 text-[11px] text-slate-700 truncate font-medium">
                    {photo.prompt}
                  </div>
                </div>
              ))}

            {/* Show Videos if applicable */}
            {(filter === 'all' || filter === 'videos') &&
              filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition group flex flex-col"
                >
                  <div className="relative aspect-square bg-black">
                    <img src={video.posterUrl} alt={video.prompt} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                      <Film className="w-2.5 h-2.5 text-purple-400" />
                      {video.duration}s Video
                    </span>
                    <button
                      onClick={() => onDeleteVideo(video.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5 text-[11px] text-slate-700 truncate font-medium">
                    {video.prompt}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
