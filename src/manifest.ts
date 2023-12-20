import pkg from "../package.json";

const sharedManifest = {
  content_scripts: [
    {
      js: ["src/entries/contentScript/github-replace-merge.ts"],
      matches: ["https://strava.com/*"],
      run_at: "document_end",
    },
  ],
  icons: {
    "128": "icons/strava_128.png",
  },
  permissions: ["storage"],
  name: "Strava Unit Converter",
  version: "0.0.0.1",
  description: "Strava Unit Converter",
};

const browserAction = {
  default_popup: "src/entries/popup/index.html",
};

const ManifestV2 = {
  ...sharedManifest,
  background: {
    scripts: ["src/entries/background/script.ts"],
    persistent: false,
  },
  browser_action: browserAction,
  web_accessible_resources: ["icons/strava_128.png"],
  permissions: [...sharedManifest.permissions],
  browser_specific_settings: {
    gecko: {
      id: "ahudson@gmail.com",
    },
  },
};

const ManifestV3 = {
  ...sharedManifest,
  action: browserAction,
  background: {
    service_worker: "src/entries/background/serviceWorker.ts",
  },
  web_accessible_resources: [
    {
      resources: ["icons/strava_128.png"],
      matches: ["https://strava.com/*"],
    },
  ],
};

export function getManifest(
  manifestVersion: number
): chrome.runtime.ManifestV2 | chrome.runtime.ManifestV3 {
  const manifest = {
    author: pkg.author,
    description: pkg.description,
    name: pkg.displayName ?? pkg.name,
    version: pkg.version,
  };

  if (manifestVersion === 2) {
    return {
      ...manifest,
      ...ManifestV2,
      manifest_version: manifestVersion,
    };
  }

  if (manifestVersion === 3) {
    // @ts-ignore
    return {
      ...manifest,
      ...ManifestV3,
      manifest_version: manifestVersion,
    };
  }

  throw new Error(
    `Missing manifest definition for manifestVersion ${manifestVersion}`
  );
}
