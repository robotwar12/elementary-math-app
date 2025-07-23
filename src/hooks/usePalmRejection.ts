import { useRef, useCallback, useEffect } from 'react';
import { PalmRejectionManager, PalmRejectionConfig, PalmRejectionStatus, preventTouchEvents } from '../utils/palmRejection';

interface UsePalmRejectionOptions {
  enabled: boolean;
  config?: Partial<PalmRejectionConfig>;
  onStatusChange?: (status: PalmRejectionStatus) => void;
}

export const usePalmRejection = ({
  enabled,
  config = {},
  onStatusChange
}: UsePalmRejectionOptions) => {
  const managerRef = useRef<PalmRejectionManager>(new PalmRejectionManager(config));
  const containerRef = useRef<HTMLDivElement>(null);

  // 설정 업데이트
  const updateConfig = useCallback((newConfig: Partial<PalmRejectionConfig>) => {
    managerRef.current.updateConfig(newConfig);
  }, []);

  // 포인터 입력 검사
  const checkPointerInput = useCallback((
    event: PointerEvent | React.PointerEvent,
    existingTouches?: TouchList
  ): PalmRejectionStatus => {
    console.log('🔍 usePalmRejection.checkPointerInput 호출됨:', {
      enabled,
      pointerType: event.pointerType,
      pressure: event.pressure
    });

    if (!enabled) {
      const status = {
        isAllowed: true,
        reason: 'Palm Rejection 비활성화됨',
        inputType: 'unknown' as const
      };
      console.log('🔍 usePalmRejection 결과 (비활성화):', status);
      return status;
    }

    console.log('🔍 PalmRejectionManager.checkPointerInput 호출 중...');
    const status = managerRef.current.checkPointerInput(event, existingTouches);
    console.log('🔍 PalmRejectionManager.checkPointerInput 결과:', status);
    
    if (onStatusChange) {
      onStatusChange(status);
    }

    return status;
  }, [enabled, onStatusChange]);

  // 터치 입력 검사
  const checkTouchInput = useCallback((event: TouchEvent): PalmRejectionStatus => {
    if (!enabled) {
      return {
        isAllowed: true,
        reason: 'Palm Rejection 비활성화됨',
        inputType: 'touch'
      };
    }

    const status = managerRef.current.checkTouchInput(event);
    
    if (onStatusChange) {
      onStatusChange(status);
    }

    return status;
  }, [enabled, onStatusChange]);

  // 활성 포인터 관리
  const addActivePointer = useCallback((pointerId: number) => {
    managerRef.current.addActivePointer(pointerId);
  }, []);

  const removeActivePointer = useCallback((pointerId: number) => {
    managerRef.current.removeActivePointer(pointerId);
  }, []);

  const clearActivePointers = useCallback(() => {
    managerRef.current.clearActivePointers();
  }, []);

  // 컨테이너에 이벤트 리스너 설정
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    // 터치 이벤트 차단 리스너들
    const listeners = {
      touchstart: preventTouchEvents.touchstart,
      touchmove: preventTouchEvents.touchmove,
      touchend: preventTouchEvents.touchend,
      touchcancel: preventTouchEvents.touchcancel,
      wheel: preventTouchEvents.wheel,
      contextmenu: preventTouchEvents.contextmenu,
      dragstart: preventTouchEvents.dragstart
    };

    // 이벤트 리스너 등록
    Object.entries(listeners).forEach(([event, handler]) => {
      container.addEventListener(event, handler as EventListener, { passive: false });
    });

    // 정리 함수
    return () => {
      Object.entries(listeners).forEach(([event, handler]) => {
        container.removeEventListener(event, handler as EventListener);
      });
    };
  }, [enabled]);

  // 설정 변경 시 매니저 업데이트
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
