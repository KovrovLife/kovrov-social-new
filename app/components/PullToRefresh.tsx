'use client';

import { useState, useEffect, useRef } from 'react';

interface PullToRefreshProps {
  refreshing?: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
}

export default function PullToRefresh({ refreshing = false, onRefresh, children }: PullToRefreshProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef<number>(0);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!ref.current || isRefreshing) return;
      
      const diff = e.touches[0].clientY - touchStartY.current;
      
      // If user pulls down past a threshold, show refreshing state
      if (diff > 100 && ref.current.scrollTop === 0) {
        e.preventDefault();
        setIsRefreshing(true);
        onRefresh();
      }
    };

    const container = ref.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart as EventListener, { passive: false } as AddEventListenerOptions);
      container.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false } as AddEventListenerOptions);
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart as EventListener);
        container.removeEventListener('touchmove', handleTouchMove as EventListener);
      }
    };
  }, [isRefreshing, onRefresh]);

  useEffect(() => {
    setIsRefreshing(refreshing);
  }, [refreshing]);

  // Reset refreshing state after a delay if not manually reset
  useEffect(() => {
    if (isRefreshing && !onRefresh) {
      timeoutIdRef.current = setTimeout(() => setIsRefreshing(false), 1000);
    }
    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, [isRefreshing, onRefresh]);

  return (
    <div>
      <div
        ref={ref}
        className="h-16 w-full flex items-center justify-center py-2 border-t border-emerald-100 dark:border-emerald-900/30"
      >
        {isRefreshing ? (
          <div className="w-10 h-10 border-2 border-emerald-500 rounded-full animate-spin" />
        ) : (
          <div className="text-sm text-emerald-500">Спустите вниз для обновления</div>
        )}
      </div>
      {children}
    </div>
  );
}