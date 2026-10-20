/**
 * Voice Command Recognition & Speech Synthesis Service
 * Provides hands-free voice control across the application in Turkish (tr-TR).
 */

export interface VoiceCommandAction {
  type:
    | 'switch_tab'
    | 'send_message'
    | 'start_live_call'
    | 'open_memory'
    | 'upgrade_system'
    | 'open_evolution'
    | 'open_homescreen'
    | 'new_chat'
    | 'unknown';
  payload?: any;
  confidence: number;
  matchedPhrase: string;
  feedbackText: string;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

class VoiceCommandService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isListening: boolean = false;
  private onStateChangeCallback: ((state: VoiceState) => void) | null = null;
  private onTranscriptCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onCommandCallback: ((action: VoiceCommandAction) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'tr-TR';
        this.isSupported = true;
        this.setupListeners();
      }
    }
  }

  public checkSupport(): boolean {
    return this.isSupported;
  }

  public setCallbacks(
    onStateChange: (state: VoiceState) => void,
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onCommand: (action: VoiceCommandAction) => void
  ) {
    this.onStateChangeCallback = onStateChange;
    this.onTranscriptCallback = onTranscript;
    this.onCommandCallback = onCommand;
  }

  private setupListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStateChangeCallback?.('listening');
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        this.onStateChangeCallback?.('error');
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onStateChangeCallback?.('idle');
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeText = (finalTranscript || interimTranscript).trim();
      if (activeText) {
        this.onTranscriptCallback?.(activeText, Boolean(finalTranscript));
      }

      if (finalTranscript) {
        this.processVoiceCommand(finalTranscript.trim());
      }
    };
  }

  public startListening() {
    if (!this.recognition) {
      this.onStateChangeCallback?.('error');
      return;
    }
    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Speech recognition start failed or already active:', e);
    }
  }

  public stopListening() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
      this.isListening = false;
      this.onStateChangeCallback?.('idle');
    } catch (e) {
      // ignore
    }
  }

  public toggleListening(): boolean {
    if (this.isListening) {
      this.stopListening();
      return false;
    } else {
      this.startListening();
      return true;
    }
  }

  /**
   * Parse Turkish spoken utterance into structured actions
   */
  public parseUtterance(raw: string): VoiceCommandAction {
    const text = raw.toLowerCase().trim();

    // 1. Photo Studio / Fotoğraf çekme
    if (
      text.includes('fotoğraf') ||
      text.includes('fotograf') ||
      text.includes('resim yap') ||
      text.includes('görsel yap') ||
      text.includes('foto stüdyo') ||
      text.includes('resim stüdyo') ||
      text.includes('foto çek')
    ) {
      return {
        type: 'switch_tab',
        payload: 'image',
        confidence: 0.95,
        matchedPhrase: 'Fotoğraf Stüdyosu',
        feedbackText: 'Fotoğraf Stüdyosu açılıyor...',
      };
    }

    // 2. Video Studio / Reels üretme
    if (
      text.includes('video') ||
      text.includes('reels') ||
      text.includes('kurgu') ||
      text.includes('film') ||
      text.includes('video stüdyo')
    ) {
      return {
        type: 'switch_tab',
        payload: 'video',
        confidence: 0.95,
        matchedPhrase: 'Video Stüdyosu',
        feedbackText: 'Video & Reels Stüdyosu açılıyor...',
      };
    }

    // 3. Social Media & Instagram / WhatsApp
    if (
      text.includes('sosyal') ||
      text.includes('instagram') ||
      text.includes('whatsapp') ||
      text.includes('gelen kutusu') ||
      text.includes('mesaj dinle') ||
      text.includes('dm')
    ) {
      return {
        type: 'switch_tab',
        payload: 'social',
        confidence: 0.95,
        matchedPhrase: 'Sosyal Medya & WhatsApp',
        feedbackText: 'Sosyal Medya Merkezi açılıyor...',
      };
    }

    // 4. Media Vault / Depo / Galeri
    if (
      text.includes('depo') ||
      text.includes('galeri') ||
      text.includes('kasa') ||
      text.includes('hafıza deposu') ||
      text.includes('medya')
    ) {
      return {
        type: 'switch_tab',
        payload: 'vault',
        confidence: 0.95,
        matchedPhrase: 'Medya Deposu',
        feedbackText: 'Medya Kasası açılıyor...',
      };
    }

    // 5. Autopilot Studio
    if (text.includes('otopilot') || text.includes('otomatik paylaşım')) {
      return {
        type: 'switch_tab',
        payload: 'autopilot',
        confidence: 0.95,
        matchedPhrase: 'Sosyal Otopilot',
        feedbackText: 'Otopilot Stüdyosu açılıyor...',
      };
    }

    // 6. Live Call / Canlı arama
    if (
      text.includes('canlı ara') ||
      text.includes('görüntülü ara') ||
      text.includes('görüntülü konuş') ||
      text.includes('canlı konuş') ||
      text.includes('arama başlat')
    ) {
      return {
        type: 'start_live_call',
        confidence: 0.95,
        matchedPhrase: 'Canlı Görüşme Başlat',
        feedbackText: 'Canlı görüntülü görüşme başlatılıyor...',
      };
    }

    // 7. Learning Memory / RAG
    if (
      text.includes('bellek') ||
      text.includes('hafıza') ||
      text.includes('rag') ||
      text.includes('anı ara') ||
      text.includes('ne öğrendin')
    ) {
      return {
        type: 'open_memory',
        confidence: 0.95,
        matchedPhrase: 'Öğrenen Bellek & Anılar',
        feedbackText: 'Öğrenen Bellek ve Anı Merkezi açılıyor...',
      };
    }

    // 8. System Upgrade / Sürüm Yenile
    if (
      text.includes('yükselt') ||
      text.includes('güncelle') ||
      text.includes('sürüm') ||
      text.includes('kendini yenile') ||
      text.includes('titanium')
    ) {
      return {
        type: 'upgrade_system',
        confidence: 0.95,
        matchedPhrase: 'Sürüm Yükseltme',
        feedbackText: 'Sistem en üst sürüme yükseltiliyor...',
      };
    }

    // 9. New Chat / Yeni sohbet başlat
    if (
      text.includes('yeni sohbet') ||
      text.includes('sohbeti temizle') ||
      text.includes('baştan başla')
    ) {
      return {
        type: 'new_chat',
        confidence: 0.95,
        matchedPhrase: 'Yeni Sohbet',
        feedbackText: 'Yeni sohbet başlatılıyor...',
      };
    }

    // 10. Home Screen / PWA App Install
    if (
      text.includes('ana ekrana ekle') ||
      text.includes('uygulamayı yükle') ||
      text.includes('uygulama yap') ||
      text.includes('uygulama olarak ekle') ||
      text.includes('telefona ekle') ||
      text.includes('ana ekranında gör')
    ) {
      return {
        type: 'open_homescreen',
        confidence: 0.95,
        matchedPhrase: 'Ana Ekrana Ekle',
        feedbackText: 'Ana ekrana uygulama yükleme paneli açılıyor...',
      };
    }

    // 10. Switch to Chat / Sohbet aç
    if (
      text.includes('sohbet') ||
      text.includes('mesajlara dön') ||
      text.includes('yazışma') ||
      text.includes('ana ekran')
    ) {
      return {
        type: 'switch_tab',
        payload: 'chat',
        confidence: 0.95,
        matchedPhrase: 'Sohbet Ekranı',
        feedbackText: 'Sohbet ekranına dönülüyor...',
      };
    }

    // 11. Send Question directly / "soru sor ...", "yapay zeka ...", "bana ... yaz"
    if (
      text.startsWith('soru') ||
      text.startsWith('sor') ||
      text.startsWith('bana') ||
      text.startsWith('yaz') ||
      text.startsWith('nasıl') ||
      text.length > 5
    ) {
      const cleanPrompt = text
        .replace(/^(soru sor|soru|sor|bana|lütfen)\s*/i, '')
        .trim();

      if (cleanPrompt.length >= 3) {
        return {
          type: 'send_message',
          payload: cleanPrompt || text,
          confidence: 0.85,
          matchedPhrase: `Soru Gönderiliyor: "${cleanPrompt.slice(0, 30)}..."`,
          feedbackText: 'Sorunuz yapay zekâya iletiliyor...',
        };
      }
    }

    return {
      type: 'unknown',
      confidence: 0.3,
      matchedPhrase: raw,
      feedbackText: 'Komut anlaşılamadı. "Fotoğraf stüdyosu", "Sohbet", "Instagram" gibi komutlar söyleyebilirsiniz.',
    };
  }

  public processVoiceCommand(utterance: string) {
    const action = this.parseUtterance(utterance);
    this.onCommandCallback?.(action);

    // Speak quick feedback
    this.speakConfirmation(action.feedbackText);
  }

  public speakConfirmation(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis feedback error:', e);
    }
  }
}

export const voiceCommandService = new VoiceCommandService();
