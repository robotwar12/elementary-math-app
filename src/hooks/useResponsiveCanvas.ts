import { useState, useEffect } from 'react';

export interface CanvasSize {
  width: number;
  height: number;
}

/**
 * 반응형 캔버스 크기 관리 훅
 * 화면 크기에 따라 최적화된 캔버스 크기를 제공합니다.
 */
export function useResponsiveCanvas(): CanvasSize {
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 400, height: 120 });

  // 화면 크기에 따른 캔버스 크기 계산 (실제 크기와 표시 크기 일치)
  const calculateCanvasSize = (): CanvasSize => {
    if (typeof window === 'undefined') return { width: 400, height: 120 };
    
    const screenWidth = window.innerWidth;
    
    if (screenWidth <= 400) {
      // 모바일: 여백 40px 고려하여 최대 350px, 최소 280px
      const width = Math.max(Math.min(screenWidth - 40, 350), 280);
      // 비율 유지: 400:120 = 10:3
      const height = Math.round(width * 0.3);
      return { width, height };
    } else if (screenWidth >= 768 && screenWidth <= 1024) {
      // 태블릿: 6문제 한 화면에 맞춰 작은 캔버스
      const containerWidth = (screenWidth - 60) / 3; // 3열 그리드, 여백 고려
      const width = Math.min(containerWidth - 20, 320); // 카드 패딩 고려
      const height = Math.min(80, Math.round(width * 0.25)); // 더 납작한 비율
      return { width, height };
    } else if (screenWidth <= 768) {
      // 작은 태블릿
      const width = 360;
      const height = Math.round(width * 0.3); // 108px
      return { width, height };
    }
    
    // 데스크톱: 기존 크기 유지
    return { width: 400, height: 120 };
  };

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize(calculateCanvasSize());
    };

    // 초기 크기 설정
    handleResize();

    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return canvasSize;
}