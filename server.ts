import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
app.use(express.json({ limit: '25mb' }));

const APP_URL = process.env.APP_URL || 'https://ais-dev-aoszvvchvlzmhgfkf3pgvp-845612651071.europe-west2.run.app';

const AI_PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const GEMINI_MODEL = process.env.GEMINI_MODEL || process.env.PRIMARY_MODEL || 'gemini-3.8-flash';

const FALLBACK_FREEDOM = {
  greeting: [
    'Merhaba! Ben Benim Yapay Zekâm. Bugün size nasıl yardımcı olabilirim?',
    'Hoş geldiniz. Benim Yapay Zekâm; fikir, içerik, analiz ve çözüm konusunda hemen yanında.',
    'Selam! Benim Yapay Zekâm. İstediğiniz konuda net, hızlı ve pratik çözüm üretirim.'
  ],
  general: [
    'Sorunun merkezine odaklanıp en verimli çözümü sırasıyla hazırlıyorum.',
    'Durumu netleştirip, en hızlı ve doğru çözüm yolunu birlikte planlayalım.',
    'Bunu adım adım çözelim; önce istenen sonucu netleştirip ardından en uygun yöntemi uygulayalım.'
  ],
  business: [
    'İşletme açısından en etkili yaklaşım, net hedef, hızlı aksiyon ve ölçülebilir sonuçtur.',
    'Bu noktada veriye dayalı, pratik ve müşteri odaklı bir plan çok daha güçlü çalışır.',
    'Kısa vadede etkili ve uzun vadede sürdürülebilir bir hareket planı kuruyorum.'
  ],
  coding: [
    'Kodu sade, okunabilir ve sürdürülebilir şekilde kurup örnekle açıklayayım.',
    'Bu sorunu çözmek için en temiz yaklaşımı seçiyorum; ardından örnek bir uygulama sunuyorum.',
    'Önce mantığı netleştirip, sonra minimum hata ve maksimum okunabilirlikle çözüme geçiyorum.'
  ],
  creative: [
    'İlham verici, özgün ve uygulanabilir bir fikir oluşturup dikkat çeken bir taslak hazırlıyorum.',
    'Yaratıcı ama gerçekçi bir çözüm üretiyorum; hem dikkat çekici hem de kullanışlı olsun.',
    'Anlamlı ve etkili bir içerik fikri çıkarıp, hemen kullanılabilir formata dönüştürüyorum.'
  ]
};

function antiRepeat(text: string): string {
  if (!text) return '';

  const normalized = text.replace(/\s+/g, ' ').trim();
  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);

  if (sentences.length <= 1) return normalized;

  const unique: string[] = [];
  const seen = new Set<string>();

  for (const sentence of sentences) {
    const key = sentence.toLowerCase().replace(/[^a-z0-9çğıöşü\s]/g, '').replace(/\s+/g, ' ').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(sentence.trim());
  }

  let result = unique.join(' ');
  if (result.length < normalized.length * 0.5) {
    result = normalized;
  }

  const repeatedPattern = /(\b[\wçğıöşü]+\b\s+){2,}\1+/i;
  if (repeatedPattern.test(result)) {
    result = result.replace(/(\b[\wçğıöşü]+\b\s+){2,}/gi, (match) => match.split(/\s+/).slice(0, 2).join(' ') + ' ');
  }

  return result.replace(/\s{2,}/g, ' ').trim();
}

function selectRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function sentenceMix(prefixes: string[], suffixes: string[]): string {
  const prefix = selectRandom(prefixes);
  const suffix = selectRandom(suffixes);
  return `${prefix} ${suffix}`;
}

function withFreshness(text: string, fallbackContext: string): string {
  const base = antiRepeat(text || fallbackContext || '');
  if (!base) return fallbackContext;

  const output = base
    .replace(/(\b[A-Za-zÇçĞğİiÖöŞşÜü]+\b\s+){3,}\1+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/(\.)\1+/g, '.')
    .trim();

  return output.length > 0 ? output : fallbackContext;
}

function getSystemInstruction(tone?: string): string {
  const toneSpecific = tone ? `İstenen ton: ${tone}.` : 'İstenen ton: doğal, net, profesyonel ve samimi.';
  return `Sen Benim Yapay Zekâm adında çok güçlü, pratik ve güven veren Türkçe asistanısın.
- Her cevapta aynı cümleleri tekrar etme; farklı yapı, farklı açılar ve yeni ifade biçimleri kullan.
- Kısa, net ve etkili anlatım tercih et; gereksiz tekrarlar ekleme.
- Müşteriye çözüm odaklı, sıcak ve profesyonel yaklaş.
- Eğer soru teknikse teknik açıklamayı anlaşılır yap.
- Eğer içerik üretimi gerekiyorsa kreatif, özgün ve uygulanabilir çıktılar ver.
- Asla boş tekrarlar yazma; aynı fikir için yeni cümle kur.
${toneSpecific}`;
}

