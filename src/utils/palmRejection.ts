// Palm Rejection 유틸리티 - 리팩토링된 간소화 버전
// 복잡한 로직들을 각각의 전문 클래스로 분리하여 관리

import { ConfigManager, PalmRejectionConfig } from './palmRejection/ConfigManager';
import { PointerTracker } from './palmRejection/PointerTracker';
import { InputValidator, PalmRejectionStatus } from './palmRejection/InputValidator';
import { preventTouchEvents } from './palmRejection/eventPreventUtils';

// 메인 Palm Rejection 관리자 클래스
export class PalmRejectionManager {
  private configManager: ConfigManager;
  private pointerTracker: PointerTracker;
  private inputValidator: InputValidator;

  constructor(config: Partial<PalmRejectionConfig> = {}) {
    this.configManager = new ConfigManager(config);
    this.pointerTracker = new PointerTracker();
    this.inputValidator = new InputValidator(this.configManager.getConfig());
  }

  // 설정 업데이트
  updateConfig(newConfig: Partial<PalmRejectionConfig>) {
    this.configManager.updateConfig(newConfig);
    this.inputValidator.updateConfig(this.configManager.getConfig());
  }

  // 포인터 입력 검사 (메인 함수)
  checkPointerInput(
    event: PointerEvent | React.PointerEvent,
    existingTouches?: TouchList
  ): PalmRejectionStatus {
    const isOtherPenActive = this.pointerTracker.isOtherPenActive(event.pointerId);

    return this.inputValidator.validatePointerInput(event, existingTouches, isOtherPenActive);
  }

  // 터치 입력 검사 (TouchEvent용)
  checkTouchInput(event: TouchEvent): PalmRejectionStatus {
    return this.inputValidator.checkTouchInput(event);
  }

  // 활성 포인터 관리 메서드들
  addActivePointer(pointerId: number) {
    this.pointerTracker.addActivePointer(pointerId);
  }

  removeActivePointer(pointerId: number) {
    this.pointerTracker.removeActivePointer(pointerId);
  }

  clearActivePointers() {
    this.pointerTracker.clearActivePointers();
  }

  getActivePointerCount(): number {
    return this.pointerTracker.getActivePointerCount();
  }

  // 감도별 설정 프리셋 (정적 메서드)
  static getSensitivityPreset(sensitivity: 'low' | 'medium' | 'high'): Partial<PalmRejectionConfig> {
    return ConfigManager.getSensitivityPreset(sensitivity);
  }

  // 현재 설정 조회
  getConfig(): PalmRejectionConfig {
    return this.configManager.getConfig();
  }
}

// React Hook으로 사용할 수 있는 팩토리 함수
export const createPalmRejectionManager = (config?: Partial<PalmRejectionConfig>) => {
  return new PalmRejectionManager(config);
};

// 하위 모듈들의 타입과 유틸리티 re-export
export type { PalmRejectionConfig, PalmRejectionStatus };
export { preventTouchEvents };
