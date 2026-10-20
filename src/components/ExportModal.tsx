import React from 'react';
import { X, FileText, FileJson, FileType } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'txt' | 'json' | 'pdf') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-lg text-slate-900 mb-4">Sohbeti Dışa Aktar</h3>
        <p className="text-sm text-slate-500 mb-6">Lütfen tercih ettiğiniz formatı seçin:</p>
        
        <div className="space-y-3">
          <button onClick={() => onExport('txt')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition">
            <FileText className="w-5 h-5 text-slate-500" />
            <span className="font-semibold text-sm">Metin Dosyası (.txt)</span>
          </button>
          <button onClick={() => onExport('json')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition">
            <FileJson className="w-5 h-5 text-slate-500" />
            <span className="font-semibold text-sm">Veri Dosyası (.json)</span>
          </button>
          <button onClick={() => onExport('pdf')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition">
            <FileType className="w-5 h-5 text-slate-500" />
            <span className="font-semibold text-sm">PDF Belgesi (.pdf)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