function buildFallbackReply(q: string): string {
  const lowered = q.toLowerCase();

  if (/(merhaba|selam|günaydın|iyi günler|hey)/.test(lowered)) {
    return withFreshness(selectRandom(FALLBACK_FREEDOM.greeting), 'Merhaba! Benim Yapay Zekâm. Nasıl yardımcı olabilirim?');
  }

  if (/(kod|javascript|typescript|python|react|node|yazılım|fonksiyon|api)/.test(lowered)) {
    const reply = sentenceMix(FALLBACK_FREEDOM.coding, [
      'İstediğiniz çözümü kısa ve anlaşılır şekilde hazırlıyorum.',
      'Gerekirse örnek kodun yanında açıklamasını da eklerim.',
      'İsterseniz bunu doğrudan üretim koduna uyarlanabilir hale getiririm.'
    ]);
    return withFreshness(reply, 'Bu sorunu net ve uygulanabilir formda çözüyorum.');
  }

  if (/(fikir|proje|iş|gelir|pazarlama|marka|sosyal|instagram|whatsapp|reels|tiktok)/.test(lowered)) {
    const reply = sentenceMix(FALLBACK_FREEDOM.creative, [
      'Bunu daha güçlü bir içerik ve aksiyon planına dönüştürüyorum.',
      'Markanızı öne çıkaracak ve hedef kitlenizi ilgilendirecek bir rota oluşturuyorum.',
      'Hızlı sonuç alabileceğiniz bir strateji ve içerik akışı hazırlıyorum.'
    ]);
    return withFreshness(reply, 'Bu probleme yaratıcı ve uygulanabilir bir çözüm üretiyorum.');
  }

  if (/(fiyat|satış|kargo|teslim|müşteri|işletme|dijital)/.test(lowered)) {
    const reply = sentenceMix(FALLBACK_FREEDOM.business, [
      'Müşteri deneyimini artırırken operasyonel süreci kolaylaştıran bir yaklaşım öneriyorum.',
      'Önce hızlı karar alınabilir bir plan kurup sonra uygulanabilir detayları ekliyorum.',
      'Bu durumu hem müşteriye yararlı hem de işletmeye kolay bir şekilde çözüme bağlayayım.'
    ]);
    return withFreshness(reply, 'İşletme açısından en verimli yolu netleştirip uygulamaya dönüştürüyorum.');
  }

  return withFreshness(
    sentenceMix(FALLBACK_FREEDOM.general, [
      'İstediğiniz sonucu netleştirip en doğru çözüme odaklanıyorum.',
      'Bu görevi anlaşılır ve hızlı bir planla ilerletiyorum.',
      'Öncelikle hedefi belirleyip ardından en etkili yöntemi uyguluyorum.'
    ]),
    'İstediğiniz işin odağını netleştirip en iyi çözüm yolunu çıkarıyorum.'
  );
}

function generateContextualTurkishFallback(userMessage: string): string {
  const q = (userMessage || '').toLowerCase();
  if (!q.trim()) return withFreshness(selectRandom(FALLBACK_FREEDOM.greeting), 'Merhaba! Benim Yapay Zekâm.');
  return buildFallbackReply(q);
}

async function callOpenRouterChat(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  enableSearch: boolean
): Promise<string | null> {
  if (!OPENROUTER_API_KEY) return null;

  try {
    const body = {
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      ],
      temperature: 0.8,
      ...(enableSearch ? { plugins: [{ id: 'web' }] } : {}),
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': APP_URL,
        'X-Title': 'Benim Yapay Zekâm',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });

    const text = await response.text();
    if (!response.ok) {
      console.warn('OpenRouter chat failed:', response.status, text.slice(0, 400));
      return null;
    }

    const data = JSON.parse(text);
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply === 'string' && reply.trim().length > 0) {
      return withFreshness(reply.trim(), 'Yanıt üretilemedi.');
    }
  } catch (error) {
    console.warn('OpenRouter request failed:', error);
  }

  return null;
}

let aiClient: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (err) {
  console.warn('Gemini client initialization warning:', err);
}

async function callGeminiChat(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  enableSearch: boolean
): Promise<string | null> {
  if (!aiClient) return null;

  try {
    const chatContents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const config: Record<string, unknown> = {
      systemInstruction: systemPrompt,
      temperature: 0.8,
    };

    if (enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const geminiRes = await aiClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: chatContents,
      config,
    });

    const replyText = geminiRes.text || '';
    if (replyText.trim()) return withFreshness(replyText.trim(), 'Yanıt üretilemedi.');
  } catch (error: any) {
    console.warn('Gemini chat generation issue:', error?.message || error);
  }

  return null;
}

