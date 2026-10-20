import React from 'react';
import { Sparkles, MessageSquareHeart, Lightbulb, ChefHat, Code2, PenTool, Compass, Smartphone } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
  onOpenHomeScreen?: () => void;
}

interface PromptCard {
  icon: React.ReactNode;
  category: string;
  title: string;
  prompt: string;
  color: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectPrompt, onOpenHomeScreen }) => {
  const promptCards: PromptCard[] = [
    {
      icon: <Lightbulb className="w-4 h-4 text-amber-600" />,
      category: 'Fikir & Üretkenlik',
      title: 'İlginç proje veya iş fikirleri',
      prompt: 'Evden çalışarak veya yan gelir olarak yapılabilecek 3 yaratıcı dijital proje fikri öner.',
      color: 'bg-amber-50 hover:bg-amber-100/80 border-amber-200/80 text-amber-900',
    },
    {
      icon: <ChefHat className="w-4 h-4 text-emerald-600" />,
      category: 'Mutfak & Pratik Tarif',
      title: 'Hızlı ve lezzetli akşam yemeği',
      prompt: 'Evde pratik malzemelerle 20 dakikada yapabileceğim nefis ve doyurucu bir tarif ver.',
      color: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200/80 text-emerald-900',
    },
    {
      icon: <PenTool className="w-4 h-4 text-blue-600" />,
      category: 'Yazı & E-posta',
      title: 'Kibar ve etkili e-posta taslağı',
      prompt: 'Müşteriye teklifin durumunu nezaketle hatırlatan profesyonel bir e-posta taslağı yazar mısın?',
      color: 'bg-blue-50 hover:bg-blue-100/80 border-blue-200/80 text-blue-900',
    },
    {
      icon: <Code2 className="w-4 h-4 text-purple-600" />,
      category: 'Kodlama & Yazılım',
      title: 'Yazılım mantığı ve örnek kod',
      prompt: 'Python ile kullanıcıdan alınan iki sayıyı toplayıp ortalamasını bulan basit ve açıklamalı bir program yaz.',
      color: 'bg-purple-50 hover:bg-purple-100/80 border-purple-200/80 text-purple-900',
    },
    {
      icon: <Compass className="w-4 h-4 text-indigo-600" />,
      category: 'Öğrenme & Bilim',
      title: 'Karmaşık bir konuyu kolayca anla',
      prompt: 'Kuantum fiziği tam olarak nedir? 10 yaşındaki meraklı bir çocuğa anlatır gibi basit örneklerle açıkla.',
      color: 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-200/80 text-indigo-900',
    },
    {
      icon: <MessageSquareHeart className="w-4 h-4 text-rose-600" />,
      category: 'Sohbet & Tavsiye',
      title: 'Günün motivasyonu ve tavsiyesi',
      prompt: 'Bugün biraz yorgun ve moralsizim. Bana moral verecek, içimi rahatlatacak samimi birkaç cümle söyler misin?',
      color: 'bg-rose-50 hover:bg-rose-100/80 border-rose-200/80 text-rose-900',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 max-w-3xl mx-auto w-full text-center">
      {/* Hero Badge & PWA Install Button */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Sıfır Kurulum • Doğrudan Çalışır
        </div>

        {onOpenHomeScreen && (
          <button
            onClick={onOpenHomeScreen}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-indigo-700 border border-indigo-200/80 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
            <span>📱 Ana Ekrana Ekle (Uygulama Yap)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-indigo-600 text-white">YENİ</span>
          </button>
        )}
      </div>

      {/* Main Avatar */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 mb-4 transform hover:scale-105 transition-transform duration-300">
        <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
      </div>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight">
        Merhaba! Ben <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">"Benim Yapay Zekâm"</span>
      </h2>

      {/* Subtitle */}
      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
        Google Cloud veya API anahtarı karmaşası yok. Aşağıdaki kutuya doğrudan mesajınızı yazın veya hazır önerilerden birini seçin!
      </p>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
        {promptCards.map((card, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(card.prompt)}
            className={`p-3 rounded-xl border text-left transition-all duration-200 hover:shadow-sm active:scale-[0.99] flex items-start gap-2.5 group ${card.color}`}
          >
            <div className="mt-0.5 p-1.5 rounded-lg bg-white/80 shadow-xs group-hover:scale-110 transition-transform">
              {card.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wider font-semibold opacity-75">
                {card.category}
              </div>
              <div className="text-xs font-medium text-slate-900 truncate">
                {card.title}
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                {card.prompt}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
