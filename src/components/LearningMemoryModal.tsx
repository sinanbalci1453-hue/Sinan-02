import React, { useState, useMemo } from 'react';
import {
  Brain,
  X,
  Sparkles,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Lightbulb,
  Zap,
  RotateCcw,
  Tag,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  Download,
  Copy,
  Check,
  Edit2,
  Save,
  ArrowUpDown
} from 'lucide-react';
import { MemoryItem, MemoryCategory } from '../types.ts';
import { ragEngine } from '../utils/ragEngine.ts';

interface LearningMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onUpdateMemories: (updated: MemoryItem[]) => void;
  autoLearningEnabled: boolean;
  onToggleAutoLearning: (enabled: boolean) => void;
}

export const LearningMemoryModal: React.FC<LearningMemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onUpdateMemories,
  autoLearningEnabled,
  onToggleAutoLearning,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'auto_learned' | 'user_defined'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recalls' | 'newest' | 'oldest' | 'alphabetical'>('recalls');

  // Form states
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('preference');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Toast feedback & copied tracker
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live RAG Simulator Query
  const [testQuery, setTestQuery] = useState('Instagram sayfam için ürün tanıtımı ve kargo süreci nasıl olmalı?');

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const newItem = ragEngine.addCustomMemory(newContent.trim(), newCategory);
    onUpdateMemories([newItem, ...memories]);
    setNewContent('');
    setIsAdding(false);
    showToast('✓ Yeni bilgi başarıyla belleğe kaydedildi!');
  };

  const handleSaveEdit = (id: string) => {
    if (!editingText.trim()) return;
    const updated = memories.map((m) =>
      m.id === id ? { ...m, content: editingText.trim() } : m
    );
    onUpdateMemories(updated);
    ragEngine.saveMemories(updated);
    setEditingId(null);
    showToast('✓ Anı güncellendi.');
  };

  const handleDelete = (id: string) => {
    const updated = ragEngine.deleteMemory(id);
    onUpdateMemories(updated);
    showToast('Bilgi bellekten silindi.');
  };

  const handleResetDefaults = () => {
    if (window.confirm('Öğrenen belleği başlangıç ayarlarına sıfırlamak istiyor musunuz?')) {
      const defaults = ragEngine.resetToDefaults();
      onUpdateMemories(defaults);
      showToast('Bellek varsayılanlara sıfırlandı.');
    }
  };

  const handleExportMemories = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(memories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `benim_ai_ogrenen_bellek_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('✓ Anılar JSON dosyası olarak indirildi!');
  };

  // Collect all unique keywords/tags from memories
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    memories.forEach((m) => {
      m.relevanceKeywords.forEach((k) => {
        if (k.length > 2) tagSet.add(k.toLowerCase());
      });
    });
    return Array.from(tagSet).slice(0, 14);
  }, [memories]);

  // Highlighting helper for search matches
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 text-amber-950 px-0.5 rounded font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Advanced Multi-dimensional Filter & Search
  const filteredMemories = useMemo(() => {
    let result = memories.filter((m) => {
      // 1. Category Filter
      if (filterCategory !== 'all' && m.category !== filterCategory) {
        return false;
      }
      // 2. Source Filter
      if (filterSource !== 'all') {
        const itemSource = m.source || 'auto_learned';
        if (filterSource === 'auto_learned' && itemSource !== 'auto_learned') return false;
        if (filterSource === 'user_defined' && itemSource !== 'user_defined') return false;
      }
      // 3. Tag Filter
      if (selectedTag) {
        const matchesTag =
          m.relevanceKeywords.some((k) => k.toLowerCase() === selectedTag.toLowerCase()) ||
          m.content.toLowerCase().includes(selectedTag.toLowerCase());
        if (!matchesTag) return false;
      }
      // 4. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inContent = m.content.toLowerCase().includes(q);
        const inKeywords = m.relevanceKeywords.some((k) => k.toLowerCase().includes(q));
        const inCategory = m.category.toLowerCase().includes(q);
        return inContent || inKeywords || inCategory;
      }
      return true;
    });

    // Sort result
    return result.sort((a, b) => {
      if (sortBy === 'recalls') return (b.recallCount || 0) - (a.recallCount || 0);
      if (sortBy === 'newest') return (b.timestamp || 0) - (a.timestamp || 0);
      if (sortBy === 'oldest') return (a.timestamp || 0) - (b.timestamp || 0);
      if (sortBy === 'alphabetical') return a.content.localeCompare(b.content, 'tr');
      return 0;
    });
  }, [memories, filterCategory, filterSource, selectedTag, searchQuery, sortBy]);

  // Test retrieval using the live test query
  const testRetrievalResult = ragEngine.retrieveRelevantMemories(testQuery, memories, 3);

  const getCategoryDetails = (cat: MemoryCategory) => {
    switch (cat) {
      case 'preference':
        return { label: 'Tercih', color: 'bg-pink-50 text-pink-700 border-pink-200', icon: '💖' };
      case 'fact':
        return { label: 'Bilgi', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '📌' };
      case 'instruction':
        return { label: 'Özel Talimat', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚡' };
      case 'interaction':
      default:
        return { label: 'Etkileşim', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🔄' };
    }
  };

  const totalRecalls = memories.reduce((acc, m) => acc + (m.recallCount || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-pink-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Öğrenen Bellek & RAG Anı Arama Merkezi
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {memories.length} Aktif Anı
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Geçmiş konuşmalarınızdan, tercihlerinizden ve talimatlarınızdan öğrenilen anılarda anlık arama yapın ve yönetin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMemories}
              title="Anıları JSON olarak yedekle"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Yedekle</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Toast alert */}
          {feedbackToast && (
            <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{feedbackToast}</span>
            </div>
          )}

          {/* Learning Controls & Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
                🧠 Toplam Bellek
              </span>
              <span className="text-xl font-extrabold text-indigo-950">{memories.length}</span>
              <span className="text-[10px] text-indigo-600/80 block mt-0.5">Aktif hafıza kaydı</span>
            </div>

            <div className="p-3 bg-pink-50/80 rounded-2xl border border-pink-200">
              <span className="text-[11px] font-bold text-pink-700 uppercase tracking-wider block">
                💖 Tercihler
              </span>
              <span className="text-xl font-extrabold text-pink-950">
                {memories.filter((m) => m.category === 'preference').length}
              </span>
              <span className="text-[10px] text-pink-600/80 block mt-0.5">Üslup ve tarz</span>
            </div>

            <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                📌 Bilgiler
              </span>
              <span className="text-xl font-extrabold text-blue-950">
                {memories.filter((m) => m.category === 'fact').length}
              </span>
              <span className="text-[10px] text-blue-600/80 block mt-0.5">Profil ve alışkanlık</span>
            </div>

            <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                ⚡ Hatırlanma
              </span>
              <span className="text-xl font-extrabold text-emerald-950">{totalRecalls}</span>
              <span className="text-[10px] text-emerald-600/80 block mt-0.5">RAG ile geri çağrıldı</span>
            </div>
          </div>

          {/* Auto Learning Switch Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-bold">Otomatik Öğrenme Modu (Sohbet İçi Analiz)</span>
              </div>
              <p className="text-xs text-slate-300">
                Yapay zekâ konuşma esnasında adınızı, işinizi ve tercihlerinizi otomatik algılar ve hafızasına kaydeder.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoLearningEnabled}
                onChange={(e) => onToggleAutoLearning(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* ======================================================== */}
          {/* SPECIAL: Gelişmiş Anı Arama ve Filtreleme Arayüzü */}
          {/* ======================================================== */}
          <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  Anı Arama ve Filtreleme Paneli
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {filteredMemories.length} / {memories.length} anı listeleniyor
              </span>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Anılarda ve öğrenilen bilgilerde hızlı arama yapın (ör: 'Instagram', 'kargo', 'samimi ton')..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Controls Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              {/* Category Filter Pills */}
              <div className="sm:col-span-8 flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                {[
                  { id: 'all', label: `Tümü (${memories.length})` },
                  {
                    id: 'preference',
                    label: `💖 Tercihler (${memories.filter((m) => m.category === 'preference').length})`,
                  },
                  {
                    id: 'fact',
                    label: `📌 Bilgiler (${memories.filter((m) => m.category === 'fact').length})`,
                  },
                  {
                    id: 'instruction',
                    label: `⚡ Talimatlar (${memories.filter((m) => m.category === 'instruction').length})`,
                  },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterCategory(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition active:scale-95 ${
                      filterCategory === f.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Source & Sort dropdowns */}
              <div className="sm:col-span-4 flex items-center gap-2 justify-start sm:justify-end">
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 shadow-2xs"
                >
                  <option value="all">Tüm Kaynaklar</option>
                  <option value="auto_learned">🤖 Otomatik Öğrenilen</option>
                  <option value="user_defined">👤 Manuel Eklenen</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 shadow-2xs"
                >
                  <option value="recalls">🔥 En Çok Hatırlanan</option>
                  <option value="newest">🆕 En Yeni</option>
                  <option value="oldest">⏳ En Eski</option>
                  <option value="alphabetical">🔤 Alfabetik (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Quick Tag Cloud Filter */}
            {allTags.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
                  <Tag className="w-3 h-3 text-indigo-500" />
                  Hızlı Etiketler:
                </span>
                {allTags.map((t) => {
                  const isSelected = selectedTag === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedTag(isSelected ? null : t)}
                      className={`text-[11px] px-2 py-0.5 rounded-lg font-medium transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-white hover:bg-indigo-50 text-indigo-900 border border-slate-200'
                      }`}
                    >
                      #{t}
                    </button>
                  );
                })}
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-[10px] text-rose-600 hover:underline font-bold ml-1"
                  >
                    ✕ Etiketi Temizle
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Add New Memory Section */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                Yapay Zekâya Yeni Bilgi veya Tercih Öğret
              </h3>
              {!isAdding && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  + Yeni Ekle
                </button>
              )}
            </div>

            {isAdding && (
              <form onSubmit={handleAddMemory} className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600 shrink-0">Kategori:</span>
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[
                      { id: 'preference', label: '💖 Tercih' },
                      { id: 'fact', label: '📌 Bilgi' },
                      { id: 'instruction', label: '⚡ Özel Talimat' },
                    ].map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setNewCategory(c.id as MemoryCategory)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          newCategory === c.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Örnek: Kullanıcı Instagram gönderilerinde samimi, bol emojili ve soruyla biten bir tonu tercih ediyor..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewContent('');
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-200/60"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={!newContent.trim()}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 disabled:opacity-50"
                  >
                    Belleğe Kaydet
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* RAG Live Simulator & Match Test Box */}
          <div className="border border-purple-200/80 bg-purple-50/40 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-600" />
                Canlı RAG Bellek Testi (Soruya Göre Hangi Bilgiler Hatırlanıyor?)
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                Anlık Eşleşme
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Örnek soru yazarak bellek eşleşmesini test edin..."
                className="flex-1 bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-purple-900 block">
                Bu soru sorulduğunda yapay zekânın arkada kullandığı RAG bağlamı:
              </span>
              {testRetrievalResult.retrievedMemories.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Eşleşen özel bellek bulunamadı.</p>
              ) : (
                <div className="space-y-1">
                  {testRetrievalResult.retrievedMemories.map((m, idx) => {
                    const d = getCategoryDetails(m.category);
                    return (
                      <div
                        key={m.id}
                        className="bg-white/90 border border-purple-100 rounded-xl p-2 text-xs flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${d.color} shrink-0`}>
                            {d.icon} {d.label}
                          </span>
                          <span className="text-slate-800 font-medium truncate">{m.content}</span>
                        </div>
                        <span className="text-[10px] text-purple-600 font-bold shrink-0">
                          #{idx + 1} Eşleşme
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Filtered Memories List */}
          <div className="space-y-2.5">
            {filteredMemories.length === 0 ? (
              <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Brain className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">Aramanıza Uygun Bellek / Anı Bulunamadı</p>
                <p className="text-xs text-slate-400 mt-1">
                  Farklı bir arama terimi girin veya filtreleri temizleyin.
                </p>
                {(searchQuery || filterCategory !== 'all' || selectedTag) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterCategory('all');
                      setFilterSource('all');
                      setSelectedTag(null);
                    }}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition"
                  >
                    Tüm Filtreleri Temizle
                  </button>
                )}
              </div>
            ) : (
              filteredMemories.map((mem) => {
                const details = getCategoryDetails(mem.category);
                const isEditing = editingId === mem.id;
                const isCopied = copiedId === mem.id;

                return (
                  <div
                    key={mem.id}
                    className="p-3.5 sm:p-4 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-3 shadow-2xs transition group"
                  >
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${details.color}`}>
                          {details.icon} {details.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {mem.source === 'user_defined' ? '👤 Kullanıcı Tanımlı' : '🤖 Otomatik Öğrenildi'}
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                          {mem.recallCount || 0} kez hatırlandı
                        </span>
                        {mem.timestamp && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(mem.timestamp).toLocaleDateString('tr-TR')}
                          </span>
                        )}
                      </div>

                      {/* Content or Edit Field */}
                      {isEditing ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={2}
                            className="w-full p-2 border border-indigo-400 rounded-xl text-xs sm:text-sm text-slate-900 outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveEdit(mem.id)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              <span>Kaydet</span>
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 text-xs rounded-lg"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                          {highlightMatch(mem.content, searchQuery)}
                        </p>
                      )}

                      {/* Keyword tags */}
                      {mem.relevanceKeywords && mem.relevanceKeywords.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {mem.relevanceKeywords.map((k, i) => (
                            <span
                              key={i}
                              onClick={() => setSelectedTag(k.toLowerCase())}
                              className="text-[10px] text-slate-500 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-1.5 py-0.2 rounded cursor-pointer transition"
                            >
                              #{k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 sm:opacity-70 group-hover:opacity-100 transition shrink-0 self-end sm:self-start">
                      <button
                        onClick={() => handleCopy(mem.id, mem.content)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                        title="Metni Kopyala"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => {
                          setEditingId(mem.id);
                          setEditingText(mem.content);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                        title="Bu Anıyı Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(mem.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Bu bilgiyi bellekten sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Varsayılan Belleğe Dön</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