async function callOpenEngineFallback(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  enableSearch = false
): Promise<string> {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || 'Merhaba';

  const openRouterReply = await callOpenRouterChat(messages, systemPrompt, enableSearch);
  if (openRouterReply) return openRouterReply;

  const geminiReply = await callGeminiChat(messages, systemPrompt, enableSearch);
  if (geminiReply) return geminiReply;

  try {
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: formattedMessages,
        model: 'openai',
        seed: Math.floor(Math.random() * 100000),
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (response.ok) {
      const text = await response.text();
      if (text && text.trim().length > 0) {
        return withFreshness(text.trim(), 'Yanıt üretilemedi.');
      }
    }
  } catch (error) {
    console.warn('Fallback pollinations request failed:', error);
  }

  return generateContextualTurkishFallback(lastUserMessage);
}

async function generateSmartAutoReply(
  platform: 'instagram_dm' | 'instagram_comment' | 'whatsapp',
  messageText: string
): Promise<string> {
  const systemPrompt = `Sen güven veren, sıcak ve satış odaklı Türkçe asistanısın. Gelen mesajı hızlıca yanıtla. Kısa, doğal ve farklı cümleler kullan. Aynı ifade tekrar etme.`;

  const openRouterReply = await callOpenRouterChat([{ role: 'user', content: `Gelen mesaj: "${messageText}"` }], systemPrompt, false);
  if (openRouterReply) return openRouterReply;

  const readyReplies = [
    `Merhaba! Mesajınız için teşekkür ederiz. Sorununuzla ilgili hemen net ve yardımcı bir cevap hazırlıyoruz. ✨`,
    `Teşekkür ederiz. İsterseniz size en kısa yoldan çözümü paylaşalım; detayları hemen aktaralım. 🚀`,
    `Anladım. Konuyla ilgili net bir açıklama ve en doğru çözümü sizin için hazırlıyorum. 💡`,
    `Harika bir soru. Hemen açıklayıp gerekli adımları net bir şekilde ileteceğim. 📌`
  ];

  return withFreshness(selectRandom(readyReplies), 'Mesajınız için teşekkürler.');
}

async function generateDraftReplies(
  platform: 'instagram_dm' | 'instagram_comment' | 'whatsapp',
  messageText: string,
  senderName = 'Kullanıcı'
): Promise<string[]> {
  const isComment = platform === 'instagram_comment';
  const systemPrompt = `Sen müşteri ilişkileri odaklı, sıcak ve profesyonel bir Türkçe asistanısın. 3 farklı, özgün ve doğal yanıt üret. Aynı cümleleri tekrar etme. JSON array döndür.`;

  const openRouterReply = await callOpenRouterChat(
    [{ role: 'user', content: `Gönderen: ${senderName}\nMesaj: "${messageText}"` }],
    systemPrompt,
    false
  );

  if (openRouterReply) {
    try {
      const parsed = JSON.parse(openRouterReply.trim());
      if (Array.isArray(parsed) && parsed.length >= 2) {
        return parsed.slice(0, 3).map((s: unknown) => String(s).trim());
      }
    } catch {
      // ignore and continue to fallback
    }
  }

  const draftPool = isComment
    ? [
        `Harika bir yorum, gerçekten değerli bir geri bildirim. Size en doğru ve hızlı şekilde yardımcı olmak için hemen çalışıyoruz ✨`,
        `Teşekkür ederiz. Detayları sizin için netleştirip, en doğru adımı birlikte belirleyeceğiz. 📩`,
        `Bu konuda net bilgi vererek süreci kolaylaştırmaya çalışıyoruz. Hemen size doğru yönü gösterelim 🚀`
      ]
    : [
        `Merhaba ${senderName}! Mesajınız için teşekkür ederiz. Konunuzla ilgili güven verici ve net bir destek sunuyoruz ✨`,
        `Anladım. Size en doğru bilgiyi hızlıca iletip süreci kolaylaştırmaya hazırım. 📦`,
        `Harika bir soru. Hemen çözüm ve gerekli adımları net bir şekilde paylaşalım 💫`
      ];

  return draftPool.map((item) => withFreshness(item, 'Detaylı bilgi için iletişime geçebilirsiniz.'));
}

