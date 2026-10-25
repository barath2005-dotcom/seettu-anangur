import React from 'react';
import { formatINR, formatKolkataDate, translations, SupportedLanguage } from '@seettu/shared';
import { Printer, X, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  payment: any;
  onClose: () => void;
  lang?: SupportedLanguage;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose, lang = 'en' }) => {
  if (!payment) return null;
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Action Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between no-print">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.officialReceipt}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2F7BFF] hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              {t.printReceipt}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 printable-receipt bg-white text-slate-800">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logo.jpg"
                  alt="ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு Logo"
                  className="w-12 h-12 rounded-xl object-cover border-2 border-amber-300 shadow-sm"
                />
                <div>
                  <h2 className="text-xl font-bold text-[#172033]">{t.appName}</h2>
                  <p className="text-xs text-slate-500">{t.appSubtitle}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {t.officialReceipt}
              </span>
              <p className="text-xs font-mono font-medium text-slate-600 mt-1">{payment.receiptNumber}</p>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-sm">
            <div>
              <span className="text-xs text-slate-400 block uppercase">{t.txnReference}</span>
              <span className="font-mono font-semibold text-slate-700">{payment.transactionId}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block uppercase">{t.dueDate}</span>
              <span className="font-medium text-slate-700">{formatKolkataDate(payment.paymentDate, true)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block uppercase">{t.fullName}</span>
              <p className="font-bold text-slate-900">{payment.memberName || payment.member?.fullName}</p>
              <p className="text-xs text-slate-500 font-mono">ID: {payment.memberNumber || payment.member?.memberNumber}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 block uppercase">{t.schemes}</span>
              <p className="font-bold text-slate-900">{payment.schemeName || payment.scheme?.name}</p>
              <p className="text-xs text-slate-500 font-medium">{t.roundNumber}: #{payment.roundNumber}</p>
            </div>
          </div>

          {/* Amount Box */}
          <div className="my-5 p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-700 uppercase">{t.amountReceived}</span>
              <div className="text-3xl font-extrabold text-[#2F7BFF]">
                {formatINR(payment.amountReceivedPaise, true)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-600">
              <span className="block font-medium">{t.paymentMethod}: <strong className="text-slate-800">{payment.paymentMethod}</strong></span>
              {payment.externalReference && (
                <span className="block text-slate-500 font-mono text-[11px] mt-0.5">Ref: {payment.externalReference}</span>
              )}
            </div>
          </div>

          {/* Balance Remaining Info */}
          <div className="flex justify-between items-center text-xs py-2 px-1 text-slate-600 border-b border-slate-100">
            <span>{t.roundInstallmentDue}:</span>
            <span className="font-semibold">{formatINR(payment.amountDuePaise)}</span>
          </div>
          <div className="flex justify-between items-center text-xs py-2 px-1 text-slate-600 border-b border-slate-100">
            <span>{t.remainingBalance}:</span>
            <span className={`font-semibold ${payment.balanceRemainingPaise > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatINR(payment.balanceRemainingPaise)}
            </span>
          </div>

          {/* Footer & Signature */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex items-end justify-between">
            <div className="text-[11px] text-slate-400 max-w-[240px]">
              <p className="flex items-center gap-1 text-emerald-600 font-medium mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> {lang === 'ta' ? 'சரிபார்க்கப்பட்ட ரசீது' : 'Digitally verified receipt'}
              </p>
              <p>{lang === 'ta' ? 'தமிழ்நாடு / இந்திய நேர மண்டலத்தின் கீழ் கணினி மூலம் உருவாக்கப்பட்ட அதிகாரப்பூர்வ ரசீது.' : 'System generated document for recordkeeping purposes under Asia/Kolkata jurisdiction.'}</p>
            </div>
            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <span className="text-xs font-medium text-slate-600">{t.authorizedSignatory}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
