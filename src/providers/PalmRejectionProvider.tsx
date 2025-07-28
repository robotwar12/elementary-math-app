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
    const preventGlobalTouch = (e: TouchEvent) => {
      if (!palmRejectionRef.current) return;

      const target = e.target as Element;
      if (target.closest('[data-palm-toggle-container]')) return;

      const isAllowedElement = target.closest('button, input, select, textarea, a, label, [role="button"], .touch-allowed');
      if (isAllowedElement) return;
      
      const isCanvasArea = target.closest('canvas, .canvas-container, .drawing-area');
      if (isCanvasArea) {
        if (e.touches.length > 1) {
          console.log('🚫 Palm Rejection: 캔버스 위 멀티터치 차단');
          e.preventDefault();
        }
        return;
      }

      console.log('🚫 Palm Rejection: 빈 영역 터치/스크롤 차단');
      e.preventDefault();
    };

    const preventDefaultIfActive = (e: Event) => {
      if (palmRejectionRef.current) {
        const target = e.target as Element;
        if (target.closest('input, textarea')) return;
        e.preventDefault();
      }
    };

    console.log('🖐️ 전역 Palm Rejection 이벤트 리스너 설정');
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
  }, []); // 마운트/언마운트 시에만 실행

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