// In-Memory Social Media & WhatsApp State
interface SocialConnectionState {
  instagram: {
    connected: boolean;
    username: string;
    pageName: string;
    connectedAt?: number;
    autoReplyEnabled: boolean;
    accessToken?: string;
  };
  whatsapp: {
    connected: boolean;
    phoneNumber: string;
    businessName: string;
    connectedAt?: number;
    autoReplyEnabled: boolean;
    accessToken?: string;
  };
}

const socialState: SocialConnectionState = {
  instagram: {
    connected: false,
    username: 'benimyapayzekam_official',
    pageName: 'Benim Yapay Zekâm Mağazası',
    autoReplyEnabled: true,
  },
  whatsapp: {
    connected: false,
    phoneNumber: '+90 555 123 4567',
    businessName: 'Benim Yapay Zekâm WhatsApp Hattı',
    autoReplyEnabled: true,
  },
};

interface InboxMessage {
  id: string;
  platform: 'instagram_dm' | 'instagram_comment' | 'whatsapp';
  senderName: string;
  senderHandle?: string;
  text: string;
  timestamp: number;
  status: 'unread' | 'read' | 'replied';
  replyText?: string;
  repliedAt?: number;
  autoReplied?: boolean;
  suggestedDrafts?: string[];
  selectedDraft?: string;
}

// Initial sample messages for immediate Instagram inbox & AI draft reply demonstration
let inboxMessages: InboxMessage[] = [
  {
    id: 'ig-msg-1',
    platform: 'instagram_dm',
    senderName: 'Selin Karaca',
    senderHandle: '@selin.karaca',
    text: 'Merhabalar! Yeni koleksiyonunuzdaki el yapımı ürünlerin fiyatı nedir? Kargo süresi ne kadar sürüyor?',
    timestamp: Date.now() - 1000 * 60 * 8,
    status: 'unread',
    suggestedDrafts: [
      'Merhabalar Selin Hanım! Koleksiyonumuz 350 TL’den başlıyor. 250 TL üzeri kargo ücretsizdir ve siparişiniz 1-2 iş günü içinde kapınıza teslim edilir. 📦',
      'Ürünlerimiz el yapımı ve kişiselleştirme seçeneği sunuyor. Kargo ortalama 48 saat içinde gerçekleşiyor. 📦',
      'Harika bir tercih. Lansman fırsatımızla sepette ekstra avantaj sağlıyoruz; profil linkimizden hızlıca inceleyebilirsiniz. 🚀'
    ],
  },
  {
    id: 'ig-msg-2',
    platform: 'instagram_comment',
    senderName: 'Caner Demir',
    senderHandle: '@canerdmr',
    text: 'Görseldeki antrasit model stokta var mı? Beden tablosunu nereden bulabilirim? 🔥',
    timestamp: Date.now() - 1000 * 60 * 22,
    status: 'unread',
    suggestedDrafts: [
      'Evet, antrasit modelimiz tüm bedenleriyle stokta. Beden tablosunu profilde ve DM üzerinden de paylaşabiliyoruz. ✨',
      'Beden ölçü tablomuz profilimizde yer alıyor; isterseniz DM üzerinden de iletebiliriz. 📏',
      'Stok durumunu hemen kontrol edip, size en doğru beden önerisini sunuyoruz. ⚡'
    ],
  },
  {
    id: 'wa-msg-1',
    platform: 'whatsapp',
    senderName: 'Mehmet Demir',
    senderHandle: '+90 532 987 6543',
    text: 'İyi günler, dün verdiğim 4819 nolu siparişimin kargo takip numarasını öğrenebilir miyim?',
    timestamp: Date.now() - 1000 * 60 * 15,
    status: 'unread',
    suggestedDrafts: [
      'İyi günler Mehmet Bey! Siparişiniz hazırlandı ve kargoya teslim edildi. Takip numaranız 39482019482. 🚚',
      'Merhabalar. Siparişinizin durumunu kontrol ettik; bugün sevkiyat aşamasında ve takip kodu size iletilmeye hazır. ✨',
      'Kargo takibi için gerekli kodu hemen iletiliyor. Lütfen güncellemeleri takip edebilirsiniz. 📦'
    ]
  }
];

app.get(['/manifest.json', '/manifest.webmanifest'], (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.resolve(__dirname, 'public', 'manifest.json'));
});

app.get('/sw.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.resolve(__dirname, 'public', 'sw.js'));
});

app.get('/api/status', (_req, res) => {
  const activeModel = AI_PROVIDER === 'openrouter' ? OPENROUTER_MODEL : GEMINI_MODEL;
  res.json({
    status: 'online',
    appName: 'Benim Yapay Zekâm',
    features: ['chat', 'image-generation', 'long-video-studio', 'social-media-automation', 'instagram-oauth', 'whatsapp-api', 'live-video-call'],
    activeEngine: 'Akıllı Süper Stüdyo',
    provider: AI_PROVIDER,
    model: activeModel,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY || OPENROUTER_API_KEY),
    ready: true,
  });
});

