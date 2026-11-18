'use client';

import { useState, useEffect, useCallback } from 'react';

export const SIDEBAR_STORAGE_KEY = 'homeseva_sidebar_collapsed';

export function useSidebarCollapse() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (saved !== null) return saved === 'true';
      } catch {}
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SIDEBAR_STORAGE_KEY && e.newValue !== null) {
        setIsSidebarCollapsed(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
        } catch {}
      }
      return next;
    });
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setIsSidebarCollapsed(value);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
      } catch {}
    }
  }, []);

  return {
    isSidebarCollapsed,
    setIsSidebarCollapsed: setCollapsed,
    toggleSidebar,
  };
}
