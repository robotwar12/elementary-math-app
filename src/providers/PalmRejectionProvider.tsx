'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface PalmRejectionContextType {
  palmRejection: boolean;
  setPalmRejection: (value: boolean) => void;
  isTabletMode: boolean;
}

const PalmRejectionContext = createContext<PalmRejectionContextType | undefined>(undefined);

export const usePalmRejection = () => {
  const context = useContext(PalmRejectionContext);
  if (context === undefined) {
    throw new Error('usePalmRejection must be used within a PalmRejectionProvider');
  }
  return context;
};

interface PalmRejectionProviderProps {
  children: ReactNode;
}

export default function PalmRejectionProvider({ children }: PalmRejectionProviderProps) {
  const [palmRejection, setPalmRejection] = useState(true); // 기본값: ON
  const [isTabletMode, setIsTabletMode] = useState(false);
  
  const palmRejectionRef = useRef(palmRejection);
  
  useEffect(() => {
    palmRejectionRef.current = palmRejection;
  }, [palmRejection]);

  // 클라이언트사이드에서만 태블릿 모드 확인
  useEffect(() => {
    const checkTabletMode = () => {
      setIsTabletMode(
        window.innerWidth >= 768 && window.innerWidth <= 1440
      );
    };

    checkTabletMode();
    window.addEventListener('resize', checkTabletMode);
    
    return () => {
      window.removeEventListener('resize', checkTabletMode);
    };
  }, []);

  // 전역 Palm Rejection 이벤트 리스너 관리
  useEffect(() => {
    // Palm Rejection이 OFF일 때는 이벤트 리스너를 등록하지 않음
    if (!palmRejection) {
      console.log('🟢 Palm Rejection OFF - 이벤트 리스너 등록하지 않음');
      return;
    }

    const preventGlobalTouch = (e: TouchEvent) => {
      console.log('🖐️ [DEBUG] preventGlobalTouch 호출됨, palmRejection 상태:', palmRejectionRef.current, 'touches:', e.touches.length);
      
      const target = e.target as Element;
      console.log('🖐️ [DEBUG] 터치 대상:', target.tagName, target.className);
      
      if (target.closest('[data-palm-toggle-container]')) {
        console.log('🖐️ [DEBUG] palm-toggle-container라서 리턴');
        return;
      }

      const isAllowedElement = target.closest('button, input, select, textarea, a, label, [role="button"], .touch-allowed');
      if (isAllowedElement) {
        console.log('🖐️ [DEBUG] 허용된 요소라서 리턴');
        return;
      }
      
      const isCanvasArea = target.closest('canvas, .canvas-container, .drawing-area');
      if (isCanvasArea) {
        console.log('🖐️ [DEBUG] 캔버스 영역 터치됨, Palm Rejection ON 상태에서 캔버스 터치는 허용');
        // Palm Rejection ON 상태에서도 캔버스 영역의 터치는 완전히 허용
        // 캔버스 자체 이벤트 핸들러가 멀티터치를 처리하도록 함
        return;
      }

      console.log('🚫 Palm Rejection: 빈 영역 터치/스크롤 차단');
      e.preventDefault();
    };

    const preventDefaultIfActive = (e: Event) => {
      const target = e.target as Element;
      if (target.closest('input, textarea')) return;
      e.preventDefault();
    };

    console.log('🖐️ 전역 Palm Rejection 이벤트 리스너 설정 (ON 상태)');
    document.addEventListener('touchmove', preventGlobalTouch, { passive: false, capture: true });
    document.addEventListener('contextmenu', preventDefaultIfActive, { capture: true });
    document.addEventListener('dragstart', preventDefaultIfActive, { capture: true });
    document.addEventListener('selectstart', preventDefaultIfActive, { capture: true });

    return () => {
      console.log('🖐️ 전역 Palm Rejection 이벤트 리스너 해제');
      document.removeEventListener('touchmove', preventGlobalTouch, { capture: true });
      document.removeEventListener('contextmenu', preventDefaultIfActive, { capture: true });
      document.removeEventListener('dragstart', preventDefaultIfActive, { capture: true });
      document.removeEventListener('selectstart', preventDefaultIfActive, { capture: true });
    };
  }, [palmRejection]); // palmRejection 상태 변경 시 재등록

  // palmRejection 상태에 따라 body 클래스 토글
  useEffect(() => {
    if (palmRejection) {
      console.log('🖐️ Palm Rejection 활성화: body 클래스 추가');
      document.body.classList.add('palm-rejection-active');
      document.documentElement.classList.add('palm-rejection-active');
    } else {
      console.log('🖐️ Palm Rejection 비활성화: body 클래스 제거');
      document.body.classList.remove('palm-rejection-active');
      document.documentElement.classList.remove('palm-rejection-active');
    }
  }, [palmRejection]);

  return (
    <PalmRejectionContext.Provider 
      value={{
        palmRejection,
        setPalmRejection,
        isTabletMode
      }}
    >
      {children}
    </PalmRejectionContext.Provider>
  );
}