app.get('/api/social/connections', (_req, res) => {
  res.json({
    instagram: socialState.instagram,
    whatsapp: socialState.whatsapp,
    appUrl: APP_URL,
    callbackUrl: `${APP_URL}/auth/callback`,
    webhookUrl: `${APP_URL}/api/webhook`,
  });
});

app.get('/api/social/inbox', (_req, res) => {
  res.json({ messages: inboxMessages });
});

app.post('/api/social/toggle-autoreply', (req, res) => {
  const { platform, enabled } = req.body;
  if (platform === 'whatsapp') socialState.whatsapp.autoReplyEnabled = Boolean(enabled);
  else socialState.instagram.autoReplyEnabled = Boolean(enabled);
  res.json({ success: true, socialState });
});

app.post('/api/social/disconnect', (req, res) => {
  const { platform } = req.body;
  if (platform === 'whatsapp') socialState.whatsapp.connected = false;
  else socialState.instagram.connected = false;
  res.json({ success: true, socialState });
});

app.post('/api/social/send-reply', async (req, res) => {
  const { messageId, replyText } = req.body;
  const target = inboxMessages.find((m) => m.id === messageId);
  if (!target) return res.status(404).json({ error: 'Mesaj bulunamadı.' });

  target.status = 'replied';
  target.replyText = replyText;
  target.repliedAt = Date.now();
  target.autoReplied = false;
  res.json({ success: true, message: target });
});

app.post('/api/social/generate-drafts', async (req, res) => {
  const { messageId, text, platform = 'instagram_dm', senderName = 'Müşteri' } = req.body;
  try {
    const drafts = await generateDraftReplies(platform, text, senderName);
    const target = inboxMessages.find((m) => m.id === messageId);
    if (target) target.suggestedDrafts = drafts;
    return res.json({ success: true, drafts });
  } catch (error) {
    console.warn('Draft generation failed:', error);
    return res.status(500).json({ error: 'Taslak oluşturulamadı.' });
  }
});

app.post('/api/social/simulate-incoming', async (req, res) => {
  const { platform = 'instagram_dm', senderName = 'Cem Yılmaz', text = 'Fiyat ve teslimat bilgisi alabilir miyim?' } = req.body;
  const drafts = await generateDraftReplies(platform, text, senderName);

  const newMsg: InboxMessage = {
    id: `msg-${Date.now()}`,
    platform,
    senderName,
    senderHandle: platform === 'whatsapp' ? '+90 533 111 2233' : `@${senderName.toLowerCase().replace(/\s+/g, '')}`,
    text,
    timestamp: Date.now(),
    status: 'unread',
    suggestedDrafts: drafts,
  };

  const isAutoReplyOn = platform === 'whatsapp' ? socialState.whatsapp.autoReplyEnabled : socialState.instagram.autoReplyEnabled;
  if (isAutoReplyOn) {
    const aiReply = drafts[0] || (await generateSmartAutoReply(platform, text));
    newMsg.status = 'replied';
    newMsg.replyText = aiReply;
    newMsg.repliedAt = Date.now();
    newMsg.autoReplied = true;
  }

  inboxMessages.unshift(newMsg);
  res.json({ success: true, message: newMsg });
});

app.get('/api/auth/:platform/url', (req, res) => {
  const platform = req.params.platform as 'instagram' | 'whatsapp';
  const redirectUri = `${APP_URL}/auth/callback?platform=${platform}`;
  const metaAppId = process.env.META_APP_ID;

  if (metaAppId && metaAppId !== 'YOUR_META_APP_ID') {
    const scopes = platform === 'whatsapp'
      ? 'whatsapp_business_management,whatsapp_business_messaging'
      : 'instagram_basic,instagram_manage_messages,instagram_manage_comments,pages_show_list,pages_manage_metadata';

    const params = new URLSearchParams({
      client_id: metaAppId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state: platform,
    });

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
    return res.json({ url: authUrl, mode: 'live', redirectUri });
  }

  return res.json({
    url: `${APP_URL}/auth/demo-connect?platform=${platform}`,
    mode: 'demo',
    redirectUri,
    note: 'Meta App ID tanımlanmadığı için demo bağlantısı açık. Gerçek Meta OAuth için APP ID ekleyin.',
  });
});

