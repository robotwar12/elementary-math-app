/**
 * Stroke-based Digit Recognizer 래퍼
 * stroke-digit-recognizer.js 라이브러리를 TypeScript로 감싸는 래퍼 클래스
 */

export interface RecognitionResult {
  digits: string;
  confidence: number;
  processingTime: number;
  digitCount: number;
  success: boolean;
  error?: string;
}

export class StrokeDigitRecognizerWrapper {
  private recognizer: any = null;
  private isInitialized = false;
  private onRecognitionComplete?: (result: RecognitionResult) => void;

  /**
   * 인식기 초기화
   */
  async initializeRecognizer(canvas: HTMLCanvasElement, onRecognitionComplete?: (result: RecognitionResult) => void): Promise<void> {
    try {
      // StrokeDigitRecognizer가 로드될 때까지 대기
      await this.waitForLibrary();

      console.log('🚀 StrokeDigitRecognizer 초기화 시작...');

      // 콜백 함수 저장
      this.onRecognitionComplete = onRecognitionComplete;

      this.recognizer = new (window as any).StrokeDigitRecognizer({
        canvas: canvas,
        modelPath: '/models/digit_recognition_v2.onnx',
        debug: true,
        autoRecognitionDelay: 500,
        segmentation: {
          proximityThreshold: 5,         // 8 → 5: 매우 엄격한 분할
          connectivityThreshold: 0.2,    // 0.3 → 0.2: 매우 쉬운 분할
          maxStrokesPerDigit: 1,         // 2 → 1: 1개 스트로크만 허용
          minStrokeLength: 8,            // 기본값 유지
          aspectRatioRange: [0.5, 2.5]   // 기본값 유지
        },
        onRecognitionComplete: (result: any) => {
          console.log('🎯 인식 완료:', result);
          
          // ProblemCard 콜백 호출
          if (this.onRecognitionComplete) {
            const recognitionResult: RecognitionResult = {
              digits: result.digits || '',
              confidence: result.confidence || 0,
              processingTime: result.processingTime || 0,
              digitCount: result.digitCount || 0,
              success: result.success !== false && !!result.digits,
              error: result.error
            };
            
            console.log(`📞 [${new Date().toLocaleTimeString()}] ProblemCard 콜백 호출:`, recognitionResult);
            this.onRecognitionComplete(recognitionResult);
          }
        },
        onDebugLog: (section: string, message: string, type: string) => {
          if (type === 'error') {
            console.error(`[${section}] ${message}`);
          } else if (type === 'warning') {
            console.warn(`[${section}] ${message}`);
          } else if (type === 'highlight') {
            console.log(`🔥 [${section}] ${message}`);
          } else {
            console.log(`[${section}] ${message}`);
          }
        }
      });

      this.isInitialized = true;
      console.log('✅ StrokeDigitRecognizer 초기화 완료');

    } catch (error) {
      console.error('❌ StrokeDigitRecognizer 초기화 실패:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * 라이브러리 로드 대기
   */
  private async waitForLibrary(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5초 대기

      const checkLibrary = () => {
        attempts++;

        if (typeof (window as any).StrokeDigitRecognizer !== 'undefined' && 
            typeof (window as any).onnx !== 'undefined') {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('StrokeDigitRecognizer 또는 ONNX.js 라이브러리를 로드할 수 없습니다'));
        } else {
          setTimeout(checkLibrary, 100);
        }
      };

      checkLibrary();
    });
  }

  /**
   * 숫자 인식 실행
   */
  async recognizeDigits(): Promise<RecognitionResult> {
    if (!this.isInitialized || !this.recognizer) {
      throw new Error('인식기가 초기화되지 않았습니다');
    }

    try {
      console.log('🔍 숫자 인식 시작...');
      const result = await this.recognizer.recognizeDigits();
      
      if (!result) {
        return {
          digits: '',
          confidence: 0,
          processingTime: 0,
          digitCount: 0,
          success: false,
          error: '인식할 스트로크가 없습니다'
        };
      }

      return {
        digits: result.digits || '',
        confidence: result.confidence || 0,
        processingTime: result.processingTime || 0,
        digitCount: result.digitCount || 0,
        success: result.success || false,
        error: result.error
      };

    } catch (error) {
      console.error('❌ 숫자 인식 실패:', error);
      return {
        digits: '',
        confidence: 0,
        processingTime: 0,
        digitCount: 0,
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 캔버스 지우기
   */
  clearCanvas(): void {
    if (this.recognizer) {
      this.recognizer.clearCanvas();
      console.log('🧹 캔버스 초기화 완료');
    }
  }

  /**
   * 인식기 상태 확인
   */
  isReady(): boolean {
    return this.isInitialized && this.recognizer && this.recognizer.isReady();
  }

  /**
   * 현재 스트로크 수 반환
   */
  getStrokeCount(): number {
    return this.recognizer ? this.recognizer.getStrokeCount() : 0;
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    if (this.recognizer) {
      this.recognizer.destroy();
      this.recognizer = null;
    }
    this.isInitialized = false;
    console.log('🗑️ StrokeDigitRecognizer 정리 완료');
  }
}
