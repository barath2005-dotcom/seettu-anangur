import React, { useState } from 'react';
import { Download, RefreshCw, CheckCircle2, Sparkles, X, ShieldCheck, ArrowRight, Smartphone } from 'lucide-react';
import { CURRENT_APP_VERSION, AppUpdateInfo, downloadAndInstallApk } from '../services/appUpdate';

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: AppUpdateInfo | null;
  lang: 'en' | 'ta';
  isChecking?: boolean;
  onCheckAgain?: () => void;
}

export function AppUpdateModal({
  isOpen,
  onClose,
  updateInfo,
  lang,
  isChecking = false,
  onCheckAgain,
}: AppUpdateModalProps) {
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen) return null;

  const hasUpdate = updateInfo?.hasUpdate ?? false;

  const handleDownload = () => {
    setDownloadStarted(true);
    downloadAndInstallApk(updateInfo?.apkUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#0E1726] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              {hasUpdate ? (
                <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
              ) : (
                <Smartphone className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white mb-1">
                {hasUpdate
                  ? lang === 'ta' ? 'புதிய பதிப்பு கிடைத்துள்ளது' : 'New Update Available'
                  : lang === 'ta' ? 'ஆப் பதிப்பு விவரம்' : 'App Version Status'}
              </span>
              <h3 className="font-extrabold text-lg text-white leading-tight">
                {lang === 'ta' ? 'ஆப் புதுப்பிப்பு (App Update)' : 'Software Update'}
              </h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Version comparison card */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {lang === 'ta' ? 'தற்போதைய பதிப்பு' : 'Current Version'}
              </p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                v{CURRENT_APP_VERSION}
              </p>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {lang === 'ta' ? 'கிடைக்கும் புதிய பதிப்பு' : 'Latest Available'}
              </p>
              <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                v{updateInfo?.latestVersion || CURRENT_APP_VERSION}
                {hasUpdate && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                )}
              </p>
            </div>
          </div>

          {/* Status Message */}
          {hasUpdate ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
                <p className="font-bold text-blue-900 dark:text-blue-200 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  {lang === 'ta' ? 'புதிய வசதிகள் & மாற்றங்கள்:' : "What's New in this Update:"}
                </p>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300 pl-5 list-disc text-[11px]">
                  {(lang === 'ta'
                    ? updateInfo?.changelog?.ta
                    : updateInfo?.changelog?.en
                  )?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  )) || (
                    <li>{lang === 'ta' ? 'செயல்திறன் மற்றும் வடிவமைப்பு மேம்பாடுகள்' : 'Performance and UI improvements'}</li>
                  )}
                </ul>
              </div>

              {/* Instructions on update */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  {lang === 'ta' ? 'எப்படி புதுப்பிப்பது?' : 'How to install the update:'}
                </p>
                <p>1. {lang === 'ta' ? 'கீழே உள்ள "இப்போது புதுப்பி" பொத்தானைத் தட்டவும்.' : 'Tap "Update Now" below to download APK.'}</p>
                <p>2. {lang === 'ta' ? 'பதிவிறக்கம் முடிந்ததும், அறிவிப்பைத் தட்டி "Install" கொடுக்கவும்.' : 'Tap the download notification and choose "Install".'}</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ {lang === 'ta' ? 'உங்கள் தரவுகள் மற்றும் உள்நுழைவு பாதுகாக்கப்படும்.' : 'Your data and login session will be preserved.'}
                </p>
              </div>

              {downloadStarted && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    {lang === 'ta'
                      ? 'பதிவிறக்கம் தொடங்கப்பட்டது! உங்கள் அறிவிப்புப் பட்டியில் (Notification bar) பார்க்கவும்.'
                      : 'Download started! Please check your notification bar to complete installation.'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                {lang === 'ta' ? 'ஆப் சமீபத்திய பதிப்பில் உள்ளது' : 'Your App is Up to Date'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {lang === 'ta'
                  ? 'நீங்கள் ஏற்கனவே சமீபத்திய v' + CURRENT_APP_VERSION + ' பதிப்பைப் பயன்படுத்துகிறீர்கள்.'
                  : 'You are currently using the latest version v' + CURRENT_APP_VERSION + '.'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            {hasUpdate ? (
              <button
                onClick={handleDownload}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'ta' ? 'இப்போது புதுப்பி (Download APK)' : 'Update Now (Download APK)'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'ta' ? 'மீண்டும் பதிவிறக்கு (Re-download APK)' : 'Re-download Latest APK'}</span>
              </button>
            )}

            {onCheckAgain && (
              <button
                onClick={onCheckAgain}
                disabled={isChecking}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-blue-500' : ''}`} />
                <span>{lang === 'ta' ? 'சரிபார்' : 'Check'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
