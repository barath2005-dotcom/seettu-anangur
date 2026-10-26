import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Check,
  Sparkles,
  ArrowRight,
  Info,
  Zap,
  QrCode,
} from 'lucide-react';
import { SupportedLanguage } from '@seettu/shared';

interface DownloadAppScreenProps {
  lang: SupportedLanguage;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export function DownloadAppScreen({ lang, showToast }: DownloadAppScreenProps) {
  const [copied, setCopied] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const vercelDirectApkUrl = '/downloads/Sri-Pattanathu-Mariamman.apk';
  const githubDirectApkUrl = 'https://github.com/barath2005-dotcom/seettu-anangur/releases/download/mobile-v1.0.0/Sri-Pattanathu-Mariamman.apk';
  const githubReleasesUrl = 'https://github.com/barath2005-dotcom/seettu-anangur/releases';
  const githubActionsUrl = 'https://github.com/barath2005-dotcom/seettu-anangur/actions';
  const appWebUrl = typeof window !== 'undefined' ? window.location.origin : 'https://seettu-anangur.vercel.app';

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appWebUrl);
    setCopied(true);
    if (showToast) {
      showToast(lang === 'ta' ? 'இணைப்பு நகலெடுக்கப்பட்டது!' : 'Link copied to clipboard!', 'success');
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadApk = () => {
    if (showToast) {
      showToast(lang === 'ta' ? 'Android APK நேரடி பதிவிறக்கம் தொடங்குகிறது...' : 'Starting direct APK download...', 'success');
    }
    // Create an explicit download anchor tag to force clean native saving
    const a = document.createElement('a');
    a.href = vercelDirectApkUrl;
    a.download = 'Sri-Pattanathu-Mariamman.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOneTapInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted' && showToast) {
        showToast(lang === 'ta' ? 'செயலி வெற்றிகரமாக நிறுவப்பட்டது!' : 'App installed successfully!', 'success');
      }
      setInstallPrompt(null);
    } else {
      setShowAndroidGuide(true);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Banner / Hero */}
      <div className="text-center pt-2 pb-1">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#2563EB] dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-3">
          <Sparkles className="w-4 h-4" />
          <span>{lang === 'ta' ? 'அதிகாரப்பூர்வ மொபைல் செயலி' : 'Official Mobile Application'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {lang === 'ta'
            ? 'ஸ்ரீ பட்டணத்து மாரியம்மன் மொபைல் செயலி பதிவிறக்கம்'
            : 'Sri Pattanathu Mariamman App Download Official V1.0'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mt-2 leading-relaxed">
          {lang === 'ta'
            ? 'ஆனங்கூர் சீட்டு குழு உறுப்பினர்கள் மற்றும் நிர்வாகிகளுக்கான பிரத்யேக மொபைல் செயலி. மாதாந்திர தவணைகள், டிஜிட்டல் ரசீதுகள், பௌர்ணமி குலுக்கல் முடிவுகள் அனைத்தையும் உங்கள் போனிலேயே எளிதாகக் கண்காணிக்கலாம்.'
            : 'Official chit fund management mobile app for Anangur members and administrators. Track monthly contributions, download digital receipts, receive Pournami lucky draw alerts, and manage ledgers on Android & iOS.'}
        </p>

        {/* Two Prominent Action Buttons (Reference Mockup Style) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-5">
          <button
            onClick={handleDownloadApk}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] cursor-pointer group"
          >
            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            <div className="text-left">
              <span className="block text-[11px] font-semibold text-emerald-100 uppercase tracking-wider leading-none">
                {lang === 'ta' ? 'நேரடி பதிவிறக்கம்' : 'Direct APK Download'}
              </span>
              <span className="text-sm font-black leading-tight">
                {lang === 'ta' ? 'Download Android APK' : 'Download Android APK'}
              </span>
            </div>
          </button>

          <button
            onClick={() => setShowIosGuide(true)}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#1D68FE] via-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] cursor-pointer group"
          >
            <Smartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="block text-[11px] font-semibold text-blue-100 uppercase tracking-wider leading-none">
                {lang === 'ta' ? 'ஆப்பிள் ஐபோன்' : 'Apple iPhone / iPad'}
              </span>
              <span className="text-sm font-black leading-tight">
                {lang === 'ta' ? 'Install on iOS (iPhone)' : 'Install on iOS (iPhone)'}
              </span>
            </div>
          </button>
        </div>

        {/* 1-Tap Instant Install Alternative Bar */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={handleOneTapInstall}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>
              {lang === 'ta'
                ? '⚡ 1-Tap உடனடி நிறுவல் (No APK download required)'
                : '⚡ 1-Tap Instant Install (No APK download required)'}
            </span>
          </button>

          <a
            href={githubReleasesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
          >
            <span>{lang === 'ta' ? 'GitHub Releases பதிவுகள்' : 'View on GitHub Releases'}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        {/* Live Auto-Updating QR Codes for Mobile (Android APK & iOS) */}
        <div className="mt-6 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {/* Android QR Code */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111C2E] border-2 border-emerald-500/30 shadow-lg flex items-center gap-4">
            <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent('https://seettu-anangur.vercel.app/downloads/Sri-Pattanathu-Mariamman.apk')}&format=svg`}
                alt="Android APK Download QR Code"
                className="w-24 h-24 object-contain rounded"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-1">
                <Download className="w-3 h-3" />
                <span>Android APK</span>
              </div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {lang === 'ta' ? 'Android QR குறியீடு' : 'Scan for Android APK'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {lang === 'ta'
                  ? 'போன் கேமரா மூலம் ஸ்கேன் செய்து நேரடி APK பதிவிறக்குக (எப்போதும் சமீபத்திய பதிப்பு).'
                  : 'Scan with camera to download the latest APK directly to your phone.'}
              </p>
            </div>
          </div>

          {/* iOS / iPhone QR Code */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111C2E] border-2 border-blue-500/30 shadow-lg flex items-center gap-4">
            <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent('https://seettu-anangur.vercel.app/?tab=download')}&format=svg`}
                alt="iOS iPhone Installation QR Code"
                className="w-24 h-24 object-contain rounded"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider mb-1">
                <Smartphone className="w-3 h-3" />
                <span>Apple iOS</span>
              </div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {lang === 'ta' ? 'Apple iPhone QR' : 'Scan for iPhone / iOS'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {lang === 'ta'
                  ? 'ஐபோன் கேமராவில் ஸ்கேன் செய்து Safari-ல் "Add to Home Screen" செய்க.'
                  : 'Scan on iPhone camera to open in Safari and add to Home Screen.'}
              </p>
            </div>
          </div>
        </div>

        {/* Cloud Auto-Update Guarantee Badge */}
        <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>
            {lang === 'ta'
              ? '🔄 தானியங்கி புதுப்பித்தல்: இந்த QR குறியீடு எப்போதும் சமீபத்திய பதிப்பை மட்டுமே வழங்கும்.'
              : '🔄 Live Auto-Sync: Scanning this QR will always download the newest version automatically.'}
          </span>
        </div>
      </div>

      {/* Main App Info & Specification Card (Exact Match to User's Mockup) */}
      <div className="rounded-3xl bg-[#071328] border-2 border-blue-500/25 shadow-2xl p-5 sm:p-7 relative overflow-hidden text-white">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: Big App Icon */}
          <div className="md:col-span-5 flex flex-col items-center justify-center text-center">
            <div className="relative group">
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-[28px] border-4 border-amber-400/80 bg-gradient-to-b from-amber-400/20 to-amber-600/10 shadow-[0_0_35px_rgba(251,191,36,0.35)] ring-4 ring-amber-400/20 p-1.5 flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.jpg"
                  alt="Sri Pattanathu Mariamman App"
                  className="w-full h-full rounded-[22px] object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-lg border-2 border-[#071328]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-extrabold text-base text-white">
                {lang === 'ta' ? 'ஸ்ரீ பட்டணத்து மாரியம்மன்' : 'Sri Pattanathu Mariamman'}
              </h3>
              <p className="text-xs text-blue-200/70 font-medium mt-0.5">
                {lang === 'ta' ? 'ஆனங்கூர் சீட்டு குழு • அதிகாரப்பூர்வ செயலி' : 'Anangur Seettu Kuzhu • Official Mobile App'}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold mt-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{lang === 'ta' ? 'பாதுகாப்பானது & சரிபார்க்கப்பட்டது' : '100% Secure & Verified'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Specification Table (Matches Reference Layout) */}
          <div className="md:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-sm divide-y divide-white/10 text-xs sm:text-[13px]">
              <div className="flex items-center justify-between p-3 sm:px-4">
                <span className="text-slate-400 font-medium">{lang === 'ta' ? 'செயலி பெயர்' : 'App Name'}</span>
                <span className="font-bold text-white text-right">
                  {lang === 'ta' ? 'ஸ்ரீ பட்டணத்து மாரியம்மன்' : 'Sri Pattanathu Mariamman'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 sm:px-4">
                <span className="text-slate-400 font-medium">{lang === 'ta' ? 'பதிப்பு' : 'Version'}</span>
                <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                  V1.0.0
                </span>
              </div>
              <div className="flex items-center justify-between p-3 sm:px-4">
                <span className="text-slate-400 font-medium">{lang === 'ta' ? 'கோப்பு அளவு' : 'Size'}</span>
                <span className="font-bold text-white font-mono">~8.4 MB</span>
              </div>
              <div className="flex items-center justify-between p-3 sm:px-4">
                <span className="text-slate-400 font-medium">{lang === 'ta' ? 'உருவாக்குநர்' : 'Developer'}</span>
                <span className="font-bold text-amber-300">
                  {lang === 'ta' ? 'ஆனங்கூர் சீட்டு குழு' : 'Anangur Seettu Team'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 sm:px-4">
                <span className="text-slate-400 font-medium">{lang === 'ta' ? 'வகை' : 'Category'}</span>
                <span className="font-medium text-slate-200">
                  {lang === 'ta' ? 'நிதி & சீட்டு மேலாண்மை' : 'Finance & Chit Savings'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 sm:px-4">
                <span className="text-slate-400 font-medium">{lang === 'ta' ? 'கட்டணம்' : 'License'}</span>
                <span className="font-bold text-emerald-400 uppercase tracking-wide">
                  {lang === 'ta' ? 'இலவசம் (FREE ₹0)' : 'FREE (₹0)'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 sm:px-4">
                <span className="text-slate-400 font-medium">{lang === 'ta' ? 'இயங்குதளம்' : 'Requires'}</span>
                <span className="font-medium text-slate-200">Android 5.0+ / iOS 14.0+</span>
              </div>
              <div className="flex items-center justify-between p-3 sm:px-4">
                <span className="text-slate-400 font-medium">{lang === 'ta' ? 'புதுப்பிக்கப்பட்டது' : 'Updated On'}</span>
                <span className="font-medium text-slate-300">
                  {lang === 'ta' ? 'நேரலை (அக்டோபர் 2026)' : 'Live (October 2026)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Detailed Step-by-Step Installation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Android Card */}
        <div className="rounded-3xl bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {lang === 'ta' ? 'Android APK நிறுவுதல்' : 'Android APK Installation'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'ta' ? '3 எளிய படிகளில் உங்கள் போனில் நிறுவுக' : 'Install in 3 simple steps on any Android phone'}
                </p>
              </div>
            </div>

            <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ta' ? 'APK கோப்பைப் பதிவிறக்குக:' : 'Download APK File:'}
                  </span>{' '}
                  {lang === 'ta'
                    ? 'மேலே உள்ள "Download Android APK" பட்டனை அழுத்தி கோப்பைப் பெறவும்.'
                    : 'Click "Download Android APK" button to download app-debug.apk.'}
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ta' ? 'நிறுவ அனுமதியுங்கள்:' : 'Allow Installation:'}
                  </span>{' '}
                  {lang === 'ta'
                    ? 'கோப்பைத் திறந்து Install அழுத்தவும். கேட்டால் "Allow from this source" என்பதை இயக்கவும்.'
                    : 'Open the downloaded file and tap Install (enable "Allow from this source" if prompted).'}
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ta' ? 'உள்நுழைந்து பயன்படுத்துக:' : 'Open and Sign In:'}
                  </span>{' '}
                  {lang === 'ta'
                    ? 'உங்கள் போன் முகப்புத் திரையில் தோன்றும் செயலியைத் திறந்து Admin அல்லது Member ஆக உள்நுழையவும்.'
                    : 'Launch app from your phone home screen and log in as Member or Admin!'}
                </div>
              </li>
            </ol>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={handleDownloadApk}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'ta' ? 'APK பதிவிறக்குக (Download APK)' : 'Download APK Now'}</span>
            </button>
            <button
              onClick={handleOneTapInstall}
              className="py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              title="Install directly in Chrome without APK"
            >
              <Zap className="w-4 h-4" />
              <span>{lang === 'ta' ? 'உடனடி நிறுவல்' : 'Instant 1-Tap'}</span>
            </button>
          </div>
        </div>

        {/* iOS (iPhone / iPad) Card */}
        <div className="rounded-3xl bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {lang === 'ta' ? 'Apple iPhone / iOS நிறுவுதல்' : 'Apple iPhone / iOS Installation'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'ta' ? 'App Store இன்றி ஐபோன் முகப்புத் திரையில் நேரடி நிறுவல்' : 'Instant 1-tap installation directly via Safari'}
                </p>
              </div>
            </div>

            <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ta' ? 'Safari-யில் திறக்கவும்:' : 'Open Safari Browser:'}
                  </span>{' '}
                  {lang === 'ta'
                    ? 'உங்கள் ஐபோனில் Safari உலாவியில் seettu-anangur.vercel.app முகவரியைத் திறக்கவும்.'
                    : 'Open seettu-anangur.vercel.app in Safari on your iPhone or iPad.'}
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ta' ? 'Share பட்டனை அழுத்தவும்:' : 'Tap Share Button:'}
                  </span>{' '}
                  {lang === 'ta'
                    ? 'சஃபாரியின் கீழ் பகுதியில் உள்ள Share ஐகானைத் (Square with arrow) தட்டவும்.'
                    : 'Tap the Share icon (square box with upward arrow) at bottom of Safari.'}
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ta' ? 'முகப்புத் திரையில் சேர்க்கவும்:' : 'Add to Home Screen:'}
                  </span>{' '}
                  {lang === 'ta'
                    ? '"Add to Home Screen" என்பதைத் தட்டி "Add" கொடுத்தால் தனிச் செயலியாக நிறுவப்படும்.'
                    : 'Select "Add to Home Screen" and tap "Add" in top-right. App icon appears instantly!'}
                </div>
              </li>
            </ol>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setShowIosGuide(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Info className="w-4 h-4" />
              <span>{lang === 'ta' ? 'iPhone வழிகாட்டி (iOS Guide)' : 'View iOS Step-by-Step Guide'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share / Copy App Link Section */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/60 dark:to-slate-900/60 border border-blue-200/60 dark:border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {lang === 'ta' ? 'உறுப்பினர்களுக்கு செயலியைப் பகிரவும்' : 'Share App Link with Members'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'ta'
                ? 'இந்த இணைப்பை வாட்ஸ்அப் அல்லது எஸ்.எம்.எஸ் மூலம் உறுப்பினர்களுக்கு அனுப்பி உடனே நிறுவச் செய்யலாம்.'
                : 'Send this link to your WhatsApp group so all members can install the app easily.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="hidden sm:block px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs border border-slate-200 dark:border-slate-700 truncate max-w-xs">
            {appWebUrl}
          </div>
          <button
            onClick={handleCopyLink}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? (lang === 'ta' ? 'நகலெடுக்கப்பட்டது!' : 'Copied!') : (lang === 'ta' ? 'இணைப்பை நகலெடு' : 'Copy Link')}</span>
          </button>
        </div>
      </div>

      {/* iOS Modal Guide */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1726] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🍏</span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {lang === 'ta' ? 'Apple iPhone / iPad-ல் நிறுவுதல்' : 'Install on iPhone / iPad'}
                </h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
                <span className="text-xl">1️⃣</span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ta' ? 'Safari உலாவியில் திறக்கவும்' : 'Open in Safari'}
                  </h4>
                  <p className="mt-0.5">
                    {lang === 'ta'
                      ? 'iPhone-ல் உள்ள Safari உலாவியில் இந்தத் தளத்தைத் திறக்கவும்.'
                      : 'Ensure you are browsing in Safari (not Chrome or in-app browsers).'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
                <span className="text-xl">2️⃣</span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ta' ? 'Share பட்டனைத் தட்டவும்' : 'Tap the Share Button'}
                  </h4>
                  <p className="mt-0.5">
                    {lang === 'ta'
                      ? 'திரையின் கீழ்ப் பகுதியில் உள்ள சதுர அம்பு குறியை (Square with Arrow) அழுத்தவும்.'
                      : 'Tap the Share icon at the bottom toolbar of Safari.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
                <span className="text-xl">3️⃣</span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ta' ? '"Add to Home Screen" தேர்ந்தெடுக்கவும்' : 'Select "Add to Home Screen"'}
                  </h4>
                  <p className="mt-0.5">
                    {lang === 'ta'
                      ? 'கீழே உருட்டி "Add to Home Screen" அழுத்தி, மேலே உள்ள "Add" பட்டனைத் தட்டவும்.'
                      : 'Scroll down and tap "Add to Home Screen", then tap "Add" in top-right.'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              {lang === 'ta' ? 'புரிந்தது, மூடுக' : 'Got it, Close'}
            </button>
          </div>
        </div>
      )}

      {/* Android Modal Guide */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1726] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🤖</span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {lang === 'ta' ? 'Chrome மூலம் உடனடி நிறுவல்' : 'Instant Install via Chrome'}
                </h3>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
                <span className="text-xl">1️⃣</span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ta' ? 'Chrome உலாவியின் மேல் வலது மெனு (⋮)' : 'Open Chrome 3-Dots Menu (⋮)'}
                  </h4>
                  <p className="mt-0.5">
                    {lang === 'ta'
                      ? 'Chrome-ன் மேல் வலது மூலையில் உள்ள 3 புள்ளிகளைத் தட்டவும்.'
                      : 'Tap the 3 dots in the top-right corner of Chrome.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
                <span className="text-xl">2️⃣</span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ta' ? '"Install app" அல்லது "Add to Home screen" அழுத்தவும்' : 'Tap "Install app" or "Add to Home screen"'}
                  </h4>
                  <p className="mt-0.5">
                    {lang === 'ta'
                      ? 'மெனுவில் உள்ள "Install app" என்பதைத் தேர்ந்தெடுத்து Install அழுத்தவும்.'
                      : 'Choose "Install app" (or "Add to Home screen") and tap Install.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
                <span className="text-xl">3️⃣</span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ta' ? 'செயலி தயாராகிவிட்டது!' : 'App Ready!'}
                  </h4>
                  <p className="mt-0.5">
                    {lang === 'ta'
                      ? 'உங்கள் போன் திரையில் கோவில் சின்னத்துடன் செயலி உடனடியாக நிறுவப்பட்டுவிடும்!'
                      : 'The official app icon is added to your phone screen and opens full-screen!'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidGuide(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              {lang === 'ta' ? 'புரிந்தது, மூடுக' : 'Got it, Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
