// Palm Rejection 유틸리티 - 고급 터치펜 입력 감지 및 손바닥 차단

export interface PalmRejectionConfig {
  penOnlyMode: boolean;
  multiTouchThreshold: number;
  palmSizeThreshold: number;
  pressureThreshold: number;
  sensitivity: 'low' | 'medium' | 'high';
}

export interface PalmRejectionStatus {
  isAllowed: boolean;
  reason: string;
  inputType: 'pen' | 'touch' | 'mouse' | 'unknown';
  pressure?: number;
  touchSize?: number;
}

export class PalmRejectionManager {
  private activePenPointers = new Set<number>();
  private config: PalmRejectionConfig;

  constructor(config: Partial<PalmRejectionConfig> = {}) {
    this.config = {
      penOnlyMode: true,
      multiTouchThreshold: 1, // 1개 이상의 터치는 차단
      palmSizeThreshold: 20,  // 20px 이상 터치 영역은 손바닥으로 판단
      pressureThreshold: 0.1, // 0.1 이상의 압력값 필요
      sensitivity: 'medium',
      ...config
    };
  }

  // 설정 업데이트
  updateConfig(newConfig: Partial<PalmRejectionConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // 포인터 입력 검사 (메인 함수)
  checkPointerInput(
    event: PointerEvent | React.PointerEvent,
    existingTouches?: TouchList
  ): PalmRejectionStatus {
    console.log('🔍 PalmRejectionManager.checkPointerInput 실행:', {
      pointerType: event.pointerType,
      pressure: event.pressure,
      penOnlyMode: this.config.penOnlyMode,
      sensitivity: this.config.sensitivity
    });

    const inputType = this.getInputType(event);
    
    // 펜만 허용 모드가 꺼져있으면 모든 입력 허용
    if (!this.config.penOnlyMode) {
      const status = {
        isAllowed: true,
        reason: '모든 입력 허용 모드',
        inputType,
        pressure: event.pressure
      };
      console.log('🔍 PalmRejectionManager 결과 (모든 입력 허용):', status);
      return status;
    }

    // 멀티터치 감지 및 차단
    const multiTouchCheck = this.checkMultiTouch(existingTouches);
    if (!multiTouchCheck.isAllowed) {
      return multiTouchCheck;
    }

    // 이미 다른 펜이 그리고 있는지 확인
    if (this.activePenPointers.size > 0 && !this.activePenPointers.has(event.pointerId)) {
      return {
        isAllowed: false,
        reason: '다른 펜이 이미 사용 중',
        inputType,
        pressure: event.pressure
      };
    }

    // 펜 입력인지 확인
    const penCheck = this.checkPenInput(event);
    if (!penCheck.isAllowed) {
      return penCheck;
    }

    // 모든 검사 통과
    const status = {
      isAllowed: true,
      reason: `펜 입력 허용 (압력: ${event.pressure?.toFixed(2) || 'N/A'})`,
      inputType,
      pressure: event.pressure
    };
    console.log('🔍 PalmRejectionManager 결과 (모든 검사 통과):', status);
    return status;
  }

  // 터치 입력 검사 (TouchEvent용)
  checkTouchInput(event: TouchEvent): PalmRejectionStatus {
    // 멀티터치 감지
    if (event.touches.length > this.config.multiTouchThreshold) {
      return {
        isAllowed: false,
        reason: `멀티터치 감지됨 (${event.touches.length}개)`,
        inputType: 'touch'
      };
    }

    // 터치 크기 검사 (손바닥 감지)
    const touch = event.touches[0];
    if (touch) {
      const touchSize = Math.max(touch.radiusX || 0, touch.radiusY || 0);
      if (touchSize > this.config.palmSizeThreshold) {
        return {
          isAllowed: false,
          reason: `큰 터치 영역 감지됨 (${touchSize.toFixed(1)}px) - 손바닥으로 판단`,
          inputType: 'touch',
          touchSize
        };
      }
    }

    // 펜만 허용 모드에서는 터치 차단
    if (this.config.penOnlyMode) {
      return {
        isAllowed: false,
        reason: '펜만 허용 모드 - 터치 입력 차단',
        inputType: 'touch'
      };
    }

    return {
      isAllowed: true,
      reason: '터치 입력 허용',
      inputType: 'touch'
    };
  }

  // 활성 포인터 관리
  addActivePointer(pointerId: number) {
    this.activePenPointers.add(pointerId);
  }

  removeActivePointer(pointerId: number) {
    this.activePenPointers.delete(pointerId);
  }

  clearActivePointers() {
    this.activePenPointers.clear();
  }

  getActivePointerCount(): number {
    return this.activePenPointers.size;
  }

  // 입력 타입 감지
  private getInputType(event: PointerEvent | React.PointerEvent): 'pen' | 'touch' | 'mouse' | 'unknown' {
    if (event.pointerType === 'pen') return 'pen';
    if (event.pointerType === 'touch') return 'touch';
    if (event.pointerType === 'mouse') return 'mouse';
    return 'unknown';
  }

  // 멀티터치 검사
  private checkMultiTouch(existingTouches?: TouchList): PalmRejectionStatus {
    if (existingTouches && existingTouches.length > this.config.multiTouchThreshold) {
      return {
        isAllowed: false,
        reason: `멀티터치 감지됨 (${existingTouches.length}개)`,
        inputType: 'touch'
      };
    }
    return { isAllowed: true, reason: '멀티터치 검사 통과', inputType: 'unknown' };
  }

  // 펜 입력 검사
  private checkPenInput(event: PointerEvent | React.PointerEvent): PalmRejectionStatus {
    const inputType = this.getInputType(event);
    
    // pointerType이 'pen'이면 확실한 펜 입력
    if (event.pointerType === 'pen') {
      return {
        isAllowed: true,
        reason: 'Stylus pen 감지됨',
        inputType: 'pen',
        pressure: event.pressure
      };
    }

    // 압력값으로 펜 입력 추정
    if (event.pressure && event.pressure > this.config.pressureThreshold && event.pressure < 1) {
      return {
        isAllowed: true,
        reason: `압력 감지로 펜 입력 추정 (${event.pressure.toFixed(2)})`,
        inputType: inputType,
        pressure: event.pressure
      };
    }

    // 민감도에 따른 추가 검사
    if (this.config.sensitivity === 'low') {
      // 낮은 민감도: 마우스도 허용
      if (event.pointerType === 'mouse') {
        return {
          isAllowed: true,
          reason: '마우스 입력 허용 (낮은 민감도)',
          inputType: 'mouse',
          pressure: event.pressure
        };
      }
    }

    // 펜 입력이 아닌 경우
    return {
      isAllowed: false,
      reason: `펜 입력이 아님 (${event.pointerType || 'unknown'}, 압력: ${event.pressure?.toFixed(2) || 'N/A'})`,
      inputType: inputType,
      pressure: event.pressure
    };
  }

  // 감도별 설정 프리셋
  static getSensitivityPreset(sensitivity: 'low' | 'medium' | 'high'): Partial<PalmRejectionConfig> {
    switch (sensitivity) {
      case 'low':
        return {
          penOnlyMode: false,
          multiTouchThreshold: 2,
          palmSizeThreshold: 30,
          pressureThreshold: 0.05
        };
      case 'medium':
        return {
          penOnlyMode: true,
          multiTouchThreshold: 1,
          palmSizeThreshold: 20,
          pressureThreshold: 0.1
        };
      case 'high':
        return {
          penOnlyMode: true,
          multiTouchThreshold: 0,
          palmSizeThreshold: 15,
          pressureThreshold: 0.2
        };
      default:
        return {};
    }
  }
}

// React Hook으로 사용할 수 있는 팩토리 함수
export const createPalmRejectionManager = (config?: Partial<PalmRejectionConfig>) => {
  return new PalmRejectionManager(config);
};

// 이벤트 방지 유틸리티 함수들
export const preventTouchEvents = {
  touchstart: (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  touchmove: (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  touchend: (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  touchcancel: (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  wheel: (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  contextmenu: (e: Event) => {
    e.preventDefault();
    return false;
  },
  dragstart: (e: DragEvent) => {
    e.preventDefault();
    return false;
  }
};
