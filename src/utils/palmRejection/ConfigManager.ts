// Palm Rejection 설정 관리자
// 설정 초기화, 업데이트, 감도별 프리셋 관리를 담당

export interface PalmRejectionConfig {
  penOnlyMode: boolean;
  multiTouchThreshold: number;
  palmSizeThreshold: number;
  pressureThreshold: number;
  sensitivity: 'low' | 'medium' | 'high';
}

export class ConfigManager {
  private config: PalmRejectionConfig;

  constructor(initialConfig: Partial<PalmRejectionConfig> = {}) {
    this.config = this.createDefaultConfig(initialConfig);
  }

  // 기본 설정 생성
  private createDefaultConfig(userConfig: Partial<PalmRejectionConfig>): PalmRejectionConfig {
    return {
      penOnlyMode: true,
      multiTouchThreshold: 1, // 1개 이상의 터치는 차단
      palmSizeThreshold: 20,  // 20px 이상 터치 영역은 손바닥으로 판단
      pressureThreshold: 0.1, // 0.1 이상의 압력값 필요
      sensitivity: 'medium',
      ...userConfig
    };
  }

  // 현재 설정 반환
  getConfig(): PalmRejectionConfig {
    return { ...this.config };
  }

  // 설정 업데이트
  updateConfig(newConfig: Partial<PalmRejectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // 개별 설정값 조회
  isPenOnlyMode(): boolean {
    return this.config.penOnlyMode;
  }

  getMultiTouchThreshold(): number {
    return this.config.multiTouchThreshold;
  }

  getPalmSizeThreshold(): number {
    return this.config.palmSizeThreshold;
  }

  getPressureThreshold(): number {
    return this.config.pressureThreshold;
  }

  getSensitivity(): 'low' | 'medium' | 'high' {
    return this.config.sensitivity;
  }

  // 감도별 설정 프리셋 적용
  applySensitivityPreset(sensitivity: 'low' | 'medium' | 'high'): void {
    const preset = ConfigManager.getSensitivityPreset(sensitivity);
    this.updateConfig(preset);
  }

  // 감도별 설정 프리셋 (정적 메서드)
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

  // 설정을 문자열로 출력 (디버깅용)
  toString(): string {
    return JSON.stringify(this.config, null, 2);
  }
}