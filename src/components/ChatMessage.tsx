import React, { useState } from 'react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  Bot,
  User,
  Cpu,
  Image as ImageIcon,
  Film,
  Brain
} from 'lucide-react';
import { Message } from '../types.ts';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';

interface ChatMessageProps {
  message: Message;
  isLastAssistant: boolean;
  onRegenerate?: () => void;
  speakingMessageId: string | null;
  onToggleSpeech: (messageId: string, text: string) => void;
  onSendToImageStudio?: (text: string) => void;
  onSendToVideoStudio?: (text: string) => void;
  searchQuery: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLastAssistant,
  onRegenerate,
  speakingMessageId,
  onToggleSpeech,
  onSendToImageStudio,
  onSendToVideoStudio,
  searchQuery,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isSpeaking = speakingMessageId === message.id;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const exactDateTooltip = new Date(message.timestamp).toLocaleString('tr-TR', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  if (isUser) {
    return (
      <div className="flex justify-end w-full group animate-fadeIn">
        <div className="flex items-end gap-2 max-w-[88%] sm:max-w-2xl">
          <div className="flex flex-col items-end">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-sm shadow-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </div>
            <div className="flex items-center gap-1.5 mt-1 px-1">
              <span className="text-[10px] text-slate-400 font-mono cursor-help" title={exactDateTooltip}>
                {formatTime(message.timestamp)}
              </span>
              <button
                onClick={handleCopy}
                title="Kopyala"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-slate-600"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mb-4 shadow-xs">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start w-full group animate-fadeIn">
      <div className="flex items-start gap-2.5 sm:gap-3 max-w-[94%] sm:max-w-3xl">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20 mt-1">
          <Bot className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </div>

        {/* Content Box */}
        <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 sm:p-4 text-sm shadow-xs leading-relaxed overflow-hidden animate-typing-light">
          {/* Header Info: Engine & Time */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 text-xs">Benim Yapay Zekâm</span>
              {message.engine && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                  <Cpu className="w-2.5 h-2.5 text-blue-500" />
                  {message.engine}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono cursor-help" title={exactDateTooltip}>
              {formatTime(message.timestamp)}
            </span>
          </div>

          {/* Recalled Memory RAG Banner */}
          {message.recalledMemories && message.recalledMemories.length > 0 && (
            <div className="mb-2.5 p-2 rounded-xl bg-purple-50/80 border border-purple-200/90 text-[11px] text-purple-900 flex items-start gap-1.5 shadow-2xs">
              <Brain className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-purple-950">🧠 RAG Belleğiyle Özelleştirildi: </span>
                <span className="text-purple-800">
                  {message.recalledMemories.join(' • ')}
                </span>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="text-slate-800">
            <MarkdownRenderer content={message.content} searchQuery={searchQuery} />
          </div>

          {/* Action Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              {/* Copy */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition active:scale-95"
                title="Cevabı Kopyala"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopyala</span>
                  </>
                )}
              </button>

              {/* Text-to-speech */}
              <button
                onClick={() => onToggleSpeech(message.id, message.content)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition active:scale-95 ${
                  isSpeaking
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
                title={isSpeaking ? 'Seslendirmeyi Durdur' : 'Sesli Oku (Türkçe)'}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 animate-pulse text-blue-600" />
                    <span>Durdur</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Sesli Dinle</span>
                  </>
                )}
              </button>
            </div>

            {/* Multimedia quick creators */}
            <div className="flex items-center gap-1.5">
              {onSendToImageStudio && (
                <button
                  onClick={() => onSendToImageStudio(message.content.slice(0, 150))}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold transition active:scale-95"
                  title="Bu cevaptan 4K görsel üret"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Fotoğrafını Üret</span>
                </button>
              )}

              {onSendToVideoStudio && (
                <button
                  onClick={() => onSendToVideoStudio(message.content.slice(0, 150))}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-semibold transition active:scale-95"
                  title="Bu cevaptan sinematik video üret"
                >
                  <Film className="w-3 h-3" />
                  <span>Videosunu Yap</span>
                </button>
              )}

              {/* Regenerate if last assistant message */}
              {isLastAssistant && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition active:scale-95"
                  title="Farklı bir yanıt oluştur"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tekrar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
