import { useEffect } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { isNative } from "@/lib/platform";

const ROOT_TAB_PATHS = ["/feed", "/discover", "/messages", "/profile"];

// Wires native-only behavior (status bar, splash screen, hardware back
// button) once at app boot. No-ops on web.
export function NativeBootstrap() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRootTab = ROOT_TAB_PATHS.includes(pathname);

  useEffect(() => {
    if (!isNative()) return;

    let cleanupBack: (() => void) | undefined;

    (async () => {
      const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
        import("@capacitor/status-bar"),
        import("@capacitor/splash-screen"),
        import("@capacitor/app"),
      ]);

      await StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      await SplashScreen.hide().catch(() => {});

      const listener = await App.addListener("backButton", () => {
        if (isRootTab) App.exitApp();
        else router.history.back();
      });
      cleanupBack = () => listener.remove();
    })();

    return () => cleanupBack?.();
  }, [router, isRootTab]);

  return null;
}
