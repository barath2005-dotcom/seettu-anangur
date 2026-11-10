import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { apiFetch } from './api';

export const CURRENT_APP_VERSION = '1.0.2';
export const CURRENT_BUILD_NUMBER = 3;

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

export async function downloadAndInstallApk(apkUrl?: string) {
  const url = apkUrl || 'https://seettu-anangur.vercel.app/api/app-update/download';
  try {
    if (Capacitor.isNativePlatform()) {
      // Open with native browser to invoke Android's system Download Manager
      await Browser.open({ url });
    } else {
      window.location.href = url;
    }
  } catch (e) {
    window.location.href = url;
  }
}
