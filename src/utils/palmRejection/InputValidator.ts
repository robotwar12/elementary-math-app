// 입력 검증 관리자
// 펜/터치 입력 검증, 멀티터치 감지, 손바닥 감지 등의 로직을 담당

import { PalmRejectionConfig } from './ConfigManager';

export interface PalmRejectionStatus {
  isAllowed: boolean;
  reason: string;
  inputType: 'pen' | 'touch' | 'mouse' | 'unknown';
  pressure?: number;
  touchSize?: number;
}

export class InputValidator {
  constructor(private config: PalmRejectionConfig) {}

  // 설정 업데이트
  updateConfig(config: PalmRejectionConfig): void {
    this.config = config;
  }

  // 입력 타입 감지
  getInputType(event: PointerEvent | React.PointerEvent): 'pen' | 'touch' | 'mouse' | 'unknown' {
    if (event.pointerType === 'pen') return 'pen';
    if (event.pointerType === 'touch') return 'touch';
    if (event.pointerType === 'mouse') return 'mouse';
    return 'unknown';
  }

  // 멀티터치 검사
  checkMultiTouch(existingTouches?: TouchList): PalmRejectionStatus {
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
  checkPenInput(event: PointerEvent | React.PointerEvent): PalmRejectionStatus {
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

    // 펜 입력이 아닌 경우 차단
    return {
      isAllowed: false,
      reason: `Palm Rejection: 펜 입력이 아님 (${event.pointerType || 'unknown'}, 압력: ${event.pressure?.toFixed(2) || 'N/A'})`,
      inputType: inputType,
      pressure: event.pressure
    };
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

  // 메인 포인터 입력 검증 로직
  validatePointerInput(
    event: PointerEvent | React.PointerEvent,
    existingTouches?: TouchList,
    isOtherPenActive?: boolean
  ): PalmRejectionStatus {
    const inputType = this.getInputType(event);
    
    // 펜만 허용 모드가 꺼져있으면 모든 입력 허용
    if (!this.config.penOnlyMode) {
      return {
        isAllowed: true,
        reason: '모든 입력 허용 모드',
        inputType,
        pressure: event.pressure
      };
    }

    // 멀티터치 감지 및 차단
    const multiTouchCheck = this.checkMultiTouch(existingTouches);
    if (!multiTouchCheck.isAllowed) {
      return multiTouchCheck;
    }

    // 이미 다른 펜이 그리고 있는지 확인
    if (isOtherPenActive) {
      return {
        isAllowed: false,
        reason: '다른 펜이 이미 사용 중',
        inputType,
        pressure: event.pressure
      };
    }

    // 펜 입력인지 확인
    return this.checkPenInput(event);
  }
}