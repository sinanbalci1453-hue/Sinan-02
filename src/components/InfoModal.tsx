import React from 'react';
import { X, CheckCircle2, ShieldCheck, Zap, Sparkles, Smartphone, Download } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              "Benim Yapay Zekâm" Nasıl Çalışır?
            </h3>
            <p className="text-xs text-emerald-600 font-medium">
              Sıfır Kurulum • Anahtar & Şifre Gerektirmez
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-xl text-blue-900 space-y-1.5">
            <h4 className="font-semibold flex items-center gap-1.5 text-blue-950">
              <Zap className="w-4 h-4 text-blue-600" />
              Neden API Anahtarı Gerekmiyor?
            </h4>
            <p className="text-xs leading-relaxed text-blue-800">
              Normalde Google AI Studio, kullanıcıdan karmaşık Google Cloud projesi, kart bilgisi ve izin ayarları ister.
              Mobilde veya kurumsal hesaplarda bu butonlar taşabilir veya hata verebilir.
              Bu uygulamada tüm bağlantı köprüsü <strong>arka planda hazır ve otomatik</strong> yapılandırılmıştır.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
              Öne Çıkan Özellikler:
            </h4>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Doğrudan Türkçe Cevap:</strong>
                <p className="text-xs text-slate-500">
                  Herhangi bir kurulum veya mavi kutuya anahtar yapıştırma zorunluluğu yoktur. "Merhaba" yazıp hemen başlayabilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Sesli Sohbet & Mikrofon:</strong>
                <p className="text-xs text-slate-500">
                  Mikrofon butonuna basarak sesli mesaj gönderebilir, asistanın cevaplarını Türkçe seslendirme ile dinleyebilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Yedekli ve Kesintisiz Altyapı:</strong>
                <p className="text-xs text-slate-500">
                  Google Gemini motoruna ek olarak açık yapay zekâ yedekleme motoru bulunur. Asla yarı yolda bırakmaz.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                ⚡
              </div>
              <div className="flex-1">
                <strong className="text-slate-800">Akıllı Çevrimdışı Modu:</strong>
                <p className="text-xs text-slate-500">
                  İnternet koptuğunda sistem sizi anında uyarır. Medya kasası, kayıtlı RAG anıları ve taslaklar çevrimdışı çalışmaya devam eder.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Download className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Mobil Uygulama & Ana Ekran (PWA):</strong>
                <p className="text-xs text-slate-500">
                  Uygulamayı tarayıcı çubukları olmadan, iOS Safari veya Android Chrome üzerinden doğrudan telefonunuzun ana ekranına ekleyebilirsiniz.
                </p>
              </div>
            </div>

            {/* Migration / Export Guide Section */}
            <div className="mt-4 p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-indigo-950 space-y-2">
              <h4 className="font-bold flex items-center gap-1.5 text-indigo-900 text-xs sm:text-sm">
                🚀 Bu Uygulamayı Başka Bir Yapay Zekâ Asistanına / Platformuna Nasıl Taşırısınız?
              </h4>
              <p className="text-xs leading-relaxed text-indigo-900">
                Bu projeyi (React + Vite + TypeScript + Tailwind CSS) başka bir yapay zekâ kodlama aracına veya platformuna (Cursor, Replit, Claude Code, v0, GitHub Copilot) kolayca taşıyabilirsiniz:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-xs text-indigo-900">
                <li><strong>Kaynak Kod Arşivi:</strong> AI Studio projesindeki tüm dosyaları (src/, server.ts, package.json, vite.config.ts) bir ZIP arşivi olarak indirin.</li>
                <li><strong>GitHub Deposu:</strong> Kodları yeni bir GitHub deposuna yükleyin (push edin). Ardından Cursor veya Replit ile repoyu içe aktararak geliştirmeye kaldığınız yerden devam edin.</li>
                <li><strong>Canlı Dağıtım (Vercel / Netlify):</strong> Projeyi Vercel veya Netlify'a bağlayarak tek tıkla canlı web URL'si edinebilirsiniz.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition active:scale-95 shadow-sm"
          >
            Anladım, Sohbete Başla
          </button>
        </div>
      </div>
    </div>
  );
};