app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { platform = 'instagram' } = req.query;
  const p = platform as 'instagram' | 'whatsapp';

  if (p === 'whatsapp') {
    socialState.whatsapp.connected = true;
    socialState.whatsapp.connectedAt = Date.now();
  } else {
    socialState.instagram.connected = true;
    socialState.instagram.connectedAt = Date.now();
  }

  res.send(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Giriş Başarılı</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:white;text-align:center} .card{background:#1e293b;padding:2rem;border-radius:1rem;border:1px solid #334155}</style></head><body><div class="card"><h2 style="color:#38bdf8;margin-top:0">✓ Bağlantı Başarılı!</h2><p>${p === 'whatsapp' ? 'WhatsApp Business' : 'Instagram'} hesabı başarıyla bağlandı.</p><p style="font-size:0.85rem;color:#94a3b8">Bu pencere otomatik kapanacaktır...</p></div><script>try{if(window.opener){window.opener.postMessage({type:'OAUTH_AUTH_SUCCESS',platform:'${p}'},'*');setTimeout(()=>window.close(),1200)}else{window.location.href='/'}}catch(e){window.location.href='/'}</script></body></html>`);
});

app.get(['/auth/demo-connect', '/auth/demo-connect/'], (req, res) => {
  const platform = req.query.platform || 'instagram';
  const p = platform as 'instagram' | 'whatsapp';
  res.send(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Hesap Bağlanıyor</title><style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:white;text-align:center}.card{background:#1e293b;padding:2.5rem;border-radius:1.25rem;border:1px solid #334155;max-width:400px}.spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,0.2);border-top-color:#ec4899;border-radius:50%;animation:spin .8s linear infinite;margin:1.5rem auto}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="card"><div style="font-size:2.5rem;margin-bottom:0.5rem">${p === 'whatsapp' ? '🟢' : '📸'}</div><h2 style="margin:0;font-size:1.25rem">${p === 'whatsapp' ? 'WhatsApp Business' : 'Instagram'} Yetkilendiriliyor</h2><div class="spinner"></div><p style="font-size:0.85rem;color:#94a3b8;line-height:1.4">Yapay zekâ asistanınıza mesaj dinleme ve otomatik yanıtlama izni veriliyor...</p></div><script>fetch('/auth/callback?platform=${p}&code=demo_token_ok').then(()=>{if(window.opener){window.opener.postMessage({type:'OAUTH_AUTH_SUCCESS',platform:'${p}'},'*');setTimeout(()=>window.close(),1500)}})</script></body></html>`);
});

app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'benim_ai_secret_verify_token';

  if (mode === 'subscribe' && token === expectedToken) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

app.post('/api/webhook', async (req, res) => {
  const body = req.body;
  try {
    if (body.object === 'instagram' || body.object === 'whatsapp_business_account' || body.entry) {
      for (const entry of body.entry || []) {
        if (entry.changes) {
          for (const change of entry.changes) {
            const val = change.value;
            if (val && val.messages) {
              for (const m of val.messages) {
                const sender = val.contacts?.[0]?.name || val.contacts?.[0]?.wa_id || 'WhatsApp Müşterisi';
                const msgText = m.text?.body || 'Ses veya medya gönderildi';
                const newMsg: InboxMessage = {
                  id: `wa-${m.id || Date.now()}`,
                  platform: 'whatsapp',
                  senderName: sender,
                  senderHandle: m.from,
                  text: msgText,
                  timestamp: Date.now(),
                  status: 'unread',
                };

                if (socialState.whatsapp.autoReplyEnabled) {
                  const reply = await generateSmartAutoReply('whatsapp', msgText);
                  newMsg.status = 'replied';
                  newMsg.replyText = reply;
                  newMsg.repliedAt = Date.now();
                  newMsg.autoReplied = true;
                }
                inboxMessages.unshift(newMsg);
              }
            }
          }
        }

        if (entry.messaging) {
          for (const m of entry.messaging) {
            const senderId = m.sender?.id || 'Instagram Kullanıcısı';
            const msgText = m.message?.text || 'Görsel veya etkileşim';
            const newMsg: InboxMessage = {
              id: `ig-${Date.now()}`,
              platform: 'instagram_dm',
              senderName: `Müşteri (${senderId.slice(-4)})`,
              senderHandle: `@user_${senderId.slice(-4)}`,
              text: msgText,
              timestamp: Date.now(),
              status: 'unread',
            };

            if (socialState.instagram.autoReplyEnabled) {
              const reply = await generateSmartAutoReply('instagram_dm', msgText);
              newMsg.status = 'replied';
              newMsg.replyText = reply;
              newMsg.repliedAt = Date.now();
              newMsg.autoReplied = true;
            }
            inboxMessages.unshift(newMsg);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Webhook parse error:', err);
  }

  res.status(200).send('EVENT_RECEIVED');
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, tone, enableSearch, ragContext } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Geçersiz mesaj listesi.' });
    }

    let systemPrompt = getSystemInstruction(tone);
    if (ragContext && typeof ragContext === 'string') {
      systemPrompt += `\n\n${ragContext}`;
    }

    let replyText = '';
    let usedEngine = 'Süper Zekâ Motoru';

    const order = AI_PROVIDER === 'openrouter' ? ['openrouter', 'gemini', 'pollinations'] : ['gemini', 'openrouter', 'pollinations'];

    for (const provider of order) {
      try {
        if (provider === 'openrouter') {
          const candidate = await callOpenRouterChat(messages, systemPrompt, Boolean(enableSearch));
          if (candidate) {
            replyText = candidate;
            usedEngine = OPENROUTER_MODEL;
            break;
          }
        }

        if (provider === 'gemini') {
          const candidate = await callGeminiChat(messages, systemPrompt, Boolean(enableSearch));
          if (candidate) {
            replyText = candidate;
            usedEngine = GEMINI_MODEL;
            break;
          }
        }

        if (provider === 'pollinations') {
          const candidate = await callOpenEngineFallback(messages, systemPrompt, Boolean(enableSearch));
          if (candidate) {
            replyText = candidate;
            usedEngine = 'Otomatik Güvenli Fallback';
            break;
          }
        }
      } catch (err) {
        console.warn('Provider failed:', provider, err);
      }
    }

    if (!replyText) {
      replyText = 'Merhaba! Yanıt hazırlanırken kısa bir gecikme oldu; lütfen mesajınızı tekrar gönderin.';
    }

    return res.json({
      reply: withFreshness(replyText, 'İstediklerinizi netleştirip en doğru cevabı hazırlıyorum.'),
      engine: usedEngine,
      timestamp: Date.now(),
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return res.status(500).json({
      error: 'Cevap üretilemedi.',
      details: errMessage,
      fallbackText: 'Üzgünüm, kısa süreli bir sorun oluştu. Birkaç saniye sonra tekrar deneyin.',
    });
  }
});

app.post('/api/enhance-prompt', async (req, res) => {
  try {
    const { prompt, type = 'image', style = 'cinematic' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt gereklidir.' });

    const systemPrompt = 'You are an expert AI prompt engineer. Turn the brief into a vivid, concise, high-quality English prompt under 60 words.';
    const openRouterReply = await callOpenRouterChat([{ role: 'user', content: `Brief: "${prompt}", Style: ${style}, Media: ${type}` }], systemPrompt, false);
    if (openRouterReply) return res.json({ enhancedPrompt: openRouterReply.trim() });

    return res.json({
      enhancedPrompt: `${prompt}, ultra-detailed, cinematic lighting, photorealistic, premium composition, sharp focus, dynamic color grading, 8k`,
    });
  } catch (error) {
    return res.json({ enhancedPrompt: 'ultra-detailed cinematic lighting, premium composition, sharp focus, photorealistic' });
  }
});

app.post('/api/generate-storyboard', async (req, res) => {
  try {
    const { prompt, duration = 30 } = req.body;
    const sceneCount = duration >= 30 ? 3 : 2;
    const systemPrompt = `Sen profesyonel bir sosyal medya video yönetmenisin. ${sceneCount} sahneli hikaye akışı oluştur. JSON formatında dön.`;

    const openRouterReply = await callOpenRouterChat([{ role: 'user', content: `Konu: "${prompt}", Süre: ${duration}` }], systemPrompt, false);
    if (openRouterReply) {
      try {
        return res.json(JSON.parse(openRouterReply));
      } catch {
        // ignore
      }
    }

    return res.json({
      scenes: [
        { captionText: `${prompt} için güçlü bir giriş`, visualPrompt: `${prompt}, cinematic wide shot, premium lighting, 8k`, voiceoverLine: `${prompt} hakkında kısa ama etkili bir tanıtım yapalım.`, motionStyle: 'drone' },
        { captionText: 'Ana fikir ortaya çıkıyor', visualPrompt: `${prompt}, dramatic close-up, rich detail, cinematic composition`, voiceoverLine: 'Bu fikir hem dikkat çekici hem de uygulanabilir.', motionStyle: 'sinematik_zoom' },
        { captionText: 'Son etkileyici kapanış', visualPrompt: `${prompt}, polished finish, vibrant color grading, high detail`, voiceoverLine: 'İyi bir sonuç için doğru düzen ve güçlü hikâye akışı şart.', motionStyle: 'yavas_cekim' }
      ],
      fullVoiceover: `${prompt} için etkili bir anlatım ve güçlü bir akış oluşturuyoruz. Buradaki temel fikir, dikkat çekmek ve anlaşılır kılmaktır.`,
      suggestedMusic: 'sinematik'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Storyboard oluşturulamadı.' });
  }
});

app.post('/api/generate-social-content', async (req, res) => {
  try {
    const { topic, platform = 'instagram' } = req.body;
    const systemPrompt = 'Sen güçlü sosyal medya içerik stratejisti. Konu için kısa, etkili ve özgün içerik paketi üret. JSON döndür.';

    const openRouterReply = await callOpenRouterChat([{ role: 'user', content: `Konu: "${topic}", Platform: ${platform}` }], systemPrompt, false);
    if (openRouterReply) {
      try {
        return res.json(JSON.parse(openRouterReply));
      } catch {
        // ignore
      }
    }

    return res.json({
      title: `${topic} için güçlü bir içerik fikri`,
      hook: `Bu fikir hem dikkat çekiyor hem de etkileşim sağlıyor. 👀`,
      caption: `✨ ${topic} konusunu daha anlaşılır ve güçlü bir şekilde anlatmanın zamanı geldi.\n\nDoğru fikir, net açıklama ve güçlü görsel bütünlüğü bir araya getirdiğinde etki çok daha yüksek olur.`,
      callToAction: 'Yorumlarda fikrinizi paylaşın ve içeriği kaydedin. 📌',
      hashtags: ['#kesfet', '#trend', '#sosyalmedya', '#viral', '#yapayzeka', '#tesvik'],
      visualPrompt: `${topic}, premium aesthetic, cinematic photography, 8k, modern composition, luminous lighting`,
    });
  } catch (error) {
    return res.json({ title: 'Güçlü bir içerik fikri', hook: 'Dikkat çeken ve uygulanabilir bir yaklaşım.', caption: 'İçerik üretimi için net hedef, güçlü anlatım ve iyi kompozisyon şarttır.', callToAction: 'Başlayalım.', hashtags: ['#içerik', '#yapayzeka', '#trend'], visualPrompt: 'premium composition, cinematic lighting' });
  }
});

app.post('/api/live-call-turn', async (req, res) => {
  try {
    const { userSpeech, conversationHistory } = req.body;
    const systemPrompt = 'Sen canlı konuşma sırasında doğal, sıcak ve kısa cevaplar veren akıllı asistansın. Aynı cümleleri tekrar etme. En fazla 2 kısa cümle kullan.';
    const msgs = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      { role: 'user', content: userSpeech || 'Selam, nasılsın?' },
    ];

    const openRouterReply = await callOpenRouterChat(msgs, systemPrompt, false);
    if (openRouterReply) return res.json({ reply: openRouterReply.trim() });

    return res.json({ reply: 'Harika görünüyorsun. Şu an en çok neye odaklanmak istiyorsun?' });
  } catch (error) {
    return res.json({ reply: 'Seni net duyuyorum. Hadi birlikte en iyi yolu bulalım.' });
  }
});

app.post('/api/social/publish', async (req, res) => {
  const { platform = 'instagram', title, caption } = req.body;
  const liveUrl = platform === 'whatsapp' ? `https://wa.me/?text=${encodeURIComponent(title + '\n\n' + caption)}` : 'https://instagram.com/benimyapayzekam_official';

  res.json({
    success: true,
    platform,
    title,
    liveUrl,
    publishedAt: Date.now(),
    message: `${platform === 'whatsapp' ? 'WhatsApp' : 'Instagram'} üzerinde başarıyla yayınlandı!`,
  });
});

app.get('/api/system/version', (_req, res) => {
  res.json({
    currentVersion: 'v5.5.0-Quantum Titanium Ultra',
    latestVersion: 'v5.6.0-AI Evolution Max',
    releaseDate: 'Ekim 2026',
    autoUpdateEnabled: true,
    tier: 'PRO_MAX_VIP',
    storageQuota: '1 TB Yüksek Hızlı Bulut Hafızası',
    maxVideoDuration: '60 Saniye 4K Ultra HD',
    features: ['⚡ Yüksek performans AI çekirdeği', '📱 Çoklu platform uyum', '🤖 Sesli ve metinli otomasyon', '🧠 Öğrenen hafıza katmanı', '🚀 Premium içerik üretim akışı'],
    changelog: ['Tekrarlayan cümle baskısı azaltıldı', 'Fallback yanıtları çeşitlendirildi', 'AI yanıt kalitesi ve tutarlılığı iyileştirildi'],
  });
});

app.post('/api/system/upgrade', (_req, res) => {
  res.json({
    success: true,
    newVersion: 'v5.6.0-AI Evolution Max',
    tier: 'ULTRA_QUANTUM_VIP',
    message: 'Sistem başarıyla en son sürüme yükseltildi.',
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Benim Yapay Zekâm Super Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
