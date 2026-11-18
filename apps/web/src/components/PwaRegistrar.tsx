'use client';

import { useEffect, useState } from 'react';
import { Download, X, Laptop } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaRegistrar() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker for PWA installability
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Check for worker updates
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn('SW registration:', err);
        });
    }

    // 2. Intercept beforeinstallprompt for in-app 1-click install button
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // If user hasn't dismissed before in this session, show prompt
      const dismissed = sessionStorage.getItem('homeseva_pwa_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('homeseva_pwa_dismissed', 'true');
    }
  };

  if (!showInstallBanner || isDismissed || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce-in max-w-sm">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-white flex items-center space-x-3.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shrink-0 shadow-md shadow-blue-500/20">
          <Laptop className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-white leading-tight">Install HomeSeva App</h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
            Install on PC / Desktop for instant 1-click launch from taskbar.
          </p>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            type="button"
            className="inline-flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            type="button"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
