import { Capacitor } from '@capacitor/core';
import { apiFetch } from './api';

export const CURRENT_APP_VERSION = '1.0.0';
export const CURRENT_BUILD_NUMBER = 1;

export interface AppUpdateInfo {
  latestVersion: string;
  versionCode: number;
  releaseDate: string;
  minRequiredVersion: string;
  apkUrl: string;
  directDownloadUrl: string;
  changelog: {
    ta: string[];
    en: string[];
  };
  hasUpdate: boolean;
}

export async function checkAppUpdate(): Promise<AppUpdateInfo | null> {
  try {
    const data = await apiFetch<any>('/app-update');
    if (!data?.latestVersion) return null;
    const hasUpdate = isNewerVersion(CURRENT_APP_VERSION, data.latestVersion);
    return {
      ...data,
      hasUpdate,
    };
  } catch (err) {
    console.warn('Failed to check app update:', err);
    return null;
  }
}

export function isNewerVersion(current: string, latest: string): boolean {
  try {
    const cParts = current.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
    const lParts = latest.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(cParts.length, lParts.length); i++) {
      const c = cParts[i] || 0;
      const l = lParts[i] || 0;
      if (l > c) return true;
      if (l < c) return false;
    }
    return false;
  } catch {
    return false;
  }
}

export function downloadAndInstallApk(apkUrl?: string) {
  const url = apkUrl || 'https://seettu-anangur.vercel.app/api/app-update/download';
  // Open direct download link in external browser/downloader
  if (Capacitor.isNativePlatform()) {
    // On native Android Capacitor, opening the external browser triggers the system Download Manager
    window.open(url, '_system');
  } else {
    // In web browser
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Sri-Pattanathu-Mariamman.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
