import { MemoryItem, MemoryCategory, RAGRetrievalResult } from '../types.ts';

const STORAGE_KEY = 'benim_ai_rag_memory_v1';

// Seeded initial learned memories representing user interaction history and preferences
export const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    category: 'preference',
    content: 'Kullanıcı samimi, net, çözüm odaklı ve emoji destekli Türkçe iletişimi tercih ediyor.',
    source: 'auto_learned',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
    recallCount: 14,
    relevanceKeywords: ['samimi', 'dil', 'üslup', 'türkçe', 'anlatım', 'emoji', 'tarz'],
  },
  {
    id: 'mem-2',
    category: 'fact',
    content: 'Kullanıcı sosyal medya içerik üretimi, Instagram butiği ve e-ticaret satış otomasyonu yürütmektedir.',
    source: 'auto_learned',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
    recallCount: 19,
    relevanceKeywords: ['instagram', 'sosyal', 'medya', 'mağaza', 'ürün', 'müşteri', 'satış', 'e-ticaret', 'butik'],
  },
  {
    id: 'mem-3',
    category: 'preference',
    content: 'Kullanıcı kod ve teknik konularda temiz Markdown formatında, kopyalanabilir ve Türkçe açıklamalı blokları seviyor.',
    source: 'auto_learned',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    recallCount: 9,
    relevanceKeywords: ['kod', 'yazılım', 'python', 'javascript', 'markdown', 'programlama', 'teknik'],
  },
  {
    id: 'mem-4',
    category: 'instruction',
    content: 'Müşteri yanıtlarında her zaman hızlı teslimat ve müşteri memnuniyeti vurgusu yapılmalı.',
    source: 'user_defined',
    timestamp: Date.now() - 1000 * 60 * 60 * 12,
    recallCount: 11,
    relevanceKeywords: ['kargo', 'teslimat', 'müşteri', 'memnuniyet', 'iade', 'güven', 'kalite'],
  },
  {
    id: 'mem-5',
    category: 'interaction',
    content: 'Kullanıcı daha önce görsel ve video stüdyosunda Reels ve ürün tanıtım kurguları hazırladı.',
    source: 'auto_learned',
    timestamp: Date.now() - 1000 * 60 * 60 * 6,
    recallCount: 7,
    relevanceKeywords: ['video', 'görsel', 'fotoğraf', 'stüdyo', 'reels', 'kurgu', 'montaj'],
  },
];

// Stopwords in Turkish to ignore during keyword extraction
const TURKISH_STOPWORDS = new Set([
  've', 'veya', 'ile', 'bir', 'bu', 'şu', 'o', 'için', 'de', 'da', 'mi', 'mı', 'mu', 'mü',
  'ne', 'nasıl', 'nerede', 'kim', 'daha', 'çok', 'en', 'gibi', 'kadar', 'ama', 'fakat',
  'lakin', 'ise', 'her', 'hiç', 'şey', 'ben', 'sen', 'biz', 'siz', 'onlar', 'bunu', 'şunu'
]);

// Clean and tokenize text into keywords
export function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !TURKISH_STOPWORDS.has(w));
}

