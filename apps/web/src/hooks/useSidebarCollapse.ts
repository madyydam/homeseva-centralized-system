'use client';

import { useState, useEffect, useCallback } from 'react';

export const SIDEBAR_STORAGE_KEY = 'homeseva_sidebar_collapsed';

export function useSidebarCollapse() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (saved !== null) {
          setIsSidebarCollapsed(saved === 'true');
        }
      } catch {}
    }
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
