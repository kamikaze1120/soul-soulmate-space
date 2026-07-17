import type { CapacitorConfig } from "@capacitor/cli";

// Remote-hosted WebView (not a bundled build) — every web deploy (via
// `vite build` + `wrangler deploy`) is live in the native app instantly,
// no store resubmission needed for JS-only changes.
const config: CapacitorConfig = {
  appId: "com.nexumcloud.ummah",
  appName: "Ummah",
  webDir: "dist/client",
  server: {
    url: "https://ummah.mujtaba-mohammed720.workers.dev",
  },
};

export default config;
