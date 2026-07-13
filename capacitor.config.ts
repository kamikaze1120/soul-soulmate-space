import type { CapacitorConfig } from "@capacitor/cli";

// Remote-hosted WebView (not a bundled build) — every web deploy is live in
// the native app instantly, no store resubmission for JS-only changes.
//
// server.url below points at the local dev server for now (there's no
// production Cloudflare Workers deployment yet). 10.0.2.2 is the Android
// emulator's alias for the host machine's localhost — `bun run dev` must be
// running for `cap run android` to show anything. On a physical device,
// replace it with your machine's LAN IP (e.g. http://192.168.1.x:3000).
// Before Phase 6 (store submission), swap this to the real production URL.
const config: CapacitorConfig = {
  appId: "com.nexumcloud.ummah",
  appName: "Ummah",
  webDir: "dist/client",
  server: {
    url: "http://10.0.2.2:3000",
    cleartext: true,
  },
};

export default config;
