// App Update Service - GitHub Releases Integration

export interface UpdateInfo {
  isUpdateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl?: string;
  assetName?: string;
  assetSize?: number;
  isDeltaUpdate?: boolean;
}

export function compareSemver(latest: string, current: string): number {
  const clean = (v: string) => v.replace(/^v/, '').trim();
  const v1Parts = clean(latest).split('.').map((n) => parseInt(n, 10) || 0);
  const v2Parts = clean(current).split('.').map((n) => parseInt(n, 10) || 0);

  const length = Math.max(v1Parts.length, v2Parts.length);
  for (let i = 0; i < length; i++) {
    const p1 = v1Parts[i] || 0;
    const p2 = v2Parts[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export async function checkForAppUpdate(): Promise<UpdateInfo> {
  const api = (window as any).electronAPI;
  let currentVersion = '1.0.0';
  if (api?.getAppVersion) {
    try {
      const v = await api.getAppVersion();
      if (v) currentVersion = v;
    } catch {}
  }

  const GITHUB_REPO = 'Prithibi17/An-me';
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to check updates: GitHub responded with HTTP ${res.status}`);
  }

  const data = await res.json();
  const rawTag = data.tag_name || '';
  const latestVersion = rawTag.replace(/^v/, '') || '1.0.0';

  // Prioritize lightweight in-place update package (*Update*.zip or app-update.zip ~14 MB)
  // over the full 240 MB re-installer
  let downloadUrl: string | undefined;
  let assetName: string | undefined;
  let assetSize: number | undefined;
  let isDeltaUpdate = false;

  if (Array.isArray(data.assets) && data.assets.length > 0) {
    const updateZipAsset = data.assets.find((a: any) =>
      typeof a.name === 'string' &&
      a.name.toLowerCase().includes('update') &&
      a.name.toLowerCase().endsWith('.zip')
    );

    const exeAsset = data.assets.find((a: any) =>
      typeof a.name === 'string' && a.name.toLowerCase().endsWith('.exe')
    );

    const portableZipAsset = data.assets.find((a: any) =>
      typeof a.name === 'string' && a.name.toLowerCase().includes('portable') && a.name.toLowerCase().endsWith('.zip')
    );

    const chosenAsset = updateZipAsset || exeAsset || portableZipAsset || data.assets[0];

    if (chosenAsset) {
      downloadUrl = chosenAsset.browser_download_url;
      assetName = chosenAsset.name;
      assetSize = chosenAsset.size;
      isDeltaUpdate = !!updateZipAsset && chosenAsset === updateZipAsset;
    }
  }

  if (!downloadUrl) {
    downloadUrl = data.html_url;
  }

  const isUpdateAvailable = compareSemver(latestVersion, currentVersion) > 0;

  return {
    isUpdateAvailable,
    currentVersion,
    latestVersion,
    releaseName: data.name || `An:me Desktop ${rawTag}`,
    releaseNotes: data.body || '',
    publishedAt: data.published_at ? new Date(data.published_at).toLocaleDateString() : 'Recently',
    downloadUrl,
    assetName,
    assetSize,
    isDeltaUpdate,
  };
}
