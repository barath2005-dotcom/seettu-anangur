import React, { useState } from 'react';
import { formatINR, formatKolkataDate, translations, SupportedLanguage } from '@seettu/shared';
import { Printer, X, ShieldCheck, Share2, Download, Loader2, Check, AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface ReceiptModalProps {
  payment: any;
  onClose: () => void;
  lang?: SupportedLanguage;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose, lang = 'en' }) => {
  if (!payment) return null;
  const t = translations[lang];

  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Helper to generate a crisp, standalone PDF of the official receipt
  const generatePdfBlob = async (): Promise<{ base64Data: string; fileName: string; dataUri: string }> => {
    const isTa = lang === 'ta';
    const memberName = payment.memberName || payment.member?.fullName || '-';
    const memberNumber = payment.memberNumber || payment.member?.memberNumber || '-';
    const schemeName = payment.schemeName || payment.scheme?.name || '-';
    const roundNumber = payment.roundNumber || '-';
    const txnId = payment.transactionId || '-';
    const receiptNo = payment.receiptNumber || 'REC';
    const paymentDateFormatted = formatKolkataDate(payment.paymentDate, true);
    const amountFormatted = formatINR(payment.amountReceivedPaise, true);
    const paymentMethod = payment.paymentMethod || 'CASH';
    const externalRef = payment.externalReference || '';
    const installmentDue = formatINR(payment.amountDuePaise || 0);
    const balanceRemaining = formatINR(payment.balanceRemainingPaise || 0);
    const isBalanceClear = (payment.balanceRemainingPaise || 0) <= 0;
    const sanitizedReceiptNo = receiptNo.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Receipt_${sanitizedReceiptNo}.pdf`;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${receiptNo} - ${memberName}</title>
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Tamil", Arial, sans-serif;
      margin: 0; padding: 20px; background: #ffffff; color: #172033;
    }
    .receipt-container {
      max-width: 580px; margin: 0 auto; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 24px; background: #ffffff;
    }
    .header {
      display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px;
    }
    .brand-title {
      font-size: 18px; font-weight: 800; color: #172033; margin: 0; line-height: 1.3;
    }
    .brand-sub {
      font-size: 11px; color: #64748b; margin: 3px 0 0 0;
    }
    .badge {
      display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; text-transform: uppercase;
    }
    .receipt-num {
      font-family: monospace; font-size: 13px; font-weight: 700; color: #475569; margin-top: 5px; text-align: right;
    }
    .grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; font-size: 12px;
    }
    .label {
      font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 3px;
    }
    .val {
      font-weight: 700; color: #0f172a; margin: 0; font-size: 13px;
    }
    .sub-val {
      font-size: 11px; color: #64748b; font-family: monospace; margin: 2px 0 0 0;
    }
    .amount-card {
      margin: 16px 0; padding: 14px 18px; border-radius: 12px; background: #eff6ff; border: 1px solid #bfdbfe; display: flex; justify-content: space-between; align-items: center;
    }
    .amount-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1d4ed8; margin-bottom: 3px;
    }
    .amount-val {
      font-size: 24px; font-weight: 900; color: #2563eb;
    }
    .amount-method {
      text-align: right; font-size: 12px; color: #475569;
    }
    .method-tag {
      font-weight: 800; color: #1e293b;
    }
    .balance-row {
      display: flex; justify-content: space-between; font-size: 12px; padding: 7px 4px; color: #475569; border-bottom: 1px solid #f1f5f9;
    }
    .balance-val {
      font-weight: 700;
    }
    .balance-clear {
      color: #16a34a;
    }
    .balance-due {
      color: #d97706;
    }
    .footer {
      margin-top: 20px; padding-top: 14px; border-top: 1.5px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end;
    }
    .footer-note {
      font-size: 10px; color: #94a3b8; max-width: 280px; line-height: 1.4;
    }
    .signature-box {
      text-align: center;
    }
    .signature-line {
      width: 130px; border-bottom: 1.5px solid #94a3b8; margin-bottom: 5px;
    }
    .signature-text {
      font-size: 11px; font-weight: 600; color: #475569;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div>
        <h1 class="brand-title">${t.appName}</h1>
        <p class="brand-sub">${t.appSubtitle}</p>
      </div>
      <div style="text-align: right;">
        <span class="badge">${t.officialReceipt}</span>
        <div class="receipt-num">${receiptNo}</div>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="label">${t.txnReference}</div>
        <div class="val" style="font-family: monospace; font-size: 12px;">${txnId}</div>
      </div>
      <div>
        <div class="label">${isTa ? 'செலுத்திய தேதி' : 'Payment Date'}</div>
        <div class="val">${paymentDateFormatted}</div>
      </div>
      <div>
        <div class="label">${t.fullName}</div>
        <div class="val">${memberName}</div>
        <div class="sub-val">${t.memberId}: ${memberNumber}</div>
      </div>
      <div>
        <div class="label">${t.schemes}</div>
        <div class="val">${schemeName}</div>
        <div class="sub-val">${t.roundNumber}: #${roundNumber}</div>
      </div>
    </div>

    <div class="amount-card">
      <div>
        <div class="amount-title">${t.amountReceived}</div>
        <div class="amount-val">${amountFormatted}</div>
      </div>
      <div class="amount-method">
        <div>${t.paymentMethod}: <span class="method-tag">${paymentMethod}</span></div>
        ${externalRef ? `<div style="font-size: 10px; font-family: monospace; color: #64748b; margin-top: 3px;">Ref: ${externalRef}</div>` : ''}
      </div>
    </div>

    <div class="balance-row">
      <span>${t.roundInstallmentDue}:</span>
      <span class="balance-val">${installmentDue}</span>
    </div>
    <div class="balance-row">
      <span>${t.remainingBalance}:</span>
      <span class="balance-val ${isBalanceClear ? 'balance-clear' : 'balance-due'}">${balanceRemaining}</span>
    </div>

    <div class="footer">
      <div class="footer-note">
        <div style="color: #16a34a; font-weight: 700; margin-bottom: 2px;">✓ ${isTa ? 'சரிபார்க்கப்பட்ட ரசீது' : 'Digitally verified receipt'}</div>
        <div>${isTa ? 'தமிழ்நாடு / இந்திய நேர மண்டலத்தின் கீழ் உருவாக்கப்பட்ட அதிகாரப்பூர்வ ரசீது.' : 'System generated receipt under Asia/Kolkata jurisdiction.'}</div>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-text">${t.authorizedSignatory}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '600px';
    container.style.backgroundColor = '#ffffff';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    const html2pdfModule = (await import('html2pdf.js')).default;
    const opt = {
      margin: 8,
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm' as const, format: 'a5' as const, orientation: 'portrait' as const },
    };

    const pdfDataUri: string = await html2pdfModule()
      .set(opt)
      .from(container)
      .outputPdf('datauristring');

    document.body.removeChild(container);
    const base64Data = pdfDataUri.split(',')[1];
    return { base64Data, fileName, dataUri: pdfDataUri };
  };

  // Primary Native Action: Native Share sheet (WhatsApp, Gmail, Print, Files)
  const handleShareReceipt = async () => {
    try {
      setIsGenerating(true);
      setFeedback(null);
      const { base64Data, fileName } = await generatePdfBlob();

      if (Capacitor.isNativePlatform()) {
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({
          title: `${t.officialReceipt} - ${payment.receiptNumber || ''}`,
          text: `${t.appName} - ${t.officialReceipt}: ${payment.receiptNumber || ''}\n${payment.memberName || payment.member?.fullName || ''} (${formatINR(payment.amountReceivedPaise, true)})`,
          url: savedFile.uri,
          dialogTitle: lang === 'ta' ? 'ரசீதைப் பகிரவும்' : 'Share Official Receipt',
        });
        setFeedback({ text: lang === 'ta' ? 'ரசீது பகிரப்பட்டது!' : 'Receipt ready to share!', type: 'success' });
      } else if (navigator.share) {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new File([byteArray], fileName, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${t.officialReceipt} - ${payment.receiptNumber}`,
            text: `${t.appName} - ${t.officialReceipt}`,
          });
          setFeedback({ text: lang === 'ta' ? 'ரசீது பகிரப்பட்டது!' : 'Receipt shared!', type: 'success' });
          return;
        }
        await handleDownloadPdf();
      } else {
        await handleDownloadPdf();
      }
    } catch (err: any) {
      console.error('Failed to share receipt:', err);
      if (!err?.message?.includes('canceled') && !err?.message?.includes('cancelled')) {
        setFeedback({ text: lang === 'ta' ? 'பகிர்வதில் பிழை ஏற்பட்டது' : 'Failed to share receipt', type: 'error' });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Secondary Action: Download / Save PDF
  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      setFeedback(null);
      const { base64Data, fileName, dataUri } = await generatePdfBlob();

      if (Capacitor.isNativePlatform()) {
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });
        await Share.share({
          title: fileName,
          url: savedFile.uri,
          dialogTitle: lang === 'ta' ? 'ரசீதைச் சேமிக்க' : 'Save Receipt',
        });
        setFeedback({ text: lang === 'ta' ? 'PDF தயாராக உள்ளது!' : 'PDF ready!', type: 'success' });
      } else {
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setFeedback({ text: lang === 'ta' ? 'PDF பதிவிறக்கப்பட்டது!' : 'PDF downloaded!', type: 'success' });
      }
    } catch (err: any) {
      console.error('Failed to download PDF:', err);
      setFeedback({ text: lang === 'ta' ? 'PDF உருவாக்குவதில் பிழை' : 'Failed to generate PDF', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Print Action (Safely falls back to Share/Print on native Android)
  const handlePrint = () => {
    if (Capacitor.isNativePlatform()) {
      handleShareReceipt();
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-black/60 sm:p-4 backdrop-blur-sm overflow-hidden">
      <div className="bg-white w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[92vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border-0 sm:border border-slate-200">
        {/* Modal Action Bar */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-200 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.officialReceipt}</span>
            {feedback && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  feedback.type === 'success'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}
              >
                {feedback.type === 'success' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {feedback.text}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Native APK Primary Action: Share / WhatsApp */}
            {Capacitor.isNativePlatform() ? (
              <>
                <button
                  type="button"
                  onClick={handleShareReceipt}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-emerald-600 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                  title={lang === 'ta' ? 'வாட்ஸ்அப் அல்லது பிற வழிகளில் ரசீதைப் பகிரவும்' : 'Share receipt via WhatsApp / Print / Files'}
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  <span>{lang === 'ta' ? 'பகிர் / WhatsApp' : 'Share Receipt'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  title={lang === 'ta' ? 'PDF பதிவிறக்கு' : 'Download PDF'}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">PDF</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  title={lang === 'ta' ? 'PDF பதிவிறக்கு' : 'Download PDF'}
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden xs:inline">PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2F7BFF] hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">{t.printReceipt}</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Area */}
        <div className="p-4 sm:p-8 printable-receipt bg-white text-slate-800 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logo.jpg"
                  alt="ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு Logo"
                  className="w-12 h-12 rounded-xl object-cover border-2 border-amber-300 shadow-sm"
                  crossOrigin="anonymous"
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
              <span className="text-xs text-slate-400 block uppercase">{lang === 'ta' ? 'செலுத்திய தேதி' : 'Payment Date'}</span>
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