export const ragEngine = {
  // 1. Get all memories from local storage
  getStoredMemories(): MemoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load RAG memories:', e);
    }
    // Default seed
    this.saveMemories(DEFAULT_MEMORIES);
    return DEFAULT_MEMORIES;
  },

  // 2. Save memories to storage
  saveMemories(memories: MemoryItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
    } catch (e) {
      console.warn('Failed to save RAG memories:', e);
    }
  },

  // 3. RAG Retrieval: Matches query against all memories and ranks by relevance
  retrieveRelevantMemories(
    query: string,
    allMemories: MemoryItem[],
    maxItems = 3
  ): RAGRetrievalResult {
    if (!allMemories || allMemories.length === 0) {
      return { retrievedMemories: [], contextString: '' };
    }

    const queryKeywords = extractKeywords(query);

    // Score each memory
    const scored = allMemories.map((mem) => {
      let score = 0;
      const memKeywords = new Set([
        ...mem.relevanceKeywords.map((k) => k.toLowerCase()),
        ...extractKeywords(mem.content),
      ]);

      // Direct keyword overlap
      for (const qk of queryKeywords) {
        if (memKeywords.has(qk)) {
          score += 4;
        } else {
          // Substring partial match
          for (const mk of memKeywords) {
            if (mk.includes(qk) || qk.includes(mk)) {
              score += 2;
              break;
            }
          }
        }
      }

      // Priority boost by category
      if (mem.category === 'instruction') score += 1.5;
      if (mem.category === 'preference') score += 1.0;

      // Small frequency & recency boost
      score += Math.min(mem.recallCount * 0.1, 1.5);

      return { mem, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // If top items have good score, pick them; otherwise pick top 2 general preferences
    let topItems: MemoryItem[] = [];
    if (scored[0] && scored[0].score >= 2) {
      topItems = scored.filter((s) => s.score >= 2).slice(0, maxItems).map((s) => s.mem);
    } else {
      // Pick top 2 high-confidence preferences/instructions as general context
      topItems = allMemories
        .filter((m) => m.category === 'preference' || m.category === 'instruction')
        .slice(0, 2);
    }

    // Update recall count on retrieved items
    const now = Date.now();
    const updatedMemories = allMemories.map((m) => {
      if (topItems.some((t) => t.id === m.id)) {
        return {
          ...m,
          recallCount: m.recallCount + 1,
          lastRecalledAt: now,
        };
      }
      return m;
    });
    this.saveMemories(updatedMemories);

    // Generate formatted context string for LLM system prompt injection
    const contextLines = topItems.map((m) => {
      const catLabel =
        m.category === 'preference'
          ? 'Kullanıcı Tercihi'
          : m.category === 'fact'
          ? 'Öğrenilen Bilgi'
          : m.category === 'instruction'
          ? 'Özel Talimat'
          : 'Geçmiş Etkileşim';
      return `• [${catLabel}]: ${m.content}`;
    });

    const contextString = `[ÖĞRENEN BELLEK (RAG KATMANI)]
Bu kullanıcının geçmiş etkileşimlerinden öğrenilen hafıza verileri aşağıdadır. Cevabını bu tercihlere ve bilgilere tam uyumlu olacak şekilde kişiselleştir:
${contextLines.join('\n')}
(Not: Bu bilgileri doğrudan 'belleğimden baktım' demeden, doğal ve samimi bir şekilde cevabına yansıt.)`;

    return {
      retrievedMemories: topItems,
      contextString,
    };
  },

  // 4. Auto-Learner: Extracts new facts/preferences from user messages
  extractMemoriesFromInteraction(
    userMessage: string,
    _assistantReply?: string,
    existingMemories: MemoryItem[] = []
  ): MemoryItem[] {
    const text = userMessage.trim();
    const newItems: MemoryItem[] = [];

    // Helper to check if similar content already exists
    const isDuplicate = (content: string) => {
      const lower = content.toLowerCase();
      return (
        existingMemories.some((m) => m.content.toLowerCase().includes(lower) || lower.includes(m.content.toLowerCase())) ||
        newItems.some((m) => m.content.toLowerCase().includes(lower))
      );
    };

    // Pattern 1: Name detection ("adım X", "benim adım X", "bana X de")
    const nameMatch = text.match(/(?:benim adım|adım|bana)\s+([A-ZÇĞİÖŞÜa-zçğıöşü]{2,15})(?:\s+de|\s+derler|[.,!]|$)/i);
    if (nameMatch && nameMatch[1]) {
      const name = nameMatch[1].trim();
      const content = `Kullanıcının adı ${name}. İletişimde ismiyle veya samimi hitapla yaklaşılabilir.`;
      if (!isDuplicate(name)) {
        newItems.push({
          id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          category: 'fact',
          content,
          source: 'auto_learned',
          timestamp: Date.now(),
          recallCount: 1,
          relevanceKeywords: ['isim', 'ad', name.toLowerCase(), 'hitap', 'kullanıcı'],
        });
      }
    }

    // Pattern 2: Profession / Role ("ben X'im", "X olarak çalışıyorum")
    const roleMatch = text.match(/(?:ben bir|ben)\s+([a-zçğıöşü\s]{3,25})(?:yım|yim|um|üm|m|olarak çalışıyorum|mesleğim)/i);
    if (roleMatch && roleMatch[1]) {
      const role = roleMatch[1].trim();
      if (!['burada', 'şimdi', 'böyle', 'iyi'].includes(role.toLowerCase())) {
        const content = `Kullanıcı ${role} olarak çalışıyor veya bu alanda uzmanlığa sahip.`;
        if (!isDuplicate(role)) {
          newItems.push({
            id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            category: 'fact',
            content,
            source: 'auto_learned',
            timestamp: Date.now(),
            recallCount: 1,
            relevanceKeywords: ['meslek', 'uzmanlık', 'iş', ...extractKeywords(role)],
          });
        }
      }
    }

    // Pattern 3: Preferences ("X severim", "X tercih ederim", "X hoşuma gider")
    const prefMatch = text.match(/([a-zçğıöşü0-9\s]{4,35})(?:\s+severim|\s+tercih ederim|\s+hoşuma gider|\s+yapmayı severim)/i);
    if (prefMatch && prefMatch[1]) {
      const pref = prefMatch[1].trim();
      const content = `Kullanıcı ${pref} konusunu seviyor ve bunu tercih ediyor.`;
      if (!isDuplicate(pref)) {
        newItems.push({
          id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          category: 'preference',
          content,
          source: 'auto_learned',
          timestamp: Date.now(),
          recallCount: 1,
          relevanceKeywords: ['tercih', 'ilgi', ...extractKeywords(pref)],
        });
      }
    }

    // Pattern 4: Style instruction ("kısa anlat", "uzun yazma", "madde madde ver", "kod olarak ver")
    if (/(?:kısa ve net|özet geç|uzatma|kısa cevap)/i.test(text)) {
      const content = 'Kullanıcı kısa, net ve gereksiz uzatmalardan kaçınan yanıtları tercih ediyor.';
      if (!isDuplicate('kısa ve net')) {
        newItems.push({
          id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          category: 'instruction',
          content,
          source: 'auto_learned',
          timestamp: Date.now(),
          recallCount: 1,
          relevanceKeywords: ['kısa', 'özet', 'hızlı', 'format'],
        });
      }
    }

    // Pattern 5: E-commerce / Business details
    if (/(?:instagram|butik|satış|ürünüm|mağazam|dükkanım)/i.test(text) && /(?:satıyorum|kargoluyorum|fiyat|müşteri)/i.test(text)) {
      const content = 'Kullanıcı e-ticaret ve sosyal medya mağazacılığı ile aktif ilgileniyor; satış ve kargo süreçlerini yönetiyor.';
      if (!isDuplicate('e-ticaret ve sosyal medya')) {
        newItems.push({
          id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          category: 'fact',
          content,
          source: 'auto_learned',
          timestamp: Date.now(),
          recallCount: 1,
          relevanceKeywords: ['satış', 'mağaza', 'ürün', 'instagram', 'butik', 'kargo'],
        });
      }
    }

    return newItems;
  },

  // 5. Add custom user-defined memory
  addCustomMemory(content: string, category: MemoryCategory = 'preference'): MemoryItem {
    const memories = this.getStoredMemories();
    const newItem: MemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category,
      content: content.trim(),
      source: 'user_defined',
      timestamp: Date.now(),
      recallCount: 1,
      relevanceKeywords: extractKeywords(content),
    };
    const updated = [newItem, ...memories];
    this.saveMemories(updated);
    return newItem;
  },

  // 6. Delete memory
  deleteMemory(id: string): MemoryItem[] {
    const memories = this.getStoredMemories();
    const filtered = memories.filter((m) => m.id !== id);
    this.saveMemories(filtered);
    return filtered;
  },

  // 7. Reset to default
  resetToDefaults(): MemoryItem[] {
    this.saveMemories(DEFAULT_MEMORIES);
    return DEFAULT_MEMORIES;
  },
};
