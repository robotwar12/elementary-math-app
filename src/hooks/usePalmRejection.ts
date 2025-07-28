import { useRef, useCallback, useEffect } from 'react';
import { PalmRejectionManager, PalmRejectionConfig, PalmRejectionStatus, preventTouchEvents } from '../utils/palmRejection';

interface UsePalmRejectionOptions {
  enabled: boolean;
  config?: Partial<PalmRejectionConfig>;
}

export const usePalmRejection = ({
  enabled,
  config = {}
}: UsePalmRejectionOptions) => {
  const managerRef = useRef<PalmRejectionManager>(new PalmRejectionManager(config));
  const containerRef = useRef<HTMLDivElement>(null);

  const updateConfig = useCallback((newConfig: Partial<PalmRejectionConfig>) => {
    managerRef.current.updateConfig(newConfig);
  }, []);

  const checkPointerInput = useCallback((
    event: PointerEvent | React.PointerEvent,
    existingTouches?: TouchList
  ): PalmRejectionStatus => {
    if (!enabled) {
      return {
        isAllowed: true,
        reason: 'Palm Rejection 비활성화됨',
        inputType: 'unknown' as const
      };
    }

    return managerRef.current.checkPointerInput(event, existingTouches);
  }, [enabled]);

  const checkTouchInput = useCallback((event: TouchEvent): PalmRejectionStatus => {
    if (!enabled) {
      return {
        isAllowed: true,
        reason: 'Palm Rejection 비활성화됨',
        inputType: 'touch'
      };
    }

    return managerRef.current.checkTouchInput(event);
  }, [enabled]);

  const addActivePointer = useCallback((pointerId: number) => {
    managerRef.current.addActivePointer(pointerId);
  }, []);

  const removeActivePointer = useCallback((pointerId: number) => {
    managerRef.current.removeActivePointer(pointerId);
  }, []);

  const clearActivePointers = useCallback(() => {
    managerRef.current.clearActivePointers();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const listeners = {
      touchstart: preventTouchEvents.touchstart,
      touchmove: preventTouchEvents.touchmove,
      touchend: preventTouchEvents.touchend,
      touchcancel: preventTouchEvents.touchcancel,
      wheel: preventTouchEvents.wheel,
      contextmenu: preventTouchEvents.contextmenu,
      dragstart: preventTouchEvents.dragstart
    };

    Object.entries(listeners).forEach(([event, handler]) => {
      container.addEventListener(event, handler as EventListener, { passive: false });
    });

    return () => {
      Object.entries(listeners).forEach(([event, handler]) => {
        container.removeEventListener(event, handler as EventListener);
      });
    };
  }, [enabled]);

  useEffect(() => {
    managerRef.current.updateConfig(config);
  }, [config]);

  return {
    containerRef,
    checkPointerInput,
    checkTouchInput,
    addActivePointer,
    removeActivePointer,
    clearActivePointers,
    updateConfig,
    getActivePointerCount: () => managerRef.current.getActivePointerCount()
  };
};
